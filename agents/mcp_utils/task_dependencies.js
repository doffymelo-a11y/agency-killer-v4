/**
 * TASK DEPENDENCIES ENFORCEMENT - THE HIVE OS V4
 *
 * Vérifie que les tâches dépendantes sont complétées avant d'autoriser
 * l'exécution d'une tâche.
 *
 * Architecture: Dependency Graph
 * - Empêche exécution hors séquence (Marcus avant Milo)
 * - Vérifie existence des livrables
 * - Injecte outputs des dépendances dans contexte agent
 *
 * @module task_dependencies
 * @version 1.0.0
 * @date 2026-02-19
 */

// ═══════════════════════════════════════════════════════════════════════════
// CORE VALIDATION FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Vérifie que toutes les dépendances d'une tâche sont complétées
 *
 * @param {string} taskId - Task UUID
 * @param {Object} supabase - Supabase client
 * @returns {Promise<Object>} Dependency check result
 *
 * @example
 * const check = await checkTaskDependencies(taskId, supabase);
 * if (!check.ready) {
 *   console.error('Blocked by:', check.blocking_tasks);
 * } else {
 *   console.log('Deliverables:', check.dependencies_output);
 * }
 */
export async function checkTaskDependencies(taskId, supabase) {
  try {
    // ─────────────────────────────────────────────────────────────────────
    // 1. Charger la tâche
    // ─────────────────────────────────────────────────────────────────────
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, title, depends_on, status, project_id')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      return {
        ready: false,
        error: 'Tâche introuvable',
        details: taskError?.message
      };
    }

    // ─────────────────────────────────────────────────────────────────────
    // 2. Si pas de dépendances → OK
    // ─────────────────────────────────────────────────────────────────────
    if (!task.depends_on || task.depends_on.length === 0) {
      return {
        ready: true,
        message: 'Aucune dépendance - tâche peut démarrer'
      };
    }

    // ─────────────────────────────────────────────────────────────────────
    // 3. Charger toutes les tâches dépendantes
    // ─────────────────────────────────────────────────────────────────────
    const { data: dependencies, error: depsError } = await supabase
      .from('tasks')
      .select('id, title, status, deliverable_url, deliverable_type, completed_at, assignee')
      .in('id', task.depends_on);

    if (depsError) {
      return {
        ready: false,
        error: 'Erreur lors du chargement des dépendances',
        details: depsError.message
      };
    }

    if (!dependencies || dependencies.length === 0) {
      return {
        ready: false,
        error: 'Tâches dépendantes introuvables',
        missing_ids: task.depends_on
      };
    }

    // ─────────────────────────────────────────────────────────────────────
    // 4. Vérifier que toutes sont "done"
    // ─────────────────────────────────────────────────────────────────────
    const incomplete = dependencies.filter(d => d.status !== 'done');

    if (incomplete.length > 0) {
      return {
        ready: false,
        blocking_tasks: incomplete.map(t => ({
          id: t.id,
          title: t.title,
          status: t.status,
          assignee: t.assignee,
          url: `/board/${task.project_id}?task=${t.id}`,
          status_display: getStatusDisplay(t.status)
        })),
        error: `Cette tâche nécessite la complétion de ${incomplete.length} tâche(s) préalable(s)`,
        resolution: `Complétez d'abord: ${incomplete.map(t => t.title).join(', ')}`,
        severity: 'blocking',
        validation_type: 'incomplete_dependencies'
      };
    }

    // ─────────────────────────────────────────────────────────────────────
    // 5. Vérifier que les livrables existent (pour tâches qui en nécessitent)
    // ─────────────────────────────────────────────────────────────────────
    const missingDeliverables = dependencies.filter(d => {
      // Certaines tâches n'ont pas forcément de livrable (ex: validation)
      // On vérifie seulement si le deliverable_type est défini
      return d.deliverable_type && !d.deliverable_url;
    });

    if (missingDeliverables.length > 0) {
      return {
        ready: false,
        error: "Certaines tâches dépendantes n'ont pas de livrable",
        missing_deliverables: missingDeliverables.map(t => ({
          id: t.id,
          title: t.title,
          expected_type: t.deliverable_type
        })),
        resolution: "Assurez-vous que les tâches précédentes ont bien généré et enregistré leurs livrables",
        severity: 'blocking',
        validation_type: 'missing_deliverables'
      };
    }

    // ─────────────────────────────────────────────────────────────────────
    // ✅ Toutes dépendances OK → Préparer les outputs
    // ─────────────────────────────────────────────────────────────────────
    const dependencies_output = dependencies.map(d => ({
      task_id: d.id,
      task_title: d.title,
      deliverable_url: d.deliverable_url,
      deliverable_type: d.deliverable_type,
      completed_at: d.completed_at,
      assignee: d.assignee,
      how_to_use: generateUsageHint(d.deliverable_type, d.deliverable_url)
    }));

    return {
      ready: true,
      dependencies_output: dependencies_output,
      dependencies_count: dependencies.length,
      message: `${dependencies.length} dépendance(s) complétée(s) - tâche peut démarrer`
    };

  } catch (error) {
    return {
      ready: false,
      error: 'Erreur lors de la vérification des dépendances',
      details: error.message
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Génère un hint d'utilisation pour un livrable
 */
function generateUsageHint(deliverableType, deliverableUrl) {
  if (!deliverableUrl) return null;

  const hints = {
    'image': `Utilisez cette image générée: ${deliverableUrl}`,
    'video': `Intégrez cette vidéo dans votre campagne: ${deliverableUrl}`,
    'pdf': `Consultez ce rapport PDF: ${deliverableUrl}`,
    'document': `Référez-vous à ce document: ${deliverableUrl}`,
    'data': `Analysez ces données: ${deliverableUrl}`,
    'url': `Visitez cette ressource: ${deliverableUrl}`,
    'strategy': `Appliquez cette stratégie validée: ${deliverableUrl}`
  };

  return hints[deliverableType] || `Livrable disponible: ${deliverableUrl}`;
}

/**
 * Convertit status technique en affichage UI
 */
function getStatusDisplay(status) {
  const statusMap = {
    'todo': { label: 'À faire', color: 'gray', icon: 'circle' },
    'in_progress': { label: 'En cours', color: 'blue', icon: 'loader' },
    'done': { label: 'Terminé', color: 'green', icon: 'check-circle' },
    'blocked': { label: 'Bloqué', color: 'red', icon: 'alert-circle' },
    'cancelled': { label: 'Annulé', color: 'gray', icon: 'x-circle' }
  };

  return statusMap[status] || { label: status, color: 'gray', icon: 'circle' };
}

/**
 * Construit le contexte enrichi avec les livrables des dépendances
 */
export function buildDependenciesContext(dependenciesOutput) {
  if (!dependenciesOutput || dependenciesOutput.length === 0) {
    return '';
  }

  let context = '\n\n## 📦 LIVRABLES DES TÂCHES PRÉCÉDENTES\n\n';
  context += 'Voici les livrables des tâches dont vous dépendez. Utilisez-les pour compléter votre tâche:\n\n';

  for (const dep of dependenciesOutput) {
    context += `### ${dep.task_title}\n`;
    context += `- **Agent responsable:** ${dep.assignee || 'Non assigné'}\n`;
    context += `- **Complété le:** ${new Date(dep.completed_at).toLocaleDateString('fr-FR')}\n`;

    if (dep.deliverable_url) {
      context += `- **Livrable:** ${dep.deliverable_url}\n`;

      if (dep.how_to_use) {
        context += `- **Usage:** ${dep.how_to_use}\n`;
      }
    }

    context += '\n';
  }

  return context;
}

/**
 * Vérifie si une tâche a des dépendances circulaires
 * (pour éviter deadlocks)
 */
export async function detectCircularDependencies(taskId, supabase) {
  const visited = new Set();
  const recursionStack = new Set();

  async function hasCycle(currentTaskId) {
    visited.add(currentTaskId);
    recursionStack.add(currentTaskId);

    // Charger dépendances
    const { data: task } = await supabase
      .from('tasks')
      .select('depends_on')
      .eq('id', currentTaskId)
      .single();

    if (task?.depends_on) {
      for (const depId of task.depends_on) {
        if (!visited.has(depId)) {
          if (await hasCycle(depId)) {
            return true;
          }
        } else if (recursionStack.has(depId)) {
          // Cycle détecté!
          return true;
        }
      }
    }

    recursionStack.delete(currentTaskId);
    return false;
  }

  try {
    const hasCircular = await hasCycle(taskId);
    return {
      has_circular: hasCircular,
      error: hasCircular ? 'Dépendances circulaires détectées' : null
    };
  } catch (error) {
    return {
      has_circular: false,
      error: error.message
    };
  }
}

/**
 * Calcule le chemin critique d'un ensemble de tâches
 * (utile pour estimation de durée totale)
 */
export async function calculateCriticalPath(projectId, supabase) {
  // Cette fonction sera utile pour Phase 2 (Orchestration)
  // Pour l'instant, on la laisse comme placeholder

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, depends_on, estimated_hours, status')
    .eq('project_id', projectId);

  if (!tasks) {
    return { critical_path: [], total_hours: 0 };
  }

  // TODO: Implémenter algorithme de chemin critique (CPM)
  // Pour l'instant, retour basique

  return {
    critical_path: tasks.filter(t => t.status !== 'done'),
    total_hours: tasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0)
  };
}
