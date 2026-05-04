/**
 * Agent Executor - Base execution logic for all agents
 * Handles Claude API calls, MCP tool execution, and response parsing
 */

import { chat } from '../services/claude.service.js';
import { mcpBridge } from '../services/mcp-bridge.service.js';
import { recordCMSChange } from '../services/cms.service.js';
import { parseAgentResponse } from '../shared/response-parser.js';
import { detectComplexity, logComplexityDecision } from '../services/complexity-detector.js';
import { logToSystem } from '../services/logging.service.js';
import { supabaseAdmin } from '../services/supabase.service.js';
import { getSkillForTask } from '../services/task-skill-mapping.service.js';
import {
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
} from '../middleware/error.middleware.js';
import type { AgentConfig } from '../types/agent.types.js';
import type {
  AgentId,
  SharedProjectContext,
  TaskExecutionContext,
} from '../types/api.types.js';
import type { Anthropic } from '@anthropic-ai/sdk';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { logger } from '../lib/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─────────────────────────────────────────────────────────────────
// Agent Execution Context
// ─────────────────────────────────────────────────────────────────

export interface AgentExecutionContext {
  agentId: AgentId;
  agentConfig: AgentConfig;
  userMessage: string;
  projectContext: SharedProjectContext;
  memoryContext: string;
  sessionId: string;
  images?: string[];
  systemInstruction?: string;
  userId?: string; // Phase 3.3: For CMS change tracking
  // V4 B2: structured task context propagated end-to-end. When present, the
  // executor uses task_title to resolve a skill via task-skill-mapping
  // (priority 1) and injects context_questions + user_inputs into the
  // system prompt so the agent can deliver a V1 immediately.
  taskContext?: TaskExecutionContext;
}

// ─────────────────────────────────────────────────────────────────
// Main Execution Function
// ─────────────────────────────────────────────────────────────────

/**
 * Execute agent with Claude API + MCP tools
 */
