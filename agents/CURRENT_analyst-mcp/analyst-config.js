/**
 * ============================================================================
 * ANALYST CONFIG - Agency Killer V4 (Cloud Native)
 * ============================================================================
 *
 * Configuration et helpers pour l'Agent Analyst.
 * A copier dans les Code Nodes n8n pour utilisation standalone.
 *
 * ============================================================================
 */

// ============================================================================
// CONSTANTES - SEUILS D'ALERTE
// ============================================================================

const ALERT_THRESHOLDS = {
  // ROAS
  roas: {
    target: 4.0,
    warning: 3.0,
    critical: 2.0
  },
  // CPA (en EUR) - Lower is better
  cpa: {
    target: 25,
    warning: 30,
    critical: 40
  },
  // Conversion Rate (%)
  cvr: {
    target: 2.5,
    warning: 1.8,
    critical: 1.0
  },
  // Anomaly Detection (%)
  anomaly: {
    threshold: 20,    // Variation > 20% = suspect
    critical: 50      // Variation > 50% = tres suspect
  }
};

// ============================================================================
// CONSTANTES - PRIORITES METRIQUES
// ============================================================================

const METRIC_PRIORITY = {
  tier_1: ['ROAS', 'Revenue', 'Net_Profit', 'Margin'],
  tier_2: ['CPA', 'CAC', 'CVR', 'LTV', 'AOV'],
  tier_3: ['Sessions', 'Traffic', 'Impressions', 'CTR', 'Clicks']
};

// ============================================================================
// HELPERS - EVALUATION KPI
// ============================================================================

/**
 * Evalue le status d'un KPI par rapport aux seuils
 * @param {number} value - Valeur actuelle
 * @param {object} thresholds - { target, warning, critical }
 * @param {boolean} higherIsBetter - true pour ROAS, false pour CPA
 * @returns {object} { status, label, color }
 */
function evaluateKpiStatus(value, thresholds, higherIsBetter = true) {
  const { target, warning, critical } = thresholds;

  if (higherIsBetter) {
    if (value >= target) {
      return { status: 'success', label: 'On Target', color: '#10B981' };
    }
    if (value >= warning) {
      return { status: 'warning', label: 'Below Target', color: '#F59E0B' };
    }
    return { status: 'critical', label: 'Critical', color: '#EF4444' };
  } else {
    // Lower is better (CPA, CAC)
    if (value <= target) {
      return { status: 'success', label: 'On Target', color: '#10B981' };
    }
    if (value <= warning) {
      return { status: 'warning', label: 'Above Target', color: '#F59E0B' };
    }
    return { status: 'critical', label: 'Critical', color: '#EF4444' };
  }
}

// ============================================================================
// HELPERS - DETECTION ANOMALIES
// ============================================================================

/**
 * Detecte si une variation est anormale (Senior Rule: Scepticisme)
 * @param {number} current - Valeur actuelle
 * @param {number} previous - Valeur precedente
 * @param {number} threshold - Seuil en % (defaut: 20)
 * @returns {object} Resultat de detection
 */
function detectAnomaly(current, previous, threshold = 20) {
  if (!previous || previous === 0) {
    return {
      is_anomaly: false,
      variation_pct: 0,
      direction: 'stable',
      severity: 'none',
      message: 'Pas de donnees precedentes pour comparaison'
    };
  }

  const variation = ((current - previous) / previous) * 100;
  const absVariation = Math.abs(variation);

  const result = {
    is_anomaly: absVariation > threshold,
    variation_pct: Math.round(variation * 100) / 100,
    direction: variation > 0 ? 'up' : variation < 0 ? 'down' : 'stable',
    severity: 'none',
    message: ''
  };

  if (absVariation > 50) {
    result.severity = 'critical';
    result.message = `ALERTE: Variation extreme (${result.variation_pct}%). Verification tracking URGENTE.`;
  } else if (absVariation > 30) {
    result.severity = 'high';
    result.message = `ATTENTION: Variation significative (${result.variation_pct}%). Verifier avant interpretation.`;
  } else if (absVariation > threshold) {
    result.severity = 'moderate';
    result.message = `NOTE: Variation notable (${result.variation_pct}%). A surveiller.`;
  }

  return result;
}

