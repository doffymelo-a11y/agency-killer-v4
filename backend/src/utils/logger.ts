/**
 * Production-safe logger utility
 *
 * - In development: all logs pass through to console
 * - In production: only errors are logged, without sensitive data
 *
 * Usage:
 *   import { logger } from '../utils/logger.js';
 *   logger.log('[Service] Operation started');
 *   logger.error('[Service] Operation failed', error);
 */

const IS_DEV = process.env.NODE_ENV === 'development';

export const logger = {
  /**
   * Development-only logging
   * Does nothing in production
   */
  log: (...args: any[]): void => {
    if (IS_DEV) {
      console.log(...args);
    }
  },

  /**
   * Development-only info logging
   * Does nothing in production
   */
  info: (...args: any[]): void => {
    if (IS_DEV) {
      console.info(...args);
    }
  },

  /**
   * Development-only warning
   * Does nothing in production
   */
  warn: (...args: any[]): void => {
    if (IS_DEV) {
      console.warn(...args);
    }
  },

  /**
   * Critical error logging
   * Works in all environments, but sanitizes sensitive data
   *
   * IMPORTANT: Never pass user data, tokens, or credentials to this function
   */
  error: (message: string, error?: Error | unknown): void => {
    if (error instanceof Error) {
      // Log only the error message and name, not the full stack trace in production
      console.error(message, {
        name: error.name,
        message: error.message,
        ...(IS_DEV && { stack: error.stack }) // Stack only in dev
      });
    } else {
      console.error(message, error);
    }
  },

  /**
   * Always log (even in production)
   * Use ONLY for critical startup/shutdown messages
   */
  always: (...args: any[]): void => {
    console.log(...args);
  }
};

/**
 * Check if we're in development mode
 */
export const isDevelopment = (): boolean => IS_DEV;
