/**
 * Web Screenshot Tool - Multi-device screenshots with Playwright
 * Supports desktop, mobile, and tablet presets
 * Uploads to Cloudinary CDN
 */

import { withPage } from '../lib/browser-pool.js';
import { validateURL } from '../lib/url-validator.js';
import { uploadScreenshot, isCloudinaryConfigured } from '../lib/cloudinary.js';
import type { ScreenshotResult, DevicePreset } from '../types.js';

// ─────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────

const DEVICE_PRESETS = {
  desktop: {
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  },
  mobile: {
    width: 375,
    height: 812,
    deviceScaleFactor: 3,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  },
  tablet: {
    width: 768,
    height: 1024,
    deviceScaleFactor: 2,
    userAgent:
      'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  },
};

// ─────────────────────────────────────────────────────────────────
// Main Function
// ─────────────────────────────────────────────────────────────────

export async function webScreenshot(
  url: string,
  device: DevicePreset = 'desktop',
  options: {
    fullPage?: boolean;
    waitForSelector?: string;
    waitTime?: number; // ms to wait before screenshot
  } = {}
): Promise<ScreenshotResult> {
  // 1. Validate URL
  const validation = validateURL(url);
  if (!validation.valid) {
    throw new Error(`Invalid URL: ${validation.reason}`);
  }

  const { fullPage = false, waitForSelector, waitTime = 1000 } = options;

  // 2. Get device configuration
  const deviceConfig = DEVICE_PRESETS[device];
  if (!deviceConfig) {
    throw new Error(`Invalid device preset: ${device}. Use: desktop, mobile, or tablet`);
  }

  // 3. Take screenshot with Playwright
  const result = await withPage(async (page) => {
    // Set viewport
    await page.setViewportSize({
      width: deviceConfig.width,
      height: deviceConfig.height,
    });

    // Navigate to URL
    await page.goto(validation.url!, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Wait for selector if specified
    if (waitForSelector) {
      await page.waitForSelector(waitForSelector, { timeout: 10000 });
    }

    // Additional wait time (for animations, lazy loading)
    if (waitTime > 0) {
      await page.waitForTimeout(waitTime);
    }

    // Take screenshot
    const screenshotBuffer = await page.screenshot({
      fullPage,
      type: 'png',
    });

    // Get actual dimensions
    const dimensions = fullPage
      ? await page.evaluate(() => ({
          width: document.documentElement.scrollWidth,
          height: document.documentElement.scrollHeight,
        }))
      : { width: deviceConfig.width, height: deviceConfig.height };

    return {
      buffer: screenshotBuffer,
      width: dimensions.width,
      height: dimensions.height,
    };
  });

  // 4. Upload to Cloudinary (if configured)
  let cloudinaryUrl: string | undefined;
  let imageUrl: string;

  if (isCloudinaryConfigured()) {
    try {
      const upload = await uploadScreenshot(result.buffer, {
        filename: `screenshot-${device}`,
        folder: 'hive-os/screenshots',
        tags: [device, 'web-screenshot'],
      });
      cloudinaryUrl = upload.secureUrl;
      imageUrl = upload.secureUrl;
    } catch (error: any) {
      console.error('[web-screenshot] Cloudinary upload failed:', error.message);
      // Fallback: return base64
      imageUrl = `data:image/png;base64,${result.buffer.toString('base64')}`;
    }
  } else {
    // No Cloudinary configured: return base64
    imageUrl = `data:image/png;base64,${result.buffer.toString('base64')}`;
  }

  // 5. Build result
  const screenshotResult: ScreenshotResult = {
    url: validation.url!,
    device,
    imageUrl,
    cloudinaryUrl,
    width: result.width,
    height: result.height,
    capturedAt: new Date().toISOString(),
  };

  return screenshotResult;
}
