# THE HIVE OS V5 - Guide de Déploiement

**Version:** 5.0.0
**Date:** Avril 2026
**Statut:** Production-ready pour 50 clients

---

## Prérequis

### Logiciels Requis

- **Node.js** 20.x ou supérieur
- **npm** 10.x ou supérieur
- **Git** (pour cloner le repo)
- **PostgreSQL** 15+ (fourni par Supabase)

### Comptes Cloud Requis

- **Supabase** : Projet créé (Database + Auth + Realtime)
- **Stripe** : Compte avec clés API (test + production)
- **Anthropic** : Clé API Claude (ou Google Cloud pour Vertex AI)
- **Cloudinary** : Compte pour upload images/médias
- **Telegram** : Bot créé via @BotFather (optionnel, pour support)

---

## Variables d'Environnement

### 1. Backend (`/backend/.env`)

```bash
# === Supabase ===
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# === Anthropic Claude API ===
ANTHROPIC_API_KEY=sk-ant-api03-...

# === Google Cloud (alternative to Anthropic) ===
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json

# === Stripe ===
STRIPE_SECRET_KEY=sk_test_51... # ou sk_live_51... en production
STRIPE_WEBHOOK_SECRET=whsec_...

# === Cloudinary ===
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abc123...

# === Telegram (Support System) ===
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_ADMIN_CHAT_ID=123456789

# === Server Config ===
PORT=3457
NODE_ENV=production # ou 'development'
BACKEND_URL=http://localhost:3457 # ou votre domaine en prod

# === Rate Limiting ===
RATE_LIMIT_WINDOW_MS=60000 # 1 minute
RATE_LIMIT_MAX_REQUESTS=60 # 60 requests/min

# === Test User (pour load tests) ===
TEST_USER_EMAIL=loadtest@thehive.com
TEST_USER_PASSWORD=LoadTest2026!
TEST_PROJECT_ID=optional-uuid
```

### 2. Frontend Cockpit (`/cockpit/.env`)

```bash
# === Backend API ===
VITE_BACKEND_URL=http://localhost:3457
# En production : https://api.thehive.com

# === Supabase (Frontend) ===
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# === Stripe (Public Key) ===
VITE_STRIPE_PUBLIC_KEY=pk_test_51... # ou pk_live_51... en production

# === Environment ===
VITE_ENV=production # ou 'development'
```

### 3. Frontend Backoffice (`/backoffice/.env`)

```bash
# === Backend API ===
VITE_BACKEND_URL=http://localhost:3457

# === Supabase ===
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# === Environment ===
VITE_ENV=production
```

### 4. MCP Bridge (`/mcp-bridge/.env`)

```bash
# === Server Config ===
PORT=3456
NODE_ENV=production

# === Google Cloud (pour MCP servers nécessitant GCP) ===
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json

# === Supabase (pour certains MCP servers) ===
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Installation

### 1. Cloner le Repo

```bash
git clone https://github.com/votre-org/agency-killer-v4.git
cd agency-killer-v4
```

### 2. Installer les Dépendances

```bash
# Backend
cd backend
npm install
cd ..

# MCP Bridge
cd mcp-bridge
npm install
cd ..

# Frontend Cockpit
cd cockpit
npm install
cd ..

# Frontend Backoffice
cd backoffice
npm install
cd ..
```

### 3. Configurer les Variables d'Environnement

Copier les fichiers `.env.example` et remplir les valeurs :

```bash
cp backend/.env.example backend/.env
cp cockpit/.env.example cockpit/.env
cp backoffice/.env.example backoffice/.env
cp mcp-bridge/.env.example mcp-bridge/.env
```

Éditer chaque fichier `.env` avec vos vraies clés API.

### 4. Appliquer les Migrations Supabase

```bash
cd cockpit/supabase/migrations
# Appliquer toutes les migrations dans l'ordre (001 → 038)
# Via Supabase CLI ou Dashboard > SQL Editor
```

---

## Démarrage des Services

### Mode Développement

Ouvrir **4 terminaux** :

**Terminal 1 : Backend**
```bash
cd backend
npm run dev
# ✓ Backend running on http://localhost:3457
```

**Terminal 2 : MCP Bridge**
```bash
cd mcp-bridge
npm run dev
# ✓ MCP Bridge running on http://localhost:3456
```

**Terminal 3 : Frontend Cockpit**
```bash
cd cockpit
npm run dev
# ✓ Cockpit running on http://localhost:5173
```

**Terminal 4 : Frontend Backoffice**
```bash
cd backoffice
npm run dev
# ✓ Backoffice running on http://localhost:5174
```

### Mode Production

**1. Build les frontends :**

```bash
# Cockpit
cd cockpit
npm run build
# → dist/

# Backoffice
cd backoffice
npm run build
# → dist/
```

**2. Build le backend :**

```bash
cd backend
npm run build
# → dist/
```

**3. Démarrer avec PM2 (ou Docker):**

```bash
# Backend
pm2 start backend/dist/index.js --name hive-backend

# MCP Bridge
pm2 start mcp-bridge/dist/index.js --name hive-mcp-bridge

