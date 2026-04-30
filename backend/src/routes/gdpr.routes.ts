/**
 * GDPR Routes - Article 17 (Right to Erasure) & Article 20 (Data Portability)
 * Critical: Legal compliance with EU GDPR regulations
 */

import { Router } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { supabaseAdmin } from '../services/supabase.service.js';
import { logToSystem } from '../services/logging.service.js';
import { logger } from '../lib/logger.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────
// POST /api/gdpr/delete-account
// Article 17 GDPR - Right to Erasure ("Right to be Forgotten")
// ─────────────────────────────────────────────────────────────────

router.post(
  '/delete-account',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Unauthorized - User ID not found',
          code: 'GDPR_AUTH_ERROR',
        },
      });
      return;
    }

    logger.log(`[GDPR] Account deletion requested by user ${userId}`);

    try {
      // Get user details for logging
      const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);

      if (userError || !user) {
        res.status(404).json({
          success: false,
          error: {
            message: 'User not found',
            code: 'GDPR_USER_NOT_FOUND',
          },
        });
        return;
      }

      // Calculate deletion date (30 days from now)
      const scheduledDeletionAt = new Date();
      scheduledDeletionAt.setDate(scheduledDeletionAt.getDate() + 30);

      // STEP 1: Mark user account for deletion in auth.users metadata
      const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...(user.user.user_metadata || {}),
          deleted_at: new Date().toISOString(),
          scheduled_deletion_at: scheduledDeletionAt.toISOString(),
          deletion_requested_ip: req.ip,
        },
      });

      if (updateAuthError) {
        throw new Error(`Failed to mark user for deletion: ${updateAuthError.message}`);
      }

      // STEP 2: Soft delete all projects (sets deleted_at timestamp)
      const { error: projectsError } = await supabaseAdmin
        .from('projects')
        .update({ deleted_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('deleted_at', null);

      if (projectsError) {
        console.error('[GDPR] Error soft-deleting projects:', projectsError);
      }

      // STEP 3: Soft delete all tasks (cascade from projects)
      const { data: userProjects } = await supabaseAdmin
        .from('projects')
        .select('id')
        .eq('user_id', userId);

      if (userProjects && userProjects.length > 0) {
        const projectIds = userProjects.map((p) => p.id);

        // Tasks
        await supabaseAdmin
          .from('tasks')
          .update({ deleted_at: new Date().toISOString() })
          .in('project_id', projectIds)
          .is('deleted_at', null);

        // Chat sessions
        await supabaseAdmin
          .from('chat_sessions')
          .update({ deleted_at: new Date().toISOString() })
          .in('project_id', projectIds)
          .is('deleted_at', null);

        // Project files
        await supabaseAdmin
          .from('project_files')
          .update({ deleted_at: new Date().toISOString() })
          .in('project_id', projectIds)
          .is('deleted_at', null);

        // Project memory
        await supabaseAdmin
          .from('project_memory')
          .update({ deleted_at: new Date().toISOString() })
          .in('project_id', projectIds)
          .is('deleted_at', null);
      }

      // STEP 4: Soft delete support tickets
      await supabaseAdmin
        .from('support_tickets')
        .update({ deleted_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('deleted_at', null);

      // STEP 5: Soft delete user integrations
      await supabaseAdmin
        .from('user_integrations')
        .update({ deleted_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('deleted_at', null);

      // STEP 6: Log the action in system logs (GDPR audit trail)
      await logToSystem({
        level: 'info',
        source: 'gdpr',
        action: 'account_deletion_requested',
        message: `Account deletion requested for user ${userId}`,
        user_id: userId,
        metadata: {
          email: user.user.email,
          scheduled_deletion_at: scheduledDeletionAt.toISOString(),
          request_ip: req.ip,
          user_agent: req.headers['user-agent'],
        },
      });

      logger.log(`[GDPR] ✅ User ${userId} marked for deletion. Scheduled: ${scheduledDeletionAt.toISOString()}`);

      res.json({
        success: true,
        message: 'Suppression programmée dans 30 jours. Vous pouvez annuler pendant cette période.',
        scheduled_deletion_at: scheduledDeletionAt.toISOString(),
        grace_period_days: 30,
      });
    } catch (error: unknown) {
      console.error('[GDPR] Error processing account deletion:', error);

      // Log error
      await logToSystem({
        level: 'error',
        source: 'gdpr',
        action: 'account_deletion_failed',
        message: `Account deletion failed for user ${userId}: ${error.message}`,
        user_id: userId,
        metadata: {
          error: error.message,
          stack: error.stack,
        },
      });

      res.status(500).json({
        success: false,
        error: {
          message: 'Une erreur est survenue lors de la suppression. Veuillez réessayer.',
          code: 'GDPR_DELETION_ERROR',
        },
      });
    }
  })
);

// ─────────────────────────────────────────────────────────────────
// POST /api/gdpr/cancel-deletion
// Cancel account deletion within 30-day grace period
// ─────────────────────────────────────────────────────────────────

router.post(
  '/cancel-deletion',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Unauthorized',
          code: 'GDPR_AUTH_ERROR',
        },
      });
      return;
    }

    logger.log(`[GDPR] Cancellation of deletion requested by user ${userId}`);

    try {
      // Get user metadata
      const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);

      if (userError || !user) {
        res.status(404).json({
          success: false,
          error: {
            message: 'User not found',
            code: 'GDPR_USER_NOT_FOUND',
          },
        });
        return;
      }

      const deletedAt = user.user.user_metadata?.deleted_at;
      const scheduledDeletionAt = user.user.user_metadata?.scheduled_deletion_at;

      if (!deletedAt) {
        res.status(400).json({
          success: false,
          error: {
            message: 'No pending deletion found',
            code: 'GDPR_NO_DELETION_PENDING',
          },
        });
        return;
      }

      // Check if deletion date has passed
      if (scheduledDeletionAt && new Date(scheduledDeletionAt) < new Date()) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Grace period has expired. Account has been deleted.',
            code: 'GDPR_GRACE_PERIOD_EXPIRED',
          },
        });
        return;
      }

      // STEP 1: Remove deletion markers from auth.users metadata
      const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...(user.user.user_metadata || {}),
          deleted_at: null,
          scheduled_deletion_at: null,
          deletion_cancelled_at: new Date().toISOString(),
        },
      });

      if (updateAuthError) {
        throw new Error(`Failed to cancel user deletion: ${updateAuthError.message}`);
      }

      // STEP 2: Restore all projects
      await supabaseAdmin
        .from('projects')
        .update({ deleted_at: null })
        .eq('user_id', userId)
        .not('deleted_at', 'is', null);

      // STEP 3: Restore cascading resources
      const { data: userProjects } = await supabaseAdmin
        .from('projects')
        .select('id')
        .eq('user_id', userId);

      if (userProjects && userProjects.length > 0) {
        const projectIds = userProjects.map((p) => p.id);

        // Restore tasks
        await supabaseAdmin
          .from('tasks')
          .update({ deleted_at: null })
          .in('project_id', projectIds)
          .not('deleted_at', 'is', null);

        // Restore chat sessions
        await supabaseAdmin
          .from('chat_sessions')
          .update({ deleted_at: null })
          .in('project_id', projectIds)
          .not('deleted_at', 'is', null);

        // Restore files
        await supabaseAdmin
          .from('project_files')
          .update({ deleted_at: null })
          .in('project_id', projectIds)
          .not('deleted_at', 'is', null);

        // Restore memory
        await supabaseAdmin
          .from('project_memory')
          .update({ deleted_at: null })
          .in('project_id', projectIds)
          .not('deleted_at', 'is', null);
      }

      // STEP 4: Restore support tickets
      await supabaseAdmin
        .from('support_tickets')
        .update({ deleted_at: null })
        .eq('user_id', userId)
        .not('deleted_at', 'is', null);

      // STEP 5: Restore integrations
      await supabaseAdmin
        .from('user_integrations')
        .update({ deleted_at: null })
        .eq('user_id', userId)
        .not('deleted_at', 'is', null);

      // STEP 6: Log the cancellation
      await logToSystem({
        level: 'info',
        source: 'gdpr',
        action: 'account_deletion_cancelled',
        message: `Account deletion cancelled for user ${userId}`,
        user_id: userId,
        metadata: {
          email: user.user.email,
          cancelled_at: new Date().toISOString(),
        },
      });

      logger.log(`[GDPR] ✅ Deletion cancelled for user ${userId}`);

      res.json({
        success: true,
        message: 'La suppression de votre compte a été annulée avec succès.',
      });
    } catch (error: unknown) {
      console.error('[GDPR] Error cancelling deletion:', error);

      await logToSystem({
        level: 'error',
        source: 'gdpr',
        action: 'cancel_deletion_failed',
        message: `Cancel deletion failed for user ${userId}: ${error.message}`,
        user_id: userId,
        metadata: {
          error: error.message,
        },
      });

      res.status(500).json({
        success: false,
        error: {
          message: 'Une erreur est survenue. Veuillez réessayer.',
          code: 'GDPR_CANCEL_ERROR',
        },
      });
    }
  })
);

