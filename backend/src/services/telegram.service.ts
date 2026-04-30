/**
 * Telegram Bot Service
 * Handles all Telegram interactions for support ticket notifications
 */

import { Telegraf, Markup } from 'telegraf';
import { supabaseAdmin } from './supabase.service.js';
import type {
  TelegramChatLink,
  TicketNotificationData,
  TelegramCallbackData,
} from '../types/telegram.types.js';

// ─────────────────────────────────────────────────────────────────
// Bot Initialization
// ─────────────────────────────────────────────────────────────────

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_SECRET_TOKEN = process.env.TELEGRAM_SECRET_TOKEN || 'hive_os_secure_token_2026';

if (!TELEGRAM_BOT_TOKEN) {
  console.warn('[Telegram] ⚠️  TELEGRAM_BOT_TOKEN not configured');
}

export const bot = TELEGRAM_BOT_TOKEN ? new Telegraf(TELEGRAM_BOT_TOKEN) : null;

let botStarted = false;

/**
 * Initialize Telegram bot (webhook mode for development)
 * Bot is ready to receive updates and send notifications
 */
export async function initTelegramBot(): Promise<void> {
  if (!bot) {
    console.log('[Telegram] Bot not configured (no token)');
    return;
  }

  if (botStarted) {
    console.log('[Telegram] Bot already initialized');
    return;
  }

  console.log('[Telegram] ✅ Bot initialized and ready');
  console.log('[Telegram] Listening for updates via /api/telegram/webhook');
  console.log('[Telegram] Can send notifications via bot.telegram.sendMessage()');

  botStarted = true;

  // Enable graceful stop
  process.once('SIGINT', () => bot!.stop('SIGINT'));
  process.once('SIGTERM', () => bot!.stop('SIGTERM'));
}

// ─────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────

/**
 * Get priority emoji
 */
function getPriorityEmoji(priority: string): string {
  switch (priority) {
    case 'critical':
      return '🚨';
    case 'high':
      return '⚠️';
    case 'medium':
      return '📌';
    case 'low':
      return '💡';
    default:
      return '❓';
  }
}

/**
 * Get category emoji
 */
function getCategoryEmoji(category: string): string {
  switch (category) {
    case 'bug':
      return '🐛';
    case 'feature_request':
      return '✨';
    case 'question':
      return '❓';
    case 'billing':
      return '💳';
    case 'integration':
      return '🔌';
    default:
      return '📝';
  }
}

/**
 * Format ticket number (TK-XXXX)
 */
function formatTicketNumber(ticketId: string): string {
  const last4 = ticketId.slice(-4);
  const num = parseInt(last4, 16) % 10000;
  return `TK-${num.toString().padStart(4, '0')}`;
}

/**
 * Truncate text to max length
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Escape Markdown special characters for Telegram
 * Telegram MarkdownV2 requires escaping: _ * [ ] ( ) ~ ` > # + - = | { } . !
 */
