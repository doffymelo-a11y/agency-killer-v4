/**
 * MCP Client - Manages communication with MCP servers via stdio
 */

import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { mcpServers, MCPServerName } from './config.js';
import { createLogger } from './logger.js';

const logger = createLogger('MCPClient');

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

export interface MCPClientInstance {
  client: Client;
  transport: StdioClientTransport;
  tools: MCPTool[];
}

// Active MCP server connections
const activeConnections = new Map<MCPServerName, MCPClientInstance>();

/**
 * Connect to an MCP server
 */
export async function connectToMCPServer(serverName: MCPServerName): Promise<MCPClientInstance> {
  // Return existing connection if available
  if (activeConnections.has(serverName)) {
    const existing = activeConnections.get(serverName)!;
    logger.info(`Reusing existing connection to ${serverName}`);
    return existing;
  }

  const serverConfig = mcpServers[serverName];
  logger.info(`Connecting to MCP server: ${serverConfig.name}`);

  // Create MCP client
  const client = new Client(
    {
      name: 'mcp-bridge-client',
      version: '1.0.0',
    },
    {
      capabilities: {},
    }
  );

  // Create stdio transport (this will spawn the process)
  // IMPORTANT: Merge process.env with server-specific env to ensure all variables are passed
  const mergedEnv: Record<string, string> = {};

  // Copy all current process env (including PATH, NODE_ENV, etc.)
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) {
      mergedEnv[key] = value;
    }
  }

  // Override with server-specific env
  for (const [key, value] of Object.entries(serverConfig.env)) {
    if (value !== undefined && value !== '') {
      mergedEnv[key] = value;
    }
  }

  logger.debug(`Launching ${serverName} with env vars:`, {
    GOOGLE_CLOUD_PROJECT: mergedEnv.GOOGLE_CLOUD_PROJECT || 'NOT SET',
    GOOGLE_CLOUD_LOCATION: mergedEnv.GOOGLE_CLOUD_LOCATION || 'NOT SET',
    GOOGLE_APPLICATION_CREDENTIALS: mergedEnv.GOOGLE_APPLICATION_CREDENTIALS ? 'SET' : 'NOT SET',
  });

  // Launch server from its directory
  const fullCommand = path.join(serverConfig.serverPath, serverConfig.args[0]);

  const transport = new StdioClientTransport({
    command: serverConfig.command,
    args: [fullCommand],
    env: mergedEnv,
  });

  // Connect client to transport
  await client.connect(transport);

  logger.info(`✓ Connected to ${serverConfig.name}`);

  // List available tools
  const toolsResponse = await client.listTools();

  const tools = (toolsResponse as any).tools || [];
  logger.info(`✓ Loaded ${tools.length} tools from ${serverConfig.name}`);

  const instance: MCPClientInstance = {
    client,
    transport,
    tools,
  };

  activeConnections.set(serverName, instance);

  return instance;
}

/**
 * Call a tool on an MCP server
 */
export async function callMCPTool(
  serverName: MCPServerName,
  toolName: string,
  args: Record<string, any>
): Promise<any> {
  logger.info(`Calling tool ${toolName} on ${serverName}`);
  logger.debug(`Arguments:`, args);

  // Connect to server (or reuse existing connection)
  const instance = await connectToMCPServer(serverName);

  // Validate tool exists
  const tool = instance.tools.find((t) => t.name === toolName);
  if (!tool) {
    const availableTools = instance.tools.map((t) => t.name).join(', ');
    throw new Error(
      `Tool "${toolName}" not found on server "${serverName}". Available tools: ${availableTools}`
    );
  }

  // Call the tool
  try {
    const result = await instance.client.callTool({
      name: toolName,
      arguments: args,
    });

    logger.info(`✓ Tool ${toolName} executed successfully`);
    return result;
  } catch (error: any) {
    logger.error(`✗ Tool ${toolName} failed:`, error.message);
    throw error;
  }
}

/**
 * Get available tools for a server
 */
export async function getMCPServerTools(serverName: MCPServerName): Promise<MCPTool[]> {
  const instance = await connectToMCPServer(serverName);
  return instance.tools;
}

/**
 * Disconnect from an MCP server
 */
export async function disconnectFromMCPServer(serverName: MCPServerName): Promise<void> {
  const instance = activeConnections.get(serverName);
  if (!instance) {
    logger.warn(`No active connection to ${serverName}`);
    return;
  }

  logger.info(`Disconnecting from ${serverName}`);

  try {
    await instance.client.close();
    await instance.transport.close();
    activeConnections.delete(serverName);
    logger.info(`✓ Disconnected from ${serverName}`);
  } catch (error: any) {
    logger.error(`Error disconnecting from ${serverName}:`, error.message);
  }
}

/**
 * Disconnect from all MCP servers
 */
export async function disconnectAll(): Promise<void> {
  logger.info('Disconnecting from all MCP servers...');
  const disconnectPromises = Array.from(activeConnections.keys()).map((serverName) =>
    disconnectFromMCPServer(serverName)
  );
  await Promise.all(disconnectPromises);
  logger.info('✓ Disconnected from all servers');
}

/**
 * Get status of all connections
 */
export function getConnectionStatus(): Record<MCPServerName, boolean> {
  const status: any = {};
  for (const serverName of Object.keys(mcpServers) as MCPServerName[]) {
    status[serverName] = activeConnections.has(serverName);
  }
  return status;
}
