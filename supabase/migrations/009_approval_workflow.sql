-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 009: APPROVAL WORKFLOW - THE HIVE OS V4
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Purpose: Human-in-the-loop approvals for critical actions
-- Phase: 0 - Fondations Critiques
-- Date: 2026-02-19
--
-- What this migration does:
-- 1. Create approval_requests table
-- 2. Add helper functions for creating and processing approvals
-- 3. Add auto-expiration logic (requests expire after 24h)
-- 4. Add notification system for pending approvals
--
-- Security: Prevents agents from executing high-risk actions without user consent
--
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Approval Requests Table
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User & Project
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,

  -- Agent & Action
  agent_id TEXT NOT NULL, -- marcus, milo, luna, sora
  action TEXT NOT NULL, -- launch_campaign, generate_video, etc.

  -- Request Details
  title TEXT NOT NULL, -- "Lancement campagne Meta - €1500/jour"
  description TEXT NOT NULL, -- Detailed explanation
  risk_level TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, critical

  -- Cost Estimation (for financial approvals)
  estimated_cost_7_days DECIMAL(10, 2), -- e.g., €10,500 for 7 days at €1500/day
  currency TEXT DEFAULT 'EUR',

  -- Action Parameters (stored for execution after approval)
  action_params JSONB NOT NULL, -- Full parameters to execute the action

  -- Approval Status
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, expired, cancelled
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Expiration
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  expired_at TIMESTAMPTZ,

  -- Execution Tracking
  executed BOOLEAN NOT NULL DEFAULT FALSE,
  executed_at TIMESTAMPTZ,
  execution_result JSONB, -- Result of the action after approval

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_approval_requests_user_status
  ON approval_requests (user_id, status);

CREATE INDEX IF NOT EXISTS idx_approval_requests_project
  ON approval_requests (project_id)
  WHERE project_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_approval_requests_agent_action
  ON approval_requests (agent_id, action);

