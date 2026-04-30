/**
 * Write-Back Processor - Executes write-back commands
 * Handles database writes requested by agents (task updates, deliverables, etc.)
 * Phase 2.11: Auto Phase Transition detection and proposal
 */

import { supabaseAdmin } from '../services/supabase.service.js';
import { getNextPhase } from '../services/task-generation.service.js';
import { simpleChat } from '../services/claude.service.js';
import type { WriteBackCommand } from '../types/api.types.js';

// SECURITY: Whitelist of allowed write-back command types
const ALLOWED_COMMAND_TYPES = [
  'UPDATE_TASK_STATUS',
  'SET_DELIVERABLE',
  'ADD_FILE',
  'UPDATE_PROJECT_PHASE',
  'NOTIFY_USER',
] as const;

/**
 * Execute a batch of write-back commands
 * Returns number of successful executions
 */
export async function executeWriteBackCommands(
  commands: WriteBackCommand[],
  projectId: string,
  userId?: string
): Promise<number> {
  // SECURITY: Limit to 50 commands per request (prevent DoS)
  const MAX_COMMANDS = 50;
  if (commands.length > MAX_COMMANDS) {
    throw new Error(`Too many write-back commands (max ${MAX_COMMANDS}, got ${commands.length})`);
  }

  // SECURITY: Validate all commands are whitelisted types
  for (const command of commands) {
    if (!ALLOWED_COMMAND_TYPES.includes(command.type as any)) {
      throw new Error(`Invalid write-back command type: ${command.type}`);
    }
  }

  // SECURITY: Verify project ownership BEFORE executing any commands
  if (userId && projectId) {
    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (error || !project) {
      console.warn(`[Write-Back] SECURITY: User ${userId} attempted to execute write-back commands on project ${projectId} without ownership`);
      throw new Error('Unauthorized: You do not have access to this project');
    }
  }

  let successCount = 0;

  for (const command of commands) {
    try {
      const success = await executeCommand(command, projectId);
      if (success) {
        successCount++;
      }
    } catch (error: any) {
      console.error('[Write-Back] Error executing command:', command.type, error);
    }
  }

  console.log(`[Write-Back] Executed ${successCount}/${commands.length} commands`);
  return successCount;
}

/**
 * Execute a single write-back command
 */
async function executeCommand(
  command: WriteBackCommand,
  projectId: string
): Promise<boolean> {
  switch (command.type) {
    case 'UPDATE_TASK_STATUS':
      return updateTaskStatus(command, projectId);

    case 'SET_DELIVERABLE':
      return setDeliverable(command, projectId);

    case 'ADD_FILE':
      return addFile(command, projectId);

    case 'UPDATE_PROJECT_PHASE':
      return updateProjectPhase(command, projectId);

    case 'NOTIFY_USER':
      return notifyUser(command);

    default:
      console.warn(`[Write-Back] Unknown command: ${command.type}`);
      return false;
  }
}

// ─────────────────────────────────────────────────────────────────
// Command Handlers
// ─────────────────────────────────────────────────────────────────

async function updateTaskStatus(command: WriteBackCommand, projectId: string): Promise<boolean> {
  const { task_id, status } = command;

  if (!task_id || !status) {
    console.warn('[Write-Back] Missing task_id or status');
    return false;
  }

  const { error } = await supabaseAdmin
    .from('tasks')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', task_id)
    .eq('project_id', projectId);

  if (error) {
    console.error('[Write-Back] Error updating task status:', error);
    return false;
  }

  console.log(`[Write-Back] Updated task ${task_id} to ${status}`);

  // Phase 2.11: Check if phase is complete when a task is marked "done"
  if (status === 'done') {
    // Get current project phase
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('current_phase')
      .eq('id', projectId)
      .single();

    if (project && project.current_phase) {
      const phaseComplete = await checkPhaseCompletion(projectId, project.current_phase);

      if (phaseComplete) {
        console.log(`[Write-Back] 🎉 Phase "${project.current_phase}" is complete! Proposing transition...`);
        await proposePhaseTransition(projectId, project.current_phase);
      }
    }
  }

  return true;
}

