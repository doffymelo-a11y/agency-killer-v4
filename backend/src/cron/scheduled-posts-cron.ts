/**
 * Scheduled Posts Cron Job
 * Runs every 60 seconds to publish scheduled social media posts
 *
 * Started automatically in src/index.ts
 * Can be disabled with ENABLE_SCHEDULED_POSTS_CRON=false
 */

import { publishScheduledPosts } from '../services/scheduled-posts-publisher.service.js';
import { logInfo, logError } from '../services/logging.service.js';
import { logger } from '../lib/logger.js';

const CRON_INTERVAL_MS = 60 * 1000; // 60 seconds

let cronInterval: NodeJS.Timeout | null = null;
let isRunning = false;

/**
 * Start the cron job
 */
export function startScheduledPostsCron() {
  if (cronInterval) {
    console.warn('[Scheduled Posts Cron] Already running');
    return;
  }

  logger.log('[Scheduled Posts Cron] Starting (runs every 60 seconds)...');

  // Run immediately on start
  runCronJob();

  // Then run every 60 seconds
  cronInterval = setInterval(() => {
    runCronJob();
  }, CRON_INTERVAL_MS);

  logger.log('[Scheduled Posts Cron] ✓ Started successfully');
}

/**
 * Stop the cron job
 */
export function stopScheduledPostsCron() {
  if (cronInterval) {
    clearInterval(cronInterval);
    cronInterval = null;
    logger.log('[Scheduled Posts Cron] Stopped');
  }
}

/**
 * Run a single cron job iteration
 */
async function runCronJob() {
  // Prevent concurrent runs
  if (isRunning) {
    logger.log('[Scheduled Posts Cron] Previous run still in progress, skipping...');
    return;
  }

  isRunning = true;
  const startTime = Date.now();

  try {
    logger.log('[Scheduled Posts Cron] Running publication check...');

    const result = await publishScheduledPosts();

    const duration = Date.now() - startTime;

    logger.log(
      `[Scheduled Posts Cron] ✓ Complete: ${result.published} published, ${result.failed} failed (${duration}ms)`
    );

    // Log to system_logs if any posts were processed
    if (result.published > 0 || result.failed > 0) {
      await logInfo(
        'backend',
        'scheduled_posts_cron_run',
        `Published ${result.published} posts, ${result.failed} failed`,
        {
          published: result.published,
          failed: result.failed,
          errors: result.errors,
          duration_ms: duration,
        }
      );
    }

    // Log errors if any
    if (result.errors.length > 0) {
      console.error('[Scheduled Posts Cron] Errors:', result.errors);
      await logError(
        'backend',
        'scheduled_posts_cron_errors',
        `${result.errors.length} posts failed to publish`,
        {
          errors: result.errors,
        }
      );
    }
  } catch (error: any) {
    console.error('[Scheduled Posts Cron] Fatal error:', error);

    await logError(
      'backend',
      'scheduled_posts_cron_fatal',
      `Cron job crashed: ${error.message}`,
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
  logger.log('[Scheduled Posts Cron] SIGTERM received, stopping...');
  stopScheduledPostsCron();
});

process.on('SIGINT', () => {
  logger.log('[Scheduled Posts Cron] SIGINT received, stopping...');
  stopScheduledPostsCron();
});