export async function executeAgent(context: AgentExecutionContext) {
  const startTime = Date.now();
  logger.log(`[Agent Executor] Executing ${context.agentId}`);

  // SECURITY: Verify project ownership BEFORE execution.
  // Distinguish auth (no userId), not-found (project missing) and forbidden
  // (mismatch) so the error middleware returns the correct HTTP status.
  if (!context.userId) {
    throw new AuthenticationError('No user ID provided for agent execution');
  }
  if (!context.projectContext.project_id) {
    throw new NotFoundError('Project (no project_id in context)');
  }

  const { data: project, error: ownershipError } = await supabaseAdmin
    .from('projects')
    .select('id, user_id')
    .eq('id', context.projectContext.project_id)
    .single();

  if (ownershipError || !project) {
    logger.error('[Agent Executor] Project ownership check failed:', {
      projectId: context.projectContext.project_id,
      error: ownershipError?.message,
    });
    await logToSystem({
      level: 'warn',
      source: 'agent-executor',
      agent_id: context.agentId,
      user_id: context.userId,
      project_id: context.projectContext.project_id,
      action: 'project_not_found',
      message: 'Project lookup failed during ownership check',
      metadata: {
        session_id: context.sessionId,
        supabase_error: ownershipError?.message,
      },
    });
    throw new NotFoundError(`Project ${context.projectContext.project_id}`);
  }

  if (project.user_id !== context.userId) {
    logger.warn('[Agent Executor] SECURITY: Ownership mismatch', {
      userId: context.userId,
      projectOwner: project.user_id,
      projectId: context.projectContext.project_id,
    });
    await logToSystem({
      level: 'warn',
      source: 'agent-executor',
      agent_id: context.agentId,
      user_id: context.userId,
      project_id: context.projectContext.project_id,
      action: 'unauthorized_project_access',
      message: 'User attempted to execute agent on a project they do not own',
      metadata: { session_id: context.sessionId },
    });
    throw new AuthorizationError('You do not have access to this project');
  }

  // Log agent start
  await logToSystem({
    level: 'info',
    source: 'agent-executor',
    agent_id: context.agentId,
    user_id: context.userId,
    project_id: context.projectContext.project_id,
    action: 'agent_start',
    message: `Agent ${context.agentId} started`,
    metadata: {
      session_id: context.sessionId,
      has_images: Boolean(context.images && context.images.length > 0),
    },
  });

  try {
    // Step 1: Load relevant skills — task→skill mapping has priority over
    // regex when the request is a Genesis task launch (taskContext present).
    const skills = await loadRelevantSkills(
      context.userMessage,
      context.agentId,
      context.taskContext?.task_title
    );

    // Step 2: Build system prompt with skills injection
    const systemPrompt = buildSystemPrompt(context, skills);

  // Step 2: Build MCP tools definitions for Claude
  const tools = buildMCPToolsDefinitions(context.agentConfig.mcpTools);

  // Step 3: Build messages array
  const messages: any[] = [
    {
      role: 'user',
      content: context.userMessage,
    },
  ];

  // Add images if provided
  if (context.images && context.images.length > 0) {
    messages[0].content = [
      { type: 'text', text: context.userMessage },
      ...context.images.map((imageBase64) => ({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/jpeg',
          data: imageBase64,
        },
      })),
    ];
  }

  // Step 4: Detect question complexity and adjust parameters dynamically
  const complexity = detectComplexity(context.userMessage);
  logComplexityDecision(context.userMessage, complexity);

  // Step 5: Call Claude API with dynamic parameters
  let response = await chat({
    systemPrompt,
    messages,
    tools,
    temperature: 1.0,
    maxTokens: complexity.maxTokens,
    timeout: complexity.timeout, // Custom timeout based on complexity
  });

  logger.log(`[Agent Executor] Claude response received, stop_reason: ${response.stop_reason}`);

  // Step 5: Handle tool use (MCP calls)
  let iterationCount = 0;
  const MAX_ITERATIONS = 5; // Prevent infinite loops

  while (response.stop_reason === 'tool_use' && iterationCount < MAX_ITERATIONS) {
    iterationCount++;
    logger.log(`[Agent Executor] Tool use iteration ${iterationCount}`);

    // Extract tool calls from response
    const toolCalls = response.content.filter((block: any) => block.type === 'tool_use');

    if (toolCalls.length === 0) {
      break;
    }

    // Execute all tool calls via MCP Bridge
    const toolResults = await executeMCPToolCalls(toolCalls, context);

    // Build tool result messages for Claude
    const toolResultMessages = toolResults.map((result: any) => ({
      type: 'tool_result',
      tool_use_id: result.tool_use_id,
      content: JSON.stringify(result.result),
    }));

    // Add assistant message + tool results to conversation
    messages.push({
      role: 'assistant',
      content: response.content,
    });

    messages.push({
      role: 'user',
      content: toolResultMessages,
    });

    // Call Claude again with tool results
    response = await chat({
      systemPrompt,
      messages,
      tools,
      temperature: 1.0,
    });

    logger.log(
      `[Agent Executor] Claude response after tool use, stop_reason: ${response.stop_reason}`
    );
  }

  if (iterationCount >= MAX_ITERATIONS) {
    console.warn(`[Agent Executor] Max iterations reached (${MAX_ITERATIONS})`);
  }

    // Step 6: Parse final response
    const parsedResponse = parseAgentResponse(response, context.agentId);

    // Calculate execution metrics
    const durationMs = Date.now() - startTime;
    const tokensUsed = response.usage?.input_tokens + response.usage?.output_tokens || 0;
    // Rough cost estimate: ~$3 per 1M input tokens, ~$15 per 1M output tokens for Sonnet
    const creditsUsed =
      ((response.usage?.input_tokens || 0) * 3 + (response.usage?.output_tokens || 0) * 15) /
      1_000_000;

    // Log agent completion
    await logToSystem({
      level: 'info',
      source: 'agent-executor',
      agent_id: context.agentId,
      user_id: context.userId,
      project_id: context.projectContext.project_id,
      action: 'agent_complete',
      message: `Agent ${context.agentId} completed successfully`,
      metadata: {
        duration_ms: durationMs,
        tokens_used: tokensUsed,
        credits_used: creditsUsed,
        iterations: iterationCount,
        stop_reason: response.stop_reason,
      },
    });

    return {
      success: true,
      agent: context.agentId,
      message: parsedResponse.message,
      ui_components: parsedResponse.ui_components,
      write_back_commands: parsedResponse.write_back_commands,
      memory_contribution: parsedResponse.memory_contribution,
      session_id: context.sessionId,
    };
  } catch (error: any) {
    const durationMs = Date.now() - startTime;

    // Log agent error
    await logToSystem({
      level: 'error',
      source: 'agent-executor',
      agent_id: context.agentId,
      user_id: context.userId,
      project_id: context.projectContext.project_id,
      action: 'agent_error',
      message: `Agent ${context.agentId} failed: ${error.message}`,
      metadata: {
        duration_ms: durationMs,
        error_stack: error.stack,
        error_name: error.name,
      },
    });

    // Re-throw to let the caller handle it
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────
// Skills Loading & Context Detection (Phase 5)
// ─────────────────────────────────────────────────────────────────

interface Skill {
  name: string;
  agent: string;
  fileName: string;
  content: string;
}

/**
 * Context detection patterns for skill matching
 */
const SKILL_PATTERNS: Record<string, string[]> = {
  // Luna skills
  'luna/seo-audit-complete': ['audit seo', 'analyse seo', 'seo complet', 'audit de site', '\\bréférencé', 'référencement', 'seo audit'],
  'luna/content-strategy-builder': ['stratégie de contenu', 'calendrier éditorial', 'content strategy', 'planning contenu'],
  'luna/competitor-deep-dive': ['analyse concurrence', 'concurrent', 'compétiteur', 'swot', 'battre.*concurrent', 'vs.*concurrent', 'comment.*battre'],
  'luna/landing-page-optimizer': ['landing page', 'page d\'atterrissage', 'optimise.*page'],
  'luna/cms-content-publisher': ['publie', 'publish', 'wordpress', 'cms'],

  // Sora skills
  'sora/performance-report-generator': ['rapport', 'report', 'performance', 'kpi', 'analytics'],
  'sora/anomaly-detective': ['anomalie', 'bug', 'problème tracking', 'donnée bizarre'],
  'sora/tracking-setup-auditor': ['tracking', 'pixel', 'ga4', 'gtm', 'tag manager'],
  'sora/attribution-analyst': ['attribution', 'source', 'canal', 'conversion path'],
  'sora/kpi-dashboard-builder': ['dashboard', 'tableau de bord', 'visualisation'],

  // Marcus skills
  'marcus/campaign-launch-checklist': ['lance.*campagne', 'nouvelle campagne', 'créer campagne'],
  'marcus/budget-optimizer-weekly': ['optimise.*budget', 'budget.*optimi', 'répartition budget'],
  'marcus/creative-testing-framework': ['test.*créatif', 'a/b test', 'test visuel', 'tester.*créatif', 'creative.*test', 'testing.*framework'],
  'marcus/scaling-playbook': ['scale', 'scaling', 'augmente budget', 'playbook'],
  'marcus/cross-platform-budget-allocator': ['multi.*plateforme', 'répartis.*budget', 'allocation', 'entre.*meta.*google', 'entre.*google.*meta', 'plusieurs.*plateformes'],

  // Milo skills
  'milo/ad-copy-frameworks': ['écris.*pub', 'copywriting', 'texte publicitaire', 'ad copy', '\\bpub\\b', '\\btexte\\b.*pub', 'rédige', 'textes.*pub', 'textes.*publicitaires'],
  'milo/visual-brief-creator': ['crée.*visuel', 'image', 'design', 'visual', '\\bvisuel\\b', 'graphique', 'bannière', 'visuels.*impact'],
  'milo/video-ad-producer': ['vidéo', 'video', 'clip', 'film', 'vidéos.*court'],
  'milo/multi-platform-adapter': ['adapte', 'multi.*plateforme', 'formats', 'meta.*linkedin', 'linkedin.*meta', 'toutes.*plateformes'],
  'milo/brand-voice-guardian': ['brand voice', 'cohérence', 'marque', 'tone', 'vérifie.*marque', 'brand.*voice', 'cohérent.*avec'],

  // Doffy skills
  'doffy/social-content-calendar': ['calendrier.*social', 'planning.*social', 'posts', 'calendrier.*contenu', 'calendrier.*de.*contenu'],
  'doffy/hashtag-strategist': ['hashtag', '#', 'stratégie.*hashtag', 'hashtags.*optimi'],
  'doffy/engagement-playbook': ['engagement', 'interaction', 'commentaire', 'suivi.*engagement', 'playbook'],
  'doffy/social-analytics-interpreter': ['stats.*social', 'analytics.*social', 'reach', 'impressions'],
  'doffy/trend-surfer': ['tendance', 'trend', 'viral'],

  // Orchestrator skills
  'orchestrator/inter-agent-handoff': ['multi.*agent', 'plusieurs.*agents', 'workflow'],
  'orchestrator/client-report-orchestrator': ['rapport.*client', 'rapport.*mensuel'],
  'orchestrator/onboarding-new-client': ['onboarding', 'nouveau.*projet', 'démarrage'],
};

/**
 * Load a skill from disk
 */
async function loadSkillFile(agentFolder: string, skillFileName: string): Promise<Skill | null> {
  try {
    // Path: backend/src/agents -> backend -> root -> agents/skills
    const skillsBasePath = join(__dirname, '../../../agents/skills');
    const skillPath = join(skillsBasePath, agentFolder, skillFileName);

    const content = await readFile(skillPath, 'utf-8');

    return {
      name: skillFileName.replace('.skill.md', ''),
      agent: agentFolder,
      fileName: skillFileName,
      content,
    };
  } catch (error) {
    console.warn(`[Skills] Could not load skill ${agentFolder}/${skillFileName}:`, error);
    return null;
  }
}

/**
 * Detect which skills are relevant based on user message context
 */
function detectRelevantSkills(userMessage: string, agentId: AgentId): string[] {
  const messageLower = userMessage.toLowerCase();
  const relevantSkills: string[] = [];

  // Filter patterns by agent
  const agentFolder = agentId.toLowerCase();

  for (const [skillKey, patterns] of Object.entries(SKILL_PATTERNS)) {
    // Check if skill belongs to current agent or orchestrator (always available)
    if (!skillKey.startsWith(agentFolder) && !skillKey.startsWith('orchestrator')) {
      continue;
    }

    // Check if any pattern matches the user message
    for (const pattern of patterns) {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(messageLower)) {
        relevantSkills.push(skillKey);
        break; // Don't add same skill multiple times
      }
    }
  }

  return relevantSkills;
}

