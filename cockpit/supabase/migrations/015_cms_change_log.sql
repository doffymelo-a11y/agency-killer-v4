-- ═══════════════════════════════════════════════════════════════
-- Migration 015 : CMS Change Log + RLS
-- Table pour stocker l'historique des changements CMS (rollback support)
-- ═══════════════════════════════════════════════════════════════

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. Table cms_change_log
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS public.cms_change_log (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,

  -- Change identification (du MCP server)
  change_id TEXT NOT NULL UNIQUE, -- UUID généré par le MCP server

  -- CMS metadata
  cms_type TEXT NOT NULL CHECK (cms_type IN ('wordpress', 'shopify', 'webflow')),
  site_url TEXT NOT NULL,

  -- Content metadata
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'page', 'product')),
  content_id TEXT NOT NULL, -- ID dans le CMS (peut être string ou number)
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),

  -- Snapshots pour rollback
  previous_state JSONB NOT NULL, -- État avant modification (pour rollback)
  new_state JSONB, -- État après modification (null pour delete)

  -- Change summary (pour affichage UI)
  change_summary JSONB NOT NULL, -- Format: { content_title, site_url, changes: [{field, before, after}] }

  -- Approval workflow
  requires_approval BOOLEAN NOT NULL DEFAULT true,
  approved BOOLEAN NOT NULL DEFAULT false,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Rollback tracking
  rolled_back BOOLEAN NOT NULL DEFAULT false,
  rolled_back_at TIMESTAMPTZ,
  rolled_back_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rollback_reason TEXT,

  -- Execution metadata
  executed_by_agent TEXT, -- 'luna', 'doffy', 'milo', etc.
  mcp_tool_name TEXT, -- Ex: 'update_cms_post'

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2. Indexes pour performance
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Index pour queries principales
CREATE INDEX idx_cms_change_log_user_id ON public.cms_change_log(user_id);
CREATE INDEX idx_cms_change_log_project_id ON public.cms_change_log(project_id);
CREATE INDEX idx_cms_change_log_change_id ON public.cms_change_log(change_id);
CREATE INDEX idx_cms_change_log_site_url ON public.cms_change_log(site_url);

-- Index pour approval workflow
CREATE INDEX idx_cms_change_log_approval_pending
  ON public.cms_change_log(user_id, requires_approval, approved)
  WHERE requires_approval = true AND approved = false AND rolled_back = false;

-- Index pour rollback queries
CREATE INDEX idx_cms_change_log_rolled_back
  ON public.cms_change_log(user_id, rolled_back)
  WHERE rolled_back = true;

-- Index pour queries par CMS type
CREATE INDEX idx_cms_change_log_cms_type ON public.cms_change_log(cms_type, user_id);

-- Index pour queries temporelles
CREATE INDEX idx_cms_change_log_created_at ON public.cms_change_log(created_at DESC);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3. Trigger updated_at
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TRIGGER update_cms_change_log_updated_at
  BEFORE UPDATE ON public.cms_change_log
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 4. RLS Policies
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE public.cms_change_log ENABLE ROW LEVEL SECURITY;

-- Policy SELECT : Voir uniquement ses propres changements
CREATE POLICY "cms_change_log_select_own"
  ON public.cms_change_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy INSERT : Service role UNIQUEMENT (créé par le backend)
-- Les users ne peuvent PAS insérer directement
CREATE POLICY "cms_change_log_insert_service_role"
  ON public.cms_change_log
  FOR INSERT
  WITH CHECK (false); -- Bloqué pour authenticated, service_role bypass RLS

-- Policy UPDATE : User peut approuver ses propres changements
-- Uniquement les champs approved, approved_at, rolled_back, rolled_back_at
CREATE POLICY "cms_change_log_update_approval"
  ON public.cms_change_log
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND (
      -- Peut approuver
      (OLD.approved = false AND NEW.approved = true)
      OR
      -- Peut rollback
      (OLD.rolled_back = false AND NEW.rolled_back = true)
    )
  );

-- Policy DELETE : Personne (même service_role garde historique)
CREATE POLICY "cms_change_log_delete_none"
  ON public.cms_change_log
  FOR DELETE
  USING (false);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 5. Fonction helper : get_pending_cms_approvals
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE OR REPLACE FUNCTION get_pending_cms_approvals(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  change_id TEXT,
  cms_type TEXT,
  site_url TEXT,
  content_type TEXT,
  content_id TEXT,
  action TEXT,
  change_summary JSONB,
  executed_by_agent TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cl.id,
    cl.change_id,
    cl.cms_type,
    cl.site_url,
    cl.content_type,
    cl.content_id,
    cl.action,
    cl.change_summary,
    cl.executed_by_agent,
    cl.created_at
  FROM public.cms_change_log cl
  WHERE cl.user_id = p_user_id
    AND cl.requires_approval = true
    AND cl.approved = false
    AND cl.rolled_back = false
  ORDER BY cl.created_at DESC;
END;
$$;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 6. Fonction helper : get_cms_change_history
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE OR REPLACE FUNCTION get_cms_change_history(
  p_user_id UUID,
  p_site_url TEXT DEFAULT NULL,
  p_limit INT DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  change_id TEXT,
  cms_type TEXT,
  site_url TEXT,
  content_type TEXT,
  content_id TEXT,
  action TEXT,
  change_summary JSONB,
  approved BOOLEAN,
  rolled_back BOOLEAN,
  executed_by_agent TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cl.id,
    cl.change_id,
    cl.cms_type,
    cl.site_url,
    cl.content_type,
    cl.content_id,
    cl.action,
    cl.change_summary,
    cl.approved,
    cl.rolled_back,
    cl.executed_by_agent,
    cl.created_at
  FROM public.cms_change_log cl
  WHERE cl.user_id = p_user_id
    AND (p_site_url IS NULL OR cl.site_url = p_site_url)
  ORDER BY cl.created_at DESC
  LIMIT p_limit;
END;
$$;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 7. Commentaires
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COMMENT ON TABLE public.cms_change_log IS 'Historique complet des modifications CMS avec support rollback';
COMMENT ON COLUMN public.cms_change_log.change_id IS 'UUID unique généré par le MCP server cms-connector';
COMMENT ON COLUMN public.cms_change_log.previous_state IS 'Snapshot JSON de l''état avant modification (pour rollback)';
COMMENT ON COLUMN public.cms_change_log.new_state IS 'Snapshot JSON de l''état après modification (null si delete)';
COMMENT ON COLUMN public.cms_change_log.change_summary IS 'Résumé des changements pour affichage UI (title, before/after)';
COMMENT ON COLUMN public.cms_change_log.requires_approval IS 'true si modification d''un contenu publié';
COMMENT ON COLUMN public.cms_change_log.rolled_back IS 'true si le changement a été annulé (rollback exécuté)';
