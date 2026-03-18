/**
 * Orchestrator - Agent Router & Coordinator
 * Replaces PM + Orchestrator n8n workflows
 * Routes user messages to appropriate specialist agents
 */

import { buildMemoryContext } from '../shared/memory-injector.js';
import { executeWriteBackCommands } from '../shared/write-back.processor.js';
import { writeMemory } from '../services/memory.service.js';
import { executeAgent } from './agent-executor.js';
import { getAgentConfig } from '../config/agents.config.js';
import type { ChatRequest, ChatResponse, AgentId } from '../types/api.types.js';

// ─────────────────────────────────────────────────────────────────
// Agent Routing Configuration
// ─────────────────────────────────────────────────────────────────

const ROUTING_KEYWORDS: Record<AgentId, string[]> = {
  sora: [
    // Analytics & Data
    'performance',
    'metrics',
    'metriques',
    'ROAS',
    'roas',
    'CPA',
    'cpa',
    'analytics',
    'rapport',
    'report',
    'donnees',
    'data',
    'chiffres',
    'KPI',
    'kpi',
    'conversion',
    'taux',
    'statistiques',
    'stats',
    'baisse',
    'hausse',
    'evolution',
    'tendance performance',
    'tracking',
    'pixel',
    'GA4',
    'Google Analytics',
    'GTM',
    'Tag Manager',
  ],

  luna: [
    // SEO & Strategy
    'concurrent',
    'competitor',
    'SEO',
    'seo',
    'marche',
    'market',
    'tendance',
    'trend',
    'recherche',
    'search',
    'veille',
    'watch',
    'strategie',
    'strategy',
    'analyse concurrentielle',
    'benchmark',
    'positionnement',
    'Google',
    'ranking',
    'classement',
    'mots-cles',
    'keywords',
    'audit',
    'backlinks',
    'indexation',
  ],

  milo: [
    // Creative & Content
    'publicite',
    'pub',
    'ad',
    'ads',
    'creative',
    'creatif',
    'texte',
    'copy',
    'visuel',
    'visual',
    'image',
    'video',
    'headline',
    'accroche',
    'campagne publicitaire',
    'Facebook',
    'Instagram',
    'banner',
    'banniere',
    'A/B',
    'test',
    'variante',
    'crée',
    'cree',
    'génère',
    'genere',
    'fais',
    'rédige',
    'redige',
    'écris',
    'ecris',
    'design',
  ],

  marcus: [
    // Ads & Budget
    'budget',
    'encheres',
    'bid',
    'lancer',
    'launch',
    'deployer',
    'deploy',
    'campagne active',
    'Meta Ads',
    'Google Ads',
    'optimiser',
    'optimize',
    'depense',
    'spend',
    'allocation',
    'pause',
    'activer',
    'desactiver',
    'scaling',
    'scaler',
    'cut',
    'couper',
    'augmenter',
  ],

  doffy: [
    // Social Media
    'social media',
    'reseaux sociaux',
    'reseau social',
    'réseaux sociaux',
    'post',
    'poster',
    'publier',
    'publication',
    'publish',
    // Platforms
    'linkedin',
    'tiktok',
    'twitter',
    'facebook page',
    'facebook post',
    // Calendar & Scheduling
    'calendrier',
    'planning',
    'programmer',
    'schedule',
    'planifier',
    'calendrier editorial',
    'content calendar',
    // Engagement
    'engagement',
    'followers',
    'abonnes',
    'hashtag',
    'hashtags',
    'trending',
    'viral',
    'feed',
    'story',
    'stories',
    'reel',
    'reels',
    'caption',
    'thread',
    'carousel post',
  ],
};

// ─────────────────────────────────────────────────────────────────
// Main Orchestrator Function
// ─────────────────────────────────────────────────────────────────

/**
 * Process chat request and route to appropriate agent
 */
