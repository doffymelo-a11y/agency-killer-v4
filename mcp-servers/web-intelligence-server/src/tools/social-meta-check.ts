/**
 * Social Meta Check Tool - Validate Open Graph + Twitter Cards
 * Checks social sharing meta tags and provides recommendations
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { validateURL } from '../lib/url-validator.js';
import type { SocialMetaCheckResult } from '../types.js';

// ─────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────

const REQUEST_TIMEOUT = 15000;
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Recommended sizes
const OG_IMAGE_MIN_WIDTH = 1200;
const OG_IMAGE_MIN_HEIGHT = 630;
const TWITTER_IMAGE_MIN_WIDTH = 1200;
const TWITTER_IMAGE_MIN_HEIGHT = 600;

// ─────────────────────────────────────────────────────────────────
// Main Function
// ─────────────────────────────────────────────────────────────────

export async function socialMetaCheck(url: string): Promise<SocialMetaCheckResult> {
  // 1. Validate URL
  const validation = validateURL(url);
  if (!validation.valid) {
    throw new Error(`Invalid URL: ${validation.reason}`);
  }

  // 2. Fetch HTML
  const html = await fetchHTML(validation.url!);

  // 3. Parse with Cheerio
  const $ = cheerio.load(html);

  // 4. Extract all meta tags
  const openGraph = extractOpenGraph($);
  const twitterCard = extractTwitterCard($);
  const basicMeta = extractBasicMeta($);

  // 5. Validate and build issues/recommendations
  const issues: string[] = [];
  const recommendations: string[] = [];

  validateMetaTags(openGraph, twitterCard, basicMeta, issues, recommendations);

  const result: SocialMetaCheckResult = {
    url: validation.url!,
    openGraph,
    twitterCard,
    basicMeta,
    issues,
    recommendations,
    checkedAt: new Date().toISOString(),
  };

  return result;
}

// ─────────────────────────────────────────────────────────────────
// HTTP Fetching
// ─────────────────────────────────────────────────────────────────

async function fetchHTML(url: string): Promise<string> {
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

    return response.data;
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
// Meta Tag Extraction
// ─────────────────────────────────────────────────────────────────

function extractOpenGraph($: cheerio.CheerioAPI) {
  return {
    title: $('meta[property="og:title"]').attr('content')?.trim() || undefined,
    description: $('meta[property="og:description"]').attr('content')?.trim() || undefined,
    image: $('meta[property="og:image"]').attr('content')?.trim() || undefined,
    url: $('meta[property="og:url"]').attr('content')?.trim() || undefined,
    type: $('meta[property="og:type"]').attr('content')?.trim() || undefined,
    siteName: $('meta[property="og:site_name"]').attr('content')?.trim() || undefined,
    locale: $('meta[property="og:locale"]').attr('content')?.trim() || undefined,
  };
}

function extractTwitterCard($: cheerio.CheerioAPI) {
  return {
    card: $('meta[name="twitter:card"]').attr('content')?.trim() || undefined,
    site: $('meta[name="twitter:site"]').attr('content')?.trim() || undefined,
    creator: $('meta[name="twitter:creator"]').attr('content')?.trim() || undefined,
    title: $('meta[name="twitter:title"]').attr('content')?.trim() || undefined,
    description: $('meta[name="twitter:description"]').attr('content')?.trim() || undefined,
    image: $('meta[name="twitter:image"]').attr('content')?.trim() || undefined,
  };
}

function extractBasicMeta($: cheerio.CheerioAPI) {
  return {
    title: $('title').first().text().trim(),
    description: $('meta[name="description"]').attr('content')?.trim() || undefined,
    keywords: $('meta[name="keywords"]').attr('content')?.trim() || undefined,
  };
}

// ─────────────────────────────────────────────────────────────────
// Validation Logic
// ─────────────────────────────────────────────────────────────────

function validateMetaTags(
  og: any,
  twitter: any,
  basic: any,
  issues: string[],
  recommendations: string[]
) {
  // ─── Open Graph Validation ───
  if (!og.title) {
    issues.push('Missing og:title');
    recommendations.push('Add <meta property="og:title" content="Your Page Title">');
  } else if (og.title.length < 10) {
    issues.push('og:title is too short (< 10 characters)');
  } else if (og.title.length > 60) {
    issues.push('og:title is too long (> 60 characters)');
    recommendations.push('Keep og:title between 40-60 characters for optimal display');
  }

  if (!og.description) {
    issues.push('Missing og:description');
    recommendations.push('Add <meta property="og:description" content="Your description">');
  } else if (og.description.length < 50) {
    issues.push('og:description is too short (< 50 characters)');
  } else if (og.description.length > 200) {
    issues.push('og:description is too long (> 200 characters)');
    recommendations.push('Keep og:description between 100-200 characters');
  }

  if (!og.image) {
    issues.push('Missing og:image');
    recommendations.push(
      `Add <meta property="og:image" content="URL"> with minimum ${OG_IMAGE_MIN_WIDTH}x${OG_IMAGE_MIN_HEIGHT}px`
    );
  } else if (!og.image.startsWith('http')) {
    issues.push('og:image must be an absolute URL (starts with http/https)');
  }

  if (!og.url) {
    issues.push('Missing og:url');
    recommendations.push('Add <meta property="og:url" content="Canonical URL">');
  }

  if (!og.type) {
    recommendations.push('Add <meta property="og:type" content="website"> for better classification');
  }

  if (!og.siteName) {
    recommendations.push('Add <meta property="og:site_name" content="Your Brand"> for branding');
  }

  // ─── Twitter Card Validation ───
  if (!twitter.card) {
    issues.push('Missing twitter:card');
    recommendations.push('Add <meta name="twitter:card" content="summary_large_image">');
  } else if (!['summary', 'summary_large_image', 'app', 'player'].includes(twitter.card)) {
    issues.push(`Invalid twitter:card value: "${twitter.card}"`);
  }

  if (!twitter.title) {
    recommendations.push(
      'Add <meta name="twitter:title"> (or Twitter will fall back to og:title)'
    );
  } else if (twitter.title.length > 70) {
    issues.push('twitter:title is too long (> 70 characters)');
  }

  if (!twitter.description) {
    recommendations.push(
      'Add <meta name="twitter:description"> (or Twitter will fall back to og:description)'
    );
  } else if (twitter.description.length > 200) {
    issues.push('twitter:description is too long (> 200 characters)');
  }

  if (!twitter.image && !og.image) {
    issues.push('No twitter:image or og:image found');
  } else if (twitter.image && !twitter.image.startsWith('http')) {
    issues.push('twitter:image must be an absolute URL');
  }

  if (!twitter.site) {
    recommendations.push('Add <meta name="twitter:site" content="@yourbrand"> for attribution');
  }

  // ─── Basic Meta Validation ───
  if (!basic.title) {
    issues.push('Missing <title> tag');
  } else if (basic.title.length < 30) {
    issues.push('Page title is too short (< 30 characters)');
  } else if (basic.title.length > 60) {
    issues.push('Page title is too long (> 60 characters)');
    recommendations.push('Keep page title between 50-60 characters for SEO');
  }

  if (!basic.description) {
    issues.push('Missing meta description');
    recommendations.push('Add <meta name="description" content="..."> for SEO');
  } else if (basic.description.length < 70) {
    issues.push('Meta description is too short (< 70 characters)');
  } else if (basic.description.length > 160) {
    issues.push('Meta description is too long (> 160 characters)');
    recommendations.push('Keep meta description between 120-160 characters for SEO');
  }

  // ─── Consistency Checks ───
  if (og.title && twitter.title && og.title !== twitter.title) {
    recommendations.push(
      'og:title and twitter:title differ — consider using the same title for consistency'
    );
  }

  if (og.description && twitter.description && og.description !== twitter.description) {
    recommendations.push(
      'og:description and twitter:description differ — consider using the same description'
    );
  }

  // ─── Summary ───
  if (issues.length === 0 && recommendations.length === 0) {
    recommendations.push('All social meta tags are properly configured!');
  }
}
