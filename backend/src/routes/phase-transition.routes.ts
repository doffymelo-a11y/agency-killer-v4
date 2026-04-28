// ═══════════════════════════════════════════════════════════════
// THE HIVE OS V5 - Phase Transition Routes
// Phase 2.11 - Auto Phase Transition
// ═══════════════════════════════════════════════════════════════

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { supabaseAdmin } from '../services/supabase.service.js';
import { generateTasksForPhase } from '../services/task-generation.service.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────
// POST /api/phase-transition/accept
// Accept a phase transition proposal and create tasks for next phase
// ─────────────────────────────────────────────────────────────────

router.post('/accept', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const { project_id } = req.body;
  const userId = (req as any).user?.id;

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized - No user ID found' });
    return;
  }

  if (!project_id) {
    res.status(400).json({ error: 'Missing project_id' });
    return;
  }

  console.log(`[PhaseTransition] Accepting transition for project: ${project_id}`);

    // 1. Get project with pending transition
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .single();

    if (projectError || !project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const transition = project.state_flags?.pending_phase_transition;

    if (!transition) {
      res.status(400).json({ error: 'No pending phase transition' });
      return;
    }

    const { nextPhase } = transition;

    console.log(`[PhaseTransition] Transitioning from ${transition.currentPhase} to ${nextPhase}`);

    // 2. Generate tasks for the next phase
    const newTasks = generateTasksForPhase(
      nextPhase,
      project.scope,
      project.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Default 30 days
      project_id
    );

    if (newTasks.length === 0) {
      console.warn(`[PhaseTransition] No tasks generated for phase: ${nextPhase}`);
      res.status(500).json({ error: `No tasks available for phase: ${nextPhase}` });
      return;
    }

    // 3. Insert tasks into database
    const { error: tasksError } = await supabaseAdmin
      .from('tasks')
      .insert(newTasks);

    if (tasksError) {
      console.error('[PhaseTransition] Error inserting tasks:', tasksError);
      res.status(500).json({ error: 'Failed to create tasks' });
      return;
    }

    console.log(`[PhaseTransition] ✅ Created ${newTasks.length} tasks for phase: ${nextPhase}`);

    // 4. Update project: change current_phase + clear pending_transition
    const updatedStateFlags = { ...project.state_flags };
    delete updatedStateFlags.pending_phase_transition;

    const { error: updateError } = await supabaseAdmin
      .from('projects')
      .update({
        current_phase: nextPhase,
        state_flags: updatedStateFlags,
        updated_at: new Date().toISOString(),
      })
      .eq('id', project_id);

    if (updateError) {
      console.error('[PhaseTransition] Error updating project phase:', updateError);
      res.status(500).json({ error: 'Failed to update project phase' });
      return;
    }

    console.log(`[PhaseTransition] ✅ Project updated to phase: ${nextPhase}`);

    res.json({
      success: true,
      phase: nextPhase,
      tasksCreated: newTasks.length,
    });
}));

// ─────────────────────────────────────────────────────────────────
// POST /api/phase-transition/dismiss
// Dismiss a phase transition proposal without transitioning
// ─────────────────────────────────────────────────────────────────

router.post('/dismiss', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const { project_id } = req.body;
  const userId = (req as any).user?.id;

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized - No user ID found' });
    return;
  }

  if (!project_id) {
    res.status(400).json({ error: 'Missing project_id' });
    return;
  }

  console.log(`[PhaseTransition] Dismissing transition for project: ${project_id}`);

    // Get current project
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('state_flags')
      .eq('id', project_id)
      .single();

    if (projectError || !project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    // Clear pending_phase_transition from state_flags
    const updatedStateFlags = { ...project.state_flags };
    delete updatedStateFlags.pending_phase_transition;

    const { error: updateError } = await supabaseAdmin
      .from('projects')
      .update({
        state_flags: updatedStateFlags,
        updated_at: new Date().toISOString(),
      })
      .eq('id', project_id);

    if (updateError) {
      console.error('[PhaseTransition] Error dismissing transition:', updateError);
      res.status(500).json({ error: 'Failed to dismiss transition' });
      return;
    }

    console.log(`[PhaseTransition] ✅ Transition dismissed for project: ${project_id}`);

    res.json({ success: true });
}));

export default router;
