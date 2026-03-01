/**
 * ============================================================================
 * PROJECT MANAGER CONFIG - Agency Killer V4 (Cloud Native)
 * ============================================================================
 *
 * USAGE DANS N8N:
 * Copier getPMSystemPrompt() dans le node "AI Agent PM"
 * Configuration > System Message
 *
 * ============================================================================
 */

// ============================================================================
// TASK TEMPLATES PAR SCOPE
// ============================================================================

const TASK_TEMPLATES = {
  meta_ads: [
    {
      title: "Setup Technique & Budget CBO",
      description: "Configurer la structure de campagne Meta avec allocation budget optimisee",
      assignee: "marcus",
      phase: "Setup",
      estimated_hours: 2,
      context_questions: [
        "Budget quotidien prevu ?",
        "ROAS cible ?",
        "Audiences existantes a reutiliser ?"
      ],
      depends_on: [],
      triggers_flag: null
    },
    {
      title: "Setup Tracking (Pixel/CAPI)",
      description: "Installer et configurer le Pixel Meta + Conversions API",
      assignee: "sora",
      phase: "Setup",
      estimated_hours: 3,
      context_questions: [
        "GTM deja installe ?",
        "Evenements de conversion a tracker ?",
        "CMS utilise ?"
      ],
      depends_on: [],
      triggers_flag: "tracking_ready"
    },
    {
      title: "Copywriting Ads (3 variations)",
      description: "Rediger 3 variations de textes publicitaires (Hook/Corps/CTA)",
      assignee: "milo",
      phase: "Production",
      estimated_hours: 3,
      context_questions: [
        "Ton de la marque ?",
        "Offre principale a mettre en avant ?",
        "Call-to-action souhaite ?"
      ],
      depends_on: ["Setup Tracking (Pixel/CAPI)"],
      triggers_flag: null
    },
    {
      title: "Generation Visuels Meta",
      description: "Creer les visuels publicitaires avec Nano Banana Pro",
      assignee: "milo",
      phase: "Production",
      estimated_hours: 4,
      context_questions: [
        "Format prefere (carre, story, paysage) ?",
        "Elements de marque a inclure ?",
        "References visuelles ?"
      ],
      depends_on: ["Setup Tracking (Pixel/CAPI)"],
      triggers_flag: "creatives_ready"
    }
  ],

  seo: [
    {
      title: "Audit Semantique & Technique",
      description: "Analyser la structure SEO actuelle et identifier les opportunites",
      assignee: "luna",
      phase: "Audit",
      estimated_hours: 5,
      context_questions: [
        "URL du site ?",
        "Concurrents principaux ?",
        "Mots-cles prioritaires ?"
      ],
      depends_on: [],
      triggers_flag: "strategy_validated"
    },
    {
      title: "Recherche Opportunites Keywords",
      description: "Identifier les mots-cles a fort potentiel et analyser la concurrence",
      assignee: "luna",
      phase: "Audit",
      estimated_hours: 3,
      context_questions: [
        "Thematiques principales ?",
        "Zone geographique cible ?",
        "Budget SEO mensuel ?"
      ],
      depends_on: ["Audit Semantique & Technique"],
      triggers_flag: null
    },
    {
      title: "Configuration GSC & GA4",
      description: "Connecter Google Search Console et configurer le suivi analytics",
      assignee: "sora",
      phase: "Setup",
      estimated_hours: 1,
      context_questions: [
        "Acces GSC disponible ?",
        "GA4 deja configure ?",
        "Propriete a verifier ?"
      ],
      depends_on: [],
      triggers_flag: "tracking_ready"
    },
    {
      title: "Redaction Page Pilier",
      description: "Rediger le contenu SEO optimise sur la thematique principale",
      assignee: "milo",
      phase: "Production",
      estimated_hours: 4,
      context_questions: [
        "Sujet principal ?",
        "Longueur souhaitee ?",
        "Call-to-action ?"
      ],
      depends_on: ["Recherche Opportunites Keywords"],
      triggers_flag: null
    }
  ],

  sem: [
    {
      title: "Audit Compte Google Ads",
      description: "Analyser la performance actuelle et identifier les axes d'amelioration",
      assignee: "sora",
      phase: "Audit",
      estimated_hours: 2,
      context_questions: [
        "Acces Google Ads ?",
        "Historique de performance ?",
        "Objectifs de conversion ?"
      ],
      depends_on: [],
      triggers_flag: null
    },
    {
      title: "Setup Campagne Search",
      description: "Creer et configurer la campagne Google Search",
      assignee: "marcus",
      phase: "Setup",
      estimated_hours: 3,
      context_questions: [
        "Budget mensuel ?",
        "Zones geographiques ?",
        "Strategie d'encheres ?"
      ],
      depends_on: ["Audit Compte Google Ads"],
      triggers_flag: null
    },
    {
      title: "Copywriting RSA",
      description: "Rediger les titres et descriptions pour Responsive Search Ads",
      assignee: "milo",
      phase: "Production",
      estimated_hours: 2,
      context_questions: [
        "USP principale ?",
        "Offre a mettre en avant ?",
        "Ton souhaite ?"
      ],
      depends_on: [],
      triggers_flag: null
    }
  ],

  analytics: [
    {
      title: "Plan de Taggage GA4 + GTM",
      description: "Definir et implementer le plan de taggage complet",
      assignee: "sora",
      phase: "Setup",
      estimated_hours: 4,
      context_questions: [
        "Evenements cles a tracker ?",
        "Conversions principales ?",
        "Integrations tierces ?"
      ],
      depends_on: [],
      triggers_flag: "tracking_ready"
    },
    {
      title: "Debugging Data Layer",
      description: "Verifier et corriger les anomalies de donnees",
      assignee: "sora",
      phase: "Audit",
      estimated_hours: 2,
      context_questions: [
        "Anomalies constatees ?",
        "Differences avec back-office ?",
        "Outils de verification ?"
      ],
      depends_on: ["Plan de Taggage GA4 + GTM"],
      triggers_flag: null
    },
    {
      title: "Creation Dashboard Reporting",
      description: "Construire le tableau de bord de suivi des KPIs",
      assignee: "sora",
      phase: "Production",
      estimated_hours: 3,
      context_questions: [
        "KPIs prioritaires ?",
        "Frequence de mise a jour ?",
        "Destinataires du rapport ?"
      ],
      depends_on: ["Debugging Data Layer"],
      triggers_flag: null
    }
  ]
};

