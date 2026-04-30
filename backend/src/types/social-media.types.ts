/**
 * Shared types for Social Media Server
 */

export type SocialPlatform = 'linkedin' | 'instagram' | 'twitter' | 'tiktok' | 'facebook';

export interface PostContent {
  text: string;
  media_urls?: string[];
  hashtags?: string[];
  mentions?: string[];
}

export interface CreatePostParams extends PostContent {
  platform: SocialPlatform;
}

export interface SchedulePostParams extends PostContent {
  platform: SocialPlatform;
  scheduled_time: string;
}

export interface PostResult {
  id: string;
  platform: SocialPlatform;
  text: string;
  media_urls?: string[];
  hashtags?: string[];
  url: string;
  created_at: string;
  status: 'published' | 'scheduled' | 'failed';
}

export interface PostPerformance {
  platform: SocialPlatform;
  post_id: string;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  reach?: number;
  engagement_rate: number;
  posted_at: string;
}

export interface IntegrationCredentials {
  access_token: string;
  refresh_token?: string;
  expires_at?: string;
  additional_data?: Record<string, any>;
}

/**
 * Base interface for social media providers
 */
export interface SocialMediaProvider {
  /**
   * Create and publish a post
   */
  createPost(content: PostContent, credentials: IntegrationCredentials): Promise<PostResult>;

  /**
   * Get post performance metrics
   */
  getPostPerformance(postId: string, credentials: IntegrationCredentials): Promise<PostPerformance>;

  /**
   * Get account engagement metrics
   */
  getEngagementMetrics?(periodDays: number, credentials: IntegrationCredentials): Promise<any>;
}