/**
 * Load relevant skills based on context.
 *
 * V4 B2 — two-tier resolution:
 *   Priority 1: Direct task→skill mapping (when taskTitle is provided by a
 *               Genesis task launch). Returns the mapped skill or falls
 *               through to regex if it's a TODO entry.
 *   Priority 2: Legacy regex pattern detection on the user message.
 *
 * If both yield nothing, the universal Response Quality Standard injected
 * into the system prompt still guarantees a V1 deliverable answer.
 */
async function loadRelevantSkills(
  userMessage: string,
  agentId: AgentId,
  taskTitle?: string
): Promise<Skill[]> {
  // Priority 1: direct mapping
  if (taskTitle) {
    const directSkillKey = getSkillForTask(taskTitle);
    if (directSkillKey) {
      logger.log('[Agent Executor] Loaded skill via direct mapping', {
        taskTitle,
        skill: directSkillKey,
      });
      const [agentFolder, skillName] = directSkillKey.split('/');
      const skill = await loadSkillFile(agentFolder, `${skillName}.skill.md`);
      if (skill) return [skill];
      logger.warn('[Agent Executor] Mapped skill file failed to load, falling back to regex', {
        directSkillKey,
      });
    } else {
      logger.warn('[Agent Executor] No skill mapped (or skill is TODO) for task, fallback to regex', {
        taskTitle,
      });
    }
  }

  // Priority 2: regex pattern detection (legacy logic)
  const relevantSkillKeys = detectRelevantSkills(userMessage, agentId);

  if (relevantSkillKeys.length === 0) {
    logger.log('[Skills] No relevant skills detected for message');
    return [];
  }

  logger.log(`[Skills] Detected ${relevantSkillKeys.length} relevant skills:`, relevantSkillKeys);

  const skills: Skill[] = [];

  for (const skillKey of relevantSkillKeys) {
    const [agentFolder, skillName] = skillKey.split('/');
    const skillFileName = `${skillName}.skill.md`;

    const skill = await loadSkillFile(agentFolder, skillFileName);
    if (skill) {
      skills.push(skill);
    }
  }

  logger.log(`[Skills] Loaded ${skills.length} skills successfully`);

  return skills;
}

