-- Migration 034: Telegram Integration for Support Tickets
-- Enables Telegram notifications and bot interactions for super admins

-- Table to store super admin Telegram chat IDs
CREATE TABLE super_admin_telegram_chat_ids (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  linked_at TIMESTAMPTZ DEFAULT NOW(),
  notif_preferences JSONB DEFAULT '{
    "critical": true,
    "high": true,
    "medium": false,
    "low": false
  }'::jsonb,
  is_active BOOLEAN DEFAULT TRUE
);

-- Index for fast lookup by chat_id (used in webhook callbacks)
CREATE INDEX idx_telegram_chat_id ON super_admin_telegram_chat_ids(chat_id);

-- Table to track Claude Agent sessions (for Phase 4, but create schema now)
CREATE TABLE claude_agent_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
  triggered_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'failed', 'rejected', 'merged', 'cancelled')),
  branch_name TEXT,
  pr_url TEXT,
  pr_number INT,
  diff_stats JSONB, -- {added, removed, files_changed}
  reasoning TEXT,
  cost_usd NUMERIC(10,4),
  duration_seconds INT,
  error TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_agent_sessions_ticket ON claude_agent_sessions(ticket_id);
CREATE INDEX idx_agent_sessions_status ON claude_agent_sessions(status, started_at DESC);
CREATE INDEX idx_agent_sessions_triggered_by ON claude_agent_sessions(triggered_by);

-- RLS Policies for super_admin_telegram_chat_ids
ALTER TABLE super_admin_telegram_chat_ids ENABLE ROW LEVEL SECURITY;

-- Super admins can view all telegram chat IDs
CREATE POLICY "Super admins can view telegram chat IDs"
ON super_admin_telegram_chat_ids FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
  )
);

-- Super admins can update their own chat ID
CREATE POLICY "Super admins can update own telegram chat ID"
ON super_admin_telegram_chat_ids FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Backend service role can insert (for /start flow)
CREATE POLICY "Service role can insert telegram chat IDs"
ON super_admin_telegram_chat_ids FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = super_admin_telegram_chat_ids.user_id
    AND role = 'super_admin'
  )
);

-- RLS Policies for claude_agent_sessions
ALTER TABLE claude_agent_sessions ENABLE ROW LEVEL SECURITY;

-- Super admins can view all sessions
CREATE POLICY "Super admins can view agent sessions"
ON claude_agent_sessions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
  )
);

-- Comments
COMMENT ON TABLE super_admin_telegram_chat_ids IS 'Links super admin user accounts to their Telegram chat IDs for bot notifications';
COMMENT ON TABLE claude_agent_sessions IS 'Tracks Claude Agent SDK sessions for automated ticket fixes (Phase 4)';
COMMENT ON COLUMN super_admin_telegram_chat_ids.notif_preferences IS 'JSON object controlling which priority levels trigger Telegram notifications';
