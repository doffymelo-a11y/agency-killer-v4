#!/usr/bin/env node

/**
 * MCP Server for Social Media Management
 * Agent: DOFFY (Social Media Manager)
 *
 * Features:
 * - Multi-platform post creation (LinkedIn, Instagram, Twitter/X, TikTok, Facebook)
 * - Content calendar generation
 * - Hashtag strategy
 * - Performance analytics
 * - Trending topics discovery
 * - Competitor analysis
 *
 * Phase 2: Foundation with mock implementations
 * Phase 3: Real OAuth + API integrations
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import * as dotenv from 'dotenv';
import { LinkedInProvider } from './providers/linkedin.provider.js';
import { InstagramProvider } from './providers/instagram.provider.js';
import type {
  PostContent,
  IntegrationCredentials,
  SocialPlatform,
  PostPerformance
} from './types.js';

dotenv.config();

// Initialize providers
const linkedInProvider = new LinkedInProvider();
const instagramProvider = new InstagramProvider();

// Backend API base URL (for scheduling)
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3457';

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

interface ScheduledPost extends PostContent {
  platform: SocialPlatform;
  scheduled_time: string;
}

// ─────────────────────────────────────────────────────────────────
// Tool Definitions
// ─────────────────────────────────────────────────────────────────

const TOOLS: Tool[] = [
  {
    name: 'create_post',
    description: 'Create and publish a post on a social media platform (LinkedIn, Instagram, Twitter/X, TikTok, Facebook)',
    inputSchema: {
      type: 'object',
      properties: {
        platform: {
          type: 'string',
          enum: ['linkedin', 'instagram', 'twitter', 'tiktok', 'facebook'],
          description: 'Social media platform',
        },
        text: {
          type: 'string',
          description: 'Post text content',
        },
        media_urls: {
          type: 'array',
          items: { type: 'string' },
          description: 'URLs of images/videos to attach (optional)',
        },
        hashtags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Hashtags to include (without # prefix)',
        },
      },
      required: ['platform', 'text'],
    },
  },
  {
    name: 'schedule_post',
    description: 'Schedule a post for future publication at a specific date and time',
    inputSchema: {
      type: 'object',
      properties: {
        platform: {
          type: 'string',
          enum: ['linkedin', 'instagram', 'twitter', 'tiktok', 'facebook'],
          description: 'Social media platform',
        },
        text: {
          type: 'string',
          description: 'Post text content',
        },
        media_urls: {
          type: 'array',
          items: { type: 'string' },
          description: 'URLs of images/videos to attach (optional)',
        },
        hashtags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Hashtags to include',
        },
        scheduled_time: {
          type: 'string',
          description: 'ISO 8601 datetime (e.g., 2026-03-20T14:00:00Z)',
        },
      },
      required: ['platform', 'text', 'scheduled_time'],
    },
  },
  {
    name: 'get_post_performance',
    description: 'Retrieve performance metrics for a specific post (likes, comments, shares, impressions, engagement rate)',
    inputSchema: {
      type: 'object',
      properties: {
        platform: {
          type: 'string',
          enum: ['linkedin', 'instagram', 'twitter', 'tiktok', 'facebook'],
          description: 'Social media platform',
        },
        post_id: {
          type: 'string',
          description: 'Post ID or URL',
        },
      },
      required: ['platform', 'post_id'],
    },
  },
  {
    name: 'create_content_calendar',
    description: 'Generate a content calendar with post suggestions for a specified period (week/month)',
    inputSchema: {
      type: 'object',
      properties: {
        platforms: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['linkedin', 'instagram', 'twitter', 'tiktok', 'facebook'],
          },
          description: 'Platforms to include in calendar',
        },
        duration_days: {
          type: 'number',
          description: 'Number of days to plan (e.g., 7 for a week, 30 for a month)',
          default: 7,
        },
        posts_per_day: {
          type: 'number',
          description: 'Target number of posts per day',
          default: 3,
        },
        topics: {
          type: 'array',
          items: { type: 'string' },
          description: 'Content topics/themes to focus on',
        },
      },
      required: ['platforms'],
    },
  },
  {
    name: 'suggest_hashtags',
    description: 'Suggest relevant hashtags for a post based on content and target platform',
    inputSchema: {
      type: 'object',
      properties: {
        platform: {
          type: 'string',
          enum: ['linkedin', 'instagram', 'twitter', 'tiktok', 'facebook'],
          description: 'Target platform',
        },
        content: {
          type: 'string',
          description: 'Post content to analyze',
        },
        industry: {
          type: 'string',
          description: 'Industry/niche (e.g., "marketing", "tech", "fitness")',
        },
        count: {
          type: 'number',
          description: 'Number of hashtags to suggest',
          default: 10,
        },
      },
      required: ['platform', 'content'],
    },
  },
  {
    name: 'analyze_best_times',
    description: 'Analyze historical data to determine the best times to post for maximum engagement',
    inputSchema: {
      type: 'object',
      properties: {
        platform: {
          type: 'string',
          enum: ['linkedin', 'instagram', 'twitter', 'tiktok', 'facebook'],
          description: 'Social media platform',
        },
        timezone: {
          type: 'string',
          description: 'Timezone for recommendations (e.g., "America/New_York", "Europe/Paris")',
          default: 'UTC',
        },
      },
      required: ['platform'],
    },
  },
  {
    name: 'get_trending_topics',
    description: 'Get trending topics and hashtags on a platform for content inspiration',
    inputSchema: {
      type: 'object',
      properties: {
        platform: {
          type: 'string',
          enum: ['linkedin', 'instagram', 'twitter', 'tiktok', 'facebook'],
          description: 'Social media platform',
        },
        category: {
          type: 'string',
          description: 'Category filter (e.g., "business", "technology", "lifestyle")',
        },
        count: {
          type: 'number',
          description: 'Number of trending topics to return',
          default: 10,
        },
      },
      required: ['platform'],
    },
  },
  {
    name: 'analyze_competitors_content',
    description: 'Analyze competitors\' social media content strategy (posting frequency, content types, engagement)',
    inputSchema: {
      type: 'object',
      properties: {
        platform: {
          type: 'string',
          enum: ['linkedin', 'instagram', 'twitter', 'tiktok', 'facebook'],
          description: 'Social media platform',
        },
        competitor_handles: {
          type: 'array',
          items: { type: 'string' },
          description: 'Competitor usernames/handles (e.g., ["@competitor1", "@competitor2"])',
        },
        days_back: {
          type: 'number',
          description: 'Number of days of historical data to analyze',
          default: 30,
        },
      },
      required: ['platform', 'competitor_handles'],
    },
  },
  {
    name: 'get_engagement_metrics',
    description: 'Get overall engagement metrics for an account (followers, avg engagement rate, growth)',
    inputSchema: {
      type: 'object',
      properties: {
        platform: {
          type: 'string',
          enum: ['linkedin', 'instagram', 'twitter', 'tiktok', 'facebook'],
          description: 'Social media platform',
        },
        period_days: {
          type: 'number',
          description: 'Period in days to analyze',
          default: 30,
        },
      },
      required: ['platform'],
    },
  },
  {
    name: 'reply_to_comments',
    description: 'Reply to comments on a post (supports AI-suggested replies)',
    inputSchema: {
      type: 'object',
      properties: {
        platform: {
          type: 'string',
          enum: ['linkedin', 'instagram', 'twitter', 'tiktok', 'facebook'],
          description: 'Social media platform',
        },
        post_id: {
          type: 'string',
          description: 'Post ID',
        },
        comment_id: {
          type: 'string',
          description: 'Comment ID to reply to',
        },
        reply_text: {
          type: 'string',
          description: 'Reply message',
        },
      },
      required: ['platform', 'post_id', 'comment_id', 'reply_text'],
    },
  },
];

// ─────────────────────────────────────────────────────────────────
// Helper Functions (Phase 3: Real API implementations)
// ─────────────────────────────────────────────────────────────────

/**
 * Create and publish a post
 * Supports LinkedIn and Instagram (real APIs), mock for others
 */