function escapeMarkdown(text: string): string {
  if (!text) return '';
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

/**
 * Serialize callback data to string (Telegram limit: 64 bytes)
 * Format: action_code:full_uuid
 * Example: v:f5f8d727-1234-5678-9abc-def012345678
 * Size: 1 + 1 + 36 = 38 bytes (well under 64 byte limit)
 */
function serializeCallbackData(data: TelegramCallbackData): string {
  const actionMap: Record<string, string> = {
    view: 'v',
    reply: 'r',
    resolve: 's', // s for solve
    fix: 'f',
  };

  const actionCode = actionMap[data.action] || data.action;

  // Use FULL UUID - still fits comfortably in 64 bytes
  return `${actionCode}:${data.ticket_id}`;
}

/**
 * Parse callback data from string
 */
export function parseCallbackData(data: string): TelegramCallbackData | null {
  try {
    // Try compact format first: "v:uuid" or "r:uuid"
    // Format is: action:ticket_id (e.g., "v:f5f8d727-1234-5678-9abc-def012345678")
    const colonIndex = data.indexOf(':');

    if (colonIndex > 0) {
      const actionMap: Record<string, TelegramCallbackData['action']> = {
        v: 'view',
        r: 'reply',
        s: 'resolve',
        f: 'fix',
      };

      const actionCode = data.substring(0, colonIndex);
      const ticketId = data.substring(colonIndex + 1);
      const action = actionMap[actionCode];

      if (action) {
        return {
          action,
          ticket_id: ticketId,
        };
      }
    }

    // Fallback to JSON format
    return JSON.parse(data);
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────
// Database Functions
// ─────────────────────────────────────────────────────────────────

/**
 * Get all active super admin chat IDs (with notification preferences)
 */
async function getActiveAdminChatIds(priority: string): Promise<number[]> {
  const { data, error } = await supabaseAdmin
    .from('super_admin_telegram_chat_ids')
    .select('chat_id, notif_preferences')
    .eq('is_active', true);

  if (error) {
    console.error('[Telegram] Error fetching admin chat IDs:', error);
    return [];
  }

  if (!data || data.length === 0) {
    console.warn('[Telegram] No active super admin chat IDs found');
    return [];
  }

  // Filter based on notification preferences
  const filteredChatIds = data
    .filter((admin) => {
      const prefs = admin.notif_preferences as TelegramChatLink['notif_preferences'];
      switch (priority) {
        case 'critical':
          return prefs.critical;
        case 'high':
          return prefs.high;
        case 'medium':
          return prefs.medium;
        case 'low':
          return prefs.low;
        default:
          return true;
      }
    })
    .map((admin) => admin.chat_id);

  return filteredChatIds;
}

/**
 * Link a user to their Telegram chat ID
 */
export async function linkTelegramAccount(
  userId: string,
  chatId: number,
  username?: string,
  firstName?: string,
  lastName?: string
): Promise<void> {
  const { error } = await supabaseAdmin.from('super_admin_telegram_chat_ids').upsert(
    {
      user_id: userId,
      chat_id: chatId,
      username,
      first_name: firstName,
      last_name: lastName,
      linked_at: new Date().toISOString(),
      is_active: true,
    },
    {
      onConflict: 'user_id',
    }
  );

  if (error) {
    console.error('[Telegram] Error linking account:', error);
    throw error;
  }

  console.log(`[Telegram] ✓ Linked user ${userId} to chat ${chatId}`);
}

/**
 * Check if a chat ID is authorized (belongs to a super admin)
 */
export async function isChatIdAuthorized(chatId: number): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('super_admin_telegram_chat_ids')
    .select('chat_id')
    .eq('chat_id', chatId)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return false;
  }

  return true;
}

// ─────────────────────────────────────────────────────────────────
// Message Formatting
// ─────────────────────────────────────────────────────────────────

/**
 * Format ticket notification message
 */
function formatTicketMessage(ticket: TicketNotificationData): string {
  const priorityEmoji = getPriorityEmoji(ticket.priority);
  const categoryEmoji = getCategoryEmoji(ticket.category);
  const ticketNumber = formatTicketNumber(ticket.ticket_id);

  // Escape dynamic data to prevent Markdown parsing errors
  const userEmail = escapeMarkdown(ticket.user_email);
  const subject = escapeMarkdown(truncate(ticket.subject, 60));
  const description = escapeMarkdown(truncate(ticket.description, 200));

  let message = `${priorityEmoji} *${ticket.priority.toUpperCase()}* — ${ticketNumber}\n\n`;
  message += `👤 ${userEmail}\n`;
  message += `${categoryEmoji} ${ticket.category}\n\n`;
  message += `📝 *${subject}*\n\n`;
  message += `${description}\n\n`;

  // AI Triage info (Phase 3)
  if (ticket.ai_category || ticket.ai_priority || ticket.likely_files) {
    message += `🤖 *AI Triage Analysis:*\n`;

    if (ticket.ai_category && ticket.ai_category !== ticket.category) {
      message += `  📊 Suggested category: ${escapeMarkdown(ticket.ai_category)}\n`;
    }

    if (ticket.ai_priority && ticket.ai_priority !== ticket.priority) {
      message += `  ⚡ Suggested priority: ${escapeMarkdown(ticket.ai_priority)}\n`;
    }

    if (ticket.likely_files && ticket.likely_files.length > 0) {
      const filesStr = ticket.likely_files.slice(0, 3).map(f => escapeMarkdown(f)).join(', ');
      message += `  📂 Likely components: ${filesStr}\n`;
    }

    if (ticket.ai_confidence) {
      const confidencePct = Math.round(ticket.ai_confidence * 100);
      message += `  🎯 Confidence: ${confidencePct}%\n`;
    }

    if (ticket.suggested_response) {
      const suggestedResp = escapeMarkdown(truncate(ticket.suggested_response, 150));
      message += `\n💡 *Suggested response:*\n_${suggestedResp}_\n`;
    }

    message += `\n`;
  }

  message += `⏰ ${new Date(ticket.created_at).toLocaleString('fr-FR')}`;

  return message;
}

/**
 * Create inline keyboard for ticket notification
 */
function createTicketKeyboard(ticketId: string) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('📋 View', serializeCallbackData({ action: 'view', ticket_id: ticketId })),
      Markup.button.callback(
        '🤖 Fix with Claude',
        serializeCallbackData({ action: 'fix', ticket_id: ticketId })
      ),
    ],
    [
      Markup.button.callback('💬 Reply', serializeCallbackData({ action: 'reply', ticket_id: ticketId })),
      Markup.button.callback('✅ Resolve', serializeCallbackData({ action: 'resolve', ticket_id: ticketId })),
    ],
  ]);
}

