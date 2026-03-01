# 🚀 MCP Bridge Server - Guide d'Installation Complet

Ce guide vous accompagne étape par étape pour configurer et démarrer le MCP Bridge Server, puis l'intégrer à votre workflow n8n MILO.

## 📋 Prérequis

- ✅ Node.js 18+ installé
- ✅ npm ou yarn
- ✅ Accès à votre projet Google Cloud
- ✅ Serveurs MCP buildés
- ✅ n8n en cours d'exécution

---

## 🏗️ Étape 1 : Installation des dépendances

```bash
cd /Users/azzedinezazai/Documents/Agency-Killer-V4/mcp-bridge
npm install
```

**Résultat attendu :**
```
added 121 packages, and audited 122 packages in 5s
```

---

## ⚙️ Étape 2 : Configuration de l'environnement

### 2.1 Copier le fichier d'environnement

Le fichier `.env` existe déjà. Vous devez le modifier avec vos vraies credentials.

```bash
# Le fichier est déjà créé ici :
# /Users/azzedinezazai/Documents/Agency-Killer-V4/mcp-bridge/.env
```

### 2.2 Obtenir vos credentials Google Cloud

#### A. Créer un Service Account (si pas déjà fait)

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Sélectionnez votre projet (ou créez-en un)
3. **IAM & Admin** → **Service Accounts**
4. **Create Service Account**
   - Nom: `mcp-bridge-service`
   - Rôle: `Vertex AI User` + `Storage Object Viewer`
5. **Create Key** → JSON
6. Téléchargez le fichier JSON

#### B. Activer les APIs nécessaires

```bash
# Via gcloud CLI (si installé)
gcloud services enable aiplatform.googleapis.com
gcloud services enable storage.googleapis.com

# OU via la console : APIs & Services → Enable APIs
```

### 2.3 Configurer le fichier .env

Ouvrez `/Users/azzedinezazai/Documents/Agency-Killer-V4/mcp-bridge/.env` et remplacez :

```env
# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT=votre-project-id-ici        # Ex: hive-os-production
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json   # Chemin absolu vers votre JSON
```

**Exemple complet :**

```env
GOOGLE_CLOUD_PROJECT=hive-os-production
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=/Users/azzedinezazai/Documents/Agency-Killer-V4/credentials/gcp-service-account.json
```

### 2.4 Vérifier la configuration

```bash
# Vérifier que le fichier JSON existe
cat $GOOGLE_APPLICATION_CREDENTIALS | jq .project_id

# Vérifier que les variables sont chargées
cat .env | grep GOOGLE_CLOUD
```

---

## 🔨 Étape 3 : Build des serveurs MCP

Assurez-vous que tous les serveurs MCP sont buildés (déjà fait normalement) :

```bash
# Nano Banana Pro (MILO)
cd /Users/azzedinezazai/Documents/Agency-Killer-V4/mcp-servers/nano-banana-pro-server
npm run build

# VEO3
cd /Users/azzedinezazai/Documents/Agency-Killer-V4/mcp-servers/veo3-server
npm run build

# ElevenLabs
cd /Users/azzedinezazai/Documents/Agency-Killer-V4/mcp-servers/elevenlabs-server
npm run build
```

**Vérifier que les builds existent :**

```bash
ls -la /Users/azzedinezazai/Documents/Agency-Killer-V4/mcp-servers/*/dist/index.js
```

Vous devriez voir plusieurs fichiers `dist/index.js`.

---

## 🚀 Étape 4 : Démarrer le Bridge

### 4.1 Mode développement (avec auto-reload)

```bash
cd /Users/azzedinezazai/Documents/Agency-Killer-V4/mcp-bridge
npm run dev
```

**Résultat attendu :**

```
INFO [BridgeServer] ════════════════════════════════════════════════════════════
INFO [BridgeServer] MCP Bridge Server Started
INFO [BridgeServer] ════════════════════════════════════════════════════════════
INFO [BridgeServer] Environment: development
INFO [BridgeServer] Port: 3456
INFO [BridgeServer] MCP Servers Path: /Users/azzedinezazai/Documents/Agency-Killer-V4/mcp-servers
INFO [BridgeServer]
INFO [BridgeServer] Available MCP Servers:
INFO [BridgeServer]   - nano-banana-pro: Nano Banana Pro
INFO [BridgeServer]   - veo3: VEO3 Video Generation
...
INFO [BridgeServer] API Endpoints:
INFO [BridgeServer]   Health: http://localhost:3456/health
INFO [BridgeServer]   MILO Image: POST http://localhost:3456/api/milo/generate-image
INFO [BridgeServer] ════════════════════════════════════════════════════════════
```

