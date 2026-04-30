/**
 * Task Explainer Service - Generates contextual explanations for tasks
 * Instead of showing the raw task description, this service generates
 * intelligent explanations based on:
 * - What other agents have done before
 * - Why this task is important now
 * - How it fits in the project sequence
 * - What the result will be used for
 */

import { supabaseAdmin } from './supabase.service.js';
import { simpleChat } from './claude.service.js';
import { getRecentMemory } from './memory.service.js';
import type { AgentId, ProjectMemoryEntry } from '../types/api.types.js';

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

interface TaskExplanation {
  taskTitle: string;
  explanation: string; // Contextualized explanation
  whyNow: string; // Why this task is important at this stage
  whatWasDoneBefore: string[]; // What other agents accomplished
  whatThisEnables: string; // What this task will unlock
  agentRole: string; // Agent's specific role for this task
}

// ─────────────────────────────────────────────────────────────────
// Main Function
// ─────────────────────────────────────────────────────────────────

/**
 * Generate contextual explanation for a task
 * Uses collective memory + project state to create intelligent context
 */
export async function explainTask(
  taskId: string,
  projectId: string,
  agentId: AgentId
): Promise<TaskExplanation> {
  try {
    // 1. Get the task details
    const { data: task, error: taskError } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      console.warn('[Task Explainer] Task not found, using lightweight fallback');
      // Instead of throwing, return a lightweight explanation
      return await generateLightweightExplanation(projectId, agentId);
    }

    // 2. Get project details
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    // 3. Get completed tasks before this one
    const { data: completedTasks } = await supabaseAdmin
      .from('tasks')
      .select('id, title, assignee, phase, completed_at')
      .eq('project_id', projectId)
      .eq('status', 'done')
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: true });

    // 4. Get recent memory entries
    const recentMemory = await getRecentMemory(projectId, 15);

    // 5. Get all tasks to understand what comes next
    const { data: allTasks } = await supabaseAdmin
      .from('tasks')
      .select('id, title, assignee, phase, depends_on')
      .eq('project_id', projectId)
      .order('phase', { ascending: true });

    // 6. Identify tasks that depend on this one
    const dependentTasks = allTasks?.filter((t) => t.depends_on?.includes(taskId)) || [];

    // 7. Build context for LLM
    const prompt = buildExplanationPrompt(
      task,
      project,
      completedTasks || [],
      recentMemory,
      dependentTasks,
      agentId
    );

    // 8. Generate explanation via Claude (using Haiku for cost optimization)
    const response = await simpleChat(
      'You are a helpful assistant that generates contextual task explanations for a marketing AI agent.',
      prompt,
      'claude-3-5-haiku-20241022' // Haiku is perfect for structured JSON generation
    );

    // 9. Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        taskTitle: task.title,
        explanation: parsed.explanation || task.description || 'Aucune explication disponible.',
        whyNow: parsed.whyNow || 'Cette tâche fait partie de la séquence naturelle du projet.',
        whatWasDoneBefore: parsed.whatWasDoneBefore || [],
        whatThisEnables: parsed.whatThisEnables || 'Prochaines étapes du projet.',
        agentRole: parsed.agentRole || 'Exécuter cette tâche avec expertise.',
      };
    }

    // Fallback
    return {
      taskTitle: task.title,
      explanation: task.description || 'Exécuter cette tâche.',
      whyNow: 'Cette tâche est importante pour faire avancer le projet.',
      whatWasDoneBefore: completedTasks?.map((t) => t.title) || [],
      whatThisEnables: 'Continuer la progression du projet.',
      agentRole: getAgentRoleDescription(agentId),
    };
  } catch (error: any) {
    console.error('[Task Explainer] Error generating explanation:', error);

    // Return basic fallback
    return {
      taskTitle: 'Tâche',
      explanation: 'Exécuter cette tâche pour faire avancer le projet.',
      whyNow: 'Maintenant est le bon moment.',
      whatWasDoneBefore: [],
      whatThisEnables: 'La suite du projet.',
      agentRole: getAgentRoleDescription(agentId),
    };
  }
}

// ─────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────

/**
 * Build prompt for Claude to generate contextual explanation
 */
