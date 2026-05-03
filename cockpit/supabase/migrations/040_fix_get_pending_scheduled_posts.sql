-- ═══════════════════════════════════════════════════════════════
-- THE HIVE OS V5 - Fix get_pending_scheduled_posts RPC
-- Migration 040
-- ═══════════════════════════════════════════════════════════════
--
-- Why this migration exists:
--   Migration 038_scheduled_posts.sql defines get_pending_scheduled_posts()
--   but it was never applied to the live Supabase project (the schema cache
--   is missing the function), so the scheduled-posts cron crashes with
--   "Could not find the function public.get_pending_scheduled_posts".
--
--   This migration redefines the function with the explicit return signature
--   the backend expects (avoids relying on SETOF scheduled_posts shape) and
--   adds a retry_count < 3 guard so failed posts stop being re-processed
--   forever.
--
-- HOW TO APPLY (choose one):
--   A) Supabase Dashboard → SQL Editor → paste this file → Run
--   B) supabase CLI:        supabase db push   (or: supabase migration up)
--   C) psql directly:       psql "$SUPABASE_DB_URL" -f 040_fix_get_pending_scheduled_posts.sql
--
-- VERIFICATION (after apply):
--   select proname from pg_proc where proname = 'get_pending_scheduled_posts';
--   -- expect: 1 row
--   select * from get_pending_scheduled_posts();
--   -- expect: 0 rows initially (no error)
-- ═══════════════════════════════════════════════════════════════

BEGIN;

DROP FUNCTION IF EXISTS get_pending_scheduled_posts();

CREATE OR REPLACE FUNCTION get_pending_scheduled_posts()
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
    sp.id,
    sp.project_id,
    sp.user_id,
    sp.platform,
    sp.content,
    sp.media_urls,
    sp.hashtags,
    sp.scheduled_at,
    sp.status,
    sp.retry_count,
    sp.metadata
  FROM scheduled_posts sp
  WHERE sp.status = 'scheduled'
    AND sp.scheduled_at <= NOW()
    AND sp.retry_count < 3
  ORDER BY sp.scheduled_at ASC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_pending_scheduled_posts() TO service_role;

COMMENT ON FUNCTION get_pending_scheduled_posts() IS
  'Returns scheduled posts ready to publish (status=scheduled, due, retry_count<3). Called by scheduled-posts cron.';

COMMIT;
