// ============================================================================
// FORMAT UI RESPONSE V17 - Agency Killer Orchestrator
// ============================================================================
// FIX V17: Nettoyage JSON parasites + Résumé chat pour tous les UI_COMPONENTS
// BASE: V16 (100% préservé) + ajouts non-destructifs
// ============================================================================

const rawInput = $input.first().json;

// ─────────────────────────────────────────────────────────────────────────────
// STEP 0: EXTRACTION REGEX GLOBALE (AVANT TOUT PARSING)
// ─────────────────────────────────────────────────────────────────────────────
const fullRawStr = JSON.stringify(rawInput);

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
// HELPER: extractAndParseJSON (V16 - IDENTIQUE)
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
// HELPER: Unwrap n8n JSON wrappers (V16 - IDENTIQUE)
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

  // 1. Supprimer les blocs de code JSON markdown
  cleaned = cleaned.replace(/```json[\s\S]*?```/gi, '');
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '');

  // 2. Supprimer les objets JSON qui commencent par ui_components
  cleaned = cleaned.replace(/\{\s*"ui_components?"[\s\S]*$/gi, '');

  // 3. Supprimer les objets JSON type PDF_REPORT, PDF_COPYWRITING, etc.
  cleaned = cleaned.replace(/\{\s*"type"\s*:\s*"(PDF_|CAMPAGNE_|CAMPAIGN_|AD_|VIDEO_)[\s\S]*$/gi, '');

  // 4. Supprimer les lignes JSON isolées
  cleaned = cleaned.replace(/^\s*[\{\}\[\]]\s*$/gm, '');
  cleaned = cleaned.replace(/^\s*"[a-z_]+":\s*[\[\{"].*/gm, '');

  // 5. Nettoyer les lignes vides multiples
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // 6. Trim
  cleaned = cleaned.trim();

  return cleaned;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER V17: Générer un résumé/aperçu du contenu long
// ─────────────────────────────────────────────────────────────────────────────
function generateContentPreview(content, maxLength = 300) {
  if (!content || typeof content !== 'string') return '';

  // Nettoyer d'abord le contenu des JSON parasites
  let cleanContent = cleanMessageFromJson(content);

  if (cleanContent.length <= maxLength) return cleanContent;

  // Couper au dernier espace avant maxLength
  let preview = cleanContent.substring(0, maxLength);
  const lastSpace = preview.lastIndexOf(' ');
  if (lastSpace > maxLength * 0.7) {
    preview = preview.substring(0, lastSpace);
  }

  return preview + '...';
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1: UNWRAP INPUT (V16 - IDENTIQUE)
// ─────────────────────────────────────────────────────────────────────────────
let parsedInput = unwrapN8nJson(rawInput);

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

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2: EXTRACTION DES VALEURS CLES (V16 - IDENTIQUE)
// ─────────────────────────────────────────────────────────────────────────────
const uiComponent = parsedInput?.ui_component || parsedInput?.type || null;
let existingUiComponents = parsedInput?.ui_components || [];

let imageUrl = regexImageUrl
  || parsedInput?.image_url
  || parsedInput?.creative_result?.image_url
  || parsedInput?.image?.url
  || null;

let videoUrl = regexVideoUrl
  || parsedInput?.video_url
  || parsedInput?.creative_result?.video_url
  || parsedInput?.video?.url
  || null;

let promptUsed = parsedInput?.prompt_used
  || parsedInput?.creative_result?.prompt_used
  || parsedInput?.image?.original_prompt
  || '';

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2.5: EXTRACTION DU MESSAGE CHAT (V16 + V17 cleaning + V17.1 ui_components)
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
  rawMessage = parsedInput?.message || parsedInput?.response || parsedInput?.text || parsedInput?.output || parsedInput?.content || '';
}

// ═══════════════════════════════════════════════════════════════════════════
// V17.1 FIX: Extraire le contenu depuis existingUiComponents si présent
// C'est le cas quand le Strategist envoie déjà un PDF_REPORT formaté
// ═══════════════════════════════════════════════════════════════════════════
let existingPdfContent = '';

if (existingUiComponents && existingUiComponents.length > 0) {
  const firstComp = existingUiComponents[0];
  if (firstComp && firstComp.data) {
    // Chercher le contenu avec différentes casses (Content, content, body)
    existingPdfContent = firstComp.data.Content
      || firstComp.data.content
      || firstComp.data.body
      || firstComp.data.text
      || '';
  }
}

// Si rawMessage est vide mais qu'on a du contenu dans ui_components, l'utiliser
if (!rawMessage && existingPdfContent) {
  rawMessage = existingPdfContent;
}

// ═══════════════════════════════════════════════════════════════════════════
// V17 FIX: NETTOYER LE MESSAGE DES JSON PARASITES
// ═══════════════════════════════════════════════════════════════════════════
let finalMessage = cleanMessageFromJson(rawMessage);

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3: DETECTION DU TYPE DE CONTENU (V16 - IDENTIQUE)
// ─────────────────────────────────────────────────────────────────────────────
const fullRawStrLower = fullRawStr.toLowerCase();

const isBlogRequest = fullRawStrLower.includes('blog')
  || fullRawStrLower.includes('blogue')
  || fullRawStrLower.includes('article')
  || fullRawStrLower.includes('rédige')
  || fullRawStrLower.includes('redige')
  || fullRawStrLower.includes('copywriting')
  || fullRawStrLower.includes('contenu');

const isPdfRequest = fullRawStrLower.includes('pdf')
  || fullRawStrLower.includes('rapport')
  || fullRawStrLower.includes('report');

// ═══════════════════════════════════════════════════════════════════════════
// RÈGLE 2000 CARACTÈRES (V16 - IDENTIQUE)
// ═══════════════════════════════════════════════════════════════════════════
const messageLength = finalMessage.length;
const isLongMessage = messageLength > 2000;

// ═══════════════════════════════════════════════════════════════════════════
// V17.2 FIX: Respecter le type envoyé par le Strategist dans existingUiComponents
// Si le Strategist a explicitement envoyé PDF_REPORT, on le respecte!
// ═══════════════════════════════════════════════════════════════════════════
const existingComponentType = existingUiComponents?.[0]?.type || '';
const strategistSentPdfReport = existingComponentType === 'PDF_REPORT';
const strategistSentPdfCopywriting = existingComponentType === 'PDF_COPYWRITING';

// Détection explicite de demande de rapport/analyse (PRIME sur isBlogRequest)
const isReportRequest = fullRawStrLower.includes('rapport')
  || fullRawStrLower.includes('analyse')
  || fullRawStrLower.includes('audit')
  || fullRawStrLower.includes('étude')
  || fullRawStrLower.includes('etude');

const isPdfReport = strategistSentPdfReport  // V17.2: Priorité au Strategist
  || uiComponent === 'PDF_REPORT'
  || parsedInput?.report_type === 'pdf'
  || fullRawStr.includes('"PDF_REPORT"')
  || isPdfRequest
  || isReportRequest  // V17.2: Ajout détection rapport/analyse
  || (isLongMessage && !isBlogRequest);

const isPdfCopywriting = !isPdfReport && (  // V17.2: Ne pas être PDF_REPORT d'abord!
  strategistSentPdfCopywriting
  || uiComponent === 'PDF_COPYWRITING'
  || parsedInput?.content_type === 'copywriting'
  || fullRawStr.includes('"PDF_COPYWRITING"')
  || fullRawStr.includes('"copywriting_content"')
  || (isBlogRequest && isLongMessage && !isReportRequest)  // V17.2: Pas si c'est un rapport
);

const isImage = imageUrl !== null && imageUrl !== undefined && imageUrl !== '' && !videoUrl;
const isVideo = videoUrl !== null && videoUrl !== undefined && videoUrl !== '';

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4: CONSTRUCTION DES UI COMPONENTS (V16 - IDENTIQUE)
// ─────────────────────────────────────────────────────────────────────────────
let finalComponents = [];

// ==================== CAS 1: IMAGE (CAMPAGNE_TABLE) - PRIORITE HAUTE ====================
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

// ==================== CAS 2: VIDEO (AD_PREVIEW) ====================
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

// ==================== CAS 3: PDF_COPYWRITING (Blog/Article long) ====================
else if (isPdfCopywriting) {
  finalComponents.push({
    type: 'PDF_COPYWRITING',
    data: {
      title: parsedInput?.title || 'Article de Blog',
      content: finalMessage,
      headline: parsedInput?.headline || '',
      body: finalMessage,
      cta: parsedInput?.cta || '',
      variations: parsedInput?.variations || [],
      tone: parsedInput?.tone || 'professional',
      word_count: finalMessage.split(/\s+/).length,
      char_count: messageLength,
      generated_at: new Date().toISOString()
    },
    layout: { width: 'full', order: 1 }
  });
}

// ==================== CAS 4: PDF_REPORT (Rapport/Analyse long) ====================
else if (isPdfReport) {
  // V17.1: Utiliser existingPdfContent si disponible (venant du Strategist)
  const reportContent = existingPdfContent || finalMessage;

  finalComponents.push({
    type: 'PDF_REPORT',
    data: {
      title: parsedInput?.title || existingUiComponents?.[0]?.data?.title || 'Rapport d\'Analyse',
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

// ==================== CAS 5: EXISTING UI_COMPONENTS ====================
else if (existingUiComponents && existingUiComponents.length > 0) {
  finalComponents = existingUiComponents;
}

// ==================== CAS 6: MENU PAR DEFAUT ====================
else {
  finalComponents.push({
    type: 'ACTION_BUTTONS',
    data: {
      layout: 'grid',
      actions: [
        { id: 'menu_analyst', label: 'Analyser mes performances', icon: 'chart-line', action_type: 'message', variant: 'secondary', payload: { message: 'Montre-moi mon bilan de performance' } },
        { id: 'menu_creative', label: 'Créer un visuel', icon: 'palette', action_type: 'message', variant: 'secondary', payload: { message: 'Crée une image publicitaire' } },
        { id: 'menu_copy', label: 'Rédiger du contenu', icon: 'edit', action_type: 'message', variant: 'secondary', payload: { message: 'Rédige un article de blog' } }
      ]
    },
    layout: { width: 'full', order: 1 }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 5: MESSAGES PAR DEFAUT AVEC RÉSUMÉ (V17 AMÉLIORÉ)
// ─────────────────────────────────────────────────────────────────────────────

// CAS 1: IMAGE - Message avec description du visuel
if (!finalMessage && isImage && promptUsed) {
  finalMessage = `✅ **Visuel généré avec succès !**\n\n📝 **Description du visuel :**\n${promptUsed}`;
}

if (!finalMessage && isImage) {
  finalMessage = '✅ **Visuel généré avec succès !**\n\nCliquez sur l\'image pour la télécharger.';
}

// CAS 2: VIDEO - Message avec description
if (!finalMessage && isVideo && promptUsed) {
  finalMessage = `✅ **Vidéo générée avec succès !**\n\n📝 **Description :**\n${promptUsed}`;
}

if (!finalMessage && isVideo) {
  finalMessage = '✅ **Vidéo générée avec succès !**\n\nCliquez sur le bouton pour la télécharger.';
}

// CAS 3: PDF_COPYWRITING - Message avec aperçu du contenu
if (isPdfCopywriting && finalMessage) {
  const contentPreview = generateContentPreview(finalMessage, 400);
  const wordCount = finalMessage.split(/\s+/).length;

  // Remplacer le message par un résumé + aperçu
  finalMessage = `✅ **Article rédigé avec succès !** (${wordCount} mots)\n\n📝 **Aperçu :**\n${contentPreview}\n\n⬇️ *Téléchargez le PDF complet ci-dessous.*`;
}

if (!finalMessage && isPdfCopywriting) {
  finalMessage = '✅ **Contenu rédigé avec succès !**\n\nCliquez sur le bouton COPYWRITING pour télécharger le PDF.';
}

// CAS 4: PDF_REPORT - Message avec aperçu du rapport
// V17.1: Utiliser existingPdfContent pour générer l'aperçu
if (isPdfReport && !isPdfCopywriting) {
  const contentForPreview = existingPdfContent || finalMessage;

  if (contentForPreview && contentForPreview.length > 50) {
    const contentPreview = generateContentPreview(contentForPreview, 400);

    // Remplacer le message par un résumé + aperçu
    finalMessage = `📊 **Rapport généré avec succès !**\n\n📝 **Aperçu :**\n${contentPreview}\n\n⬇️ *Téléchargez le rapport complet ci-dessous.*`;
  } else {
    finalMessage = '📊 **Rapport généré.**\n\nCliquez sur le bouton pour télécharger l\'analyse complète.';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 6: CONSTRUCTION REPONSE FINALE (V16 + V17 flags)
// ─────────────────────────────────────────────────────────────────────────────
const uiResponse = {
  thought_process: {
    step: 'Format UI Response V17',
    reasoning: isImage ? 'Image détectée → CAMPAGNE_TABLE' :
               isVideo ? 'Vidéo détectée → AD_PREVIEW' :
               isPdfCopywriting ? `Blog/Article détecté (${messageLength} chars) → PDF_COPYWRITING` :
               isPdfReport ? `Rapport/Long message (${messageLength} chars) → PDF_REPORT` : 'Réponse standard',
    tools_used: parsedInput?.tool ? [parsedInput.tool] : [],
    confidence: (isImage || isVideo) ? 0.95 : 0.85,
    message_length: messageLength,
    is_long_message: isLongMessage,
    is_blog_request: isBlogRequest,
    message_cleaned: true,
    preview_generated: isPdfCopywriting || isPdfReport,
    existing_pdf_content_found: existingPdfContent.length > 0,
    existing_pdf_content_length: existingPdfContent.length,
    strategist_sent_type: existingComponentType || 'none',
    is_report_request: isReportRequest,
    regex_extraction: {
      image_url_found: regexImageUrl !== null,
      video_url_found: regexVideoUrl !== null,
      extracted_image_url: regexImageUrl
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
    version: 'v17',
    timestamp: new Date().toISOString(),
    request_id: `req_${Date.now()}`,
    detected_type: isImage ? 'image' : isVideo ? 'video' : isPdfCopywriting ? 'copywriting' : isPdfReport ? 'pdf_report' : 'default'
  }
};

return [{ json: uiResponse }];
