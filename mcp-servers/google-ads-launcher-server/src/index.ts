#!/usr/bin/env node

/**
 * MCP Server for Google Ads Campaign Launcher (MARCUS Agent)
 * ⚠️ WRITE OPERATIONS - Can spend real advertising budgets
 * Requires approval workflow and safety checks
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { GoogleAdsApi, enums } from 'google-ads-api';

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

// Initialize MCP Server
const server = new Server(
  {
    name: 'google-ads-launcher-server',
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
    name: 'validate_campaign_config',
    description: 'Validates campaign configuration before creation (safety check)',
    inputSchema: {
      type: 'object',
      properties: {
        customer_id: { type: 'string' },
        name: { type: 'string' },
        daily_budget_micros: { type: 'number' },
        bidding_strategy: { type: 'string' },
        target_cpa: { type: 'number' },
        geo_target_constants: { type: 'array' },
        language_constants: { type: 'array' },
      },
      required: ['customer_id', 'name', 'daily_budget_micros'],
    },
  },
  {
    name: 'create_search_campaign',
    description: 'Creates a new Search campaign (⚠️ WRITE OPERATION)',
    inputSchema: {
      type: 'object',
      properties: {
        customer_id: { type: 'string' },
        name: { type: 'string' },
        daily_budget_micros: { type: 'number', description: 'Daily budget in micros (1$ = 1000000)' },
        bidding_strategy: {
          type: 'string',
          enum: ['TARGET_CPA', 'MAXIMIZE_CONVERSIONS', 'TARGET_ROAS'],
        },
        target_cpa_micros: { type: 'number' },
        target_roas: { type: 'number' },
        geo_target_constants: { type: 'array' },
        language_constants: { type: 'array' },
        status: {
          type: 'string',
          enum: ['ENABLED', 'PAUSED'],
          description: 'ALWAYS start with PAUSED for safety',
        },
      },
      required: [
        'customer_id',
        'name',
        'daily_budget_micros',
        'bidding_strategy',
        'status',
      ],
    },
  },
  {
    name: 'create_ad_group',
    description: 'Creates an ad group within a campaign',
    inputSchema: {
      type: 'object',
      properties: {
        customer_id: { type: 'string' },
        campaign_id: { type: 'string' },
        name: { type: 'string' },
        cpc_bid_micros: { type: 'number' },
        status: { type: 'string' },
      },
      required: ['customer_id', 'campaign_id', 'name'],
    },
  },
  {
    name: 'create_keywords',
    description: 'Adds keywords to an ad group',
    inputSchema: {
      type: 'object',
      properties: {
        customer_id: { type: 'string' },
        ad_group_id: { type: 'string' },
        keywords: {
          type: 'array',
          description: 'Array of {text, match_type} objects',
        },
      },
      required: ['customer_id', 'ad_group_id', 'keywords'],
    },
  },
  {
    name: 'update_campaign_budget',
    description: 'Updates campaign budget (⚠️ WRITE - check learning phase first)',
    inputSchema: {
      type: 'object',
      properties: {
        customer_id: { type: 'string' },
        campaign_id: { type: 'string' },
        new_budget_micros: { type: 'number' },
        force: { type: 'boolean', description: 'Skip safety checks (dangerous!)' },
      },
      required: ['customer_id', 'campaign_id', 'new_budget_micros'],
    },
  },
  {
    name: 'update_campaign_status',
    description: 'Enables or pauses a campaign',
    inputSchema: {
      type: 'object',
      properties: {
        customer_id: { type: 'string' },
        campaign_id: { type: 'string' },
        status: { type: 'string', enum: ['ENABLED', 'PAUSED', 'REMOVED'] },
      },
      required: ['customer_id', 'campaign_id', 'status'],
    },
  },
  {
    name: 'create_responsive_search_ad',
    description: 'Creates a Responsive Search Ad',
    inputSchema: {
      type: 'object',
      properties: {
        customer_id: { type: 'string' },
        ad_group_id: { type: 'string' },
        headlines: { type: 'array', description: 'Array of headlines (3-15)' },
        descriptions: { type: 'array', description: 'Array of descriptions (2-4)' },
        final_urls: { type: 'array' },
      },
      required: ['customer_id', 'ad_group_id', 'headlines', 'descriptions', 'final_urls'],
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
    const customerId = (args.customer_id as string).replace(/-/g, '');
    const customer = getCustomer(customerId);

    switch (name) {
      case 'validate_campaign_config': {
        const dailyBudget = (args.daily_budget_micros as number) / 1000000;
        const warnings: string[] = [];
        let isValid = true;

        // Budget validation
        if (dailyBudget < 5) {
          warnings.push('⚠️ Daily budget below $5 - may not get enough data');
        }
        if (dailyBudget > 500) {
          warnings.push('🚨 Daily budget above $500 - requires manual approval');
          isValid = false;
        }

        // Name validation
        if (!args.name || (args.name as string).length < 3) {
          warnings.push('❌ Campaign name too short');
          isValid = false;
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  is_valid: isValid,
                  warnings,
                  config_summary: {
                    name: args.name,
                    daily_budget: `$${dailyBudget}`,
                    bidding_strategy: args.bidding_strategy,
                  },
                  recommendation: isValid
                    ? '✅ Configuration valid - safe to create campaign'
                    : '❌ Configuration invalid - fix warnings before proceeding',
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'create_search_campaign': {
        // Safety check: MUST be PAUSED
        if (args.status !== 'PAUSED') {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: false,
                    error: 'Safety violation: New campaigns MUST be created with status=PAUSED',
                    hint: 'Create campaign as PAUSED, review, then manually enable after approval',
                  },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }

        // First create campaign budget
        const budgetResourceName = `customers/${customerId}/campaignBudgets/${Date.now()}`;

        const budgetMutation = {
          customer_id: customerId,
          operations: [
            {
              create: {
                name: `Budget for ${args.name}`,
                amount_micros: args.daily_budget_micros,
                delivery_method: enums.BudgetDeliveryMethod.STANDARD,
              },
            },
          ],
        };

        const budgetResponse = await customer.campaignBudgets.create(budgetMutation.operations as any);
        const createdBudgetResourceName = budgetResponse.results[0].resource_name;

        // Then create campaign with the budget
        const campaignMutation = {
          customer_id: customerId,
          operations: [
            {
              create: {
                name: args.name,
                status: enums.CampaignStatus.PAUSED,
                advertising_channel_type: enums.AdvertisingChannelType.SEARCH,
                campaign_budget: createdBudgetResourceName,
                network_settings: {
                  target_google_search: true,
                  target_search_network: true,
                  target_content_network: false,
                },
              },
            },
          ],
        };

        const campaignResponse = await customer.campaigns.create(campaignMutation.operations as any);
        const campaignResourceName = campaignResponse.results[0].resource_name;
        const campaignId = campaignResourceName!.split('/').pop();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  campaign_id: campaignId,
                  resource_name: campaignResourceName,
                  budget_resource_name: createdBudgetResourceName,
                  status: 'PAUSED',
                  message: '✅ Campaign created successfully in PAUSED status',
                  next_steps: [
                    '1. Review campaign settings',
                    '2. Add ad groups and keywords',
                    '3. Create ads',
                    '4. Request approval to enable',
                  ],
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'create_ad_group': {
        const adGroupMutation = {
          customer_id: customerId,
          operations: [
            {
              create: {
                name: args.name,
                campaign: `customers/${customerId}/campaigns/${args.campaign_id}`,
                status: args.status ? enums.AdGroupStatus[args.status as keyof typeof enums.AdGroupStatus] : enums.AdGroupStatus.PAUSED,
                type: enums.AdGroupType.SEARCH_STANDARD,
                cpc_bid_micros: args.cpc_bid_micros || 1000000,
              },
            },
          ],
        };

        const response = await customer.adGroups.create(adGroupMutation.operations as any);
        const adGroupResourceName = response.results[0].resource_name;
        const adGroupId = adGroupResourceName!.split('/').pop();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  ad_group_id: adGroupId,
                  resource_name: adGroupResourceName,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'create_keywords': {
        const keywords = args.keywords as Array<{ text: string; match_type: string }>;

        const keywordOperations = keywords.map((kw) => ({
          create: {
            ad_group: `customers/${customerId}/adGroups/${args.ad_group_id}`,
            keyword: {
              text: kw.text,
              match_type: enums.KeywordMatchType[kw.match_type as keyof typeof enums.KeywordMatchType] || enums.KeywordMatchType.BROAD,
            },
            status: enums.AdGroupCriterionStatus.ENABLED,
          },
        }));

        const mutation = {
          customer_id: customerId,
          operations: keywordOperations,
        };

        const response = await customer.adGroupCriteria.create(mutation.operations as any);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  keywords_created: response.results.length,
                  resource_names: response.results.map((r: any) => r.resource_name),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'update_campaign_budget': {
        // Get current campaign to find budget resource name
        const campaignQuery = `
          SELECT campaign.id, campaign.campaign_budget
          FROM campaign
          WHERE campaign.id = ${args.campaign_id}
        `;

        const campaigns = await customer.query(campaignQuery);

        if (!campaigns || campaigns.length === 0) {
          throw new Error('Campaign not found');
        }

        const budgetResourceName = (campaigns[0] as any).campaign.campaign_budget;

        // Update the budget
        const budgetMutation = {
          customer_id: customerId,
          operations: [
            {
              update: {
                resource_name: budgetResourceName,
                amount_micros: args.new_budget_micros,
              },
              update_mask: { paths: ['amount_micros'] },
            },
          ],
        };

        await customer.campaignBudgets.update(budgetMutation.operations as any);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  campaign_id: args.campaign_id,
                  new_budget: `$${(args.new_budget_micros as number) / 1000000}`,
                  warning: 'Budget updated - monitor performance for changes',
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'update_campaign_status': {
        const statusEnum = enums.CampaignStatus[args.status as keyof typeof enums.CampaignStatus];

        const campaignMutation = {
          customer_id: customerId,
          operations: [
            {
              update: {
                resource_name: `customers/${customerId}/campaigns/${args.campaign_id}`,
                status: statusEnum,
              },
              update_mask: { paths: ['status'] },
            },
          ],
        };

        await customer.campaigns.update(campaignMutation.operations as any);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  campaign_id: args.campaign_id,
                  new_status: args.status,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'create_responsive_search_ad': {
        const headlines = args.headlines as string[];
        const descriptions = args.descriptions as string[];
        const finalUrls = args.final_urls as string[];

        if (headlines.length < 3 || headlines.length > 15) {
          throw new Error('Responsive Search Ads require 3-15 headlines');
        }

        if (descriptions.length < 2 || descriptions.length > 4) {
          throw new Error('Responsive Search Ads require 2-4 descriptions');
        }

        const adMutation = {
          customer_id: customerId,
          operations: [
            {
              create: {
                ad_group: `customers/${customerId}/adGroups/${args.ad_group_id}`,
                status: enums.AdGroupAdStatus.PAUSED,
                ad: {
                  final_urls: finalUrls,
                  responsive_search_ad: {
                    headlines: headlines.map((text) => ({ text })),
                    descriptions: descriptions.map((text) => ({ text })),
                  },
                },
              },
            },
          ],
        };

        const response = await customer.adGroupAds.create(adMutation.operations as any);
        const adResourceName = response.results[0].resource_name;
        const adId = adResourceName!.split('/').pop();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  ad_id: adId,
                  resource_name: adResourceName,
                  status: 'PAUSED',
                  message: '✅ Ad created in PAUSED status - review before enabling',
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
              hint: 'Verify Google Ads API credentials and permissions',
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
  console.error('Google Ads Launcher MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
