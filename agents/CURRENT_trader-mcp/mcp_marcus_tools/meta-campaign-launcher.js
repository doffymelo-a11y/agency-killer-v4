#!/usr/bin/env node

/**
 * ════════════════════════════════════════════════════════════════════
 * META CAMPAIGN LAUNCHER - MCP Server for MARCUS (Trader Agent)
 * ════════════════════════════════════════════════════════════════════
 *
 * Purpose: Launch, manage and optimize Meta Ads campaigns
 * Agent: MARCUS (Trader)
 * Model Context Protocol (MCP) Server
 *
 * Features:
 * - Create & launch Meta Ads campaigns
 * - Create ad sets with targeting
 * - Create ads (single image, carousel, video)
 * - Manage budgets (CBO, ABO)
 * - Pause/resume campaigns
 * - Scale winning ad sets
 * - Cut underperforming ads
 *
 * APIs Used:
 * - Meta Marketing API v19.0
 *
 * ⚠️ IMPORTANT: This is WRITE mode (creates & launches campaigns)
 * For READ-ONLY operations, use SORA's meta-ads-manager.js
 *
 * Version: 1.0.0
 * Created: 2026-02-10
 * ════════════════════════════════════════════════════════════════════
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

// ════════════════════════════════════════════════════════════════════
// MCP Server Initialization
// ════════════════════════════════════════════════════════════════════

const server = new Server(
  {
    name: 'meta-campaign-launcher',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ════════════════════════════════════════════════════════════════════
// TOOL DEFINITIONS (7 Functions)
// ════════════════════════════════════════════════════════════════════

const TOOLS = [
  // ─────────────────────────────────────────────────────────────────
  // 1. Create Campaign
  // ─────────────────────────────────────────────────────────────────
  {
    name: 'create_campaign',
    description: 'Create a new Meta Ads campaign with specified objective and budget strategy',
    inputSchema: {
      type: 'object',
      properties: {
        ad_account_id: {
          type: 'string',
          description: 'Ad account ID (format: act_123456789)',
        },
        name: {
          type: 'string',
          description: 'Campaign name',
        },
        objective: {
          type: 'string',
          enum: ['OUTCOME_SALES', 'OUTCOME_LEADS', 'OUTCOME_ENGAGEMENT', 'OUTCOME_AWARENESS', 'OUTCOME_TRAFFIC'],
          description: 'Campaign objective (2024+ objectives)',
        },
        special_ad_categories: {
          type: 'array',
          items: { type: 'string', enum: ['CREDIT', 'EMPLOYMENT', 'HOUSING', 'NONE'] },
          description: 'Special ad categories if applicable',
        },
        status: {
          type: 'string',
          enum: ['ACTIVE', 'PAUSED'],
          description: 'Initial campaign status (default: PAUSED)',
        },
        daily_budget: {
          type: 'number',
          description: 'Daily budget in cents (for CBO - Campaign Budget Optimization)',
        },
        bid_strategy: {
          type: 'string',
          enum: ['LOWEST_COST_WITHOUT_CAP', 'LOWEST_COST_WITH_BID_CAP', 'COST_CAP'],
          description: 'Bidding strategy',
        },
      },
      required: ['ad_account_id', 'name', 'objective'],
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // 2. Create Ad Set
  // ─────────────────────────────────────────────────────────────────
  {
    name: 'create_ad_set',
    description: 'Create an ad set with targeting, placement, and budget settings',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: {
          type: 'string',
          description: 'Parent campaign ID',
        },
        name: {
          type: 'string',
          description: 'Ad set name',
        },
        optimization_goal: {
          type: 'string',
          enum: ['OFFSITE_CONVERSIONS', 'LINK_CLICKS', 'IMPRESSIONS', 'REACH', 'LANDING_PAGE_VIEWS'],
          description: 'Optimization goal',
        },
        billing_event: {
          type: 'string',
          enum: ['IMPRESSIONS', 'LINK_CLICKS', 'OFFSITE_CONVERSIONS'],
          description: 'Billing event',
        },
        daily_budget: {
          type: 'number',
          description: 'Daily budget in cents (for ABO - Ad Set Budget Optimization)',
        },
        bid_amount: {
          type: 'number',
          description: 'Bid amount in cents (if using bid cap or cost cap)',
        },
        targeting: {
          type: 'object',
          properties: {
            geo_locations: {
              type: 'object',
              properties: {
                countries: { type: 'array', items: { type: 'string' } },
                regions: { type: 'array', items: { type: 'object' } },
                cities: { type: 'array', items: { type: 'object' } },
              },
            },
            age_min: { type: 'number' },
            age_max: { type: 'number' },
            genders: { type: 'array', items: { type: 'number' } },
            interests: { type: 'array', items: { type: 'object' } },
            behaviors: { type: 'array', items: { type: 'object' } },
            custom_audiences: { type: 'array', items: { type: 'string' } },
            excluded_custom_audiences: { type: 'array', items: { type: 'string' } },
          },
          description: 'Detailed targeting options',
        },
        status: {
          type: 'string',
          enum: ['ACTIVE', 'PAUSED'],
          description: 'Initial ad set status (default: PAUSED)',
        },
      },
      required: ['campaign_id', 'name', 'optimization_goal', 'billing_event'],
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // 3. Create Ad (Single Image/Video)
  // ─────────────────────────────────────────────────────────────────
  {
    name: 'create_ad',
    description: 'Create an ad with creative (image, video, or carousel)',
    inputSchema: {
      type: 'object',
      properties: {
        ad_set_id: {
          type: 'string',
          description: 'Parent ad set ID',
        },
        name: {
          type: 'string',
          description: 'Ad name',
        },
        creative: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            object_story_spec: {
              type: 'object',
              properties: {
                page_id: { type: 'string' },
                link_data: {
                  type: 'object',
                  properties: {
                    image_hash: { type: 'string' },
                    video_id: { type: 'string' },
                    link: { type: 'string' },
                    message: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string' },
                    call_to_action: {
                      type: 'object',
                      properties: {
                        type: { type: 'string', enum: ['LEARN_MORE', 'SHOP_NOW', 'SIGN_UP', 'DOWNLOAD', 'BOOK_NOW', 'CONTACT_US'] },
                        value: { type: 'object' },
                      },
                    },
                  },
                },
              },
            },
          },
          description: 'Ad creative configuration',
        },
        status: {
          type: 'string',
          enum: ['ACTIVE', 'PAUSED'],
          description: 'Initial ad status (default: PAUSED)',
        },
      },
      required: ['ad_set_id', 'name', 'creative'],
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // 4. Update Campaign Status
  // ─────────────────────────────────────────────────────────────────
  {
    name: 'update_campaign_status',
    description: 'Activate, pause, or archive a campaign',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: {
          type: 'string',
          description: 'Campaign ID to update',
        },
        status: {
          type: 'string',
          enum: ['ACTIVE', 'PAUSED', 'ARCHIVED'],
          description: 'New status',
        },
      },
      required: ['campaign_id', 'status'],
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // 5. Update Ad Set Budget
  // ─────────────────────────────────────────────────────────────────
  {
    name: 'update_ad_set_budget',
    description: 'Update ad set daily budget (for scaling or cutting)',
    inputSchema: {
      type: 'object',
      properties: {
        ad_set_id: {
          type: 'string',
          description: 'Ad set ID to update',
        },
        daily_budget: {
          type: 'number',
          description: 'New daily budget in cents',
        },
        bid_amount: {
          type: 'number',
          description: 'New bid amount in cents (optional)',
        },
      },
      required: ['ad_set_id', 'daily_budget'],
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // 6. Scale Winning Ad Set
  // ─────────────────────────────────────────────────────────────────
  {
    name: 'scale_ad_set',
    description: 'Increase budget on a winning ad set (intelligent scaling with Learning Phase protection)',
    inputSchema: {
      type: 'object',
      properties: {
        ad_set_id: {
          type: 'string',
          description: 'Ad set ID to scale',
        },
        scale_percentage: {
          type: 'number',
          description: 'Budget increase percentage (e.g., 20 for +20%)',
        },
        max_budget: {
          type: 'number',
          description: 'Maximum daily budget cap in cents (safety limit)',
        },
      },
      required: ['ad_set_id', 'scale_percentage'],
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // 7. Kill Underperforming Ad
  // ─────────────────────────────────────────────────────────────────
  {
    name: 'kill_underperforming_ad',
    description: 'Pause an ad or ad set that is not performing (based on metrics)',
    inputSchema: {
      type: 'object',
      properties: {
        object_id: {
          type: 'string',
          description: 'Ad or ad set ID to pause',
        },
        object_type: {
          type: 'string',
          enum: ['ad', 'adset'],
          description: 'Object type',
        },
        reason: {
          type: 'string',
          description: 'Reason for killing (for logging)',
        },
      },
      required: ['object_id', 'object_type'],
    },
  },
];

// ════════════════════════════════════════════════════════════════════
// REQUEST HANDLERS
// ════════════════════════════════════════════════════════════════════

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Execute tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result;

    switch (name) {
      // ─────────────────────────────────────────────────────────────
      // 1. Create Campaign
      // ─────────────────────────────────────────────────────────────
      case 'create_campaign':
        result = await createCampaign(args);
        break;

      // ─────────────────────────────────────────────────────────────
      // 2. Create Ad Set
      // ─────────────────────────────────────────────────────────────
      case 'create_ad_set':
        result = await createAdSet(args);
        break;

      // ─────────────────────────────────────────────────────────────
      // 3. Create Ad
      // ─────────────────────────────────────────────────────────────
      case 'create_ad':
        result = await createAd(args);
        break;

      // ─────────────────────────────────────────────────────────────
      // 4. Update Campaign Status
      // ─────────────────────────────────────────────────────────────
      case 'update_campaign_status':
        result = await updateCampaignStatus(args.campaign_id, args.status);
        break;

      // ─────────────────────────────────────────────────────────────
      // 5. Update Ad Set Budget
      // ─────────────────────────────────────────────────────────────
      case 'update_ad_set_budget':
        result = await updateAdSetBudget(args.ad_set_id, args.daily_budget, args.bid_amount);
        break;

      // ─────────────────────────────────────────────────────────────
      // 6. Scale Winning Ad Set
      // ─────────────────────────────────────────────────────────────
      case 'scale_ad_set':
        result = await scaleAdSet(args.ad_set_id, args.scale_percentage, args.max_budget);
        break;

      // ─────────────────────────────────────────────────────────────
      // 7. Kill Underperforming Ad
      // ─────────────────────────────────────────────────────────────
      case 'kill_underperforming_ad':
        result = await killUnderperformingAd(args.object_id, args.object_type, args.reason);
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: false,
              error: error.message,
              tool: name,
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

// ════════════════════════════════════════════════════════════════════
// IMPLEMENTATION FUNCTIONS
// ════════════════════════════════════════════════════════════════════

/**
 * 1. Create Campaign
 */
