// ============================================================================
// FORMAT UI RESPONSE V18.6 - Agency Killer Orchestrator
// ============================================================================
// FIX V18: Acces DIRECT aux outputs des tools via $('Tool: Call X')
// FIX V18.2: Fallback via message original quand tools non accessibles
// FIX V18.3: Extraction du contenu article via REGEX depuis fullRawStr
// FIX V18.4: Agent mapping corrige - isPdfCopywriting → TOUJOURS Milo
// FIX V18.5: Detection meta.agent_id des sub-workflows (Strategist → Luna)
// FIX V18.6: ANALYTICS_DASHBOARD → Sora, PDF_REPORT → Luna
// ============================================================================

const rawInput = $input.first().json;

// ═══════════════════════════════════════════════════════════════════════════
// V18 FIX: RECUPERER LES OUTPUTS DES TOOLS DIRECTEMENT
// ═══════════════════════════════════════════════════════════════════════════
let toolCreativeOutput = null;
let toolAnalystOutput = null;
let toolStrategistOutput = null;
let toolTraderOutput = null;

try {
  const creativeItems = $('Tool: Call Creative').all();
  if (creativeItems && creativeItems.length > 0) {
    toolCreativeOutput = creativeItems[0].json;
  }
} catch (e) { /* Tool not called */ }

try {
  const analystItems = $('Tool: Call Analyst').all();
  if (analystItems && analystItems.length > 0) {
    toolAnalystOutput = analystItems[0].json;
  }
} catch (e) { /* Tool not called */ }

try {
  const strategistItems = $('Tool: Call Strategist').all();
  if (strategistItems && strategistItems.length > 0) {
    toolStrategistOutput = strategistItems[0].json;
  }
} catch (e) { /* Tool not called */ }

try {
  const traderItems = $('Tool: Call Trader').all();
  if (traderItems && traderItems.length > 0) {
    toolTraderOutput = traderItems[0].json;
  }
} catch (e) { /* Tool not called */ }

// ═══════════════════════════════════════════════════════════════════════════
// V18.2 FIX: RECUPERER LE MESSAGE ORIGINAL DE L'UTILISATEUR
// Fallback quand $('Tool: Call X').all() ne fonctionne pas (sub-executions)
// ═══════════════════════════════════════════════════════════════════════════
let originalUserMessage = '';
try {
  const webhookData = $('Webhook Trigger')?.first()?.json;
  originalUserMessage = webhookData?.chatInput || webhookData?.body?.chatInput || '';
} catch (e) {}

if (!originalUserMessage) {
  try {
    const loadContextData = $('Load Global Context')?.first()?.json;
    originalUserMessage = loadContextData?.chatInput || '';
  } catch (e) {}
}

if (!originalUserMessage) {
  originalUserMessage = rawInput?.chatInput || rawInput?.original_message || '';
}

const originalMessageLower = (originalUserMessage || '').toLowerCase();

// ═══════════════════════════════════════════════════════════════════════════
// V18: FUSION DES DONNEES (Tool output prend la priorite sur rawInput)
// ═══════════════════════════════════════════════════════════════════════════
let mergedInput = { ...rawInput };

if (toolCreativeOutput) {
  mergedInput = { ...mergedInput, ...toolCreativeOutput, creative_response: toolCreativeOutput };
}
if (toolAnalystOutput) {
  mergedInput = { ...mergedInput, ...toolAnalystOutput, analyst_response: toolAnalystOutput };
}
if (toolStrategistOutput) {
  mergedInput = { ...mergedInput, ...toolStrategistOutput, strategist_response: toolStrategistOutput };
}
if (toolTraderOutput) {
  mergedInput = { ...mergedInput, ...toolTraderOutput, trader_response: toolTraderOutput };
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 0: EXTRACTION REGEX GLOBALE (AVANT TOUT PARSING)
// V18: Utilise mergedInput au lieu de rawInput
// ─────────────────────────────────────────────────────────────────────────────
const fullRawStr = JSON.stringify(mergedInput);
const fullRawStrLower = fullRawStr.toLowerCase();

// ═══════════════════════════════════════════════════════════════════════════
// V18.5 FIX: DETECTER META.AGENT_ID DES SUB-WORKFLOWS
// C'est la methode la plus fiable quand les tools ne sont pas accessibles
// ═══════════════════════════════════════════════════════════════════════════
let metaAgentId = null;

// Chercher via regex dans fullRawStr (le plus fiable pour sub-workflows)
const agentIdMatch = fullRawStr.match(/"agent_id"\s*:\s*"(strategist|analyst|creative|trader)"/i);
if (agentIdMatch && agentIdMatch[1]) {
  metaAgentId = agentIdMatch[1].toLowerCase();
}

// ═══════════════════════════════════════════════════════════════════════════
// V18.6 FIX: DETECTER ANALYTICS_DASHBOARD (Sora) vs PDF_REPORT (Luna)
// ═══════════════════════════════════════════════════════════════════════════
const isAnalyticsDashboard = fullRawStr.includes('"ANALYTICS_DASHBOARD"') ||
                             fullRawStr.includes('"analytics_dashboard"') ||
                             fullRawStrLower.includes('"ui_component":"analytics_dashboard"') ||
                             fullRawStrLower.includes("'analytics_dashboard'");

// ═══════════════════════════════════════════════════════════════════════════
// V18.3 FIX: EXTRACTION DU CONTENU ARTICLE VIA REGEX
// Le contenu de l'article peut etre dans "body", "content", ou "Content"
// ═══════════════════════════════════════════════════════════════════════════
let regexArticleContent = '';
let regexArticleTitle = '';

// Methode 1: Extraire le titre depuis "title" ou "headline"
const titleMatch = fullRawStr.match(/"(?:title|headline)"\s*:\s*"((?:[^"\\]|\\.)*)"/);
if (titleMatch && titleMatch[1] && titleMatch[1].length > 5) {
  regexArticleTitle = titleMatch[1]
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

// Methode 2: Extraire depuis "body" (format Creative MCP)
const bodyMatch = fullRawStr.match(/"body"\s*:\s*"((?:[^"\\]|\\.)*)"/);
if (bodyMatch && bodyMatch[1] && bodyMatch[1].length > 200) {
  regexArticleContent = bodyMatch[1]
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
    .replace(/\\t/g, '\t');
}

