-- ============================================================================
-- MIGRATION 003: USER INTEGRATIONS
-- Table pour stocker les connexions OAuth et credentials des utilisateurs
-- (Meta Ads, GA4, GSC, CMS, Google Business Profile)
-- ============================================================================

-- Create ENUM for integration types
CREATE TYPE integration_type AS ENUM (
  'meta_ads',
  'google_analytics_4',
  'google_search_console',
  'google_business_profile',
  'wordpress',
  'shopify',
  'woocommerce',
  'webflow'
);

-- Create ENUM for integration status
CREATE TYPE integration_status AS ENUM (
  'connected',
  'disconnected',
  'error',
  'expired'
);

-- ============================================================================
-- TABLE: user_integrations
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Integration details
  integration_type integration_type NOT NULL,
  integration_name TEXT, -- Nom custom donné par l'utilisateur (ex: "Mon compte Meta principal")
  status integration_status NOT NULL DEFAULT 'disconnected',

  -- Credentials (ENCRYPTED avec Supabase Vault en production)
  -- Pour l'instant, stockage JSON simple (à migrer vers Vault plus tard)
  credentials JSONB NOT NULL DEFAULT '{}', -- { "access_token": "...", "refresh_token": "...", "account_id": "..." }

  -- Metadata
  connected_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  error_message TEXT,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Contrainte: Une seule intégration par type et par projet
  UNIQUE(project_id, integration_type)
);

-- ============================================================================
-- INDEX pour performances
-- ============================================================================
CREATE INDEX idx_user_integrations_project ON user_integrations(project_id);
CREATE INDEX idx_user_integrations_user ON user_integrations(user_id);
CREATE INDEX idx_user_integrations_type ON user_integrations(integration_type);
CREATE INDEX idx_user_integrations_status ON user_integrations(status);

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs ne peuvent voir que leurs propres intégrations
CREATE POLICY "Users can view their own integrations"
  ON user_integrations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent créer des intégrations pour leurs projets
CREATE POLICY "Users can create integrations for their projects"
  ON user_integrations
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = user_integrations.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Policy: Les utilisateurs peuvent modifier leurs propres intégrations
CREATE POLICY "Users can update their own integrations"
  ON user_integrations
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent supprimer leurs propres intégrations
CREATE POLICY "Users can delete their own integrations"
  ON user_integrations
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- FONCTION: Trigger pour updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_user_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_integrations_updated_at
  BEFORE UPDATE ON user_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_user_integrations_updated_at();

-- ============================================================================
-- FONCTION HELPER: Vérifier si une intégration est connectée
-- ============================================================================
CREATE OR REPLACE FUNCTION is_integration_connected(
  p_project_id UUID,
  p_integration_type integration_type
)
RETURNS BOOLEAN AS $$
DECLARE
  v_status integration_status;
BEGIN
  SELECT status INTO v_status
  FROM user_integrations
  WHERE project_id = p_project_id
    AND integration_type = p_integration_type
    AND user_id = auth.uid();

  RETURN v_status = 'connected';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FONCTION HELPER: Récupérer les credentials d'une intégration
-- ============================================================================
CREATE OR REPLACE FUNCTION get_integration_credentials(
  p_project_id UUID,
  p_integration_type integration_type
)
RETURNS JSONB AS $$
DECLARE
  v_credentials JSONB;
BEGIN
  SELECT credentials INTO v_credentials
  FROM user_integrations
  WHERE project_id = p_project_id
    AND integration_type = p_integration_type
    AND user_id = auth.uid()
    AND status = 'connected';

  RETURN v_credentials;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FONCTION HELPER: Lister toutes les intégrations d'un projet
-- ============================================================================
CREATE OR REPLACE FUNCTION get_project_integrations(p_project_id UUID)
RETURNS TABLE (
  id UUID,
  integration_type integration_type,
  integration_name TEXT,
  status integration_status,
  connected_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  error_message TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ui.id,
    ui.integration_type,
    ui.integration_name,
    ui.status,
    ui.connected_at,
    ui.last_sync_at,
    ui.expires_at,
    ui.error_message
  FROM user_integrations ui
  WHERE ui.project_id = p_project_id
    AND ui.user_id = auth.uid()
  ORDER BY ui.integration_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- DONNÉES DE TEST (optionnel - à supprimer en production)
-- ============================================================================
-- INSERT INTO user_integrations (project_id, user_id, integration_type, status, credentials)
-- VALUES (
--   (SELECT id FROM projects LIMIT 1),
--   auth.uid(),
--   'google_analytics_4',
--   'connected',
--   '{"property_id": "123456789", "access_token": "ya29.xxx"}'::jsonb
-- );

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================