async function createPost(params: any) {
  const { platform, text, media_urls = [], hashtags = [], credentials } = params;

  // Validate credentials for LinkedIn and Instagram
  if ((platform === 'linkedin' || platform === 'instagram') && !credentials) {
    throw new Error(`${platform} requires credentials. Please connect your ${platform} account first.`);
  }

  // Build post content
  const content: PostContent = {
    text,
    media_urls,
    hashtags,
  };

  try {
    let result;

    switch (platform) {
      case 'linkedin':
        result = await linkedInProvider.createPost(content, credentials);
        break;

      case 'instagram':
        result = await instagramProvider.createPost(content, credentials);
        break;

      case 'twitter':
      case 'tiktok':
      case 'facebook':
        // Mock for not yet implemented platforms
        const mockPostId = `${platform}_${Date.now()}`;
        result = {
          id: mockPostId,
          platform,
          text,
          media_urls,
          hashtags,
          url: `https://${platform}.com/p/${mockPostId}`,
          created_at: new Date().toISOString(),
          status: 'published' as const,
        };
        break;

      default:
        throw new Error(`Unknown platform: ${platform}`);
    }

    return {
      success: true,
      post: result,
      note: (platform === 'linkedin' || platform === 'instagram')
        ? '✅ Posted via real API'
        : '⚠️ Mock implementation (platform not yet integrated)',
    };
  } catch (error: any) {
    console.error(`[Social Media Server] Create post error:`, error.message);
    return {
      success: false,
      error: error.message,
      platform,
    };
  }
}

