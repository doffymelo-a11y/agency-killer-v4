# MCP SERVERS - SORA (Analyst) & MILO (Creative)

Ce dossier contient les MCP (Model Context Protocol) servers pour les agents SORA et MILO.

## 📁 Structure

```
mcp_servers/
├── gtm-manager.js           # Google Tag Manager API
├── google-ads-manager.js    # Google Ads API (Read-only)
├── meta-ads-manager.js      # Meta Ads API (Read-only)
├── looker-manager.js        # Looker Studio API
└── README.md                # Ce fichier
```

## 🎯 Agents et Tools

### SORA (Analyst) - 4 MCP Tools
1. **GTM Manager** - Gère Google Tag Manager
2. **Google Ads Manager** - Analyse Google Ads (lecture seule)
3. **Meta Ads Manager** - Analyse Meta Ads (lecture seule)
4. **Looker Manager** - Crée dashboards Looker Studio

### MILO (Creative) - 3 MCP Tools
1. **Nano Banana Pro** - Génération d'images 4K (Gemini 3 Pro)
2. **Veo-3** - Génération de vidéos (Google Veo-3)
3. **ElevenLabs** - Génération de voix/audio

## 🔧 Déploiement dans n8n

### Option A: Code Inline (Recommandé pour n8n)

Les workflows SORA et MILO utilisent des **toolCode** nodes avec le code MCP intégré directement.

**Avantages:**
- ✅ Pas de dépendances externes
- ✅ Fonctionne dans le sandbox n8n
- ✅ Facile à déployer

**Fichiers:**
- `/agents/CURRENT_analyst-mcp/analyst-core-v4.5-with-tools.workflow.json` - SORA avec MCP inline
- `/agents/CURRENT_milo-creative/milo-creative-v4-with-toolcode.workflow.json` - MILO avec MCP inline

### Option B: Modules Node.js (Pour usage externe)

Si vous souhaitez utiliser les MCP servers en dehors de n8n (ex: API Node.js, CLI):

```bash
cd /Users/azzedinezazai/Documents/Agency-Killer-V4/agents/CURRENT_analyst-mcp/mcp_servers
```

```javascript
// Exemple d'utilisation
const { gtm_manager } = require('./gtm-manager');

const result = await gtm_manager({
  function_name: 'list_containers',
  parameters: {
    account_id: 'accounts/123456'
  },
  credentials: {
    access_token: 'ya29.xxxxx'
  }
});

console.log(result);
```

## 📋 Configuration Requise

### 1. Google OAuth2

Pour GTM, Google Ads, Looker:

**Scopes requis:**
```
https://www.googleapis.com/auth/tagmanager.edit.containers
https://www.googleapis.com/auth/adwords
https://www.googleapis.com/auth/datastudio
```

**Variables d'environnement:**
```bash
GOOGLE_ACCESS_TOKEN=ya29.xxxxx
GOOGLE_DEVELOPER_TOKEN=xxxxx  # Pour Google Ads uniquement
```

### 2. Meta Ads OAuth2

**Permissions requises:**
- `ads_read`
- `ads_management` (pour audiences uniquement)
- `business_management`

**Variables d'environnement:**
```bash
META_ACCESS_TOKEN=EAAxxxxx
META_APP_ID=123456789
META_APP_SECRET=xxxxx
```

### 3. ElevenLabs API

**Variables d'environnement:**
```bash
ELEVENLABS_API_KEY=sk_xxxxx
```

### 4. Google Gemini (pour Nano Banana Pro & Veo-3)

**Variables d'environnement:**
```bash
GOOGLE_API_KEY=AIzaSyxxxxx
```

## 🚀 Utilisation dans n8n

### Étape 1: Importer les Workflows

1. Aller sur n8n: `https://your-n8n-instance.com`
2. Cliquer sur "Import workflow"
3. Sélectionner:
   - `analyst-core-v4.5-with-tools.workflow.json` (SORA)
   - `milo-creative-v4-with-toolcode.workflow.json` (MILO)

### Étape 2: Configurer les Credentials

**Dans n8n:**
1. Settings > Credentials
2. Ajouter:
   - **Google OAuth2** (pour GTM, Google Ads, Looker)
   - **Meta OAuth2** (pour Meta Ads)
   - **ElevenLabs API** (Header Auth avec `xi-api-key`)
   - **Google Gemini OAuth2** (pour Nano Banana Pro, Veo-3)

### Étape 3: Tester les Tools

**Test GTM Manager:**
```json
{
  "function_name": "list_containers",
  "parameters": {
    "account_id": "accounts/123456"
  },
  "credentials": {
    "access_token": "{{ $credentials.googleOAuth2.access_token }}"
  }
}
```

**Test Google Ads Manager:**
```json
{
  "function_name": "get_campaigns",
  "parameters": {
    "customer_id": "1234567890",
    "date_range": "LAST_7_DAYS"
  },
  "credentials": {
    "access_token": "{{ $credentials.googleOAuth2.access_token }}",
    "developer_token": "{{ $env.GOOGLE_DEVELOPER_TOKEN }}",
    "login_customer_id": "1234567890"
  }
}
```

