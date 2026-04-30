# 🚀 THE HIVE OS V5.0 - Agency Killer

**AI-Powered Marketing ERP with Multi-Agent Orchestration**

[![Status](https://img.shields.io/badge/Status-Production%20Ready-success)](https://github.com/doffymelo-a11y/agency-killer-v4)
[![Version](https://img.shields.io/badge/Version-5.0.0-blue)](https://github.com/doffymelo-a11y/agency-killer-v4)
[![License](https://img.shields.io/badge/License-Proprietary-red)](https://github.com/doffymelo-a11y/agency-killer-v4)

---

## 📋 Overview

**THE HIVE OS V5** est un **ERP Marketing complet** alimenté par **5 agents IA spécialisés** qui automatisent l'ensemble du cycle marketing digital, de l'analyse stratégique à la création de contenu social.

### 🎯 Vision

Remplacer une agence marketing complète (€10K/mois) par une équipe d'agents IA autonomes, orchestrés intelligemment, avec supervision humaine via système d'approbation intégré.

**Capacité cible :** 50-100 clients SaaS simultanés

---

## 🤖 Les 5 Agents IA

| Agent | Rôle | Spécialités | Skills |
|-------|------|-------------|--------|
| **🔵 SORA** | Data Analyst | Analytics, Tracking, KPI Analysis, Debugging | GA4, GTM, Meta Pixel, Google Ads Manager, SEO Audit |
| **🟣 LUNA** | Stratège Marketing | SEO, Content Strategy, Competitor Analysis, Planning | Keyword Research, SEO Audit, Content Calendar, Positioning |
| **🔴 MARCUS** | Expert Ads & Conversion | Paid Ads, Budget Allocation, Scaling, ROI | Meta Ads API, Google Ads API, Budget Optimizer, Testing Frameworks |
| **🟡 MILO** | Directeur Créatif | Copywriting, Image/Video Gen, Brand Voice | Video Ad Producer, Multi-Platform Adapter, Brand Voice Guardian |
| **🟢 DOFFY** | Social Media Manager | Content Planning, Post Creation, Scheduling | LinkedIn Posts, Instagram Reels, Hashtag Strategy, Engagement |

**Orchestration :** Routing intelligent basé sur l'intent du message utilisateur

---

## 🏗️ Architecture

### Frontend (2 apps React)
- **Cockpit** (port 5173) : App client pour end-users
- **Backoffice** (port 5174) : Dashboard super-admin

### Backend TypeScript
- **API Express** (port 3457) : REST API + orchestration agents
- **MCP Bridge** (port 3456) : Gateway vers 14 MCP servers

### Database & Auth
- **Supabase** : PostgreSQL + Row-Level Security + Realtime
- **38 migrations** appliquées (support, billing, social, analytics, GDPR)

### Stack AI
- **LLM** : Claude Opus 4.5 (Anthropic)
- **Vision** : Gemini Flash 2.0 (Google)
- **Image** : Stable Diffusion 3.5
- **Video** : Google VEO-3
- **Audio** : ElevenLabs

---

## 📁 Structure du Projet

```
Agency-Killer-V4/
├── backend/                     # Backend TypeScript (Express + Telegraf)
│   ├── src/
│   │   ├── index.ts            # Entry point
│   │   ├── routes/             # API routes (chat, genesis, analytics, support, telegram)
│   │   ├── services/           # Supabase, Anthropic, Telegram services
│   │   └── middleware/         # Auth, rate limit, validation
│   └── package.json
│
├── cockpit/                     # Frontend React (Client App)
│   ├── src/
│   │   ├── views/              # Pages (Board, Genesis, Analytics, Support, GDPR)
│   │   ├── components/         # UI components (onboarding, gdpr, empty-states, tooltips)
│   │   ├── services/           # API services
│   │   ├── lib/                # Supabase client
│   │   └── store/              # Zustand state management
│   └── supabase/migrations/    # 38 SQL migrations
│
├── backoffice/                  # Frontend React (Super Admin)
│   ├── src/
│   │   ├── views/              # Admin dashboard (6 tabs)
│   │   └── components/         # Admin components
│   └── package.json
│
├── mcp-bridge/                  # HTTP Gateway to MCP Servers
│   ├── src/
│   │   ├── index.ts            # Express server
│   │   ├── mcpClient.ts        # MCP stdio client
│   │   └── config.ts           # MCP servers registry
│   └── package.json
│
├── mcp-servers/                 # 14 MCP Servers
│   ├── google-ads-launcher/    # Google Ads campaign creation
│   ├── meta-ads-launcher/      # Meta Ads campaign creation
│   ├── seo-audit-server/       # SEO analysis
│   ├── gtm-server/             # Google Tag Manager
│   ├── ga4-server/             # Google Analytics 4
│   ├── image-generation-server/ # Stable Diffusion
│   ├── video-generation-server/ # Google VEO-3
│   ├── social-media-server/    # LinkedIn + Instagram posting
│   ├── cms-connector-server/   # WordPress/Webflow integration
│   └── ...
│
├── agents/skills/               # Agent skills documentation (150+ lignes chacun)
│   ├── milo/                   # 5 skills (video-ad-producer, multi-platform-adapter...)
│   └── marcus/                 # 5 skills (creative-testing-framework, scaling-playbook...)
│
├── tests/                       # Load tests + E2E tests
│   ├── load-test.yml           # Artillery config
│   ├── e2e-test.js             # 10 flows critiques
│   └── load-test-helpers.js    # Auth helpers
│
├── Roadmap:vision/
│   └── PRD_THE_HIVE_OS_V4.4.md # Product Requirements Document
│
├── DEPLOYMENT.md                # Guide de déploiement complet
└── README.md                    # Ce fichier
```

---

## 🚀 Quick Start (3 commandes)

### 1. Installer les dépendances

```bash
cd backend && npm install && cd ..
cd cockpit && npm install && cd ..
cd mcp-bridge && npm install && cd ..
```

### 2. Configurer les variables d'environnement

```bash
# Backend
cp backend/.env.example backend/.env
# Éditer backend/.env avec vos clés API (Supabase, Anthropic, Stripe, Telegram)

# Cockpit
cp cockpit/.env.example cockpit/.env
# Éditer cockpit/.env avec Supabase URL + Anon Key

# MCP Bridge
cp mcp-bridge/.env.example mcp-bridge/.env
```

### 3. Démarrer tous les services (4 terminaux)

```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: MCP Bridge
cd mcp-bridge && npm run dev

# Terminal 3: Cockpit
cd cockpit && npm run dev

# Terminal 4: Backoffice
cd backoffice && npm run dev
```

**URLs:**
- Cockpit: http://localhost:5173
- Backoffice: http://localhost:5174
- Backend API: http://localhost:3457
- MCP Bridge: http://localhost:3456

---

## 📊 Features Production-Ready

### ✅ Core Features (Phase A-E)
- [x] **Auth**: OAuth Google + Email/Password (Supabase Auth)
- [x] **Multi-tenant**: Isolation complète des données utilisateur (RLS)
- [x] **Genesis Flow**: Création projet guidée par IA
- [x] **Board**: Kanban/Table/Calendar avec drag & drop
- [x] **Chat**: Temps réel avec 5 agents IA spécialisés
- [x] **Shared Memory**: Mémoire collective partagée entre agents
- [x] **Files**: Upload/search/organize fichiers (Cloudinary)
- [x] **Analytics Hub**: Dashboard GA4/Meta Ads/Google Ads/GSC
- [x] **Billing**: Stripe Checkout + usage tracking + webhooks
- [x] **Support**: Système de tickets + AI triage + Telegram notifications
- [x] **Admin Dashboard**: 6 tabs (Overview, Users, Projects, Billing, Support, System)
- [x] **Social Media**: Doffy agent pour LinkedIn + Instagram + scheduling
- [x] **Onboarding**: Wizard 4 étapes + tooltips + empty states
- [x] **GDPR**: Cookie consent + export données + droit à l'oubli
- [x] **PDF Export**: Export rapports analytics en PDF

### 🤖 AI Features
- [x] 5 agents spécialisés avec skills enrichis (100-500 lignes chacun)
- [x] Orchestration intelligente basée sur l'intent
- [x] 14 MCP servers (63 tools)
- [x] Génération créatifs (images, vidéos, audio, textes)
- [x] Analyse performance temps réel
- [x] Optimisation budgétaire automatique
- [x] SEO audit & content planning
- [x] Social media post generation & scheduling

### 🛡️ Security & Compliance
- [x] Row-Level Security sur toutes les tables
- [x] Rate limiting (60 req/min par défaut)
- [x] HTTPS uniquement (production)
- [x] Secrets management (jamais dans le code)
- [x] Audit logs de toutes les actions critiques
- [x] GDPR compliant (cookies, export, suppression)
- [x] Telegram admin notifications pour tickets critiques

---

## 🧪 Tests & Validation

### TypeScript Check
```bash
cd backend && npx tsc --noEmit      # 0 errors
cd cockpit && npx tsc --noEmit      # 0 errors
cd mcp-bridge && npx tsc --noEmit   # 0 errors
```

### Build Production
```bash
cd cockpit && npm run build         # ✓ Build réussi (3.09 MB)
```

### Load Tests
```bash
cd tests
npm install
npx artillery run load-test.yml
# → P50 < 2s, P95 < 5s, errors < 1%
```

### End-to-End Tests
```bash
cd tests
node e2e-test.js
# → 10/10 flows critiques (Auth, Genesis, Chat, Board, Files, Analytics, Admin, Security, Rate Limit, Billing)
```

### Healthchecks
```bash
curl http://localhost:3457/health   # Backend
curl http://localhost:3456/health   # MCP Bridge
```

---

## 📖 Documentation

| Document | Description | Lien |
|----------|-------------|------|
| **DEPLOYMENT.md** | Guide déploiement production complet | [DEPLOYMENT.md](./DEPLOYMENT.md) |
| **PRD V4.4** | Product Requirements Document | [PRD_THE_HIVE_OS_V4.4.md](./Roadmap:vision/PRD_THE_HIVE_OS_V4.4.md) |
| **CLAUDE.md** | Plan stratégique Web Intelligence + Backend Migration | [CLAUDE.md](./CLAUDE.md) |
| **Phase Reports** | Rapports détaillés de chaque phase de développement | `/backend/*.md` |

---

## 🔐 Security Best Practices

1. **Variables d'environnement** : Jamais committées dans Git
2. **Row-Level Security** : Toutes les tables protégées par RLS
3. **Rate Limiting** : 60 requêtes/minute par défaut (configurable)
4. **HTTPS Only** : Redirection automatique en production
5. **Tokens expiration** : 1 heure (Supabase Auth)
6. **Webhook signatures** : Vérification Stripe + Telegram
7. **GDPR Compliance** : Cookie consent + export + suppression
8. **Audit Logs** : Tracking de toutes les actions critiques

---

## 📈 Roadmap

### ✅ Phase A-E (Terminées)
- Phase A: Security + Console cleanup
- Phase B: Analytics Hub (données réelles)
- Phase C: Files + Stripe billing
- Phase D: Doffy Social Media (LinkedIn + Instagram)
- Phase E: Skills enrichissement + Onboarding + RGPD + PDF Export

### 🔄 Phase F (En cours)
- Load testing avec Artillery
- End-to-end tests (10 flows)
- Documentation déploiement
- Validation finale

### 🔮 Phases Futures
- **Web Intelligence MCP Server** : Audit landing pages, vérification pixels, analyse concurrentielle (Playwright + Cheerio)
- **Real-time Collaboration** : Multi-users dans un projet
- **Workspaces** : Équipes multi-utilisateurs
- **API Publique** : Pour intégrations tierces
- **White-label** : Version personnalisée pour agences

---

## 🛠️ Tech Stack

**Frontend** : React 19 • TypeScript • Vite 7 • Tailwind CSS 4 • Zustand • Framer Motion
**Backend** : Node.js 20 • Express • TypeScript • Telegraf (Telegram Bot)
**Database** : PostgreSQL (Supabase) • Realtime • Row-Level Security
**AI** : Claude Opus 4.5 (Anthropic) • Gemini Flash 2.0 (Google) • Stable Diffusion 3.5 • VEO-3
**Orchestration** : MCP (Model Context Protocol) • 14 MCP Servers • 63 Tools
**Billing** : Stripe Checkout • Webhooks • Usage tracking
**Infrastructure** : Supabase (Database + Auth + Realtime) • Cloudinary (Files) • Vercel/Netlify (Frontend)

---

## 📝 License

**Proprietary** - All rights reserved © 2026 The Hive OS

---

## 👥 Credits

**Founder & Lead Developer** : Azzedine Zazai
**AI Assistant** : Claude Opus 4.5 (Anthropic)
**Stack Powered By** : Supabase • Anthropic • Google Cloud • Stripe

---

## 🔗 Links

- **Documentation** : [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Issues** : Create issue on GitHub
- **Support** : support@thehive.com

---

**Last Updated** : 29 avril 2026
**Version** : 5.0.0
**Status** : ✅ Production Ready (50 clients target)
