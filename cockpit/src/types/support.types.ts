/**
 * Support System Types
 * Types for support tickets, messages, and related functionality
 */

// ─────────────────────────────────────────────────────────────────
// Enums (matching SQL ENUMs)
// ─────────────────────────────────────────────────────────────────

export type TicketStatus =
  | 'open'           // Nouveau ticket
  | 'in_progress'    // Ticket en cours de traitement
  | 'waiting_user'   // En attente de réponse utilisateur
  | 'resolved'       // Résolu (mais pas fermé)
  | 'closed';        // Fermé définitivement

export type TicketPriority =
  | 'low'       // Basse priorité
  | 'medium'    // Priorité moyenne
  | 'high'      // Haute priorité
  | 'critical'; // Critique (bug bloquant)

export type TicketCategory =
  | 'bug'             // Bug technique
  | 'feature_request' // Demande de fonctionnalité
  | 'question'        // Question
  | 'billing'         // Facturation
  | 'integration'     // Problème d'intégration
  | 'other';          // Autre

export type MessageSenderType =
  | 'user'   // Message de l'utilisateur
  | 'admin'; // Message de l'équipe support

// ─────────────────────────────────────────────────────────────────
// Database Models
// ─────────────────────────────────────────────────────────────────

export interface SupportTicket {
  id: string;

  // Ownership
  user_id: string;
  project_id: string | null;

  // Ticket info
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;

  // Context (auto-captured)
  page_url: string | null;
  user_agent: string | null;
  screenshot_url: string | null;

  // Assignment
  assigned_to: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  closed_at: string | null;
}

export interface SupportMessage {
  id: string;

  ticket_id: string;
  sender_id: string;
  sender_type: MessageSenderType;

  message: string;
  attachments: FileAttachment[];

  read_at: string | null;
  created_at: string;
}

export interface FileAttachment {
  url: string;
  filename: string;
  type: string;
  size: number;
}

// ─────────────────────────────────────────────────────────────────
// Extended Models (with computed fields)
// ─────────────────────────────────────────────────────────────────

export interface SupportTicketWithUser extends SupportTicket {
  user_email?: string;
  user_name?: string;
  unread_count?: number;        // Nombre de messages admin non lus
  message_count?: number;        // Nombre total de messages
  last_message_at?: string;      // Date du dernier message
  last_message_preview?: string; // Aperçu du dernier message
}

export interface SupportMessageWithSender extends SupportMessage {
  sender_email?: string;
  sender_name?: string;
}

// ─────────────────────────────────────────────────────────────────
// Request/Response Types
// ─────────────────────────────────────────────────────────────────

export interface CreateTicketParams {
  subject: string;
  description: string;
  category: TicketCategory;
  project_id?: string;

  // Auto-captured (frontend will set these)
  page_url?: string;
  user_agent?: string;
  screenshot_url?: string; // Upload to Cloudinary first, then pass URL
}

export interface UpdateTicketParams {
  status?: TicketStatus;
  priority?: TicketPriority;
  assigned_to?: string | null;
}

export interface CreateMessageParams {
  ticket_id: string;
  message: string;
  sender_type: MessageSenderType;
  attachments?: FileAttachment[];
}

export interface TicketFilters {
  status?: TicketStatus | TicketStatus[];
  priority?: TicketPriority | TicketPriority[];
  category?: TicketCategory | TicketCategory[];
  user_id?: string;
  assigned_to?: string;
  search?: string; // Search in subject + description
}

// ─────────────────────────────────────────────────────────────────
// Stats & Analytics
// ─────────────────────────────────────────────────────────────────

export interface TicketStats {
  open_count: number;
  in_progress_count: number;
  waiting_user_count: number;
  resolved_count: number;
  closed_count: number;
  total_count: number;
  high_priority_count: number;
  critical_priority_count: number;
}

// ─────────────────────────────────────────────────────────────────
// UI Helper Types
// ─────────────────────────────────────────────────────────────────

export interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}

export interface PriorityConfig {
  label: string;
  color: string;
  icon: string;
}

export interface CategoryConfig {
  label: string;
  emoji: string;
  priority: TicketPriority; // Auto-determined priority
  placeholder: string;       // Placeholder pour le formulaire
}

// ─────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────

export const TICKET_STATUS_CONFIG: Record<TicketStatus, StatusConfig> = {
  open: {
    label: 'Ouvert',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 border-yellow-200',
    icon: '📬',
  },
  in_progress: {
    label: 'En cours',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
    icon: '⚙️',
  },
  waiting_user: {
    label: 'En attente',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 border-orange-200',
    icon: '⏳',
  },
  resolved: {
    label: 'Résolu',
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
    icon: '✅',
  },
  closed: {
    label: 'Fermé',
    color: 'text-slate-600',
    bgColor: 'bg-slate-50 border-slate-200',
    icon: '🔒',
  },
};

export const TICKET_PRIORITY_CONFIG: Record<TicketPriority, PriorityConfig> = {
  low: {
    label: 'Basse',
    color: 'text-slate-600',
    icon: '🟢',
  },
  medium: {
    label: 'Moyenne',
    color: 'text-yellow-600',
    icon: '🟡',
  },
  high: {
    label: 'Haute',
    color: 'text-orange-600',
    icon: '🟠',
  },
  critical: {
    label: 'Critique',
    color: 'text-red-600',
    icon: '🔴',
  },
};

export const TICKET_CATEGORY_CONFIG: Record<TicketCategory, CategoryConfig> = {
  bug: {
    label: 'Bug',
    emoji: '🐛',
    priority: 'high',
    placeholder: 'Décrivez le bug rencontré, les étapes pour le reproduire, et le comportement attendu...',
  },
  feature_request: {
    label: 'Demande de fonctionnalité',
    emoji: '✨',
    priority: 'low',
    placeholder: 'Décrivez la fonctionnalité souhaitée et comment elle améliorerait votre expérience...',
  },
  question: {
    label: 'Question',
    emoji: '❓',
    priority: 'low',
    placeholder: 'Posez votre question de manière détaillée...',
  },
  billing: {
    label: 'Facturation',
    emoji: '💳',
    priority: 'medium',
    placeholder: 'Décrivez votre question ou problème de facturation...',
  },
  integration: {
    label: 'Intégration',
    emoji: '🔌',
    priority: 'medium',
    placeholder: 'Décrivez le problème rencontré avec l\'intégration (WordPress, Google Ads, etc.)...',
  },
  other: {
    label: 'Autre',
    emoji: '📝',
    priority: 'medium',
    placeholder: 'Décrivez votre demande...',
  },
};

// ─────────────────────────────────────────────────────────────────
// Email Preferences (Phase 2)
// ─────────────────────────────────────────────────────────────────

export interface EmailPreferences {
  user_id: string;
  notify_on_message: boolean;
  notify_on_status_change: boolean;
  notify_on_assignment: boolean;
  notify_on_resolution: boolean;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────────
// Internal Notes (Phase 2 - Admin Only)
// ─────────────────────────────────────────────────────────────────

export interface InternalNote {
  id: string;
  ticket_id: string;
  author_id: string;
  author_email?: string; // Joined from auth.users
  note: string;
  created_at: string;
  updated_at: string;
}