### 4.2 Mode production

```bash
npm run build
npm start
```

### 4.3 Lancer en arrière-plan (production)

```bash
# Avec pm2 (recommandé)
npm install -g pm2
pm2 start dist/index.js --name mcp-bridge

# OU avec nohup
nohup npm start > mcp-bridge.log 2>&1 &
```

---

## ✅ Étape 5 : Tester le Bridge

### 5.1 Test de santé

```bash
curl http://localhost:3456/health
```

**Réponse attendue :**
```json
{
  "status": "ok",
  "service": "MCP Bridge Server",
  "version": "1.0.0",
  "uptime": 12.34
}
```

### 5.2 Lister les serveurs disponibles

```bash
curl http://localhost:3456/api/servers | jq
```

**Réponse attendue :**
```json
{
  "success": true,
  "servers": [
    {
      "id": "nano-banana-pro",
      "name": "Nano Banana Pro",
      "path": "/Users/azzedinezazai/.../nano-banana-pro-server"
    },
    ...
  ]
}
```

### 5.3 Lister les outils de MILO

```bash
curl http://localhost:3456/api/nano-banana-pro/tools | jq
```

**Réponse attendue :**
```json
{
  "success": true,
  "server": "nano-banana-pro",
  "tools": [
    {
      "name": "generate_image",
      "description": "Generate a 4K image using Google Nano Banana Pro",
      "inputSchema": { ... }
    },
    ...
  ]
}
```

**Si vous obtenez une erreur**, vérifiez :
- ✅ Que `GOOGLE_CLOUD_PROJECT` est bien défini
- ✅ Que `GOOGLE_APPLICATION_CREDENTIALS` pointe vers un fichier valide
- ✅ Que le service account a les bonnes permissions

### 5.4 Test de génération d'image

```bash
curl -X POST http://localhost:3456/api/milo/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A cute robot holding a sign that says HELLO",
    "resolution": "1024x1024",
    "style_preset": "digital_art",
    "quality_level": "standard"
  }' | jq '.images[0].base64' | head -c 100
```

**Réponse attendue :**
```
"iVBORw0KGgoAAAANSUhEUgAABAAAAAQACAYAAAB..."
```

Si vous voyez du base64, **c'est bon ! ✅**

---

## 🔧 Étape 6 : Intégrer le Bridge dans le workflow MILO (n8n)

### 6.1 Ouvrir le workflow MILO dans n8n

1. Ouvrez n8n : `http://localhost:5678`
2. Allez dans **Workflows** → `Milo Brain (Creative)`
3. Activez le mode édition

### 6.2 Remplacer le ToolCode par un HTTP Request

#### **Avant (ne fonctionne pas) :**

```
┌─────────────┐     ┌──────────────────┐     ┌────────────────────┐
│ Milo Brain  │ ──> │ nano_banana_pro  │ ──> │ Return Response    │
│             │     │ (ToolCode)       │     │                    │
└─────────────┘     └──────────────────┘     └────────────────────┘
                    ❌ SANDBOX ERROR
```

#### **Après (fonctionne) :**

```
┌─────────────┐     ┌──────────────────┐     ┌────────────────────┐
│ Milo Brain  │ ──> │ HTTP Request     │ ──> │ Process Response   │
│             │     │ (Call Bridge)    │     │ (Extract base64)   │
└─────────────┘     └──────────────────┘     └────────────────────┘
                    ✅ VIA BRIDGE
```

### 6.3 Configuration détaillée

#### A. Supprimer le nœud ToolCode `nano_banana_pro`

1. Clic droit sur le nœud `nano_banana_pro` (ToolCode)
2. **Delete**

#### B. Ajouter un nœud HTTP Request

1. **Add node** → **HTTP Request**
2. Renommez-le : `Call MCP Bridge - Generate Image`
3. Configuration :

**General Settings :**
- **Method :** `POST`
- **URL :** `http://localhost:3456/api/milo/generate-image`

**Headers :**
- `Content-Type` : `application/json`

**Body (JSON) :**
```json
{
  "prompt": "{{ $('Prepare Creative Context').item.json.prompt }}",
  "resolution": "2048x2048",
  "style_preset": "photorealistic",
  "quality_level": "high",
  "number_of_images": 1
}
```

**Options :**
- **Response Format :** `JSON`
- **Timeout :** `60000` (60 secondes)

#### C. Ajouter un nœud Code pour extraire l'image

1. **Add node** → **Code**
2. Renommez : `Extract Image Base64`
3. Code :

