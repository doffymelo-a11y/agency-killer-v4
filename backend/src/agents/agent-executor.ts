/**
 * Agent Executor - Base execution logic for all agents
 * Handles Claude API calls, MCP tool execution, and response parsing
 */

import { chat } from '../services/claude.service.js';
import { mcpBridge } from '../services/mcp-bridge.service.js';
import { parseAgentResponse } from '../shared/response-parser.js';
import { detectComplexity, logComplexityDecision } from '../services/complexity-detector.js';
import type { AgentConfig } from '../types/agent.types.js';
import type { AgentId, SharedProjectContext } from '../types/api.types.js';
import type { Anthropic } from '@anthropic-ai/sdk';

// ─────────────────────────────────────────────────────────────────
// Agent Execution Context
// ─────────────────────────────────────────────────────────────────

export interface AgentExecutionContext {
  agentId: AgentId;
  agentConfig: AgentConfig;
  userMessage: string;
  projectContext: SharedProjectContext;
  memoryContext: string;
  sessionId: string;
  images?: string[];
  systemInstruction?: string;
}

// ─────────────────────────────────────────────────────────────────
// Main Execution Function
// ─────────────────────────────────────────────────────────────────

/**
 * Execute agent with Claude API + MCP tools
 */
export async function executeAgent(context: AgentExecutionContext) {
  console.log(`[Agent Executor] Executing ${context.agentId}`);

  // Step 1: Build system prompt
  const systemPrompt = buildSystemPrompt(context);

  // Step 2: Build MCP tools definitions for Claude
  const tools = buildMCPToolsDefinitions(context.agentConfig.mcpTools);

  // Step 3: Build messages array
  const messages: any[] = [
    {
      role: 'user',
      content: context.userMessage,
    },
  ];

  // Add images if provided
  if (context.images && context.images.length > 0) {
    messages[0].content = [
      { type: 'text', text: context.userMessage },
      ...context.images.map((imageBase64) => ({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/jpeg',
          data: imageBase64,
        },
      })),
    ];
  }

  // Step 4: Detect question complexity and adjust parameters dynamically
  const complexity = detectComplexity(context.userMessage);
  logComplexityDecision(context.userMessage, complexity);

  // Step 5: Call Claude API with dynamic parameters
  let response = await chat({
    systemPrompt,
    messages,
    tools,
    temperature: 1.0,
    maxTokens: complexity.maxTokens,
    timeout: complexity.timeout, // Custom timeout based on complexity
  });

  console.log(`[Agent Executor] Claude response received, stop_reason: ${response.stop_reason}`);

  // Step 5: Handle tool use (MCP calls)
  let iterationCount = 0;
  const MAX_ITERATIONS = 5; // Prevent infinite loops

  while (response.stop_reason === 'tool_use' && iterationCount < MAX_ITERATIONS) {
    iterationCount++;
    console.log(`[Agent Executor] Tool use iteration ${iterationCount}`);

    // Extract tool calls from response
    const toolCalls = response.content.filter((block: any) => block.type === 'tool_use');

    if (toolCalls.length === 0) {
      break;
    }

    // Execute all tool calls via MCP Bridge
    const toolResults = await executeMCPToolCalls(toolCalls);

    // Build tool result messages for Claude
    const toolResultMessages = toolResults.map((result: any) => ({
      type: 'tool_result',
      tool_use_id: result.tool_use_id,
      content: JSON.stringify(result.result),
    }));

    // Add assistant message + tool results to conversation
    messages.push({
      role: 'assistant',
      content: response.content,
    });

    messages.push({
      role: 'user',
      content: toolResultMessages,
    });

    // Call Claude again with tool results
    response = await chat({
      systemPrompt,
      messages,
      tools,
      temperature: 1.0,
    });

    console.log(
      `[Agent Executor] Claude response after tool use, stop_reason: ${response.stop_reason}`
    );
  }

  if (iterationCount >= MAX_ITERATIONS) {
    console.warn(`[Agent Executor] Max iterations reached (${MAX_ITERATIONS})`);
  }

  // Step 6: Parse final response
  const parsedResponse = parseAgentResponse(response, context.agentId);

  return {
    success: true,
    agent: context.agentId,
    message: parsedResponse.message,
    ui_components: parsedResponse.ui_components,
    write_back_commands: parsedResponse.write_back_commands,
    memory_contribution: parsedResponse.memory_contribution,
    session_id: context.sessionId,
  };
}

