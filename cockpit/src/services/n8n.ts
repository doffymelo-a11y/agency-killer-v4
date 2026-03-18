// ============================================
// THE HIVE OS V4 - N8N SERVICE
// PM (Project Manager) as Central Entry Point
// Architecture V4.3 - PM calls Orchestrator as tool
// ============================================

import axios, { AxiosError } from 'axios';
import type {
  AgentRole,
  ProjectMetadata,
  ProjectStateFlags,
  TaskStatus,
} from '../types';

// ============================================
// PM CENTRAL ENTRY POINT - Single webhook
// PM routes to: genesis | task_launch | quick_action | write_back
// ============================================
const PM_WEBHOOK_URL = "https://n8n.srv1234539.hstgr.cloud/webhook/pm-v4-entry";

// Legacy URL for direct orchestrator access (if needed)
// const ORCHESTRATOR_WEBHOOK_URL = "https://n8n.srv1234539.hstgr.cloud/webhook/orchestrator-v4-entry";

// Action types for PM routing
export type PMAction = 'genesis' | 'task_launch' | 'quick_action' | 'write_back';

// ============================================
// Shared Memory Types (Contexte complet)
// ============================================

export interface SharedProjectContext {
  project_id: string;
  project_name: string;
  project_status: string;
  current_phase: string;
  scope: string;
  state_flags: ProjectStateFlags;
  metadata: ProjectMetadata;
}

export interface TaskExecutionContext {
  task_id: string;
  task_title: string;
  task_description?: string;
  task_phase: string;
  context_questions: string[];
  user_inputs: Record<string, string>;
  depends_on: string[];
}

export interface WriteBackCommand {
  type: 'UPDATE_TASK_STATUS' | 'UPDATE_STATE_FLAG' | 'SET_DELIVERABLE' | 'COMPLETE_TASK';
  task_id?: string;
  status?: TaskStatus;
  flag_name?: string;
  flag_value?: boolean;
  deliverable_url?: string;
  deliverable_type?: string;
}

// ============================================
// Genesis Types - Project Creation via PM
// ============================================

export type ProjectScope = 'meta_ads' | 'sem' | 'seo' | 'analytics' | 'full_scale';

export interface GenesisWizardAnswer {
  questionId: string;
  value: string | boolean | number;
}

export interface GenesisRequest {
  scope: ProjectScope;
  answers: GenesisWizardAnswer[];
  project_name: string;
  deadline: string; // ISO date string
  context_data: {
    website_url?: string;
    usp?: string;
    target_persona?: string;
    pain_point?: string;
    competitors?: string;
    monthly_budget?: string;
    business_goal?: string;
    [key: string]: string | undefined;
  };
}

export interface GenesisResponse {
  success: boolean;
  project: {
    id: string;
    name: string;
    scope: ProjectScope;
    status: string;
    current_phase: string;
    state_flags: ProjectStateFlags;
    metadata: ProjectMetadata;
  };
  tasks: Array<{
    id: string;
    title: string;
    description: string;
    assignee: AgentRole;
    phase: string;
    status: TaskStatus;
    estimated_hours: number;
    due_date: string;
    context_questions: string[];
    depends_on: string[];
  }>;
  chat_message: {
    content: string;
    tone: 'positive' | 'neutral' | 'warning';
  };
  meta: {
    agent_id: 'pm';
    version: string;
    tasks_generated: number;
    calendar_optimized: boolean;
  };
}

// ============================================
// Task Launch Types - Execute task via PM
// ============================================

export interface TaskLaunchRequest {
  task_id: string;
  task_title: string;
  task_description?: string;
  task_phase: string;
  assignee: AgentRole;
  context_questions: string[];
  user_inputs: Record<string, string>;
  depends_on: string[];
  // Full project context for injection
  shared_memory: SharedProjectContext;
}

export interface TaskLaunchResponse {
  success: boolean;
  agent_response: {
    message: string;
    agent_used: AgentRole;
    ui_components?: UIComponent[];
  };
  write_back?: WriteBackCommand[];
  state_update?: {
    task_status?: TaskStatus;
    state_flags?: Partial<ProjectStateFlags>;
    deliverable_url?: string;
    deliverable_type?: string;
  };
}

// Timeout configuration - 10 MINUTES pour gros audits (SEO complet, scraping)
const AXIOS_CONFIG = {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 600000, // 10 minutes
};

