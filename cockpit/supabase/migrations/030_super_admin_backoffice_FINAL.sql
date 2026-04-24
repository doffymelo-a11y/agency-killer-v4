-- ═══════════════════════════════════════════════════════════════
-- Migration 030: Super Admin Backoffice - FINAL CORRECTED VERSION
-- Fixed: No DECLARE variables to avoid PostgreSQL parsing issues
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- STEP 1: DROP EXISTING OBJECTS
-- ─────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Super admins can view access logs" ON super_admin_access_logs;
DROP POLICY IF EXISTS "System can insert access logs" ON super_admin_access_logs;

DROP FUNCTION IF EXISTS is_super_admin();
DROP FUNCTION IF EXISTS is_admin();
DROP FUNCTION IF EXISTS log_super_admin_action(TEXT, TEXT, TEXT, JSONB);

DROP INDEX IF EXISTS idx_super_admin_logs_admin_id;
DROP INDEX IF EXISTS idx_super_admin_logs_created_at;
DROP INDEX IF EXISTS idx_super_admin_logs_action;

DROP TABLE IF EXISTS super_admin_access_logs;

-- ─────────────────────────────────────────────────────────────────
-- STEP 2: CREATE TABLE
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE super_admin_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  super_admin_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────
-- STEP 3: CREATE INDEXES
-- ─────────────────────────────────────────────────────────────────

CREATE INDEX idx_super_admin_logs_admin_id ON super_admin_access_logs(super_admin_id);
CREATE INDEX idx_super_admin_logs_created_at ON super_admin_access_logs(created_at DESC);
CREATE INDEX idx_super_admin_logs_action ON super_admin_access_logs(action);

-- ─────────────────────────────────────────────────────────────────
-- STEP 4: ENABLE RLS
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE super_admin_access_logs ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────
-- STEP 5: CREATE SECURITY FUNCTIONS (NO DECLARE VARIABLES)
-- ─────────────────────────────────────────────────────────────────

-- Function to check if current user is super_admin
-- Uses EXISTS() directly without variables to avoid parsing issues
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
  );
END;
$$;

-- Function to check if current user is admin (admin OR super_admin)
-- Uses EXISTS() directly without variables
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  );
END;
$$;

-- ─────────────────────────────────────────────────────────────────
-- STEP 6: CREATE LOGGING FUNCTION (SIMPLIFIED)
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION log_super_admin_action(
  p_action TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  -- Verify user is super_admin (will raise exception if not)
  IF NOT (
    SELECT EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  ) THEN
    RAISE EXCEPTION 'Access denied: super_admin role required';
  END IF;

  -- Insert and return log ID
  RETURN (
    INSERT INTO public.super_admin_access_logs (
      super_admin_id,
      action,
      resource_type,
      resource_id,
      metadata
    )
    VALUES (
      auth.uid(),
      p_action,
      p_resource_type,
      p_resource_id,
      p_metadata
    )
    RETURNING id
  );
END;
$$;

-- ─────────────────────────────────────────────────────────────────
-- STEP 7: CREATE RLS POLICIES
-- ─────────────────────────────────────────────────────────────────

CREATE POLICY "Super admins can view access logs"
ON super_admin_access_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
  )
);

CREATE POLICY "System can insert access logs"
ON super_admin_access_logs
FOR INSERT
TO authenticated
WITH CHECK (super_admin_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────
-- STEP 8: VERIFICATION
-- ─────────────────────────────────────────────────────────────────

DO $$
BEGIN
  -- Verify table exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'super_admin_access_logs'
  ) THEN
    RAISE EXCEPTION 'Table super_admin_access_logs was not created';
  END IF;

  -- Verify functions exist
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_super_admin') THEN
    RAISE EXCEPTION 'Function is_super_admin was not created';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
    RAISE EXCEPTION 'Function is_admin was not created';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'log_super_admin_action') THEN
    RAISE EXCEPTION 'Function log_super_admin_action was not created';
  END IF;

  -- Verify RLS is enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'super_admin_access_logs'
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS is not enabled';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- SUCCESS MESSAGE
-- ═══════════════════════════════════════════════════════════════

SELECT '✅ Migration 030 completed successfully!' AS status;
SELECT 'Table: super_admin_access_logs' AS created;
SELECT 'Functions: is_super_admin(), is_admin(), log_super_admin_action()' AS created;
SELECT 'RLS enabled with 2 policies' AS security;
SELECT 'All verification tests passed ✓' AS tests;
