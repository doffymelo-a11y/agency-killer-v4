/**
 * Landing Page Audit Tool - Comprehensive landing page analysis
 * Checks: CTA above fold, forms, mobile responsive, load time, SSL, trust signals
 */

import { withPage } from '../lib/browser-pool.js';
import { validateURL } from '../lib/url-validator.js';
import { uploadScreenshot, isCloudinaryConfigured } from '../lib/cloudinary.js';
import type { LandingPageAuditResult } from '../types.js';

// ─────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────

const LOAD_TIME_THRESHOLD_MS = 3000; // 3 seconds
const ABOVE_FOLD_HEIGHT = 800; // Pixels

// ─────────────────────────────────────────────────────────────────
// Main Function
// ─────────────────────────────────────────────────────────────────

export async function landingPageAudit(url: string): Promise<LandingPageAuditResult> {
  // 1. Validate URL
  const validation = validateURL(url);
  if (!validation.valid) {
    throw new Error(`Invalid URL: ${validation.reason}`);
  }

  const startTime = Date.now();

  // 2. Run audit with Playwright
  const auditData = await withPage(async (page) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });

    // Navigate and measure load time
    const navigationStart = Date.now();
    await page.goto(validation.url!, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    const loadTime = Date.now() - navigationStart;

    // Wait a bit for lazy-loaded content
    await page.waitForTimeout(1000);

    // --- Check 1: CTA above fold ---
    const ctaAboveFold = await page.evaluate((foldHeight) => {
      const buttons = Array.from(document.querySelectorAll('button, a.button, a.btn, [role="button"]'));
      const ctaKeywords = ['buy', 'get', 'start', 'sign up', 'subscribe', 'download', 'try', 'demo', 'contact'];

      for (const btn of buttons) {
        const rect = btn.getBoundingClientRect();
        const text = btn.textContent?.toLowerCase() || '';

        if (rect.top < foldHeight && ctaKeywords.some(kw => text.includes(kw))) {
          return true;
        }
      }
      return false;
    }, ABOVE_FOLD_HEIGHT);

    // --- Check 2: Has form ---
    const hasForm = await page.evaluate(() => {
      return document.querySelectorAll('form').length > 0;
    });

    // --- Check 3: Mobile responsive (viewport meta tag) ---
    const mobileResponsive = await page.evaluate(() => {
      const viewport = document.querySelector('meta[name="viewport"]');
      return viewport !== null;
    });

    // --- Check 4: SSL ---
    const hasSSL = validation.url!.startsWith('https://');

    // --- Check 5: Trust signals ---
    const trustSignals = await page.evaluate(() => {
      const signals: string[] = [];

      // Check for testimonials
      const testimonialKeywords = ['testimonial', 'review', 'customer', 'client'];
      const allText = document.body.innerText.toLowerCase();

      if (testimonialKeywords.some(kw => allText.includes(kw))) {
        signals.push('testimonials');
      }

      // Check for security badges
      const images = Array.from(document.querySelectorAll('img'));
      const badgeKeywords = ['secure', 'ssl', 'verified', 'trust', 'guarantee', 'certified'];

      for (const img of images) {
        const src = img.src.toLowerCase();
        const alt = img.alt.toLowerCase();

        if (badgeKeywords.some(kw => src.includes(kw) || alt.includes(kw))) {
          signals.push('security-badge');
          break;
        }
      }

      // Check for social proof (numbers, stats)
      const statPattern = /\d{1,3}[,\.]?\d*\+?\s*(customers|users|clients|companies|downloads|reviews)/i;
      if (statPattern.test(allText)) {
        signals.push('social-proof-stats');
      }

      // Check for privacy policy link
      const links = Array.from(document.querySelectorAll('a'));
      if (links.some(a => a.textContent?.toLowerCase().includes('privacy'))) {
        signals.push('privacy-policy');
      }

      return signals;
    });

    // Take screenshot
    const screenshotBuffer = await page.screenshot({
      fullPage: false,
      type: 'png',
    });

    return {
      loadTime,
      ctaAboveFold,
      hasForm,
      mobileResponsive,
      hasSSL,
      trustSignals,
      screenshotBuffer,
    };
  });

  // 3. Upload screenshot (if Cloudinary configured)
  let screenshot: string | undefined;

  if (isCloudinaryConfigured()) {
    try {
      const upload = await uploadScreenshot(auditData.screenshotBuffer, {
        filename: 'landing-page-audit',
        folder: 'hive-os/audits',
        tags: ['landing-page', 'audit'],
      });
      screenshot = upload.secureUrl;
    } catch (error: any) {
      console.error('[landing-page-audit] Screenshot upload failed:', error.message);
      screenshot = `data:image/png;base64,${auditData.screenshotBuffer.toString('base64')}`;
    }
  } else {
    screenshot = `data:image/png;base64,${auditData.screenshotBuffer.toString('base64')}`;
  }

  // 4. Build checks object
  const checks = {
    ctaAboveFold: {
      pass: auditData.ctaAboveFold,
      message: auditData.ctaAboveFold
        ? '✓ CTA visible above fold'
        : '✗ No clear CTA above fold',
    },
    hasForm: {
      pass: auditData.hasForm,
      message: auditData.hasForm
        ? '✓ Form present for lead capture'
        : '✗ No form detected',
    },
    mobileResponsive: {
      pass: auditData.mobileResponsive,
      message: auditData.mobileResponsive
        ? '✓ Viewport meta tag present'
        : '✗ Missing viewport meta tag (not mobile-friendly)',
    },
    loadTime: {
      pass: auditData.loadTime < LOAD_TIME_THRESHOLD_MS,
      value: auditData.loadTime,
      threshold: LOAD_TIME_THRESHOLD_MS,
    },
    hasSSL: {
      pass: auditData.hasSSL,
      message: auditData.hasSSL
        ? '✓ HTTPS enabled'
        : '✗ Not using HTTPS (security risk)',
    },
    hasTrustSignals: {
      pass: auditData.trustSignals.length > 0,
      signals: auditData.trustSignals,
    },
  };

  // 5. Calculate score (0-100)
  const score = calculateScore(checks);

  // 6. Generate recommendations
  const recommendations = generateRecommendations(checks);

  // 7. Build result
  const result: LandingPageAuditResult = {
    url: validation.url!,
    score,
    checks,
    screenshot,
    recommendations,
    auditedAt: new Date().toISOString(),
  };

  return result;
}

