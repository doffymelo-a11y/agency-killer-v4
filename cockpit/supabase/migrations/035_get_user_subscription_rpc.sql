-- ═══════════════════════════════════════════════════════════════
-- THE HIVE OS V4 - Stripe Billing Completion
-- Migration 035: Add get_user_subscription RPC function
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────
-- Function to get user subscription with usage data
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_user_subscription(p_user_id UUID)
RETURNS TABLE(
  subscription_id UUID,
  plan VARCHAR,
  status VARCHAR,
  stripe_customer_id VARCHAR,
  stripe_subscription_id VARCHAR,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN,
  -- Usage data
  projects_created INT,
  tasks_created INT,
  chat_messages INT,
  agent_calls INT,
  -- Limits
  max_projects INT,
  max_tasks_per_month INT,
  max_chat_messages_per_month INT,
  max_agent_calls_per_month INT,
  -- Pricing
  price_monthly_cents INT,
  features JSONB
) AS $$
DECLARE
  v_subscription RECORD;
  v_usage RECORD;
  v_limits RECORD;
BEGIN
  -- Get subscription
  SELECT * INTO v_subscription
  FROM subscriptions
  WHERE user_id = p_user_id;

  -- Default to free plan if no subscription
  IF v_subscription IS NULL THEN
    v_subscription.plan := 'free';
    v_subscription.status := 'active';
  END IF;

  -- Get current month usage
  SELECT * INTO v_usage
  FROM usage_tracking
  WHERE user_id = p_user_id
    AND period_start <= CURRENT_DATE
    AND period_end >= CURRENT_DATE;

  -- Get plan limits
  SELECT * INTO v_limits
  FROM plan_limits
  WHERE plan = v_subscription.plan;

  -- Return combined data
  RETURN QUERY SELECT
    v_subscription.id,
    v_subscription.plan::VARCHAR,
    v_subscription.status::VARCHAR,
    v_subscription.stripe_customer_id::VARCHAR,
    v_subscription.stripe_subscription_id::VARCHAR,
    v_subscription.current_period_start,
    v_subscription.current_period_end,
    v_subscription.cancel_at_period_end,
    -- Usage (default to 0 if no usage record yet)
    COALESCE((SELECT COUNT(*)::INT FROM projects WHERE projects.user_id = p_user_id), 0),
    COALESCE(v_usage.tasks_created, 0)::INT,
    COALESCE(v_usage.chat_messages, 0)::INT,
    COALESCE(v_usage.agent_calls, 0)::INT,
    -- Limits
    v_limits.max_projects::INT,
    v_limits.max_tasks_per_month::INT,
    v_limits.max_chat_messages_per_month::INT,
    v_limits.max_agent_calls_per_month::INT,
    -- Pricing
    v_limits.price_monthly_cents::INT,
    v_limits.features;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_user_subscription(UUID) TO authenticated;

COMMIT;

-- ═══════════════════════════════════════════════════════════════
-- VERIFICATION
-- ═══════════════════════════════════════════════════════════════

-- Test function (replace with actual user_id):
-- SELECT * FROM get_user_subscription(auth.uid());
