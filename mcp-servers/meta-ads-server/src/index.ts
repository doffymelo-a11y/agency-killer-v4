#!/usr/bin/env node

/**
 * MCP Server for Meta Ads (LECTURE SEULE)
 * Allows Sora to read and analyze Meta Ads campaigns, ad sets, and performance
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

// Initialize MCP Server
const server = new Server(
  {
    name: 'meta-ads-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Helper: Make Facebook Graph API request
async function makeGraphAPIRequest(
  endpoint: string,
  accessToken: string,
  params: Record<string, any> = {}
): Promise<any> {
  const queryParams = new URLSearchParams({
    access_token: accessToken,
    ...params,
  });

  const url = `https://graph.facebook.com/v18.0/${endpoint}?${queryParams}`;

  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Facebook API Error: ${error.error?.message || response.statusText}`);
  }

  return response.json();
}

// Define available tools
const tools: Tool[] = [
  {
    name: 'meta_ads_get_ad_accounts',
    description: 'Liste tous les comptes publicitaires Meta Ads accessibles',
    inputSchema: {
      type: 'object',
      properties: {
        credentials: {
          type: 'object',
          description: 'OAuth credentials (access_token)',
          properties: {
            access_token: { type: 'string' },
          },
        },
      },
      required: ['credentials'],
    },
  },
  {
    name: 'meta_ads_get_campaigns',
    description: 'Récupère toutes les campagnes d\'un compte Meta Ads avec leurs métriques',
    inputSchema: {
      type: 'object',
      properties: {
        ad_account_id: {
          type: 'string',
          description: 'ID du compte publicitaire (format: act_123456)',
        },
        date_preset: {
          type: 'string',
          description: 'Période: last_7d, last_30d, last_90d, this_month',
        },
        credentials: {
          type: 'object',
          properties: {
            access_token: { type: 'string' },
          },
        },
      },
      required: ['ad_account_id', 'credentials'],
    },
  },
  {
    name: 'meta_ads_get_insights',
    description: 'Récupère les insights détaillés (métriques) pour une campagne ou ad set',
    inputSchema: {
      type: 'object',
      properties: {
        object_id: {
          type: 'string',
          description: 'ID de la campagne ou ad set',
        },
        level: {
          type: 'string',
          description: 'Niveau: campaign, adset, ad',
        },
        date_preset: { type: 'string' },
        breakdown: {
          type: 'string',
          description: 'Breakdown: age, gender, placement, device_platform (optionnel)',
        },
        credentials: { type: 'object' },
      },
      required: ['object_id', 'level', 'credentials'],
    },
  },
  {
    name: 'meta_ads_get_ad_sets',
    description: 'Liste tous les ad sets (ensembles de publicités) d\'une campagne',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: { type: 'string', description: 'ID de la campagne' },
        credentials: { type: 'object' },
      },
      required: ['campaign_id', 'credentials'],
    },
  },
  {
    name: 'meta_ads_check_learning_phase',
    description: 'Vérifie si les ad sets sont en phase d\'apprentissage (Learning Phase)',
    inputSchema: {
      type: 'object',
      properties: {
        ad_account_id: { type: 'string' },
        credentials: { type: 'object' },
      },
      required: ['ad_account_id', 'credentials'],
    },
  },
  {
    name: 'meta_ads_get_pixel_events',
    description: 'Récupère les événements du Meta Pixel pour analyse de tracking',
    inputSchema: {
      type: 'object',
      properties: {
        pixel_id: { type: 'string', description: 'ID du Meta Pixel' },
        credentials: { type: 'object' },
      },
      required: ['pixel_id', 'credentials'],
    },
  },
  {
    name: 'meta_ads_get_audience_overlap',
    description: 'Analyse le chevauchement d\'audiences entre plusieurs ad sets',
    inputSchema: {
      type: 'object',
      properties: {
        ad_account_id: { type: 'string' },
        audience_ids: {
          type: 'array',
          description: 'IDs des audiences à comparer',
          items: { type: 'string' },
        },
        credentials: { type: 'object' },
      },
      required: ['ad_account_id', 'audience_ids', 'credentials'],
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
    const credentials = args.credentials as any;
    const accessToken = credentials.access_token;

    switch (name) {
      case 'meta_ads_get_ad_accounts': {
        const data = await makeGraphAPIRequest('me/adaccounts', accessToken, {
          fields: 'id,name,account_status,currency,timezone_name',
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  ad_accounts: data.data.map((account: any) => ({
                    id: account.id,
                    name: account.name,
                    status: account.account_status,
                    currency: account.currency,
                    timezone: account.timezone_name,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'meta_ads_get_campaigns': {
        const datePreset = (args.date_preset as any as string) || 'last_30d';

        const data = await makeGraphAPIRequest(`${args.ad_account_id as any}/campaigns`, accessToken, {
          fields:
            'id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time,insights{spend,impressions,clicks,ctr,cpc,cpm,conversions,cost_per_conversion}',
          date_preset: datePreset,
        });

        const campaigns = data.data.map((campaign: any) => {
          const insights = campaign.insights?.data?.[0] || {};
          return {
            campaign_id: campaign.id,
            name: campaign.name,
            status: campaign.status,
            objective: campaign.objective,
            daily_budget: campaign.daily_budget,
            lifetime_budget: campaign.lifetime_budget,
            start_time: campaign.start_time,
            stop_time: campaign.stop_time,
            metrics: {
              spend: insights.spend || 0,
              impressions: insights.impressions || 0,
              clicks: insights.clicks || 0,
              ctr: insights.ctr || 0,
              cpc: insights.cpc || 0,
              cpm: insights.cpm || 0,
              conversions: insights.conversions || 0,
              cost_per_conversion: insights.cost_per_conversion || 0,
            },
          };
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ campaigns, date_preset: datePreset }, null, 2),
            },
          ],
        };
      }

      case 'meta_ads_get_insights': {
        const datePreset = args.date_preset as any || 'last_30d';
        const breakdown = args.breakdown as any || '';

        const params: Record<string, any> = {
          level: args.level as any,
          date_preset: datePreset,
          fields:
            'spend,impressions,clicks,ctr,cpc,cpm,reach,frequency,conversions,cost_per_conversion,actions,action_values',
        };

        if (breakdown) {
          params.breakdowns = breakdown;
        }

        const data = await makeGraphAPIRequest(`${args.object_id as any}/insights`, accessToken, params);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  insights: data.data,
                  level: args.level as any,
                  date_preset: datePreset,
                  breakdown: breakdown || 'none',
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'meta_ads_get_ad_sets': {
        const data = await makeGraphAPIRequest(`${args.campaign_id as any}/adsets`, accessToken, {
          fields:
            'id,name,status,optimization_goal,billing_event,bid_amount,daily_budget,lifetime_budget,targeting,delivery_estimate,insights{spend,impressions,clicks,ctr,conversions}',
        });

        const adSets = data.data.map((adSet: any) => {
          const insights = adSet.insights?.data?.[0] || {};
          return {
            adset_id: adSet.id,
            name: adSet.name,
            status: adSet.status,
            optimization_goal: adSet.optimization_goal,
            billing_event: adSet.billing_event,
            bid_amount: adSet.bid_amount,
            daily_budget: adSet.daily_budget,
            lifetime_budget: adSet.lifetime_budget,
            targeting: adSet.targeting,
            delivery_estimate: adSet.delivery_estimate,
            metrics: {
              spend: insights.spend || 0,
              impressions: insights.impressions || 0,
              clicks: insights.clicks || 0,
              ctr: insights.ctr || 0,
              conversions: insights.conversions || 0,
            },
          };
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ ad_sets: adSets }, null, 2),
            },
          ],
        };
      }

      case 'meta_ads_check_learning_phase': {
        const data = await makeGraphAPIRequest(`${args.ad_account_id as any}/adsets`, accessToken, {
          fields:
            'id,name,status,learning_stage_info,delivery_estimate,recommendations,insights{spend,conversions}',
          date_preset: 'last_7d',
        });

        const learningPhaseInfo = data.data.map((adSet: any) => {
          const insights = adSet.insights?.data?.[0] || {};
          return {
            adset_id: adSet.id,
            name: adSet.name,
            status: adSet.status,
            learning_stage: adSet.learning_stage_info,
            delivery_estimate: adSet.delivery_estimate,
            recommendations: adSet.recommendations,
            last_7d_spend: insights.spend || 0,
            last_7d_conversions: insights.conversions || 0,
          };
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ learning_phase_analysis: learningPhaseInfo }, null, 2),
            },
          ],
        };
      }

      case 'meta_ads_get_pixel_events': {
        const data = await makeGraphAPIRequest(`${args.pixel_id as any}`, accessToken, {
          fields: 'name,last_fired_time,can_proxy,is_unavailable,stats',
        });

        const eventsData = await makeGraphAPIRequest(`${args.pixel_id as any}/stats`, accessToken, {
          aggregation: 'event',
          start_time: Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60, // Last 7 days
          end_time: Math.floor(Date.now() / 1000),
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  pixel_info: {
                    name: data.name,
                    last_fired: data.last_fired_time,
                    can_proxy: data.can_proxy,
                    is_unavailable: data.is_unavailable,
                  },
                  events: eventsData.data || [],
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'meta_ads_get_audience_overlap': {
        // Audience overlap requires Reach and Frequency buying type
        // This is a simplified version that returns audience details

        const audiencePromises = (args.audience_ids as any).map((audienceId: string) =>
          makeGraphAPIRequest(audienceId, accessToken, {
            fields: 'id,name,approximate_count,subtype,delivery_status',
          })
        );

        const audiences = await Promise.all(audiencePromises);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  audiences: audiences.map((aud) => ({
                    id: aud.id,
                    name: aud.name,
                    size: aud.approximate_count,
                    type: aud.subtype,
                    status: aud.delivery_status,
                  })),
                  note: 'Overlap analysis requires Reach & Frequency campaign type. Use these audience sizes to estimate potential overlap.',
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
  console.error('Meta Ads MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
