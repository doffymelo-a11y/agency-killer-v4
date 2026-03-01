#!/usr/bin/env node

/**
 * ════════════════════════════════════════════════════════════════════
 * BUDGET OPTIMIZER - MCP Server for MARCUS (Trader Agent)
 * ════════════════════════════════════════════════════════════════════
 *
 * Purpose: Intelligent budget optimization across campaigns and platforms
 * Agent: MARCUS (Trader)
 * Model Context Protocol (MCP) Server
 *
 * Features:
 * - Analyze campaign performance across platforms
 * - Recommend budget reallocations
 * - Identify winners and losers
 * - Calculate optimal budget distribution
 * - Learning Phase protection
 * - ROAS/CPA-based optimization
 * - Multi-platform budget balancing
 *
 * Algorithms:
 * - Performance scoring (ROAS, CPA, CTR, Quality Score)
 * - Budget allocation based on ROI
 * - Learning Phase detection and protection
 * - Confidence intervals for statistical significance
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
    name: 'budget-optimizer',
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
  // 1. Analyze Campaign Performance
  // ─────────────────────────────────────────────────────────────────
  {
    name: 'analyze_campaign_performance',
    description: 'Analyze and score campaign performance across all metrics',
    inputSchema: {
      type: 'object',
      properties: {
        campaigns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              platform: { type: 'string', enum: ['meta', 'google_ads', 'tiktok', 'linkedin'] },
              spend: { type: 'number' },
              revenue: { type: 'number' },
              conversions: { type: 'number' },
              clicks: { type: 'number' },
              impressions: { type: 'number' },
              daily_budget: { type: 'number' },
            },
            required: ['id', 'name', 'platform', 'spend', 'conversions'],
          },
          description: 'List of campaigns to analyze',
        },
        optimization_goal: {
          type: 'string',
          enum: ['ROAS', 'CPA', 'CONVERSIONS', 'REVENUE'],
          description: 'Primary optimization goal',
        },
        target_roas: {
          type: 'number',
          description: 'Target ROAS (if optimization_goal is ROAS)',
        },
        target_cpa: {
          type: 'number',
          description: 'Target CPA (if optimization_goal is CPA)',
        },
      },
      required: ['campaigns', 'optimization_goal'],
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // 2. Recommend Budget Reallocation
  // ─────────────────────────────────────────────────────────────────
  {
    name: 'recommend_budget_reallocation',
    description: 'Calculate optimal budget distribution based on performance',
    inputSchema: {
      type: 'object',
      properties: {
        campaigns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              current_budget: { type: 'number' },
              roas: { type: 'number' },
              cpa: { type: 'number' },
              learning_phase: { type: 'string', enum: ['ACTIVE', 'GRADUATED', 'LIMITED', 'NOT_STARTED'] },
            },
            required: ['id', 'name', 'current_budget', 'roas'],
          },
          description: 'Campaigns to rebalance',
        },
        total_budget: {
          type: 'number',
          description: 'Total budget to distribute',
        },
        min_budget_per_campaign: {
          type: 'number',
          description: 'Minimum budget per campaign (safety limit)',
        },
        protect_learning_phase: {
          type: 'boolean',
          description: 'Protect campaigns in Learning Phase from budget cuts (default: true)',
        },
      },
      required: ['campaigns', 'total_budget'],
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // 3. Identify Winners and Losers
  // ─────────────────────────────────────────────────────────────────
  {
    name: 'identify_winners_losers',
    description: 'Classify campaigns/ad sets as winners, losers, or testing based on performance',
    inputSchema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string', enum: ['campaign', 'ad_set', 'ad'] },
              roas: { type: 'number' },
              cpa: { type: 'number' },
              spend: { type: 'number' },
              conversions: { type: 'number' },
              days_active: { type: 'number' },
            },
            required: ['id', 'name', 'type', 'spend', 'conversions', 'days_active'],
          },
          description: 'Items to classify',
        },
        target_roas: {
          type: 'number',
          description: 'Target ROAS threshold',
        },
        target_cpa: {
          type: 'number',
          description: 'Target CPA threshold',
        },
        min_spend_threshold: {
          type: 'number',
          description: 'Minimum spend before classification (default: 100€)',
        },
        min_days_active: {
          type: 'number',
          description: 'Minimum days active before classification (default: 3)',
        },
      },
      required: ['items'],
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // 4. Calculate Optimal Budget Distribution
  // ─────────────────────────────────────────────────────────────────
  {
    name: 'calculate_optimal_distribution',
    description: 'Calculate mathematically optimal budget distribution using performance weighting',
    inputSchema: {
      type: 'object',
      properties: {
        campaigns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              performance_score: { type: 'number' },
              current_budget: { type: 'number' },
              max_budget: { type: 'number' },
              min_budget: { type: 'number' },
            },
            required: ['id', 'name', 'performance_score', 'current_budget'],
          },
          description: 'Campaigns with performance scores',
        },
        total_budget: {
          type: 'number',
          description: 'Total budget available',
        },
        algorithm: {
          type: 'string',
          enum: ['proportional', 'winner_takes_all', 'balanced'],
          description: 'Budget distribution algorithm (default: proportional)',
        },
      },
      required: ['campaigns', 'total_budget'],
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // 5. Learning Phase Protection Check
  // ─────────────────────────────────────────────────────────────────
  {
    name: 'learning_phase_protection',
    description: 'Check if budget changes will negatively impact Learning Phase',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: {
          type: 'string',
          description: 'Campaign or ad set ID',
        },
        current_budget: {
          type: 'number',
          description: 'Current daily budget',
        },
        proposed_budget: {
          type: 'number',
          description: 'Proposed new budget',
        },
        learning_phase_status: {
          type: 'string',
          enum: ['ACTIVE', 'GRADUATED', 'LIMITED', 'NOT_STARTED'],
          description: 'Current Learning Phase status',
        },
        platform: {
          type: 'string',
          enum: ['meta', 'google_ads'],
          description: 'Platform (different rules apply)',
        },
      },
      required: ['campaign_id', 'current_budget', 'proposed_budget', 'learning_phase_status', 'platform'],
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // 6. Multi-Platform Budget Balancing
  // ─────────────────────────────────────────────────────────────────
  {
    name: 'multi_platform_balancing',
    description: 'Balance budgets across Meta, Google Ads, TikTok, LinkedIn based on overall ROAS',
    inputSchema: {
      type: 'object',
      properties: {
        platforms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', enum: ['meta', 'google_ads', 'tiktok', 'linkedin'] },
              current_budget: { type: 'number' },
              spend: { type: 'number' },
              revenue: { type: 'number' },
              roas: { type: 'number' },
              min_budget: { type: 'number' },
              max_budget: { type: 'number' },
            },
            required: ['name', 'current_budget', 'roas'],
          },
          description: 'Platform performance data',
        },
        total_budget: {
          type: 'number',
          description: 'Total budget to distribute across platforms',
        },
        target_roas: {
          type: 'number',
          description: 'Overall target ROAS',
        },
      },
      required: ['platforms', 'total_budget'],
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // 7. Confidence Interval Check
  // ─────────────────────────────────────────────────────────────────
  {
    name: 'confidence_interval_check',
    description: 'Check if performance data is statistically significant before making decisions',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: {
          type: 'string',
          description: 'Campaign ID',
        },
        conversions: {
          type: 'number',
          description: 'Number of conversions',
        },
        spend: {
          type: 'number',
          description: 'Total spend',
        },
        days_active: {
          type: 'number',
          description: 'Number of days campaign has been active',
        },
        confidence_level: {
          type: 'number',
          description: 'Confidence level (e.g., 0.95 for 95%)',
        },
      },
      required: ['campaign_id', 'conversions', 'spend', 'days_active'],
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
      case 'analyze_campaign_performance':
        result = await analyzeCampaignPerformance(args);
        break;

      case 'recommend_budget_reallocation':
        result = await recommendBudgetReallocation(args);
        break;

      case 'identify_winners_losers':
        result = await identifyWinnersLosers(args);
        break;

      case 'calculate_optimal_distribution':
        result = await calculateOptimalDistribution(args);
        break;

      case 'learning_phase_protection':
        result = await learningPhaseProtection(args);
        break;

      case 'multi_platform_balancing':
        result = await multiPlatformBalancing(args);
        break;

      case 'confidence_interval_check':
        result = await confidenceIntervalCheck(args);
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
 * 1. Analyze Campaign Performance
 */
