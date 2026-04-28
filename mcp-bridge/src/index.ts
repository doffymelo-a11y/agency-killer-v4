/**
 * MCP Bridge Server - Main Entry Point
 * Exposes MCP servers via HTTP REST API for n8n and other tools
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config, mcpServers, MCPServerName } from './config.js';
import { createLogger } from './logger.js';
import {
  callMCPTool,
  getMCPServerTools,
  disconnectAll,
  getConnectionStatus,
} from './mcpClient.js';

const logger = createLogger('BridgeServer');

// ─────────────────────────────────────────────────────────────────
// Express App Setup
// ─────────────────────────────────────────────────────────────────

const app = express();

// Middleware
// SECURITY: Restrict CORS to backend only - MCP Bridge should NEVER be called from browser
app.use(cors({
  origin: process.env.BACKEND_URL || 'http://localhost:3457',
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// ─────────────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────────────

/**
 * Health check
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'MCP Bridge Server',
    version: '1.0.0',
    uptime: process.uptime(),
  });
});

/**
 * Get all available MCP servers
 */
app.get('/api/servers', (req: Request, res: Response) => {
  const servers = Object.entries(mcpServers).map(([id, config]) => ({
    id,
    name: config.name,
    path: config.serverPath,
  }));

  res.json({
    success: true,
    servers,
  });
});

/**
 * Get connection status of all servers
 */
app.get('/api/status', (req: Request, res: Response) => {
  const status = getConnectionStatus();
  res.json({
    success: true,
    connections: status,
  });
});

/**
 * Get available tools for a specific server
 */
app.get('/api/:serverName/tools', async (req: Request, res: Response) => {
  const { serverName } = req.params;

  if (!(serverName in mcpServers)) {
    return res.status(404).json({
      success: false,
      error: `Server "${serverName}" not found`,
      availableServers: Object.keys(mcpServers),
    });
  }

  try {
    const tools = await getMCPServerTools(serverName as MCPServerName);
    res.json({
      success: true,
      server: serverName,
      tools,
    });
  } catch (error: any) {
    logger.error(`Failed to get tools for ${serverName}:`, error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Call a tool on a specific server
 *
 * POST /api/:serverName/call
 *
 * Body:
 * {
 *   "tool": "generate_image",
 *   "arguments": {
 *     "prompt": "A beautiful sunset...",
 *     "resolution": "2048x2048"
 *   }
 * }
 */
app.post('/api/:serverName/call', async (req: Request, res: Response) => {
  const { serverName } = req.params;
  const { tool, arguments: args } = req.body;

  // Validate server
  if (!(serverName in mcpServers)) {
    return res.status(404).json({
      success: false,
      error: `Server "${serverName}" not found`,
      availableServers: Object.keys(mcpServers),
    });
  }

  // Validate request body
  if (!tool) {
    return res.status(400).json({
      success: false,
      error: 'Missing required field: "tool"',
    });
  }

  if (!args || typeof args !== 'object') {
    return res.status(400).json({
      success: false,
      error: 'Missing or invalid "arguments" field (must be an object)',
    });
  }

  try {
    logger.info(`Calling ${tool} on ${serverName}`);

    const result = await callMCPTool(serverName as MCPServerName, tool, args);

    // Extract text content from MCP response
    const content = (result as any).content || [];
    const textContent = content.find((c: any) => c.type === 'text');

    if (textContent?.text) {
      try {
        // Try to parse as JSON
        const parsedResult = JSON.parse(textContent.text);
        return res.json({
          success: true,
          server: serverName,
          tool,
          result: parsedResult,
        });
      } catch {
        // Return as plain text
        return res.json({
          success: true,
          server: serverName,
          tool,
          result: textContent.text,
        });
      }
    }

    // Fallback: return raw result
    res.json({
      success: true,
      server: serverName,
      tool,
      result,
    });
  } catch (error: any) {
    logger.error(`Tool call failed:`, error);
    res.status(500).json({
      success: false,
      error: error.message,
      server: serverName,
      tool,
    });
  }
});

/**
 * Shortcut endpoint for Nano Banana Pro (MILO)
 */
app.post('/api/milo/generate-image', async (req: Request, res: Response) => {
  try {
    const result = await callMCPTool('nano-banana-pro', 'generate_image', req.body);

    const content = (result as any).content || [];
    const textContent = content.find((c: any) => c.type === 'text');

    if (textContent?.text) {
      const parsedResult = JSON.parse(textContent.text);
      return res.json(parsedResult);
    }

    res.json(result);
  } catch (error: any) {
    logger.error('MILO image generation failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /health',
      'GET /api/servers',
      'GET /api/status',
      'GET /api/:serverName/tools',
      'POST /api/:serverName/call',
      'POST /api/milo/generate-image',
    ],
  });
});

/**
 * Error handler
 */
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: err.message,
  });
});

// ─────────────────────────────────────────────────────────────────
// Server Startup
// ─────────────────────────────────────────────────────────────────

const server = app.listen(config.port, () => {
  logger.info('═'.repeat(60));
  logger.info('MCP Bridge Server Started');
  logger.info('═'.repeat(60));
  logger.info(`Environment: ${config.nodeEnv}`);
  logger.info(`Port: ${config.port}`);
  logger.info(`MCP Servers Path: ${config.mcpServersPath}`);
  logger.info('');
  logger.info('Available MCP Servers:');
  Object.entries(mcpServers).forEach(([id, serverConfig]) => {
    logger.info(`  - ${id}: ${serverConfig.name}`);
  });
  logger.info('');
  logger.info('API Endpoints:');
  logger.info(`  Health: http://localhost:${config.port}/health`);
  logger.info(`  Servers: http://localhost:${config.port}/api/servers`);
  logger.info(`  Status: http://localhost:${config.port}/api/status`);
  logger.info(`  Call Tool: POST http://localhost:${config.port}/api/:serverName/call`);
  logger.info(`  MILO Image: POST http://localhost:${config.port}/api/milo/generate-image`);
  logger.info('═'.repeat(60));
});

// ─────────────────────────────────────────────────────────────────
// Graceful Shutdown
// ─────────────────────────────────────────────────────────────────

async function shutdown() {
  logger.info('Shutting down gracefully...');

  // Close HTTP server
  server.close(() => {
    logger.info('HTTP server closed');
  });

  // Disconnect from all MCP servers
  await disconnectAll();

  logger.info('Shutdown complete');
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
  shutdown();
});
