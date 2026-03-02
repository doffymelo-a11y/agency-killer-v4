// ============================================
// THE HIVE OS V5 - TypeScript Backend API Service
// Replaces n8n webhooks with Express.js backend
// ============================================

import axios, { AxiosError } from 'axios';
import type {
  AgentRole,
  TaskStatus,
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

export interface ChatRequest {
  project_id: string;
  session_id: string;
  chatInput: string;
  activeAgentId: AgentRole;
  chat_mode: 'TASK' | 'CHAT';
  action: 'AGENT_CHAT';
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

export interface UIComponent {
  type: string;
  id: string;
  title?: string;
  data: unknown;
}

export interface WriteBackCommand {
  type: 'UPDATE_TASK_STATUS' | 'UPDATE_STATE_FLAG' | 'SET_DELIVERABLE' | 'COMPLETE_TASK' | 'UPDATE_PROJECT_PHASE' | 'ADD_FILE' | 'NOTIFY_USER';
  task_id?: string;
  status?: TaskStatus;
  flag_name?: string;
  flag_value?: boolean;
  deliverable_url?: string;
  deliverable_type?: string;
  phase?: string;
  file_data?: unknown;
  notification?: unknown;
}

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
// Main Chat Function
// ============================================

export const sendChatMessage = async (
  message: string,
  sessionId: string,
  projectId: string,
  activeAgentId?: AgentRole,
  chatMode: 'TASK' | 'CHAT' = 'CHAT',
  imageBase64?: string
): Promise<ChatResponse> => {
  const payload: ChatRequest = {
    project_id: projectId,
    session_id: sessionId,
    chatInput: message,
    activeAgentId: activeAgentId || 'luna', // Default to Luna if not specified
    chat_mode: chatMode,
    action: 'AGENT_CHAT',
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

export interface ParsedChatResponse {
  message: string;
  agentUsed?: AgentRole;
  respondingAgent?: AgentRole;
  uiComponents: UIComponent[];
  writeBackCommands: WriteBackCommand[];
}

export const parseChatResponse = (response: ChatResponse): ParsedChatResponse => {
  debugLog('Parsing Chat Response', response);

  return {
    message: response.message || 'Réponse reçue du backend.',
    agentUsed: response.agent,
    respondingAgent: response.agent,
    uiComponents: response.ui_components || [],
    writeBackCommands: response.write_back_commands || [],
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