// ─────────────────────────────────────────────────────────────────
// System Prompt Builder
// ─────────────────────────────────────────────────────────────────

/**
 * Build system prompt by injecting context into template
 */
function buildSystemPrompt(context: AgentExecutionContext): string {
  let prompt = context.agentConfig.systemPromptTemplate;

  // Replace template variables
  const replacements: Record<string, string> = {
    project_name: context.projectContext.project_name || 'Projet sans nom',
    project_scope: String(context.projectContext.project_scope || ''),
    industry: context.projectContext.industry || '',
    target_audience: context.projectContext.target_audience || '',
    brand_voice: context.projectContext.brand_voice || '',
    budget: String(context.projectContext.budget || 0),
    goals: context.projectContext.goals?.join(', ') || '',
    kpis: context.projectContext.kpis?.join(', ') || '',
    timeline: context.projectContext.timeline || '',
    memory_context: context.memoryContext,
    task_context: context.userMessage,
    state_flags: formatStateFlags(context.projectContext.state_flags || {}), // CRITICAL: Tool connection status
  };

  // DEBUGGING: Log extracted context to verify Genesis answers are injected
  console.log('[Agent Executor] Context injected into system prompt:', {
    project_name: replacements.project_name,
    industry: replacements.industry || '(empty)',
    target_audience: replacements.target_audience || '(empty)',
    brand_voice: replacements.brand_voice || '(empty)',
    budget: replacements.budget,
    goals: replacements.goals || '(empty)',
    kpis: replacements.kpis || '(empty)',
    timeline: replacements.timeline || '(empty)',
  });

  function formatStateFlags(flags: Record<string, boolean>): string {
    if (!flags || Object.keys(flags).length === 0) {
      return '⚠️ NO STATE FLAGS SET - Assume ALL tools are NOT connected';
    }
    return Object.entries(flags)
      .map(([key, value]) => `- ${key}: ${value ? '✓ Connected' : '✗ NOT Connected'}`)
      .join('\n');
  }

  for (const [key, value] of Object.entries(replacements)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    prompt = prompt.replace(regex, value);
  }

  // Add system instruction override if provided
  if (context.systemInstruction) {
    prompt += `\n\n**INSTRUCTION PRIORITAIRE :**\n${context.systemInstruction}`;
  }

  return prompt;
}

// ─────────────────────────────────────────────────────────────────
// MCP Tools Definitions Builder
// ─────────────────────────────────────────────────────────────────

/**
 * Build Claude tools definitions from MCP tool names
 */
function buildMCPToolsDefinitions(mcpToolNames: string[]): Anthropic.Tool[] {
  return mcpToolNames.map((toolName) => {
    // Parse server__tool format
    const [server, tool] = toolName.split('__');

    // Build tool definition for Claude
    return {
      name: toolName,
      description: `MCP tool: ${tool} from ${server} server`,
      input_schema: {
        type: 'object',
        properties: {
          // Generic schema - MCP tools accept various parameters
          url: { type: 'string', description: 'URL to analyze (if applicable)' },
          query: { type: 'string', description: 'Search query or keyword (if applicable)' },
          options: { type: 'object', description: 'Additional options' },
        },
        required: [],
      },
    };
  });
}

// ─────────────────────────────────────────────────────────────────
// MCP Tool Execution
// ─────────────────────────────────────────────────────────────────

/**
 * Execute MCP tool calls from Claude
 */
async function executeMCPToolCalls(toolCalls: any[]) {
  const results = [];

  for (const toolCall of toolCalls) {
    const toolName = toolCall.name;
    const [server, tool] = toolName.split('__');

    console.log(`[Agent Executor] Executing MCP tool: ${server}.${tool}`);

    try {
      const result = await mcpBridge.call(server, tool, toolCall.input);

      results.push({
        tool_use_id: toolCall.id,
        result: result.success ? result.data : { error: result.error },
      });
    } catch (error: any) {
      console.error(`[Agent Executor] Error executing ${toolName}:`, error);
      results.push({
        tool_use_id: toolCall.id,
        result: { error: error.message },
      });
    }
  }

  return results;
}