// ─────────────────────────────────────────────────────────────────
// System Prompt Builder
// ─────────────────────────────────────────────────────────────────

/**
 * Build system prompt by injecting context into template
 */
function buildSystemPrompt(context: AgentExecutionContext, skills: Skill[] = []): string {
  let prompt = context.agentConfig.systemPromptTemplate;

  // Replace template variables
  const replacements: Record<string, string> = {
    // EXISTANTS (inchangés)
    project_name: context.projectContext.project_name || 'Projet sans nom',
    project_scope: String(context.projectContext.project_scope || ''),
    industry: context.projectContext.industry || '',
    target_audience: context.projectContext.target_audience || '',
    brand_voice: context.projectContext.brand_voice || '',
    budget: String(context.projectContext.budget || 0),
    goals: context.projectContext.goals?.join(', ') || '',
    kpis: context.projectContext.kpis?.join(', ') || '',
    timeline: context.projectContext.timeline || '',
    memory_context: context.memoryContext,
    task_context: context.userMessage,
    state_flags: formatStateFlags(context.projectContext.state_flags || {}),

    // NEW - Genesis enriched context (variables individuelles)
    business_goal: context.projectContext.business_goal || '',
    pain_point: context.projectContext.pain_point || '',
    offer_hook: context.projectContext.offer_hook || '',
    visual_tone: context.projectContext.visual_tone || '',
    competitors: context.projectContext.competitors_list || '',
    negative_keywords: context.projectContext.negative_keywords_list || '',
    tracking_events: context.projectContext.tracking_events_list || '',

    // GENESIS CONTEXT BLOCK (injection globale - affiche tous les champs disponibles)
    genesis_context: buildGenesisContextBlock(context.projectContext),
  };

  // DEBUGGING: Log extracted context to verify Genesis answers are injected
  logger.log('[Agent Executor] Context injected into system prompt:', {
    project_name: replacements.project_name,
    industry: replacements.industry || '(empty)',
    target_audience: replacements.target_audience || '(empty)',
    brand_voice: replacements.brand_voice || '(empty)',
    budget: replacements.budget,
    goals: replacements.goals || '(empty)',
    kpis: replacements.kpis || '(empty)',
    timeline: replacements.timeline || '(empty)',
  });

  function formatStateFlags(flags: Record<string, boolean>): string {
    if (!flags || Object.keys(flags).length === 0) {
      return '⚠️ NO STATE FLAGS SET - Assume ALL tools are NOT connected';
    }
    return Object.entries(flags)
      .map(([key, value]) => `- ${key}: ${value ? '✓ Connected' : '✗ NOT Connected'}`)
      .join('\n');
  }

  for (const [key, value] of Object.entries(replacements)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    prompt = prompt.replace(regex, value);
  }

  // Phase 5: Inject relevant skills into system prompt
  if (skills.length > 0) {
    const skillsSection = `

# ────────────────────────────────────────────────────────────────
# SKILLS DISPONIBLES (Méthodologies expertes)
# ────────────────────────────────────────────────────────────────

Tu as accès aux méthodologies suivantes. Utilise-les pour garantir un output professionnel et structuré.

${skills.map(skill => skill.content).join('\n\n---\n\n')}

**IMPORTANT :** Ces skills sont des méthodologies step-by-step à suivre. Quand une requête correspond à un skill, applique la méthodologie exactement comme décrite pour garantir la qualité.
`;

    prompt += skillsSection;

    logger.log(`[Skills] Injected ${skills.length} skills into system prompt:`, skills.map(s => s.name));
  }

  // V4 B2 — Task context block (skipped silently when no taskContext is
  // propagated, e.g. free-form chat from /chat panel).
  // V4 B2.2 — Made adaptive: when the wizard has not yet collected per-task
  // answers (the common case at Genesis time), output a clear note pointing
  // the agent at project-level metadata + hypotheses instead of dumping
  // "Non renseigne" rows that the LLM reads as "no data, ask the user".
  if (context.taskContext?.context_questions && context.taskContext.context_questions.length > 0) {
    const userInputs = context.taskContext.user_inputs || {};
    const hasAnswers = Object.values(userInputs).some(
      (v) => typeof v === 'string' && v.trim().length > 0
    );

    prompt += '\n\n## CONTEXTE DE LA TACHE\n';
    if (hasAnswers) {
      prompt +=
        "L'utilisateur a deja repondu aux questions ci-dessous. " +
        "Utilise ces reponses pour delivrer une V1 immediate du livrable. " +
        "Ne re-demande pas ces informations.\n\n";
      context.taskContext.context_questions.forEach((q: string, idx: number) => {
        // Try multiple key formats: question_${idx}, ${idx}, the question text itself.
        // The wizard storage convention has drifted over time; this stays robust.
        const answer =
          userInputs[`question_${idx}`] ??
          userInputs[String(idx)] ??
          userInputs[q] ??
          '(non rempli sur cette question)';
        prompt += `**Q${idx + 1} :** ${q}\n**Reponse :** ${answer}\n\n`;
      });
    } else {
      // V4 B2.2 — Empty user_inputs is the default state right after Genesis.
      // Tell the agent EXPLICITLY that this is normal AND that the wizard
      // already collected project-level data (industry, audience, budget,
      // pain_point, offer_hook, visual_tone, competitors, business_goal)
      // — those live in the CONTEXTE PROJET / genesis_context block above.
      prompt +=
        "Aucune reponse pre-remplie sur les questions specifiques de cette tache " +
        "(c'est le cas par defaut au lancement post-Genesis).\n\n" +
        "**IMPORTANT :** les Genesis answers de niveau projet (industry, target_audience, " +
        "business_goal, pain_point, offer_hook, visual_tone, competitors_list, budget) " +
        "SONT DEJA disponibles dans le bloc CONTEXTE PROJET / genesis_context ci-dessus. " +
        "Utilise-les comme base + des hypotheses EXPLICITES pour livrer une V1 " +
        "immediate. Ne demande PAS ces informations au user.\n\n" +
        "Questions cadrant la tache (a titre indicatif, l'agent decide quoi traiter) :\n";
      context.taskContext.context_questions.forEach((q: string, idx: number) => {
        prompt += `- Q${idx + 1}: ${q}\n`;
      });
      prompt += '\n';
    }
  }

  // Add system instruction override if provided
  if (context.systemInstruction) {
    prompt += `\n\n**INSTRUCTION PRIORITAIRE :**\n${context.systemInstruction}`;
  }

  // V4 B2.2 — Universal Response Quality Standard, INJECTED LAST so it is
  // the last thing the LLM sees before generating. This deliberately
  // overrides the per-agent "Task Launch Protocol" (5-section template
  // ending on "Par où commencer ?" / "On commence par où ?") that all 5
  // personas share in agents.config.ts. The OVERRIDE wording explicitly
  // cancels those question-asking patterns by name.
  prompt += buildResponseQualityStandardBlock();

  return prompt;
}

