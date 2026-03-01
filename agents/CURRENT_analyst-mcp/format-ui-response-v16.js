// ============================================================================
// FORMAT UI RESPONSE V16 - Analyst MCP (Sora)
// ============================================================================
// Ce node formate les reponses de l'Analyst Agent pour le frontend
// Type principal genere: ANALYTICS_DASHBOARD (KPIs, metriques, graphiques)
// ============================================================================

const rawInput = $input.first().json;

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: extractAndParseJSON
// ─────────────────────────────────────────────────────────────────────────────
function extractAndParseJSON(input) {
  if (typeof input === 'object' && input !== null) return input;
  if (typeof input !== 'string') return null;

  try {
    return JSON.parse(input);
  } catch (e) {}

  const codeBlockMatch = input.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch (e2) {}
  }

  const firstBrace = input.indexOf('{');
  if (firstBrace !== -1) {
    let depth = 0;
    let endIndex = -1;
    for (let i = firstBrace; i < input.length; i++) {
      if (input[i] === '{') depth++;
      if (input[i] === '}') depth--;
      if (depth === 0) { endIndex = i; break; }
    }
    if (endIndex !== -1) {
      try {
        return JSON.parse(input.slice(firstBrace, endIndex + 1));
      } catch (e3) {}
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Unwrap n8n JSON wrappers
// ─────────────────────────────────────────────────────────────────────────────
function unwrapN8nJson(data) {
  if (!data || typeof data !== 'object') return data;

  let current = data;
  for (let i = 0; i < 5; i++) {
    if (current && typeof current === 'object' && current.json !== undefined) {
      current = current.json;
    } else {
      break;
    }
  }

  if (typeof current === 'string') {
    const parsed = extractAndParseJSON(current);
    if (parsed) current = parsed;
  }

  return current;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Nettoyer le message des JSON parasites
// ─────────────────────────────────────────────────────────────────────────────
function cleanMessageFromJson(rawMessage) {
  if (!rawMessage || typeof rawMessage !== 'string') return rawMessage || '';

  let cleaned = rawMessage;
  cleaned = cleaned.replace(/```json[\s\S]*?```/gi, '');
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
  cleaned = cleaned.replace(/\{\s*"ui_components?"[\s\S]*$/gi, '');
  cleaned = cleaned.replace(/^\s*[\{\}\[\]]\s*$/gm, '');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  cleaned = cleaned.trim();

  return cleaned;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Generer un apercu du contenu long
// ─────────────────────────────────────────────────────────────────────────────
function generateContentPreview(content, maxLength = 350) {
  if (!content || typeof content !== 'string') return '';

  let cleanContent = cleanMessageFromJson(content);
  if (cleanContent.length <= maxLength) return cleanContent;

  let preview = cleanContent.substring(0, maxLength);
  const lastSpace = preview.lastIndexOf(' ');
  if (lastSpace > maxLength * 0.7) {
    preview = preview.substring(0, lastSpace);
  }

  return preview + '...';
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Formatter les nombres avec separateurs
// ─────────────────────────────────────────────────────────────────────────────
function formatNumber(num, decimals = 0) {
  if (num === null || num === undefined || isNaN(num)) return 'N/A';
  return Number(num).toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Formatter les pourcentages
// ─────────────────────────────────────────────────────────────────────────────
function formatPercent(num, decimals = 2) {
  if (num === null || num === undefined || isNaN(num)) return 'N/A';
  return Number(num).toFixed(decimals) + '%';
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1: UNWRAP INPUT
// ─────────────────────────────────────────────────────────────────────────────
let parsedInput = unwrapN8nJson(rawInput);
const fullRawStr = JSON.stringify(parsedInput);
const fullRawStrLower = fullRawStr.toLowerCase();

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2: EXTRACTION DES DONNEES ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────

// KPIs principaux
let kpis = parsedInput?.kpis || [];
let metrics = parsedInput?.metrics || {};
let charts = parsedInput?.charts || [];
let sections = parsedInput?.sections || [];
let recommendations = parsedInput?.recommendations || [];
let insights = parsedInput?.insights || [];

// Metriques GA4 / GSC communes
let sessions = parsedInput?.sessions || parsedInput?.visits || metrics?.sessions || 0;
let users = parsedInput?.users || parsedInput?.visitors || metrics?.users || 0;
let pageviews = parsedInput?.pageviews || parsedInput?.page_views || metrics?.pageviews || 0;
let bounceRate = parsedInput?.bounce_rate || parsedInput?.bounceRate || metrics?.bounce_rate || 0;
let avgSessionDuration = parsedInput?.avg_session_duration || parsedInput?.avgSessionDuration || metrics?.avg_session_duration || 0;

// Metriques SEO / GSC
let impressions = parsedInput?.impressions || metrics?.impressions || 0;
let clicks = parsedInput?.clicks || parsedInput?.clics || metrics?.clicks || 0;
let ctr = parsedInput?.ctr || metrics?.ctr || 0;
let avgPosition = parsedInput?.avg_position || parsedInput?.avgPosition || parsedInput?.position || metrics?.avg_position || 0;

// Metriques E-commerce
let revenue = parsedInput?.revenue || parsedInput?.total_revenue || metrics?.revenue || 0;
let conversions = parsedInput?.conversions || parsedInput?.transactions || metrics?.conversions || 0;
let conversionRate = parsedInput?.conversion_rate || parsedInput?.conversionRate || metrics?.conversion_rate || 0;

// Construire les KPIs si non fournis
if (kpis.length === 0) {
  if (sessions > 0) {
    kpis.push({ label: 'Sessions', value: formatNumber(sessions), trend: null });
  }
  if (users > 0) {
    kpis.push({ label: 'Utilisateurs', value: formatNumber(users), trend: null });
  }
  if (pageviews > 0) {
    kpis.push({ label: 'Pages vues', value: formatNumber(pageviews), trend: null });
  }
  if (impressions > 0) {
    kpis.push({ label: 'Impressions', value: formatNumber(impressions), trend: null });
  }
  if (clicks > 0) {
    kpis.push({ label: 'Clics', value: formatNumber(clicks), trend: null });
  }
  if (ctr > 0) {
    kpis.push({ label: 'CTR', value: formatPercent(ctr), trend: null });
  }
  if (avgPosition > 0) {
    kpis.push({ label: 'Position moyenne', value: avgPosition.toFixed(1), trend: null });
  }
  if (revenue > 0) {
    kpis.push({ label: 'Revenus', value: formatNumber(revenue, 2) + ' €', trend: null });
  }
  if (conversions > 0) {
    kpis.push({ label: 'Conversions', value: formatNumber(conversions), trend: null });
  }
  if (conversionRate > 0) {
    kpis.push({ label: 'Taux de conversion', value: formatPercent(conversionRate), trend: null });
  }
  if (bounceRate > 0) {
    kpis.push({ label: 'Taux de rebond', value: formatPercent(bounceRate), trend: null });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3: EXTRACTION DU CONTENU DU RAPPORT
// ─────────────────────────────────────────────────────────────────────────────
let reportContent = '';
let reportTitle = '';

// Titre
const titleMatch = fullRawStr.match(/"(?:title|headline|report_title)"\s*:\s*"((?:[^"\\]|\\.)*)"/);
if (titleMatch && titleMatch[1] && titleMatch[1].length > 3) {
  reportTitle = titleMatch[1]
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

// Contenu
const contentMatch = fullRawStr.match(/"[Cc]ontent"\s*:\s*"((?:[^"\\]|\\.)*)"/);
if (contentMatch && contentMatch[1] && contentMatch[1].length > 100) {
  reportContent = contentMatch[1]
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4: EXTRACTION DU CHAT MESSAGE
// ─────────────────────────────────────────────────────────────────────────────
let rawMessage = '';

if (parsedInput?.chat_message) {
  const chatMsg = parsedInput.chat_message;
  if (typeof chatMsg === 'string') {
    rawMessage = chatMsg;
  } else if (typeof chatMsg === 'object') {
    rawMessage = chatMsg.content || chatMsg.text || chatMsg.message || '';
  }
}

if (!rawMessage) {
  rawMessage = parsedInput?.message || parsedInput?.response || parsedInput?.text || '';
}

let finalMessage = cleanMessageFromJson(rawMessage);

// ─────────────────────────────────────────────────────────────────────────────
// STEP 5: DETECTION DU TYPE DE CONTENU
// ─────────────────────────────────────────────────────────────────────────────
const hasAnalyticsData = kpis.length > 0 ||
                         sessions > 0 ||
                         impressions > 0 ||
                         clicks > 0 ||
                         users > 0;

const hasReportContent = reportContent.length > 200 || finalMessage.length > 1000;

const isGa4Report = fullRawStrLower.includes('ga4') ||
                    fullRawStrLower.includes('google analytics') ||
                    fullRawStrLower.includes('analytics');

const isGscReport = fullRawStrLower.includes('gsc') ||
                    fullRawStrLower.includes('search console') ||
                    fullRawStrLower.includes('google search');

const isTrafficReport = fullRawStrLower.includes('trafic') ||
                        fullRawStrLower.includes('traffic') ||
                        fullRawStrLower.includes('sessions') ||
                        fullRawStrLower.includes('visiteurs');

const isPerformanceReport = fullRawStrLower.includes('performance') ||
                            fullRawStrLower.includes('kpi') ||
                            fullRawStrLower.includes('metrique');

// Determiner si on genere un ANALYTICS_DASHBOARD
const shouldGenerateDashboard = hasAnalyticsData || hasReportContent ||
                                 isGa4Report || isGscReport ||
                                 isTrafficReport || isPerformanceReport;

// ─────────────────────────────────────────────────────────────────────────────
// STEP 6: CONSTRUCTION DES UI COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
let finalComponents = [];

if (shouldGenerateDashboard) {
  // Determiner le titre
  if (!reportTitle) {
    if (isGa4Report) {
      reportTitle = 'Dashboard Google Analytics';
    } else if (isGscReport) {
      reportTitle = 'Dashboard Search Console';
    } else if (isTrafficReport) {
      reportTitle = 'Analyse du Trafic';
    } else if (isPerformanceReport) {
      reportTitle = 'Dashboard Performance';
    } else {
      reportTitle = 'Dashboard Analytics';
    }
  }

  const content = reportContent || finalMessage;

  finalComponents.push({
    type: 'ANALYTICS_DASHBOARD',
    data: {
      title: reportTitle,
      content: content,
      kpis: kpis,
      metrics: {
        sessions: sessions,
        users: users,
        pageviews: pageviews,
        bounce_rate: bounceRate,
        avg_session_duration: avgSessionDuration,
        impressions: impressions,
        clicks: clicks,
        ctr: ctr,
        avg_position: avgPosition,
        revenue: revenue,
        conversions: conversions,
        conversion_rate: conversionRate
      },
      charts: charts,
      sections: sections,
      recommendations: recommendations,
      insights: insights,
      data_source: isGa4Report ? 'GA4' : isGscReport ? 'GSC' : 'Mixed',
      date_range: parsedInput?.date_range || parsedInput?.period || 'Last 30 days',
      char_count: content.length,
      generated_at: new Date().toISOString()
    },
    layout: { width: 'full', order: 1 }
  });

  // Construire le message
  if (!finalMessage || finalMessage.length < 50) {
    finalMessage = `**${reportTitle} genere !**\n\nVoici l'analyse de vos donnees.\n\n`;

    // Afficher les KPIs principaux
    if (kpis.length > 0) {
      finalMessage += `**Metriques cles:**\n`;
      kpis.slice(0, 5).forEach(kpi => {
        finalMessage += `- **${kpi.label}:** ${kpi.value}`;
        if (kpi.trend) {
          finalMessage += ` (${kpi.trend > 0 ? '↑' : '↓'} ${Math.abs(kpi.trend)}%)`;
        }
        finalMessage += `\n`;
      });
    }

    if (insights.length > 0) {
      finalMessage += `\n**Insights:**\n`;
      insights.slice(0, 3).forEach((insight, i) => {
        const insightText = typeof insight === 'string' ? insight : insight.text || insight.insight;
        finalMessage += `${i + 1}. ${insightText.substring(0, 100)}${insightText.length > 100 ? '...' : ''}\n`;
      });
    }

    if (recommendations.length > 0) {
      finalMessage += `\n**Recommandations:**\n`;
      recommendations.slice(0, 3).forEach((reco, i) => {
        const recoText = typeof reco === 'string' ? reco : reco.text || reco.recommendation;
        finalMessage += `${i + 1}. ${recoText.substring(0, 100)}${recoText.length > 100 ? '...' : ''}\n`;
      });
    }

    finalMessage += `\n*Telechargez le rapport complet pour plus de details.*`;
  }
}
// CAS: Reponse sans dashboard
else {
  if (parsedInput?.ui_components && parsedInput.ui_components.length > 0) {
    finalComponents = parsedInput.ui_components;
  } else if (parsedInput?.ui_component) {
    finalComponents.push({
      type: parsedInput.ui_component,
      data: parsedInput.data || parsedInput,
      layout: { width: 'full', order: 1 }
    });
  }
}

// Fallback message
if (!finalMessage || finalMessage.length < 20) {
  if (shouldGenerateDashboard) {
    finalMessage = '**Dashboard genere !**\n\nConsultez les metriques ci-dessous.';
  } else {
    finalMessage = rawMessage || 'Analyse terminee.';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 7: BUILD MEMORY CONTRIBUTION (V4.3 Collective Memory)
// ─────────────────────────────────────────────────────────────────────────────
function buildMemoryContribution(shouldGenerateDashboard, isGa4Report, isGscReport, isTrafficReport, isPerformanceReport, reportTitle, kpis, insights, recommendations, metrics) {
  // Determine action type
  let action = 'TASK_COMPLETED';
  if (shouldGenerateDashboard) action = 'ANALYSIS_COMPLETED';
  if (insights.length > 0) action = 'INSIGHT_DISCOVERED';

  // Determine report type name
  const reportType = isGa4Report ? 'GA4 Analytics' :
                     isGscReport ? 'Search Console' :
                     isTrafficReport ? 'Trafic' : 'Performance';

  // Build summary
  let summary = '';
  if (shouldGenerateDashboard) {
    summary = `Dashboard ${reportType}: ${kpis.length} KPIs, ${insights.length} insights, ${recommendations.length} recommandations`;
  } else {
    summary = 'Analyse data complétée';
  }

  // Build key findings
  const keyFindings = [];
  if (reportTitle) {
    keyFindings.push(`Type: ${reportType}`);
  }

  // Add top KPIs as findings
  if (kpis.length > 0) {
    kpis.slice(0, 4).forEach(kpi => {
      keyFindings.push(`${kpi.label}: ${kpi.value}${kpi.trend ? ` (${kpi.trend > 0 ? '+' : ''}${kpi.trend}%)` : ''}`);
    });
  }

  // Add key metrics
  if (metrics.sessions > 0) keyFindings.push(`Sessions: ${formatNumber(metrics.sessions)}`);
  if (metrics.conversions > 0) keyFindings.push(`Conversions: ${formatNumber(metrics.conversions)}`);
  if (metrics.ctr > 0) keyFindings.push(`CTR: ${formatPercent(metrics.ctr)}`);

  // Add top insights
  if (insights.length > 0) {
    insights.slice(0, 2).forEach(i => {
      const text = typeof i === 'string' ? i : i.text || i.insight;
      keyFindings.push(`Insight: ${text.substring(0, 60)}...`);
    });
  }

  // Build deliverables
  const deliverables = [];
  if (shouldGenerateDashboard) {
    deliverables.push({
      type: 'report',
      url: null,
      title: reportTitle || 'Dashboard Analytics',
      description: `${kpis.length} KPIs analysés`
    });
  }

  // Build recommendations for other agents
  const recommendationsForAgents = [];
  if (isGa4Report || isTrafficReport) {
    recommendationsForAgents.push('Pour Marcus: Données trafic disponibles pour optimisation des campagnes');
    if (metrics.bounce_rate > 50) {
      recommendationsForAgents.push('Pour Milo: Taux de rebond élevé - améliorer les landing pages');
    }
    if (metrics.conversion_rate > 0) {
      recommendationsForAgents.push(`Pour Marcus: Taux de conversion actuel: ${formatPercent(metrics.conversion_rate)} - base pour objectifs`);
    }
  }
  if (isGscReport) {
    recommendationsForAgents.push('Pour Luna: Positions SEO identifiées - opportunités de contenu');
    if (metrics.avg_position > 10) {
      recommendationsForAgents.push(`Pour Luna: Position moyenne ${metrics.avg_position.toFixed(1)} - amélioration possible`);
    }
  }

  // Forward insights to relevant agents
  if (insights.length > 0) {
    insights.slice(0, 2).forEach(i => {
      const text = typeof i === 'string' ? i : i.text || i.insight;
      recommendationsForAgents.push(`Data insight: ${text.substring(0, 50)}...`);
    });
  }

  return {
    action: action,
    summary: summary,
    key_findings: keyFindings,
    deliverables: deliverables,
    recommendations_for_next_agent: recommendationsForAgents,
    flags_to_update: shouldGenerateDashboard ? { tracking_ready: true } : null
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 8: CONSTRUCTION REPONSE FINALE
// ─────────────────────────────────────────────────────────────────────────────
const memoryContribution = buildMemoryContribution(
  shouldGenerateDashboard, isGa4Report, isGscReport,
  isTrafficReport, isPerformanceReport, reportTitle,
  kpis, insights, recommendations,
  { sessions, users, pageviews, bounce_rate: bounceRate,
    impressions, clicks, ctr, avg_position: avgPosition,
    revenue, conversions, conversion_rate: conversionRate }
);

const uiResponse = {
  thought_process: {
    step: 'Format UI Response V16 - Analyst',
    reasoning: shouldGenerateDashboard ? `Analytics detecte (${
      isGa4Report ? 'GA4' :
      isGscReport ? 'GSC' :
      isTrafficReport ? 'Traffic' : 'Performance'
    }) → ANALYTICS_DASHBOARD` : 'Reponse standard',
    detected_type: shouldGenerateDashboard ? 'analytics_dashboard' : 'default',
    has_analytics_data: hasAnalyticsData,
    has_report_content: hasReportContent,
    is_ga4_report: isGa4Report,
    is_gsc_report: isGscReport,
    is_traffic_report: isTrafficReport,
    is_performance_report: isPerformanceReport,
    kpis_count: kpis.length,
    recommendations_count: recommendations.length,
    insights_count: insights.length
  },

  chat_message: finalMessage,
  ui_component: finalComponents.length > 0 ? finalComponents[0].type : null,
  ui_components: finalComponents,

  analyst_result: shouldGenerateDashboard ? {
    title: reportTitle,
    kpis: kpis,
    metrics: {
      sessions, users, pageviews, bounce_rate: bounceRate,
      impressions, clicks, ctr, avg_position: avgPosition,
      revenue, conversions, conversion_rate: conversionRate
    },
    insights: insights,
    recommendations: recommendations,
    data_source: isGa4Report ? 'GA4' : isGscReport ? 'GSC' : 'Mixed'
  } : null,

  // V4.3 COLLECTIVE MEMORY - Contribution for PM to write to Supabase
  memory_contribution: memoryContribution,

  meta: {
    agent_id: 'sora',
    agent_name: 'Sora',
    agent_role: 'Data Analyst',
    version: 'v16_memory',
    timestamp: new Date().toISOString(),
    request_id: `analyst_${Date.now()}`,
    detected_type: shouldGenerateDashboard ? 'analytics_dashboard' : 'default'
  }
};

return [{ json: uiResponse }];
