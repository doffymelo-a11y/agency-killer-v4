/**
 * Scheduled Posts Publisher Service
 * Publishes scheduled social media posts when their time comes
 *
 * Usage:
 * - Called by cron job every minute: POST /api/social/publish-scheduled
 * - Or run as standalone script: ts-node src/services/scheduled-posts-publisher.service.ts
 */

import { supabaseAdmin } from './supabase.service.js';
import { LinkedInProvider } from '../providers/linkedin.provider.js';
import { InstagramProvider } from '../providers/instagram.provider.js';
import type { PostContent, IntegrationCredentials } from '../types/social-media.types.js';
import { logger } from '../lib/logger.js';

const linkedInProvider = new LinkedInProvider();
const instagramProvider = new InstagramProvider();

interface ScheduledPost {
  id: string;
  project_id: string;
  user_id: string;
  platform: 'linkedin' | 'instagram' | 'twitter' | 'tiktok' | 'facebook';
  content: string;
  media_urls: string[];
  hashtags: string[];
  mentions: string[];
  scheduled_at: string;
  retry_count: number;
}

/**
 * Main function: Publish all pending scheduled posts
 */
export async function publishScheduledPosts(): Promise<{
  published: number;
  failed: number;
  errors: string[];
}> {
  logger.log('[Scheduled Posts] Starting publication run...');

  // Get pending posts (scheduled_at <= NOW and status = 'scheduled')
  const { data: posts, error: fetchError } = await supabaseAdmin.rpc('get_pending_scheduled_posts');

  if (fetchError) {
    console.error('[Scheduled Posts] Fetch error:', fetchError);
    return { published: 0, failed: 0, errors: [fetchError.message] };
  }

  if (!posts || posts.length === 0) {
    logger.log('[Scheduled Posts] No pending posts to publish');
    return { published: 0, failed: 0, errors: [] };
  }

  logger.log(`[Scheduled Posts] Found ${posts.length} pending posts`);

  let published = 0;
  let failed = 0;
  const errors: string[] = [];

  // Publish each post sequentially
  for (const post of posts as ScheduledPost[]) {
    try {
      await publishSinglePost(post);
      published++;
    } catch (error: any) {
      failed++;
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(`Post ${post.id}: ${errorMessage}`);
      console.error(`[Scheduled Posts] Failed to publish ${post.id}:`, errorMessage);
    }
  }

  logger.log(`[Scheduled Posts] Run complete: ${published} published, ${failed} failed`);

  return { published, failed, errors };
}

/**
 * Publish a single scheduled post
 */
async function publishSinglePost(post: ScheduledPost): Promise<void> {
  logger.log(`[Scheduled Posts] Publishing ${post.platform} post ${post.id}`);

  // Update status to 'publishing' to prevent duplicate processing
  await supabaseAdmin.rpc('update_scheduled_post_status', {
    p_post_id: post.id,
    p_status: 'publishing',
  });

  try {
    // Get user's integration credentials for this platform
    const credentials = await getIntegrationCredentials(post.user_id, post.platform);

    if (!credentials) {
      throw new Error(`No ${post.platform} integration found for user ${post.user_id}`);
    }

    // Build post content
    const content: PostContent = {
      text: post.content,
      media_urls: post.media_urls,
      hashtags: post.hashtags,
      mentions: post.mentions,
    };

    // Publish via appropriate provider
    let result;

    switch (post.platform) {
      case 'linkedin':
        result = await linkedInProvider.createPost(content, credentials);
        break;

      case 'instagram':
        result = await instagramProvider.createPost(content, credentials);
        break;

      case 'twitter':
      case 'tiktok':
      case 'facebook':
        throw new Error(`${post.platform} provider not yet implemented`);

      default:
        throw new Error(`Unknown platform: ${post.platform}`);
    }

    // Update status to 'published'
    await supabaseAdmin.rpc('update_scheduled_post_status', {
      p_post_id: post.id,
      p_status: 'published',
      p_platform_post_id: result.id,
      p_platform_post_url: result.url,
    });

    logger.log(`[Scheduled Posts] ✓ Published ${post.platform} post ${post.id}: ${result.url}`);
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Scheduled Posts] ✗ Failed to publish ${post.id}:`, errorMessage);

    // Determine if we should retry
    const shouldRetry = post.retry_count < 3 && !isUnrecoverableError(error);

    await supabaseAdmin.rpc('update_scheduled_post_status', {
      p_post_id: post.id,
      p_status: shouldRetry ? 'scheduled' : 'failed', // Retry if < 3 attempts
      p_error_message: errorMessage,
    });

    throw error;
  }
}

/**
 * Get user's integration credentials for a platform
 */
async function getIntegrationCredentials(
  userId: string,
  platform: string
): Promise<IntegrationCredentials | null> {
  const integrationTypeMap: Record<string, string> = {
    linkedin: 'linkedin',
    instagram: 'instagram',
    twitter: 'twitter',
    tiktok: 'tiktok',
    facebook: 'facebook',
  };

  const integrationType = integrationTypeMap[platform];

  if (!integrationType) {
    throw new Error(`Unknown platform: ${platform}`);
  }

  const { data, error } = await supabaseAdmin
    .from('user_integrations')
    .select('credentials, additional_data')
    .eq('user_id', userId)
    .eq('integration_type', integrationType)
    .eq('status', 'active')
    .single();

  if (error || !data) {
    console.error(`[Scheduled Posts] No ${platform} integration found for user ${userId}`);
    return null;
  }

  return {
    access_token: data.credentials.access_token,
    refresh_token: data.credentials.refresh_token,
    expires_at: data.credentials.expires_at,
    additional_data: data.additional_data || {},
  };
}

/**
 * Check if error is unrecoverable (shouldn't retry)
 */
function isUnrecoverableError(error: any): boolean {
  const message = error.message?.toLowerCase() || '';

  // Unrecoverable errors: auth, permissions, invalid content
  return (
    message.includes('unauthorized') ||
    message.includes('forbidden') ||
    message.includes('invalid') ||
    message.includes('not found') ||
    message.includes('no integration')
  );
}

// Run standalone (for testing)
if (import.meta.url === `file://${process.argv[1]}`) {
  publishScheduledPosts()
    .then((result) => {
      logger.log('[Scheduled Posts] Standalone run complete:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('[Scheduled Posts] Standalone run failed:', error);
      process.exit(1);
    });
}
