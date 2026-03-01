-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 008: API USAGE TRACKING & COST MANAGEMENT - THE HIVE OS V4
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Purpose: Track API usage, enforce quotas, prevent budget overruns
-- Phase: 0 - Fondations Critiques
-- Date: 2026-02-19
--
-- What this migration does:
-- 1. Create api_usage_tracking table (track every API call)
-- 2. Create user_plans table (quotas and limits per user)
-- 3. Create usage_alerts table (log when users hit thresholds)
-- 4. Add helper functions for quota checking
-- 5. Add trigger for automatic alerting
--
-- Security: Prevents users from overspending, enforces fair usage
--
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- 1. API Usage Tracking Table
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS api_usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User & Project
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  agent_id TEXT NOT NULL, -- luna, milo, marcus, sora

  -- API Call Details
  operation TEXT NOT NULL, -- generate_image, generate_video, text_to_speech, etc.
  provider TEXT NOT NULL, -- nano-banana-pro, veo-3, elevenlabs, openai, anthropic
  model TEXT, -- imagen-3-fast, veo-2, eleven_multilingual_v2, gpt-4o, claude-opus-4.5

  -- Cost & Credits
  credits_consumed DECIMAL(10, 2) NOT NULL, -- e.g., 10.00 credits
  cost_usd DECIMAL(10, 4) NOT NULL, -- e.g., 0.1200 USD

  -- Request/Response Metadata
  request_params JSONB, -- {prompt: "...", size: "1024x1024", quality: "hd"}
  response_metadata JSONB, -- {duration_ms: 3500, tokens_used: 1250, url: "..."}
  status TEXT NOT NULL DEFAULT 'success', -- success, failed, quota_exceeded
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Partitioning key (for future partitioning by month)
  month_partition TEXT GENERATED ALWAYS AS (to_char(created_at, 'YYYY-MM')) STORED
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_usage_user_created
  ON api_usage_tracking (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_api_usage_project
  ON api_usage_tracking (project_id)
  WHERE project_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_api_usage_agent_operation
  ON api_usage_tracking (agent_id, operation);

CREATE INDEX IF NOT EXISTS idx_api_usage_status
  ON api_usage_tracking (status)
  WHERE status != 'success';

CREATE INDEX IF NOT EXISTS idx_api_usage_month_partition
  ON api_usage_tracking (month_partition);

-- Comments
COMMENT ON TABLE api_usage_tracking IS
  'Tracks every API call made by users with cost and credits consumed';
COMMENT ON COLUMN api_usage_tracking.credits_consumed IS
  'Internal credits consumed (10 credits = 1 image, 100 credits = 1 video)';
COMMENT ON COLUMN api_usage_tracking.cost_usd IS
  'Actual cost in USD charged by the provider';

-- ─────────────────────────────────────────────────────────────────────────
-- 2. User Plans & Quotas Table
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Plan Details
  plan_type TEXT NOT NULL DEFAULT 'free', -- free, starter, pro, enterprise
  plan_status TEXT NOT NULL DEFAULT 'active', -- active, suspended, cancelled

  -- Quotas (monthly)
  monthly_credits_limit INTEGER NOT NULL DEFAULT 1000, -- 1000 credits/month for free
  current_month_credits_used DECIMAL(10, 2) NOT NULL DEFAULT 0,

  -- Usage Limits (per operation type)
  max_images_per_day INTEGER DEFAULT 50,
  max_videos_per_day INTEGER DEFAULT 10,
  max_audio_per_day INTEGER DEFAULT 30,

  -- Current Day Counters (reset daily)
  current_day_images INTEGER NOT NULL DEFAULT 0,
  current_day_videos INTEGER NOT NULL DEFAULT 0,
  current_day_audio INTEGER NOT NULL DEFAULT 0,
  last_reset_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Billing
  billing_cycle_start DATE NOT NULL DEFAULT CURRENT_DATE,
  billing_cycle_end DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 month'),
  overage_allowed BOOLEAN NOT NULL DEFAULT FALSE, -- Can exceed quota?
  overage_rate_per_credit DECIMAL(10, 4) DEFAULT 0.01, -- $0.01 per credit

  -- Metadata
  metadata JSONB, -- {stripe_customer_id: "...", last_payment: "..."}

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_plans_user
  ON user_plans (user_id);

CREATE INDEX IF NOT EXISTS idx_user_plans_status
  ON user_plans (plan_status);

-- Comments
COMMENT ON TABLE user_plans IS
  'User subscription plans, quotas, and usage limits';
COMMENT ON COLUMN user_plans.monthly_credits_limit IS
  'Total credits allowed per billing cycle';
COMMENT ON COLUMN user_plans.current_month_credits_used IS
  'Credits consumed in current billing cycle';

-- ─────────────────────────────────────────────────────────────────────────
-- 3. Usage Alerts Table
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS usage_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  alert_type TEXT NOT NULL, -- quota_80_percent, quota_100_percent, daily_limit_reached
  threshold_percent INTEGER, -- 80, 90, 100
  message TEXT NOT NULL,

  -- Current usage at time of alert
  current_credits_used DECIMAL(10, 2),
  credits_limit INTEGER,

  -- Notification
  notification_sent BOOLEAN NOT NULL DEFAULT FALSE,
  notification_sent_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_usage_alerts_user_created
  ON usage_alerts (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_usage_alerts_type
  ON usage_alerts (alert_type);

-- Comments
COMMENT ON TABLE usage_alerts IS
  'Logs usage alerts when users approach or exceed quotas';

-- ─────────────────────────────────────────────────────────────────────────
-- 4. Helper Function: Get Current Usage for User
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_current_usage(p_user_id UUID)
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
BEGIN
  -- Get user plan
  SELECT * INTO v_plan
  FROM user_plans
  WHERE user_id = p_user_id;

  -- If no plan exists, create a free plan
  IF v_plan IS NULL THEN
    INSERT INTO user_plans (user_id, plan_type, monthly_credits_limit)
    VALUES (p_user_id, 'free', 1000)
    RETURNING * INTO v_plan;
  END IF;

  -- Reset daily counters if new day
  IF v_plan.last_reset_date < CURRENT_DATE THEN
    UPDATE user_plans
    SET current_day_images = 0,
        current_day_videos = 0,
        current_day_audio = 0,
        last_reset_date = CURRENT_DATE
    WHERE user_id = p_user_id;

    -- Reload plan
    SELECT * INTO v_plan FROM user_plans WHERE user_id = p_user_id;
  END IF;

  -- Reset monthly credits if new billing cycle
  IF CURRENT_DATE > v_plan.billing_cycle_end THEN
    UPDATE user_plans
    SET current_month_credits_used = 0,
        billing_cycle_start = CURRENT_DATE,
        billing_cycle_end = CURRENT_DATE + INTERVAL '1 month'
    WHERE user_id = p_user_id;

    -- Reload plan
    SELECT * INTO v_plan FROM user_plans WHERE user_id = p_user_id;
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

COMMENT ON FUNCTION get_current_usage(UUID) IS
  'Gets current usage stats for a user with quota checks';

-- ─────────────────────────────────────────────────────────────────────────
-- 5. Helper Function: Check if Operation is Allowed
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION check_quota_before_operation(
  p_user_id UUID,
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
BEGIN
  -- Get current usage
  SELECT * INTO v_usage
  FROM get_current_usage(p_user_id);

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
    IF NOT (SELECT overage_allowed FROM user_plans WHERE user_id = p_user_id) THEN
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
  'Checks if user has sufficient quota to perform an operation';

-- ─────────────────────────────────────────────────────────────────────────
-- 6. Helper Function: Record API Usage
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION record_api_usage(
  p_user_id UUID,
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
BEGIN
  -- Insert usage record
  INSERT INTO api_usage_tracking (
    user_id, project_id, task_id, agent_id,
    operation, provider, model,
    credits_consumed, cost_usd,
    request_params, response_metadata,
    status, error_message
  ) VALUES (
    p_user_id, p_project_id, p_task_id, p_agent_id,
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
    WHERE user_id = p_user_id;

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
      WHERE user_id = p_user_id;
    ELSIF v_operation_type = 'video' THEN
      UPDATE user_plans
      SET current_day_videos = current_day_videos + 1
      WHERE user_id = p_user_id;
    ELSIF v_operation_type = 'audio' THEN
      UPDATE user_plans
      SET current_day_audio = current_day_audio + 1
      WHERE user_id = p_user_id;
    END IF;
  END IF;

  RETURN v_usage_id;
END;
$$;

COMMENT ON FUNCTION record_api_usage IS
  'Records an API usage event and updates user quotas';

-- ─────────────────────────────────────────────────────────────────────────
-- 7. Trigger: Auto-create usage alerts
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION create_usage_alert_if_threshold()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_usage_percent INTEGER;
  v_last_alert RECORD;
BEGIN
  -- Calculate usage percentage
  v_usage_percent := ROUND((NEW.current_month_credits_used / NULLIF(NEW.monthly_credits_limit, 0)::DECIMAL) * 100)::INTEGER;

  -- Check 80% threshold
  IF v_usage_percent >= 80 AND v_usage_percent < 100 THEN
    -- Check if alert already sent today
    SELECT * INTO v_last_alert
    FROM usage_alerts
    WHERE user_id = NEW.user_id
      AND alert_type = 'quota_80_percent'
      AND created_at::DATE = CURRENT_DATE;

    IF v_last_alert IS NULL THEN
      INSERT INTO usage_alerts (
        user_id, alert_type, threshold_percent, message,
        current_credits_used, credits_limit
      ) VALUES (
        NEW.user_id, 'quota_80_percent', 80,
        format('Vous avez utilisé %s%% de votre quota mensuel (%s/%s crédits)',
          v_usage_percent, NEW.current_month_credits_used, NEW.monthly_credits_limit),
        NEW.current_month_credits_used, NEW.monthly_credits_limit
      );
    END IF;
  END IF;

  -- Check 100% threshold
  IF v_usage_percent >= 100 THEN
    -- Check if alert already sent today
    SELECT * INTO v_last_alert
    FROM usage_alerts
    WHERE user_id = NEW.user_id
      AND alert_type = 'quota_100_percent'
      AND created_at::DATE = CURRENT_DATE;

    IF v_last_alert IS NULL THEN
      INSERT INTO usage_alerts (
        user_id, alert_type, threshold_percent, message,
        current_credits_used, credits_limit
      ) VALUES (
        NEW.user_id, 'quota_100_percent', 100,
        format('⚠️ QUOTA DÉPASSÉ: %s%% utilisés (%s/%s crédits). Passez à un plan supérieur.',
          v_usage_percent, NEW.current_month_credits_used, NEW.monthly_credits_limit),
        NEW.current_month_credits_used, NEW.monthly_credits_limit
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_create_usage_alerts ON user_plans;

CREATE TRIGGER trigger_create_usage_alerts
  AFTER UPDATE OF current_month_credits_used ON user_plans
  FOR EACH ROW
  WHEN (NEW.current_month_credits_used > OLD.current_month_credits_used)
  EXECUTE FUNCTION create_usage_alert_if_threshold();

-- ─────────────────────────────────────────────────────────────────────────
-- 8. Security: RLS Policies
-- ─────────────────────────────────────────────────────────────────────────

-- Enable RLS
ALTER TABLE api_usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_alerts ENABLE ROW LEVEL SECURITY;

-- api_usage_tracking policies
CREATE POLICY "Users can view their own usage"
  ON api_usage_tracking FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert usage records"
  ON api_usage_tracking FOR INSERT
  WITH CHECK (true); -- Inserts come from SECURITY DEFINER functions

-- user_plans policies
CREATE POLICY "Users can view their own plan"
  ON user_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own plan metadata"
  ON user_plans FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- usage_alerts policies
CREATE POLICY "Users can view their own alerts"
  ON usage_alerts FOR SELECT
  USING (auth.uid() = user_id);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_current_usage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_quota_before_operation(UUID, TEXT, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION record_api_usage(UUID, UUID, UUID, TEXT, TEXT, TEXT, TEXT, DECIMAL, DECIMAL, JSONB, JSONB, TEXT, TEXT) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
-- ═══════════════════════════════════════════════════════════════════════════

-- Test queries (for verification):
--
-- 1. Get usage for current user:
--    SELECT * FROM get_current_usage(auth.uid());
--
-- 2. Check if user can generate an image (10 credits):
--    SELECT * FROM check_quota_before_operation(auth.uid(), 'generate_image', 10);
--
-- 3. Record a successful image generation:
--    SELECT record_api_usage(
--      auth.uid(), 'project-uuid', 'task-uuid', 'milo',
--      'generate_image', 'nano-banana-pro', 'imagen-3-fast',
--      10.00, 0.04,
--      '{"prompt": "A cat", "size": "1024x1024"}'::jsonb,
--      '{"url": "https://...", "duration_ms": 2500}'::jsonb
--    );
--
-- 4. Get all usage for current month:
--    SELECT * FROM api_usage_tracking
--    WHERE user_id = auth.uid() AND month_partition = to_char(NOW(), 'YYYY-MM')
--    ORDER BY created_at DESC;
