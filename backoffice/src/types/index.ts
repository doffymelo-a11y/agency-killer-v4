// ═══════════════════════════════════════════════════════════════
// Types - Super Admin Backoffice
// Shared types for tickets, users, logs, metrics
// ═══════════════════════════════════════════════════════════════

// Support Ticket Types
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed' | 'waiting_user';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type TicketCategory = 'bug' | 'feature_request' | 'question' | 'billing' | 'integration' | 'other';

export interface FileAttachment {
  url: string;
  filename: string;
  type: string;
  size: number;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  user_email?: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  attachments?: FileAttachment[];
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_type: 'user' | 'admin';
  message: string;
  attachments?: FileAttachment[];
  created_at: string;
}

export interface InternalNote {
  id: string;
  ticket_id: string;
  author_id: string;
  author_email?: string;
  note: string;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────────
// API Response Types
// ─────────────────────────────────────────────────────────────────

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

// ─────────────────────────────────────────────────────────────────
// User Types
// ─────────────────────────────────────────────────────────────────

export type UserRole = 'user' | 'admin' | 'super_admin';

export interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  role?: UserRole;
}

export interface UserDetails extends User {
  projects: Project[];
  tickets: SupportTicket[];
}

export interface Project {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

// ─────────────────────────────────────────────────────────────────
// Audit Log Types
// ─────────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  super_admin_id: string;
  super_admin_email: string;
  admin_email?: string; // Alias for super_admin_email
  action: string;
  details?: string; // Human-readable description of the action
  resource_type?: string;
  resource_id?: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

// ─────────────────────────────────────────────────────────────────
// System Log Types
// ─────────────────────────────────────────────────────────────────

export interface SystemLog {
  id: string;
  timestamp: string;
  created_at: string; // Alias for timestamp
  level: 'info' | 'warn' | 'error' | 'debug';
  source: string;
  message: string;
  metadata?: Record<string, any>;
  user_id?: string;
  project_id?: string;
}

// ─────────────────────────────────────────────────────────────────
// Metrics Types
// ─────────────────────────────────────────────────────────────────

export interface GlobalMetrics {
  total_users: number;
  total_tickets: number;
  active_users_today: number;
  avg_response_time_hours: number | null;
  users_by_role: {
    user: number;
    admin: number;
    super_admin: number;
  };
  tickets_by_status: {
    open: number;
    in_progress: number;
    resolved: number;
    closed: number;
  };
  tickets_by_priority: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  business_stats?: Record<string, any>;
  active_users?: {
    last_7_days: number;
    last_30_days: number;
  };
  csat?: {
    average: number | null;
    responses_count: number;
  };
  ticket_volume?: {
    last_30_days: number;
    trend_by_day: Record<string, number>;
  };
  period?: {
    days_back: number;
    from: string;
    to: string;
  };
}

export interface TicketStats {
  total: number;
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
  avg_response_time_hours: number;
}

// ─────────────────────────────────────────────────────────────────
// Ticket Filters
// ─────────────────────────────────────────────────────────────────

export interface TicketFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  assigned_to?: string;
  user_email?: string;
  search?: string;
  from?: string;
  to?: string;
}