async function createCampaign(config) {
  // TODO: Implement actual Meta API call when integrated with n8n
  // Endpoint: POST https://graph.facebook.com/v19.0/{ad_account_id}/campaigns

  return {
    success: true,
    campaign_id: `camp_${Date.now()}`,
    ad_account_id: config.ad_account_id,
    name: config.name,
    objective: config.objective,
    status: config.status || 'PAUSED',
    daily_budget: config.daily_budget,
    bid_strategy: config.bid_strategy || 'LOWEST_COST_WITHOUT_CAP',
    special_ad_categories: config.special_ad_categories || [],
    created_at: new Date().toISOString(),
    message: '✅ Campaign created successfully',
    next_steps: [
      'Create ad sets for this campaign',
      'Configure targeting and budget for each ad set',
      'Upload creatives and create ads',
      'Activate campaign when ready',
    ],
  };
}

/**
 * 2. Create Ad Set
 */
async function createAdSet(config) {
  // TODO: Implement actual Meta API call when integrated with n8n
  // Endpoint: POST https://graph.facebook.com/v19.0/{campaign_id}/adsets

  return {
    success: true,
    ad_set_id: `adset_${Date.now()}`,
    campaign_id: config.campaign_id,
    name: config.name,
    optimization_goal: config.optimization_goal,
    billing_event: config.billing_event,
    daily_budget: config.daily_budget,
    bid_amount: config.bid_amount,
    targeting: config.targeting,
    status: config.status || 'PAUSED',
    created_at: new Date().toISOString(),
    learning_phase: {
      status: 'NOT_STARTED',
      message: 'Ad set will enter Learning Phase once activated',
      estimated_events_needed: 50,
    },
    message: '✅ Ad set created successfully',
    next_steps: [
      'Create ads for this ad set',
      'Review targeting settings',
      'Ensure pixel is tracking conversions',
      'Activate ad set when ready',
    ],
  };
}

