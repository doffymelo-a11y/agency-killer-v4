/**
 * Super Admin Middleware
 * Strict authentication and authorization for super_admin role ONLY
 * Phase 1 - Super Admin Backoffice Implementation
 * Date: 2026-04-19
 */

import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from './auth.middleware.js';
import { supabaseAdmin } from '../services/supabase.service.js';

// ─────────────────────────────────────────────────────────────────
// Super Admin Authorization Middleware
// ─────────────────────────────────────────────────────────────────

/**
 * Verify user has STRICTLY super_admin role (NOT just admin)
 * This is more restrictive than requireAdmin which accepts both admin and super_admin
 */
export async function requireSuperAdmin(
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

    // Check user role in user_roles table - MUST be super_admin (NOT admin)
    const { data: userRole, error } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (error || !userRole) {
      console.warn(`[SuperAdmin] Access denied - no role found for user ${userId}`);
      res.status(403).json({
        success: false,
        error: {
          message: 'Super admin access required',
          code: 'SUPER_ADMIN_ACCESS_REQUIRED',
        },
      });
      return;
    }

    // Strict check: ONLY super_admin allowed (not admin)
    if (userRole.role !== 'super_admin') {
      console.warn(`[SuperAdmin] Access denied - user ${userId} has role ${userRole.role} (expected super_admin)`);
      res.status(403).json({
        success: false,
        error: {
          message: 'Super admin access required',
          code: 'SUPER_ADMIN_ACCESS_REQUIRED',
          details: `Current role: ${userRole.role}. Required: super_admin`,
        },
      });
      return;
    }

    // Store user role in request for logging
    if (req.user) {
      req.user.role = userRole.role;
    }

    next();
  } catch (error: any) {
    console.error('[SuperAdmin] Authorization error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Authorization error',
        code: 'SUPER_ADMIN_AUTH_ERROR',
      },
    });
  }
}

// ─────────────────────────────────────────────────────────────────
// Super Admin Rate Limiting
// ─────────────────────────────────────────────────────────────────

/**
 * Rate limit tracker for super admin endpoints
 * More permissive than regular admin since super admin actions are typically
 * less frequent but may need burst capacity (e.g., batch operations)
 */
const superAdminRateLimitStore = new Map<
  string,
  { count: number; resetAt: number }
>();

const SUPER_ADMIN_RATE_LIMIT = {
  maxRequests: 100, // Higher limit for super admin
  windowMs: 60 * 1000, // 1 minute window
};

/**
 * Super admin specific rate limiting middleware
 * Higher limits than regular admin endpoints
 */
export function superAdminRateLimit(
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
  const key = `super_admin:${userId}`;

  // Get or create rate limit entry
  let entry = superAdminRateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    // Create new window
    entry = {
      count: 1,
      resetAt: now + SUPER_ADMIN_RATE_LIMIT.windowMs,
    };
    superAdminRateLimitStore.set(key, entry);
    next();
    return;
  }

  // Check if limit exceeded
  if (entry.count >= SUPER_ADMIN_RATE_LIMIT.maxRequests) {
    const resetIn = Math.ceil((entry.resetAt - now) / 1000);
    console.warn(`[SuperAdmin] Rate limit exceeded for user ${userId}`);
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many super admin requests. Please try again later.',
        code: 'SUPER_ADMIN_RATE_LIMIT_EXCEEDED',
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
  for (const [key, entry] of superAdminRateLimitStore.entries()) {
    if (now > entry.resetAt + 60000) {
      // Keep 1 minute after reset
      superAdminRateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

// ─────────────────────────────────────────────────────────────────
// Audit Logging Helper
// ─────────────────────────────────────────────────────────────────

export interface SuperAdminActionLog {
  action: string;
  resource_type?: string;
  resource_id?: string;
  metadata?: Record<string, any>;
}

/**
 * Log super admin action to audit trail
 * Calls the log_super_admin_action() RPC function from migration 030
 *
 * @param req - Authenticated request with user info
 * @param actionLog - Action details to log
 * @returns Log ID or null if logging failed
 */
export async function logSuperAdminAction(
  req: AuthenticatedRequest,
  actionLog: SuperAdminActionLog
): Promise<string | null> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      console.error('[SuperAdmin] Cannot log action - no user ID');
      return null;
    }

    // Extract IP address and user agent from request
    const ipAddress = req.ip || req.socket.remoteAddress || null;
    const userAgent = req.get('user-agent') || null;

    // Call RPC function from migration 030
    const { data, error } = await supabaseAdmin.rpc('log_super_admin_action', {
      p_action: actionLog.action,
      p_resource_type: actionLog.resource_type || null,
      p_resource_id: actionLog.resource_id || null,
      p_ip: ipAddress,
      p_user_agent: userAgent,
      p_metadata: actionLog.metadata || {},
    });

    if (error) {
      console.error('[SuperAdmin] Failed to log action:', error);
      return null;
    }

    console.log(`[SuperAdmin] Action logged: ${actionLog.action} (log_id: ${data})`);
    return data as string;
  } catch (error) {
    console.error('[SuperAdmin] Exception logging action:', error);
    return null;
  }
}

/**
 * Middleware to automatically log all super admin actions
 * Logs after the route handler completes successfully
 */
export function autoLogSuperAdminAction(action: string, resourceType?: string) {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to log after successful response
    res.json = function (body: any) {
      // Only log if response was successful
      if (body?.success !== false && res.statusCode < 400) {
        // Extract resource_id from response if available
        const resourceId = body?.data?.id || body?.data?.ticket_id || req.params.id || null;

        // Log action asynchronously (don't block response)
        logSuperAdminAction(req, {
          action,
          resource_type: resourceType,
          resource_id: resourceId,
          metadata: {
            method: req.method,
            path: req.path,
            query: req.query,
            status: res.statusCode,
          },
        }).catch((error) => {
          console.error('[SuperAdmin] Auto-log failed:', error);
        });
      }

      // Call original json method
      return originalJson(body);
    };

    next();
  };
}