async function analyzeCampaignPerformance(config) {
  const campaigns = config.campaigns.map(camp => {
    const roas = camp.revenue && camp.spend > 0 ? camp.revenue / camp.spend : 0;
    const cpa = camp.conversions > 0 ? camp.spend / camp.conversions : Infinity;
    const ctr = camp.clicks && camp.impressions > 0 ? (camp.clicks / camp.impressions) * 100 : 0;
    const conversion_rate = camp.clicks && camp.conversions > 0 ? (camp.conversions / camp.clicks) * 100 : 0;

    // Performance scoring (0-100)
    let performance_score = 0;

    if (config.optimization_goal === 'ROAS' && config.target_roas) {
      performance_score = Math.min(100, (roas / config.target_roas) * 100);
    } else if (config.optimization_goal === 'CPA' && config.target_cpa) {
      performance_score = cpa < config.target_cpa ? Math.min(100, (config.target_cpa / cpa) * 100) : 0;
    } else {
      // General performance score
      performance_score = Math.min(100, roas * 20); // Simple ROAS-based scoring
    }

    return {
      id: camp.id,
      name: camp.name,
      platform: camp.platform,
      spend: camp.spend,
      revenue: camp.revenue || 0,
      conversions: camp.conversions,
      roas: parseFloat(roas.toFixed(2)),
      cpa: parseFloat(cpa.toFixed(2)),
      ctr: parseFloat(ctr.toFixed(2)),
      conversion_rate: parseFloat(conversion_rate.toFixed(2)),
      performance_score: Math.round(performance_score),
      grade: performance_score >= 80 ? 'A' : performance_score >= 60 ? 'B' : performance_score >= 40 ? 'C' : 'D',
      status: performance_score >= 60 ? 'WINNING' : performance_score >= 40 ? 'TESTING' : 'LOSING',
    };
  });

  return {
    success: true,
    analyzed_at: new Date().toISOString(),
    optimization_goal: config.optimization_goal,
    target_roas: config.target_roas,
    target_cpa: config.target_cpa,
    campaigns: campaigns,
    summary: {
      total_campaigns: campaigns.length,
      total_spend: campaigns.reduce((sum, c) => sum + c.spend, 0),
      total_revenue: campaigns.reduce((sum, c) => sum + c.revenue, 0),
      total_conversions: campaigns.reduce((sum, c) => sum + c.conversions, 0),
      overall_roas: campaigns.reduce((sum, c) => sum + c.revenue, 0) / campaigns.reduce((sum, c) => sum + c.spend, 0),
      winners: campaigns.filter(c => c.status === 'WINNING').length,
      testing: campaigns.filter(c => c.status === 'TESTING').length,
      losers: campaigns.filter(c => c.status === 'LOSING').length,
    },
    recommendations: [
      campaigns.filter(c => c.status === 'LOSING').length > 0
        ? `Pause or optimize ${campaigns.filter(c => c.status === 'LOSING').length} losing campaigns`
        : null,
      campaigns.filter(c => c.status === 'WINNING').length > 0
        ? `Scale budget on ${campaigns.filter(c => c.status === 'WINNING').length} winning campaigns`
        : null,
    ].filter(Boolean),
  };
}