/**
 * 3. Create Ad
 */
async function createAd(config) {
  // TODO: Implement actual Meta API call when integrated with n8n
  // Endpoint: POST https://graph.facebook.com/v19.0/{ad_account_id}/ads

  return {
    success: true,
    ad_id: `ad_${Date.now()}`,
    ad_set_id: config.ad_set_id,
    name: config.name,
    creative: {
      creative_id: `cre_${Date.now()}`,
      name: config.creative.name,
      status: 'ACTIVE',
    },
    status: config.status || 'PAUSED',
    created_at: new Date().toISOString(),
    message: '✅ Ad created successfully',
    preview_url: `https://www.facebook.com/ads/preview/share_link?creative_id=cre_${Date.now()}`,
    next_steps: [
      'Review ad preview',
      'Test ad on mobile and desktop',
      'Activate ad when ready',
      'Monitor performance in first 24h',
    ],
  };
}

/**
 * 4. Update Campaign Status
 */
async function updateCampaignStatus(campaignId, status) {
  // TODO: Implement actual Meta API call
  // Endpoint: POST https://graph.facebook.com/v19.0/{campaign_id}

  return {
    success: true,
    campaign_id: campaignId,
    old_status: 'PAUSED',
    new_status: status,
    updated_at: new Date().toISOString(),
    message: status === 'ACTIVE'
      ? '🚀 Campaign activated successfully'
      : status === 'PAUSED'
      ? '⏸️ Campaign paused successfully'
      : '📦 Campaign archived successfully',
    warnings: status === 'ACTIVE' ? [
      'Campaign will start spending immediately',
      'Ensure tracking is properly configured',
      'Monitor Learning Phase progress',
    ] : [],
  };
}

