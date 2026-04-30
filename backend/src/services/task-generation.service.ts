// ═══════════════════════════════════════════════════════════════
// THE HIVE OS V5 - Task Generation Service
// Phase 2.11 - Auto Phase Transition
// ═══════════════════════════════════════════════════════════════

import { v4 as uuidv4 } from 'uuid';
import { logger } from '../lib/logger.js';

// Types (copied from frontend wizard-config to avoid import issues)
type TaskPhase = 'Audit' | 'Setup' | 'Production' | 'Optimization';
type ProjectScope = 'meta_ads' | 'sem' | 'seo' | 'analytics' | 'full_scale';
type AgentRole = 'luna' | 'sora' | 'marcus' | 'milo' | 'doffy' | 'orchestrator';
type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked';

interface TaskTemplate {
  title: string;
  description: string;
  assignee: AgentRole;
  phase: TaskPhase;
  context_questions: string[];
  estimated_hours: number;
  order: number;
}

interface GeneratedTask {
  id: string;
  project_id: string;
  title: string;
  description: string;
  assignee: AgentRole;
  phase: TaskPhase;
  status: TaskStatus;
  context_questions: string[];
  estimated_hours: number;
  due_date: string; // ISO date YYYY-MM-DD
  depends_on: string[];
  created_at: string;
}

// ─────────────────────────────────────────────────────────────────
// Phase Constants
// ─────────────────────────────────────────────────────────────────

const PHASE_ORDER: TaskPhase[] = ['Audit', 'Setup', 'Production', 'Optimization'];

const PHASE_DISTRIBUTION = {
  Audit: 0.15,
  Setup: 0.30,
  Production: 0.40,
  Optimization: 0.15,
};

/**
 * Get the next phase in the sequence
 */
export function getNextPhase(currentPhase: string): TaskPhase | null {
  const index = PHASE_ORDER.indexOf(currentPhase as TaskPhase);
  return index >= 0 && index < PHASE_ORDER.length - 1 ? PHASE_ORDER[index + 1] : null;
}

// ─────────────────────────────────────────────────────────────────
// Task Templates (Extracted from wizard-config.ts)
// ─────────────────────────────────────────────────────────────────

// NOTE: These templates should ideally be imported from a shared location
// For now, we duplicate the critical templates needed for phase transitions

const META_ADS_TASK_TEMPLATES: TaskTemplate[] = [
  // AUDIT PHASE
  {
    title: '🔍 Audit Compte Meta Business Manager',
    description: 'Vérifier la structure du Business Manager, les permissions, et la facturation.',
    assignee: 'marcus',
    phase: 'Audit',
    context_questions: [
      'Avez-vous déjà un compte Meta Business Manager ?',
      'Les permissions admin sont-elles configurées ?',
    ],
    estimated_hours: 1,
    order: 1,
  },
  {
    title: '🎯 Analyse Audience & Positionnement',
    description: 'Définir l\'Avatar Client (ICP), persona, démographie, psychographie.',
    assignee: 'luna',
    phase: 'Audit',
    context_questions: [
      'Qui est votre client idéal ?',
      'Quels sont les pain points principaux ?',
    ],
    estimated_hours: 3,
    order: 2,
  },

  // SETUP PHASE
  {
    title: '⚙️ Setup Tracking (Pixel Meta)',
    description: 'Installer et vérifier le Meta Pixel + CAPI si applicable.',
    assignee: 'sora',
    phase: 'Setup',
    context_questions: [
      'Le Meta Pixel est-il installé ?',
      'Avez-vous accès au code du site ?',
    ],
    estimated_hours: 2,
    order: 10,
  },
  {
    title: '🎨 Créer Visuels Publicitaires',
    description: 'Générer 3-5 créatifs (images/vidéos) optimisés pour Meta Ads.',
    assignee: 'milo',
    phase: 'Setup',
    context_questions: [
      'Quel est le message principal ?',
      'Quelles sont vos couleurs de marque ?',
    ],
    estimated_hours: 4,
    order: 11,
  },

  // PRODUCTION PHASE
  {
    title: '🚀 Lancer Campagne Meta Ads',
    description: 'Créer campaign, ad sets, et ads sur Meta Ads Manager.',
    assignee: 'marcus',
    phase: 'Production',
    context_questions: [
      'Quel est votre budget quotidien ?',
      'Quelle est la durée de la campagne ?',
    ],
    estimated_hours: 3,
    order: 20,
  },

  // OPTIMIZATION PHASE
  {
    title: '📈 Optimiser & Scaler',
    description: 'Analyser ROAS, scaler les winners, couper les losers.',
    assignee: 'marcus',
    phase: 'Optimization',
    context_questions: [
      'Quel est votre ROAS cible ?',
      'Budget maximal de scaling ?',
    ],
    estimated_hours: 2,
    order: 30,
  },
];

