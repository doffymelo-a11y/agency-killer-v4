// ============================================================
// MCP SERVER: META ADS MANAGER
// Gère Meta Ads en LECTURE SEULE - Analyse performances, Learning Phase
// API: Facebook Marketing API v19.0
// ⚠️ PAS de lancement de campagnes (rôle de Marcus)
// ============================================================

/**
 * @typedef {Object} MetaAdsCredentials
 * @property {string} access_token - Meta OAuth2 access token
 * @property {string} app_id - Facebook App ID
 * @property {string} app_secret - Facebook App Secret
 */

/**
 * @typedef {Object} MetaAdsFunctionInput
 * @property {string} function_name - Nom de la fonction à appeler
 * @property {Object} parameters - Paramètres de la fonction
 * @property {MetaAdsCredentials} credentials - Credentials OAuth2
 */

const META_API_VERSION = 'v19.0';
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

// ═══════════════════════════════════════════════════════════════
// FONCTION PRINCIPALE: Router
// ═══════════════════════════════════════════════════════════════

async function meta_ads_manager(input) {
  const { function_name, parameters, credentials } = input;

  if (!credentials || !credentials.access_token) {
    return {
      success: false,
      error: 'Access token manquant. Connecter Meta Ads OAuth2 dans Intégrations.'
    };
  }

  try {
    switch (function_name) {
      case 'get_ad_accounts':
        return await getAdAccounts(credentials, parameters);
      case 'get_campaigns':
        return await getCampaigns(credentials, parameters);
      case 'get_insights':
        return await getInsights(credentials, parameters);
      case 'get_ad_sets':
        return await getAdSets(credentials, parameters);
      case 'check_learning_phase':
        return await checkLearningPhase(credentials, parameters);
      case 'get_pixel_events':
        return await getPixelEvents(credentials, parameters);
      case 'get_audience_overlap':
        return await getAudienceOverlap(credentials, parameters);
      default:
        return {
          success: false,
          error: `Fonction inconnue: ${function_name}`
        };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Erreur inconnue',
      details: error.toString()
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPER: Faire un appel Meta API
// ═══════════════════════════════════════════════════════════════

async function metaApiCall(credentials, endpoint, params = {}) {
  const queryParams = new URLSearchParams({
    access_token: credentials.access_token,
    ...params
  });

  const url = `${META_API_BASE}/${endpoint}?${queryParams.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    return {
      success: false,
      error: `Meta API Error: ${response.status}`,
      details: errorData.error
    };
  }

  const data = await response.json();
  return {
    success: true,
    data: data
  };
}

// ═══════════════════════════════════════════════════════════════
// 1. GET AD ACCOUNTS
// ═══════════════════════════════════════════════════════════════

async function getAdAccounts(credentials, params) {
  // Lister les comptes publicitaires accessibles
  const userId = params.user_id || 'me';

  const result = await metaApiCall(credentials, `${userId}/adaccounts`, {
    fields: 'id,name,currency,account_status,timezone_name,amount_spent,balance,business'
  });

  if (!result.success) {
    return result;
  }

  const accounts = result.data.data || [];

  return {
    success: true,
    function: 'get_ad_accounts',
    output: {
      accounts: accounts.map(account => ({
        ad_account_id: account.id,
        name: account.name,
        currency: account.currency,
        status: account.account_status,
        timezone: account.timezone_name,
        amount_spent: account.amount_spent,
        balance: account.balance,
        business: account.business
      })),
      count: accounts.length
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// 2. GET CAMPAIGNS
// ═══════════════════════════════════════════════════════════════

async function getCampaigns(credentials, params) {
  const { ad_account_id, date_range } = params;

  if (!ad_account_id) {
    return { success: false, error: 'ad_account_id requis' };
  }

  // Construire time_range
  const timeRange = date_range || { since: '2026-02-03', until: '2026-02-10' }; // Last 7 days

  const result = await metaApiCall(credentials, `${ad_account_id}/campaigns`, {
    fields: 'id,name,status,objective,daily_budget,lifetime_budget,buying_type,bid_strategy,created_time,updated_time',
    time_range: JSON.stringify(timeRange)
  });

  if (!result.success) {
    return result;
  }

  const campaigns = result.data.data || [];

  return {
    success: true,
    function: 'get_campaigns',
    output: {
      campaigns: campaigns.map(campaign => ({
        campaign_id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        objective: campaign.objective,
        daily_budget: campaign.daily_budget ? parseFloat(campaign.daily_budget) / 100 : null,
        lifetime_budget: campaign.lifetime_budget ? parseFloat(campaign.lifetime_budget) / 100 : null,
        buying_type: campaign.buying_type,
        bid_strategy: campaign.bid_strategy,
        created_at: campaign.created_time,
        updated_at: campaign.updated_time
      })),
      count: campaigns.length,
      date_range: timeRange
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// 3. GET INSIGHTS (Performance Data)
// ═══════════════════════════════════════════════════════════════

async function getInsights(credentials, params) {
  const { object_id, object_type, metrics, date_range, breakdown } = params;

  if (!object_id) {
    return { success: false, error: 'object_id requis (campaign, ad_set, ou ad)' };
  }

  // Métriques par défaut
  const defaultMetrics = [
    'impressions',
    'clicks',
    'spend',
    'ctr',
    'cpc',
    'cpm',
    'reach',
    'frequency',
    'conversions',
    'cost_per_conversion',
    'conversion_rate'
  ];

  const fieldsToFetch = metrics || defaultMetrics;

  // Time range
  const timeRange = date_range || { since: '2026-02-03', until: '2026-02-10' };

  // Breakdown (ex: age, gender, platform, device, etc.)
  const breakdownsParam = breakdown ? { breakdowns: breakdown } : {};

  const result = await metaApiCall(credentials, `${object_id}/insights`, {
    fields: fieldsToFetch.join(','),
    time_range: JSON.stringify(timeRange),
    ...breakdownsParam
  });

  if (!result.success) {
    return result;
  }

  const insights = result.data.data || [];

  return {
    success: true,
    function: 'get_insights',
    output: {
      insights: insights.map(row => ({
        date_start: row.date_start,
        date_stop: row.date_stop,
        impressions: parseInt(row.impressions || 0),
        clicks: parseInt(row.clicks || 0),
        spend: parseFloat(row.spend || 0),
        ctr: parseFloat(row.ctr || 0),
        cpc: parseFloat(row.cpc || 0),
        cpm: parseFloat(row.cpm || 0),
        reach: parseInt(row.reach || 0),
        frequency: parseFloat(row.frequency || 0),
        conversions: parseInt(row.conversions || 0),
        cost_per_conversion: parseFloat(row.cost_per_conversion || 0),
        conversion_rate: parseFloat(row.conversion_rate || 0),
        breakdown: breakdown ? row : null
      })),
      count: insights.length,
      object_id: object_id,
      object_type: object_type || 'campaign',
      date_range: timeRange
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// 4. GET AD SETS
// ═══════════════════════════════════════════════════════════════

async function getAdSets(credentials, params) {
  const { campaign_id, include_insights } = params;

  if (!campaign_id) {
    return { success: false, error: 'campaign_id requis' };
  }

  const fieldsBase = 'id,name,status,optimization_goal,billing_event,bid_amount,daily_budget,lifetime_budget,start_time,end_time,targeting,created_time,updated_time';
  const fieldsWithInsights = include_insights ? `${fieldsBase},insights{impressions,clicks,spend,ctr,cpc,conversions}` : fieldsBase;

  const result = await metaApiCall(credentials, `${campaign_id}/adsets`, {
    fields: fieldsWithInsights
  });

  if (!result.success) {
    return result;
  }

  const adSets = result.data.data || [];

  return {
    success: true,
    function: 'get_ad_sets',
    output: {
      ad_sets: adSets.map(adSet => ({
        ad_set_id: adSet.id,
        name: adSet.name,
        status: adSet.status,
        optimization_goal: adSet.optimization_goal,
        billing_event: adSet.billing_event,
        bid_amount: adSet.bid_amount ? parseFloat(adSet.bid_amount) / 100 : null,
        daily_budget: adSet.daily_budget ? parseFloat(adSet.daily_budget) / 100 : null,
        lifetime_budget: adSet.lifetime_budget ? parseFloat(adSet.lifetime_budget) / 100 : null,
        start_time: adSet.start_time,
        end_time: adSet.end_time,
        targeting: adSet.targeting,
        created_at: adSet.created_time,
        updated_at: adSet.updated_time,
        insights: adSet.insights?.data?.[0] || null
      })),
      count: adSets.length,
      campaign_id: campaign_id
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// 5. CHECK LEARNING PHASE
// ═══════════════════════════════════════════════════════════════

async function checkLearningPhase(credentials, params) {
  const { ad_set_id } = params;

  if (!ad_set_id) {
    return { success: false, error: 'ad_set_id requis' };
  }

  const result = await metaApiCall(credentials, ad_set_id, {
    fields: 'id,name,status,learning_stage_info,promoted_object,optimization_goal,insights{spend,conversions}'
  });

  if (!result.success) {
    return result;
  }

  const adSet = result.data;
  const learningInfo = adSet.learning_stage_info || {};
  const insights = adSet.insights?.data?.[0] || {};

  // Déterminer le statut Learning Phase
  let learningStatus = 'UNKNOWN';
  let learningMessage = '';

  if (learningInfo.status === 'LEARNING') {
    learningStatus = 'IN_LEARNING';
    learningMessage = `Ad Set en phase d'apprentissage. Il reste ${50 - parseInt(insights.conversions || 0)} conversions pour sortir de Learning Phase.`;
  } else if (learningInfo.status === 'SUCCESS') {
    learningStatus = 'LEARNED';
    learningMessage = 'Ad Set a terminé la phase d\'apprentissage avec succès.';
  } else if (learningInfo.status === 'FAIL') {
    learningStatus = 'LEARNING_LIMITED';
    learningMessage = 'Learning Limited: Pas assez de données pour sortir de Learning Phase. Augmenter le budget ou élargir l\'audience.';
  }

  return {
    success: true,
    function: 'check_learning_phase',
    output: {
      ad_set_id: adSet.id,
      name: adSet.name,
      status: adSet.status,
      learning_status: learningStatus,
      learning_stage_info: learningInfo,
      optimization_goal: adSet.optimization_goal,
      current_conversions: parseInt(insights.conversions || 0),
      conversions_needed_for_exit: Math.max(0, 50 - parseInt(insights.conversions || 0)),
      spend: parseFloat(insights.spend || 0),
      message: learningMessage,
      recommendations: learningStatus === 'LEARNING_LIMITED' ? [
        'Augmenter le budget quotidien de 20-30%',
        'Élargir les critères de ciblage',
        'Vérifier que l\'événement de conversion est bien paramétré',
        'Attendre au moins 7 jours avant de faire des modifications'
      ] : []
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// 6. GET PIXEL EVENTS
// ═══════════════════════════════════════════════════════════════

async function getPixelEvents(credentials, params) {
  const { pixel_id, date_range } = params;

  if (!pixel_id) {
    return { success: false, error: 'pixel_id requis' };
  }

  // Time range
  const timeRange = date_range || { since: '2026-02-03', until: '2026-02-10' };

  const result = await metaApiCall(credentials, `${pixel_id}/stats`, {
    start_time: Math.floor(new Date(timeRange.since).getTime() / 1000),
    end_time: Math.floor(new Date(timeRange.until).getTime() / 1000),
    aggregation: 'event'
  });

  if (!result.success) {
    return result;
  }

  const stats = result.data.data || [];

  return {
    success: true,
    function: 'get_pixel_events',
    output: {
      pixel_id: pixel_id,
      events: stats.map(stat => ({
        event_name: stat.event,
        count: stat.count,
        total_count: stat.total_count,
        value: stat.value || 0
      })),
      count: stats.length,
      date_range: timeRange
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// 7. GET AUDIENCE OVERLAP
// ═══════════════════════════════════════════════════════════════

async function getAudienceOverlap(credentials, params) {
  const { ad_account_id, audience_ids } = params;

  if (!ad_account_id || !audience_ids || audience_ids.length < 2) {
    return { success: false, error: 'ad_account_id et au moins 2 audience_ids requis' };
  }

  // Créer une requête pour chaque paire d'audiences
  const overlaps = [];

  for (let i = 0; i < audience_ids.length; i++) {
    for (let j = i + 1; j < audience_ids.length; j++) {
      const audience1 = audience_ids[i];
      const audience2 = audience_ids[j];

      const result = await metaApiCall(credentials, `${ad_account_id}/reachestimate`, {
        targeting_spec: JSON.stringify({
          custom_audiences: [
            { id: audience1 },
            { id: audience2 }
          ]
        })
      });

      if (result.success) {
        const estimate = result.data.data || {};
        overlaps.push({
          audience_1: audience1,
          audience_2: audience2,
          overlap_size: estimate.users || 0,
          overlap_percentage: estimate.estimate_ready ? ((estimate.users / estimate.estimate_dau) * 100).toFixed(2) : 'N/A'
        });
      }
    }
  }

  return {
    success: true,
    function: 'get_audience_overlap',
    output: {
      ad_account_id: ad_account_id,
      overlaps: overlaps,
      count: overlaps.length,
      warning: overlaps.some(o => parseFloat(o.overlap_percentage) > 50) ? 'Chevauchement d\'audiences > 50% détecté. Risque de cannibalisation.' : null
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════

module.exports = { meta_ads_manager };
