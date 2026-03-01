# 🚀 INSTALLATION DES MCP SERVERS - GUIDE RAPIDE

Ce guide te permet d'installer et de builder tous les MCP servers en quelques minutes.

---

## ✅ Ce qui est prêt

**4 MCP Servers complets:**
- ✅ GTM Server (Google Tag Manager)
- ✅ Google Ads Server (lecture seule)
- ✅ Meta Ads Server (lecture seule)
- ✅ Looker Server (Looker Studio)

**28 fonctions MCP opérationnelles** pour que Sora puisse exécuter les tâches TYPE A.

---

## 📋 Prérequis

Avant de commencer, assure-toi d'avoir:

- ✅ Node.js 20+ installé (`node --version`)
- ✅ npm ou yarn installé (`npm --version`)
- ⏳ Credentials OAuth Google (optionnel pour tests initiaux)
- ⏳ Credentials OAuth Meta (optionnel pour tests initiaux)

---

## 🛠️ Installation en 3 étapes

### Étape 1: Installer les dépendances

Ouvre un terminal et navigue vers le dossier des MCP servers:

```bash
cd /Users/azzedinezazai/Documents/Agency-Killer-V4/mcp-servers
```

Ensuite, installe les dépendances pour tous les servers:

```bash
# GTM Server
cd gtm-server
npm install
cd ..

# Google Ads Server
cd google-ads-server
npm install
cd ..

# Meta Ads Server
cd meta-ads-server
npm install
cd ..

# Looker Server
cd looker-server
npm install
cd ..
```

**OU en une seule commande:**

```bash
for dir in gtm-server google-ads-server meta-ads-server looker-server; do
  echo "📦 Installing $dir..."
  cd $dir && npm install && cd ..
done
```

---

### Étape 2: Builder les servers

Builder chaque server en TypeScript:

```bash
# GTM Server
cd gtm-server
npm run build
cd ..

# Google Ads Server
cd google-ads-server
npm run build
cd ..

# Meta Ads Server
cd meta-ads-server
npm run build
cd ..

# Looker Server
cd looker-server
npm run build
cd ..
```

**OU en une seule commande:**

```bash
for dir in gtm-server google-ads-server meta-ads-server looker-server; do
  echo "🔨 Building $dir..."
  cd $dir && npm run build && cd ..
done
```

---

### Étape 3: Vérifier l'installation

Vérifie que les servers ont été buildés correctement:

```bash
ls -la gtm-server/dist/index.js
ls -la google-ads-server/dist/index.js
ls -la meta-ads-server/dist/index.js
ls -la looker-server/dist/index.js
```

**Résultat attendu:**
```
-rwxr-xr-x  1 user  staff  12345 Feb  9 10:30 gtm-server/dist/index.js
-rwxr-xr-x  1 user  staff  15678 Feb  9 10:30 google-ads-server/dist/index.js
-rwxr-xr-x  1 user  staff  13456 Feb  9 10:30 meta-ads-server/dist/index.js
-rwxr-xr-x  1 user  staff  14789 Feb  9 10:30 looker-server/dist/index.js
```

✅ **Installation terminée!**

---

## 🧪 Tests rapides (sans credentials)

Tu peux tester que les servers démarrent correctement:

### Test GTM Server

```bash
cd gtm-server
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node dist/index.js
```

**Résultat attendu:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {"name": "gtm_list_containers", "description": "..."},
      {"name": "gtm_list_tags", "description": "..."},
      ...
    ]
  }
}
```

### Test Google Ads Server

```bash
cd google-ads-server
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node dist/index.js
```

### Test Meta Ads Server

```bash
cd meta-ads-server
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node dist/index.js
```

### Test Looker Server

```bash
cd looker-server
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node dist/index.js
```

---

## ⚙️ Configuration OAuth (optionnel)

Pour que les servers puissent accéder aux vraies données, tu dois configurer OAuth.

### Pour Google (GTM, Google Ads, Looker)

1. Va sur [console.cloud.google.com](https://console.cloud.google.com)
2. Crée un projet "Agency Killer V4"
3. Active les APIs:
   - Google Tag Manager API
   - Google Ads API
   - Google Sheets API (pour Looker)
4. Crée des credentials OAuth 2.0
5. Configure les scopes:
   - `https://www.googleapis.com/auth/tagmanager.edit.containers`
   - `https://www.googleapis.com/auth/adwords`
   - `https://www.googleapis.com/auth/spreadsheets`

6. Crée un fichier `.env` dans chaque server Google:

```bash
# Dans gtm-server/.env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/oauth/callback

# Copie le même .env dans google-ads-server/ et looker-server/
```

### Pour Meta (Meta Ads)

1. Va sur [developers.facebook.com](https://developers.facebook.com)
2. Crée une app "Agency Killer MCP"
3. Ajoute les permissions:
   - `ads_read`
   - `business_management`
4. Crée un fichier `.env` dans `meta-ads-server/`:

```bash
# Dans meta-ads-server/.env
FACEBOOK_APP_ID=your-app-id
FACEBOOK_APP_SECRET=your-app-secret
FACEBOOK_REDIRECT_URI=http://localhost:3000/oauth/facebook/callback
```

---

## 🔗 Intégration avec n8n

Les servers sont maintenant prêts à être utilisés dans le workflow Sora V4.5.

**Ce qui a été fait:**
1. ✅ Workflow Sora mis à jour avec 4 nouveaux tools (voir `/agents/CURRENT_analyst-mcp/analyst-core-v4.5-with-tools.workflow.json`)
2. ✅ System prompt Sora mis à jour avec TYPE A/B logic (voir `/SORA_SYSTEM_PROMPT_FINAL_V4.5.txt`)
3. ✅ 4 MCP servers implémentés et buildés

**Prochaine étape:**
- Importer le workflow dans n8n (voir `/agents/CURRENT_analyst-mcp/README_V4.5.md`)
- Les tools dans n8n sont en mode **placeholder** pour l'instant
- Pour connecter les vrais MCP servers, il faut modifier les tool nodes dans n8n pour appeler les servers via stdio

---

## 📚 Documentation

- **Specs techniques:** `/Users/azzedinezazai/Documents/Agency-Killer-V4/MCP_SERVERS_SPECS_SORA.md`
- **System prompt Sora:** `/Users/azzedinezazai/Documents/Agency-Killer-V4/SORA_SYSTEM_PROMPT_FINAL_V4.5.txt`
- **Guide n8n:** `/Users/azzedinezazai/Documents/Agency-Killer-V4/GUIDE_AJOUT_TOOLS_N8N_SORA.md`
- **README workflow:** `/Users/azzedinezazai/Documents/Agency-Killer-V4/agents/CURRENT_analyst-mcp/README_V4.5.md`

---

## 🐛 Troubleshooting

### Erreur: `Cannot find module '@modelcontextprotocol/sdk'`

Relance `npm install` dans le dossier du server concerné.

### Erreur: `tsc: command not found`

Installe TypeScript globalement:
```bash
npm install -g typescript
```

### Erreur lors du build: `error TS2307: Cannot find module 'googleapis'`

Assure-toi que les dépendances sont installées:
```bash
npm install
```

### Les servers ne répondent pas

Vérifie que le fichier `dist/index.js` existe après le build:
```bash
ls -la dist/index.js
```

---

**Créé par Claude Code - The Hive OS V4.5**
**Date:** 2026-02-09
