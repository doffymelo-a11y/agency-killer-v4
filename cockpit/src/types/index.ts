// ═══════════════════════════════════════════════════════════════
// THE HIVE OS V4 - Core Types
// ═══════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────
// Agent Types
// ─────────────────────────────────────────────────────────────────

export type AgentRole = 'sora' | 'luna' | 'marcus' | 'milo' | 'doffy' | 'orchestrator';

export interface Agent {
  id: AgentRole;
  name: string;
  role: string;
  expertise: string[];
  avatar: string;
  color: {
    light: string;
    primary: string;
    dark: string;
    glow: string;
    bg: string;
  };
}

export const AGENTS: Record<AgentRole, Agent> = {
  sora: {
    id: 'sora',
    name: 'Sora',
    role: 'Data Analyst',
    expertise: ['GA4', 'GTM', 'KPI Analysis', 'Tracking Setup', 'Debugging', 'Reporting'],
    avatar: '/avatars/analyst.jpg',
    color: {
      light: '#CFFAFE',
      primary: '#06B6D4',
      dark: '#0891B2',
      glow: 'rgba(6, 182, 212, 0.15)',
      bg: 'from-cyan-50 via-teal-50/50 to-white',
    },
  },
  luna: {
    id: 'luna',
    name: 'Luna',
    role: 'Stratège Marketing',
    expertise: ['SEO Audit', 'Keyword Research', 'Content Strategy', 'Competitor Analysis', 'Positioning'],
    avatar: '/avatars/strategist.jpg',
    color: {
      light: '#EDE9FE',
      primary: '#8B5CF6',
      dark: '#6D28D9',
      glow: 'rgba(139, 92, 246, 0.15)',
      bg: 'from-violet-50 via-purple-50/50 to-white',
    },
  },
  marcus: {
    id: 'marcus',
    name: 'Marcus',
    role: 'Expert Ads & Conversion',
    expertise: ['Paid Ads Setup', 'Budget Allocation', 'Scaling Decisions', 'Campaign Optimization'],
    avatar: '/avatars/trader.jpg',
    color: {
      light: '#FEF3C7',
      primary: '#F59E0B',
      dark: '#B45309',
      glow: 'rgba(245, 158, 11, 0.15)',
      bg: 'from-amber-50 via-yellow-50/50 to-white',
    },
  },
  milo: {
    id: 'milo',
    name: 'Milo',
    role: 'Directeur Créatif',
    expertise: ['Copywriting', 'Image Generation', 'Video Generation', 'Brainstorming', 'Content Production'],
    avatar: '/avatars/creative.jpg',
    color: {
      light: '#FCE7F3',
      primary: '#EC4899',
      dark: '#BE185D',
      glow: 'rgba(236, 72, 153, 0.15)',
      bg: 'from-pink-50 via-rose-50/50 to-white',
    },
  },
  doffy: {
    id: 'doffy',
    name: 'Doffy',
    role: 'Social Media Manager',
    expertise: ['Content Planning', 'Post Creation', 'Scheduling', 'Engagement', 'Hashtag Strategy'],
    avatar: '/avatars/social-media.jpg',
    color: {
      light: '#D1FAE5',      // emerald-100
      primary: '#10B981',     // emerald-500
      dark: '#059669',        // emerald-600
      glow: 'rgba(16, 185, 129, 0.15)',
      bg: 'from-emerald-50 via-green-50/50 to-white',
    },
  },
  orchestrator: {
    id: 'orchestrator',
    name: 'Felix',
    role: 'Orchestrator',
    expertise: ['Routing', 'State Management', 'Coordination'],
    avatar: '/avatars/orchestrator.jpg',
    color: {
      light: '#FEF3C7',
      primary: '#F59E0B',
      dark: '#B45309',
      glow: 'rgba(245, 158, 11, 0.15)',
      bg: 'from-amber-50 via-yellow-50/50 to-white',
    },
  },
};

// ─────────────────────────────────────────────────────────────────
// Project Types
// ─────────────────────────────────────────────────────────────────

