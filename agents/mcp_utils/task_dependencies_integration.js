/**
 * TASK DEPENDENCIES INTEGRATION - THE HIVE OS V4
 *
 * Integrates SQL task dependencies enforcement with PM workflow
 *
 * @module task_dependencies_integration
 * @version 1.0.0
 * @date 2026-02-19
 */

// ═══════════════════════════════════════════════════════════════════════════
// CHECK IF TASK CAN START (before status change to 'in_progress')
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Vérifie si une tâche peut démarrer (toutes les dépendances sont complètes)
 *
 * ⚠️ CRITIQUE: Appeler AVANT de changer le statut d'une tâche vers 'in_progress'
 *
 * @param {string} taskId - Task UUID
 * @param {Object} supabase - Supabase client (authenticated)
 * @returns {Promise<Object>} { can_start, blocking_tasks?, missing_deliverables?, error? }
 *
 * @example
 * const check = await canStartTask(task.id, supabase);
 * if (!check.can_start) {
 *   return {
 *     error: 'Cannot start task: dependencies not met',
 *     blocking_tasks: check.blocking_tasks,
 *     ui_component: {
 *       type: 'DEPENDENCIES_BLOCKED',
 *       data: {
 *         error: check.error_message,
 *         blocking_tasks: check.blocking_tasks,
 *         resolution: 'Complete the blocking tasks before starting this one.'
 *       }
 *     }
 *   };
 * }
 */
