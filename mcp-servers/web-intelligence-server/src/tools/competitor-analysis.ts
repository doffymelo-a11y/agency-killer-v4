/**
 * Competitor Analysis Tool - Comprehensive tech stack + SEO analysis
 * Detects: CMS, frameworks, analytics, pixels, social links, SEO structure
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { validateURL } from '../lib/url-validator.js';
import type { CompetitorAnalysisResult } from '../types.js';

// ─────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────

const REQUEST_TIMEOUT = 15000;
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// ─────────────────────────────────────────────────────────────────
// Main Function
// ─────────────────────────────────────────────────────────────────

export async function competitorAnalysis(url: string): Promise<CompetitorAnalysisResult> {
  // 1. Validate URL
  const validation = validateURL(url);
  if (!validation.valid) {
    throw new Error(`Invalid URL: ${validation.reason}`);
  }

  const startTime = Date.now();

  // 2. Fetch HTML + response headers
  const { html, headers } = await fetchHTMLWithHeaders(validation.url!);

  // 3. Parse with Cheerio
  const $ = cheerio.load(html);

  // 4. Analyze everything
  const result: CompetitorAnalysisResult = {
    url: validation.url!,
    techStack: detectTechStack($, html, headers),
    seo: extractSEO($),
    socialLinks: extractSocialLinks($),
    trackingPixels: detectTrackingPixels($, html),
    performance: {
      loadTime: Date.now() - startTime,
      resourceCount: countResources($),
    },
    analyzedAt: new Date().toISOString(),
  };

  return result;
}

// ─────────────────────────────────────────────────────────────────
// HTTP Fetching
// ─────────────────────────────────────────────────────────────────

async function fetchHTMLWithHeaders(url: string): Promise<{ html: string; headers: any }> {
  try {
    const response = await axios.get(url, {
      timeout: REQUEST_TIMEOUT,
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
      },
      maxRedirects: 5,
      validateStatus: (status) => status >= 200 && status < 400,
    });

    return {
      html: response.data,
      headers: response.headers,
    };
  } catch (error: any) {
    if (error.code === 'ECONNABORTED') {
      throw new Error(`Request timeout after ${REQUEST_TIMEOUT}ms`);
    }
    if (error.response) {
      throw new Error(`HTTP ${error.response.status}: ${error.response.statusText}`);
    }
    throw new Error(`Failed to fetch URL: ${error.message}`);
  }
}

// ─────────────────────────────────────────────────────────────────
// Tech Stack Detection
// ─────────────────────────────────────────────────────────────────

function detectTechStack($: cheerio.CheerioAPI, html: string, headers: any) {
  const frameworks: string[] = [];
  const analytics: string[] = [];
  const advertising: string[] = [];
  let cms: string | undefined;
  let cdn: string | undefined;
  let hosting: string | undefined;

  // CMS Detection
  if ($('meta[name="generator"]').attr('content')?.includes('WordPress')) cms = 'WordPress';
  if (html.includes('wp-content') || html.includes('wp-includes')) cms = 'WordPress';
  if ($('meta[name="generator"]').attr('content')?.includes('Shopify')) cms = 'Shopify';
  if (html.includes('cdn.shopify.com')) cms = 'Shopify';
  if (html.includes('Wix.com')) cms = 'Wix';
  if (html.includes('squarespace')) cms = 'Squarespace';
  if (html.includes('webflow')) cms = 'Webflow';
  if (html.includes('drupal')) cms = 'Drupal';

  // Framework Detection
  if ($('script[src*="react"]').length > 0 || html.includes('_N_E') || html.includes('__NEXT')) {
    frameworks.push('React');
  }
  if (html.includes('__nuxt') || html.includes('_nuxt')) frameworks.push('Nuxt.js (Vue)');
  if (html.includes('ng-version')) frameworks.push('Angular');
  if ($('script[src*="vue"]').length > 0) frameworks.push('Vue.js');
  if (html.includes('__svelte')) frameworks.push('Svelte');
  if ($('script[src*="jquery"]').length > 0) frameworks.push('jQuery');
  if (html.includes('next/script')) frameworks.push('Next.js');
  if (html.includes('gatsby')) frameworks.push('Gatsby');

  // Analytics Detection
  if (html.includes('google-analytics.com') || html.includes('gtag')) analytics.push('Google Analytics');
  if (html.includes('googletagmanager.com')) analytics.push('Google Tag Manager');
  if (html.includes('hotjar')) analytics.push('Hotjar');
  if (html.includes('mixpanel')) analytics.push('Mixpanel');
  if (html.includes('segment.com')) analytics.push('Segment');
  if (html.includes('amplitude')) analytics.push('Amplitude');
  if (html.includes('plausible')) analytics.push('Plausible');
  if (html.includes('matomo')) analytics.push('Matomo');

  // Advertising Detection
  if (html.includes('googleadservices.com')) advertising.push('Google Ads');
  if (html.includes('facebook.net/en_US/fbevents.js') || html.includes('connect.facebook.net')) {
    advertising.push('Meta Pixel');
  }
  if (html.includes('analytics.tiktok.com')) advertising.push('TikTok Pixel');
  if (html.includes('snap.licdn.com')) advertising.push('LinkedIn Insight');
  if (html.includes('twitter.com/i/adsct')) advertising.push('Twitter Ads');
  if (html.includes('bat.bing.com')) advertising.push('Microsoft Ads');

  // CDN Detection
  if (headers['server']?.includes('cloudflare') || html.includes('cloudflare')) cdn = 'Cloudflare';
  if (html.includes('cdn.jsdelivr.net')) cdn = 'jsDelivr';
  if (html.includes('cdnjs.cloudflare.com')) cdn = 'Cloudflare CDN';
  if (html.includes('fastly')) cdn = 'Fastly';
  if (html.includes('akamai')) cdn = 'Akamai';

  // Hosting Detection (from headers)
  if (headers['server']?.includes('nginx')) hosting = 'Nginx';
  if (headers['server']?.includes('Apache')) hosting = 'Apache';
  if (headers['x-powered-by']?.includes('Vercel')) hosting = 'Vercel';
  if (headers['x-powered-by']?.includes('Netlify')) hosting = 'Netlify';
  if (headers['server']?.includes('cloudflare')) hosting = 'Cloudflare Pages';
  if (html.includes('amazonaws.com')) hosting = 'AWS';

  return {
    cms,
    frameworks,
    analytics,
    advertising,
    cdn,
    hosting,
  };
}

// ─────────────────────────────────────────────────────────────────
// SEO Extraction
// ─────────────────────────────────────────────────────────────────

function extractSEO($: cheerio.CheerioAPI) {
  const ogTags: Record<string, string> = {};
  const twitterCards: Record<string, string> = {};

  // Open Graph tags
  $('meta[property^="og:"]').each((_, el) => {
    const property = $(el).attr('property')?.replace('og:', '');
    const content = $(el).attr('content');
    if (property && content) {
      ogTags[property] = content;
    }
  });

  // Twitter Card tags
  $('meta[name^="twitter:"]').each((_, el) => {
    const name = $(el).attr('name')?.replace('twitter:', '');
    const content = $(el).attr('content');
    if (name && content) {
      twitterCards[name] = content;
    }
  });

  return {
    title: $('title').first().text().trim(),
    metaDescription: $('meta[name="description"]').attr('content')?.trim() || undefined,
    ogTags,
    twitterCards,
    headingStructure: {
      h1Count: $('h1').length,
      h2Count: $('h2').length,
      h3Count: $('h3').length,
    },
    canonicalUrl: $('link[rel="canonical"]').attr('href')?.trim() || undefined,
    robots: $('meta[name="robots"]').attr('content')?.trim() || undefined,
  };
}

// ─────────────────────────────────────────────────────────────────
// Social Links Extraction
// ─────────────────────────────────────────────────────────────────

function extractSocialLinks($: cheerio.CheerioAPI) {
  const links = {
    facebook: undefined as string | undefined,
    twitter: undefined as string | undefined,
    instagram: undefined as string | undefined,
    linkedin: undefined as string | undefined,
    youtube: undefined as string | undefined,
  };

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;

    if (href.includes('facebook.com') && !links.facebook) {
      links.facebook = href;
    } else if ((href.includes('twitter.com') || href.includes('x.com')) && !links.twitter) {
      links.twitter = href;
    } else if (href.includes('instagram.com') && !links.instagram) {
      links.instagram = href;
    } else if (href.includes('linkedin.com') && !links.linkedin) {
      links.linkedin = href;
    } else if (href.includes('youtube.com') && !links.youtube) {
      links.youtube = href;
    }
  });

  return links;
}

// ─────────────────────────────────────────────────────────────────
// Tracking Pixels Detection
// ─────────────────────────────────────────────────────────────────

function detectTrackingPixels($: cheerio.CheerioAPI, html: string) {
  const pixels = {
    googleAnalytics: [] as string[],
    googleTagManager: [] as string[],
    metaPixel: [] as string[],
    linkedinInsight: [] as string[],
    tiktokPixel: [] as string[],
  };

  // Google Analytics (GA4)
  const gaMatch = html.match(/G-[A-Z0-9]{10}/g);
  if (gaMatch) pixels.googleAnalytics = [...new Set(gaMatch)];

  // Google Tag Manager
  const gtmMatch = html.match(/GTM-[A-Z0-9]+/g);
  if (gtmMatch) pixels.googleTagManager = [...new Set(gtmMatch)];

  // Meta Pixel (Facebook)
  const fbMatch = html.match(/fbq\('init',\s*'(\d+)'/g);
  if (fbMatch) {
    pixels.metaPixel = fbMatch.map(m => m.match(/\d+/)?.[0] || '').filter(Boolean);
  }

  // LinkedIn Insight Tag
  const liMatch = html.match(/_linkedin_partner_id\s*=\s*"(\d+)"/);
  if (liMatch) pixels.linkedinInsight = [liMatch[1]];

  // TikTok Pixel
  const ttMatch = html.match(/ttq\.load\('([A-Z0-9]+)'/);
  if (ttMatch) pixels.tiktokPixel = [ttMatch[1]];

  return pixels;
}

// ─────────────────────────────────────────────────────────────────
// Performance Metrics
// ─────────────────────────────────────────────────────────────────

function countResources($: cheerio.CheerioAPI): number {
  return (
    $('script').length +
    $('link[rel="stylesheet"]').length +
    $('img').length +
    $('link[rel="preload"]').length
  );
}