export type ProjectStatus = 'planning' | 'in_progress' | 'completed' | 'paused';
export type ProjectScope = 'meta_ads' | 'sem' | 'seo' | 'analytics' | 'full_scale';

export interface ProjectStateFlags {
  strategy_validated: boolean;
  budget_approved: boolean;
  creatives_ready: boolean;
  tracking_ready: boolean;
  ads_live: boolean;
  [key: string]: boolean;
}

// ─────────────────────────────────────────────────────────────────
// Project Metadata - Context for Agents Memory
// ─────────────────────────────────────────────────────────────────

export interface ProjectMetadata {
  // Global Identity (Step 0 - All Projects)
  website_url?: string;
  websiteUrl?: string; // Alias
  usp?: string; // Unique Selling Proposition

  // Meta Ads Context
  persona?: string; // Avatar client ideal
  targetPersona?: string; // Alias
  pain_point?: string; // Douleur principale resolue
  mainPainPoint?: string; // Alias
  offer_hook?: string; // Offre irresistible
  visual_tone?: 'minimalist' | 'colorful' | 'tech' | 'corporate';

  // SEO Context
  competitors?: string[] | string; // 3 concurrents directs (peut etre string ou array)
  geo_target?: 'local' | 'national' | 'international';
  editorial_tone?: 'expert' | 'friendly' | 'journalistic';

  // SEM Context
  budget_monthly?: number;
  monthlyBudget?: string; // Alias (string pour formulaire)
  negative_keywords?: string[];
  competitive_advantage?: string;

  // Analytics Context
  cms_platform?: string;
  tracking_events?: string[];
  conversion_goals?: string[];

  // Legacy / General
  industry?: string;
  target_audience?: string;
  businessGoal?: string; // Alias
  campaign_launch_date?: string;
  brand_tone?: string;
}

// Context Injection Rules for Agents
export interface ContextInjectionRule {
  task_type: string;
  agent: AgentRole;
  context_sources: (keyof ProjectMetadata)[];
  prompt_template: string;
}

export const CONTEXT_INJECTION_RULES: ContextInjectionRule[] = [
  {
    task_type: 'COPYWRITING',
    agent: 'milo',
    context_sources: ['usp', 'persona', 'pain_point', 'visual_tone', 'editorial_tone'],
    prompt_template: 'Tu es Milo. Rédige pour [USP]. Cible : [PERSONA]. Douleur : [PAIN_POINT]. Ton : [VISUAL_TONE/EDITORIAL_TONE].',
  },
  {
    task_type: 'CAMPAIGN_SETUP',
    agent: 'marcus',
    context_sources: ['budget_monthly', 'geo_target', 'offer_hook', 'negative_keywords'],
    prompt_template: 'Tu es Marcus. Configure avec Budget : [BUDGET]. Zone : [GEO_TARGET]. Offre : [OFFER_HOOK]. Exclusions : [NEGATIVE_KEYWORDS].',
  },
  {
    task_type: 'SEO_STRATEGY',
    agent: 'luna',
    context_sources: ['competitors', 'editorial_tone', 'geo_target'],
    prompt_template: 'Tu es Luna. Analyse les mots-clés vs [COMPETITORS]. Zone : [GEO_TARGET]. Ton : [EDITORIAL_TONE].',
  },
  {
    task_type: 'TRACKING_SETUP',
    agent: 'sora',
    context_sources: ['website_url', 'cms_platform', 'tracking_events', 'conversion_goals'],
    prompt_template: 'Tu es Sora. Configure tracking sur [WEBSITE_URL] ([CMS_PLATFORM]). Events : [TRACKING_EVENTS]. Conversions : [CONVERSION_GOALS].',
  },
  {
    task_type: 'SOCIAL_MEDIA_STRATEGY',
    agent: 'doffy',
    context_sources: ['persona', 'brand_tone', 'editorial_tone', 'competitors'],
    prompt_template: 'Tu es Doffy. Planifie pour [PERSONA]. Ton : [BRAND_TONE]. Concurrents : [COMPETITORS].',
  },
];