// ============================================================================
// CALENDAR INTELLIGENCE
// ============================================================================

/**
 * Calcule les due_dates en respectant les contraintes
 * @param {Array} tasks - Liste des taches a planifier
 * @param {string} deadline - Date limite du projet
 * @param {string} startDate - Date de debut (optionnel, defaut = today)
 * @returns {Array} Taches avec due_dates calculees
 */
function calculateDueDates(tasks, deadline, startDate = null) {
  const start = startDate ? new Date(startDate) : new Date();
  const end = new Date(deadline);

  // Buffer de 2 jours avant la deadline
  end.setDate(end.getDate() - 2);

  // Nombre de jours disponibles
  const availableDays = Math.floor((end - start) / (1000 * 60 * 60 * 24));

  // Grouper par phase
  const phases = ['Audit', 'Setup', 'Production', 'Optimization'];
  const tasksByPhase = phases.reduce((acc, phase) => {
    acc[phase] = tasks.filter(t => t.phase === phase);
    return acc;
  }, {});

  // Calculer le total d'heures par phase
  const hoursByPhase = phases.reduce((acc, phase) => {
    acc[phase] = tasksByPhase[phase].reduce((sum, t) => sum + t.estimated_hours, 0);
    return acc;
  }, {});

  const totalHours = Object.values(hoursByPhase).reduce((a, b) => a + b, 0);

  // Repartir les jours proportionnellement
  let currentDate = new Date(start);
  const result = [];

  for (const phase of phases) {
    const phaseTasks = tasksByPhase[phase];
    if (phaseTasks.length === 0) continue;

    const phaseHours = hoursByPhase[phase];
    const phaseDays = Math.max(1, Math.ceil((phaseHours / totalHours) * availableDays));

    for (const task of phaseTasks) {
      // Avancer d'un jour si on depasse 6h
      result.push({
        ...task,
        due_date: currentDate.toISOString().split('T')[0]
      });

      // Incrementer selon les heures
      const daysForTask = Math.ceil(task.estimated_hours / 6);
      currentDate.setDate(currentDate.getDate() + daysForTask);

      // Sauter les weekends
      while (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
  }

  return result;
}

// ============================================================================
// SYSTEM PROMPT GENERATOR
// ============================================================================

function getPMSystemPrompt() {
  return `# ROLE: PROJECT MANAGER - THE HIVE

Tu es le Project Manager de "The Hive", responsable de la planification strategique.

## MISSIONS
1. **Genesis**: Generer les taches intelligentes basees sur le scope
2. **Planning**: Calculer les deadlines avec Calendar Intelligence
3. **Coordination**: Gerer les dependances entre agents
4. **Write-Back**: Mettre a jour l'etat du projet

## TASK TEMPLATES DISPONIBLES
- meta_ads: Setup CBO, Tracking, Copywriting, Visuels
- seo: Audit, Keywords, GSC Setup, Redaction
- sem: Audit Ads, Setup Search, RSA Copy
- analytics: Plan Taggage, Debugging, Dashboard

## REGLES DE PLANNING
1. Maximum 6h de taches par jour
2. Respecter les dependances (Audit → Setup → Production)
3. Buffer de 2 jours avant deadline
4. Pas de taches le weekend

## FORMAT DE REPONSE
{
  "project": { name, scope, status, state_flags, metadata },
  "tasks": [{ title, assignee, phase, estimated_hours, due_date, context_questions, depends_on }],
  "chat_message": { content, tone }
}

## AGENTS DISPONIBLES
- **sora**: Analytics, Tracking, GA4, GTM
- **luna**: Strategie, SEO, Keywords
- **marcus**: Ads Setup, Budget, Campagnes
- **milo**: Copywriting, Visuels, Content`;
}

// ============================================================================
// EXPORTS
// ============================================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    TASK_TEMPLATES,
    calculateDueDates,
    getPMSystemPrompt
  };
}

// ============================================================================
// N8N CODE NODE USAGE
// ============================================================================
/*
 * Dans votre Code Node n8n:
 *
 * const TASK_TEMPLATES = { ... }; // Copier ci-dessus
 *
 * const input = $input.first().json;
 * const { scope, answers, project_name, deadline } = input;
 *
 * // Generer les taches basees sur le scope
 * const baseTasks = TASK_TEMPLATES[scope] || [];
 *
 * // Calculer les dates
 * const tasksWithDates = calculateDueDates(baseTasks, deadline);
 *
 * return [{
 *   json: {
 *     project: { name: project_name, scope, status: 'planning' },
 *     tasks: tasksWithDates
 *   }
 * }];
 */
