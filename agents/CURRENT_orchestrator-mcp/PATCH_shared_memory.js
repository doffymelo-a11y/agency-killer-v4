// ============================================================================
// PATCH: Load Global Context with Shared Memory Support
// ============================================================================
// REMPLACER le code du node "Load Global Context" dans l'orchestrator
// Ce patch ajoute l'extraction de shared_memory et task_context
// ============================================================================

// ─────────────────────────────────────────────────────────────────────────
// EXTRACTING INCOMING DATA
// ─────────────────────────────────────────────────────────────────────────

const incomingData = $input.first().json;
const body = incomingData.body || incomingData;

// Extract shared_memory (projet context)
const shared_memory = body.shared_memory || null;

// Extract task_context (if in task_execution mode)
const task_context = body.task_context || null;

// Extract chat mode
const chat_mode = body.chat_mode || 'quick_research';

// Extract active agent (requested by frontend)
const activeAgentId = body.activeAgentId || 'orchestrator';

// ─────────────────────────────────────────────────────────────────────────
// BUILD GLOBAL CONTEXT WITH PROJECT ISOLATION
// ─────────────────────────────────────────────────────────────────────────

const globalContext = {
  // BRAND MEMORY (Hardcoded - Cloud Native)
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
          "Expertise marketing insuffisante"
        ],
        goals: ["Automatiser le marketing", "Vision claire KPIs", "Scaler sans recruter"]
      }
    ],
    voice: {
      formality: "vous",
      emoji_usage: "minimal",
      banned_words: ["gratuit", "miracle", "garanti 100%"]
    },
    objectives: {
      primary_kpi: "ROAS",
      targets: { roas: 3.0, cpa: 25, conversion_rate: 2.5 }
    }
  },

  // SYSTEM STATUS
  system_status: {
    env: "production_vps",
    version: "v4.3_shared_memory",
    deployment: "cloud_native",
    last_boot: new Date().toISOString()
  },

  // SPECIALISTS ROUTING TABLE
  specialists: {
    analyst: {
      id: "analyst-mcp",
      workflow_name: "Analyst MCP - Agency Killer V4",
      name: "The Analyst (Sora)",
      frontend_id: "sora"
    },
    strategist: {
      id: "strategist-mcp",
      workflow_name: "Strategist MCP - Agency Killer V4",
      name: "The Strategist (Luna)",
      frontend_id: "luna"
    },
    creative: {
      id: "creative-mcp",
      workflow_name: "Creative MCP - Agency Killer V4",
      name: "The Creative (Milo)",
      frontend_id: "milo"
    },
    trader: {
      id: "trader-mcp",
      workflow_name: "Trader MCP - Agency Killer V4",
      name: "The Trader (Marcus)",
      frontend_id: "marcus"
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // PROJECT-SPECIFIC CONTEXT (La Memoire Partagee V4.3)
  // ─────────────────────────────────────────────────────────────────────────

  // Shared memory from current project (isolation garantie)
  shared_memory: shared_memory,

  // Task context if in task_execution mode
  task_context: task_context,

  // Chat mode
  chat_mode: chat_mode,

  // Active agent requested
  active_agent: activeAgentId,

  // User input
  user_input: {
    message: body.chatInput || body.message || "",
    // SESSION KEY: project_id garantit l'isolation memoire par projet
    session_id: shared_memory?.project_id
      ? `${shared_memory.project_id}-${activeAgentId}-session`
      : body.session_id || `default-${Date.now()}`,
    timestamp: new Date().toISOString()
  }
};

// ─────────────────────────────────────────────────────────────────────────
// BUILD CONTEXT INJECTION STRING FOR AGENTS
// ─────────────────────────────────────────────────────────────────────────

let projectContextString = "";

if (shared_memory) {
  projectContextString = `
## CONTEXTE PROJET ACTUEL

**Projet:** ${shared_memory.project_name || "Non specifie"}
**ID:** ${shared_memory.project_id}
**Status:** ${shared_memory.project_status || "unknown"}
**Phase actuelle:** ${shared_memory.current_phase || "Non definie"}
**Scope:** ${shared_memory.scope || "Non defini"}

### State Flags (Etat d'avancement)
${Object.entries(shared_memory.state_flags || {}).map(([k, v]) => `- ${k}: ${v ? "✓" : "✗"}`).join("\n")}

### Metadata Projet
${shared_memory.metadata ? Object.entries(shared_memory.metadata).map(([k, v]) => `- ${k}: ${v || "Non renseigne"}`).join("\n") : "Aucune metadata"}
`;
}

if (task_context && chat_mode === 'task_execution') {
  projectContextString += `
## TACHE EN COURS D'EXECUTION

**Tache:** ${task_context.task_title}
**ID:** ${task_context.task_id}
**Phase:** ${task_context.task_phase}
**Description:** ${task_context.task_description || "Non fournie"}

### Reponses du Client (Context Questions)
${task_context.user_inputs ? Object.entries(task_context.user_inputs).map(([k, v]) => `- **${k}:** ${v}`).join("\n") : "Aucune reponse collectee"}

### Dependances
${(task_context.depends_on || []).length > 0 ? task_context.depends_on.join(", ") : "Aucune dependance"}
`;
}

globalContext.project_context_string = projectContextString;

return [{ json: globalContext }];
