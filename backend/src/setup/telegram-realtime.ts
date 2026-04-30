/**
 * Supabase Realtime Listener for Support Tickets
 * Sends Telegram notifications when new tickets are created
 */

import { supabaseAdmin } from '../services/supabase.service.js';
import { notifyTicketCreated } from '../services/telegram.service.js';
import { analyzeTicket } from '../services/ai-triage.service.js';
import type { TicketNotificationData } from '../types/telegram.types.js';
import { logger } from '../lib/logger.js';

let realtimeChannel: ReturnType<typeof supabaseAdmin.channel> | null = null;
let retryCount = 0;
let retryTimeout: NodeJS.Timeout | null = null;
const MAX_RETRIES = 10;
const RETRY_DELAY_MS = 5000; // 5 seconds

/**
 * Format ticket number (TK-XXXX)
 */
function formatTicketNumber(ticketId: string): string {
  const last4 = ticketId.slice(-4);
  const num = parseInt(last4, 16) % 10000;
  return `TK-${num.toString().padStart(4, '0')}`;
}

/**
 * Start listening to support_tickets INSERT events
 */
export async function startTelegramRealtimeListener() {
  logger.log('[Telegram Realtime] Starting listener for support_tickets...');

  // Unsubscribe existing channel if any
  if (realtimeChannel) {
    await supabaseAdmin.removeChannel(realtimeChannel);
  }

  // Create new channel
  realtimeChannel = supabaseAdmin
    .channel('support-tickets-realtime')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'support_tickets',
      },
      async (payload) => {
        logger.log('[Telegram Realtime] 🔥 Received INSERT event!', payload);
        try {
          const ticket = payload.new as any;

          logger.log(
            `[Telegram Realtime] New ticket created: ${formatTicketNumber(ticket.id)} - ${ticket.priority}`
          );

          // Get user email from auth.users
          const { data: user } = await supabaseAdmin.auth.admin.getUserById(ticket.user_id);

          // Phase 3: AI Triage
          let aiAnalysis = null;
          try {
            logger.log('[Telegram Realtime] 🤖 Running AI triage...');
            aiAnalysis = await analyzeTicket(
              ticket.subject,
              ticket.description,
              ticket.category,
              ticket.priority
            );

            if (aiAnalysis) {
              logger.log('[Telegram Realtime] ✓ AI triage completed:', {
                category: aiAnalysis.suggested_category,
                priority: aiAnalysis.suggested_priority,
                confidence: aiAnalysis.confidence,
              });
            }
          } catch (error) {
            console.error('[Telegram Realtime] AI triage failed (non-blocking):', error);
          }

          const notificationData: TicketNotificationData = {
            ticket_id: ticket.id,
            ticket_number: formatTicketNumber(ticket.id),
            user_email: user?.user?.email || 'Unknown',
            subject: ticket.subject,
            description: ticket.description,
            category: ticket.category,
            priority: ticket.priority,
            status: ticket.status,
            created_at: ticket.created_at,
            // AI Triage data (Phase 3)
            ai_category: aiAnalysis?.suggested_category,
            ai_priority: aiAnalysis?.suggested_priority,
            likely_files: aiAnalysis?.likely_files || [],
            ai_confidence: aiAnalysis?.confidence,
            ai_reasoning: aiAnalysis?.reasoning,
            suggested_response: aiAnalysis?.suggested_response,
          };

          // Send Telegram notification
          await notifyTicketCreated(notificationData);
        } catch (error) {
          console.error('[Telegram Realtime] Error processing new ticket:', error);
        }
      }
    )
    .subscribe((status, err) => {
      logger.log(`[Telegram Realtime] 📡 Subscription status: ${status}`, err ? err : '');
      if (status === 'SUBSCRIBED') {
        logger.log('[Telegram Realtime] ✓ Subscribed to support_tickets INSERT events');
        logger.log('[Telegram Realtime] 🎧 Listening for new tickets...');
        retryCount = 0; // Reset retry count on successful connection
      } else if (status === 'CLOSED') {
        logger.log('[Telegram Realtime] ❌ Channel closed');
        scheduleReconnect();
      } else if (status === 'CHANNEL_ERROR') {
        console.error('[Telegram Realtime] ⚠️ Channel error:', err);
        scheduleReconnect();
      } else if (status === 'TIMED_OUT') {
        console.error('[Telegram Realtime] ⏱️ Connection timed out');
        scheduleReconnect();
      }
    });
}

/**
 * Schedule reconnection with exponential backoff
 */
function scheduleReconnect() {
  if (retryCount >= MAX_RETRIES) {
    console.error('[Telegram Realtime] ❌ Max retries reached. Stopping reconnection attempts.');
    return;
  }

  if (retryTimeout) {
    clearTimeout(retryTimeout);
  }

  const delay = RETRY_DELAY_MS * Math.pow(2, retryCount); // Exponential backoff
  retryCount++;

  logger.log(`[Telegram Realtime] 🔄 Scheduling reconnection attempt ${retryCount}/${MAX_RETRIES} in ${delay}ms...`);

  retryTimeout = setTimeout(() => {
    logger.log(`[Telegram Realtime] 🔌 Reconnection attempt ${retryCount}...`);
    startTelegramRealtimeListener();
  }, delay);
}

/**
 * Stop listening
 */
export async function stopTelegramRealtimeListener() {
  if (realtimeChannel) {
    logger.log('[Telegram Realtime] Stopping listener...');
    await supabaseAdmin.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }
}
