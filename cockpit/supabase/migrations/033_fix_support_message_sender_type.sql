-- Migration 033: Fix support message sender type detection
-- Create two separate functions: one for user messages, one for admin messages

-- Drop the auto-detect function
DROP FUNCTION IF EXISTS create_support_message(UUID, TEXT, JSONB);

-- Function 1: Create USER message (called from cockpit)
-- Always sets sender_type='user' regardless of user role
CREATE OR REPLACE FUNCTION create_user_support_message(
  p_ticket_id UUID,
  p_message TEXT,
  p_attachments JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO support_messages (
    ticket_id,
    sender_id,
    sender_type,
    message,
    attachments
  )
  VALUES (
    p_ticket_id,
    auth.uid(),
    'user'::message_sender_type,
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
    'created_at', created_at::text,
    'read_at', read_at::text
  );
$$;

-- Function 2: Create ADMIN message (called from backoffice)
-- Verifies user is admin, then sets sender_type='admin'
CREATE OR REPLACE FUNCTION create_admin_support_message(
  p_ticket_id UUID,
  p_message TEXT,
  p_attachments JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO support_messages (
    ticket_id,
    sender_id,
    sender_type,
    message,
    attachments
  )
  SELECT
    p_ticket_id,
    auth.uid(),
    'admin'::message_sender_type,
    p_message,
    p_attachments
  WHERE EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
  RETURNING jsonb_build_object(
    'id', id::text,
    'ticket_id', ticket_id::text,
    'sender_id', sender_id::text,
    'sender_type', sender_type::text,
    'message', message,
    'attachments', attachments,
    'created_at', created_at::text,
    'read_at', read_at::text
  );
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_user_support_message(UUID, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION create_admin_support_message(UUID, TEXT, JSONB) TO authenticated;

-- Comments
COMMENT ON FUNCTION create_user_support_message IS 'Create a user message in a support ticket (always sender_type=user)';
COMMENT ON FUNCTION create_admin_support_message IS 'Create an admin reply in a support ticket (verifies admin role, sender_type=admin)';