// ─────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────

/**
 * Send ticket notification to all active super admins
 */
export async function notifyTicketCreated(ticket: TicketNotificationData): Promise<void> {
  if (!bot) {
    console.warn('[Telegram] Bot not configured, skipping notification');
    return;
  }

  try {
    const chatIds = await getActiveAdminChatIds(ticket.priority);

    if (chatIds.length === 0) {
      console.warn('[Telegram] No chat IDs to notify');
      return;
    }

    const message = formatTicketMessage(ticket);
    const keyboard = createTicketKeyboard(ticket.ticket_id);

    // Send to all admins in parallel
    const sendPromises = chatIds.map((chatId) =>
      bot.telegram
        .sendMessage(chatId, message, {
          parse_mode: 'Markdown',
          ...keyboard,
        })
        .catch((err) => {
          console.error(`[Telegram] Failed to send to chat ${chatId}:`, err.message);
        })
    );

    await Promise.all(sendPromises);

    console.log(`[Telegram] ✓ Sent notification to ${chatIds.length} admin(s)`);
  } catch (error) {
    console.error('[Telegram] Error sending notification:', error);
  }
}

/**
 * Send a simple text message to a specific chat
 */
export async function sendMessage(chatId: number, text: string): Promise<void> {
  if (!bot) {
    console.warn('[Telegram] Bot not configured');
    return;
  }

  try {
    await bot.telegram.sendMessage(chatId, text, {
      parse_mode: 'Markdown',
    });
    console.log(`[Telegram] ✓ Sent message to chat ${chatId}`);
  } catch (error) {
    console.error(`[Telegram] Error sending message to chat ${chatId}:`, error);
  }
}

/**
 * Verify Telegram webhook secret token
 */
export function verifyTelegramRequest(secretToken: string): boolean {
  return secretToken === TELEGRAM_SECRET_TOKEN;
}

/**
 * Get bot info (for debugging)
 */
export async function getBotInfo() {
  if (!bot) {
    return null;
  }

  try {
    const me = await bot.telegram.getMe();
    return {
      id: me.id,
      username: me.username,
      first_name: me.first_name,
    };
  } catch (error) {
    console.error('[Telegram] Error getting bot info:', error);
    return null;
  }
}

/**
 * Send agent fix result notification (Phase 4)
 * Format matches exact spec from PRD
 */
export async function sendAgentResultNotification(
  chatId: number,
  ticketId: string,
  result: {
    status: 'completed' | 'failed';
    prUrl?: string;
    prNumber?: number;
    filesChanged: string[];
    testsPassed: boolean;
    errorMessage?: string;
    report?: any; // AgentReport with root_cause, fix_summary, risk
  }
): Promise<void> {
  if (!bot) {
    console.warn('[Telegram] Bot not configured');
    return;
  }

  try {
    if (result.status === 'completed' && result.report) {
      // SUCCESS - EXACT format from user spec
      const riskEmoji = result.report.risk === 'low' ? '🟢' : result.report.risk === 'medium' ? '🟡' : '🔴';
      const testsEmoji = result.testsPassed ? '✅' : '⚠️';

      const message = `✅ Fix ready — TK-${ticketId.slice(0, 8)}

Root cause:
${result.report.root_cause}

What changed:
${result.report.fix_summary}

📁 ${result.filesChanged.length} files · ${testsEmoji} ${result.report.tests_status} · ${riskEmoji} ${result.report.risk} risk`;

      await bot.telegram.sendMessage(chatId, message, {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '👀 Review PR',
                url: result.prUrl!,
              },
            ],
            [
              {
                text: '✅ Merge & Resolve',
                callback_data: `merge:${ticketId}`,
              },
              {
                text: '❌ Reject',
                callback_data: `reject:${ticketId}`,
              },
            ],
            [
              {
                text: '💬 Ask Claude',
                callback_data: `ask:${ticketId}`,
              },
            ],
          ],
        },
      });

      console.log(`[Telegram] ✓ Sent fix success notification to chat ${chatId}`);
    } else {
      // FAILURE
      const message = `❌ Hive Doctor Fix Failed

Ticket: #${ticketId.slice(0, 8)}
Error: ${result.errorMessage}

The agent was unable to fix this bug automatically. Manual intervention required.

Possible reasons:
• Bug is too complex for autonomous fix
• Security-sensitive code involved
• Tests failing after attempted fix
• Missing context or unclear description

Please assign to a human developer.`;

      await bot.telegram.sendMessage(chatId, message);

      console.log(`[Telegram] ✓ Sent fix failure notification to chat ${chatId}`);
    }
  } catch (error) {
    console.error(`[Telegram] Error sending agent result notification:`, error);
  }
}
