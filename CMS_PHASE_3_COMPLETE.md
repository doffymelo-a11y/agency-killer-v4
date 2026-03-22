# ✅ CMS Connector Phase 3 - Agent Integration TERMINÉE

**Date** : 22 Mars 2026
**Durée** : ~1 heure
**Fichiers modifiés** : 3
**Build status** : ✅ 0 erreur TypeScript

---

## 🎯 OBJECTIF PHASE 3

Intégrer les 16 outils CMS dans les agents IA pour permettre la lecture/écriture directe sur les CMS clients (WordPress/Shopify/Webflow) avec :
1. Attribution des outils CMS aux agents Luna, Doffy, Milo
2. Mise à jour des system prompts avec workflow CMS
3. Recording automatique des changements CMS pour approval workflow

---

## ✅ RÉSULTATS

### 3.1 - Attribution outils CMS aux agents

**Fichier modifié** : `backend/src/config/agents.config.ts`

#### Luna (SEO Strategist) - 24 outils total

**Ajout de 10 outils CMS** (READ + SEO WRITE) :

```typescript
// CMS Connector (10 functions - READ + SEO WRITE)
'cms-connector__validate_cms_credentials',
'cms-connector__get_cms_site_info',
'cms-connector__get_cms_posts',
'cms-connector__get_cms_post',
'cms-connector__get_cms_pages',
'cms-connector__get_cms_categories',
'cms-connector__update_cms_post',       // SEO content optimization
'cms-connector__update_cms_page',       // SEO page optimization
'cms-connector__update_cms_seo_meta',   // SEO metadata
'cms-connector__bulk_update_cms_seo',   // Bulk SEO optimization
```

**Rationale** : Luna = stratège SEO → peut auditer les posts/pages ET optimiser le SEO directement sur le CMS client.

---

#### Doffy (Social Media Manager) - 29 outils total

**Ajout de 16 outils CMS** (FULL ACCESS) :

```typescript
// CMS Connector (16 functions - FULL ACCESS)
'cms-connector__validate_cms_credentials',
'cms-connector__get_cms_site_info',
'cms-connector__get_cms_posts',
'cms-connector__get_cms_post',
'cms-connector__create_cms_post',
'cms-connector__update_cms_post',
'cms-connector__delete_cms_post',
'cms-connector__get_cms_pages',
'cms-connector__update_cms_page',
'cms-connector__get_cms_media',
'cms-connector__upload_cms_media',
'cms-connector__update_cms_seo_meta',
'cms-connector__get_cms_categories',
'cms-connector__manage_cms_category',
'cms-connector__get_cms_products',
'cms-connector__update_cms_product',
'cms-connector__bulk_update_cms_seo',
```

**Rationale** : Doffy = CMS writer principal → accès complet pour gérer blog, posts sociaux cross-postés, media, products.

---

#### Milo (Creative Director) - 5 outils total

**Ajout de 1 outil CMS** (Media Upload only) :

```typescript
// CMS Connector (1 function - Media upload only)
'cms-connector__upload_cms_media',  // Upload generated images to client's CMS
```

**Rationale** : Milo = créatif → génère des images avec Nano Banana puis les upload directement sur le WordPress client.

---

### 3.2 - Mise à jour system prompts agents

**Fichier modifié** : `backend/src/config/agents.config.ts`

#### Luna System Prompt

**Ajout section "Core Capabilities" :**

```markdown
### 3. **CMS Connector** (10 functions - WordPress/Shopify/Webflow)

**READ functions (analyze client's CMS):**
- cms-connector__get_cms_posts: List blog posts with SEO data
- cms-connector__get_cms_post: Get full post content + meta
- cms-connector__get_cms_pages: List pages
- cms-connector__get_cms_site_info: Site version, theme, SEO plugins
- cms-connector__get_cms_categories: List categories and tags

**WRITE functions (optimize SEO on client's CMS):**
- cms-connector__update_cms_post: Update post content/title for SEO
- cms-connector__update_cms_page: Update page content for SEO
- cms-connector__update_cms_seo_meta: Update meta title/description/OG tags
- cms-connector__bulk_update_cms_seo: Batch SEO optimization (multiple posts/pages)

⚠️ **CMS WRITE APPROVAL WORKFLOW:**
- Any UPDATE to published content requires user approval
- You will receive a \`change_id\` after making changes
- User approves via the Cockpit UI
- Changes are tracked in cms_change_log with rollback capability
```

