#!/usr/bin/env node

/**
 * MCP Server for Google Ads (LECTURE SEULE)
 * Allows Sora to read and analyze Google Ads campaigns, keywords, conversions
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { GoogleAdsApi } from 'google-ads-api';

// Get credentials from environment
const DEVELOPER_TOKEN = process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '';
const CLIENT_ID = process.env.GOOGLE_ADS_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_ADS_CLIENT_SECRET || '';
const REFRESH_TOKEN = process.env.GOOGLE_ADS_REFRESH_TOKEN || '';

// Initialize Google Ads API client
const client = new GoogleAdsApi({
  client_id: CLIENT_ID,
  client_secret: CLIENT_SECRET,
  developer_token: DEVELOPER_TOKEN,
});

// Helper function to get customer client
function getCustomer(customerId: string) {
  return client.Customer({
    customer_id: customerId.replace(/-/g, ''),
    refresh_token: REFRESH_TOKEN,
  });
}

// Helper function to convert date range
function getDateRange(range: string): { start_date: string; end_date: string } {
  const today = new Date();
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0].replace(/-/g, '');
  };

  let startDate: Date;
  const endDate = today;

  switch (range) {
    case 'LAST_7_DAYS':
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'LAST_30_DAYS':
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 30);
      break;
    case 'LAST_90_DAYS':
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 90);
      break;
    case 'THIS_MONTH':
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    default:
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 30);
  }

  return {
    start_date: formatDate(startDate),
    end_date: formatDate(endDate),
  };
}

// Initialize MCP Server
const server = new Server(
  {
    name: 'google-ads-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools
const tools: Tool[] = [
  {
    name: 'google_ads_get_accounts',
    description: 'Liste tous les comptes Google Ads accessibles',
    inputSchema: {
      type: 'object',
      properties: {
        credentials: {
          type: 'object',
          description: 'OAuth2 credentials (optional, uses env vars if not provided)',
        },
      },
      required: [],
    },
  },
  {
    name: 'google_ads_get_campaigns',
    description: 'Récupère toutes les campagnes d\'un compte Google Ads avec leurs métriques',
    inputSchema: {
      type: 'object',
      properties: {
        customer_id: {
          type: 'string',
          description: 'ID du compte Google Ads (format: 1234567890 ou 123-456-7890)',
        },
        date_range: {
          type: 'string',
          description: 'Période: LAST_7_DAYS, LAST_30_DAYS, LAST_90_DAYS, THIS_MONTH',
        },
        credentials: {
          type: 'object',
          description: 'OAuth2 credentials (optional)',
        },
      },
      required: ['customer_id'],
    },
  },
  {
    name: 'google_ads_get_search_terms',
    description: 'Récupère les termes de recherche réels qui ont déclenché les annonces',
    inputSchema: {
      type: 'object',
      properties: {
        customer_id: { type: 'string' },
        campaign_id: {
          type: 'string',
          description: 'ID de la campagne (optionnel, sinon tous)',
        },
        date_range: { type: 'string' },
        credentials: { type: 'object' },
      },
      required: ['customer_id'],
    },
  },
  {
    name: 'google_ads_get_keywords_quality_score',
    description: 'Analyse le Quality Score des mots-clés pour optimisation',
    inputSchema: {
      type: 'object',
      properties: {
        customer_id: { type: 'string' },
        campaign_id: { type: 'string' },
        credentials: { type: 'object' },
      },
      required: ['customer_id'],
    },
  },
  {
    name: 'google_ads_get_conversions',
    description: 'Récupère toutes les conversions trackées avec attribution',
    inputSchema: {
      type: 'object',
      properties: {
        customer_id: { type: 'string' },
        date_range: { type: 'string' },
        credentials: { type: 'object' },
      },
      required: ['customer_id'],
    },
  },
  {
    name: 'google_ads_create_audience',
    description: 'Crée une audience remarketing à partir de critères (LECTURE SEULE actuellement)',
    inputSchema: {
      type: 'object',
      properties: {
        customer_id: { type: 'string' },
        audience_config: {
          type: 'object',
          description: 'Configuration de l\'audience',
        },
        credentials: { type: 'object' },
      },
      required: ['customer_id', 'audience_config'],
    },
  },
  {
    name: 'google_ads_get_performance_report',
    description: 'Génère un rapport de performance complet (campagnes + groupes d\'annonces + annonces)',
    inputSchema: {
      type: 'object',
      properties: {
        customer_id: { type: 'string' },
        date_range: { type: 'string' },
        metrics: {
          type: 'array',
          description: 'Métriques à inclure: impressions, clicks, cost, conversions, ctr, cpc, roas',
        },
        credentials: { type: 'object' },
      },
      required: ['customer_id'],
    },
  },
];

// Handle tool list request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args) {
    throw new Error('Arguments are required');
  }

  try {
    const customerId = (args.customer_id as string)?.replace(/-/g, '') || '';
    const dateRange = (args.date_range as string) || 'LAST_30_DAYS';
    const dates = getDateRange(dateRange);

    switch (name) {
      case 'google_ads_get_accounts': {
        // Get accessible customer clients
        const customer = getCustomer(process.env.GOOGLE_ADS_CUSTOMER_ID || customerId);

        const query = `
          SELECT
            customer_client.id,
            customer_client.descriptive_name,
            customer_client.currency_code,
            customer_client.time_zone,
            customer_client.status
          FROM customer_client
          WHERE customer_client.status = 'ENABLED'
        `;

        const accounts = await customer.query(query);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  accounts: accounts.map((row: any) => ({
                    id: row.customer_client.id,
                    name: row.customer_client.descriptive_name,
                    currency: row.customer_client.currency_code,
                    timezone: row.customer_client.time_zone,
                    status: row.customer_client.status,
                  })),
                  total: accounts.length,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'google_ads_get_campaigns': {
        const customer = getCustomer(customerId);

        const query = `
          SELECT
            campaign.id,
            campaign.name,
            campaign.status,
            campaign.advertising_channel_type,
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros,
            metrics.conversions,
            metrics.conversions_value,
            metrics.ctr,
            metrics.average_cpc,
            campaign.optimization_score
          FROM campaign
          WHERE segments.date BETWEEN '${dates.start_date}' AND '${dates.end_date}'
            AND campaign.status IN ('ENABLED', 'PAUSED')
          ORDER BY metrics.impressions DESC
        `;

        const campaigns = await customer.query(query);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  campaigns: campaigns.map((row: any) => ({
                    id: row.campaign.id,
                    name: row.campaign.name,
                    status: row.campaign.status,
                    type: row.campaign.advertising_channel_type,
                    metrics: {
                      impressions: parseInt(row.metrics.impressions || '0'),
                      clicks: parseInt(row.metrics.clicks || '0'),
                      cost: parseFloat((row.metrics.cost_micros / 1000000).toFixed(2)),
                      conversions: parseFloat(row.metrics.conversions || '0'),
                      conversions_value: parseFloat(row.metrics.conversions_value || '0'),
                      ctr: parseFloat((row.metrics.ctr * 100).toFixed(2)),
                      avg_cpc: parseFloat((row.metrics.average_cpc / 1000000).toFixed(2)),
                      roas:
                        row.metrics.cost_micros > 0
                          ? parseFloat(
                              (
                                row.metrics.conversions_value /
                                (row.metrics.cost_micros / 1000000)
                              ).toFixed(2)
                            )
                          : 0,
                    },
                    optimization_score: row.campaign.optimization_score
                      ? parseFloat((row.campaign.optimization_score * 100).toFixed(1))
                      : null,
                  })),
                  date_range: {
                    start: dates.start_date,
                    end: dates.end_date,
                    label: dateRange,
                  },
                  total: campaigns.length,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'google_ads_get_search_terms': {
        const customer = getCustomer(customerId);
        const campaignFilter = args.campaign_id
          ? `AND campaign.id = ${args.campaign_id}`
          : '';

        const query = `
          SELECT
            search_term_view.search_term,
            search_term_view.status,
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros,
            metrics.conversions,
            metrics.ctr,
            campaign.id,
            campaign.name
          FROM search_term_view
          WHERE segments.date BETWEEN '${dates.start_date}' AND '${dates.end_date}'
            ${campaignFilter}
          ORDER BY metrics.impressions DESC
          LIMIT 1000
        `;

        const searchTerms = await customer.query(query);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  search_terms: searchTerms.map((row: any) => ({
                    term: row.search_term_view.search_term,
                    status: row.search_term_view.status,
                    campaign: {
                      id: row.campaign.id,
                      name: row.campaign.name,
                    },
                    metrics: {
                      impressions: parseInt(row.metrics.impressions || '0'),
                      clicks: parseInt(row.metrics.clicks || '0'),
                      cost: parseFloat((row.metrics.cost_micros / 1000000).toFixed(2)),
                      conversions: parseFloat(row.metrics.conversions || '0'),
                      ctr: parseFloat((row.metrics.ctr * 100).toFixed(2)),
                    },
                  })),
                  date_range: {
                    start: dates.start_date,
                    end: dates.end_date,
                  },
                  total: searchTerms.length,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'google_ads_get_keywords_quality_score': {
        const customer = getCustomer(customerId);
        const campaignFilter = args.campaign_id
          ? `AND campaign.id = ${args.campaign_id}`
          : '';

        const query = `
          SELECT
            ad_group_criterion.keyword.text,
            ad_group_criterion.keyword.match_type,
            ad_group_criterion.quality_info.quality_score,
            ad_group_criterion.quality_info.creative_quality_score,
            ad_group_criterion.quality_info.post_click_quality_score,
            ad_group_criterion.quality_info.search_predicted_ctr,
            campaign.id,
            campaign.name,
            ad_group.id,
            ad_group.name
          FROM keyword_view
          WHERE campaign.status = 'ENABLED'
            AND ad_group.status = 'ENABLED'
            AND ad_group_criterion.status IN ('ENABLED', 'PAUSED')
            ${campaignFilter}
          ORDER BY ad_group_criterion.quality_info.quality_score ASC
          LIMIT 1000
        `;

        const keywords = await customer.query(query);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  keywords: keywords.map((row: any) => ({
                    keyword: row.ad_group_criterion.keyword.text,
                    match_type: row.ad_group_criterion.keyword.match_type,
                    quality_score: row.ad_group_criterion.quality_info.quality_score || 0,
                    creative_quality: row.ad_group_criterion.quality_info.creative_quality_score,
                    landing_page_experience:
                      row.ad_group_criterion.quality_info.post_click_quality_score,
                    expected_ctr: row.ad_group_criterion.quality_info.search_predicted_ctr,
                    campaign: {
                      id: row.campaign.id,
                      name: row.campaign.name,
                    },
                    ad_group: {
                      id: row.ad_group.id,
                      name: row.ad_group.name,
                    },
                  })),
                  total: keywords.length,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'google_ads_get_conversions': {
        const customer = getCustomer(customerId);

        const query = `
          SELECT
            segments.conversion_action_name,
            segments.conversion_action,
            metrics.conversions,
            metrics.conversions_value,
            metrics.all_conversions,
            metrics.all_conversions_value,
            campaign.id,
            campaign.name
          FROM campaign
          WHERE segments.date BETWEEN '${dates.start_date}' AND '${dates.end_date}'
            AND metrics.conversions > 0
          ORDER BY metrics.conversions DESC
        `;

        const conversions = await customer.query(query);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  conversions: conversions.map((row: any) => ({
                    action_name: row.segments.conversion_action_name,
                    action_id: row.segments.conversion_action,
                    conversions: parseFloat(row.metrics.conversions || '0'),
                    conversion_value: parseFloat(row.metrics.conversions_value || '0'),
                    all_conversions: parseFloat(row.metrics.all_conversions || '0'),
                    all_conversions_value: parseFloat(row.metrics.all_conversions_value || '0'),
                    campaign: {
                      id: row.campaign.id,
                      name: row.campaign.name,
                    },
                  })),
                  date_range: {
                    start: dates.start_date,
                    end: dates.end_date,
                  },
                  total: conversions.length,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'google_ads_create_audience': {
        // READ-ONLY mode - just return audience analysis, don't create
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  message: 'Audience analysis (READ-ONLY mode for SORA)',
                  audience_config: args.audience_config,
                  note: 'For actual audience creation, use MARCUS agent with WRITE permissions',
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'google_ads_get_performance_report': {
        const customer = getCustomer(customerId);

        // Get campaign-level performance
        const campaignQuery = `
          SELECT
            campaign.id,
            campaign.name,
            campaign.status,
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros,
            metrics.conversions,
            metrics.conversions_value
          FROM campaign
          WHERE segments.date BETWEEN '${dates.start_date}' AND '${dates.end_date}'
          ORDER BY metrics.cost_micros DESC
        `;

        const campaigns = await customer.query(campaignQuery);

        // Calculate totals
        const totals = campaigns.reduce(
          (acc: any, row: any) => {
            acc.impressions += parseInt(row.metrics.impressions || '0');
            acc.clicks += parseInt(row.metrics.clicks || '0');
            acc.cost += parseFloat(row.metrics.cost_micros || '0') / 1000000;
            acc.conversions += parseFloat(row.metrics.conversions || '0');
            acc.conversions_value += parseFloat(row.metrics.conversions_value || '0');
            return acc;
          },
          {
            impressions: 0,
            clicks: 0,
            cost: 0,
            conversions: 0,
            conversions_value: 0,
          }
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  summary: {
                    total_impressions: totals.impressions,
                    total_clicks: totals.clicks,
                    total_cost: parseFloat(totals.cost.toFixed(2)),
                    total_conversions: totals.conversions,
                    total_conversions_value: parseFloat(totals.conversions_value.toFixed(2)),
                    avg_ctr:
                      totals.impressions > 0
                        ? parseFloat(((totals.clicks / totals.impressions) * 100).toFixed(2))
                        : 0,
                    avg_cpc:
                      totals.clicks > 0 ? parseFloat((totals.cost / totals.clicks).toFixed(2)) : 0,
                    roas:
                      totals.cost > 0
                        ? parseFloat((totals.conversions_value / totals.cost).toFixed(2))
                        : 0,
                  },
                  campaigns: campaigns.map((row: any) => ({
                    id: row.campaign.id,
                    name: row.campaign.name,
                    status: row.campaign.status,
                    metrics: {
                      impressions: parseInt(row.metrics.impressions || '0'),
                      clicks: parseInt(row.metrics.clicks || '0'),
                      cost: parseFloat((row.metrics.cost_micros / 1000000).toFixed(2)),
                      conversions: parseFloat(row.metrics.conversions || '0'),
                      conversions_value: parseFloat(row.metrics.conversions_value || '0'),
                    },
                  })),
                  date_range: {
                    start: dates.start_date,
                    end: dates.end_date,
                    label: dateRange,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: false,
              error: error.message,
              details: error.toString(),
              hint: 'Verify Google Ads API credentials and customer ID',
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Google Ads MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