/**
 * 2. Recommend Budget Reallocation
 */
async function recommendBudgetReallocation(config) {
  const protectLearning = config.protect_learning_phase !== false;
  const minBudget = config.min_budget_per_campaign || 10;

  // Calculate performance weights
  const totalROAS = config.campaigns.reduce((sum, c) => sum + c.roas, 0);

  const recommendations = config.campaigns.map(camp => {
    // Weight based on ROAS
    const weight = camp.roas / totalROAS;
    let recommended_budget = config.total_budget * weight;

    // Apply minimum budget
    recommended_budget = Math.max(recommended_budget, minBudget);

    // Protect Learning Phase
    if (protectLearning && camp.learning_phase === 'ACTIVE') {
      recommended_budget = Math.max(recommended_budget, camp.current_budget);
    }

    const change = recommended_budget - camp.current_budget;
    const change_percentage = (change / camp.current_budget * 100).toFixed(1);

    return {
      campaign_id: camp.id,
      campaign_name: camp.name,
      current_budget: camp.current_budget,
      recommended_budget: Math.round(recommended_budget),
      budget_change: Math.round(change),
      change_percentage: change_percentage + '%',
      roas: camp.roas,
      learning_phase: camp.learning_phase,
      action: change > 0 ? 'INCREASE' : change < 0 ? 'DECREASE' : 'KEEP',
      reason: change > 0
        ? `High ROAS (${camp.roas.toFixed(2)}) - scale opportunity`
        : change < 0
        ? `Low ROAS (${camp.roas.toFixed(2)}) - reallocate budget`
        : 'Optimal budget',
    };
  });

  return {
    success: true,
    analyzed_at: new Date().toISOString(),
    total_budget: config.total_budget,
    current_allocation: config.campaigns.reduce((sum, c) => sum + c.current_budget, 0),
    recommendations: recommendations,
    summary: {
      campaigns_to_scale: recommendations.filter(r => r.action === 'INCREASE').length,
      campaigns_to_cut: recommendations.filter(r => r.action === 'DECREASE').length,
      campaigns_to_keep: recommendations.filter(r => r.action === 'KEEP').length,
      total_budget_increases: Math.round(recommendations.filter(r => r.budget_change > 0).reduce((sum, r) => sum + r.budget_change, 0)),
      total_budget_decreases: Math.round(Math.abs(recommendations.filter(r => r.budget_change < 0).reduce((sum, r) => sum + r.budget_change, 0))),
    },
  };
}

