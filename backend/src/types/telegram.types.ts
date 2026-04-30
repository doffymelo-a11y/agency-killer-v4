/**
 * Telegram Integration Types
 */

export interface TelegramChatLink {
  user_id: string;
  chat_id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  linked_at: string;
  notif_preferences: {
    critical: boolean;
    high: boolean;
    medium: boolean;
    low: boolean;
  };
  is_active: boolean;
}

export interface TicketNotificationData {
  ticket_id: string;
  ticket_number: string;
  user_email: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  // AI Triage data (Phase 3)
  ai_category?: string;
  ai_priority?: string;
  likely_files?: string[];
  ai_confidence?: number;
  ai_reasoning?: string;
  suggested_response?: string;
}

export type TelegramCallbackAction =
  | 'view'
  | 'fix'
  | 'reply'
  | 'resolve'
  | 'send_template'
  | 'merge'
  | 'reject'
  | 'ask_claude';

export interface TelegramCallbackData {
  action: TelegramCallbackAction;
  ticket_id: string;
  template_id?: string;
  pr_number?: number;
}
