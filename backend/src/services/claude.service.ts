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
const MAX_TOKENS = 8192;

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
 * Send a chat message to Claude
 */
export async function chat(options: ChatOptions): Promise<ClaudeResponse> {
  const {
    systemPrompt,
    messages,
    model = DEFAULT_MODEL,
    maxTokens = MAX_TOKENS,
    temperature = 1.0,
    tools,
    enableCache = true, // Enable caching by default for cost optimization
  } = options;

  try {
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

    const response = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemParam as any, // Type compatibility with SDK
      messages: messages as any, // Type compatibility
      ...(tools && { tools }),
    });

    return response as ClaudeResponse;
  } catch (error: any) {
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
