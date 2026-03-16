/**
 * Response Parser - Parses LLM responses
 * Extracts message, UI components, write-back commands, memory contributions
 */

import type { ClaudeResponse } from '../types/agent.types.js';
import type { UIComponent, WriteBackCommand, MemoryContribution } from '../types/api.types.js';

export interface ParsedAgentResponse {
  message: string;
  ui_components: UIComponent[];
  write_back_commands: WriteBackCommand[];
  memory_contribution?: MemoryContribution;
}

/**
 * Parse Claude response into structured agent response
 * Handles both simple text responses and complex JSON-embedded responses
 */
export function parseAgentResponse(
  claudeResponse: ClaudeResponse,
  _agentId: string
): ParsedAgentResponse {
  let message = '';
  const ui_components: UIComponent[] = [];
  const write_back_commands: WriteBackCommand[] = [];
  let memory_contribution: MemoryContribution | undefined;

  // Extract text content from Claude response
  for (const block of claudeResponse.content) {
    if (block.type === 'text') {
      const text = block.text;

      // Try to extract JSON blocks (UI components, write-backs, memory)
      const jsonMatches = extractJsonBlocks(text);

      if (jsonMatches.length > 0) {
        // Parse JSON blocks
        for (const jsonStr of jsonMatches) {
          try {
            const parsed = JSON.parse(jsonStr);

            // Detect type of JSON block
            if (parsed.type && isUIComponentType(parsed.type)) {
              ui_components.push(parsed as UIComponent);
            } else if (parsed.command) {
              write_back_commands.push(parsed as WriteBackCommand);
            } else if (parsed.action && parsed.summary) {
              memory_contribution = parsed as MemoryContribution;
            }
          } catch (parseError) {
            console.warn('[Response Parser] Failed to parse JSON block:', parseError);
          }
        }

        // Remove JSON blocks from message text
        message += removeJsonBlocks(text);
      } else {
        // No JSON blocks, just add the text
        message += text;
      }
    }
  }

  return {
    message: message.trim(),
    ui_components,
    write_back_commands,
    memory_contribution,
  };
}

/**
 * Extract JSON code blocks from text
 * Looks for ```json ... ``` or standalone JSON objects
 */
function extractJsonBlocks(text: string): string[] {
  const blocks: string[] = [];

  // Match ```json ... ``` code blocks
  const codeBlockRegex = /```json\s*([\s\S]*?)\s*```/g;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    blocks.push(match[1]);
  }

  // Also try to find standalone JSON objects (fallback)
  if (blocks.length === 0) {
    const jsonObjectRegex = /\{[\s\S]*?"type"[\s\S]*?\}/g;
    while ((match = jsonObjectRegex.exec(text)) !== null) {
      blocks.push(match[0]);
    }
  }

  return blocks;
}

/**
 * Remove JSON blocks from text to get clean message
 */
function removeJsonBlocks(text: string): string {
  return text
    .replace(/```json\s*[\s\S]*?\s*```/g, '')
    .replace(/\{[\s\S]*?"type"[\s\S]*?\}/g, '')
    .trim();
}

/**
 * Check if a string is a valid UI component type
 */
function isUIComponentType(type: string): boolean {
  const validTypes = [
    'CAMPAGNE_TABLE',
    'DELIVERABLE_TABLE',
    'ANALYTICS_DASHBOARD',
    'AD_PREVIEW',
    'SEO_REPORT',
    'PDF_COPYWRITING',
    'COMPETITOR_REPORT',
    'WEB_SCREENSHOT',
    'LANDING_PAGE_AUDIT',
    'PIXEL_VERIFICATION',
    'SOCIAL_POST_PREVIEW',
    'CONTENT_CALENDAR',
    'SOCIAL_ANALYTICS',
  ];

  return validTypes.includes(type);
}

/**
 * Simple text extractor (for responses without JSON)
 */
export function extractText(claudeResponse: ClaudeResponse): string {
  let text = '';

  for (const block of claudeResponse.content) {
    if (block.type === 'text') {
      text += block.text + '\n';
    }
  }

  return text.trim();
}
