/**
 * Task Explainer Routes - Endpoints for contextual task explanations
 * POST /api/task-explainer/explain - Generate intelligent explanation for a task
 */

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { chatRateLimiter } from '../middleware/rate-limit.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { explainTask } from '../services/task-explainer.service.js';
import type { AgentId } from '../types/api.types.js';
import { logger } from '../lib/logger.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────
// POST /api/task-explainer/explain
// ─────────────────────────────────────────────────────────────────

router.post('/explain', authMiddleware, chatRateLimiter, asyncHandler(async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized - No user ID found' });
    return;
  }

  const { task_id, project_id, agent_id } = req.body;

  // Validation
  if (!task_id || !project_id || !agent_id) {
    res.status(400).json({
      success: false,
      error: 'Missing required fields: task_id, project_id, agent_id',
    });
    return;
  }

  logger.log(`[Task Explainer] User ${userId} requesting explanation for task ${task_id}`);

  // Generate explanation
  const explanation = await explainTask(task_id, project_id, agent_id as AgentId);

  res.json({
    success: true,
    explanation,
  });
}));

export default router;
