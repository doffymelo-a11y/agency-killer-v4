-- ═══════════════════════════════════════════════════════════════
-- THE HIVE OS V4 - Audit Logs
-- Migration: 007_audit_logs
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Who
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,

  -- What
  action VARCHAR(100) NOT NULL, -- 'create_campaign', 'scale_ad_set', 'delete_project', etc.
  resource_type VARCHAR(50), -- 'campaign', 'project', 'task', etc.
  resource_id TEXT,

  -- Details
  metadata JSONB, -- Full context (campaign_id, budget_change, etc.)

  -- When
  timestamp TIMESTAMPTZ DEFAULT NOW(),

  -- Where
  ip_address INET,
  user_agent TEXT,

  -- Result
  success BOOLEAN,
  error_message TEXT
);

-- Index for queries
CREATE INDEX idx_audit_logs_user_timestamp ON audit_logs(user_id, timestamp DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- Function to log action
CREATE OR REPLACE FUNCTION log_audit(
  p_user_id UUID,
  p_action VARCHAR,
  p_resource_type VARCHAR,
  p_resource_id TEXT,
  p_metadata JSONB,
  p_success BOOLEAN,
  p_error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    user_email,
    action,
    resource_type,
    resource_id,
    metadata,
    success,
    error_message
  )
  SELECT
    p_user_id,
    (SELECT email FROM auth.users WHERE id = p_user_id),
    p_action,
    p_resource_type,
    p_resource_id,
    p_metadata,
    p_success,
    p_error_message;
END;
$$ LANGUAGE plpgsql;
