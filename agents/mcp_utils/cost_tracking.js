/**
 * COST TRACKING & BUDGET MANAGEMENT - THE HIVE OS V4
 *
 * Tracks API usage, enforces quotas, prevents budget overruns
 *
 * Architecture: Pay-per-use with quotas
 * - Each API call costs credits (10 = 1 image, 100 = 1 video)
 * - Users have monthly credit limits based on plan
 * - Automatic blocking when quota exceeded
 * - Real-time usage tracking
 *
 * @module cost_tracking
 * @version 1.0.0
 * @date 2026-02-19
 */

// ═══════════════════════════════════════════════════════════════════════════
// COST MAP - Prix par opération
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Coût en crédits et USD pour chaque opération API
 *
 * Sources de prix (approximatifs):
 * - Imagen 3 Fast: ~$0.04/image (via Vertex AI)
 * - VEO-2: ~$0.12/video (5s) via Vertex AI
 * - ElevenLabs: ~$0.03/1000 chars
 * - OpenAI GPT-4o: ~$0.005/1K tokens (input) + $0.015/1K tokens (output)
 * - Anthropic Claude Opus 4.5: ~$0.015/1K tokens (input) + $0.075/1K tokens (output)
 */
export const COST_MAP = {
  // ─────────────────────────────────────────────────────────────────────────
  // MILO - Creative Operations
  // ─────────────────────────────────────────────────────────────────────────

  // Images (Nano Banana Pro MCP = Imagen 3 Fast)
  generate_image: {
    credits: 10,
    cost_usd: 0.04,
    provider: 'nano-banana-pro',
    model: 'imagen-3-fast',
    description: 'Génération image 1024x1024'
  },

  generate_image_hd: {
    credits: 15,
    cost_usd: 0.06,
    provider: 'nano-banana-pro',
    model: 'imagen-3-standard',
    description: 'Génération image HD 2048x2048'
  },

  // Videos (VEO-3 MCP Server)
  generate_video: {
    credits: 100,
    cost_usd: 0.12,
    provider: 'veo-3',
    model: 'veo-2',
    description: 'Génération vidéo 5 secondes'
  },

  generate_video_long: {
    credits: 250,
    cost_usd: 0.30,
    provider: 'veo-3',
    model: 'veo-2',
    description: 'Génération vidéo 10-15 secondes'
  },

  // Audio (ElevenLabs MCP)
  text_to_speech: {
    credits: 5,
    cost_usd: 0.03,
    provider: 'elevenlabs',
    model: 'eleven_multilingual_v2',
    description: 'Text-to-speech ~1000 caractères'
  },

  // ─────────────────────────────────────────────────────────────────────────
  // LLM Calls (pour copywriting, stratégie, etc.)
  // ─────────────────────────────────────────────────────────────────────────

  // OpenAI GPT-4o (copywriting Milo, analyses Sora)
  llm_call_gpt4o: {
    credits: 2, // ~1000 tokens total (input + output)
    cost_usd: 0.01,
    provider: 'openai',
    model: 'gpt-4o',
    description: 'Appel LLM GPT-4o (1K tokens)'
  },

  llm_call_gpt4o_long: {
    credits: 10, // ~5000 tokens total
    cost_usd: 0.05,
    provider: 'openai',
    model: 'gpt-4o',
    description: 'Appel LLM GPT-4o long (5K tokens)'
  },

  // Anthropic Claude Opus 4.5 (PM Brain, stratégie complexe)
  llm_call_claude_opus: {
    credits: 5, // ~1000 tokens total
    cost_usd: 0.045,
    provider: 'anthropic',
    model: 'claude-opus-4.5',
    description: 'Appel LLM Claude Opus (1K tokens)'
  },

  llm_call_claude_opus_long: {
    credits: 25, // ~5000 tokens total
    cost_usd: 0.225,
    provider: 'anthropic',
    model: 'claude-opus-4.5',
    description: 'Appel LLM Claude Opus long (5K tokens)'
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SORA - Analytics Operations (API calls Meta Ads, Google Analytics)
  // ─────────────────────────────────────────────────────────────────────────

  meta_ads_api_call: {
    credits: 1,
    cost_usd: 0.00, // Gratuit mais on track quand même
    provider: 'meta',
    model: 'marketing-api',
    description: 'Appel API Meta Ads (insights)'
  },

  google_analytics_api_call: {
    credits: 1,
    cost_usd: 0.00, // Gratuit
    provider: 'google',
    model: 'analytics-data-api',
    description: 'Appel API Google Analytics 4'
  },

  // ─────────────────────────────────────────────────────────────────────────
  // MARCUS - Trading Operations (API calls pour lancer campagnes)
  // ─────────────────────────────────────────────────────────────────────────

  launch_meta_campaign: {
    credits: 2,
    cost_usd: 0.00, // Gratuit
    provider: 'meta',
    model: 'marketing-api',
    description: 'Lancement campagne Meta Ads'
  },

  launch_google_campaign: {
    credits: 2,
    cost_usd: 0.00, // Gratuit
    provider: 'google',
    model: 'ads-api',
    description: 'Lancement campagne Google Ads'
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Get cost for operation
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Récupère le coût d'une opération
 *
 * @param {string} operation - Nom de l'opération (ex: generate_image)
 * @returns {Object} { credits, cost_usd, provider, model, description }
 */
export function getOperationCost(operation) {
  return COST_MAP[operation] || {
    credits: 1,
    cost_usd: 0.00,
    provider: 'unknown',
    model: 'unknown',
    description: 'Opération inconnue'
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN FUNCTION: Check Quota Before API Call
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Vérifie si l'utilisateur a suffisamment de quota avant d'exécuter une opération API
 *
 * ⚠️ CRITIQUE: Appeler AVANT chaque call API coûteux (images, vidéos, audio)
 * ⚠️ SECURITY: Uses authenticated user from JWT token (auth.uid())
 *
 * @param {string} operation - Operation name (ex: generate_image)
 * @param {Object} supabase - Supabase client (authenticated)
 * @returns {Promise<Object>} { allowed: boolean, error?, credits_remaining?, usage_percent? }
 *
 * @example
 * const check = await checkQuotaBeforeOperation('generate_image', supabase);
 * if (!check.allowed) {
 *   return { error: check.error_message, quota_exceeded: true };
 * }
 * // Proceed with API call...
 */
export async function checkQuotaBeforeOperation(operation, supabase) {
  try {
    const cost = getOperationCost(operation);

    // Call Supabase function (uses auth.uid() from JWT token)
    const { data, error } = await supabase.rpc('check_quota_before_operation', {
      p_operation: operation,
      p_credits_required: cost.credits
    });

    if (error) {
      return {
        allowed: false,
        error_code: 'DATABASE_ERROR',
        error_message: 'Erreur lors de la vérification du quota',
        details: error.message
      };
    }

    // Data is an array with single row
    const result = Array.isArray(data) ? data[0] : data;

    return {
      allowed: result.allowed,
      error_code: result.error_code,
      error_message: result.error_message,
      credits_remaining: result.credits_remaining,
      usage_percent: result.usage_percent,
      operation_cost: cost.credits
    };

  } catch (error) {
    return {
      allowed: false,
      error_code: 'UNEXPECTED_ERROR',
      error_message: 'Erreur inattendue lors de la vérification du quota',
      details: error.message
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN FUNCTION: Track API Usage After Call
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Enregistre l'utilisation d'une API après un appel réussi
 *
 * ⚠️ CRITIQUE: Appeler APRÈS chaque call API pour tracker l'usage et déduire les crédits
 * ⚠️ SECURITY: Uses authenticated user from JWT token (auth.uid())
 *
 * @param {Object} params - Usage parameters
 * @param {string} params.projectId - Project UUID
 * @param {string} params.taskId - Task UUID
 * @param {string} params.agentId - Agent ID (luna, milo, marcus, sora)
 * @param {string} params.operation - Operation name
 * @param {Object} params.requestParams - Request parameters (prompt, size, etc.)
 * @param {Object} params.responseMetadata - Response metadata (url, duration, tokens)
 * @param {string} params.status - 'success' or 'failed'
 * @param {string} params.errorMessage - Error message if failed
 * @param {Object} params.supabase - Supabase client (authenticated)
 * @returns {Promise<Object>} { success: boolean, usage_id?: UUID, error? }
 *
 * @example
 * const usage = await trackAPIUsage({
 *   projectId: project.id,
 *   taskId: task.id,
 *   agentId: 'milo',
 *   operation: 'generate_image',
 *   requestParams: { prompt: 'A cat', size: '1024x1024' },
 *   responseMetadata: { url: 'https://...', duration_ms: 2500 },
 *   status: 'success',
 *   supabase
 * });
 */
export async function trackAPIUsage({
  projectId,
  taskId,
  agentId,
  operation,
  requestParams = {},
  responseMetadata = {},
  status = 'success',
  errorMessage = null,
  supabase
}) {
  try {
    const cost = getOperationCost(operation);

    // Call Supabase function (uses auth.uid() from JWT token)
    const { data, error } = await supabase.rpc('record_api_usage', {
      p_project_id: projectId,
      p_task_id: taskId,
      p_agent_id: agentId,
      p_operation: operation,
      p_provider: cost.provider,
      p_model: cost.model,
      p_credits_consumed: cost.credits,
      p_cost_usd: cost.cost_usd,
      p_request_params: requestParams,
      p_response_metadata: responseMetadata,
      p_status: status,
      p_error_message: errorMessage
    });

    if (error) {
      console.error('[Cost Tracking] Failed to record usage:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      usage_id: data,
      credits_consumed: cost.credits,
      cost_usd: cost.cost_usd
    };

  } catch (error) {
    console.error('[Cost Tracking] Unexpected error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTION: Get Current Usage
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Récupère l'usage actuel de l'utilisateur
 *
 * ⚠️ SECURITY: Uses authenticated user from JWT token (auth.uid())
 *
 * @param {Object} supabase - Supabase client (authenticated)
 * @returns {Promise<Object>} Usage stats
 *
 * @example
 * const usage = await getCurrentUsage(supabase);
 * console.log(`Credits restants: ${usage.credits_remaining}`);
 * console.log(`Usage: ${usage.usage_percent}%`);
 */
export async function getCurrentUsage(supabase) {
  try {
    // Call Supabase function (uses auth.uid() from JWT token)
    const { data, error } = await supabase.rpc('get_current_usage');

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    // Data is an array with single row
    const usage = Array.isArray(data) ? data[0] : data;

    return {
      success: true,
      plan_type: usage.plan_type,
      plan_status: usage.plan_status,
      monthly_credits_limit: usage.monthly_credits_limit,
      current_month_credits_used: usage.current_month_credits_used,
      credits_remaining: usage.credits_remaining,
      usage_percent: usage.usage_percent,
      current_day_images: usage.current_day_images,
      current_day_videos: usage.current_day_videos,
      current_day_audio: usage.current_day_audio,
      can_generate_image: usage.can_generate_image,
      can_generate_video: usage.can_generate_video,
      can_generate_audio: usage.can_generate_audio,
      billing_cycle_days_remaining: usage.billing_cycle_days_remaining
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// WRAPPER FUNCTIONS: Simplified usage for MCP servers
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Workflow complet: Check quota → Execute API call → Track usage
 *
 * Cette fonction wrapper simplifie l'intégration dans les MCP servers
 *
 * ⚠️ SECURITY: Uses authenticated user from JWT token (auth.uid())
 *
 * @param {Object} params - Parameters
 * @param {string} params.projectId - Project UUID
 * @param {string} params.taskId - Task UUID
 * @param {string} params.agentId - Agent ID
 * @param {string} params.operation - Operation name
 * @param {Function} params.apiCallFunction - Async function that makes the API call
 * @param {Object} params.requestParams - Request parameters
 * @param {Object} params.supabase - Supabase client (authenticated)
 * @returns {Promise<Object>} { success, result?, error?, quota_exceeded? }
 *
 * @example
 * const result = await executeWithCostTracking({
 *   projectId: project.id,
 *   taskId: task.id,
 *   agentId: 'milo',
 *   operation: 'generate_image',
 *   apiCallFunction: async () => {
 *     return await imagenClient.generateImage({ prompt: 'A cat' });
 *   },
 *   requestParams: { prompt: 'A cat', size: '1024x1024' },
 *   supabase
 * });
 *
 * if (!result.success) {
 *   if (result.quota_exceeded) {
 *     return { error: 'Quota exceeded', upgrade_required: true };
 *   }
 *   return { error: result.error };
 * }
 *
 * return { image_url: result.result.url };
 */
export async function executeWithCostTracking({
  projectId,
  taskId,
  agentId,
  operation,
  apiCallFunction,
  requestParams = {},
  supabase
}) {
  // ─────────────────────────────────────────────────────────────────────────
  // 1. Check quota BEFORE API call
  // ─────────────────────────────────────────────────────────────────────────
  const quotaCheck = await checkQuotaBeforeOperation(operation, supabase);

  if (!quotaCheck.allowed) {
    // Track failed attempt due to quota
    await trackAPIUsage({
      projectId,
      taskId,
      agentId,
      operation,
      requestParams,
      responseMetadata: {},
      status: 'quota_exceeded',
      errorMessage: quotaCheck.error_message,
      supabase
    });

    return {
      success: false,
      quota_exceeded: true,
      error_code: quotaCheck.error_code,
      error: quotaCheck.error_message,
      credits_remaining: quotaCheck.credits_remaining,
      usage_percent: quotaCheck.usage_percent
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Execute API call
  // ─────────────────────────────────────────────────────────────────────────
  const startTime = Date.now();
  let apiResult;
  let apiError = null;

  try {
    apiResult = await apiCallFunction();
  } catch (error) {
    apiError = error;
  }

  const duration = Date.now() - startTime;

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Track usage AFTER API call
  // ─────────────────────────────────────────────────────────────────────────
  const responseMetadata = {
    duration_ms: duration,
    ...(apiResult || {}),
    error: apiError ? apiError.message : null
  };

  await trackAPIUsage({
    projectId,
    taskId,
    agentId,
    operation,
    requestParams,
    responseMetadata,
    status: apiError ? 'failed' : 'success',
    errorMessage: apiError ? apiError.message : null,
    supabase
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 4. Return result
  // ─────────────────────────────────────────────────────────────────────────
  if (apiError) {
    return {
      success: false,
      error: apiError.message,
      api_error: true
    };
  }

  return {
    success: true,
    result: apiResult,
    duration_ms: duration,
    credits_consumed: quotaCheck.operation_cost
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// USAGE ALERT HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Récupère les alertes non lues de l'utilisateur
 *
 * ⚠️ SECURITY: Uses RLS to filter by authenticated user (auth.uid())
 *
 * @param {Object} supabase - Supabase client (authenticated)
 * @returns {Promise<Object>} { alerts: Array, unread_count: number }
 */
export async function getUnreadAlerts(supabase) {
  try {
    // RLS policy automatically filters by auth.uid()
    const { data, error } = await supabase
      .from('usage_alerts')
      .select('*')
      .eq('notification_sent', false)
      .order('created_at', { ascending: false });

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      alerts: data || [],
      unread_count: (data || []).length
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Marque une alerte comme lue
 *
 * @param {string} alertId - Alert UUID
 * @param {Object} supabase - Supabase client
 * @returns {Promise<Object>} { success: boolean }
 */
export async function markAlertAsRead(alertId, supabase) {
  try {
    const { error } = await supabase
      .from('usage_alerts')
      .update({
        notification_sent: true,
        notification_sent_at: new Date().toISOString()
      })
      .eq('id', alertId);

    if (error) {
      return {
        success: false,
        error: error.message
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
