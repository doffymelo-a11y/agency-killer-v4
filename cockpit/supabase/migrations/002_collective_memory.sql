-- ═══════════════════════════════════════════════════════════════
-- THE HIVE OS V4.3 - Collective Memory Schema
-- Migration: 002_collective_memory
-- Purpose: Track agent contributions for cross-agent coherence
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- Custom Type for Memory Actions
-- ─────────────────────────────────────────────────────────────────

CREATE TYPE memory_action AS ENUM (
  'TASK_STARTED',
  'TASK_COMPLETED',
  'DELIVERABLE_CREATED',
  'STRATEGY_VALIDATED',
  'RECOMMENDATION_MADE',
  'INSIGHT_DISCOVERED',
  'ASSET_GENERATED',
  'ANALYSIS_COMPLETED'
);

-- ─────────────────────────────────────────────────────────────────
-- Project Memory Table
-- Central storage for all agent contributions
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE project_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Foreign Keys
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,

  -- Agent Info
  agent_id TEXT NOT NULL, -- 'luna', 'milo', 'marcus', 'sora', 'orchestrator'

  -- Memory Entry Content
  action memory_action NOT NULL,
  summary TEXT NOT NULL, -- Human-readable summary of what was done

  -- Structured Data (JSONB for flexibility)
  key_findings JSONB DEFAULT '[]'::jsonb,  -- ["USP définie: ...", "Persona identifié: ..."]
  deliverables JSONB DEFAULT '[]'::jsonb,  -- [{type: "image", url: "...", title: "..."}]
  recommendations JSONB DEFAULT '[]'::jsonb, -- ["Pour Milo: utiliser ton X", "Pour Marcus: budget Y"]

  -- Context Snapshot (what context was available when this was created)
  context_snapshot JSONB DEFAULT '{}'::jsonb,

  -- Metadata
  session_id TEXT, -- Chat session that triggered this
  execution_time_ms INTEGER, -- How long the agent took

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────
-- Indexes for Performance
-- ─────────────────────────────────────────────────────────────────

-- Primary lookup: Get all memory for a project (ordered by time)
CREATE INDEX idx_project_memory_project_id ON project_memory(project_id, created_at DESC);

-- Filter by agent within project
CREATE INDEX idx_project_memory_agent ON project_memory(project_id, agent_id);

-- Filter by task
CREATE INDEX idx_project_memory_task ON project_memory(task_id) WHERE task_id IS NOT NULL;

-- Filter by action type
CREATE INDEX idx_project_memory_action ON project_memory(project_id, action);

-- ─────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE project_memory ENABLE ROW LEVEL SECURITY;

-- Policy for anonymous access (development) - matches other tables
CREATE POLICY "Allow all on project_memory" ON project_memory FOR ALL USING (true);

-- ─────────────────────────────────────────────────────────────────
-- Enable Realtime (for live dashboard updates)
-- ─────────────────────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE project_memory;

-- ─────────────────────────────────────────────────────────────────
-- Helper Functions
-- ─────────────────────────────────────────────────────────────────

-- Get recent memory for a project (for context injection)
CREATE OR REPLACE FUNCTION get_project_memory_context(
  p_project_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  agent_id TEXT,
  action memory_action,
  summary TEXT,
  key_findings JSONB,
  deliverables JSONB,
  recommendations JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pm.agent_id,
    pm.action,
    pm.summary,
    pm.key_findings,
    pm.deliverables,
    pm.recommendations,
    pm.created_at
  FROM project_memory pm
  WHERE pm.project_id = p_project_id
  ORDER BY pm.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Get recommendations for a specific agent (what other agents recommended for them)
CREATE OR REPLACE FUNCTION get_recommendations_for_agent(
  p_project_id UUID,
  p_agent_id TEXT
)
RETURNS TABLE (
  from_agent TEXT,
  recommendation TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pm.agent_id AS from_agent,
    rec.value::TEXT AS recommendation,
    pm.created_at
  FROM project_memory pm,
       jsonb_array_elements(pm.recommendations) AS rec
  WHERE pm.project_id = p_project_id
    AND pm.agent_id != p_agent_id
    AND rec.value::TEXT ILIKE '%' || p_agent_id || '%'
  ORDER BY pm.created_at DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- Get deliverables summary for a project
CREATE OR REPLACE FUNCTION get_project_deliverables(p_project_id UUID)
RETURNS TABLE (
  agent_id TEXT,
  deliverable_type TEXT,
  deliverable_url TEXT,
  deliverable_title TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pm.agent_id,
    (del.value->>'type')::TEXT AS deliverable_type,
    (del.value->>'url')::TEXT AS deliverable_url,
    (del.value->>'title')::TEXT AS deliverable_title,
    pm.created_at
  FROM project_memory pm,
       jsonb_array_elements(pm.deliverables) AS del
  WHERE pm.project_id = p_project_id
    AND jsonb_array_length(pm.deliverables) > 0
  ORDER BY pm.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Get agent contribution stats for a project
CREATE OR REPLACE FUNCTION get_agent_contribution_stats(p_project_id UUID)
RETURNS TABLE (
  agent_id TEXT,
  total_contributions BIGINT,
  tasks_completed BIGINT,
  deliverables_created BIGINT,
  recommendations_made BIGINT,
  last_contribution TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pm.agent_id,
    COUNT(*)::BIGINT AS total_contributions,
    COUNT(*) FILTER (WHERE pm.action = 'TASK_COMPLETED')::BIGINT AS tasks_completed,
    COUNT(*) FILTER (WHERE pm.action = 'DELIVERABLE_CREATED')::BIGINT AS deliverables_created,
    COUNT(*) FILTER (WHERE pm.action = 'RECOMMENDATION_MADE')::BIGINT AS recommendations_made,
    MAX(pm.created_at) AS last_contribution
  FROM project_memory pm
  WHERE pm.project_id = p_project_id
  GROUP BY pm.agent_id
  ORDER BY total_contributions DESC;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────────
-- Comments for Documentation
-- ─────────────────────────────────────────────────────────────────

COMMENT ON TABLE project_memory IS 'Collective memory for THE HIVE OS V4.3 - stores all agent contributions for cross-agent coherence';
COMMENT ON COLUMN project_memory.key_findings IS 'Array of key discoveries/insights from the agent work';
COMMENT ON COLUMN project_memory.deliverables IS 'Array of deliverables created: [{type, url, title, description}]';
COMMENT ON COLUMN project_memory.recommendations IS 'Array of recommendations for other agents';
COMMENT ON COLUMN project_memory.context_snapshot IS 'Snapshot of context that was available when this entry was created';
