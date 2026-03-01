# 🛠️ MCP SERVERS - THE HIVE OS V4

Ce dossier contient les 7 MCP servers permettant aux agents d'exécuter leurs tâches spécialisées.

## 📦 Servers disponibles

### Pour Sora (Analyst - TYPE A tasks)
1. **gtm-server** ✅ - Google Tag Manager (7 fonctions)
2. **google-ads-server** ✅ - Google Ads LECTURE SEULE (7 fonctions)
3. **meta-ads-server** ✅ - Meta Ads LECTURE SEULE (7 fonctions)
4. **looker-server** ✅ - Looker Studio (7 fonctions)

### Pour Milo (Creative Designer)
5. **imagen3-server** ✅ - Google Imagen 3 / Nano Banana Pro (4 outils)
6. **veo3-server** ✅ - Google Veo-3 Video Generation (5 outils)
7. **elevenlabs-server** ✅ - ElevenLabs Voice & Audio (5 outils)

**Status:** 🎉 **TOUS LES 7 SERVERS SONT IMPLÉMENTÉS ET PRÊTS**

---

## 🚀 Installation

### Prérequis
- Node.js 20+
- npm ou yarn

### Installation globale

```bash
cd /Users/azzedinezazai/Documents/Agency-Killer-V4/mcp-servers

# Sora MCP Servers
for dir in gtm-server google-ads-server meta-ads-server looker-server; do
  cd $dir
  npm install
  npm run build
  cd ..
done

# Milo MCP Servers
for dir in imagen3-server veo3-server elevenlabs-server; do
  cd $dir
  npm install
  npm run build
  cd ..
done
```

---

## ⚙️ Configuration

### Variables d'environnement

#### Pour Sora (GTM, Google Ads, Meta Ads, Looker)

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/oauth/callback

