-- ═══════════════════════════════════════════════════════════════
-- THE HIVE OS V4 - Security Migrations Master Script
-- ═══════════════════════════════════════════════════════════════
--
-- Ce script combine les migrations 004-007 pour sécuriser la base
--
-- INSTRUCTIONS:
-- 1. Ouvrir Supabase Dashboard: https://supabase.com/dashboard/project/hwiyvpfaolmasqchqwsa
-- 2. Aller dans "SQL Editor"
-- 3. Créer une "New Query"
-- 4. Copier-coller TOUT ce fichier
-- 5. Cliquer "Run"
-- 6. Vérifier qu'il n'y a pas d'erreurs
--
-- DURÉE: ~10 secondes
-- IMPACT: Multi-tenant RLS activé, rate limiting ready, audit logs ready
--
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════════════
-- MIGRATION 004: PRODUCTION RLS (Multi-Tenant Isolation)
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- 1. Ajouter user_id à toutes les tables
-- ─────────────────────────────────────────────────────────────────

DO $$
BEGIN
    -- Projects
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'projects' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE projects ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        CREATE INDEX idx_projects_user_id ON projects(user_id);
    END IF;

    -- Tasks
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tasks' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE tasks ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        CREATE INDEX idx_tasks_user_id ON tasks(user_id);
    END IF;

    -- Chat Sessions
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'chat_sessions' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE chat_sessions ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
    END IF;

    -- Wizard Sessions
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'wizard_sessions' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE wizard_sessions ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        CREATE INDEX idx_wizard_sessions_user_id ON wizard_sessions(user_id);
    END IF;

    -- Project Memory
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'project_memory' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE project_memory ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        CREATE INDEX idx_project_memory_user_id ON project_memory(user_id);
    END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────
-- 2. Supprimer les policies "Allow all" (insecure)
-- ─────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Allow all on projects" ON projects;
DROP POLICY IF EXISTS "Allow all on tasks" ON tasks;
DROP POLICY IF EXISTS "Allow all on chat_sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Allow all on wizard_sessions" ON wizard_sessions;
DROP POLICY IF EXISTS "Allow all on project_memory" ON project_memory;

-- ─────────────────────────────────────────────────────────────────
-- 3. Créer policies sécurisées (isolation par user_id)
-- ─────────────────────────────────────────────────────────────────

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wizard_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_memory ENABLE ROW LEVEL SECURITY;

-- Projects
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own projects" ON projects;
CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- Tasks
DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own tasks" ON tasks;
CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;
CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);

-- Chat Sessions
DROP POLICY IF EXISTS "Users can view own chat sessions" ON chat_sessions;
CREATE POLICY "Users can view own chat sessions"
  ON chat_sessions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own chat sessions" ON chat_sessions;
CREATE POLICY "Users can insert own chat sessions"
  ON chat_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own chat sessions" ON chat_sessions;
CREATE POLICY "Users can update own chat sessions"
  ON chat_sessions FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own chat sessions" ON chat_sessions;
CREATE POLICY "Users can delete own chat sessions"
  ON chat_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Wizard Sessions
DROP POLICY IF EXISTS "Users can view own wizard sessions" ON wizard_sessions;
CREATE POLICY "Users can view own wizard sessions"
  ON wizard_sessions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own wizard sessions" ON wizard_sessions;
CREATE POLICY "Users can insert own wizard sessions"
  ON wizard_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own wizard sessions" ON wizard_sessions;
CREATE POLICY "Users can update own wizard sessions"
  ON wizard_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Project Memory
DROP POLICY IF EXISTS "Users can view own project memory" ON project_memory;
CREATE POLICY "Users can view own project memory"
  ON project_memory FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own project memory" ON project_memory;
CREATE POLICY "Users can insert own project memory"
  ON project_memory FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────
-- 4. Fonction helper pour auto-set user_id
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers if any
DROP TRIGGER IF EXISTS set_projects_user_id ON projects;
DROP TRIGGER IF EXISTS set_tasks_user_id ON tasks;
DROP TRIGGER IF EXISTS set_chat_sessions_user_id ON chat_sessions;
DROP TRIGGER IF EXISTS set_wizard_sessions_user_id ON wizard_sessions;
DROP TRIGGER IF EXISTS set_project_memory_user_id ON project_memory;

-- Create triggers
CREATE TRIGGER set_projects_user_id
  BEFORE INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

CREATE TRIGGER set_tasks_user_id
  BEFORE INSERT ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

CREATE TRIGGER set_chat_sessions_user_id
  BEFORE INSERT ON chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

CREATE TRIGGER set_wizard_sessions_user_id
  BEFORE INSERT ON wizard_sessions
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

CREATE TRIGGER set_project_memory_user_id
  BEFORE INSERT ON project_memory
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

