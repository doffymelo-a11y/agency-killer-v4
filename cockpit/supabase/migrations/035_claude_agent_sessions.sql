-- Migration 035: Claude Agent SDK Sessions
-- Tracks autonomous bug fix sessions for Phase 4 Telegram Ticket Resolution Tunnel

-- Table pour tracker les sessions Claude Agent SDK (idempotent)
CREATE TABLE IF NOT EXISTS claude_agent_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  started_by UUID NOT NULL REFERENCES auth.users(id),
  worktree_path TEXT NOT NULL,
  branch_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),

  -- Agent execution data
  system_prompt TEXT,
  user_message TEXT,
  agent_output TEXT,
  error_message TEXT,

  -- GitHub integration
  pr_number INTEGER,
  pr_url TEXT,
  pr_branch TEXT,

  -- Metrics
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  tokens_used INTEGER,
  cost_usd NUMERIC(10, 6),

  -- Results
  files_changed TEXT[], -- Array of file paths
  tests_passed BOOLEAN,
  test_output TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries (idempotent)
CREATE INDEX IF NOT EXISTS idx_agent_sessions_ticket ON claude_agent_sessions(ticket_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_status ON claude_agent_sessions(status);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_started ON claude_agent_sessions(started_at DESC);

-- RLS: Only admins can access agent sessions
ALTER TABLE claude_agent_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Admins can view agent sessions" ON claude_agent_sessions;
DROP POLICY IF EXISTS "Admins can create agent sessions" ON claude_agent_sessions;
DROP POLICY IF EXISTS "Admins can update agent sessions" ON claude_agent_sessions;

-- Recreate policies
CREATE POLICY "Admins can view agent sessions"
ON claude_agent_sessions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admins can create agent sessions"
ON claude_agent_sessions FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admins can update agent sessions"
ON claude_agent_sessions FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Function to get session with ticket details
CREATE OR REPLACE FUNCTION get_agent_session_details(p_session_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'session', row_to_json(s.*),
    'ticket', row_to_json(t.*)
  ) INTO v_result
  FROM claude_agent_sessions s
  JOIN support_tickets t ON s.ticket_id = t.id
  WHERE s.id = p_session_id;

  RETURN v_result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_agent_session_details(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION get_agent_session_details(UUID) TO authenticated;

-- Add comment
COMMENT ON TABLE claude_agent_sessions IS 'Tracks Claude Agent SDK fix sessions for bug tickets - Phase 4 Telegram Ticket Resolution Tunnel';
COMMENT ON FUNCTION get_agent_session_details IS 'Retrieves complete session details with associated ticket information';