// ============================================================================
// HELPERS - FORMATAGE VALEURS
// ============================================================================

/**
 * Formate une valeur pour affichage
 * @param {number} value - Valeur brute
 * @param {string} type - Type de formatage
 * @returns {string} Valeur formatee
 */
function formatValue(value, type) {
  if (value === null || value === undefined) return '-';

  switch (type) {
    case 'currency':
    case 'eur':
      return `${value.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} EUR`;

    case 'percent':
      return `${value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}%`;

    case 'multiplier':
    case 'roas':
      return `${value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}x`;

    case 'number':
    case 'integer':
      return value.toLocaleString('fr-FR', { maximumFractionDigits: 0 });

    case 'decimal':
      return value.toLocaleString('fr-FR', { maximumFractionDigits: 2 });

    default:
      return String(value);
  }
}

// ============================================================================
// FACTORY - KPI CARD
// ============================================================================

/**
 * Cree un composant KPI_CARD conforme au schema UI
 */
function createKpiCard({
  title,
  value,
  formattedValue,
  unit = '',
  trend = null,
  sparkline = null,
  benchmark = null,
  status = 'neutral',
  width = 'quarter'
}) {
  return {
    type: 'KPI_CARD',
    data: {
      title,
      value,
      formatted_value: formattedValue || formatValue(value, 'number'),
      unit,
      trend: trend ? {
        direction: trend.direction || 'stable',
        value: Math.abs(trend.value || 0),
        period: trend.period || 'vs 7j',
        is_positive: trend.is_positive !== undefined ? trend.is_positive : trend.direction === 'up'
      } : null,
      sparkline: sparkline || null,
      benchmark: benchmark || null,
      status
    },
    layout: { width, order: 1 }
  };
}

// ============================================================================
// FACTORY - CHART WIDGET
// ============================================================================

/**
 * Cree un composant CHART_WIDGET conforme au schema UI
 */
function createChartWidget({
  title,
  chartType = 'line',
  labels,
  datasets,
  options = {},
  width = 'half'
}) {
  return {
    type: 'CHART_WIDGET',
    data: {
      title,
      chart_type: chartType,
      data: {
        labels,
        datasets: datasets.map(ds => ({
          label: ds.label,
          data: ds.data,
          color: ds.color || '#3B82F6'
        }))
      },
      options: {
        show_legend: options.showLegend !== false,
        show_grid: options.showGrid !== false,
        stacked: options.stacked || false,
        y_axis_format: options.yAxisFormat || null
      }
    },
    layout: { width, order: 2 }
  };
}

// ============================================================================
// FACTORY - DATA TABLE
// ============================================================================

/**
 * Cree un composant DATA_TABLE conforme au schema UI
 */
function createDataTable({
  title,
  columns,
  rows,
  sortable = true,
  width = 'full'
}) {
  return {
    type: 'DATA_TABLE',
    data: {
      title,
      columns,
      rows,
      options: {
        sortable,
        pagination: rows.length > 10
      }
    },
    layout: { width, order: 3 }
  };
}

// ============================================================================
// FACTORY - ACTION BUTTONS
// ============================================================================

/**
 * Cree un composant ACTION_BUTTONS conforme au schema UI
 */
function createActionButtons({
  actions,
  layout = 'horizontal'
}) {
  return {
    type: 'ACTION_BUTTONS',
    data: {
      layout,
      actions: actions.map(a => ({
        id: a.id,
        label: a.label,
        icon: a.icon || null,
        action_type: a.type || 'navigate',
        variant: a.variant || 'secondary',
        payload: a.payload || {},
        confirmation_required: a.confirm || false,
        confirmation_message: a.confirmMessage || null
      }))
    },
    layout: { width: 'full', order: 10 }
  };
}

// ============================================================================
// TEMPLATES - CHAT MESSAGES
// ============================================================================

