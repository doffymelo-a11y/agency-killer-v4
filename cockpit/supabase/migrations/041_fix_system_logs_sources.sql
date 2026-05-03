-- ═══════════════════════════════════════════════════════════════
-- THE HIVE OS V5 - Expand system_logs.source CHECK constraint
-- Migration 041
-- ═══════════════════════════════════════════════════════════════
--
-- Why this migration exists:
--   The CHECK constraint defined in 028_system_logs.sql only allows
--   ('backend', 'mcp-bridge', 'agent-executor', 'mcp-server',
--    'orchestrator', 'auth', 'rate-limit').
--
--   The GDPR hard-delete cron (backend/src/cron/gdpr-hard-delete-cron.ts)
--   and the GDPR HTTP routes (backend/src/routes/gdpr.routes.ts) write
--   logs with source='gdpr' and the insert is rejected with
--   "new row for relation system_logs violates check constraint
--    system_logs_source_check". This migration unblocks GDPR logging and
--   pre-authorizes the additional source labels we expect to need
--   (social, social-cron, gdpr-cron, generic cron, webhook, telegram).
--
-- HOW TO APPLY (choose one):
--   A) Supabase Dashboard → SQL Editor → paste this file → Run
--   B) supabase CLI:        supabase db push   (or: supabase migration up)
--   C) psql directly:       psql "$SUPABASE_DB_URL" -f 041_fix_system_logs_sources.sql
--
-- VERIFICATION (after apply):
--   insert into system_logs (level, source, action, message)
--   values ('info', 'gdpr', 'test', 'constraint check');
--   -- expect: 1 row inserted, no error
--   delete from system_logs where action = 'test' and source = 'gdpr';
-- ═══════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE system_logs DROP CONSTRAINT IF EXISTS system_logs_source_check;

ALTER TABLE system_logs ADD CONSTRAINT system_logs_source_check
  CHECK (source IN (
    'backend',
    'mcp-bridge',
    'agent-executor',
    'mcp-server',
    'orchestrator',
    'auth',
    'rate-limit',
    'gdpr',
    'gdpr-cron',
    'social',
    'social-cron',
    'cron',
    'webhook',
    'telegram'
  ));

COMMIT;
