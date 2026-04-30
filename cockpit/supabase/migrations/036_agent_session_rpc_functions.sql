-- RPC functions to bypass PostgREST schema cache for claude_agent_sessions
-- These use SECURITY DEFINER to bypass RLS and execute as the definer

-- Function to create a new agent session
CREATE OR REPLACE FUNCTION create_agent_session(
  p_ticket_id UUID,
  p_started_by UUID,
  p_worktree_path TEXT DEFAULT '',
  p_branch_name TEXT DEFAULT ''
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_id UUID;
BEGIN
  INSERT INTO claude_agent_sessions (
    ticket_id,
    started_by,
    status,
    worktree_path,
    branch_name,
    created_at,
    updated_at
  ) VALUES (
    p_ticket_id,
    p_started_by,
    'running',
    p_worktree_path,
    p_branch_name,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_session_id;

  RETURN v_session_id;
END;
$$;

-- Function to update an agent session
CREATE OR REPLACE FUNCTION update_agent_session(
  p_session_id UUID,
  p_status TEXT DEFAULT NULL,
  p_worktree_path TEXT DEFAULT NULL,
  p_branch_name TEXT DEFAULT NULL,
  p_system_prompt TEXT DEFAULT NULL,
  p_user_message TEXT DEFAULT NULL,
  p_agent_output TEXT DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_pr_number INTEGER DEFAULT NULL,
  p_pr_url TEXT DEFAULT NULL,
  p_pr_branch TEXT DEFAULT NULL,
  p_completed_at TIMESTAMPTZ DEFAULT NULL,
  p_duration_seconds INTEGER DEFAULT NULL,
  p_tokens_used INTEGER DEFAULT NULL,
  p_cost_usd NUMERIC DEFAULT NULL,
  p_files_changed TEXT[] DEFAULT NULL,
  p_tests_passed BOOLEAN DEFAULT NULL,
  p_test_output TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE claude_agent_sessions
  SET
    status = COALESCE(p_status, status),
    worktree_path = COALESCE(p_worktree_path, worktree_path),
    branch_name = COALESCE(p_branch_name, branch_name),
    system_prompt = COALESCE(p_system_prompt, system_prompt),
    user_message = COALESCE(p_user_message, user_message),
    agent_output = COALESCE(p_agent_output, agent_output),
    error_message = COALESCE(p_error_message, error_message),
    pr_number = COALESCE(p_pr_number, pr_number),
    pr_url = COALESCE(p_pr_url, pr_url),
    pr_branch = COALESCE(p_pr_branch, pr_branch),
    completed_at = COALESCE(p_completed_at, completed_at),
    duration_seconds = COALESCE(p_duration_seconds, duration_seconds),
    tokens_used = COALESCE(p_tokens_used, tokens_used),
    cost_usd = COALESCE(p_cost_usd, cost_usd),
    files_changed = COALESCE(p_files_changed, files_changed),
    tests_passed = COALESCE(p_tests_passed, tests_passed),
    test_output = COALESCE(p_test_output, test_output),
    updated_at = NOW()
  WHERE id = p_session_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_agent_session(UUID, UUID, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION create_agent_session(UUID, UUID, TEXT, TEXT) TO authenticated;

GRANT EXECUTE ON FUNCTION update_agent_session(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT,
  INTEGER, TEXT, TEXT, TIMESTAMPTZ, INTEGER, INTEGER,
  NUMERIC, TEXT[], BOOLEAN, TEXT
) TO service_role;
GRANT EXECUTE ON FUNCTION update_agent_session(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT,
  INTEGER, TEXT, TEXT, TIMESTAMPTZ, INTEGER, INTEGER,
  NUMERIC, TEXT[], BOOLEAN, TEXT
) TO authenticated;

COMMENT ON FUNCTION create_agent_session IS 'Create a new Claude agent session (bypasses PostgREST cache)';
COMMENT ON FUNCTION update_agent_session IS 'Update a Claude agent session (bypasses PostgREST cache)';
