-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 007: TASK DEPENDENCIES ENFORCEMENT - THE HIVE OS V4
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Purpose: Ensure tasks table has proper structure for dependency tracking
-- Phase: 0 - Fondations Critiques
-- Date: 2026-02-19
--
-- What this migration does:
-- 1. Verify tasks table has depends_on column (JSONB array of task IDs)
-- 2. Verify tasks table has deliverable_url and deliverable_type columns
-- 3. Add indexes for performance on dependency queries
-- 4. Create helper function to get blocking tasks
--
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Ensure depends_on column exists (should already exist from earlier migrations)
-- ─────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'depends_on'
  ) THEN
    ALTER TABLE tasks ADD COLUMN depends_on JSONB DEFAULT '[]'::jsonb;
    COMMENT ON COLUMN tasks.depends_on IS 'Array of task UUIDs that must be completed before this task can start';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────
-- 2. Ensure deliverable columns exist
-- ─────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'deliverable_url'
  ) THEN
    ALTER TABLE tasks ADD COLUMN deliverable_url TEXT;
    COMMENT ON COLUMN tasks.deliverable_url IS 'URL to the deliverable (Cloudinary, S3, etc.)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'deliverable_type'
  ) THEN
    ALTER TABLE tasks ADD COLUMN deliverable_type TEXT;
    COMMENT ON COLUMN tasks.deliverable_type IS 'Type of deliverable: image, video, pdf, document, data, url, strategy';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────
-- 3. Add indexes for dependency queries performance
-- ─────────────────────────────────────────────────────────────────────────

-- GIN index on depends_on for fast array membership checks
CREATE INDEX IF NOT EXISTS idx_tasks_depends_on_gin
  ON tasks USING GIN (depends_on);

-- Index on status for filtering incomplete dependencies
CREATE INDEX IF NOT EXISTS idx_tasks_status
  ON tasks (status);

-- Composite index for project + status (common query pattern)
CREATE INDEX IF NOT EXISTS idx_tasks_project_status
  ON tasks (project_id, status);

-- Index on deliverable_url for checking existence
CREATE INDEX IF NOT EXISTS idx_tasks_deliverable_url
  ON tasks (deliverable_url)
  WHERE deliverable_url IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────
