-- ═══════════════════════════════════════════════════════════════
-- Support Ticket Webhook - Notify n8n on ticket creation
-- Migration 027
-- ═══════════════════════════════════════════════════════════════

-- Create a function that calls the Edge Function via http
CREATE OR REPLACE FUNCTION notify_support_ticket_created()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT;
  payload JSONB;
BEGIN
  -- Get the webhook URL from environment (configure in Supabase Dashboard)
  -- For now, use a placeholder - you'll set this in Dashboard → Database → Webhooks
  webhook_url := current_setting('app.settings.support_webhook_url', TRUE);

  -- If no webhook URL is configured, skip notification
  IF webhook_url IS NULL OR webhook_url = '' THEN
    RAISE NOTICE 'No support webhook URL configured, skipping notification for ticket %', NEW.id;
    RETURN NEW;
  END IF;

  -- Build the payload
  payload := jsonb_build_object(
    'type', 'INSERT',
    'table', 'support_tickets',
    'record', row_to_json(NEW)::jsonb,
    'old_record', NULL
  );

  -- Call the Edge Function via pg_net extension
  -- Note: pg_net must be enabled in Supabase Dashboard → Database → Extensions
  PERFORM
    net.http_post(
      url := webhook_url,
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := payload::jsonb
    );

  RAISE NOTICE 'Webhook notification sent for ticket %', NEW.id;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the ticket creation
    RAISE WARNING 'Failed to send webhook notification for ticket %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to fire on ticket creation
DROP TRIGGER IF EXISTS trigger_notify_support_ticket_created ON support_tickets;

CREATE TRIGGER trigger_notify_support_ticket_created
  AFTER INSERT ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION notify_support_ticket_created();

-- ─────────────────────────────────────────────────────────────────
-- Comments
-- ─────────────────────────────────────────────────────────────────

COMMENT ON FUNCTION notify_support_ticket_created() IS
'Trigger function: Sends webhook notification to Edge Function when a new support ticket is created. Requires app.settings.support_webhook_url to be configured.';

COMMENT ON TRIGGER trigger_notify_support_ticket_created ON support_tickets IS
'Fires webhook notification to n8n/Edge Function on ticket creation for AI agent processing';

-- ─────────────────────────────────────────────────────────────────
-- Setup Instructions (add to README)
-- ─────────────────────────────────────────────────────────────────

/*
SETUP INSTRUCTIONS:

1. Enable pg_net extension in Supabase Dashboard:
   Dashboard → Database → Extensions → Enable "pg_net"

2. Deploy the Edge Function:
   cd supabase/functions
   supabase functions deploy notify-support-ticket

3. Configure webhook URL in Supabase:
   Dashboard → Database → Custom Settings → Add:
   app.settings.support_webhook_url = https://your-project.supabase.co/functions/v1/notify-support-ticket

   OR set it via SQL:
   ALTER DATABASE postgres SET app.settings.support_webhook_url TO 'https://your-project.supabase.co/functions/v1/notify-support-ticket';

4. Configure n8n webhook URL as environment variable in Edge Function:
   Dashboard → Edge Functions → notify-support-ticket → Secrets:
   N8N_SUPPORT_WEBHOOK_URL = https://your-n8n-instance.com/webhook/support-tickets

5. Test by creating a ticket in the UI - check Edge Function logs

ALTERNATIVE: Database Webhooks (easier setup)

Instead of using pg_net, you can use Supabase Database Webhooks:

1. Dashboard → Database → Webhooks → Create Webhook
2. Table: support_tickets
3. Events: INSERT
4. Type: HTTP Request
5. Method: POST
6. URL: https://your-project.supabase.co/functions/v1/notify-support-ticket
7. HTTP Headers: {"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}

This approach is simpler and doesn't require pg_net extension.
*/
