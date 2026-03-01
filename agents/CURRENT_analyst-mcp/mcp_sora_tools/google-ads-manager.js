// ============================================================
// MCP SERVER: GOOGLE ADS MANAGER
// Gère Google Ads en LECTURE SEULE - Analyse performances, audiences
// API: Google Ads API v15
// ⚠️ PAS de création de campagnes (rôle de Marcus)
// ============================================================

/**
 * @typedef {Object} GoogleAdsCredentials
 * @property {string} access_token - Google OAuth2 access token
 * @property {string} developer_token - Google Ads Developer Token
 * @property {string} login_customer_id - MCC ID (Manager Customer ID)
 */

/**
 * @typedef {Object} GoogleAdsFunctionInput
 * @property {string} function_name - Nom de la fonction à appeler
 * @property {Object} parameters - Paramètres de la fonction
 * @property {GoogleAdsCredentials} credentials - Credentials OAuth2
 */

const GOOGLE_ADS_API_VERSION = 'v15';
const GOOGLE_ADS_API_BASE = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}`;

// ═══════════════════════════════════════════════════════════════
// FONCTION PRINCIPALE: Router
// ═══════════════════════════════════════════════════════════════

async function google_ads_manager(input) {
  const { function_name, parameters, credentials } = input;

  if (!credentials || !credentials.access_token) {
    return {
      success: false,
      error: 'Access token manquant. Connecter Google Ads OAuth2 dans Intégrations.'
    };
  }

  if (!credentials.developer_token) {
    return {
      success: false,
      error: 'Developer Token manquant. Configurer dans les settings Google Ads.'
    };
  }

  try {
    switch (function_name) {
      case 'get_accounts':
        return await getAccounts(credentials, parameters);
      case 'get_campaigns':
        return await getCampaigns(credentials, parameters);
      case 'get_search_terms':
        return await getSearchTerms(credentials, parameters);
      case 'get_keywords_quality_score':
        return await getKeywordsQualityScore(credentials, parameters);
      case 'get_conversions':
        return await getConversions(credentials, parameters);
      case 'create_audience':
        return await createAudience(credentials, parameters);
      case 'get_performance_report':
        return await getPerformanceReport(credentials, parameters);
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
// HELPER: Faire un appel Google Ads API
// ═══════════════════════════════════════════════════════════════

async function googleAdsQuery(credentials, customerId, query) {
  const url = `${GOOGLE_ADS_API_BASE}/customers/${customerId}/googleAds:searchStream`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${credentials.access_token}`,
      'developer-token': credentials.developer_token,
      'login-customer-id': credentials.login_customer_id || customerId,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  });

  if (!response.ok) {
    const errorData = await response.json();
    return {
      success: false,
      error: `Google Ads API Error: ${response.status}`,
      details: errorData
    };
  }

  const data = await response.json();
  return {
    success: true,
    data: data
  };
}

// ═══════════════════════════════════════════════════════════════
// 1. GET ACCOUNTS
// ═══════════════════════════════════════════════════════════════

