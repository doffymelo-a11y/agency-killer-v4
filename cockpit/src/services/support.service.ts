/**
 * Support Service
 * Handle all support ticket operations (CRUD, Realtime, etc.)
 */

import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type {
  SupportTicket,
  SupportMessage,
  SupportTicketWithUser,
  SupportMessageWithSender,
  CreateTicketParams,
  UpdateTicketParams,
  CreateMessageParams,
  TicketFilters,
  TicketStats,
  TicketStatus,
  TicketPriority,
} from '../types/support.types';

// ─────────────────────────────────────────────────────────────────
// Tickets CRUD
// ─────────────────────────────────────────────────────────────────

/**
 * Create a new support ticket
 */
export async function createTicket(params: CreateTicketParams): Promise<SupportTicket> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('support_tickets')
    .insert({
      user_id: user.id,
      subject: params.subject,
      description: params.description,
      category: params.category,
      project_id: params.project_id || null,
      page_url: params.page_url || null,
      user_agent: params.user_agent || null,
      screenshot_url: params.screenshot_url || null,
      priority: getPriorityByCategory(params.category),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get current user's tickets (optionally filtered by status)
 */
export async function getMyTickets(statusFilter?: TicketStatus): Promise<SupportTicketWithUser[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  let query = supabase
    .from('support_tickets')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(50);

  if (statusFilter) {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

/**
 * Get a single ticket by ID
 */
export async function getTicket(ticketId: string): Promise<SupportTicket> {
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('id', ticketId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update a ticket (user can only update their own tickets)
 */
export async function updateTicket(
  ticketId: string,
  updates: UpdateTicketParams
): Promise<SupportTicket> {
  const { data, error } = await supabase
    .from('support_tickets')
    .update(updates)
    .eq('id', ticketId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Mark ticket as resolved (user action)
 */
export async function markTicketResolved(ticketId: string): Promise<SupportTicket> {
  return updateTicket(ticketId, { status: 'resolved' });
}

/**
 * Close a ticket (admin or user action)
 */
export async function closeTicket(ticketId: string): Promise<SupportTicket> {
  return updateTicket(ticketId, { status: 'closed' });
}

// ─────────────────────────────────────────────────────────────────
// Messages CRUD
// ─────────────────────────────────────────────────────────────────

/**
 * Get all messages for a ticket
 */
export async function getTicketMessages(
  ticketId: string
): Promise<SupportMessageWithSender[]> {
  const { data, error } = await supabase
    .from('support_messages')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Send a message in a ticket
 */
export async function sendMessage(params: CreateMessageParams): Promise<SupportMessage> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('support_messages')
    .insert({
      ticket_id: params.ticket_id,
      sender_id: user.id,
      sender_type: params.sender_type,
      message: params.message,
      attachments: params.attachments || [],
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(ticketId: string, messageIds: string[]): Promise<void> {
  if (messageIds.length === 0) return;

  const { error } = await supabase
    .from('support_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('ticket_id', ticketId)
    .in('id', messageIds)
    .is('read_at', null);

  if (error) throw error;
}

/**
 * Mark all unread admin messages as read for a ticket
 */
export async function markTicketMessagesAsRead(ticketId: string): Promise<void> {
  const { error } = await supabase
    .from('support_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('ticket_id', ticketId)
    .eq('sender_type', 'admin')
    .is('read_at', null);

  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────────
// Admin Functions
// ─────────────────────────────────────────────────────────────────

/**
 * Get all tickets (admin only) with optional filters
 */
export async function getAllTickets(filters?: TicketFilters): Promise<SupportTicketWithUser[]> {
  let query = supabase.from('support_tickets').select('*').order('updated_at', { ascending: false });

  if (filters) {
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status);
      } else {
        query = query.eq('status', filters.status);
      }
    }

    if (filters.priority) {
      if (Array.isArray(filters.priority)) {
        query = query.in('priority', filters.priority);
      } else {
        query = query.eq('priority', filters.priority);
      }
    }

    if (filters.category) {
      if (Array.isArray(filters.category)) {
        query = query.in('category', filters.category);
      } else {
        query = query.eq('category', filters.category);
      }
    }

    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    if (filters.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to);
    }

    if (filters.search) {
      query = query.or(`subject.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

/**
 * Update ticket status (admin only)
 */
export async function updateTicketStatus(
  ticketId: string,
  status: TicketStatus
): Promise<SupportTicket> {
  return updateTicket(ticketId, { status });
}

/**
 * Update ticket priority (admin only)
 */
export async function updateTicketPriority(
  ticketId: string,
  priority: TicketPriority
): Promise<SupportTicket> {
  return updateTicket(ticketId, { priority });
}

/**
 * Assign ticket to admin (admin only)
 */
export async function assignTicket(ticketId: string, adminUserId: string | null): Promise<SupportTicket> {
  return updateTicket(ticketId, { assigned_to: adminUserId });
}

/**
 * Get ticket statistics (admin only)
 */
export async function getTicketStats(): Promise<TicketStats> {
  const { data, error } = await supabase.rpc('get_ticket_stats');

  if (error) throw error;

  return {
    open_count: Number(data.open_count || 0),
    in_progress_count: Number(data.in_progress_count || 0),
    waiting_user_count: Number(data.waiting_user_count || 0),
    resolved_count: Number(data.resolved_count || 0),
    closed_count: Number(data.closed_count || 0),
    total_count: Number(data.total_count || 0),
    high_priority_count: Number(data.high_priority_count || 0),
    critical_priority_count: Number(data.critical_priority_count || 0),
  };
}

// ─────────────────────────────────────────────────────────────────
// Realtime Subscriptions
// ─────────────────────────────────────────────────────────────────

/**
 * Subscribe to messages for a specific ticket (realtime)
 */
export function subscribeToTicketMessages(
  ticketId: string,
  callback: (message: SupportMessage) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`ticket-messages-${ticketId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'support_messages',
        filter: `ticket_id=eq.${ticketId}`,
      },
      (payload) => {
        callback(payload.new as SupportMessage);
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to ticket updates (status, priority, etc.)
 */
export function subscribeToTicketUpdates(
  ticketId: string,
  callback: (ticket: SupportTicket) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`ticket-updates-${ticketId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'support_tickets',
        filter: `id=eq.${ticketId}`,
      },
      (payload) => {
        callback(payload.new as SupportTicket);
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to all tickets (admin only - for dashboard)
 */
export function subscribeToAllTickets(
  callback: (ticket: SupportTicket, event: 'INSERT' | 'UPDATE' | 'DELETE') => void
): RealtimeChannel {
  const channel = supabase
    .channel('all-tickets')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'support_tickets',
      },
      (payload) => {
        callback(payload.new as SupportTicket, payload.eventType as any);
      }
    )
    .subscribe();

  return channel;
}

// ─────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────

/**
 * Get unread message count for current user
 */
export async function getUnreadMessageCount(): Promise<number> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return 0;

  const { data, error } = await supabase.rpc('get_user_unread_ticket_messages', {
    p_user_id: user.id,
  });

  if (error) {
    console.error('[Support] Error getting unread count:', error);
    return 0;
  }

  return Number(data || 0);
}

/**
 * Auto-determine priority based on category (as per PRD)
 */
function getPriorityByCategory(category: string): TicketPriority {
  switch (category) {
    case 'bug':
      return 'high';
    case 'integration':
      return 'medium';
    case 'billing':
      return 'medium';
    case 'feature_request':
      return 'low';
    case 'question':
      return 'low';
    case 'other':
      return 'medium';
    default:
      return 'medium';
  }
}

/**
 * Format ticket number for display (TK-XXXX)
 */
export function formatTicketNumber(ticketId: string): string {
  // Get last 4 chars of UUID and convert to number
  const last4 = ticketId.slice(-4);
  const num = parseInt(last4, 16) % 10000;
  return `TK-${num.toString().padStart(4, '0')}`;
}

/**
 * Get relative time string (e.g., "Il y a 2h")
 */
export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffMs / 604800000);

  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins}min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  if (diffWeeks < 4) return `Il y a ${diffWeeks}sem`;
  return date.toLocaleDateString('fr-FR');
}
