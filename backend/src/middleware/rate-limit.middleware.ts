/**
 * Rate Limit Middleware - Tier-based rate limiting
 * Limits requests per user based on their subscription tier
 */

import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from './auth.middleware.js';

// ─────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────

const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10); // 1 minute

const LIMITS = {
  free: parseInt(process.env.RATE_LIMIT_MAX_FREE || '10', 10),
  pro: parseInt(process.env.RATE_LIMIT_MAX_PRO || '60', 10),
  enterprise: parseInt(process.env.RATE_LIMIT_MAX_ENTERPRISE || '300', 10),
};

// ─────────────────────────────────────────────────────────────────
// Rate Limiter Factory
// ─────────────────────────────────────────────────────────────────

/**
 * Create rate limiter with tier-based limits
 */
export const createRateLimiter = () => {
  return rateLimit({
    windowMs: WINDOW_MS,
    max: async (req: Request) => {
      const authReq = req as AuthenticatedRequest;
      const userPlan = authReq.user?.plan || 'free'; // Use plan from subscriptions

      // Return limit based on plan tier
      switch (userPlan) {
        case 'enterprise':
          return LIMITS.enterprise;
        case 'pro':
          return LIMITS.pro;
        default:
          return LIMITS.free;
      }
    },
    keyGenerator: (req: Request) => {
      const authReq = req as AuthenticatedRequest;
      // Use user ID if authenticated, otherwise IP
      return authReq.user?.id || req.ip || 'anonymous';
    },
    handler: (req: Request, res: Response) => {
      const authReq = req as AuthenticatedRequest;
      const userPlan = authReq.user?.plan || 'free'; // Use plan from subscriptions
      const limit = LIMITS[userPlan as keyof typeof LIMITS] || LIMITS.free;

      res.status(429).json({
        success: false,
        error: {
          message: `Rate limit exceeded. Maximum ${limit} requests per minute for ${userPlan} tier.`,
          code: 'RATE_LIMIT_EXCEEDED',
          details: {
            tier: userPlan,
            limit,
            windowMs: WINDOW_MS,
          },
        },
      });
    },
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    skip: (req: Request) => {
      // Skip rate limiting for health checks
      return req.path === '/health' || req.path === '/api/health';
    },
  });
};

/**
 * Specific rate limiter for /api/chat endpoint (more strict)
 */
export const chatRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: async (req: Request) => {
    const authReq = req as AuthenticatedRequest;
    const userPlan = authReq.user?.plan || 'free'; // Use plan from subscriptions

    // Chat endpoint is more resource-intensive, so lower limits
    switch (userPlan) {
      case 'enterprise':
        return 100; // 100/min
      case 'pro':
        return 30; // 30/min
      default:
        return 5; // 5/min for free tier
    }
  },
  keyGenerator: (_req: Request) => {
    const authReq = _req as AuthenticatedRequest;
    return authReq.user?.id || _req.ip || 'anonymous';
  },
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many chat requests. Please wait before trying again.',
        code: 'CHAT_RATE_LIMIT_EXCEEDED',
      },
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});
