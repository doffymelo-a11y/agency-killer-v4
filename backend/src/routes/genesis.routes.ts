/**
 * Genesis Routes - Project initialization
 * POST /api/genesis - Creates new project with AI-generated roadmap
 */

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate, schemas } from '../middleware/validation.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import type { GenesisRequest, GenesisResponse } from '../types/api.types.js';
import { logger } from '../lib/logger.js';

// Import genesis handler (to be created in Phase 2.2)
// import { executeGenesis } from '../agents/orchestrator.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────
// POST /api/genesis - Create new project
// ─────────────────────────────────────────────────────────────────

router.post(
  '/',
  authMiddleware,
  validate(schemas.genesisRequest),
  asyncHandler(async (req, res) => {
    const genesisRequest = req.body as GenesisRequest;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized - No user ID found' });
      return;
    }

    logger.log(`[Genesis] Creating project: ${genesisRequest.project_name} for user ${userId}`);

    // TODO Phase 2.2: Replace with actual genesis orchestrator
    // const response = await executeGenesis(genesisRequest, userId);

    // Temporary placeholder response
    const response: GenesisResponse = {
      success: true,
      message: `Projet "${genesisRequest.project_name}" initialisé avec succès. Génération du roadmap en Phase 2.2.`,
      ui_components: [],
      write_back_commands: [],
    };

    res.json(response);
  })
);

export default router;