function buildExplanationPrompt(
  task: any,
  project: any,
  completedTasks: any[],
  recentMemory: ProjectMemoryEntry[],
  dependentTasks: any[],
  agentId: AgentId
): string {
  const agentName = getAgentName(agentId);

  return `Tu es ${agentName}, un agent IA expert dans ton domaine. Tu dois expliquer la tâche suivante à l'utilisateur, en contexte, de manière intelligente.

# INFORMATIONS DU PROJET

**Projet:** ${project.name}
**Scope:** ${project.scope}
**Phase actuelle:** ${project.current_phase}

# LA TÂCHE À EXPLIQUER

**Titre:** ${task.title}
**Description brute (NE PAS COPIER-COLLER):** ${task.description}
**Phase:** ${task.phase}
**Ton rôle:** ${agentName}

# CE QUI A ÉTÉ FAIT AVANT

${
  completedTasks.length > 0
    ? completedTasks
        .map((t, i) => `${i + 1}. [${getAgentName(t.assignee)}] ${t.title} (Phase: ${t.phase})`)
        .join('\n')
    : 'Aucune tâche complétée pour l\'instant. C\'est le début du projet.'
}

# MÉMOIRE COLLECTIVE (ACTIONS RÉCENTES)

${
  recentMemory.length > 0
    ? recentMemory
        .slice(0, 10)
        .map((m) => `- [${getAgentName(m.agent_id)}] ${m.summary}`)
        .join('\n')
    : 'Aucune action enregistrée.'
}

# CE QUE CETTE TÂCHE VA DÉBLOQUER

${
  dependentTasks.length > 0
    ? `Les tâches suivantes dépendent de celle-ci:\n${dependentTasks.map((t) => `- ${t.title} (${getAgentName(t.assignee)})`).join('\n')}`
    : 'Cette tâche permet de continuer la progression du projet.'
}

# TON OBJECTIF

Génère une explication contextuelle et intelligente qui :
1. **Explique ce que cette tâche implique concrètement** (pas juste copier la description !)
2. **Pourquoi maintenant** : Pourquoi cette tâche est importante à ce stade du projet
3. **Ce qui a été fait avant** : Liste des accomplissements des autres agents (3-5 points max)
4. **Ce que ça va permettre** : Ce que le résultat va débloquer ou améliorer
5. **Ton rôle spécifique** : Comment TOI (${agentName}) tu vas aider sur cette tâche

IMPORTANT:
- Sois spécifique et concret
- Utilise les informations du projet et de la mémoire collective
- Montre comment cette tâche s'inscrit dans la séquence
- Utilise un ton professionnel mais accessible
- Utilise le vous pour parler à l'utilisateur

Réponds UNIQUEMENT en JSON valide avec cette structure :

{
  explanation: Explication détaillée de ce que cette tâche implique concrètement (2-3 phrases),
  whyNow: Pourquoi cette tâche maintenant (1-2 phrases),
  whatWasDoneBefore: [Action 1 des autres agents, Action 2, Action 3],
  whatThisEnables: Ce que cette tâche va permettre de faire ensuite (1-2 phrases),
  agentRole: Comment ${agentName} va spécifiquement aider sur cette tâche (1-2 phrases)
}`;
}

/**
 * Get friendly agent name
 */
function getAgentName(agentId: AgentId | string): string {
  const names: Record<string, string> = {
    luna: 'Luna',
    sora: 'Sora',
    marcus: 'Marcus',
    milo: 'Milo',
    strategist: 'Luna',
    analyst: 'Sora',
    trader: 'Marcus',
    creative: 'Milo',
  };

  return names[agentId] || agentId;
}

/**
 * Get agent role description (fallback)
 */
function getAgentRoleDescription(agentId: AgentId): string {
  const roles: Record<AgentId, string> = {
    luna: 'Analyser et créer une stratégie marketing optimale.',
    sora: 'Analyser les données et fournir des insights actionnables.',
    marcus: 'Créer et optimiser les campagnes publicitaires.',
    milo: 'Créer du contenu créatif impactant.',
    doffy: 'Gérer les réseaux sociaux et créer du contenu engageant.',
  };

  return roles[agentId] || 'Exécuter cette tâche avec expertise.';
}

/**
 * Generate lightweight explanation when task is not found in DB
 * Uses project context + memory to create intelligent explanation
 */
