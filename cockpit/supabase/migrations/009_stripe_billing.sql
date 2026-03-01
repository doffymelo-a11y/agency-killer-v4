-- ═══════════════════════════════════════════════════════════════
-- THE HIVE OS V4 - Stripe Billing System
-- Migration 009: Subscriptions, usage tracking, limits
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────
-- 1. Subscriptions table
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  -- Stripe IDs
  stripe_customer_id VARCHAR(255) UNIQUE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_price_id VARCHAR(255),

  -- Subscription details
  plan VARCHAR(20) NOT NULL DEFAULT 'free', -- free, pro, enterprise
  status VARCHAR(20) NOT NULL DEFAULT 'inactive', -- active, past_due, canceled, inactive

  -- Billing period
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- ─────────────────────────────────────────────────────────────────
-- 2. Usage tracking table
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Current month usage
  projects_created INT DEFAULT 0,
  tasks_created INT DEFAULT 0,
  chat_messages INT DEFAULT 0,
  agent_calls INT DEFAULT 0,

  -- Costs (in cents)
  total_cost_cents INT DEFAULT 0,

  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, period_start)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_period ON usage_tracking(period_start, period_end);

-- ─────────────────────────────────────────────────────────────────
-- 3. Plan limits configuration
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS plan_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan VARCHAR(20) NOT NULL UNIQUE,

  -- Limits
  max_projects INT,
  max_tasks_per_month INT,
  max_chat_messages_per_month INT,
  max_agent_calls_per_month INT,

  -- Pricing
  price_monthly_cents INT DEFAULT 0,
  stripe_price_id VARCHAR(255),

  -- Features
  features JSONB DEFAULT '[]'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default plans
INSERT INTO plan_limits (plan, max_projects, max_tasks_per_month, max_chat_messages_per_month, max_agent_calls_per_month, price_monthly_cents, features)
VALUES
  ('free', 1, 50, 100, 50, 0, '["Basic agents", "1 project", "Community support"]'),
  ('pro', 10, NULL, NULL, NULL, 7900, '["All agents", "10 projects", "Unlimited tasks", "Priority support", "Analytics"]'),
  ('enterprise', NULL, NULL, NULL, NULL, 29900, '["Everything in Pro", "Unlimited projects", "API access", "White-label", "Dedicated support"]')
ON CONFLICT (plan) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────
-- 4. Function to check usage limits
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION check_usage_limit(
  p_user_id UUID,
  p_limit_type VARCHAR -- 'projects', 'tasks', 'chat_messages', 'agent_calls'
)
RETURNS TABLE(allowed BOOLEAN, current_usage INT, limit_value INT, plan VARCHAR) AS $$
DECLARE
  v_subscription RECORD;
  v_usage RECORD;
  v_limit INT;
BEGIN
  -- Get user subscription
  SELECT * INTO v_subscription
  FROM subscriptions
  WHERE user_id = p_user_id;

  -- Default to free plan if no subscription
  IF v_subscription IS NULL THEN
    v_subscription.plan := 'free';
  END IF;

  -- Get current month usage
  SELECT * INTO v_usage
  FROM usage_tracking
  WHERE user_id = p_user_id
    AND period_start <= CURRENT_DATE
    AND period_end >= CURRENT_DATE;

  -- Get limit for this plan
  IF p_limit_type = 'projects' THEN
    SELECT max_projects INTO v_limit FROM plan_limits WHERE plan = v_subscription.plan;
    RETURN QUERY SELECT
      (SELECT COUNT(*) FROM projects WHERE user_id = p_user_id) < COALESCE(v_limit, 999999),
      (SELECT COUNT(*)::INT FROM projects WHERE user_id = p_user_id),
      COALESCE(v_limit, 999999),
      v_subscription.plan::VARCHAR;

  ELSIF p_limit_type = 'tasks' THEN
    SELECT max_tasks_per_month INTO v_limit FROM plan_limits WHERE plan = v_subscription.plan;
    RETURN QUERY SELECT
      COALESCE(v_usage.tasks_created, 0) < COALESCE(v_limit, 999999),
      COALESCE(v_usage.tasks_created, 0)::INT,
      COALESCE(v_limit, 999999),
      v_subscription.plan::VARCHAR;

  ELSIF p_limit_type = 'chat_messages' THEN
    SELECT max_chat_messages_per_month INTO v_limit FROM plan_limits WHERE plan = v_subscription.plan;
    RETURN QUERY SELECT
      COALESCE(v_usage.chat_messages, 0) < COALESCE(v_limit, 999999),
      COALESCE(v_usage.chat_messages, 0)::INT,
      COALESCE(v_limit, 999999),
      v_subscription.plan::VARCHAR;

  ELSIF p_limit_type = 'agent_calls' THEN
    SELECT max_agent_calls_per_month INTO v_limit FROM plan_limits WHERE plan = v_subscription.plan;
    RETURN QUERY SELECT
      COALESCE(v_usage.agent_calls, 0) < COALESCE(v_limit, 999999),
      COALESCE(v_usage.agent_calls, 0)::INT,
      COALESCE(v_limit, 999999),
      v_subscription.plan::VARCHAR;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────
