/**
 * Write-Back Processor - Executes write-back commands
 * Handles database writes requested by agents (task updates, deliverables, etc.)
 */

import { supabaseAdmin } from '../services/supabase.service.js';
import type { WriteBackCommand } from '../types/api.types.js';

/**
 * Execute a batch of write-back commands
 * Returns number of successful executions
 */
export async function executeWriteBackCommands(
  commands: WriteBackCommand[],
  projectId: string
): Promise<number> {
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
  const { file } = command;

  if (!file) {
    console.warn('[Write-Back] Missing file data');
    return false;
  }

  const { error } = await supabaseAdmin.from('files').insert({
    project_id: projectId,
    name: file.name,
    url: file.url,
    type: file.type,
    size: file.size,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error('[Write-Back] Error adding file:', error);
    return false;
  }

  console.log(`[Write-Back] Added file: ${file.name}`);
  return true;
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
