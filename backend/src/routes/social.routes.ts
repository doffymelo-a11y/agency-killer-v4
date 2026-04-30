/**
 * Social Media Routes - Scheduling and management
 * POST /api/social/schedule - Schedule a social media post
 * GET /api/social/scheduled/:projectId - List scheduled posts
 * PATCH /api/social/scheduled/:postId/cancel - Cancel a scheduled post
 */

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { supabaseAdmin } from '../services/supabase.service.js';
import { publishScheduledPosts } from '../services/scheduled-posts-publisher.service.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────
// POST /api/social/publish-scheduled - Publish pending scheduled posts (CRON)
// ─────────────────────────────────────────────────────────────────

router.post(
  '/publish-scheduled',
  asyncHandler(async (req, res) => {
    // IMPORTANT: This endpoint should be secured with a CRON_SECRET in production
    const cronSecret = req.headers['x-cron-secret'];

    if (process.env.NODE_ENV === 'production' && cronSecret !== process.env.CRON_SECRET) {
      res.status(401).json({ error: 'Unauthorized - Invalid cron secret' });
      return;
    }

    console.log('[Social API] Running scheduled posts publisher...');

    const result = await publishScheduledPosts();

    res.json({
      success: true,
      ...result,
      message: `Published ${result.published} posts, ${result.failed} failed`,
    });
  })
);

// ─────────────────────────────────────────────────────────────────
// POST /api/social/schedule - Schedule a social media post
// ─────────────────────────────────────────────────────────────────

router.post(
  '/schedule',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const userId = (req as any).user?.id;
    const {
      project_id,
      platform,
      content,
      media_urls = [],
      hashtags = [],
      mentions = [],
      scheduled_at,
      metadata = {},
    } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Validate required fields
    if (!project_id || !platform || !content || !scheduled_at) {
      res.status(400).json({
        error: 'Missing required fields: project_id, platform, content, scheduled_at',
      });
      return;
    }

    // Validate platform
    const validPlatforms = ['linkedin', 'instagram', 'twitter', 'tiktok', 'facebook'];
    if (!validPlatforms.includes(platform)) {
      res.status(400).json({
        error: `Invalid platform. Must be one of: ${validPlatforms.join(', ')}`,
      });
      return;
    }

    // Validate scheduled_at is in the future
    const scheduledDate = new Date(scheduled_at);
    if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
      res.status(400).json({
        error: 'scheduled_at must be a valid future date (ISO 8601 format)',
      });
      return;
    }

    console.log(`[Social API] Scheduling ${platform} post for ${scheduled_at}`);

    // Insert into scheduled_posts
    const { data, error } = await supabaseAdmin
      .from('scheduled_posts')
      .insert({
        project_id,
        user_id: userId,
        platform,
        content,
        media_urls,
        hashtags,
        mentions,
        scheduled_at,
        metadata,
        status: 'scheduled',
      })
      .select()
      .single();

    if (error) {
      console.error('[Social API] Schedule error:', error);
      res.status(500).json({ error: 'Failed to schedule post' });
      return;
    }

    res.status(201).json({
      success: true,
      scheduled_post: data,
      message: `Post scheduled for ${scheduled_at}`,
    });
  })
);

// ─────────────────────────────────────────────────────────────────
// GET /api/social/scheduled/:projectId - List scheduled posts
// ─────────────────────────────────────────────────────────────────

router.get(
  '/scheduled/:projectId',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    console.log(`[Social API] Fetching scheduled posts for project ${projectId}`);

    // Get scheduled posts for this project
    const { data, error } = await supabaseAdmin
      .from('scheduled_posts')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .order('scheduled_at', { ascending: true });

    if (error) {
      console.error('[Social API] Fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch scheduled posts' });
      return;
    }

    res.json({
      success: true,
      scheduled_posts: data,
      total: data.length,
    });
  })
);

// ─────────────────────────────────────────────────────────────────
// PATCH /api/social/scheduled/:postId/cancel - Cancel a scheduled post
// ─────────────────────────────────────────────────────────────────

router.patch(
  '/scheduled/:postId/cancel',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    console.log(`[Social API] Cancelling scheduled post ${postId}`);

    // Update status to cancelled
    const { data, error } = await supabaseAdmin
      .from('scheduled_posts')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', postId)
      .eq('user_id', userId)
      .eq('status', 'scheduled') // Only cancel if still scheduled
      .select()
      .single();

    if (error) {
      console.error('[Social API] Cancel error:', error);
      res.status(500).json({ error: 'Failed to cancel scheduled post' });
      return;
    }

    if (!data) {
      res.status(404).json({ error: 'Scheduled post not found or already published' });
      return;
    }

    res.json({
      success: true,
      message: 'Scheduled post cancelled',
      scheduled_post: data,
    });
  })
);

export default router;
