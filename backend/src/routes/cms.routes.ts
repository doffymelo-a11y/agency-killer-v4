/**
 * CMS Routes - Execute and rollback CMS changes
 * POST /api/cms/execute - Executes an approved CMS change
 * POST /api/cms/rollback - Rolls back a CMS change
 * GET /api/cms/pending - Lists pending CMS approvals
 */

import { Router } from 'express';
import { validate, schemas } from '../middleware/validation.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { chatRateLimiter } from '../middleware/rate-limit.middleware.js';
import {
  executeCMSChange,
  rollbackCMSChange,
  getPendingCMSApprovals,
} from '../services/cms.service.js';
import type { CMSExecuteRequest, CMSRollbackRequest } from '../types/api.types.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────
// POST /api/cms/execute - Execute an approved CMS change
// ─────────────────────────────────────────────────────────────────

router.post(
  '/execute',
  // authMiddleware, // TODO: Re-enable after testing
  chatRateLimiter,
  validate(schemas.cmsExecuteRequest),
  asyncHandler(async (req, res) => {
    const executeRequest = req.body as CMSExecuteRequest;
    const userId = (req as any).user?.id || 'test-user';

    console.log(`[CMS] Executing change ${executeRequest.change_id}`);

    // Execute the CMS change
    const result = await executeCMSChange(executeRequest, userId);

    res.json(result);
  })
);

// ─────────────────────────────────────────────────────────────────
// POST /api/cms/rollback - Rollback a CMS change
// ─────────────────────────────────────────────────────────────────

router.post(
  '/rollback',
  // authMiddleware, // TODO: Re-enable after testing
  chatRateLimiter,
  validate(schemas.cmsRollbackRequest),
  asyncHandler(async (req, res) => {
    const rollbackRequest = req.body as CMSRollbackRequest;
    const userId = (req as any).user?.id || 'test-user';

    console.log(`[CMS] Rolling back change ${rollbackRequest.change_id}`);

    // Rollback the CMS change
    const result = await rollbackCMSChange(rollbackRequest, userId);

    res.json(result);
  })
);

// ─────────────────────────────────────────────────────────────────
// GET /api/cms/pending - List pending CMS approvals
// ─────────────────────────────────────────────────────────────────

router.get(
  '/pending',
  // authMiddleware, // TODO: Re-enable after testing
  asyncHandler(async (req, res) => {
    const userId = (req as any).user?.id || 'test-user';

    console.log(`[CMS] Fetching pending approvals for user ${userId}`);

    // Get pending CMS approvals
    const pending = await getPendingCMSApprovals(userId);

    res.json({ pending });
  })
);

export default router;
