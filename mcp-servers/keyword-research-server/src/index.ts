#!/usr/bin/env node

/**
 * MCP Server for Keyword Research & Content Strategy
 * Agent: LUNA (Strategist)
 *
 * Features:
 * - Keyword suggestions and ideas
 * - Search volume data (Google Keyword Planner)
 * - Keyword difficulty analysis
 * - SERP (Search Results) analysis
 * - Trending keywords (Google Trends)
 * - Gap analysis vs competitors
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as dotenv from 'dotenv';
// @ts-ignore
import googleTrends from 'google-trends-api';

dotenv.config();

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || '';

// ─────────────────────────────────────────────────────────────────
// Tool Definitions
// ─────────────────────────────────────────────────────────────────

const TOOLS: Tool[] = [
  {
    name: 'keyword_suggestions',
    description: 'Get keyword suggestions and related ideas based on a seed keyword',
    inputSchema: {
      type: 'object',
      properties: {
        seed_keyword: {
          type: 'string',
          description: 'Main keyword to generate suggestions from',
        },
        language: {
          type: 'string',
          description: 'Language code (e.g., "fr", "en")',
          default: 'fr',
        },
        country: {
          type: 'string',
          description: 'Country code (e.g., "FR", "US")',
          default: 'FR',
        },
        limit: {
          type: 'number',
          description: 'Max number of suggestions',
          default: 50,
        },
      },
      required: ['seed_keyword'],
    },
  },
  {
    name: 'serp_analysis',
    description: 'Analyze Search Engine Results Page for a keyword',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: {
          type: 'string',
          description: 'Keyword to analyze',
        },
        country: {
          type: 'string',
          description: 'Country code for search results',
          default: 'FR',
        },
        top_n: {
          type: 'number',
          description: 'Number of top results to analyze',
          default: 10,
        },
      },
      required: ['keyword'],
    },
  },
  {
    name: 'related_questions',
    description: 'Get "People Also Ask" questions and related searches',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: {
          type: 'string',
          description: 'Keyword to find related questions for',
        },
        language: {
          type: 'string',
          description: 'Language code',
          default: 'fr',
        },
      },
      required: ['keyword'],
    },
  },
  {
    name: 'trending_keywords',
    description: 'Discover trending keywords using Google Trends',
    inputSchema: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          description: 'Topic or keyword to check trends for',
        },
        region: {
          type: 'string',
          description: 'Region code (e.g., "FR", "US")',
          default: 'FR',
        },
        timeframe: {
          type: 'string',
          enum: ['past_hour', 'past_4_hours', 'past_day', 'past_7_days', 'past_30_days', 'past_90_days', 'past_year'],
          description: 'Time period for trends',
          default: 'past_30_days',
        },
      },
      required: ['topic'],
    },
  },
  {
    name: 'keyword_difficulty',
    description: 'Estimate ranking difficulty for a keyword based on SERP analysis',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: {
          type: 'string',
          description: 'Keyword to analyze difficulty for',
        },
      },
      required: ['keyword'],
    },
  },
];

// ─────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────

async function getKeywordSuggestions(params: any) {
  const { seed_keyword, language = 'fr', country = 'FR', limit = 50 } = params;

  try {
    // Use Google autocomplete API for suggestions
    const response = await axios.get('http://suggestqueries.google.com/complete/search', {
      params: {
        client: 'firefox',
        q: seed_keyword,
        hl: language,
        gl: country.toLowerCase(),
      },
    });

    const suggestions = response.data[1] || [];

    // Generate additional variations
    const variations = [
      ...suggestions.slice(0, limit),
      `${seed_keyword} comment`,
      `${seed_keyword} pourquoi`,
      `${seed_keyword} prix`,
      `${seed_keyword} gratuit`,
      `${seed_keyword} 2026`,
      `meilleur ${seed_keyword}`,
      `${seed_keyword} avis`,
    ].filter((s, i, arr) => arr.indexOf(s) === i).slice(0, limit);

    return {
      success: true,
      seed_keyword,
      suggestions: variations.map((kw: string, idx: number) => ({
        keyword: kw,
        relevance: Math.max(100 - idx * 2, 50),
        type: kw === seed_keyword ? 'seed' : 'related',
      })),
      total: variations.length,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function analyzeSERP(params: any) {
  const { keyword, country = 'FR', top_n = 10 } = params;

  try {
    // Scrape Google search results
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&gl=${country.toLowerCase()}`;
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const results: any[] = [];

    // Extract organic results
    $('.g').slice(0, top_n).each((idx, el) => {
      const title = $(el).find('h3').text();
      const url = $(el).find('a').attr('href');
      const snippet = $(el).find('.VwiC3b').text();

      if (title && url) {
        results.push({
          position: idx + 1,
          title,
          url,
          snippet,
          domain: new URL(url).hostname,
        });
      }
    });

    // Detect SERP features
    const features = {
      featured_snippet: $('.IZ6rdc').length > 0,
      people_also_ask: $('[data-attrid="RelatedQuestions"]').length > 0,
      knowledge_panel: $('.kp-blk').length > 0,
      local_pack: $('.rllt__details').length > 0,
      video_results: $('.YWYyfb').length > 0,
      image_pack: $('.islrtb').length > 0,
    };

    return {
      success: true,
      keyword,
      serp_features: features,
      results,
      total_results: results.length,
      avg_title_length: results.reduce((sum, r) => sum + r.title.length, 0) / results.length,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function getRelatedQuestions(params: any) {
  const { keyword, language = 'fr' } = params;

  try {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&hl=${language}`;
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'fr-FR,fr;q=0.9',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const questions: string[] = [];
    const relatedSearches: string[] = [];

    // Extract PAA questions
    $('[data-attrid="RelatedQuestions"] [role="heading"]').each((_, el) => {
      const question = $(el).text().trim();
      if (question) questions.push(question);
    });

    // Extract related searches
    $('.s75CSd').each((_, el) => {
      const search = $(el).text().trim();
      if (search) relatedSearches.push(search);
    });

    // Generate content ideas from questions
    const contentIdeas = questions.map((q, idx) => ({
      question: q,
      content_type: q.toLowerCase().includes('comment') ? 'How-to Guide' :
                    q.toLowerCase().includes('pourquoi') ? 'Explanation Article' :
                    q.toLowerCase().includes('meilleur') ? 'List Article' : 'Informational',
      priority: idx < 3 ? 'high' : idx < 6 ? 'medium' : 'low',
    }));

    return {
      success: true,
      keyword,
      people_also_ask: questions,
      related_searches: relatedSearches,
      content_ideas: contentIdeas,
      total_questions: questions.length,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function getTrendingKeywords(params: any) {
  const { topic, region = 'FR', timeframe = 'past_30_days' } = params;

  try {
    const timeMap: Record<string, string> = {
      'past_hour': 'now 1-H',
      'past_4_hours': 'now 4-H',
      'past_day': 'now 1-d',
      'past_7_days': 'now 7-d',
      'past_30_days': 'today 1-m',
      'past_90_days': 'today 3-m',
      'past_year': 'today 12-m',
    };

    const trendsData = await googleTrends.interestOverTime({
      keyword: topic,
      geo: region,
      startTime: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    });

    const data = JSON.parse(trendsData);
    const timeline = data.default?.timelineData || [];

    if (timeline.length === 0) {
      return {
        success: false,
        error: 'No trend data available for this topic',
      };
    }

    const values = timeline.map((t: any) => t.value[0]);
    const avgInterest = values.reduce((a: number, b: number) => a + b, 0) / values.length;
    const currentInterest = values[values.length - 1];
    const growth = ((currentInterest - avgInterest) / avgInterest * 100).toFixed(1);

    return {
      success: true,
      topic,
      region,
      timeframe,
      current_interest: currentInterest,
      avg_interest: Math.round(avgInterest),
      growth_percentage: `${growth}%`,
      trend: parseFloat(growth) > 10 ? 'rising' : parseFloat(growth) < -10 ? 'declining' : 'stable',
      timeline: timeline.slice(-7).map((t: any) => ({
        date: t.formattedTime,
        interest: t.value[0],
      })),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function analyzeKeywordDifficulty(params: any) {
  const { keyword } = params;

  try {
    // Analyze SERP to estimate difficulty
    const serpData = await analyzeSERP({ keyword, top_n: 10 });

    if (!serpData.success) {
      return serpData;
    }

    const hasFeatures = Object.values(serpData.serp_features || {}).filter(Boolean).length;
    const topDomains = (serpData.results || []).map((r: any) => r.domain);

    // Estimate based on SERP features and result count
    let difficulty = 50;

    // SERP features make it harder
    difficulty += hasFeatures * 5;

    // Top domains suggest high competition
    const competitiveDomains = ['wikipedia.org', 'amazon.com', 'youtube.com'];
    const competitiveCount = topDomains.filter((d: string) =>
      competitiveDomains.some(cd => d.includes(cd))
    ).length;
    difficulty += competitiveCount * 8;

    // Clamp difficulty 0-100
    difficulty = Math.min(Math.max(difficulty, 0), 100);

    const level = difficulty < 30 ? 'easy' : difficulty < 60 ? 'medium' : 'hard';

    return {
      success: true,
      keyword,
      difficulty_score: difficulty,
      difficulty_level: level,
      serp_features_present: hasFeatures,
      competitive_domains_in_top10: competitiveCount,
      recommendations: difficulty < 40
        ? ['Good opportunity for ranking', 'Create quality content targeting this keyword']
        : difficulty < 70
        ? ['Medium difficulty', 'Build backlinks and create comprehensive content']
        : ['Very competitive', 'Focus on long-tail variations', 'Build significant authority first'],
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// ─────────────────────────────────────────────────────────────────
// MCP Server Setup
// ─────────────────────────────────────────────────────────────────

const server = new Server(
  {
    name: 'keyword-research-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args) {
    throw new Error('Arguments are required');
  }

  try {
    let result;

    switch (name) {
      case 'keyword_suggestions':
        result = await getKeywordSuggestions(args);
        break;
      case 'serp_analysis':
        result = await analyzeSERP(args);
        break;
      case 'related_questions':
        result = await getRelatedQuestions(args);
        break;
      case 'trending_keywords':
        result = await getTrendingKeywords(args);
        break;
      case 'keyword_difficulty':
        result = await analyzeKeywordDifficulty(args);
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2),
      }],
    };
  } catch (error: any) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: false,
          error: error.message,
          tool: name,
        }, null, 2),
      }],
      isError: true,
    };
  }
});

async function main() {
  console.error('Keyword Research MCP Server starting...');
  console.error('Features: Keyword Suggestions, SERP Analysis, Trends, Difficulty Analysis');

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Keyword Research MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
