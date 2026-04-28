/**
 * Analytics Service
 * Maps analytics sources to MCP servers and formats data for Analytics Hub
 */

import { mcpBridge } from './mcp-bridge.service.js';
import { supabaseAdmin } from './supabase.service.js';

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

export interface AnalyticsRequest {
  source: 'ga4' | 'meta_ads' | 'google_ads' | 'gsc' | 'overview';
  date_range: {
    start: string;
    end: string;
    preset?: '7d' | '30d' | '90d' | 'custom';
  };
  project_id: string;
}

export interface AnalyticsKPI {
  id: string;
  label: string;
  value: string | number;
  previousValue?: string | number;
  trend?: number;
  trendDirection?: 'up' | 'down' | 'neutral';
  period: string;
  source: string;
  format?: 'number' | 'currency' | 'percentage' | 'duration';
}

export interface AnalyticsChart {
  id: string;
  type: 'line' | 'bar' | 'area' | 'pie';
  title: string;
  data: Record<string, any>[];
  xKey: string;
  yKeys: string[];
  colors?: string[];
  height?: number;
}

export interface AnalyticsInsight {
  id: string;
  type: 'success' | 'warning' | 'danger' | 'info';
  message: string;
  action?: string;
  actionUrl?: string;
  agent: string;
  source: string;
  priority?: number;
}

export interface AnalyticsData {
  source: string;
  dateRange: { start: string; end: string; preset?: string };
  kpis: AnalyticsKPI[];
  charts: AnalyticsChart[];
  insights: AnalyticsInsight[];
  isConnected: boolean;
  lastUpdated: string;
}

// ─────────────────────────────────────────────────────────────────
// MCP Server Mapping
// ─────────────────────────────────────────────────────────────────

const SOURCE_TO_MCP_SERVER: Record<string, { server: string; tool: string }> = {
  ga4: { server: 'ga4-connector', tool: 'fetch_analytics' },
  meta_ads: { server: 'meta-ads-connector', tool: 'fetch_campaigns' },
  google_ads: { server: 'google-ads-launcher', tool: 'fetch_campaigns' },
  gsc: { server: 'seo-audit', tool: 'fetch_search_console' },
};

// ─────────────────────────────────────────────────────────────────
// Main Function
// ─────────────────────────────────────────────────────────────────

/**
 * Fetch analytics data from MCP servers and format for Analytics Hub
 */
export async function fetchAnalytics(
  request: AnalyticsRequest,
  userId: string
): Promise<AnalyticsData> {
  const { source, date_range, project_id } = request;

  console.log(`[Analytics] Fetching ${source} data for project ${project_id}`);

  // Check if integration is connected
  const isConnected = await checkIntegrationConnected(project_id, userId, source);

  if (!isConnected) {
    return {
      source,
      dateRange: date_range,
      kpis: [],
      charts: [],
      insights: [{
        id: 'not-connected',
        type: 'info',
        message: `${getSourceLabel(source)} n'est pas encore connecté`,
        action: 'Connecter maintenant',
        actionUrl: `/integrations/${project_id}`,
        agent: 'sora',
        source,
        priority: 1,
      }],
      isConnected: false,
      lastUpdated: new Date().toISOString(),
    };
  }

  // For overview, aggregate all sources
  if (source === 'overview') {
    return fetchOverview(request, userId);
  }

  // Fetch from specific MCP server
  const mcpMapping = SOURCE_TO_MCP_SERVER[source];
  if (!mcpMapping) {
    throw new Error(`Unknown analytics source: ${source}`);
  }

  try {
    const result = await mcpBridge.call(mcpMapping.server, mcpMapping.tool, {
      project_id,
      start_date: date_range.start,
      end_date: date_range.end,
    });

    if (!result.success) {
      console.error(`[Analytics] MCP call failed:`, result.error);
      return getEmptyAnalyticsData(source, date_range, isConnected, result.error);
    }

    // Format data based on source
    return formatAnalyticsData(source, result.data, date_range, isConnected);
  } catch (error: any) {
    console.error(`[Analytics] Error fetching ${source}:`, error);
    return getEmptyAnalyticsData(source, date_range, isConnected, error.message);
  }
}

// ─────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────

/**
 * Check if integration is connected for this project
 */