const CHAT_TEMPLATES = {

  healthy: (kpis) => ({
    content: `**PERFORMANCE SAINE**

Tous les KPIs Tier 1 sont dans les objectifs.

**Resume Business:**
- ROAS: **${formatValue(kpis.roas, 'roas')}** (cible: 4.0x)
- Revenue: **${formatValue(kpis.revenue, 'currency')}**
- Profit Net: **${formatValue(kpis.netProfit, 'currency')}**

Continuez sur cette lancee.`,
    tone: 'positive',
    follow_up_questions: [
      'Voir le detail par campagne ?',
      'Analyser les opportunites de scaling ?',
      'Exporter le rapport ?'
    ]
  }),

  warning: (kpis, warnings) => ({
    content: `**ATTENTION REQUISE**

${warnings.length} indicateur(s) montrent des signaux preoccupants.

**Resume Business:**
- ROAS: **${formatValue(kpis.roas, 'roas')}** ${kpis.roasStatus}
- Revenue: **${formatValue(kpis.revenue, 'currency')}**
- CPA: **${formatValue(kpis.cpa, 'currency')}** ${kpis.cpaStatus}

**Points de vigilance:**
${warnings.map(w => `- ${w}`).join('\n')}`,
    tone: 'warning',
    follow_up_questions: [
      'Investiguer les causes ?',
      'Voir les campagnes sous-performantes ?',
      'Ajuster les budgets ?'
    ]
  }),

  critical: (kpis, alerts) => ({
    content: `**ALERTE CRITIQUE**

${alerts.length} KPI(s) en zone critique necessitent une action immediate.

**Resume Business:**
- ROAS: **${formatValue(kpis.roas, 'roas')}** 🚨
- Revenue: **${formatValue(kpis.revenue, 'currency')}** 🚨

**Actions immediates:**
${alerts.map((a, i) => `${i + 1}. ${a}`).join('\n')}

**Senior Note:** Variation >20% detectee. Verifier tracking avant toute conclusion.`,
    tone: 'critical',
    follow_up_questions: [
      'Lancer audit technique ?',
      'Verifier status pixels ?',
      'Comparer avec donnees plateforme ?'
    ]
  }),

  anomaly: (metric, variation) => ({
    content: `**ANOMALIE DETECTEE**

Une variation inhabituelle necessite verification.

**Detection:**
- Metrique: **${metric}**
- Variation: **${variation > 0 ? '+' : ''}${variation}%**
- Seuil alerte: 20%

**Senior Rule: Scepticisme**
Avant de conclure, verifier:
1. Tracking fonctionnel ?
2. Donnees coherentes entre sources ?
3. Evenement externe ?

**Statut: EN ATTENTE DE VERIFICATION**`,
    tone: 'warning',
    follow_up_questions: [
      'Lancer verification tracking ?',
      'Comparer avec source alternative ?',
      'Ignorer et continuer ?'
    ]
  })
};

// ============================================================================
// EXPORTS
// ============================================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    // Constants
    ALERT_THRESHOLDS,
    METRIC_PRIORITY,

    // Helpers
    evaluateKpiStatus,
    detectAnomaly,
    formatValue,

    // Factories
    createKpiCard,
    createChartWidget,
    createDataTable,
    createActionButtons,

    // Templates
    CHAT_TEMPLATES
  };
}

// ============================================================================
// N8N CODE NODE USAGE
// ============================================================================
/*
 * Copier les fonctions necessaires dans votre Code Node:
 *
 * // Detection anomalie
 * const anomaly = detectAnomaly(currentROAS, previousROAS, 20);
 * if (anomaly.is_anomaly) {
 *   // Generer alerte
 * }
 *
 * // Creer KPI Card
 * const roasCard = createKpiCard({
 *   title: 'ROAS',
 *   value: 4.2,
 *   formattedValue: '4.2x',
 *   unit: 'x',
 *   trend: { direction: 'up', value: 5, is_positive: true },
 *   sparkline: [3.8, 4.0, 4.1, 4.2],
 *   status: 'success'
 * });
 *
 * // Creer Chart
 * const revenueChart = createChartWidget({
 *   title: 'Revenue Trend',
 *   chartType: 'area',
 *   labels: ['J-6', 'J-5', 'J-4', 'J-3', 'J-2', 'J-1', 'Today'],
 *   datasets: [
 *     { label: 'Revenue', data: [4200, 4500, 4300, 4800, 4600, 4900, 5100], color: '#10B981' }
 *   ]
 * });
 */
