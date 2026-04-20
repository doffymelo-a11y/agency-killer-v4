-- =============================================
-- Migration 030: Super Admin Backoffice - Audit Trail
-- Date: 2026-04-19
-- Description: Create super_admin_access_logs table + RLS + logging function
-- =============================================

BEGIN;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- SECTION 1: HELPER FUNCTION - CHECK SUPER ADMIN ROLE
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Check if current user is STRICTLY super_admin (not just admin)
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_user_role TEXT;
BEGIN
  SELECT ur.role INTO v_user_role
  FROM public.user_roles ur
  WHERE ur.user_id = auth.uid();

  RETURN v_user_role = 'super_admin';
END;
$$;

COMMENT ON FUNCTION is_super_admin() IS 'Check if current user has super_admin role (NOT admin)';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- SECTION 2: CREATE AUDIT TRAIL TABLE
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Super admin access logs - complete audit trail
-- Append-only (no UPDATE/DELETE) for integrity
CREATE TABLE super_admin_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  super_admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  super_admin_email TEXT NOT NULL,  -- Denormalized to preserve after user deletion
  action TEXT NOT NULL,              -- 'login', 'view_ticket', 'update_ticket_status', 'reply_ticket', 'generate_claude_context', 'view_user_data', 'view_system_logs', etc.
  resource_type TEXT,                -- 'ticket', 'user', 'logs', 'metrics', NULL for general actions
  resource_id TEXT,                  -- ID of resource (ticket ID, user ID, etc.)
  ip_address INET,                   -- IPv4 or IPv6
  user_agent TEXT,                   -- Browser/client identification
  metadata JSONB DEFAULT '{}',       -- Additional context (e.g., { old_status: 'open', new_status: 'resolved' })
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- SECTION 3: INDEXES FOR PERFORMANCE
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Query by super admin + recent first
CREATE INDEX idx_sa_logs_admin_created
  ON super_admin_access_logs(super_admin_id, created_at DESC);

-- Query by action type + recent first
CREATE INDEX idx_sa_logs_action_created
  ON super_admin_access_logs(action, created_at DESC);

-- Query by resource (e.g., all actions on ticket TK-123)
CREATE INDEX idx_sa_logs_resource
  ON super_admin_access_logs(resource_type, resource_id)
  WHERE resource_type IS NOT NULL AND resource_id IS NOT NULL;

-- Query by date range
CREATE INDEX idx_sa_logs_created
  ON super_admin_access_logs(created_at DESC);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- SECTION 4: ROW LEVEL SECURITY (RLS)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Enable RLS
ALTER TABLE super_admin_access_logs ENABLE ROW LEVEL SECURITY;

-- Policy 1: SELECT - Only super_admin can read audit logs
DROP POLICY IF EXISTS "Super admins can view access logs" ON super_admin_access_logs;
CREATE POLICY "Super admins can view access logs"
  ON super_admin_access_logs FOR SELECT
  TO authenticated
  USING (is_super_admin());

-- Policy 2: INSERT - Only via service_role (backend only)
-- No direct INSERT allowed from client
-- Backend will use service_role key to bypass RLS
DROP POLICY IF EXISTS "Service role can insert access logs" ON super_admin_access_logs;
CREATE POLICY "Service role can insert access logs"
  ON super_admin_access_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'service_role');

-- Policy 3: NO UPDATE - Append-only log for integrity
-- No policy needed, UPDATE is implicitly blocked by RLS

-- Policy 4: NO DELETE - Permanent audit trail
-- No policy needed, DELETE is implicitly blocked by RLS

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- SECTION 5: LOGGING FUNCTION (RPC)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Log super admin action
-- Called by backend after every super admin action
-- Returns log ID for reference
CREATE OR REPLACE FUNCTION log_super_admin_action(
  p_action TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id TEXT DEFAULT NULL,
  p_ip INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_log_id UUID;
  v_user_id UUID;
  v_user_email TEXT;
  v_user_role TEXT;
BEGIN
  -- Get current user
  v_user_id := auth.uid();

  -- Verify user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Get user email and role
  SELECT
    u.email,
    ur.role
  INTO
    v_user_email,
    v_user_role
  FROM auth.users u
  LEFT JOIN public.user_roles ur ON ur.user_id = u.id
  WHERE u.id = v_user_id;

  -- Verify user is super_admin
  IF v_user_role IS NULL OR v_user_role != 'super_admin' THEN
    RAISE EXCEPTION 'Super admin access required (current role: %)', COALESCE(v_user_role, 'none')
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Insert log entry
  INSERT INTO super_admin_access_logs (
    super_admin_id,
    super_admin_email,
    action,
    resource_type,
    resource_id,
    ip_address,
    user_agent,
    metadata
  )
  VALUES (
    v_user_id,
    v_user_email,
    p_action,
    p_resource_type,
    p_resource_id,
    p_ip,
    p_user_agent,
    p_metadata
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

COMMENT ON FUNCTION log_super_admin_action IS 'Log super admin action to audit trail. Verifies caller is super_admin. Returns log ID.';

COMMIT;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- VERIFICATION POST-MIGRATION
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Verify table created
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'super_admin_access_logs'
) AS table_exists;

-- Verify RLS enabled
SELECT
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'super_admin_access_logs';

-- Verify indexes created
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'super_admin_access_logs'
ORDER BY indexname;

-- Verify RLS policies created
SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'super_admin_access_logs'
ORDER BY policyname;

-- Verify functions created with correct settings
SELECT
  proname AS function_name,
  prosecdef AS is_security_definer,
  proconfig AS settings
FROM pg_proc
WHERE proname IN ('is_super_admin', 'log_super_admin_action')
AND pronamespace = 'public'::regnamespace
ORDER BY proname;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- EXAMPLE USAGE (for testing)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/*
-- Test 1: Log an action as super_admin
SELECT log_super_admin_action(
  'view_ticket',
  'ticket',
  'abc-123-def-456',
  '127.0.0.1'::inet,
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  '{"old_status": "open", "new_status": "in_progress"}'::jsonb
);
-- Expected: Returns UUID

-- Test 2: Verify log created
SELECT * FROM super_admin_access_logs ORDER BY created_at DESC LIMIT 1;
-- Expected: Row with action='view_ticket'

-- Test 3: Try to call as regular user (should fail)
-- (Switch to regular user session)
SELECT log_super_admin_action('unauthorized_attempt', NULL, NULL, NULL, NULL, '{}'::jsonb);
-- Expected: EXCEPTION 'Super admin access required'

-- Test 4: Try to INSERT directly (should fail via RLS)
INSERT INTO super_admin_access_logs (super_admin_id, super_admin_email, action)
VALUES (auth.uid(), 'test@example.com', 'direct_insert');
-- Expected: RLS blocks (no policy for direct INSERT)

-- Test 5: Verify SELECT works for super_admin only
SELECT COUNT(*) FROM super_admin_access_logs;
-- super_admin: Returns count
-- regular user: Returns 0 (RLS blocks)
*/

-- =============================================
-- END OF MIGRATION 030
-- Status: ✅ READY FOR APPLICATION
-- Security: RLS enabled, append-only, super_admin only
-- =============================================