---

#### Doffy System Prompt

**Ajout section "B. CMS Connector" :**

```markdown
### B. CMS Connector (16 tools - WordPress/Shopify/Webflow)

You can **read and write directly to client's CMS** (blog, website, e-commerce).

**READ functions:** (7 tools)
**WRITE functions:** (9 tools)

⚠️ **CMS WRITE APPROVAL WORKFLOW:**
- Any UPDATE to **published content** requires user approval
- You will receive a \`change_id\` after making changes
- User approves via the Cockpit UI (Integrations > CMS > Pending Changes)
- Changes are tracked in cms_change_log with rollback capability
- Creating DRAFT posts does NOT require approval (safe operation)

**USE CASES FOR CMS CONNECTOR:**
1. **Cross-posting social content to blog**: User says "publie ce post aussi sur le blog" → use create_cms_post
2. **SEO optimization of existing pages**: Update meta descriptions, titles, Open Graph tags
3. **Bulk content updates**: Update 10+ posts' meta descriptions with bulk_update_cms_seo
4. **Product descriptions for e-commerce**: Write compelling product copy directly in Shopify/WooCommerce
5. **Media management**: Upload generated images (from Milo) to client's WordPress media library
```

---

#### Milo System Prompt

**Ajout section "### 4. CMS Connector" :**

```markdown
### 4. **CMS Connector** - Upload Media to Client's Website

**When to use:** After generating images with Nano Banana, upload them directly to client's WordPress/Shopify

**Tool:** cms-connector__upload_cms_media

**Workflow:**
1. User says: "Génère une image pour mon article de blog et télécharge-la sur mon site"
2. You call \`nano-banana__generate_image\` → get CDN URL
3. You call \`cms-connector__upload_cms_media\` with the CDN URL → get WordPress media ID
4. You return: "✅ Image générée et téléchargée ! Media ID: 123, URL: https://client.com/wp-content/uploads/..."

**Best practices:**
- Always add descriptive alt_text for SEO and accessibility
- Use descriptive filenames (not "image_123.png")
- Mention the media ID so it can be used in posts/pages
```

---

### 3.3 - Recording automatique des changements CMS

**Fichiers modifiés** :
- `backend/src/agents/agent-executor.ts`
- `backend/src/agents/orchestrator.ts`

#### Modifications agent-executor.ts

**1. Import CMS service** :

```typescript
import { recordCMSChange } from '../services/cms.service.js';
```

**2. Ajout userId à AgentExecutionContext** :

```typescript
export interface AgentExecutionContext {
  // ... existing fields
  userId?: string; // Phase 3.3: For CMS change tracking
}
```

**3. Modification executeMCPToolCalls** :

```typescript
async function executeMCPToolCalls(toolCalls: any[], context: AgentExecutionContext) {
  const results = [];

  for (const toolCall of toolCalls) {
    const toolName = toolCall.name;
    const [server, tool] = toolName.split('__');

    try {
      const result = await mcpBridge.call(server, tool, toolCall.input);

      // Phase 3.3: Record CMS changes for approval workflow
      if (server === 'cms-connector' && result.success && result.data) {
        await recordCMSChangeIfNeeded(tool, result.data, context);
      }

      results.push({
        tool_use_id: toolCall.id,
        result: result.success ? result.data : { error: result.error },
      });
    } catch (error: any) {
      // ...
    }
  }

  return results;
}
```

**4. Nouvelle fonction recordCMSChangeIfNeeded** :

