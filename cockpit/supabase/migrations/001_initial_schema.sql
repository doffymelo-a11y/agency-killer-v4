-- ═══════════════════════════════════════════════════════════════
-- THE HIVE OS V4 - Database Schema
-- Migration: 001_initial_schema
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- Enable Required Extensions
-- ─────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────
-- Custom Types (Enums)
-- ─────────────────────────────────────────────────────────────────

CREATE TYPE project_scope AS ENUM (
  'meta_ads',
  'sem',
  'seo',
  'analytics',
  'full_scale'
);

CREATE TYPE project_status AS ENUM (
  'planning',
  'in_progress',
  'completed',
  'paused'
);

CREATE TYPE task_status AS ENUM (
  'todo',
  'in_progress',
  'done',
  'blocked'
);

CREATE TYPE task_phase AS ENUM (
  'Audit',
  'Setup',
  'Production',
  'Optimization'
);

CREATE TYPE agent_role AS ENUM (
  'sora',
  'luna',
  'marcus',
  'milo',
  'orchestrator'
);

CREATE TYPE deliverable_type AS ENUM (
  'image',
  'video',
  'pdf',
  'text',
  'report'
);

CREATE TYPE chat_mode AS ENUM (
  'quick_research',
  'task_execution'
);

-- ─────────────────────────────────────────────────────────────────
-- Projects Table
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  scope project_scope NOT NULL,
  status project_status NOT NULL DEFAULT 'planning',
  current_phase TEXT NOT NULL DEFAULT 'setup',

  -- State Flags (JSONB for flexibility)
  state_flags JSONB NOT NULL DEFAULT '{
    "strategy_validated": false,
    "budget_approved": false,
    "creatives_ready": false,
    "tracking_ready": false,
    "ads_live": false
  }'::jsonb,

  -- Genesis Wizard Answers (stores all Q&A from wizard)
  -- Structure: { "question_id": { "value": "answer", "generatesTask": {...} } }
  genesis_answers JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Project Metadata (website, budget, audience, etc.)
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Project Deadline (from Genesis)
  deadline DATE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_scope ON projects(scope);

-- ─────────────────────────────────────────────────────────────────
-- Tasks Table
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Task Info
  title TEXT NOT NULL,
  description TEXT,

  -- Assignment
  assignee agent_role NOT NULL,
  phase task_phase NOT NULL,
  status task_status NOT NULL DEFAULT 'todo',

  -- Context Loop
  context_questions TEXT[] NOT NULL DEFAULT '{}',
  user_inputs JSONB DEFAULT NULL,

  -- Calendar
  estimated_hours DECIMAL(4,1) NOT NULL DEFAULT 1,
  due_date DATE NOT NULL,

  -- Dependencies (array of task UUIDs)
  depends_on UUID[] NOT NULL DEFAULT '{}',

  -- Deliverables
  deliverable_url TEXT,
  deliverable_type deliverable_type,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Indexes for faster queries
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assignee ON tasks(assignee);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- ─────────────────────────────────────────────────────────────────
-- Wizard Sessions Table (Genesis Wizard History)
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE wizard_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Resulting project (null if wizard not completed)
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,

  -- Wizard State
  scope project_scope,
  current_step INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'completed', 'abandoned'

  -- All answers collected during wizard
  -- Structure: [{ "questionId": "meta_objective", "value": "roas", "generatesTask": {...} }]
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Project info entered
  project_name TEXT,
  deadline DATE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Index for faster queries
CREATE INDEX idx_wizard_sessions_project_id ON wizard_sessions(project_id);
CREATE INDEX idx_wizard_sessions_status ON wizard_sessions(status);

-- ─────────────────────────────────────────────────────────────────
-- Chat Sessions Table
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Mode
  mode chat_mode NOT NULL DEFAULT 'quick_research',
  linked_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,

  -- Injected Context (stored for reference)
  injected_context JSONB,

  -- Messages Array
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_chat_sessions_project_id ON chat_sessions(project_id);
CREATE INDEX idx_chat_sessions_task_id ON chat_sessions(linked_task_id);

-- ─────────────────────────────────────────────────────────────────
-- Auto-Update Trigger for updated_at
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────────────────────────
-- Auto-Unblock Tasks Trigger
-- When a task is marked as 'done', check if any dependent tasks should be unblocked
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION auto_unblock_dependent_tasks()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if task was just marked as done
  IF NEW.status = 'done' AND OLD.status != 'done' THEN
    -- Find all blocked tasks that depend on this task
    UPDATE tasks
    SET status = 'todo'
    WHERE status = 'blocked'
      AND NEW.id = ANY(depends_on)
      AND project_id = NEW.project_id
      -- Only unblock if ALL dependencies are done
      AND NOT EXISTS (
        SELECT 1
        FROM unnest(depends_on) AS dep_id
        JOIN tasks AS dep ON dep.id = dep_id
        WHERE dep.status != 'done'
          AND dep.id != NEW.id
      );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_unblock_tasks
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION auto_unblock_dependent_tasks();

-- ─────────────────────────────────────────────────────────────────
-- Row Level Security (RLS)
-- For now, allow all operations (single-tenant)
-- In production, add user_id and proper policies
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wizard_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for anonymous access (development)
CREATE POLICY "Allow all on projects" ON projects FOR ALL USING (true);
CREATE POLICY "Allow all on tasks" ON tasks FOR ALL USING (true);
CREATE POLICY "Allow all on chat_sessions" ON chat_sessions FOR ALL USING (true);
CREATE POLICY "Allow all on wizard_sessions" ON wizard_sessions FOR ALL USING (true);

-- ─────────────────────────────────────────────────────────────────
-- Enable Realtime
-- ─────────────────────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE projects;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE wizard_sessions;

-- ─────────────────────────────────────────────────────────────────
-- Helper Functions
-- ─────────────────────────────────────────────────────────────────

-- Get project progress (percentage of completed tasks)
CREATE OR REPLACE FUNCTION get_project_progress(p_project_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_tasks INTEGER;
  done_tasks INTEGER;
BEGIN
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'done')
  INTO total_tasks, done_tasks
  FROM tasks
  WHERE project_id = p_project_id;

  IF total_tasks = 0 THEN
    RETURN 0;
  END IF;

  RETURN ROUND((done_tasks::DECIMAL / total_tasks) * 100);
END;
$$ LANGUAGE plpgsql;

-- Get next available task for an agent
CREATE OR REPLACE FUNCTION get_next_task_for_agent(p_project_id UUID, p_agent agent_role)
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT id
    FROM tasks
    WHERE project_id = p_project_id
      AND assignee = p_agent
      AND status = 'todo'
    ORDER BY due_date ASC
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql;
