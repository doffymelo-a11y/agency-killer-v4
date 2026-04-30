-- ═══════════════════════════════════════════════════════════════
-- THE HIVE OS V5 - Social Media Scheduling
-- Migration 038: scheduled_posts table for Doffy
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────
-- Table: scheduled_posts
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS scheduled_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Platform and content
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'instagram', 'twitter', 'tiktok', 'facebook')),
  content TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  hashtags TEXT[] DEFAULT '{}',
  mentions TEXT[] DEFAULT '{}',

  -- Scheduling
  scheduled_at TIMESTAMPTZ NOT NULL,
  published_at TIMESTAMPTZ,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'publishing', 'published', 'failed', 'cancelled')),
  error_message TEXT,
  retry_count INT DEFAULT 0,

  -- Platform response
  platform_post_id TEXT,
  platform_post_url TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT scheduled_at_future CHECK (scheduled_at > created_at)
);

-- ─────────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────────

CREATE INDEX idx_scheduled_posts_project ON scheduled_posts(project_id);
CREATE INDEX idx_scheduled_posts_user ON scheduled_posts(user_id);
CREATE INDEX idx_scheduled_posts_platform ON scheduled_posts(platform);
CREATE INDEX idx_scheduled_posts_status ON scheduled_posts(status);
CREATE INDEX idx_scheduled_posts_scheduled_at ON scheduled_posts(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX idx_scheduled_posts_created_at ON scheduled_posts(created_at DESC);

-- ─────────────────────────────────────────────────────────────────
-- Trigger: updated_at
-- ─────────────────────────────────────────────────────────────────

CREATE TRIGGER update_scheduled_posts_updated_at
  BEFORE UPDATE ON scheduled_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────────────────────────
-- RLS Policies
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;

-- Users can view their own scheduled posts
DROP POLICY IF EXISTS "Users can view own scheduled posts" ON scheduled_posts;
CREATE POLICY "Users can view own scheduled posts"
  ON scheduled_posts FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create scheduled posts
DROP POLICY IF EXISTS "Users can create scheduled posts" ON scheduled_posts;
CREATE POLICY "Users can create scheduled posts"
  ON scheduled_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own scheduled posts (cancel, reschedule)
DROP POLICY IF EXISTS "Users can update own scheduled posts" ON scheduled_posts;
CREATE POLICY "Users can update own scheduled posts"
  ON scheduled_posts FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own scheduled posts
DROP POLICY IF EXISTS "Users can delete own scheduled posts" ON scheduled_posts;
CREATE POLICY "Users can delete own scheduled posts"
  ON scheduled_posts FOR DELETE
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────
-- RPC: Get pending scheduled posts (for cron job)
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_pending_scheduled_posts()
RETURNS SETOF scheduled_posts
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT *
  FROM scheduled_posts
  WHERE status = 'scheduled'
    AND scheduled_at <= NOW()
  ORDER BY scheduled_at ASC
  LIMIT 100; -- Process max 100 posts per run
$$;

GRANT EXECUTE ON FUNCTION get_pending_scheduled_posts() TO service_role;

-- ─────────────────────────────────────────────────────────────────
-- RPC: Update scheduled post status (for cron job)
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_scheduled_post_status(
  p_post_id UUID,
  p_status TEXT,
  p_platform_post_id TEXT DEFAULT NULL,
  p_platform_post_url TEXT DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE scheduled_posts
  SET
    status = p_status,
    platform_post_id = COALESCE(p_platform_post_id, platform_post_id),
    platform_post_url = COALESCE(p_platform_post_url, platform_post_url),
    error_message = p_error_message,
    published_at = CASE WHEN p_status = 'published' THEN NOW() ELSE published_at END,
    retry_count = CASE WHEN p_status = 'failed' THEN retry_count + 1 ELSE retry_count END,
    updated_at = NOW()
  WHERE id = p_post_id;
END;
$$;

GRANT EXECUTE ON FUNCTION update_scheduled_post_status(UUID, TEXT, TEXT, TEXT, TEXT) TO service_role;

COMMIT;

-- ═══════════════════════════════════════════════════════════════
-- VERIFICATION
-- ═══════════════════════════════════════════════════════════════

-- Check table exists
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'scheduled_posts';

-- Check indexes
SELECT indexname FROM pg_indexes
WHERE tablename = 'scheduled_posts';

COMMENT ON TABLE scheduled_posts IS 'Social media posts scheduled for future publication by Doffy';
COMMENT ON FUNCTION get_pending_scheduled_posts() IS 'Returns posts ready to be published (called by cron job)';
COMMENT ON FUNCTION update_scheduled_post_status(UUID, TEXT, TEXT, TEXT, TEXT) IS 'Updates status after publishing attempt';
