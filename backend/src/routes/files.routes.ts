/**
 * Files Routes - File search and management
 * POST /api/files/search - Search files in Supabase Storage
 */

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────
// POST /api/files/search - Search files
// ─────────────────────────────────────────────────────────────────

router.post(
  '/search',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { project_id, query } = req.body;
    // const userId = (req as any).user.id; // Will be used later

    console.log(`[Files] Searching files for project ${project_id}: "${query}"`);

    // TODO: Implement file search in Supabase Storage
    // For now, return empty results
    const files: any[] = [];

    res.json({
      files,
      total: files.length,
    });
  })
);

// ─────────────────────────────────────────────────────────────────
// GET /api/files/:file_id - Get file details
// ─────────────────────────────────────────────────────────────────

router.get(
  '/:file_id',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { file_id } = req.params;
    // const userId = (req as any).user.id; // Will be used later

    console.log(`[Files] Getting file ${file_id}`);

    // TODO: Implement file retrieval from Supabase Storage
    res.json({
      message: 'File retrieval coming soon',
      file_id,
    });
  })
);

export default router;
