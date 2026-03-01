# 🎯 MCP Bridge Server - Récapitulatif Complet

## ✅ Ce qui a été créé

J'ai créé un **MCP Bridge Server** qui résout le problème des limitations du sandbox n8n. Ce bridge permet à n8n d'appeler les serveurs MCP (comme nano-banana-pro pour MILO) via HTTP REST.

### 📦 Architecture du Bridge

```
┌─────────────────┐      HTTP POST        ┌──────────────────┐      stdio/MCP     ┌────────────────┐
│   n8n Workflow  │ ──────────────────> │  MCP Bridge      │ ─────────────────> │  MCP Server    │
│   (MILO Brain)  │                      │  (Express.js)    │                     │ (nano-banana)  │
└─────────────────┘ <────────────────── └──────────────────┘ <───────────────── └────────────────┘
                      JSON Response                             MCP Protocol
```

**Pourquoi c'était nécessaire ?**

- ❌ n8n ToolCode sandbox bloque `fetch()`, `require()`, `https`, etc.
- ❌ Les serveurs MCP utilisent stdio (pas HTTP)
- ✅ Le bridge convertit HTTP → stdio → MCP → stdio → HTTP

### 📂 Fichiers créés

```
/mcp-bridge/
├── package.json                  # Dépendances (Express, MCP SDK, Winston)
├── tsconfig.json                 # Configuration TypeScript
├── .env                          # Variables d'environnement
├── .env.example                  # Template d'environnement
├── README.md                     # Documentation technique
├── SETUP_GUIDE.md               # 📖 GUIDE D'INSTALLATION COMPLET
└── src/
    ├── index.ts                  # Serveur Express principal
    ├── config.ts                 # Configuration des 7 serveurs MCP
    ├── logger.ts                 # Logger Winston
    └── mcpClient.ts              # Client MCP (stdio wrapper)
```

---

## 🔧 Fonctionnalités du Bridge

### 1. Endpoints HTTP

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/health` | GET | Vérifier que le bridge est actif |
| `/api/servers` | GET | Lister les 7 serveurs MCP disponibles |
| `/api/status` | GET | Voir quels serveurs sont connectés |
| `/api/:serverName/tools` | GET | Lister les outils d'un serveur |
| `/api/:serverName/call` | POST | Appeler un outil MCP |
| `/api/milo/generate-image` | POST | **Raccourci pour MILO** |

### 2. Serveurs MCP exposés

Le bridge expose **7 serveurs MCP** :

1. **nano-banana-pro** : Génération d'images 4K (MILO)
2. **veo3** : Génération vidéo Google VEO3
3. **elevenlabs** : Text-to-speech et voix
4. **google-ads** : Gestion campagnes Google Ads
5. **meta-ads** : Gestion campagnes Meta/Facebook
6. **gtm** : Google Tag Manager
7. **looker** : Analytics et reporting

### 3. Gestion des connexions

- **Lazy loading** : Les serveurs MCP ne se lancent que quand appelés
- **Connection pooling** : Réutilise les connexions actives
- **Auto-reconnect** : Relance automatiquement si un serveur crash
- **Graceful shutdown** : Ferme proprement toutes les connexions

---

## 📋 Ce qu'il vous reste à faire

### Étape 1 : Configurer l'environnement (5 min)

1. Ouvrez `/mcp-bridge/.env`
2. Remplacez les valeurs par vos vraies credentials :

```env
GOOGLE_CLOUD_PROJECT=votre-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

**Comment obtenir ces valeurs ?**
👉 Voir `SETUP_GUIDE.md` - Section "Étape 2 : Configuration de l'environnement"

### Étape 2 : Démarrer le Bridge (2 min)

```bash
cd /Users/azzedinezazai/Documents/Agency-Killer-V4/mcp-bridge
npm run dev
```

**Résultat attendu :**
```
INFO [BridgeServer] MCP Bridge Server Started
INFO [BridgeServer] Port: 3456
INFO [BridgeServer]   MILO Image: POST http://localhost:3456/api/milo/generate-image
```

### Étape 3 : Tester que ça marche (3 min)

```bash
# Test 1 : Santé
curl http://localhost:3456/health

# Test 2 : Liste des serveurs
curl http://localhost:3456/api/servers | jq

# Test 3 : Génération d'image
curl -X POST http://localhost:3456/api/milo/generate-image \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A cute robot", "resolution": "1024x1024"}'
```