export async function processChat(
  request: ChatRequest,
  _userId: string
): Promise<ChatResponse> {
  try {
    console.log(`[Orchestrator] Processing chat for project ${request.project_id}`);
    console.log(`[Orchestrator] Active agent: ${request.activeAgentId}`);
    console.log(`[Orchestrator] Active agent type: ${typeof request.activeAgentId}`);
    console.log(`[Orchestrator] Active agent truthy: ${!!request.activeAgentId}`);
    console.log(`[Orchestrator] Message: "${request.chatInput}"`);

    // Step 1: Use provided shared_memory as context (frontend already sends complete context)
    // CRITICAL FIX: Extract Genesis answers from project_metadata if root-level fields are empty
    let projectContext = request.shared_memory;

    // If industry/target_audience/etc are empty BUT project_metadata exists, extract them
    const metadata: any = projectContext.project_metadata || {};
    if (!projectContext.industry && metadata.industry) {
      console.log('[Orchestrator] Extracting Genesis context from project_metadata...');
      projectContext = {
        ...projectContext,
        industry: (metadata.industry as string) || '',
        target_audience: (metadata.target_audience || metadata.persona) as string || '',
        brand_voice: (metadata.brand_tone || metadata.editorial_tone) as string || '',
        budget: (metadata.budget_monthly as number) || 0,
        goals: metadata.businessGoal ? [metadata.businessGoal as string] : [],
        kpis: (metadata.conversion_goals as string[]) || [],
        timeline: (metadata.campaign_launch_date as string) || '',
      };
    }

    // DEBUGGING: Log Genesis context received from frontend
    console.log(`[Orchestrator] Genesis context received:`, {
      project_name: projectContext.project_name,
      industry: projectContext.industry || '(empty)',
      target_audience: projectContext.target_audience || '(empty)',
      brand_voice: projectContext.brand_voice || '(empty)',
      budget: projectContext.budget || 0,
      has_metadata: !!projectContext.project_metadata,
      metadata_keys: projectContext.project_metadata ? Object.keys(projectContext.project_metadata) : [],
    });

    // Step 2: Detect intent and route to agent
    console.log(`[Orchestrator] BEFORE routeToAgent - activeAgentId: "${request.activeAgentId}"`);
    const targetAgent = routeToAgent(request.chatInput, request.activeAgentId);
    console.log(`[Orchestrator] Routing to agent: ${targetAgent}`);

    // Step 3: Build memory context for target agent
    const memoryContext = await buildMemoryContext(request.project_id, targetAgent);

    // Step 4: Get agent configuration
    const agentConfig = getAgentConfig(targetAgent);

    // Step 5: Execute agent with full context
    const agentResponse = await executeAgent({
      agentId: targetAgent,
      agentConfig,
      userMessage: request.chatInput,
      projectContext,
      memoryContext,
      sessionId: request.session_id,
      images: request.image ? [request.image] : undefined,
    });

    // Step 5: Write memory contribution
    if (agentResponse.memory_contribution) {
      await writeMemory(request.project_id, targetAgent, agentResponse.memory_contribution);
      console.log(`[Orchestrator] Memory contribution written`);
    }

    // Step 6: Execute write-back commands
    if (agentResponse.write_back_commands && agentResponse.write_back_commands.length > 0) {
      const successCount = await executeWriteBackCommands(
        agentResponse.write_back_commands,
        request.project_id
      );
      console.log(`[Orchestrator] Executed ${successCount} write-back commands`);
    }

    return agentResponse;
  } catch (error: any) {
    console.error('[Orchestrator] Error processing chat:', error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────
// Routing Logic
// ─────────────────────────────────────────────────────────────────

/**
 * Route to appropriate agent based on message intent
 */
function routeToAgent(userMessage: string, activeAgentId?: AgentId): AgentId {
  // CRITICAL: If activeAgentId is provided (e.g., from task assignment), ALWAYS use it
  // This is for task launches where the agent is pre-assigned

  // For task launches, the message starts with "# NOUVELLE TÂCHE:" or "# TASK LAUNCH:"
  // In this case, we should ALWAYS respect activeAgentId
  const isTaskLaunch = userMessage.includes('# NOUVELLE TÂCHE:') || userMessage.includes('# TASK LAUNCH:');

  if (activeAgentId && isTaskLaunch) {
    console.log(`[Orchestrator] Task launch detected - Using assigned agent: ${activeAgentId}`);
    return activeAgentId;
  }

  // For regular chat messages, check if user wants to switch agents
  const switchKeywords = ['autre', 'different', 'plutot', 'changer', 'switch'];
  const matchedKeyword = switchKeywords.find((kw) =>
    userMessage.toLowerCase().includes(kw.toLowerCase())
  );
  const wantsToSwitch = !!matchedKeyword;

  if (matchedKeyword) {
    console.log(`[Orchestrator] Switch keyword detected: "${matchedKeyword}"`);
  }

  if (activeAgentId && !wantsToSwitch) {
    console.log(`[Orchestrator] Using assigned agent: ${activeAgentId}`);
    return activeAgentId;
  }

  console.log('[Orchestrator] No assigned agent, detecting intent from message...');

  // Detect intent from keywords
  const messageLower = userMessage.toLowerCase();

  // Priority 1: Creative keywords (CRÉATION = TOUJOURS CREATIVE)
  const creativeCreationKeywords = [
    'crée',
    'cree',
    'génère',
    'genere',
    'fais une',
    'fais un',
    'rédige',
    'redige',
  ];
  if (creativeCreationKeywords.some((kw) => messageLower.includes(kw))) {
    console.log('[Orchestrator] Creative keywords detected → milo');
    return 'milo';
  }

  // Priority 2: Match keywords for each agent
  let bestMatch: AgentId = 'luna'; // Default to Luna (strategy)
  let maxMatches = 0;

  for (const [agentId, keywords] of Object.entries(ROUTING_KEYWORDS)) {
    const matches = keywords.filter((kw) => messageLower.includes(kw.toLowerCase())).length;

    if (matches > maxMatches) {
      maxMatches = matches;
      bestMatch = agentId as AgentId;
    }
  }

  console.log(`[Orchestrator] Best match from keywords: ${bestMatch} (${maxMatches} matches)`);
  return bestMatch;
}
