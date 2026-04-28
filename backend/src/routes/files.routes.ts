/**
 * Files Routes - File management for projects
 * Phase 4 - Chantier A: Files Persistant
 */

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import {
  getProjectFiles,
  createFile,
  deleteFile,
  autoTagFile,
  type CreateFileInput,
} from '../services/files.service.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────
// GET /api/files/:projectId - Get all files for a project
// ─────────────────────────────────────────────────────────────────

router.get(
  '/:projectId',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized - No user ID found' });
      return;
    }

    console.log(`[Files API] GET /${projectId} - User: ${userId}`);

    const files = await getProjectFiles(projectId, userId);

    res.json({
      success: true,
      files,
      total: files.length,
    });
  })
);

// ─────────────────────────────────────────────────────────────────
// POST /api/files/:projectId - Upload a new file
// ─────────────────────────────────────────────────────────────────

router.post(
  '/:projectId',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized - No user ID found' });
      return;
    }

    const {
      task_id,
      agent_id,
      filename,
      url,
      file_type,
      mime_type,
      size_bytes,
      tags: providedTags,
      metadata,
    } = req.body;

    // Validate required fields
    if (!filename || !url || !file_type || !mime_type || size_bytes === undefined) {
      res.status(400).json({
        error: 'Missing required fields: filename, url, file_type, mime_type, size_bytes',
      });
      return;
    }

    console.log(`[Files API] POST /${projectId} - Uploading: ${filename}`);

    // Auto-tag if no tags provided
    const tags = providedTags && providedTags.length > 0
      ? providedTags
      : autoTagFile(filename, mime_type, agent_id);

    const input: CreateFileInput = {
      project_id: projectId,
      task_id,
      agent_id,
      uploaded_by: userId,
      filename,
      url,
      file_type,
      mime_type,
      size_bytes,
      tags,
      metadata: metadata || {},
    };

    const file = await createFile(input, userId);

    res.status(201).json({
      success: true,
      file,
    });
  })
);

// ─────────────────────────────────────────────────────────────────
// DELETE /api/files/:fileId - Delete a file
// ─────────────────────────────────────────────────────────────────

router.delete(
  '/:fileId',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { fileId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized - No user ID found' });
      return;
    }

    console.log(`[Files API] DELETE /${fileId} - User: ${userId}`);

    await deleteFile(fileId, userId);

    res.json({
      success: true,
      message: 'File deleted successfully',
    });
  })
);

export default router;
