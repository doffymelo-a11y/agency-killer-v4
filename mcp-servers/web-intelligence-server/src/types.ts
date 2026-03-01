/**
 * Types for Web Intelligence MCP Server
 * Hive OS V5 - Web browsing & analysis tools
 */

// ─────────────────────────────────────────────────────────────────
// Web Scraping Types
// ─────────────────────────────────────────────────────────────────

export interface WebScrapeResult {
  url: string;
  title: string;
  meta: {
    description?: string;
    keywords?: string;
    author?: string;
    robots?: string;
    canonical?: string;
  };
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
  };
  links: {
    internal: string[];
    external: string[];
  };
  images: Array<{
    src: string;
    alt: string;
    title?: string;
  }>;
  contentLength: number;
  scrapedAt: string;
}

// ─────────────────────────────────────────────────────────────────
// Text Extraction Types
// ─────────────────────────────────────────────────────────────────

export interface TextExtractionResult {
  url: string;
  title: string;
  author?: string;
  content: string;
  textContent: string;
  length: number;
  excerpt: string;
  siteName?: string;
  publishedTime?: string;
  extractedAt: string;
}

// ─────────────────────────────────────────────────────────────────
// Competitor Analysis Types
// ─────────────────────────────────────────────────────────────────

export interface CompetitorAnalysisResult {
  url: string;
  techStack: {
    cms?: string;
    frameworks: string[];
    analytics: string[];
    advertising: string[];
    cdn?: string;
    hosting?: string;
  };
  seo: {
    title: string;
    metaDescription?: string;
    ogTags: Record<string, string>;
    twitterCards: Record<string, string>;
    headingStructure: {
      h1Count: number;
      h2Count: number;
      h3Count: number;
    };
    canonicalUrl?: string;
    robots?: string;
  };
  socialLinks: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  };
  trackingPixels: {
    googleAnalytics?: string[];
    googleTagManager?: string[];
    metaPixel?: string[];
    linkedinInsight?: string[];
    tiktokPixel?: string[];
  };
  performance: {
    loadTime: number;
    resourceCount: number;
  };
  analyzedAt: string;
}

// ─────────────────────────────────────────────────────────────────
// Social Meta Check Types
// ─────────────────────────────────────────────────────────────────

export interface SocialMetaCheckResult {
  url: string;
  openGraph: {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    type?: string;
    siteName?: string;
    locale?: string;
  };
  twitterCard: {
    card?: string;
    site?: string;
    creator?: string;
    title?: string;
    description?: string;
    image?: string;
  };
  basicMeta: {
    title: string;
    description?: string;
    keywords?: string;
  };
  issues: string[];
  recommendations: string[];
  checkedAt: string;
}

// ─────────────────────────────────────────────────────────────────
// Link Checker Types
// ─────────────────────────────────────────────────────────────────

export interface LinkCheckResult {
  url: string;
  status: 'success' | 'redirect' | 'client_error' | 'server_error' | 'timeout' | 'error';
  statusCode?: number;
  redirectUrl?: string;
  responseTime?: number;
  error?: string;
}

export interface LinkCheckerResult {
  url: string;
  totalLinks: number;
  results: LinkCheckResult[];
  summary: {
    success: number;
    redirects: number;
    clientErrors: number;
    serverErrors: number;
    timeouts: number;
    errors: number;
  };
  checkedAt: string;
}

// ─────────────────────────────────────────────────────────────────
// Screenshot Types (for Phase 1.2)
// ─────────────────────────────────────────────────────────────────

export type DevicePreset = 'desktop' | 'mobile' | 'tablet';

export interface ScreenshotOptions {
  url: string;
  device: DevicePreset;
  fullPage?: boolean;
  waitForSelector?: string;
  waitTime?: number;
}

export interface ScreenshotResult {
  url: string;
  device: DevicePreset;
  imageUrl: string;
  cloudinaryUrl?: string;
  width: number;
  height: number;
  capturedAt: string;
}

// ─────────────────────────────────────────────────────────────────
// Landing Page Audit Types (for Phase 1.2)
// ─────────────────────────────────────────────────────────────────

export interface LandingPageAuditResult {
  url: string;
  score: number; // 0-100
  checks: {
    ctaAboveFold: { pass: boolean; message: string };
    hasForm: { pass: boolean; message: string };
    mobileResponsive: { pass: boolean; message: string };
    loadTime: { pass: boolean; value: number; threshold: number };
    hasSSL: { pass: boolean; message: string };
    hasTrustSignals: { pass: boolean; signals: string[] };
  };
  screenshot?: string;
  recommendations: string[];
  auditedAt: string;
}

// ─────────────────────────────────────────────────────────────────
// Pixel Verification Types (for Phase 1.2)
// ─────────────────────────────────────────────────────────────────

export interface PixelVerificationResult {
  url: string;
  pixels: {
    googleAnalytics4: { detected: boolean; ids: string[] };
    googleTagManager: { detected: boolean; ids: string[] };
    metaPixel: { detected: boolean; ids: string[] };
    googleAds: { detected: boolean; ids: string[] };
    tiktokPixel: { detected: boolean; ids: string[] };
    linkedinInsight: { detected: boolean; ids: string[] };
  };
  screenshot?: string;
  networkRequests: Array<{
    url: string;
    type: string;
    matched: string;
  }>;
  verifiedAt: string;
}

// ─────────────────────────────────────────────────────────────────
// URL Validator Types
// ─────────────────────────────────────────────────────────────────

export interface URLValidationResult {
  valid: boolean;
  url?: string;
  error?: string;
  reason?: string;
}

// ─────────────────────────────────────────────────────────────────
// Browser Pool Types (for Phase 1.2)
// ─────────────────────────────────────────────────────────────────

export interface BrowserPoolConfig {
  maxBrowsers: number;
  browserTimeout: number;
  memoryLimit: number;
  idleTimeout: number;
}
