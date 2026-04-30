/**
 * Files Routes - File management for projects
 * Phase 4 - Chantier A: Files Persistant
 */

import { Router } from 'express';
import archiver from 'archiver';
import axios from 'axios';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { logger } from '../lib/logger.js';
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
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized - No user ID found' });
      return;
    }

    logger.log(`[Files API] GET /${projectId} - User: ${userId}`);

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
    const userId = req.user?.id;

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

    logger.log(`[Files API] POST /${projectId} - Uploading: ${filename}`);

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
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized - No user ID found' });
      return;
    }

    logger.log(`[Files API] DELETE /${fileId} - User: ${userId}`);

    await deleteFile(fileId, userId);

    res.json({
      success: true,
      message: 'File deleted successfully',
    });
  })
);

// ─────────────────────────────────────────────────────────────────
// POST /api/files/:projectId/search - AI-powered file search
// ─────────────────────────────────────────────────────────────────

router.post(
  '/:projectId/search',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const userId = req.user?.id;
    const { query, filters } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized - No user ID found' });
      return;
    }

    if (!query || typeof query !== 'string') {
      res.status(400).json({ error: 'query must be a non-empty string' });
      return;
    }

    logger.log(`[Files API] POST /${projectId}/search - Query: "${query}" - User: ${userId}`);

    // Get all project files to verify ownership
    const allFiles = await getProjectFiles(projectId, userId);

    // Parse query into keywords (split by space, lowercase)
    const keywords = query.toLowerCase().split(/\s+/).filter(Boolean);

    // Search files by keywords in filename, tags, metadata
    const matchedFiles = allFiles.filter((file) => {
      const searchableText = [
        file.filename.toLowerCase(),
        ...(file.tags || []).map((t: string) => t.toLowerCase()),
        JSON.stringify(file.metadata || {}).toLowerCase(),
      ].join(' ');

      // Match if any keyword is found
      const matchesQuery = keywords.some((keyword) => searchableText.includes(keyword));

      // Apply filters if provided
      if (filters?.agent && file.agent_id !== filters.agent) return false;
      if (filters?.file_type && file.file_type !== filters.file_type) return false;
      if (filters?.phase && file.metadata?.phase !== filters.phase) return false;

      return matchesQuery;
    });

    logger.log(`[Files Search] Found ${matchedFiles.length} matches for "${query}"`);

    res.json({
      success: true,
      files: matchedFiles,
      total: matchedFiles.length,
      query,
    });
  })
);

// ─────────────────────────────────────────────────────────────────
// POST /api/files/:projectId/bulk-download - Download multiple files as ZIP
// ─────────────────────────────────────────────────────────────────

router.post(
  '/:projectId/bulk-download',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const userId = req.user?.id;
    const { fileIds } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized - No user ID found' });
      return;
    }

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      res.status(400).json({ error: 'fileIds must be a non-empty array' });
      return;
    }

    logger.log(`[Files API] POST /${projectId}/bulk-download - ${fileIds.length} files - User: ${userId}`);

    // Get all project files to verify ownership
    const allFiles = await getProjectFiles(projectId, userId);
    const filesToDownload = allFiles.filter((file) => fileIds.includes(file.id));

    if (filesToDownload.length === 0) {
      res.status(404).json({ error: 'No valid files found to download' });
      return;
    }

    // Set response headers for ZIP download
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="hive-files-${projectId.slice(0, 8)}.zip"`);

    // Create ZIP archive
    const archive = archiver('zip', { zlib: { level: 9 } });

    // Pipe archive to response
    archive.pipe(res);

    // Add each file to archive
    for (const file of filesToDownload) {
      try {
        logger.log(`[Bulk Download] Fetching: ${file.filename} from ${file.url}`);

        // Download file from URL (Cloudinary/etc)
        const response = await axios.get(file.url, { responseType: 'arraybuffer', timeout: 30000 });

        // Add to ZIP with safe filename (sanitize for ZIP compatibility)
        const safeFilename = file.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
        archive.append(Buffer.from(response.data), { name: safeFilename });
      } catch (error: unknown) {
        console.error(`[Bulk Download] Failed to fetch ${file.filename}:`, error.message);
        // Skip failed files, continue with others
      }
    }

    // Finalize the archive
    await archive.finalize();

    logger.log(`[Bulk Download] ZIP created with ${filesToDownload.length} files`);
  })
);

export default router;