export interface Project {
  id: string;
  name: string;
  scope: ProjectScope;
  status: ProjectStatus;
  current_phase: string;
  state_flags: ProjectStateFlags;
  metadata: ProjectMetadata;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────────
// Task Types
// ─────────────────────────────────────────────────────────────────

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked';
export type TaskPhase = 'Audit' | 'Setup' | 'Production' | 'Optimization';
export type DeliverableType = 'image' | 'video' | 'pdf' | 'text' | 'report';

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description?: string;

  // Assignment
  assignee: AgentRole;
  phase: TaskPhase;
  status: TaskStatus;

  // Context Loop
  context_questions: string[];
  user_inputs?: Record<string, string>;

  // Calendar
  estimated_hours: number;
  due_date: string;

  // Dependencies
  depends_on: string[]; // task_ids

  // Deliverables
  deliverable_url?: string;
  deliverable_type?: DeliverableType;

  // Timestamps
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

// ─────────────────────────────────────────────────────────────────
// Chat Types
// ─────────────────────────────────────────────────────────────────

export type ChatMode = 'quick_research' | 'task_execution';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agent_id?: AgentRole;
  responding_agent?: AgentRole; // Agent qui repond reellement (pour switch dynamique)
  image_url?: string;
  timestamp: Date;
  created_at: string;
  ui_components?: UIComponent[];
  is_streaming?: boolean;
}

// ─────────────────────────────────────────────────────────────────
// UI Components (from n8n responses)
// ─────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────
// UI Component Types - Backend to Frontend Mapping
// ─────────────────────────────────────────────────────────────────
// MILO (Creative): CAMPAGNE_TABLE (image), AD_PREVIEW (video), PDF_COPYWRITING (text)
// SORA (Analyst): ANALYTICS_DASHBOARD
// LUNA (Strategist): PDF_REPORT
// MARCUS (Trader): CAMPAIGN_TABLE
// ─────────────────────────────────────────────────────────────────

export type UIComponentType =
  // Legacy types
  | 'checklist'
  | 'chart'
  | 'metric_card'
  | 'image'
  | 'pdf'
  | 'table'
  | 'action_button'
  | 'progress'
  | 'timeline'
  | 'comparison'
  | 'IMAGE_PREVIEW'
  | 'VIDEO_PLAYER'
  // MILO - Creative Agent
  | 'CAMPAGNE_TABLE'      // Image avec bouton telecharger
  | 'AD_PREVIEW'          // Video avec bouton telecharger
  | 'PDF_COPYWRITING'     // Article/Blog avec bouton PDF
  // SORA - Analyst Agent
  | 'ANALYTICS_DASHBOARD' // Dashboard avec metriques
  // LUNA - Strategist Agent
  | 'PDF_REPORT'          // Rapport strategique PDF
  // MARCUS - Trader Agent
  | 'CAMPAIGN_TABLE'      // Tableau campagnes pub
  // Generic
  | 'ACTION_BUTTONS'      // Menu de choix
  | 'KPI_CARD'            // Carte KPI simple
  | 'ERROR'               // Erreur
  | 'LOADING'             // Chargement
  // Web Intelligence (Phase V5 - 2026-03-01)
  | 'WEB_SCREENSHOT'      // Screenshot multi-device avec download/preview
  | 'COMPETITOR_REPORT'   // Analyse concurrentielle (tech stack, SEO, pixels)
  | 'LANDING_PAGE_AUDIT'  // Audit landing page avec score et recommandations
  | 'PIXEL_VERIFICATION'  // Vérification pixels tracking
  // DOFFY - Social Media Manager
  | 'SOCIAL_POST_PREVIEW'     // Preview multi-plateforme
  | 'CONTENT_CALENDAR'        // Calendrier editorial
  | 'SOCIAL_ANALYTICS';       // Dashboard engagement

export interface UIComponent {
  type: UIComponentType | string;
  id: string;
  title?: string;
  data: unknown;
}