# Servir les frontends avec Nginx ou Vercel
```

---

## Healthchecks

Vérifier que tous les services sont UP :

```bash
# Backend
curl http://localhost:3457/health
# → {"status":"ok","uptime":123.45,"version":"5.0.0"}

# MCP Bridge
curl http://localhost:3456/health
# → {"status":"ok","mcp_servers":14}

# Frontend Cockpit
curl http://localhost:5173
# → HTML page

# Frontend Backoffice
curl http://localhost:5174
# → HTML page
```

---

## Procédure de Mise à Jour

### 1. Récupérer les Dernières Modifications

```bash
git pull origin main
```

### 2. Mettre à Jour les Dépendances

```bash
cd backend && npm install && cd ..
cd mcp-bridge && npm install && cd ..
cd cockpit && npm install && cd ..
cd backoffice && npm install && cd ..
```

### 3. Appliquer les Nouvelles Migrations

```bash
# Vérifier les nouveaux fichiers dans cockpit/supabase/migrations/
# Appliquer via Supabase Dashboard ou CLI
```

### 4. Rebuild et Redémarrer

```bash
# Backend
cd backend
npm run build
pm2 restart hive-backend

# MCP Bridge
cd mcp-bridge
npm run build
pm2 restart hive-mcp-bridge

# Frontends
cd cockpit && npm run build && cd ..
cd backoffice && npm run build && cd ..
```

---

## Tests

### Tests TypeScript

```bash
# Backend
cd backend
npx tsc --noEmit
# → 0 errors

# Cockpit
cd cockpit
npx tsc --noEmit && npm run build
# → 0 errors, build success

# MCP Bridge
cd mcp-bridge
npx tsc --noEmit
# → 0 errors
```

### Load Tests

```bash
cd tests
npm install
npx artillery run load-test.yml
# → P50 < 2s, P95 < 5s, errors < 1%
```

### Tests End-to-End

```bash
cd tests
node e2e-test.js
# → 10/10 tests passed
```

---

## Contacts Support

### Équipe Technique

- **Lead Backend** : [backend@thehive.com](mailto:backend@thehive.com)
- **Lead Frontend** : [frontend@thehive.com](mailto:frontend@thehive.com)
- **DevOps** : [devops@thehive.com](mailto:devops@thehive.com)

### Incidents Production

- **Urgence (24/7)** : +33 1 23 45 67 89
- **Telegram** : @thehive_support_bot
- **Slack** : #hive-os-prod-alerts

### Documentation

- **PRD Complet** : `/Roadmap:vision/PRD_THE_HIVE_OS_V4.4.md`
- **Architecture** : Voir README.md racine
- **API Reference** : `/backend/API_REFERENCE.md` (à créer)

---

## Troubleshooting Commun

### Backend ne démarre pas

**Erreur** : `ECONNREFUSED` ou `Database connection failed`

**Solution** :
1. Vérifier que `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont corrects
2. Tester la connexion : `curl $SUPABASE_URL/rest/v1/`
3. Vérifier les RLS policies dans Supabase Dashboard

### MCP Bridge timeout

**Erreur** : `MCP server 'seo-audit' timeout`

**Solution** :
1. Vérifier que le MCP server démarre correctement
2. Augmenter `MCP_TIMEOUT_MS` dans mcp-bridge/.env
3. Vérifier les logs : `pm2 logs hive-mcp-bridge`

### Frontend 401 Unauthorized

**Erreur** : Toutes les requêtes API retournent 401

**Solution** :
1. Vérifier que `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` matchent le backend
2. Clear localStorage : `localStorage.clear()`
3. Re-login via `/login`

### Stripe webhook failed

**Erreur** : Webhook signature verification failed

**Solution** :
1. Vérifier que `STRIPE_WEBHOOK_SECRET` est correct (visible dans Stripe Dashboard)
2. Tester avec Stripe CLI : `stripe listen --forward-to localhost:3457/api/stripe/webhook`

---

## Architecture Production

```
┌─────────────────┐
│  Cloudflare CDN │ (SSL + DDoS protection)
└────────┬────────┘
         │
    ┌────▼────────────────┐
    │   Load Balancer     │ (Nginx/HAProxy)
    └────┬────────────────┘
         │
    ┌────▼─────────────────────────────┐
    │                                  │
┌───▼────┐  ┌────────┐  ┌──────────┐ │
│Frontend│  │ Backend│  │MCP Bridge│ │
│Cockpit │  │(Node.js│  │(Node.js) │ │
│(Vite)  │  │Express)│  │          │ │
└────────┘  └───┬────┘  └────┬─────┘ │
                │             │       │
            ┌───▼─────────────▼───┐   │
            │  Supabase (Postgres)│   │
            │  + Auth + Realtime  │   │
            └────────────────────┘   │
                                     │
            ┌────────────────────┐   │
            │  External APIs     │   │
            │  - Anthropic Claude│   │
            │  - Stripe          │   │
            │  - Google Cloud    │   │
            │  - Cloudinary      │   │
            └────────────────────┘   │
                                     │
└─────────────────────────────────────┘
```

---

**Dernière mise à jour** : 29 avril 2026
**Prochaine révision** : Après chaque release majeure
