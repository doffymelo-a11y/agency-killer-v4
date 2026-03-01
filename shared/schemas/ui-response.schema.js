/**
 * ============================================================================
 * UI RESPONSE SCHEMA - Agency Killer V4 (Cloud Native Edition)
 * ============================================================================
 *
 * PROTOCOLE DE COMMUNICATION COCKPIT BIONIQUE
 *
 * Architecture: n8n (Docker) --> Next.js Frontend
 * Deployment: VPS Cloud (Hostinger)
 *
 * ============================================================================
 * CLOUD NATIVE PRINCIPLE
 * ============================================================================
 * Ce schema est PORTABLE. Il est concu pour etre copie directement dans les
 * Code Nodes de n8n. AUCUNE dependance au filesystem local.
 *
 * Usage dans n8n:
 * 1. Copier les constantes UI_COMPONENTS et SCHEMAS dans votre Code Node
 * 2. Utiliser les factory functions pour generer des reponses valides
 * 3. Le frontend parse et rend les composants dynamiquement
 *
 * ============================================================================
 * REGLE ABSOLUE
 * ============================================================================
 * L'Orchestrateur ne renvoie JAMAIS de texte brut.
 * CHAQUE reponse DOIT respecter ce schema pour piloter le Frontend.
 *
 * Structure obligatoire:
 * {
 *   thought_process: { ... }   // Raisonnement interne (debug/logs)
 *   chat_message: "..."        // Texte pour la bulle de chat (gauche)
 *   ui_components: [ ... ]     // Composants visuels (panneau droit)
 *   meta: { ... }              // Metadata technique
 * }
 */

// ============================================================================
// UI COMPONENT TYPES (ENUM)
// ============================================================================

const UI_COMPONENTS = {
  // ─────────────────────────────────────────────────────────────────────────
  // ANALYST - Data & Metrics Components
  // ─────────────────────────────────────────────────────────────────────────

  /** KPI Card - Single metric with trend indicator */
  KPI_CARD: 'KPI_CARD',

  /** Chart Widget - Line, Bar, Area, Pie charts */
  CHART_WIDGET: 'CHART_WIDGET',

  /** Data Table - Interactive tabular data */
  DATA_TABLE: 'DATA_TABLE',

  /** Metric Comparison - Side by side metrics */
  METRIC_COMPARISON: 'METRIC_COMPARISON',

  // ─────────────────────────────────────────────────────────────────────────
  // STRATEGIST - Competitive Intel & SEO Components
  // ─────────────────────────────────────────────────────────────────────────

  /** Web Search Results - Sourced intelligence */
  WEB_SEARCH_RESULT: 'WEB_SEARCH_RESULT',

  /** SERP Analysis - Search position insights */
  SERP_ANALYSIS: 'SERP_ANALYSIS',

  /** Competitor Intel Card - Competitive movements */
  COMPETITOR_INTEL: 'COMPETITOR_INTEL',

  /** Algorithm Alert - Google update warnings */
  ALGORITHM_ALERT: 'ALGORITHM_ALERT',

  // ─────────────────────────────────────────────────────────────────────────
  // CREATIVE - Content & Ad Components
  // ─────────────────────────────────────────────────────────────────────────

  /** Ad Preview - Full ad mockup with platform context */
  AD_PREVIEW: 'AD_PREVIEW',

  /** Battle Card - A/B variant comparison with selection */
  BATTLE_CARD: 'BATTLE_CARD',

  /** Copy Variants - Text alternatives list */
  COPY_VARIANTS: 'COPY_VARIANTS',

  /** Image Gallery - Generated visuals grid */
  IMAGE_GALLERY: 'IMAGE_GALLERY',

  /** Brand Voice Check - Tone/style compliance */
  BRAND_VOICE_CHECK: 'BRAND_VOICE_CHECK',

  // ─────────────────────────────────────────────────────────────────────────
  // TRADER - Campaign & Budget Components
  // ─────────────────────────────────────────────────────────────────────────

  /** Campaign Card - Campaign summary */
  CAMPAIGN_CARD: 'CAMPAIGN_CARD',

  /** Budget Allocation - Treemap/Sunburst of spend */
  BUDGET_ALLOCATION: 'BUDGET_ALLOCATION',

  /** Bid Recommendation - Suggested bid adjustments */
  BID_RECOMMENDATION: 'BID_RECOMMENDATION',

  // ─────────────────────────────────────────────────────────────────────────
  // SYSTEM - Universal Components
  // ─────────────────────────────────────────────────────────────────────────

  /** Action Buttons - Approve/Reject/Deploy actions */
  ACTION_BUTTONS: 'ACTION_BUTTONS',

  /** Loading State */
  LOADING: 'LOADING',

  /** Error Display */
  ERROR: 'ERROR',

  /** Empty State */
  EMPTY_STATE: 'EMPTY_STATE',

  /** Approval Request - Human in the loop */
  APPROVAL_REQUEST: 'APPROVAL_REQUEST'
};