// ─────────────────────────────────────────────────────────────────
// GET /api/gdpr/deletion-status
// Check if user has pending deletion
// ─────────────────────────────────────────────────────────────────

router.get(
  '/deletion-status',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Unauthorized',
          code: 'GDPR_AUTH_ERROR',
        },
      });
      return;
    }

    try {
      const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);

      if (userError || !user) {
        res.status(404).json({
          success: false,
          error: {
            message: 'User not found',
            code: 'GDPR_USER_NOT_FOUND',
          },
        });
        return;
      }

      const deletedAt = user.user.user_metadata?.deleted_at;
      const scheduledDeletionAt = user.user.user_metadata?.scheduled_deletion_at;

      res.json({
        success: true,
        has_pending_deletion: !!deletedAt,
        deleted_at: deletedAt || null,
        scheduled_deletion_at: scheduledDeletionAt || null,
        days_remaining: scheduledDeletionAt
          ? Math.ceil((new Date(scheduledDeletionAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          : null,
      });
    } catch (error: unknown) {
      console.error('[GDPR] Error fetching deletion status:', error);

      res.status(500).json({
        success: false,
        error: {
          message: 'Une erreur est survenue',
          code: 'GDPR_STATUS_ERROR',
        },
      });
    }
  })
);

export default router;