Si le Test 3 retourne du base64 → **Tout est bon ! ✅**

### Étape 4 : Modifier le workflow MILO dans n8n (10 min)

👉 **Guide complet** : `SETUP_GUIDE.md` - Section "Étape 6 : Intégrer le Bridge dans le workflow MILO"

**En résumé :**

1. Supprimer le nœud ToolCode `nano_banana_pro` (celui qui causait l'erreur)
2. Ajouter un nœud **HTTP Request** :
   - URL : `http://localhost:3456/api/milo/generate-image`
   - Method : `POST`
   - Body :
     ```json
     {
       "prompt": "{{ $('Prepare Creative Context').item.json.prompt }}",
       "resolution": "2048x2048"
     }
     ```
3. Ajouter un nœud **Code** pour extraire `image_base64`
4. Tester le workflow

### Étape 5 : Test end-to-end (5 min)

1. Lancez une tâche MILO depuis le Board
2. Vérifiez que l'image est générée
3. 🎉 Célébrez !

---

## 📖 Documentation disponible

| Fichier | Contenu |
|---------|---------|
| `README.md` | Documentation technique du bridge |
| `SETUP_GUIDE.md` | **Guide d'installation pas à pas (SUIVEZ CELUI-CI)** |
| `MIGRATION_N8N_TO_NODEJS_BACKEND.md` | Plan de migration n8n → Node.js (futur) |

---

## 🐛 Si quelque chose ne marche pas

### Erreur : "Connection closed"

**Cause :** Variables Google Cloud non configurées

**Solution :**
```bash
# Vérifier que le fichier .env est bien configuré
cat /Users/azzedinezazai/Documents/Agency-Killer-V4/mcp-bridge/.env | grep GOOGLE_CLOUD
```

### Erreur : "fetch is not defined" dans n8n

**Cause :** Vous utilisez encore le ToolCode (au lieu du HTTP Request)

**Solution :** Suivre l'Étape 4 ci-dessus (modifier le workflow)

### Le bridge ne démarre pas

**Cause :** Port 3456 déjà utilisé

**Solution :**
```bash
# Tuer le processus
lsof -ti:3456 | xargs kill -9

# OU changer le port dans .env
PORT=3457
```

---

## 🎯 Résumé en 3 actions

```bash
# 1️⃣ Configurer les credentials Google Cloud
vim /Users/azzedinezazai/Documents/Agency-Killer-V4/mcp-bridge/.env

# 2️⃣ Démarrer le bridge
cd /Users/azzedinezazai/Documents/Agency-Killer-V4/mcp-bridge
npm run dev

# 3️⃣ Modifier le workflow MILO dans n8n
# → Remplacer ToolCode par HTTP Request vers http://localhost:3456/api/milo/generate-image
```

---

## 🚀 Prochaines étapes (après que MILO fonctionne)

1. **Intégrer VEO3** pour la génération vidéo
2. **Intégrer ElevenLabs** pour la génération audio
3. **Déployer le bridge en production** (pm2 ou Docker)
4. **Migration complète vers Node.js backend** (voir `MIGRATION_N8N_TO_NODEJS_BACKEND.md`)

---

## ✅ Checklist de Validation

Avant de dire que c'est terminé, vérifiez :

- [ ] Le bridge démarre sans erreur
- [ ] `/health` retourne `"status": "ok"`
- [ ] Test de génération d'image fonctionne (curl)
- [ ] Workflow MILO modifié dans n8n (HTTP Request au lieu de ToolCode)
- [ ] Test end-to-end : Lancer une tâche MILO depuis le Board → Image générée

---

## 💡 Rappel Important

**Le bridge DOIT tourner** pour que MILO puisse générer des images.

Deux options :

1. **Mode dev** : `npm run dev` (redémarre automatiquement si vous modifiez le code)
2. **Mode production** : `pm2 start dist/index.js --name mcp-bridge` (tourne en arrière-plan)

---

**Tout est prêt ! Il ne reste plus qu'à suivre le `SETUP_GUIDE.md` étape par étape.**

🚀 Une fois configuré, vous aurez enfin MILO qui fonctionne avec génération d'images 4K via Nano Banana Pro !

---

**Questions ? Problèmes ?**

1. Vérifiez les logs du bridge : `tail -f /tmp/bridge-test.log`
2. Lisez la section "Dépannage" du `SETUP_GUIDE.md`
3. Vérifiez que Google Cloud credentials sont bien configurées