async function setDeliverable(command: WriteBackCommand, projectId: string): Promise<boolean> {
  const { deliverable_url, deliverable_type } = command;

  if (!deliverable_url) {
    console.warn('[Write-Back] Missing deliverable_url');
    return false;
  }

  const { error } = await supabaseAdmin.from('deliverables').insert({
    project_id: projectId,
    url: deliverable_url,
    type: deliverable_type || 'unknown',
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error('[Write-Back] Error creating deliverable:', error);
    return false;
  }

  console.log(`[Write-Back] Created deliverable: ${deliverable_url}`);
  return true;
}

async function addFile(command: WriteBackCommand, projectId: string): Promise<boolean> {
  const { file, task_id, agent_id } = command;

  if (!file || !file.url) {
    console.warn('[Write-Back] Missing file data or URL');
    return false;
  }

  // Map legacy field names to new schema
  const filename = file.filename || file.name || 'untitled';
  const file_type = file.file_type || file.type || 'document';
  const size_bytes = file.size_bytes || file.size || 0;
  const mime_type = file.mime_type || inferMimeType(file_type, file.url);
  const fileAgentId = file.agent_id || agent_id || 'orchestrator';

  // Build tags array
  const tags = file.tags || [fileAgentId, file_type].filter(Boolean);

  // Build metadata object
  const metadata = {
    task_id: task_id || null,
    generated_by: fileAgentId,
    ...(file.metadata || {}),
  };

  const { error } = await supabaseAdmin.from('project_files').insert({
    project_id: projectId,
    task_id: task_id || null,
    agent_id: fileAgentId,
    filename,
    url: file.url,
    file_type,
    mime_type,
    size_bytes,
    tags,
    metadata,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error('[Write-Back] Error adding file to project_files:', error);
    return false;
  }

  console.log(`[Write-Back] ✅ Added file to project_files: ${filename} (${file_type}, ${size_bytes} bytes)`);
  return true;
}

/**
 * Infer MIME type from file_type and URL extension
 */
function inferMimeType(fileType: string, url: string): string {
  // Extract extension from URL
  const extension = url.split('.').pop()?.toLowerCase();

  // Common file type to MIME type mappings
  const mimeTypes: Record<string, string> = {
    // Images
    'image': extension === 'png' ? 'image/png' :
             extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' :
             extension === 'gif' ? 'image/gif' :
             extension === 'webp' ? 'image/webp' :
             'image/png',
    // Videos
    'video': extension === 'mp4' ? 'video/mp4' :
             extension === 'webm' ? 'video/webm' :
             extension === 'mov' ? 'video/quicktime' :
             'video/mp4',
    // Audio
    'audio': extension === 'mp3' ? 'audio/mpeg' :
             extension === 'wav' ? 'audio/wav' :
             extension === 'ogg' ? 'audio/ogg' :
             'audio/mpeg',
    // Documents
    'document': extension === 'pdf' ? 'application/pdf' :
                extension === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
                extension === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
                extension === 'txt' ? 'text/plain' :
                'application/octet-stream',
    // Code
    'code': extension === 'js' ? 'text/javascript' :
            extension === 'ts' ? 'text/typescript' :
            extension === 'py' ? 'text/x-python' :
            extension === 'json' ? 'application/json' :
            'text/plain',
    // Data
    'data': extension === 'json' ? 'application/json' :
            extension === 'csv' ? 'text/csv' :
            extension === 'xml' ? 'application/xml' :
            'application/octet-stream',
  };

  return mimeTypes[fileType] || 'application/octet-stream';
}

async function updateProjectPhase(command: WriteBackCommand, projectId: string): Promise<boolean> {
  const { phase } = command;

  if (!phase) {
    console.warn('[Write-Back] Missing phase');
    return false;
  }

  const { error } = await supabaseAdmin
    .from('projects')
    .update({ current_phase: phase, updated_at: new Date().toISOString() })
    .eq('id', projectId);

  if (error) {
    console.error('[Write-Back] Error updating project phase:', error);
    return false;
  }

  console.log(`[Write-Back] Updated project phase to: ${phase}`);
  return true;
}

async function notifyUser(command: WriteBackCommand): Promise<boolean> {
  const { notification } = command;

  if (!notification) {
    console.warn('[Write-Back] Missing notification message');
    return false;
  }

  // TODO: Implement notification system (email, in-app, etc.)
  console.log(`[Write-Back] Notification: ${notification}`);
  return true;
}

// ─────────────────────────────────────────────────────────────────
// Phase 2.11 - Phase Transition Detection
// ─────────────────────────────────────────────────────────────────

/**
 * Check if all tasks in a phase are completed
 */
async function checkPhaseCompletion(projectId: string, currentPhase: string): Promise<boolean> {
  const { data: tasks, error } = await supabaseAdmin
    .from('tasks')
    .select('id, status')
    .eq('project_id', projectId)
    .eq('phase', currentPhase);

  if (error || !tasks || tasks.length === 0) {
    return false;
  }

  // Check if ALL tasks in this phase are 'done'
  const allDone = tasks.every((task) => task.status === 'done');

  console.log(`[Write-Back] Phase "${currentPhase}": ${tasks.filter(t => t.status === 'done').length}/${tasks.length} tasks done`);

  return allDone;
}

/**
 * Propose a phase transition when a phase is complete
 */
async function proposePhaseTransition(projectId: string, currentPhase: string): Promise<void> {
  const nextPhase = getNextPhase(currentPhase);

  if (!nextPhase) {
    console.log('[Write-Back] Already on last phase (Optimization), no transition to propose');
    return;
  }

  try {
    // 1. Calculate phase statistics
    const stats = await calculatePhaseStatistics(projectId, currentPhase);

    // 2. Generate LLM summary
    const { agentSummary, keyAccomplishments, nextPhasePreview } = await generatePhaseTransitionSummary(
      projectId,
      currentPhase,
      nextPhase,
      stats
    );

    // 3. Get current project to merge state_flags
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('state_flags, scope')
      .eq('id', projectId)
      .single();

    if (!project) {
      console.error('[Write-Back] Project not found');
      return;
    }

    // 4. Save proposal to state_flags
    const updatedStateFlags = {
      ...(project.state_flags || {}),
      pending_phase_transition: {
        currentPhase,
        nextPhase,
        statistics: stats,
        agentSummary,
        keyAccomplishments,
        nextPhasePreview,
        proposedAt: new Date().toISOString(),
      },
    };

    const { error } = await supabaseAdmin
      .from('projects')
      .update({
        state_flags: updatedStateFlags,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId);

    if (error) {
      console.error('[Write-Back] Error saving phase transition proposal:', error);
      return;
    }

    console.log(`[Write-Back] ✅ Phase transition proposal saved: ${currentPhase} → ${nextPhase}`);
  } catch (error) {
    console.error('[Write-Back] Error proposing phase transition:', error);
  }
}

/**
 * Calculate statistics for a completed phase
 */
async function calculatePhaseStatistics(
  projectId: string,
  phase: string
): Promise<{
  tasksCompleted: number;
  totalHours: number;
  deliverables: number;
  phaseDuration: number;
}> {
  // Get tasks for this phase
  const { data: tasks } = await supabaseAdmin
    .from('tasks')
    .select('estimated_hours, completed_at')
    .eq('project_id', projectId)
    .eq('phase', phase)
    .eq('status', 'done');

  const tasksCompleted = tasks?.length || 0;
  const totalHours = tasks?.reduce((sum, t) => sum + (t.estimated_hours || 0), 0) || 0;

  // Get deliverables count (all deliverables for the project, not phase-specific)
  const { count: deliverables } = await supabaseAdmin
    .from('deliverables')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId);

  // Calculate phase duration in days
  let phaseDuration = 0;
  if (tasks && tasks.length > 0) {
    const completedDates = tasks
      .map((t) => t.completed_at ? new Date(t.completed_at).getTime() : null)
      .filter((d): d is number => d !== null);

    if (completedDates.length > 0) {
      const minDate = Math.min(...completedDates);
      const maxDate = Math.max(...completedDates);
      phaseDuration = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));
    }
  }

  return {
    tasksCompleted,
    totalHours,
    deliverables: deliverables || 0,
    phaseDuration,
  };
}