/**
 * 3. Identify Winners and Losers
 */
async function identifyWinnersLosers(config) {
  const minSpend = config.min_spend_threshold || 100;
  const minDays = config.min_days_active || 3;

  const classified = config.items.map(item => {
    const roas = item.roas || (item.revenue && item.spend > 0 ? item.revenue / item.spend : 0);
    const cpa = item.cpa || (item.conversions > 0 ? item.spend / item.conversions : Infinity);

    // Not enough data
    if (item.spend < minSpend || item.days_active < minDays) {
      return {
        ...item,
        classification: 'TESTING',
        confidence: 'LOW',
        reason: `Insufficient data (${item.days_active} days, €${item.spend} spend)`,
        action: 'MONITOR',
      };
    }

    // Classify based on targets
    let classification = 'TESTING';
    let confidence = 'MEDIUM';
    let action = 'MONITOR';
    let reason = '';

    if (config.target_roas && roas >= config.target_roas * 1.2) {
      classification = 'WINNER';
      confidence = 'HIGH';
      action = 'SCALE';
      reason = `ROAS ${roas.toFixed(2)} exceeds target ${config.target_roas.toFixed(2)}`;
    } else if (config.target_roas && roas < config.target_roas * 0.7) {
      classification = 'LOSER';
      confidence = 'HIGH';
      action = 'PAUSE';
      reason = `ROAS ${roas.toFixed(2)} below target ${config.target_roas.toFixed(2)}`;
    } else if (config.target_cpa && cpa <= config.target_cpa * 0.8) {
      classification = 'WINNER';
      confidence = 'HIGH';
      action = 'SCALE';
      reason = `CPA €${cpa.toFixed(2)} below target €${config.target_cpa.toFixed(2)}`;
    } else if (config.target_cpa && cpa > config.target_cpa * 1.3) {
      classification = 'LOSER';
      confidence = 'HIGH';
      action = 'PAUSE';
      reason = `CPA €${cpa.toFixed(2)} above target €${config.target_cpa.toFixed(2)}`;
    } else {
      reason = 'Performance within acceptable range';
    }

    return {
      ...item,
      roas: parseFloat(roas.toFixed(2)),
      cpa: parseFloat(cpa.toFixed(2)),
      classification,
      confidence,
      action,
      reason,
    };
  });

  return {
    success: true,
    analyzed_at: new Date().toISOString(),
    total_items: classified.length,
    classification: {
      winners: classified.filter(i => i.classification === 'WINNER'),
      testing: classified.filter(i => i.classification === 'TESTING'),
      losers: classified.filter(i => i.classification === 'LOSER'),
    },
    summary: {
      winners_count: classified.filter(i => i.classification === 'WINNER').length,
      testing_count: classified.filter(i => i.classification === 'TESTING').length,
      losers_count: classified.filter(i => i.classification === 'LOSER').length,
    },
    actions: {
      to_scale: classified.filter(i => i.action === 'SCALE'),
      to_monitor: classified.filter(i => i.action === 'MONITOR'),
      to_pause: classified.filter(i => i.action === 'PAUSE'),
    },
  };
}

