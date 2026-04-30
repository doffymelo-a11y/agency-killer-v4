/**
 * Analytics Routes - Data fetching endpoints
 * POST /api/analytics - Fetches GA4, Google Ads, Meta Ads data
 */

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate, schemas } from '../middleware/validation.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { fetchAnalytics } from '../services/analytics.service.js';
import type { AnalyticsRequest } from '../services/analytics.service.js';
import { logger } from '../lib/logger.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────
// POST /api/analytics - Fetch analytics data
// ─────────────────────────────────────────────────────────────────

router.post(
  '/',
  authMiddleware,
  validate(schemas.analyticsRequest),
  asyncHandler(async (req, res) => {
    const analyticsRequest = req.body as AnalyticsRequest;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized - No user ID found' });
      return;
    }

    logger.log(`[Analytics] User ${userId} fetching ${analyticsRequest.source} data for project ${analyticsRequest.project_id}`);

    // Fetch analytics data from MCP servers
    const analyticsData = await fetchAnalytics(analyticsRequest, userId);

    res.json({
      success: true,
      data: analyticsData,
    });
  })
);

export default router;
