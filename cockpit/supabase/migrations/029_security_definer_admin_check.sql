-- =============================================
-- Migration 029: Add Admin Check to SECURITY DEFINER Functions
-- Date: 2026-04-18
-- Description: Security hardening - Add auth checks inside SECURITY DEFINER functions
-- =============================================

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update get_agent_stats with admin check
CREATE OR REPLACE FUNCTION get_agent_stats(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  agent_id TEXT,
  total_executions BIGINT,
  successful_executions BIGINT,
  failed_executions BIGINT,
  avg_duration_ms NUMERIC,
  total_cost_credits NUMERIC,
  last_execution_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Verify caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin access required'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN QUERY
  SELECT
    sl.agent_id,
    COUNT(*) FILTER (WHERE sl.action = 'agent_complete' OR sl.action = 'agent_error') AS total_executions,
    COUNT(*) FILTER (WHERE sl.action = 'agent_complete') AS successful_executions,
    COUNT(*) FILTER (WHERE sl.action = 'agent_error') AS failed_executions,
    AVG((sl.metadata->>'duration_ms')::NUMERIC) FILTER (WHERE sl.action = 'agent_complete') AS avg_duration_ms,
    COALESCE(SUM((sl.metadata->>'credits_used')::NUMERIC) FILTER (WHERE sl.action = 'agent_complete'), 0) AS total_cost_credits,
    MAX(sl.created_at) AS last_execution_at
  FROM system_logs sl
  WHERE sl.agent_id IS NOT NULL
    AND sl.created_at >= NOW() - (days_back || ' days')::INTERVAL
  GROUP BY sl.agent_id
  ORDER BY total_executions DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update get_recent_logs with admin check
CREATE OR REPLACE FUNCTION get_recent_logs(
  p_limit INTEGER DEFAULT 50,
  p_level TEXT DEFAULT NULL,
  p_source TEXT DEFAULT NULL,
  p_agent_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  level TEXT,
  source TEXT,
  agent_id TEXT,
  user_id UUID,
  project_id UUID,
  action TEXT,
  message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Verify caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin access required'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN QUERY
  SELECT sl.id, sl.level, sl.source, sl.agent_id, sl.user_id, sl.project_id, sl.action, sl.message, sl.metadata, sl.created_at
  FROM system_logs sl
  WHERE (p_level IS NULL OR sl.level = p_level)
    AND (p_source IS NULL OR sl.source = p_source)
    AND (p_agent_id IS NULL OR sl.agent_id = p_agent_id)
  ORDER BY sl.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update get_error_count with admin check
CREATE OR REPLACE FUNCTION get_error_count(hours_back INTEGER DEFAULT 1)
RETURNS BIGINT AS $$
BEGIN
  -- Verify caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin access required'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN (
    SELECT COUNT(*)
    FROM system_logs
    WHERE level = 'error'
      AND created_at >= NOW() - (hours_back || ' hours')::INTERVAL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update get_business_stats with admin check
CREATE OR REPLACE FUNCTION get_business_stats(days_back INTEGER DEFAULT 30)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Verify caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin access required'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT json_build_object(
    'users_total', (SELECT COUNT(*) FROM auth.users),
    'users_active_7d', (SELECT COUNT(*) FROM auth.users WHERE last_sign_in_at >= NOW() - INTERVAL '7 days'),
    'users_active_30d', (SELECT COUNT(*) FROM auth.users WHERE last_sign_in_at >= NOW() - INTERVAL '30 days'),
    'projects_total', (SELECT COUNT(*) FROM projects),
    'projects_active', (SELECT COUNT(*) FROM projects WHERE status = 'in_progress'),
    'projects_by_scope', (
      SELECT json_agg(json_build_object('scope', scope, 'count', cnt))
      FROM (SELECT scope, COUNT(*) as cnt FROM projects GROUP BY scope) sub
    ),
    'tasks_total', (SELECT COUNT(*) FROM tasks),
    'tasks_completed', (SELECT COUNT(*) FROM tasks WHERE status = 'done'),
    'tasks_completion_rate', (
      SELECT ROUND(COUNT(*) FILTER (WHERE status = 'done')::NUMERIC / NULLIF(COUNT(*), 0) * 100, 1)
      FROM tasks
    ),
    'tasks_by_agent', (
      SELECT json_agg(json_build_object('agent', assignee, 'total', cnt, 'completed', completed))
      FROM (
        SELECT assignee, COUNT(*) as cnt, COUNT(*) FILTER (WHERE status = 'done') as completed
        FROM tasks GROUP BY assignee
      ) sub
    ),
    'agent_actions_30d', (SELECT COUNT(*) FROM project_memory WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL),
    'avg_csat', (
      SELECT ROUND(AVG(rating)::NUMERIC, 2)
      FROM ticket_satisfaction
      WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update cleanup_old_system_logs with admin check
CREATE OR REPLACE FUNCTION cleanup_old_system_logs()
RETURNS void AS $$
BEGIN
  -- Verify caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin access required'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  DELETE FROM system_logs WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION is_admin() IS 'Helper function to check if current user has admin or super_admin role';
