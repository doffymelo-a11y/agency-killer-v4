// ============================================================================
// FORMAT UI RESPONSE V10 - Strategist MCP (Luna)
// ============================================================================
// Ce node formate les reponses du Strategist Agent pour le frontend
// Type principal genere: PDF_REPORT (rapports strategiques, analyses SEO, audits)
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
  cleaned = cleaned.replace(/\{\s*"type"\s*:\s*"(PDF_|CAMPAGNE_|CAMPAIGN_|AD_|VIDEO_)[\s\S]*$/gi, '');
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
// STEP 1: UNWRAP INPUT
// ─────────────────────────────────────────────────────────────────────────────
let parsedInput = unwrapN8nJson(rawInput);
const fullRawStr = JSON.stringify(parsedInput);
const fullRawStrLower = fullRawStr.toLowerCase();

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2: EXTRACTION DU CONTENU DU RAPPORT
// ─────────────────────────────────────────────────────────────────────────────
let reportContent = '';
let reportTitle = '';

// Titre du rapport
const titleMatch = fullRawStr.match(/"(?:title|headline|report_title)"\s*:\s*"((?:[^"\\]|\\.)*)"/);
if (titleMatch && titleMatch[1] && titleMatch[1].length > 3) {
  reportTitle = titleMatch[1]
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

// Contenu du rapport - plusieurs methodes
// Methode 1: Champ "content"
const contentMatch = fullRawStr.match(/"[Cc]ontent"\s*:\s*"((?:[^"\\]|\\.)*)"/);
if (contentMatch && contentMatch[1] && contentMatch[1].length > 200) {
  reportContent = contentMatch[1]
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

// Methode 2: Champ "body"
if (!reportContent || reportContent.length < 200) {
  const bodyMatch = fullRawStr.match(/"body"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (bodyMatch && bodyMatch[1] && bodyMatch[1].length > 200) {
    reportContent = bodyMatch[1]
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  }
}

// Methode 3: Champ "report"
if (!reportContent || reportContent.length < 200) {
  const reportMatch = fullRawStr.match(/"report"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (reportMatch && reportMatch[1] && reportMatch[1].length > 200) {
    reportContent = reportMatch[1]
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  }
}

// Methode 4: Chercher un texte long avec des marqueurs de rapport
if (!reportContent || reportContent.length < 200) {
  const reportPatterns = fullRawStr.match(/"[^"]*(?:##|Analyse|Recommandation|Conclusion|Audit|Strategy|Strategie|SEO|\\n\\n)[^"]{400,}"/g);
  if (reportPatterns && reportPatterns.length > 0) {
    let longestMatch = '';
    for (const match of reportPatterns) {
      const cleaned = match.slice(1, -1);
      if (cleaned.length > longestMatch.length) {
        longestMatch = cleaned;
      }
    }
    if (longestMatch.length > 200) {
      reportContent = longestMatch
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
    }
  }
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
// STEP 4: EXTRACTION DES SECTIONS ET RECOMMANDATIONS
// ─────────────────────────────────────────────────────────────────────────────
let sections = parsedInput?.sections || [];
let recommendations = parsedInput?.recommendations || [];
let kpis = parsedInput?.kpis || [];
let competitors = parsedInput?.competitors || [];

// Extraire les recommandations du contenu si non fournies
if (recommendations.length === 0 && reportContent) {
  const recoMatch = reportContent.match(/recommandation[s]?\s*:?\s*\n([\s\S]*?)(?:\n##|$)/i);
  if (recoMatch && recoMatch[1]) {
    const recoLines = recoMatch[1].split('\n').filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'));
    recommendations = recoLines.map(line => line.replace(/^[-•]\s*/, '').trim()).filter(r => r.length > 10);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 5: DETECTION DU TYPE DE RAPPORT
// ─────────────────────────────────────────────────────────────────────────────
const isLongContent = (reportContent.length > 500) || (finalMessage.length > 1500);

const isSeoReport = fullRawStrLower.includes('seo') ||
                    fullRawStrLower.includes('search engine') ||
                    fullRawStrLower.includes('mots-cles') ||
                    fullRawStrLower.includes('keywords') ||
                    fullRawStrLower.includes('backlink');

const isCompetitorReport = fullRawStrLower.includes('concurrent') ||
                           fullRawStrLower.includes('competitor') ||
                           fullRawStrLower.includes('benchmark') ||
                           fullRawStrLower.includes('veille');

const isAuditReport = fullRawStrLower.includes('audit') ||
                      fullRawStrLower.includes('analyse technique') ||
                      fullRawStrLower.includes('technical analysis');

const isStrategyReport = fullRawStrLower.includes('strategie') ||
                         fullRawStrLower.includes('strategy') ||
                         fullRawStrLower.includes('plan d\'action') ||
                         fullRawStrLower.includes('action plan');

// Determiner si on doit generer un PDF_REPORT
const shouldGeneratePdfReport = isLongContent || isSeoReport || isCompetitorReport || isAuditReport || isStrategyReport;

// ─────────────────────────────────────────────────────────────────────────────
// STEP 6: CONSTRUCTION DES UI COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
let finalComponents = [];

if (shouldGeneratePdfReport) {
  // Determiner le titre par defaut selon le type
  if (!reportTitle) {
    if (isSeoReport) {
      reportTitle = 'Rapport SEO';
    } else if (isCompetitorReport) {
      reportTitle = 'Analyse Concurrentielle';
    } else if (isAuditReport) {
      reportTitle = 'Audit Strategique';
    } else if (isStrategyReport) {
      reportTitle = 'Plan Strategique';
    } else {
      reportTitle = 'Rapport Strategique';
    }
  }

  const content = reportContent || finalMessage;

  finalComponents.push({
    type: 'PDF_REPORT',
    data: {
      title: reportTitle,
      content: content,
      sections: sections,
      kpis: kpis,
      recommendations: recommendations,
      competitors: competitors,
      report_type: isSeoReport ? 'seo' :
                   isCompetitorReport ? 'competitor' :
                   isAuditReport ? 'audit' : 'strategy',
      char_count: content.length,
      word_count: content.split(/\s+/).length,
      generated_at: new Date().toISOString()
    },
    layout: { width: 'full', order: 1 }
  });

  // Message pour PDF_REPORT
  const contentPreview = generateContentPreview(content, 350);

  finalMessage = `**${reportTitle} genere !**\n\nVoici mon analyse et mes recommandations strategiques.`;

  if (recommendations.length > 0) {
    finalMessage += `\n\n**Points cles :**`;
    const topRecos = recommendations.slice(0, 3);
    topRecos.forEach((reco, i) => {
      finalMessage += `\n${i + 1}. ${reco.substring(0, 100)}${reco.length > 100 ? '...' : ''}`;
    });
  } else if (contentPreview && contentPreview.length > 50) {
    finalMessage += `\n\n**Resume :**\n${contentPreview}`;
  }

  finalMessage += `\n\n*Telechargez le rapport complet pour acceder a toutes les recommandations.*`;
}
// CAS: Reponse courte sans PDF
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
  // Sinon, pas de composant UI special
}

// Fallback message
if (!finalMessage || finalMessage.length < 20) {
  if (shouldGeneratePdfReport) {
    finalMessage = '**Rapport genere !**\n\nTelechargez le PDF ci-dessous pour acceder a l\'analyse complete.';
  } else {
    finalMessage = rawMessage || 'Analyse terminee.';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 7: BUILD MEMORY CONTRIBUTION (V4.3 Collective Memory)
// ─────────────────────────────────────────────────────────────────────────────
function buildMemoryContribution(shouldGeneratePdfReport, isSeoReport, isCompetitorReport, isAuditReport, isStrategyReport, reportTitle, reportContent, recommendations, competitors) {
  // Determine action type
  let action = 'TASK_COMPLETED';
  if (shouldGeneratePdfReport) action = 'ANALYSIS_COMPLETED';
  if (isStrategyReport) action = 'STRATEGY_VALIDATED';
  if (recommendations.length > 0) action = 'RECOMMENDATION_MADE';

  // Determine report type name
  const reportType = isSeoReport ? 'SEO' :
                     isCompetitorReport ? 'Analyse concurrentielle' :
                     isAuditReport ? 'Audit' : 'Stratégie';

  // Build summary
  let summary = '';
  if (shouldGeneratePdfReport) {
    const wordCount = reportContent ? reportContent.split(/\s+/).length : 0;
    summary = `${reportType}: "${reportTitle || 'Rapport'}" (${wordCount} mots, ${recommendations.length} recommandations)`;
  } else {
    summary = 'Analyse stratégique complétée';
  }

  // Build key findings
  const keyFindings = [];
  if (reportTitle) {
    keyFindings.push(`Type: ${reportType}`);
  }
  if (isSeoReport) {
    keyFindings.push('Focus SEO et mots-clés identifiés');
  }
  if (isCompetitorReport && competitors.length > 0) {
    keyFindings.push(`${competitors.length} concurrents analysés`);
  }
  if (recommendations.length > 0) {
    keyFindings.push(`${recommendations.length} recommandations stratégiques`);
    // Add top 3 recommendations as findings
    recommendations.slice(0, 3).forEach(r => {
      keyFindings.push(r.substring(0, 80) + (r.length > 80 ? '...' : ''));
    });
  }

  // Build deliverables
  const deliverables = [];
  if (shouldGeneratePdfReport) {
    deliverables.push({
      type: 'pdf',
      url: null, // Will be generated by frontend
      title: reportTitle || 'Rapport Stratégique',
      description: `${reportType} - ${recommendations.length} recommandations`
    });
  }

  // Build recommendations for other agents
  const recommendationsForAgents = [];
  if (isSeoReport) {
    recommendationsForAgents.push('Pour Milo: Créer du contenu optimisé pour les mots-clés identifiés');
    recommendationsForAgents.push('Pour Sora: Configurer le tracking des positions SEO');
  }
  if (isCompetitorReport) {
    recommendationsForAgents.push('Pour Marcus: Ajuster les enchères vs concurrents identifiés');
    recommendationsForAgents.push('Pour Milo: S\'inspirer des angles créatifs concurrentiels');
  }
  if (isStrategyReport) {
    recommendationsForAgents.push('Pour Milo: Appliquer le ton et positionnement définis');
    recommendationsForAgents.push('Pour Marcus: Suivre les budgets et KPIs recommandés');
  }
  if (recommendations.length > 0) {
    // Forward strategic recommendations to relevant agents
    recommendations.slice(0, 2).forEach(r => {
      recommendationsForAgents.push(`Stratégie: ${r.substring(0, 60)}...`);
    });
  }

  // Determine flags to update
  const flagsToUpdate = {};
  if (isStrategyReport || isAuditReport) {
    flagsToUpdate.strategy_validated = true;
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
// STEP 8: CONSTRUCTION REPONSE FINALE
// ─────────────────────────────────────────────────────────────────────────────
const memoryContribution = buildMemoryContribution(
  shouldGeneratePdfReport, isSeoReport, isCompetitorReport,
  isAuditReport, isStrategyReport, reportTitle, reportContent,
  recommendations, competitors
);

const uiResponse = {
  thought_process: {
    step: 'Format UI Response V10 - Strategist',
    reasoning: shouldGeneratePdfReport ? `Rapport detecte (${
      isSeoReport ? 'SEO' :
      isCompetitorReport ? 'Competitor' :
      isAuditReport ? 'Audit' : 'Strategy'
    }) → PDF_REPORT` : 'Reponse standard',
    detected_type: shouldGeneratePdfReport ? 'pdf_report' : 'default',
    is_long_content: isLongContent,
    is_seo_report: isSeoReport,
    is_competitor_report: isCompetitorReport,
    is_audit_report: isAuditReport,
    is_strategy_report: isStrategyReport,
    report_content_length: reportContent.length,
    recommendations_count: recommendations.length,
    sections_count: sections.length
  },

  chat_message: finalMessage,
  ui_component: finalComponents.length > 0 ? finalComponents[0].type : null,
  ui_components: finalComponents,

  strategist_result: shouldGeneratePdfReport ? {
    title: reportTitle,
    content: reportContent || finalMessage,
    report_type: isSeoReport ? 'seo' :
                 isCompetitorReport ? 'competitor' :
                 isAuditReport ? 'audit' : 'strategy',
    recommendations: recommendations,
    competitors: competitors
  } : null,

  // V4.3 COLLECTIVE MEMORY - Contribution for PM to write to Supabase
  memory_contribution: memoryContribution,

  meta: {
    agent_id: 'luna',
    agent_name: 'Luna',
    agent_role: 'Strategist',
    version: 'v10_memory',
    timestamp: new Date().toISOString(),
    request_id: `strategist_${Date.now()}`,
    detected_type: shouldGeneratePdfReport ? 'pdf_report' : 'default'
  }
};

return [{ json: uiResponse }];