// Debug mode - ONLY enable in development, NEVER in production
// This prevents sensitive data from being logged to the browser console
const DEBUG_MODE = import.meta.env.DEV && import.meta.env.VITE_DEBUG_N8N === 'true';

// ============================================
// AGENT ID MAPPING - Frontend -> Backend
// ============================================
export const AGENT_ID_MAP: Record<string, string> = {
  luna: 'strategist',   // Luna -> strategist
  milo: 'creative',     // Milo -> creative
  marcus: 'trader',     // Marcus -> trader
  sora: 'analyst',      // Sora -> analyst
  orchestrator: 'orchestrator',
};

// Backend -> Frontend mapping
export const BACKEND_TO_FRONTEND_AGENT_MAP: Record<string, AgentRole> = {
  milo: 'milo',
  luna: 'luna',
  sora: 'sora',
  marcus: 'marcus',
  creative: 'milo',
  strategist: 'luna',
  analyst: 'sora',
  trader: 'marcus',
};

export function mapAgentIdToBackend(frontendId: string): string {
  return AGENT_ID_MAP[frontendId] || 'orchestrator';
}

export function mapBackendAgentToFrontend(backendId: string): AgentRole | undefined {
  if (!backendId) return undefined;
  const normalized = backendId.toLowerCase();
  return BACKEND_TO_FRONTEND_AGENT_MAP[normalized];
}

