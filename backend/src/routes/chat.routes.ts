/**
 * Chat Routes - Main conversational endpoint
 * POST /api/chat - Processes user messages through agent system
 */

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate, schemas } from '../middleware/validation.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { chatRateLimiter } from '../middleware/rate-limit.middleware.js';
import type { ChatRequest, ChatResponse } from '../types/api.types.js';

// Import agent orchestrator (to be created in Phase 2.2)
// import { processChat } from '../agents/orchestrator.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────
// POST /api/chat - Main chat endpoint
// ─────────────────────────────────────────────────────────────────

router.post(
  '/',
  authMiddleware,
  chatRateLimiter,
  validate(schemas.chatRequest),
  asyncHandler(async (req, res) => {
    const chatRequest = req.body as ChatRequest;
    // const userId = (req as any).user.id; // Will be used in Phase 2.2

    console.log(`[Chat] Processing message for project ${chatRequest.project_id}`);

    // TODO Phase 2.2: Replace with actual orchestrator
    // const response = await processChat(chatRequest, _userId);

    // Temporary placeholder response
    const response: ChatResponse = {
      success: true,
      agent: 'luna',
      agent_id: 'luna',
      message: 'Backend TypeScript is now operational! Agent routing coming in Phase 2.2.',
      ui_components: [],
      memory_contribution: {
        action: 'test_response',
        summary: 'Backend API Gateway responding successfully',
        key_findings: ['API Gateway operational', 'Auth working', 'Rate limiting active'],
        deliverables: [],
        recommendations: [],
      },
      write_back_commands: [],
      session_id: chatRequest.session_id,
    };

    res.json(response);
  })
);

export default router;