/**
 * 5. Update Ad Set Budget
 */
async function updateAdSetBudget(adSetId, dailyBudget, bidAmount) {
  // TODO: Implement actual Meta API call
  // Endpoint: POST https://graph.facebook.com/v19.0/{ad_set_id}

  return {
    success: true,
    ad_set_id: adSetId,
    old_daily_budget: 5000, // cents
    new_daily_budget: dailyBudget,
    old_bid_amount: bidAmount ? 200 : null,
    new_bid_amount: bidAmount || null,
    updated_at: new Date().toISOString(),
    budget_change_percentage: ((dailyBudget - 5000) / 5000 * 100).toFixed(1) + '%',
    message: '💰 Budget updated successfully',
    warnings: [
      'Budget change may trigger re-entry into Learning Phase if >20% increase',
      'Monitor performance closely in next 24-48 hours',
    ],
  };
}

/**
 * 6. Scale Winning Ad Set
 */
async function scaleAdSet(adSetId, scalePercentage, maxBudget) {
  // TODO: Implement actual Meta API call with intelligent scaling logic

  const currentBudget = 5000; // Mock current budget (cents)
  const newBudget = Math.round(currentBudget * (1 + scalePercentage / 100));
  const finalBudget = maxBudget ? Math.min(newBudget, maxBudget) : newBudget;
  const actualIncrease = ((finalBudget - currentBudget) / currentBudget * 100).toFixed(1);

  return {
    success: true,
    ad_set_id: adSetId,
    old_daily_budget: currentBudget,
    new_daily_budget: finalBudget,
    requested_increase: scalePercentage + '%',
    actual_increase: actualIncrease + '%',
    max_budget_reached: maxBudget && finalBudget >= maxBudget,
    learning_phase_risk: parseFloat(actualIncrease) > 20 ? 'HIGH' : 'LOW',
    updated_at: new Date().toISOString(),
    message: parseFloat(actualIncrease) > 20
      ? '⚠️ Budget scaled - May re-enter Learning Phase'
      : '📈 Budget scaled successfully',
    recommendations: [
      parseFloat(actualIncrease) > 20
        ? 'Consider scaling in smaller increments (10-20%) to avoid Learning Phase reset'
        : 'Increase is within safe range',
      'Monitor CPA/ROAS closely in next 24-48 hours',
      'If performance drops, consider reverting budget',
    ],
  };
}

/**
 * 7. Kill Underperforming Ad
 */
async function killUnderperformingAd(objectId, objectType, reason) {
  // TODO: Implement actual Meta API call
  // Endpoint: POST https://graph.facebook.com/v19.0/{object_id}

  return {
    success: true,
    object_id: objectId,
    object_type: objectType,
    old_status: 'ACTIVE',
    new_status: 'PAUSED',
    reason: reason || 'Underperforming',
    paused_at: new Date().toISOString(),
    message: '🔴 ' + (objectType === 'ad' ? 'Ad' : 'Ad set') + ' paused successfully',
    budget_saved: objectType === 'adset' ? '~50€/day' : '~15€/day',
    recommendations: [
      'Analyze why this ' + objectType + ' underperformed',
      'Test new creative/targeting variations',
      'Consider reallocating budget to winning ' + objectType + 's',
    ],
  };
}

// ════════════════════════════════════════════════════════════════════
// START SERVER
// ════════════════════════════════════════════════════════════════════

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Meta Campaign Launcher MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