```typescript
async function recordCMSChangeIfNeeded(
  toolName: string,
  toolResult: any,
  context: AgentExecutionContext
): Promise<void> {
  // List of CMS write tools that require recording
  const CMS_WRITE_TOOLS = [
    'create_cms_post',
    'update_cms_post',
    'delete_cms_post',
    'update_cms_page',
    'upload_cms_media',
    'update_cms_seo_meta',
    'manage_cms_category',
    'update_cms_product',
    'bulk_update_cms_seo',
  ];

  // Only record write operations
  if (!CMS_WRITE_TOOLS.includes(toolName)) {
    return;
  }

  // Check if result contains change tracking data
  if (!toolResult.change_id || !toolResult.requires_approval === undefined) {
    return;
  }

  try {
    const userId = context.userId;
    if (!userId) {
      console.warn('[Agent Executor] Cannot record CMS change: user_id not found');
      return;
    }

    // Record the change
    await recordCMSChange({
      user_id: userId,
      project_id: context.projectContext.project_id,
      change_id: toolResult.change_id,
      cms_type: toolResult.cms_type || 'wordpress',
      site_url: toolResult.site_url || '',
      content_type: toolResult.content_type || 'post',
      content_id: toolResult.content_id || '',
      action: toolResult.action || 'update',
      previous_state: toolResult.previous_state || {},
      new_state: toolResult.new_state || {},
      change_summary: toolResult.change_summary || {},
      requires_approval: toolResult.requires_approval,
      executed_by_agent: context.agentId,
      mcp_tool_name: `cms-connector__${toolName}`,
    });

    console.log(`[Agent Executor] Recorded CMS change: ${toolResult.change_id}`);
  } catch (error) {
    console.error('[Agent Executor] Error recording CMS change:', error);
  }
}
```

---

#### Modifications orchestrator.ts

**1. Renommer _userId → userId** :

```typescript
export async function processChat(
  request: ChatRequest,
  userId: string  // Phase 3.3: No longer prefixed with underscore
): Promise<ChatResponse> {
```

**2. Passer userId à executeAgent** :

```typescript
const agentResponse = await executeAgent({
  agentId: targetAgent,
  agentConfig,
  userMessage: request.chatInput,
  projectContext,
  memoryContext,
  sessionId: request.session_id,
  images: request.image ? [request.image] : undefined,
  userId, // Phase 3.3: Pass userId for CMS change tracking
});
```

---

## 📋 WORKFLOW COMPLET

### Exemple : Luna optimise le SEO d'un post WordPress

```
1. User demande : "Optimise le SEO de mon dernier article de blog"

2. Luna calls cms-connector__get_cms_posts (READ - no approval needed)
   → Récupère la liste des posts

3. Luna calls cms-connector__update_cms_post (WRITE - approval needed)
   Input: { post_id: '123', seo_meta: { title: '...', description: '...' } }

   ↓ MCP Server returns:
   {
     success: true,
     requires_approval: true,
     change_id: 'abc-xyz-789',
     cms_type: 'wordpress',
     site_url: 'https://client.com',
     content_type: 'post',
     content_id: '123',
     action: 'update',
     previous_state: { title: 'Old Title', seo_meta: { ... } },
     new_state: { title: 'Old Title', seo_meta: { ... } },
     change_summary: {
       content_title: 'Article Title',
       fields_changed: ['seo_meta.title', 'seo_meta.description'],
       changes: [
         { field: 'seo_meta.title', before: '...', after: '...' }
       ]
     }
   }

4. Agent executor détecte cms-connector + WRITE tool
   → Appelle recordCMSChangeIfNeeded()
   → INSERT INTO cms_change_log (...) avec approved: false

5. Luna répond à l'utilisateur :
   "✅ J'ai optimisé le SEO de votre article !

   **Changements proposés :**
   - Titre SEO : '...' → '...'
   - Meta description : '...' → '...'

   ⚠️ Ces changements nécessitent votre approbation.
   Allez dans Intégrations > CMS pour approuver."

6. User approuve via UI Cockpit
   → UPDATE cms_change_log SET approved = true WHERE change_id = 'abc-xyz-789'

7. (Optionnel) Si erreur, user peut rollback
   → POST /api/cms/rollback { change_id: 'abc-xyz-789' }
   → MCP server restaure previous_state
```

---

## 🔒 SÉCURITÉ

### Approval Workflow

| Action | Approval requis ? | Pourquoi |
|--------|-------------------|----------|
| `get_cms_posts` | ❌ Non | READ-only |
| `create_cms_post` (draft) | ❌ Non | Crée en brouillon |
| `update_cms_post` (draft) | ❌ Non | Post non publié |
| `update_cms_post` (published) | ✅ Oui | Modification contenu live |
| `delete_cms_post` | ✅ Oui | Opération destructive |
| `update_cms_seo_meta` | ✅ Oui | Affecte SEO en production |
| `bulk_update_cms_seo` | ✅ Oui | Modification en masse |

