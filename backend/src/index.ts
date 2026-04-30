/**
 * Backend API Gateway - Express Server Entry Point
 * Replaces n8n workflows with TypeScript API
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import * as dotenv from 'dotenv';

// Routes
import chatRoutes from './routes/chat.routes.js';
import genesisRoutes from './routes/genesis.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import filesRoutes from './routes/files.routes.js';
import phaseTransitionRoutes from './routes/phase-transition.routes.js';
import taskExplainerRoutes from './routes/task-explainer.routes.js';
import cmsRoutes from './routes/cms.routes.js';
import adminRoutes from './routes/admin.routes.js';
import superAdminRoutes from './routes/super-admin.routes.js';
import telegramRoutes from './routes/telegram.routes.js';
import socialRoutes from './routes/social.routes.js';

// Middleware
import { errorHandler } from './middleware/error.middleware.js';
import { csrfProtection } from './middleware/csrf.middleware.js';

// Services
import { isSupabaseConfigured } from './services/supabase.service.js';
import { isClaudeConfigured } from './services/claude.service.js';
import { isMCPBridgeConfigured } from './services/mcp-bridge.service.js';

// Setup
import { ensureRPCFunctions } from './setup/ensure-rpc-functions.js';
import { startTelegramRealtimeListener } from './setup/telegram-realtime.js';

dotenv.config();

// ─────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3457;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Allow both cockpit (5173) and backoffice (5174) in development
// In production, set FRONTEND_URL and BACKOFFICE_URL via environment variables
const ALLOWED_ORIGINS = NODE_ENV === 'development'
  ? ['http://localhost:5173', 'http://localhost:5174']
  : [
      process.env.FRONTEND_URL || 'https://app.hive-os.com',
      process.env.BACKOFFICE_URL || 'https://backoffice.hive-os.com'
    ];

// ─────────────────────────────────────────────────────────────────
// Express App
// ─────────────────────────────────────────────────────────────────

const app = express();

// Security middleware - Helmet with strict configuration
app.use(
  helmet({
    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for frontend
        imgSrc: ["'self'", 'data:', 'https:'], // Allow data URIs and HTTPS images
        fontSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"], // API calls to same origin only
        frameSrc: ["'none'"], // No iframes
        objectSrc: ["'none'"], // No Flash, Java, etc.
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: [], // Upgrade HTTP to HTTPS
      },
    },
    // Strict Transport Security - Force HTTPS for 1 year
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    // Referrer Policy - Strict origin when cross-origin
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin',
    },
    // X-Frame-Options - Prevent clickjacking
    frameguard: {
      action: 'deny',
    },
    // X-Content-Type-Options - Prevent MIME sniffing
    noSniff: true,
    // X-XSS-Protection - Legacy XSS protection
    xssFilter: true,
  })
);

// Permissions-Policy header (not part of helmet config in current version)
app.use((_req, res, next) => {
  res.setHeader(
    'Permissions-Policy',
    "camera=(), microphone=(), geolocation=(), payment=(), usb=()"
  );
  next();
});

// CORS - Allow both cockpit and backoffice
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);

      if (ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// CSRF Protection - Validate Origin header on POST/PUT/DELETE requests
app.use(csrfProtection);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging (dev only)
if (NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ─────────────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────────────

// Health check
app.get('/health', async (_req, res) => {
  const supabaseOk = isSupabaseConfigured();
  const claudeOk = isClaudeConfigured();
  const mcpBridgeOk = await isMCPBridgeConfigured();

  const allOk = supabaseOk && claudeOk && mcpBridgeOk;

  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    services: {
      supabase: supabaseOk ? 'ok' : 'not_configured',
      claude: claudeOk ? 'ok' : 'not_configured',
      mcp_bridge: mcpBridgeOk ? 'ok' : 'unreachable',
    },
    version: '5.0.0',
  });
});

// API routes
app.use('/api/chat', chatRoutes);
app.use('/api/genesis', genesisRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/phase-transition', phaseTransitionRoutes);
app.use('/api/task-explainer', taskExplainerRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/social', socialRoutes);

// Fallback 404
app.use((req, res) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} does not exist`,
  });
});

// Error handling (must be last)
app.use(errorHandler);

// ─────────────────────────────────────────────────────────────────
// Startup
// ─────────────────────────────────────────────────────────────────

async function start() {
  try {
    // Validate configuration
    console.log('[Backend] Checking configuration...');

    if (!isSupabaseConfigured()) {
      console.warn('[Backend] Warning: Supabase not configured');
    }

    if (!isClaudeConfigured()) {
      console.warn('[Backend] Warning: Claude API not configured');
    }

    const mcpBridgeOk = await isMCPBridgeConfigured();
    if (!mcpBridgeOk) {
      console.warn('[Backend] Warning: MCP Bridge not reachable');
      console.warn('[Backend] Make sure MCP Bridge is running on port 3456');
    }

    // Ensure RPC functions exist
    await ensureRPCFunctions();

    // Initialize Telegram bot and Realtime listener
    if (process.env.TELEGRAM_BOT_TOKEN) {
      const { initTelegramBot } = await import('./services/telegram.service.js');
      await initTelegramBot();
      await startTelegramRealtimeListener();
    } else {
      console.warn('[Backend] Warning: Telegram bot not configured');
    }

    // Start server
    app.listen(PORT, () => {
      console.log('');
      console.log('─────────────────────────────────────────────────────────');
      console.log('  🐝 THE HIVE OS V5 — Backend API Gateway');
      console.log('─────────────────────────────────────────────────────────');
      console.log(`  Environment:  ${NODE_ENV}`);
      console.log(`  Server:       http://localhost:${PORT}`);
      console.log(`  Health:       http://localhost:${PORT}/health`);
      console.log('');
      console.log('  Endpoints:');
      console.log(`    POST /api/chat         - Main chat endpoint`);
      console.log(`    POST /api/genesis      - Project initialization`);
      console.log(`    POST /api/analytics    - Analytics data`);
      console.log(`    POST /api/files/*      - File management`);
      console.log(`    POST /api/cms/execute  - Execute CMS change`);
      console.log(`    POST /api/cms/rollback - Rollback CMS change`);
      console.log(`    GET  /api/cms/pending  - List pending CMS approvals`);
      console.log('');
      console.log('  Admin Endpoints:');
      console.log(`    GET  /api/admin/stats/agents     - Agent performance stats`);
      console.log(`    GET  /api/admin/stats/business   - Business metrics`);
      console.log(`    GET  /api/admin/logs/recent      - Recent system logs`);
      console.log(`    GET  /api/admin/logs/error-count - Error count`);
      console.log('');
      console.log('  Super Admin Endpoints (super_admin role only):');
      console.log(`    GET    /api/superadmin/tickets       - List all support tickets`);
      console.log(`    GET    /api/superadmin/tickets/:id   - View ticket details`);
      console.log(`    PATCH  /api/superadmin/tickets/:id/status - Update ticket status`);
      console.log(`    POST   /api/superadmin/tickets/:id/reply  - Reply to ticket`);
      console.log(`    GET    /api/superadmin/users         - List all users`);
      console.log(`    GET    /api/superadmin/logs/audit    - View audit trail`);
      console.log('');
      console.log('  Services:');
      console.log(`    Supabase:    ${isSupabaseConfigured() ? '✓' : '✗'}`);
      console.log(`    Claude API:  ${isClaudeConfigured() ? '✓' : '✗'}`);
      console.log(`    MCP Bridge:  ${mcpBridgeOk ? '✓' : '✗'}`);
      console.log('─────────────────────────────────────────────────────────');
      console.log('');
    });
  } catch (error) {
    console.error('[Backend] Fatal error during startup:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Backend] SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[Backend] SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start the server
start();
