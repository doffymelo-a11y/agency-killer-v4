-- ═══════════════════════════════════════════════════════════════
-- Migration 031: Fix Ticket Update Permissions
-- Create RPC function to update ticket status with proper permissions
-- ═══════════════════════════════════════════════════════════════

-- Function to update ticket status (bypasses RLS)
CREATE OR REPLACE FUNCTION update_ticket_status(
  p_ticket_id UUID,
  p_status TEXT,
  p_resolved_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Run with creator's permissions (bypasses RLS)
SET search_path = public
AS $$
DECLARE
  v_ticket JSONB;
  v_old_status TEXT;
BEGIN
  -- Get current status
  SELECT status INTO v_old_status
  FROM support_tickets
  WHERE id = p_ticket_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket not found: %', p_ticket_id;
  END IF;

  -- Update ticket
  UPDATE support_tickets
  SET
    status = p_status,
    resolved_at = CASE
      WHEN p_status = 'resolved' AND resolved_at IS NULL THEN COALESCE(p_resolved_at, NOW())
      WHEN p_status != 'resolved' THEN NULL
      ELSE resolved_at
    END,
    updated_at = NOW()
  WHERE id = p_ticket_id
  RETURNING jsonb_build_object(
    'id', id,
    'user_id', user_id,
    'subject', subject,
    'description', description,
    'status', status,
    'priority', priority,
    'category', category,
    'created_at', created_at,
    'updated_at', updated_at,
    'resolved_at', resolved_at
  ) INTO v_ticket;

  -- Return updated ticket with old status
  RETURN jsonb_build_object(
    'ticket', v_ticket,
    'old_status', v_old_status,
    'new_status', p_status
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_ticket_status(UUID, TEXT, TIMESTAMPTZ) TO authenticated;

-- Comment
COMMENT ON FUNCTION update_ticket_status IS 'Update ticket status - bypasses RLS for super admin operations';
