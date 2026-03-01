# 🚀 GUIDE D'IMPLÉMENTATION COMPLET - THE HIVE OS V4
## Configuration n8n avec Vision Long Terme

**Date:** 2026-02-27
**Version PRD:** V4.4
**Statut:** Production-Ready Roadmap

---

## 📋 TABLE DES MATIÈRES

1. [Vue d'Ensemble](#1-vue-densemble)
2. [Phase 0: Setup Credentials (15 min)](#phase-0-setup-credentials)
3. [Phase 1: Configuration Agents Brain (30 min)](#phase-1-configuration-agents-brain)
4. [Phase 2: Configuration Tools READ-ONLY (2-4h)](#phase-2-configuration-tools-read-only)
5. [Phase 3: Tests End-to-End (1h)](#phase-3-tests-end-to-end)
6. [Phase 4: Tools WRITE + Quotas (Sprint 2)](#phase-4-tools-write--quotas)
7. [Checklist de Validation](#checklist-de-validation)

---

## 1. VUE D'ENSEMBLE

### Architecture Actuelle vs Cible

```
┌─────────────────────────────────────────────────┐
│          ÉTAT ACTUEL (Images)                   │
├─────────────────────────────────────────────────┤
│ ✅ PM Brain: Configuré (GPT-4o)                 │
│ ❌ PM Brain: Pas de Tools                       │
│ ❌ SORA Brain: System Message vide              │
│ ❌ SORA Tools: Tous MOCK (4/4)                  │
│ ❌ Call Analyst: Query mapping incorrect        │
│ ❌ GTM Manager: Code vide                       │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│          CIBLE PRODUCTION                       │
├─────────────────────────────────────────────────┤
│ ✅ PM Brain: System Prompt COMPLET              │
│ ✅ SORA Brain: System Prompt contextuel         │
│ ✅ SORA Tools: GTM Manager RÉEL (READ-ONLY)     │
│ ✅ Call Analyst: Query + session_id passés      │
│ ⏳ MARCUS/LUNA/MILO: Phase 2                    │
└─────────────────────────────────────────────────┘
```

### Simulation Requête Test

**Webhook Input:**
```json
{
  "action": "task_launch",
  "task_title": "Audit Technique Data Layer",
  "task_description": "Auditer le Data Layer existant...",
  "assignee": "sora",
  "task_phase": "Audit",
  "shared_memory": {
    "project_id": "71b4ffbd-414a-4c70-bef1-4b47c3d38b34",
    "project_name": "Investis10",
    "scope": "analytics",
    "current_phase": "setup"
  }
}
```

**Expected Output:**
```json
{
  "success": true,
  "chat_message": "✅ Audit Data Layer terminé...",
  "ui_components": [{
    "type": "DATA_LAYER_AUDIT_TABLE",
    "data": {
      "variables": [
        {"name": "page_type", "available": false, "recommended": true},
        {"name": "user_id", "available": false, "recommended": true}
      ]
    }
  }],
  "agent_response": {
    "agent_used": "sora",
    "message": "Audit complet avec recommandations..."
  }
}
```

---

## PHASE 0: SETUP CREDENTIALS (15 MIN)

### Étape 0.1: Credentials n8n

Dans **n8n Settings → Credentials**, créer :

#### 1. Supabase API
```
Name: Supabase - The Hive V4
Type: Supabase
Host: vngkmmrglfajyccpbukh.supabase.co
Service Role Key: [VOTRE_SERVICE_ROLE_KEY]
```

#### 2. OpenAI API
```
Name: OpenAI - The Hive
Type: OpenAI
API Key: sk-proj-...
Organization ID: (optionnel)
```

#### 3. Google AI (Gemini)
```
Name: Google AI - Gemini Flash
Type: Google Palm API / Google Gemini
API Key: AIza... (depuis Google AI Studio)
```

### Étape 0.2: Variables d'Environnement

Dans **n8n Settings → Variables** ou fichier `.env` :

```bash
# Supabase
SUPABASE_URL=https://vngkmmrglfajyccpbukh.supabase.co
SUPABASE_ANON_KEY=eyJhbGci... (clé publique)

# n8n Webhooks (remplacer par votre domaine)
ORCHESTRATOR_WEBHOOK_URL=https://n8n.srv1234539.hstgr.cloud/webhook/orchestrator-v5-entry
SORA_WEBHOOK_URL=https://n8n.srv1234539.hstgr.cloud/webhook/sora-v4-finale
MARCUS_WEBHOOK_URL=https://n8n.srv1234539.hstgr.cloud/webhook/marcus-v4-finale
LUNA_WEBHOOK_URL=https://n8n.srv1234539.hstgr.cloud/webhook/luna-strategist-final
MILO_WEBHOOK_URL=https://n8n.srv1234539.hstgr.cloud/webhook/milo-creative-final

# Google Cloud (pour MILO)
GOOGLE_API_KEY=AIza...
GOOGLE_PROJECT_ID=the-hive-os-v4

# ElevenLabs (pour MILO)
ELEVENLABS_API_KEY=...
```

### ✅ Validation Phase 0

Test dans n8n :
```bash
# Dans un noeud Code, executer:
const supabaseUrl = $env.SUPABASE_URL;
const openaiKey = $credentials.openAiApi?.apiKey;

if (!supabaseUrl) throw new Error('SUPABASE_URL manquante');
if (!openaiKey) throw new Error('OpenAI credential manquante');

return { success: true, supabaseUrl, openaiKey: '***' };
```

---

## PHASE 1: CONFIGURATION AGENTS BRAIN (30 MIN)

### 1.1 PM AI Brain (pm-core-v4.4-validated.workflow.json)

**Localisation:** Nœud "PM AI Brain" → Parameters

#### System Message

```markdown
Tu es le PM (Project Manager) de THE HIVE OS V4, un ERP marketing autonome.

## CONTEXTE
Tu coordonnes 4 agents IA spécialisés:
- **SORA** (Analyst): Audit, Analytics, Tracking, Performance
- **LUNA** (Strategist): Stratégie, SEO, Content, Planning
- **MARCUS** (Trader): Campagnes publicitaires, Budget, Scaling
- **MILO** (Creative): Créatifs, Vidéos, Assets visuels/audio

## MÉMOIRE COLLECTIVE
Tu as accès à l'historique complet du projet via `{{$json.memory_context}}`:
- previous_work: Travaux déjà réalisés
- validated_elements: Décisions validées
- recommendations_for_current_task: Conseils des agents

## TÂ CHE
Analyser la requête utilisateur et **déléguer à l'agent approprié**.

### Règles de délégation:
1. **SORA** si: audit, analyse, tracking, KPIs, dashboards, pixel, GTM
2. **LUNA** si: stratégie, SEO, keywords, content plan, competitor analysis
3. **MARCUS** si: lancer campagne, ajuster budget, scaling, bid optimization
4. **MILO** si: créer créatifs, générer images/vidéos, assets publicitaires

### OUTPUT REQUIS (JSON strict):
```json
{
  "selected_agent": "sora|luna|marcus|milo",
  "routing_reason": "Explication en 1 phrase",
  "context_for_agent": {
    "priority": "high|medium|low",
    "expected_deliverables": ["liste"],
    "memory_highlights": "Points clés de la mémoire à utiliser"
  }
}
```

## IMPORTANT
- Si plusieurs agents possibles, privilégier celui mentionné dans task.assignee
- Toujours inclure memory_highlights pour continuité
- Ne jamais exécuter de tâche toi-même, DÉLÉGUER
```

#### Chat Model

```
Model: gpt-4o
Temperature: 0.3
Max Tokens: 2000
```

#### Prompt (User Message)

```javascript
{{ $json.chatInput }}

### MÉMOIRE COLLECTIVE:
{{ JSON.stringify($json.memory_context, null, 2) }}

### TÂCHE ACTUELLE:
- Titre: {{ $json.task_title }}
- Phase: {{ $json.task_phase }}
- Agent assigné: {{ $json.active_agent_id }}
```

---

### 1.2 ORCHESTRATOR AI Agent Router

**Localisation:** Nœud "AI Agent Router" → Parameters

#### System Message

```markdown
Tu es l'ORCHESTRATOR de THE HIVE OS V4.

## RÔLE
Router les requêtes vers les agents spécialisés en fonction du contexte.

## AGENTS DISPONIBLES
- **call_analyst** (SORA): Analytics, Tracking, Audit technique
- **call_strategist** (LUNA): Stratégie marketing, SEO, Planning
- **call_creative** (MILO): Génération assets visuels/audio
- **call_trader** (MARCUS): Gestion campagnes publicitaires

## TOOLS À UTILISER
Appelle EXACTEMENT UN tool en fonction de la requête.

### Exemples:
- "Auditer le Data Layer" → **call_analyst**
- "Créer une stratégie de contenu" → **call_strategist**
- "Générer 5 visuels pour Meta Ads" → **call_creative**
- "Lancer une campagne Google Ads" → **call_trader**

## BRAND MEMORY PROJET
{{ $json.brand_memory }}

## IMPORTANT
- Appelle UN SEUL tool par requête
- Passe TOUS les paramètres nécessaires (query, session_id)
- Si incertain, privilégier call_analyst pour analyses
```

#### Chat Model

```
Model: gpt-4o
Temperature: 0.3
Max Tokens: 1500
```

---

### 1.3 SORA AI Agent (FINALE_SORA_MCP.workflow.json)

**Localisation:** Nœud "SORA AI Agent" → Parameters

#### System Message (DYNAMIQUE - injecté par "Prepare SORA Context")

Le system prompt est construit dynamiquement. **Modifier le nœud Code "Prepare SORA Context"** :

```javascript
const SORA_SYSTEM_PROMPT = `Tu es SORA, l'Analyst de THE HIVE OS V4.

## IDENTITÉ
Expert en Analytics, Tracking, Audit technique, Performance Marketing.

## TOOLS DISPONIBLES (28 fonctions)

### Google Ads Manager (READ-ONLY)
1. get_accounts() - Liste comptes Google Ads
2. get_campaigns(account_id) - Campagnes actives
3. get_search_terms(campaign_id) - Termes de recherche
4. get_keywords_quality_score(ad_group_id) - Quality Score mots-clés
5. get_conversions(account_id, date_range) - Données conversions
6. create_audience(account_id, audience_data) - Créer audience remarketing
7. get_performance_report(account_id, metrics, date_range) - Rapport perf

### Meta Ads Manager (READ-ONLY)
8. get_ad_accounts() - Liste comptes Meta
9. get_campaigns(ad_account_id) - Campagnes actives
10. get_insights(campaign_id, metrics, date_range) - Insights détaillés
11. get_ad_sets(campaign_id) - Ad Sets avec statut
12. check_learning_phase(ad_set_id) - Statut Learning Phase
13. get_pixel_events(pixel_id, date_range) - Événements Pixel
14. get_audience_overlap(audience_ids) - Chevauchement audiences

### GTM Manager
15. list_containers(account_id) - Liste conteneurs GTM
16. list_tags(container_id) - Tags existants
17. create_tag(container_id, tag_data) - Créer nouveau tag
18. create_trigger(container_id, trigger_data) - Créer déclencheur
19. create_variable(container_id, variable_data) - Créer variable
20. publish_version(container_id) - Publier version
21. preview_mode(container_id) - Activer mode preview

### Looker Manager
22. create_report(data_source, config) - Créer rapport Looker
23. add_scorecard(report_id, metric, title) - Ajouter scorecard
24. add_time_series_chart(report_id, metric, dimension) - Graphique temps
25. add_table(report_id, dimensions, metrics) - Tableau données
26. blend_data_sources(sources, join_keys) - Combiner sources
27. schedule_email(report_id, emails, frequency) - Planifier envoi
28. get_report_url(report_id) - URL public du rapport

## TÂCHE ACTUELLE
${$json.task_title || 'Non spécifié'}

### Description
${$json.task_description || 'Non fournie'}

### Phase: ${$json.task_phase || 'Non définie'}

## PROJET CONTEXT
${JSON.stringify($json.sharedMemory, null, 2)}

## WRITE-BACK COMMANDS (OBLIGATOIRES)

À la fin de ton analyse, tu DOIS inclure:

\`\`\`json
{
  "MEMORY_WRITE": {
    "action": "NOM_ACTION_UPPERCASE",
    "summary": "Résumé de ton travail",
    "key_findings": ["Finding 1", "Finding 2"],
    "deliverables": ["URL Excel", "URL Dashboard"],
    "recommendations": ["Pour MARCUS: ...", "Pour MILO: ..."]
  },
  "UPDATE_TASK_STATUS": {
    "status": "in_progress|done",
    "progress_percentage": 25
  },
  "UI_COMPONENT": {
    "type": "DATA_LAYER_AUDIT|PERFORMANCE_REPORT|...",
    "data": {...}
  }
}
\`\`\`

## IMPORTANT
- Utilise les TOOLS pour analyses réelles
- Documente TOUT dans MEMORY_WRITE
- Recommandations pour autres agents si nécessaire
- Format markdown structuré pour réponse
`;

return [{
  json: {
    ...context,
    system_prompt: SORA_SYSTEM_PROMPT,
    chatInput: $json.query || $json.user_input || $json.chatInput
  }
}];
```

#### Chat Model

```
Model: gemini-2.0-flash-exp
Temperature: 0.2
Max Tokens: 4000
```

#### Require Specific Output Format

```
OFF (désactivé)
```

---

## PHASE 2: CONFIGURATION TOOLS READ-ONLY (2-4H)

### 2.1 Tool: Call Analyst (Orchestrator)

**Localisation:** Orchestrator → Tool "call_analyst"

#### Configuration

```
Type: toolWorkflow
Workflow: FINALE SORA MCP - THE HIVE OS V4 (par nom ou ID)
Field to Return: analyst_response
```

#### Extra Workflow Inputs

```json
{
  "query": "={{ $fromAI('query') }}",
  "session_id": "={{ $json.session_id || $('Load Global Context').item.json.session_id }}",
  "shared_memory": "={{ $json.shared_memory || {} }}",
  "task_context": "={{ $json.task_context || {} }}"
}
```

### 2.2 Tool: GTM Manager (SORA)

**Localisation:** SORA → Tool "gtm_manager"

#### Configuration RÉELLE (Remplace le MOCK)

```javascript
const GTM_BASE_URL = 'https://tagmanager.googleapis.com/tagmanager/v2';

// Récupérer le token OAuth (à configurer dans Credentials)
const GOOGLE_OAUTH_TOKEN = $credentials.googleOAuth2Api?.oauthTokenData?.access_token;

if (!GOOGLE_OAUTH_TOKEN) {
  throw new Error('Google OAuth2 credentials manquantes');
}

// Parse la fonction demandée
const functionName = $fromAI('function');
const params = $fromAI('params') || {};

async function callGTMAPI(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${GOOGLE_OAUTH_TOKEN}`,
      'Content-Type': 'application/json'
    }
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${GTM_BASE_URL}${endpoint}`, options);

  if (!response.ok) {
    throw new Error(`GTM API Error: ${response.statusText}`);
  }

  return await response.json();
}

// Router selon la fonction
switch (functionName) {
  case 'list_containers':
    const accountId = params.account_id || 'accounts/YOUR_DEFAULT_ACCOUNT_ID';
    const containers = await callGTMAPI(`/${accountId}/containers`);
    return { containers: containers.container || [] };

  case 'list_tags':
    const containerId = params.container_id;
    if (!containerId) throw new Error('container_id required');
    const tags = await callGTMAPI(`/${containerId}/workspaces/1/tags`);
    return { tags: tags.tag || [] };

  case 'preview_mode':
    const containerIdPreview = params.container_id;
    if (!containerIdPreview) throw new Error('container_id required');
    // Mode preview retourne juste l'URL Tag Assistant
    return {
      preview_url: `https://tagassistant.google.com/#/?container_id=${containerIdPreview}`,
      message: 'Ouvrir cette URL dans le navigateur pour tester'
    };

  case 'create_tag':
    // WRITE operation - Phase 2 only
    throw new Error('create_tag disponible en Phase 2 (WRITE ops)');

  default:
    return {
      error: `Function ${functionName} non implémentée`,
      available_functions: ['list_containers', 'list_tags', 'preview_mode']
    };
}
```

#### Description du Tool (pour l'AI)

```
GTM Manager - 7 functions to setup Google Tag Manager tracking. Includes list_containers, list_tags, create_tag, create_trigger, create_variable, publish_version, preview_mode.

Usage:
- list_containers(account_id) - List GTM containers
- list_tags(container_id) - List tags in container
- preview_mode(container_id) - Generate preview URL
```

#### Input Schema

```json
{
  "function": {
    "type": "string",
    "description": "Function name: list_containers, list_tags, preview_mode",
    "required": true
  },
  "params": {
    "type": "object",
    "description": "Function parameters as JSON object"
  }
}
```

---

### 2.3 Tool: Google Ads Manager (SORA) - READ ONLY

**Configuration Similaire à GTM**

```javascript
const GOOGLE_ADS_API_VERSION = 'v17';
const GOOGLE_ADS_BASE_URL = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}`;

// OAuth token
const GOOGLE_OAUTH_TOKEN = $credentials.googleOAuth2Api?.oauthTokenData?.access_token;

if (!GOOGLE_OAUTH_TOKEN) {
  throw new Error('Google OAuth2 credentials manquantes');
}

const functionName = $fromAI('function');
const params = $fromAI('params') || {};

async function callGoogleAdsAPI(customerId, query) {
  const response = await fetch(
    `${GOOGLE_ADS_BASE_URL}/customers/${customerId}/googleAds:searchStream`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GOOGLE_OAUTH_TOKEN}`,
        'Content-Type': 'application/json',
        'developer-token': $env.GOOGLE_ADS_DEVELOPER_TOKEN
      },
      body: JSON.stringify({ query })
    }
  );

  if (!response.ok) {
    throw new Error(`Google Ads API Error: ${response.statusText}`);
  }

  return await response.json();
}

switch (functionName) {
  case 'get_campaigns':
    const customerId = params.customer_id || params.account_id;
    const query = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros
      FROM campaign
      WHERE campaign.status = 'ENABLED'
      ORDER BY metrics.impressions DESC
      LIMIT 100
    `;
    const campaigns = await callGoogleAdsAPI(customerId, query);
    return { campaigns };

  case 'get_performance_report':
    const customerIdReport = params.customer_id;
    const metrics = params.metrics || ['impressions', 'clicks', 'cost_micros', 'conversions'];
    const dateRange = params.date_range || 'LAST_30_DAYS';

    const reportQuery = `
      SELECT
        campaign.name,
        segments.date,
        ${metrics.map(m => `metrics.${m}`).join(', ')}
      FROM campaign
      WHERE segments.date DURING ${dateRange}
    `;

    const report = await callGoogleAdsAPI(customerIdReport, reportQuery);
    return { report };

  default:
    return {
      error: `Function ${functionName} non implémentée`,
      available_functions: ['get_campaigns', 'get_performance_report', 'get_search_terms']
    };
}
```

---

### 2.4 Tool: Meta Ads Manager (SORA) - READ ONLY

```javascript
const META_API_VERSION = 'v19.0';
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

// Access token from credentials
const META_ACCESS_TOKEN = $credentials.metaApi?.accessToken;

if (!META_ACCESS_TOKEN) {
  throw new Error('Meta API credentials manquantes');
}

const functionName = $fromAI('function');
const params = $fromAI('params') || {};

async function callMetaAPI(endpoint, queryParams = {}) {
  const url = new URL(`${META_BASE_URL}${endpoint}`);
  url.searchParams.set('access_token', META_ACCESS_TOKEN);

  Object.entries(queryParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url.toString());

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Meta API Error: ${error.error.message}`);
  }

  return await response.json();
}

