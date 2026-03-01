// ============================================================================
// FORMAT UI RESPONSE V25 - Creative MCP (Milo)
// ============================================================================
// Ce node formate les reponses du Creative Agent pour le frontend
// Types generes: CAMPAGNE_TABLE (images), AD_PREVIEW (videos), PDF_COPYWRITING
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
// HELPER: Tronquer un prompt long
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

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1: UNWRAP INPUT
// ─────────────────────────────────────────────────────────────────────────────
let parsedInput = unwrapN8nJson(rawInput);
const fullRawStr = JSON.stringify(parsedInput);
const fullRawStrLower = fullRawStr.toLowerCase();

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2: EXTRACTION DES URLs (IMAGE / VIDEO)
// ─────────────────────────────────────────────────────────────────────────────
let imageUrl = parsedInput?.image_url
  || parsedInput?.creative_result?.image_url
  || parsedInput?.creative_result?.deliverables?.image_url
  || parsedInput?.image?.url
  || null;

let videoUrl = parsedInput?.video_url
  || parsedInput?.creative_result?.video_url
  || parsedInput?.creative_result?.deliverables?.video_url
  || parsedInput?.video?.url
  || null;

// Regex fallback pour image
if (!imageUrl) {
  const imageUrlMatch = fullRawStr.match(/"image_url"\s*:\s*"(https?:[^"]+)"/);
  if (imageUrlMatch && imageUrlMatch[1]) {
    imageUrl = imageUrlMatch[1].replace(/\\\//g, '/');
  }
}
if (!imageUrl) {
  const ibbMatch = fullRawStr.match(/https?:\\?\/\\?\/?i\.ibb\.co[^"\\]*/);
  if (ibbMatch && ibbMatch[0]) {
    imageUrl = ibbMatch[0].replace(/\\\//g, '/');
  }
}

// Regex fallback pour video
if (!videoUrl) {
  const videoUrlMatch = fullRawStr.match(/"video_url"\s*:\s*"(https?:[^"]+)"/);
  if (videoUrlMatch && videoUrlMatch[1]) {
    videoUrl = videoUrlMatch[1].replace(/\\\//g, '/');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3: EXTRACTION DU PROMPT / SCRIPT
// ─────────────────────────────────────────────────────────────────────────────
let promptUsed = parsedInput?.prompt_used
  || parsedInput?.creative_result?.prompt_used
  || parsedInput?.creative_result?.deliverables?.meta?.prompt_used
  || parsedInput?.script
  || parsedInput?.creative_result?.script
  || parsedInput?.video?.script
  || '';

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
// STEP 4: EXTRACTION DU CONTENU COPYWRITING
// ─────────────────────────────────────────────────────────────────────────────
let articleContent = '';
let articleTitle = '';

// Titre
const titleMatch = fullRawStr.match(/"(?:title|headline)"\s*:\s*"((?:[^"\\]|\\.)*)"/);
if (titleMatch && titleMatch[1] && titleMatch[1].length > 5) {
  articleTitle = titleMatch[1]
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

// Corps de l'article
const bodyMatch = fullRawStr.match(/"body"\s*:\s*"((?:[^"\\]|\\.)*)"/);
if (bodyMatch && bodyMatch[1] && bodyMatch[1].length > 200) {
  articleContent = bodyMatch[1]
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

if (!articleContent || articleContent.length < 200) {
  const contentMatch = fullRawStr.match(/"[Cc]ontent"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (contentMatch && contentMatch[1] && contentMatch[1].length > 200) {
    articleContent = contentMatch[1]
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 5: EXTRACTION DU CHAT MESSAGE
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
// STEP 6: DETECTION DU TYPE DE CONTENU
// ─────────────────────────────────────────────────────────────────────────────
const isImage = imageUrl && !videoUrl;
const isVideo = videoUrl !== null && videoUrl !== '';

const isCopywriting = !isImage && !isVideo && (
  articleContent.length > 200 ||
  fullRawStrLower.includes('pdf_copywriting') ||
  fullRawStrLower.includes('copywriting') ||
  fullRawStrLower.includes('article') ||
  fullRawStrLower.includes('blog')
);

// ─────────────────────────────────────────────────────────────────────────────
// STEP 7: CONSTRUCTION DES UI COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
let finalComponents = [];

// CAS 1: IMAGE (CAMPAGNE_TABLE)
if (isImage) {
  finalComponents.push({
    type: 'CAMPAGNE_TABLE',
    data: {
      image_url: imageUrl,
      prompt_used: promptUsed,
      tool: parsedInput?.tool || 'nano_banana_pro',
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

  // Message pour image
  const promptPreview = promptUsed ? truncatePrompt(promptUsed, 200) : '';
  finalMessage = `**Visuel genere avec succes !**\n\nJ'ai cree cette image en suivant vos instructions.`;
  if (promptPreview) {
    finalMessage += `\n\n**Concept :** ${promptPreview}`;
  }
  finalMessage += `\n\n*Cliquez sur l'image pour la telecharger en haute resolution.*`;
}

// CAS 2: VIDEO (AD_PREVIEW)
else if (isVideo) {
  finalComponents.push({
    type: 'AD_PREVIEW',
    data: {
      platform: parsedInput?.platform || 'meta_feed',
      format: 'video',
      video_url: videoUrl,
      image_url: null,
      headline: parsedInput?.headline || articleTitle || '',
      primary_text: parsedInput?.primary_text || promptUsed,
      description: parsedInput?.description || '',
      cta: parsedInput?.cta || 'learn_more',
      destination_url: parsedInput?.destination_url || '',
      tool: parsedInput?.tool || 'veo3',
      prompt_used: promptUsed,
      script: parsedInput?.script || promptUsed,
      generated_at: new Date().toISOString()
    },
    layout: { width: 'full', order: 1 }
  });

  // Message pour video
  const scriptPreview = promptUsed ? truncatePrompt(promptUsed, 200) : '';
  finalMessage = `**Video generee avec succes !**\n\nVotre video publicitaire est prete.`;
  if (scriptPreview) {
    finalMessage += `\n\n**Script/Concept :** ${scriptPreview}`;
  }
  finalMessage += `\n\n*Cliquez sur le bouton pour telecharger la video.*`;
}

// CAS 3: COPYWRITING (PDF_COPYWRITING)
else if (isCopywriting) {
  const copyContent = articleContent || finalMessage;
  const title = articleTitle || parsedInput?.title || 'Article de Blog';

  finalComponents.push({
    type: 'PDF_COPYWRITING',
    data: {
      title: title,
      content: copyContent,
      headline: parsedInput?.headline || title,
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

  // Message pour copywriting
  const contentPreview = generateContentPreview(copyContent, 350);
  const wordCount = copyContent.split(/\s+/).length;

  finalMessage = `**Article redige avec succes !**\n\nJ'ai cree un article complet de **${wordCount} mots** optimise pour le SEO.`;
  if (title && title !== 'Article de Blog') {
    finalMessage += `\n\n**Titre :** ${title}`;
  }
  if (contentPreview && contentPreview.length > 50) {
    finalMessage += `\n\n**Apercu :**\n${contentPreview}`;
  }
  finalMessage += `\n\n*Telechargez le PDF complet ci-dessous pour acceder a l'article entier.*`;
}

// CAS 4: DEFAULT - Retransmettre ce qu'on a recu
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
  if (isImage) {
    finalMessage = '**Visuel cree !**\n\nCliquez sur l\'image pour la telecharger.';
  } else if (isVideo) {
    finalMessage = '**Video prete !**\n\nCliquez sur le bouton pour la telecharger.';
  } else if (isCopywriting) {
    finalMessage = '**Contenu redige !**\n\nTelechargez le PDF ci-dessous.';
  } else {
    finalMessage = rawMessage || 'Tache creative terminee.';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 8: BUILD MEMORY CONTRIBUTION (V4.3 Collective Memory)
// ─────────────────────────────────────────────────────────────────────────────
function buildMemoryContribution(isImage, isVideo, isCopywriting, imageUrl, videoUrl, promptUsed, articleTitle, articleContent) {
  // Determine action type
  let action = 'TASK_COMPLETED';
  if (isImage || isVideo) action = 'DELIVERABLE_CREATED';
  if (isCopywriting) action = 'ASSET_GENERATED';

  // Build summary
  let summary = '';
  if (isImage) {
    summary = `Visuel créé: ${truncatePrompt(promptUsed, 100) || 'Image générée'}`;
  } else if (isVideo) {
    summary = `Vidéo générée: ${truncatePrompt(promptUsed, 100) || 'Vidéo publicitaire'}`;
  } else if (isCopywriting) {
    const wordCount = articleContent ? articleContent.split(/\s+/).length : 0;
    summary = `Article rédigé: "${articleTitle || 'Sans titre'}" (${wordCount} mots)`;
  } else {
    summary = 'Tâche créative complétée';
  }

  // Build key findings
  const keyFindings = [];
  if (isImage && promptUsed) {
    keyFindings.push(`Style visuel: ${truncatePrompt(promptUsed, 80)}`);
  }
  if (isVideo && promptUsed) {
    keyFindings.push(`Script vidéo: ${truncatePrompt(promptUsed, 80)}`);
  }
  if (isCopywriting) {
    if (articleTitle) keyFindings.push(`Titre: ${articleTitle}`);
    keyFindings.push(`Longueur: ${articleContent ? articleContent.split(/\s+/).length : 0} mots`);
  }

  // Build deliverables
  const deliverables = [];
  if (isImage && imageUrl) {
    deliverables.push({
      type: 'image',
      url: imageUrl,
      title: promptUsed ? truncatePrompt(promptUsed, 50) : 'Visuel généré',
      description: promptUsed || ''
    });
  }
  if (isVideo && videoUrl) {
    deliverables.push({
      type: 'video',
      url: videoUrl,
      title: 'Vidéo publicitaire',
      description: promptUsed || ''
    });
  }
  if (isCopywriting && articleContent) {
    deliverables.push({
      type: 'text',
      url: null,
      title: articleTitle || 'Article',
      description: `Article de ${articleContent.split(/\s+/).length} mots`
    });
  }

  // Build recommendations for other agents
  const recommendations = [];
  if (isImage) {
    recommendations.push('Pour Marcus: Visuel prêt pour intégration dans les campagnes ads');
    recommendations.push('Pour Sora: Tracking des performances visuelles recommandé');
  }
  if (isVideo) {
    recommendations.push('Pour Marcus: Vidéo prête pour placement dans les campagnes');
    recommendations.push('Pour Sora: Configurer le tracking video engagement');
  }
  if (isCopywriting) {
    recommendations.push('Pour Luna: Contenu prêt pour intégration SEO');
    recommendations.push('Pour Marcus: Copy disponible pour ads');
  }

  return {
    action: action,
    summary: summary,
    key_findings: keyFindings,
    deliverables: deliverables,
    recommendations_for_next_agent: recommendations,
    flags_to_update: {
      creatives_ready: true
    }
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 9: CONSTRUCTION REPONSE FINALE
// ─────────────────────────────────────────────────────────────────────────────
const memoryContribution = buildMemoryContribution(
  isImage, isVideo, isCopywriting,
  imageUrl, videoUrl, promptUsed,
  articleTitle, articleContent
);

const uiResponse = {
  thought_process: {
    step: 'Format UI Response V25 - Creative',
    reasoning: isImage ? 'Image detectee → CAMPAGNE_TABLE' :
               isVideo ? 'Video detectee → AD_PREVIEW' :
               isCopywriting ? 'Copywriting detecte → PDF_COPYWRITING' : 'Default response',
    detected_type: isImage ? 'image' : isVideo ? 'video' : isCopywriting ? 'copywriting' : 'default',
    image_url_found: !!imageUrl,
    video_url_found: !!videoUrl,
    article_content_length: articleContent.length,
    prompt_used_length: promptUsed.length
  },

  chat_message: finalMessage,
  ui_component: finalComponents.length > 0 ? finalComponents[0].type : null,
  ui_components: finalComponents,

  creative_result: isImage ? {
    image_url: imageUrl,
    prompt_used: promptUsed,
    provider: parsedInput?.provider || 'imgbb'
  } : isVideo ? {
    video_url: videoUrl,
    prompt_used: promptUsed,
    script: parsedInput?.script || promptUsed
  } : isCopywriting ? {
    title: articleTitle,
    content: articleContent,
    word_count: articleContent.split(/\s+/).length
  } : null,

  // V4.3 COLLECTIVE MEMORY - Contribution for PM to write to Supabase
  memory_contribution: memoryContribution,

  meta: {
    agent_id: 'milo',
    agent_name: 'Milo',
    agent_role: 'Creative Director',
    version: 'v25_memory',
    timestamp: new Date().toISOString(),
    request_id: `creative_${Date.now()}`,
    detected_type: isImage ? 'image' : isVideo ? 'video' : isCopywriting ? 'copywriting' : 'default'
  }
};

return [{ json: uiResponse }];
