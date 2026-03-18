// ============================================
// THE HIVE OS V5 - TypeScript Backend API Service
// Replaces n8n webhooks with Express.js backend
// ============================================

import axios, { AxiosError } from 'axios';
import type {
  AgentRole,
} from '../types';

// Backend API URL (TypeScript Express server)
const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3457';

// API Endpoints
const ENDPOINTS = {
  chat: `${BACKEND_API_URL}/api/chat`,
  genesis: `${BACKEND_API_URL}/api/genesis`,
  analytics: `${BACKEND_API_URL}/api/analytics`,
  files: `${BACKEND_API_URL}/api/files`,
};

// Timeout configuration - 10 MINUTES for large tasks
const AXIOS_CONFIG = {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 600000, // 10 minutes
};

// Debug mode
const DEBUG_MODE = import.meta.env.DEV && import.meta.env.VITE_DEBUG_API === 'true';

// ============================================
// Types (matching backend API)
// ============================================

// Import types from n8n for compatibility (TODO: move to shared types)
import type { SharedProjectContext, WriteBackCommand, UIComponent } from './n8n';

export interface ChatRequest {
  action: 'task_launch' | 'quick_action' | 'chat';
  chatInput: string;
  session_id: string;
  project_id: string;
  activeAgentId: AgentRole;
  chat_mode: 'task_execution' | 'quick_research' | 'chat';
  shared_memory: SharedProjectContext;
  image?: string; // Base64
}

export interface ChatResponse {
  success: boolean;
  agent: AgentRole;
  message: string;
  ui_components?: UIComponent[];
  write_back_commands?: WriteBackCommand[];
  memory_contribution?: {
    action: string;
    summary: string;
    key_findings: string[];
    deliverables: string[];
    recommendations: Array<{
      for_agent: AgentRole;
      message: string;
      priority?: string;
    }>;
  };
  session_id: string;
}

// WriteBackCommand and UIComponent are imported from n8n.ts

// ============================================
// Utility Functions
// ============================================

function debugLog(label: string, data: unknown) {
  if (DEBUG_MODE) {
    console.group(`[API] ${label}`);
    console.log(data);
    console.groupEnd();
  }
}

function parseError(error: unknown): { message: string; technical: string; type: string } {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;

    if (!axiosError.response) {
      if (axiosError.message.includes('Network Error')) {
        return {
          message: "Impossible de contacter le backend. Vérifiez que le serveur est démarré.",
          technical: `Network Error: ${axiosError.message}`,
          type: 'network',
        };
      }
      if (axiosError.code === 'ECONNABORTED') {
        return {
          message: "La requête a expiré. Le serveur met trop de temps à répondre.",
          technical: `Timeout: Request exceeded ${AXIOS_CONFIG.timeout}ms`,
          type: 'timeout',
        };
      }
      return {
        message: "Erreur réseau inconnue.",
        technical: `Unknown network error: ${axiosError.message}`,
        type: 'network',
      };
    }

    const status = axiosError.response.status;
    const statusText = axiosError.response.statusText;
    const responseData = axiosError.response.data;

    if (status === 401 || status === 403) {
      return {
        message: "Accès refusé. Vérifiez votre authentification.",
        technical: `Auth Error ${status}: ${statusText}`,
        type: 'auth',
      };
    }

    if (status === 404) {
      return {
        message: "Endpoint non trouvé. Vérifiez l'URL du backend.",
        technical: `404 Not Found: ${ENDPOINTS.chat}`,
        type: 'not_found',
      };
    }

    if (status === 500) {
      return {
        message: "Erreur interne du serveur backend.",
        technical: `Server Error 500: ${JSON.stringify(responseData)}`,
        type: 'server',
      };
    }

    return {
      message: `Erreur serveur (${status})`,
      technical: `HTTP ${status}: ${statusText}`,
      type: 'http',
    };
  }

  return {
    message: "Une erreur inattendue s'est produite.",
    technical: `Unknown error: ${error instanceof Error ? error.message : String(error)}`,
    type: 'unknown',
  };
}

// ============================================
// Helper Functions
// ============================================

/**
 * Transform frontend SharedProjectContext to backend shared_memory format
 * CRITICAL: Extract metadata fields so agents can access Genesis answers
 */
