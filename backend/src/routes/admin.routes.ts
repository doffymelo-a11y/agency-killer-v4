/**
 * Admin Routes - Admin dashboard statistics and monitoring
 * GET /api/admin/stats/agents - Agent performance stats
 * GET /api/admin/stats/business - Business metrics
 * GET /api/admin/logs/recent - Recent system logs
 * GET /api/admin/logs/error-count - Error count
 */

import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import { asyncHandler } from '../middleware/error.middleware.js';
import { authMiddleware, type AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { supabaseAdmin } from '../services/supabase.service.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────
// Admin Authorization Middleware
// ─────────────────────────────────────────────────────────────────

/**
 * Verify user has admin or super_admin role
 */
async function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
        },
      });
      return;
    }

    // Check user role in user_roles table
    const { data: userRole, error } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (error || !userRole) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Admin access required',
          code: 'ADMIN_ACCESS_REQUIRED',
        },
      });
      return;
    }

    if (!['admin', 'super_admin'].includes(userRole.role)) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Admin access required',
          code: 'ADMIN_ACCESS_REQUIRED',
        },
      });
      return;
    }

    next();
  } catch (error: any) {
    console.error('[Admin Middleware] Error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Authorization error',
        code: 'ADMIN_AUTH_ERROR',
        details: error.message,
      },
    });
  }
}

// ─────────────────────────────────────────────────────────────────
// GET /api/admin/stats/agents - Agent performance statistics
// ─────────────────────────────────────────────────────────────────

router.get(
  '/stats/agents',
  authMiddleware,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const daysBack = parseInt(req.query.days_back as string) || 30;

    // Call get_agent_stats() RPC function
    const { data, error } = await supabaseAdmin.rpc('get_agent_stats', {
      days_back: daysBack,
    });

    if (error) {
      console.error('[Admin] Error fetching agent stats:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch agent statistics',
          code: 'AGENT_STATS_ERROR',
          details: error.message,
        },
      });
      return;
    }

    res.json({
      success: true,
      data: data || [],
    });
  })
);

// ─────────────────────────────────────────────────────────────────
// GET /api/admin/stats/business - Business metrics
// ─────────────────────────────────────────────────────────────────

router.get(
  '/stats/business',
  authMiddleware,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const daysBack = parseInt(req.query.days_back as string) || 30;

    // Call get_business_stats() RPC function
    const { data, error } = await supabaseAdmin.rpc('get_business_stats', {
      days_back: daysBack,
    });

    if (error) {
      console.error('[Admin] Error fetching business stats:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch business statistics',
          code: 'BUSINESS_STATS_ERROR',
          details: error.message,
        },
      });
      return;
    }

    res.json({
      success: true,
      data: data || {},
    });
  })
);

// ─────────────────────────────────────────────────────────────────
// GET /api/admin/logs/recent - Recent system logs
// ─────────────────────────────────────────────────────────────────

router.get(
  '/logs/recent',
  authMiddleware,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 50;
    const level = req.query.level as string | undefined;
    const source = req.query.source as string | undefined;
    const agentId = req.query.agent_id as string | undefined;

    // Call get_recent_logs() RPC function
    const { data, error } = await supabaseAdmin.rpc('get_recent_logs', {
      p_limit: limit,
      p_level: level || null,
      p_source: source || null,
      p_agent_id: agentId || null,
    });

    if (error) {
      console.error('[Admin] Error fetching recent logs:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch recent logs',
          code: 'RECENT_LOGS_ERROR',
          details: error.message,
        },
      });
      return;
    }

    res.json({
      success: true,
      data: data || [],
    });
  })
);

// ─────────────────────────────────────────────────────────────────
// GET /api/admin/logs/error-count - Error count in last X hours
// ─────────────────────────────────────────────────────────────────

router.get(
  '/logs/error-count',
  authMiddleware,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const hoursBack = parseInt(req.query.hours_back as string) || 1;

    // Call get_error_count() RPC function
    const { data, error } = await supabaseAdmin.rpc('get_error_count', {
      hours_back: hoursBack,
    });

    if (error) {
      console.error('[Admin] Error fetching error count:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch error count',
          code: 'ERROR_COUNT_ERROR',
          details: error.message,
        },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        error_count: data || 0,
        hours_back: hoursBack,
      },
    });
  })
);

export default router;