-- ═══════════════════════════════════════════════════════════════
-- MIGRATION 006: RATE LIMITING
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS api_rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint VARCHAR(100) NOT NULL,
  requests_last_minute INT DEFAULT 0,
  requests_last_hour INT DEFAULT 0,
  requests_last_day INT DEFAULT 0,
  last_request_at TIMESTAMPTZ DEFAULT NOW(),
  tier VARCHAR(20) DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- Function to check rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_endpoint VARCHAR,
  p_tier VARCHAR DEFAULT 'free'
)
RETURNS TABLE(allowed BOOLEAN, retry_after INT) AS $$
DECLARE
  v_limits RECORD;
  v_minute_limit INT;
  v_hour_limit INT;
  v_day_limit INT;
BEGIN
  -- Define limits by tier
  IF p_tier = 'free' THEN
    v_minute_limit := 10;
    v_hour_limit := 100;
    v_day_limit := 500;
  ELSIF p_tier = 'pro' THEN
    v_minute_limit := 60;
    v_hour_limit := 1000;
    v_day_limit := 10000;
  ELSE -- enterprise
    v_minute_limit := 300;
    v_hour_limit := 10000;
    v_day_limit := 100000;
  END IF;

  -- Get current limits
  SELECT * INTO v_limits
  FROM api_rate_limits
  WHERE api_rate_limits.user_id = p_user_id AND endpoint = p_endpoint;

  -- If no record, allow
  IF v_limits IS NULL THEN
    INSERT INTO api_rate_limits (user_id, endpoint, tier, requests_last_minute, requests_last_hour, requests_last_day)
    VALUES (p_user_id, p_endpoint, p_tier, 1, 1, 1);

    RETURN QUERY SELECT TRUE::BOOLEAN, 0::INT;
    RETURN;
  END IF;

  -- Check if exceeded
  IF v_limits.requests_last_minute >= v_minute_limit THEN
    RETURN QUERY SELECT FALSE::BOOLEAN, 60::INT; -- Retry in 60 seconds
    RETURN;
  END IF;

  IF v_limits.requests_last_hour >= v_hour_limit THEN
    RETURN QUERY SELECT FALSE::BOOLEAN, 3600::INT; -- Retry in 1 hour
    RETURN;
  END IF;

  IF v_limits.requests_last_day >= v_day_limit THEN
    RETURN QUERY SELECT FALSE::BOOLEAN, 86400::INT; -- Retry in 1 day
    RETURN;
  END IF;

  -- Increment counters
  UPDATE api_rate_limits
  SET
    requests_last_minute = requests_last_minute + 1,
    requests_last_hour = requests_last_hour + 1,
    requests_last_day = requests_last_day + 1,
    last_request_at = NOW(),
    updated_at = NOW()
  WHERE api_rate_limits.user_id = p_user_id AND endpoint = p_endpoint;

  RETURN QUERY SELECT TRUE::BOOLEAN, 0::INT;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════
-- MIGRATION 007: AUDIT LOGS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id TEXT,
  metadata JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN,
  error_message TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_timestamp ON audit_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- Function to log action
CREATE OR REPLACE FUNCTION log_audit(
  p_user_id UUID,
  p_action VARCHAR,
  p_resource_type VARCHAR,
  p_resource_id TEXT,
  p_metadata JSONB,
  p_success BOOLEAN,
  p_error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    user_email,
    action,
    resource_type,
    resource_id,
    metadata,
    success,
    error_message
  )
  SELECT
    p_user_id,
    (SELECT email FROM auth.users WHERE id = p_user_id),
    p_action,
    p_resource_type,
    p_resource_id,
    p_metadata,
    p_success,
    p_error_message;
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- ═══════════════════════════════════════════════════════════════
-- VERIFICATION
-- ═══════════════════════════════════════════════════════════════

-- Run these queries to verify migrations succeeded:

-- 1. Check user_id columns exist
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE column_name = 'user_id'
  AND table_schema = 'public'
  AND table_name IN ('projects', 'tasks', 'chat_sessions', 'wizard_sessions', 'project_memory');

-- 2. Check RLS policies active
SELECT
  schemaname,
  tablename,
  policyname,
  permissive
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('projects', 'tasks', 'chat_sessions', 'wizard_sessions', 'project_memory')
ORDER BY tablename, policyname;

-- 3. Check new tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('api_rate_limits', 'audit_logs');

-- ═══════════════════════════════════════════════════════════════
-- SUCCESS!
-- ═══════════════════════════════════════════════════════════════
--
-- Si aucune erreur, votre base est maintenant:
-- ✅ Multi-tenant avec RLS
-- ✅ Rate limiting prêt
-- ✅ Audit logs prêt
--
-- NEXT STEPS:
-- 1. Backfill user_id pour les données existantes (voir script suivant)
-- 2. Tester isolation (créer 2 users, vérifier qu'ils ne voient pas les données de l'autre)
-- 3. Activer Supabase Auth dans le dashboard
--
-- ═══════════════════════════════════════════════════════════════