-- 4. Helper function: Get all blocking tasks for a given task
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_blocking_tasks(p_task_id UUID)
RETURNS TABLE (
  task_id UUID,
  task_title TEXT,
  task_status TEXT,
  assignee TEXT,
  deliverable_url TEXT,
  deliverable_type TEXT,
  is_complete BOOLEAN,
  is_missing_deliverable BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_depends_on JSONB;
BEGIN
  -- Get the depends_on array for the given task
  SELECT depends_on INTO v_depends_on
  FROM tasks
  WHERE id = p_task_id;

  -- If no dependencies, return empty
  IF v_depends_on IS NULL OR jsonb_array_length(v_depends_on) = 0 THEN
    RETURN;
  END IF;

  -- Return all dependency tasks with their status
  RETURN QUERY
  SELECT
    t.id AS task_id,
    t.title AS task_title,
    t.status AS task_status,
    t.assignee,
    t.deliverable_url,
    t.deliverable_type,
    (t.status = 'done') AS is_complete,
    (t.deliverable_type IS NOT NULL AND t.deliverable_url IS NULL) AS is_missing_deliverable
  FROM tasks t
  WHERE t.id IN (
    SELECT (jsonb_array_elements_text(v_depends_on))::UUID
  );
END;
$$;

COMMENT ON FUNCTION get_blocking_tasks(UUID) IS
  'Returns all tasks that the given task depends on, with completion status';

-- ─────────────────────────────────────────────────────────────────────────
-- 5. Helper function: Check if task can be started
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION can_start_task(p_task_id UUID)
RETURNS TABLE (
  ready BOOLEAN,
  error_message TEXT,
  blocking_count INTEGER,
  missing_deliverables_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_incomplete_count INTEGER;
  v_missing_deliverables_count INTEGER;
  v_error_message TEXT := NULL;
BEGIN
  -- Count incomplete dependencies
  SELECT COUNT(*) INTO v_incomplete_count
  FROM get_blocking_tasks(p_task_id)
  WHERE NOT is_complete;

  -- Count missing deliverables
  SELECT COUNT(*) INTO v_missing_deliverables_count
  FROM get_blocking_tasks(p_task_id)
  WHERE is_missing_deliverable;

  -- Determine if task can start
  IF v_incomplete_count > 0 THEN
    v_error_message := format(
      'Cette tâche nécessite la complétion de %s tâche(s) préalable(s)',
      v_incomplete_count
    );

    RETURN QUERY SELECT
      FALSE AS ready,
      v_error_message AS error_message,
      v_incomplete_count AS blocking_count,
      v_missing_deliverables_count AS missing_deliverables_count;

  ELSIF v_missing_deliverables_count > 0 THEN
    v_error_message := format(
      'Certaines tâches dépendantes n''ont pas de livrable (%s tâche(s))',
      v_missing_deliverables_count
    );

    RETURN QUERY SELECT
      FALSE AS ready,
      v_error_message AS error_message,
      v_incomplete_count AS blocking_count,
      v_missing_deliverables_count AS missing_deliverables_count;

  ELSE
    RETURN QUERY SELECT
      TRUE AS ready,
      NULL::TEXT AS error_message,
      0 AS blocking_count,
      0 AS missing_deliverables_count;
  END IF;
END;
$$;

COMMENT ON FUNCTION can_start_task(UUID) IS
  'Checks if a task can be started based on its dependencies';

-- ─────────────────────────────────────────────────────────────────────────
-- 6. Trigger: Prevent status change to "in_progress" if dependencies not met
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION enforce_task_dependencies()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_can_start RECORD;
BEGIN
  -- Only check when changing status to 'in_progress' or 'done'
  IF NEW.status IN ('in_progress', 'done') AND
     (OLD.status IS NULL OR OLD.status != NEW.status) THEN

    -- Check if dependencies are met
    SELECT * INTO v_can_start
    FROM can_start_task(NEW.id);

    -- If not ready, raise exception
    IF NOT v_can_start.ready THEN
      RAISE EXCEPTION 'TASK_DEPENDENCIES_NOT_MET: %', v_can_start.error_message
        USING HINT = format(
          'Blocking tasks: %s, Missing deliverables: %s',
          v_can_start.blocking_count,
          v_can_start.missing_deliverables_count
        );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger (drop first if exists)
DROP TRIGGER IF EXISTS trigger_enforce_task_dependencies ON tasks;

CREATE TRIGGER trigger_enforce_task_dependencies
  BEFORE UPDATE OF status ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION enforce_task_dependencies();

COMMENT ON TRIGGER trigger_enforce_task_dependencies ON tasks IS
  'Enforces that tasks cannot be started if dependencies are not complete';

-- ─────────────────────────────────────────────────────────────────────────
-- 7. Add validation constraint: depends_on must be array of UUIDs
-- ─────────────────────────────────────────────────────────────────────────

-- Function to validate depends_on is array of valid UUIDs
CREATE OR REPLACE FUNCTION validate_depends_on_uuids()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_element TEXT;
BEGIN
  -- Check each element in the depends_on array is a valid UUID
  IF NEW.depends_on IS NOT NULL THEN
    FOR v_element IN SELECT jsonb_array_elements_text(NEW.depends_on)
    LOOP
      -- Try to cast to UUID, will raise exception if invalid
      PERFORM v_element::UUID;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_validate_depends_on ON tasks;

CREATE TRIGGER trigger_validate_depends_on
  BEFORE INSERT OR UPDATE OF depends_on ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION validate_depends_on_uuids();

-- ─────────────────────────────────────────────────────────────────────────
-- 8. Security: Grant execute permissions
-- ─────────────────────────────────────────────────────────────────────────

-- These functions are SECURITY DEFINER, so they run with creator privileges
-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_blocking_tasks(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_start_task(UUID) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
-- ═══════════════════════════════════════════════════════════════════════════

-- Test queries (for verification after migration):
--
-- 1. Get all blocking tasks for a specific task:
--    SELECT * FROM get_blocking_tasks('task-uuid-here');
--
-- 2. Check if task can be started:
--    SELECT * FROM can_start_task('task-uuid-here');
--
-- 3. Find all tasks with dependencies:
--    SELECT id, title, depends_on FROM tasks WHERE jsonb_array_length(depends_on) > 0;
--
-- 4. Find tasks blocked by incomplete dependencies:
--    SELECT t.id, t.title, c.error_message
--    FROM tasks t
--    CROSS JOIN LATERAL can_start_task(t.id) c
--    WHERE NOT c.ready;
