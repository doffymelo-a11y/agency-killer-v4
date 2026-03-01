/**
 * Link Checker Tool - Validate all links on a page in parallel
 * Checks for broken links, redirects, timeouts
 */

import axios, { AxiosError } from 'axios';
import * as cheerio from 'cheerio';
import { validateURL } from '../lib/url-validator.js';
import type { LinkCheckResult, LinkCheckerResult } from '../types.js';

// ─────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────

const REQUEST_TIMEOUT = 10000; // 10s timeout per link check
const MAX_CONCURRENT_CHECKS = 10; // Check 10 links at a time
const MAX_LINKS_TO_CHECK = 100; // Limit total links to prevent abuse
const USER_AGENT = 'Mozilla/5.0 (compatible; LinkChecker/1.0)';

// ─────────────────────────────────────────────────────────────────
// Main Function
// ─────────────────────────────────────────────────────────────────

export async function linkChecker(url: string): Promise<LinkCheckerResult> {
  // 1. Validate URL
  const validation = validateURL(url);
  if (!validation.valid) {
    throw new Error(`Invalid URL: ${validation.reason}`);
  }

  // 2. Fetch HTML and extract links
  const html = await fetchHTML(validation.url!);
  const $ = cheerio.load(html);
  const links = extractLinks($, validation.url!);

  // Limit number of links to check
  const linksToCheck = links.slice(0, MAX_LINKS_TO_CHECK);

  // 3. Check all links in parallel (with concurrency limit)
  const results = await checkLinksInParallel(linksToCheck);

  // 4. Build summary
  const summary = buildSummary(results);

  const result: LinkCheckerResult = {
    url: validation.url!,
    totalLinks: linksToCheck.length,
    results,
    summary,
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
      },
      maxRedirects: 5,
      validateStatus: (status) => status >= 200 && status < 400,
    });

    return response.data;
  } catch (error: any) {
    throw new Error(`Failed to fetch page: ${error.message}`);
  }
}

// ─────────────────────────────────────────────────────────────────
// Link Extraction
// ─────────────────────────────────────────────────────────────────

function extractLinks($: cheerio.CheerioAPI, baseURL: string): string[] {
  const links: string[] = [];
  const seen = new Set<string>();

  $('a[href]').each((_, el) => {
    let href = $(el).attr('href');
    if (!href) return;

    // Skip anchors, mailto, tel, javascript
    if (
      href.startsWith('#') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:') ||
      href.startsWith('javascript:')
    ) {
      return;
    }

    // Resolve relative URLs
    try {
      const absoluteURL = new URL(href, baseURL).toString();

      // Skip duplicates
      if (seen.has(absoluteURL)) return;
      seen.add(absoluteURL);

      links.push(absoluteURL);
    } catch {
      // Invalid URL, skip
    }
  });

  return links;
}

// ─────────────────────────────────────────────────────────────────
// Parallel Link Checking
// ─────────────────────────────────────────────────────────────────

async function checkLinksInParallel(links: string[]): Promise<LinkCheckResult[]> {
  const results: LinkCheckResult[] = [];

  // Process in batches to limit concurrency
  for (let i = 0; i < links.length; i += MAX_CONCURRENT_CHECKS) {
    const batch = links.slice(i, i + MAX_CONCURRENT_CHECKS);
    const batchResults = await Promise.all(batch.map(checkLink));
    results.push(...batchResults);
  }

  return results;
}

async function checkLink(url: string): Promise<LinkCheckResult> {
  const startTime = Date.now();

  try {
    const response = await axios.head(url, {
      timeout: REQUEST_TIMEOUT,
      headers: { 'User-Agent': USER_AGENT },
      maxRedirects: 0, // Don't follow redirects (we want to detect them)
      validateStatus: () => true, // Accept all status codes
    });

    const responseTime = Date.now() - startTime;
    const statusCode = response.status;

    // Categorize status
    if (statusCode >= 200 && statusCode < 300) {
      return {
        url,
        status: 'success',
        statusCode,
        responseTime,
      };
    } else if (statusCode >= 300 && statusCode < 400) {
      return {
        url,
        status: 'redirect',
        statusCode,
        redirectUrl: response.headers.location || undefined,
        responseTime,
      };
    } else if (statusCode >= 400 && statusCode < 500) {
      return {
        url,
        status: 'client_error',
        statusCode,
        responseTime,
        error: getStatusMessage(statusCode),
      };
    } else if (statusCode >= 500) {
      return {
        url,
        status: 'server_error',
        statusCode,
        responseTime,
        error: getStatusMessage(statusCode),
      };
    }

    return {
      url,
      status: 'error',
      statusCode,
      responseTime,
      error: 'Unknown status code',
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    // Check if timeout
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return {
        url,
        status: 'timeout',
        responseTime,
        error: `Request timed out after ${REQUEST_TIMEOUT}ms`,
      };
    }

    // Check for redirect (axios throws on 3xx when maxRedirects=0)
    if (error.response && error.response.status >= 300 && error.response.status < 400) {
      return {
        url,
        status: 'redirect',
        statusCode: error.response.status,
        redirectUrl: error.response.headers.location || undefined,
        responseTime,
      };
    }

    // Other errors (DNS, connection refused, etc.)
    return {
      url,
      status: 'error',
      responseTime,
      error: error.message || 'Unknown error',
    };
  }
}

// ─────────────────────────────────────────────────────────────────
// Summary Builder
// ─────────────────────────────────────────────────────────────────

function buildSummary(results: LinkCheckResult[]) {
  const summary = {
    success: 0,
    redirects: 0,
    clientErrors: 0,
    serverErrors: 0,
    timeouts: 0,
    errors: 0,
  };

  for (const result of results) {
    switch (result.status) {
      case 'success':
        summary.success++;
        break;
      case 'redirect':
        summary.redirects++;
        break;
      case 'client_error':
        summary.clientErrors++;
        break;
      case 'server_error':
        summary.serverErrors++;
        break;
      case 'timeout':
        summary.timeouts++;
        break;
      case 'error':
        summary.errors++;
        break;
    }
  }

  return summary;
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function getStatusMessage(statusCode: number): string {
  const messages: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    408: 'Request Timeout',
    410: 'Gone',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
  };

  return messages[statusCode] || `HTTP ${statusCode}`;
}
