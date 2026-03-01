# Analytics Cache Integration Guide for n8n Workflows

This guide explains how to integrate the analytics cache system into your n8n workflows for Sora and other agents.

## Overview

The analytics cache prevents API rate limits and reduces latency by caching responses from:
- Google Analytics 4 (5 min TTL)
- Meta Ads (15 min TTL)
- Google Ads (15 min TTL)
- Google Tag Manager (60 min TTL)
- Looker Studio (30 min TTL)

## Architecture

```
User Request → n8n Workflow → Check Cache → [HIT: Return cached data]
                                           → [MISS: Call MCP Server → Save to cache → Return data]
```

## Implementation Methods

### Method 1: Using the Cache Helper Module (Recommended)

#### Step 1: Add Code Node Before MCP Call

Create a "Check Cache" Code node:

```javascript
// Import cache helper
const { callWithCache } = require('./analytics-cache-helper.js');

// Extract task context
const { project_id, shared_memory } = $input.item.json;
const source = 'ga4'; // or 'meta_ads', 'google_ads', 'gtm', 'looker'
const endpoint = 'get_metrics';
const params = {
  date_start: '2026-01-01',
  date_end: '2026-01-31',
  metrics: ['sessions', 'pageviews', 'bounceRate'],
};

// Smart cache wrapper - handles both cache check and MCP call
const result = await callWithCache(
  $supabase,
  project_id,
  source,
  endpoint,
  params,
  async (params) => {
    // This function is only called on cache MISS
    // Call your MCP server here
    const mcpResponse = await $mcp.call('ga4-server', 'get_metrics', params);
    return mcpResponse;
  }
);

return {
  json: {
    data: result.data,
    fromCache: result.fromCache,
    fetchedAt: result.fetchedAt,
  }
};
```

### Method 2: Manual Cache Management

#### Step 1: Check Cache (Code Node)

```javascript
const crypto = require('crypto');

// Extract context
const { project_id } = $input.item.json;
const source = 'ga4';
const endpoint = 'get_metrics';
const params = {
  date_start: '2026-01-01',
  date_end: '2026-01-31',
  metrics: ['sessions', 'pageviews'],
};

// Generate params hash
const paramsHash = crypto
  .createHash('md5')
  .update(JSON.stringify(params, Object.keys(params).sort()))
  .digest('hex');

// Try to get from cache
const { data, error } = await $supabase.rpc('get_cached_analytics', {
  p_project_id: project_id,
  p_source: source,
  p_endpoint: endpoint,
  p_params_hash: paramsHash,
});

if (data && !error) {
  // Cache HIT
  return {
    json: {
      cacheHit: true,
      data: data,
      source,
      endpoint,
      params,
    }
  };
} else {
  // Cache MISS
  return {
    json: {
      cacheHit: false,
      source,
      endpoint,
      params,
      paramsHash,
    }
  };
}
```

#### Step 2: Add IF Node

Connect the "Check Cache" node to an IF node:
- **Condition:** `{{ $json.cacheHit }} equals true`
- **True branch:** Go to "Return Cached Data" node
- **False branch:** Go to "Call MCP Server" node

#### Step 3: Call MCP Server (Code Node)

On the FALSE branch:

```javascript
// Extract from previous node
const { source, endpoint, params, paramsHash } = $input.item.json;

// Call MCP server (example for GA4)
const mcpResponse = await $mcp.call('ga4-server', endpoint, params);

return {
  json: {
    cacheHit: false,
    source,
    endpoint,
    params,
    paramsHash,
    mcpData: mcpResponse,
  }
};
```

#### Step 4: Save to Cache (Code Node)

After MCP call:

```javascript
const { project_id } = $input.first().json;
const { source, endpoint, paramsHash, mcpData } = $input.item.json;

// TTL map
const ttlMap = {
  ga4: 5,
  meta_ads: 15,
  google_ads: 15,
  gtm: 60,
  looker: 30,
};

// Save to cache
await $supabase.rpc('set_cached_analytics', {
  p_project_id: project_id,
  p_source: source,
  p_endpoint: endpoint,
  p_params_hash: paramsHash,
  p_data: mcpData,
  p_ttl_minutes: ttlMap[source] || 15,
});

return {
  json: {
    data: mcpData,
    fromCache: false,
    fetchedAt: new Date().toISOString(),
  }
};
```

#### Step 5: Return Cached Data (Code Node)

On the TRUE branch:

```javascript
const { data } = $input.item.json;

return {
  json: {
    data: data,
    fromCache: true,
    fetchedAt: new Date().toISOString(),
  }
};
```

