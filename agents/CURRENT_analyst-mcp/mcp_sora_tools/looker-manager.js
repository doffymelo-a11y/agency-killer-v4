// ============================================================
// MCP SERVER: LOOKER MANAGER
// Gère Looker Studio - Crée dashboards, graphiques, planifie emails
// API: Looker Studio API (Google Data Studio API)
// ============================================================

/**
 * @typedef {Object} LookerCredentials
 * @property {string} access_token - Google OAuth2 access token
 */

/**
 * @typedef {Object} LookerFunctionInput
 * @property {string} function_name - Nom de la fonction à appeler
 * @property {Object} parameters - Paramètres de la fonction
 * @property {LookerCredentials} credentials - Credentials OAuth2
 */

const LOOKER_API_BASE = 'https://datastudio.googleapis.com/v1';

// ═══════════════════════════════════════════════════════════════
// FONCTION PRINCIPALE: Router
// ═══════════════════════════════════════════════════════════════

async function looker_manager(input) {
  const { function_name, parameters, credentials } = input;

  if (!credentials || !credentials.access_token) {
    return {
      success: false,
      error: 'Access token manquant. Connecter Google OAuth2 dans Intégrations.'
    };
  }

  try {
    switch (function_name) {
      case 'create_report':
        return await createReport(credentials, parameters);
      case 'add_scorecard':
        return await addScorecard(credentials, parameters);
      case 'add_time_series_chart':
        return await addTimeSeriesChart(credentials, parameters);
      case 'add_table':
        return await addTable(credentials, parameters);
      case 'blend_data_sources':
        return await blendDataSources(credentials, parameters);
      case 'schedule_email':
        return await scheduleEmail(credentials, parameters);
      case 'get_report_url':
        return await getReportUrl(credentials, parameters);
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
// HELPER: Faire un appel Looker API
// ═══════════════════════════════════════════════════════════════

async function lookerApiCall(credentials, endpoint, method = 'GET', body = null) {
  const url = `${LOOKER_API_BASE}/${endpoint}`;

  const options = {
    method: method,
    headers: {
      'Authorization': `Bearer ${credentials.access_token}`,
      'Content-Type': 'application/json'
    }
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return {
      success: false,
      error: `Looker API Error: ${response.status}`,
      details: errorData
    };
  }

  const data = await response.json().catch(() => ({}));
  return {
    success: true,
    data: data
  };
}

// ═══════════════════════════════════════════════════════════════
// 1. CREATE REPORT
// ═══════════════════════════════════════════════════════════════

async function createReport(credentials, params) {
  const { report_name, data_sources } = params;

  if (!report_name) {
    return { success: false, error: 'report_name requis' };
  }

  // NOTE: L'API Looker Studio est limitée. La création de rapports se fait principalement via UI.
  // Cette fonction génère un template/lien pour créer un rapport via URL.

  // Construction de l'URL de création de rapport avec data sources pré-configurées
  const baseUrl = 'https://datastudio.google.com/reporting/create';
  const dataSourceParams = data_sources ? data_sources.map(ds => `ds=${encodeURIComponent(ds)}`).join('&') : '';

  const reportUrl = `${baseUrl}?${dataSourceParams}&r=${encodeURIComponent(report_name)}`;

  return {
    success: true,
    function: 'create_report',
    output: {
      report_name: report_name,
      creation_url: reportUrl,
      data_sources: data_sources || [],
      message: 'Ouvrir creation_url pour créer le rapport dans Looker Studio',
      instructions: [
        '1. Cliquer sur creation_url',
        '2. Sélectionner le template souhaité (ou partir de zéro)',
        '3. Connecter les data sources',
        '4. Configurer le rapport',
        '5. Copier l\'URL du rapport et la sauvegarder pour référence future'
      ],
      note: 'Looker Studio API a des limitations. Certaines opérations nécessitent l\'interface utilisateur.'
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// 2. ADD SCORECARD (KPI Card)
// ═══════════════════════════════════════════════════════════════

async function addScorecard(credentials, params) {
  const { report_id, config } = params;

  if (!report_id || !config) {
    return { success: false, error: 'report_id et config requis' };
  }

  // Configuration d'un scorecard (carte KPI)
  const scorecardConfig = {
    type: 'SCORECARD',
    metric: config.metric, // Ex: 'ga:sessions', 'fb:impressions'
    comparison_type: config.comparison_type || 'PREVIOUS_PERIOD',
    comparison_metric: config.comparison_metric,
    style: {
      background_color: config.background_color || '#FFFFFF',
      font_color: config.font_color || '#000000',
      font_size: config.font_size || 'MEDIUM',
      show_sparkline: config.show_sparkline || false
    },
    filters: config.filters || []
  };

  // Note: L'API Looker Studio ne permet pas l'ajout programmatique de composants
  // Cette fonction retourne la configuration pour documentation/UI

  return {
    success: true,
    function: 'add_scorecard',
    output: {
      report_id: report_id,
      scorecard_config: scorecardConfig,
      message: 'Configuration du scorecard générée. Ajouter manuellement dans Looker Studio.',
      instructions: [
        '1. Ouvrir le rapport dans Looker Studio',
        '2. Cliquer sur "Add a chart" > "Scorecard"',
        `3. Sélectionner la métrique: ${config.metric}`,
        `4. Configurer la comparaison: ${config.comparison_type}`,
        '5. Appliquer le style selon scorecard_config'
      ],
      note: 'L\'ajout de composants via API n\'est pas supporté. Configuration fournie pour référence.'
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// 3. ADD TIME SERIES CHART
// ═══════════════════════════════════════════════════════════════

async function addTimeSeriesChart(credentials, params) {
  const { report_id, config } = params;

  if (!report_id || !config) {
    return { success: false, error: 'report_id et config requis' };
  }

  const chartConfig = {
    type: 'TIME_SERIES',
    date_dimension: config.date_dimension || 'ga:date',
    metrics: config.metrics || ['ga:sessions', 'ga:pageviews'],
    dimensions: config.dimensions || [],
    chart_type: config.chart_type || 'LINE', // LINE, AREA, COLUMN, SMOOTH_LINE
    style: {
      show_data_labels: config.show_data_labels || false,
      show_legend: config.show_legend || true,
      color_scheme: config.color_scheme || 'DEFAULT',
      line_smoothing: config.line_smoothing || 0
    },
    date_range: config.date_range || 'LAST_30_DAYS',
    filters: config.filters || []
  };

  return {
    success: true,
    function: 'add_time_series_chart',
    output: {
      report_id: report_id,
      chart_config: chartConfig,
      message: 'Configuration du graphique Time Series générée.',
      instructions: [
        '1. Ouvrir le rapport dans Looker Studio',
        '2. Cliquer sur "Add a chart" > "Time series"',
        `3. Sélectionner la dimension date: ${chartConfig.date_dimension}`,
        `4. Ajouter les métriques: ${chartConfig.metrics.join(', ')}`,
        `5. Style de graphique: ${chartConfig.chart_type}`,
        `6. Période: ${chartConfig.date_range}`
      ],
      note: 'Ajouter manuellement dans l\'interface Looker Studio.'
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// 4. ADD TABLE
// ═══════════════════════════════════════════════════════════════

async function addTable(credentials, params) {
  const { report_id, config } = params;

  if (!report_id || !config) {
    return { success: false, error: 'report_id et config requis' };
  }

  const tableConfig = {
    type: 'TABLE',
    dimensions: config.dimensions || ['ga:source', 'ga:medium'],
    metrics: config.metrics || ['ga:sessions', 'ga:bounceRate', 'ga:goalConversionRateAll'],
    sort: config.sort || [{ field: config.metrics[0], order: 'DESCENDING' }],
    rows_per_page: config.rows_per_page || 10,
    show_pagination: config.show_pagination || true,
    style: {
      header_background_color: config.header_background_color || '#F0F0F0',
      row_alternating_colors: config.row_alternating_colors || true,
      show_row_numbers: config.show_row_numbers || true,
      compact_numbers: config.compact_numbers || true
    },
    filters: config.filters || []
  };

  return {
    success: true,
    function: 'add_table',
    output: {
      report_id: report_id,
      table_config: tableConfig,
      message: 'Configuration du tableau générée.',
      instructions: [
        '1. Ouvrir le rapport dans Looker Studio',
        '2. Cliquer sur "Add a chart" > "Table"',
        `3. Ajouter les dimensions: ${tableConfig.dimensions.join(', ')}`,
        `4. Ajouter les métriques: ${tableConfig.metrics.join(', ')}`,
        `5. Configurer le tri: ${tableConfig.sort[0].field} (${tableConfig.sort[0].order})`,
        `6. Pagination: ${tableConfig.rows_per_page} lignes par page`
      ],
      note: 'Ajouter manuellement dans l\'interface Looker Studio.'
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// 5. BLEND DATA SOURCES
// ═══════════════════════════════════════════════════════════════

async function blendDataSources(credentials, params) {
  const { report_id, blend_config } = params;

  if (!report_id || !blend_config) {
    return { success: false, error: 'report_id et blend_config requis' };
  }

  const blendConfiguration = {
    name: blend_config.name || 'Data Blend',
    data_sources: blend_config.data_sources || [],
    join_keys: blend_config.join_keys || [],
    join_type: blend_config.join_type || 'LEFT_OUTER', // LEFT_OUTER, INNER, FULL_OUTER
    metrics: blend_config.metrics || [],
    dimensions: blend_config.dimensions || []
  };

  return {
    success: true,
    function: 'blend_data_sources',
    output: {
      report_id: report_id,
      blend_config: blendConfiguration,
      message: 'Configuration du Data Blend générée.',
      instructions: [
        '1. Ouvrir le rapport dans Looker Studio',
        '2. Cliquer sur "Resource" > "Manage blended data"',
        '3. Cliquer sur "Add a blend"',
        `4. Ajouter les data sources: ${blendConfiguration.data_sources.join(', ')}`,
        `5. Configurer les clés de jointure: ${blendConfiguration.join_keys.join(', ')}`,
        `6. Type de jointure: ${blendConfiguration.join_type}`,
        '7. Sélectionner les métriques et dimensions à inclure',
        '8. Sauvegarder le blend et l\'utiliser dans les graphiques'
      ],
      example: {
        use_case: 'Combiner Google Analytics + Google Ads',
        data_sources: ['Google Analytics 4', 'Google Ads'],
        join_keys: ['ga:date = ads:date', 'ga:campaign = ads:campaign'],
        result: 'Vue unifiée des données GA4 et Google Ads par campagne et date'
      },
      note: 'Le Data Blending se configure dans l\'interface Looker Studio.'
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// 6. SCHEDULE EMAIL
// ═══════════════════════════════════════════════════════════════

async function scheduleEmail(credentials, params) {
  const { report_id, recipients, frequency } = params;

  if (!report_id || !recipients || !frequency) {
    return { success: false, error: 'report_id, recipients et frequency requis' };
  }

  // Configuration de l'email planifié
  const emailConfig = {
    report_id: report_id,
    recipients: recipients, // ['email1@example.com', 'email2@example.com']
    frequency: frequency, // DAILY, WEEKLY, MONTHLY
    day_of_week: params.day_of_week || (frequency === 'WEEKLY' ? 'MONDAY' : null),
    day_of_month: params.day_of_month || (frequency === 'MONTHLY' ? 1 : null),
    time: params.time || '09:00',
    timezone: params.timezone || 'Europe/Paris',
    subject: params.subject || `Rapport Looker Studio - ${new Date().toLocaleDateString()}`,
    message: params.message || 'Voici votre rapport automatique.',
    include_link: params.include_link !== false,
    include_pdf: params.include_pdf || false,
    filters: params.filters || []
  };

  return {
    success: true,
    function: 'schedule_email',
    output: {
      report_id: report_id,
      email_config: emailConfig,
      message: 'Configuration de l\'email planifié générée.',
      instructions: [
        '1. Ouvrir le rapport dans Looker Studio',
        '2. Cliquer sur "Share" > "Schedule email delivery"',
        `3. Ajouter les destinataires: ${recipients.join(', ')}`,
        `4. Fréquence: ${frequency}`,
        frequency === 'WEEKLY' ? `   - Jour: ${emailConfig.day_of_week}` : '',
        frequency === 'MONTHLY' ? `   - Jour du mois: ${emailConfig.day_of_month}` : '',
        `5. Heure: ${emailConfig.time} (${emailConfig.timezone})`,
        `6. Sujet: "${emailConfig.subject}"`,
        `7. Message: "${emailConfig.message}"`,
        emailConfig.include_pdf ? '8. Activer "Attach PDF"' : '',
        '9. Sauvegarder la planification'
      ],
      note: 'La planification d\'emails se configure dans l\'interface Looker Studio.'
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// 7. GET REPORT URL
// ═══════════════════════════════════════════════════════════════

async function getReportUrl(credentials, params) {
  const { report_id } = params;

  if (!report_id) {
    return { success: false, error: 'report_id requis' };
  }

  // Générer l'URL du rapport
  const reportUrl = `https://datastudio.google.com/reporting/${report_id}/page/1`;
  const embedUrl = `https://datastudio.google.com/embed/reporting/${report_id}/page/1`;
  const editUrl = `https://datastudio.google.com/reporting/${report_id}/edit`;

  return {
    success: true,
    function: 'get_report_url',
    output: {
      report_id: report_id,
      view_url: reportUrl,
      embed_url: embedUrl,
      edit_url: editUrl,
      message: 'URLs du rapport générées avec succès',
      usage: {
        view_url: 'Partager avec les utilisateurs pour consulter le rapport',
        embed_url: 'Intégrer le rapport dans un site web (iframe)',
        edit_url: 'Modifier le rapport (nécessite permissions d\'édition)'
      },
      embed_code: `<iframe width="100%" height="600" src="${embedUrl}" frameborder="0" style="border:0" allowfullscreen></iframe>`
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════

module.exports = { looker_manager };
