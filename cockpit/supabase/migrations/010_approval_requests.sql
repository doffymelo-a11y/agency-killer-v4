-- ═══════════════════════════════════════════════════════════════
-- THE HIVE OS V4 - Migration 010: Approval Requests System
-- Enables AI agents to request human approval for risky actions
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- Table: approval_requests
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  -- Request details
  agent_id VARCHAR(20) NOT NULL CHECK (agent_id IN ('sora', 'marcus', 'luna', 'milo')),
  action VARCHAR(100) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,

  -- Risk assessment
  risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  estimated_cost_7_days NUMERIC(10, 2),
  currency VARCHAR(3) DEFAULT 'USD',

  -- Status tracking
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Additional context
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────
-- Indexes for Performance
-- ─────────────────────────────────────────────────────────────────

CREATE INDEX idx_approval_requests_user_id ON approval_requests(user_id);
CREATE INDEX idx_approval_requests_project_id ON approval_requests(project_id);
CREATE INDEX idx_approval_requests_status ON approval_requests(status);
CREATE INDEX idx_approval_requests_agent_id ON approval_requests(agent_id);
CREATE INDEX idx_approval_requests_expires_at ON approval_requests(expires_at);
CREATE INDEX idx_approval_requests_created_at ON approval_requests(created_at DESC);

-- Composite index for common queries (user's pending approvals)
CREATE INDEX idx_approval_requests_user_status ON approval_requests(user_id, status);

-- ─────────────────────────────────────────────────────────────────
-- RLS Policies
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own approval requests
CREATE POLICY "Users can view own approval requests"
  ON approval_requests
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert approval requests (agents will use service role)
CREATE POLICY "Users can create approval requests"
  ON approval_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending approval requests
CREATE POLICY "Users can update own pending approvals"
  ON approval_requests
  FOR UPDATE
  USING (
    auth.uid() = user_id
    AND status = 'pending'
    AND expires_at > NOW()
  )
  WITH CHECK (
    auth.uid() = user_id
    AND status IN ('approved', 'rejected')
  );

-- ─────────────────────────────────────────────────────────────────
-- Function: Auto-expire old approval requests
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION expire_old_approval_requests()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE approval_requests
  SET
    status = 'expired',
    updated_at = NOW()
  WHERE
    status = 'pending'
    AND expires_at < NOW();
END;
$$;

-- ─────────────────────────────────────────────────────────────────
-- Function: Update timestamp on approval_requests update
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_approval_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER approval_requests_updated_at
  BEFORE UPDATE ON approval_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_approval_requests_updated_at();

-- ─────────────────────────────────────────────────────────────────
-- RPC Function: Approve Request
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION approve_approval_request(
  p_approval_id UUID,
  p_user_id UUID
)
RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request approval_requests%ROWTYPE;
BEGIN
  -- Get the approval request
  SELECT * INTO v_request
  FROM approval_requests
  WHERE id = p_approval_id;

  -- Check if request exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Approval request not found';
    RETURN;
  END IF;

  -- Check ownership
  IF v_request.user_id != p_user_id THEN
    RETURN QUERY SELECT FALSE, 'Unauthorized: not your approval request';
    RETURN;
  END IF;

  -- Check if already processed
  IF v_request.status != 'pending' THEN
    RETURN QUERY SELECT FALSE, 'Request already processed: ' || v_request.status;
    RETURN;
  END IF;

  -- Check if expired
  IF v_request.expires_at < NOW() THEN
    UPDATE approval_requests
    SET status = 'expired', updated_at = NOW()
    WHERE id = p_approval_id;
    RETURN QUERY SELECT FALSE, 'Request has expired';
    RETURN;
  END IF;

  -- Approve the request
  UPDATE approval_requests
  SET
    status = 'approved',
    approved_by = p_user_id,
    approved_at = NOW(),
    updated_at = NOW()
  WHERE id = p_approval_id;

  RETURN QUERY SELECT TRUE, 'Request approved successfully';
END;
$$;

-- ─────────────────────────────────────────────────────────────────
-- RPC Function: Reject Request
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION reject_approval_request(
  p_approval_id UUID,
  p_user_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request approval_requests%ROWTYPE;
BEGIN
  -- Get the approval request
  SELECT * INTO v_request
  FROM approval_requests
  WHERE id = p_approval_id;

  -- Check if request exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Approval request not found';
    RETURN;
  END IF;

  -- Check ownership
  IF v_request.user_id != p_user_id THEN
    RETURN QUERY SELECT FALSE, 'Unauthorized: not your approval request';
    RETURN;
  END IF;

  -- Check if already processed
  IF v_request.status != 'pending' THEN
    RETURN QUERY SELECT FALSE, 'Request already processed: ' || v_request.status;
    RETURN;
  END IF;

  -- Reject the request
  UPDATE approval_requests
  SET
    status = 'rejected',
    approved_by = p_user_id,
    approved_at = NOW(),
    rejection_reason = p_reason,
    updated_at = NOW()
  WHERE id = p_approval_id;

  RETURN QUERY SELECT TRUE, 'Request rejected successfully';
END;
$$;

-- ─────────────────────────────────────────────────────────────────
-- Comments
-- ─────────────────────────────────────────────────────────────────

COMMENT ON TABLE approval_requests IS 'Stores approval requests from AI agents for risky actions';
COMMENT ON COLUMN approval_requests.agent_id IS 'Which AI agent is requesting approval (sora, marcus, luna, milo)';
COMMENT ON COLUMN approval_requests.risk_level IS 'Risk assessment: low, medium, high, critical';
COMMENT ON COLUMN approval_requests.estimated_cost_7_days IS 'Estimated financial impact over next 7 days';
COMMENT ON COLUMN approval_requests.expires_at IS 'Request expires after this timestamp';
COMMENT ON COLUMN approval_requests.metadata IS 'Additional context (campaign details, pixel IDs, etc.)';

-- ─────────────────────────────────────────────────────────────────
-- Insert version tracking
-- ─────────────────────────────────────────────────────────────────

INSERT INTO schema_migrations (version)
VALUES ('010')
ON CONFLICT (version) DO NOTHING;
