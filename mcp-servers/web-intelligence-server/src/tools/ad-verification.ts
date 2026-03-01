/**
 * Ad Verification Tool - Track

ing pixel detection via network interception
 * Detects: Meta Pixel, GA4, GTM, Google Ads, TikTok Pixel, LinkedIn Insight
 * Uses Playwright network interception to capture all requests
 */

import { withPage } from '../lib/browser-pool.js';
import { validateURL } from '../lib/url-validator.js';
import { uploadScreenshot, isCloudinaryConfigured } from '../lib/cloudinary.js';
import type { PixelVerificationResult } from '../types.js';

// ─────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────

interface NetworkRequest {
  url: string;
  type: string;
  matched: string;
}

// Pixel detection patterns
const PIXEL_PATTERNS = {
  googleAnalytics4: {
    patterns: [/google-analytics\.com\/g\/collect/, /gtag\/js\?id=G-/],
    extractId: (url: string, _html: string) => {
      const match = url.match(/[?&]id=(G-[A-Z0-9]+)/);
      return match ? match[1] : null;
    },
  },
  googleTagManager: {
    patterns: [/googletagmanager\.com\/gtm\.js/, /googletagmanager\.com\/ns\.html/],
    extractId: (url: string, _html: string) => {
      const match = url.match(/[?&]id=(GTM-[A-Z0-9]+)/);
      return match ? match[1] : null;
    },
  },
  metaPixel: {
    patterns: [/connect\.facebook\.net\/.*\/fbevents\.js/, /facebook\.com\/tr/],
    extractId: (url: string, html: string) => {
      // Try to extract from URL
      const urlMatch = url.match(/[?&]id=(\d+)/);
      if (urlMatch) return urlMatch[1];

      // Try to extract from HTML (fbq('init', 'PIXEL_ID'))
      const htmlMatch = html.match(/fbq\(['"]init['"],\s*['"](\d+)['"]/);
      return htmlMatch ? htmlMatch[1] : null;
    },
  },
  googleAds: {
    patterns: [/googleadservices\.com\/pagead\/conversion/, /google\.com\/ads\/ga-audiences/],
    extractId: (url: string, _html: string) => {
      const match = url.match(/[?&]id=(AW-[A-Z0-9]+)/);
      return match ? match[1] : null;
    },
  },
  tiktokPixel: {
    patterns: [/analytics\.tiktok\.com\/i18n\/pixel/, /tiktok\.com\/.*\/analytics/],
    extractId: (url: string, html: string) => {
      // Try URL
      const urlMatch = url.match(/[?&]sdkid=([A-Z0-9]+)/);
      if (urlMatch) return urlMatch[1];

      // Try HTML (ttq.load('PIXEL_ID'))
      const htmlMatch = html.match(/ttq\.load\(['"]([A-Z0-9]+)['"]/);
      return htmlMatch ? htmlMatch[1] : null;
    },
  },
  linkedinInsight: {
    patterns: [/snap\.licdn\.com\/li\.lms-analytics/, /linkedin\.com\/.*\/analytics/],
    extractId: (url: string, html: string) => {
      // Try URL
      const urlMatch = url.match(/[?&]partner_id=(\d+)/);
      if (urlMatch) return urlMatch[1];

      // Try HTML (_linkedin_partner_id = "PARTNER_ID")
      const htmlMatch = html.match(/_linkedin_partner_id\s*=\s*['"](\d+)['"]/);
      return htmlMatch ? htmlMatch[1] : null;
    },
  },
};

// ─────────────────────────────────────────────────────────────────
// Main Function
// ─────────────────────────────────────────────────────────────────

export async function adVerification(url: string): Promise<PixelVerificationResult> {
  // 1. Validate URL
  const validation = validateURL(url);
  if (!validation.valid) {
    throw new Error(`Invalid URL: ${validation.reason}`);
  }

  // 2. Run verification with Playwright
  const verificationData = await withPage(async (page) => {
    const networkRequests: NetworkRequest[] = [];
    let pageHTML = '';

    // Set up network request interception
    page.on('request', (request) => {
      const reqUrl = request.url();
      networkRequests.push({
        url: reqUrl,
        type: request.resourceType(),
        matched: '',
      });
    });

    // Navigate to page
    await page.goto(validation.url!, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Wait a bit for async pixels to load
    await page.waitForTimeout(2000);

    // Get page HTML (for extracting pixel IDs from inline scripts)
    pageHTML = await page.content();

    // Take screenshot
    const screenshotBuffer = await page.screenshot({
      fullPage: false,
      type: 'png',
    });

    return {
      networkRequests,
      pageHTML,
      screenshotBuffer,
    };
  });

  // 3. Analyze network requests for pixels
  const pixels = {
    googleAnalytics4: { detected: false, ids: [] as string[] },
    googleTagManager: { detected: false, ids: [] as string[] },
    metaPixel: { detected: false, ids: [] as string[] },
    googleAds: { detected: false, ids: [] as string[] },
    tiktokPixel: { detected: false, ids: [] as string[] },
    linkedinInsight: { detected: false, ids: [] as string[] },
  };

  const matchedRequests: NetworkRequest[] = [];

  // Check each request against pixel patterns
  for (const request of verificationData.networkRequests) {
    for (const [pixelName, config] of Object.entries(PIXEL_PATTERNS)) {
      for (const pattern of config.patterns) {
        if (pattern.test(request.url)) {
          pixels[pixelName as keyof typeof pixels].detected = true;
          request.matched = pixelName;
          matchedRequests.push(request);

          // Extract pixel ID
          let pixelId: string | null = null;

          if (config.extractId) {
            // Pass both url and html to all extractId functions
            pixelId = config.extractId(request.url, verificationData.pageHTML);
          }

          if (pixelId && !pixels[pixelName as keyof typeof pixels].ids.includes(pixelId)) {
            pixels[pixelName as keyof typeof pixels].ids.push(pixelId);
          }

          break;
        }
      }
    }
  }

  // 4. Upload screenshot (if Cloudinary configured)
  let screenshot: string | undefined;

  if (isCloudinaryConfigured()) {
    try {
      const upload = await uploadScreenshot(verificationData.screenshotBuffer, {
        filename: 'ad-verification',
        folder: 'hive-os/verification',
        tags: ['ad-verification', 'pixels'],
      });
      screenshot = upload.secureUrl;
    } catch (error: any) {
      console.error('[ad-verification] Screenshot upload failed:', error.message);
      screenshot = `data:image/png;base64,${verificationData.screenshotBuffer.toString('base64')}`;
    }
  } else {
    screenshot = `data:image/png;base64,${verificationData.screenshotBuffer.toString('base64')}`;
  }

  // 5. Build result
  const result: PixelVerificationResult = {
    url: validation.url!,
    pixels,
    screenshot,
    networkRequests: matchedRequests,
    verifiedAt: new Date().toISOString(),
  };

  return result;
}