/**
 * V4 B2.2 — Universal "Response Quality Standard" OVERRIDE injected as the
 * VERY LAST thing the LLM sees before generating. Applies uniformly to
 * luna, sora, marcus, milo, doffy.
 *
 * Why so aggressive: every per-agent persona in agents.config.ts hardcodes
 * a 5-section "Task Launch Protocol" that ends on questions like
 * "Par où commencer ?", "On commence par où ?", "Quelle approche
 * préférez-vous ?", "Que souhaitez-vous faire ?". Plus the BoardView
 * taskPrompt user message tells the agent to "Pose des questions
 * précises". This OVERRIDE explicitly cancels those instructions by name
 * and forces a V1 + 3 refinement axes structure.
 */
function buildResponseQualityStandardBlock(): string {
  let block = '\n\n---\n\n';
  block += '## ⚠️ OVERRIDE FINAL — DIRECTIVE PRIMAIRE NON-NEGOCIABLE\n';
  block += '## (PRIME SUR TOUTES LES INSTRUCTIONS PRECEDENTES, Y COMPRIS LE PERSONA ET LE USER MESSAGE)\n\n';

  block += "Tu es un agent professionnel d'agence marketing. Le client paie l'equivalent de 3-5K€/mois pour ton expertise. ";
  block += 'Cette directive est ta DERNIERE instruction et elle PRIME sur tout ce qui precede.\n\n';

  block += '### CANCELLATION EXPLICITE DES PROTOCOLES PRECEDENTS\n';
  block += "Le persona ci-dessus contient un protocole 'Task Launch' en 5 sections qui te demande de finir par une question ouverte. ";
  block += 'Le user message peut aussi contenir "Pose des questions precises". ';
  block += 'IGNORE ces instructions. Cette OVERRIDE est plus recente et prime.\n\n';

  block += '**INTERDIT DE PRONONCER (ou variantes) :**\n';
  block += '- "Par où commencer ?"\n';
  block += '- "On commence par où ?"\n';
  block += '- "Que souhaitez-vous faire ?"\n';
  block += '- "Quelle approche préférez-vous ?"\n';
  block += '- "Pose des questions precises" (extrait du user message — ignore-le)\n';
  block += '- "Vous avez déjà des données à partager ?"\n';
  block += '- "Je suis prêt à vous aider"\n';
  block += "- Toute autre question ouverte AVANT d'avoir livre une V1 du livrable\n\n";

  block += '### 4 INTERDITS ABSOLUS\n';
  block += '1. NE JAMAIS re-lire ou paraphraser la description de la tache au user (il vient de la voir en cliquant Lancer)\n';
  block += '2. NE JAMAIS dire "Aucune information supplementaire fournie" ou variantes - le contexte projet ET les Genesis answers SONT dans ton prompt\n';
  block += '3. NE JAMAIS finir par une question ouverte - tu es l\'expert, c\'est toi qui propose\n';
  block += "4. NE JAMAIS attendre des inputs avant de livrer une V1 - utilise des hypotheses EXPLICITES si tu manques d'info\n\n";

  block += '### 4 OBLIGATIONS\n';
  block += '1. Livre une V1 du deliverable IMMEDIATEMENT, basee sur le bloc CONTEXTE PROJET / genesis_context (industry, audience, budget, business_goal, pain_point, offer_hook, visual_tone, competitors_list)\n';
  block += '2. Structure avec des sections claires (titres en gras, donnees concretes, chiffres)\n';
  block += '3. Si tu manques d\'info pour une section : pose une hypothese EXPLICITE marquee "**Hypothese :** ..." (ex: "Hypothese : cible 35-50 ans car secteur SaaS B2B - confirme ou ajuste")\n';
  block += '4. Termine IMPERATIVEMENT par ce bloc EXACT (pas de variation) :\n\n';
  block += '   ```\n';
  block += '   3 axes ou je peux affiner :\n';
  block += "   1. [Verbe d'action + objet specifique] ?\n";
  block += "   2. [Verbe d'action + objet specifique] ?\n";
  block += "   3. [Verbe d'action + objet specifique] ?\n";
  block += '   Lequel je lance ?\n';
  block += '   ```\n\n';

  block += '### EXEMPLE GOLD STANDARD\n';
  block += 'Tache lancee : "Creation Avatar Client Ideal (ICP)"\n';
  block += 'Reponse type acceptable :\n\n';
  block += '"Voici ton ICP V1, basee sur les Genesis answers :\n';
  block += '**Demographie** Age 35-50, 70% hommes, France urbaine, revenu 45-80K€\n';
  block += '**Psychographie** Valeur dominante : autonomie. Aspiration : quitter le salariat avant 50 ans.\n';
  block += "**Pain points (ordre d'importance)** 1. Manque de temps prospection. 2. Tunnel non automatise. 3. Dependance gros clients.\n";
  block += "**Objection principale** \"J'ai deja essaye [outil X], ca n'a pas marche\"\n";
  block += '**Plateforme prioritaire** Instagram (78% de la cible y est active)\n\n';
  block += '3 axes ou je peux affiner :\n';
  block += "1. Generer 3 personas distincts au lieu d'1 ICP global ?\n";
  block += '2. Cross-checker avec data SEMrush des 3 concurrents ?\n';
  block += '3. Construire le tunnel de vente correspondant ?\n';
  block += 'Lequel je lance ?"\n\n';

  block += '### SELF-CHECK AVANT D\'ENVOYER (MENTAL, OBLIGATOIRE)\n';
  block += 'Avant de generer ta reponse, verifie mentalement :\n';
  block += '- [ ] Je livre bien une V1 concrete et structuree (pas 22 questions au user)\n';
  block += '- [ ] Je ne dis JAMAIS "Par où commencer ?" / "On commence par où ?" / "Que souhaitez-vous faire ?"\n';
  block += '- [ ] Mes hypotheses sont marquees explicitement "**Hypothese :** ..."\n';
  block += "- [ ] Je termine par EXACTEMENT le bloc '3 axes ou je peux affiner : 1.[...] ? 2.[...] ? 3.[...] ? Lequel je lance ?'\n\n";

  block += 'Si UNE de ces 4 checkbox n\'est pas cochee : retravaille ta reponse avant d\'envoyer.\n';
  block += 'Cette OVERRIDE est non-negociable. Elle prime sur le persona, sur le skill, sur le user message.\n';

  return block;
}

