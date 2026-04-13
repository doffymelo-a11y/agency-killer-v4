/**
 * Agent Executor - Base execution logic for all agents
 * Handles Claude API calls, MCP tool execution, and response parsing
 */

import { chat } from '../services/claude.service.js';
import { mcpBridge } from '../services/mcp-bridge.service.js';
import { recordCMSChange } from '../services/cms.service.js';
import { parseAgentResponse } from '../shared/response-parser.js';
import { detectComplexity, logComplexityDecision } from '../services/complexity-detector.js';
import { logToSystem } from '../services/logging.service.js';
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
  userId?: string; // Phase 3.3: For CMS change tracking
}

// ─────────────────────────────────────────────────────────────────
// Main Execution Function
// ─────────────────────────────────────────────────────────────────

/**
 * Execute agent with Claude API + MCP tools
 */
export async function executeAgent(context: AgentExecutionContext) {
  const startTime = Date.now();
  console.log(`[Agent Executor] Executing ${context.agentId}`);

  // Log agent start
  await logToSystem({
    level: 'info',
    source: 'agent-executor',
    agent_id: context.agentId,
    user_id: context.userId,
    project_id: context.projectContext.project_id,
    action: 'agent_start',
    message: `Agent ${context.agentId} started`,
    metadata: {
      session_id: context.sessionId,
      has_images: Boolean(context.images && context.images.length > 0),
    },
  });

  try {
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
    const toolResults = await executeMCPToolCalls(toolCalls, context);

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

    // Calculate execution metrics
    const durationMs = Date.now() - startTime;
    const tokensUsed = response.usage?.input_tokens + response.usage?.output_tokens || 0;
    // Rough cost estimate: ~$3 per 1M input tokens, ~$15 per 1M output tokens for Sonnet
    const creditsUsed =
      ((response.usage?.input_tokens || 0) * 3 + (response.usage?.output_tokens || 0) * 15) /
      1_000_000;

    // Log agent completion
    await logToSystem({
      level: 'info',
      source: 'agent-executor',
      agent_id: context.agentId,
      user_id: context.userId,
      project_id: context.projectContext.project_id,
      action: 'agent_complete',
      message: `Agent ${context.agentId} completed successfully`,
      metadata: {
        duration_ms: durationMs,
        tokens_used: tokensUsed,
        credits_used: creditsUsed,
        iterations: iterationCount,
        stop_reason: response.stop_reason,
      },
    });

    return {
      success: true,
      agent: context.agentId,
      message: parsedResponse.message,
      ui_components: parsedResponse.ui_components,
      write_back_commands: parsedResponse.write_back_commands,
      memory_contribution: parsedResponse.memory_contribution,
      session_id: context.sessionId,
    };
  } catch (error: any) {
    const durationMs = Date.now() - startTime;

    // Log agent error
    await logToSystem({
      level: 'error',
      source: 'agent-executor',
      agent_id: context.agentId,
      user_id: context.userId,
      project_id: context.projectContext.project_id,
      action: 'agent_error',
      message: `Agent ${context.agentId} failed: ${error.message}`,
      metadata: {
        duration_ms: durationMs,
        error_stack: error.stack,
        error_name: error.name,
      },
    });

    // Re-throw to let the caller handle it
    throw error;
  }
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
    // EXISTANTS (inchangés)
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
    state_flags: formatStateFlags(context.projectContext.state_flags || {}),

    // NEW - Genesis enriched context (variables individuelles)
    business_goal: context.projectContext.business_goal || '',
    pain_point: context.projectContext.pain_point || '',
    offer_hook: context.projectContext.offer_hook || '',
    visual_tone: context.projectContext.visual_tone || '',
    competitors: context.projectContext.competitors_list || '',
    negative_keywords: context.projectContext.negative_keywords_list || '',
    tracking_events: context.projectContext.tracking_events_list || '',

    // GENESIS CONTEXT BLOCK (injection globale - affiche tous les champs disponibles)
    genesis_context: buildGenesisContextBlock(context.projectContext),
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

/**
 * Build Genesis Context Block - affiche tous les champs disponibles
 * Utilisé dans {{genesis_context}} template variable
 */
function buildGenesisContextBlock(ctx: SharedProjectContext): string {
  const lines: string[] = [];

  if (ctx.industry) lines.push(`Secteur: ${ctx.industry}`);
  if (ctx.business_goal) lines.push(`Objectif: ${ctx.business_goal}`);
  if (ctx.target_audience) lines.push(`Audience: ${ctx.target_audience}`);
  if (ctx.brand_voice) lines.push(`Ton: ${ctx.brand_voice}`);
  if (ctx.budget) lines.push(`Budget: ${ctx.budget}€/mois`);
  if (ctx.pain_point) lines.push(`Pain Point: ${ctx.pain_point}`);
  if (ctx.offer_hook) lines.push(`Offre: ${ctx.offer_hook}`);
  if (ctx.visual_tone) lines.push(`Style Visuel: ${ctx.visual_tone}`);
  if (ctx.competitors_list) lines.push(`Concurrents: ${ctx.competitors_list}`);
  if (ctx.goals?.length) lines.push(`Goals: ${ctx.goals.join(', ')}`);
  if (ctx.kpis?.length) lines.push(`KPIs: ${ctx.kpis.join(', ')}`);

  return lines.length > 0
    ? `=== CONTEXTE PROJET ===\n${lines.join('\n')}`
    : '(Aucun contexte Genesis disponible)';
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
async function executeMCPToolCalls(toolCalls: any[], context: AgentExecutionContext) {
  const results = [];

  for (const toolCall of toolCalls) {
    const toolName = toolCall.name;
    const [server, tool] = toolName.split('__');

    console.log(`[Agent Executor] Executing MCP tool: ${server}.${tool}`);

    // Log MCP tool call
    await logToSystem({
      level: 'info',
      source: 'agent-executor',
      agent_id: context.agentId,
      project_id: context.projectContext.project_id,
      action: 'mcp_tool_call',
      message: `Calling ${tool} on ${server}`,
      metadata: {
        tool_name: toolName,
        server_name: server,
        tool: tool,
      },
    });

    try {
      const result = await mcpBridge.call(server, tool, toolCall.input);

      // Phase 3.3: Record CMS changes for approval workflow
      if (server === 'cms-connector' && result.success && result.data) {
        await recordCMSChangeIfNeeded(tool, result.data, context);
      }

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

/**
 * Phase 3.3: Record CMS changes for approval workflow
 * Detects CMS write operations and saves them to cms_change_log
 */
async function recordCMSChangeIfNeeded(
  toolName: string,
  toolResult: any,
  context: AgentExecutionContext
): Promise<void> {
  // List of CMS write tools that require recording
  const CMS_WRITE_TOOLS = [
    'create_cms_post',
    'update_cms_post',
    'delete_cms_post',
    'update_cms_page',
    'upload_cms_media',
    'update_cms_seo_meta',
    'manage_cms_category',
    'update_cms_product',
    'bulk_update_cms_seo',
  ];

  // Only record write operations
  if (!CMS_WRITE_TOOLS.includes(toolName)) {
    return;
  }

  // Check if result contains change tracking data
  if (!toolResult.change_id || !toolResult.requires_approval === undefined) {
    console.log(`[Agent Executor] CMS tool ${toolName} did not return change tracking data`);
    return;
  }

  try {
    // Get user_id from context
    const userId = context.userId;

    if (!userId) {
      console.warn('[Agent Executor] Cannot record CMS change: user_id not found in context');
      return;
    }

    // Record the change
    await recordCMSChange({
      user_id: userId,
      project_id: context.projectContext.project_id,
      change_id: toolResult.change_id,
      cms_type: toolResult.cms_type || 'wordpress',
      site_url: toolResult.site_url || '',
      content_type: toolResult.content_type || 'post',
      content_id: toolResult.content_id || '',
      action: toolResult.action || 'update',
      previous_state: toolResult.previous_state || {},
      new_state: toolResult.new_state || {},
      change_summary: toolResult.change_summary || {},
      requires_approval: toolResult.requires_approval,
      executed_by_agent: context.agentId,
      mcp_tool_name: `cms-connector__${toolName}`,
    });

    console.log(`[Agent Executor] Recorded CMS change: ${toolResult.change_id}`);
  } catch (error) {
    console.error('[Agent Executor] Error recording CMS change:', error);
    // Don't throw - we don't want to fail the entire execution if recording fails
  }
}