```javascript
const response = $input.item.json;

// Vérifier que la génération a réussi
if (!response.success || !response.images || response.images.length === 0) {
  throw new Error('Image generation failed: ' + (response.error || 'No images returned'));
}

// Extraire la première image
const firstImage = response.images[0];

return {
  json: {
    success: true,
    image_base64: firstImage.base64,
    mime_type: firstImage.mime_type || 'image/png',
    resolution: firstImage.resolution,
    metadata: response.metadata,
    enhanced_prompt: firstImage.enhanced_prompt
  }
};
```

#### D. Connecter les nœuds

```
[Prepare Creative Context] → [Call MCP Bridge] → [Extract Image Base64] → [Return to PM]
```

### 6.4 Tester le workflow modifié

1. **Save** le workflow
2. Cliquez sur **Execute Workflow** (ou testez depuis un autre workflow qui appelle MILO)
3. Entrée test :
   ```json
   {
     "prompt": "A beautiful sunset over mountains, 8k, cinematic"
   }
   ```
4. Vérifiez que vous recevez une réponse avec `image_base64`

---

## 🐛 Dépannage

### Problème : "Connection closed" lors de l'appel à un serveur MCP

**Cause :** Variables d'environnement manquantes

**Solution :**
```bash
# Vérifier le .env
cat /Users/azzedinezazai/Documents/Agency-Killer-V4/mcp-bridge/.env | grep GOOGLE_CLOUD

# Vérifier que le fichier credentials existe
ls -la $GOOGLE_APPLICATION_CREDENTIALS
```

### Problème : "fetch is not defined" dans n8n

**Cause :** Vous utilisez encore le ToolCode

**Solution :** Supprimez le ToolCode et utilisez HTTP Request (voir Étape 6)

### Problème : "Permission denied" sur Google Cloud

**Cause :** Service Account n'a pas les bonnes permissions

**Solution :**
1. Allez dans [IAM & Admin](https://console.cloud.google.com/iam-admin/iam)
2. Trouvez votre service account
3. **Edit** → Ajoutez les rôles :
   - `Vertex AI User`
   - `Storage Object Viewer`

### Problème : Le bridge ne démarre pas

**Cause :** Port 3456 déjà utilisé

**Solution :**
```bash
# Trouver le processus qui utilise le port
lsof -ti:3456

# Le tuer
lsof -ti:3456 | xargs kill -9

# OU changer le port dans .env
PORT=3457
```

---

## 📊 Monitoring et Logs

### Voir les logs en temps réel

```bash
# Si lancé avec npm run dev
# Les logs s'affichent directement dans le terminal

# Si lancé en arrière-plan
tail -f mcp-bridge.log

# Avec pm2
pm2 logs mcp-bridge
```

### Vérifier le statut des connexions

```bash
curl http://localhost:3456/api/status
```

**Réponse :**
```json
{
  "success": true,
  "connections": {
    "nano-banana-pro": true,   // ✅ Connecté
    "veo3": false,              // ❌ Pas encore utilisé
    "elevenlabs": false
  }
}
```

---

## 🎯 Résumé des Commandes Essentielles

```bash
# 1. Démarrer le bridge
cd /Users/azzedinezazai/Documents/Agency-Killer-V4/mcp-bridge
npm run dev

# 2. Tester la santé
curl http://localhost:3456/health

# 3. Tester MILO
curl -X POST http://localhost:3456/api/milo/generate-image \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A test image", "resolution": "1024x1024"}'

# 4. Arrêter le bridge
# Ctrl+C (si en mode dev)
# OU
pm2 stop mcp-bridge
```

---

## ✅ Checklist de Validation

- [ ] Bridge démarre sans erreur
- [ ] `/health` retourne `"status": "ok"`
- [ ] `/api/servers` liste 7 serveurs
- [ ] `/api/nano-banana-pro/tools` retourne les 5 tools
- [ ] Test de génération d'image réussit (retourne base64)
- [ ] Workflow MILO modifié avec HTTP Request
- [ ] Test end-to-end depuis n8n fonctionne

---

## 🎉 Félicitations !

Votre MCP Bridge Server est maintenant opérationnel. MILO peut générer des images via le serveur MCP Nano Banana Pro, et vous pouvez facilement ajouter d'autres agents (VEO3 pour la vidéo, ElevenLabs pour l'audio, etc.).

**Prochaines étapes :**
1. Tester la génération d'images depuis le cockpit
2. Intégrer VEO3 pour la génération vidéo
3. Déployer le bridge en production

---

**Besoin d'aide ?** Vérifiez les logs du bridge et contactez l'équipe The Hive OS.
