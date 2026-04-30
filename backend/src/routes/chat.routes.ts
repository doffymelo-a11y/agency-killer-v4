/**
 * Chat Routes - Main conversational endpoint
 * POST /api/chat - Processes user messages through agent system
 */

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate, schemas } from '../middleware/validation.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { chatRateLimiter } from '../middleware/rate-limit.middleware.js';
import { processChat } from '../agents/orchestrator.js';
import { supabaseAdmin } from '../services/supabase.service.js';
import type { ChatRequest } from '../types/api.types.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────
// Helper: Check usage limit before agent call
// ─────────────────────────────────────────────────────────────────

async function checkAgentCallLimit(userId: string): Promise<{
  allowed: boolean;
  current: number;
  limit: number;
  plan: string;
}> {
  const { data, error } = await supabaseAdmin.rpc('check_usage_limit', {
    p_user_id: userId,
    p_limit_type: 'agent_calls',
  });

  if (error) {
    console.error('[Usage Check] Error:', error);
    // Default to allowed in case of error (don't block users)
    return { allowed: true, current: 0, limit: 999999, plan: 'free' };
  }

  return {
    allowed: data[0].allowed,
    current: data[0].current_usage,
    limit: data[0].limit_value,
    plan: data[0].plan,
  };
}

async function incrementAgentCall(userId: string): Promise<void> {
  const { error } = await supabaseAdmin.rpc('increment_usage', {
    p_user_id: userId,
    p_usage_type: 'agent_calls',
    p_increment: 1,
  });

  if (error) {
    console.error('[Usage Increment] Error:', error);
  }
}

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
    const userId = (req as any).user?.id;
    const userPlan = (req as any).user?.plan || 'free';

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized - No user ID found' });
      return;
    }

    console.log(`[Chat] Processing message for project ${chatRequest.project_id} - User plan: ${userPlan}`);

    // Check usage limit before processing
    const usageCheck = await checkAgentCallLimit(userId);

    if (!usageCheck.allowed) {
      console.log(`[Chat] Usage limit reached for user ${userId} (${usageCheck.current}/${usageCheck.limit})`);

      res.status(429).json({
        success: false,
        error: {
          message: `Vous avez atteint votre limite mensuelle (${usageCheck.current}/${usageCheck.limit} appels agent). Mettez à niveau votre plan pour continuer.`,
          code: 'USAGE_LIMIT_EXCEEDED',
          details: {
            current_usage: usageCheck.current,
            limit: usageCheck.limit,
            plan: usageCheck.plan,
          },
        },
        upgrade_url: '/billing', // Frontend will redirect to billing page
      });
      return;
    }

    // Process chat through orchestrator
    const response = await processChat(chatRequest, userId);

    // Increment usage after successful agent call
    await incrementAgentCall(userId);

    res.json(response);
  })
);

export default router;