**Test Meta Ads Manager:**
```json
{
  "function_name": "get_campaigns",
  "parameters": {
    "ad_account_id": "act_123456789",
    "date_range": { "since": "2026-02-03", "until": "2026-02-10" }
  },
  "credentials": {
    "access_token": "{{ $credentials.metaOAuth2.access_token }}"
  }
}
```

**Test Nano Banana Pro (Milo):**
```json
{
  "prompt": "Professional product photo of a smartphone, marble surface, soft lighting",
  "resolution": "4096x4096",
  "style": "professional_photo",
  "quality": "professional"
}
```

## 📚 Documentation API

### GTM Manager

**Fonctions disponibles:**
- `list_containers(account_id)`
- `list_tags(container_id)`
- `create_tag(container_id, tag_config)`
- `create_trigger(container_id, trigger_config)`
- `create_variable(container_id, variable_config)`
- `publish_version(container_id, version_name)`
- `preview_mode(container_id)`

### Google Ads Manager

**Fonctions disponibles:**
- `get_accounts()`
- `get_campaigns(customer_id, date_range)`
- `get_search_terms(customer_id, campaign_id, date_range)`
- `get_keywords_quality_score(customer_id, ad_group_id)`
- `get_conversions(customer_id)`
- `create_audience(customer_id, audience_config)`
- `get_performance_report(customer_id, metrics, dimensions, date_range)`

### Meta Ads Manager

**Fonctions disponibles:**
- `get_ad_accounts(user_id)`
- `get_campaigns(ad_account_id, date_range)`
- `get_insights(object_id, object_type, metrics, date_range, breakdown)`
- `get_ad_sets(campaign_id, include_insights)`
- `check_learning_phase(ad_set_id)` ⭐
- `get_pixel_events(pixel_id, date_range)`
- `get_audience_overlap(ad_account_id, audience_ids)`

### Looker Manager

**Fonctions disponibles:**
- `create_report(report_name, data_sources)`
- `add_scorecard(report_id, config)`
- `add_time_series_chart(report_id, config)`
- `add_table(report_id, config)`
- `blend_data_sources(report_id, blend_config)`
- `schedule_email(report_id, recipients, frequency)`
- `get_report_url(report_id)`

## 🔍 Debugging

### Activer les logs

Dans n8n, ajouter un node "Code" après le toolCode:

```javascript
console.log('MCP Response:', $input.item.json);
return [$input.item.json];
```

### Erreurs courantes

**Error: "Access token manquant"**
→ Vérifier que les credentials sont bien configurés dans n8n

**Error: "GTM API Error: 403"**
→ Vérifier les scopes OAuth2 (tagmanager.edit.containers)

**Error: "Google Ads API Error: 401"**
→ Vérifier le Developer Token et login_customer_id

**Error: "Meta API Error: 190"**
→ Token expiré, rafraîchir les credentials Meta OAuth2

## 🎨 Workflow Milo - MCP Tools

Les 3 tools de Milo utilisent des APIs différentes:

1. **Nano Banana Pro**: Google Gemini API (Imagen 3)
2. **Veo-3**: Google Veo-3 API
3. **ElevenLabs**: ElevenLabs API v1

**Note:** Ces APIs sont en beta. Les endpoints peuvent changer.

## 📊 Monitoring

Pour monitorer l'usage des MCP servers:

1. **n8n Executions**: Voir l'historique des exécutions
2. **Google Cloud Console**: Quotas API (GTM, Google Ads, Gemini)
3. **Meta Business Suite**: API Calls & Rate Limits
4. **ElevenLabs Dashboard**: Character usage

## 🚨 Rate Limits

| API | Limite | Reset |
|-----|--------|-------|
| GTM API | 1,000 req/jour | Quotidien |
| Google Ads API | 15,000 req/jour | Quotidien |
| Meta Ads API | 200 req/heure | Hourly |
| ElevenLabs | 10,000 chars/mois (free) | Mensuel |
| Gemini API | 60 req/min | Minute |
| Veo-3 API | 50 req/jour (beta) | Quotidien |

## 📝 Prochaines Étapes

### LUNA (Strategy) - À implémenter

1. **SEO Audit Tool** (PageSpeed API, Mobile-Friendly Test)
2. **Keyword Research Tool** (Google Keyword Planner API)
3. **Competitor Analysis Tool** (SimilarWeb API)

### MARCUS (Trader) - À implémenter

1. **Launch Meta Campaign Tool** (Meta Ads API - Write)
2. **Launch Google Ads Campaign Tool** (Google Ads API - Write)
3. **Budget Optimizer Tool** (Custom algorithm)

## 🤝 Contribution

Pour ajouter un nouveau MCP server:

1. Créer `new-tool.js` dans `/mcp_servers/`
2. Exporter une fonction principale: `module.exports = { new_tool }`
3. Ajouter le toolCode correspondant dans le workflow
4. Documenter dans ce README

## 📄 Licence

Proprietary - The Hive OS V4 / Agency Killer

---

**Créé par:** Azzeddine Zazai
**Date:** 2026-02-10
**Version:** 1.0.0
