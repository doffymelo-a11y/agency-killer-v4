/**
 * Auth Middleware - Supabase JWT verification
 * Validates JWT tokens from Supabase Auth on each request
 */

import type { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../services/supabase.service.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role?: string;
    plan?: 'free' | 'pro' | 'enterprise'; // Subscription tier from billing
  };
}

/**
 * Verify Supabase JWT token
 * Attaches user to request if valid
 */
export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Missing or invalid Authorization header',
          code: 'AUTH_MISSING_TOKEN',
        },
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token with Supabase
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Invalid or expired token',
          code: 'AUTH_INVALID_TOKEN',
          details: error?.message,
        },
      });
      return;
    }

    // Get user subscription plan for rate limiting
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('plan')
      .eq('user_id', data.user.id)
      .single();

    // Attach user to request
    req.user = {
      id: data.user.id,
      email: data.user.email,
      role: data.user.user_metadata?.role || 'user',
      plan: subscription?.plan || 'free', // Default to free tier
    };

    next();
  } catch (error: any) {
    console.error('[Auth Middleware] Error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Authentication error',
        code: 'AUTH_ERROR',
        details: error.message,
      },
    });
  }
}

/**
 * Optional auth middleware
 * Doesn't fail if token is missing, but validates if present
 */
export async function optionalAuthMiddleware(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without user
      next();
      return;
    }

    const token = authHeader.substring(7);
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (!error && data.user) {
      // Get user subscription plan for rate limiting
      const { data: subscription } = await supabaseAdmin
        .from('subscriptions')
        .select('plan')
        .eq('user_id', data.user.id)
        .single();

      req.user = {
        id: data.user.id,
        email: data.user.email,
        role: data.user.user_metadata?.role || 'user',
        plan: subscription?.plan || 'free', // Default to free tier
      };
    }

    next();
  } catch (error: any) {
    // Log error but continue without failing
    console.error('[Optional Auth Middleware] Error:', error);
    next();
  }
}
