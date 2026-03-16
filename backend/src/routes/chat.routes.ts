/**
 * Chat Routes - Main conversational endpoint
 * POST /api/chat - Processes user messages through agent system
 */

import { Router } from 'express';
import { validate, schemas } from '../middleware/validation.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { chatRateLimiter } from '../middleware/rate-limit.middleware.js';
import { processChat } from '../agents/orchestrator.js';
import type { ChatRequest } from '../types/api.types.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────
// POST /api/chat - Main chat endpoint
// ─────────────────────────────────────────────────────────────────

router.post(
  '/',
  // authMiddleware, // TODO: Re-enable after Phase 2.5 testing
  chatRateLimiter,
  validate(schemas.chatRequest),
  asyncHandler(async (req, res) => {
    const chatRequest = req.body as ChatRequest;
    const userId = (req as any).user?.id || 'test-user'; // Default user for testing

    console.log(`[Chat] Processing message for project ${chatRequest.project_id}`);

    // Process chat through orchestrator
    const response = await processChat(chatRequest, userId);

    res.json(response);
  })
);

export default router;