CREATE INDEX IF NOT EXISTS idx_approval_requests_status_expires
  ON approval_requests (status, expires_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_approval_requests_created
  ON approval_requests (created_at DESC);

-- Comments
COMMENT ON TABLE approval_requests IS
  'Human-in-the-loop approval requests for critical agent actions';
COMMENT ON COLUMN approval_requests.action_params IS
  'JSON parameters to execute the action after approval (e.g., campaign config)';
COMMENT ON COLUMN approval_requests.estimated_cost_7_days IS
  'Estimated cost for 7 days (for budget-based approvals)';
COMMENT ON COLUMN approval_requests.expires_at IS
  'Approval request expires after 24 hours if not acted upon';

-- ─────────────────────────────────────────────────────────────────────────
-- 2. Helper Function: Create Approval Request
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION create_approval_request(
  p_user_id UUID,
  p_project_id UUID,
  p_task_id UUID,
  p_agent_id TEXT,
  p_action TEXT,
  p_title TEXT,
  p_description TEXT,
  p_risk_level TEXT,
  p_estimated_cost_7_days DECIMAL,
  p_action_params JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request_id UUID;
BEGIN
  -- Insert approval request
  INSERT INTO approval_requests (
    user_id, project_id, task_id,
    agent_id, action,
    title, description, risk_level,
    estimated_cost_7_days, action_params
  ) VALUES (
    p_user_id, p_project_id, p_task_id,
    p_agent_id, p_action,
    p_title, p_description, p_risk_level,
    p_estimated_cost_7_days, p_action_params
  ) RETURNING id INTO v_request_id;

  RETURN v_request_id;
END;
$$;

COMMENT ON FUNCTION create_approval_request IS
  'Creates a new approval request for a critical action';

-- ─────────────────────────────────────────────────────────────────────────
-- 3. Helper Function: Approve Request
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION approve_request(
  p_request_id UUID,
  p_user_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  error_message TEXT,
  action_params JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request RECORD;
BEGIN
  -- Get request
  SELECT * INTO v_request
  FROM approval_requests
  WHERE id = p_request_id
    AND user_id = p_user_id; -- Security: Only owner can approve

  -- Check request exists
  IF v_request IS NULL THEN
    RETURN QUERY SELECT
      FALSE AS success,
      'Demande d''approbation introuvable ou accès refusé' AS error_message,
      NULL::JSONB AS action_params;
    RETURN;
  END IF;

  -- Check not already approved/rejected
  IF v_request.status != 'pending' THEN
    RETURN QUERY SELECT
      FALSE AS success,
      format('Demande déjà %s', v_request.status) AS error_message,
      NULL::JSONB AS action_params;
    RETURN;
  END IF;

  -- Check not expired
  IF NOW() > v_request.expires_at THEN
    -- Mark as expired
    UPDATE approval_requests
    SET status = 'expired',
        expired_at = NOW(),
        updated_at = NOW()
    WHERE id = p_request_id;

    RETURN QUERY SELECT
      FALSE AS success,
      'Demande expirée (>24h)' AS error_message,
      NULL::JSONB AS action_params;
    RETURN;
  END IF;

  -- Approve request
  UPDATE approval_requests
  SET status = 'approved',
      approved_by = p_user_id,
      approved_at = NOW(),
      updated_at = NOW()
  WHERE id = p_request_id;

  -- Return success with action params
  RETURN QUERY SELECT
    TRUE AS success,
    NULL::TEXT AS error_message,
    v_request.action_params AS action_params;
END;
$$;

COMMENT ON FUNCTION approve_request IS
  'Approves an approval request and returns action parameters for execution';

-- ─────────────────────────────────────────────────────────────────────────
-- 4. Helper Function: Reject Request
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION reject_request(
  p_request_id UUID,
  p_user_id UUID,
  p_rejection_reason TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request RECORD;
BEGIN
  -- Get request
  SELECT * INTO v_request
  FROM approval_requests
  WHERE id = p_request_id
    AND user_id = p_user_id; -- Security: Only owner can reject

  -- Check request exists
  IF v_request IS NULL THEN
    RETURN QUERY SELECT
      FALSE AS success,
      'Demande d''approbation introuvable ou accès refusé' AS error_message;
    RETURN;
  END IF;

  -- Check not already approved/rejected
  IF v_request.status != 'pending' THEN
    RETURN QUERY SELECT
      FALSE AS success,
      format('Demande déjà %s', v_request.status) AS error_message;
    RETURN;
  END IF;

  -- Reject request
  UPDATE approval_requests
  SET status = 'rejected',
      rejected_by = p_user_id,
      rejected_at = NOW(),
      rejection_reason = p_rejection_reason,
      updated_at = NOW()
  WHERE id = p_request_id;

  -- Return success
  RETURN QUERY SELECT
    TRUE AS success,
    NULL::TEXT AS error_message;
END;
$$;

COMMENT ON FUNCTION reject_request IS
  'Rejects an approval request with a reason';

-- ─────────────────────────────────────────────────────────────────────────
-- 5. Helper Function: Mark Request as Executed
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION mark_request_executed(
  p_request_id UUID,
  p_execution_result JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated BOOLEAN;
BEGIN
  -- Update request
  UPDATE approval_requests
  SET executed = TRUE,
      executed_at = NOW(),
      execution_result = p_execution_result,
      updated_at = NOW()
  WHERE id = p_request_id
    AND status = 'approved'
    AND executed = FALSE
  RETURNING TRUE INTO v_updated;

  RETURN COALESCE(v_updated, FALSE);
END;
$$;

COMMENT ON FUNCTION mark_request_executed IS
  'Marks an approved request as executed with result';

-- ─────────────────────────────────────────────────────────────────────────
-- 6. Helper Function: Get Pending Approvals for User
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_pending_approvals(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  agent_id TEXT,
  action TEXT,
  title TEXT,
  description TEXT,
  risk_level TEXT,
  estimated_cost_7_days DECIMAL,
  currency TEXT,
  created_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  expires_in_hours INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- First, auto-expire old requests
  UPDATE approval_requests
  SET status = 'expired',
      expired_at = NOW(),
      updated_at = NOW()
  WHERE user_id = p_user_id
    AND status = 'pending'
    AND NOW() > expires_at;

  -- Return pending requests
  RETURN QUERY
  SELECT
    ar.id,
    ar.agent_id,
    ar.action,
    ar.title,
    ar.description,
    ar.risk_level,
    ar.estimated_cost_7_days,
    ar.currency,
    ar.created_at,
    ar.expires_at,
    CEIL(EXTRACT(EPOCH FROM (ar.expires_at - NOW())) / 3600)::INTEGER AS expires_in_hours
  FROM approval_requests ar
  WHERE ar.user_id = p_user_id
    AND ar.status = 'pending'
    AND NOW() <= ar.expires_at
  ORDER BY ar.created_at DESC;
END;
$$;

COMMENT ON FUNCTION get_pending_approvals IS
  'Gets all pending approval requests for a user (auto-expires old ones)';

-- ─────────────────────────────────────────────────────────────────────────
-- 7. Trigger: Auto-expire old approval requests (scheduled)
-- ─────────────────────────────────────────────────────────────────────────

-- Note: Cette fonction sera appelée par un cron job (pg_cron ou Edge Function)
-- Pour l'instant, on l'intègre dans get_pending_approvals()

CREATE OR REPLACE FUNCTION expire_old_approval_requests()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_expired_count INTEGER;
BEGIN
  UPDATE approval_requests
  SET status = 'expired',
      expired_at = NOW(),
      updated_at = NOW()
  WHERE status = 'pending'
    AND NOW() > expires_at;

  GET DIAGNOSTICS v_expired_count = ROW_COUNT;

  RETURN v_expired_count;
END;
$$;

COMMENT ON FUNCTION expire_old_approval_requests IS
  'Expires approval requests that are older than 24 hours (run by cron)';

-- ─────────────────────────────────────────────────────────────────────────
-- 8. Trigger: Update updated_at on changes
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_approval_request_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_approval_request_timestamp ON approval_requests;

CREATE TRIGGER trigger_update_approval_request_timestamp
  BEFORE UPDATE ON approval_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_approval_request_updated_at();

-- ─────────────────────────────────────────────────────────────────────────
-- 9. Security: RLS Policies
-- ─────────────────────────────────────────────────────────────────────────

-- Enable RLS
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own approval requests
CREATE POLICY "Users can view their own approval requests"
  ON approval_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own pending requests (approve/reject)
CREATE POLICY "Users can update their own pending requests"
  ON approval_requests FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id);

-- System can insert approval requests (via SECURITY DEFINER functions)
CREATE POLICY "System can insert approval requests"
  ON approval_requests FOR INSERT
  WITH CHECK (true);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_approval_request(UUID, UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, DECIMAL, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_request(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_request(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_request_executed(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_approvals(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION expire_old_approval_requests() TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
-- ═══════════════════════════════════════════════════════════════════════════

-- Test queries (for verification):
--
-- 1. Create approval request:
--    SELECT create_approval_request(
--      auth.uid(), 'project-uuid', 'task-uuid', 'marcus', 'launch_campaign',
--      'Lancement campagne Meta - €1500/jour',
--      'Campagne Meta Ads avec budget quotidien de €1500 pour 7 jours',
--      'high', 10500.00,
--      '{"daily_budget": 1500, "campaign_name": "Test Campaign"}'::jsonb
--    );
--
-- 2. Get pending approvals:
--    SELECT * FROM get_pending_approvals(auth.uid());
--
-- 3. Approve request:
--    SELECT * FROM approve_request('request-uuid', auth.uid());
--
-- 4. Reject request:
--    SELECT * FROM reject_request('request-uuid', auth.uid(), 'Budget trop élevé');
--
-- 5. Mark as executed:
--    SELECT mark_request_executed(
--      'request-uuid',
--      '{"campaign_id": "123", "status": "active"}'::jsonb
--    );
