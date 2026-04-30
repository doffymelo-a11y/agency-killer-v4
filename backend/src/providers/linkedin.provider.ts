/**
 * LinkedIn Provider - Real API Integration
 * API Docs: https://learn.microsoft.com/linkedin/marketing/
 *
 * Required OAuth scopes:
 * - w_member_social (create posts)
 * - r_organization_social (read org stats)
 * - rw_organization_admin (manage org pages)
 *
 * Rate Limits:
 * - 100 posts/day per user
 * - 500 API calls/day
 */

import axios, { AxiosInstance } from 'axios';
import type { SocialMediaProvider, PostContent, PostResult, PostPerformance, IntegrationCredentials } from '../types/social-media.types.js';

const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2';

export class LinkedInProvider implements SocialMediaProvider {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: LINKEDIN_API_BASE,
      headers: {
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
    });
  }

  /**
   * Create and publish a LinkedIn post
   */
  async createPost(content: PostContent, credentials: IntegrationCredentials): Promise<PostResult> {
    const { text, media_urls = [], hashtags = [] } = content;
    const { access_token, additional_data } = credentials;

    // Get author URN (person or organization)
    const authorUrn = additional_data?.author_urn || await this.getAuthorUrn(access_token);

    if (!authorUrn) {
      throw new Error('LinkedIn author URN not found. Please reconnect your LinkedIn integration.');
    }

    // Format text with hashtags
    const formattedText = hashtags.length > 0
      ? `${text}\n\n${hashtags.map(tag => `#${tag}`).join(' ')}`
      : text;

    // Build UGC post payload
    const payload: any = {
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: formattedText,
          },
          shareMediaCategory: media_urls.length > 0 ? 'IMAGE' : 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    // Add media if provided (only first image for now, carousel later)
    if (media_urls.length > 0) {
      const uploadedMediaUrn = await this.uploadMedia(media_urls[0], access_token);

      payload.specificContent['com.linkedin.ugc.ShareContent'].media = [
        {
          status: 'READY',
          media: uploadedMediaUrn,
        },
      ];
    }

    try {
      const response = await this.client.post('/ugcPosts', payload, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      const postId = response.headers['x-restli-id'] || response.data.id;
      const postUrl = `https://www.linkedin.com/feed/update/${postId}`;

      return {
        id: postId,
        platform: 'linkedin',
        text: formattedText,
        media_urls,
        hashtags,
        url: postUrl,
        created_at: new Date().toISOString(),
        status: 'published',
      };
    } catch (error: any) {
      console.error('[LinkedIn Provider] Create post error:', error.response?.data || error.message);
      throw new Error(`LinkedIn post failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get LinkedIn post performance metrics
   */
  async getPostPerformance(postId: string, credentials: IntegrationCredentials): Promise<PostPerformance> {
    const { access_token, additional_data } = credentials;

    // Extract share ID from post ID (format: urn:li:share:XXXXX)
    const shareUrn = postId.startsWith('urn:') ? postId : `urn:li:share:${postId}`;

    try {
      // Get post statistics
      const response = await this.client.get('/organizationalEntityShareStatistics', {
        params: {
          q: 'organizationalEntity',
          organizationalEntity: additional_data?.organization_urn || await this.getOrganizationUrn(access_token),
          shares: shareUrn,
        },
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      const stats = response.data.elements?.[0]?.totalShareStatistics;

      if (!stats) {
        throw new Error('No statistics found for this post');
      }

      // Calculate engagement rate
      const impressions = stats.impressionCount || 1;
      const engagements = (stats.likeCount || 0) + (stats.commentCount || 0) + (stats.shareCount || 0) + (stats.clickCount || 0);
      const engagementRate = (engagements / impressions) * 100;

      return {
        platform: 'linkedin',
        post_id: postId,
        likes: stats.likeCount || 0,
        comments: stats.commentCount || 0,
        shares: stats.shareCount || 0,
        impressions: stats.impressionCount || 0,
        reach: stats.uniqueImpressionsCount || 0,
        engagement_rate: parseFloat(engagementRate.toFixed(2)),
        posted_at: new Date().toISOString(), // LinkedIn doesn't return post date in stats
      };
    } catch (error: any) {
      console.error('[LinkedIn Provider] Get performance error:', error.response?.data || error.message);

      // Return fallback if API fails
      return {
        platform: 'linkedin',
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

  /**
   * Get account engagement metrics (last 30 days)
   */
  async getEngagementMetrics(periodDays: number, credentials: IntegrationCredentials): Promise<any> {
    const { access_token, additional_data } = credentials;

    try {
      const organizationUrn = additional_data?.organization_urn || await this.getOrganizationUrn(access_token);

      // Get organization follower statistics
      const response = await this.client.get('/networkSizes', {
        params: {
          q: 'organization',
          organization: organizationUrn,
          edgeType: 'FOLLOWER',
        },
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      const followers = response.data.elements?.[0]?.firstDegreeSize || 0;

      return {
        platform: 'linkedin',
        period_days: periodDays,
        followers,
        follower_growth: '+0', // Requires historical data tracking
        avg_engagement_rate: 0, // Requires aggregating post stats
      };
    } catch (error: any) {
      console.error('[LinkedIn Provider] Get engagement metrics error:', error.response?.data || error.message);
      return {
        platform: 'linkedin',
        period_days: periodDays,
        followers: 0,
        follower_growth: '+0',
        avg_engagement_rate: 0,
      };
    }
  }

  /**
   * Upload media to LinkedIn (images only for now)
   */
  private async uploadMedia(mediaUrl: string, accessToken: string): Promise<string> {
    try {
      // Step 1: Register upload
      const registerResponse = await this.client.post(
        '/assets?action=registerUpload',
        {
          registerUploadRequest: {
            recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
            owner: await this.getAuthorUrn(accessToken),
            serviceRelationships: [
              {
                relationshipType: 'OWNER',
                identifier: 'urn:li:userGeneratedContent',
              },
            ],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const uploadUrl = registerResponse.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
      const assetUrn = registerResponse.data.value.asset;

      // Step 2: Download media from URL
      const mediaResponse = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
      const mediaBuffer = Buffer.from(mediaResponse.data);

      // Step 3: Upload to LinkedIn
      await axios.put(uploadUrl, mediaBuffer, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/octet-stream',
        },
      });

      return assetUrn;
    } catch (error: any) {
      console.error('[LinkedIn Provider] Media upload error:', error.response?.data || error.message);
      throw new Error('Failed to upload media to LinkedIn');
    }
  }

  /**
   * Get author URN (person or organization)
   */
  private async getAuthorUrn(accessToken: string): Promise<string> {
    try {
      const response = await this.client.get('/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return `urn:li:person:${response.data.id}`;
    } catch (error: any) {
      console.error('[LinkedIn Provider] Get author URN error:', error.response?.data || error.message);
      throw new Error('Failed to get LinkedIn author URN');
    }
  }

  /**
   * Get organization URN (for company pages)
   */
  private async getOrganizationUrn(accessToken: string): Promise<string> {
    try {
      const response = await this.client.get('/organizations', {
        params: {
          q: 'roleAssignee',
          role: 'ADMINISTRATOR',
          count: 1,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.data.elements && response.data.elements.length > 0) {
        const orgId = response.data.elements[0].id;
        return `urn:li:organization:${orgId}`;
      }

      throw new Error('No LinkedIn organization found for this user');
    } catch (error: any) {
      console.error('[LinkedIn Provider] Get organization URN error:', error.response?.data || error.message);
      throw new Error('Failed to get LinkedIn organization URN');
    }
  }
}
