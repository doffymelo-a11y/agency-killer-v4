-- Migration 034: Telegram admin message RPC
-- Create RPC function for Telegram bot to create admin messages
-- Uses SECURITY DEFINER to bypass auth.users permission issues

CREATE OR REPLACE FUNCTION telegram_create_admin_message(
  p_ticket_id UUID,
  p_sender_id UUID,
  p_message TEXT,
  p_attachments JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  INSERT INTO support_messages (
    ticket_id,
    sender_id,
    sender_type,
    message,
    attachments
  )
  VALUES (
    p_ticket_id,
    p_sender_id,
    'admin'::message_sender_type,
    p_message,
    p_attachments
  )
  RETURNING jsonb_build_object(
    'id', id::text,
    'ticket_id', ticket_id::text,
    'sender_id', sender_id::text,
    'sender_type', sender_type::text,
    'message', message,
    'attachments', attachments,
    'created_at', created_at::text
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Grant execute permissions to service_role (for backend) and authenticated (for security)
GRANT EXECUTE ON FUNCTION telegram_create_admin_message(UUID, UUID, TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION telegram_create_admin_message(UUID, UUID, TEXT, JSONB) TO authenticated;

-- Add comment
COMMENT ON FUNCTION telegram_create_admin_message IS 'Create admin message from Telegram bot - bypasses auth.uid() requirement with SECURITY DEFINER';