#### Step 6: Merge Branches

Use a Merge node to combine both branches, then continue to your response logic.

## Workflow Structure (Manual Method)

```
[Webhook]
  ↓
[Extract Task Context]
  ↓
[Check Cache] ←────────────┐
  ↓                         │
[IF: Cache Hit?]            │
  ├─ TRUE → [Return Cached] ┘
  ├─ FALSE → [Call MCP Server]
              ↓
             [Save to Cache]
              ↓
             [Return Fresh Data]
```

## Example: Complete Sora Workflow Node

Here's a complete example for integrating cache into Sora's analytics workflow:

```javascript
// Node: "Smart Analytics Call with Cache"

const { callWithCache } = require('./analytics-cache-helper.js');
const { project_id, shared_memory, user_inputs } = $input.item.json;

// Determine which analytics source to call based on task
const source = user_inputs.analytics_source || 'ga4'; // ga4, meta_ads, google_ads, gtm, looker
const endpoint = user_inputs.endpoint || 'get_metrics';
const params = {
  date_start: user_inputs.date_start || '2026-01-01',
  date_end: user_inputs.date_end || '2026-01-31',
  metrics: user_inputs.metrics || ['sessions', 'pageviews'],
  dimensions: user_inputs.dimensions || [],
};

try {
  // This handles everything: cache check, MCP call, cache write
  const result = await callWithCache(
    $supabase,
    project_id,
    source,
    endpoint,
    params,
    async (params) => {
      // Map source to MCP server name
      const serverMap = {
        ga4: 'ga4-server',
        meta_ads: 'meta-ads-server',
        google_ads: 'google-ads-server',
        gtm: 'gtm-server',
        looker: 'looker-server',
      };

      const serverName = serverMap[source];
      if (!serverName) {
        throw new Error(`Unknown analytics source: ${source}`);
      }

      // Call the appropriate MCP server
      return await $mcp.call(serverName, endpoint, params);
    }
  );

  return {
    json: {
      success: true,
      data: result.data,
      fromCache: result.fromCache,
      fetchedAt: result.fetchedAt,
      source,
      endpoint,
    }
  };
} catch (error) {
  console.error('Analytics call failed:', error);

  return {
    json: {
      success: false,
      error: error.message,
      source,
      endpoint,
    }
  };
}
```

## Cache Monitoring

### Query Cache Statistics

Run this in Supabase SQL Editor to see cache performance:

```sql
SELECT * FROM analytics_cache_stats;
```

### Clear Expired Cache Entries

```sql
SELECT clean_expired_analytics_cache();
```

### Force Clear All Cache for a Project

```sql
DELETE FROM analytics_cache WHERE project_id = '[your-project-id]';
```

## Benefits

✅ **Prevents Rate Limits**: GA4 has 10,000 requests/day, Meta Ads has 200 calls/hour
✅ **Reduces Latency**: 3s API call → 100ms cache lookup
✅ **Saves API Costs**: Fewer calls to external APIs
✅ **Better UX**: Instant dashboard updates when using cached data

## TTL Configuration Rationale

| Source | TTL | Reasoning |
|--------|-----|-----------|
| GA4 | 5 min | Data updates every 24-48h, but users expect "real-time" |
| Meta Ads | 15 min | Data updates every 15 minutes |
| Google Ads | 15 min | Data updates every few hours |
| GTM | 60 min | Configuration rarely changes |
| Looker Studio | 30 min | Dashboard data, moderate refresh needs |

## Troubleshooting

### Cache Not Working

1. Verify migration applied: `SELECT * FROM analytics_cache LIMIT 1;`
2. Check RPC functions exist: `SELECT * FROM pg_proc WHERE proname LIKE '%cached_analytics%';`
3. Verify RLS policies allow access

### Cache Always Missing

1. Check params are deterministic (sorted keys)
2. Verify `params_hash` is identical for same params
3. Check `expires_at` timestamp hasn't passed

### Cache Too Aggressive

1. Adjust TTL in helper: `CACHE_TTL.ga4 = 1;` (1 minute)
2. Force refresh: Add `skipCache: true` param to bypass cache

## Next Steps

1. ✅ Apply the migration: `supabase/migrations/20260210_analytics_cache.sql`
2. ✅ Copy `analytics-cache-helper.js` to your n8n code node libraries
3. ✅ Update Sora workflow to use `callWithCache`
4. ✅ Update AnalyticsView to show cache status badge
5. ✅ Monitor cache hit rates via `analytics_cache_stats` view

---

**Created by:** Claude Code - The Hive OS V4
**Date:** 2026-02-10