// ============================================================================
// COMPONENT SCHEMAS (Data Contracts)
// ============================================================================

const COMPONENT_SCHEMAS = {

  // ─────────────────────────────────────────────────────────────────────────
  // KPI_CARD
  // ─────────────────────────────────────────────────────────────────────────
  KPI_CARD: {
    required: ['title', 'value'],
    properties: {
      title: 'string',           // "Sessions", "ROAS", "CPA"
      value: 'number',           // Raw numeric value
      formatted_value: 'string', // Display format: "12,450", "3.2x", "€45"
      unit: 'string',            // "%", "€", "x"
      trend: {
        direction: 'up|down|stable',
        value: 'number',         // Percentage change
        period: 'string',        // "vs 7j", "vs M-1"
        is_positive: 'boolean'   // Green or Red indicator
      },
      sparkline: 'number[]',     // Mini chart data (7-14 points)
      benchmark: {
        value: 'number',
        label: 'string',
        status: 'above|below|at'
      },
      drill_down_action: 'string' // Click action ID
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CHART_WIDGET
  // ─────────────────────────────────────────────────────────────────────────
  CHART_WIDGET: {
    required: ['chart_type', 'data'],
    properties: {
      title: 'string',
      chart_type: 'line|bar|area|pie|donut|combo',
      data: {
        labels: 'string[]',      // X-axis or segments
        datasets: [{
          label: 'string',
          data: 'number[]',
          color: 'string'
        }]
      },
      options: {
        show_legend: 'boolean',
        show_grid: 'boolean',
        stacked: 'boolean',
        y_axis_format: 'string'  // "currency", "percent"
      }
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // AD_PREVIEW
  // ─────────────────────────────────────────────────────────────────────────
  AD_PREVIEW: {
    required: ['platform', 'format', 'headline', 'primary_text'],
    properties: {
      platform: 'meta|google|tiktok|linkedin|pinterest',
      format: 'feed|story|reel|carousel|search|display|video',
      image_url: 'string',
      video_url: 'string',
      headline: 'string',        // Max 40 chars for Meta
      primary_text: 'string',    // Max 125 chars recommended
      description: 'string',
      cta: 'learn_more|shop_now|sign_up|contact_us|book_now|download|get_offer',
      destination_url: 'string',
      // EXPERT FIELDS (Persona-Aware)
      target_persona: 'string',  // Persona ID from memory
      creative_rationale: 'string',
      trigger_used: 'string'     // "urgency", "social_proof"
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // BATTLE_CARD (A/B Comparison)
  // ─────────────────────────────────────────────────────────────────────────
  BATTLE_CARD: {
    required: ['variants', 'selection_prompt'],
    properties: {
      title: 'string',
      test_hypothesis: 'string', // What we're testing
      variants: [{
        id: 'string',
        name: 'string',          // "Control", "Variant A"
        badge: 'control|challenger|recommended|new',
        preview: {
          image_url: 'string',
          headline: 'string',
          primary_text: 'string',
          cta: 'string'
        },
        metrics: {               // If test is running
          impressions: 'number',
          clicks: 'number',
          ctr: 'number',
          conversions: 'number'
        },
        rationale: 'string'
      }],
      selection_prompt: 'string',
      agent_recommendation: {
        recommended_variant_id: 'string',
        reason: 'string',
        confidence: 'number'     // 0-1
      }
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // WEB_SEARCH_RESULT (Strategist Intelligence)
  // ─────────────────────────────────────────────────────────────────────────
  WEB_SEARCH_RESULT: {
    required: ['query', 'results'],
    properties: {
      query: 'string',
      searched_at: 'datetime',
      summary: 'string',         // Agent's synthesis
      results: [{
        title: 'string',
        url: 'string',
        snippet: 'string',
        source_type: 'competitor|news|blog|official|social|tool',
        relevance_score: 'number', // 0-1
        published_date: 'string',
        tags: 'string[]'
      }],
      key_insights: [{
        insight: 'string',
        category: 'trend|competitor_move|opportunity|threat|fact',
        source_index: 'number'
      }],
      suggested_actions: 'string[]'
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // COMPETITOR_INTEL
  // ─────────────────────────────────────────────────────────────────────────
  COMPETITOR_INTEL: {
    required: ['competitor_name', 'analysis'],
    properties: {
      competitor_name: 'string',
      competitor_url: 'string',
      scanned_at: 'datetime',
      domain_authority: 'number',
      analysis: {
        strengths: ['string'],
        weaknesses: ['string'],  // OUR OPPORTUNITIES
        content_gaps: ['string'],
        technical_issues: ['string']
      },
      our_advantages: ['string'],
      recommended_strategy: 'string'
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ACTION_BUTTONS
  // ─────────────────────────────────────────────────────────────────────────
  ACTION_BUTTONS: {
    required: ['actions'],
    properties: {
      layout: 'horizontal|vertical|grid',
      actions: [{
        id: 'string',
        label: 'string',
        icon: 'string',
        action_type: 'approve|reject|edit|deploy|schedule|navigate|download',
        variant: 'primary|secondary|danger|ghost',
        payload: 'object',
        confirmation_required: 'boolean',
        confirmation_message: 'string'
      }]
    }
  }
};

// ============================================================================
// MAIN RESPONSE SCHEMA
// ============================================================================

const UI_RESPONSE_SCHEMA = {
  required: ['thought_process', 'chat_message', 'ui_components', 'meta'],

  properties: {
    // ─────────────────────────────────────────────────────────────────────────
    // THOUGHT PROCESS (Agent Reasoning - for logs/debug)
    // ─────────────────────────────────────────────────────────────────────────
    thought_process: {
      step: 'string',            // Current step description
      reasoning: 'string',       // Detailed reasoning
      tools_used: 'string[]',    // MCP tools invoked
      data_sources: 'string[]',  // Data sources consulted
      confidence: 'number',      // 0-1 confidence level
      persona_context: 'string', // Active persona from memory
      learnings_applied: 'string[]' // Brand learnings used
    },

    // ─────────────────────────────────────────────────────────────────────────
    // CHAT MESSAGE (Text bubble - Left Panel)
    // ─────────────────────────────────────────────────────────────────────────
    chat_message: {
      content: 'string',         // Markdown supported
      tone: 'neutral|positive|warning|critical|suggestion',
      follow_up_questions: 'string[]' // Max 3 suggestions
    },

    // ─────────────────────────────────────────────────────────────────────────
    // UI COMPONENTS (Visual widgets - Right Panel)
    // ─────────────────────────────────────────────────────────────────────────
    ui_components: [{
      type: 'UI_COMPONENT_TYPE',  // From UI_COMPONENTS enum
      data: 'object',             // Schema from COMPONENT_SCHEMAS
      layout: {
        width: 'full|half|third|quarter',
        order: 'number'
      }
    }],

    // ─────────────────────────────────────────────────────────────────────────
    // METADATA
    // ─────────────────────────────────────────────────────────────────────────
    meta: {
      agent_id: 'orchestrator|analyst|strategist|creative|trader',
      timestamp: 'datetime',
      request_id: 'string',
      session_id: 'string',
      brand_id: 'string',
      processing_time_ms: 'number'
    }
  }
};

// ============================================================================
// FACTORY FUNCTIONS (For n8n Code Nodes)
// ============================================================================

/**
 * Creates a complete UI Response object.
 * Copy this function into your n8n Code Node.
 */
function createUIResponse({
  agentId,
  thought,
  message,
  components = [],
  tone = 'neutral',
  followUpQuestions = [],
  brandId = null,
  sessionId = null,
  requestId = null
}) {
  return {
    thought_process: {
      step: thought.step || 'Processing',
      reasoning: thought.reasoning || '',
      tools_used: thought.tools || [],
      data_sources: thought.sources || [],
      confidence: thought.confidence || 0.8,
      persona_context: thought.persona || null,
      learnings_applied: thought.learnings || []
    },
    chat_message: {
      content: message,
      tone: tone,
      follow_up_questions: followUpQuestions.slice(0, 3)
    },
    ui_components: components,
    meta: {
      agent_id: agentId,
      timestamp: new Date().toISOString(),
      request_id: requestId || `req_${Date.now()}`,
      session_id: sessionId || `session_${Date.now()}`,
      brand_id: brandId
    }
  };
}

/**
 * Creates a KPI Card component.
 */
function createKpiCard({
  title,
  value,
  unit = '',
  trend = null,
  sparkline = null,
  benchmark = null,
  width = 'quarter'
}) {
  return {
    type: UI_COMPONENTS.KPI_CARD,
    data: {
      title,
      value,
      formatted_value: formatValue(value, unit),
      unit,
      trend,
      sparkline,
      benchmark
    },
    layout: { width }
  };
}

/**
 * Creates a Chart Widget component.
 */
function createChartWidget({
  title,
  chartType,
  labels,
  datasets,
  options = {},
  width = 'half'
}) {
  return {
    type: UI_COMPONENTS.CHART_WIDGET,
    data: {
      title,
      chart_type: chartType,
      data: { labels, datasets },
      options: {
        show_legend: options.showLegend ?? true,
        show_grid: options.showGrid ?? true,
        stacked: options.stacked ?? false,
        y_axis_format: options.yAxisFormat
      }
    },
    layout: { width }
  };
}

/**
 * Creates an Ad Preview component.
 */
function createAdPreview({
  platform,
  format,
  imageUrl,
  headline,
  primaryText,
  cta,
  persona = null,
  trigger = null,
  rationale = null,
  width = 'half'
}) {
  return {
    type: UI_COMPONENTS.AD_PREVIEW,
    data: {
      platform,
      format,
      image_url: imageUrl,
      headline,
      primary_text: primaryText,
      cta,
      target_persona: persona,
      trigger_used: trigger,
      creative_rationale: rationale
    },
    layout: { width }
  };
}

/**
 * Creates a Battle Card for A/B comparison.
 */
function createBattleCard({
  title,
  hypothesis,
  variants,
  recommendation = null,
  width = 'full'
}) {
  return {
    type: UI_COMPONENTS.BATTLE_CARD,
    data: {
      title: title || 'Choose your variant',
      test_hypothesis: hypothesis,
      variants: variants.map((v, i) => ({
        id: v.id || `variant_${i}`,
        name: v.name || (i === 0 ? 'Control' : `Variant ${String.fromCharCode(65 + i - 1)}`),
        badge: v.badge || (i === 0 ? 'control' : 'challenger'),
        preview: v.preview,
        metrics: v.metrics || null,
        rationale: v.rationale
      })),
      selection_prompt: 'Which variant do you prefer?',
      agent_recommendation: recommendation
    },
    layout: { width }
  };
}

/**
 * Creates a Web Search Result component.
 */
function createWebSearchResult({
  query,
  results,
  summary,
  insights = [],
  actions = [],
  width = 'full'
}) {
  return {
    type: UI_COMPONENTS.WEB_SEARCH_RESULT,
    data: {
      query,
      searched_at: new Date().toISOString(),
      summary,
      results,
      key_insights: insights,
      suggested_actions: actions
    },
    layout: { width }
  };
}

/**
 * Creates a Competitor Intel component.
 */
function createCompetitorIntel({
  name,
  url,
  domainAuthority,
  strengths,
  weaknesses,
  contentGaps,
  ourAdvantages,
  strategy,
  width = 'full'
}) {
  return {
    type: UI_COMPONENTS.COMPETITOR_INTEL,
    data: {
      competitor_name: name,
      competitor_url: url,
      scanned_at: new Date().toISOString(),
      domain_authority: domainAuthority,
      analysis: {
        strengths,
        weaknesses,
        content_gaps: contentGaps,
        technical_issues: []
      },
      our_advantages: ourAdvantages,
      recommended_strategy: strategy
    },
    layout: { width }
  };
}

/**
 * Creates Action Buttons component.
 */
function createActionButtons({
  actions,
  layout = 'horizontal'
}) {
  return {
    type: UI_COMPONENTS.ACTION_BUTTONS,
    data: {
      layout,
      actions: actions.map(a => ({
        id: a.id,
        label: a.label,
        icon: a.icon || null,
        action_type: a.type,
        variant: a.variant || 'secondary',
        payload: a.payload || {},
        confirmation_required: a.confirm || false,
        confirmation_message: a.confirmMessage || null
      }))
    },
    layout: { width: 'full' }
  };
}

/**
 * Creates an Error component.
 */
function createError({ title, message, errorCode, retryAction }) {
  return {
    type: UI_COMPONENTS.ERROR,
    data: {
      title,
      message,
      error_code: errorCode,
      retry_action: retryAction
    },
    layout: { width: 'full' }
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatValue(value, unit) {
  if (typeof value !== 'number') return String(value);

  const formatted = value.toLocaleString('fr-FR');

  switch (unit) {
    case '€':
      return `${formatted} €`;
    case '%':
      return `${formatted}%`;
    case 'x':
      return `${formatted}x`;
    default:
      return unit ? `${formatted} ${unit}` : formatted;
  }
}

// ============================================================================
// EXPORTS (For Module Usage - Optional)
// ============================================================================

// For Node.js/CommonJS environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    // Enums
    UI_COMPONENTS,
    COMPONENT_SCHEMAS,
    UI_RESPONSE_SCHEMA,

    // Factory Functions
    createUIResponse,
    createKpiCard,
    createChartWidget,
    createAdPreview,
    createBattleCard,
    createWebSearchResult,
    createCompetitorIntel,
    createActionButtons,
    createError,

    // Helpers
    formatValue
  };
}

// ============================================================================
// N8N CODE NODE TEMPLATE
// ============================================================================
/*
 * Copy this template into your n8n Code Node to use the schema:
 *
 * // Paste UI_COMPONENTS and factory functions here
 *
 * // Then use:
 * const response = createUIResponse({
 *   agentId: 'analyst',
 *   thought: {
 *     step: 'Analyzing metrics',
 *     reasoning: 'Comparing current vs target ROAS',
 *     tools: ['tool_ga4_metrics'],
 *     confidence: 0.85
 *   },
 *   message: '**ROAS Analysis**\n\nYour ROAS is 3.2x, above target.',
 *   components: [
 *     createKpiCard({ title: 'ROAS', value: 3.2, unit: 'x' })
 *   ],
 *   tone: 'positive',
 *   followUpQuestions: ['See breakdown by channel?']
 * });
 *
 * return { json: response };
 */
