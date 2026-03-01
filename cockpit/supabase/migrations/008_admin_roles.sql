-- ═══════════════════════════════════════════════════════════════
-- THE HIVE OS V4 - Admin Roles System
-- Migration 008: Add role-based access control
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────
-- 1. Create user_roles table
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- ─────────────────────────────────────────────────────────────────
-- 2. Function to auto-create user role on signup
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION create_user_role()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_role();

-- ─────────────────────────────────────────────────────────────────
-- 3. Function to check if user is admin
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION is_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_role VARCHAR;
BEGIN
  SELECT role INTO v_role
  FROM user_roles
  WHERE user_id = p_user_id;

  RETURN v_role IN ('admin', 'super_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────
-- 4. Admin-only policies for user_roles table
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Users can view their own role
DROP POLICY IF EXISTS "Users can view own role" ON user_roles;
CREATE POLICY "Users can view own role"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all roles
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
CREATE POLICY "Admins can view all roles"
  ON user_roles FOR SELECT
  USING (is_admin(auth.uid()));

-- Only super_admins can update roles
DROP POLICY IF EXISTS "Super admins can update roles" ON user_roles;
CREATE POLICY "Super admins can update roles"
  ON user_roles FOR UPDATE
  USING (
    (SELECT role FROM user_roles WHERE user_id = auth.uid()) = 'super_admin'
  );

-- ─────────────────────────────────────────────────────────────────
-- 5. Admin view: All users with stats
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW admin_users_stats AS
SELECT
  u.id,
  u.email,
  u.created_at,
  u.last_sign_in_at,
  ur.role,
  COUNT(DISTINCT p.id) as project_count,
  COUNT(DISTINCT t.id) as task_count,
  COUNT(DISTINCT cs.id) as chat_session_count
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN projects p ON u.id = p.user_id
LEFT JOIN tasks t ON u.id = t.user_id
LEFT JOIN chat_sessions cs ON u.id = cs.user_id
GROUP BY u.id, u.email, u.created_at, u.last_sign_in_at, ur.role;

-- Policy: Only admins can view this
ALTER VIEW admin_users_stats SET (security_invoker = on);

-- ─────────────────────────────────────────────────────────────────
-- 6. Function to get global stats (admin only)
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_global_stats()
RETURNS JSON AS $$
DECLARE
  v_stats JSON;
BEGIN
  -- Only admins can call this
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM auth.users),
    'total_projects', (SELECT COUNT(*) FROM projects),
    'total_tasks', (SELECT COUNT(*) FROM tasks),
    'active_users_last_7_days', (
      SELECT COUNT(DISTINCT user_id) FROM projects WHERE created_at > NOW() - INTERVAL '7 days'
    ),
    'projects_created_today', (
      SELECT COUNT(*) FROM projects WHERE created_at::date = CURRENT_DATE
    ),
    'tasks_created_today', (
      SELECT COUNT(*) FROM tasks WHERE created_at::date = CURRENT_DATE
    )
  ) INTO v_stats;

  RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────
-- 7. Auto-promote founder to super_admin
-- ─────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_founder_id UUID;
BEGIN
  -- Get founder user ID
  SELECT id INTO v_founder_id
  FROM auth.users
  WHERE email = 'doffymelo@gmail.com';

  -- Promote to super_admin if exists
  IF v_founder_id IS NOT NULL THEN
    UPDATE user_roles
    SET role = 'super_admin', updated_at = NOW()
    WHERE user_id = v_founder_id;

    RAISE NOTICE 'User doffymelo@gmail.com promoted to super_admin';
  ELSE
    RAISE NOTICE 'User doffymelo@gmail.com not found - will be promoted on first login';
  END IF;
END $$;

COMMIT;

-- ═══════════════════════════════════════════════════════════════
-- VERIFICATION
-- ═══════════════════════════════════════════════════════════════

-- Check table exists
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'user_roles';

-- Check functions exist
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('is_admin', 'get_global_stats', 'create_user_role');

-- ═══════════════════════════════════════════════════════════════
-- USAGE
-- ═══════════════════════════════════════════════════════════════

-- To make a user admin (run as super_admin):
-- UPDATE user_roles SET role = 'admin' WHERE user_id = '<user-id>';

-- To make a user super_admin:
-- UPDATE user_roles SET role = 'super_admin' WHERE user_id = '<user-id>';

-- To check if current user is admin:
-- SELECT is_admin(auth.uid());

-- To get global stats:
-- SELECT get_global_stats();
