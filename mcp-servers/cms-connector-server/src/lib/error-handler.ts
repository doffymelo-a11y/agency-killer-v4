// ═══════════════════════════════════════════════════════════════
// Error Handler
// Gestion centralisée des erreurs CMS
// Logging, formatting, retry logic
// ═══════════════════════════════════════════════════════════════

import {
  CMSError,
  AuthenticationError,
  RateLimitError,
  NotFoundError,
} from '../types.js';

/**
 * Formate une erreur pour le retour au client MCP
 * Évite de leaker des credentials ou stack traces
 */
export function formatErrorForClient(error: unknown): {
  error: string;
  code: string;
  statusCode?: number;
  retryable: boolean;
  retryAfter?: number;
} {
  // Erreur CMS typée
  if (error instanceof CMSError) {
    return {
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
      retryable: isRetryable(error),
      retryAfter:
        error instanceof RateLimitError ? error.details?.retryAfter : undefined,
    };
  }

  // Erreur HTTP Axios non-catchée
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as any;
    return {
      error: axiosError.response?.data?.message || 'HTTP request failed',
      code: 'HTTP_ERROR',
      statusCode: axiosError.response?.status,
      retryable: isRetryableStatusCode(axiosError.response?.status),
    };
  }

  // Erreur inconnue
  return {
    error: error instanceof Error ? error.message : 'Unknown error',
    code: 'UNKNOWN_ERROR',
    retryable: false,
  };
}

/**
 * Détermine si une erreur est retryable
 */
export function isRetryable(error: CMSError): boolean {
  // Rate limit → retry après le délai
  if (error instanceof RateLimitError) {
    return true;
  }

  // Erreurs réseau temporaires
  if (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT') {
    return true;
  }

  // Erreurs serveur (5xx)
  if (error.statusCode && error.statusCode >= 500) {
    return true;
  }

  // Autres erreurs → pas retryable
  return false;
}

/**
 * Détermine si un status HTTP est retryable
 */
function isRetryableStatusCode(statusCode?: number): boolean {
  if (!statusCode) return false;

  // 429 Rate Limit
  if (statusCode === 429) return true;

  // 5xx Server Errors
  if (statusCode >= 500) return true;

  return false;
}

/**
 * Logger d'erreur (console pour Phase 1, sera remplacé par un vrai logger)
 */
export function logError(
  context: string,
  error: unknown,
  metadata?: Record<string, any>
): void {
  const timestamp = new Date().toISOString();

  console.error(`[${timestamp}] [${context}]`, {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    metadata,
  });
}

/**
 * Retry wrapper avec backoff exponentiel
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    shouldRetry?: (error: unknown) => boolean;
  } = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const initialDelayMs = options.initialDelayMs ?? 1000;
  const maxDelayMs = options.maxDelayMs ?? 30000;
  const shouldRetry =
    options.shouldRetry ??
    ((error: unknown) => {
      return error instanceof CMSError && isRetryable(error);
    });

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Si c'est la dernière tentative ou l'erreur n'est pas retryable
      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }

      // Calculer le délai avec backoff exponentiel
      const delay = Math.min(initialDelayMs * Math.pow(2, attempt), maxDelayMs);

      // Rate limit : utiliser le retry-after si disponible
      if (error instanceof RateLimitError && error.details?.retryAfter) {
        const rateLimitDelay = error.details.retryAfter * 1000; // Convertir en ms
        await sleep(rateLimitDelay);
      } else {
        await sleep(delay);
      }

      logError('retryWithBackoff', error, {
        attempt: attempt + 1,
        maxRetries,
        delayMs: delay,
      });
    }
  }

  throw lastError;
}

/**
 * Helper sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wrapper pour catch et logger les erreurs
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context: string
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(context, error, { args });
      throw error;
    }
  };
}

/**
 * Validation helper : lance une CMSError si la condition est fausse
 */
export function assert(
  condition: boolean,
  message: string,
  code: string = 'VALIDATION_ERROR'
): asserts condition {
  if (!condition) {
    throw new CMSError(message, code, 400);
  }
}

/**
 * Validation helper : vérifie qu'un paramètre est défini
 */
export function assertDefined<T>(
  value: T | undefined | null,
  paramName: string
): asserts value is T {
  if (value === undefined || value === null) {
    throw new CMSError(
      `Missing required parameter: ${paramName}`,
      'MISSING_PARAMETER',
      400
    );
  }
}
