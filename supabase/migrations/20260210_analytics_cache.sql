-- ═══════════════════════════════════════════════════════════════
-- Analytics Cache System
-- Prevents API rate limits and reduces latency
-- ═══════════════════════════════════════════════════════════════

-- Create analytics_cache table
CREATE TABLE IF NOT EXISTS analytics_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Cache key components
  source TEXT NOT NULL, -- 'ga4', 'meta_ads', 'google_ads', 'gtm', 'looker'
  endpoint TEXT NOT NULL, -- 'get_metrics', 'list_campaigns', etc.
  params_hash TEXT NOT NULL, -- MD5 hash of request parameters (date ranges, filters, etc.)

  -- Cached data
  data JSONB NOT NULL,

  -- Cache metadata
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  cache_hit_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint on cache key
  CONSTRAINT analytics_cache_unique_key UNIQUE (project_id, source, endpoint, params_hash)
);

-- Create indexes for fast lookups
CREATE INDEX idx_analytics_cache_project_source ON analytics_cache (project_id, source);
CREATE INDEX idx_analytics_cache_expires_at ON analytics_cache (expires_at);
CREATE INDEX idx_analytics_cache_params_hash ON analytics_cache (params_hash);

-- Create function to clean expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_analytics_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM analytics_cache
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create scheduled job to clean cache every hour (requires pg_cron extension)
-- Note: Enable pg_cron extension first: CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('clean-analytics-cache', '0 * * * *', 'SELECT clean_expired_analytics_cache()');

-- Add comment
COMMENT ON TABLE analytics_cache IS 'Caches analytics API responses to prevent rate limits and reduce latency. TTL varies by source: GA4 (5min), Ads (15min), GTM (60min)';

-- ═══════════════════════════════════════════════════════════════
-- Cache TTL Configuration (for reference)
-- ═══════════════════════════════════════════════════════════════

/*
Recommended TTL by source:

- GA4 (Google Analytics 4): 5 minutes
  → Data updates every 24-48 hours, but users expect "real-time"
  → High request volume, 10,000 requests/day limit

- Meta Ads: 15 minutes
  → Data updates every 15 minutes
  → Rate limit: 200 calls/hour

- Google Ads: 15 minutes
  → Data updates every few hours
  → Rate limit: 10,000 requests/day

- GTM (Google Tag Manager): 60 minutes
  → Configuration rarely changes
  → No strict rate limits but courtesy cache

- Looker Studio: 30 minutes
  → Dashboard data, moderate refresh needs
  → No strict rate limits
*/

-- ═══════════════════════════════════════════════════════════════
-- Helper function to check cache validity
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_cached_analytics(
  p_project_id UUID,
  p_source TEXT,
  p_endpoint TEXT,
  p_params_hash TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_cache_entry RECORD;
BEGIN
  -- Try to get valid cache entry
  SELECT * INTO v_cache_entry
  FROM analytics_cache
  WHERE project_id = p_project_id
    AND source = p_source
    AND endpoint = p_endpoint
    AND params_hash = p_params_hash
    AND expires_at > NOW();

  -- If found, increment hit count and return data
  IF FOUND THEN
    UPDATE analytics_cache
    SET cache_hit_count = cache_hit_count + 1,
        updated_at = NOW()
    WHERE id = v_cache_entry.id;

    RETURN v_cache_entry.data;
  ELSE
    RETURN NULL;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════
-- Helper function to set cache
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION set_cached_analytics(
  p_project_id UUID,
  p_source TEXT,
  p_endpoint TEXT,
  p_params_hash TEXT,
  p_data JSONB,
  p_ttl_minutes INTEGER
)
RETURNS void AS $$
BEGIN
  INSERT INTO analytics_cache (
    project_id,
    source,
    endpoint,
    params_hash,
    data,
    fetched_at,
    expires_at
  ) VALUES (
    p_project_id,
    p_source,
    p_endpoint,
    p_params_hash,
    p_data,
    NOW(),
    NOW() + (p_ttl_minutes || ' minutes')::INTERVAL
  )
  ON CONFLICT (project_id, source, endpoint, params_hash)
  DO UPDATE SET
    data = EXCLUDED.data,
    fetched_at = EXCLUDED.fetched_at,
    expires_at = EXCLUDED.expires_at,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════
-- Grant permissions
-- ═══════════════════════════════════════════════════════════════

-- Grant access to authenticated users
ALTER TABLE analytics_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their project's analytics cache"
  ON analytics_cache
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage analytics cache"
  ON analytics_cache
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════
-- Example usage (for n8n workflows)
-- ═══════════════════════════════════════════════════════════════

/*
// In n8n Code node (before calling MCP server)

const crypto = require('crypto');
const { project_id, source, endpoint, params } = $input.item.json;

// Generate params hash
const paramsHash = crypto
  .createHash('md5')
  .update(JSON.stringify(params))
  .digest('hex');

// Try to get from cache
const cached = await $supabase.rpc('get_cached_analytics', {
  p_project_id: project_id,
  p_source: source,
  p_endpoint: endpoint,
  p_params_hash: paramsHash,
});

if (cached) {
  // Cache hit! Return cached data
  return {
    json: {
      data: cached,
      from_cache: true,
      fetched_at: new Date().toISOString(),
    }
  };
}

// Cache miss - call MCP server
const mcpResponse = await callMCPServer(source, endpoint, params);

// Store in cache
const ttlMap = {
  ga4: 5,
  meta_ads: 15,
  google_ads: 15,
  gtm: 60,
  looker: 30,
};

await $supabase.rpc('set_cached_analytics', {
  p_project_id: project_id,
  p_source: source,
  p_endpoint: endpoint,
  p_params_hash: paramsHash,
  p_data: mcpResponse.data,
  p_ttl_minutes: ttlMap[source] || 15,
});

return {
  json: {
    data: mcpResponse.data,
    from_cache: false,
    fetched_at: new Date().toISOString(),
  }
};
*/

-- ═══════════════════════════════════════════════════════════════
-- Monitoring queries
-- ═══════════════════════════════════════════════════════════════

-- View cache statistics
CREATE OR REPLACE VIEW analytics_cache_stats AS
SELECT
  source,
  COUNT(*) as total_entries,
  SUM(cache_hit_count) as total_hits,
  AVG(cache_hit_count) as avg_hits_per_entry,
  COUNT(*) FILTER (WHERE expires_at > NOW()) as valid_entries,
  COUNT(*) FILTER (WHERE expires_at <= NOW()) as expired_entries,
  MIN(created_at) as oldest_entry,
  MAX(created_at) as newest_entry
FROM analytics_cache
GROUP BY source;

COMMENT ON VIEW analytics_cache_stats IS 'Analytics cache statistics by source for monitoring';
