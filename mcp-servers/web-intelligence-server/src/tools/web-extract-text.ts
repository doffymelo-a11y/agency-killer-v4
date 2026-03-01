/**
 * Web Extract Text Tool - Clean article text extraction with Readability
 * Uses @mozilla/readability to extract main content (removes nav, ads, etc.)
 */

import axios from 'axios';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { validateURL } from '../lib/url-validator.js';
import { sanitizeTextExtraction, createExcerpt, htmlToText } from '../lib/sanitizer.js';
import type { TextExtractionResult } from '../types.js';

// ─────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────

const REQUEST_TIMEOUT = 15000; // 15s max pour fetch
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// ─────────────────────────────────────────────────────────────────
// Main Function
// ─────────────────────────────────────────────────────────────────

export async function webExtractText(url: string, removePII = true): Promise<TextExtractionResult> {
  // 1. Validate URL (security check)
  const validation = validateURL(url);
  if (!validation.valid) {
    throw new Error(`Invalid URL: ${validation.reason}`);
  }

  // 2. Fetch HTML
  const html = await fetchHTML(validation.url!);

  // 3. Parse with JSDOM
  const dom = new JSDOM(html, { url: validation.url });
  const document = dom.window.document;

  // 4. Extract with Readability
  const reader = new Readability(document);
  const article = reader.parse();

  if (!article) {
    throw new Error('Failed to extract article content. Page may not be article-like.');
  }

  // 5. Clean and sanitize text
  const textContent = htmlToText(article.content);
  const sanitizedText = sanitizeTextExtraction(textContent, removePII);

  // 6. Build result
  const result: TextExtractionResult = {
    url: validation.url!,
    title: article.title || 'Untitled',
    author: article.byline || undefined,
    content: article.content, // HTML content (cleaned by Readability)
    textContent: sanitizedText, // Plain text (cleaned + sanitized)
    length: sanitizedText.length,
    excerpt: createExcerpt(sanitizedText, 50), // First 50 words
    siteName: article.siteName || undefined,
    publishedTime: extractPublishedTime(document),
    extractedAt: new Date().toISOString(),
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
// Helper Functions
// ─────────────────────────────────────────────────────────────────

/**
 * Extract published time from common meta tags
 */
function extractPublishedTime(document: Document): string | undefined {
  // Try article:published_time (Open Graph)
  const ogPublished = document.querySelector('meta[property="article:published_time"]');
  if (ogPublished) {
    return ogPublished.getAttribute('content') || undefined;
  }

  // Try datePublished (Schema.org)
  const schemaPublished = document.querySelector('meta[itemprop="datePublished"]');
  if (schemaPublished) {
    return schemaPublished.getAttribute('content') || undefined;
  }

  // Try time element with datetime
  const timeElement = document.querySelector('time[datetime]');
  if (timeElement) {
    return timeElement.getAttribute('datetime') || undefined;
  }

  return undefined;
}