switch (functionName) {
  case 'get_ad_accounts':
    const meAccounts = await callMetaAPI('/me/adaccounts', {
      fields: 'id,name,account_status,currency,timezone_name'
    });
    return { ad_accounts: meAccounts.data || [] };

  case 'get_campaigns':
    const adAccountId = params.ad_account_id;
    if (!adAccountId) throw new Error('ad_account_id required');

    const campaigns = await callMetaAPI(`/${adAccountId}/campaigns`, {
      fields: 'id,name,status,objective,daily_budget,lifetime_budget',
      limit: 100
    });
    return { campaigns: campaigns.data || [] };

  case 'get_insights':
    const campaignId = params.campaign_id;
    const metricsParam = params.metrics || ['impressions', 'clicks', 'spend', 'conversions'];
    const dateRangeParam = params.date_range || { since: '2024-01-01', until: '2024-12-31' };

    const insights = await callMetaAPI(`/${campaignId}/insights`, {
      fields: metricsParam.join(','),
      date_preset: 'last_30d'
    });
    return { insights: insights.data || [] };

  case 'check_learning_phase':
    const adSetId = params.ad_set_id;
    if (!adSetId) throw new Error('ad_set_id required');

    const adSet = await callMetaAPI(`/${adSetId}`, {
      fields: 'id,name,status,optimization_goal,configured_status,effective_status,is_dynamic_creative'
    });

    // Approximation learning phase (API ne l'expose pas directement)
    const insights_adset = await callMetaAPI(`/${adSetId}/insights`, {
      fields: 'spend,actions',
      date_preset: 'last_7d'
    });

    const isLearningPhase = insights_adset.data?.[0]?.actions?.[0]?.value < 50; // <50 conversions = learning

    return {
      ad_set: adSet,
      is_learning_phase: isLearningPhase,
      message: isLearningPhase ? 'Ad Set en Learning Phase - Ne pas modifier budget!' : 'Ad Set hors Learning Phase'
    };

  default:
    return {
      error: `Function ${functionName} non implémentée`,
      available_functions: ['get_ad_accounts', 'get_campaigns', 'get_insights', 'check_learning_phase']
    };
}
```

---

## PHASE 3: TESTS END-TO-END (1H)

### Test 1: PM-CORE Routing

#### Requête Test
```bash
curl -X POST https://n8n.srv1234539.hstgr.cloud/webhook/pm-v4-entry \
  -H "Content-Type: application/json" \
  -d '{
    "action": "task_launch",
    "task_id": "test-001",
    "task_title": "Audit Technique Data Layer",
    "task_description": "Auditer le Data Layer existant pour Investis10",
    "assignee": "sora",
    "task_phase": "Audit",
    "shared_memory": {
      "project_id": "71b4ffbd-414a-4c70-bef1-4b47c3d38b34",
      "project_name": "Investis10",
      "scope": "analytics",
      "current_phase": "setup"
    }
  }'
