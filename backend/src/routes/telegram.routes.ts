/**
 * Telegram Bot Routes
 * Handles webhook and account linking
 */

import { Router, type Request, type Response } from 'express';
import { bot, verifyTelegramRequest, linkTelegramAccount, getBotInfo, parseCallbackData, sendAgentResultNotification } from '../services/telegram.service.js';
import { supabaseAdmin } from '../services/supabase.service.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { claudeAgentService } from '../services/claude-agent.service.js';
import { logger } from '../lib/logger.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────
// Input Sanitization Helpers
// ─────────────────────────────────────────────────────────────────

/**
 * SECURITY: Sanitize Telegram user inputs (username, first_name, last_name)
 * - Validate length (max 100 chars)
 * - Remove special characters that could be used for injection
 * - Escape HTML/SQL special chars
 */
function sanitizeTelegramInput(input: string | undefined, maxLength: number = 100): string {
  if (!input) return '';

  // Truncate to max length
  let sanitized = input.substring(0, maxLength);

  // Remove control characters and potentially dangerous chars
  sanitized = sanitized
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .replace(/[<>'"`;\\]/g, '') // Remove HTML/SQL injection chars
    .trim();

  return sanitized;
}

/**
 * SECURITY: Validate and sanitize Telegram user data
 */
function sanitizeTelegramUserData(data: {
  username?: string;
  first_name?: string;
  last_name?: string;
}) {
  return {
    username: sanitizeTelegramInput(data.username, 100),
    first_name: sanitizeTelegramInput(data.first_name, 100),
    last_name: sanitizeTelegramInput(data.last_name, 100),
  };
}

// ─────────────────────────────────────────────────────────────────
// Webhook Endpoint
// ─────────────────────────────────────────────────────────────────

/**
 * POST /api/telegram/webhook - Telegram webhook endpoint
 * Receives updates from Telegram (messages, callbacks)
 */
router.post(
  '/webhook',
  asyncHandler(async (req: Request, res: Response) => {
    // Verify secret token (security)
    const secretToken = req.headers['x-telegram-bot-api-secret-token'] as string;

    if (!verifyTelegramRequest(secretToken)) {
      console.warn('[Telegram] Unauthorized webhook request');
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!bot) {
      console.error('[Telegram] Bot not configured');
      res.status(503).json({ error: 'Bot not configured' });
      return;
    }

    try {
      // Handle the update with Telegraf
      await bot.handleUpdate(req.body);
      res.status(200).json({ ok: true });
    } catch (error) {
      console.error('[Telegram] Error handling webhook:', error);
      res.status(500).json({ error: 'Internal error' });
    }
  })
);

// ─────────────────────────────────────────────────────────────────
// Account Linking
// ─────────────────────────────────────────────────────────────────

/**
 * POST /api/telegram/link - Link super admin account to Telegram
 * Used during /start flow to automatically link chat_id
 */
router.post(
  '/link',
  asyncHandler(async (req: Request, res: Response) => {
    const { user_id, chat_id, username, first_name, last_name } = req.body;

    if (!user_id || !chat_id) {
      res.status(400).json({ error: 'user_id and chat_id required' });
      return;
    }

    // Verify user is super_admin
    const { data: userRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user_id)
      .eq('role', 'super_admin')
      .single();

    if (roleError || !userRole) {
      console.warn(`[Telegram] User ${user_id} is not a super_admin`);
      res.status(403).json({ error: 'Only super admins can link Telegram accounts' });
      return;
    }

    // SECURITY: Sanitize user inputs
    const sanitized = sanitizeTelegramUserData({ username, first_name, last_name });

    await linkTelegramAccount(user_id, chat_id, sanitized.username, sanitized.first_name, sanitized.last_name);

    res.json({
      success: true,
      message: 'Telegram account linked successfully',
    });
  })
);

// ─────────────────────────────────────────────────────────────────
// Bot Info (Debug)
// ─────────────────────────────────────────────────────────────────

/**
 * GET /api/telegram/bot-info - Get bot information (for debugging)
 */
router.get(
  '/bot-info',
  asyncHandler(async (_req: Request, res: Response) => {
    const info = await getBotInfo();

    if (!info) {
      res.status(503).json({ error: 'Bot not configured' });
      return;
    }

    res.json({
      success: true,
      bot: info,
    });
  })
);

// ─────────────────────────────────────────────────────────────────
// Bot Commands Setup
// ─────────────────────────────────────────────────────────────────

if (bot) {
  /**
   * /start command - Link Telegram account
   */
  bot.command('start', async (ctx) => {
    const chatId = ctx.chat.id;
    const username = ctx.from.username;
    const firstName = ctx.from.first_name;
    const lastName = ctx.from.last_name;

    logger.log(`[Telegram] /start from chat ${chatId} (@${username})`);

    // For Phase 1, we use the founder's user_id from env vars
    // In production, this would use a magic link token
    const FOUNDER_USER_ID = process.env.FOUNDER_USER_ID;

    if (!FOUNDER_USER_ID) {
      await ctx.reply('❌ Server configuration error. Please contact support.');
      console.error('[Telegram] FOUNDER_USER_ID not set in environment variables');
      return;
    }

    try {
      // SECURITY: Sanitize user inputs from Telegram
      const sanitized = sanitizeTelegramUserData({
        username,
        first_name: firstName,
        last_name: lastName,
      });

      await linkTelegramAccount(FOUNDER_USER_ID, chatId, sanitized.username, sanitized.first_name, sanitized.last_name);

      await ctx.reply(
        `✅ *Account linked successfully!*\n\n` +
          `You will now receive Telegram notifications for:\n` +
          `• 🚨 Critical priority tickets\n` +
          `• ⚠️ High priority tickets\n\n` +
          `Use /settings to change notification preferences.`,
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      console.error('[Telegram] Error linking account:', error);
      await ctx.reply('❌ Error linking account. Please contact support.');
    }
  });

  /**
   * /ping command - Test bot is working
   */
  bot.command('ping', async (ctx) => {
    await ctx.reply('🏓 Pong! Bot is working.');
  });

  /**
   * /settings command - Show notification preferences (Phase 2)
   */
  bot.command('settings', async (ctx) => {
    await ctx.reply(
      '⚙️ *Notification Settings*\n\n' +
        'This feature will be available in Phase 2.\n\n' +
        'Currently receiving notifications for:\n' +
        '• 🚨 Critical\n' +
        '• ⚠️ High',
      { parse_mode: 'Markdown' }
    );
  });

  /**
   * /cancel command - Cancel reply mode
   */
  bot.command('cancel', async (ctx) => {
    const chatId = ctx.chat.id;
    const replyState = getReplyState(chatId);

    if (replyState) {
      clearReplyState(chatId);
      await ctx.reply('❌ Reply cancelled');
    } else {
      await ctx.reply('Nothing to cancel');
    }
  });

  /**
   * Callback query handler (inline button clicks)
   */
  bot.on('callback_query', async (ctx) => {
    const callbackData = ctx.callbackQuery.data;

    if (!callbackData) {
      await ctx.answerCbQuery('Invalid callback');
      return;
    }

    const data = parseCallbackData(callbackData);

    if (!data) {
      await ctx.answerCbQuery('Invalid callback data');
      return;
    }

    logger.log(`[Telegram] Callback: ${data.action} for ticket ${data.ticket_id}`);

    try {
      switch (data.action) {
        case 'view':
          await handleViewTicket(ctx, data.ticket_id);
          break;

        case 'fix':
          await handleFixTicket(ctx, data.ticket_id);
          break;

        case 'reply':
          await handleReplyTicket(ctx, data.ticket_id);
          break;

        case 'resolve':
          await handleResolveTicket(ctx, data.ticket_id);
          break;

        default:
          await ctx.answerCbQuery('Unknown action');
      }
    } catch (error) {
      console.error(`[Telegram] Error handling ${data.action}:`, error);
      await ctx.answerCbQuery('Error processing action');
      await ctx.reply('❌ An error occurred. Please try again.');
    }
  });

  /**
   * Handle messages (for reply flow)
   */
  bot.on('text', async (ctx) => {
    // Check if user is in reply mode
    const chatId = ctx.chat.id;
    const messageText = ctx.message.text;

    // Skip commands
    if (messageText.startsWith('/')) {
      return;
    }

    // Try to get ticket ID from multiple sources:
    // 1. In-memory reply state (fast path)
    // 2. Reply to message context (survives server restart)
    let ticketId: string | null = null;

    // Check in-memory state first
    const replyState = getReplyState(chatId);
    if (replyState) {
      ticketId = replyState.ticketId;
    }

    // If no in-memory state, check if this is a reply to a bot message
    if (!ticketId && ctx.message.reply_to_message) {
      const replyToText = ctx.message.reply_to_message.text;
      if (replyToText) {
        // Extract ticket ID from the message (format: "Ticket ID: `uuid`")
        const ticketIdMatch = replyToText.match(/Ticket ID: `([a-f0-9-]+)`/);
        if (ticketIdMatch && ticketIdMatch[1]) {
          ticketId = ticketIdMatch[1];
          logger.log(`[Telegram] Extracted ticket ID from reply context: ${ticketId}`);
        }
      }
    }

    if (ticketId) {
      try {
        // Send reply to ticket
        await sendTicketReply(ticketId, messageText);
        clearReplyState(chatId);

        await ctx.reply(
          `✅ *Reply sent successfully!*\n\n` +
          `The user will be notified of your response.`,
          { parse_mode: 'Markdown' }
        );
      } catch (error) {
        console.error('[Telegram] Error sending reply:', error);
        await ctx.reply('❌ Error sending reply. Please try again.');
      }
    }
  });
}

// ─────────────────────────────────────────────────────────────────
// Action Handlers (Phase 2)
// ─────────────────────────────────────────────────────────────────

/**
 * Show full ticket details with conversation history
 */
async function handleViewTicket(ctx: any, ticketId: string) {
  // Answer callback IMMEDIATELY (Telegram 3s timeout)
  try {
    await ctx.answerCbQuery();
  } catch (error) {
    console.error('[Telegram] Failed to answer callback:', error);
    // Continue anyway
  }

  try {
    logger.log(`[Telegram] Fetching ticket: ${ticketId}`);

    // Fetch ticket by full UUID
    const { data: fullTicket, error: searchError } = await supabaseAdmin
      .from('support_tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (searchError || !fullTicket) {
      console.error(`[Telegram] Ticket not found:`, searchError);
      await ctx.reply(`❌ Ticket not found: ${ticketId}`);
      return;
    }

    // Get user email separately
    const { data: user } = await supabaseAdmin.auth.admin.getUserById(fullTicket.user_id);
    const userEmail = user?.user?.email || 'Unknown';

    // Get messages
    const { data: messages } = await supabaseAdmin
      .from('support_messages')
      .select(`
        *,
        sender:auth.users!sender_id(email)
      `)
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    // Format ticket number
    const ticketNumber = formatTicketNumber(ticketId);

    // Build message
    let message = `📋 *Ticket ${ticketNumber}*\n\n`;
    message += `👤 ${userEmail}\n`;
    message += `📝 *${fullTicket.subject}*\n\n`;
    message += `${truncate(fullTicket.description, 300)}\n\n`;
    message += `📊 Status: ${fullTicket.status}\n`;
    message += `⚡ Priority: ${fullTicket.priority}\n`;
    message += `🏷️ Category: ${fullTicket.category}\n`;
    message += `📅 Created: ${new Date(fullTicket.created_at).toLocaleString('fr-FR')}\n\n`;

    // Add conversation history
    if (messages && messages.length > 0) {
      message += `💬 *Conversation (${messages.length} messages):*\n\n`;

      for (const msg of messages.slice(-5)) {  // Last 5 messages
        const senderLabel = msg.sender_type === 'admin' ? '🛡️ Admin' : '👤 User';
        const time = new Date(msg.created_at).toLocaleString('fr-FR', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        message += `${senderLabel} (${time}):\n${truncate(msg.message, 150)}\n\n`;
      }

      if (messages.length > 5) {
        message += `_+ ${messages.length - 5} earlier messages_\n\n`;
      }
    }

    await ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('[Telegram] Error in handleViewTicket:', error);
    await ctx.reply('❌ Error loading ticket details');
  }
}

/**
 * Set up reply flow for a ticket
 */
async function handleReplyTicket(ctx: any, ticketId: string) {
  // Answer callback IMMEDIATELY
  try {
    await ctx.answerCbQuery();
  } catch (error) {
    console.error('[Telegram] Failed to answer callback:', error);
  }

  try {
    // Fetch ticket by full UUID
    const { data: ticket, error } = await supabaseAdmin
      .from('support_tickets')
      .select('id, subject')
      .eq('id', ticketId)
      .single();

    if (error || !ticket) {
      await ctx.reply('❌ Ticket not found');
      return;
    }

    const ticketNumber = formatTicketNumber(ticketId);

    // Set reply state (backup for immediate replies)
    setReplyState(ctx.chat.id, ticketId);

    // Use ForceReply to get context even after server restart
    await ctx.reply(
      `💬 *Reply to Ticket ${ticketNumber}*\n\n` +
      `"${ticket.subject}"\n\n` +
      `📋 Ticket ID: \`${ticketId}\`\n\n` +
      `Type your message below. It will be sent to the user.\n\n` +
      `Send /cancel to cancel.`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          force_reply: true,
          selective: true
        }
      }
    );
  } catch (error) {
    console.error('[Telegram] Error in handleReplyTicket:', error);
    await ctx.reply('❌ Error setting up reply');
  }
}

/**
 * Mark ticket as resolved
 */
async function handleResolveTicket(ctx: any, ticketId: string) {
  // Answer callback IMMEDIATELY
  try {
    await ctx.answerCbQuery();
  } catch (error) {
    console.error('[Telegram] Failed to answer callback:', error);
  }

  try {
    // Verify ticket exists
    const { data: ticket, error: fetchError } = await supabaseAdmin
      .from('support_tickets')
      .select('id')
      .eq('id', ticketId)
      .single();

    if (fetchError || !ticket) {
      await ctx.reply('❌ Ticket not found');
      return;
    }

    // Call RPC function to update ticket status
    const { error } = await supabaseAdmin.rpc('update_ticket_status', {
      p_ticket_id: ticketId,
      p_status: 'resolved',
      p_resolved_at: new Date().toISOString()
    });

    if (error) {
      console.error('[Telegram] Error resolving ticket:', error);
      await ctx.reply('❌ Error resolving ticket');
      return;
    }

    const ticketNumber = formatTicketNumber(ticketId);

    await ctx.reply(
      `✅ *Ticket ${ticketNumber} resolved!*\n\n` +
      `The user has been notified.`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('[Telegram] Error in handleResolveTicket:', error);
    await ctx.reply('❌ Error resolving ticket');
  }
}

/**
 * Handle fix ticket with Claude Agent (Phase 4)
 */
async function handleFixTicket(ctx: any, ticketId: string) {
  // Answer callback IMMEDIATELY
  try {
    await ctx.answerCbQuery('Starting Hive Doctor...');
  } catch (error) {
    console.error('[Telegram] Failed to answer callback:', error);
  }

  const chatId = ctx.chat.id;

  try {
    // Verify ticket exists and is a bug
    const { data: ticket, error: fetchError } = await supabaseAdmin
      .from('support_tickets')
      .select('id, category, subject')
      .eq('id', ticketId)
      .single();

    if (fetchError || !ticket) {
      await ctx.reply('❌ Ticket not found');
      return;
    }

    if (ticket.category !== 'bug') {
      await ctx.reply('⚠️ Only bug tickets can be auto-fixed.\n\nThis ticket is categorized as: ' + ticket.category);
      return;
    }

    const ticketNumber = formatTicketNumber(ticketId);

    // Send "working on it" message
    await ctx.reply(
      `🤖 *Hive Doctor is analyzing ticket ${ticketNumber}*\n\n` +
      `"${ticket.subject}"\n\n` +
      `This may take 2-5 minutes. I'll notify you when done.\n\n` +
      `The agent will:\n` +
      `• 📋 Analyze the bug report\n` +
      `• 🔍 Investigate the codebase\n` +
      `• 🛠️ Write a fix in an isolated branch\n` +
      `• ✅ Run tests\n` +
      `• 📝 Create a GitHub Pull Request\n\n` +
      `_You can continue working, I'll ping you when ready._`,
      { parse_mode: 'Markdown' }
    );

    // Run agent asynchronously (don't block)
    const FOUNDER_USER_ID = process.env.FOUNDER_USER_ID;
    const REPO_PATH = process.env.CLAUDE_AGENT_REPO_PATH || '/Users/azzedinezazai/Documents/Agency-Killer-V4/cockpit';

    if (!FOUNDER_USER_ID) {
      await ctx.reply('❌ Server configuration error. FOUNDER_USER_ID not set.');
      console.error('[Telegram] FOUNDER_USER_ID not set in environment variables');
      return;
    }

    logger.log(`[Telegram] Starting Claude Agent fix for ticket ${ticketId}`);

    claudeAgentService.fixTicket({
      ticketId,
      adminUserId: FOUNDER_USER_ID,
      repoPath: REPO_PATH
    }).then(async (result) => {
      logger.log(`[Telegram] Agent completed for ticket ${ticketId}:`, result.status);

      // Send result notification
      await sendAgentResultNotification(chatId, ticketId, result);

    }).catch(async (error) => {
      console.error(`[Telegram] Agent failed for ticket ${ticketId}:`, error);

      await bot!.telegram.sendMessage(
        chatId,
        `❌ *Hive Doctor Fix Failed*\n\n` +
        `Ticket: ${ticketNumber}\n` +
        `Error: ${error.message}\n\n` +
        `The agent was unable to fix this bug automatically. Manual intervention required.\n\n` +
        `Possible reasons:\n` +
        `• Bug is too complex for autonomous fix\n` +
        `• Security-sensitive code involved\n` +
        `• Tests failing after attempted fix\n` +
        `• Missing context or unclear description\n\n` +
        `Please assign to a human developer.`,
        { parse_mode: 'Markdown' }
      );
    });

  } catch (error: unknown) {
    console.error('[Telegram] Error in handleFixTicket:', error);
    await ctx.reply(`❌ Error starting agent: ${error.message}`);
  }
}

/**
 * Send a reply to a ticket
 */
async function sendTicketReply(ticketId: string, message: string) {
  // Founder user ID (super admin sending messages via Telegram)
  const FOUNDER_USER_ID = process.env.FOUNDER_USER_ID;

  if (!FOUNDER_USER_ID) {
    console.error('[Telegram] FOUNDER_USER_ID not set in environment variables');
    throw new Error('Server configuration error: FOUNDER_USER_ID not set');
  }

  // Use RPC with SECURITY DEFINER to bypass auth.users permission issue
  const { data, error } = await supabaseAdmin.rpc('telegram_create_admin_message', {
    p_ticket_id: ticketId,
    p_sender_id: FOUNDER_USER_ID,
    p_message: message,
    p_attachments: []
  });

  if (error) {
    console.error('[Telegram] Error sending reply:', error);
    throw error;
  }

  logger.log(`[Telegram] ✓ Reply sent to ticket ${ticketId}`);
  return data;
}

// ─────────────────────────────────────────────────────────────────
// Reply State Management (in-memory for now)
// ─────────────────────────────────────────────────────────────────

interface ReplyState {
  ticketId: string;
  timestamp: number;
}

const replyStates = new Map<number, ReplyState>();

function setReplyState(chatId: number, ticketId: string) {
  replyStates.set(chatId, {
    ticketId,
    timestamp: Date.now()
  });

  // Auto-clear after 5 minutes
  setTimeout(() => {
    if (replyStates.get(chatId)?.timestamp === replyStates.get(chatId)?.timestamp) {
      replyStates.delete(chatId);
    }
  }, 5 * 60 * 1000);
}

function getReplyState(chatId: number): ReplyState | undefined {
  return replyStates.get(chatId);
}

function clearReplyState(chatId: number) {
  replyStates.delete(chatId);
}

function formatTicketNumber(ticketId: string): string {
  const last4 = ticketId.slice(-4);
  const num = parseInt(last4, 16) % 10000;
  return `TK-${num.toString().padStart(4, '0')}`;
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

export default router;
