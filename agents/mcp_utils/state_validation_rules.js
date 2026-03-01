/**
 * STATE VALIDATION RULES - THE HIVE OS V4
 *
 * Règles de validation d'état pour empêcher les actions critiques
 * avant que les prérequis ne soient remplis.
 *
 * Architecture: Safety-First
 * - Bloque actions dangereuses (campagnes sans budget approuvé)
 * - Enforce workflow logique (stratégie → assets → lancement)
 * - Prévient erreurs en cascade
 *
 * @module state_validation_rules
 * @version 1.0.0
 * @date 2026-02-19
 */

// ═══════════════════════════════════════════════════════════════════════════
// STATE VALIDATION RULES - Règles par Agent
// ═══════════════════════════════════════════════════════════════════════════

export const STATE_VALIDATION_RULES = {
  // ────────────────────────────────────────────────────────────────────────
  // MARCUS (Trader) - Actions Budget/Campagnes
  // ────────────────────────────────────────────────────────────────────────
  trader: {
    launch_campaign: {
      required_flags: [
        'strategy_validated',  // Luna doit avoir validé le positionnement
        'budget_approved',     // User doit avoir approuvé le budget
        'creatives_ready',     // Milo doit avoir livré les assets
        'tracking_ready'       // Sora doit avoir vérifié le pixel/tag
      ],
      required_phase: ['Production', 'Optimization'],
      error_message: "Impossible de lancer la campagne: validations manquantes",
      help_text: "Complétez d'abord: Stratégie (Luna) → Budget (Approval) → Assets (Milo) → Tracking (Sora)",
      severity: 'blocking'
    },

    scale_campaign: {
      required_flags: ['ads_live'],
      minimum_runtime_hours: 48, // Meta Learning Phase = 48h minimum
      error_message: "Impossible de scaler: campagne trop récente (attendez fin Learning Phase)",
      help_text: "Meta Ads nécessite 48h minimum de Learning Phase avant scaling",
      severity: 'blocking'
    },

    kill_campaign: {
      required_flags: ['ads_live'],
      error_message: "Aucune campagne active à arrêter",
      help_text: "Il n'y a actuellement aucune campagne en cours d'exécution",
      severity: 'warning'
    },

    update_budget: {
      required_flags: ['ads_live'],
      error_message: "Impossible de modifier le budget: aucune campagne active",
      severity: 'blocking'
    }
  },

  // ────────────────────────────────────────────────────────────────────────
  // MILO (Creative) - Actions Création
  // ────────────────────────────────────────────────────────────────────────
  creative: {
    generate_final_creatives: {
      required_flags: ['strategy_validated'],
      required_phase: ['Production', 'Optimization'],
      error_message: "Attendez validation de la stratégie avant génération finale",
      help_text: "Luna doit d'abord valider le positionnement et le ton de marque",
      severity: 'blocking'
    },

    generate_video: {
      required_flags: ['strategy_validated'],
      cost_approval_threshold: 50, // Vidéos coûteuses (VEO-2 ~$0.12/vidéo)
      error_message: "Génération vidéo nécessite validation stratégie + approbation coût",
      help_text: "Les vidéos sont coûteuses. Assurez-vous que la stratégie est validée.",
      severity: 'warning'
    },

    generate_brand_assets: {
      required_flags: ['strategy_validated'],
      error_message: "Validez d'abord l'identité de marque avec Luna",
      help_text: "Les assets de marque doivent respecter le positionnement validé",
      severity: 'blocking'
    }
  },

  // ────────────────────────────────────────────────────────────────────────
  // SORA (Analyst) - Actions Analytics/Dashboards
  // ────────────────────────────────────────────────────────────────────────
  analyst: {
    create_dashboard: {
      required_flags: ['tracking_ready'],
      error_message: "Tracking non configuré: données indisponibles",
      help_text: "Installez d'abord le pixel Meta ou le tag GA4 pour collecter des données",
      severity: 'blocking'
    },

    analyze_campaign_performance: {
      required_flags: ['ads_live'],
      minimum_runtime_hours: 24, // Min 24h de données pour analyse fiable
      error_message: "Campagne trop récente pour une analyse fiable",
      help_text: "Attendez au minimum 24h de données avant analyse",
      severity: 'warning'
    },

    audit_tracking: {
      required_phase: ['Setup', 'Production'],
      error_message: "L'audit tracking doit être fait en phase Setup ou Production",
      severity: 'warning'
    },

    generate_report: {
      required_flags: ['tracking_ready'],
      minimum_runtime_hours: 24,
      error_message: "Données insuffisantes pour générer un rapport",
      help_text: "Attendez au moins 24h de collecte de données",
      severity: 'warning'
    }
  },

  // ────────────────────────────────────────────────────────────────────────
  // LUNA (Strategist) - Actions Stratégie/SEO
  // ────────────────────────────────────────────────────────────────────────
  strategist: {
    finalize_strategy: {
      required_phase: ['Audit', 'Setup'],
      error_message: "Finalisez d'abord l'audit avant de valider la stratégie",
      help_text: "Phase Audit doit être complétée pour avoir toutes les données",
      severity: 'blocking'
    },

    competitive_analysis: {
      required_phase: ['Audit'],
      error_message: "L'analyse concurrentielle se fait en phase Audit",
      severity: 'warning'
    },

    validate_positioning: {
      required_phase: ['Audit', 'Setup'],
      error_message: "Le positionnement se valide après l'audit",
      severity: 'blocking'
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// FLAG DESCRIPTIONS - Pour UI
// ═══════════════════════════════════════════════════════════════════════════

export const FLAG_DESCRIPTIONS = {
  strategy_validated: {
    label: "Stratégie validée",
    description: "Luna a validé le positionnement, le ton de marque et la stratégie globale",
    responsible_agent: "luna",
    icon: "target"
  },
  budget_approved: {
    label: "Budget approuvé",
    description: "Vous avez approuvé le budget quotidien de la campagne",
    responsible_agent: "user",
    icon: "dollar-sign"
  },
  creatives_ready: {
    label: "Assets créatifs prêts",
    description: "Milo a généré et livré tous les visuels/vidéos/copies nécessaires",
    responsible_agent: "creative",
    icon: "image"
  },
  tracking_ready: {
    label: "Tracking configuré",
    description: "Sora a vérifié que le pixel Meta/GA4 est correctement installé",
    responsible_agent: "analyst",
    icon: "activity"
  },
  ads_live: {
    label: "Campagne active",
    description: "Au moins une campagne est actuellement en cours d'exécution",
    responsible_agent: "trader",
    icon: "play-circle"
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION FUNCTION - Core Logic
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Vérifie si une action peut être exécutée selon l'état du projet
 *
 * @param {string} agent - Agent ID (trader, creative, analyst, strategist)
 * @param {string} action - Action name (launch_campaign, generate_image, etc.)
 * @param {string} projectId - Project UUID
 * @param {Object} supabase - Supabase client
 * @returns {Promise<Object>} Validation result
 *
 * @example
 * const validation = await validateStateBeforeAction('trader', 'launch_campaign', projectId, supabase);
 * if (!validation.valid) {
 *   console.error(validation.error);
 * }
 */
export async function validateStateBeforeAction(agent, action, projectId, supabase) {
  // Récupérer les règles pour cette action
  const rules = STATE_VALIDATION_RULES[agent]?.[action];

  if (!rules) {
    // Pas de règle de validation = action autorisée
    return { valid: true };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 1. Charger l'état du projet
  // ─────────────────────────────────────────────────────────────────────────
  try {
    const { data: project, error } = await supabase
      .from('projects')
      .select('state_flags, current_phase, metadata, created_at')
      .eq('id', projectId)
      .single();

    if (error || !project) {
      return {
        valid: false,
        error: 'Projet introuvable',
        severity: 'error',
        details: error?.message
      };
    }

    // ─────────────────────────────────────────────────────────────────────
    // 2. Vérifier les flags requis
    // ─────────────────────────────────────────────────────────────────────
    if (rules.required_flags && rules.required_flags.length > 0) {
      const missingFlags = rules.required_flags.filter(
        flag => !project.state_flags?.[flag]
      );

      if (missingFlags.length > 0) {
        return {
          valid: false,
          error: rules.error_message,
          missing_flags: missingFlags.map(flag => ({
            flag: flag,
            ...FLAG_DESCRIPTIONS[flag]
          })),
          resolution: rules.help_text,
          severity: rules.severity || 'blocking',
          validation_type: 'missing_flags'
        };
      }
    }

    // ─────────────────────────────────────────────────────────────────────
    // 3. Vérifier la phase requise
    // ─────────────────────────────────────────────────────────────────────
    if (rules.required_phase && rules.required_phase.length > 0) {
      if (!rules.required_phase.includes(project.current_phase)) {
        return {
          valid: false,
          error: `Action autorisée seulement en phase: ${rules.required_phase.join(' ou ')}`,
          current_phase: project.current_phase,
          required_phases: rules.required_phase,
          resolution: `Passez d'abord à la phase ${rules.required_phase[0]}`,
          severity: rules.severity || 'blocking',
          validation_type: 'wrong_phase'
        };
      }
    }

    // ─────────────────────────────────────────────────────────────────────
    // 4. Vérifier le runtime minimum (pour scale, analyze, etc.)
    // ─────────────────────────────────────────────────────────────────────
    if (rules.minimum_runtime_hours) {
      const campaign = project.metadata?.campaign;

      if (!campaign?.launched_at) {
        return {
          valid: false,
          error: "Aucune campagne active trouvée",
          resolution: "Lancez d'abord une campagne avec Marcus",
          severity: rules.severity || 'blocking',
          validation_type: 'no_campaign'
        };
      }

      const hoursSinceLaunch =
        (Date.now() - new Date(campaign.launched_at).getTime()) / 3600000;

      if (hoursSinceLaunch < rules.minimum_runtime_hours) {
        const hoursRemaining = Math.ceil(rules.minimum_runtime_hours - hoursSinceLaunch);

        return {
          valid: false,
          error: rules.error_message,
          hours_remaining: hoursRemaining,
          hours_since_launch: Math.floor(hoursSinceLaunch),
          minimum_hours: rules.minimum_runtime_hours,
          resolution: rules.help_text,
          severity: rules.severity || 'warning',
          validation_type: 'insufficient_runtime'
        };
      }
    }

    // ─────────────────────────────────────────────────────────────────────
    // ✅ Toutes les validations passées
    // ─────────────────────────────────────────────────────────────────────
    return {
      valid: true,
      message: `Validation OK pour ${agent}.${action}`
    };

  } catch (error) {
    // Erreur inattendue
    return {
      valid: false,
      error: 'Erreur lors de la validation',
      severity: 'error',
      details: error.message
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Convertit un flag technique en texte lisible
 */
export function flagToHumanReadable(flag) {
  return FLAG_DESCRIPTIONS[flag]?.label || flag;
}

/**
 * Récupère toutes les validations pour un agent
 */
export function getAgentValidations(agentId) {
  return STATE_VALIDATION_RULES[agentId] || {};
}

/**
 * Liste tous les flags disponibles
 */
export function getAllFlags() {
  return Object.keys(FLAG_DESCRIPTIONS);
}
