#!/usr/bin/env node

/**
 * MCP Server for Budget Optimization (MARCUS Agent)
 * Analyzes campaign performance and provides budget optimization recommendations
 * READ-ONLY: No actual budget modifications, only analysis and recommendations
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

// Types
interface CampaignMetrics {
  id: string;
  name?: string;
  spend: number;
  revenue: number;
  conversions: number;
  clicks: number;
  impressions: number;
  daily_budget: number;
  status?: string;
  learning_phase?: string;
}

interface PerformanceScore {
  campaign_id: string;
  score: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  status: 'WINNING' | 'TESTING' | 'LOSING';
  roas: number;
  cpa: number;
  ctr: number;
  recommendations: string[];
}

// Initialize MCP Server
const server = new Server(
  {
    name: 'budget-optimizer-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Helper Functions

function calculateROAS(revenue: number, spend: number): number {
  return spend > 0 ? revenue / spend : 0;
}

function calculateCPA(spend: number, conversions: number): number {
  return conversions > 0 ? spend / conversions : 0;
}

function calculateCTR(clicks: number, impressions: number): number {
  return impressions > 0 ? (clicks / impressions) * 100 : 0;
}

function gradePerformance(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 45) return 'D';
  return 'F';
}

function getStatus(score: number): 'WINNING' | 'TESTING' | 'LOSING' {
  if (score >= 75) return 'WINNING';
  if (score >= 50) return 'TESTING';
  return 'LOSING';
}

function analyzePerformance(
  campaign: CampaignMetrics,
  targetROAS?: number,
  targetCPA?: number
): PerformanceScore {
  const roas = calculateROAS(campaign.revenue, campaign.spend);
  const cpa = calculateCPA(campaign.spend, campaign.conversions);
  const ctr = calculateCTR(campaign.clicks, campaign.impressions);

  let score = 50; // Base score
  const recommendations: string[] = [];

  // ROAS analysis
  if (targetROAS) {
    if (roas >= targetROAS * 1.2) {
      score += 25;
      recommendations.push(`🚀 ROAS ${roas.toFixed(2)}x exceeds target by 20% - Scale budget up`);
    } else if (roas >= targetROAS) {
      score += 15;
      recommendations.push(`✅ ROAS ${roas.toFixed(2)}x meets target - Maintain or test scale`);
    } else if (roas >= targetROAS * 0.8) {
      score -= 10;
      recommendations.push(`⚠️ ROAS ${roas.toFixed(2)}x slightly below target - Monitor closely`);
    } else {
      score -= 25;
      recommendations.push(`❌ ROAS ${roas.toFixed(2)}x too low - Reduce budget or pause`);
    }
  }

  // CPA analysis
  if (targetCPA) {
    if (cpa <= targetCPA * 0.8) {
      score += 15;
      recommendations.push(`💰 CPA $${cpa.toFixed(2)} is 20% below target - Increase budget`);
    } else if (cpa <= targetCPA) {
      score += 10;
      recommendations.push(`✅ CPA $${cpa.toFixed(2)} meets target`);
    } else if (cpa <= targetCPA * 1.2) {
      score -= 10;
      recommendations.push(`⚠️ CPA $${cpa.toFixed(2)} slightly above target`);
    } else {
      score -= 20;
      recommendations.push(`❌ CPA $${cpa.toFixed(2)} too high - Optimize or reduce budget`);
    }
  }

  // CTR analysis
  if (ctr < 1.0) {
    score -= 10;
    recommendations.push(`📉 CTR ${ctr.toFixed(2)}% is low - Review ad creative`);
  } else if (ctr > 3.0) {
    score += 10;
    recommendations.push(`📈 CTR ${ctr.toFixed(2)}% is excellent`);
  }

  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, score));

  return {
    campaign_id: campaign.id,
    score,
    grade: gradePerformance(score),
    status: getStatus(score),
    roas,
    cpa,
    ctr,
    recommendations,
  };
}

// Define available tools
const tools: Tool[] = [
  {
    name: 'analyze_campaign_performance',
    description: 'Analyzes campaign performance and assigns scores/grades',
    inputSchema: {
      type: 'object',
      properties: {
        campaigns: {
          type: 'array',
          description: 'Array of campaigns with metrics',
        },
        optimization_goal: {
          type: 'string',
          enum: ['ROAS', 'CPA', 'BALANCED'],
          description: 'Primary optimization goal',
        },
        target_roas: {
          type: 'number',
          description: 'Target ROAS (e.g., 4.0 for 4x return)',
        },
        target_cpa: {
          type: 'number',
          description: 'Target CPA in dollars',
        },
      },
      required: ['campaigns', 'optimization_goal'],
    },
  },
  {
    name: 'learning_phase_protection',
    description: 'Checks if budget changes will reset Facebook learning phase',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: { type: 'string' },
        current_budget: { type: 'number' },
        proposed_budget: { type: 'number' },
        learning_phase_status: {
          type: 'string',
          enum: ['ACTIVE', 'EXITED', 'NOT_STARTED'],
        },
        platform: {
          type: 'string',
          enum: ['meta', 'google'],
        },
      },
      required: [
        'campaign_id',
        'current_budget',
        'proposed_budget',
        'learning_phase_status',
        'platform',
      ],
    },
  },
  {
    name: 'calculate_optimal_budget',
    description: 'Calculates optimal budget distribution across campaigns',
    inputSchema: {
      type: 'object',
      properties: {
        total_budget: { type: 'number' },
        campaigns: { type: 'array' },
        optimization_goal: { type: 'string' },
        min_budget_per_campaign: { type: 'number' },
      },
      required: ['total_budget', 'campaigns', 'optimization_goal'],
    },
  },
  {
    name: 'predict_budget_impact',
    description: 'Predicts impact of budget changes on performance',
    inputSchema: {
      type: 'object',
      properties: {
        campaign: { type: 'object' },
        proposed_budget: { type: 'number' },
        historical_data: { type: 'array' },
      },
      required: ['campaign', 'proposed_budget'],
    },
  },
  {
    name: 'get_budget_recommendations',
    description: 'Get specific budget recommendations for each campaign',
    inputSchema: {
      type: 'object',
      properties: {
        campaigns: { type: 'array' },
        total_available_budget: { type: 'number' },
        constraints: { type: 'object' },
      },
      required: ['campaigns'],
    },
  },
  {
    name: 'compare_campaign_efficiency',
    description: 'Compares efficiency between multiple campaigns',
    inputSchema: {
      type: 'object',
      properties: {
        campaigns: { type: 'array' },
        metric: {
          type: 'string',
          enum: ['ROAS', 'CPA', 'CTR', 'CONVERSION_RATE'],
        },
      },
      required: ['campaigns', 'metric'],
    },
  },
  {
    name: 'analyze_budget_pacing',
    description: 'Analyzes if budget is pacing correctly throughout the month',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: { type: 'string' },
        monthly_budget: { type: 'number' },
        spent_to_date: { type: 'number' },
        days_elapsed: { type: 'number' },
        days_in_month: { type: 'number' },
      },
      required: [
        'campaign_id',
        'monthly_budget',
        'spent_to_date',
        'days_elapsed',
        'days_in_month',
      ],
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
    switch (name) {
      case 'analyze_campaign_performance': {
        const campaigns = args.campaigns as CampaignMetrics[];
        const targetROAS = args.target_roas as number | undefined;
        const targetCPA = args.target_cpa as number | undefined;

        const performanceScores = campaigns.map((campaign) =>
          analyzePerformance(campaign, targetROAS, targetCPA)
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  performance_scores: performanceScores,
                  summary: {
                    winning_campaigns: performanceScores.filter((s) => s.status === 'WINNING')
                      .length,
                    testing_campaigns: performanceScores.filter((s) => s.status === 'TESTING')
                      .length,
                    losing_campaigns: performanceScores.filter((s) => s.status === 'LOSING')
                      .length,
                    avg_score:
                      performanceScores.reduce((sum, s) => sum + s.score, 0) /
                      performanceScores.length,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'learning_phase_protection': {
        const currentBudget = args.current_budget as number;
        const proposedBudget = args.proposed_budget as number;
        const learningPhase = args.learning_phase_status as string;
        const platform = args.platform as string;

        const changePercent = ((proposedBudget - currentBudget) / currentBudget) * 100;

        let willReset = false;
        let risk = 'LOW';
        let safeToProceed = true;
        const warnings: string[] = [];

        if (platform === 'meta') {
          // Meta resets learning if budget changes > 20%
          if (Math.abs(changePercent) > 20 && learningPhase === 'ACTIVE') {
            willReset = true;
            risk = 'HIGH';
            safeToProceed = false;
            warnings.push(
              `⛔ Budget change of ${changePercent.toFixed(1)}% will RESET learning phase (Meta threshold: 20%)`
            );
          } else if (Math.abs(changePercent) > 15 && learningPhase === 'ACTIVE') {
            risk = 'MEDIUM';
            warnings.push(
              `⚠️ Budget change of ${changePercent.toFixed(1)}% is close to 20% threshold`
            );
          }
        }

        if (learningPhase === 'EXITED') {
          warnings.push('✅ Campaign has exited learning phase - budget changes are safer');
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  campaign_id: args.campaign_id,
                  will_reset_learning_phase: willReset,
                  risk_level: risk,
                  safe_to_proceed: safeToProceed,
                  budget_change_percent: parseFloat(changePercent.toFixed(2)),
                  current_budget: currentBudget,
                  proposed_budget: proposedBudget,
                  warnings,
                  recommendation: willReset
                    ? 'Wait for learning phase to exit, or make smaller incremental changes (<20%)'
                    : 'Safe to proceed with budget change',
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'calculate_optimal_budget': {
        const totalBudget = args.total_budget as number;
        const campaigns = args.campaigns as CampaignMetrics[];
        const optimizationGoal = args.optimization_goal as string;
        const minBudget = (args.min_budget_per_campaign as number) || 10;

        // Calculate performance scores
        const performanceScores = campaigns.map((campaign) => ({
          campaign,
          score: analyzePerformance(campaign).score,
          roas: calculateROAS(campaign.revenue, campaign.spend),
        }));

        // Sort by performance
        const sorted = performanceScores.sort((a, b) => b.score - a.score);

        // Allocate budget proportionally to performance
        const totalScore = sorted.reduce((sum, item) => sum + item.score, 0);
        const allocations = sorted.map((item) => {
          const proportion = item.score / totalScore;
          const allocated = Math.max(minBudget, totalBudget * proportion);

          return {
            campaign_id: item.campaign.id,
            campaign_name: item.campaign.name,
            current_budget: item.campaign.daily_budget,
            recommended_budget: parseFloat(allocated.toFixed(2)),
            change: parseFloat((allocated - item.campaign.daily_budget).toFixed(2)),
            change_percent: parseFloat(
              (((allocated - item.campaign.daily_budget) / item.campaign.daily_budget) * 100).toFixed(
                1
              )
            ),
            score: item.score,
            roas: parseFloat(item.roas.toFixed(2)),
          };
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  total_budget: totalBudget,
                  optimization_goal: optimizationGoal,
                  allocations,
                  summary: {
                    campaigns_to_increase: allocations.filter((a) => a.change > 0).length,
                    campaigns_to_decrease: allocations.filter((a) => a.change < 0).length,
                    total_allocated: allocations.reduce((sum, a) => sum + a.recommended_budget, 0),
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'predict_budget_impact': {
        const campaign = args.campaign as CampaignMetrics;
        const proposedBudget = args.proposed_budget as number;

        const currentROAS = calculateROAS(campaign.revenue, campaign.spend);
        const budgetChange = ((proposedBudget - campaign.daily_budget) / campaign.daily_budget) * 100;

        // Simple linear prediction (in reality, use ML models)
        const estimatedSpendIncrease = proposedBudget - campaign.daily_budget;
        const estimatedRevenueIncrease = estimatedSpendIncrease * currentROAS;
        const estimatedConversionsIncrease =
          (estimatedSpendIncrease / campaign.daily_budget) * campaign.conversions;

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  campaign_id: campaign.id,
                  current: {
                    budget: campaign.daily_budget,
                    spend: campaign.spend,
                    revenue: campaign.revenue,
                    conversions: campaign.conversions,
                    roas: parseFloat(currentROAS.toFixed(2)),
                  },
                  predicted: {
                    budget: proposedBudget,
                    budget_change_percent: parseFloat(budgetChange.toFixed(1)),
                    estimated_additional_revenue: parseFloat(estimatedRevenueIncrease.toFixed(2)),
                    estimated_additional_conversions: parseFloat(
                      estimatedConversionsIncrease.toFixed(1)
                    ),
                    projected_roas: parseFloat(currentROAS.toFixed(2)), // Assumes ROAS stays constant
                  },
                  confidence: budgetChange < 30 ? 'HIGH' : budgetChange < 50 ? 'MEDIUM' : 'LOW',
                  note: 'Predictions assume current ROAS remains constant. Actual results may vary based on auction dynamics.',
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'get_budget_recommendations': {
        const campaigns = args.campaigns as CampaignMetrics[];

        const recommendations = campaigns.map((campaign) => {
          const analysis = analyzePerformance(campaign);
          let action = 'MAINTAIN';
          let recommendedBudget = campaign.daily_budget;
          const reasons: string[] = [];

          if (analysis.status === 'WINNING') {
            action = 'INCREASE';
            recommendedBudget = campaign.daily_budget * 1.2;
            reasons.push('Campaign is performing well - scale budget by 20%');
          } else if (analysis.status === 'LOSING') {
            action = 'DECREASE';
            recommendedBudget = campaign.daily_budget * 0.5;
            reasons.push('Campaign underperforming - reduce budget by 50% or pause');
          } else {
            action = 'TEST';
            reasons.push('Campaign in testing phase - monitor closely before making changes');
          }

          return {
            campaign_id: campaign.id,
            campaign_name: campaign.name,
            current_budget: campaign.daily_budget,
            recommended_budget: parseFloat(recommendedBudget.toFixed(2)),
            action,
            performance: {
              score: analysis.score,
              grade: analysis.grade,
              status: analysis.status,
            },
            reasons,
          };
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  recommendations,
                  summary: {
                    increase: recommendations.filter((r) => r.action === 'INCREASE').length,
                    decrease: recommendations.filter((r) => r.action === 'DECREASE').length,
                    maintain: recommendations.filter((r) => r.action === 'MAINTAIN').length,
                    test: recommendations.filter((r) => r.action === 'TEST').length,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'compare_campaign_efficiency': {
        const campaigns = args.campaigns as CampaignMetrics[];
        const metric = args.metric as string;

        const comparisons = campaigns.map((campaign) => {
          let value = 0;
          let unit = '';

          switch (metric) {
            case 'ROAS':
              value = calculateROAS(campaign.revenue, campaign.spend);
              unit = 'x';
              break;
            case 'CPA':
              value = calculateCPA(campaign.spend, campaign.conversions);
              unit = '$';
              break;
            case 'CTR':
              value = calculateCTR(campaign.clicks, campaign.impressions);
              unit = '%';
              break;
            case 'CONVERSION_RATE':
              value = campaign.clicks > 0 ? (campaign.conversions / campaign.clicks) * 100 : 0;
              unit = '%';
              break;
          }

          return {
            campaign_id: campaign.id,
            campaign_name: campaign.name,
            value: parseFloat(value.toFixed(2)),
            unit,
          };
        });

        // Rank campaigns
        const ranked = comparisons.sort((a, b) =>
          metric === 'CPA' ? a.value - b.value : b.value - a.value
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  metric,
                  rankings: ranked.map((item, index) => ({
                    rank: index + 1,
                    ...item,
                  })),
                  best_performer: ranked[0],
                  worst_performer: ranked[ranked.length - 1],
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'analyze_budget_pacing': {
        const monthlyBudget = args.monthly_budget as number;
        const spentToDate = args.spent_to_date as number;
        const daysElapsed = args.days_elapsed as number;
        const daysInMonth = args.days_in_month as number;

        const expectedSpend = (monthlyBudget / daysInMonth) * daysElapsed;
        const pacePercent = (spentToDate / expectedSpend) * 100;
        const remainingBudget = monthlyBudget - spentToDate;
        const remainingDays = daysInMonth - daysElapsed;
        const dailyBudgetNeeded = remainingDays > 0 ? remainingBudget / remainingDays : 0;

        let status = 'ON_PACE';
        const warnings: string[] = [];

        if (pacePercent > 120) {
          status = 'OVER_PACING';
          warnings.push('⚠️ Spending 20%+ faster than planned - will exhaust budget early');
        } else if (pacePercent < 80) {
          status = 'UNDER_PACING';
          warnings.push('⚠️ Spending 20%+ slower than planned - may not reach target');
        }

        if (remainingBudget < 0) {
          status = 'BUDGET_EXCEEDED';
          warnings.push('❌ Monthly budget already exceeded!');
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  campaign_id: args.campaign_id,
                  monthly_budget: monthlyBudget,
                  spent_to_date: spentToDate,
                  expected_spend: parseFloat(expectedSpend.toFixed(2)),
                  pace_percent: parseFloat(pacePercent.toFixed(1)),
                  status,
                  remaining_budget: parseFloat(remainingBudget.toFixed(2)),
                  remaining_days: remainingDays,
                  recommended_daily_budget: parseFloat(dailyBudgetNeeded.toFixed(2)),
                  warnings,
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
  console.error('Budget Optimizer MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