/**
 * Generate LLM summary for phase transition
 */
async function generatePhaseTransitionSummary(
  projectId: string,
  currentPhase: string,
  nextPhase: string,
  stats: { tasksCompleted: number; totalHours: number; deliverables: number; phaseDuration: number }
): Promise<{
  agentSummary: string;
  keyAccomplishments: string[];
  nextPhasePreview: string;
}> {
  // Get project context
  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('name, scope, metadata')
    .eq('id', projectId)
    .single();

  // Get completed tasks for this phase
  const { data: tasks } = await supabaseAdmin
    .from('tasks')
    .select('title, description, deliverable_url')
    .eq('project_id', projectId)
    .eq('phase', currentPhase)
    .eq('status', 'done');

  const prompt = `You are the Orchestrator of THE HIVE OS, a marketing ERP platform.

**Context:**
Project: ${project?.name || 'Unknown'}
Scope: ${project?.scope || 'Unknown'}
Phase completed: ${currentPhase}
Next phase: ${nextPhase}

**Statistics:**
- Tasks completed: ${stats.tasksCompleted}
- Total hours: ${stats.totalHours}
- Deliverables created: ${stats.deliverables}
- Phase duration: ${stats.phaseDuration} days

**Completed tasks:**
${tasks?.map((t) => `- ${t.title}${t.deliverable_url ? ` (deliverable: ${t.deliverable_url})` : ''}`).join('\n')}

**Your mission:**
Generate a celebration summary for the user who just completed the ${currentPhase} phase.

**Output format (JSON):**
{
  "agentSummary": "A warm 2-3 sentence summary celebrating what was accomplished. Be specific, mention 1-2 key deliverables if available. Set expectation for next phase.",
  "keyAccomplishments": ["Accomplishment 1", "Accomplishment 2", "Accomplishment 3"],
  "nextPhasePreview": "A 1-sentence preview of what ${nextPhase} phase will focus on."
}

**Rules:**
- Be celebratory but professional
- Mention specific deliverables if available
- Keep it concise
- Use French
- Return ONLY valid JSON, no markdown`;

  try {
    const response = await simpleChat(
      'You are a helpful assistant that generates celebration summaries.',
      prompt
    );

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        agentSummary: parsed.agentSummary || 'Phase terminée avec succès !',
        keyAccomplishments: parsed.keyAccomplishments || ['Toutes les tâches complétées'],
        nextPhasePreview: parsed.nextPhasePreview || `Prochaine étape : ${nextPhase}`,
      };
    }

    // Fallback
    return {
      agentSummary: `Félicitations ! Vous avez terminé la phase ${currentPhase} avec ${stats.tasksCompleted} tâches complétées.`,
      keyAccomplishments: tasks?.map((t) => t.title).slice(0, 3) || ['Phase complétée'],
      nextPhasePreview: `La phase ${nextPhase} va commencer.`,
    };
  } catch (error) {
    console.error('[Write-Back] Error generating LLM summary:', error);

    // Fallback summary
    return {
      agentSummary: `Félicitations ! Vous avez terminé la phase ${currentPhase} avec ${stats.tasksCompleted} tâches complétées en ${stats.phaseDuration} jours.`,
      keyAccomplishments: tasks?.map((t) => t.title).slice(0, 3) || ['Phase complétée'],
      nextPhasePreview: `La phase ${nextPhase} se concentrera sur les prochaines étapes de votre projet.`,
    };
  }
}