// Methode 3: Extraire depuis "Content" ou "content" (si body pas trouve)
if (!regexArticleContent || regexArticleContent.length < 200) {
  const contentMatch = fullRawStr.match(/"[Cc]ontent"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (contentMatch && contentMatch[1] && contentMatch[1].length > 200) {
    regexArticleContent = contentMatch[1]
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
      .replace(/\\t/g, '\t');
  }
}

// Methode 4: Chercher un long texte avec des marqueurs d'article (##, Introduction, etc.)
if (!regexArticleContent || regexArticleContent.length < 200) {
  const articlePatterns = fullRawStr.match(/"[^"]*(?:##|Introduction|Conclusion|\\n\\n)[^"]{500,}"/g);
  if (articlePatterns && articlePatterns.length > 0) {
    let longestMatch = '';
    for (const match of articlePatterns) {
      const cleaned = match.slice(1, -1);
      if (cleaned.length > longestMatch.length) {
        longestMatch = cleaned;
      }
    }
    if (longestMatch.length > 200) {
      regexArticleContent = longestMatch
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\')
        .replace(/\\t/g, '\t');
    }
  }
}

let regexImageUrl = null;
let regexVideoUrl = null;

const imageUrlMatch = fullRawStr.match(/"image_url"\s*:\s*"(https?:[^"]+)"/);
if (imageUrlMatch && imageUrlMatch[1]) {
  regexImageUrl = imageUrlMatch[1].replace(/\\\//g, '/');
}

const videoUrlMatch = fullRawStr.match(/"video_url"\s*:\s*"(https?:[^"]+)"/);
if (videoUrlMatch && videoUrlMatch[1]) {
  regexVideoUrl = videoUrlMatch[1].replace(/\\\//g, '/');
}

if (!regexImageUrl) {
  const displayUrlMatch = fullRawStr.match(/"display_url"\s*:\s*"(https?:[^"]+)"/);
  if (displayUrlMatch && displayUrlMatch[1]) {
    regexImageUrl = displayUrlMatch[1].replace(/\\\//g, '/');
  }
}

if (!regexImageUrl) {
  const genericImgMatch = fullRawStr.match(/"url"\s*:\s*"(https?:[^"]*i\.ibb\.co[^"]+)"/);
  if (genericImgMatch && genericImgMatch[1]) {
    regexImageUrl = genericImgMatch[1].replace(/\\\//g, '/');
  }
}

if (!regexImageUrl) {
  const anyIbbMatch = fullRawStr.match(/https?:\\?\/\\?\/?i\.ibb\.co[^"\\]*/);
  if (anyIbbMatch && anyIbbMatch[0]) {
    regexImageUrl = anyIbbMatch[0].replace(/\\\//g, '/');
  }
}

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
// HELPER V17: Nettoyer le message des JSON parasites
// ─────────────────────────────────────────────────────────────────────────────
function cleanMessageFromJson(rawMessage) {
  if (!rawMessage || typeof rawMessage !== 'string') return rawMessage || '';

  let cleaned = rawMessage;

  cleaned = cleaned.replace(/```json[\s\S]*?```/gi, '');
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
  cleaned = cleaned.replace(/\{\s*"ui_components?"[\s\S]*$/gi, '');
  cleaned = cleaned.replace(/\{\s*"type"\s*:\s*"(PDF_|CAMPAGNE_|CAMPAIGN_|AD_|VIDEO_)[\s\S]*$/gi, '');
  cleaned = cleaned.replace(/^\s*[\{\}\[\]]\s*$/gm, '');
  cleaned = cleaned.replace(/^\s*"[a-z_]+":\s*[\[\{"].*/gm, '');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  cleaned = cleaned.trim();

  return cleaned;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER V17: Generer un resume/apercu du contenu long
// ─────────────────────────────────────────────────────────────────────────────
function generateContentPreview(content, maxLength = 300) {
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
// HELPER V17.5: Tronquer un prompt long pour l'apercu
// ─────────────────────────────────────────────────────────────────────────────
function truncatePrompt(prompt, maxLength = 250) {
  if (!prompt || typeof prompt !== 'string') return '';

  const cleaned = prompt.trim();
  if (cleaned.length <= maxLength) return cleaned;

  let truncated = cleaned.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > maxLength * 0.7) {
    truncated = truncated.substring(0, lastSpace);
  }

  return truncated + '...';
}

// ═══════════════════════════════════════════════════════════════════════════
// V18 FIX: DETECTION DE L'AGENT BASEE SUR LES TOOLS APPELES
// ═══════════════════════════════════════════════════════════════════════════
let detectedAgentSource = null;

// V18.5: Methode 0 - Detection via meta.agent_id (LA PLUS FIABLE pour sub-workflows)
if (metaAgentId) {
  detectedAgentSource = metaAgentId;
}

// V18: Methode 1 - Detection directe via les tools appeles
if (!detectedAgentSource) {
  if (toolCreativeOutput) {
    detectedAgentSource = 'creative';
  }
  else if (toolAnalystOutput) {
    detectedAgentSource = 'analyst';
  }
  else if (toolStrategistOutput) {
    detectedAgentSource = 'strategist';
  }
  else if (toolTraderOutput) {
    detectedAgentSource = 'trader';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// METHODE 2: Wrappers de reponse explicites (fallback)
// ─────────────────────────────────────────────────────────────────────────────
if (!detectedAgentSource) {
  if (mergedInput?.analyst_response || fullRawStr.includes('"analyst_response"')) {
    detectedAgentSource = 'analyst';
  }
  else if (mergedInput?.strategist_response || fullRawStr.includes('"strategist_response"')) {
    detectedAgentSource = 'strategist';
  }
  else if (mergedInput?.creative_response || fullRawStr.includes('"creative_response"')) {
    detectedAgentSource = 'creative';
  }
  else if (mergedInput?.trader_response || fullRawStr.includes('"trader_response"')) {
    detectedAgentSource = 'trader';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// METHODE 3: Noms des tools dans le JSON (n8n tool calls)
// ─────────────────────────────────────────────────────────────────────────────
if (!detectedAgentSource) {
  if (fullRawStrLower.includes('call_analyst') ||
      fullRawStr.includes('Analyst MCP') ||
      fullRawStr.includes('Call Analyst') ||
      fullRawStrLower.includes('analyst_mcp') ||
      fullRawStrLower.includes('"tool":"analyst"') ||
      fullRawStrLower.includes('"agent":"analyst"') ||
      fullRawStrLower.includes('"name":"call_analyst"')) {
    detectedAgentSource = 'analyst';
  }
  else if (fullRawStrLower.includes('call_strategist') ||
           fullRawStr.includes('Strategist MCP') ||
           fullRawStr.includes('Call Strategist') ||
           fullRawStrLower.includes('strategist_mcp') ||
           fullRawStrLower.includes('"tool":"strategist"') ||
           fullRawStrLower.includes('"agent":"strategist"') ||
           fullRawStrLower.includes('"name":"call_strategist"')) {
    detectedAgentSource = 'strategist';
  }
  else if (fullRawStrLower.includes('call_creative') ||
           fullRawStr.includes('Creative MCP') ||
           fullRawStr.includes('Call Creative') ||
           fullRawStrLower.includes('creative_mcp') ||
           fullRawStrLower.includes('nano_banana') ||
           fullRawStrLower.includes('"tool":"creative"') ||
           fullRawStrLower.includes('"agent":"creative"') ||
           fullRawStrLower.includes('"name":"call_creative"')) {
    detectedAgentSource = 'creative';
  }
  else if (fullRawStrLower.includes('call_trader') ||
           fullRawStr.includes('Trader MCP') ||
           fullRawStr.includes('Call Trader') ||
           fullRawStrLower.includes('trader_mcp') ||
           fullRawStrLower.includes('"tool":"trader"') ||
           fullRawStrLower.includes('"agent":"trader"') ||
           fullRawStrLower.includes('"name":"call_trader"')) {
    detectedAgentSource = 'trader';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// METHODE 4: Patterns de contenu specifiques a chaque agent (DERNIER RECOURS)
// ─────────────────────────────────────────────────────────────────────────────
if (!detectedAgentSource) {
  const hasKpiKeywords = fullRawStrLower.includes('kpi') ||
                         fullRawStrLower.includes('metric') ||
                         fullRawStrLower.includes('metrique');

  const hasDataKeywords = fullRawStrLower.includes('ga4') ||
                          fullRawStrLower.includes('gsc') ||
                          fullRawStrLower.includes('google analytics') ||
                          fullRawStrLower.includes('search console') ||
                          fullRawStrLower.includes('sessions') ||
                          fullRawStrLower.includes('trafic organique') ||
                          fullRawStrLower.includes('organic search') ||
                          fullRawStrLower.includes('impressions') ||
                          fullRawStrLower.includes('clics') ||
                          fullRawStrLower.includes('clicks') ||
                          fullRawStrLower.includes('position moyenne') ||
                          fullRawStrLower.includes('ctr') ||
                          fullRawStrLower.includes('conversion rate') ||
                          fullRawStrLower.includes('taux de conversion') ||
                          fullRawStrLower.includes('visiteurs') ||
                          fullRawStrLower.includes('pageviews');

  const hasReportingKeywords = fullRawStrLower.includes('dashboard') ||
                               fullRawStrLower.includes('reporting') ||
                               fullRawStrLower.includes('donnees');

  const isAnalystContent = hasKpiKeywords || (hasDataKeywords && hasReportingKeywords);

  const hasAdsKeywords = fullRawStrLower.includes('google ads') ||
                         fullRawStrLower.includes('meta ads') ||
                         fullRawStrLower.includes('facebook ads') ||
                         fullRawStrLower.includes('linkedin ads') ||
                         fullRawStrLower.includes('tiktok ads') ||
                         fullRawStrLower.includes('campagne pub') ||
                         fullRawStrLower.includes('paid') ||
                         fullRawStrLower.includes('publicite payante');

  const hasTraderMetrics = fullRawStrLower.includes('roas') ||
                           fullRawStrLower.includes('cpc') ||
                           fullRawStrLower.includes('cpm') ||
                           fullRawStrLower.includes('cpa') ||
                           fullRawStrLower.includes('budget pub') ||
                           fullRawStrLower.includes('ad spend') ||
                           fullRawStrLower.includes('encheres') ||
                           fullRawStrLower.includes('bidding');

  const isTraderContent = hasAdsKeywords || hasTraderMetrics;

  const hasCreativeOutput = fullRawStrLower.includes('image_url') ||
                            fullRawStrLower.includes('video_url') ||
                            fullRawStrLower.includes('visuel genere') ||
                            fullRawStrLower.includes('video generee') ||
                            fullRawStrLower.includes('i.ibb.co') ||
                            fullRawStrLower.includes('copywriting') ||
                            fullRawStrLower.includes('article redige') ||
                            fullRawStrLower.includes('contenu cree') ||
                            fullRawStrLower.includes('pdf_copywriting');

  const isCreativeContent = hasCreativeOutput;

  const hasStrategyKeywords = fullRawStrLower.includes('strategie') ||
                              fullRawStrLower.includes('strategy') ||
                              fullRawStrLower.includes('recommandation') ||
                              fullRawStrLower.includes('recommendation') ||
                              fullRawStrLower.includes('concurrent') ||
                              fullRawStrLower.includes('competitor') ||
                              fullRawStrLower.includes('positionnement') ||
                              fullRawStrLower.includes('positioning') ||
                              fullRawStrLower.includes('audit') ||
                              fullRawStrLower.includes('veille') ||
                              fullRawStrLower.includes('marche') ||
                              fullRawStrLower.includes('market analysis');

  const isStrategistContent = hasStrategyKeywords && !isAnalystContent && !isTraderContent;

  if (isAnalystContent) {
    detectedAgentSource = 'analyst';
  }
  else if (isTraderContent) {
    detectedAgentSource = 'trader';
  }
  else if (isCreativeContent) {
    detectedAgentSource = 'creative';
  }
  else if (isStrategistContent) {
    detectedAgentSource = 'strategist';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1: UNWRAP INPUT - V18: Utilise mergedInput
// ─────────────────────────────────────────────────────────────────────────────
let parsedInput = unwrapN8nJson(mergedInput);

if (parsedInput && parsedInput.creative_response) {
  const creativeData = unwrapN8nJson(parsedInput.creative_response);
  if (creativeData) {
    parsedInput = { ...parsedInput, ...creativeData };
  }
}

if (parsedInput && parsedInput.analyst_response) {
  const analystData = unwrapN8nJson(parsedInput.analyst_response);
  if (analystData) {
    parsedInput = { ...parsedInput, ...analystData };
  }
}

if (parsedInput && parsedInput.strategist_response) {
  const strategistData = unwrapN8nJson(parsedInput.strategist_response);
  if (strategistData) {
    parsedInput = { ...parsedInput, ...strategistData };
  }
}

if (parsedInput && parsedInput.trader_response) {
  const traderData = unwrapN8nJson(parsedInput.trader_response);
  if (traderData) {
    parsedInput = { ...parsedInput, ...traderData };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// V17.4 FIX: Parser le champ output
// ═══════════════════════════════════════════════════════════════════════════

let creativeMessageFromTool = '';

if (parsedInput?.output && typeof parsedInput.output === 'string') {
  try {
    const outputParsed = JSON.parse(parsedInput.output);

    if (outputParsed?.ui_component) {
      parsedInput.ui_component = outputParsed.ui_component;
    }
    if (outputParsed?.ui_components && outputParsed.ui_components.length > 0) {
      parsedInput.ui_components = outputParsed.ui_components;
    }

    if (outputParsed?.chat_message) {
      parsedInput.chat_message = outputParsed.chat_message;
      if (typeof outputParsed.chat_message === 'string') {
        creativeMessageFromTool = outputParsed.chat_message;
      } else if (typeof outputParsed.chat_message === 'object') {
        creativeMessageFromTool = outputParsed.chat_message.content
          || outputParsed.chat_message.text
          || outputParsed.chat_message.message
          || '';
      }
    }

    if (outputParsed?.video_url) {
      parsedInput.video_url = outputParsed.video_url;
    }
    if (outputParsed?.image_url) {
      parsedInput.image_url = outputParsed.image_url;
    }
    if (outputParsed?.creative_result) {
      parsedInput.creative_result = outputParsed.creative_result;
    }
    if (outputParsed?.prompt_used) {
      parsedInput.prompt_used = outputParsed.prompt_used;
    }
    if (outputParsed?.script) {
      parsedInput.script = outputParsed.script;
    }
    if (outputParsed?.creative_result?.deliverables?.script) {
      parsedInput.script = outputParsed.creative_result.deliverables.script;
    }
    if (outputParsed?.creative_result?.deliverables?.meta?.prompt_used) {
      parsedInput.prompt_used = outputParsed.creative_result.deliverables.meta.prompt_used;
    }

    if (!parsedInput.video_url && outputParsed?.ui_components?.[0]?.data?.video_url) {
      parsedInput.video_url = outputParsed.ui_components[0].data.video_url;
    }
    if (!parsedInput.image_url && outputParsed?.ui_components?.[0]?.data?.image_url) {
      parsedInput.image_url = outputParsed.ui_components[0].data.image_url;
    }
  } catch (e) {
    const jsonMatch = parsedInput.output.match(/\{[\s\S]*"ui_component"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const nestedParsed = JSON.parse(jsonMatch[0]);
        if (nestedParsed?.ui_component) parsedInput.ui_component = nestedParsed.ui_component;
        if (nestedParsed?.ui_components) parsedInput.ui_components = nestedParsed.ui_components;
        if (nestedParsed?.chat_message) {
          parsedInput.chat_message = nestedParsed.chat_message;
          if (typeof nestedParsed.chat_message === 'object') {
            creativeMessageFromTool = nestedParsed.chat_message.content || '';
          } else if (typeof nestedParsed.chat_message === 'string') {
            creativeMessageFromTool = nestedParsed.chat_message;
          }
        }
        if (nestedParsed?.video_url) parsedInput.video_url = nestedParsed.video_url;
      } catch (e2) {}
    }
  }
}

// V18: Extraire chat_message depuis les tool outputs directement
if (!creativeMessageFromTool && toolCreativeOutput?.chat_message) {
  const chatMsg = toolCreativeOutput.chat_message;
  if (typeof chatMsg === 'string') {
    creativeMessageFromTool = chatMsg;
  } else if (typeof chatMsg === 'object') {
    creativeMessageFromTool = chatMsg.content || chatMsg.text || chatMsg.message || '';
  }
}

if (!creativeMessageFromTool) {
  const chatMsgMatch = fullRawStr.match(/"chat_message"\s*:\s*\{\s*"content"\s*:\s*"([^"]+)"/);
  if (chatMsgMatch && chatMsgMatch[1]) {
    creativeMessageFromTool = chatMsgMatch[1]
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  }
}

if (!parsedInput?.video_url && parsedInput?.ui_components?.[0]?.data?.video_url) {
  parsedInput.video_url = parsedInput.ui_components[0].data.video_url;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2: EXTRACTION DES VALEURS CLES
// ─────────────────────────────────────────────────────────────────────────────
const uiComponent = parsedInput?.ui_component || parsedInput?.type || null;
let existingUiComponents = parsedInput?.ui_components || [];

let imageUrl = regexImageUrl
  || parsedInput?.image_url
  || parsedInput?.creative_result?.image_url
  || parsedInput?.creative_result?.deliverables?.image_url
  || parsedInput?.image?.url
  || null;

let videoUrl = regexVideoUrl
  || parsedInput?.video_url
  || parsedInput?.creative_result?.video_url
  || parsedInput?.creative_result?.deliverables?.video_url
  || parsedInput?.video?.url
  || null;

if (!videoUrl && parsedInput?.output) {
  try {
    const outputParsed = typeof parsedInput.output === 'string'
      ? JSON.parse(parsedInput.output)
      : parsedInput.output;

    if (outputParsed?.creative_result?.deliverables?.video_url) {
      videoUrl = outputParsed.creative_result.deliverables.video_url;
    } else if (outputParsed?.creative_result?.video_url) {
      videoUrl = outputParsed.creative_result.video_url;
    } else if (outputParsed?.video_url) {
      videoUrl = outputParsed.video_url;
    }
    if (!videoUrl && outputParsed?.ui_components?.[0]?.data?.video_url) {
      videoUrl = outputParsed.ui_components[0].data.video_url;
    }
  } catch (e) {}
}

// ═══════════════════════════════════════════════════════════════════════════
// V17.5: EXTRACTION ENRICHIE DE PROMPT_USED / SCRIPT
// ═══════════════════════════════════════════════════════════════════════════
let promptUsed = parsedInput?.prompt_used
  || parsedInput?.creative_result?.prompt_used
  || parsedInput?.creative_result?.deliverables?.meta?.prompt_used
  || parsedInput?.creative_result?.deliverables?.prompt_used
  || parsedInput?.image?.original_prompt
  || '';

if (!promptUsed && parsedInput?.script) {
  promptUsed = parsedInput.script;
}
if (!promptUsed && parsedInput?.creative_result?.deliverables?.script) {
  promptUsed = parsedInput.creative_result.deliverables.script;
}
if (!promptUsed && parsedInput?.creative_result?.script) {
  promptUsed = parsedInput.creative_result.script;
}
if (!promptUsed && parsedInput?.video?.script) {
  promptUsed = parsedInput.video.script;
}
if (!promptUsed && parsedInput?.video?.prompt_used) {
  promptUsed = parsedInput.video.prompt_used;
}

if (!promptUsed && parsedInput?.ui_components?.[0]?.data?.prompt_used) {
  promptUsed = parsedInput.ui_components[0].data.prompt_used;
}
if (!promptUsed && parsedInput?.ui_components?.[0]?.data?.script) {
  promptUsed = parsedInput.ui_components[0].data.script;
}
if (!promptUsed && parsedInput?.ui_components?.[0]?.data?.primary_text) {
  promptUsed = parsedInput.ui_components[0].data.primary_text;
}

if (!promptUsed && parsedInput?.output) {
  try {
    const outputParsed = typeof parsedInput.output === 'string'
      ? JSON.parse(parsedInput.output)
      : parsedInput.output;

    promptUsed = outputParsed?.prompt_used
      || outputParsed?.script
      || outputParsed?.creative_result?.prompt_used
      || outputParsed?.creative_result?.deliverables?.meta?.prompt_used
      || outputParsed?.creative_result?.script
      || outputParsed?.ui_components?.[0]?.data?.prompt_used
      || outputParsed?.ui_components?.[0]?.data?.script
      || '';
  } catch (e) {}
}

if (!promptUsed) {
  const promptMatch = fullRawStr.match(/"prompt_used"\s*:\s*"([^"]+)"/);
  if (promptMatch && promptMatch[1]) {
    promptUsed = promptMatch[1].replace(/\\n/g, ' ').replace(/\\\"/g, '"');
  }
}
if (!promptUsed) {
  const scriptMatch = fullRawStr.match(/"script"\s*:\s*"([^"]+)"/);
  if (scriptMatch && scriptMatch[1]) {
    promptUsed = scriptMatch[1].replace(/\\n/g, ' ').replace(/\\\"/g, '"');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2.5: EXTRACTION DU MESSAGE CHAT
// ─────────────────────────────────────────────────────────────────────────────
let rawMessage = '';

if (creativeMessageFromTool && creativeMessageFromTool.length > 30) {
  rawMessage = creativeMessageFromTool;
}

if (!rawMessage && parsedInput?.chat_message) {
  const chatMsg = parsedInput.chat_message;
  if (typeof chatMsg === 'string') {
    rawMessage = chatMsg;
  } else if (typeof chatMsg === 'object') {
    rawMessage = chatMsg.content || chatMsg.text || chatMsg.message || '';
  }
}

if (!rawMessage) {
  rawMessage = parsedInput?.message || parsedInput?.response || parsedInput?.text || parsedInput?.content || '';
}

if (!rawMessage && parsedInput?.output && typeof parsedInput.output === 'string') {
  const trimmedOutput = parsedInput.output.trim();
  if (!trimmedOutput.startsWith('{') && !trimmedOutput.startsWith('[')) {
    rawMessage = parsedInput.output;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// V17.1 FIX: Extraire le contenu depuis existingUiComponents si present
// ═══════════════════════════════════════════════════════════════════════════
let existingPdfContent = '';

if (existingUiComponents && existingUiComponents.length > 0) {
  const firstComp = existingUiComponents[0];
  if (firstComp && firstComp.data) {
    existingPdfContent = firstComp.data.Content
      || firstComp.data.content
      || firstComp.data.body
      || firstComp.data.text
      || '';
  }
}

if (!rawMessage && existingPdfContent) {
  rawMessage = existingPdfContent;
}

// ═══════════════════════════════════════════════════════════════════════════
// V17 FIX: NETTOYER LE MESSAGE DES JSON PARASITES
// ═══════════════════════════════════════════════════════════════════════════
let finalMessage = cleanMessageFromJson(rawMessage);

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3: DETECTION DU TYPE DE CONTENU
// ─────────────────────────────────────────────────────────────────────────────

const isAnalystAgent = detectedAgentSource === 'analyst';
const isStrategistAgent = detectedAgentSource === 'strategist';
const isCreativeAgent = detectedAgentSource === 'creative';
const isTraderAgent = detectedAgentSource === 'trader';

const isCreativeCopywritingRequest = isCreativeAgent && (
  fullRawStrLower.includes('redige un article') ||
  fullRawStrLower.includes('redige un blog') ||
  fullRawStrLower.includes('ecris un article') ||
  fullRawStrLower.includes('copywriting') ||
  fullRawStrLower.includes('cree un texte') ||
  fullRawStrLower.includes('genere un article') ||
  fullRawStrLower.includes('faire un article') ||
  fullRawStrLower.includes('fais un article') ||
  fullRawStrLower.includes('article de blog')
);

const isPdfRequest = fullRawStrLower.includes('pdf')
  || fullRawStrLower.includes('rapport')
  || fullRawStrLower.includes('report');

// ═══════════════════════════════════════════════════════════════════════════
// REGLE 2000 CARACTERES
// ═══════════════════════════════════════════════════════════════════════════
const messageLength = finalMessage.length;
const isLongMessage = messageLength > 2000;

// ═══════════════════════════════════════════════════════════════════════════
// V17.2 FIX: Respecter le type envoye dans existingUiComponents
// V18.6: Ajouter detection ANALYTICS_DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════
const existingComponentType = existingUiComponents?.[0]?.type || '';
const existingSentPdfReport = existingComponentType === 'PDF_REPORT';
const existingSentPdfCopywriting = existingComponentType === 'PDF_COPYWRITING';
const existingSentAnalyticsDashboard = existingComponentType === 'ANALYTICS_DASHBOARD';

// ═══════════════════════════════════════════════════════════════════════════
// V18.6: LOGIQUE DE DETECTION CORRIGEE - ANALYTICS_DASHBOARD vs PDF_REPORT
// ═══════════════════════════════════════════════════════════════════════════

// V18.6: ANALYTICS_DASHBOARD = Sora (Analyst) - PRIORITE 1
const isAnalyticsDashboardReport = isAnalyticsDashboard
  || existingSentAnalyticsDashboard
  || uiComponent === 'ANALYTICS_DASHBOARD'
  || fullRawStr.includes('"ANALYTICS_DASHBOARD"');

// PDF_REPORT = Luna (Strategist) - SEULEMENT si pas ANALYTICS_DASHBOARD
const isPdfReport = !isAnalyticsDashboardReport && (
  isStrategistAgent
  || existingSentPdfReport
  || uiComponent === 'PDF_REPORT'
  || parsedInput?.report_type === 'pdf'
  || fullRawStr.includes('"PDF_REPORT"')
  || (isPdfRequest && isLongMessage && !isCreativeAgent && !isAnalystAgent)
);

// ═══════════════════════════════════════════════════════════════════════════
// V18.2 FIX: FALLBACK DETECTION VIA MESSAGE ORIGINAL
// Si les tools ne sont pas accessibles, on detecte via le message original
// ═══════════════════════════════════════════════════════════════════════════
const originalMessageIsCopywritingRequest = originalMessageLower && (
  originalMessageLower.includes('article') ||
  originalMessageLower.includes('blog') ||
  originalMessageLower.includes('redige') ||
  originalMessageLower.includes('ecris') ||
  originalMessageLower.includes('texte') ||
  originalMessageLower.includes('contenu') ||
  originalMessageLower.includes('copywriting') ||
  originalMessageLower.includes('newsletter') ||
  originalMessageLower.includes('email marketing') ||
  originalMessageLower.includes('landing page') ||
  originalMessageLower.includes('script')
);

const responseIndicatesSuccess = fullRawStrLower.includes('voici') ||
  fullRawStrLower.includes('voila') ||
  fullRawStrLower.includes('redige') ||
  fullRawStrLower.includes('genere') ||
  fullRawStrLower.includes('cree') ||
  fullRawStrLower.includes('article') ||
  fullRawStrLower.includes('introduction') ||
  fullRawStrLower.includes('conclusion') ||
  messageLength > 1500;

const fallbackCopywritingDetection = !toolCreativeOutput &&
  !toolAnalystOutput &&
  !toolStrategistOutput &&
  !toolTraderOutput &&
  originalMessageIsCopywritingRequest &&
  responseIndicatesSuccess;

// V18.3: Detection renforcee avec regexArticleContent
const hasRegexArticleContent = regexArticleContent && regexArticleContent.length > 200;

// PDF_COPYWRITING si Creative + copywriting (V18.2: + fallback message original, V18.3: + regex)
const isPdfCopywriting = !isPdfReport && !isAnalyticsDashboardReport && (
  existingSentPdfCopywriting
  || uiComponent === 'PDF_COPYWRITING'
  || parsedInput?.content_type === 'copywriting'
  || fullRawStr.includes('"PDF_COPYWRITING"')
  || fullRawStr.includes('"copywriting_content"')
  || (isCreativeAgent && isCreativeCopywritingRequest)
  || (isCreativeAgent && existingPdfContent.length > 500)
  || fallbackCopywritingDetection
  || (hasRegexArticleContent && originalMessageIsCopywritingRequest)
);

const isImage = imageUrl !== null && imageUrl !== undefined && imageUrl !== '' && !videoUrl;
const isVideo = videoUrl !== null && videoUrl !== undefined && videoUrl !== '';

// ═══════════════════════════════════════════════════════════════════════════
// V18.6 FIX: MAPPING AGENT INFAILLIBLE
// ═══════════════════════════════════════════════════════════════════════════

let respondingAgent = 'milo';
let agentDisplayName = 'Milo';
let agentRole = 'Creative Director';
let detectionMethod = 'default_fallback';

// V18.6: PRIORITE 0 - ANALYTICS_DASHBOARD = TOUJOURS SORA
if (isAnalyticsDashboardReport) {
  respondingAgent = 'sora';
  agentDisplayName = 'Sora';
  agentRole = 'Data Analyst';
  detectionMethod = 'v18.6_analytics_dashboard';
}
// V18.6: PRIORITE 1 - Type de contenu creatif
else if (isPdfCopywriting || isImage || isVideo) {
  respondingAgent = 'milo';
  agentDisplayName = 'Milo';
  agentRole = 'Creative Director';
  detectionMethod = 'v18.6_creative_content';
}
// V18.6: PRIORITE 2 - PDF_REPORT = TOUJOURS LUNA
else if (isPdfReport) {
  respondingAgent = 'luna';
  agentDisplayName = 'Luna';
  agentRole = 'Strategist';
  detectionMethod = 'v18.6_pdf_report_luna';
}
// V18.5: PRIORITE 3 - meta.agent_id from sub-workflow
else if (metaAgentId === 'strategist') {
  respondingAgent = 'luna';
  agentDisplayName = 'Luna';
  agentRole = 'Strategist';
  detectionMethod = 'v18.5_meta_agent_strategist';
}
else if (metaAgentId === 'analyst') {
  respondingAgent = 'sora';
  agentDisplayName = 'Sora';
  agentRole = 'Data Analyst';
  detectionMethod = 'v18.5_meta_agent_analyst';
}
else if (metaAgentId === 'creative') {
  respondingAgent = 'milo';
  agentDisplayName = 'Milo';
  agentRole = 'Creative Director';
  detectionMethod = 'v18.5_meta_agent_creative';
}
else if (metaAgentId === 'trader') {
  respondingAgent = 'marcus';
  agentDisplayName = 'Marcus';
  agentRole = 'Media Buyer';
  detectionMethod = 'v18.5_meta_agent_trader';
}
// V18: PRIORITE 4 - Detection directe via tool output
else if (toolCreativeOutput) {
  respondingAgent = 'milo';
  agentDisplayName = 'Milo';
  agentRole = 'Creative Director';
  detectionMethod = 'v18_tool_creative';
}
else if (toolStrategistOutput) {
  respondingAgent = 'luna';
  agentDisplayName = 'Luna';
  agentRole = 'Strategist';
  detectionMethod = 'v18_tool_strategist';
}
else if (toolAnalystOutput) {
  respondingAgent = 'sora';
  agentDisplayName = 'Sora';
  agentRole = 'Data Analyst';
  detectionMethod = 'v18_tool_analyst';
}
else if (toolTraderOutput) {
  respondingAgent = 'marcus';
  agentDisplayName = 'Marcus';
  agentRole = 'Media Buyer';
  detectionMethod = 'v18_tool_trader';
}
// V18: PRIORITE 5 - Fallback sur detectedAgentSource
else if (detectedAgentSource === 'strategist') {
  respondingAgent = 'luna';
  agentDisplayName = 'Luna';
  agentRole = 'Strategist';
  detectionMethod = 'content_analysis_strategist';
}
else if (detectedAgentSource === 'analyst') {
  respondingAgent = 'sora';
  agentDisplayName = 'Sora';
  agentRole = 'Data Analyst';
  detectionMethod = 'content_analysis_analyst';
}
else if (detectedAgentSource === 'creative') {
  respondingAgent = 'milo';
  agentDisplayName = 'Milo';
  agentRole = 'Creative Director';
  detectionMethod = 'content_analysis_creative';
}
else if (detectedAgentSource === 'trader') {
  respondingAgent = 'marcus';
  agentDisplayName = 'Marcus';
  agentRole = 'Media Buyer';
  detectionMethod = 'content_analysis_trader';
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4: CONSTRUCTION DES UI COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
let finalComponents = [];

// CAS 1: IMAGE (CAMPAGNE_TABLE)
if (isImage) {
  finalComponents.push({
    type: 'CAMPAGNE_TABLE',
    data: {
      image_url: imageUrl,
      prompt_used: promptUsed,
      tool: 'nano_banana_pro',
      provider: parsedInput?.provider || 'imgbb',
      generated_at: new Date().toISOString(),
      rows: [{
        visuel: imageUrl,
        description: promptUsed,
        format: parsedInput?.image?.aspect_ratio || '1:1'
      }]
    },
    layout: { width: 'full', order: 1 }
  });
}

// CAS 2: VIDEO (AD_PREVIEW)
else if (isVideo) {
  finalComponents.push({
    type: 'AD_PREVIEW',
    data: {
      platform: parsedInput?.platform || 'meta_feed',
      format: parsedInput?.format || 'video',
      video_url: videoUrl,
      image_url: null,
      headline: parsedInput?.headline || '',
      primary_text: parsedInput?.primary_text || promptUsed,
      description: parsedInput?.description || '',
      cta: parsedInput?.cta || 'learn_more',
      destination_url: parsedInput?.destination_url || '',
      tool: parsedInput?.tool || 'runway_gen3',
      prompt_used: promptUsed,
      generated_at: new Date().toISOString()
    },
    layout: { width: 'full', order: 1 }
  });
}

// CAS 3: PDF_COPYWRITING
else if (isPdfCopywriting) {
  const copyContent = regexArticleContent || existingPdfContent || finalMessage;
  const articleTitle = regexArticleTitle || parsedInput?.title || existingUiComponents?.[0]?.data?.title || 'Article de Blog';

  finalComponents.push({
    type: 'PDF_COPYWRITING',
    data: {
      title: articleTitle,
      content: copyContent,
      headline: parsedInput?.headline || existingUiComponents?.[0]?.data?.headline || articleTitle,
      body: copyContent,
      cta: parsedInput?.cta || '',
      variations: parsedInput?.variations || [],
      tone: parsedInput?.tone || 'professional',
      word_count: copyContent.split(/\s+/).length,
      char_count: copyContent.length,
      generated_at: new Date().toISOString()
    },
    layout: { width: 'full', order: 1 }
  });
}

// CAS 3.5: ANALYTICS_DASHBOARD (V18.6)
else if (isAnalyticsDashboardReport) {
  const reportContent = regexArticleContent || existingPdfContent || finalMessage;

  finalComponents.push({
    type: 'ANALYTICS_DASHBOARD',
    data: {
      title: parsedInput?.title || existingUiComponents?.[0]?.data?.title || 'Dashboard Analytics',
      content: reportContent,
      sections: parsedInput?.sections || existingUiComponents?.[0]?.data?.sections || [],
      kpis: parsedInput?.kpis || existingUiComponents?.[0]?.data?.kpis || [],
      charts: parsedInput?.charts || existingUiComponents?.[0]?.data?.charts || [],
      recommendations: parsedInput?.recommendations || existingUiComponents?.[0]?.data?.recommendations || [],
      char_count: reportContent.length,
      generated_at: new Date().toISOString()
    },
    layout: { width: 'full', order: 1 }
  });
}

// CAS 4: PDF_REPORT (Luna/Strategist)
else if (isPdfReport) {
  const reportContent = regexArticleContent || existingPdfContent || finalMessage;

  finalComponents.push({
    type: 'PDF_REPORT',
    data: {
      title: parsedInput?.title || existingUiComponents?.[0]?.data?.title || 'Rapport Strategique',
      content: reportContent,
      sections: parsedInput?.sections || existingUiComponents?.[0]?.data?.sections || [],
      kpis: parsedInput?.kpis || existingUiComponents?.[0]?.data?.kpis || [],
      charts: parsedInput?.charts || existingUiComponents?.[0]?.data?.charts || [],
      recommendations: parsedInput?.recommendations || existingUiComponents?.[0]?.data?.recommendations || [],
      char_count: reportContent.length,
      generated_at: new Date().toISOString()
    },
    layout: { width: 'full', order: 1 }
  });
}

// CAS 5: EXISTING UI_COMPONENTS
else if (existingUiComponents && existingUiComponents.length > 0) {
  finalComponents = existingUiComponents;
}

// CAS 6: MENU PAR DEFAUT
else {
  finalComponents.push({
    type: 'ACTION_BUTTONS',
    data: {
      layout: 'grid',
      actions: [
        { id: 'menu_analyst', label: 'Analyser mes performances', icon: 'chart-line', action_type: 'message', variant: 'secondary', payload: { message: 'Montre-moi mon bilan de performance' } },
        { id: 'menu_creative', label: 'Creer un visuel', icon: 'palette', action_type: 'message', variant: 'secondary', payload: { message: 'Cree une image publicitaire' } },
        { id: 'menu_copy', label: 'Rediger du contenu', icon: 'edit', action_type: 'message', variant: 'secondary', payload: { message: 'Redige un article de blog' } }
      ]
    },
    layout: { width: 'full', order: 1 }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 5: MESSAGES AVEC DESCRIPTION/APERCU
// ─────────────────────────────────────────────────────────────────────────────

const hasRichCreativeMessage = creativeMessageFromTool && creativeMessageFromTool.length > 50;

if (isImage) {
  const promptPreview = promptUsed ? truncatePrompt(promptUsed, 200) : '';
  if (hasRichCreativeMessage) {
    finalMessage = creativeMessageFromTool;
  } else {
    finalMessage = `**Visuel genere avec succes !**\n\nJ'ai cree cette image en suivant vos instructions.`;
    if (promptPreview) {
      finalMessage += `\n\n**Concept :** ${promptPreview}`;
    }
    finalMessage += `\n\n*Cliquez sur l'image pour la telecharger en haute resolution.*`;
  }
}

else if (isVideo) {
  const scriptPreview = promptUsed ? truncatePrompt(promptUsed, 200) : '';
  if (hasRichCreativeMessage) {
    finalMessage = creativeMessageFromTool;
  } else {
    finalMessage = `**Video generee avec succes !**\n\nVotre video publicitaire est prete.`;
    if (scriptPreview) {
      finalMessage += `\n\n**Script/Concept :** ${scriptPreview}`;
    }
    finalMessage += `\n\n*Cliquez sur le bouton pour telecharger la video.*`;
  }
}

else if (isPdfCopywriting) {
  const copyContent = regexArticleContent || existingPdfContent || finalMessage;
  const contentPreview = generateContentPreview(copyContent, 350);
  const wordCount = copyContent.split(/\s+/).length;

  finalMessage = `**Article redige avec succes !**\n\nJ'ai cree un article complet de **${wordCount} mots** optimise pour le SEO.`;

  if (regexArticleTitle) {
    finalMessage += `\n\n**Titre :** ${regexArticleTitle}`;
  }

  if (contentPreview && contentPreview.length > 50) {
    finalMessage += `\n\n**Apercu :**\n${contentPreview}`;
  }

  finalMessage += `\n\n*Telechargez le PDF complet ci-dessous pour acceder a l'article entier.*`;
}

else if (isAnalyticsDashboardReport) {
  const reportContent = regexArticleContent || existingPdfContent || finalMessage;
  const contentPreview = generateContentPreview(reportContent, 350);

  finalMessage = `**Dashboard Analytics genere !**\n\nVoici mon analyse complete basee sur vos donnees.`;

  if (contentPreview && contentPreview.length > 50) {
    finalMessage += `\n\n**Resume :**\n${contentPreview}`;
  }

  finalMessage += `\n\n*Telechargez le rapport complet pour acceder a toutes les metriques.*`;
}

else if (isPdfReport && !isPdfCopywriting && !isAnalyticsDashboardReport) {
  const reportContent = regexArticleContent || existingPdfContent || finalMessage;
  const contentPreview = generateContentPreview(reportContent, 350);

  finalMessage = `**Rapport strategique genere !**\n\nVoici mon analyse et mes recommandations.`;

  if (contentPreview && contentPreview.length > 50) {
    finalMessage += `\n\n**Resume :**\n${contentPreview}`;
  }

  finalMessage += `\n\n*Telechargez le rapport complet pour acceder a toutes les recommandations.*`;
}

// Fallback si toujours pas de message
if (!finalMessage || finalMessage.length < 20) {
  if (isPdfCopywriting) {
    finalMessage = '**Contenu redige avec succes !**\n\nVotre article est pret. Cliquez sur le bouton ci-dessous pour telecharger le PDF.';
  } else if (isAnalyticsDashboardReport) {
    finalMessage = '**Dashboard genere !**\n\nCliquez sur le bouton pour telecharger l\'analyse complete.';
  } else if (isPdfReport) {
    finalMessage = '**Rapport genere !**\n\nCliquez sur le bouton pour telecharger l\'analyse complete.';
  } else if (isImage) {
    finalMessage = '**Visuel cree !**\n\nCliquez sur l\'image pour la telecharger.';
  } else if (isVideo) {
    finalMessage = '**Video prete !**\n\nCliquez sur le bouton pour la telecharger.';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 6: CONSTRUCTION REPONSE FINALE (V18.6)
// ─────────────────────────────────────────────────────────────────────────────
const uiResponse = {
  thought_process: {
    step: 'Format UI Response V18.6',
    reasoning: isImage ? 'Image detectee → CAMPAGNE_TABLE' :
               isVideo ? 'Video detectee → AD_PREVIEW' :
               isPdfCopywriting ? 'Copywriting Creative → PDF_COPYWRITING' :
               isAnalyticsDashboardReport ? 'Analytics Sora → ANALYTICS_DASHBOARD' :
               isPdfReport ? 'Rapport Luna → PDF_REPORT' : 'Reponse standard',
    detected_agent_source: detectedAgentSource || 'none',
    meta_agent_id_detected: metaAgentId || 'none',
    is_analytics_dashboard: isAnalyticsDashboardReport,
    is_pdf_report: isPdfReport,
    is_analyst_agent: isAnalystAgent,
    is_strategist_agent: isStrategistAgent,
    is_creative_agent: isCreativeAgent,
    is_trader_agent: isTraderAgent,
    is_creative_copywriting_request: isCreativeCopywritingRequest,
    tool_creative_found: toolCreativeOutput !== null,
    tool_analyst_found: toolAnalystOutput !== null,
    tool_strategist_found: toolStrategistOutput !== null,
    tool_trader_found: toolTraderOutput !== null,
    original_message_found: originalUserMessage.length > 0,
    original_message_preview: originalUserMessage.substring(0, 100),
    original_message_is_copywriting: originalMessageIsCopywritingRequest,
    response_indicates_success: responseIndicatesSuccess,
    fallback_copywriting_triggered: fallbackCopywritingDetection,
    regex_article_content_found: regexArticleContent.length > 0,
    regex_article_content_length: regexArticleContent.length,
    regex_article_title_found: regexArticleTitle.length > 0,
    regex_article_title: regexArticleTitle || 'none',
    tools_used: parsedInput?.tool ? [parsedInput.tool] : [],
    confidence: isAnalyticsDashboardReport ? 0.99 :
                metaAgentId ? 0.98 :
                toolCreativeOutput || toolAnalystOutput || toolStrategistOutput || toolTraderOutput ? 0.97 :
                isPdfCopywriting || isImage || isVideo || isPdfReport ? 0.95 :
                detectedAgentSource ? 0.85 :
                fallbackCopywritingDetection ? 0.80 :
                hasRegexArticleContent ? 0.90 : 0.6,
    message_length: messageLength,
    is_long_message: isLongMessage,
    message_cleaned: true,
    preview_generated: isPdfCopywriting || isPdfReport || isAnalyticsDashboardReport || isImage || isVideo,
    creative_message_found: hasRichCreativeMessage,
    creative_message_length: creativeMessageFromTool.length,
    prompt_used_found: promptUsed.length > 0,
    prompt_used_length: promptUsed.length,
    existing_pdf_content_found: existingPdfContent.length > 0,
    existing_pdf_content_length: existingPdfContent.length,
    existing_component_type: existingComponentType || 'none',
    video_url_extracted: videoUrl || null,
    image_url_extracted: imageUrl || null,
    regex_extraction: {
      image_url_found: regexImageUrl !== null,
      video_url_found: regexVideoUrl !== null,
      analytics_dashboard_detected: isAnalyticsDashboard,
      extracted_image_url: regexImageUrl,
      extracted_video_url: regexVideoUrl
    }
  },

  chat_message: finalMessage,
  ui_component: finalComponents.length > 0 ? finalComponents[0].type : 'ACTION_BUTTONS',
  ui_components: finalComponents,

  creative_result: isImage ? {
    image_url: imageUrl,
    prompt_used: promptUsed,
    provider: parsedInput?.provider || 'imgbb'
  } : isVideo ? {
    video_url: videoUrl,
    prompt_used: promptUsed
  } : null,

  meta: {
    agent_id: 'orchestrator',
    version: 'v18.6',
    timestamp: new Date().toISOString(),
    request_id: `req_${Date.now()}`,
    detected_type: isImage ? 'image' :
                   isVideo ? 'video' :
                   isPdfCopywriting ? 'copywriting' :
                   isAnalyticsDashboardReport ? 'analytics_dashboard' :
                   isPdfReport ? 'pdf_report' : 'default',
    responding_agent: respondingAgent,
    agent_display_name: agentDisplayName,
    agent_role: agentRole,
    detection_method: detectionMethod
  }
};

return [{ json: uiResponse }];
