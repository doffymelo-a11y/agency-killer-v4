/**
 * Analytics Service
 * Maps analytics sources to MCP servers and formats data for Analytics Hub
 */

import { mcpBridge } from './mcp-bridge.service.js';
import { supabaseAdmin } from './supabase.service.js';
import { logger } from '../lib/logger.js';

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

const SOURCE_TO_MCP_SERVER: Record<string, { server: string; tool: string } | null> = {
  ga4: null, // TODO: Create ga4-connector MCP server
  meta_ads: { server: 'meta-ads', tool: 'meta_ads_get_campaigns' },
  google_ads: { server: 'google-ads', tool: 'google_ads_get_campaigns' },
  gsc: null, // TODO: Create gsc-connector MCP server (Google Search Console)
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

  logger.log(`[Analytics] Fetching ${source} data for project ${project_id}`);

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

  // Handle sources without MCP server implementation
  if (mcpMapping === null) {
    return {
      source,
      dateRange: date_range,
      kpis: [],
      charts: [],
      insights: [{
        id: 'not-implemented',
        type: 'info',
        message: `${getSourceLabel(source)} n'est pas encore implémenté. Le serveur MCP sera ajouté prochainement.`,
        agent: 'sora',
        source,
        priority: 1,
      }],
      isConnected: false,
      lastUpdated: new Date().toISOString(),
    };
  }

  if (!mcpMapping) {
    throw new Error(`Unknown analytics source: ${source}`);
  }

  try {
    // Get integration credentials
    const integration = await getIntegrationCredentials(project_id, userId, source);
    if (!integration) {
      return {
        source,
        dateRange: date_range,
        kpis: [],
        charts: [],
        insights: [{
          id: 'no-credentials',
          type: 'warning',
          message: `Impossible de récupérer les credentials pour ${getSourceLabel(source)}`,
          action: 'Reconnecter',
          actionUrl: `/integrations/${project_id}`,
          agent: 'sora',
          source,
          priority: 1,
        }],
        isConnected: false,
        lastUpdated: new Date().toISOString(),
      };
    }

    // Build MCP call parameters based on source
    const mcpParams = buildMCPParams(source, integration, date_range);

    const result = await mcpBridge.call(mcpMapping.server, mcpMapping.tool, mcpParams);

    if (!result.success) {
      console.error(`[Analytics] MCP call failed:`, result.error);
      return getEmptyAnalyticsData(source, date_range, isConnected, result.error);
    }

    // Format data based on source
    return formatAnalyticsData(source, result.data, date_range, isConnected);
  } catch (error: unknown) {
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
 * Get integration credentials from database
 */
async function getIntegrationCredentials(
  _projectId: string,
  userId: string,
  source: string
): Promise<any> {
  const integrationMap: Record<string, string> = {
    ga4: 'google_analytics',
    meta_ads: 'meta_ads',
    google_ads: 'google_ads',
    gsc: 'google_search_console',
  };

  const integrationType = integrationMap[source];
  if (!integrationType) return null;

  const { data, error } = await supabaseAdmin
    .from('user_integrations')
    .select('id, type, credentials, account_id')
    .eq('user_id', userId)
    .eq('type', integrationType)
    .eq('status', 'active')
    .single();

  if (error || !data) {
    logger.log(`[Analytics] No credentials found for ${source}`);
    return null;
  }

  return data;
}

/**
 * Build MCP call parameters based on source
 */
function buildMCPParams(source: string, integration: any, dateRange: any): Record<string, any> {
  const credentials = integration.credentials || {};
  const accountId = integration.account_id;

  // Convert date range preset to MCP-compatible format
  const datePreset = convertDatePreset(dateRange.preset);

  switch (source) {
    case 'meta_ads':
      return {
        ad_account_id: accountId || credentials.ad_account_id,
        date_preset: datePreset,
        credentials: {
          access_token: credentials.access_token,
        },
      };

    case 'google_ads':
      return {
        customer_id: accountId || credentials.customer_id,
        date_range: datePreset.toUpperCase(), // LAST_7_DAYS, LAST_30_DAYS, etc.
        credentials: credentials.refresh_token ? {
          refresh_token: credentials.refresh_token,
        } : undefined,
      };

    default:
      return {
        account_id: accountId,
        date_preset: datePreset,
        credentials,
      };
  }
}

/**
 * Convert Analytics Hub date preset to MCP-compatible format
 */
function convertDatePreset(preset?: string): string {
  const presetMap: Record<string, string> = {
    '7d': 'last_7d',
    '30d': 'last_30d',
    '90d': 'last_90d',
    'custom': 'this_month',
  };

  return presetMap[preset || '30d'] || 'last_30d';
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
  const metrics = rawData.result || rawData.campaigns || rawData || {};

  base.kpis = [
    {
      id: 'spend',
      label: 'Dépenses',
      value: metrics.spend || 0,
      previousValue: metrics.previousSpend,
      trend: calculateTrend(metrics.spend, metrics.previousSpend),
      trendDirection: getTrendDirection(metrics.spend, metrics.previousSpend, true),
      period: 'vs. previous period',
      source: 'meta_ads',
      format: 'currency',
    },
    {
      id: 'roas',
      label: 'ROAS',
      value: metrics.roas || metrics.purchase_roas || 0,
      previousValue: metrics.previousRoas,
      trend: calculateTrend(metrics.roas, metrics.previousRoas),
      trendDirection: getTrendDirection(metrics.roas, metrics.previousRoas),
      period: 'vs. previous period',
      source: 'meta_ads',
      format: 'number',
    },
    {
      id: 'cpa',
      label: 'CPA',
      value: metrics.cpa || metrics.cost_per_action || 0,
      previousValue: metrics.previousCpa,
      trend: calculateTrend(metrics.cpa, metrics.previousCpa),
      trendDirection: getTrendDirection(metrics.cpa, metrics.previousCpa, true),
      period: 'vs. previous period',
      source: 'meta_ads',
      format: 'currency',
    },
    {
      id: 'ctr',
      label: 'CTR',
      value: metrics.ctr || 0,
      previousValue: metrics.previousCtr,
      trend: calculateTrend(metrics.ctr, metrics.previousCtr),
      trendDirection: getTrendDirection(metrics.ctr, metrics.previousCtr),
      period: 'vs. previous period',
      source: 'meta_ads',
      format: 'percentage',
    },
    {
      id: 'impressions',
      label: 'Impressions',
      value: metrics.impressions || 0,
      previousValue: metrics.previousImpressions,
      trend: calculateTrend(metrics.impressions, metrics.previousImpressions),
      trendDirection: getTrendDirection(metrics.impressions, metrics.previousImpressions),
      period: 'vs. previous period',
      source: 'meta_ads',
      format: 'number',
    },
    {
      id: 'reach',
      label: 'Portée',
      value: metrics.reach || 0,
      previousValue: metrics.previousReach,
      trend: calculateTrend(metrics.reach, metrics.previousReach),
      trendDirection: getTrendDirection(metrics.reach, metrics.previousReach),
      period: 'vs. previous period',
      source: 'meta_ads',
      format: 'number',
    },
    {
      id: 'frequency',
      label: 'Fréquence',
      value: metrics.frequency || 0,
      previousValue: metrics.previousFrequency,
      trend: calculateTrend(metrics.frequency, metrics.previousFrequency),
      trendDirection: getTrendDirection(metrics.frequency, metrics.previousFrequency),
      period: 'vs. previous period',
      source: 'meta_ads',
      format: 'number',
    },
  ];

  base.charts = [
    {
      id: 'spend-chart',
      type: 'line',
      title: 'Dépenses quotidiennes',
      data: metrics.dailyData || [],
      xKey: 'date',
      yKeys: ['spend'],
      colors: ['#F97316'],
    },
  ];

  base.insights = generateMetaAdsInsights(metrics);

  return base;
}

/**
 * Format Google Ads data
 */
function formatGoogleAdsData(rawData: any, base: AnalyticsData): AnalyticsData {
  const metrics = rawData.result || rawData.campaigns || rawData || {};

  base.kpis = [
    {
      id: 'spend',
      label: 'Dépenses',
      value: metrics.cost || metrics.spend || 0,
      previousValue: metrics.previousCost,
      trend: calculateTrend(metrics.cost, metrics.previousCost),
      trendDirection: getTrendDirection(metrics.cost, metrics.previousCost, true),
      period: 'vs. previous period',
      source: 'google_ads',
      format: 'currency',
    },
    {
      id: 'conversions',
      label: 'Conversions',
      value: metrics.conversions || 0,
      previousValue: metrics.previousConversions,
      trend: calculateTrend(metrics.conversions, metrics.previousConversions),
      trendDirection: getTrendDirection(metrics.conversions, metrics.previousConversions),
      period: 'vs. previous period',
      source: 'google_ads',
      format: 'number',
    },
    {
      id: 'cpa',
      label: 'CPA',
      value: metrics.costPerConversion || metrics.cpa || 0,
      previousValue: metrics.previousCpa,
      trend: calculateTrend(metrics.costPerConversion, metrics.previousCpa),
      trendDirection: getTrendDirection(metrics.costPerConversion, metrics.previousCpa, true),
      period: 'vs. previous period',
      source: 'google_ads',
      format: 'currency',
    },
    {
      id: 'ctr',
      label: 'CTR',
      value: metrics.ctr || 0,
      previousValue: metrics.previousCtr,
      trend: calculateTrend(metrics.ctr, metrics.previousCtr),
      trendDirection: getTrendDirection(metrics.ctr, metrics.previousCtr),
      period: 'vs. previous period',
      source: 'google_ads',
      format: 'percentage',
    },
    {
      id: 'quality_score',
      label: 'Quality Score moyen',
      value: metrics.avgQualityScore || 0,
      previousValue: metrics.previousQualityScore,
      trend: calculateTrend(metrics.avgQualityScore, metrics.previousQualityScore),
      trendDirection: getTrendDirection(metrics.avgQualityScore, metrics.previousQualityScore),
      period: 'vs. previous period',
      source: 'google_ads',
      format: 'number',
    },
    {
      id: 'impression_share',
      label: 'Taux d\'impressions',
      value: metrics.impressionShare || 0,
      previousValue: metrics.previousImpressionShare,
      trend: calculateTrend(metrics.impressionShare, metrics.previousImpressionShare),
      trendDirection: getTrendDirection(metrics.impressionShare, metrics.previousImpressionShare),
      period: 'vs. previous period',
      source: 'google_ads',
      format: 'percentage',
    },
  ];

  base.charts = [
    {
      id: 'conversions-cost-chart',
      type: 'line',
      title: 'Conversions vs Dépenses',
      data: metrics.dailyData || [],
      xKey: 'date',
      yKeys: ['conversions', 'cost'],
      colors: ['#10B981', '#F97316'],
    },
  ];

  base.insights = generateGoogleAdsInsights(metrics);

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

  // High bounce rate warning
  if (metrics.bounceRate > 70) {
    insights.push({
      id: 'high-bounce-rate',
      type: 'warning',
      message: `Taux de rebond élevé (${metrics.bounceRate}%). Analysez le contenu et l'UX.`,
      action: 'Auditer les pages',
      agent: 'sora',
      source: 'ga4',
      priority: 2,
    });
  }

  // Traffic spike success
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

  // Traffic drop danger
  if (metrics.sessions && metrics.previousSessions && metrics.sessions < metrics.previousSessions * 0.8) {
    insights.push({
      id: 'traffic-drop',
      type: 'danger',
      message: `-${Math.round(((metrics.previousSessions - metrics.sessions) / metrics.previousSessions) * 100)}% de sessions. Identifiez la cause.`,
      agent: 'sora',
      source: 'ga4',
      priority: 1,
    });
  }

  return insights;
}

/**
 * Generate insights from Meta Ads metrics
 */
function generateMetaAdsInsights(metrics: any): AnalyticsInsight[] {
  const insights: AnalyticsInsight[] = [];

  // High ROAS success
  if (metrics.roas >= 4) {
    insights.push({
      id: 'high-roas',
      type: 'success',
      message: `ROAS excellent (${metrics.roas.toFixed(2)}). Envisagez de scaler la campagne.`,
      action: 'Augmenter le budget',
      agent: 'sora',
      source: 'meta_ads',
      priority: 1,
    });
  }

  // Low ROAS warning
  if (metrics.roas > 0 && metrics.roas < 2) {
    insights.push({
      id: 'low-roas',
      type: 'warning',
      message: `ROAS faible (${metrics.roas.toFixed(2)}). Optimisez le ciblage ou les créatifs.`,
      action: 'Analyser les audiences',
      agent: 'sora',
      source: 'meta_ads',
      priority: 2,
    });
  }

  // High frequency warning
  if (metrics.frequency > 5) {
    insights.push({
      id: 'high-frequency',
      type: 'warning',
      message: `Fréquence élevée (${metrics.frequency.toFixed(1)}). Risque de fatigue publicitaire.`,
      action: 'Élargir l\'audience',
      agent: 'sora',
      source: 'meta_ads',
      priority: 2,
    });
  }

  // Low CTR danger
  if (metrics.ctr > 0 && metrics.ctr < 1) {
    insights.push({
      id: 'low-ctr',
      type: 'danger',
      message: `CTR faible (${metrics.ctr.toFixed(2)}%). Testez de nouveaux créatifs.`,
      action: 'A/B test créatifs',
      agent: 'sora',
      source: 'meta_ads',
      priority: 2,
    });
  }

  return insights;
}

/**
 * Generate insights from Google Ads metrics
 */
function generateGoogleAdsInsights(metrics: any): AnalyticsInsight[] {
  const insights: AnalyticsInsight[] = [];

  // Low Quality Score warning
  if (metrics.avgQualityScore > 0 && metrics.avgQualityScore < 6) {
    insights.push({
      id: 'low-quality-score',
      type: 'warning',
      message: `Quality Score moyen faible (${metrics.avgQualityScore.toFixed(1)}). Optimisez vos mots-clés et pages de destination.`,
      action: 'Auditer les mots-clés',
      agent: 'sora',
      source: 'google_ads',
      priority: 2,
    });
  }

  // High Quality Score success
  if (metrics.avgQualityScore >= 8) {
    insights.push({
      id: 'high-quality-score',
      type: 'success',
      message: `Quality Score excellent (${metrics.avgQualityScore.toFixed(1)}). Vos campagnes sont bien optimisées.`,
      agent: 'sora',
      source: 'google_ads',
      priority: 3,
    });
  }

  // Low impression share warning
  if (metrics.impressionShare > 0 && metrics.impressionShare < 50) {
    insights.push({
      id: 'low-impression-share',
      type: 'warning',
      message: `Taux d'impressions faible (${metrics.impressionShare.toFixed(1)}%). Augmentez votre budget ou vos enchères.`,
      action: 'Ajuster les enchères',
      agent: 'sora',
      source: 'google_ads',
      priority: 2,
    });
  }

  // High CPA danger
  if (metrics.costPerConversion > 0 && metrics.cpa && metrics.cpa > 50) {
    insights.push({
      id: 'high-cpa',
      type: 'danger',
      message: `CPA élevé (${metrics.cpa.toFixed(2)}€). Analysez vos enchères et audiences.`,
      action: 'Optimiser les enchères',
      agent: 'sora',
      source: 'google_ads',
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
