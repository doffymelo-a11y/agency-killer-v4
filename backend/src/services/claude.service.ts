/**
 * Claude Service - Anthropic API client
 * Handles communication with Claude API
 */

import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';
import type { ClaudeMessage, ClaudeResponse } from '../types/agent.types.js';

dotenv.config();

// ─────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const DEFAULT_MODEL = 'claude-sonnet-4-5-20250929'; // Switched from Opus (5x cheaper, same quality)
const MAX_TOKENS = 4096; // Reduced from 8192 to 4096 for faster responses (avg 15-20s instead of 25-30s)
const CLAUDE_API_TIMEOUT = 30000; // 30 seconds timeout (optimized Supabase queries allow this)

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
  } = options;

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
    setTimeout(() => reject(new Error(`Claude API timeout after ${CLAUDE_API_TIMEOUT / 1000}s`)), CLAUDE_API_TIMEOUT)
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
  } catch (error: any) {
    const shouldRetry =
      error.message?.includes('timeout') || // Timeout errors
      error.message?.includes('500') || // Server errors
      error.message?.includes('503') || // Service unavailable
      error.message?.includes('api_error'); // Generic API errors

    if (shouldRetry) {
      console.warn(`[Claude Service] Error detected (${error.message}), retrying with reduced tokens...`);
      try {
        // Wait 500ms before retry to give server time to recover
        await new Promise((resolve) => setTimeout(resolve, 500));

        return await chatInternal({
          ...options,
          maxTokens: Math.floor((options.maxTokens || MAX_TOKENS) * 0.8), // Reduce by 20%
        });
      } catch (retryError: any) {
        console.error('[Claude Service] Retry failed:', retryError);
        throw new Error(`Claude API error after retry: ${retryError.message}`);
      }
    }

    // For non-retryable errors, throw immediately
    console.error('[Claude Service] API Error:', error);
    throw new Error(`Claude API error: ${error.message}`);
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
