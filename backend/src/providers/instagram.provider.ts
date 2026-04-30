/**
 * Instagram Provider - Real API Integration
 * API Docs: https://developers.facebook.com/docs/instagram-api
 *
 * Required OAuth scopes:
 * - instagram_basic
 * - instagram_content_publish
 * - instagram_manage_insights
 * - pages_read_engagement
 *
 * Rate Limits:
 * - 25 posts/day per user (Instagram limit)
 * - 200 API calls/hour
 *
 * Publishing Flow:
 * 1. Create media container (POST /{ig-user-id}/media)
 * 2. Publish container (POST /{ig-user-id}/media_publish)
 */

import axios, { AxiosInstance } from 'axios';
import type { SocialMediaProvider, PostContent, PostResult, PostPerformance, IntegrationCredentials } from '../types/social-media.types.js';

const INSTAGRAM_GRAPH_API_BASE = 'https://graph.facebook.com/v21.0';

export class InstagramProvider implements SocialMediaProvider {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: INSTAGRAM_GRAPH_API_BASE,
    });
  }

  /**
   * Create and publish an Instagram post
   * Supports: image, carousel (multiple images), reel (video)
   */
  async createPost(content: PostContent, credentials: IntegrationCredentials): Promise<PostResult> {
    const { text, media_urls = [], hashtags = [] } = content;
    const { access_token, additional_data } = credentials;

    // Get Instagram Business Account ID
    const igUserId = additional_data?.instagram_business_account_id || await this.getInstagramUserId(access_token);

    if (!igUserId) {
      throw new Error('Instagram Business Account ID not found. Please reconnect your Instagram integration.');
    }

    // Format caption with hashtags
    const caption = hashtags.length > 0
      ? `${text}\n\n${hashtags.map(tag => `#${tag}`).join(' ')}`
      : text;

    try {
      let containerId: string;

      if (media_urls.length === 0) {
        throw new Error('Instagram requires at least one image or video');
      }

      // Single image or video
      if (media_urls.length === 1) {
        const mediaUrl = media_urls[0];
        const isVideo = this.isVideoUrl(mediaUrl);

        containerId = await this.createMediaContainer(igUserId, {
          [isVideo ? 'video_url' : 'image_url']: mediaUrl,
          caption,
          media_type: isVideo ? 'REELS' : 'IMAGE',
          access_token,
        });
      }
      // Carousel (multiple images)
      else {
        containerId = await this.createCarouselContainer(igUserId, media_urls, caption, access_token);
      }

      // Wait for container to be ready (required for video)
      await this.waitForContainerReady(containerId, access_token);

      // Publish the container
      const publishResponse = await this.client.post(`/${igUserId}/media_publish`, null, {
        params: {
          creation_id: containerId,
          access_token,
        },
      });

      const postId = publishResponse.data.id;
      const postUrl = `https://www.instagram.com/p/${postId}`;

      return {
        id: postId,
        platform: 'instagram',
        text: caption,
        media_urls,
        hashtags,
        url: postUrl,
        created_at: new Date().toISOString(),
        status: 'published',
      };
    } catch (error: any) {
      console.error('[Instagram Provider] Create post error:', error.response?.data || error.message);
      throw new Error(`Instagram post failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Get Instagram post performance metrics
   */
  async getPostPerformance(postId: string, credentials: IntegrationCredentials): Promise<PostPerformance> {
    const { access_token } = credentials;

    try {
      // Get media insights (likes, comments, saves, reach, impressions, engagement)
      const response = await this.client.get(`/${postId}/insights`, {
        params: {
          metric: 'impressions,reach,engagement,saved,likes,comments,shares',
          access_token,
        },
      });

      const insights = response.data.data;
      const impressions = insights.find((i: any) => i.name === 'impressions')?.values[0]?.value || 0;
      const reach = insights.find((i: any) => i.name === 'reach')?.values[0]?.value || 0;
      const engagement = insights.find((i: any) => i.name === 'engagement')?.values[0]?.value || 0;
      const likes = insights.find((i: any) => i.name === 'likes')?.values[0]?.value || 0;
      const comments = insights.find((i: any) => i.name === 'comments')?.values[0]?.value || 0;
      const shares = insights.find((i: any) => i.name === 'shares')?.values[0]?.value || 0;

      // Calculate engagement rate
      const engagementRate = reach > 0 ? (engagement / reach) * 100 : 0;

      return {
        platform: 'instagram',
        post_id: postId,
        likes,
        comments,
        shares,
        impressions,
        reach,
        engagement_rate: parseFloat(engagementRate.toFixed(2)),
        posted_at: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('[Instagram Provider] Get performance error:', error.response?.data || error.message);

      // Fallback to basic metrics if insights fail
      try {
        const basicResponse = await this.client.get(`/${postId}`, {
          params: {
            fields: 'like_count,comments_count,timestamp',
            access_token,
          },
        });

        return {
          platform: 'instagram',
          post_id: postId,
          likes: basicResponse.data.like_count || 0,
          comments: basicResponse.data.comments_count || 0,
          shares: 0,
          impressions: 0,
          engagement_rate: 0,
          posted_at: basicResponse.data.timestamp || new Date().toISOString(),
        };
      } catch (fallbackError) {
        return {
          platform: 'instagram',
          post_id: postId,
          likes: 0,
          comments: 0,
          shares: 0,
          impressions: 0,
          engagement_rate: 0,
          posted_at: new Date().toISOString(),
        };
      }
    }
  }

  /**
   * Get account engagement metrics (followers, avg engagement)
   */
  async getEngagementMetrics(periodDays: number, credentials: IntegrationCredentials): Promise<any> {
    const { access_token, additional_data } = credentials;
    const igUserId = additional_data?.instagram_business_account_id;

    if (!igUserId) {
      throw new Error('Instagram Business Account ID not found');
    }

    try {
      // Get account insights
      const response = await this.client.get(`/${igUserId}/insights`, {
        params: {
          metric: 'impressions,reach,follower_count,profile_views',
          period: 'day',
          since: Math.floor(Date.now() / 1000) - (periodDays * 24 * 60 * 60),
          until: Math.floor(Date.now() / 1000),
          access_token,
        },
      });

      const insights = response.data.data;
      const followerCount = insights.find((i: any) => i.name === 'follower_count')?.values[0]?.value || 0;

      return {
        platform: 'instagram',
        period_days: periodDays,
        followers: followerCount,
        follower_growth: '+0', // Requires historical tracking
        avg_engagement_rate: 0, // Requires aggregating post stats
      };
    } catch (error: any) {
      console.error('[Instagram Provider] Get engagement metrics error:', error.response?.data || error.message);
      return {
        platform: 'instagram',
        period_days: periodDays,
        followers: 0,
        follower_growth: '+0',
        avg_engagement_rate: 0,
      };
    }
  }

  /**
   * Create a media container (step 1 of publishing)
   */
  private async createMediaContainer(igUserId: string, params: Record<string, any>): Promise<string> {
    const response = await this.client.post(`/${igUserId}/media`, null, { params });
    return response.data.id;
  }

  /**
   * Create a carousel container (multiple images)
   */
  private async createCarouselContainer(
    igUserId: string,
    mediaUrls: string[],
    caption: string,
    accessToken: string
  ): Promise<string> {
    // Step 1: Create individual media containers for each image
    const childContainerIds = await Promise.all(
      mediaUrls.map((url) =>
        this.createMediaContainer(igUserId, {
          image_url: url,
          is_carousel_item: true,
          access_token: accessToken,
        })
      )
    );

    // Step 2: Create carousel container
    const carouselResponse = await this.client.post(`/${igUserId}/media`, null, {
      params: {
        media_type: 'CAROUSEL',
        children: childContainerIds.join(','),
        caption,
        access_token: accessToken,
      },
    });

    return carouselResponse.data.id;
  }

  /**
   * Wait for media container to be ready (required for video/reels)
   */
  private async waitForContainerReady(containerId: string, accessToken: string): Promise<void> {
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max

    while (attempts < maxAttempts) {
      try {
        const response = await this.client.get(`/${containerId}`, {
          params: {
            fields: 'status_code',
            access_token: accessToken,
          },
        });

        const statusCode = response.data.status_code;

        if (statusCode === 'FINISHED') {
          return;
        } else if (statusCode === 'ERROR') {
          throw new Error('Media container processing failed');
        }

        // Wait 1 second before retry
        await new Promise((resolve) => setTimeout(resolve, 1000));
        attempts++;
      } catch (error: any) {
        console.error('[Instagram Provider] Container status check error:', error.response?.data || error.message);
        throw error;
      }
    }

    throw new Error('Media container timeout (not ready after 30 seconds)');
  }

  /**
   * Get Instagram Business Account ID from connected Facebook Page
   */
  private async getInstagramUserId(accessToken: string): Promise<string> {
    try {
      // Get user's pages
      const pagesResponse = await this.client.get('/me/accounts', {
        params: {
          access_token: accessToken,
        },
      });

      if (!pagesResponse.data.data || pagesResponse.data.data.length === 0) {
        throw new Error('No Facebook Pages found. Connect a Facebook Page linked to your Instagram Business Account.');
      }

      // Get Instagram Business Account from first page
      const pageId = pagesResponse.data.data[0].id;
      const pageAccessToken = pagesResponse.data.data[0].access_token;

      const igResponse = await this.client.get(`/${pageId}`, {
        params: {
          fields: 'instagram_business_account',
          access_token: pageAccessToken,
        },
      });

      const igUserId = igResponse.data.instagram_business_account?.id;

      if (!igUserId) {
        throw new Error('No Instagram Business Account found. Link your Instagram account to your Facebook Page.');
      }

      return igUserId;
    } catch (error: any) {
      console.error('[Instagram Provider] Get IG user ID error:', error.response?.data || error.message);
      throw new Error('Failed to get Instagram Business Account ID');
    }
  }

  /**
   * Check if URL is a video
   */
  private isVideoUrl(url: string): boolean {
    return /\.(mp4|mov|avi|mkv)$/i.test(url);
  }
}
