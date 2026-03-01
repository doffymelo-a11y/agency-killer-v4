-- ═══════════════════════════════════════════════════════════════
-- THE HIVE OS V4 - Production RLS Policies (Multi-Tenant)
-- Migration: 004_production_rls
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- 1. Ajouter user_id à toutes les tables
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE projects ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE wizard_sessions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE project_memory ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_wizard_sessions_user_id ON wizard_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_project_memory_user_id ON project_memory(user_id);

-- ─────────────────────────────────────────────────────────────────
-- 2. Supprimer les policies "Allow all"
-- ─────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Allow all on projects" ON projects;
DROP POLICY IF EXISTS "Allow all on tasks" ON tasks;
DROP POLICY IF EXISTS "Allow all on chat_sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Allow all on wizard_sessions" ON wizard_sessions;
DROP POLICY IF EXISTS "Allow all on project_memory" ON project_memory;

-- ─────────────────────────────────────────────────────────────────
-- 3. Créer policies sécurisées (isolation par user_id)
-- ─────────────────────────────────────────────────────────────────

-- Projects
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- Tasks
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);

-- Chat Sessions
CREATE POLICY "Users can view own chat sessions"
  ON chat_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat sessions"
  ON chat_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat sessions"
  ON chat_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat sessions"
  ON chat_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Wizard Sessions
CREATE POLICY "Users can view own wizard sessions"
  ON wizard_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wizard sessions"
  ON wizard_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wizard sessions"
  ON wizard_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Project Memory
CREATE POLICY "Users can view own project memory"
  ON project_memory FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own project memory"
  ON project_memory FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────
-- 4. Fonction helper pour auto-set user_id
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers
CREATE TRIGGER set_projects_user_id
  BEFORE INSERT ON projects
  FOR EACH ROW
  WHEN (NEW.user_id IS NULL)
  EXECUTE FUNCTION set_user_id();

CREATE TRIGGER set_tasks_user_id
  BEFORE INSERT ON tasks
  FOR EACH ROW
  WHEN (NEW.user_id IS NULL)
  EXECUTE FUNCTION set_user_id();

CREATE TRIGGER set_chat_sessions_user_id
  BEFORE INSERT ON chat_sessions
  FOR EACH ROW
  WHEN (NEW.user_id IS NULL)
  EXECUTE FUNCTION set_user_id();

CREATE TRIGGER set_wizard_sessions_user_id
  BEFORE INSERT ON wizard_sessions
  FOR EACH ROW
  WHEN (NEW.user_id IS NULL)
  EXECUTE FUNCTION set_user_id();

CREATE TRIGGER set_project_memory_user_id
  BEFORE INSERT ON project_memory
  FOR EACH ROW
  WHEN (NEW.user_id IS NULL)
  EXECUTE FUNCTION set_user_id();
