/**
 * Environment Variables Validator
 * SECURITY: Validates required environment variables at startup
 * Prevents app from running with missing or placeholder values
 */

interface EnvValidationResult {
  valid: boolean;
  errors: string[];
}

const REQUIRED_ENV_VARS = {
  VITE_SUPABASE_URL: 'Supabase URL',
  VITE_SUPABASE_ANON_KEY: 'Supabase Anonymous Key',
  VITE_BACKEND_API_URL: 'Backend API URL',
} as const;

const PLACEHOLDER_VALUES = [
  'your-project-url',
  'your-anon-key',
  'your-backend-url',
  'localhost:3000',
  'placeholder',
  'example.com',
  'changeme',
  'undefined',
  'null',
  '',
];

/**
 * Validate required environment variables
 * @throws Error if validation fails
 */
export function validateEnvironment(): EnvValidationResult {
  const errors: string[] = [];

  // Check each required env var
  for (const [key, description] of Object.entries(REQUIRED_ENV_VARS)) {
    const value = import.meta.env[key];

    // Check if missing
    if (!value) {
      errors.push(`❌ Missing ${description} (${key})`);
      continue;
    }

    // Check if placeholder value
    const lowerValue = value.toLowerCase();
    const isPlaceholder = PLACEHOLDER_VALUES.some((placeholder) =>
      lowerValue.includes(placeholder.toLowerCase())
    );

    if (isPlaceholder) {
      errors.push(`❌ ${description} (${key}) appears to be a placeholder value: "${value}"`);
      continue;
    }

    // Additional validation for URLs
    if (key.includes('URL')) {
      try {
        new URL(value);
      } catch {
        errors.push(`❌ ${description} (${key}) is not a valid URL: "${value}"`);
      }
    }

    // Additional validation for Supabase keys (should be long alphanumeric strings)
    if (key.includes('KEY')) {
      if (value.length < 30) {
        errors.push(`❌ ${description} (${key}) is too short (expected at least 30 chars)`);
      }
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, errors: [] };
}

/**
 * Validate and throw if invalid
 * Called at app startup
 */
export function validateEnvironmentOrThrow(): void {
  const result = validateEnvironment();

  if (!result.valid) {
    const errorMessage = [
      '🚨 Environment Configuration Error',
      '',
      'The following environment variables are missing or invalid:',
      '',
      ...result.errors,
      '',
      'Please check your .env file and ensure all required variables are set.',
      'See .env.example for reference.',
    ].join('\n');

    console.error(errorMessage);

    // Show user-friendly error
    throw new Error(
      'App configuration error. Please check the console for details. ' +
        'Contact your administrator if this persists.'
    );
  }

  console.log('✅ Environment validation passed');
}

/**
 * Get current environment configuration (for debugging)
 */
export function getEnvironmentInfo() {
  const mode = import.meta.env.MODE;
  const dev = import.meta.env.DEV;

  return {
    mode,
    dev,
    vars: {
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL
        ? `${import.meta.env.VITE_SUPABASE_URL.substring(0, 20)}...`
        : '(not set)',
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY
        ? `${import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 10)}...`
        : '(not set)',
      VITE_BACKEND_API_URL: import.meta.env.VITE_BACKEND_API_URL || '(not set)',
    },
  };
}