/**
 * Schedule a post for future publication
 * Uses backend API /api/social/schedule
 */
async function schedulePost(params: any) {
  const { platform, text, media_urls = [], hashtags = [], scheduled_time, project_id, access_token } = params;

  const scheduledDate = new Date(scheduled_time);
  if (isNaN(scheduledDate.getTime())) {
    throw new Error('Invalid scheduled_time format. Use ISO 8601 (e.g., 2026-03-20T14:00:00Z)');
  }

  if (!project_id) {
    throw new Error('project_id is required for scheduling posts');
  }

  if (!access_token) {
    throw new Error('access_token is required for scheduling posts');
  }

  try {
    // Call backend API to schedule the post
    const response = await axios.post(
      `${BACKEND_API_URL}/api/social/schedule`,
      {
        project_id,
        platform,
        content: text,
        media_urls,
        hashtags,
        scheduled_at: scheduled_time,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    return {
      success: true,
      scheduled_post: response.data.scheduled_post,
      message: `Post scheduled for ${scheduled_time}`,
      note: '✅ Scheduled via backend API - will be published automatically',
    };
  } catch (error: any) {
    console.error('[Social Media Server] Schedule post error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error || error.message,
      platform,
    };
  }
}

/**
 * Get post performance metrics
 * Supports LinkedIn and Instagram (real APIs), mock for others
 */
async function getPostPerformance(params: any) {
  const { platform, post_id, credentials } = params;

  // Validate credentials for LinkedIn and Instagram
  if ((platform === 'linkedin' || platform === 'instagram') && !credentials) {
    throw new Error(`${platform} requires credentials. Please connect your ${platform} account first.`);
  }

  try {
    let performance;

    switch (platform) {
      case 'linkedin':
        performance = await linkedInProvider.getPostPerformance(post_id, credentials);
        break;

      case 'instagram':
        performance = await instagramProvider.getPostPerformance(post_id, credentials);
        break;

      case 'twitter':
      case 'tiktok':
      case 'facebook':
        // Mock data for not yet implemented platforms
        performance = {
          platform,
          post_id,
          likes: Math.floor(Math.random() * 500) + 50,
          comments: Math.floor(Math.random() * 50) + 5,
          shares: Math.floor(Math.random() * 30) + 2,
          impressions: Math.floor(Math.random() * 5000) + 500,
          engagement_rate: parseFloat((Math.random() * 10 + 2).toFixed(2)),
          posted_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        };
        break;

      default:
        throw new Error(`Unknown platform: ${platform}`);
    }

    return {
      success: true,
      performance,
      note: (platform === 'linkedin' || platform === 'instagram')
        ? '✅ Real analytics from API'
        : '⚠️ Mock data (platform not yet integrated)',
    };
  } catch (error: any) {
    console.error(`[Social Media Server] Get performance error:`, error.message);
    return {
      success: false,
      error: error.message,
      platform,
      post_id,
    };
  }
}

async function createContentCalendar(params: any) {
  const { platforms, duration_days = 7, posts_per_day = 3, topics = [] } = params;

  const calendar: any[] = [];
  const startDate = new Date();

  for (let day = 0; day < duration_days; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day);

    for (let post = 0; post < posts_per_day; post++) {
      const platform = platforms[Math.floor(Math.random() * platforms.length)];
      const topic = topics.length > 0 ? topics[Math.floor(Math.random() * topics.length)] : 'General content';

      calendar.push({
        date: currentDate.toISOString().split('T')[0],
        time: `${8 + Math.floor(Math.random() * 12)}:00`,
        platform,
        topic,
        suggested_content: `Post about ${topic} on ${platform}`,
        content_type: ['text', 'image', 'video', 'carousel'][Math.floor(Math.random() * 4)],
      });
    }
  }

  return {
    success: true,
    calendar,
    summary: {
      total_posts: calendar.length,
      duration_days,
      platforms,
      posts_per_day,
    },
    note: '⚠️ Phase 2: AI-generated suggestions. Can be customized with real content in Phase 3.',
  };
}

async function suggestHashtags(params: any) {
  const { platform, content, industry = 'general', count = 10 } = params;

  // Phase 2: Generate platform-specific hashtags based on content keywords
  const contentWords = content.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
  const topWords = contentWords.slice(0, 5);

  const platformHashtags: Record<SocialPlatform, string[]> = {
    linkedin: ['Leadership', 'Business', 'Innovation', 'Growth', 'Strategy', 'Success', 'Entrepreneurship'],
    instagram: ['Instagood', 'PhotoOfTheDay', 'InstaDaily', 'Love', 'Beautiful', 'Happy', 'FollowMe'],
    twitter: ['Tech', 'News', 'Trending', 'Breaking', 'Updates', 'Community', 'Discussion'],
    tiktok: ['ForYou', 'FYP', 'Viral', 'Trending', 'Challenge', 'Fun', 'Creator'],
    facebook: ['Community', 'Family', 'Friends', 'Share', 'Connect', 'Update', 'News'],
  };

  const hashtags = [
    ...topWords.map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)),
    ...platformHashtags[platform as SocialPlatform].slice(0, count - topWords.length),
    industry.charAt(0).toUpperCase() + industry.slice(1),
  ].slice(0, count);

  return {
    success: true,
    hashtags: hashtags.map((h: string) => ({ tag: h, popularity: Math.floor(Math.random() * 100) })),
    platform,
    note: '⚠️ Phase 2: AI-generated hashtags. Real trending data will be available in Phase 3.',
  };
}

