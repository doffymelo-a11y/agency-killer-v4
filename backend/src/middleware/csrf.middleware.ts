/**
 * CSRF Protection Middleware
 * Validates Origin header for state-changing requests (POST/PUT/DELETE)
 *
 * Security: Prevents Cross-Site Request Forgery attacks by ensuring
 * requests come from allowed origins only
 */

import { Request, Response, NextFunction } from 'express';

const NODE_ENV = process.env.NODE_ENV || 'development';

// Same as index.ts ALLOWED_ORIGINS
const ALLOWED_ORIGINS = NODE_ENV === 'development'
  ? ['http://localhost:5173', 'http://localhost:5174']
  : [
      process.env.FRONTEND_URL || 'https://app.hive-os.com',
      process.env.BACKOFFICE_URL || 'https://backoffice.hive-os.com'
    ];

/**
 * CSRF Protection Middleware
 * Only applies to state-changing methods (POST, PUT, DELETE, PATCH)
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  const method = req.method.toUpperCase();

  // Only check state-changing methods
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    return next();
  }

  // Skip CSRF for certain endpoints (webhook callbacks, etc.)
  const skipPaths = [
    '/api/telegram/webhook', // Telegram webhook (verified by bot token)
    '/health',               // Health check
  ];

  if (skipPaths.some(path => req.path.startsWith(path))) {
    return next();
  }

  // Get Origin or Referer header
  const origin = req.get('Origin') || req.get('Referer');

  if (!origin) {
    console.warn('[CSRF] Blocked request without Origin header:', {
      method: req.method,
      path: req.path,
      ip: req.ip
    });

    res.status(403).json({
      success: false,
      error: {
        message: 'Forbidden - Missing Origin header',
        code: 'CSRF_MISSING_ORIGIN'
      }
    });
    return;
  }

  // Extract origin from Referer if needed (format: https://domain.com/path)
  let requestOrigin = origin;
  if (origin.startsWith('http')) {
    try {
      const url = new URL(origin);
      requestOrigin = url.origin;
    } catch {
      // If URL parsing fails, use as-is
    }
  }

  // Check if origin is allowed
  const isAllowed = ALLOWED_ORIGINS.some(allowedOrigin =>
    requestOrigin === allowedOrigin || requestOrigin.startsWith(allowedOrigin)
  );

  if (!isAllowed) {
    console.warn('[CSRF] Blocked request from unauthorized origin:', {
      method: req.method,
      path: req.path,
      origin: requestOrigin,
      ip: req.ip
    });

    res.status(403).json({
      success: false,
      error: {
        message: 'Forbidden - Origin not allowed',
        code: 'CSRF_INVALID_ORIGIN'
      }
    });
    return;
  }

  // Origin is valid, continue
  next();
}