async function getAccounts(credentials, params) {
  // Lister les comptes Google Ads accessibles
  const customerId = credentials.login_customer_id || params.customer_id;

  const query = `
    SELECT
      customer_client.id,
      customer_client.descriptive_name,
      customer_client.currency_code,
      customer_client.time_zone,
      customer_client.manager,
      customer_client.status
    FROM customer_client
    WHERE customer_client.status = 'ENABLED'
  `;

  const result = await googleAdsQuery(credentials, customerId, query);

  if (!result.success) {
    return result;
  }

  const accounts = result.data.results || [];

  return {
    success: true,
    function: 'get_accounts',
    output: {
      accounts: accounts.map(row => ({
        customer_id: row.customerClient.id,
        name: row.customerClient.descriptiveName,
        currency: row.customerClient.currencyCode,
        timezone: row.customerClient.timeZone,
        is_manager: row.customerClient.manager,
        status: row.customerClient.status
      })),
      count: accounts.length
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// 2. GET CAMPAIGNS
// ═══════════════════════════════════════════════════════════════

async function getCampaigns(credentials, params) {
  const { customer_id, date_range } = params;

  if (!customer_id) {
    return { success: false, error: 'customer_id requis' };
  }

  // Mapper date_range
  const dateCondition = date_range || 'LAST_7_DAYS';

  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign.advertising_channel_type,
      campaign.bidding_strategy_type,
      campaign_budget.amount_micros,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_value,
      metrics.ctr,
      metrics.average_cpc
    FROM campaign
    WHERE segments.date DURING ${dateCondition}
      AND campaign.status IN ('ENABLED', 'PAUSED')
    ORDER BY metrics.cost_micros DESC
  `;

  const result = await googleAdsQuery(credentials, customer_id, query);

  if (!result.success) {
    return result;
  }

  const campaigns = result.data.results || [];

  return {
    success: true,
    function: 'get_campaigns',
    output: {
      campaigns: campaigns.map(row => ({
        campaign_id: row.campaign.id,
        name: row.campaign.name,
        status: row.campaign.status,
        type: row.campaign.advertisingChannelType,
        bidding_strategy: row.campaign.biddingStrategyType,
        budget_micros: row.campaignBudget?.amountMicros || 0,
        budget: (row.campaignBudget?.amountMicros || 0) / 1000000,
        impressions: row.metrics.impressions,
        clicks: row.metrics.clicks,
        cost_micros: row.metrics.costMicros,
        cost: row.metrics.costMicros / 1000000,
        conversions: row.metrics.conversions,
        conversion_value: row.metrics.conversionsValue,
        ctr: row.metrics.ctr,
        avg_cpc: row.metrics.averageCpc / 1000000
      })),
      count: campaigns.length,
      date_range: dateCondition
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// 3. GET SEARCH TERMS
// ═══════════════════════════════════════════════════════════════

async function getSearchTerms(credentials, params) {
  const { customer_id, campaign_id, date_range } = params;

  if (!customer_id) {
    return { success: false, error: 'customer_id requis' };
  }

  const dateCondition = date_range || 'LAST_30_DAYS';
  const campaignFilter = campaign_id ? `AND campaign.id = ${campaign_id}` : '';

  const query = `
    SELECT
      search_term_view.search_term,
      search_term_view.status,
      ad_group.id,
      ad_group.name,
      campaign.id,
      campaign.name,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.ctr
    FROM search_term_view
    WHERE segments.date DURING ${dateCondition}
      ${campaignFilter}
    ORDER BY metrics.impressions DESC
    LIMIT 100
  `;

  const result = await googleAdsQuery(credentials, customer_id, query);

  if (!result.success) {
    return result;
  }

  const searchTerms = result.data.results || [];

  return {
    success: true,
    function: 'get_search_terms',
    output: {
      search_terms: searchTerms.map(row => ({
        search_term: row.searchTermView.searchTerm,
        status: row.searchTermView.status,
        ad_group_id: row.adGroup.id,
        ad_group_name: row.adGroup.name,
        campaign_id: row.campaign.id,
        campaign_name: row.campaign.name,
        impressions: row.metrics.impressions,
        clicks: row.metrics.clicks,
        cost: row.metrics.costMicros / 1000000,
        conversions: row.metrics.conversions,
        ctr: row.metrics.ctr
      })),
      count: searchTerms.length,
      date_range: dateCondition
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// 4. GET KEYWORDS QUALITY SCORE
// ═══════════════════════════════════════════════════════════════

async function getKeywordsQualityScore(credentials, params) {
  const { customer_id, ad_group_id } = params;

  if (!customer_id) {
    return { success: false, error: 'customer_id requis' };
  }

  const adGroupFilter = ad_group_id ? `AND ad_group.id = ${ad_group_id}` : '';

  const query = `
    SELECT
      ad_group_criterion.keyword.text,
      ad_group_criterion.keyword.match_type,
      ad_group_criterion.quality_info.quality_score,
      ad_group_criterion.quality_info.creative_quality_score,
      ad_group_criterion.quality_info.post_click_quality_score,
      ad_group_criterion.quality_info.search_predicted_ctr,
      ad_group.id,
      ad_group.name,
      campaign.id,
      campaign.name,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros
    FROM keyword_view
    WHERE ad_group_criterion.status = 'ENABLED'
      ${adGroupFilter}
    ORDER BY ad_group_criterion.quality_info.quality_score ASC
    LIMIT 50
  `;

  const result = await googleAdsQuery(credentials, customer_id, query);

  if (!result.success) {
    return result;
  }

  const keywords = result.data.results || [];

  return {
    success: true,
    function: 'get_keywords_quality_score',
    output: {
      keywords: keywords.map(row => ({
        keyword: row.adGroupCriterion.keyword.text,
        match_type: row.adGroupCriterion.keyword.matchType,
        quality_score: row.adGroupCriterion.qualityInfo.qualityScore,
        creative_quality: row.adGroupCriterion.qualityInfo.creativeQualityScore,
        landing_page_quality: row.adGroupCriterion.qualityInfo.postClickQualityScore,
        expected_ctr: row.adGroupCriterion.qualityInfo.searchPredictedCtr,
        ad_group_id: row.adGroup.id,
        ad_group_name: row.adGroup.name,
        campaign_id: row.campaign.id,
        campaign_name: row.campaign.name,
        impressions: row.metrics.impressions,
        clicks: row.metrics.clicks,
        cost: row.metrics.costMicros / 1000000
      })),
      count: keywords.length,
      avg_quality_score: keywords.reduce((sum, k) => sum + k.adGroupCriterion.qualityInfo.qualityScore, 0) / keywords.length
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// 5. GET CONVERSIONS
// ═══════════════════════════════════════════════════════════════

async function getConversions(credentials, params) {
  const { customer_id } = params;

  if (!customer_id) {
    return { success: false, error: 'customer_id requis' };
  }

  const query = `
    SELECT
      conversion_action.id,
      conversion_action.name,
      conversion_action.type,
      conversion_action.status,
      conversion_action.primary_for_goal,
      conversion_action.category,
      conversion_action.value_settings.default_value,
      conversion_action.counting_type
    FROM conversion_action
    WHERE conversion_action.status IN ('ENABLED', 'PAUSED')
  `;

  const result = await googleAdsQuery(credentials, customer_id, query);

  if (!result.success) {
    return result;
  }

  const conversions = result.data.results || [];

  return {
    success: true,
    function: 'get_conversions',
    output: {
      conversions: conversions.map(row => ({
        conversion_id: row.conversionAction.id,
        name: row.conversionAction.name,
        type: row.conversionAction.type,
        status: row.conversionAction.status,
        is_primary: row.conversionAction.primaryForGoal,
        category: row.conversionAction.category,
        default_value: row.conversionAction.valueSettings?.defaultValue || 0,
        counting_type: row.conversionAction.countingType
      })),
      count: conversions.length
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// 6. CREATE AUDIENCE (Remarketing)
// ═══════════════════════════════════════════════════════════════

async function createAudience(credentials, params) {
  const { customer_id, audience_config } = params;

  if (!customer_id || !audience_config) {
    return { success: false, error: 'customer_id et audience_config requis' };
  }

  const url = `${GOOGLE_ADS_API_BASE}/customers/${customer_id}/userLists:mutate`;

  const userListBody = {
    operations: [
      {
        create: {
          name: audience_config.name,
          description: audience_config.description || '',
          membershipLifeSpan: audience_config.membership_life_span || 540, // 540 jours par défaut
          crmBasedUserList: audience_config.crm_based ? {
            uploadKeyType: audience_config.upload_key_type || 'CONTACT_INFO'
          } : undefined,
          ruleBasedUserList: !audience_config.crm_based ? {
            prepopulationStatus: 'REQUESTED',
            ruleItemGroups: audience_config.rules || []
          } : undefined
        }
      }
    ]
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${credentials.access_token}`,
      'developer-token': credentials.developer_token,
      'login-customer-id': credentials.login_customer_id || customer_id,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userListBody)
  });

  if (!response.ok) {
    const errorData = await response.json();
    return {
      success: false,
      error: `Google Ads API Error: ${response.status}`,
      details: errorData
    };
  }

  const data = await response.json();

  return {
    success: true,
    function: 'create_audience',
    output: {
      audience: data.results[0],
      resource_name: data.results[0].resourceName,
      message: `Audience "${audience_config.name}" créée avec succès`
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// 7. GET PERFORMANCE REPORT (Custom)
// ═══════════════════════════════════════════════════════════════

async function getPerformanceReport(credentials, params) {
  const { customer_id, metrics, dimensions, date_range } = params;

  if (!customer_id) {
    return { success: false, error: 'customer_id requis' };
  }

  // Construire la query dynamiquement
  const metricsFields = metrics || [
    'metrics.impressions',
    'metrics.clicks',
    'metrics.cost_micros',
    'metrics.conversions',
    'metrics.conversions_value',
    'metrics.ctr'
  ];

  const dimensionsFields = dimensions || [
    'campaign.id',
    'campaign.name',
    'segments.device'
  ];

  const allFields = [...dimensionsFields, ...metricsFields];
  const dateCondition = date_range || 'LAST_7_DAYS';

  const query = `
    SELECT ${allFields.join(', ')}
    FROM campaign
    WHERE segments.date DURING ${dateCondition}
      AND campaign.status = 'ENABLED'
  `;

  const result = await googleAdsQuery(credentials, customer_id, query);

  if (!result.success) {
    return result;
  }

  const rows = result.data.results || [];

  return {
    success: true,
    function: 'get_performance_report',
    output: {
      rows: rows,
      count: rows.length,
      metrics: metricsFields,
      dimensions: dimensionsFields,
      date_range: dateCondition
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════

module.exports = { google_ads_manager };
