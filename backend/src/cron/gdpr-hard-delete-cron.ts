/**
 * GDPR Hard-Delete Cron Job
 * Runs once daily to permanently delete accounts marked for deletion > 30 days ago
 *
 * RGPD Article 17 compliance: ensures effective data deletion
 * Started automatically in src/index.ts
 * Can be disabled with ENABLE_GDPR_HARD_DELETE_CRON=false
 */

import { supabaseAdmin } from '../services/supabase.service.js';
import { logInfo, logError } from '../services/logging.service.js';
import { logger } from '../lib/logger.js';

const CRON_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours (daily)

let cronInterval: NodeJS.Timeout | null = null;
let isRunning = false;

/**
 * Start the GDPR hard-delete cron job
 */
export function startGdprHardDeleteCron() {
  if (cronInterval) {
    console.warn('[GDPR Hard-Delete Cron] Already running');
    return;
  }

  logger.log('[GDPR Hard-Delete Cron] Starting (runs daily at midnight)...');

  // Run immediately on start (to catch any delayed deletions after restart)
  runCronJob();

  // Then run every 24 hours
  cronInterval = setInterval(() => {
    runCronJob();
  }, CRON_INTERVAL_MS);

  logger.log('[GDPR Hard-Delete Cron] ✓ Started successfully');
}

/**
 * Stop the cron job
 */
export function stopGdprHardDeleteCron() {
  if (cronInterval) {
    clearInterval(cronInterval);
    cronInterval = null;
    logger.log('[GDPR Hard-Delete Cron] Stopped');
  }
}

/**
 * Run a single cron job iteration
 */
async function runCronJob() {
  // Prevent concurrent runs
  if (isRunning) {
    logger.log('[GDPR Hard-Delete Cron] Previous run still in progress, skipping...');
    return;
  }

  isRunning = true;
  const startTime = Date.now();

  try {
    logger.log('[GDPR Hard-Delete Cron] Running hard-delete check (accounts deleted > 30 days ago)...');

    // Call Supabase RPC function (returns void, logs are written in SQL)
    const { error } = await supabaseAdmin.rpc('gdpr_hard_delete_expired_accounts');

    if (error) {
      throw error;
    }

    const duration = Date.now() - startTime;

    logger.log(
      `[GDPR Hard-Delete Cron] ✓ Complete: Hard-delete executed successfully (${duration}ms)`
    );

    // Log to system_logs (backend-side audit trail)
    // Note: SQL function also logs detailed info to system_logs
    await logInfo(
      'gdpr',
      'hard_delete_cron_executed',
      'GDPR hard-delete cron executed successfully',
      {
        duration_ms: duration,
        executed_at: new Date().toISOString(),
      }
    );
  } catch (error: any) {
    console.error('[GDPR Hard-Delete Cron] Fatal error:', error);

    await logError(
      'gdpr',
      'hard_delete_failed',
      `GDPR hard-delete cron job crashed: ${error.message}`,
      {
        error: error.message,
        stack: error.stack,
      }
    );
  } finally {
    isRunning = false;
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.log('[GDPR Hard-Delete Cron] SIGTERM received, stopping...');
  stopGdprHardDeleteCron();
});

process.on('SIGINT', () => {
  logger.log('[GDPR Hard-Delete Cron] SIGINT received, stopping...');
  stopGdprHardDeleteCron();
});
