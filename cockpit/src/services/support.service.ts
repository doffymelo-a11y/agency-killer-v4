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
  TicketCategory,
  EmailPreferences,
  InternalNote,
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

// ─────────────────────────────────────────────────────────────────
// Email Preferences (Phase 2)
// ─────────────────────────────────────────────────────────────────

/**
 * Get email preferences for current user
 */
export async function getEmailPreferences(): Promise<EmailPreferences | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('user_email_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Return defaults if no preferences exist yet
  if (error && error.code === 'PGRST116') {
    return {
      user_id: user.id,
      notify_on_message: true,
      notify_on_status_change: true,
      notify_on_assignment: true,
      notify_on_resolution: true,
      updated_at: new Date().toISOString(),
    };
  }

  if (error) throw error;
  return data;
}

/**
 * Update email preferences for current user
 */
export async function updateEmailPreferences(
  preferences: Partial<Omit<EmailPreferences, 'user_id' | 'updated_at'>>
): Promise<EmailPreferences> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('user_email_preferences')
    .upsert(
      {
        user_id: user.id,
        ...preferences,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─────────────────────────────────────────────────────────────────
// Internal Notes (Phase 2 - Admin Only)
// ─────────────────────────────────────────────────────────────────

/**
 * Get all internal notes for a ticket (admin only)
 */
export async function getInternalNotes(ticketId: string): Promise<InternalNote[]> {
  const { data, error } = await supabase.rpc('get_ticket_internal_notes', {
    p_ticket_id: ticketId,
  });

  if (error) throw error;
  return data || [];
}

/**
 * Create a new internal note (admin only)
 */
export async function createInternalNote(ticketId: string, note: string): Promise<InternalNote> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  // Validate note length
  if (!note.trim() || note.length < 1) {
    throw new Error('Note cannot be empty');
  }

  if (note.length > 5000) {
    throw new Error('Note cannot exceed 5000 characters');
  }

  const { data, error } = await supabase
    .from('support_internal_notes')
    .insert({
      ticket_id: ticketId,
      author_id: user.id,
      note: note.trim(),
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as InternalNote;
}

/**
 * Update an internal note (admin only, author only)
 */
export async function updateInternalNote(noteId: string, note: string): Promise<InternalNote> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  // Validate note length
  if (!note.trim() || note.length < 1) {
    throw new Error('Note cannot be empty');
  }

  if (note.length > 5000) {
    throw new Error('Note cannot exceed 5000 characters');
  }

  const { data, error } = await supabase
    .from('support_internal_notes')
    .update({
      note: note.trim(),
    })
    .eq('id', noteId)
    .eq('author_id', user.id) // Only author can update
    .select('*')
    .single();

  if (error) throw error;
  return data as InternalNote;
}

/**
 * Delete an internal note (admin only, author only)
 */
export async function deleteInternalNote(noteId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('support_internal_notes')
    .delete()
    .eq('id', noteId)
    .eq('author_id', user.id); // Only author can delete

  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────────
// Knowledge Base
// ─────────────────────────────────────────────────────────────────

export interface KBArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  category: string;
  tags: string[];
  view_count: number;
  helpful_score?: number;
  relevance?: number;
  published_at?: string;
}

/**
 * Search knowledge base articles
 */
export async function searchKnowledgeBase(
  query: string,
  limit: number = 5,
  categoryFilter?: string
): Promise<KBArticle[]> {
  const { data, error } = await supabase.rpc('search_kb_articles', {
    search_query: query,
    limit_count: limit,
    category_filter: categoryFilter || null,
  });

  if (error) throw error;
  return data || [];
}

/**
 * Get popular KB articles
 */
export async function getPopularArticles(limit: number = 10): Promise<KBArticle[]> {
  const { data, error } = await supabase.rpc('get_popular_kb_articles', {
    limit_count: limit,
  });

  if (error) throw error;
  return data || [];
}

/**
 * Get articles by category
 */
export async function getArticlesByCategory(
  category: string,
  limit: number = 20
): Promise<KBArticle[]> {
  const { data, error } = await supabase.rpc('get_kb_articles_by_category', {
    p_category: category,
    limit_count: limit,
  });

  if (error) throw error;
  return data || [];
}

/**
 * Get a single article by slug
 */
export async function getArticleBySlug(slug: string): Promise<KBArticle | null> {
  const { data, error } = await supabase
    .from('kb_articles')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }

  // Increment view count (fire and forget)
  supabase.rpc('increment_article_view', { p_article_id: data.id });

  return data;
}

/**
 * Mark article as helpful/not helpful
 */
export async function markArticleHelpful(
  articleId: string,
  isHelpful: boolean
): Promise<void> {
  const { error } = await supabase.rpc('mark_article_helpful', {
    p_article_id: articleId,
    p_is_helpful: isHelpful,
  });

  if (error) throw error;
}

/**
 * Get KB stats (admin only)
 */
export async function getKBStats() {
  const { data, error } = await supabase.rpc('get_kb_stats');

  if (error) throw error;
  return data && data.length > 0 ? data[0] : null;
}

// ─────────────────────────────────────────────────────────────────
// Ticket Templates
// ─────────────────────────────────────────────────────────────────

export interface TicketTemplate {
  id: string;
  name: string;
  description: string;
  category: TicketCategory;
  subject_template: string;
  description_template: string;
  is_featured: boolean;
  usage_count: number;
}

/**
 * Get public ticket templates
 */
export async function getPublicTemplates(
  categoryFilter?: TicketCategory
): Promise<TicketTemplate[]> {
  const { data, error } = await supabase.rpc('get_public_templates', {
    category_filter: categoryFilter || null,
  });

  if (error) throw error;
  return data || [];
}

/**
 * Increment template usage count
 */
export async function incrementTemplateUsage(templateId: string): Promise<void> {
  const { error } = await supabase.rpc('increment_template_usage', {
    p_template_id: templateId,
  });

  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────────
// Admin Response Templates
// ─────────────────────────────────────────────────────────────────

export interface ResponseTemplate {
  id: string;
  title: string;
  body: string;
  category: TicketCategory | null;
  is_shared: boolean;
  usage_count: number;
  created_by: string;
}

/**
 * Get response templates (admin only)
 */
export async function getResponseTemplates(
  categoryFilter?: TicketCategory
): Promise<ResponseTemplate[]> {
  const { data, error } = await supabase.rpc('get_response_templates', {
    category_filter: categoryFilter || null,
  });

  if (error) throw error;
  return data || [];
}

/**
 * Increment response template usage
 */
export async function incrementResponseTemplateUsage(templateId: string): Promise<void> {
  const { error } = await supabase.rpc('increment_response_template_usage', {
    p_template_id: templateId,
  });

  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────────
// Duplicate Detection (Vector Search)
// ─────────────────────────────────────────────────────────────────

export interface SimilarTicket {
  id: string;
  ticket_number: string;
  subject: string;
  description: string;
  category: TicketCategory;
  status: TicketStatus;
  priority: TicketPriority;
  created_at: string;
  similarity: number; // 0.0 to 1.0
}

/**
 * Generate embedding for a ticket using OpenAI
 */
export async function generateTicketEmbedding(
  ticketId: string,
  text?: string
): Promise<{ success: boolean; similar_tickets: SimilarTicket[] }> {
  const { data, error } = await supabase.functions.invoke('generate-ticket-embedding', {
    body: {
      ticket_id: ticketId,
      text,
      find_similar: true,
    },
  });

  if (error) throw error;
  return data;
}

/**
 * Find similar/duplicate tickets for a given ticket ID
 */
export async function findTicketDuplicates(
  ticketId: string,
  similarityThreshold: number = 0.80,
  limit: number = 5
): Promise<SimilarTicket[]> {
  const { data, error } = await supabase.rpc('find_ticket_duplicates', {
    p_ticket_id: ticketId,
    similarity_threshold: similarityThreshold,
    limit_count: limit,
  });

  if (error) throw error;
  return data || [];
}

/**
 * Mark a ticket as duplicate (admin only)
 */
export async function markTicketAsDuplicate(
  ticketId: string,
  originalTicketId: string
): Promise<void> {
  const { error } = await supabase.rpc('mark_ticket_as_duplicate', {
    p_ticket_id: ticketId,
    p_original_ticket_id: originalTicketId,
  });

  if (error) throw error;
}