/**
 * 4. Calculate Optimal Budget Distribution
 */
async function calculateOptimalDistribution(config) {
  const algorithm = config.algorithm || 'proportional';
  let distributions = [];

  if (algorithm === 'proportional') {
    const totalScore = config.campaigns.reduce((sum, c) => sum + c.performance_score, 0);

    distributions = config.campaigns.map(camp => {
      const weight = camp.performance_score / totalScore;
      let optimal_budget = config.total_budget * weight;

      // Apply constraints
      if (camp.min_budget) optimal_budget = Math.max(optimal_budget, camp.min_budget);
      if (camp.max_budget) optimal_budget = Math.min(optimal_budget, camp.max_budget);

      return {
        campaign_id: camp.id,
        campaign_name: camp.name,
        performance_score: camp.performance_score,
        current_budget: camp.current_budget,
        optimal_budget: Math.round(optimal_budget),
        budget_share: (weight * 100).toFixed(1) + '%',
      };
    });
  } else if (algorithm === 'winner_takes_all') {
    // Top 3 performers get 80% of budget
    const sorted = [...config.campaigns].sort((a, b) => b.performance_score - a.performance_score);
    const winners = sorted.slice(0, 3);
    const others = sorted.slice(3);

    const winnersBudget = config.total_budget * 0.8;
    const othersBudget = config.total_budget * 0.2;

    distributions = sorted.map(camp => {
      const isWinner = winners.includes(camp);
      const budget = isWinner
        ? winnersBudget / winners.length
        : othersBudget / Math.max(others.length, 1);

      return {
        campaign_id: camp.id,
        campaign_name: camp.name,
        performance_score: camp.performance_score,
        current_budget: camp.current_budget,
        optimal_budget: Math.round(budget),
        tier: isWinner ? 'WINNER' : 'OTHER',
      };
    });
  }

  return {
    success: true,
    algorithm: algorithm,
    total_budget: config.total_budget,
    distributions: distributions,
    summary: {
      campaigns_optimized: distributions.length,
      total_allocated: distributions.reduce((sum, d) => sum + d.optimal_budget, 0),
    },
  };
}

/**
 * 5. Learning Phase Protection
 */
async function learningPhaseProtection(config) {
  const budgetChange = config.proposed_budget - config.current_budget;
  const changePercentage = (budgetChange / config.current_budget) * 100;

  let risk_level = 'LOW';
  let will_reset_learning = false;
  let warnings = [];
  let safe_to_proceed = true;

  if (config.platform === 'meta') {
    // Meta Learning Phase rules
    if (config.learning_phase_status === 'ACTIVE' && Math.abs(changePercentage) > 20) {
      risk_level = 'HIGH';
      will_reset_learning = true;
      safe_to_proceed = false;
      warnings.push('Budget change >20% will likely reset Learning Phase');
      warnings.push('Consider scaling in smaller increments (10-15%)');
    } else if (config.learning_phase_status === 'ACTIVE' && Math.abs(changePercentage) > 10) {
      risk_level = 'MEDIUM';
      warnings.push('Budget change >10% may impact Learning Phase progress');
    }
  } else if (config.platform === 'google_ads') {
    // Google Ads learning period is more flexible
    if (Math.abs(changePercentage) > 50) {
      risk_level = 'MEDIUM';
      warnings.push('Large budget change may impact performance temporarily');
    }
  }

  return {
    success: true,
    campaign_id: config.campaign_id,
    platform: config.platform,
    current_budget: config.current_budget,
    proposed_budget: config.proposed_budget,
    budget_change: budgetChange,
    change_percentage: changePercentage.toFixed(1) + '%',
    learning_phase_status: config.learning_phase_status,
    risk_level: risk_level,
    will_reset_learning: will_reset_learning,
    safe_to_proceed: safe_to_proceed,
    warnings: warnings,
    recommendations: will_reset_learning
      ? [
          'Consider multiple smaller budget increases over several days',
          'Wait until ad set graduates from Learning Phase before major scaling',
          `Safe increase: ${(config.current_budget * 1.15).toFixed(0)}€ (+15%)`,
        ]
      : ['Budget change is within safe range'],
  };
}

