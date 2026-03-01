-- ═══════════════════════════════════════════════════════════════
-- THE HIVE OS V4 - User Integrations (OAuth2 Per-User)
-- Migration: 005_user_integrations
-- ═══════════════════════════════════════════════════════════════

-- Store OAuth2 credentials per user
CREATE TABLE user_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  platform VARCHAR(50) NOT NULL, -- 'google_ads', 'meta_ads', 'google_search_console'

  -- OAuth2 tokens (encrypted)
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,

  -- Platform-specific IDs
  ad_account_id TEXT, -- Meta: act_123, Google: customer_id

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  last_refreshed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, platform, ad_account_id)
);

-- RLS
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own integrations"
  ON user_integrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own integrations"
  ON user_integrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own integrations"
  ON user_integrations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own integrations"
  ON user_integrations FOR DELETE
  USING (auth.uid() = user_id);

-- Index
CREATE INDEX idx_user_integrations_user_platform ON user_integrations(user_id, platform);
