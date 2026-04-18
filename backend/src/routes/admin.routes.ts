/**
 * Admin Routes - Admin dashboard statistics and monitoring
 * GET /api/admin/health - System health check
 * GET /api/admin/stats/agents - Agent performance stats
 * GET /api/admin/stats/business - Business metrics
 * GET /api/admin/logs/recent - Recent system logs
 * GET /api/admin/logs/error-count - Error count
 */

import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import { asyncHandler } from '../middleware/error.middleware.js';
import { authMiddleware, type AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { supabaseAdmin, isSupabaseConfigured } from '../services/supabase.service.js';
import { isClaudeConfigured } from '../services/claude.service.js';
import { isMCPBridgeConfigured } from '../services/mcp-bridge.service.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────
// Security Helper - Safe Error Response
// ─────────────────────────────────────────────────────────────────

/**
 * Creates a safe error response that doesn't leak internal details in production
 */
function createSafeErrorResponse(error: any, code: string, userMessage: string) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Log the full error server-side for debugging
  console.error(`[Admin Error] ${code}:`, error);

  return {
    success: false,
    error: {
      message: userMessage,
      code: code,
      // Only expose error details in development
      ...(isDevelopment && { details: error.message }),
    },
  };
}

// ─────────────────────────────────────────────────────────────────
// Admin Rate Limiting
// ─────────────────────────────────────────────────────────────────

/**
 * Rate limit tracker for admin endpoints
 * In-memory store (can be replaced with Redis for production)
 */
const adminRateLimitStore = new Map<
  string,
  { count: number; resetAt: number }
>();

const ADMIN_RATE_LIMIT = {
  maxRequests: 30, // Max requests per window
  windowMs: 60 * 1000, // 1 minute window
};

/**
 * Admin-specific rate limiting middleware
 * More strict than regular API rate limiting
 */
function adminRateLimit(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const userId = req.user?.id;

  if (!userId) {
    next();
    return;
  }

  const now = Date.now();
  const key = `admin:${userId}`;

  // Get or create rate limit entry
  let entry = adminRateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    // Create new window
    entry = {
      count: 1,
      resetAt: now + ADMIN_RATE_LIMIT.windowMs,
    };
    adminRateLimitStore.set(key, entry);
    next();
    return;
  }

  // Check if limit exceeded
  if (entry.count >= ADMIN_RATE_LIMIT.maxRequests) {
    const resetIn = Math.ceil((entry.resetAt - now) / 1000);
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many admin requests. Please try again later.',
        code: 'ADMIN_RATE_LIMIT_EXCEEDED',
        resetIn,
      },
    });
    return;
  }

  // Increment count
  entry.count++;
  next();
}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of adminRateLimitStore.entries()) {
    if (now > entry.resetAt + 60000) {
      // Keep 1 minute after reset
      adminRateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

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
    res.status(500).json(
      createSafeErrorResponse(error, 'ADMIN_AUTH_ERROR', 'Authorization error')
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// GET /api/admin/health - System health check
// ─────────────────────────────────────────────────────────────────

router.get(
  '/health',
  authMiddleware,
  adminRateLimit,
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const startTime = Date.now();

    // Check all services
    const supabaseOk = isSupabaseConfigured();
    const claudeOk = isClaudeConfigured();
    const mcpBridgeOk = await isMCPBridgeConfigured();

    // Generic uptime (don't expose exact values for security)
    const uptimeMs = process.uptime() * 1000;
    const uptimeStatus = uptimeMs > 3600000 ? 'Operational' : 'Starting';

    res.json({
      success: true,
      data: {
        backend: {
          name: 'Backend API',
          status: 'healthy',
          details: uptimeStatus,
          lastCheck: new Date().toISOString(),
        },
        mcp_bridge: {
          name: 'MCP Bridge',
          status: mcpBridgeOk ? 'healthy' : 'down',
          details: mcpBridgeOk ? 'Operational' : 'Unavailable',
          lastCheck: new Date().toISOString(),
        },
        supabase: {
          name: 'Supabase',
          status: supabaseOk ? 'healthy' : 'down',
          details: supabaseOk ? 'Operational' : 'Unavailable',
          lastCheck: new Date().toISOString(),
        },
        claude_api: {
          name: 'Claude API',
          status: claudeOk ? 'healthy' : 'down',
          details: claudeOk ? 'Operational' : 'Unavailable',
          lastCheck: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
        response_time_ms: Date.now() - startTime,
      },
    });
  })
);

// ─────────────────────────────────────────────────────────────────
// GET /api/admin/stats/agents - Agent performance statistics
// ─────────────────────────────────────────────────────────────────

router.get(
  '/stats/agents',
  authMiddleware,
  adminRateLimit,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const daysBack = parseInt(req.query.days_back as string) || 30;

    // Call get_agent_stats() RPC function
    const { data, error } = await supabaseAdmin.rpc('get_agent_stats', {
      days_back: daysBack,
    });

    if (error) {
      res.status(500).json(
        createSafeErrorResponse(error, 'AGENT_STATS_ERROR', 'Failed to fetch agent statistics')
      );
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
  adminRateLimit,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const daysBack = parseInt(req.query.days_back as string) || 30;

    // Call get_business_stats() RPC function
    const { data, error } = await supabaseAdmin.rpc('get_business_stats', {
      days_back: daysBack,
    });

    if (error) {
      res.status(500).json(
        createSafeErrorResponse(error, 'BUSINESS_STATS_ERROR', 'Failed to fetch business statistics')
      );
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
  adminRateLimit,
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
      res.status(500).json(
        createSafeErrorResponse(error, 'RECENT_LOGS_ERROR', 'Failed to fetch recent logs')
      );
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
  adminRateLimit,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const hoursBack = parseInt(req.query.hours_back as string) || 1;

    // Call get_error_count() RPC function
    const { data, error } = await supabaseAdmin.rpc('get_error_count', {
      hours_back: hoursBack,
    });

    if (error) {
      res.status(500).json(
        createSafeErrorResponse(error, 'ERROR_COUNT_ERROR', 'Failed to fetch error count')
      );
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