```

#### Validation Attendue
```json
{
  "success": true,
  "chat_message": "PM a délégué à SORA...",
  "agent_response": {
    "agent_used": "sora",
    "message": "Audit Data Layer en cours..."
  }
}
```

#### Checklist
- [ ] PM Brain retourne `selected_agent: "sora"`
- [ ] Call Orchestrator exécuté sans erreur
- [ ] Orchestrator route vers SORA
- [ ] SORA reçoit task_context complet
- [ ] SORA utilise gtm_manager.list_containers

---

### Test 2: SORA GTM Manager Tool

#### Setup Test
Dans SORA workflow, créer un nœud "Manual Trigger" temporaire pour tester le tool isolément.

#### Input Test
```json
{
  "query": "Liste-moi les conteneurs GTM disponibles",
  "task_title": "Test GTM",
  "task_description": "Test call GTM API",
  "sharedMemory": {
    "project_id": "test"
  }
}
```

#### Validation
- [ ] Tool appelle Google Tag Manager API
- [ ] Retourne liste de conteneurs (ou erreur si aucun compte configuré)
- [ ] SORA AI Agent utilise le résultat dans sa réponse
- [ ] Pas de timeout (< 30s)

---

### Test 3: MEMORY_WRITE Execution

#### Vérification Supabase

Après l'exécution du Test 1, vérifier dans Supabase :

```sql
SELECT * FROM project_memory
WHERE project_id = '71b4ffbd-414a-4c70-bef1-4b47c3d38b34'
ORDER BY created_at DESC
LIMIT 1;
```

#### Validation
- [ ] Record créé dans `project_memory`
- [ ] `action` = "DATA_LAYER_AUDITED" ou similaire
- [ ] `summary` non vide
- [ ] `key_findings` array avec >= 1 élément
- [ ] `recommendations` array non vide

---

### Test 4: UI_COMPONENT Rendering

#### Frontend Cockpit

Dans `ChatMessage.tsx` ou `UIComponentRenderer.tsx`, vérifier que le component UI est affiché :

```typescript
// Vérifier dans la console du navigateur
console.log('UI Components reçus:', message.ui_components);
```

#### Validation
- [ ] `ui_components` array présent dans réponse
- [ ] Type component = "DATA_LAYER_AUDIT" ou similaire
- [ ] `data` object structuré
- [ ] Frontend rend le component (même si visuel basique)

---

## PHASE 4: TOOLS WRITE + QUOTAS (SPRINT 2)

### 4.1 MARCUS Tools (WRITE Operations)

#### Tool: Meta Campaign Launcher

**Implémentation complète avec safeguards:**

```javascript
const META_API_VERSION = 'v19.0';
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;
const META_ACCESS_TOKEN = $credentials.metaApi?.accessToken;

