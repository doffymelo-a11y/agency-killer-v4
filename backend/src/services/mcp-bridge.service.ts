/**
 * MCP Bridge Service - Client for MCP Bridge HTTP API
 * Communicates with MCP servers via the bridge
 */

import axios, { AxiosInstance } from 'axios';
import * as dotenv from 'dotenv';
import type { MCPToolCall, MCPToolResult } from '../types/agent.types.js';

dotenv.config();

// ─────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────

const MCP_BRIDGE_URL = process.env.MCP_BRIDGE_URL || 'http://localhost:3456';
const REQUEST_TIMEOUT = 120000; // 2 minutes (MCP tools can be slow)

// ─────────────────────────────────────────────────────────────────
// Client
// ─────────────────────────────────────────────────────────────────

class MCPBridgeClient {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: REQUEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Call an MCP tool
   * @param server - MCP server name (e.g., 'web-intelligence', 'seo-audit')
   * @param tool - Tool name (e.g., 'web_screenshot', 'competitor_analysis')
   * @param args - Tool arguments
   */
  async call(server: string, tool: string, args: Record<string, unknown>): Promise<MCPToolResult> {
    try {
      const response = await this.client.post(`/api/${server}/call`, {
        tool,
        arguments: args,
      });

      if (response.data.success === false) {
        return {
          success: false,
          error: response.data.error || 'Unknown error from MCP server',
        };
      }

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error(`[MCP Bridge] Error calling ${server}.${tool}:`, error.message);
      return {
        success: false,
        error: `MCP call failed: ${error.message}`,
      };
    }
  }

  /**
   * Execute multiple MCP tool calls in parallel
   */
  async callBatch(toolCalls: MCPToolCall[]): Promise<MCPToolResult[]> {
    const promises = toolCalls.map((call) =>
      this.call(call.server, call.tool, call.arguments)
    );

    return Promise.all(promises);
  }

  /**
   * List available tools for a server
   */
  async listTools(server: string): Promise<string[]> {
    try {
      const response = await this.client.get(`/api/${server}/tools`);
      return response.data.tools || [];
    } catch (error: any) {
      console.error(`[MCP Bridge] Error listing tools for ${server}:`, error.message);
      return [];
    }
  }

  /**
   * Check if MCP Bridge is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch {
      return false;
    }
  }
}

// ─────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────

export const mcpBridge = new MCPBridgeClient(MCP_BRIDGE_URL);

/**
 * Helper function to execute MCP tool calls from Claude's tool_use responses
 */
export async function executeMCPToolCalls(
  toolUses: Array<{ name: string; input: Record<string, unknown> }>
): Promise<Array<{ tool: string; result: MCPToolResult }>> {
  const results: Array<{ tool: string; result: MCPToolResult }> = [];

  for (const toolUse of toolUses) {
    // Parse tool name: format is "server__tool" (e.g., "web_intelligence__web_screenshot")
    const [server, tool] = toolUse.name.split('__');

    if (!server || !tool) {
      results.push({
        tool: toolUse.name,
        result: {
          success: false,
          error: `Invalid tool name format: ${toolUse.name}. Expected "server__tool"`,
        },
      });
      continue;
    }

    const result = await mcpBridge.call(server, tool, toolUse.input);
    results.push({ tool: toolUse.name, result });
  }

  return results;
}

/**
 * Check if MCP Bridge is configured and accessible
 */
export async function isMCPBridgeConfigured(): Promise<boolean> {
  return mcpBridge.healthCheck();
}
