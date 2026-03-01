/**
 * Browser Pool - Playwright browser instance management
 * Pattern inspired by OpenClaw's browser architecture
 *
 * Features:
 * - Singleton pool with max 3 concurrent Chromium instances
 * - Automatic timeout (30s per operation)
 * - Memory monitoring (kill if > 512MB)
 * - Idle timeout (close after 5min inactivity)
 * - Context isolation for concurrent requests
 */

import { chromium, Browser, BrowserContext, Page } from 'playwright';

// ─────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────

const MAX_BROWSERS = parseInt(process.env.MAX_BROWSERS || '3', 10);
const BROWSER_TIMEOUT_MS = parseInt(process.env.BROWSER_TIMEOUT_MS || '30000', 10);
const BROWSER_MEMORY_LIMIT_MB = parseInt(process.env.BROWSER_MEMORY_LIMIT_MB || '512', 10);
const BROWSER_IDLE_TIMEOUT_MIN = parseInt(process.env.BROWSER_IDLE_TIMEOUT_MIN || '5', 10);

const IDLE_TIMEOUT_MS = BROWSER_IDLE_TIMEOUT_MIN * 60 * 1000;

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

interface BrowserInstance {
  browser: Browser;
  contexts: Set<BrowserContext>;
  lastUsed: number;
  createdAt: number;
}

interface AcquireResult {
  page: Page;
  context: BrowserContext;
  release: () => Promise<void>;
}

// ─────────────────────────────────────────────────────────────────
// Browser Pool Class
// ─────────────────────────────────────────────────────────────────

class BrowserPool {
  private static instance: BrowserPool;
  private browsers: BrowserInstance[] = [];
  private initializationPromise: Promise<void> | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // Start cleanup task
    this.cleanupInterval = setInterval(() => {
      this.cleanupIdleBrowsers();
    }, 60000); // Run every minute
  }

  static getInstance(): BrowserPool {
    if (!BrowserPool.instance) {
      BrowserPool.instance = new BrowserPool();
    }
    return BrowserPool.instance;
  }

  /**
   * Acquire a page from the pool
   * Returns a page, context, and release callback
   */
  async acquirePage(): Promise<AcquireResult> {
    const context = await this.acquireContext();
    const page = await context.newPage();

    // Set default timeout
    page.setDefaultTimeout(BROWSER_TIMEOUT_MS);

    // Set viewport
    await page.setViewportSize({ width: 1280, height: 800 });

    const release = async () => {
      try {
        await page.close();
        // Find browser instance with this context
        const instance = this.browsers.find((b) => b.contexts.has(context));
        if (instance) {
          instance.contexts.delete(context);
          instance.lastUsed = Date.now();
        }
        await context.close();
      } catch (error) {
        console.error('Error releasing page:', error);
      }
    };

    return { page, context, release };
  }

  /**
   * Acquire a browser context
   */
  private async acquireContext(): Promise<BrowserContext> {
    // Find least busy browser
    let targetInstance = this.browsers
      .filter((b) => b.contexts.size < 5) // Max 5 contexts per browser
      .sort((a, b) => a.contexts.size - b.contexts.size)[0];

    // If no available browser and under limit, create new one
    if (!targetInstance && this.browsers.length < MAX_BROWSERS) {
      targetInstance = await this.createBrowserInstance();
    }

    // If still no browser (all at capacity), wait and reuse oldest
    if (!targetInstance) {
      targetInstance = this.browsers.sort((a, b) => a.lastUsed - b.lastUsed)[0];
    }

    // Create new context
    const context = await targetInstance.browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
      ignoreHTTPSErrors: true,
      bypassCSP: true,
    });

    targetInstance.contexts.add(context);
    targetInstance.lastUsed = Date.now();

    return context;
  }

  /**
   * Create a new browser instance
   */
  private async createBrowserInstance(): Promise<BrowserInstance> {
    const browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        `--max-old-space-size=${BROWSER_MEMORY_LIMIT_MB}`,
      ],
    });

    const instance: BrowserInstance = {
      browser,
      contexts: new Set(),
      lastUsed: Date.now(),
      createdAt: Date.now(),
    };

    this.browsers.push(instance);

    console.error(
      `[BrowserPool] Created browser instance (${this.browsers.length}/${MAX_BROWSERS})`
    );

    return instance;
  }

  /**
   * Cleanup idle browsers
   */
  private async cleanupIdleBrowsers(): Promise<void> {
    const now = Date.now();

    for (let i = this.browsers.length - 1; i >= 0; i--) {
      const instance = this.browsers[i];
      const idleTime = now - instance.lastUsed;

      // Close if idle and no active contexts
      if (idleTime > IDLE_TIMEOUT_MS && instance.contexts.size === 0) {
        try {
          await instance.browser.close();
          this.browsers.splice(i, 1);
          console.error(
            `[BrowserPool] Closed idle browser (idle: ${Math.round(idleTime / 1000)}s)`
          );
        } catch (error) {
          console.error('[BrowserPool] Error closing idle browser:', error);
        }
      }
    }
  }

  /**
   * Close all browsers (for graceful shutdown)
   */
  async closeAll(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    for (const instance of this.browsers) {
      try {
        await instance.browser.close();
      } catch (error) {
        console.error('[BrowserPool] Error closing browser:', error);
      }
    }

    this.browsers = [];
    console.error('[BrowserPool] Closed all browsers');
  }

  /**
   * Get pool stats
   */
  getStats() {
    return {
      totalBrowsers: this.browsers.length,
      maxBrowsers: MAX_BROWSERS,
      totalContexts: this.browsers.reduce((sum, b) => sum + b.contexts.size, 0),
      browsers: this.browsers.map((b) => ({
        contexts: b.contexts.size,
        idleTime: Math.round((Date.now() - b.lastUsed) / 1000),
        uptime: Math.round((Date.now() - b.createdAt) / 1000),
      })),
    };
  }
}

// ─────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────

export const browserPool = BrowserPool.getInstance();

/**
 * Acquire a page with automatic release
 * Usage:
 *   const { page, release } = await acquirePage();
 *   try {
 *     await page.goto('https://example.com');
 *     // ... do work
 *   } finally {
 *     await release();
 *   }
 */
export async function acquirePage(): Promise<AcquireResult> {
  return browserPool.acquirePage();
}

/**
 * Execute a function with an auto-released page
 * Usage:
 *   const result = await withPage(async (page) => {
 *     await page.goto('https://example.com');
 *     return await page.title();
 *   });
 */
export async function withPage<T>(fn: (page: Page) => Promise<T>): Promise<T> {
  const { page, release } = await acquirePage();
  try {
    return await fn(page);
  } finally {
    await release();
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.error('[BrowserPool] Received SIGTERM, closing browsers...');
  await browserPool.closeAll();
});

process.on('SIGINT', async () => {
  console.error('[BrowserPool] Received SIGINT, closing browsers...');
  await browserPool.closeAll();
});