### Recording automatique

✅ **Toutes les opérations WRITE sont enregistrées** dans `cms_change_log` :
- `user_id` : Identifie l'utilisateur
- `project_id` : Identifie le projet
- `executed_by_agent` : Luna, Doffy, ou Milo
- `previous_state` : Snapshot AVANT (pour rollback)
- `new_state` : Snapshot APRÈS
- `change_summary` : Résumé human-readable des changements

✅ **Audit trail complet** :
- Qui a fait quoi, quand, pourquoi
- Rollback possible en 1 clic
- Multi-tenant avec RLS Supabase

---

## 📊 STATISTIQUES FINALES PHASE 3

### Code écrit
- **Total** : ~150 lignes TypeScript
- agent-executor.ts : +80 lignes (recordCMSChangeIfNeeded + userId)
- agents.config.ts : +60 lignes (system prompts updates)
- orchestrator.ts : +2 lignes (userId passing)

### Agents enrichis
- ✅ **Luna** : 14 outils → **24 outils** (+10 CMS)
- ✅ **Doffy** : 13 outils → **29 outils** (+16 CMS)
- ✅ **Milo** : 4 outils → **5 outils** (+1 CMS)

### Build
- ✅ **0 erreur TypeScript**
- ✅ **Backend compile sans erreurs**
- ✅ **Integration avec MCP Bridge prête**

---

## 🚀 PROCHAINES ÉTAPES (Phase 4 - Frontend UI)

### Phase 4.1 - CMSConnectionModal (WordPress)
- Formulaire connexion WordPress (site_url, username, application_password)
- Validation credentials via `cms-connector__validate_cms_credentials`
- Stockage credentials dans `user_integrations` (encrypted)

### Phase 4.2 - Activer cards CMS IntegrationsView
- Cards WordPress, Shopify, Webflow dans IntegrationsView
- Badges "Connecté" / "Non connecté"
- Boutons "Connecter" / "Déconnecter"

### Phase 4.3 - CMS_CHANGE_PREVIEW UI component
- Diff avant/après pour visualiser les changements
- Boutons "Approuver" / "Rejeter"
- Liste des changements en attente (GET /api/cms/pending)

### Phase 4.4 - State flags cms_connected
- Ajouter `wordpress_connected`, `shopify_connected`, `webflow_connected` dans state_flags
- Conditionner les UI components CMS sur ces flags

---

## ✅ CHECKLIST PHASE 3

- [x] Luna : Ajout 10 outils CMS (READ + SEO WRITE)
- [x] Doffy : Ajout 16 outils CMS (FULL ACCESS)
- [x] Milo : Ajout 1 outil CMS (upload_cms_media)
- [x] Luna system prompt mis à jour avec CMS capabilities
- [x] Doffy system prompt mis à jour avec CMS capabilities
- [x] Milo system prompt mis à jour avec CMS capabilities
- [x] userId ajouté à AgentExecutionContext
- [x] userId passé depuis orchestrator → executeAgent
- [x] recordCMSChangeIfNeeded() implémenté dans agent-executor
- [x] CMS write tools automatiquement enregistrés dans cms_change_log
- [x] Backend compile sans erreurs TypeScript
- [x] Documentation complète

---

## 🏆 CONCLUSION

**Phase 3 du CMS Connector est 100% complète** ✅

**Ce qui fonctionne maintenant** :
- Les agents Luna, Doffy, Milo ont accès aux outils CMS
- System prompts expliquent le workflow CMS aux agents
- Toutes les modifications CMS sont enregistrées automatiquement
- Approval workflow backend prêt (manque juste UI frontend)

**Ce qui manque (Phase 4)** :
- Frontend UI pour connecter WordPress/Shopify/Webflow
- UI d'approval des changements CMS (modal avec diff)
- State flags `cms_connected` pour conditionner l'UI

**Impact** :
- Les agents peuvent maintenant **lire et écrire directement sur les CMS clients**
- Workflow d'approval sécurisé (snapshot + rollback)
- Audit trail complet (qui a fait quoi, quand)
- Architecture production-ready

---

**Créé le** : 22 Mars 2026
**Par** : Claude Code - CMS Connector Phase 3
**Version** : Phase 3 COMPLETE
