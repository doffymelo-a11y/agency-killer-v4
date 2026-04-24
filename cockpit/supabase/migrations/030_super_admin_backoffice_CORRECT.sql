-- ═══════════════════════════════════════════════════════════════
-- Migration 030: Super Admin Backoffice - CORRECT VERSION
-- Sans erreurs de syntaxe ni de parsing
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- STEP 1: NETTOYAGE
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
-- STEP 2: CRÉATION TABLE
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
-- STEP 3: INDEXES
-- ─────────────────────────────────────────────────────────────────

CREATE INDEX idx_super_admin_logs_admin_id ON super_admin_access_logs(super_admin_id);
CREATE INDEX idx_super_admin_logs_created_at ON super_admin_access_logs(created_at DESC);
CREATE INDEX idx_super_admin_logs_action ON super_admin_access_logs(action);

-- ─────────────────────────────────────────────────────────────────
-- STEP 4: RLS
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE super_admin_access_logs ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────
-- STEP 5: FONCTIONS DE SÉCURITÉ
-- ─────────────────────────────────────────────────────────────────

-- Vérification super_admin (sans variable DECLARE)
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

-- Vérification admin (sans variable DECLARE)
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
-- STEP 6: FONCTION DE LOGGING (SYNTAXE CORRECTE)
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
DECLARE
  v_log_id UUID;
BEGIN
  -- Vérifier que l'utilisateur est super_admin
  IF NOT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: super_admin role required';
  END IF;

  -- Insérer le log et récupérer l'ID
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
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- ─────────────────────────────────────────────────────────────────
-- STEP 7: POLICIES RLS
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
-- STEP 8: TESTS DE VÉRIFICATION
-- ─────────────────────────────────────────────────────────────────

DO $$
BEGIN
  -- Test 1: Table existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'super_admin_access_logs'
  ) THEN
    RAISE EXCEPTION 'Table non créée';
  END IF;

  -- Test 2: Fonctions existent
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_super_admin') THEN
    RAISE EXCEPTION 'Fonction is_super_admin non créée';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
    RAISE EXCEPTION 'Fonction is_admin non créée';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'log_super_admin_action') THEN
    RAISE EXCEPTION 'Fonction log_super_admin_action non créée';
  END IF;

  -- Test 3: RLS activé
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'super_admin_access_logs'
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS non activé';
  END IF;

  RAISE NOTICE '✅ Tous les tests sont passés';
END $$;

-- ═══════════════════════════════════════════════════════════════
-- MESSAGE DE SUCCÈS
-- ═══════════════════════════════════════════════════════════════

SELECT '✅ Migration 030 terminée avec succès' AS status;
SELECT 'Table: super_admin_access_logs créée' AS details;
SELECT 'Fonctions: is_super_admin(), is_admin(), log_super_admin_action()' AS details;
SELECT 'RLS: activé avec 2 policies' AS details;
SELECT 'Tests: tous passés ✓' AS details;
