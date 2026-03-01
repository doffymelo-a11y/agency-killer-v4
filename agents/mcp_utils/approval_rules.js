/**
 * APPROVAL RULES - THE HIVE OS V4
 *
 * Human-in-the-loop approval rules for critical agent actions
 *
 * Architecture: Risk-based Gating
 * - HIGH RISK actions require user approval BEFORE execution
 * - Approval requests expire after 24h
 * - Automatic cost estimation for financial decisions
 *
 * @module approval_rules
 * @version 1.0.0
 * @date 2026-02-19
 */

// ═══════════════════════════════════════════════════════════════════════════
// APPROVAL RULES - Par Agent
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Règles d'approbation par action
 *
 * Structure:
 * - requires_approval: boolean - Si true, demande approbation AVANT exécution
 * - threshold_condition: Function - Condition pour déclencher l'approbation
 * - risk_level: string - low, medium, high, critical
 * - approval_template: Function - Génère title/description pour UI
 */
export const APPROVAL_RULES = {
  // ─────────────────────────────────────────────────────────────────────────
  // MARCUS (Trader) - Actions Financières Critiques
  // ─────────────────────────────────────────────────────────────────────────

  launch_campaign: {
    requires_approval: true,
    threshold_condition: (params) => {
      // Demander approbation si budget quotidien > €500
      return params.daily_budget_eur > 500;
    },
    risk_level: 'high',
    approval_template: (params) => ({
      title: `Lancement campagne ${params.platform || 'Meta'} - €${params.daily_budget_eur}/jour`,
      description: `**Plateforme:** ${params.platform || 'Meta Ads'}
**Budget quotidien:** €${params.daily_budget_eur}
**Estimation 7 jours:** €${params.daily_budget_eur * 7}

**Configuration:**
- Objectif: ${params.objective || 'Conversions'}
- Audience: ${params.audience_size || 'Non définie'}
- Stratégie d'enchère: ${params.bid_strategy || 'Lowest Cost'}

⚠️ Cette campagne démarrera immédiatement après approbation.`,
      estimated_cost_7_days: params.daily_budget_eur * 7
    })
  },

  scale_campaign: {
    requires_approval: true,
    threshold_condition: (params) => {
      // Demander approbation si augmentation > 50% du budget actuel
      const increase_percent = ((params.new_budget - params.current_budget) / params.current_budget) * 100;
      return increase_percent > 50;
    },
    risk_level: 'medium',
    approval_template: (params) => {
      const increase_percent = Math.round(((params.new_budget - params.current_budget) / params.current_budget) * 100);
      return {
        title: `Scaling campagne - Budget +${increase_percent}%`,
        description: `**Campagne:** ${params.campaign_name}
**Budget actuel:** €${params.current_budget}/jour
**Nouveau budget:** €${params.new_budget}/jour
**Augmentation:** +${increase_percent}% (+€${params.new_budget - params.current_budget}/jour)

**Estimation 7 jours:**
- Avant: €${params.current_budget * 7}
- Après: €${params.new_budget * 7}
- Delta: +€${(params.new_budget - params.current_budget) * 7}

**Justification:** ${params.reason || 'Performance positive'}`,
        estimated_cost_7_days: params.new_budget * 7
      };
    }
  },

  update_budget: {
    requires_approval: true,
    threshold_condition: (params) => {
      // Demander approbation si nouveau budget > €1000/jour
      return params.new_budget_eur > 1000;
    },
    risk_level: 'medium',
    approval_template: (params) => ({
      title: `Modification budget campagne - €${params.new_budget_eur}/jour`,
      description: `**Campagne:** ${params.campaign_name}
**Budget actuel:** €${params.current_budget_eur}/jour
**Nouveau budget:** €${params.new_budget_eur}/jour

**Estimation 7 jours:** €${params.new_budget_eur * 7}`,
      estimated_cost_7_days: params.new_budget_eur * 7
    })
  },

  // ─────────────────────────────────────────────────────────────────────────
  // MILO (Creative) - Générations Coûteuses
  // ─────────────────────────────────────────────────────────────────────────

  generate_video_batch: {
    requires_approval: true,
    threshold_condition: (params) => {
      // Demander approbation si > 5 vidéos (coût élevé)
      return params.video_count > 5;
    },
    risk_level: 'medium',
    approval_template: (params) => ({
      title: `Génération de ${params.video_count} vidéos`,
      description: `**Nombre de vidéos:** ${params.video_count}
**Durée moyenne:** ${params.duration_seconds || 5}s
**Coût estimé:** ~€${(params.video_count * 0.12).toFixed(2)} (VEO-2)

**Prompts:**
${params.prompts.slice(0, 3).map((p, i) => `${i + 1}. ${p}`).join('\n')}
${params.video_count > 3 ? `... et ${params.video_count - 3} autres` : ''}

⚠️ Les vidéos générées seront stockées sur Cloudinary.`,
      estimated_cost_7_days: null // One-time cost
    })
  },

  // ─────────────────────────────────────────────────────────────────────────
  // LUNA (Strategist) - Audits Externes Payants
  // ─────────────────────────────────────────────────────────────────────────

  competitive_intelligence_paid: {
    requires_approval: true,
    threshold_condition: (params) => {
      // Demander approbation si utilise API payante (SEMrush, Ahrefs)
      return params.use_paid_tools === true;
    },
    risk_level: 'low',
    approval_template: (params) => ({
      title: `Audit concurrentiel avec outils payants`,
      description: `**Concurrents à analyser:** ${params.competitors.join(', ')}
**Outils utilisés:** ${params.tools.join(', ')}

**Coût estimé:** ~€${params.estimated_cost_usd}

**Données collectées:**
- Trafic organique & payant
- Mots-clés positionnés
- Backlinks
- Stratégie contenu`,
      estimated_cost_7_days: null
    })
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SORA (Analyst) - Exports de Données Volumétriques
  // ─────────────────────────────────────────────────────────────────────────

  export_analytics_data: {
    requires_approval: true,
    threshold_condition: (params) => {
      // Demander approbation si export > 1 an de données
      const days_range = params.days_range || 0;
      return days_range > 365;
    },
    risk_level: 'low',
    approval_template: (params) => ({
      title: `Export données analytics - ${params.days_range} jours`,
      description: `**Période:** ${params.start_date} → ${params.end_date} (${params.days_range} jours)
**Sources:** ${params.data_sources.join(', ')}
**Format:** ${params.format || 'CSV'}

**Volume estimé:** ~${Math.round(params.days_range / 30)} mois de données

⚠️ L'export peut prendre plusieurs minutes selon le volume.`,
      estimated_cost_7_days: null
    })
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN FUNCTION: Check if Approval Required
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Vérifie si une action nécessite une approbation utilisateur
 *
 * @param {string} agentId - Agent ID (marcus, milo, luna, sora)
 * @param {string} action - Action name
 * @param {Object} params - Action parameters
 * @returns {Object} { requires_approval, rule?, approval_data? }
 *
 * @example
 * const check = checkApprovalRequired('marcus', 'launch_campaign', {
 *   daily_budget_eur: 1500,
 *   platform: 'Meta',
 *   objective: 'Conversions'
 * });
 *
 * if (check.requires_approval) {
 *   // Create approval request
 *   const approvalId = await createApprovalRequest({
 *     agentId: 'marcus',
 *     action: 'launch_campaign',
 *     title: check.approval_data.title,
 *     description: check.approval_data.description,
 *     ...
 *   });
 *   return { approval_required: true, approval_id: approvalId };
 * }
 */
export function checkApprovalRequired(agentId, action, params) {
  // Get rule for this action
  const rule = APPROVAL_RULES[action];

  // If no rule defined, no approval required
  if (!rule) {
    return {
      requires_approval: false,
      rule: null
    };
  }

  // Check if rule requires approval
  if (!rule.requires_approval) {
    return {
      requires_approval: false,
      rule: rule
    };
  }

  // Check threshold condition
  const meetsThreshold = rule.threshold_condition(params);

  if (!meetsThreshold) {
    return {
      requires_approval: false,
      rule: rule,
      threshold_not_met: true
    };
  }

  // Generate approval template data
  const approval_data = rule.approval_template(params);

  return {
    requires_approval: true,
    rule: rule,
    risk_level: rule.risk_level,
    approval_data: approval_data
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CREATE APPROVAL REQUEST
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Crée une demande d'approbation dans Supabase
 *
 * ⚠️ SECURITY: Uses authenticated user from JWT token (auth.uid())
 *
 * @param {Object} params - Parameters
 * @param {string} params.projectId - Project UUID
 * @param {string} params.taskId - Task UUID
 * @param {string} params.agentId - Agent ID
 * @param {string} params.action - Action name
 * @param {string} params.title - Approval title
 * @param {string} params.description - Approval description
 * @param {string} params.riskLevel - low, medium, high, critical
 * @param {number} params.estimatedCost7Days - Estimated cost for 7 days (EUR)
 * @param {Object} params.actionParams - Full action parameters to execute after approval
 * @param {Object} params.supabase - Supabase client (authenticated)
 * @returns {Promise<Object>} { success, approval_id?, error? }
 *
 * @example
 * const result = await createApprovalRequest({
 *   projectId: project.id,
 *   taskId: task.id,
 *   agentId: 'marcus',
 *   action: 'launch_campaign',
 *   title: 'Lancement campagne Meta - €1500/jour',
 *   description: '...',
 *   riskLevel: 'high',
 *   estimatedCost7Days: 10500,
 *   actionParams: { daily_budget_eur: 1500, ... },
 *   supabase
 * });
 */
export async function createApprovalRequest({
  projectId,
  taskId,
  agentId,
  action,
  title,
  description,
  riskLevel,
  estimatedCost7Days,
  actionParams,
  supabase
}) {
  try {
    // Call Supabase function (uses auth.uid() from JWT token)
    const { data, error } = await supabase.rpc('create_approval_request', {
      p_project_id: projectId,
      p_task_id: taskId,
      p_agent_id: agentId,
      p_action: action,
      p_title: title,
      p_description: description,
      p_risk_level: riskLevel,
      p_estimated_cost_7_days: estimatedCost7Days,
      p_action_params: actionParams
    });

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      approval_id: data
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// GET PENDING APPROVALS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Récupère les demandes d'approbation en attente pour l'utilisateur
 *
 * ⚠️ SECURITY: Uses authenticated user from JWT token (auth.uid())
 *
 * @param {Object} supabase - Supabase client (authenticated)
 * @returns {Promise<Object>} { success, approvals: Array, count }
 */
export async function getPendingApprovals(supabase) {
  try {
    // Call Supabase function (uses auth.uid() from JWT token)
    const { data, error } = await supabase.rpc('get_pending_approvals');

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      approvals: data || [],
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
// APPROVE REQUEST
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Approuve une demande d'approbation
 *
 * ⚠️ SECURITY: Uses authenticated user from JWT token (auth.uid())
 *
 * @param {string} requestId - Approval request UUID
 * @param {Object} supabase - Supabase client (authenticated)
 * @returns {Promise<Object>} { success, action_params?, error? }
 */
export async function approveRequest(requestId, supabase) {
  try {
    // Call Supabase function (uses auth.uid() from JWT token)
    const { data, error } = await supabase.rpc('approve_request', {
      p_request_id: requestId
    });

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    // Data is an array with single row
    const result = Array.isArray(data) ? data[0] : data;

    if (!result.success) {
      return {
        success: false,
        error: result.error_message
      };
    }

    return {
      success: true,
      action_params: result.action_params
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// REJECT REQUEST
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Rejette une demande d'approbation
 *
 * ⚠️ SECURITY: Uses authenticated user from JWT token (auth.uid())
 *
 * @param {string} requestId - Approval request UUID
 * @param {string} rejectionReason - Reason for rejection
 * @param {Object} supabase - Supabase client (authenticated)
 * @returns {Promise<Object>} { success, error? }
 */
export async function rejectRequest(requestId, rejectionReason, supabase) {
  try {
    // Call Supabase function (uses auth.uid() from JWT token)
    const { data, error } = await supabase.rpc('reject_request', {
      p_request_id: requestId,
      p_rejection_reason: rejectionReason
    });

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    // Data is an array with single row
    const result = Array.isArray(data) ? data[0] : data;

    if (!result.success) {
      return {
        success: false,
        error: result.error_message
      };
    }

    return {
      success: true
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MARK AS EXECUTED
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Marque une demande d'approbation comme exécutée (après exécution de l'action)
 *
 * @param {string} requestId - Approval request UUID
 * @param {Object} executionResult - Result of the executed action
 * @param {Object} supabase - Supabase client
 * @returns {Promise<Object>} { success, error? }
 */
export async function markRequestExecuted(requestId, executionResult, supabase) {
  try {
    const { data, error } = await supabase.rpc('mark_request_executed', {
      p_request_id: requestId,
      p_execution_result: executionResult
    });

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: data === true
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// WRAPPER FUNCTION: Complete Approval Workflow
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Workflow complet: Check → Create Approval → Wait → Execute
 *
 * Cette fonction wrapper simplifie l'intégration dans les agents
 *
 * ⚠️ SECURITY: Uses authenticated user from JWT token (auth.uid())
 *
 * @param {Object} params - Parameters
 * @param {string} params.projectId - Project UUID
 * @param {string} params.taskId - Task UUID
 * @param {string} params.agentId - Agent ID
 * @param {string} params.action - Action name
 * @param {Object} params.actionParams - Action parameters
 * @param {Function} params.executeFunction - Async function that executes the action (called after approval)
 * @param {Object} params.supabase - Supabase client (authenticated)
 * @returns {Promise<Object>} { success, result?, approval_required?, approval_id?, error? }
 *
 * @example
 * const result = await executeWithApproval({
 *   projectId: project.id,
 *   taskId: task.id,
 *   agentId: 'marcus',
 *   action: 'launch_campaign',
 *   actionParams: { daily_budget_eur: 1500, platform: 'Meta', ... },
 *   executeFunction: async (approvedParams) => {
 *     return await metaAdsClient.createCampaign(approvedParams);
 *   },
 *   supabase
 * });
 *
 * if (result.approval_required) {
 *   return {
 *     message: "Demande d'approbation créée",
 *     approval_id: result.approval_id,
 *     ui_component: { type: 'APPROVAL_REQUEST', data: result.approval_data }
 *   };
 * }
 *
 * if (!result.success) {
 *   return { error: result.error };
 * }
 *
 * return { campaign_id: result.result.id };
 */
export async function executeWithApproval({
  projectId,
  taskId,
  agentId,
  action,
  actionParams,
  executeFunction,
  supabase
}) {
  // ─────────────────────────────────────────────────────────────────────────
  // 1. Check if approval required
  // ─────────────────────────────────────────────────────────────────────────
  const approvalCheck = checkApprovalRequired(agentId, action, actionParams);

  if (!approvalCheck.requires_approval) {
    // No approval needed → Execute immediately
    try {
      const result = await executeFunction(actionParams);
      return {
        success: true,
        result: result,
        approval_required: false
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        execution_error: true
      };
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Create approval request
  // ─────────────────────────────────────────────────────────────────────────
  const approvalRequest = await createApprovalRequest({
    projectId,
    taskId,
    agentId,
    action,
    title: approvalCheck.approval_data.title,
    description: approvalCheck.approval_data.description,
    riskLevel: approvalCheck.risk_level,
    estimatedCost7Days: approvalCheck.approval_data.estimated_cost_7_days,
    actionParams: actionParams,
    supabase
  });

  if (!approvalRequest.success) {
    return {
      success: false,
      error: approvalRequest.error,
      approval_creation_failed: true
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Return approval required (execution will happen after user approval)
  // ─────────────────────────────────────────────────────────────────────────
  return {
    success: false, // Not yet executed
    approval_required: true,
    approval_id: approvalRequest.approval_id,
    approval_data: approvalCheck.approval_data,
    message: `Demande d'approbation créée. En attente de votre validation.`
  };
}

// NOTE: L'exécution de l'action après approbation se fait via un webhook/endpoint séparé
// qui appelle approveRequest() puis exécute l'action avec les params stockés
