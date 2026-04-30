/**
 * Database entity types (Supabase tables)
 * Generated from schema, updated 2026-04-28
 */

// ────────────────────────────────────────────────────────────────
// Support System
// ────────────────────────────────────────────────────────────────

export interface SupportTicket {
  id: string;
  user_id: string;
  project_id: string | null;
  subject: string;
  description: string;
  category: 'bug' | 'feature-request' | 'help' | 'billing' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  page_url: string | null;
  screenshot_url: string | null;
  user_agent: string | null;
  assigned_to: string | null;
  first_response_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  sla_breached: boolean;
  sla_breach_reason: string | null;
  ai_suggested_category: string | null;
  ai_suggested_priority: string | null;
  ai_confidence: number | null;
  ai_reasoning: string | null;
  urgency_score: number | null;
  sentiment: string | null;
  ai_analyzed_at: string | null;
  embedding: number[] | null;
  embedding_generated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_type: 'user' | 'admin' | 'system';
  sender_id: string | null;
  message: string;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupportInternalNote {
  id: string;
  ticket_id: string;
  author_id: string;
  note: string;
  created_at: string;
  updated_at: string;
}

// ────────────────────────────────────────────────────────────────
// Users & Roles
// ────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  role?: {
    role: 'user' | 'admin' | 'super_admin';
  }[];
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'user' | 'admin' | 'super_admin';
  created_at: string;
  updated_at: string;
}

// ────────────────────────────────────────────────────────────────
// Projects
// ────────────────────────────────────────────────────────────────

export interface Project {
  id: string;
  user_id: string;
  project_name: string;
  industry: string | null;
  target_audience: string | null;
  brand_voice: string | null;
  budget: number | null;
  goals: string[] | null;
  kpis: string[] | null;
  timeline: string | null;
  competitors_list: string | null;
  negative_keywords_list: string | null;
  tracking_events_list: string | null;
  created_at: string;
  updated_at: string;
}

// ────────────────────────────────────────────────────────────────
// System Logs
// ────────────────────────────────────────────────────────────────

export interface SystemLog {
  id: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  source: string;
  agent_id: string | null;
  user_id: string | null;
  project_id: string | null;
  action: string;
  message: string;
  metadata: Record<string, unknown> | null;
  timestamp: string;
  created_at: string;
}

// ────────────────────────────────────────────────────────────────
// CMS Changes
// ────────────────────────────────────────────────────────────────

export interface CMSChange {
  id: string;
  change_id: string;
  user_id: string;
  project_id: string | null;
  cms_type: string;
  site_url: string;
  content_type: string;
  content_id: string;
  action: 'create' | 'update' | 'delete';
  previous_state: Record<string, unknown> | null;
  new_state: Record<string, unknown> | null;
  change_summary: Record<string, unknown> | null;
  requires_approval: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'executed' | 'rolledback';
  approved_by: string | null;
  approved_at: string | null;
  executed_by_agent: string | null;
  executed_at: string | null;
  rolled_back_at: string | null;
  mcp_tool_name: string | null;
  created_at: string;
  updated_at: string;
}

// ────────────────────────────────────────────────────────────────
// Helper types
// ────────────────────────────────────────────────────────────────

/**
 * Supabase RPC function response wrapper
 */
export interface SupabaseResponse<T> {
  data: T | null;
  error: {
    message: string;
    code?: string;
    details?: string;
  } | null;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
