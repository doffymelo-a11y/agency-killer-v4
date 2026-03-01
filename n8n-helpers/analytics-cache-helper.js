// ═══════════════════════════════════════════════════════════════
// Analytics Cache Helper for n8n Workflows
// Prevents API rate limits and reduces latency
// ═══════════════════════════════════════════════════════════════

const crypto = require('crypto');

// ─────────────────────────────────────────────────────────────────
// Cache TTL Configuration (in minutes)
// ─────────────────────────────────────────────────────────────────

const CACHE_TTL = {
  ga4: 5,              // Google Analytics 4: 5 minutes
  meta_ads: 15,        // Meta Ads: 15 minutes
  google_ads: 15,      // Google Ads: 15 minutes
  gtm: 60,             // Google Tag Manager: 60 minutes
  looker: 30,          // Looker Studio: 30 minutes
  gsc: 60,             // Google Search Console: 60 minutes
  gbp: 30,             // Google Business Profile: 30 minutes
};

// ─────────────────────────────────────────────────────────────────
// Generate Cache Key
// ─────────────────────────────────────────────────────────────────

function generateCacheKey(params) {
  /**
   * Generate MD5 hash of request parameters
   * @param {Object} params - Request parameters (date ranges, filters, etc.)
   * @returns {String} MD5 hash
   */
  const paramsStr = JSON.stringify(params, Object.keys(params).sort());
  return crypto.createHash('md5').update(paramsStr).digest('hex');
}

// ─────────────────────────────────────────────────────────────────
// Get Cached Data
// ─────────────────────────────────────────────────────────────────

async function getCachedData(supabase, projectId, source, endpoint, params) {
  /**
   * Try to get cached analytics data
   * @param {Object} supabase - Supabase client
   * @param {String} projectId - Project UUID
   * @param {String} source - 'ga4', 'meta_ads', 'google_ads', 'gtm', 'looker'
   * @param {String} endpoint - 'get_metrics', 'list_campaigns', etc.
   * @param {Object} params - Request parameters
   * @returns {Object|null} Cached data or null if not found/expired
   */
  const paramsHash = generateCacheKey(params);

  try {
    const { data, error } = await supabase.rpc('get_cached_analytics', {
      p_project_id: projectId,
      p_source: source,
      p_endpoint: endpoint,
      p_params_hash: paramsHash,
    });

    if (error) {
      console.error('Cache read error:', error);
      return null;
    }

    return data; // Will be null if not found or expired
  } catch (err) {
    console.error('Cache read exception:', err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────
// Set Cached Data
// ─────────────────────────────────────────────────────────────────

async function setCachedData(supabase, projectId, source, endpoint, params, data) {
  /**
   * Save analytics data to cache
   * @param {Object} supabase - Supabase client
   * @param {String} projectId - Project UUID
   * @param {String} source - 'ga4', 'meta_ads', 'google_ads', 'gtm', 'looker'
   * @param {String} endpoint - 'get_metrics', 'list_campaigns', etc.
   * @param {Object} params - Request parameters
   * @param {Object} data - Data to cache
   * @returns {Boolean} Success status
   */
  const paramsHash = generateCacheKey(params);
  const ttlMinutes = CACHE_TTL[source] || 15; // Default to 15 minutes

  try {
    const { error } = await supabase.rpc('set_cached_analytics', {
      p_project_id: projectId,
      p_source: source,
      p_endpoint: endpoint,
      p_params_hash: paramsHash,
      p_data: data,
      p_ttl_minutes: ttlMinutes,
    });

    if (error) {
      console.error('Cache write error:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Cache write exception:', err);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────
// Cache-Aware MCP Call Wrapper
// ─────────────────────────────────────────────────────────────────

async function callWithCache(supabase, projectId, source, endpoint, params, mcpCallFunction) {
  /**
   * Smart wrapper that checks cache before calling MCP server
   * @param {Object} supabase - Supabase client
   * @param {String} projectId - Project UUID
   * @param {String} source - 'ga4', 'meta_ads', 'google_ads', 'gtm', 'looker'
   * @param {String} endpoint - 'get_metrics', 'list_campaigns', etc.
   * @param {Object} params - Request parameters
   * @param {Function} mcpCallFunction - Async function that calls the MCP server
   * @returns {Object} { data, fromCache, fetchedAt }
   */

  // 1. Try cache first
  const cachedData = await getCachedData(supabase, projectId, source, endpoint, params);

  if (cachedData) {
    console.log(`✅ Cache HIT for ${source}.${endpoint}`);
    return {
      data: cachedData,
      fromCache: true,
      fetchedAt: new Date().toISOString(),
    };
  }

  // 2. Cache miss - call MCP server
  console.log(`⚠️ Cache MISS for ${source}.${endpoint} - calling MCP server`);

  try {
    const mcpResponse = await mcpCallFunction(params);

    // 3. Save to cache
    await setCachedData(supabase, projectId, source, endpoint, params, mcpResponse);

    console.log(`💾 Cached ${source}.${endpoint} for ${CACHE_TTL[source] || 15} minutes`);

    return {
      data: mcpResponse,
      fromCache: false,
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`❌ MCP call failed for ${source}.${endpoint}:`, error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────

module.exports = {
  generateCacheKey,
  getCachedData,
  setCachedData,
  callWithCache,
  CACHE_TTL,
};
