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

    // Insert into system_logs via admin client (bypasses RLS)
    const { error } = await supabaseAdmin.from('system_logs').insert({
      level: log.level,
      source: log.source,
      agent_id: log.agent_id || null,
      user_id: log.user_id || null,
      project_id: log.project_id || null,
      action: log.action,
      message: log.message,
      metadata: log.metadata || {},
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
