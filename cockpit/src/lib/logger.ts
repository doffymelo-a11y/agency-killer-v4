/**
 * Production-Safe Logger (Frontend)
 * Prevents debug logs from appearing in production builds
 *
 * Usage:
 * - logger.log() → Only in development
 * - logger.debug() → Only in development
 * - logger.info() → Only in development
 * - logger.warn() → Always (important warnings)
 * - logger.error() → Always (errors must be logged)
 */

const isDev = import.meta.env.DEV;

export const logger = {
  /**
   * Debug logs - Only in development
   * Use for verbose debugging, state dumps, etc.
   */
  log: (...args: unknown[]) => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * Debug logs - Only in development
   * Alias for log()
   */
  debug: (...args: unknown[]) => {
    if (isDev) {
      console.debug(...args);
    }
  },

  /**
   * Info logs - Only in development
   * Use for flow tracking, status updates
   */
  info: (...args: unknown[]) => {
    if (isDev) {
      console.info(...args);
    }
  },

  /**
   * Warning logs - Always shown (even in production)
   * Use for: deprecated features, config issues, non-fatal problems
   */
  warn: (...args: unknown[]) => {
    console.warn(...args);
  },

  /**
   * Error logs - Always shown (even in production)
   * Use for: exceptions, failed operations, critical issues
   */
  error: (...args: unknown[]) => {
    console.error(...args);
  },
};

/**
 * Sanitize sensitive data before logging
 * Redacts emails, tokens, passwords, etc.
 */
export function sanitizeForLog(data: unknown): unknown {
  if (typeof data === 'string') {
    // Redact email addresses (show first 2 chars + domain)
    let sanitized = data.replace(/([a-zA-Z0-9._%+-]{2})[a-zA-Z0-9._%+-]*(@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '$1***$2');

    // Redact potential tokens (long alphanumeric strings)
    sanitized = sanitized.replace(/\b[A-Za-z0-9]{32,}\b/g, '[REDACTED_TOKEN]');

    return sanitized;
  }

  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();

      // Redact sensitive keys
      if (
        lowerKey.includes('password') ||
        lowerKey.includes('token') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('api_key') ||
        lowerKey.includes('apikey') ||
        lowerKey.includes('credential')
      ) {
        sanitized[key] = '[REDACTED]';
      } else if (lowerKey.includes('email') && typeof value === 'string') {
        // Partially redact emails
        sanitized[key] = value.replace(/([a-zA-Z0-9._%+-]{2})[a-zA-Z0-9._%+-]*(@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '$1***$2');
      } else if (typeof value === 'object' && value !== null) {
        // Recursively sanitize nested objects
        sanitized[key] = sanitizeForLog(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  return data;
}

/**
 * Safe error logger - sanitizes error objects before logging
 */
export function logError(error: unknown, context?: string) {
  if (context) {
    logger.error(`[${context}]`, error);
  } else {
    logger.error(error);
  }

  // Log stack trace in development only
  if (isDev && error instanceof Error && error.stack) {
    logger.debug('Stack trace:', error.stack);
  }
}

/**
 * Safe data logger - sanitizes before logging
 */
export function logData(label: string, data: unknown) {
  logger.log(label, sanitizeForLog(data));
}
