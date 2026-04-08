// ═══════════════════════════════════════════════════════════════
// THE HIVE OS V4 - Support Email Sender
// Sends email notifications for support tickets via SendGrid
// ═══════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');
const SENDGRID_FROM_EMAIL = Deno.env.get('SENDGRID_FROM_EMAIL') || 'support@hive-os.com';
const SENDGRID_FROM_NAME = Deno.env.get('SENDGRID_FROM_NAME') || 'Hive OS Support';
const APP_URL = Deno.env.get('APP_URL') || 'http://localhost:5176';

serve(async (req) => {
  try {
    // Parse request body
    const { email_log_id } = await req.json();

    if (!email_log_id) {
      return new Response(
        JSON.stringify({ error: 'Missing email_log_id' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!SENDGRID_API_KEY) {
      console.error('[Email] SENDGRID_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'SendGrid not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase Admin client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get email log details with related ticket and user data
    const { data: log, error: logError } = await supabase
      .from('email_logs')
      .select(`
        *,
        ticket:support_tickets(
          id,
          subject,
          description,
          status,
          priority,
          category,
          created_at,
          user:auth.users!user_id(email, raw_user_meta_data)
        )
      `)
      .eq('id', email_log_id)
      .single();

    if (logError || !log) {
      console.error('[Email] Error fetching email log:', logError);
      return new Response(
        JSON.stringify({ error: 'Email log not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build email based on type
    const { subject, html } = buildEmail(log);

    // Send via SendGrid
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: {
          email: SENDGRID_FROM_EMAIL,
          name: SENDGRID_FROM_NAME
        },
        personalizations: [{
          to: [{ email: log.recipient_email }],
          subject: subject
        }],
        content: [{
          type: 'text/html',
          value: html
        }]
      })
    });

    const success = response.ok;
    const errorMessage = success ? null : await response.text();

    // Update log status
    await supabase.from('email_logs').update({
      status: success ? 'sent' : 'failed',
      error_message: errorMessage,
      sent_at: success ? new Date().toISOString() : null
    }).eq('id', email_log_id);

    if (success) {
      console.log(`[Email] ✅ Sent ${log.email_type} to ${log.recipient_email}`);
    } else {
      console.error(`[Email] ❌ Failed to send: ${errorMessage}`);
    }

    return new Response(
      JSON.stringify({ success, error: errorMessage }),
      {
        status: success ? 200 : 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[Email] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

// ─────────────────────────────────────────────────────────────────
// Build Email Content
// ─────────────────────────────────────────────────────────────────

function buildEmail(log: any): { subject: string; html: string } {
  const ticket = log.ticket;
  const ticketNumber = formatTicketNumber(ticket.id, ticket.created_at);
  const ticketUrl = `${APP_URL}/support/${ticket.id}`;

  switch (log.email_type) {
    case 'message_received':
      return {
        subject: `Nouvelle réponse sur votre ticket #${ticketNumber}`,
        html: buildMessageReceivedEmail(ticket, ticketNumber, ticketUrl)
      };

    case 'status_changed':
      return {
        subject: `Mise à jour de votre ticket #${ticketNumber}`,
        html: buildStatusChangedEmail(ticket, ticketNumber, ticketUrl)
      };

    case 'ticket_resolved':
      return {
        subject: `Votre ticket #${ticketNumber} a été résolu`,
        html: buildTicketResolvedEmail(ticket, ticketNumber, ticketUrl)
      };

    case 'sla_breach_alert':
      return {
        subject: `🚨 SLA Breach Alert - Ticket #${ticketNumber}`,
        html: buildSLABreachEmail(ticket, ticketNumber, ticketUrl)
      };

    default:
      return {
        subject: `Notification - Ticket #${ticketNumber}`,
        html: buildGenericEmail(ticket, ticketNumber, ticketUrl)
      };
  }
}

// ─────────────────────────────────────────────────────────────────
// Email Templates
// ─────────────────────────────────────────────────────────────────

function buildMessageReceivedEmail(ticket: any, ticketNumber: string, ticketUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Hive OS Support</h1>
  </div>

  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
    <p style="font-size: 16px; margin-bottom: 20px;">Bonjour,</p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      Vous avez reçu une nouvelle réponse sur votre ticket de support :
    </p>

    <div style="background: white; padding: 20px; border-left: 4px solid #667eea; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0;"><strong>Ticket #${ticketNumber}</strong></p>
      <p style="margin: 0; color: #6b7280;">${ticket.subject}</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${ticketUrl}" style="display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Voir la réponse
      </a>
    </div>

    <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      Vous recevez cet email car vous avez créé un ticket de support sur Hive OS.<br>
      <a href="${APP_URL}/account/settings" style="color: #667eea; text-decoration: none;">Gérer vos préférences email</a>
    </p>
  </div>
</body>
</html>
  `;
}

function buildStatusChangedEmail(ticket: any, ticketNumber: string, ticketUrl: string): string {
  const statusConfig: Record<string, { label: string; color: string }> = {
    open: { label: 'Ouvert', color: '#3b82f6' },
    in_progress: { label: 'En cours', color: '#f59e0b' },
    waiting_user: { label: 'En attente', color: '#ef4444' },
    resolved: { label: 'Résolu', color: '#10b981' },
    closed: { label: 'Fermé', color: '#6b7280' }
  };

  const status = statusConfig[ticket.status] || { label: ticket.status, color: '#6b7280' };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Hive OS Support</h1>
  </div>

  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
    <p style="font-size: 16px; margin-bottom: 20px;">Bonjour,</p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      Le statut de votre ticket de support a été mis à jour :
    </p>

    <div style="background: white; padding: 20px; border-left: 4px solid ${status.color}; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0;"><strong>Ticket #${ticketNumber}</strong></p>
      <p style="margin: 0 0 15px 0; color: #6b7280;">${ticket.subject}</p>
      <p style="margin: 0;">
        <span style="display: inline-block; background: ${status.color}; color: white; padding: 4px 12px; border-radius: 4px; font-size: 14px; font-weight: 600;">
          ${status.label}
        </span>
      </p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${ticketUrl}" style="display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Voir le ticket
      </a>
    </div>

    <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      Vous recevez cet email car vous avez créé un ticket de support sur Hive OS.<br>
      <a href="${APP_URL}/account/settings" style="color: #667eea; text-decoration: none;">Gérer vos préférences email</a>
    </p>
  </div>
</body>
</html>
  `;
}

function buildTicketResolvedEmail(ticket: any, ticketNumber: string, ticketUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">✅ Ticket Résolu</h1>
  </div>

  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
    <p style="font-size: 16px; margin-bottom: 20px;">Bonjour,</p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      Bonne nouvelle ! Votre ticket de support a été résolu :
    </p>

    <div style="background: white; padding: 20px; border-left: 4px solid #10b981; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0;"><strong>Ticket #${ticketNumber}</strong></p>
      <p style="margin: 0; color: #6b7280;">${ticket.subject}</p>
    </div>

    <p style="font-size: 16px; margin: 20px 0;">
      Si votre problème n'est pas complètement résolu, vous pouvez rouvrir ce ticket en y répondant.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${ticketUrl}" style="display: inline-block; background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin-right: 10px;">
        Voir le ticket
      </a>
    </div>

    <div style="background: #eff6ff; padding: 20px; border-radius: 6px; margin: 30px 0; text-align: center;">
      <p style="margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">Votre avis compte !</p>
      <p style="margin: 0 0 15px 0; color: #6b7280;">Comment évalueriez-vous notre support ?</p>
      <a href="${ticketUrl}" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
        Donner mon avis
      </a>
    </div>

    <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      Vous recevez cet email car vous avez créé un ticket de support sur Hive OS.<br>
      <a href="${APP_URL}/account/settings" style="color: #667eea; text-decoration: none;">Gérer vos préférences email</a>
    </p>
  </div>
</body>
</html>
  `;
}

function buildSLABreachEmail(ticket: any, ticketNumber: string, ticketUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">🚨 SLA Breach Alert</h1>
  </div>

  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
    <p style="font-size: 16px; margin-bottom: 20px;"><strong>ADMIN ALERT</strong></p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      Un ticket a dépassé le SLA de première réponse :
    </p>

    <div style="background: white; padding: 20px; border-left: 4px solid #ef4444; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0;"><strong>Ticket #${ticketNumber}</strong></p>
      <p style="margin: 0 0 10px 0; color: #6b7280;">${ticket.subject}</p>
      <p style="margin: 0;">
        <span style="display: inline-block; background: #ef4444; color: white; padding: 4px 12px; border-radius: 4px; font-size: 14px; font-weight: 600;">
          Priority: ${ticket.priority}
        </span>
      </p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${ticketUrl}" style="display: inline-block; background: #ef4444; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Répondre maintenant
      </a>
    </div>
  </div>
</body>
</html>
  `;
}

function buildGenericEmail(ticket: any, ticketNumber: string, ticketUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Hive OS Support</h1>
  </div>

  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
    <p style="font-size: 16px; margin-bottom: 20px;">Bonjour,</p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      Mise à jour concernant votre ticket de support :
    </p>

    <div style="background: white; padding: 20px; border-left: 4px solid #667eea; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0;"><strong>Ticket #${ticketNumber}</strong></p>
      <p style="margin: 0; color: #6b7280;">${ticket.subject}</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${ticketUrl}" style="display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Voir le ticket
      </a>
    </div>

    <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      Vous recevez cet email car vous avez créé un ticket de support sur Hive OS.<br>
      <a href="${APP_URL}/account/settings" style="color: #667eea; text-decoration: none;">Gérer vos préférences email</a>
    </p>
  </div>
</body>
</html>
  `;
}

// ─────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────

function formatTicketNumber(ticketId: string, createdAt: string): string {
  const date = new Date(createdAt);
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const shortId = ticketId.slice(0, 8);
  return `${dateStr}-${shortId}`;
}
