-- ============================================
-- Migration 012: Add archived column to projects table
-- ============================================
-- Date: 2026-03-16
-- Description: Add archived column for archive/delete functionality

-- Add archived column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_projects_archived ON projects(archived);

-- Verify the change
COMMENT ON COLUMN projects.archived IS 'Flag to mark projects as archived (soft delete)';