async function generateLightweightExplanation(
  projectId: string,
  agentId: AgentId
): Promise<TaskExplanation> {
  try {
    // Get project details
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      console.error('[Task Explainer] Project not found:', projectId);
      return getFallbackExplanation(agentId);
    }

    // Get recent memory entries
    const recentMemory = await getRecentMemory(projectId, 10);

    // Get completed tasks count
    const { data: completedTasks } = await supabaseAdmin
      .from('tasks')
      .select('title, assignee, phase')
      .eq('project_id', projectId)
      .eq('status', 'done')
      .order('completed_at', { ascending: true });

    const agentName = getAgentName(agentId);

    // Build lightweight prompt
    const prompt = `Tu es ${agentName}, un agent IA expert. L'utilisateur vient de lancer une tâche sur le projet "${project.name}".

# CONTEXTE DU PROJET

**Projet:** ${project.name}
**Scope:** ${project.scope}
**Phase actuelle:** ${project.current_phase}

# CE QUI A ÉTÉ FAIT AVANT

${
  completedTasks && completedTasks.length > 0
    ? completedTasks
        .map((t, i) => `${i + 1}. [${getAgentName(t.assignee)}] ${t.title} (Phase: ${t.phase})`)
        .join('\n')
    : 'C\'est le début du projet. Aucune tâche n\'a encore été complétée.'
}

# MÉMOIRE COLLECTIVE (ACTIONS RÉCENTES)

${
  recentMemory.length > 0
    ? recentMemory
        .slice(0, 8)
        .map((m) => `- [${getAgentName(m.agent_id)}] ${m.summary}`)
        .join('\n')
    : 'Aucune action enregistrée pour l\'instant.'
}

# TON OBJECTIF

Génère une explication contextuelle intelligente pour cette tâche. Tu dois :

1. **Expliquer ce que cette tâche implique** : Basé sur la phase actuelle (${project.current_phase}) et le scope (${project.scope}), explique concrètement ce que l'utilisateur va accomplir
2. **Pourquoi maintenant** : Pourquoi cette tâche est importante à ce stade du projet
3. **Ce qui a été fait avant** : Liste 3-5 accomplissements clés des autres agents
4. **Ce que ça va permettre** : Ce que le résultat va débloquer ou améliorer
5. **Ton rôle spécifique** : Comment TOI (${agentName}) tu vas aider sur cette tâche

IMPORTANT:
- Sois spécifique et concret
- Utilise les informations du projet et de la mémoire collective
- Montre la continuité du travail des agents
- Utilise un ton professionnel mais accessible
- Utilise le vous pour parler à l'utilisateur

Réponds UNIQUEMENT en JSON valide avec cette structure :

{
  "explanation": "Explication détaillée de ce que cette tâche implique concrètement (2-3 phrases)",
  "whyNow": "Pourquoi cette tâche maintenant (1-2 phrases)",
  "whatWasDoneBefore": ["Action 1 des autres agents", "Action 2", "Action 3"],
  "whatThisEnables": "Ce que cette tâche va permettre de faire ensuite (1-2 phrases)",
  "agentRole": "Comment ${agentName} va spécifiquement aider sur cette tâche (1-2 phrases)"
}`;

    // Generate explanation via Claude (using Haiku for cost optimization)
    const response = await simpleChat(
      'You are a helpful assistant that generates contextual task explanations for a marketing AI agent.',
      prompt,
      'claude-3-5-haiku-20241022' // Haiku is perfect for structured JSON generation
    );

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        taskTitle: `Tâche ${agentName}`,
        explanation: parsed.explanation || 'Travailler sur cette étape du projet.',
        whyNow: parsed.whyNow || `Cette tâche s'inscrit dans la phase ${project.current_phase}.`,
        whatWasDoneBefore: parsed.whatWasDoneBefore || [],
        whatThisEnables: parsed.whatThisEnables || 'Continuer la progression du projet.',
        agentRole: parsed.agentRole || getAgentRoleDescription(agentId),
      };
    }

    // Fallback if JSON parsing fails
    return getFallbackExplanation(agentId);
  } catch (error: any) {
    console.error('[Task Explainer] Error in lightweight explanation:', error);
    return getFallbackExplanation(agentId);
  }
}

/**
 * Ultimate fallback when everything else fails
 */
function getFallbackExplanation(agentId: AgentId): TaskExplanation {
  return {
    taskTitle: 'Tâche en cours',
    explanation: 'Travailler sur cette étape pour faire avancer le projet.',
    whyNow: 'Cette tâche fait partie de la séquence naturelle du projet.',
    whatWasDoneBefore: [],
    whatThisEnables: 'Continuer la progression du projet.',
    agentRole: getAgentRoleDescription(agentId),
  };
}
