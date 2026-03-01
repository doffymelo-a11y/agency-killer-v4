/**
 * Web Scrape Tool - Structured content extraction with Cheerio
 * Extracts: title, meta, headings, links, images
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { validateURL } from '../lib/url-validator.js';
import { sanitizeScrapedContent, sanitizeURLForDisplay } from '../lib/sanitizer.js';
import type { WebScrapeResult } from '../types.js';

// ─────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────

const REQUEST_TIMEOUT = 15000; // 15s max pour fetch
const MAX_LINKS_PER_TYPE = 100; // Limiter à 100 liens internes/externes chacun
const MAX_IMAGES = 50; // Limiter à 50 images

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// ─────────────────────────────────────────────────────────────────
// Main Function
// ─────────────────────────────────────────────────────────────────

export async function webScrape(url: string): Promise<WebScrapeResult> {
  // 1. Validate URL (security check)
  const validation = validateURL(url);
  if (!validation.valid) {
    throw new Error(`Invalid URL: ${validation.reason}`);
  }

  // 2. Fetch HTML
  const html = await fetchHTML(validation.url!);

  // 3. Parse with Cheerio
  const $ = cheerio.load(html);

  // 4. Extract structured data
  const result: WebScrapeResult = {
    url: sanitizeURLForDisplay(url),
    title: extractTitle($),
    meta: extractMeta($),
    headings: extractHeadings($),
    links: extractLinks($, url),
    images: extractImages($, url),
    contentLength: html.length,
    scrapedAt: new Date().toISOString(),
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
        'Cache-Control': 'no-cache',
      },
      maxRedirects: 5,
      validateStatus: (status) => status >= 200 && status < 400,
    });

    if (typeof response.data !== 'string') {
      throw new Error('Response is not HTML text');
    }

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
// Extraction Functions
// ─────────────────────────────────────────────────────────────────

function extractTitle($: cheerio.CheerioAPI): string {
  // Try <title> first
  let title = $('title').first().text().trim();

  // Fallback to og:title
  if (!title) {
    title = $('meta[property="og:title"]').attr('content') || '';
  }

  // Fallback to first h1
  if (!title) {
    title = $('h1').first().text().trim();
  }

  return sanitizeScrapedContent(title, false); // No PII removal for titles
}

function extractMeta($: cheerio.CheerioAPI) {
  return {
    description: $('meta[name="description"]').attr('content')?.trim() || undefined,
    keywords: $('meta[name="keywords"]').attr('content')?.trim() || undefined,
    author: $('meta[name="author"]').attr('content')?.trim() || undefined,
    robots: $('meta[name="robots"]').attr('content')?.trim() || undefined,
    canonical: $('link[rel="canonical"]').attr('href')?.trim() || undefined,
  };
}

function extractHeadings($: cheerio.CheerioAPI) {
  const h1: string[] = [];
  const h2: string[] = [];
  const h3: string[] = [];

  $('h1').each((_, el) => {
    const text = $(el).text().trim();
    if (text) h1.push(sanitizeScrapedContent(text, false));
  });

  $('h2').each((_, el) => {
    const text = $(el).text().trim();
    if (text) h2.push(sanitizeScrapedContent(text, false));
  });

  $('h3').each((_, el) => {
    const text = $(el).text().trim();
    if (text) h3.push(sanitizeScrapedContent(text, false));
  });

  return { h1, h2, h3 };
}

function extractLinks($: cheerio.CheerioAPI, baseURL: string) {
  const internal: string[] = [];
  const external: string[] = [];
  const seen = new Set<string>();

  $('a[href]').each((_, el) => {
    let href = $(el).attr('href');
    if (!href) return;

    // Resolve relative URLs
    try {
      const absoluteURL = new URL(href, baseURL).toString();

      // Skip duplicates
      if (seen.has(absoluteURL)) return;
      seen.add(absoluteURL);

      // Classify as internal or external
      const base = new URL(baseURL);
      const link = new URL(absoluteURL);

      if (link.hostname === base.hostname) {
        if (internal.length < MAX_LINKS_PER_TYPE) {
          internal.push(sanitizeURLForDisplay(absoluteURL));
        }
      } else {
        if (external.length < MAX_LINKS_PER_TYPE) {
          external.push(sanitizeURLForDisplay(absoluteURL));
        }
      }
    } catch {
      // Invalid URL, skip
    }
  });

  return { internal, external };
}

function extractImages($: cheerio.CheerioAPI, baseURL: string) {
  const images: Array<{ src: string; alt: string; title?: string }> = [];
  const seen = new Set<string>();

  $('img[src]').each((_, el) => {
    if (images.length >= MAX_IMAGES) return;

    let src = $(el).attr('src');
    if (!src) return;

    // Skip data URIs (base64 images)
    if (src.startsWith('data:')) return;

    // Resolve relative URLs
    try {
      const absoluteURL = new URL(src, baseURL).toString();

      // Skip duplicates
      if (seen.has(absoluteURL)) return;
      seen.add(absoluteURL);

      images.push({
        src: sanitizeURLForDisplay(absoluteURL),
        alt: $(el).attr('alt')?.trim() || '',
        title: $(el).attr('title')?.trim() || undefined,
      });
    } catch {
      // Invalid URL, skip
    }
  });

  return images;
}