// Simplified templates for other scopes (can be expanded later)
const TASK_TEMPLATES_BY_SCOPE: Record<ProjectScope, TaskTemplate[]> = {
  meta_ads: META_ADS_TASK_TEMPLATES,
  sem: META_ADS_TASK_TEMPLATES, // TODO: Add SEM-specific templates
  seo: META_ADS_TASK_TEMPLATES, // TODO: Add SEO-specific templates
  analytics: META_ADS_TASK_TEMPLATES, // TODO: Add Analytics-specific templates
  full_scale: META_ADS_TASK_TEMPLATES, // TODO: Combine all templates
};

// ─────────────────────────────────────────────────────────────────
// Main Task Generation Function
// ─────────────────────────────────────────────────────────────────

/**
 * Generate all tasks for a specific phase of a project
 *
 * @param phase - The phase to generate tasks for (Setup, Production, Optimization)
 * @param scope - The project scope (meta_ads, seo, etc.)
 * @param projectDeadline - Project deadline in ISO format
 * @param projectId - The project UUID
 * @returns Array of generated tasks ready to be inserted into DB
 */
export function generateTasksForPhase(
  phase: TaskPhase,
  scope: ProjectScope,
  projectDeadline: string,
  projectId: string
): GeneratedTask[] {
  logger.log(`[TaskGen] Generating tasks for phase: ${phase}, scope: ${scope}`);

  // 1. Get task templates for this scope and phase
  const allTemplates = TASK_TEMPLATES_BY_SCOPE[scope] || META_ADS_TASK_TEMPLATES;
  const phaseTemplates = allTemplates.filter((t) => t.phase === phase);

  if (phaseTemplates.length === 0) {
    console.warn(`[TaskGen] No task templates found for phase: ${phase}, scope: ${scope}`);
    return [];
  }

  // 2. Calculate due dates for this phase
  const dueDates = calculatePhaseDueDates(phase, projectDeadline, phaseTemplates.length);

  // 3. Generate tasks with dependencies
  const generatedTasks: GeneratedTask[] = [];
  let previousTaskId: string | null = null;

  phaseTemplates
    .sort((a, b) => a.order - b.order)
    .forEach((template, index) => {
      const taskId = uuidv4();

      const task: GeneratedTask = {
        id: taskId,
        project_id: projectId,
        title: template.title,
        description: template.description,
        assignee: template.assignee,
        phase: template.phase,
        status: index === 0 ? 'todo' : 'blocked', // First task is unblocked
        context_questions: template.context_questions,
        estimated_hours: template.estimated_hours,
        due_date: dueDates[index] || dueDates[dueDates.length - 1],
        depends_on: previousTaskId ? [previousTaskId] : [], // Sequential dependency
        created_at: new Date().toISOString(),
      };

      generatedTasks.push(task);
      previousTaskId = taskId;
    });

  logger.log(`[TaskGen] ✅ Generated ${generatedTasks.length} tasks for phase: ${phase}`);
  return generatedTasks;
}

// ─────────────────────────────────────────────────────────────────
// Due Date Calculation
// ─────────────────────────────────────────────────────────────────

/**
 * Calculate due dates for tasks in a phase based on project deadline and phase distribution
 *
 * @param phase - The phase (Audit, Setup, Production, Optimization)
 * @param projectDeadline - Project deadline in ISO format (YYYY-MM-DD)
 * @param taskCount - Number of tasks in this phase
 * @returns Array of ISO date strings (YYYY-MM-DD)
 */
function calculatePhaseDueDates(
  phase: TaskPhase,
  projectDeadline: string,
  taskCount: number
): string[] {
  const deadlineDate = new Date(projectDeadline);
  const today = new Date();

  // Calculate total days remaining
  const totalDays = Math.max(
    7, // Minimum 7 days
    Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  );

  // Calculate start and end offsets for this phase
  const phaseOffset = {
    Audit: 0,
    Setup: PHASE_DISTRIBUTION.Audit,
    Production: PHASE_DISTRIBUTION.Audit + PHASE_DISTRIBUTION.Setup,
    Optimization: PHASE_DISTRIBUTION.Audit + PHASE_DISTRIBUTION.Setup + PHASE_DISTRIBUTION.Production,
  };

  const phaseStart = phaseOffset[phase];
  const phaseDuration = PHASE_DISTRIBUTION[phase];

  // Generate due dates evenly distributed within the phase
  const dueDates: string[] = [];

  for (let i = 0; i < taskCount; i++) {
    const taskProgress = taskCount > 1 ? i / (taskCount - 1) : 0.5; // Center if only 1 task
    const taskOffset = phaseStart + taskProgress * phaseDuration;

    const dueDate = new Date(today.getTime() + totalDays * taskOffset * 24 * 60 * 60 * 1000);

    // Ensure due date doesn't exceed project deadline
    if (dueDate > deadlineDate) {
      dueDate.setTime(deadlineDate.getTime());
    }

    dueDates.push(dueDate.toISOString().split('T')[0]); // YYYY-MM-DD
  }

  return dueDates;
}

// ─────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────

export { PHASE_ORDER, PHASE_DISTRIBUTION };
export type { TaskPhase, ProjectScope, GeneratedTask };