function transformSharedMemory(context: any) {
  // Map frontend scope values to backend project_scope enum
  const scopeMapping: Record<string, string> = {
    'meta_ads': 'paid_ads_launch',
    'sem': 'paid_ads_launch',
    'seo': 'seo_campaign',
    'analytics': 'website_audit',
    'social_media': 'social_media_campaign',
    'full_scale': 'brand_strategy',
  };

  // CRITICAL FIX: Read from 'metadata' (frontend) OR 'project_metadata' (backend type)
  // Frontend sends as 'metadata', backend type expects 'project_metadata'
  const metadata = context.metadata || context.project_metadata || {};

  console.log('[API] transformSharedMemory - metadata received:', {
    has_metadata: !!context.metadata,
    has_project_metadata: !!context.project_metadata,
    metadata_keys: Object.keys(metadata),
    industry: metadata.industry,
    target_audience: metadata.target_audience,
    brand_tone: metadata.brand_tone,
  });

  // Extract Genesis answers from metadata for agent system prompts
  // Agents expect these fields at root level (not nested in metadata)
  return {
    project_id: context.project_id,
    project_name: context.project_name,
    project_scope: scopeMapping[context.scope] || 'brand_strategy',
    current_phase: context.current_phase,
    state_flags: context.state_flags || {},

    // Genesis context extracted from metadata (EXISTANT)
    industry: metadata.industry || '',
    target_audience: metadata.target_audience || metadata.persona || '',
    brand_voice: metadata.brand_voice || metadata.brand_tone || metadata.editorial_tone || '',
    budget: metadata.budget_monthly || 0,
    goals: metadata.business_goal ? [metadata.business_goal] : metadata.businessGoal ? [metadata.businessGoal] : [],
    kpis: metadata.conversion_goals || [],
    timeline: metadata.campaign_launch_date || '',

    // NEW - Enriched Genesis fields (passés aux agents via system prompts)
    business_goal: metadata.business_goal || metadata.businessGoal || '',
    pain_point: metadata.pain_point || '',
    offer_hook: metadata.offer_hook || '',
    visual_tone: metadata.visual_tone || '',
    competitors_list: Array.isArray(metadata.competitors)
      ? metadata.competitors.join(', ')
      : metadata.competitors || '',
    negative_keywords_list: Array.isArray(metadata.negative_keywords)
      ? metadata.negative_keywords.join(', ')
      : '',
    tracking_events_list: Array.isArray(metadata.tracking_events)
      ? metadata.tracking_events.join(', ')
      : '',

    // Keep full metadata for reference
    project_metadata: metadata,
  };
}

// ============================================
// Main Chat Function
// ============================================

export const sendChatMessage = async (
  message: string,
  sessionId: string,
  sharedMemory: SharedProjectContext,
  activeAgentId?: AgentRole,
  chatMode: 'task_execution' | 'quick_research' | 'chat' = 'chat',
  imageBase64?: string
): Promise<ChatResponse> => {
  const payload: ChatRequest = {
    action: chatMode === 'task_execution' ? 'task_launch' : chatMode === 'quick_research' ? 'quick_action' : 'chat',
    chatInput: message,
    session_id: sessionId,
    project_id: sharedMemory.project_id,
    activeAgentId: activeAgentId || 'luna', // Default to Luna if not specified
    chat_mode: chatMode,
    shared_memory: transformSharedMemory(sharedMemory) as any,
  };

  if (imageBase64) {
    payload.image = imageBase64;
    debugLog('Image attached', `${imageBase64.length} chars (Base64)`);
  }

  debugLog('Chat Request', payload);

  try {
    const response = await axios.post<ChatResponse>(ENDPOINTS.chat, payload, AXIOS_CONFIG);
    debugLog('Chat Response', response.data);
    return response.data;
  } catch (error) {
    const parsedError = parseError(error);
    debugLog('Chat Error', parsedError);
    console.error("[API] Erreur chat:", parsedError.technical);

    const enrichedError = new Error(parsedError.message) as Error & {
      technical: string;
      type: string;
    };
    enrichedError.technical = parsedError.technical;
    enrichedError.type = parsedError.type;

    throw enrichedError;
  }
};

// ============================================
// Parse Response (for compatibility with existing code)
// ============================================

// Import types from n8n for compatibility
import type { ParsedOrchestratorResponse } from './n8n';

// Re-export for convenience
export type ParsedChatResponse = ParsedOrchestratorResponse;

export const parseChatResponse = (response: ChatResponse): ParsedChatResponse => {
  debugLog('Parsing Chat Response', response);

  // V5 backend format → V4 format for compatibility
  return {
    message: response.message || 'Réponse reçue du backend.',
    agentUsed: response.agent,
    respondingAgent: response.agent,
    uiComponents: response.ui_components || [],
    writeBackCommands: response.write_back_commands || [],
    stateUpdate: undefined, // V5 backend handles this via write_back_commands
  };
};

// ============================================
// Health Check
// ============================================

export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const response = await axios.get(`${BACKEND_API_URL}/health`, {
      timeout: 5000,
    });
    return response.data?.status === 'healthy';
  } catch (error) {
    console.error('[API] Backend health check failed:', error);
    return false;
  }
};

export const getBackendUrl = (): string => BACKEND_API_URL;
