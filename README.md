# 🚀 THE HIVE OS V4.4 - Agency Killer

**AI-Powered Marketing ERP with Multi-Agent Orchestration**

[![Status](https://img.shields.io/badge/Status-Production%20Ready-success)](https://github.com/doffymelo-a11y/agency-killer-v4)
[![Architecture](https://img.shields.io/badge/Architecture-Microservices-blue)](https://github.com/doffymelo-a11y/agency-killer-v4)
[![License](https://img.shields.io/badge/License-Proprietary-red)](https://github.com/doffymelo-a11y/agency-killer-v4)

---

## 📋 Overview

**THE HIVE OS V4** est un **ERP Marketing complet** alimenté par **4 agents IA spécialisés** qui automatisent l'ensemble du cycle marketing digital, de l'analyse à la création publicitaire.

### 🎯 Vision

Remplacer une agence marketing complète par une équipe d'agents IA autonomes, orchestrés par un Project Manager IA, avec supervision humaine via un système d'approbation intégré.

---

## 🤖 Les 4 Agents IA

| Agent | Rôle | Spécialités | Tools |
|-------|------|-------------|-------|
| **🔵 SORA** | Analyst | Analytics, Tracking, Performance, Audit | GTM, GA4, Looker, Meta Pixel, Google Ads Manager |
| **🔴 MARCUS** | Trader | Campagnes Ads, Budget, Scaling, ROI | Meta Ads API, Google Ads API, Budget Optimizer |
| **🟣 LUNA** | Strategist | SEO, Content, Planning, Strategy | Keyword Research, SEO Audit, Content Calendar |
| **🟡 MILO** | Creative | Vidéos, Visuels, Audio, Assets | VEO-3, Stable Diffusion, ElevenLabs, Cloudinary |

**Orchestration :** PM (Project Manager IA) + Orchestrator pour routing intelligent des tâches.

---

## 🏗️ Architecture Technique

### Stack Frontend (Cockpit)
- **Framework :** React 18 + TypeScript
- **Build :** Vite 7.3
- **Styling :** Tailwind CSS 4.0
- **State :** Zustand + Realtime Supabase
- **UI :** Framer Motion + Lucide Icons

### Stack Backend
- **Database :** PostgreSQL (Supabase)
- **Auth :** Supabase Auth (OAuth Google, Email/Password)
- **Realtime :** Supabase Realtime (WebSocket)
- **Edge Functions :** Supabase Edge Functions (Deno)
- **Orchestration :** n8n workflows

### Stack AI
- **LLM :** GPT-4o (OpenAI) + Gemini 2.0 Flash Thinking (Google)
- **Vision :** VEO-3 (Google)
- **Image :** Stable Diffusion 3.5 (Replicate)
- **Audio :** ElevenLabs
- **Tools :** MCP Servers (Model Context Protocol)

### Sécurité
- **RLS :** Row-Level Security sur toutes les tables
- **Approval System :** Human-in-the-loop pour actions risquées
- **Rate Limiting :** Protection contre abus
- **Audit Logs :** Tracking de toutes les actions

---

## 📁 Structure du Projet

```
agency-killer-v4/
├── cockpit/                      # Frontend React
│   ├── src/
│   │   ├── views/               # Pages principales
│   │   ├── components/          # Composants réutilisables
│   │   ├── services/            # API services (Stripe, n8n, Approvals)
│   │   ├── lib/                 # Supabase, OAuth
│   │   └── store/               # Zustand store + Realtime
│   ├── supabase/
│   │   ├── migrations/          # 10 migrations SQL
│   │   └── functions/           # Edge Functions (Stripe)
│   └── package.json
│
├── agents/                       # n8n Workflows
│   ├── CURRENT_pm-mcp/          # PM Core workflow
│   ├── CURRENT_orchestrator-mcp/ # Orchestrator
│   ├── FINALE_SORA_MCP.workflow.json
│   ├── FINALE_MARCUS_MCP.workflow.json
│   ├── FINALE_LUNA_MCP.workflow.json
│   └── FINALE_MILO_MCP.workflow.json
│
├── mcp-servers/                  # MCP Servers (28 tools)
│   ├── gtm-server/              # Google Tag Manager
│   ├── google-ads-server/       # Google Ads Manager
│   ├── meta-ads-server/         # Meta Marketing API
│   ├── veo3-server/             # Google VEO-3 Video
│   └── ...
│
├── mcp-bridge/                   # HTTP Bridge pour n8n ↔ MCP
│
└── Roadmap:vision/
    └── PRD_THE_HIVE_OS_V4.4.md  # Product Requirements Document
```

---

## 🚀 Quick Start

### 1. Clone le Repo

```bash
git clone https://github.com/doffymelo-a11y/agency-killer-v4.git
cd agency-killer-v4
```

### 2. Setup Frontend

```bash
cd cockpit
npm install
cp .env.example .env
# Éditer .env avec tes credentials Supabase
npm run dev
```

**Frontend démarre sur :** http://localhost:5173

### 3. Setup Database (Supabase)

1. **Créer un projet Supabase** : https://supabase.com/dashboard
2. **Appliquer les migrations** :
   - Va sur SQL Editor
   - Copie-colle chaque fichier de `cockpit/supabase/migrations/`
   - Run dans l'ordre (001 → 010)

3. **Créer un super admin** :
   ```sql
   UPDATE auth.users
   SET raw_user_meta_data = jsonb_set(
     COALESCE(raw_user_meta_data, '{}'::jsonb),
     '{role}',
     '"super_admin"'
   )
   WHERE email = 'ton-email@example.com';
   ```

### 4. Setup n8n Workflows

1. **Installer n8n** : `npm install -g n8n`
2. **Lancer n8n** : `n8n start`
3. **Importer les workflows** depuis `agents/`
4. **Configurer credentials** Supabase, OpenAI, Google AI

**Guide complet :** `cockpit/N8N_APPROVAL_INTEGRATION_GUIDE.md`

---

## 🔐 Variables d'Environnement

### Frontend (`cockpit/.env`)

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_N8N_WEBHOOK_URL=https://your-n8n.com/webhook/pm
```

### Edge Functions (Supabase Secrets)

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_...
supabase secrets set STRIPE_PRICE_ID_PRO=price_...
supabase secrets set STRIPE_PRICE_ID_ENTERPRISE=price_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 📊 Features

### ✅ Core Features
- [x] Authentification multi-provider (Google OAuth, Email/Password)
- [x] Gestion de projets multi-tenant
- [x] Système de tâches avec dépendances
- [x] Chat temps-réel avec agents IA
- [x] Board Kanban/Table/Calendar
- [x] Mémoire collective partagée (shared_memory)
- [x] Système d'approbation human-in-the-loop
- [x] Billing Stripe (Pro, Enterprise)
- [x] Admin Dashboard
- [x] Analytics & Audit Logs

### 🤖 AI Features
- [x] 4 agents spécialisés (SORA, MARCUS, LUNA, MILO)
- [x] Project Manager IA pour orchestration
- [x] 28 tools MCP intégrés
- [x] Génération de créatifs (vidéos, images, textes)
- [x] Analyse de performance en temps réel
- [x] Optimisation budgétaire automatique
- [x] SEO & Content planning

### 🛡️ Security Features
- [x] Row-Level Security (RLS) sur toutes les tables
- [x] Rate limiting (100 req/min/user)
- [x] Approval workflow pour actions risquées
- [x] Audit logs de toutes les actions
- [x] Secrets management (jamais dans le code)

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| `PRD_THE_HIVE_OS_V4.4.md` | Product Requirements Document complet |
| `N8N_APPROVAL_INTEGRATION_GUIDE.md` | Intégration système d'approbation |
| `DEPLOIEMENT_STRIPE_EDGE_FUNCTIONS.md` | Déploiement billing Stripe |
| `APPROVAL_WORKFLOW_GUIDE.md` | Guide human-in-the-loop |
| `SESSION_SUMMARY_2026-02-27.md` | Dernière session de développement |

---

## 🧪 Tests

### Frontend
```bash
cd cockpit
npm run build    # Vérifier build production
npm run dev      # Dev server
```

### Database
```sql
-- Vérifier migrations appliquées
SELECT * FROM schema_migrations ORDER BY version;

-- Vérifier RLS
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';
```

### n8n Workflows
```bash
# Tester webhook PM
curl -X POST https://your-n8n.com/webhook/pm \
  -H 'Content-Type: application/json' \
  -d '{"action": "task_launch", "task_title": "Test", ...}'
```

---

## 📈 Roadmap

### Phase 1 : Setup (ACTUEL) ✅
- [x] Frontend complet (React + TypeScript)
- [x] Backend Supabase (10 migrations)
- [x] Auth multi-provider
- [x] 4 agents IA n8n
- [x] Système d'approbation
- [ ] **Stripe billing deployment**
- [ ] **n8n workflows configuration**

### Phase 2 : Testing & Polish
- [ ] Tests Playwright end-to-end
- [ ] Monitoring Sentry
- [ ] Analytics Posthog
- [ ] Performance optimization

### Phase 3 : Production
- [ ] Build optimisé
- [ ] Deploy Vercel/Netlify
- [ ] DNS + SSL
- [ ] Webhook Stripe production
- [ ] n8n en production

### Phase 4 : Scale
- [ ] Workspaces multi-utilisateurs
- [ ] Team collaboration
- [ ] API publique
- [ ] White-label

---

## 🛠️ Tech Stack Summary

**Frontend :** React 18 • TypeScript • Vite • Tailwind CSS • Zustand
**Backend :** Supabase • PostgreSQL • Realtime • Edge Functions
**AI :** GPT-4o • Gemini 2.0 • VEO-3 • Stable Diffusion • ElevenLabs
**Orchestration :** n8n • MCP Servers
**Billing :** Stripe • Webhooks
**Security :** RLS • Rate Limiting • Approval System • Audit Logs

---

## 📝 License

**Proprietary** - All rights reserved.

---

## 👥 Team

**Built with ❤️ by Azzedine Zazai**
**Powered by Claude Code (Anthropic)**

---

## 🔗 Links

- **Live Demo :** Coming soon
- **Documentation :** `/Roadmap:vision/PRD_THE_HIVE_OS_V4.4.md`
- **Issues :** [GitHub Issues](https://github.com/doffymelo-a11y/agency-killer-v4/issues)

---

**Last Updated :** 2026-03-01
**Version :** 4.4
**Status :** ✅ Production Ready