export interface DeckWidget {
  id: string;
  type: UIComponentType | string;
  component: UIComponent;
  pinned: boolean;
  createdAt: Date;
  sourceMessageId?: string;
}

// ─────────────────────────────────────────────────────────────────
// Web Intelligence Types (Phase V5 - 2026-03-01)
// ─────────────────────────────────────────────────────────────────

export interface WebScreenshotData {
  url: string;
  device: 'desktop' | 'mobile' | 'tablet';
  imageUrl: string; // Base64 or Cloudinary URL
  cloudinaryUrl?: string;
  width: number;
  height: number;
  capturedAt: string;
}

export interface CompetitorAnalysisData {
  url: string;
  techStack: {
    cms?: string;
    frameworks: string[];
    analytics: string[];
    advertising: string[];
    cdn?: string;
    hosting?: string;
  };
  seo: {
    title: string;
    metaDescription?: string;
    ogTags: Record<string, string>;
    twitterCards: Record<string, string>;
    headingStructure: {
      h1Count: number;
      h2Count: number;
      h3Count: number;
    };
    canonicalUrl?: string;
    robots?: string;
  };
  socialLinks: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  };
  trackingPixels: {
    googleAnalytics?: string[];
    googleTagManager?: string[];
    metaPixel?: string[];
    linkedinInsight?: string[];
    tiktokPixel?: string[];
  };
  performance: {
    loadTime: number;
    resourceCount: number;
  };
  analyzedAt: string;
}

export interface LandingPageAuditData {
  url: string;
  score: number; // 0-100
  checks: {
    ctaAboveFold: { pass: boolean; message: string };
    hasForm: { pass: boolean; message: string };
    mobileResponsive: { pass: boolean; message: string };
    loadTime: { pass: boolean; value: number; threshold: number };
    hasSSL: { pass: boolean; message: string };
    hasTrustSignals: { pass: boolean; signals: string[] };
  };
  screenshot?: string;
  recommendations: string[];
  auditedAt: string;
}

export interface PixelVerificationData {
  url: string;
  pixels: {
    googleAnalytics4: { detected: boolean; ids: string[] };
    googleTagManager: { detected: boolean; ids: string[] };
    metaPixel: { detected: boolean; ids: string[] };
    googleAds: { detected: boolean; ids: string[] };
    tiktokPixel: { detected: boolean; ids: string[] };
    linkedinInsight: { detected: boolean; ids: string[] };
  };
  screenshot?: string;
  networkRequests: Array<{
    url: string;
    type: string;
    matched: string;
  }>;
  verifiedAt: string;
}

// ─────────────────────────────────────────────────────────────────
// DOFFY - Social Media Manager Data Types
// ─────────────────────────────────────────────────────────────────

export type SocialPlatform = 'linkedin' | 'instagram' | 'twitter' | 'tiktok' | 'facebook';

export interface SocialPostPreviewData {
  platform: SocialPlatform;
  content: {
    text: string;
    hashtags: string[];
    mediaUrls?: string[];
    mediaType?: 'image' | 'video' | 'carousel' | 'text';
    linkUrl?: string;
    callToAction?: string;
  };
  scheduling?: {
    scheduledAt: string;
    timezone: string;
    optimalTimeReason?: string;
  };
  platformSpecific?: Record<string, unknown>;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  createdAt: string;
}

export interface ContentCalendarData {
  period: { start: string; end: string; type: 'weekly' | 'monthly' };
  posts: Array<{
    id: string;
    platform: SocialPlatform;
    scheduledAt: string;
    content: string;
    mediaType?: 'image' | 'video' | 'carousel' | 'text';
    status: 'draft' | 'scheduled' | 'published';
    hashtags: string[];
  }>;
  statistics: {
    totalPosts: number;
    byPlatform: Record<SocialPlatform, number>;
    byStatus: Record<string, number>;
  };
}