const functionName = $fromAI('function');
const params = $fromAI('params') || {};

async function callMetaAPI(endpoint, method = 'POST', body = {}) {
  const url = `${META_BASE_URL}${endpoint}?access_token=${META_ACCESS_TOKEN}`;

  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };

  if (method !== 'GET' && Object.keys(body).length > 0) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Meta API Error: ${error.error.message}`);
  }

  return await response.json();
}

switch (functionName) {
  case 'create_meta_campaign':
    const adAccountId = params.ad_account_id;
    const campaignName = params.name;
    const objective = params.objective || 'OUTCOME_TRAFFIC';
    const dailyBudget = params.daily_budget; // en centimes

    // SAFEGUARD: Vérifier budget max sans approbation
    if (dailyBudget > 50000) { // >500EUR/jour
      return {
        error: 'APPROVAL_REQUIRED',
        message: `Budget ${dailyBudget/100}EUR/jour dépasse limite de 500EUR. Approbation manuelle requise.`,
        approval_url: `https://thehive.com/approvals/campaign-${Date.now()}`
      };
    }

    const campaign = await callMetaAPI(`/${adAccountId}/campaigns`, 'POST', {
      name: campaignName,
      objective: objective,
      status: 'PAUSED', // Toujours créer en PAUSED pour review
      special_ad_categories: [],
      daily_budget: dailyBudget
    });

    // Enregistrer dans Supabase
    await $supabase.from('campaign_tracking').insert({
      campaign_id: campaign.id,
      project_id: $json.project_id,
      platform: 'meta',
      status: 'created',
      created_by: 'marcus'
    });

    return {
      success: true,
      campaign_id: campaign.id,
      message: `Campagne créée en mode PAUSED. Review avant activation.`,
      next_steps: ['Créer Ad Sets', 'Créer Ads', 'Activer campagne']
    };

  case 'scale_meta_ad_set':
    const adSetId = params.ad_set_id;
    const currentBudget = params.current_budget;
    const newBudget = params.new_budget;

    // SAFEGUARD: Learning Phase Protection
    const insights = await callMetaAPI(`/${adSetId}/insights`, 'GET');
    const conversions = insights.data?.[0]?.actions?.find(a => a.action_type === 'purchase')?.value || 0;

    if (conversions < 50) {
      return {
        error: 'LEARNING_PHASE_ACTIVE',
        message: 'Ad Set en Learning Phase. Ne pas modifier budget avant 50 conversions.',
        current_conversions: conversions,
        conversions_needed: 50 - conversions
      };
    }

    // SAFEGUARD: Budget max +20% par jour
    const maxAllowedBudget = currentBudget * 1.2;
    if (newBudget > maxAllowedBudget) {
      return {
        error: 'BUDGET_INCREASE_TOO_HIGH',
        message: `Augmentation max autorisée: +20% (${maxAllowedBudget/100}EUR). Demandé: ${newBudget/100}EUR.`,
        max_allowed: maxAllowedBudget
      };
    }

    await callMetaAPI(`/${adSetId}`, 'POST', {
      daily_budget: newBudget
    });

    return {
      success: true,
      message: `Budget augmenté de ${currentBudget/100}EUR à ${newBudget/100}EUR (+${((newBudget/currentBudget - 1) * 100).toFixed(1)}%)`,
      new_budget: newBudget
    };

  default:
    return { error: 'Function non implémentée' };
}
```

---

### 4.2 MILO Quota Tracking

**Déjà implémenté** dans le workflow. Vérifier que les RPC Functions Supabase existent :

```sql
-- Vérifier existence
SELECT routine_name
FROM information_schema.routines
WHERE routine_name IN ('check_quota_before_operation', 'record_api_usage');
```

Si manquantes, créer :

```sql
CREATE OR REPLACE FUNCTION check_quota_before_operation(
  p_operation TEXT,
  p_credits_required INT
)
RETURNS TABLE(
  allowed BOOLEAN,
  error_message TEXT,
  error_code TEXT,
  credits_remaining INT,
  usage_percent NUMERIC
) AS $$
DECLARE
  v_quota_limit INT := 1000; -- Default limit
  v_current_usage INT;
