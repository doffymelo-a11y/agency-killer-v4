// ============================================================================
// LOAD GLOBAL CONTEXT - Agency Killer V4 (Cloud Native) + SHARED MEMORY V4.3
// ============================================================================
// ⚠️  CE PATCH PRESERVE 100% DE LA LOGIQUE EXISTANTE
// ✅  AJOUTE: Extraction de shared_memory, task_context, chat_mode
// ✅  AJOUTE: Isolation session par project_id
// ============================================================================

const input = $input.first().json;

// ============================================================================
// DÉTECTION AUTOMATIQUE DU TRIGGER (PRESERVÉ - V4.1)
// ============================================================================
const isWebhook = !!input.body;
const sourceData = isWebhook ? input.body : input;

const globalContext = {
  // ─────────────────────────────────────────────────────────────────────────
  // BRAND MEMORY (Hardcoded - Cloud Native) - PRESERVÉ 100%
  // ─────────────────────────────────────────────────────────────────────────
  brand_memory: {
    identity: {
      name: "Agency Killer",
      tone: "Expert, Direct, Data-Driven",
      mission: "Remplacer les agences marketing par une IA autonome",
      tagline: "The Hive - Your AI Marketing Department"
    },
    personas: [
      {
        id: "p1",
        name: "Solopreneur Tech",
        pain_points: [
          "Manque de temps pour le marketing",
          "Budget limite pour une agence",
          "Expertise marketing insuffisante",
          "Besoin de resultats rapides"
        ],
        goals: [
          "Automatiser le marketing",
          "Avoir une vision claire des KPIs",
          "Scaler sans recruter"
        ],
        triggers: ["urgency", "social_proof", "roi_proof"]
      },
      {
        id: "p2",
        name: "PME en Croissance",
        pain_points: [
          "Equipe marketing reduite",
          "Manque de coherence cross-canal",
          "Difficulte a mesurer le ROI"
        ],
        goals: [
          "Centraliser les operations",
          "Optimiser chaque euro investi",
          "Gagner en visibilite marche"
        ],
        triggers: ["case_study", "authority", "free_trial"]
      }
    ],
    voice: {
      formality: "vous",
      emoji_usage: "minimal",
      banned_words: ["gratuit", "miracle", "garanti 100%", "meilleur"],
      preferred_expressions: ["data-driven", "ROI mesurable", "optimisation continue"]
    },
    objectives: {
      primary_kpi: "ROAS",
      targets: {
        roas: 3.0,
        cpa: 25,
        conversion_rate: 2.5
      }
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SYSTEM STATUS - MIS À JOUR V4.3
  // ─────────────────────────────────────────────────────────────────────────
  system_status: {
    env: "production_vps",
    version: "v4.3_shared_memory",  // Mise à jour version
    deployment: "cloud_native",
    last_boot: new Date().toISOString()
  },

  // ─────────────────────────────────────────────────────────────────────────
  // AVAILABLE SPECIALISTS (Routing Table) - PRESERVÉ 100%
  // ─────────────────────────────────────────────────────────────────────────
  specialists: {
    analyst: {
      id: "analyst-mcp",
      workflow_name: "Analyst MCP - Agency Killer V4",
      name: "The Analyst",
      frontend_id: "sora",  // Ajouté pour mapping
      capabilities: ["metrics", "reporting", "kpi_tracking", "anomaly_detection"],
      trigger_keywords: ["performance", "metrics", "ROAS", "CPA", "analytics", "rapport", "donnees", "chiffres", "trafic", "ventes", "bilan"]
    },
    strategist: {
      id: "strategist-mcp",
      workflow_name: "Strategist MCP - Agency Killer V4",
      name: "The Strategist",
      frontend_id: "luna",
      capabilities: ["seo", "competitor_intel", "market_research", "trend_analysis", "google_updates"],
      trigger_keywords: ["concurrent", "SEO", "marche", "tendance", "recherche", "veille", "strategie", "Google", "update", "algorithm"]
    },
    creative: {
      id: "creative-mcp",
      workflow_name: "Creative MCP - Agency Killer V4",
      name: "The Creative",
      frontend_id: "milo",
      capabilities: ["ad_copy", "visuals", "ab_testing", "brand_voice", "nano_banana_pro", "gemini_3"],
      trigger_keywords: ["publicite", "ad", "creative", "texte", "visuel", "campagne", "copy", "headline", "banniere", "image", "video"]
    },
    trader: {
      id: "trader-mcp",
      workflow_name: "Trader MCP - Agency Killer V4",
      name: "The Trader",
      frontend_id: "marcus",
      capabilities: ["budget_allocation", "bid_management", "campaign_ops", "kill_switch", "scale_rule"],
      trigger_keywords: ["budget", "encheres", "lancer", "deployer", "couper", "scaler", "ROAS", "Meta", "Google Ads", "campagne"]
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // UI COMPONENTS REGISTRY - PRESERVÉ 100%
  // ─────────────────────────────────────────────────────────────────────────
  ui_components: {
    KPI_CARD: "KPI_CARD",
    CHART_WIDGET: "CHART_WIDGET",
    AD_PREVIEW: "AD_PREVIEW",
    BATTLE_CARD: "BATTLE_CARD",
    WEB_SEARCH_RESULT: "WEB_SEARCH_RESULT",
    COMPETITOR_INTEL: "COMPETITOR_INTEL",
    CAMPAIGN_TABLE: "CAMPAIGN_TABLE",
    CAMPAGNE_TABLE: "CAMPAGNE_TABLE",  // Alias utilisé par Creative
    ACTION_BUTTONS: "ACTION_BUTTONS",
    LOADING: "LOADING",
    ERROR: "ERROR",
    APPROVAL_REQUEST: "APPROVAL_REQUEST",
    PDF_REPORT: "PDF_REPORT",           // Ajouté pour Strategist
    PDF_COPYWRITING: "PDF_COPYWRITING"  // Ajouté pour Creative
  }
};

// ============================================================================
// ⭐ NOUVEAU V4.3: EXTRACTION SHARED MEMORY (Mémoire Partagée Projet)
// ============================================================================
const shared_memory = sourceData.shared_memory || null;
const task_context = sourceData.task_context || null;
const chat_mode = sourceData.chat_mode || 'quick_research';

// Stocker dans le contexte global pour transmission aux agents
globalContext.shared_memory = shared_memory;
globalContext.task_context = task_context;
globalContext.chat_mode = chat_mode;

// ============================================================================
// PATCH DYNAMIQUE (CONTEXTE AGENT ACTIF) - PRESERVÉ + ENRICHI
// Compatible Webhook ET Chat Trigger
// ============================================================================
try {
    const userSettings = sourceData.agency_context || {};
    const projectContext = sourceData.project_context || {};

    // 1. Injection Identité - PRESERVÉ
    if (userSettings.brandName) globalContext.brand_memory.identity.name = userSettings.brandName;
    if (userSettings.brandTone) globalContext.brand_memory.identity.tone = userSettings.brandTone;
    if (userSettings.websiteUrl) globalContext.brand_memory.identity.website = userSettings.websiteUrl;

    // 2. Injection Objectif - PRESERVÉ
    if (projectContext.objective) globalContext.brand_memory.objectives.primary_objective = projectContext.objective;

    // 3. Transmission instructions - PRESERVÉ
    globalContext.dynamic_instructions = sourceData.system_instruction || "";

    // ⭐ NOUVEAU V4.3: Injection contexte projet depuis shared_memory
    if (shared_memory) {
      // Enrichir brand_memory avec les infos projet
      if (shared_memory.metadata?.websiteUrl || shared_memory.metadata?.website_url) {
        globalContext.brand_memory.identity.website = shared_memory.metadata.websiteUrl || shared_memory.metadata.website_url;
      }
      if (shared_memory.metadata?.usp) {
        globalContext.brand_memory.identity.usp = shared_memory.metadata.usp;
      }
      if (shared_memory.metadata?.targetPersona || shared_memory.metadata?.persona) {
        globalContext.brand_memory.identity.target_persona = shared_memory.metadata.targetPersona || shared_memory.metadata.persona;
      }
      if (shared_memory.metadata?.competitors) {
        globalContext.brand_memory.identity.competitors = shared_memory.metadata.competitors;
      }
    }

    // 4. USER INPUT UNIFIÉ - ENRICHI AVEC SESSION ISOLATION
    globalContext.user_input = {
      // Message: Webhook = chatInput dans body, Chat Trigger = chatInput à la racine
      message: sourceData.chatInput || sourceData.message || input.chatInput || "",

      // Image (Base64)
      image: sourceData.image || null,

      // Agent actif: Webhook = activeAgentId, Chat Trigger = default
      active_agent: sourceData.activeAgentId || "orchestrator",

      // ⭐ V4.3: SESSION ID AVEC ISOLATION PROJET
      // Format: {project_id}-{agent}-session pour garantir isolation mémoire
      session_id: shared_memory?.project_id
        ? `${shared_memory.project_id}-${sourceData.activeAgentId || 'orchestrator'}-session`
        : sourceData.session_id || input.sessionId || `session_${Date.now()}`,

      timestamp: new Date().toISOString(),

      // Debug: identifier la source
      trigger_source: isWebhook ? "webhook" : "chat_trigger",

      // ⭐ V4.3: Info projet pour debug
      project_id: shared_memory?.project_id || null,
      project_name: shared_memory?.project_name || null,
      chat_mode: chat_mode
    };
} catch (e) {
    // Fallback en cas d'erreur - PRESERVÉ
    globalContext.user_input = {
      message: input.chatInput || "",
      image: null,
      active_agent: "orchestrator",
      session_id: input.sessionId || `session_${Date.now()}`,
      timestamp: new Date().toISOString(),
      trigger_source: "fallback",
      project_id: null,
      project_name: null,
      chat_mode: 'quick_research'
    };
}

// ============================================================================
// ⭐ NOUVEAU V4.3: CONSTRUIRE LE CONTEXTE PROJET POUR L'IA
// Ce string sera injecté dans le system prompt pour que l'IA ait le contexte
// ============================================================================
let projectContextString = "";

if (shared_memory) {
  projectContextString = `
## 📁 CONTEXTE PROJET ACTUEL

**Projet:** ${shared_memory.project_name || "Non spécifié"}
**ID:** ${shared_memory.project_id}
**Status:** ${shared_memory.project_status || "unknown"}
**Phase actuelle:** ${shared_memory.current_phase || "Non définie"}
**Scope:** ${shared_memory.scope || "Non défini"}

### État d'avancement (State Flags)
${shared_memory.state_flags ? Object.entries(shared_memory.state_flags).map(([k, v]) => `- ${k}: ${v ? "✅ Validé" : "⏳ En attente"}`).join("\n") : "Aucun état disponible"}

### Metadata Projet
${shared_memory.metadata ? Object.entries(shared_memory.metadata)
  .filter(([k, v]) => v && v !== '')
  .map(([k, v]) => `- **${k}:** ${Array.isArray(v) ? v.join(', ') : v}`)
  .join("\n") : "Aucune metadata"}
`;
}

if (task_context && chat_mode === 'task_execution') {
  projectContextString += `
## 🎯 TÂCHE EN COURS D'EXÉCUTION

**Tâche:** ${task_context.task_title}
**ID:** ${task_context.task_id}
**Phase:** ${task_context.task_phase}
**Description:** ${task_context.task_description || "Non fournie"}

### Réponses du Client (Context Questions)
${task_context.user_inputs ? Object.entries(task_context.user_inputs)
  .filter(([k, v]) => v && v !== '')
  .map(([k, v]) => `- **${k}:** ${v}`)
  .join("\n") : "Aucune réponse collectée"}

### Dépendances
${(task_context.depends_on || []).length > 0 ? task_context.depends_on.join(", ") : "Aucune dépendance"}
`;
}

globalContext.project_context_string = projectContextString;

return [{ json: globalContext }];