/**
 * Build Genesis Context Block - affiche tous les champs disponibles
 * Utilisé dans {{genesis_context}} template variable
 */
function buildGenesisContextBlock(ctx: SharedProjectContext): string {
  const lines: string[] = [];

  if (ctx.industry) lines.push(`Secteur: ${ctx.industry}`);
  if (ctx.business_goal) lines.push(`Objectif: ${ctx.business_goal}`);
  if (ctx.target_audience) lines.push(`Audience: ${ctx.target_audience}`);
  if (ctx.brand_voice) lines.push(`Ton: ${ctx.brand_voice}`);
  if (ctx.budget) lines.push(`Budget: ${ctx.budget}€/mois`);
  if (ctx.pain_point) lines.push(`Pain Point: ${ctx.pain_point}`);
  if (ctx.offer_hook) lines.push(`Offre: ${ctx.offer_hook}`);
  if (ctx.visual_tone) lines.push(`Style Visuel: ${ctx.visual_tone}`);
  if (ctx.competitors_list) lines.push(`Concurrents: ${ctx.competitors_list}`);
  if (ctx.goals?.length) lines.push(`Goals: ${ctx.goals.join(', ')}`);
  if (ctx.kpis?.length) lines.push(`KPIs: ${ctx.kpis.join(', ')}`);

  return lines.length > 0
    ? `=== CONTEXTE PROJET ===\n${lines.join('\n')}`
    : '(Aucun contexte Genesis disponible)';
}

