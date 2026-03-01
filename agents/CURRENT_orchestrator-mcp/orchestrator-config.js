/**
 * ============================================================================
 * ORCHESTRATOR CONFIG - Agency Killer V4 (Cloud Native)
 * ============================================================================
 *
 * USAGE DANS N8N:
 * Copier getOrchestratorSystemPrompt() dans le node "AI Agent Router"
 * Configuration > System Message
 *
 * ============================================================================
 */

// ============================================================================
// SYSTEM PROMPT (Pour AI Agent Node)
// ============================================================================

function getOrchestratorSystemPrompt() {
  return `# ROLE: DIRECTEUR DE STRATEGIE - THE HIVE

Tu es le Directeur de Strategie de "The Hive", une agence IA autonome.
Tu n'es PAS un assistant passif. Tu es un PARTENAIRE STRATEGIQUE.

## TON EQUIPE
- Analyst: Metriques, ROAS, CPA, performances
- Strategist: Concurrents, SEO, veille marche
- Creative: Publicites, copies, A/B tests
- Trader: Campagnes, budgets, encheres

## REGLES ABSOLUES
1. JAMAIS de texte brut - Toujours piloter l'interface UI
2. TOUJOURS proposer des actions concretes
3. TOUJOURS structurer en JSON valide
4. TOUJOURS utiliser le Brand Memory fourni

## FORMAT DE REPONSE OBLIGATOIRE
Ta reponse DOIT etre un JSON valide avec cette structure:

{
  "routing_decision": {
    "detected_intent": "description de l'intent",
    "recommended_specialist": "analyst|strategist|creative|trader|none",
    "confidence": 0.85,
    "reasoning": "pourquoi ce choix"
  },
  "response_draft": {
    "message": "Message conversationnel pour l'utilisateur",
    "tone": "neutral|positive|warning|suggestion",
    "suggested_actions": ["action1", "action2"]
  }
}

## COMPORTEMENT
- Pense comme un CMO, pas comme un chatbot
- Base tes decisions sur les donnees, pas sur des suppositions
- Sois direct et actionnable
- Challenge les mauvaises idees

## KEYWORDS DE ROUTING
- ANALYST: performance, metrics, ROAS, CPA, analytics, rapport, donnees, chiffres, KPI
- STRATEGIST: concurrent, SEO, marche, tendance, recherche, veille, strategie
- CREATIVE: publicite, ad, creative, texte, visuel, campagne, copy, headline
- TRADER: budget, encheres, lancer, deployer, campagne, Meta, Google Ads

Analyse le message utilisateur et fournis ta decision de routing.`;
}

// ============================================================================
// ROUTING KEYWORDS (Pour Code Node)
// ============================================================================

const ROUTING_KEYWORDS = {
  analyst: [
    'performance', 'metrics', 'metriques', 'ROAS', 'roas', 'CPA', 'cpa',
    'analytics', 'rapport', 'report', 'donnees', 'data', 'chiffres',
    'KPI', 'kpi', 'conversion', 'taux', 'statistiques', 'stats',
    'baisse', 'hausse', 'evolution', 'tendance performance'
  ],
  strategist: [
    'concurrent', 'competitor', 'SEO', 'seo', 'marche', 'market',
    'tendance', 'trend', 'recherche', 'search', 'veille', 'watch',
    'strategie', 'strategy', 'analyse concurrentielle', 'benchmark',
    'positionnement', 'Google', 'ranking', 'classement'
  ],
  creative: [
    'publicite', 'pub', 'ad', 'ads', 'creative', 'creatif',
    'texte', 'copy', 'visuel', 'visual', 'image', 'video',
    'headline', 'accroche', 'campagne publicitaire', 'Facebook',
    'Instagram', 'banner', 'banniere', 'A/B', 'test', 'variante'
  ],
  trader: [
    'budget', 'encheres', 'bid', 'lancer', 'launch', 'deployer',
    'deploy', 'campagne active', 'Meta Ads', 'Google Ads',
    'optimiser', 'optimize', 'depense', 'spend', 'allocation',
    'pause', 'activer', 'desactiver', 'scaling'
  ]
};

// ============================================================================
// UI RESPONSE TEMPLATES (Pour Code Node)
// ============================================================================

