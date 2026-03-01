// ============================================================================
// FORMAT UI RESPONSE - Trader MCP (Marcus)
// ============================================================================
// Ce node formate les reponses du Trader Agent pour le frontend
// Type principal genere: CAMPAIGN_TABLE (donnees de campagnes pub)
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
// HELPER: Formatter les nombres avec separateurs
// ─────────────────────────────────────────────────────────────────────────────
function formatNumber(num, decimals = 2) {
  if (num === null || num === undefined || isNaN(num)) return 'N/A';
  return Number(num).toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Formatter les devises
// ─────────────────────────────────────────────────────────────────────────────
function formatCurrency(num, currency = 'EUR') {
  if (num === null || num === undefined || isNaN(num)) return 'N/A';
  return Number(num).toLocaleString('fr-FR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1: UNWRAP INPUT
// ─────────────────────────────────────────────────────────────────────────────
let parsedInput = unwrapN8nJson(rawInput);
const fullRawStr = JSON.stringify(parsedInput);
const fullRawStrLower = fullRawStr.toLowerCase();

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2: EXTRACTION DES DONNEES DE CAMPAGNES
// ─────────────────────────────────────────────────────────────────────────────
let campaigns = parsedInput?.campaigns || [];
let budget = parsedInput?.budget || null;
let recommendations = parsedInput?.recommendations || [];
let alerts = parsedInput?.alerts || [];

// KPIs globaux
let totalSpend = parsedInput?.total_spend || parsedInput?.spend || 0;
let totalRevenue = parsedInput?.total_revenue || parsedInput?.revenue || 0;
let globalRoas = parsedInput?.roas || parsedInput?.global_roas || 0;
let globalCpc = parsedInput?.cpc || parsedInput?.avg_cpc || 0;
let globalCpm = parsedInput?.cpm || parsedInput?.avg_cpm || 0;
let globalCtr = parsedInput?.ctr || parsedInput?.avg_ctr || 0;
let conversions = parsedInput?.conversions || 0;
let cpa = parsedInput?.cpa || 0;

// Extraire les campagnes si fournies sous forme differente
if (campaigns.length === 0 && parsedInput?.campaign_data) {
  campaigns = Array.isArray(parsedInput.campaign_data)
    ? parsedInput.campaign_data
    : [parsedInput.campaign_data];
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3: EXTRACTION DU CHAT MESSAGE
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
// STEP 4: DETECTION DU TYPE DE CONTENU
// ─────────────────────────────────────────────────────────────────────────────
const hasCampaignData = campaigns.length > 0 ||
                        totalSpend > 0 ||
                        globalRoas > 0 ||
                        fullRawStrLower.includes('campaign') ||
                        fullRawStrLower.includes('campagne');

const hasBudgetRecommendation = fullRawStrLower.includes('budget') ||
                                 fullRawStrLower.includes('scale') ||
                                 fullRawStrLower.includes('cut') ||
                                 fullRawStrLower.includes('kill');

const hasAdsMetrics = fullRawStrLower.includes('roas') ||
                      fullRawStrLower.includes('cpc') ||
                      fullRawStrLower.includes('cpm') ||
                      fullRawStrLower.includes('ctr') ||
                      fullRawStrLower.includes('cpa');

const shouldGenerateCampaignTable = hasCampaignData || (hasBudgetRecommendation && hasAdsMetrics);

// ─────────────────────────────────────────────────────────────────────────────
// STEP 5: CONSTRUCTION DES UI COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
let finalComponents = [];

if (shouldGenerateCampaignTable) {
  // Construire les lignes de campagnes
  const campaignRows = campaigns.map(campaign => ({
    name: campaign.name || campaign.campaign_name || 'Campaign',
    platform: campaign.platform || 'Meta',
    status: campaign.status || 'active',
    spend: campaign.spend || campaign.cost || 0,
    revenue: campaign.revenue || campaign.value || 0,
    roas: campaign.roas || (campaign.revenue && campaign.spend ? (campaign.revenue / campaign.spend).toFixed(2) : 0),
    cpc: campaign.cpc || 0,
    cpm: campaign.cpm || 0,
    ctr: campaign.ctr || 0,
    conversions: campaign.conversions || 0,
    cpa: campaign.cpa || (campaign.conversions && campaign.spend ? (campaign.spend / campaign.conversions).toFixed(2) : 0)
  }));

  finalComponents.push({
    type: 'CAMPAIGN_TABLE',
    data: {
      campaigns: campaignRows,
      summary: {
        total_spend: totalSpend,
        total_revenue: totalRevenue,
        global_roas: globalRoas,
        avg_cpc: globalCpc,
        avg_cpm: globalCpm,
        avg_ctr: globalCtr,
        total_conversions: conversions,
        avg_cpa: cpa
      },
      budget: budget,
      recommendations: recommendations,
      alerts: alerts,
      platform: parsedInput?.platform || 'Meta Ads',
      date_range: parsedInput?.date_range || 'Last 7 days',
      generated_at: new Date().toISOString()
    },
    layout: { width: 'full', order: 1 }
  });

  // Construire le message
  if (!finalMessage || finalMessage.length < 50) {
    finalMessage = `**Analyse des campagnes terminee !**\n\n`;

    if (globalRoas > 0) {
      finalMessage += `**ROAS Global:** ${globalRoas.toFixed(2)}x\n`;
    }
    if (totalSpend > 0) {
      finalMessage += `**Depenses totales:** ${formatCurrency(totalSpend)}\n`;
    }
    if (totalRevenue > 0) {
      finalMessage += `**Revenus generes:** ${formatCurrency(totalRevenue)}\n`;
    }
    if (conversions > 0) {
      finalMessage += `**Conversions:** ${formatNumber(conversions, 0)}\n`;
    }

    if (campaigns.length > 0) {
      finalMessage += `\n**${campaigns.length} campagne(s)** analysee(s).`;
    }

    if (recommendations.length > 0) {
      finalMessage += `\n\n**Recommandations:**`;
      recommendations.slice(0, 3).forEach((reco, i) => {
        const recoText = typeof reco === 'string' ? reco : reco.text || reco.recommendation;
        finalMessage += `\n${i + 1}. ${recoText.substring(0, 100)}${recoText.length > 100 ? '...' : ''}`;
      });
    }

    if (alerts.length > 0) {
      finalMessage += `\n\n⚠️ **${alerts.length} alerte(s)** detectee(s).`;
    }
  }
}
// CAS: Reponse sans tableau de campagnes
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
  if (shouldGenerateCampaignTable) {
    finalMessage = '**Analyse des campagnes terminee !**\n\nConsultez le tableau ci-dessous pour les details.';
  } else {
    finalMessage = rawMessage || 'Analyse publicitaire terminee.';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 6: BUILD MEMORY CONTRIBUTION (V4.3 Collective Memory)
// ─────────────────────────────────────────────────────────────────────────────
function buildMemoryContribution(shouldGenerateCampaignTable, campaigns, totalSpend, totalRevenue, globalRoas, conversions, cpa, recommendations, alerts) {
  // Determine action type
  let action = 'TASK_COMPLETED';
  if (shouldGenerateCampaignTable) action = 'ANALYSIS_COMPLETED';
  if (alerts.length > 0) action = 'INSIGHT_DISCOVERED';

  // Build summary
  let summary = '';
  if (shouldGenerateCampaignTable) {
    const roasText = globalRoas > 0 ? ` ROAS ${globalRoas.toFixed(2)}x` : '';
    const spendText = totalSpend > 0 ? ` Dépenses: ${formatCurrency(totalSpend)}` : '';
    summary = `Analyse campagnes: ${campaigns.length} campagne(s),${roasText}${spendText}`;
  } else {
    summary = 'Analyse publicitaire complétée';
  }

  // Build key findings
  const keyFindings = [];
  if (globalRoas > 0) {
    keyFindings.push(`ROAS Global: ${globalRoas.toFixed(2)}x`);
    if (globalRoas >= 2) {
      keyFindings.push('Performance ROAS: Excellente (>2x)');
    } else if (globalRoas >= 1) {
      keyFindings.push('Performance ROAS: Rentable (1-2x)');
    } else {
      keyFindings.push('Performance ROAS: À optimiser (<1x)');
    }
  }
  if (totalSpend > 0) keyFindings.push(`Budget dépensé: ${formatCurrency(totalSpend)}`);
  if (totalRevenue > 0) keyFindings.push(`Revenus générés: ${formatCurrency(totalRevenue)}`);
  if (conversions > 0) keyFindings.push(`Conversions: ${formatNumber(conversions, 0)}`);
  if (cpa > 0) keyFindings.push(`CPA moyen: ${formatCurrency(cpa)}`);

  // Add campaign names
  if (campaigns.length > 0 && campaigns.length <= 5) {
    campaigns.forEach(c => {
      const name = c.name || c.campaign_name || 'Campaign';
      const cRoas = c.roas || 'N/A';
      keyFindings.push(`Campagne ${name}: ROAS ${cRoas}`);
    });
  }

  // Add alerts as findings
  if (alerts.length > 0) {
    alerts.slice(0, 2).forEach(a => {
      const text = typeof a === 'string' ? a : a.text || a.alert;
      keyFindings.push(`⚠️ Alerte: ${text.substring(0, 50)}`);
    });
  }

  // Build deliverables
  const deliverables = [];
  if (shouldGenerateCampaignTable) {
    deliverables.push({
      type: 'report',
      url: null,
      title: 'Tableau des Campagnes',
      description: `${campaigns.length} campagnes analysées`
    });
  }

  // Build recommendations for other agents
  const recommendationsForAgents = [];
  if (globalRoas > 0) {
    if (globalRoas >= 2) {
      recommendationsForAgents.push('Pour Marcus (self): Scaler les campagnes performantes');
      recommendationsForAgents.push('Pour Milo: Créer plus de variantes des créatifs gagnants');
    } else if (globalRoas < 1) {
      recommendationsForAgents.push('Pour Milo: Revoir les créatifs - performance faible');
      recommendationsForAgents.push('Pour Luna: Revoir le ciblage et le positionnement');
    }
  }
  if (cpa > 0) {
    recommendationsForAgents.push(`Pour Sora: Tracker le CPA actuel (${formatCurrency(cpa)}) comme baseline`);
  }
  if (conversions > 0) {
    recommendationsForAgents.push(`Pour Sora: ${conversions} conversions à analyser dans GA4`);
  }

  // Forward recommendations
  if (recommendations.length > 0) {
    recommendations.slice(0, 2).forEach(r => {
      const text = typeof r === 'string' ? r : r.text || r.recommendation;
      recommendationsForAgents.push(`Ads: ${text.substring(0, 50)}...`);
    });
  }

  // Determine flags to update
  const flagsToUpdate = {};
  if (shouldGenerateCampaignTable && campaigns.length > 0) {
    flagsToUpdate.ads_live = true;
  }
  if (globalRoas >= 1.5 && totalSpend > 100) {
    flagsToUpdate.budget_approved = true;
  }

  return {
    action: action,
    summary: summary,
    key_findings: keyFindings,
    deliverables: deliverables,
    recommendations_for_next_agent: recommendationsForAgents,
    flags_to_update: Object.keys(flagsToUpdate).length > 0 ? flagsToUpdate : null
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 7: CONSTRUCTION REPONSE FINALE
// ─────────────────────────────────────────────────────────────────────────────
const memoryContribution = buildMemoryContribution(
  shouldGenerateCampaignTable, campaigns,
  totalSpend, totalRevenue, globalRoas,
  conversions, cpa, recommendations, alerts
);

const uiResponse = {
  thought_process: {
    step: 'Format UI Response - Trader',
    reasoning: shouldGenerateCampaignTable ? 'Donnees campagne detectees → CAMPAIGN_TABLE' : 'Reponse standard',
    detected_type: shouldGenerateCampaignTable ? 'campaign_table' : 'default',
    has_campaign_data: hasCampaignData,
    has_budget_recommendation: hasBudgetRecommendation,
    has_ads_metrics: hasAdsMetrics,
    campaigns_count: campaigns.length,
    recommendations_count: recommendations.length,
    alerts_count: alerts.length
  },

  chat_message: finalMessage,
  ui_component: finalComponents.length > 0 ? finalComponents[0].type : null,
  ui_components: finalComponents,

  trader_result: shouldGenerateCampaignTable ? {
    campaigns: campaigns,
    summary: {
      total_spend: totalSpend,
      total_revenue: totalRevenue,
      global_roas: globalRoas,
      conversions: conversions,
      cpa: cpa
    },
    recommendations: recommendations,
    alerts: alerts
  } : null,

  // V4.3 COLLECTIVE MEMORY - Contribution for PM to write to Supabase
  memory_contribution: memoryContribution,

  meta: {
    agent_id: 'marcus',
    agent_name: 'Marcus',
    agent_role: 'Media Buyer',
    version: 'v1_memory',
    timestamp: new Date().toISOString(),
    request_id: `trader_${Date.now()}`,
    detected_type: shouldGenerateCampaignTable ? 'campaign_table' : 'default'
  }
};

return [{ json: uiResponse }];
