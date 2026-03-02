/**
 * Agent Types - Internal agent execution types
 * The Hive OS V5 Backend
 */

import type {
  AgentId,
  ChatMode,
  SharedProjectContext,
  TaskExecutionContext,
  UIComponent,
  WriteBackCommand,
  MemoryContribution,
  ProjectMemoryEntry,
  Recommendation,
} from './api.types.js';

// ─────────────────────────────────────────────────────────────────
// Agent Context (input to agent.execute())
// ─────────────────────────────────────────────────────────────────

export interface AgentContext {
  // Request info
  agentId: AgentId;
  userMessage: string;
  chatMode: ChatMode;
  sessionId: string;

  // Project context
  projectContext: SharedProjectContext;
  taskContext?: TaskExecutionContext;

  // Memory context (filtered for this agent)
  memoryContext: MemoryContext;

  // Uploaded images (if any)
  images?: string[]; // Base64 or URLs

  // System instruction override (optional)
  systemInstruction?: string;
}

export interface MemoryContext {
  recentEntries: ProjectMemoryEntry[];
  relevantRecommendations: Recommendation[];
  summary: string; // AI-generated summary of relevant memory
}

// ─────────────────────────────────────────────────────────────────
// Agent Response (output from agent.execute())
// ─────────────────────────────────────────────────────────────────

export interface AgentResponse {
  success: boolean;
  agent: AgentId;
  message: string;
  uiComponents?: UIComponent[];
  writeBack?: WriteBackCommand[];
  memoryContribution?: MemoryContribution;
  error?: string;
}

// ─────────────────────────────────────────────────────────────────
// Agent Configuration
// ─────────────────────────────────────────────────────────────────

export interface AgentConfig {
  id: AgentId;
  name: string;
  role: string;
  systemPromptTemplate: string; // Template with {{variables}}
  mcpTools: string[]; // List of MCP tool names this agent can use
  color: string; // Hex color for UI display
  temperature: number; // Claude temperature (0.0-1.0)
}

// ─────────────────────────────────────────────────────────────────
// MCP Tool Call Types
// ─────────────────────────────────────────────────────────────────

export interface MCPToolCall {
  server: string; // e.g., 'web-intelligence', 'seo-audit'
  tool: string; // e.g., 'web_screenshot', 'competitor_analysis'
  arguments: Record<string, unknown>;
}

export interface MCPToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

// ─────────────────────────────────────────────────────────────────
// Claude API Types
// ─────────────────────────────────────────────────────────────────

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string | ClaudeMessageContent[];
}

export type ClaudeMessageContent =
  | { type: 'text'; text: string }
  | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
  | { type: 'tool_use'; id: string; name: string; input: unknown }
  | { type: 'tool_result'; tool_use_id: string; content: string };

export interface ClaudeResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: ClaudeMessageContent[];
  model: string;
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence' | 'tool_use';
  stop_sequence?: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

// ─────────────────────────────────────────────────────────────────
// Re-export from api.types for convenience (already imported above)
// ─────────────────────────────────────────────────────────────────
