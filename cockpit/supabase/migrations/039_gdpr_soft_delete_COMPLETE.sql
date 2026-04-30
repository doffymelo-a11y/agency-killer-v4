-- ════════════════════════════════════════════════════════════════════════════════
-- MIGRATION 039 - GDPR SOFT DELETE + PROJECT FILES (COMBINED)
-- Combines migrations 037 (project_files table) + 039 (GDPR soft delete)
-- Article 17 GDPR - Right to Erasure compliance
-- ════════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- PART 1: CREATE PROJECT_FILES TABLE (from migration 037)
-- ═══════════════════════════════════════════════════════════════

-- Create table only if it doesn't exist
CREATE TABLE IF NOT EXISTS project_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,

  -- Agent/user info
  agent_id TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- File metadata
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,

  -- Organization
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_project_files_project ON project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_task ON project_files(task_id);
CREATE INDEX IF NOT EXISTS idx_project_files_agent ON project_files(agent_id);
CREATE INDEX IF NOT EXISTS idx_project_files_type ON project_files(file_type);
CREATE INDEX IF NOT EXISTS idx_project_files_created ON project_files(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_files_filename_search ON project_files USING gin(to_tsvector('english', filename));

-- Enable RLS
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_files
DROP POLICY IF EXISTS "Users can view files from their projects" ON project_files;
CREATE POLICY "Users can view files from their projects"
ON project_files FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_files.project_id
    AND projects.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can upload files to their projects" ON project_files;
CREATE POLICY "Users can upload files to their projects"
ON project_files FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_files.project_id
    AND projects.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete files from their projects" ON project_files;
CREATE POLICY "Users can delete files from their projects"
ON project_files FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_files.project_id
    AND projects.user_id = auth.uid()
  )
);

-- Update trigger
CREATE OR REPLACE FUNCTION update_project_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_project_files_updated_at ON project_files;
CREATE TRIGGER trigger_update_project_files_updated_at
BEFORE UPDATE ON project_files
FOR EACH ROW
EXECUTE FUNCTION update_project_files_updated_at();

-- Helper function
CREATE OR REPLACE FUNCTION get_project_files(p_project_id UUID)
RETURNS TABLE (
  id UUID,
  filename TEXT,
  url TEXT,
  file_type TEXT,
  mime_type TEXT,
  size_bytes BIGINT,
  tags TEXT[],
  agent_id TEXT,
  task_id UUID,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pf.id,
    pf.filename,
    pf.url,
    pf.file_type,
    pf.mime_type,
    pf.size_bytes,
    pf.tags,
    pf.agent_id,
    pf.task_id,
    pf.created_at
  FROM project_files pf
  WHERE pf.project_id = p_project_id
  ORDER BY pf.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_project_files(UUID) TO authenticated;

COMMENT ON TABLE project_files IS 'Persistent storage for all project files (images, videos, documents, etc.)';

-- ═══════════════════════════════════════════════════════════════
-- PART 2: ADD DELETED_AT COLUMNS (GDPR Soft Delete)
-- ═══════════════════════════════════════════════════════════════

-- Projects
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON projects(deleted_at)
WHERE deleted_at IS NOT NULL;

-- Tasks
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_deleted_at ON tasks(deleted_at)
WHERE deleted_at IS NOT NULL;

-- Chat sessions
ALTER TABLE chat_sessions
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_chat_sessions_deleted_at ON chat_sessions(deleted_at)
WHERE deleted_at IS NOT NULL;

-- Project files (table we just created above)
ALTER TABLE project_files
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_project_files_deleted_at ON project_files(deleted_at)
WHERE deleted_at IS NOT NULL;

-- User integrations
ALTER TABLE user_integrations
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_user_integrations_deleted_at ON user_integrations(deleted_at)
WHERE deleted_at IS NOT NULL;

-- Support tickets
ALTER TABLE support_tickets
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_support_tickets_deleted_at ON support_tickets(deleted_at)
WHERE deleted_at IS NOT NULL;

-- Support messages
ALTER TABLE support_messages
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_support_messages_deleted_at ON support_messages(deleted_at)
WHERE deleted_at IS NOT NULL;

-- Support internal notes
ALTER TABLE support_internal_notes
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_support_internal_notes_deleted_at ON support_internal_notes(deleted_at)
WHERE deleted_at IS NOT NULL;

-- Project memory
ALTER TABLE project_memory
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_project_memory_deleted_at ON project_memory(deleted_at)
WHERE deleted_at IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════
-- PART 3: UPDATE RLS POLICIES TO EXCLUDE SOFT-DELETED RESOURCES
-- ═══════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────
-- PROJECTS
-- ──────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
CREATE POLICY "Users can view their own projects"
ON projects FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  AND deleted_at IS NULL
);

DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
CREATE POLICY "Users can update their own projects"
ON projects FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  AND deleted_at IS NULL
)
WITH CHECK (
  user_id = auth.uid()
  AND deleted_at IS NULL
);

-- ──────────────────────────────────────────────────────────────
-- TASKS
-- ──────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can view tasks in their projects" ON tasks;
CREATE POLICY "Users can view tasks in their projects"
ON tasks FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = tasks.project_id
    AND projects.user_id = auth.uid()
    AND projects.deleted_at IS NULL
  )
  AND deleted_at IS NULL
);

DROP POLICY IF EXISTS "Users can update tasks in their projects" ON tasks;
CREATE POLICY "Users can update tasks in their projects"
ON tasks FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = tasks.project_id
    AND projects.user_id = auth.uid()
    AND projects.deleted_at IS NULL
  )
  AND deleted_at IS NULL
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = tasks.project_id
    AND projects.user_id = auth.uid()
    AND projects.deleted_at IS NULL
  )
  AND deleted_at IS NULL
);

-- ──────────────────────────────────────────────────────────────
-- CHAT SESSIONS
-- ──────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can view chat sessions in their projects" ON chat_sessions;
CREATE POLICY "Users can view chat sessions in their projects"
ON chat_sessions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = chat_sessions.project_id
    AND projects.user_id = auth.uid()
    AND projects.deleted_at IS NULL
  )
  AND deleted_at IS NULL
);

DROP POLICY IF EXISTS "Users can create chat sessions in their projects" ON chat_sessions;
CREATE POLICY "Users can create chat sessions in their projects"
ON chat_sessions FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = chat_sessions.project_id
    AND projects.user_id = auth.uid()
    AND projects.deleted_at IS NULL
  )
);

-- ──────────────────────────────────────────────────────────────
-- PROJECT FILES (update policies created in PART 1)
-- ──────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can view files from their projects" ON project_files;
CREATE POLICY "Users can view files from their projects"
ON project_files FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_files.project_id
    AND projects.user_id = auth.uid()
    AND projects.deleted_at IS NULL
  )
  AND deleted_at IS NULL
);

DROP POLICY IF EXISTS "Users can upload files to their projects" ON project_files;
CREATE POLICY "Users can upload files to their projects"
ON project_files FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_files.project_id
    AND projects.user_id = auth.uid()
    AND projects.deleted_at IS NULL
  )
);

-- ──────────────────────────────────────────────────────────────
-- PROJECT MEMORY
-- ──────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can view memory in their projects" ON project_memory;
CREATE POLICY "Users can view memory in their projects"
ON project_memory FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_memory.project_id
    AND projects.user_id = auth.uid()
    AND projects.deleted_at IS NULL
  )
  AND deleted_at IS NULL
);

DROP POLICY IF EXISTS "Agents can write memory in projects" ON project_memory;
CREATE POLICY "Agents can write memory in projects"
ON project_memory FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_memory.project_id
    AND projects.user_id = auth.uid()
    AND projects.deleted_at IS NULL
  )
);

-- ──────────────────────────────────────────────────────────────
-- USER INTEGRATIONS
-- ──────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can view their own integrations" ON user_integrations;
CREATE POLICY "Users can view their own integrations"
ON user_integrations FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  AND deleted_at IS NULL
);

DROP POLICY IF EXISTS "Users can update their own integrations" ON user_integrations;
CREATE POLICY "Users can update their own integrations"
ON user_integrations FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  AND deleted_at IS NULL
)
WITH CHECK (
  user_id = auth.uid()
  AND deleted_at IS NULL
);

-- ──────────────────────────────────────────────────────────────
-- SUPPORT TICKETS
-- ──────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can view their own tickets" ON support_tickets;
CREATE POLICY "Users can view their own tickets"
ON support_tickets FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  AND deleted_at IS NULL
);

