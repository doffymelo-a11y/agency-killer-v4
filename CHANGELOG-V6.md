# CHANGELOG - Creative V6 Updates

## Version 4.6.5 (2025-01-23)

### Summary
Major update to Creative V6 workflow fixing image generation pipeline, tool selection, and frontend display issues.

---

## 1. Nano Banana Pro - imgbb Migration

### Problem
file.io was returning HTML instead of JSON, causing image upload failures when base64 URLs were too large.

### Solution
Migrated to imgbb.com API for reliable image hosting.

### Changes

#### Upload Node Configuration
```
Node: Upload to imgbb
URL: https://api.imgbb.com/1/upload
Method: POST

Query Parameters:
  - key: {{ $credentials.imgbbApiKey }}

Body (Form-Data):
  - image: Binary file (Input Data Field Name: "data")
```

#### Format Output (V3)
```javascript
const imgbbResponse = $input.first().json;
let imageUrl = null;

if (imgbbResponse && imgbbResponse.success === true && imgbbResponse.data) {
    imageUrl = imgbbResponse.data.display_url || imgbbResponse.data.url;
}

return {
  json: {
    success: true,
    tool: 'nano_banana_pro',
    image_url: imageUrl,
    provider: 'imgbb'
  }
};
```

---

## 2. Enhance Prompt - Robust Extraction (V4)

### Problem
`positive_prompt` and `prompt` fields were not being found. The actual user input was in `query.some_input` or `chatInput`.

### Solution
Created `extractPrompt()` function that checks multiple possible field locations.

### Code
```javascript
function extractPrompt(data) {
    // 1. Creative V6 format
    if (data.query && data.query.some_input) {
        return data.query.some_input;
    }
    // 2. Direct fields
    if (data.some_input) return data.some_input;
    if (data.positive_prompt) return data.positive_prompt;
    if (data.prompt) return data.prompt;
    if (data.chatInput) return data.chatInput;
    if (data.message) return data.message;
    if (data.text) return data.text;

    // 3. Nested query fields
    if (data.query) {
        if (data.query.prompt) return data.query.prompt;
        if (data.query.positive_prompt) return data.query.positive_prompt;
        if (data.query.chatInput) return data.query.chatInput;
    }

    return null;
}
```

---

## 3. Ghost Buster V6.5 - Tool Recommendation

### Problem
MILO Brain AI Agent was selecting `runway_gen3` (video) instead of `nano_banana_pro` (image) for image generation requests.

### Solution
Added `recommended_tool` field to Ghost Buster output with keyword-based detection.

### Keyword Detection
```javascript
const videoKeywords = ['video', 'vidéo', 'clip', 'animation', 'anime', 'motion', 'reel', 'film', 'spot video'];
const imageKeywords = ['image', 'visuel', 'photo', 'affiche', 'poster', 'banniere', 'bannière', 'publicité', 'publicitaire', 'graphique', 'illustration', 'design', 'créa', 'crea'];
const copyKeywords = ['texte', 'copy', 'article', 'blog', 'script', 'redige', 'ecris', 'accroche', 'slogan', 'headline'];

const videoMatches = videoKeywords.filter(kw => message.includes(kw)).length;
const imageMatches = imageKeywords.filter(kw => message.includes(kw)).length;
const copyMatches = copyKeywords.filter(kw => message.includes(kw)).length;

let recommendedTool = 'nano_banana_pro'; // Default: image

if (videoMatches > 0 && videoMatches >= imageMatches) {
  recommendedTool = 'runway_gen3';
} else if (imageMatches > 0) {
  recommendedTool = 'nano_banana_pro';
} else if (copyMatches > 0) {
  recommendedTool = 'copywriting_pro';
}

// OVERRIDE: Force nano_banana_pro if image keywords without video keywords
if (message.includes('image') || message.includes('visuel') || message.includes('photo')) {
  if (!message.includes('video') && !message.includes('vidéo')) {
    recommendedTool = 'nano_banana_pro';
  }
}
```

### Output
```json
{
  "recommended_tool": "nano_banana_pro",
  "content_type": "image",
  "tool_selection_reason": "Type détecté: image. Outil recommandé: nano_banana_pro",
  "tools_available": ["copywriting_pro", "nano_banana_pro", "runway_gen3"]
}
```

---

## 4. MILO Brain Prompt Update

### Problem
AI Agent was ignoring Ghost Buster recommendations and choosing tools based on its own interpretation.

### Solution
Added explicit instructions in MILO Brain system prompt to ALWAYS use the recommended tool.

### Prompt Addition
```
## OUTIL RECOMMANDÉ PAR LE SYSTÈME:
➜ **{{ $json.recommended_tool }}** (Type détecté: {{ $json.content_type }})

## RÈGLE ABSOLUE:
Tu DOIS utiliser l'outil recommandé ci-dessus: [{{ $json.recommended_tool }}]

- Si recommended_tool = "nano_banana_pro" → Génère une IMAGE
- Si recommended_tool = "runway_gen3" → Génère une VIDÉO
- Si recommended_tool = "copywriting_pro" → Génère du TEXTE

⚠️ NE CHANGE PAS l'outil recommandé sauf si l'utilisateur le demande EXPLICITEMENT.

## EXÉCUTION:
Lance maintenant l'outil [{{ $json.recommended_tool }}] avec un prompt détaillé.
```