// ─────────────────────────────────────────────────────────────────
// Scoring & Recommendations
// ─────────────────────────────────────────────────────────────────

function calculateScore(checks: any): number {
  let score = 0;

  // Each check worth points
  if (checks.ctaAboveFold.pass) score += 20;
  if (checks.hasForm.pass) score += 20;
  if (checks.mobileResponsive.pass) score += 20;
  if (checks.loadTime.pass) score += 20;
  if (checks.hasSSL.pass) score += 10;
  if (checks.hasTrustSignals.pass) score += 10;

  return score;
}

function generateRecommendations(checks: any): string[] {
  const recommendations: string[] = [];

  if (!checks.ctaAboveFold.pass) {
    recommendations.push('Add a prominent call-to-action button above the fold');
  }

  if (!checks.hasForm.pass) {
    recommendations.push('Add a lead capture form (email signup, contact form, or demo request)');
  }

  if (!checks.mobileResponsive.pass) {
    recommendations.push('Add viewport meta tag: <meta name="viewport" content="width=device-width, initial-scale=1">');
  }

  if (!checks.loadTime.pass) {
    recommendations.push(
      `Optimize load time (current: ${checks.loadTime.value}ms, target: < ${checks.loadTime.threshold}ms)`
    );
  }

  if (!checks.hasSSL.pass) {
    recommendations.push('Enable HTTPS for security and SEO benefits');
  }

  if (!checks.hasTrustSignals.pass) {
    recommendations.push(
      'Add trust signals: customer testimonials, security badges, or social proof (e.g., "10,000+ happy customers")'
    );
  } else if (checks.hasTrustSignals.signals.length < 3) {
    const missing: string[] = [];
    if (!checks.hasTrustSignals.signals.includes('testimonials')) missing.push('testimonials');
    if (!checks.hasTrustSignals.signals.includes('security-badge')) missing.push('security badges');
    if (!checks.hasTrustSignals.signals.includes('social-proof-stats')) missing.push('social proof stats');

    if (missing.length > 0) {
      recommendations.push(`Consider adding more trust signals: ${missing.join(', ')}`);
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('Landing page is well-optimized! 🎉');
  }

  return recommendations;
}
