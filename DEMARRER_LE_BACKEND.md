# 🚀 GUIDE: Démarrer le Backend TypeScript

**Problème actuel**: `ERR_CONNECTION_REFUSED` quand vous lancez une tâche
**Cause**: Le backend TypeScript n'est pas démarré
**Solution**: Suivre ce guide pour démarrer le backend

---

## Étapes de Démarrage

### 1. Ouvrir un nouveau terminal

Gardez votre terminal frontend actif, ouvrez un NOUVEAU terminal.

### 2. Aller dans le dossier backend

```bash
cd /Users/azzedinezazai/Documents/Agency-Killer-V4/backend
```

### 3. Vérifier que les dépendances sont installées

```bash
npm install
```

### 4. Créer le fichier .env

Si le fichier `.env` n'existe pas, créez-le avec ce contenu :

```env
# Supabase
SUPABASE_URL=https://hwiyvpfaolamagchqwsa.supabase.co
SUPABASE_ANON_KEY=<votre_clé_anon>
SUPABASE_SERVICE_ROLE_KEY=<votre_clé_service_role>

# Claude API (Anthropic)
ANTHROPIC_API_KEY=<votre_clé_anthropic>

# Port du serveur
PORT=3457
```

**⚠️ IMPORTANT**: Remplacez les valeurs `<votre_clé_*>` par vos vraies clés.

### 5. Démarrer le backend en mode développement

```bash
npm run dev
```

Vous devriez voir :

```
🚀 Backend TypeScript démarré sur http://localhost:3457
✅ Health check: /health
✅ API endpoints:
   - POST /api/chat
   - POST /api/genesis
   - POST /api/analytics
```

---

## Vérification

### Test 1: Health Check

Ouvrez un navigateur et allez sur : http://localhost:3457/health

Vous devriez voir :

```json
{
  "status": "healthy",
  "timestamp": "2026-03-16T..."
}
```

### Test 2: Lancer une tâche

1. Retournez sur le frontend : http://localhost:5173
2. Cliquez sur un projet
3. Lancez une tâche
4. Vérifiez que le chat s'ouvre et que Doffy répond

---

## En Cas de Problème

### Erreur: "Cannot find module"

```bash
cd backend
npm install
```

### Erreur: "Port 3457 already in use"

Tuez le processus qui utilise le port :

```bash
lsof -ti:3457 | xargs kill -9
npm run dev
```

### Erreur: "ANTHROPIC_API_KEY is required"

Vérifiez votre fichier `.env` et ajoutez votre clé API Anthropic.

---

## Prochaines Étapes

Une fois le backend démarré :

1. ✅ Le frontend peut envoyer des messages aux agents
2. ✅ Doffy peut répondre aux tâches social media
3. ✅ Les write-back commands fonctionnent
4. ✅ La mémoire partagée fonctionne

---

**Note**: Le backend DOIT rester actif pendant que vous utilisez l'application.
