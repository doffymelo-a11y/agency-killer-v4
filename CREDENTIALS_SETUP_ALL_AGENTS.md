# 🔐 CREDENTIALS SETUP - ALL 4 AGENTS

**THE HIVE OS V4** - Guide complet de configuration des credentials
**Version:** 1.0.0
**Date:** 2026-02-10
**Agents:** MILO, SORA, LUNA, MARCUS

---

## 📋 Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Credentials par Agent](#credentials-par-agent)
3. [Setup Étape par Étape](#setup-étape-par-étape)
4. [Configuration n8n](#configuration-n8n)
5. [Vérification & Tests](#vérification--tests)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Vue d'Ensemble

### Résumé des Credentials Nécessaires

| Credential | Agents | Obligatoire | Difficulté | Temps |
|-----------|--------|-------------|-----------|-------|
| `GOOGLE_API_KEY` | MILO, LUNA | ✅ OUI | ⭐ Facile | 2 min |
| `ELEVENLABS_API_KEY` | MILO | ✅ OUI | ⭐ Facile | 3 min |
| `GOOGLE_DEVELOPER_TOKEN` | SORA, MARCUS, LUNA | ⚠️ Optionnel | ⭐⭐ Moyen | 10 min |
| Meta OAuth2 | SORA, MARCUS | ⚠️ Optionnel | ⭐⭐⭐ Avancé | 15 min |
| Google Ads OAuth2 | SORA, MARCUS | ⚠️ Optionnel | ⭐⭐⭐ Avancé | 15 min |
| Google Search Console OAuth2 | LUNA | ⚠️ Optionnel | ⭐⭐ Moyen | 10 min |

**Total temps minimum:** 5 minutes (MILO + LUNA bases)
**Total temps complet:** 65 minutes (tous les agents avec OAuth2)

---

## 🤖 Credentials par Agent

### ✅ MILO (Creative Designer)

**Fonctions:**
- Génération d'images 4K (Gemini 3 Pro / Imagen 3)
- Génération de vidéos (Veo-3)
- Génération audio/voix (ElevenLabs)

**Credentials requis:**

1. **`GOOGLE_API_KEY`** (✅ OBLIGATOIRE)
   - **Usage:** Imagen 3, Veo-3, Gemini
   - **Où l'obtenir:** https://console.cloud.google.com/apis/credentials
   - **Coût:** Gratuit (avec quotas)

2. **`ELEVENLABS_API_KEY`** (✅ OBLIGATOIRE)
   - **Usage:** Génération audio/voix
   - **Où l'obtenir:** https://elevenlabs.io/
   - **Coût:** Gratuit (10,000 caractères/mois) ou payant

---

### 📊 SORA (Analyst)

**Fonctions:**
- Analytics (GTM, Google Ads, Meta Ads, Looker)
- Performance monitoring
- Learning Phase detection (Meta)
- Reporting automatisé

**Credentials requis:**

1. **`GOOGLE_API_KEY`** (⚠️ Optionnel - pour PageSpeed)
   - **Usage:** PageSpeed Insights
   - **Où l'obtenir:** https://console.cloud.google.com/apis/credentials

2. **`GOOGLE_DEVELOPER_TOKEN`** (⚠️ Optionnel - pour Google Ads)
   - **Usage:** Google Ads API (lecture seule)
   - **Où l'obtenir:** https://ads.google.com/ > Tools > API Center
   - **Requis:** Compte Google Ads actif

3. **Google Ads OAuth2** (⚠️ Optionnel - pour Google Ads)
   - **Usage:** Accès comptes Google Ads
   - **Configuration:** Dans n8n Credentials
   - **Scopes:** `https://www.googleapis.com/auth/adwords`

4. **Meta OAuth2** (⚠️ Optionnel - pour Meta Ads)
   - **Usage:** Accès comptes Meta Ads
   - **Configuration:** Dans n8n Credentials
   - **Scopes:** `ads_read`, `business_management`

5. **Google Tag Manager OAuth2** (⚠️ Optionnel - pour GTM)
   - **Usage:** Accès conteneurs GTM
   - **Configuration:** Dans n8n Credentials
   - **Scopes:** `https://www.googleapis.com/auth/tagmanager.readonly`

6. **Looker OAuth2** (⚠️ Optionnel - pour Looker Studio)
   - **Usage:** Création dashboards
   - **Configuration:** Dans n8n Credentials
   - **Scopes:** `https://www.googleapis.com/auth/datastudio`

---

### 🔮 LUNA (Strategist)

**Fonctions:**
- Audit SEO (technique & sémantique)
- Keyword research
- Analyse concurrence
- Content strategy

**Credentials requis:**

1. **`GOOGLE_API_KEY`** (✅ OBLIGATOIRE)
   - **Usage:** PageSpeed Insights API
   - **Où l'obtenir:** https://console.cloud.google.com/apis/credentials
   - **APIs à activer:**
     - PageSpeed Insights API
     - Generative Language API (Gemini)

2. **`GOOGLE_DEVELOPER_TOKEN`** (⚠️ Optionnel - pour Keyword Planner)
   - **Usage:** Google Keyword Planner API (search volume)
   - **Où l'obtenir:** https://ads.google.com/ > Tools > API Center

3. **Google Search Console OAuth2** (⚠️ Optionnel - pour GSC)
   - **Usage:** Crawl errors, coverage data
   - **Configuration:** Dans n8n Credentials
   - **Scopes:** `https://www.googleapis.com/auth/webmasters.readonly`

---

### 💰 MARCUS (Trader)

**Fonctions:**
- Lancement campagnes (Meta Ads, Google Ads)
- Optimisation budgets
- Scaling/cutting décisions
- Learning Phase protection

**Credentials requis:**

1. **`META_ACCESS_TOKEN`** (✅ OBLIGATOIRE pour Meta Ads)
   - **Usage:** Meta Ads API (création campagnes)
   - **Où l'obtenir:** https://business.facebook.com/
   - **Scopes:** `ads_management`, `business_management`

2. **`GOOGLE_DEVELOPER_TOKEN`** (✅ OBLIGATOIRE pour Google Ads)
   - **Usage:** Google Ads API (création campagnes)
   - **Où l'obtenir:** https://ads.google.com/ > Tools > API Center

3. **Meta OAuth2** (✅ OBLIGATOIRE pour Meta Ads)
   - **Usage:** Accès comptes Meta Ads (WRITE)
   - **Configuration:** Dans n8n Credentials
   - **Scopes:** `ads_management`, `ads_read`, `business_management`

4. **Google Ads OAuth2** (✅ OBLIGATOIRE pour Google Ads)
   - **Usage:** Accès comptes Google Ads (WRITE)
   - **Configuration:** Dans n8n Credentials
   - **Scopes:** `https://www.googleapis.com/auth/adwords`

**+ Accès SORA (READ-ONLY):**
MARCUS réutilise les MCP servers de SORA pour lire les données (performances, Learning Phase, etc.)

---

## 🚀 Setup Étape par Étape

### Étape 1: Google API Key (5 min) - MILO & LUNA

**Utilisé par:** MILO (images/vidéos), LUNA (PageSpeed)

1. **Aller sur:** https://console.cloud.google.com/apis/credentials
2. **Se connecter** avec ton compte Google
3. **Créer un projet** (si tu n'en as pas):
   - Clique sur "Select a project" (en haut)
   - Clique sur "NEW PROJECT"
   - Nom: `The Hive OS`
   - Clique sur "CREATE"

4. **Activer les APIs nécessaires:**
   - Va sur: https://console.cloud.google.com/apis/library
   - Cherche et active:
     - ✅ **Generative Language API** (pour Gemini/Imagen)
     - ✅ **PageSpeed Insights API** (pour LUNA)

5. **Créer une API Key:**
   - Retourne sur: https://console.cloud.google.com/apis/credentials
   - Clique sur "+ CREATE CREDENTIALS"
   - Sélectionne "API key"
   - **COPIE LA CLÉ** (commence par `AIzaSy...`)
   - **Optionnel:** Clique sur "RESTRICT KEY" pour sécuriser
     - Application restrictions: None
     - API restrictions: Sélectionne les APIs activées ci-dessus
   - Clique sur "SAVE"

6. **Garde la clé** dans un fichier temporaire

**✅ Done! Tu as maintenant ta `GOOGLE_API_KEY`**

---

### Étape 2: ElevenLabs API Key (3 min) - MILO

**Utilisé par:** MILO (audio/voix)

1. **Aller sur:** https://elevenlabs.io/
2. **Créer un compte** (gratuit ou payant):
   - Clique sur "Get Started"
   - Choisis le plan (Free tier = 10,000 caractères/mois)
   - Vérifie ton email

3. **Obtenir l'API Key:**
   - Connecte-toi sur https://elevenlabs.io/
   - Clique sur ton **avatar** (en haut à droite)
   - Clique sur "Profile Settings"
   - Copie l'**API Key** (commence par `sk_...`)

4. **Garde la clé** dans un fichier temporaire

**✅ Done! Tu as maintenant ta `ELEVENLABS_API_KEY`**

---

### Étape 3: Google Developer Token (10 min) - SORA, MARCUS, LUNA

**Utilisé par:** SORA (reporting), MARCUS (campaign launch), LUNA (keyword research)

**⚠️ Prérequis:** Compte Google Ads actif avec historique de dépenses

1. **Aller sur:** https://ads.google.com/
2. **Se connecter** avec ton compte Google Ads
3. **Accéder à l'API Center:**
   - Clique sur "Tools and Settings" (🔧 en haut à droite)
   - Sous "SETUP", clique sur "API Center"

4. **Demander un Developer Token:**
   - Si tu n'as pas encore de token, clique sur "REQUEST TOKEN"
   - Remplis le formulaire:
     - **Application name:** The Hive OS
     - **Description:** AI-powered marketing ERP
   - Clique sur "SUBMIT"

5. **Attendre l'approbation:**
   - **Test access:** Immédiat (limité à ton compte)
   - **Standard access:** 24-48h (accès complets)

6. **Copier le token** une fois approuvé

**✅ Done! Tu as maintenant ton `GOOGLE_DEVELOPER_TOKEN`**

---

### Étape 4: Meta OAuth2 (15 min) - SORA, MARCUS

**Utilisé par:** SORA (analytics), MARCUS (campaign launch)

**⚠️ Prérequis:** Compte Meta Business Manager

#### A) Créer une App Meta

1. **Aller sur:** https://developers.facebook.com/apps
2. **Créer une app:**
   - Clique sur "Create App"
   - Type: **Business**
   - App Name: `The Hive OS`
   - App Contact Email: ton email
   - Business Account: Sélectionne ton Business Manager
   - Clique sur "Create App"

3. **Ajouter le produit Marketing API:**
   - Dans le dashboard de l'app, cherche "Marketing API"
   - Clique sur "Set Up"

4. **Obtenir l'App ID et App Secret:**
   - Va dans Settings > Basic
   - **Copie:** App ID
   - **Copie:** App Secret (clique sur "Show")

#### B) Configurer dans n8n

1. **Dans n8n:**
   - Va dans Settings > Credentials
   - Clique sur "+ New Credential"
   - Cherche "Meta Ads OAuth2 API"
   - Remplis:
     - **Client ID:** Ton App ID
     - **Client Secret:** Ton App Secret
     - **Scopes:** `ads_read,ads_management,business_management`
   - Clique sur "Connect my account"
   - Autorise l'accès
   - Clique sur "Save"

**✅ Done! Meta OAuth2 configuré**

---

### Étape 5: Google Ads OAuth2 (15 min) - SORA, MARCUS

**Utilisé par:** SORA (analytics), MARCUS (campaign launch)

#### A) Créer un projet Google Cloud (si pas déjà fait)

Voir Étape 1 ci-dessus.

#### B) Activer Google Ads API

1. **Aller sur:** https://console.cloud.google.com/apis/library
2. **Chercher:** "Google Ads API"
3. **Cliquer** sur "Enable"

#### C) Créer des OAuth2 credentials

1. **Aller sur:** https://console.cloud.google.com/apis/credentials
2. **Configurer l'écran de consentement:**
   - Clique sur "OAuth consent screen"
   - User Type: **External**
   - Remplis:
     - App name: `The Hive OS`
     - User support email: ton email
     - Developer contact: ton email
   - Clique sur "SAVE AND CONTINUE"
   - Scopes: Ajoute `https://www.googleapis.com/auth/adwords`
   - Clique sur "SAVE AND CONTINUE"

3. **Créer les credentials OAuth2:**
   - Retourne sur: https://console.cloud.google.com/apis/credentials
   - Clique sur "+ CREATE CREDENTIALS"
   - Sélectionne "OAuth client ID"
   - Application type: **Web application**
   - Name: `n8n`
   - Authorized redirect URIs:
     - `https://ton-n8n-domain.com/rest/oauth2-credential/callback`
     - `http://localhost:5678/rest/oauth2-credential/callback` (si local)
   - Clique sur "CREATE"
   - **Copie:** Client ID
   - **Copie:** Client secret

#### D) Configurer dans n8n

1. **Dans n8n:**
   - Va dans Settings > Credentials
   - Clique sur "+ New Credential"
   - Cherche "Google Ads OAuth2 API"
   - Remplis:
     - **Client ID:** Ton Client ID
     - **Client Secret:** Ton Client Secret
     - **Developer Token:** Ton Developer Token (Étape 3)
   - Clique on "Connect my account"
   - Autorise l'accès
   - Clique sur "Save"

**✅ Done! Google Ads OAuth2 configuré**

---

### Étape 6: Google Search Console OAuth2 (10 min) - LUNA

**Utilisé par:** LUNA (crawl errors, coverage)

**⚠️ Prérequis:** Site vérifié dans Google Search Console

#### A) Utiliser le même projet OAuth2 que Google Ads

Tu peux réutiliser le projet créé à l'Étape 5.

#### B) Activer l'API Search Console

1. **Aller sur:** https://console.cloud.google.com/apis/library
2. **Chercher:** "Search Console API"
3. **Cliquer** sur "Enable"

#### C) Configurer dans n8n

1. **Dans n8n:**
   - Va dans Settings > Credentials
   - Clique on "+ New Credential"
   - Cherche "Google Search Console OAuth2 API"
   - Remplis:
     - **Client ID:** Même que Google Ads
     - **Client Secret:** Même que Google Ads
   - Clique on "Connect my account"
   - Autorise l'accès
   - Clique sur "Save"

**✅ Done! Google Search Console OAuth2 configuré**

---

## ⚙️ Configuration n8n

### Méthode A: Variables d'Environnement (Recommandé)

**Utiliser pour:** API Keys simples

1. **Dans n8n, va dans:**
   - Settings > Variables (ou Environment Variables)

2. **Ajoute les variables:**

```bash
# MILO
GOOGLE_API_KEY=AIzaSy...
ELEVENLABS_API_KEY=sk_...

# SORA/LUNA/MARCUS
GOOGLE_DEVELOPER_TOKEN=...
```

3. **Redémarre n8n:**

```bash
# Docker
docker-compose restart n8n

# npm
# Ctrl+C puis:
n8n start

# systemd
sudo systemctl restart n8n
```

---

### Méthode B: OAuth2 Credentials (n8n UI)

**Utiliser pour:** OAuth2 (Meta, Google Ads, GSC)

1. **Dans n8n, va dans:**
   - Settings > Credentials

2. **Pour chaque OAuth2:**
   - Clique sur "+ New Credential"
   - Sélectionne le type (Meta OAuth2, Google Ads OAuth2, etc.)
   - Remplis les champs
   - Clique sur "Connect my account"
   - Autorise
   - Clique sur "Save"

---

### Méthode C: Fichier .env (Avancé)

**Utiliser pour:** Gestion centralisée

1. **Copie le template:**

```bash
cp .env.example .env
```

2. **Édite `.env`:**

```bash
# MILO
GOOGLE_API_KEY=AIzaSy_TA_VRAIE_CLE
ELEVENLABS_API_KEY=sk_TA_VRAIE_CLE

# SORA/MARCUS/LUNA
GOOGLE_DEVELOPER_TOKEN=TON_TOKEN

# Meta Ads
META_ACCESS_TOKEN=EAA...
META_APP_ID=123456789
META_APP_SECRET=...

# Optionnel (OAuth2 géré dans n8n UI)
```

3. **Redémarre n8n**

---

## ✅ Vérification & Tests

### Test 1: MILO (Creative)

**Tester:** Génération d'image

1. **Dans n8n, ouvre:** `milo-creative-v4-with-toolcode.workflow.json`
2. **Clique sur** le node "Tool: Nano Banana Pro"
3. **Vérifie** que le code contient: `$env.GOOGLE_API_KEY`
4. **Execute** le workflow manuellement
5. **Résultat attendu:**
   ```json
   {
     "success": true,
     "image_url": "https://..."
   }
   ```

**✅ Si success: true → MILO fonctionne !**

---

### Test 2: LUNA (Strategist)

**Tester:** Audit SEO

1. **Dans n8n, crée un workflow de test:**
```javascript
// Node: Execute Tool
{
  "tool": "technical_seo_audit",
  "arguments": {
    "url": "https://example.com",
    "include_pagespeed": true
  }
}
```

2. **Execute**
3. **Résultat attendu:**
   ```json
   {
     "success": true,
     "technical_seo": {
       "https": { "enabled": true },
       "mobile_friendly": { "is_mobile_friendly": true }
     }
   }
   ```

**✅ Si success: true → LUNA fonctionne !**

---

### Test 3: SORA (Analyst)

**Tester:** Lister comptes Google Ads

1. **Prérequis:** OAuth2 Google Ads configuré
2. **Dans n8n, crée un workflow de test:**
```javascript
// Node: Execute Tool
{
  "tool": "get_accounts",
  "arguments": {}
}
```

3. **Execute**
4. **Résultat attendu:**
   ```json
   {
     "success": true,
     "accounts": [
       {
         "customer_id": "1234567890",
         "descriptive_name": "Mon compte"
       }
     ]
   }
   ```

**✅ Si success: true → SORA fonctionne !**

---

### Test 4: MARCUS (Trader)

**Tester:** Créer une campagne Meta (PAUSED)

1. **Prérequis:** OAuth2 Meta configuré
2. **Dans n8n, crée un workflow de test:**
```javascript
// Node: Execute Tool
{
  "tool": "create_campaign",
  "arguments": {
    "ad_account_id": "act_123456789",
    "name": "Test Campaign",
    "objective": "OUTCOME_SALES",
    "status": "PAUSED",
    "daily_budget": 5000000
  }
}
```

3. **Execute**
4. **Résultat attendu:**
   ```json
   {
     "success": true,
     "campaign_id": "camp_...",
     "message": "✅ Campaign created successfully"
   }
   ```

**✅ Si success: true → MARCUS fonctionne !**

---

## 🐛 Troubleshooting

### Problème: "GOOGLE_API_KEY manquant"

**Solution:**
1. Vérifie que la variable est ajoutée dans n8n (Settings > Variables)
2. Nom EXACT: `GOOGLE_API_KEY` (tout en majuscules)
3. Redémarre n8n
4. Re-teste

---

### Problème: "403 Forbidden (Google API)"

**Solution:**
1. Active les APIs dans Google Cloud Console
2. Va sur: https://console.cloud.google.com/apis/library
3. Cherche et active:
   - Generative Language API
   - PageSpeed Insights API
4. Attends 1-2 minutes
5. Re-teste

---

### Problème: "401 Unauthorized (ElevenLabs)"

**Solution:**
1. Vérifie que la clé est correcte (commence par `sk_`)
2. Vérifie que ton compte ElevenLabs a des crédits
3. Va sur: https://elevenlabs.io/
4. Profile Settings > Usage
5. Re-teste

---

### Problème: "OAuth2 token expired"

**Solution:**
1. Dans n8n, va dans Settings > Credentials
2. Trouve le credential concerné
3. Clique sur "Reconnect"
4. Autorise à nouveau
5. Save

**Note:** Les tokens OAuth2 expirent régulièrement. n8n gère le refresh automatiquement si configuré correctement.

---

### Problème: "Learning Phase reset (Meta)"

**Solution:**
1. Utilise `learning_phase_protection` avant de modifier le budget
2. Limite les changements de budget à max +20%
3. Attends 48-72h entre chaque modification
4. Vérifie le status: ACTIVE, GRADUATED, LIMITED

---

### Problème: "Google Ads API quota exceeded"

**Solution:**
1. Rate limits: 15,000 operations/jour (Standard access)
2. Implémente du throttling dans n8n
3. Utilise les batch operations
4. Monitoring quota: https://ads.google.com/aw/apicenter

---

## 📊 Résumé des Credentials

### Configuration Minimale (5 min)

**Pour faire fonctionner MILO et LUNA (bases):**

✅ `GOOGLE_API_KEY`
✅ `ELEVENLABS_API_KEY`

**Agents fonctionnels:** MILO (images/vidéos/audio), LUNA (PageSpeed audit)

---

### Configuration Complète (65 min)

**Pour faire fonctionner LES 4 AGENTS:**

✅ `GOOGLE_API_KEY`
✅ `ELEVENLABS_API_KEY`
✅ `GOOGLE_DEVELOPER_TOKEN`
✅ `META_ACCESS_TOKEN`
✅ Meta OAuth2 (n8n)
✅ Google Ads OAuth2 (n8n)
✅ Google Search Console OAuth2 (n8n)

**Agents fonctionnels:** MILO, SORA, LUNA, MARCUS (toutes fonctions)

---

## 🎯 Checklist Finale

Avant de dire "c'est bon", vérifie:

- [ ] `GOOGLE_API_KEY` ajouté dans n8n
- [ ] `ELEVENLABS_API_KEY` ajouté dans n8n
- [ ] n8n redémarré
- [ ] APIs Google activées (Generative Language, PageSpeed)
- [ ] Test MILO → `success: true`
- [ ] Test LUNA → `success: true`

**Optionnel (pour fonctions avancées):**

- [ ] `GOOGLE_DEVELOPER_TOKEN` ajouté
- [ ] Meta OAuth2 configuré dans n8n
- [ ] Google Ads OAuth2 configuré dans n8n
- [ ] Test SORA → `success: true`
- [ ] Test MARCUS → `success: true`

---

## 📚 Documentation Complète

- **Quick Start (5 min):** `/QUICKSTART_5MIN.md`
- **Guide Complet (45 min):** `/GUIDE_COMPLET_CONFIGURATION_CREDENTIALS.md`
- **Template .env:** `/.env.example`
- **Implementation Summary:** `/IMPLEMENTATION_SUMMARY_2026-02-10.md`

**MCP Servers READMEs:**
- SORA: `/agents/CURRENT_analyst-mcp/mcp_servers/README.md`
- LUNA: `/agents/CURRENT_strategist-mcp/mcp_servers/README.md`
- MARCUS: `/agents/CURRENT_trader-mcp/mcp_servers/README.md`

---

**Créé par:** Azzeddine Zazai
**Date:** 2026-02-10
**Version:** 1.0.0
**Status:** ✅ Ready for Setup

**🎉 TU ES PRÊT À LANCER THE HIVE OS V4 !**
