-- =============================================
-- Migration 028: System Logs & Admin Monitoring
-- Date: 2026-04-13
-- Description: Table centralisée de logs pour le monitoring admin + RPC functions
-- =============================================

-- Table de logs centralises pour le monitoring admin
CREATE TABLE IF NOT EXISTS system_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  level TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error', 'debug')),
  source TEXT NOT NULL CHECK (source IN ('backend', 'mcp-bridge', 'agent-executor', 'mcp-server', 'orchestrator', 'auth', 'rate-limit')),
  agent_id TEXT CHECK (agent_id IN ('luna', 'sora', 'marcus', 'milo', 'doffy', 'orchestrator', 'pm', NULL)),
  user_id UUID,
  project_id UUID,
  action TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes pour les requetes admin
CREATE INDEX idx_system_logs_created ON system_logs(created_at DESC);
CREATE INDEX idx_system_logs_level ON system_logs(level) WHERE level IN ('error', 'warn');
CREATE INDEX idx_system_logs_source ON system_logs(source);
CREATE INDEX idx_system_logs_agent ON system_logs(agent_id) WHERE agent_id IS NOT NULL;
CREATE INDEX idx_system_logs_project ON system_logs(project_id) WHERE project_id IS NOT NULL;

-- RLS : seuls les admins peuvent lire les logs
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all logs"
  ON system_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Backend can insert logs"
  ON system_logs FOR INSERT
  WITH CHECK (true);

-- =============================================
-- RPC FUNCTIONS
-- =============================================

-- RPC : stats agents agreges
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

-- RPC : logs recents avec filtres
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

-- RPC : compte d'erreurs par periode
CREATE OR REPLACE FUNCTION get_error_count(hours_back INTEGER DEFAULT 1)
RETURNS BIGINT AS $$
  SELECT COUNT(*)
  FROM system_logs
  WHERE level = 'error'
    AND created_at >= NOW() - (hours_back || ' hours')::INTERVAL;
$$ LANGUAGE sql SECURITY DEFINER;

-- RPC : business stats avancees
CREATE OR REPLACE FUNCTION get_business_stats(days_back INTEGER DEFAULT 30)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
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

-- RPC : nettoyage automatique des logs > 30 jours
CREATE OR REPLACE FUNCTION cleanup_old_system_logs()
RETURNS void AS $$
  DELETE FROM system_logs WHERE created_at < NOW() - INTERVAL '30 days';
$$ LANGUAGE sql SECURITY DEFINER;

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE system_logs IS 'Logs centralisés de tous les composants backend pour le monitoring admin';
COMMENT ON FUNCTION get_agent_stats IS 'Retourne les statistiques agrégées par agent (exécutions, succès, durée, coûts)';
COMMENT ON FUNCTION get_recent_logs IS 'Retourne les logs récents avec filtres optionnels (level, source, agent_id)';
COMMENT ON FUNCTION get_error_count IS 'Compte le nombre d''erreurs dans les X dernières heures';
COMMENT ON FUNCTION get_business_stats IS 'Retourne les métriques business complètes (users, projets, tasks, CSAT, etc.)';
COMMENT ON FUNCTION cleanup_old_system_logs IS 'Supprime les logs de plus de 30 jours (à appeler via cron)';
