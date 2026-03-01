/**
 * Analytics Routes - Data fetching endpoints
 * POST /api/analytics - Fetches GA4, Google Ads, Meta Ads data
 */

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate, schemas } from '../middleware/validation.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import type { AnalyticsRequest, AnalyticsResponse } from '../types/api.types.js';

// Import analytics handler (to be created in Phase 2.3 with Sora agent)
// import { fetchAnalytics } from '../agents/sora.agent.js';

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
    // const userId = (req as any).user.id; // Will be used in Phase 2.3

    console.log(`[Analytics] Fetching ${analyticsRequest.source} data for project ${analyticsRequest.project_id}`);

    // TODO Phase 2.3: Replace with actual Sora agent analytics fetcher
    // const response = await fetchAnalytics(analyticsRequest, userId);

    // Temporary placeholder response
    const response: AnalyticsResponse = {
      source: analyticsRequest.source,
      data: {
        message: 'Analytics fetching coming in Phase 2.3 (Sora agent)',
        placeholder: true,
      },
      ui_components: [],
    };

    res.json(response);
  })
);

export default router;