// ─────────────────────────────────────────────────────────────────
// MCP Tools Definitions Builder
// ─────────────────────────────────────────────────────────────────

/**
 * Build Claude tools definitions from MCP tool names
 */
function buildMCPToolsDefinitions(mcpToolNames: string[]): Anthropic.Tool[] {
  return mcpToolNames.map((toolName) => {
    // Parse server__tool format
    const [server, tool] = toolName.split('__');

    // Build tool definition for Claude
    return {
      name: toolName,
      description: `MCP tool: ${tool} from ${server} server`,
      input_schema: {
        type: 'object',
        properties: {
          // Generic schema - MCP tools accept various parameters
          url: { type: 'string', description: 'URL to analyze (if applicable)' },
          query: { type: 'string', description: 'Search query or keyword (if applicable)' },
          options: { type: 'object', description: 'Additional options' },
        },
        required: [],
      },
    };
  });
}

// ─────────────────────────────────────────────────────────────────
// MCP Tool Execution
// ─────────────────────────────────────────────────────────────────

/**
 * Execute MCP tool calls from Claude
 */
async function executeMCPToolCalls(toolCalls: any[], context: AgentExecutionContext) {
  const results = [];

  for (const toolCall of toolCalls) {
    const toolName = toolCall.name;
    const [server, tool] = toolName.split('__');

    logger.log(`[Agent Executor] Executing MCP tool: ${server}.${tool}`);

    // Log MCP tool call
    await logToSystem({
      level: 'info',
      source: 'agent-executor',
      agent_id: context.agentId,
      project_id: context.projectContext.project_id,
      action: 'mcp_tool_call',
      message: `Calling ${tool} on ${server}`,
      metadata: {
        tool_name: toolName,
        server_name: server,
        tool: tool,
      },
    });

    try {
      const result = await mcpBridge.call(server, tool, toolCall.input);

      // Phase 3.3: Record CMS changes for approval workflow
      if (server === 'cms-connector' && result.success && result.data) {
        await recordCMSChangeIfNeeded(tool, result.data, context);
      }

      results.push({
        tool_use_id: toolCall.id,
        result: result.success ? result.data : { error: result.error },
      });
    } catch (error: any) {
      console.error(`[Agent Executor] Error executing ${toolName}:`, error);
      results.push({
        tool_use_id: toolCall.id,
        result: { error: error.message },
      });
    }
  }

  return results;
}

