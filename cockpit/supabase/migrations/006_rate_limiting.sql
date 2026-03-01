-- ═══════════════════════════════════════════════════════════════
-- THE HIVE OS V4 - Rate Limiting
-- Migration: 006_rate_limiting
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE api_rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  endpoint VARCHAR(100) NOT NULL, -- 'create_campaign', 'scale_ad_set', etc.

  -- Sliding window counters
  requests_last_minute INT DEFAULT 0,
  requests_last_hour INT DEFAULT 0,
  requests_last_day INT DEFAULT 0,

  last_request_at TIMESTAMPTZ DEFAULT NOW(),

  -- Rate limit tiers (by subscription)
  tier VARCHAR(20) DEFAULT 'free', -- 'free', 'pro', 'enterprise'

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, endpoint)
);

-- Function to check rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_endpoint VARCHAR,
  p_tier VARCHAR DEFAULT 'free'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_limits RECORD;
  v_minute_limit INT;
  v_hour_limit INT;
  v_day_limit INT;
BEGIN
  -- Define limits by tier
  IF p_tier = 'free' THEN
    v_minute_limit := 10;
    v_hour_limit := 100;
    v_day_limit := 500;
  ELSIF p_tier = 'pro' THEN
    v_minute_limit := 60;
    v_hour_limit := 1000;
    v_day_limit := 10000;
  ELSE -- enterprise
    v_minute_limit := 300;
    v_hour_limit := 10000;
    v_day_limit := 100000;
  END IF;

  -- Get current limits
  SELECT * INTO v_limits
  FROM api_rate_limits
  WHERE user_id = p_user_id AND endpoint = p_endpoint;

  -- Check if exceeded
  IF v_limits.requests_last_minute >= v_minute_limit THEN
    RETURN FALSE;
  END IF;

  IF v_limits.requests_last_hour >= v_hour_limit THEN
    RETURN FALSE;
  END IF;

  IF v_limits.requests_last_day >= v_day_limit THEN
    RETURN FALSE;
  END IF;

  -- Increment counters
  INSERT INTO api_rate_limits (user_id, endpoint, tier, requests_last_minute, requests_last_hour, requests_last_day)
  VALUES (p_user_id, p_endpoint, p_tier, 1, 1, 1)
  ON CONFLICT (user_id, endpoint)
  DO UPDATE SET
    requests_last_minute = api_rate_limits.requests_last_minute + 1,
    requests_last_hour = api_rate_limits.requests_last_hour + 1,
    requests_last_day = api_rate_limits.requests_last_day + 1,
    last_request_at = NOW();

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
