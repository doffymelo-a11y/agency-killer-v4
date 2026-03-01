-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 010: FIX USER ID VALIDATION - CRITICAL SECURITY FIX
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Purpose: Fix user ID validation vulnerability in cost tracking and approval functions
-- Phase: 0 - Security Patch
-- Date: 2026-02-19
-- Priority: P0 - CRITICAL
--
-- What this migration does:
-- 1. Replace user_id parameters with auth.uid() in cost tracking functions
-- 2. Replace user_id parameters with auth.uid() in approval workflow functions
-- 3. Prevent quota bypass attacks
--
-- Security Impact: Prevents users from bypassing quotas by impersonating others
--
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- 1. COST TRACKING: Fix get_current_usage
-- ─────────────────────────────────────────────────────────────────────────

-- Drop old function
DROP FUNCTION IF EXISTS get_current_usage(UUID);

-- Create new function WITHOUT user_id parameter
CREATE OR REPLACE FUNCTION get_current_usage()
RETURNS TABLE (
  plan_type TEXT,
  plan_status TEXT,
  monthly_credits_limit INTEGER,
  current_month_credits_used DECIMAL(10, 2),
  credits_remaining DECIMAL(10, 2),
  usage_percent INTEGER,
  current_day_images INTEGER,
  current_day_videos INTEGER,
  current_day_audio INTEGER,
  can_generate_image BOOLEAN,
  can_generate_video BOOLEAN,
  can_generate_audio BOOLEAN,
  billing_cycle_days_remaining INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan RECORD;
  v_user_id UUID;
BEGIN
  -- Get authenticated user ID from JWT token
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Get user plan
  SELECT * INTO v_plan
  FROM user_plans
  WHERE user_id = v_user_id;

  -- If no plan exists, create a free plan
  IF v_plan IS NULL THEN
    INSERT INTO user_plans (user_id, plan_type, monthly_credits_limit)
    VALUES (v_user_id, 'free', 1000)
    RETURNING * INTO v_plan;
  END IF;

  -- Reset daily counters if new day
  IF v_plan.last_reset_date < CURRENT_DATE THEN
    UPDATE user_plans
    SET current_day_images = 0,
        current_day_videos = 0,
        current_day_audio = 0,
        last_reset_date = CURRENT_DATE
    WHERE user_id = v_user_id;

    -- Reload plan
    SELECT * INTO v_plan FROM user_plans WHERE user_id = v_user_id;
  END IF;

  -- Reset monthly credits if new billing cycle
  IF CURRENT_DATE > v_plan.billing_cycle_end THEN
    UPDATE user_plans
    SET current_month_credits_used = 0,
        billing_cycle_start = CURRENT_DATE,
        billing_cycle_end = CURRENT_DATE + INTERVAL '1 month'
    WHERE user_id = v_user_id;

    -- Reload plan
    SELECT * INTO v_plan FROM user_plans WHERE user_id = v_user_id;
  END IF;

  -- Return usage info
  RETURN QUERY SELECT
    v_plan.plan_type,
    v_plan.plan_status,
    v_plan.monthly_credits_limit,
    v_plan.current_month_credits_used,
    (v_plan.monthly_credits_limit - v_plan.current_month_credits_used)::DECIMAL(10,2) AS credits_remaining,
    ROUND((v_plan.current_month_credits_used / NULLIF(v_plan.monthly_credits_limit, 0)::DECIMAL) * 100)::INTEGER AS usage_percent,
    v_plan.current_day_images,
    v_plan.current_day_videos,
    v_plan.current_day_audio,
    (v_plan.plan_status = 'active' AND
     (v_plan.current_month_credits_used + 10 <= v_plan.monthly_credits_limit OR v_plan.overage_allowed) AND
     (v_plan.current_day_images < v_plan.max_images_per_day OR v_plan.max_images_per_day IS NULL)) AS can_generate_image,
    (v_plan.plan_status = 'active' AND
     (v_plan.current_month_credits_used + 100 <= v_plan.monthly_credits_limit OR v_plan.overage_allowed) AND
     (v_plan.current_day_videos < v_plan.max_videos_per_day OR v_plan.max_videos_per_day IS NULL)) AS can_generate_video,
    (v_plan.plan_status = 'active' AND
     (v_plan.current_month_credits_used + 5 <= v_plan.monthly_credits_limit OR v_plan.overage_allowed) AND
     (v_plan.current_day_audio < v_plan.max_audio_per_day OR v_plan.max_audio_per_day IS NULL)) AS can_generate_audio,
    (v_plan.billing_cycle_end - CURRENT_DATE)::INTEGER AS billing_cycle_days_remaining;
END;
$$;

COMMENT ON FUNCTION get_current_usage() IS
  'Gets current usage stats for authenticated user (uses auth.uid())';

-- ─────────────────────────────────────────────────────────────────────────
-- 2. COST TRACKING: Fix check_quota_before_operation
-- ─────────────────────────────────────────────────────────────────────────

-- Drop old function
DROP FUNCTION IF EXISTS check_quota_before_operation(UUID, TEXT, DECIMAL);

-- Create new function WITHOUT user_id parameter
CREATE OR REPLACE FUNCTION check_quota_before_operation(
  p_operation TEXT,
  p_credits_required DECIMAL(10, 2)
)
RETURNS TABLE (
  allowed BOOLEAN,
  error_code TEXT,
  error_message TEXT,
  credits_remaining DECIMAL(10, 2),
  usage_percent INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_usage RECORD;
  v_operation_type TEXT;
  v_user_id UUID;
BEGIN
  -- Get authenticated user ID from JWT token
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT
      FALSE AS allowed,
      'NOT_AUTHENTICATED' AS error_code,
      'Utilisateur non authentifié' AS error_message,
      0::DECIMAL(10, 2) AS credits_remaining,
      0 AS usage_percent;
    RETURN;
  END IF;

  -- Get current usage (now uses auth.uid() internally)
  SELECT * INTO v_usage
  FROM get_current_usage();

  -- Determine operation type
  v_operation_type := CASE
    WHEN p_operation LIKE '%image%' THEN 'image'
    WHEN p_operation LIKE '%video%' THEN 'video'
    WHEN p_operation LIKE '%audio%' OR p_operation LIKE '%speech%' THEN 'audio'
    ELSE 'other'
  END;

  -- Check plan status
  IF v_usage.plan_status != 'active' THEN
    RETURN QUERY SELECT
      FALSE AS allowed,
      'PLAN_SUSPENDED' AS error_code,
      'Votre abonnement est suspendu. Veuillez mettre à jour votre mode de paiement.' AS error_message,
      v_usage.credits_remaining,
      v_usage.usage_percent;
    RETURN;
  END IF;

  -- Check monthly credits
  IF v_usage.current_month_credits_used + p_credits_required > v_usage.monthly_credits_limit THEN
    IF NOT (SELECT overage_allowed FROM user_plans WHERE user_id = v_user_id) THEN
      RETURN QUERY SELECT
        FALSE AS allowed,
        'QUOTA_EXCEEDED' AS error_code,
        format('Quota mensuel dépassé (%s/%s crédits). Passez à un plan supérieur.',
          v_usage.current_month_credits_used, v_usage.monthly_credits_limit) AS error_message,
        v_usage.credits_remaining,
        v_usage.usage_percent;
      RETURN;
    END IF;
  END IF;

  -- Check daily limits
  IF v_operation_type = 'image' AND NOT v_usage.can_generate_image THEN
    RETURN QUERY SELECT
      FALSE AS allowed,
      'DAILY_LIMIT_REACHED' AS error_code,
      format('Limite quotidienne d''images atteinte (%s images générées aujourd''hui)',
        v_usage.current_day_images) AS error_message,
      v_usage.credits_remaining,
      v_usage.usage_percent;
    RETURN;
  END IF;

  IF v_operation_type = 'video' AND NOT v_usage.can_generate_video THEN
    RETURN QUERY SELECT
      FALSE AS allowed,
      'DAILY_LIMIT_REACHED' AS error_code,
      format('Limite quotidienne de vidéos atteinte (%s vidéos générées aujourd''hui)',
        v_usage.current_day_videos) AS error_message,
      v_usage.credits_remaining,
      v_usage.usage_percent;
    RETURN;
  END IF;

  IF v_operation_type = 'audio' AND NOT v_usage.can_generate_audio THEN
    RETURN QUERY SELECT
      FALSE AS allowed,
      'DAILY_LIMIT_REACHED' AS error_code,
      format('Limite quotidienne d''audio atteinte (%s audios générés aujourd''hui)',
        v_usage.current_day_audio) AS error_message,
      v_usage.credits_remaining,
      v_usage.usage_percent;
    RETURN;
  END IF;

  -- All checks passed
  RETURN QUERY SELECT
    TRUE AS allowed,
    NULL::TEXT AS error_code,
    NULL::TEXT AS error_message,
    v_usage.credits_remaining,
    v_usage.usage_percent;
END;
$$;

COMMENT ON FUNCTION check_quota_before_operation IS
  'Checks if authenticated user has sufficient quota (uses auth.uid())';

-- ─────────────────────────────────────────────────────────────────────────
-- 3. COST TRACKING: Fix record_api_usage
-- ─────────────────────────────────────────────────────────────────────────

-- Drop old function
DROP FUNCTION IF EXISTS record_api_usage(UUID, UUID, UUID, TEXT, TEXT, TEXT, TEXT, DECIMAL, DECIMAL, JSONB, JSONB, TEXT, TEXT);

-- Create new function WITHOUT user_id parameter
CREATE OR REPLACE FUNCTION record_api_usage(
  p_project_id UUID,
  p_task_id UUID,
  p_agent_id TEXT,
  p_operation TEXT,
  p_provider TEXT,
  p_model TEXT,
  p_credits_consumed DECIMAL(10, 2),
  p_cost_usd DECIMAL(10, 4),
  p_request_params JSONB DEFAULT NULL,
  p_response_metadata JSONB DEFAULT NULL,
  p_status TEXT DEFAULT 'success',
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_usage_id UUID;
  v_operation_type TEXT;
  v_user_id UUID;
BEGIN
  -- Get authenticated user ID from JWT token
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Insert usage record
  INSERT INTO api_usage_tracking (
    user_id, project_id, task_id, agent_id,
    operation, provider, model,
    credits_consumed, cost_usd,
    request_params, response_metadata,
    status, error_message
  ) VALUES (
    v_user_id, p_project_id, p_task_id, p_agent_id,
    p_operation, p_provider, p_model,
    p_credits_consumed, p_cost_usd,
    p_request_params, p_response_metadata,
    p_status, p_error_message
  ) RETURNING id INTO v_usage_id;

  -- Update user plan counters (only if success)
  IF p_status = 'success' THEN
    -- Update monthly credits
    UPDATE user_plans
    SET current_month_credits_used = current_month_credits_used + p_credits_consumed
    WHERE user_id = v_user_id;

    -- Determine operation type and update daily counter
    v_operation_type := CASE
      WHEN p_operation LIKE '%image%' THEN 'image'
      WHEN p_operation LIKE '%video%' THEN 'video'
      WHEN p_operation LIKE '%audio%' OR p_operation LIKE '%speech%' THEN 'audio'
      ELSE NULL
    END;

    IF v_operation_type = 'image' THEN
      UPDATE user_plans
      SET current_day_images = current_day_images + 1
      WHERE user_id = v_user_id;
    ELSIF v_operation_type = 'video' THEN
      UPDATE user_plans
      SET current_day_videos = current_day_videos + 1
      WHERE user_id = v_user_id;
    ELSIF v_operation_type = 'audio' THEN
      UPDATE user_plans
      SET current_day_audio = current_day_audio + 1
      WHERE user_id = v_user_id;
    END IF;
  END IF;

  RETURN v_usage_id;
END;
$$;

COMMENT ON FUNCTION record_api_usage IS
  'Records API usage for authenticated user (uses auth.uid())';

-- ─────────────────────────────────────────────────────────────────────────
-- 4. APPROVAL WORKFLOW: Fix get_pending_approvals
-- ─────────────────────────────────────────────────────────────────────────

-- Drop old function
DROP FUNCTION IF EXISTS get_pending_approvals(UUID);

-- Create new function WITHOUT user_id parameter
CREATE OR REPLACE FUNCTION get_pending_approvals()
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
DECLARE
  v_user_id UUID;
BEGIN
  -- Get authenticated user ID from JWT token
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- First, auto-expire old requests
  UPDATE approval_requests
  SET status = 'expired',
      expired_at = NOW(),
      updated_at = NOW()
  WHERE user_id = v_user_id
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
  WHERE ar.user_id = v_user_id
    AND ar.status = 'pending'
    AND NOW() <= ar.expires_at
  ORDER BY ar.created_at DESC;
END;
$$;

COMMENT ON FUNCTION get_pending_approvals IS
  'Gets pending approvals for authenticated user (uses auth.uid())';

-- ─────────────────────────────────────────────────────────────────────────
-- 5. APPROVAL WORKFLOW: Fix approve_request
-- ─────────────────────────────────────────────────────────────────────────

-- Drop old function
DROP FUNCTION IF EXISTS approve_request(UUID, UUID);

-- Create new function WITHOUT user_id parameter
CREATE OR REPLACE FUNCTION approve_request(p_request_id UUID)
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
  v_user_id UUID;
BEGIN
  -- Get authenticated user ID from JWT token
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT
      FALSE AS success,
      'Utilisateur non authentifié' AS error_message,
      NULL::JSONB AS action_params;
    RETURN;
  END IF;

  -- Get request
  SELECT * INTO v_request
  FROM approval_requests
  WHERE id = p_request_id
    AND user_id = v_user_id; -- Security: Only owner can approve

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
      approved_by = v_user_id,
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
  'Approves approval request for authenticated user (uses auth.uid())';

-- ─────────────────────────────────────────────────────────────────────────
-- 6. APPROVAL WORKFLOW: Fix reject_request
-- ─────────────────────────────────────────────────────────────────────────

-- Drop old function
DROP FUNCTION IF EXISTS reject_request(UUID, UUID, TEXT);

-- Create new function WITHOUT user_id parameter
CREATE OR REPLACE FUNCTION reject_request(
  p_request_id UUID,
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
  v_user_id UUID;
BEGIN
  -- Get authenticated user ID from JWT token
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT
      FALSE AS success,
      'Utilisateur non authentifié' AS error_message;
    RETURN;
  END IF;

  -- Get request
  SELECT * INTO v_request
  FROM approval_requests
  WHERE id = p_request_id
    AND user_id = v_user_id; -- Security: Only owner can reject

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
      rejected_by = v_user_id,
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
  'Rejects approval request for authenticated user (uses auth.uid())';

-- ─────────────────────────────────────────────────────────────────────────
-- 7. APPROVAL WORKFLOW: Fix create_approval_request
-- ─────────────────────────────────────────────────────────────────────────

-- Drop old function
DROP FUNCTION IF EXISTS create_approval_request(UUID, UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, DECIMAL, JSONB);

-- Create new function WITHOUT user_id parameter
CREATE OR REPLACE FUNCTION create_approval_request(
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
  v_user_id UUID;
BEGIN
  -- Get authenticated user ID from JWT token
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Insert approval request
  INSERT INTO approval_requests (
    user_id, project_id, task_id,
    agent_id, action,
    title, description, risk_level,
    estimated_cost_7_days, action_params
  ) VALUES (
    v_user_id, p_project_id, p_task_id,
    p_agent_id, p_action,
    p_title, p_description, p_risk_level,
    p_estimated_cost_7_days, p_action_params
  ) RETURNING id INTO v_request_id;

  RETURN v_request_id;
END;
$$;

COMMENT ON FUNCTION create_approval_request IS
  'Creates approval request for authenticated user (uses auth.uid())';

-- ─────────────────────────────────────────────────────────────────────────
-- 8. Update GRANT permissions for new function signatures
-- ─────────────────────────────────────────────────────────────────────────

-- Revoke old permissions (just in case)
REVOKE EXECUTE ON FUNCTION get_current_usage(UUID) FROM authenticated;
REVOKE EXECUTE ON FUNCTION check_quota_before_operation(UUID, TEXT, DECIMAL) FROM authenticated;
REVOKE EXECUTE ON FUNCTION record_api_usage(UUID, UUID, UUID, TEXT, TEXT, TEXT, TEXT, DECIMAL, DECIMAL, JSONB, JSONB, TEXT, TEXT) FROM authenticated;
REVOKE EXECUTE ON FUNCTION get_pending_approvals(UUID) FROM authenticated;
REVOKE EXECUTE ON FUNCTION approve_request(UUID, UUID) FROM authenticated;
REVOKE EXECUTE ON FUNCTION reject_request(UUID, UUID, TEXT) FROM authenticated;
REVOKE EXECUTE ON FUNCTION create_approval_request(UUID, UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, DECIMAL, JSONB) FROM authenticated;

-- Grant new permissions
GRANT EXECUTE ON FUNCTION get_current_usage() TO authenticated;
GRANT EXECUTE ON FUNCTION check_quota_before_operation(TEXT, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION record_api_usage(UUID, UUID, TEXT, TEXT, TEXT, TEXT, DECIMAL, DECIMAL, JSONB, JSONB, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_approvals() TO authenticated;
GRANT EXECUTE ON FUNCTION approve_request(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_request(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_approval_request(UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, DECIMAL, JSONB) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
-- ═══════════════════════════════════════════════════════════════════════════

-- Updated test queries:
--
-- 1. Get usage for current authenticated user:
--    SELECT * FROM get_current_usage();
--
-- 2. Check if current user can generate an image (10 credits):
--    SELECT * FROM check_quota_before_operation('generate_image', 10);
--
-- 3. Record a successful image generation for current user:
--    SELECT record_api_usage(
--      'project-uuid', 'task-uuid', 'milo',
--      'generate_image', 'nano-banana-pro', 'imagen-3-fast',
--      10.00, 0.04,
--      '{"prompt": "A cat", "size": "1024x1024"}'::jsonb,
--      '{"url": "https://...", "duration_ms": 2500}'::jsonb
--    );
--
-- 4. Get pending approvals for current user:
--    SELECT * FROM get_pending_approvals();
--
-- 5. Approve request:
--    SELECT * FROM approve_request('request-uuid');
--
-- 6. Reject request:
--    SELECT * FROM reject_request('request-uuid', 'Budget trop élevé');