/**
 * Phase 3.3: Record CMS changes for approval workflow
 * Detects CMS write operations and saves them to cms_change_log
 */
async function recordCMSChangeIfNeeded(
  toolName: string,
  toolResult: any,
  context: AgentExecutionContext
): Promise<void> {
  // List of CMS write tools that require recording
  const CMS_WRITE_TOOLS = [
    'create_cms_post',
    'update_cms_post',
    'delete_cms_post',
    'update_cms_page',
    'upload_cms_media',
    'update_cms_seo_meta',
    'manage_cms_category',
    'update_cms_product',
    'bulk_update_cms_seo',
  ];

  // Only record write operations
  if (!CMS_WRITE_TOOLS.includes(toolName)) {
    return;
  }

  // Check if result contains change tracking data
  if (!toolResult.change_id || !toolResult.requires_approval === undefined) {
    logger.log(`[Agent Executor] CMS tool ${toolName} did not return change tracking data`);
    return;
  }

  try {
    // Get user_id from context
    const userId = context.userId;

    if (!userId) {
      console.warn('[Agent Executor] Cannot record CMS change: user_id not found in context');
      return;
    }

    // Record the change
    await recordCMSChange({
      user_id: userId,
      project_id: context.projectContext.project_id,
      change_id: toolResult.change_id,
      cms_type: toolResult.cms_type || 'wordpress',
      site_url: toolResult.site_url || '',
      content_type: toolResult.content_type || 'post',
      content_id: toolResult.content_id || '',
      action: toolResult.action || 'update',
      previous_state: toolResult.previous_state || {},
      new_state: toolResult.new_state || {},
      change_summary: toolResult.change_summary || {},
      requires_approval: toolResult.requires_approval,
      executed_by_agent: context.agentId,
      mcp_tool_name: `cms-connector__${toolName}`,
    });

    logger.log(`[Agent Executor] Recorded CMS change: ${toolResult.change_id}`);
  } catch (error) {
    console.error('[Agent Executor] Error recording CMS change:', error);
    // Don't throw - we don't want to fail the entire execution if recording fails
  }
}