function debugLog(label: string, data: unknown) {
  if (DEBUG_MODE) {
    console.group(`[N8N] ${label}`);
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
          message: "Impossible de contacter le serveur. Verifiez votre connexion.",
          technical: `Network Error: ${axiosError.message}`,
          type: 'network',
        };
      }
      if (axiosError.code === 'ECONNABORTED') {
        return {
          message: "La requete a expire. Le serveur met trop de temps a repondre.",
          technical: `Timeout: Request exceeded ${AXIOS_CONFIG.timeout}ms`,
          type: 'timeout',
        };
      }
      return {
        message: "Erreur reseau inconnue.",
        technical: `Unknown network error: ${axiosError.message}`,
        type: 'network',
      };
    }

    const status = axiosError.response.status;
    const statusText = axiosError.response.statusText;
    const responseData = axiosError.response.data;

    if (status === 401 || status === 403) {
      return {
        message: "Acces refuse. Verifiez les permissions du webhook.",
        technical: `Auth Error ${status}: ${statusText}. Response: ${JSON.stringify(responseData)}`,
        type: 'auth',
      };
    }

    if (status === 404) {
      return {
        message: "Le webhook n'a pas ete trouve. Verifiez l'URL.",
        technical: `404 Not Found: ${PM_WEBHOOK_URL}`,
        type: 'not_found',
      };
    }

    if (status === 500) {
      return {
        message: "Erreur interne du serveur n8n. Le workflow a peut-etre echoue.",
        technical: `Server Error 500: ${JSON.stringify(responseData)}`,
        type: 'server',
      };
    }

    if (status === 502 || status === 503 || status === 504) {
      return {
        message: "Le serveur n8n est temporairement indisponible.",
        technical: `Gateway Error ${status}: ${statusText}`,
        type: 'gateway',
      };
    }

    return {
      message: `Erreur serveur (${status})`,
      technical: `HTTP ${status}: ${statusText}. Response: ${JSON.stringify(responseData)}`,
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
// Build System Instruction for Project Context
// ============================================
function buildSystemInstruction(
  projectMetadata?: ProjectMetadata | null,
  projectName?: string
): string {
  const metadata = projectMetadata || {};

  return `
ROLE : CONSULTANT MARKETING SENIOR (PROACTIF)

CLIENT : ${projectName || 'Projet en cours'}
SITE WEB : ${metadata.websiteUrl || 'Non fourni'}
USP : ${metadata.usp || 'Non definie'}
PERSONA CIBLE : ${metadata.targetPersona || 'Non definie'}
PAIN POINT : ${metadata.mainPainPoint || 'Non defini'}
CONCURRENCE : ${metadata.competitors || 'Non fournie'}
BUDGET ADS : ${metadata.monthlyBudget || 'Non defini'}
OBJECTIF PRINCIPAL : ${metadata.businessGoal || 'Non defini'}

INSTRUCTIONS :
- Sois expert, direct et structure
- Pas de blabla, des faits et des actions
- Propose, analyse, structure
- Ne jamais inventer de donnees fictives
- Demander explicitement les informations manquantes
  `.trim();
}

// ============================================
// N8N Response Types
// ============================================
export interface N8NResponse {
  success?: boolean;
  message?: string;
  chat_message?: string | { content?: string; text?: string; message?: string };
  response?: string;
  text?: string;
  output?: string;
  content?: string;
  agent_used?: AgentRole;
  agentUsed?: AgentRole;
  agent?: AgentRole;
  agent_id?: AgentRole;
  meta?: {
    agent_id?: AgentRole;
    responding_agent?: string;
  };
  ui_components?: UIComponent[];
  uiComponents?: UIComponent[];
  components?: UIComponent[];
  widgets?: UIComponent[];
  ui_component?: string;
  creative_result?: {
    image_url?: string;
    prompt_used?: string;
    copy?: {
      headline?: string;
      body?: string;
    };
    deliverables?: {
      image_url?: string;
    };
  };
  prompt_used?: string;
  // Write-back commands from agent (V4.2)
  write_back?: WriteBackCommand[];
  writeBack?: WriteBackCommand[];
  state_update?: {
    task_status?: TaskStatus;
    state_flags?: Partial<ProjectStateFlags>;
    deliverable_url?: string;
    deliverable_type?: string;
  };
}

export interface UIComponent {
  type: string;
  id: string;
  title?: string;
  data: unknown;
}

// ============================================
// MAIN FUNCTION - Send Message to PM (Central Brain)
// PM routes to Orchestrator based on context (V4.3)
// ============================================
export const sendMessageToOrchestrator = async (
  message: string,
  sessionId: string,
  projectMetadata?: ProjectMetadata | null,
  projectName?: string,
  imageBase64?: string,
  activeAgentId?: string,
  // V4.2 - Shared Memory Parameters
  sharedContext?: SharedProjectContext | null,
  taskContext?: TaskExecutionContext | null,
  chatMode?: 'quick_research' | 'task_execution'
): Promise<N8NResponse> => {
  const systemInstruction = buildSystemInstruction(projectMetadata, projectName);
  const backendAgentId = activeAgentId ? mapAgentIdToBackend(activeAgentId) : 'orchestrator';

  // V4.3 - Determine action type based on context
  const action: PMAction = taskContext && chatMode === 'task_execution'
    ? 'task_launch'
    : 'quick_action';

  const payload: Record<string, unknown> = {
    action, // PM routing key
    chatInput: message,
    session_id: sessionId,
    activeAgentId: backendAgentId,
    system_instruction: systemInstruction,
    chat_mode: chatMode || 'quick_research',
  };

  debugLog('PM Action Type', action);
  debugLog('Active Agent Routing', { frontend: activeAgentId, backend: backendAgentId });

  if (imageBase64) {
    payload.image = imageBase64;
    debugLog('Image attached', `${imageBase64.length} chars (Base64)`);
  }

  // V4.2 - Include full shared project context (La Mémoire Partagée)
  if (sharedContext) {
    payload.shared_memory = {
      project_id: sharedContext.project_id,
      project_name: sharedContext.project_name,
      project_status: sharedContext.project_status,
      current_phase: sharedContext.current_phase,
      scope: sharedContext.scope,
      state_flags: sharedContext.state_flags,
      metadata: sharedContext.metadata,
    };
    debugLog('Shared Memory Context', payload.shared_memory);
  }

  // V4.3 - Include task context for task_launch action
  if (taskContext && action === 'task_launch') {
    payload.task_context = {
      task_id: taskContext.task_id,
      task_title: taskContext.task_title,
      task_description: taskContext.task_description,
      task_phase: taskContext.task_phase,
      context_questions: taskContext.context_questions,
      user_inputs: taskContext.user_inputs,
      depends_on: taskContext.depends_on,
    };
    debugLog('Task Execution Context', payload.task_context);
  }

  // Legacy project_context for backwards compatibility
  if (projectMetadata) {
    payload.project_context = {
      websiteUrl: projectMetadata.websiteUrl || projectMetadata.website_url,
      usp: projectMetadata.usp,
      targetPersona: projectMetadata.targetPersona || projectMetadata.persona,
      mainPainPoint: projectMetadata.mainPainPoint || projectMetadata.pain_point,
      competitors: projectMetadata.competitors,
      monthlyBudget: projectMetadata.monthlyBudget || projectMetadata.budget_monthly,
      businessGoal: projectMetadata.businessGoal,
    };
  }

  debugLog('Full PM Request Payload', payload);

  try {
    // V4.3 - All requests go through PM entry point
    const response = await axios.post(PM_WEBHOOK_URL, payload, AXIOS_CONFIG);
    debugLog('Response Status', response.status);
    debugLog('Response Data', response.data);
    return response.data;
  } catch (error) {
    const parsedError = parseError(error);
    debugLog('Error Details', parsedError);
    console.error("Erreur connexion PM:", parsedError.technical);

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
// Parse Orchestrator Response (V4.2)
// Includes Write-Back Commands
// ============================================
export interface ParsedOrchestratorResponse {
  message: string;
  agentUsed?: AgentRole;
  respondingAgent?: AgentRole;
  uiComponents: UIComponent[];
  // V4.2 - Write-back commands
  writeBackCommands: WriteBackCommand[];
  stateUpdate?: {
    task_status?: TaskStatus;
    state_flags?: Partial<ProjectStateFlags>;
    deliverable_url?: string;
    deliverable_type?: string;
  };
}

export const parseOrchestratorResponse = (
  response: unknown
): ParsedOrchestratorResponse => {
  debugLog('Parsing Response', response);

  let data = response;

  if (typeof response === 'string') {
    try {
      data = JSON.parse(response);
    } catch {
      return { message: response, uiComponents: [], writeBackCommands: [] };
    }
  }

  if (Array.isArray(data)) {
    data = data[0] || {};
  }

  const responseData = data as Record<string, unknown>;

  // Extract message
  let message = '';

  if (responseData.chat_message) {
    const chatMsg = responseData.chat_message;
    if (typeof chatMsg === 'string') {
      message = chatMsg;
    } else if (typeof chatMsg === 'object' && chatMsg !== null) {
      const chatMsgObj = chatMsg as Record<string, unknown>;
      message = (chatMsgObj.content as string) || (chatMsgObj.text as string) || (chatMsgObj.message as string) || '';
    }
  }

  if (!message) {
    message =
      (responseData.message as string) ||
      (responseData.response as string) ||
      (responseData.text as string) ||
      (responseData.output as string) ||
      (responseData.content as string) ||
      '';
  }

  if (!message) {
    message = 'Reponse recue du serveur.';
  }

  // Extract agent
  const agentUsed =
    (responseData.agent_used as AgentRole) ||
    (responseData.agentUsed as AgentRole) ||
    (responseData.agent as AgentRole) ||
    (responseData.agent_id as AgentRole) ||
    ((responseData.meta as Record<string, unknown>)?.agent_id as AgentRole);

  // Extract UI components
  let uiComponents: UIComponent[] = [];

  const rawComponents =
    responseData.ui_components ||
    responseData.uiComponents ||
    responseData.components ||
    responseData.widgets;

  if (rawComponents) {
    uiComponents = Array.isArray(rawComponents) ? rawComponents : [rawComponents];
  }

  // Extract responding agent
  let respondingAgent: AgentRole | undefined;
  const meta = responseData.meta as Record<string, unknown> | undefined;

  if (meta?.responding_agent) {
    const backendAgent = meta.responding_agent as string;
    respondingAgent = mapBackendAgentToFrontend(backendAgent);
  }

  // V4.2 - Extract write-back commands
  let writeBackCommands: WriteBackCommand[] = [];
  const rawWriteBack = responseData.write_back || responseData.writeBack;
  if (rawWriteBack) {
    writeBackCommands = Array.isArray(rawWriteBack) ? rawWriteBack : [rawWriteBack];
    debugLog('Write-Back Commands', writeBackCommands);
  }

  // V4.2 - Extract state update (simpler format)
  const stateUpdate = responseData.state_update as ParsedOrchestratorResponse['stateUpdate'] | undefined;
  if (stateUpdate) {
    debugLog('State Update', stateUpdate);
  }

  return {
    message,
    agentUsed,
    respondingAgent,
    uiComponents: uiComponents.filter((comp): comp is UIComponent => comp && typeof comp === 'object' && 'type' in comp),
    writeBackCommands,
    stateUpdate,
  };
};

export const getWebhookUrl = (): string => PM_WEBHOOK_URL;

// ============================================
// PM GENESIS - Create Project + Generate Tasks
// Called when user completes the Genesis Wizard
// ============================================
export const createProjectWithGenesis = async (
  genesisRequest: GenesisRequest
): Promise<GenesisResponse> => {
  const payload = {
    action: 'genesis' as PMAction,
    scope: genesisRequest.scope,
    answers: genesisRequest.answers,
    project_name: genesisRequest.project_name,
    deadline: genesisRequest.deadline,
    context_data: genesisRequest.context_data,
  };

  debugLog('Genesis Request', payload);

  try {
    const response = await axios.post(PM_WEBHOOK_URL, payload, AXIOS_CONFIG);
    debugLog('Genesis Response', response.data);
    return response.data;
  } catch (error) {
    const parsedError = parseError(error);
    debugLog('Genesis Error', parsedError);
    console.error("Erreur Genesis:", parsedError.technical);

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
// PM TASK LAUNCH - Execute Task with Context Injection
// PM injects full context then routes to Orchestrator
// ============================================
export const launchTaskExecution = async (
  taskRequest: TaskLaunchRequest,
  userMessage: string
): Promise<TaskLaunchResponse> => {
  const payload = {
    action: 'task_launch' as PMAction,
    chatInput: userMessage,
    task_id: taskRequest.task_id,
    task_title: taskRequest.task_title,
    task_description: taskRequest.task_description,
    task_phase: taskRequest.task_phase,
    assignee: taskRequest.assignee,
    context_questions: taskRequest.context_questions,
    user_inputs: taskRequest.user_inputs,
    depends_on: taskRequest.depends_on,
    shared_memory: taskRequest.shared_memory,
  };

  console.log('[n8n] 🚀 launchTaskExecution called with:', payload);
  debugLog('Task Launch Request', payload);

  try {
    console.log('[n8n] Sending POST to PM webhook...');
    const response = await axios.post(PM_WEBHOOK_URL, payload, AXIOS_CONFIG);
    console.log('[n8n] ✅ PM webhook responded:', response.data);
    debugLog('Task Launch Response', response.data);
    return response.data;
  } catch (error) {
    console.error('[n8n] ❌ Error calling PM webhook:', error);
    const parsedError = parseError(error);
    debugLog('Task Launch Error', parsedError);
    console.error("Erreur Task Launch:", parsedError.technical);

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
// PM WRITE-BACK - Update Project State
// Centralized state management through PM
// ============================================
export const sendWriteBack = async (
  projectId: string,
  commands: WriteBackCommand[]
): Promise<{ success: boolean; updated: string[] }> => {
  const payload = {
    action: 'write_back' as PMAction,
    project_id: projectId,
    write_back_commands: commands,
  };

  debugLog('Write-Back Request', payload);

  try {
    const response = await axios.post(PM_WEBHOOK_URL, payload, AXIOS_CONFIG);
    debugLog('Write-Back Response', response.data);
    return response.data;
  } catch (error) {
    const parsedError = parseError(error);
    debugLog('Write-Back Error', parsedError);
    console.error("Erreur Write-Back:", parsedError.technical);

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
// PM QUICK ACTION - Route to Orchestrator
// For quick chat/research without specific task context
// PM acts as gateway, forwards to Orchestrator tool
// ============================================
export const sendQuickAction = async (
  message: string,
  sessionId: string,
  sharedContext?: SharedProjectContext | null,
  activeAgentId?: string,
  imageBase64?: string
): Promise<N8NResponse> => {
  const backendAgentId = activeAgentId ? mapAgentIdToBackend(activeAgentId) : 'orchestrator';

  const payload: Record<string, unknown> = {
    action: 'quick_action' as PMAction,
    chatInput: message,
    session_id: sessionId,
    activeAgentId: backendAgentId,
  };

  if (sharedContext) {
    payload.shared_memory = {
      project_id: sharedContext.project_id,
      project_name: sharedContext.project_name,
      project_status: sharedContext.project_status,
      current_phase: sharedContext.current_phase,
      scope: sharedContext.scope,
      state_flags: sharedContext.state_flags,
      metadata: sharedContext.metadata,
    };
  }

  if (imageBase64) {
    payload.image = imageBase64;
  }

  debugLog('Quick Action Request', payload);

  try {
    const response = await axios.post(PM_WEBHOOK_URL, payload, AXIOS_CONFIG);
    debugLog('Quick Action Response', response.data);
    return response.data;
  } catch (error) {
    const parsedError = parseError(error);
    debugLog('Quick Action Error', parsedError);
    console.error("Erreur Quick Action:", parsedError.technical);

    const enrichedError = new Error(parsedError.message) as Error & {
      technical: string;
      type: string;
    };
    enrichedError.technical = parsedError.technical;
    enrichedError.type = parsedError.type;

    throw enrichedError;
  }
};