async function checkIntegrationConnected(
  _projectId: string,
  userId: string,
  source: string
): Promise<boolean> {
  // Map source to integration type
  const integrationMap: Record<string, string> = {
    ga4: 'google_analytics',
    meta_ads: 'meta_ads',
    google_ads: 'google_ads',
    gsc: 'google_search_console',
    overview: 'any',
  };

  const integrationType = integrationMap[source];
  if (!integrationType) return false;

  // For overview, check if ANY integration is connected
  if (integrationType === 'any') {
    const { data } = await supabaseAdmin
      .from('user_integrations')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .limit(1);

    return (data?.length || 0) > 0;
  }

  // Check specific integration
  const { data, error } = await supabaseAdmin
    .from('user_integrations')
    .select('id')
    .eq('user_id', userId)
    .eq('type', integrationType)
    .eq('status', 'active')
    .single();

  return !error && !!data;
}

/**
 * Format raw MCP data into Analytics Hub format
 */
function formatAnalyticsData(
  source: string,
  rawData: any,
  dateRange: any,
  isConnected: boolean
): AnalyticsData {
  // Default empty structure
  const formatted: AnalyticsData = {
    source,
    dateRange,
    kpis: [],
    charts: [],
    insights: [],
    isConnected,
    lastUpdated: new Date().toISOString(),
  };

  // Format based on source
  switch (source) {
    case 'ga4':
      return formatGA4Data(rawData, formatted);
    case 'meta_ads':
      return formatMetaAdsData(rawData, formatted);
    case 'google_ads':
      return formatGoogleAdsData(rawData, formatted);
    case 'gsc':
      return formatGSCData(rawData, formatted);
    default:
      return formatted;
  }
}

/**
 * Format GA4 data
 */
function formatGA4Data(rawData: any, base: AnalyticsData): AnalyticsData {
  // Extract metrics from rawData (structure depends on MCP server response)
  const metrics = rawData.result || rawData.metrics || {};

  base.kpis = [
    {
      id: 'sessions',
      label: 'Sessions',
      value: metrics.sessions || 0,
      previousValue: metrics.previousSessions,
      trend: calculateTrend(metrics.sessions, metrics.previousSessions),
      trendDirection: getTrendDirection(metrics.sessions, metrics.previousSessions),
      period: 'vs. previous period',
      source: 'ga4',
      format: 'number',
    },
    {
      id: 'users',
      label: 'Utilisateurs',
      value: metrics.users || 0,
      previousValue: metrics.previousUsers,
      trend: calculateTrend(metrics.users, metrics.previousUsers),
      trendDirection: getTrendDirection(metrics.users, metrics.previousUsers),
      period: 'vs. previous period',
      source: 'ga4',
      format: 'number',
    },
    {
      id: 'bounce_rate',
      label: 'Taux de rebond',
      value: metrics.bounceRate || 0,
      previousValue: metrics.previousBounceRate,
      trend: calculateTrend(metrics.bounceRate, metrics.previousBounceRate),
      trendDirection: getTrendDirection(metrics.bounceRate, metrics.previousBounceRate, true),
      period: 'vs. previous period',
      source: 'ga4',
      format: 'percentage',
    },
  ];

  base.charts = [
    {
      id: 'sessions-chart',
      type: 'line',
      title: 'Sessions over time',
      data: metrics.dailyData || [],
      xKey: 'date',
      yKeys: ['sessions'],
      colors: ['#06B6D4'],
    },
  ];

  base.insights = generateGA4Insights(metrics);

  return base;
}

/**
 * Format Meta Ads data
 */
function formatMetaAdsData(rawData: any, base: AnalyticsData): AnalyticsData {
  const metrics = rawData.result || rawData.campaigns || {};

  base.kpis = [
    {
      id: 'spend',
      label: 'Dépenses',
      value: metrics.spend || 0,
      trend: calculateTrend(metrics.spend, metrics.previousSpend),
      trendDirection: getTrendDirection(metrics.spend, metrics.previousSpend, true),
      period: 'vs. previous period',
      source: 'meta_ads',
      format: 'currency',
    },
    {
      id: 'roas',
      label: 'ROAS',
      value: metrics.roas || 0,
      trend: calculateTrend(metrics.roas, metrics.previousRoas),
      trendDirection: getTrendDirection(metrics.roas, metrics.previousRoas),
      period: 'vs. previous period',
      source: 'meta_ads',
      format: 'number',
    },
  ];

  return base;
}

/**
 * Format Google Ads data
 */
function formatGoogleAdsData(rawData: any, base: AnalyticsData): AnalyticsData {
  const metrics = rawData.result || rawData.campaigns || {};

  base.kpis = [
    {
      id: 'spend',
      label: 'Dépenses',
      value: metrics.cost || 0,
      trend: calculateTrend(metrics.cost, metrics.previousCost),
      trendDirection: getTrendDirection(metrics.cost, metrics.previousCost, true),
      period: 'vs. previous period',
      source: 'google_ads',
      format: 'currency',
    },
  ];

  return base;
}