export interface SocialAnalyticsData {
  platform: SocialPlatform | 'all';
  period: { start: string; end: string };
  metrics: {
    followers: { current: number; change: number; changePercent: number };
    engagement: { rate: number; change: number };
    impressions: { total: number; change: number };
    reach: { total: number; change: number };
    clicks: { total: number; change: number };
  };
  topPosts: Array<{
    id: string;
    platform: SocialPlatform;
    content: string;
    engagementRate: number;
    impressions: number;
    publishedAt: string;
  }>;
  recommendations: string[];
}

// ─────────────────────────────────────────────────────────────────
// Notification Types
// ─────────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

export interface ChatSession {
  id: string;
  project_id: string;
  mode: ChatMode;
  linked_task_id?: string;
  injected_context?: {
    task: Task;
    user_inputs: Record<string, string>;
    project_metadata: ProjectMetadata;
  };
  messages: ChatMessage[];
  created_at: string;
}

// ─────────────────────────────────────────────────────────────────
// Genesis Wizard Types
// ─────────────────────────────────────────────────────────────────

export interface WizardAnswer {
  questionId: string;
  value: string;
  generatesTask?: {
    title: string;
    assignee: AgentRole;
    phase: TaskPhase;
    estimated_hours: number;
    context_questions: string[];
  };
}

export interface WizardQuestionOption {
  value: string;
  label: string;
  description?: string;
  generatesTask?: WizardAnswer['generatesTask'];
}

export interface WizardQuestion {
  id: string;
  question: string;
  options: WizardQuestionOption[];
}

// Wizard State Machine
// Flow: scope_selection → questionnaire → context_collection → project_info → preview → generating → complete
export type WizardState =
  | { status: 'scope_selection' }
  | { status: 'questionnaire'; scope: ProjectScope; step: number; answers: WizardAnswer[] }
  | { status: 'context_collection'; scope: ProjectScope; answers: WizardAnswer[]; contextAnswers: Partial<ProjectMetadata> }
  | { status: 'project_info'; scope: ProjectScope; answers: WizardAnswer[]; contextAnswers: Partial<ProjectMetadata> }
  | { status: 'preview'; scope: ProjectScope; answers: WizardAnswer[]; contextAnswers: Partial<ProjectMetadata>; projectName: string; deadline: string }
  | { status: 'generating' }
  | { status: 'complete'; projectId: string };

export type WizardEvent =
  | { type: 'SELECT_SCOPE'; scope: ProjectScope }
  | { type: 'ANSWER'; answer: WizardAnswer }
  | { type: 'SET_CONTEXT'; contextAnswers: Partial<ProjectMetadata> }
  | { type: 'SET_PROJECT_INFO'; name: string; deadline: string }
  | { type: 'NEXT' }
  | { type: 'BACK' }
  | { type: 'SUBMIT' }
  | { type: 'GENERATION_COMPLETE'; projectId: string }
  | { type: 'RESET' };

// ─────────────────────────────────────────────────────────────────
// API Response Types
// ─────────────────────────────────────────────────────────────────

export interface PMAgentRequest {
  scope: ProjectScope;
  answers: WizardAnswer[];
  project_name: string;
  deadline: string;
}

export interface PMAgentResponse {
  project: Omit<Project, 'id' | 'created_at' | 'updated_at'>;
  tasks: Omit<Task, 'id' | 'project_id' | 'created_at'>[];
}

// ─────────────────────────────────────────────────────────────────
// Phase 2.11 - Phase Transition Types
// ─────────────────────────────────────────────────────────────────

export interface PhaseTransitionProposal {
  currentPhase: TaskPhase;
  nextPhase: TaskPhase;
  statistics: {
    tasksCompleted: number;
    totalHours: number;
    deliverables: number;
    phaseDuration: number; // in days
  };
  agentSummary: string; // LLM-generated celebration summary
  keyAccomplishments: string[]; // 3-5 bullet points
  nextPhasePreview: string; // 1-2 sentences describing next phase
  proposedAt: string; // ISO timestamp
}

// Database types are in ./database.ts
