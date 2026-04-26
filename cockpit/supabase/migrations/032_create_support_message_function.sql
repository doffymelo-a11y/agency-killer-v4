-- Migration 032: Create universal RPC function for creating support messages
-- This works for both regular users and admins, bypassing RLS issues

-- Drop the admin-only function created before
DROP FUNCTION IF EXISTS create_admin_message(UUID, UUID, TEXT, JSONB);

-- Create universal function for creating support messages
CREATE OR REPLACE FUNCTION create_support_message(
  p_ticket_id UUID,
  p_message TEXT,
  p_attachments JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $
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
    CASE
      WHEN EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'super_admin')
      ) THEN 'admin'
      ELSE 'user'
    END,
    p_message,
    p_attachments
  )
  RETURNING jsonb_build_object(
    'id', id::text,
    'ticket_id', ticket_id::text,
    'sender_id', sender_id::text,
    'sender_type', sender_type,
    'message', message,
    'attachments', attachments,
    'created_at', created_at::text,
    'read_at', read_at::text
  );
$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_support_message(UUID, TEXT, JSONB) TO authenticated;

-- Comment
COMMENT ON FUNCTION create_support_message IS 'Create a support message (works for both users and admins). Automatically determines sender_type based on user role.';
