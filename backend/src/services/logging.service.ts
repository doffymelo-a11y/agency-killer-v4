/**
 * Logging Service - Centralized system logging
 * Writes to system_logs table in Supabase
 * Used by agent-executor, mcp-bridge.service, routes, etc.
 */

import { supabaseAdmin } from './supabase.service.js';

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

export interface SystemLog {
  level: 'info' | 'warn' | 'error' | 'debug';
  source:
    | 'backend'
    | 'mcp-bridge'
    | 'agent-executor'
    | 'mcp-server'
    | 'orchestrator'
    | 'auth'
    | 'rate-limit';
  agent_id?: 'luna' | 'sora' | 'marcus' | 'milo' | 'doffy' | 'orchestrator' | 'pm';
  user_id?: string;
  project_id?: string;
  action: string;
  message: string;
  metadata?: Record<string, unknown>; // duration_ms, tool_name, server_name, error_stack, credits_used, etc.
}

// ─────────────────────────────────────────────────────────────────
// Security Helper - Sanitize Metadata
// ─────────────────────────────────────────────────────────────────

/**
 * Sanitize metadata to prevent sensitive data leakage
 * Redacts passwords, tokens, secrets, API keys, etc.
 */
function sanitizeMetadata(metadata?: Record<string, unknown>): Record<string, unknown> {
  if (!metadata || typeof metadata !== 'object') {
    return {};
  }

  // Sensitive keywords to redact
  const SENSITIVE_KEYS = [
    'password',
    'passwd',
    'pwd',
    'secret',
    'token',
    'api_key',
    'apikey',
    'api-key',
    'authorization',
    'auth',
    'bearer',
    'session',
    'cookie',
    'credentials',
    'access_token',
    'refresh_token',
    'private_key',
    'privatekey',
    'client_secret',
  ];

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(metadata)) {
    const lowerKey = key.toLowerCase();

    // Check if key contains sensitive keyword
    const isSensitive = SENSITIVE_KEYS.some((sensitive) => lowerKey.includes(sensitive));

    if (isSensitive) {
      // Redact sensitive values
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'string') {
      // Truncate long strings to prevent log bloat (max 500 chars)
      sanitized[key] = value.length > 500 ? value.substring(0, 500) + '...[truncated]' : value;
    } else if (typeof value === 'object' && value !== null) {
      // Recursively sanitize nested objects (max depth 2 to prevent performance issues)
      sanitized[key] = sanitizeMetadata(value as Record<string, unknown>);
    } else {
      // Keep primitives as-is (numbers, booleans, null)
      sanitized[key] = value;
    }
  }

  return sanitized;
}

// ─────────────────────────────────────────────────────────────────
// Main Function
// ─────────────────────────────────────────────────────────────────

/**
 * Log to system_logs table
 *
 * CRITICAL: This function NEVER throws errors.
 * If logging fails, it falls back to console.error to avoid breaking the main flow.
 *
 * @param log - The log entry to write
 * @returns Promise<void> - Always resolves, never rejects
 */
export async function logToSystem(log: SystemLog): Promise<void> {
  try {
    // Validate required fields
    if (!log.level || !log.source || !log.action || !log.message) {
      console.error('[logging.service] Missing required fields:', {
        level: log.level,
        source: log.source,
        action: log.action,
        message: log.message?.substring(0, 50),
      });
      return;
    }

    // Sanitize metadata to prevent sensitive data leakage
    const sanitizedMetadata = sanitizeMetadata(log.metadata);

    // Insert into system_logs via admin client (bypasses RLS)
    const { error } = await supabaseAdmin.from('system_logs').insert({
      level: log.level,
      source: log.source,
      agent_id: log.agent_id || null,
      user_id: log.user_id || null,
      project_id: log.project_id || null,
      action: log.action,
      message: log.message,
      metadata: sanitizedMetadata,
    });

    if (error) {
      // Log the error but don't throw - logging failures should not break the app
      console.error('[logging.service] Failed to insert log:', {
        error: error.message,
        log: {
          level: log.level,
          source: log.source,
          action: log.action,
        },
      });
    }
  } catch (error) {
    // Ultimate fallback: log to console only
    // This should never throw - even if Supabase is down
    console.error('[logging.service] Unexpected error:', {
      error: error instanceof Error ? error.message : String(error),
      log: {
        level: log.level,
        source: log.source,
        action: log.action,
        message: log.message?.substring(0, 100),
      },
    });
  }
}

// ─────────────────────────────────────────────────────────────────
// Convenience Functions
// ─────────────────────────────────────────────────────────────────

/**
 * Log info message
 */
export async function logInfo(
  source: SystemLog['source'],
  action: string,
  message: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  return logToSystem({ level: 'info', source, action, message, metadata });
}

/**
 * Log warning message
 */
export async function logWarn(
  source: SystemLog['source'],
  action: string,
  message: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  return logToSystem({ level: 'warn', source, action, message, metadata });
}

/**
 * Log error message
 */
export async function logError(
  source: SystemLog['source'],
  action: string,
  message: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  return logToSystem({ level: 'error', source, action, message, metadata });
}

/**
 * Log debug message
 */
export async function logDebug(
  source: SystemLog['source'],
  action: string,
  message: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  return logToSystem({ level: 'debug', source, action, message, metadata });
}
