/**
 * Claude Service - Anthropic API client
 * Handles communication with Claude API
 */

import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';
import { AppError } from '../middleware/error.middleware.js';
import type { ClaudeMessage, ClaudeResponse } from '../types/agent.types.js';

dotenv.config();

// ─────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const DEFAULT_MODEL = 'claude-sonnet-4-5-20250929'; // Switched from Opus (5x cheaper, same quality)
const MAX_TOKENS = 4096; // Reduced from 8192 to 4096 for faster responses (avg 15-20s instead of 25-30s)
const CLAUDE_API_TIMEOUT = 30000; // 30 seconds default timeout (optimized Supabase queries allow this)
// V4 B1 — hard ceiling so a hanging agent call cannot keep the request open
// for the full 10-minute Express default; surfaces a 504 quickly.
const CLAUDE_API_TIMEOUT_MAX = 90_000;

if (!ANTHROPIC_API_KEY) {
  console.warn('[Claude Service] Warning: ANTHROPIC_API_KEY not configured');
}

// ─────────────────────────────────────────────────────────────────
// Client
// ─────────────────────────────────────────────────────────────────

export const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
});

// ─────────────────────────────────────────────────────────────────
// Chat Function
// ─────────────────────────────────────────────────────────────────

export interface ChatOptions {
  systemPrompt: string;
  messages: ClaudeMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
  tools?: Anthropic.Tool[];
  enableCache?: boolean; // Enable prompt caching (90% cost reduction on cached tokens)
  timeout?: number; // Custom timeout in ms (overrides default)
}

/**
 * Send a chat message to Claude (internal, no retry)
 */
async function chatInternal(options: ChatOptions): Promise<ClaudeResponse> {
  const {
    systemPrompt,
    messages,
    model = DEFAULT_MODEL,
    maxTokens = MAX_TOKENS,
    temperature = 1.0,
    tools,
    enableCache = true, // Enable caching by default for cost optimization
    timeout: requestedTimeout = CLAUDE_API_TIMEOUT,
  } = options;

  // V4 B1 — clamp custom timeouts to the hard 90s ceiling
  const timeout = Math.min(requestedTimeout, CLAUDE_API_TIMEOUT_MAX);

  // Convert system prompt to cacheable format if enabled
  // This reduces costs by 90% on cached tokens (1024+ tokens, 5min TTL)
  const systemParam = enableCache
    ? [
        {
          type: 'text' as const,
          text: systemPrompt,
          cache_control: { type: 'ephemeral' as const },
        },
      ]
    : systemPrompt;

  // Wrap API call with timeout to prevent hanging requests
  const apiCall = anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    system: systemParam as any, // Type compatibility with SDK
    messages: messages as any, // Type compatibility
    ...(tools && { tools }),
  });

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () =>
        reject(
          new AppError(
            504,
            `Claude API timeout after ${timeout / 1000}s — agent prend trop de temps`,
            'TIMEOUT',
            { timeoutMs: timeout }
          )
        ),
      timeout
    )
  );

  const response = await Promise.race([apiCall, timeoutPromise]);

  return response as ClaudeResponse;
}

/**
 * Send a chat message to Claude with automatic retry on timeout or server errors
 */
export async function chat(options: ChatOptions): Promise<ClaudeResponse> {
  try {
    return await chatInternal(options);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const isTimeout = error instanceof AppError && error.code === 'TIMEOUT';
    const shouldRetry =
      !isTimeout &&
      (message.includes('500') ||
        message.includes('503') ||
        message.includes('api_error'));

    if (shouldRetry) {
      console.warn(`[Claude Service] Server error (${message}), retrying with reduced tokens...`);
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return await chatInternal({
          ...options,
          maxTokens: Math.floor((options.maxTokens || MAX_TOKENS) * 0.8),
          timeout: options.timeout,
        });
      } catch (retryError: unknown) {
        console.error('[Claude Service] Retry failed:', retryError);
        if (retryError instanceof AppError) throw retryError;
        const retryMessage = retryError instanceof Error ? retryError.message : String(retryError);
        throw new AppError(502, `Claude API error after retry: ${retryMessage}`, 'CLAUDE_API_ERROR');
      }
    }

    // Preserve typed errors (TIMEOUT etc.) so the route can map to 504/etc.
    if (error instanceof AppError) throw error;

    console.error('[Claude Service] API Error:', error);
    throw new AppError(502, `Claude API error: ${message}`, 'CLAUDE_API_ERROR');
  }
}

/**
 * Simple chat without tools
 */
export async function simpleChat(
  systemPrompt: string,
  userMessage: string,
  model?: string
): Promise<string> {
  const response = await chat({
    systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
    model,
  });

  // Extract text from response
  const textContent = response.content.find((c) => c.type === 'text');
  return textContent && 'text' in textContent ? textContent.text : '';
}

/**
 * Check if Claude API is configured
 */
export function isClaudeConfigured(): boolean {
  return Boolean(ANTHROPIC_API_KEY);
}

/**
 * Get available models
 */
export function getAvailableModels() {
  return {
    opus: 'claude-opus-4-20250514',
    sonnet: 'claude-sonnet-4-5-20250929',
    haiku: 'claude-3-5-haiku-20241022',
  };
}