BEGIN
  -- Calculer usage courant du mois
  SELECT COALESCE(SUM(credits_consumed), 0) INTO v_current_usage
  FROM api_usage_tracking
  WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW());

  -- Vérifier si quota suffisant
  IF (v_current_usage + p_credits_required) > v_quota_limit THEN
    RETURN QUERY SELECT
      FALSE,
      'Quota mensuel dépassé. Upgrade vers plan supérieur.',
      'QUOTA_EXCEEDED',
      v_quota_limit - v_current_usage,
      ((v_current_usage::NUMERIC / v_quota_limit) * 100)::NUMERIC;
  ELSE
    RETURN QUERY SELECT
      TRUE,
      NULL::TEXT,
      NULL::TEXT,
      v_quota_limit - v_current_usage - p_credits_required,
      (((v_current_usage + p_credits_required)::NUMERIC / v_quota_limit) * 100)::NUMERIC;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION record_api_usage(
  p_project_id UUID,
  p_task_id UUID,
  p_agent_id TEXT,
  p_operation TEXT,
  p_provider TEXT,
  p_model TEXT,
  p_credits_consumed INT,
  p_cost_usd NUMERIC,
  p_request_params JSONB,
  p_response_metadata JSONB,
  p_status TEXT,
  p_error_message TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO api_usage_tracking (
    project_id, task_id, agent_id, operation, provider, model,
    credits_consumed, cost_usd, request_params, response_metadata,
    status, error_message
  ) VALUES (
    p_project_id, p_task_id, p_agent_id, p_operation, p_provider, p_model,
    p_credits_consumed, p_cost_usd, p_request_params, p_response_metadata,
    p_status, p_error_message
  );
END;
$$ LANGUAGE plpgsql;
```

---

## CHECKLIST DE VALIDATION

### ✅ Phase 0: Infrastructure
- [ ] Credentials Supabase configurées
- [ ] Credentials OpenAI configurées
- [ ] Credentials Google AI configurées
- [ ] Variables env définies (SUPABASE_URL, ORCHESTRATOR_WEBHOOK_URL, etc.)

### ✅ Phase 1: Agents Brain
- [ ] PM AI Brain: System Message complet
- [ ] PM AI Brain: Prompt avec memory_context
- [ ] Orchestrator: System Message avec routing rules
- [ ] SORA: System Prompt injecté dynamiquement
- [ ] SORA: Tous les 28 tools documentés

### ✅ Phase 2: Tools READ-ONLY
- [ ] call_analyst: Workflow ID correct
- [ ] call_analyst: Extra inputs (query, session_id)
- [ ] gtm_manager: API réelle implémentée
- [ ] gtm_manager: Functions list_containers, list_tags working
- [ ] google_ads_manager: API réelle implémentée
- [ ] meta_ads_manager: API réelle implémentée

### ✅ Phase 3: Tests
- [ ] Test PM routing → SORA OK
- [ ] Test SORA GTM tool → Retour API OK
- [ ] Test MEMORY_WRITE → Record Supabase créé
- [ ] Test UI_COMPONENT → Frontend reçoit data

### ⏳ Phase 4: WRITE Ops (Sprint 2)
- [ ] MARCUS: create_meta_campaign avec safeguards
- [ ] MARCUS: scale_meta_ad_set avec Learning Phase check
- [ ] MARCUS: Budget approval workflow si >500EUR
- [ ] MILO: Quota tracking RPC functions
- [ ] MILO: record_api_usage après chaque génération

---

## 🚀 ORDRE D'EXÉCUTION RECOMMANDÉ

### Jour 1 (2h)
1. Phase 0: Setup Credentials (15 min)
2. Phase 1: PM AI Brain + Orchestrator (30 min)
3. Phase 1: SORA Brain (30 min)
4. Test 1: PM Routing (30 min)

### Jour 2 (3h)
5. Phase 2: GTM Manager Tool (1h30)
6. Phase 2: Google Ads Manager (1h)
7. Test 2 + Test 3: Tools + Memory (30 min)

### Jour 3 (2h)
8. Phase 2: Meta Ads Manager (1h)
9. Test 4: UI Components (30 min)
10. Tests end-to-end complets (30 min)

### Sprint 2 (1 semaine)
11. Phase 4: MARCUS Tools WRITE
12. Phase 4: LUNA + MILO Tools
13. Phase 4: Quota System complet
14. Tests de charge + monitoring

---

## 📞 SUPPORT & RESSOURCES

### Documentation APIs
- **GTM API:** https://developers.google.com/tag-platform/tag-manager/api/v2
- **Google Ads API:** https://developers.google.com/google-ads/api/docs
- **Meta Marketing API:** https://developers.facebook.com/docs/marketing-apis

### Debugging
```bash
# Logs n8n
docker logs n8n-container -f --tail 100

# Test Supabase connection
curl https://vngkmmrglfajyccpbukh.supabase.co/rest/v1/project_memory \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

---

**FIN DU GUIDE D'IMPLÉMENTATION**

Prochaine étape: Configurer Phase 0 dans n8n puis exécuter Test 1.
