-- ═══════════════════════════════════════════════════════════════
-- PROJECT FILES - Persistent file storage for projects
-- Phase 4 - Chantier A: Files Persistant
-- ═══════════════════════════════════════════════════════════════

-- Table: project_files
-- Stores all files generated or uploaded by agents and users
CREATE TABLE project_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,

  -- Agent/user info
  agent_id TEXT, -- Agent who created the file (luna, sora, marcus, milo)
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- File metadata
  filename TEXT NOT NULL,
  url TEXT NOT NULL, -- Cloudinary or S3 URL
  file_type TEXT NOT NULL, -- image, video, audio, document, code, data
  mime_type TEXT NOT NULL, -- image/png, video/mp4, etc.
  size_bytes BIGINT NOT NULL,

  -- Organization
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}', -- Additional file-specific data

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX idx_project_files_project ON project_files(project_id);
CREATE INDEX idx_project_files_task ON project_files(task_id);
CREATE INDEX idx_project_files_agent ON project_files(agent_id);
CREATE INDEX idx_project_files_type ON project_files(file_type);
CREATE INDEX idx_project_files_created ON project_files(created_at DESC);

-- Full-text search on filename
CREATE INDEX idx_project_files_filename_search ON project_files USING gin(to_tsvector('english', filename));

-- Row Level Security
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view files from their own projects
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

-- Policy: Users can upload files to their own projects
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

-- Policy: Users can delete files from their own projects
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

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_project_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_files_updated_at
BEFORE UPDATE ON project_files
FOR EACH ROW
EXECUTE FUNCTION update_project_files_updated_at();

-- Helper function: Get files by project
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
COMMENT ON COLUMN project_files.agent_id IS 'Agent who generated this file (luna, sora, marcus, milo)';
COMMENT ON COLUMN project_files.tags IS 'Auto-tagged based on content (e.g., [ad_creative, meta_ads, carousel])';
COMMENT ON COLUMN project_files.metadata IS 'File-specific metadata (dimensions, duration, etc.)';