---

## 5. Format UI Response V4.5 (Orchestrator)

### Problem
`ui_components` array was returning empty because JSON was embedded in text responses from the AI.

### Solution
Created `extractAndParseJSON()` function that can find and parse JSON from mixed text+JSON content.

### Code
```javascript
function extractAndParseJSON(input) {
  if (typeof input === 'object' && input !== null) return input;
  if (typeof input !== 'string') return null;

  try {
    return JSON.parse(input);
  } catch (e) {
    // Try code block extraction
    const codeBlockMatch = input.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      try {
        return JSON.parse(codeBlockMatch[1].trim());
      } catch (e2) {}
    }

    // Try brace matching
    const firstBrace = input.indexOf('{');
    if (firstBrace !== -1) {
      let depth = 0;
      let endIndex = -1;

      for (let i = firstBrace; i < input.length; i++) {
        if (input[i] === '{') depth++;
        if (input[i] === '}') depth--;
        if (depth === 0) {
          endIndex = i;
          break;
        }
      }

      if (endIndex !== -1) {
        try {
          return JSON.parse(input.slice(firstBrace, endIndex + 1));
        } catch (e3) {}
      }
    }

    return null;
  }
}
```

### Important
The code MUST end with `return [{ json: uiResponse }];` - missing this caused "Code doesn't return items properly" error.

---

## 6. Frontend Changes (Cockpit V3)

### Files Modified
- `/src/services/n8n.ts` - V13 parseOrchestratorResponse
- `/src/components/chat/ChatMessage.tsx` - Image preview + download

### n8n.ts V13 - Message Extraction
Robust message extraction avoiding `JSON.stringify()` fallback:

```javascript
let message = '';

// 1. chat_message (n8n Creative V6 format)
if (responseData.chat_message) {
  const chatMsg = responseData.chat_message;
  if (typeof chatMsg === 'string') {
    message = chatMsg;
  } else if (typeof chatMsg === 'object') {
    message = chatMsg.content || chatMsg.text || chatMsg.message || '';
  }
}

// 2. Direct fields fallback
if (!message) {
  message = responseData.message || responseData.response ||
            responseData.text || responseData.output || responseData.content || '';
}

// 3. creative_result extraction
if (!message && responseData.creative_result) {
  const creative = responseData.creative_result;
  const promptUsed = creative.prompt_used || responseData.prompt_used;
  if (promptUsed) {
    message = `**Visuel généré avec succès !**\n\n📝 **Description du visuel :**\n${promptUsed}`;
  }
}

// 4. Generic fallback based on ui_component type
if (!message) {
  if (responseData.ui_component === 'CAMPAGNE_TABLE' ||
      responseData.ui_component === 'CAMPAIGN_TABLE' ||
      responseData.ui_component === 'IMAGE_PREVIEW') {
    message = '✅ **Visuel généré avec succès !**\n\nCliquez sur le bouton ci-dessous pour télécharger votre image.';
  }
}
```

### ChatMessage.tsx - Image Support
Added support for both `CAMPAGNE_TABLE` and `CAMPAIGN_TABLE` variants:

```javascript
const hasImageComponent = message.uiComponents?.some(
  (comp) => comp.type === 'CAMPAIGN_TABLE' ||
            comp.type === 'CAMPAGNE_TABLE' ||
            comp.type === 'IMAGE_PREVIEW'
);

// Extract image URL from various structures
const extractedImageUrl = imageData?.image_url ||
  imageData?.url ||
  imageData?.rows?.[0]?.visuel;
```

---

## Files Updated

| File | Version | Changes |
|------|---------|---------|
| Nano Banana Pro - Enhance Prompt | V4 | extractPrompt() function |
| Nano Banana Pro - Upload | V3 | imgbb.com integration |
| Nano Banana Pro - Format Output | V3 | imgbb response parsing |
| Creative V6 - Ghost Buster | V6.5 | recommended_tool field |
| Creative V6 - MILO Brain | V6.5 | Force tool usage prompt |
| Orchestrator - Format UI Response | V4.5 | extractAndParseJSON() |
| Frontend - n8n.ts | V13 | Robust message extraction |
| Frontend - ChatMessage.tsx | - | CAMPAGNE_TABLE support |

---

## Testing

All changes tested and confirmed working on 2025-01-23.
User request: "crée une image publicitaire pour des Nike Air Max 2025"
- Ghost Buster correctly detected: `content_type: "image"`, `recommended_tool: "nano_banana_pro"`
- MILO Brain used nano_banana_pro (not runway_gen3)
- Image uploaded to imgbb successfully
- Frontend displayed image with download button

---

*Last updated: 2025-01-23*
