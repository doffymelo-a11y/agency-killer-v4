// ═══════════════════════════════════════════════════════════════
// THE HIVE OS V4 - Input Validation & Sanitization Utilities
// Shared utilities for all MCP servers (CRITICAL-005, MEDIUM-001 Fix)
// ═══════════════════════════════════════════════════════════════

/**
 * Sanitizes string input to prevent XSS and injection attacks
 * @param {string} input - Raw string input
 * @param {number} maxLength - Maximum allowed length (default: 500)
 * @returns {string} Sanitized string
 */
function sanitizeString(input, maxLength = 500) {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string');
  }

  return input
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove special characters that could be used in injection
    .replace(/[<>;"'`]/g, '')
    // Trim whitespace
    .trim()
    // Limit length
    .substring(0, maxLength);
}

/**
 * Validates and sanitizes a URL
 * @param {string} url - URL to validate
 * @returns {string} Validated URL
 * @throws {Error} If URL is invalid
 */
function validateUrl(url) {
  if (typeof url !== 'string') {
    throw new Error('URL must be a string');
  }

  // Check if URL is valid
  try {
    const parsedUrl = new URL(url);

    // Only allow http and https
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Only HTTP and HTTPS URLs are allowed');
    }

    return parsedUrl.toString();
  } catch (error) {
    throw new Error(`Invalid URL: ${error.message}`);
  }
}

/**
 * Validates a number is within a safe range
 * @param {number} value - Number to validate
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {number} Validated number
 * @throws {Error} If number is out of range
 */
function validateNumber(value, min = 0, max = Number.MAX_SAFE_INTEGER) {
  const num = Number(value);

  if (isNaN(num)) {
    throw new Error('Value must be a valid number');
  }

  if (num < min || num > max) {
    throw new Error(`Value must be between ${min} and ${max}`);
  }

  return num;
}

/**
 * Validates a date range
 * @param {string} dateRange - Date range string (e.g., "LAST_30_DAYS")
 * @returns {string} Validated date range
 * @throws {Error} If date range is invalid
 */
function validateDateRange(dateRange) {
  const validRanges = [
    'TODAY',
    'YESTERDAY',
    'LAST_7_DAYS',
    'LAST_14_DAYS',
    'LAST_30_DAYS',
    'LAST_90_DAYS',
    'THIS_MONTH',
    'LAST_MONTH',
    'THIS_YEAR',
    'LAST_YEAR',
  ];

  if (!validRanges.includes(dateRange)) {
    throw new Error(`Invalid date range. Must be one of: ${validRanges.join(', ')}`);
  }

  return dateRange;
}

/**
 * Validates an email address
 * @param {string} email - Email to validate
 * @returns {string} Validated email
 * @throws {Error} If email is invalid
 */
function validateEmail(email) {
  if (typeof email !== 'string') {
    throw new Error('Email must be a string');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }

  return email.toLowerCase().trim();
}

/**
 * Sanitizes error messages to prevent credential leakage
 * @param {string} errorMessage - Raw error message
 * @returns {string} Sanitized error message
 */
function sanitizeError(errorMessage) {
  if (typeof errorMessage !== 'string') {
    return 'An error occurred';
  }

  return errorMessage
    // Remove API keys
    .replace(/api[_-]?key[s]?[:=]\s*[\w-]+/gi, 'API_KEY=***')
    // Remove tokens
    .replace(/token[:=]\s*[\w-]+/gi, 'TOKEN=***')
    // Remove passwords
    .replace(/password[:=]\s*[\w-]+/gi, 'PASSWORD=***')
    // Remove access tokens
    .replace(/access[_-]?token[:=]\s*[\w-]+/gi, 'ACCESS_TOKEN=***');
}

/**
 * Validates campaign/ad set/ad configuration objects
 * @param {object} config - Configuration object
 * @param {string[]} requiredFields - Array of required field names
 * @returns {object} Validated configuration
 * @throws {Error} If required fields are missing
 */
function validateConfig(config, requiredFields = []) {
  if (typeof config !== 'object' || config === null) {
    throw new Error('Configuration must be an object');
  }

  // Check required fields
  for (const field of requiredFields) {
    if (!(field in config) || config[field] === null || config[field] === undefined) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  return config;
}

/**
 * Validates and sanitizes campaign configuration
 * @param {object} config - Campaign configuration
 * @returns {object} Sanitized configuration
 */
function sanitizeCampaignConfig(config) {
  validateConfig(config, ['name', 'objective']);

  return {
    ...config,
    name: sanitizeString(config.name, 255),
    objective: sanitizeString(config.objective, 100),
    // Sanitize other string fields
    ...(config.description && { description: sanitizeString(config.description, 1000) }),
  };
}

module.exports = {
  sanitizeString,
  validateUrl,
  validateNumber,
  validateDateRange,
  validateEmail,
  sanitizeError,
  validateConfig,
  sanitizeCampaignConfig,
};
