/**
 * Edge Function: Notify Support Ticket
 * Appelée automatiquement via Database Webhook quand un nouveau ticket est créé
 * Notifie n8n pour traitement par les agents IA
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const N8N_WEBHOOK_URL = Deno.env.get('N8N_SUPPORT_WEBHOOK_URL')!; // À configurer

interface SupportTicket {
  id: string;
  ticket_number: string;
  user_id: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  screenshot_url?: string;
  created_at: string;
}

serve(async (req) => {
  try {
    // Parse webhook payload from Supabase
    const payload = await req.json();
    console.log('📨 Received webhook:', payload.type);

    // Vérifier que c'est bien une insertion de ticket
    if (payload.type !== 'INSERT' || payload.table !== 'support_tickets') {
      return new Response(
        JSON.stringify({ message: 'Not a ticket insertion, ignoring' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const ticket: SupportTicket = payload.record;

    console.log(`🎫 New ticket #${ticket.ticket_number}: ${ticket.subject}`);

    // Enrichir avec les données utilisateur
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', ticket.user_id)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
    }

    // Construire le payload pour n8n (format compatible avec le PM)
    const n8nPayload = {
      event_type: 'support_ticket_created',
      ticket: {
        id: ticket.id,
        ticket_number: ticket.ticket_number,
        subject: ticket.subject,
        description: ticket.description,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        screenshot_url: ticket.screenshot_url,
        created_at: ticket.created_at,
      },
      user: {
        id: ticket.user_id,
        email: userData?.email || 'unknown',
        name: userData?.full_name || 'Unknown User',
      },
      // Intent suggéré pour le router
      suggested_intent: categor yToIntent(ticket.category),
      // Context pour les agents
      context: {
        source: 'support_ticket',
        requires_response: true,
        sla_target_hours: priorityToSLAHours(ticket.priority),
      },
    };

    // Envoyer à n8n
    console.log('🚀 Sending to n8n webhook:', N8N_WEBHOOK_URL);

    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(n8nPayload),
    });

    if (!n8nResponse.ok) {
      throw new Error(`n8n webhook failed: ${n8nResponse.status} ${await n8nResponse.text()}`);
    }

    const n8nResult = await n8nResponse.json();
    console.log('✅ n8n response:', n8nResult);

    // Optionnel : Marquer le ticket comme "en traitement"
    await supabase
      .from('support_tickets')
      .update({
        status: 'in_progress',
        // Optionnel : stocker l'ID de la tâche n8n
      })
      .eq('id', ticket.id);

    return new Response(
      JSON.stringify({
        success: true,
        ticket_id: ticket.id,
        n8n_response: n8nResult,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error processing ticket notification:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Map ticket category to agent intent
 */
function categoryToIntent(category: string): string {
  const mapping: Record<string, string> = {
    bug: 'investigate_bug',
    feature_request: 'analyze_feature_request',
    question: 'answer_question',
    billing: 'handle_billing',
    integration: 'setup_integration',
    performance: 'optimize_performance',
    security: 'security_audit',
    other: 'general_support',
  };

  return mapping[category] || 'general_support';
}

/**
 * Map priority to SLA hours
 */
function priorityToSLAHours(priority: string): number {
  const mapping: Record<string, number> = {
    critical: 4,
    high: 24,
    medium: 48,
    low: 72,
  };

  return mapping[priority] || 48;
}
