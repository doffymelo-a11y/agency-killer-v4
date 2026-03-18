/**
 * API Types - Request/Response contracts
 * The Hive OS V5 Backend
 */

// ─────────────────────────────────────────────────────────────────
// Common Types
// ─────────────────────────────────────────────────────────────────

export type AgentId = 'luna' | 'sora' | 'marcus' | 'milo' | 'doffy';

export type ChatMode = 'task_execution' | 'quick_research' | 'chat';

export type UIComponentType =
  | 'CAMPAGNE_TABLE'
  | 'AD_PREVIEW'
  | 'PDF_COPYWRITING'
  | 'PDF_REPORT'
  | 'ANALYTICS_DASHBOARD'
  | 'CAMPAIGN_TABLE'
  | 'ACTION_BUTTONS'
  | 'KPI_CARD'
  | 'WEB_SCREENSHOT'
  | 'COMPETITOR_REPORT'
  | 'LANDING_PAGE_AUDIT'
  | 'PIXEL_VERIFICATION'
  | 'SOCIAL_POST_PREVIEW'
  | 'CONTENT_CALENDAR'
  | 'SOCIAL_ANALYTICS'
  | 'ERROR'
  | 'LOADING';

export interface UIComponent {
  type: UIComponentType;
  id: string;
  title?: string;
  data: unknown;
}

export type WriteBackCommandType =
  | 'UPDATE_TASK_STATUS'
  | 'UPDATE_STATE_FLAG'
  | 'SET_DELIVERABLE'
  | 'COMPLETE_TASK'
  | 'UPDATE_PROJECT_PHASE'
  | 'ADD_FILE'
  | 'NOTIFY_USER';

export interface WriteBackCommand {
  type: WriteBackCommandType;
  task_id?: string;
  status?: string;
  flag_name?: string;
  flag_value?: boolean;
  deliverable_url?: string;
  deliverable_type?: string;
  phase?: string;
  file?: {
    name: string;
    url: string;
    type: string;
    size: number;
  };
  notification?: string;
}

// ─────────────────────────────────────────────────────────────────
// Request Types
// ─────────────────────────────────────────────────────────────────

/**
 * POST /api/chat - Main chat endpoint (replaces PM webhook)
 */
export interface ChatRequest {
  action: 'task_launch' | 'quick_action' | 'chat';
  chatInput: string;
  session_id: string;
  project_id: string;
  activeAgentId: AgentId;
  system_instruction?: string;
  chat_mode: ChatMode;
  shared_memory: SharedProjectContext;
  task_context?: TaskExecutionContext;
  image?: string; // Base64
}

/**
 * POST /api/genesis - Project creation
 */
export interface GenesisRequest {
  action: 'genesis';
  project_name: string;
  scope: ProjectScope;
  industry?: string;
  target_audience?: string;
  project_scope?: string;
  metadata: ProjectMetadata;
  generated_tasks: Task[];
}

/**
 * POST /api/analytics - Analytics data fetch
 */
export interface AnalyticsRequest {
  action: 'analytics_fetch';
  project_id: string;
  source: AnalyticsSource;
  date_range: {
    start: string;
    end: string;
    preset: '7d' | '30d' | '90d' | 'custom';
  };
  metrics?: string[];
  shared_memory: SharedProjectContext;
}

// ─────────────────────────────────────────────────────────────────
// Response Types
// ─────────────────────────────────────────────────────────────────

/**
 * Standard API response wrapper
 */
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

/**
 * Chat endpoint response
 */
export interface ChatResponse {
  success: boolean;
  agent: AgentId;
  agent_id?: AgentId;
  message: string;
  ui_components?: UIComponent[];
  write_back?: WriteBackCommand[];
  write_back_commands?: WriteBackCommand[];
  memory_contribution?: MemoryContribution;
  session_id?: string;
}

/**
 * Genesis endpoint response
 */
export interface GenesisResponse {
  success: boolean;
  project_id?: string;
  tasks?: Task[];
  message: string;
  ui_components?: UIComponent[];
  write_back_commands?: WriteBackCommand[];
}

/**
 * Analytics endpoint response
 */
export interface AnalyticsResponse {
  success?: boolean;
  data: {
    kpis?: AnalyticsKPI[];
    charts?: AnalyticsChart[];
    insights?: AnalyticsInsight[];
    message?: string;
    placeholder?: boolean;
  };
  source: AnalyticsSource;
  ui_components?: UIComponent[];
}