DROP POLICY IF EXISTS "Users can update their own tickets" ON support_tickets;
CREATE POLICY "Users can update their own tickets"
ON support_tickets FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  AND deleted_at IS NULL
)
WITH CHECK (
  user_id = auth.uid()
  AND deleted_at IS NULL
);

-- Admins can still view all tickets (including soft-deleted) for GDPR audit trail
DROP POLICY IF EXISTS "Admins can view all tickets (including deleted)" ON support_tickets;
CREATE POLICY "Admins can view all tickets (including deleted)"
ON support_tickets FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- ──────────────────────────────────────────────────────────────
-- SUPPORT MESSAGES
-- ──────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can view messages in their tickets" ON support_messages;
CREATE POLICY "Users can view messages in their tickets"
ON support_messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM support_tickets
    WHERE support_tickets.id = support_messages.ticket_id
    AND support_tickets.user_id = auth.uid()
    AND support_tickets.deleted_at IS NULL
  )
  AND deleted_at IS NULL
);

-- ═══════════════════════════════════════════════════════════════
-- PART 4: HARD DELETE FUNCTION (called by edge function/cron)
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION gdpr_hard_delete_expired_accounts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_email TEXT;
  v_deleted_at TIMESTAMPTZ;
  v_scheduled_deletion TIMESTAMPTZ;
  v_count INTEGER := 0;
BEGIN
  -- Find users scheduled for deletion where 30 days have passed
  FOR v_user_id, v_email, v_deleted_at, v_scheduled_deletion IN
    SELECT
      id,
      email,
      (raw_user_meta_data->>'deleted_at')::timestamptz,
      (raw_user_meta_data->>'scheduled_deletion_at')::timestamptz
    FROM auth.users
    WHERE
      raw_user_meta_data->>'deleted_at' IS NOT NULL
      AND (raw_user_meta_data->>'scheduled_deletion_at')::timestamptz < NOW()
  LOOP
    -- Hard delete all user data

    -- 1. Delete projects (cascade will handle tasks, chat_sessions, files, memory)
    DELETE FROM projects WHERE user_id = v_user_id;

    -- 2. Delete user integrations
    DELETE FROM user_integrations WHERE user_id = v_user_id;

    -- 3. Delete support tickets
    DELETE FROM support_tickets WHERE user_id = v_user_id;

    -- 4. Delete user from auth.users
    DELETE FROM auth.users WHERE id = v_user_id;

    -- Log the deletion
    INSERT INTO system_logs (level, source, action, user_id, metadata)
    VALUES (
      'info',
      'gdpr',
      'account_hard_deleted',
      v_user_id,
      jsonb_build_object(
        'email', v_email,
        'deleted_at', v_deleted_at,
        'scheduled_deletion_at', v_scheduled_deletion,
        'hard_deleted_at', NOW()
      )
    );

    v_count := v_count + 1;
  END LOOP;

  -- Log summary
  IF v_count > 0 THEN
    INSERT INTO system_logs (level, source, action, message, metadata)
    VALUES (
      'info',
      'gdpr',
      'hard_delete_batch_completed',
      CONCAT('Hard deleted ', v_count, ' expired accounts'),
      jsonb_build_object(
        'accounts_deleted', v_count,
        'executed_at', NOW()
      )
    );
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION gdpr_hard_delete_expired_accounts() TO service_role;

COMMENT ON FUNCTION gdpr_hard_delete_expired_accounts IS
'GDPR Hard Delete - Permanently deletes user accounts after 30-day grace period.
This function should be called daily by a Supabase Edge Function or cron job.';

-- ═══════════════════════════════════════════════════════════════
-- PART 5: COMMENTS FOR DOCUMENTATION
-- ═══════════════════════════════════════════════════════════════

COMMENT ON COLUMN projects.deleted_at IS 'GDPR soft delete timestamp - resources with deleted_at are invisible to users';
COMMENT ON COLUMN tasks.deleted_at IS 'GDPR soft delete timestamp - cascades from parent project';
COMMENT ON COLUMN chat_sessions.deleted_at IS 'GDPR soft delete timestamp - cascades from parent project';
COMMENT ON COLUMN project_files.deleted_at IS 'GDPR soft delete timestamp - cascades from parent project';
COMMENT ON COLUMN user_integrations.deleted_at IS 'GDPR soft delete timestamp - user integration soft deleted';
COMMENT ON COLUMN support_tickets.deleted_at IS 'GDPR soft delete timestamp - support ticket soft deleted';