/**
 * Format Google Search Console data
 */
function formatGSCData(rawData: any, base: AnalyticsData): AnalyticsData {
  const metrics = rawData.result || rawData.data || {};

  base.kpis = [
    {
      id: 'clicks',
      label: 'Clics',
      value: metrics.clicks || 0,
      trend: calculateTrend(metrics.clicks, metrics.previousClicks),
      trendDirection: getTrendDirection(metrics.clicks, metrics.previousClicks),
      period: 'vs. previous period',
      source: 'gsc',
      format: 'number',
    },
    {
      id: 'impressions',
      label: 'Impressions',
      value: metrics.impressions || 0,
      trend: calculateTrend(metrics.impressions, metrics.previousImpressions),
      trendDirection: getTrendDirection(metrics.impressions, metrics.previousImpressions),
      period: 'vs. previous period',
      source: 'gsc',
      format: 'number',
    },
  ];

  return base;
}

/**
 * Fetch overview data (all sources aggregated)
 */
async function fetchOverview(request: AnalyticsRequest, userId: string): Promise<AnalyticsData> {
  // Fetch data from all connected sources in parallel
  const sources: Array<'ga4' | 'meta_ads' | 'google_ads' | 'gsc'> = ['ga4', 'meta_ads', 'google_ads', 'gsc'];

  const results = await Promise.all(
    sources.map(async (source) => {
      try {
        return await fetchAnalytics({ ...request, source }, userId);
      } catch {
        return null;
      }
    })
  );

  // Aggregate KPIs and insights from all sources
  const allKPIs = results.flatMap((r) => r?.kpis || []);
  const allInsights = results.flatMap((r) => r?.insights || []).sort((a, b) => (a.priority || 99) - (b.priority || 99));

  return {
    source: 'overview',
    dateRange: request.date_range,
    kpis: allKPIs.slice(0, 8), // Top 8 KPIs
    charts: [],
    insights: allInsights.slice(0, 5), // Top 5 insights
    isConnected: allKPIs.length > 0,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Generate insights from GA4 metrics
 */
function generateGA4Insights(metrics: any): AnalyticsInsight[] {
  const insights: AnalyticsInsight[] = [];

  if (metrics.bounceRate > 70) {
    insights.push({
      id: 'high-bounce-rate',
      type: 'warning',
      message: `Taux de rebond élevé (${metrics.bounceRate}%). Analysez le contenu et l'UX.`,
      agent: 'sora',
      source: 'ga4',
      priority: 2,
    });
  }

  if (metrics.sessions && metrics.previousSessions && metrics.sessions > metrics.previousSessions * 1.2) {
    insights.push({
      id: 'traffic-spike',
      type: 'success',
      message: `+${Math.round(((metrics.sessions - metrics.previousSessions) / metrics.previousSessions) * 100)}% de sessions. Excellent !`,
      agent: 'sora',
      source: 'ga4',
      priority: 1,
    });
  }

  return insights;
}

// ─────────────────────────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────────────────────────

function calculateTrend(current?: number, previous?: number): number | undefined {
  if (!current || !previous || previous === 0) return undefined;
  return Math.round(((current - previous) / previous) * 100 * 10) / 10;
}

function getTrendDirection(
  current?: number,
  previous?: number,
  isNegativeBetter = false
): 'up' | 'down' | 'neutral' | undefined {
  if (!current || !previous) return undefined;
  const diff = current - previous;
  if (Math.abs(diff) < previous * 0.01) return 'neutral'; // < 1% change

  if (isNegativeBetter) {
    return diff < 0 ? 'up' : 'down';
  }
  return diff > 0 ? 'up' : 'down';
}

function getSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    ga4: 'Google Analytics 4',
    meta_ads: 'Meta Ads',
    google_ads: 'Google Ads',
    gsc: 'Google Search Console',
    overview: 'Vue d\'ensemble',
  };
  return labels[source] || source;
}

function getEmptyAnalyticsData(
  source: string,
  dateRange: any,
  isConnected: boolean,
  errorMessage?: string
): AnalyticsData {
  return {
    source,
    dateRange,
    kpis: [],
    charts: [],
    insights: errorMessage
      ? [
          {
            id: 'error',
            type: 'danger',
            message: `Erreur lors de la récupération des données: ${errorMessage}`,
            agent: 'sora',
            source,
            priority: 1,
          },
        ]
      : [],
    isConnected,
    lastUpdated: new Date().toISOString(),
  };
}