-- 5. Function to increment usage
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id UUID,
  p_usage_type VARCHAR, -- 'tasks', 'chat_messages', 'agent_calls'
  p_increment INT DEFAULT 1
)
RETURNS VOID AS $$
DECLARE
  v_period_start DATE := DATE_TRUNC('month', CURRENT_DATE);
  v_period_end DATE := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE;
BEGIN
  -- Insert or update usage for current month
  INSERT INTO usage_tracking (
    user_id,
    period_start,
    period_end,
    tasks_created,
    chat_messages,
    agent_calls
  )
  VALUES (
    p_user_id,
    v_period_start,
    v_period_end,
    CASE WHEN p_usage_type = 'tasks' THEN p_increment ELSE 0 END,
    CASE WHEN p_usage_type = 'chat_messages' THEN p_increment ELSE 0 END,
    CASE WHEN p_usage_type = 'agent_calls' THEN p_increment ELSE 0 END
  )
  ON CONFLICT (user_id, period_start)
  DO UPDATE SET
    tasks_created = usage_tracking.tasks_created + CASE WHEN p_usage_type = 'tasks' THEN p_increment ELSE 0 END,
    chat_messages = usage_tracking.chat_messages + CASE WHEN p_usage_type = 'chat_messages' THEN p_increment ELSE 0 END,
    agent_calls = usage_tracking.agent_calls + CASE WHEN p_usage_type = 'agent_calls' THEN p_increment ELSE 0 END,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────────
-- 6. Auto-create subscription on signup
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_created_subscription ON auth.users;
CREATE TRIGGER on_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_subscription();

-- ─────────────────────────────────────────────────────────────────
-- 7. RLS Policies
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_limits ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view their own usage
DROP POLICY IF EXISTS "Users can view own usage" ON usage_tracking;
CREATE POLICY "Users can view own usage"
  ON usage_tracking FOR SELECT
  USING (auth.uid() = user_id);

-- Everyone can view plan limits
DROP POLICY IF EXISTS "Everyone can view plan limits" ON plan_limits;
CREATE POLICY "Everyone can view plan limits"
  ON plan_limits FOR SELECT
  USING (true);

COMMIT;

-- ═══════════════════════════════════════════════════════════════
-- VERIFICATION
-- ═══════════════════════════════════════════════════════════════

-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('subscriptions', 'usage_tracking', 'plan_limits');

-- Check plans inserted
SELECT plan, max_projects, price_monthly_cents FROM plan_limits;

-- ═══════════════════════════════════════════════════════════════
-- USAGE EXAMPLES
-- ═══════════════════════════════════════════════════════════════

-- Check if user can create a project:
-- SELECT * FROM check_usage_limit(auth.uid(), 'projects');

-- Check if user can create a task:
-- SELECT * FROM check_usage_limit(auth.uid(), 'tasks');

-- Increment task count:
-- SELECT increment_usage(auth.uid(), 'tasks', 1);

-- Increment chat message count:
-- SELECT increment_usage(auth.uid(), 'chat_messages', 1);
