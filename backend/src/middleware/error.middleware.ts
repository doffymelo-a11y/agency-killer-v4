/**
 * Error Middleware - Centralized error handling
 * Catches all errors and formats them consistently
 */

import type { Request, Response, NextFunction } from 'express';

// ─────────────────────────────────────────────────────────────────
// Custom Error Classes
// ─────────────────────────────────────────────────────────────────

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(401, message, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(403, message, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(404, `${resource} not found`, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(429, message, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, details?: unknown) {
    super(502, `External service error: ${service}`, 'EXTERNAL_SERVICE_ERROR', details);
    this.name = 'ExternalServiceError';
  }
}

// ─────────────────────────────────────────────────────────────────
// Error Handler Middleware
// ─────────────────────────────────────────────────────────────────

export function errorHandler(
  error: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error (but don't leak sensitive info in logs)
  console.error('[Error Handler]', {
    name: error.name,
    message: error.message,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });

  // Handle known AppError instances
  if (error instanceof AppError) {
    const errorResponse: any = {
      success: false,
      error: {
        message: error.message,
        code: error.code,
      },
    };

    // SECURITY: Only expose details in development
    if (process.env.NODE_ENV === 'development') {
      if (error.details) {
        errorResponse.error.details = error.details;
      }
      if (error.stack) {
        errorResponse.error.stack = error.stack;
      }
    }

    res.status(error.statusCode).json(errorResponse);
    return;
  }

  // Handle unknown errors
  const statusCode = 500;

  // SECURITY: In production, NEVER expose error details, stack traces, or internal messages
  if (process.env.NODE_ENV === 'production') {
    res.status(statusCode).json({
      success: false,
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
    });
    return;
  }

  // Development only: show full error details
  res.status(statusCode).json({
    success: false,
    error: {
      message: error.message || 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
      stack: error.stack,
      details: error,
    },
  });
}

// ─────────────────────────────────────────────────────────────────
// 404 Handler (for unmatched routes)
// ─────────────────────────────────────────────────────────────────

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      message: `Route not found: ${req.method} ${req.path}`,
      code: 'ROUTE_NOT_FOUND',
    },
  });
}

// ─────────────────────────────────────────────────────────────────
// Async Handler Wrapper
// ─────────────────────────────────────────────────────────────────

/**
 * Wrap async route handlers to catch errors automatically
 * Usage: router.post('/endpoint', asyncHandler(async (req, res) => { ... }))
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