const UI_TEMPLATES = {

  // Template: Menu Principal
  mainMenu: {
    type: 'ACTION_BUTTONS',
    data: {
      layout: 'grid',
      actions: [
        {
          id: 'menu_analyst',
          label: 'Analyser mes performances',
          icon: 'chart-line',
          action_type: 'navigate',
          variant: 'secondary',
          payload: { specialist_id: 'analyst' }
        },
        {
          id: 'menu_strategist',
          label: 'Veille concurrentielle',
          icon: 'search',
          action_type: 'navigate',
          variant: 'secondary',
          payload: { specialist_id: 'strategist' }
        },
        {
          id: 'menu_creative',
          label: 'Creer une publicite',
          icon: 'palette',
          action_type: 'navigate',
          variant: 'secondary',
          payload: { specialist_id: 'creative' }
        },
        {
          id: 'menu_trader',
          label: 'Gerer mes campagnes',
          icon: 'currency-euro',
          action_type: 'navigate',
          variant: 'secondary',
          payload: { specialist_id: 'trader' }
        }
      ]
    },
    layout: { width: 'full', order: 1 }
  },

  // Template: Loading Specialist
  loadingSpecialist: (specialistName, capabilities) => ({
    type: 'LOADING',
    data: {
      title: `Preparation de ${specialistName}`,
      message: `Chargement des outils: ${capabilities.join(', ')}`
    },
    layout: { width: 'full', order: 1 }
  }),

  // Template: Confirmation Actions
  confirmActions: (primaryLabel, specialistId) => ({
    type: 'ACTION_BUTTONS',
    data: {
      layout: 'horizontal',
      actions: [
        {
          id: 'action_proceed',
          label: primaryLabel,
          icon: 'play',
          action_type: 'navigate',
          variant: 'primary',
          payload: { specialist_id: specialistId }
        },
        {
          id: 'action_cancel',
          label: 'Annuler',
          icon: 'x',
          action_type: 'navigate',
          variant: 'ghost',
          payload: { action: 'cancel' }
        }
      ]
    },
    layout: { width: 'full', order: 2 }
  })
};

// ============================================================================
// CHAT TEMPLATES (Pour Code Node)
// ============================================================================

const CHAT_TEMPLATES = {

  welcome: {
    content: `**Bienvenue dans The Hive.**

Je suis votre Directeur de Strategie. Comment puis-je vous aider aujourd'hui ?

Selectionnez une action ou decrivez votre besoin.`,
    tone: 'neutral',
    follow_up_questions: [
      'Quel est mon ROAS actuel ?',
      'Analyse mes concurrents',
      'Cree une pub Meta'
    ]
  },

  specialistReady: (specialistName, capabilities) => ({
    content: `**${specialistName} est pret.**

J'ai detecte une demande liee a: **${capabilities.join(', ')}**.

Voulez-vous que je lance cette analyse ?`,
    tone: 'suggestion',
    follow_up_questions: [
      `Afficher les dernieres donnees ?`,
      'Modifier les parametres ?',
      'Voir un autre domaine ?'
    ]
  }),

  warningPerformance: (metric, currentValue, targetValue) => ({
    content: `**Alerte Performance**

Votre **${metric}** est a **${currentValue}** - sous la cible de **${targetValue}**.

J'active l'Analyst pour un diagnostic complet.`,
    tone: 'warning',
    follow_up_questions: [
      'Voir le detail par canal ?',
      'Identifier les causes ?',
      'Actions correctives ?'
    ]
  })
};

// ============================================================================
// EXPORTS
// ============================================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getOrchestratorSystemPrompt,
    ROUTING_KEYWORDS,
    UI_TEMPLATES,
    CHAT_TEMPLATES
  };
}

// ============================================================================
// N8N CODE NODE USAGE
// ============================================================================
/*
 * Dans votre Code Node n8n, copiez les constantes necessaires:
 *
 * const ROUTING_KEYWORDS = { ... };
 * const UI_TEMPLATES = { ... };
 * const CHAT_TEMPLATES = { ... };
 *
 * // Puis utilisez:
 * const userMessage = $input.first().json.message;
 *
 * function detectSpecialist(message) {
 *   for (const [specialist, keywords] of Object.entries(ROUTING_KEYWORDS)) {
 *     if (keywords.some(kw => message.toLowerCase().includes(kw.toLowerCase()))) {
 *       return specialist;
 *     }
 *   }
 *   return null;
 * }
 *
 * const detected = detectSpecialist(userMessage);
 *
 * if (detected) {
 *   return [{ json: UI_TEMPLATES.loadingSpecialist(detected, [...]) }];
 * } else {
 *   return [{ json: UI_TEMPLATES.mainMenu }];
 * }
 */