# Facebook OAuth
FACEBOOK_APP_ID=your-app-id
FACEBOOK_APP_SECRET=your-app-secret
FACEBOOK_REDIRECT_URI=http://localhost:3000/oauth/facebook/callback
```

#### Pour Milo (Imagen 3, Veo-3, ElevenLabs)

**Imagen 3 & Veo-3:**
```env
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
GOOGLE_CLOUD_LOCATION=us-central1
```

**ElevenLabs:**
```env
ELEVENLABS_API_KEY=your-api-key-here
```

### Obtenir les credentials

**Google Cloud (Imagen 3 + Veo-3):**
1. Va sur [console.cloud.google.com](https://console.cloud.google.com)
2. Crée un projet ou sélectionne un existant
3. Active Vertex AI API
4. Crée un service account avec permissions Vertex AI
5. Télécharge le fichier JSON du service account

**Google OAuth (GTM + Google Ads + Looker):**
1. Va sur [console.cloud.google.com](https://console.cloud.google.com)
2. Crée un projet ou sélectionne un existant
3. Active les APIs:
   - Google Tag Manager API
   - Google Ads API
   - Google Analytics Data API (pour Looker)
4. Crée des credentials OAuth 2.0
5. Ajoute les scopes requis

**Meta (Meta Ads):**
1. Va sur [developers.facebook.com](https://developers.facebook.com)
2. Crée une app
3. Ajoute les permissions:
   - `ads_read`
   - `business_management`
4. Copie App ID et App Secret

**ElevenLabs:**
1. Crée un compte sur [elevenlabs.io](https://elevenlabs.io)
2. Va sur Settings > API Keys
3. Crée une nouvelle API key

---

## 🔧 Utilisation avec Claude Desktop

Ajouter dans `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "gtm": {
      "command": "node",
      "args": ["/Users/azzedinezazai/Documents/Agency-Killer-V4/mcp-servers/gtm-server/dist/index.js"],
      "env": {
        "GOOGLE_CLIENT_ID": "...",
        "GOOGLE_CLIENT_SECRET": "...",
        "GOOGLE_REDIRECT_URI": "..."
      }
    },
    "google-ads": {
      "command": "node",
      "args": ["/Users/azzedinezazai/Documents/Agency-Killer-V4/mcp-servers/google-ads-server/dist/index.js"],
      "env": {
        "GOOGLE_CLIENT_ID": "...",
        "GOOGLE_CLIENT_SECRET": "..."
      }
    },
    "meta-ads": {
      "command": "node",
      "args": ["/Users/azzedinezazai/Documents/Agency-Killer-V4/mcp-servers/meta-ads-server/dist/index.js"],
      "env": {
        "FACEBOOK_APP_ID": "...",
        "FACEBOOK_APP_SECRET": "..."
      }
    },
    "looker": {
      "command": "node",
      "args": ["/Users/azzedinezazai/Documents/Agency-Killer-V4/mcp-servers/looker-server/dist/index.js"],
      "env": {
        "GOOGLE_CLIENT_ID": "...",
        "GOOGLE_CLIENT_SECRET": "..."
      }
    },
    "imagen3": {
      "command": "node",
      "args": ["/Users/azzedinezazai/Documents/Agency-Killer-V4/mcp-servers/imagen3-server/dist/index.js"],
      "env": {
        "GOOGLE_CLOUD_PROJECT": "...",
        "GOOGLE_APPLICATION_CREDENTIALS": "...",
        "GOOGLE_CLOUD_LOCATION": "us-central1"
      }
    },
    "veo3": {
      "command": "node",
      "args": ["/Users/azzedinezazai/Documents/Agency-Killer-V4/mcp-servers/veo3-server/dist/index.js"],
      "env": {
        "GOOGLE_CLOUD_PROJECT": "...",
        "GOOGLE_APPLICATION_CREDENTIALS": "...",
        "GOOGLE_CLOUD_LOCATION": "us-central1"
      }
    },
    "elevenlabs": {
      "command": "node",
      "args": ["/Users/azzedinezazai/Documents/Agency-Killer-V4/mcp-servers/elevenlabs-server/dist/index.js"],
      "env": {
        "ELEVENLABS_API_KEY": "..."
      }
    }
  }
}
```

---

## 📚 Documentation détaillée

### Sora MCP Servers
- **Specs complètes:** `/MCP_SERVERS_SPECS_SORA.md`
- **Installation guide:** `/mcp-servers/INSTALLATION.md`
- **Completion report:** `/mcp-servers/MCP_SERVERS_IMPLEMENTATION_COMPLETE.md`

### Milo MCP Servers
- **Completion report:** `/mcp-servers/MILO_MCP_SERVERS_COMPLETE.md`
- **Individual READMEs:** Voir chaque dossier de server

---

## 🎯 Outils par Server

### Sora Servers (28 outils totaux)

**GTM Server (7 outils):**
- gtm_list_containers
- gtm_get_container
- gtm_create_tag
- gtm_create_trigger
- gtm_create_variable
- gtm_publish_version
- gtm_get_container_status

**Google Ads Server (7 outils):**
- google_ads_list_campaigns
- google_ads_get_campaign
- google_ads_list_ad_groups
- google_ads_get_metrics
- google_ads_get_keywords
- google_ads_get_search_terms
- google_ads_get_conversion_actions

**Meta Ads Server (7 outils):**
- meta_ads_list_campaigns
- meta_ads_get_campaign
- meta_ads_list_ad_sets
- meta_ads_list_ads
- meta_ads_get_insights
- meta_ads_get_audience_insights
- meta_ads_get_creative_insights

**Looker Server (7 outils):**
- looker_list_dashboards
- looker_get_dashboard
- looker_list_data_sources
- looker_connect_data_source
- looker_create_report
- looker_get_report_data
- looker_export_report

### Milo Servers (14 outils totaux)

**Imagen 3 Server (4 outils):**
- generate_image
- edit_image
- upscale_image
- get_generation_params

**Veo-3 Server (5 outils):**
- generate_video
- extend_video
- image_to_video
- interpolate_frames
- get_video_params

**ElevenLabs Server (5 outils):**
- text_to_speech
- list_voices
- clone_voice
- sound_effects
- get_voice_params

**Total général:** 42 outils MCP opérationnels

---

## 💰 Coûts estimés

### Google Cloud (Imagen 3 + Veo-3)
- Imagen 3: ~$0.04 par image (1024x1024)
- Veo-3: ~$0.30 par seconde de vidéo
- Free tier disponible pour tests

### ElevenLabs
- Free: 10,000 caractères/mois
- Starter: $5/mois - 30,000 caractères
- Creator: $22/mois - 100,000 caractères
- Pro: $99/mois - 500,000 caractères

### APIs Marketing (Sora)
- GTM, Google Ads, Meta Ads, Looker: Gratuits (lecture seule)

---

## 🔐 Sécurité

- **JAMAIS** committer les credentials dans Git
- Utiliser `.env` files (ajoutés au `.gitignore`)
- Les tokens OAuth sont stockés encryptés dans Supabase `user_integrations`
- Les MCP servers lisent les credentials depuis les paramètres passés par n8n

---

## 🐛 Debugging

### Logs

Les logs sont envoyés sur `stderr` (pas `stdout` qui est réservé au protocole MCP).

```bash
node dist/index.js 2> logs.txt
```

### Common errors

**Error: Invalid credentials**
→ Vérifie que les credentials OAuth sont valides et non expirés

**Error: Insufficient permissions**
→ Vérifie que les scopes OAuth sont corrects

**Error: API quota exceeded**
→ Tu as dépassé les limites de l'API

---

## ✅ Status d'implémentation

### Sora Servers
- ✅ **gtm-server** - Complet (7/7 fonctions)
- ✅ **google-ads-server** - Complet (7/7 fonctions)
- ✅ **meta-ads-server** - Complet (7/7 fonctions)
- ✅ **looker-server** - Complet (7/7 fonctions)

### Milo Servers
- ✅ **imagen3-server** - Complet (4/4 outils)
- ✅ **veo3-server** - Complet (5/5 outils)
- ✅ **elevenlabs-server** - Complet (5/5 outils)

**Total:** 42 outils MCP opérationnels

---

**Créé par Claude Code - The Hive OS V4**
**Dernière mise à jour:** 2026-02-10