/**
 * 6. Multi-Platform Budget Balancing
 */
async function multiPlatformBalancing(config) {
  const totalROAS = config.platforms.reduce((sum, p) => sum + (p.roas * p.current_budget), 0) / config.platforms.reduce((sum, p) => sum + p.current_budget, 0);

  const optimized = config.platforms.map(platform => {
    // Weight by ROAS performance
    const roasWeight = platform.roas / config.platforms.reduce((sum, p) => sum + p.roas, 0);
    let optimal_budget = config.total_budget * roasWeight;

    // Apply constraints
    if (platform.min_budget) optimal_budget = Math.max(optimal_budget, platform.min_budget);
    if (platform.max_budget) optimal_budget = Math.min(optimal_budget, platform.max_budget);

    const change = optimal_budget - platform.current_budget;

    return {
      platform: platform.name,
      current_budget: platform.current_budget,
      optimal_budget: Math.round(optimal_budget),
      budget_change: Math.round(change),
      change_percentage: ((change / platform.current_budget) * 100).toFixed(1) + '%',
      roas: platform.roas,
      budget_share: ((optimal_budget / config.total_budget) * 100).toFixed(1) + '%',
      action: change > 0 ? 'INCREASE' : change < 0 ? 'DECREASE' : 'KEEP',
    };
  });

  return {
    success: true,
    analyzed_at: new Date().toISOString(),
    total_budget: config.total_budget,
    overall_roas: parseFloat(totalROAS.toFixed(2)),
    target_roas: config.target_roas,
    platforms: optimized,
    summary: {
      platforms_to_scale: optimized.filter(p => p.action === 'INCREASE').length,
      platforms_to_cut: optimized.filter(p => p.action === 'DECREASE').length,
      platforms_to_keep: optimized.filter(p => p.action === 'KEEP').length,
    },
  };
}

/**
 * 7. Confidence Interval Check
 */
async function confidenceIntervalCheck(config) {
  const confidenceLevel = config.confidence_level || 0.95;

  // Simple statistical significance check
  const hasEnoughData = config.conversions >= 30 && config.days_active >= 7;
  const hasModerateData = config.conversions >= 15 && config.days_active >= 3;

  let confidence = 'LOW';
  let is_significant = false;
  let recommendation = 'WAIT';

  if (hasEnoughData) {
    confidence = 'HIGH';
    is_significant = true;
    recommendation = 'OPTIMIZE';
  } else if (hasModerateData) {
    confidence = 'MEDIUM';
    is_significant = false;
    recommendation = 'MONITOR';
  }

  const cpa = config.conversions > 0 ? config.spend / config.conversions : null;
  const dailySpend = config.spend / config.days_active;

  return {
    success: true,
    campaign_id: config.campaign_id,
    confidence_level: confidenceLevel,
    data_quality: {
      conversions: config.conversions,
      spend: config.spend,
      days_active: config.days_active,
      daily_spend: parseFloat(dailySpend.toFixed(2)),
      cpa: cpa ? parseFloat(cpa.toFixed(2)) : null,
    },
    statistical_significance: {
      confidence: confidence,
      is_significant: is_significant,
      sample_size: config.conversions,
      required_conversions: 30,
      required_days: 7,
    },
    recommendation: recommendation,
    message: is_significant
      ? '✅ Sufficient data for optimization decisions'
      : hasModerateData
      ? '⚠️ Moderate data - monitor closely before major changes'
      : '❌ Insufficient data - wait for more conversions',
  };
}

// ════════════════════════════════════════════════════════════════════
// START SERVER
// ════════════════════════════════════════════════════════════════════

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Budget Optimizer MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