async function analyzeBestTimes(params: any) {
  const { platform, timezone = 'UTC' } = params;

  // Phase 2: Return platform-specific best practices
  const bestTimes: Record<SocialPlatform, any> = {
    linkedin: {
      best_days: ['Tuesday', 'Wednesday', 'Thursday'],
      best_hours: [8, 12, 17],
      worst_days: ['Saturday', 'Sunday'],
      peak_engagement: 'Weekdays 8-10 AM and 5-6 PM',
    },
    instagram: {
      best_days: ['Monday', 'Wednesday', 'Friday'],
      best_hours: [11, 14, 19],
      worst_days: ['Sunday'],
      peak_engagement: 'Weekdays 11 AM - 2 PM',
    },
    twitter: {
      best_days: ['Monday', 'Tuesday', 'Wednesday'],
      best_hours: [9, 12, 15],
      worst_days: ['Saturday'],
      peak_engagement: 'Weekdays 9 AM - 3 PM',
    },
    tiktok: {
      best_days: ['Tuesday', 'Thursday', 'Friday'],
      best_hours: [15, 18, 21],
      worst_days: ['Monday'],
      peak_engagement: 'Evenings 6-10 PM',
    },
    facebook: {
      best_days: ['Wednesday', 'Thursday', 'Friday'],
      best_hours: [13, 15, 19],
      worst_days: ['Sunday'],
      peak_engagement: 'Weekdays 1-4 PM',
    },
  };

  return {
    success: true,
    platform,
    timezone,
    analysis: bestTimes[platform as SocialPlatform],
    note: '⚠️ Phase 2: Industry best practices. Personalized data will be available in Phase 3.',
  };
}

async function getTrendingTopics(params: any) {
  const { platform, category = 'general', count = 10 } = params;

  // Phase 2: Mock trending topics
  const mockTrending = [
    { topic: 'AI Revolution', hashtag: '#AIRevolution', engagement: 95000 },
    { topic: 'Digital Marketing 2026', hashtag: '#DigitalMarketing2026', engagement: 87000 },
    { topic: 'Remote Work', hashtag: '#RemoteWork', engagement: 76000 },
    { topic: 'Sustainability', hashtag: '#Sustainability', engagement: 65000 },
    { topic: 'Web3', hashtag: '#Web3', engagement: 58000 },
    { topic: 'Content Strategy', hashtag: '#ContentStrategy', engagement: 52000 },
    { topic: 'Personal Branding', hashtag: '#PersonalBranding', engagement: 48000 },
    { topic: 'Innovation', hashtag: '#Innovation', engagement: 43000 },
    { topic: 'Leadership', hashtag: '#Leadership', engagement: 39000 },
    { topic: 'Startup Life', hashtag: '#StartupLife', engagement: 35000 },
  ];

  return {
    success: true,
    platform,
    category,
    trending: mockTrending.slice(0, count),
    note: '⚠️ Phase 2: Mock trending data. Real-time trends will be available in Phase 3.',
  };
}

