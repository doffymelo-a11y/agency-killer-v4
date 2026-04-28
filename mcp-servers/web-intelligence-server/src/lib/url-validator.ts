/**
 * URL Validator - Security-first URL validation
 * Protects against SSRF, blocked domains, and malicious URLs
 */

import type { URLValidationResult } from '../types.js';

// ─────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────

const BLOCKED_DOMAINS = [
  // Localhost / loopback
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',

  // SECURITY FIX: IPv4-mapped IPv6 loopback
  '::ffff:127.',
  '::ffff:0.',

  // Private IP ranges (SSRF protection)
  '10.', // 10.0.0.0/8
  '172.16.', '172.17.', '172.18.', '172.19.', // 172.16.0.0/12
  '172.20.', '172.21.', '172.22.', '172.23.',
  '172.24.', '172.25.', '172.26.', '172.27.',
  '172.28.', '172.29.', '172.30.', '172.31.',
  '192.168.', // 192.168.0.0/16
  '169.254.', // Link-local

  // SECURITY FIX: IPv4-mapped IPv6 private ranges
  '::ffff:10.', // 10.0.0.0/8
  '::ffff:172.16.', '::ffff:172.17.', '::ffff:172.18.', '::ffff:172.19.',
  '::ffff:172.20.', '::ffff:172.21.', '::ffff:172.22.', '::ffff:172.23.',
  '::ffff:172.24.', '::ffff:172.25.', '::ffff:172.26.', '::ffff:172.27.',
  '::ffff:172.28.', '::ffff:172.29.', '::ffff:172.30.', '::ffff:172.31.',
  '::ffff:192.168.', // 192.168.0.0/16
  '::ffff:169.254.', // Link-local

  // Meta addresses
  '0.0.0.0',
  '255.255.255.255',
];

const BLOCKED_TLD = [
  '.gov', // Government
  '.mil', // Military
  '.local', // Local network
  '.internal', // Internal network
  '.onion', // Tor hidden services
];

const ALLOWED_PROTOCOLS = ['http:', 'https:'];

// ─────────────────────────────────────────────────────────────────
// Validation Functions
// ─────────────────────────────────────────────────────────────────

/**
 * Validate URL for security and accessibility
 */
export function validateURL(urlString: string): URLValidationResult {
  // Basic format validation
  let url: URL;
  try {
    url = new URL(urlString);
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid URL format',
      reason: 'Could not parse URL',
    };
  }

  // Protocol check
  if (!ALLOWED_PROTOCOLS.includes(url.protocol)) {
    return {
      valid: false,
      error: 'Invalid protocol',
      reason: `Only HTTP and HTTPS are allowed. Got: ${url.protocol}`,
    };
  }

  // Hostname check
  const hostname = url.hostname.toLowerCase();

  // Check blocked domains
  for (const blocked of BLOCKED_DOMAINS) {
    if (hostname === blocked || hostname.startsWith(blocked)) {
      return {
        valid: false,
        error: 'Blocked domain',
        reason: `Domain "${hostname}" is blocked for security reasons (SSRF protection)`,
      };
    }
  }

  // Check blocked TLDs
  for (const tld of BLOCKED_TLD) {
    if (hostname.endsWith(tld)) {
      return {
        valid: false,
        error: 'Blocked TLD',
        reason: `TLD "${tld}" is not allowed for scraping`,
      };
    }
  }

  // Check for IP addresses (additional SSRF protection)
  if (isPrivateIP(hostname)) {
    return {
      valid: false,
      error: 'Private IP address',
      reason: 'Scraping private IP addresses is not allowed (SSRF protection)',
    };
  }

  // All checks passed
  return {
    valid: true,
    url: url.toString(),
  };
}

/**
 * Check if hostname is a private IP address
 * SECURITY: Also detects IPv4-mapped IPv6 addresses (::ffff:192.168.1.1)
 */
function isPrivateIP(hostname: string): boolean {
  // IPv6 check FIRST (includes IPv4-mapped IPv6)
  if (hostname.includes(':')) {
    const lowerHost = hostname.toLowerCase();

    // fc00::/7 (Unique Local Addresses)
    if (lowerHost.startsWith('fc') || lowerHost.startsWith('fd')) {
      return true;
    }

    // fe80::/10 (Link-local)
    if (lowerHost.startsWith('fe80')) {
      return true;
    }

    // ::1 (loopback)
    if (lowerHost === '::1' || lowerHost === '0:0:0:0:0:0:0:1') {
      return true;
    }

    // SECURITY FIX: IPv4-mapped IPv6 addresses (::ffff:x.x.x.x)
    // Format: ::ffff:192.168.1.1 or ::ffff:c0a8:0101 (hex)
    const ipv4MappedRegex = /::ffff:(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/i;
    const mappedMatch = lowerHost.match(ipv4MappedRegex);

    if (mappedMatch) {
      // Extract IPv4 octets and check if private
      const octets = mappedMatch.slice(1, 5).map(Number);

      // 10.0.0.0/8
      if (octets[0] === 10) return true;

      // 172.16.0.0/12
      if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) return true;

      // 192.168.0.0/16
      if (octets[0] === 192 && octets[1] === 168) return true;

      // 127.0.0.0/8 (loopback)
      if (octets[0] === 127) return true;

      // 169.254.0.0/16 (link-local)
      if (octets[0] === 169 && octets[1] === 254) return true;

      // 0.0.0.0/8
      if (octets[0] === 0) return true;

      // Broadcast
      if (octets.every(o => o === 255)) return true;
    }

    // No private IPv6 detected
    return false;
  }

  // IPv4 regex
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = hostname.match(ipv4Regex);

  if (!match) {
    // Not an IP address (domain name)
    return false;
  }

  const octets = match.slice(1, 5).map(Number);

  // Check private ranges
  // 10.0.0.0/8
  if (octets[0] === 10) return true;

  // 172.16.0.0/12
  if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) return true;

  // 192.168.0.0/16
  if (octets[0] === 192 && octets[1] === 168) return true;

  // 127.0.0.0/8 (loopback)
  if (octets[0] === 127) return true;

  // 169.254.0.0/16 (link-local)
  if (octets[0] === 169 && octets[1] === 254) return true;

  // 0.0.0.0/8
  if (octets[0] === 0) return true;

  // 255.255.255.255 (broadcast)
  if (octets.every(o => o === 255)) return true;

  return false;
}

/**
 * Normalize URL (remove tracking parameters, fragments)
 */
export function normalizeURL(urlString: string): string {
  try {
    const url = new URL(urlString);

    // Remove common tracking parameters
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'fbclid', 'gclid', 'msclkid', '_ga', 'mc_cid', 'mc_eid',
    ];

    trackingParams.forEach(param => {
      url.searchParams.delete(param);
    });

    // Remove fragment
    url.hash = '';

    return url.toString();
  } catch {
    return urlString;
  }
}

/**
 * Extract domain from URL
 */
export function extractDomain(urlString: string): string | null {
  try {
    const url = new URL(urlString);
    return url.hostname;
  } catch {
    return null;
  }
}

/**
 * Check if URL is external (different domain)
 */
export function isExternalURL(baseURL: string, targetURL: string): boolean {
  try {
    const base = new URL(baseURL);
    const target = new URL(targetURL, baseURL);
    return base.hostname !== target.hostname;
  } catch {
    return true; // Assume external if parsing fails
  }
}
