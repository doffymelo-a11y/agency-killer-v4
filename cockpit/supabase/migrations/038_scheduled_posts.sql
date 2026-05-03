-- ============================================
-- MIGRATION 038 CORRIGEE : scheduled_posts + functions
-- Date : 2026-05-03
-- Fix : DROP existing function before recreate (error 42P13)
-- ============================================

-- 1. DROP les fonctions existantes (anciennes versions avec mauvais type)
DROP FUNCTION IF EXISTS get_pending_scheduled_posts();
DROP FUNCTION IF EXISTS update_scheduled_post_status(UUID, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS update_scheduled_post_status(UUID, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS update_scheduled_post_status(UUID, TEXT);

-- 2. Creer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'instagram', 'twitter', 'tiktok', 'facebook')),
  content TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  hashtags TEXT[] DEFAULT '{}',
  scheduled_at TIMESTAMPTZ NOT NULL,
  published_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'publishing', 'published', 'failed', 'cancelled')),
  error_message TEXT,
  platform_post_id TEXT,
  retry_count INT NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Indexes (idempotent)
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_due ON scheduled_posts(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user ON scheduled_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status);

-- 4. RLS (idempotent)
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own scheduled posts" ON scheduled_posts;
CREATE POLICY "Users see own scheduled posts" ON scheduled_posts
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users insert own scheduled posts" ON scheduled_posts;
CREATE POLICY "Users insert own scheduled posts" ON scheduled_posts
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users update own scheduled posts" ON scheduled_posts;
CREATE POLICY "Users update own scheduled posts" ON scheduled_posts
  FOR UPDATE USING (user_id = auth.uid());

-- 5. Function : recuperer les posts en attente de publication
CREATE FUNCTION get_pending_scheduled_posts()
RETURNS TABLE (
  id UUID,
  project_id UUID,
  user_id UUID,
  platform TEXT,
  content TEXT,
  media_urls TEXT[],
  hashtags TEXT[],
  scheduled_at TIMESTAMPTZ,
  status TEXT,
  retry_count INT,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sp.id, sp.project_id, sp.user_id, sp.platform, sp.content,
    sp.media_urls, sp.hashtags, sp.scheduled_at, sp.status,
    sp.retry_count, sp.metadata
  FROM scheduled_posts sp
  WHERE sp.status = 'scheduled'
    AND sp.scheduled_at <= NOW()
    AND sp.retry_count < 3
  ORDER BY sp.scheduled_at ASC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_pending_scheduled_posts() TO service_role;

-- 6. Function : mettre a jour le statut apres tentative de publication
CREATE FUNCTION update_scheduled_post_status(
  p_post_id UUID,
  p_status TEXT,
  p_platform_post_id TEXT DEFAULT NULL,
  p_platform_post_url TEXT DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE scheduled_posts
  SET
    status = p_status,
    platform_post_id = COALESCE(p_platform_post_id, platform_post_id),
    error_message = p_error_message,
    published_at = CASE WHEN p_status = 'published' THEN NOW() ELSE published_at END,
    retry_count = CASE WHEN p_status = 'failed' THEN retry_count + 1 ELSE retry_count END,
    updated_at = NOW()
  WHERE id = p_post_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_scheduled_post_status(UUID, TEXT, TEXT, TEXT, TEXT) TO service_role;

-- 7. Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_scheduled_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS scheduled_posts_updated_at ON scheduled_posts;
CREATE TRIGGER scheduled_posts_updated_at
  BEFORE UPDATE ON scheduled_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_scheduled_posts_updated_at();

-- 8. Comments (documentation)
COMMENT ON TABLE scheduled_posts IS 'Social media posts scheduled for future publication by Doffy';
COMMENT ON FUNCTION get_pending_scheduled_posts() IS 'Returns posts ready to be published (called by cron job)';
COMMENT ON FUNCTION update_scheduled_post_status(UUID, TEXT, TEXT, TEXT, TEXT) IS 'Updates status after publishing attempt';

-- 9. Verification finale (doit retourner 0 row sans erreur)
SELECT * FROM scheduled_posts LIMIT 1;
