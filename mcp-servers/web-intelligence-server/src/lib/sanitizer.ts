/**
 * Content Sanitizer - Clean and truncate extracted content
 * Removes scripts, PII, and limits size for LLM context
 */

// ─────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────

const MAX_CONTENT_LENGTH = 50 * 1024; // 50KB max per content block
const MAX_TEXT_LENGTH = 100 * 1024; // 100KB max for text extraction

// PII patterns (simplified - production would use more sophisticated detection)
const PII_PATTERNS = [
  // Email addresses
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,

  // Phone numbers (US/International formats)
  /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,

  // Credit card numbers (simple pattern)
  /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,

  // SSN-like patterns
  /\b\d{3}-\d{2}-\d{4}\b/g,
];

// ─────────────────────────────────────────────────────────────────
// Sanitization Functions
// ─────────────────────────────────────────────────────────────────

/**
 * Sanitize HTML content - remove scripts, styles, dangerous elements
 */
export function sanitizeHTML(html: string): string {
  let sanitized = html;

  // Remove script tags and content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove style tags and content
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Remove inline event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');

  // Remove javascript: protocol in links
  sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"');

  // Remove data URIs in img src (can contain embedded scripts)
  sanitized = sanitized.replace(/src\s*=\s*["']data:[^"']*["']/gi, 'src=""');

  return sanitized;
}

/**
 * Remove PII from text content
 */
export function removePII(text: string): string {
  let cleaned = text;

  for (const pattern of PII_PATTERNS) {
    cleaned = cleaned.replace(pattern, '[REDACTED]');
  }

  return cleaned;
}

/**
 * Truncate content to max length
 */
export function truncateContent(content: string, maxLength: number = MAX_CONTENT_LENGTH): string {
  if (content.length <= maxLength) {
    return content;
  }

  // Truncate and add ellipsis
  const truncated = content.substring(0, maxLength - 3);

  // Try to truncate at last sentence boundary
  const lastPeriod = truncated.lastIndexOf('.');
  const lastNewline = truncated.lastIndexOf('\n');
  const cutPoint = Math.max(lastPeriod, lastNewline);

  if (cutPoint > maxLength * 0.8) {
    // Cut at sentence/paragraph boundary if it's not too far back
    return truncated.substring(0, cutPoint + 1) + '...';
  }

  return truncated + '...';
}

/**
 * Clean whitespace (normalize multiple spaces, newlines)
 */
export function cleanWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
    .replace(/ {2,}/g, ' ') // Multiple spaces → single space
    .replace(/\t/g, '  ') // Tabs → 2 spaces
    .trim();
}

/**
 * Extract visible text from HTML (strip tags)
 */
export function htmlToText(html: string): string {
  let text = html;

  // Remove script and style first
  text = sanitizeHTML(text);

  // Replace block elements with newlines
  text = text.replace(/<\/(div|p|h[1-6]|li|tr|br)>/gi, '\n');

  // Remove all HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  text = decodeHTMLEntities(text);

  // Clean whitespace
  text = cleanWhitespace(text);

  return text;
}

/**
 * Decode HTML entities
 */
function decodeHTMLEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' ',
    '&mdash;': '—',
    '&ndash;': '–',
    '&hellip;': '...',
  };

  let decoded = text;
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.split(entity).join(char);
  }

  // Decode numeric entities
  decoded = decoded.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec));
  decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

  return decoded;
}

/**
 * Sanitize full scraping result (combine all sanitization)
 */
export function sanitizeScrapedContent(content: string, removePIIFlag = true): string {
  let sanitized = content;

  // 1. Remove dangerous HTML
  sanitized = sanitizeHTML(sanitized);

  // 2. Remove PII if requested
  if (removePIIFlag) {
    sanitized = removePII(sanitized);
  }

  // 3. Truncate to max length
  sanitized = truncateContent(sanitized, MAX_CONTENT_LENGTH);

  return sanitized;
}

/**
 * Sanitize text extraction (Readability output)
 */
export function sanitizeTextExtraction(text: string, removePIIFlag = true): string {
  let sanitized = text;

  // 1. Clean whitespace
  sanitized = cleanWhitespace(sanitized);

  // 2. Remove PII if requested
  if (removePIIFlag) {
    sanitized = removePII(sanitized);
  }

  // 3. Truncate to max length (larger limit for text)
  sanitized = truncateContent(sanitized, MAX_TEXT_LENGTH);

  return sanitized;
}

/**
 * Sanitize URL for display (remove auth credentials)
 */
export function sanitizeURLForDisplay(url: string): string {
  try {
    const urlObj = new URL(url);
    // Remove username:password if present
    urlObj.username = '';
    urlObj.password = '';
    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * Create excerpt from text (first N words)
 */
export function createExcerpt(text: string, wordLimit = 50): string {
  const words = text.split(/\s+/);
  if (words.length <= wordLimit) {
    return text;
  }
  return words.slice(0, wordLimit).join(' ') + '...';
}