export async function canStartTask(taskId, supabase) {
  try {
    const { data, error } = await supabase.rpc('can_start_task', {
      p_task_id: taskId
    });

    if (error) {
      return {
        can_start: false,
        error: error.message,
        error_code: 'DATABASE_ERROR'
      };
    }

    // Data is an array with single row
    const result = Array.isArray(data) ? data[0] : data;

    if (!result.ready) {
      return {
        can_start: false,
        error_message: result.error_message,
        blocking_count: result.blocking_count,
        missing_deliverables_count: result.missing_deliverables_count
      };
    }

    return {
      can_start: true
    };

  } catch (error) {
    return {
      can_start: false,
      error: error.message,
      error_code: 'UNEXPECTED_ERROR'
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// GET BLOCKING TASKS (for UI display)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Récupère la liste des tâches bloquantes pour une tâche donnée
 *
 * @param {string} taskId - Task UUID
 * @param {Object} supabase - Supabase client (authenticated)
 * @returns {Promise<Object>} { blocking_tasks: Array, count }
 *
 * @example
 * const blocking = await getBlockingTasks(task.id, supabase);
 * console.log(`${blocking.count} blocking tasks:`, blocking.blocking_tasks);
 */
export async function getBlockingTasks(taskId, supabase) {
  try {
    const { data, error } = await supabase.rpc('get_blocking_tasks', {
      p_task_id: taskId
    });

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      blocking_tasks: data || [],
      count: (data || []).length
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// WORKFLOW INTEGRATION: Update Task Status with Dependency Check
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Met à jour le statut d'une tâche avec vérification des dépendances
 *
 * Cette fonction wrapper vérifie les dépendances avant de permettre le changement de statut
 *
 * @param {Object} params - Parameters
 * @param {string} params.taskId - Task UUID
 * @param {string} params.currentStatus - Current task status
 * @param {string} params.newStatus - New task status
 * @param {Object} params.supabase - Supabase client (authenticated)
 * @returns {Promise<Object>} { success, task?, error?, blocking_tasks? }
 *
 * @example
 * const result = await updateTaskStatusWithDependencyCheck({
 *   taskId: task.id,
 *   currentStatus: 'planned',
 *   newStatus: 'in_progress',
 *   supabase
 * });
 *
 * if (!result.success) {
 *   if (result.dependencies_not_met) {
 *     // Show UI component with blocking tasks
 *     return {
 *       ui_component: {
 *         type: 'DEPENDENCIES_BLOCKED',
 *         data: {
 *           error: result.error,
 *           blocking_tasks: result.blocking_tasks
 *         }
 *       }
 *     };
 *   }
 *   return { error: result.error };
 * }
 */
export async function updateTaskStatusWithDependencyCheck({
  taskId,
  currentStatus,
  newStatus,
  supabase
}) {
  // ─────────────────────────────────────────────────────────────────────────
  // 1. Check if transitioning to 'in_progress' or 'in-progress'
  // ─────────────────────────────────────────────────────────────────────────
  const isStartingTask = newStatus === 'in_progress' || newStatus === 'in-progress';

  if (isStartingTask) {
    // ─────────────────────────────────────────────────────────────────────────
    // 2. Check dependencies BEFORE allowing status change
    // ─────────────────────────────────────────────────────────────────────────
    const canStart = await canStartTask(taskId, supabase);

    if (!canStart.can_start) {
      // Get detailed blocking tasks for UI
      const blockingInfo = await getBlockingTasks(taskId, supabase);

      return {
        success: false,
        dependencies_not_met: true,
        error: canStart.error_message || 'Dependencies not met',
        blocking_count: canStart.blocking_count,
        missing_deliverables_count: canStart.missing_deliverables_count,
        blocking_tasks: blockingInfo.blocking_tasks || []
      };
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Dependencies OK → Update status in database
  // ─────────────────────────────────────────────────────────────────────────
  try {
    const { data, error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      task: data
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// WORKFLOW INTEGRATION: Create Tasks with Dependencies
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Crée plusieurs tâches avec leurs dépendances à partir des templates PM
 *
 * @param {Object} params - Parameters
 * @param {string} params.projectId - Project UUID
 * @param {Array} params.taskTemplates - Task templates from PM config
 * @param {Object} params.supabase - Supabase client (authenticated)
 * @returns {Promise<Object>} { success, tasks?, error? }
 *
 * @example
 * const result = await createTasksWithDependencies({
 *   projectId: project.id,
 *   taskTemplates: TASK_TEMPLATES['meta_ads'],
 *   supabase
 * });
 */
export async function createTasksWithDependencies({
  projectId,
  taskTemplates,
  supabase
}) {
  try {
    // ─────────────────────────────────────────────────────────────────────────
    // 1. Insert all tasks first (without dependencies)
    // ─────────────────────────────────────────────────────────────────────────
    const tasksToInsert = taskTemplates.map(template => ({
      project_id: projectId,
      title: template.title,
      description: template.description || '',
      assignee: template.assignee,
      phase: template.phase,
      status: 'planned',
      estimated_hours: template.estimated_hours,
      due_date: template.due_date || null,
      triggers_flag: template.triggers_flag || null,
      context_questions: template.context_questions || []
    }));

    const { data: insertedTasks, error: insertError } = await supabase
      .from('tasks')
      .insert(tasksToInsert)
      .select();

    if (insertError) {
      return {
        success: false,
        error: insertError.message
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. Update dependencies (map title → UUID)
    // ─────────────────────────────────────────────────────────────────────────
    const taskIdByTitle = insertedTasks.reduce((acc, task) => {
      acc[task.title] = task.id;
      return acc;
    }, {});

    for (let i = 0; i < taskTemplates.length; i++) {
      const template = taskTemplates[i];
      const task = insertedTasks[i];

      if (template.depends_on && template.depends_on.length > 0) {
        // Convert dependency titles to UUIDs
        const dependencyIds = template.depends_on
          .map(depTitle => taskIdByTitle[depTitle])
          .filter(id => id); // Filter out undefined (missing dependencies)

        if (dependencyIds.length > 0) {
          const { error: updateError } = await supabase
            .from('tasks')
            .update({ depends_on: dependencyIds })
            .eq('id', task.id);

          if (updateError) {
            console.error(`Failed to update dependencies for task ${task.title}:`, updateError);
          }
        }
      }
    }

    return {
      success: true,
      tasks: insertedTasks
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Check Multiple Tasks Dependencies
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Vérifie les dépendances pour plusieurs tâches en parallèle
 *
 * @param {Array<string>} taskIds - Array of task UUIDs
 * @param {Object} supabase - Supabase client (authenticated)
 * @returns {Promise<Object>} { results: Array<{ task_id, can_start, error? }> }
 */
export async function checkMultipleTasksDependencies(taskIds, supabase) {
  try {
    const checks = await Promise.all(
      taskIds.map(async (taskId) => {
        const result = await canStartTask(taskId, supabase);
        return {
          task_id: taskId,
          ...result
        };
      })
    );

    return {
      success: true,
      results: checks
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