// ─────────────────────────────────────────────────────────────────
// Shared Project Context (from frontend)
// ─────────────────────────────────────────────────────────────────

export interface SharedProjectContext {
  project_id: string;
  project_name: string;
  project_scope: ProjectScope | string;
  project_metadata?: ProjectMetadata;
  industry?: string;
  target_audience?: string;
  brand_voice?: string;
  budget?: number;
  goals?: string[];
  kpis?: string[];
  timeline?: string;
  active_tasks?: Task[];
  current_phase?: string;
  state_flags?: Record<string, boolean>;
  deliverables?: Deliverable[];
  recent_activity?: string[];

  // NEW - Enriched Genesis fields (passés depuis frontend via transformSharedMemory)
  business_goal?: string;
  pain_point?: string;
  offer_hook?: string;
  visual_tone?: string;
  competitors_list?: string;
  negative_keywords_list?: string;
  tracking_events_list?: string;
}

export interface TaskExecutionContext {
  task_id: string;
  task_title: string;
  task_description: string;
  task_type: string;
  assigned_agent: AgentId;
  dependencies?: string[];
  user_inputs?: Record<string, string>;
}

// ─────────────────────────────────────────────────────────────────
// Project Types
// ─────────────────────────────────────────────────────────────────

export type ProjectScope =
  | 'seo_campaign'
  | 'paid_ads_launch'
  | 'social_media_campaign'
  | 'content_marketing'
  | 'brand_strategy'
  | 'website_audit'
  | 'competitor_analysis';

export interface ProjectMetadata {
  industry?: string;
  target_audience?: string;
  budget?: number;
  deadline?: string;
  goals?: string[];
  kpis?: string[];
  brand_voice?: string;
  competitors?: string[];
  [key: string]: unknown;
}

export interface Task {
  id?: string;
  project_id?: string;
  title: string;
  description: string;
  type: string;
  status: 'pending' | 'in_progress' | 'blocked' | 'completed' | 'cancelled';
  assigned_agent: AgentId;
  dependencies?: string[];
  deliverables?: Deliverable[];
  created_at?: string;
  updated_at?: string;
}

export interface Deliverable {
  id: string;
  type: string;
  url: string;
  name: string;
  created_at: string;
}

// ─────────────────────────────────────────────────────────────────
// Memory Types
// ─────────────────────────────────────────────────────────────────

export interface MemoryContribution {
  action: string;
  summary: string;
  key_findings?: string[];
  deliverables?: Deliverable[];
  recommendations?: Recommendation[];
}

export interface Recommendation {
  for_agent: AgentId;
  from_agent?: AgentId;
  message: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface ProjectMemoryEntry {
  id: string;
  project_id: string;
  agent_id: AgentId;
  action: string;
  summary: string;
  key_findings?: string[];
  deliverables?: Deliverable[];
  recommendations?: Recommendation[];
  created_at: string;
}

// ─────────────────────────────────────────────────────────────────
// Analytics Types
// ─────────────────────────────────────────────────────────────────

export type AnalyticsSource = 'ga4' | 'google_ads' | 'meta_ads' | 'overview';

export interface AnalyticsKPI {
  label: string;
  value: string | number;
  trend?: number;
  change?: string;
}

export interface AnalyticsChart {
  type: 'line' | 'bar' | 'pie' | 'area';
  title: string;
  data: unknown;
}

export interface AnalyticsInsight {
  type: 'positive' | 'negative' | 'neutral';
  message: string;
  recommendation?: string;
}

// ─────────────────────────────────────────────────────────────────
// Phase 2.11 - Phase Transition Types
// ─────────────────────────────────────────────────────────────────

/**
 * Statistics for a completed phase
 */
export interface PhaseStatistics {
  tasksCompleted: number;
  totalHours: number;
  deliverables: number;
  phaseDuration: number; // in days
}

/**
 * Phase transition proposal stored in project.state_flags
 */
export interface PhaseTransitionProposal {
  currentPhase: string;
  nextPhase: string;
  statistics: PhaseStatistics;
  agentSummary: string; // LLM-generated summary
  keyAccomplishments: string[]; // 3-5 bullet points
  nextPhasePreview: string; // 1-2 sentences
  proposedAt: string; // ISO timestamp
}
