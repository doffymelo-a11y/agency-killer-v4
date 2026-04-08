/**
 * Edge Function: check-sla-breaches
 *
 * Runs hourly via Supabase Cron to:
 * 1. Find tickets without first response that are overdue
 * 2. Mark them as SLA breached
 * 3. Send alert emails to admins
 *
 * Configure in Supabase Dashboard:
 * Cron schedule: "0 * * * *" (every hour at minute 0)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

interface TicketAtRisk {
  ticket_id: string;
  subject: string;
  priority: string;
  created_at: string;
  hours_since_creation: number;
  target_hours: number;
  hours_remaining: number;
  user_email: string;
}

interface SLACheckResult {
  tickets_checked: number;
  tickets_breached: number;
  alerts_sent: number;
  errors: string[];
}

// ─────────────────────────────────────────────────────────────────
// Main Handler
// ─────────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create Supabase client with service role key (bypass RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[SLA Check] Starting SLA breach check...');

    // Get tickets at risk of SLA breach
    const { data: ticketsAtRisk, error: riskError } = await supabase
      .rpc('get_tickets_at_risk');

    if (riskError) {
      console.error('[SLA Check] Error fetching tickets at risk:', riskError);
      throw riskError;
    }

    const result: SLACheckResult = {
      tickets_checked: ticketsAtRisk?.length || 0,
      tickets_breached: 0,
      alerts_sent: 0,
      errors: [],
    };

    console.log(`[SLA Check] Found ${result.tickets_checked} tickets at risk`);

    // Process each ticket at risk
    for (const ticket of (ticketsAtRisk as TicketAtRisk[]) || []) {
      // Check if ticket has breached SLA (hours_remaining < 0)
      if (ticket.hours_remaining < 0) {
        console.log(`[SLA Check] Ticket ${ticket.ticket_id} has breached SLA`);

        try {
          // Mark ticket as SLA breached
          const targetHours = getTargetHours(ticket.priority);
          const breachReason = `No response within ${targetHours}h (${ticket.priority} priority)`;

          const { error: updateError } = await supabase
            .from('support_tickets')
            .update({
              sla_breached: true,
              sla_breach_reason: breachReason,
            })
            .eq('id', ticket.ticket_id);

          if (updateError) {
            console.error(`[SLA Check] Error updating ticket ${ticket.ticket_id}:`, updateError);
            result.errors.push(`Update failed for ${ticket.ticket_id}: ${updateError.message}`);
            continue;
          }

          result.tickets_breached++;

          // Queue alert email to admins
          try {
            await queueAlertEmail(supabase, ticket, breachReason);
            result.alerts_sent++;
          } catch (emailError: any) {
            console.error(`[SLA Check] Error queuing email for ${ticket.ticket_id}:`, emailError);
            result.errors.push(`Email queue failed for ${ticket.ticket_id}: ${emailError.message}`);
          }
        } catch (err: any) {
          console.error(`[SLA Check] Error processing ticket ${ticket.ticket_id}:`, err);
          result.errors.push(`Processing failed for ${ticket.ticket_id}: ${err.message}`);
        }
      }
    }

    // Refresh SLA dashboard materialized view
    try {
      await supabase.rpc('refresh_sla_dashboard');
      console.log('[SLA Check] Refreshed SLA dashboard');
    } catch (refreshError: any) {
      console.error('[SLA Check] Error refreshing dashboard:', refreshError);
      result.errors.push(`Dashboard refresh failed: ${refreshError.message}`);
    }

    console.log('[SLA Check] Completed:', result);

    return new Response(JSON.stringify({
      success: true,
      result,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[SLA Check] Fatal error:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

// ─────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────

function getTargetHours(priority: string): number {
  switch (priority) {
    case 'critical':
      return 4;
    case 'high':
      return 24;
    case 'medium':
      return 48;
    default:
      return 72;
  }
}

async function queueAlertEmail(
  supabase: any,
  ticket: TicketAtRisk,
  breachReason: string
): Promise<void> {
  // Get all admin emails
  const { data: admins, error: adminError } = await supabase
    .from('user_roles')
    .select('user_id, auth.users!inner(email)')
    .in('role', ['admin', 'super_admin']);

  if (adminError) {
    console.error('[SLA Check] Error fetching admins:', adminError);
    throw adminError;
  }

  if (!admins || admins.length === 0) {
    console.warn('[SLA Check] No admins found to send alert');
    return;
  }

  // Queue email for each admin
  for (const admin of admins) {
    const adminEmail = admin['auth.users'].email;

    const { error: emailError } = await supabase
      .from('email_logs')
      .insert({
        ticket_id: ticket.ticket_id,
        user_id: admin.user_id,
        recipient_email: adminEmail,
        email_type: 'sla_breach_alert',
        status: 'pending',
      });

    if (emailError) {
      console.error(`[SLA Check] Error queuing email for ${adminEmail}:`, emailError);
    } else {
      console.log(`[SLA Check] Queued alert email for ${adminEmail}`);
    }
  }
}

/**
 * Configure this function to run hourly via Supabase Cron:
 *
 * 1. Go to Supabase Dashboard > Edge Functions
 * 2. Deploy this function
 * 3. Go to Database > Cron Jobs (pg_cron extension)
 * 4. Create new cron job:
 *    - Schedule: 0 * * * * (every hour)
 *    - Command: SELECT net.http_post(
 *                 url := 'https://YOUR_PROJECT.supabase.co/functions/v1/check-sla-breaches',
 *                 headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
 *               );
 *
 * Alternative: Use Supabase CLI to deploy with cron config
 */