async function analyzeCompetitorsContent(params: any) {
  const { platform, competitor_handles, days_back = 30 } = params;

  // Phase 2: Mock competitor analysis
  const analysis = competitor_handles.map((handle: string) => ({
    handle,
    platform,
    posts_count: Math.floor(Math.random() * 50) + 10,
    avg_engagement_rate: parseFloat((Math.random() * 10 + 2).toFixed(2)),
    top_performing_content_type: ['image', 'video', 'carousel', 'text'][Math.floor(Math.random() * 4)],
    posting_frequency: `${Math.floor(Math.random() * 3) + 1} posts/day`,
    best_posting_times: ['9 AM', '1 PM', '6 PM'],
    top_hashtags: ['#Marketing', '#Business', '#Growth', '#Innovation', '#Success'],
    follower_growth: `+${Math.floor(Math.random() * 1000) + 100}`,
  }));

  return {
    success: true,
    platform,
    period_days: days_back,
    competitors: analysis,
    insights: {
      avg_posts_per_day: (analysis.reduce((sum: number, c: any) => sum + parseFloat(c.posting_frequency), 0) / analysis.length).toFixed(1),
      most_used_content_type: 'video',
      common_posting_times: ['9 AM', '1 PM'],
    },
    note: '⚠️ Phase 2: Mock analysis. Real competitor data will be available in Phase 3.',
  };
}

async function getEngagementMetrics(params: any) {
  const { platform, period_days = 30 } = params;

  // Phase 2: Mock engagement metrics
  const metrics = {
    platform,
    period_days,
    followers: Math.floor(Math.random() * 10000) + 1000,
    follower_growth: `+${Math.floor(Math.random() * 500) + 50}`,
    total_posts: Math.floor(Math.random() * 100) + 20,
    total_likes: Math.floor(Math.random() * 5000) + 500,
    total_comments: Math.floor(Math.random() * 500) + 50,
    total_shares: Math.floor(Math.random() * 300) + 30,
    total_impressions: Math.floor(Math.random() * 50000) + 5000,
    avg_engagement_rate: parseFloat((Math.random() * 8 + 2).toFixed(2)),
    best_performing_post: {
      id: `post_${Date.now()}`,
      engagement_rate: parseFloat((Math.random() * 15 + 5).toFixed(2)),
      likes: Math.floor(Math.random() * 1000) + 100,
    },
  };

  return {
    success: true,
    metrics,
    note: '⚠️ Phase 2: Mock metrics. Real account data will be available in Phase 3.',
  };
}

async function replyToComments(params: any) {
  const { platform, post_id, comment_id, reply_text } = params;

  // Phase 2: Mock reply
  const mockReplyId = `reply_${Date.now()}`;

  return {
    success: true,
    reply: {
      id: mockReplyId,
      platform,
      post_id,
      comment_id,
      text: reply_text,
      created_at: new Date().toISOString(),
      status: 'published',
    },
    note: '⚠️ Phase 2: Mock implementation. Real comment replies will be available in Phase 3.',
  };
}

// ─────────────────────────────────────────────────────────────────
// MCP Server Setup
// ─────────────────────────────────────────────────────────────────

const server = new Server(
  {
    name: 'social-media-mcp-server',
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
      case 'create_post':
        result = await createPost(args);
        break;
      case 'schedule_post':
        result = await schedulePost(args);
        break;
      case 'get_post_performance':
        result = await getPostPerformance(args);
        break;
      case 'create_content_calendar':
        result = await createContentCalendar(args);
        break;
      case 'suggest_hashtags':
        result = await suggestHashtags(args);
        break;
      case 'analyze_best_times':
        result = await analyzeBestTimes(args);
        break;
      case 'get_trending_topics':
        result = await getTrendingTopics(args);
        break;
      case 'analyze_competitors_content':
        result = await analyzeCompetitorsContent(args);
        break;
      case 'get_engagement_metrics':
        result = await getEngagementMetrics(args);
        break;
      case 'reply_to_comments':
        result = await replyToComments(args);
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
  console.error('Social Media MCP Server starting...');
  console.error('Phase 2: Foundation with mock implementations');
  console.error('Phase 3: Real OAuth + API integrations coming soon');
  console.error('');
  console.error('Supported platforms: LinkedIn, Instagram, Twitter/X, TikTok, Facebook');
  console.error('Available tools: 10');

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Social Media MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
