/**
 * Task Explainer Routes - Endpoints for contextual task explanations
 * POST /api/task-explainer/explain - Generate intelligent explanation for a task
 */

import { Router } from 'express';
import { explainTask } from '../services/task-explainer.service.js';
import type { AgentId } from '../types/api.types.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────
// POST /api/task-explainer/explain
// ─────────────────────────────────────────────────────────────────

router.post('/explain', async (req, res) => {
  try {
    const { task_id, project_id, agent_id } = req.body;

    // Validation
    if (!task_id || !project_id || !agent_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: task_id, project_id, agent_id',
      });
    }

    // Generate explanation
    const explanation = await explainTask(task_id, project_id, agent_id as AgentId);

    return res.json({
      success: true,
      explanation,
    });
  } catch (error: any) {
    console.error('[Task Explainer Routes] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate task explanation',
    });
  }
});

export default router;
