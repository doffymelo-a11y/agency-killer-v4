# "The Monday Killer" — ERP Marketing Autonome propulsé par l'IA

**Version :** 5.0
**Dernière mise à jour :** 2026-03-01
**Destinataire :** Claude Code (Terminal CLI)
**Rôle :** Ce document est ton UNIQUE guide. Chaque tâche, chaque décision architecturale, chaque ligne de code doit s'y référer.

---

## TABLE DES MATIÈRES

1. Contexte & Vision
2. Architecture Existante
3. Conventions & Patterns
4. Spécifications Fonctionnelles
5. Roadmap Phasée
6. Contrats API (Frontend ↔ Backend)
7. Sécurité
8. Tests & Vérification
9. Glossaire

---

## 1. CONTEXTE & VISION

### 1.1 Le Problème

Les agences marketing jonglent entre 10+ outils (Monday.com, Google Analytics, Canva, Google Ads Manager, Notion, Slack). Chaque outil est un silo. Aucune intelligence transversale. Aucune mémoire partagée entre les expertises.

### 1.2 La Solution — The Hive OS

Un **ERP Marketing Autonome** où 4 agents IA spécialisés (Sora, Luna, Marcus, Milo) collaborent via une mémoire collective pour piloter, exécuter et optimiser des campagnes marketing — le tout dans une seule interface.

### 1.3 La Rupture V3 → V4

- **V3 (Chat-Based)** : L'utilisateur demande, l'IA répond. Mémoire = historique linéaire.
- **V4 (State-Based)** : L'IA propose les tâches, les exécute, et écrit dans l'état du projet. Les agents lisent le travail des autres et s'adaptent automatiquement.

### 1.4 Positionnement Concurrentiel

| Concurrent | The Hive fait mieux |
|---|---|
| Monday.com | Board + IA qui exécute les tâches (pas juste les organise) |
| Google Analytics | IA qui interprète les données, pas juste les affiche |
| Notion AI | Mémoire collective entre agents, pas un assistant générique |
| Agence humaine | 4 experts IA disponibles 24/7, mémoire parfaite |

### 1.5 Objectif Business

- **Court terme :** Outil mono-utilisateur fonctionnel (pas d'auth).
- **Long terme :** Produit SaaS multi-tenant.

Le code DOIT être structuré pour l'ajout futur de multi-tenancy (isolation par `project_id` → futur `user_id + project_id`).

---

## 2. ARCHITECTURE EXISTANTE

### 2.1 Stack Technique

| Couche | Technologie |
|---|---|
| Frontend | React 19 + Vite 7 + TypeScript 5.9 + Tailwind 4 |
| State | Zustand 5 (devtools + subscribeWithSelector) |
| BDD | Supabase (PostgreSQL + Realtime) |
| Backend | n8n self-hosted (Hostinger VPS) |
| IA | OpenAI / Claude via n8n |
| APIs réelles | MCP Servers (GA4, Meta Ads, Google Ads, GTM, Looker) |
| UI Libraries | framer-motion, lucide-react, @tanstack/react-table, @dnd-kit, @fullcalendar, react-markdown, recharts, html2pdf.js |

### 2.2 Structure des Fichiers

```
/cockpit/src/
├── App.tsx                              # Router (BrowserRouter)
├── main.tsx                             # Entry point
├── index.css                            # Styles Tailwind + design system
├── views/
│   ├── GenesisView.tsx                  # Wizard création projet ✅
│   ├── BoardView.tsx                    # Dashboard Table/Kanban/Calendar ✅ (42K — à refactorer)
│   ├── ChatView.tsx                     # Chat agents ✅
│   ├── AnalyticsView.tsx                # Analytics Hub 🚧 (données locales seulement)
│   ├── FilesView.tsx                    # Files & Assets 🚧 (extrait des tasks)
│   └── IntegrationsView.tsx             # OAuth handler ✅
├── components/
│   ├── layout/
│   │   ├── MainLayout.tsx               # 3 colonnes: TeamDock | Chat | TheDeck
│   │   ├── TeamDock.tsx                 # Sidebar agents gauche (80px)
│   │   └── TheDeck.tsx                  # Panneau droit (380px, rétractable)
│   ├── chat/
│   │   ├── ChatPanel.tsx                # Container chat
│   │   ├── ChatInput.tsx                # Saisie + upload image
│   │   ├── ChatMessage.tsx              # Bulle message (markdown)
│   │   └── UIComponentRenderer.tsx      # Rendu widgets backend (32K)
│   ├── deck/
│   │   └── AgentHelp.tsx                # Instructions par agent
│   └── oauth/
│       └── OAuthCallback.tsx            # Retour OAuth
├── store/
│   └── useHiveStore.ts                  # Store Zustand + Supabase Realtime (982L)
├── services/
│   └── n8n.ts                           # Communication backend PM (781L)
├── lib/
│   ├── supabase.ts                      # Client Supabase
│   ├── oauth.ts                         # URLs OAuth
│   └── wizard-config.ts                 # Config wizard Genesis
└── types/
    ├── index.ts                         # Types principaux (415L)
    └── database.ts                      # Types Supabase auto-générés

/agents/
├── CURRENT_pm-mcp/                      # PM Central Brain
├── CURRENT_orchestrator-mcp/            # Orchestrator (routeur)
├── CURRENT_analyst-mcp/                 # Sora
├── CURRENT_strategist-mcp/             # Luna
├── CURRENT_trader-mcp/                  # Marcus
└── CURRENT_Creative-Subworkflows-v6/    # Milo

/mcp-servers/
├── google-ads-server/                   # 7 fonctions (lecture)
├── meta-ads-server/                     # 7 fonctions (lecture)
├── gtm-server/                          # 7 fonctions
└── looker-server/                       # 7 fonctions
```

### 2.3 Routing (App.tsx)

| Route | Vue | État |
|---|---|---|
| `/genesis` | GenesisView | ✅ |
| `/board/:projectId` | BoardView | ✅ |
| `/chat/:projectId` | ChatView | ✅ |
| `/chat/:projectId/:taskId` | ChatView (task context) | ✅ |
| `/files/:projectId` | FilesView | 🚧 |
| `/analytics/:projectId` | AnalyticsView | 🚧 |
| `/integrations/:projectId` | IntegrationsView | ✅ |
| `/` | Redirect → genesis ou board | ✅ |

### 2.4 Architecture Backend (n8n)

```
Frontend → PM_WEBHOOK_URL (POST) → PM Central Brain
                                        ↓
                                   Lit project_memory (Supabase)
                                        ↓
                                   Route vers Orchestrator
                                        ↓
                              ┌────┬────┼────┬────┐
                              Luna Milo Marcus Sora
                              ↓    ↓    ↓     ↓
                           Réponse + memory_contribution
                                        ↓
                              PM écrit dans project_memory
                                        ↓
                              Retour Frontend + write_back
```

**URL PM :** `https://n8n.srv1234539.hstgr.cloud/webhook/pm-v4-entry`
**Actions PM :** `genesis` | `task_launch` | `quick_action` | `write_back` | `analytics_fetch` (nouveau)

### 2.5 Base de Données (Supabase)

**Tables existantes :**

```sql
-- PROJECTS
projects (id UUID PK, name, scope ENUM, status ENUM, current_phase,
          state_flags JSONB, metadata JSONB, created_at, updated_at)

-- TASKS
tasks (id UUID PK, project_id FK, title, description, assignee ENUM,
       phase ENUM, status ENUM, context_questions TEXT[], user_inputs JSONB,
       estimated_hours INT, due_date, depends_on TEXT[], deliverable_url,
       deliverable_type ENUM, created_at, started_at, completed_at)

-- MÉMOIRE COLLECTIVE
project_memory (id UUID PK, project_id FK, task_id FK, agent_id, action ENUM,
                summary, key_findings JSONB, deliverables JSONB,
                recommendations JSONB, context_snapshot JSONB,
                session_id, created_at)

-- SESSIONS CHAT
chat_sessions (id UUID PK, project_id FK, mode ENUM, linked_task_id,
               injected_context JSONB, messages JSONB)

-- INTÉGRATIONS
user_integrations (id, project_id FK, user_id, integration_type, status,
                   credentials JSONB, connected_at, last_sync_at, expires_at)
```

### 2.6 Système d'Agents

| Agent | Rôle | Backend ID | Couleur | Expertise |
|---|---|---|---|---|
| Sora | Data Analyst | `analyst` | Cyan #06B6D4 | GA4, GTM, KPI, Tracking, Debugging |
| Luna | Stratège Marketing | `strategist` | Violet #8B5CF6 | SEO, Keywords, Content Strategy, Competitors |
| Marcus | Expert Ads | `trader` | Amber #F59E0B | Paid Ads, Budget, Scaling, Campaign Optim |
| Milo | Directeur Créatif | `creative` | Rose #EC4899 | Copywriting, Image Gen, Video Gen, Brainstorm |
| Felix | Orchestrateur | `orchestrator` | Amber #F59E0B | Routing, State, Coordination |

#### 2.6.1 Agents & MCP Servers Implementation

**Status:** ✅ Les 4 agents sont implémentés avec 63 fonctions API opérationnelles

**Architecture:** n8n workflows + MCP (Model Context Protocol) Servers

**Credentials:** Voir `/CREDENTIALS_SETUP_ALL_AGENTS.md` pour setup complet

---

##### 🎨 MILO (Creative Designer)

**Workflow:** `/agents/CURRENT_milo-creative/milo-creative-v4-with-toolcode.workflow.json`

**Tools (3):**
1. **Nano Banana Pro** - Génération d'images 4K (Gemini 3 Pro / Imagen 3)
2. **Veo-3** - Génération de vidéos (Google Veo-3 API)
3. **ElevenLabs** - Génération audio/voix (ElevenLabs API)

**Architecture:**
- Type: `toolCode` (code inline dans n8n)
- APIs: Google Generative Language API, ElevenLabs API
- Credentials: `$env.GOOGLE_API_KEY`, `$env.ELEVENLABS_API_KEY`

---

##### 📊 SORA (Data Analyst)

**Workflow:** `/agents/CURRENT_analyst-mcp/analyst-core-v4.5-with-tools.workflow.json`

**MCP Servers (4):**
1. **GTM Manager** (`gtm-manager.js`) - 7 fonctions
2. **Google Ads Manager** (`google-ads-manager.js`) - 7 fonctions (READ-ONLY)
3. **Meta Ads Manager** (`meta-ads-manager.js`) - 7 fonctions (READ-ONLY)
4. **Looker Manager** (`looker-manager.js`) - 7 fonctions

**Total:** 28 fonctions API

**Capabilities (READ-ONLY):**
- Liste conteneurs GTM, tags, triggers, variables
- Analyse campagnes Google Ads (ROAS, CPA, Quality Score)
- Analyse campagnes Meta Ads (Learning Phase monitoring)
- Création dashboards Looker Studio

**APIs:** GTM API v2, Google Ads API v15, Meta Marketing API v19, Looker Studio API

**Documentation:** `/agents/CURRENT_analyst-mcp/mcp_servers/README.md`

---

##### 🔮 LUNA (Strategist)

**Workflow:** `/agents/CURRENT_strategist-mcp/strategist-core.workflow.json`

**MCP Servers (2):**
1. **SEO Audit Tool** (`seo-audit-tool.js`) - 7 fonctions
2. **Keyword Research Tool** (`keyword-research-tool.js`) - 7 fonctions

**Total:** 14 fonctions API

**Capabilities:**
- Audit SEO technique (PageSpeed, mobile, indexability, HTTPS)
- Audit SEO sémantique (meta tags, headings, keywords, images)
- Analyse concurrence (backlinks, keywords, domain authority)
- Site health check (broken links, 404s, redirects)
- Keyword research (search volume, difficulty, SERP analysis)
- Related questions ("People Also Ask")
- Trending keywords (Google Trends)
- Keyword gap analysis

**APIs:** Google PageSpeed Insights API v5, Google Search Console API v1, Google Keyword Planner API

**Documentation:** `/agents/CURRENT_strategist-mcp/mcp_servers/README.md`

---

##### 💰 MARCUS (Trader)

**Workflow:** `/agents/CURRENT_trader-mcp/trader-core.workflow.json`

**MCP Servers (3 - WRITE):**
1. **Meta Campaign Launcher** (`meta-campaign-launcher.js`) - 7 fonctions
2. **Google Ads Launcher** (`google-ads-launcher.js`) - 7 fonctions
3. **Budget Optimizer** (`budget-optimizer.js`) - 7 fonctions

**Total:** 21 fonctions API (WRITE) + accès 28 fonctions SORA (READ)

**Capabilities (WRITE):**
- Créer & lancer campagnes Meta Ads (Sales, Leads, Engagement, Traffic)
- Créer ad sets avec targeting détaillé
- Créer annonces (image, vidéo, carousel)
- Créer campagnes Google Ads Search (TARGET_CPA, TARGET_ROAS, MAX_CONVERSIONS)
- Créer ad groups + keywords (EXACT, PHRASE, BROAD)
- Créer Responsive Search Ads (RSAs)
- Optimiser budgets (ROAS/CPA-based)
- Scaler winners (avec protection Learning Phase)
- Couper losers
- Balance budgets multi-plateformes (Meta, Google Ads, TikTok, LinkedIn)

**APIs:** Meta Marketing API v19 (WRITE), Google Ads API v15 (WRITE)

**Documentation:** `/agents/CURRENT_trader-mcp/mcp_servers/README.md`

**⚠️ Distinction SORA vs MARCUS:**
- SORA = **READ-ONLY** (get_*, check_*, analyze_*) - analyse performances
- MARCUS = **WRITE** (create_*, update_*, scale_*, kill_*) - lance & optimise campagnes

---

##### 📊 Résumé MCP Functions

| Agent | MCP Servers | Fonctions | Type | Status |
|-------|-------------|-----------|------|--------|
| MILO | 3 tools inline | 3 | Creative | ✅ Production |
| SORA | 4 servers | 28 | Analytics (READ) | ✅ Production |
| LUNA | 2 servers | 14 | SEO Strategy | ✅ Production |
| MARCUS | 3 servers | 21 | Campaign Launch (WRITE) | ✅ Production |
| **TOTAL** | **9 MCP Servers** | **63 fonctions** | - | ✅ **Opérationnel** |

---

### 2.7 Write-Back System

Les agents retournent des commandes qui modifient l'état du projet :

```typescript
type WriteBackCommand = {
  type: 'UPDATE_TASK_STATUS' | 'UPDATE_STATE_FLAG' | 'SET_DELIVERABLE' |
        'COMPLETE_TASK' | 'UPDATE_PROJECT_PHASE' | 'ADD_FILE' | 'NOTIFY_USER';
  task_id?: string;
  status?: TaskStatus;
  flag_name?: string;
  flag_value?: boolean;
  deliverable_url?: string;
  deliverable_type?: string;
  phase?: string;           // nouveau
  file?: ProjectFile;       // nouveau
  notification?: string;    // nouveau
};
```

### 2.8 Mémoire Collective V4.3

**Principe :** Le PM est le SEUL à lire/écrire dans `project_memory`. Les agents reçoivent `memory_context` et retournent `memory_contribution`.

**Format `memory_contribution` (retourné par chaque agent) :**

```json
{
  "memory_contribution": {
    "action": "TASK_COMPLETED",
    "summary": "Visuel créé: Image pub Meta format carré",
    "key_findings": ["Le persona préfère les tons chauds"],
    "deliverables": [{"type": "image", "url": "https://..."}],
    "recommendations": [{"for_agent": "marcus", "message": "Utiliser le visuel A pour la campagne"}]
  }
}
```

---

## 3. CONVENTIONS & PATTERNS

### 3.1 Nommage

| Élément | Convention | Exemple |
|---|---|---|
| Vues | `PascalCaseView.tsx` | `BoardView.tsx` |
| Components | `PascalCase.tsx` | `ChatPanel.tsx` |
| Store | `use[Name]Store.ts` | `useHiveStore.ts` |
| Services | `camelCase.ts` | `n8n.ts` |
| Types/Interfaces | `PascalCase` | `ProjectFile` |
| Constantes | `UPPER_SNAKE_CASE` | `AGENTS` |
| Variables | `camelCase` | `activeAgent` |

### 3.2 Patterns Frontend

- **Composants fonctionnels uniquement** (pas de classes)
- **Export :** `export default function ComponentName()`
- **State local :** `useState` pour UI (viewMode, searchQuery)
- **State global :** `useHiveStore` avec sélecteurs
- **Données dérivées :** `useMemo` pour calculs (KPIs, filtres)
- **Effets :** `useEffect` pour fetch et subscriptions
- **Navigation :** `useParams` + `useNavigate` (react-router-dom)
- **Animations :** `motion.div` avec `initial/animate/exit` (framer-motion)
- **Icônes :** `lucide-react` exclusivement
- **Style :** Tailwind utility-first, pas de CSS modules

### 3.3 Communication Frontend → Backend

- **Point d'entrée unique :** `PM_WEBHOOK_URL` via axios POST
- **Chaque payload contient :** `action`, `chatInput`, `shared_memory`, `session_id`
- **Parsing réponse :** `parseOrchestratorResponse()` gère les formats multiples
- **Mapping agent :** `mapAgentIdToBackend()` / `mapBackendAgentToFrontend()`
- **Timeout :** 10 min (600000ms) pour gros audits

### 3.4 Design System

- **Premium Light Mode** : Fond blanc, ombres douces, accents colorés par agent
- **Card pattern :** `bg-white rounded-xl border border-slate-100 p-6 hover:shadow-lg`
- **Glass effect :** `backdrop-blur-xl bg-white/80`
- **Agent badges :** Background `agent.color.light` + texte `agent.color.dark`
- **Status badges :** Classes `.status-todo`, `.status-in-progress`, `.status-done`, `.status-blocked`
- **Font :** Inter (Google Fonts)

### 3.5 Règles Impératives

1. **Sécurité après chaque tâche** : Après chaque implémentation, inspecter le code pour les vulnérabilités (XSS, injection, secrets hardcodés).
2. **TypeScript strict** : `tsc --noEmit` doit passer sans erreur.
3. **Pas de `any`** : Typer explicitement toutes les données.
4. **Pas de `console.log` en production** : Utiliser le flag `import.meta.env.DEV`.
5. **DOMPurify** : Tout HTML dynamique DOIT être sanitizé avec DOMPurify.
6. **Pas de secrets hardcodés** : Tout dans `.env` ou Supabase.
7. **Fichiers < 400 lignes** : Refactorer si dépassé.

---

## 4. SPÉCIFICATIONS FONCTIONNELLES

### 4.A — BOARD ENHANCEMENT (The Monday Killer)

**Fichiers concernés :**
- `cockpit/src/views/BoardView.tsx` → refactorer en sous-composants
- `cockpit/src/store/useHiveStore.ts` → automation de phase
- `cockpit/src/types/index.ts` → étendre Task

#### A1. Refactoring du BoardView (PRIORITAIRE)

**Pourquoi :** `BoardView.tsx` fait 42K / ~1195 lignes. Impossible à maintenir.

**Découpage cible :**
```
views/BoardView.tsx              (< 250L — orchestrateur)
components/board/BoardHeader.tsx (header + stats + nav)
components/board/TableView.tsx   (table TanStack)
components/board/KanbanView.tsx  (kanban dnd-kit)
components/board/CalendarView.tsx (FullCalendar)
components/board/TaskDetailModal.tsx (modale détail tâche)
components/board/QuickActionBar.tsx (barre action rapide)
```

**Critères d'acceptation :**
- BoardView.tsx < 250 lignes
- Chaque sous-composant < 400 lignes
- Aucune régression fonctionnelle

#### A2. Visualisation des dépendances

**Quoi :** Les tâches avec `depends_on` affichent un indicateur visuel.

**Implémentation :**
- **Table :** Colonne "Dépend de" avec badges cliquables
- **Kanban :** Icône de lien sur les cartes avec tooltip
- Tâches bloquées (dépendances non résolues) = status `blocked` automatique

**Critères d'acceptation :**
- Un clic sur une dépendance highlight la tâche source
- Les tâches avec dépendances non résolues sont visuellement distinctes

#### A3. Progression par phase

**Quoi :** Barre de progression par phase (Audit → Setup → Production → Optimization).

**Implémentation :**
- **Header du Board :** 4 barres de progression (% tâches done par phase)
- Progression globale avec compteur
- Badge coloré sur la phase active

**Critères d'acceptation :**
- Les barres se mettent à jour en temps réel via Supabase
- La phase active est visuellement mise en avant

#### A4. Automation de workflow

**Quoi :** Quand toutes les tâches d'une phase sont "done", auto-transition vers la phase suivante.

**Implémentation :**
- Dans `useHiveStore.ts` : watcher sur tasks → si toutes tâches phase X = done → `updateProjectPhase(nextPhase)`
- Notification toast à l'utilisateur
- Auto-déblocage des tâches de la phase suivante

**Critères d'acceptation :**
- Transition automatique sans intervention utilisateur
- Notification visuelle du changement de phase

---

### 4.B — ANALYTICS HUB (The Data Observer)

**Fichiers concernés :**
- `cockpit/src/views/AnalyticsView.tsx` → réécriture complète
- `cockpit/src/components/analytics/` → nouveau dossier
- `cockpit/src/store/useHiveStore.ts` → slice analytics
- `cockpit/src/services/n8n.ts` → action `analytics_fetch`
- `cockpit/src/types/index.ts` → types Analytics

#### B1. Types Analytics

```typescript
interface AnalyticsKPI {
  id: string;
  label: string;
  value: string | number;
  previousValue?: string | number;
  trend: number;        // % variation
  trendDirection: 'up' | 'down' | 'stable';
  period: string;
  source: AnalyticsSource;
}

interface AnalyticsChart {
  id: string;
  type: 'line' | 'bar' | 'area' | 'pie' | 'composed';
  title: string;
  data: Record<string, unknown>[];
  xKey: string;
  yKeys: string[];
  colors?: string[];
}

interface AnalyticsInsight {
  id: string;
  type: 'success' | 'warning' | 'danger' | 'info';
  message: string;
  action?: string;
  agent: 'sora';
  source: AnalyticsSource;
}

type AnalyticsSource = 'ga4' | 'meta_ads' | 'google_ads' | 'gsc' | 'overview';

interface AnalyticsState {
  data: Record<AnalyticsSource, { kpis: AnalyticsKPI[]; charts: AnalyticsChart[]; insights: AnalyticsInsight[] }>;
  activeSource: AnalyticsSource;
  dateRange: { start: string; end: string; preset: '7d' | '30d' | '90d' | 'custom' };
  isLoading: boolean;
  lastFetchedAt: string | null;
}
```

#### B2. Dashboards temps réel via MCP

**Quoi :** Chaque onglet (GA4, Meta Ads, Google Ads, GSC) affiche des données réelles via les MCP servers.

**Composants à créer :**
```
components/analytics/
├── AnalyticsTabs.tsx        # Navigation par source
├── KPIGrid.tsx              # Grille de KPI cards
├── KPICard.tsx              # Card individuelle avec tendance
├── ChartWidget.tsx          # Wrapper Recharts générique
├── InsightCard.tsx          # Insight IA de Sora
├── DateRangeSelector.tsx    # Sélecteur période
└── AnalyticsEmpty.tsx       # État vide (pas de données)
```

**Flow de données :**
1. User sélectionne source + période
2. Frontend appelle PM avec `action: 'analytics_fetch'`
3. PM route vers Sora qui appelle le MCP server correspondant
4. Sora analyse les données ET génère des insights
5. Réponse contient `kpis[]`, `charts[]`, `insights[]`
6. Frontend rend les widgets

**Critères d'acceptation :**
- Données réelles GA4 affichées (sessions, users, bounce rate, conversion)
- Au moins 4 types de graphiques Recharts
- Sora fournit ≥ 3 insights par refresh
- Sélecteur de période fonctionnel (7j, 30j, 90j)
- Chaque source a son dashboard dédié

#### B3. Overview Dashboard

**Quoi :** Vue agrégée cross-sources.

**Contenu :**
- KPIs clés de chaque source (1 ligne par source)
- Graphique combiné : trafic + dépenses + conversions
- Top 3 insights les plus critiques
- Score de santé marketing global (calculé par Sora)

---

### 4.C — FILES & ASSETS (The Librarian)

**Fichiers concernés :**
- `cockpit/src/views/FilesView.tsx` → enhancement
- `cockpit/src/store/useHiveStore.ts` → slice files
- `cockpit/src/types/index.ts` → type `ProjectFile`
- **Migration Supabase :** table `project_files` + Storage bucket

#### C1. Table `project_files`

```sql
CREATE TABLE project_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id),
  task_id UUID REFERENCES tasks(id),
  agent_id TEXT,
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  file_type TEXT NOT NULL,          -- 'image' | 'video' | 'pdf' | 'document'
  mime_type TEXT,
  size_bytes BIGINT,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### C2. Auto-classification

**Quoi :** Quand un agent génère un livrable, il est automatiquement sauvegardé dans `project_files`.

**Implémentation :**
- Nouveau write-back command `ADD_FILE` dans `processWriteBackCommands()`
- Milo génère une image → write_back `ADD_FILE` avec tags `['milo', 'creative', 'meta_ads', phase]`
- Luna génère un rapport → write_back `ADD_FILE` avec tags `['luna', 'report', 'seo']`
- Upload vers Supabase Storage (bucket `project-files`)

#### C3. Interface Files

**Composants :**
```
components/files/
├── FileGrid.tsx              # Grille de fichiers (cards visuelles)
├── FileCard.tsx              # Card fichier avec preview
├── FileFilters.tsx           # Filtres par agent, type, phase
├── FileSearch.tsx            # Barre de recherche
└── FilePreviewModal.tsx      # Preview plein écran
```

**Vues :** Grille (défaut) | Liste

**Critères d'acceptation :**
- Fichiers persistent dans Supabase Storage
- Filtrage par agent, type, phase
- Preview images/PDFs
- Download individuel et bulk (zip)
- Recherche par nom et tags

#### C4. Recherche IA (V2 — optionnel)

**Quoi :** "Montre-moi les visuels de Noël" via chat naturel.

**Implémentation :** Requête au PM avec `action: 'files_search'`, PM interroge `project_files` avec filtre intelligent.

---

### 4.E — SÉCURITÉ & QUALITÉ

#### E1. Audit de sécurité (à faire en PREMIER)

**Checklist OWASP :**

| # | Risque | Action |
|---|---|---|
| A01 | Broken Access Control | Préparer isolation par `project_id` (futur multi-tenant) |
| A03 | Injection | Valider tous les inputs Supabase, sanitizer les recherches |
| A07 | XSS | Auditer TOUT usage de `dangerouslySetInnerHTML`. Installer et utiliser DOMPurify |
| A08 | Software Integrity | Vérifier intégrité des réponses n8n (schema validation) |
| A09 | Security Logging | Logger les erreurs API sans exposer de données sensibles |

**Actions immédiates :**
1. Installer `dompurify` + `@types/dompurify`
2. Auditer `UIComponentRenderer.tsx` — remplacer tout `dangerouslySetInnerHTML` par DOMPurify
3. Ajouter validation de schéma sur `parseOrchestratorResponse()`
4. Vérifier qu'aucun secret n'est hardcodé (auditer `.env`, `n8n.ts`, `supabase.ts`)
5. Sanitizer les inputs utilisateur dans `ChatInput.tsx` et `GenesisView.tsx`

#### E2. Protocole post-tâche

Après CHAQUE tâche d'implémentation, exécuter :

1. `npx tsc --noEmit` — 0 erreur TypeScript
2. `npx eslint src/` — 0 warning
3. `npm run build` — build réussi
4. Revue de sécurité : chercher `dangerouslySetInnerHTML`, `eval(`, `innerHTML`, secrets hardcodés
5. Vérifier : pas de `console.log` (sauf `import.meta.env.DEV`)
6. Vérifier : pas de `any` TypeScript

---

### 4.F — BACKEND ENHANCEMENTS (n8n)

#### F1. PM Memory Read/Inject

**Quoi :** Le PM lit `project_memory` AVANT chaque appel à l'Orchestrateur et injecte le contexte pertinent.

**Implémentation n8n :**
1. Noeud Supabase : `SELECT * FROM project_memory WHERE project_id = X ORDER BY created_at DESC LIMIT 20`
2. Filtrer les recommendations pertinentes pour l'agent cible
3. Construire `memory_context` JSON
4. Injecter dans le payload vers l'Orchestrateur

**Format `memory_context` injecté :**

```json
{
  "memory_context": {
    "previous_work": [
      { "agent": "luna", "action": "STRATEGY_VALIDATED", "summary": "Positionnement validé: expert premium" }
    ],
    "recommendations_for_you": [
      { "from": "luna", "message": "Utiliser un ton expert et confiant pour les copies" }
    ],
    "project_state": {
      "strategy_validated": true,
      "budget_approved": false,
      "creatives_ready": false
    }
  }
}
```

#### F2. Agent Memory Contribution

**Quoi :** CHAQUE agent DOIT retourner un `memory_contribution` dans sa réponse.

**Implémentation :**
- Ajouter dans le system prompt de chaque agent l'instruction de retourner `memory_contribution`
- PM parse la contribution et écrit dans `project_memory` via Supabase
- Format standardisé (voir section 2.8)

#### F3. Write-Back Commands étendus

**Nouveaux types à supporter :**
- `UPDATE_PROJECT_PHASE` : L'agent peut déclencher un changement de phase
- `ADD_FILE` : L'agent ajoute un fichier au projet
- `NOTIFY_USER` : L'agent envoie une notification toast

#### F4. Intégration MCP dans Sora

**Quoi :** Le workflow Sora appelle les MCP servers pour des données réelles.

**Implémentation n8n :**
- Noeud Execute Command : appelle le MCP server approprié
- Sora reçoit les données brutes + les analyse
- Retourne `ui_components` de type `ANALYTICS_DASHBOARD`

---

## 5. ROADMAP PHASÉE

### Phase 1 — Fondations & Sécurité ⚡

**Objectif :** Code sain, sécurisé, maintenable.

| # | Tâche | Fichiers |
|---|---|---|
| 1.1 | Installer DOMPurify, auditer XSS | `UIComponentRenderer.tsx`, `ChatMessage.tsx` |
| 1.2 | Validation schéma réponses n8n | `n8n.ts` (`parseOrchestratorResponse`) |
| 1.3 | Audit secrets hardcodés | Tous fichiers |
| 1.4 | Sanitization inputs utilisateur | `ChatInput.tsx`, `GenesisView.tsx` |
| 1.5 | Refactoring `BoardView.tsx` | → `components/board/*.tsx` |
| 1.6 | Protocole post-tâche (tsc, eslint, build) | Config projet |

**Vérification :** `tsc --noEmit` ✅ | `eslint` ✅ | `npm run build` ✅ | 0 `dangerouslySetInnerHTML` sans DOMPurify

---

### Phase 2 — Board Enhancement (Monday Killer) 📋

**Objectif :** Gestion de projet intelligente avec dépendances et automation.

| # | Tâche | Fichiers |
|---|---|---|
| 2.1 | Dépendances visuelles (Table + Kanban) | `components/board/TableView.tsx`, `KanbanView.tsx` |
| 2.2 | Progression par phase | `components/board/BoardHeader.tsx` |
| 2.3 | Automation workflow (phase transitions) | `useHiveStore.ts` |
| 2.4 | Quick-edit tâche (modal inline) | `components/board/TaskDetailModal.tsx` |

**Vérification :** Dépendances visibles ✅ | Phases auto-transitionnent ✅ | Protocole sécurité ✅

---

### Phase 3 — Analytics Hub (Data Observer) 📊

**Objectif :** Dashboards temps réel avec données MCP + insights IA.

| # | Tâche | Fichiers |
|---|---|---|
| 3.1 | Types + store slice analytics | `types/index.ts`, `useHiveStore.ts` |
| 3.2 | Action `analytics_fetch` backend | `n8n.ts`, workflow PM n8n |
| 3.3 | Composants analytics (KPI, Charts, Insights) | `components/analytics/*.tsx` |
| 3.4 | Réécriture `AnalyticsView.tsx` | `views/AnalyticsView.tsx` |
| 3.5 | Overview dashboard cross-sources | `components/analytics/OverviewDashboard.tsx` |
| 3.6 | Intégration MCP dans workflow Sora | `agents/CURRENT_analyst-mcp/` |

**Vérification :** Données GA4 réelles ✅ | 4 types de graphiques ✅ | Insights Sora ✅ | Protocole sécurité ✅

---

### Phase 4 — Files & Assets (Librarian) 📁

**Objectif :** Bibliothèque de fichiers persistante et intelligente.

| # | Tâche | Fichiers |
|---|---|---|
| 4.1 | Table `project_files` + Storage bucket Supabase | Migration SQL |
| 4.2 | Types + store slice files | `types/index.ts`, `useHiveStore.ts` |
| 4.3 | Write-back `ADD_FILE` | `useHiveStore.ts`, `n8n.ts` |
| 4.4 | Composants files (Grid, Card, Filters, Preview) | `components/files/*.tsx` |
| 4.5 | Enhancement `FilesView.tsx` | `views/FilesView.tsx` |
| 4.6 | Download + bulk export | `components/files/FileGrid.tsx` |

**Vérification :** Fichiers persistent ✅ | Auto-classification ✅ | Download fonctionne ✅ | Protocole sécurité ✅

---

### Phase 6 — Backend & Mémoire Collective 🧠

**Objectif :** Agents qui collaborent via la mémoire partagée.

| # | Tâche | Fichiers |
|---|---|---|
| 6.1 | PM memory read/inject dans n8n | `agents/CURRENT_pm-mcp/` |
| 6.2 | System prompts agents (`memory_contribution`) | Tous agents |
| 6.3 | Write-back commands étendus | `useHiveStore.ts`, `n8n.ts`, `types/index.ts` |
| 6.4 | Test intégration mémoire end-to-end | Tous |

**Vérification :** Mémoire écrite après chaque interaction ✅ | Recommandations propagées ✅ | Protocole sécurité ✅

---

### Phase V5 — Web Intelligence + Backend Migration 🌐🔄

**Date de planification :** 2026-03-01
**Référence complète :** `/CLAUDE.md` et `/Roadmap:vision/PLAN_V5_WEB_INTELLIGENCE_BACKEND.md`
**Durée estimée :** 6 semaines (2 chantiers en série)

**Contexte stratégique :**

Hive OS V4 a 13 MCP servers et 63 fonctions API, mais **ZÉRO capacité de web browsing/crawling**. C'est un angle mort critique pour un "Agency Killer" marketing. De plus, l'analyse objective révèle que **n8n ne tiendra PAS pour 100 clients SaaS** (benchmarks: plafonne à ~100 users en single mode, queue mode saturé par les appels IA de 30-120s).

**Décisions prises :**

1. **Web Intelligence** : Créer un MCP server custom "web-intelligence" inspiré des patterns techniques d'OpenClaw (MIT-licensed), mais spécialisé pour le marketing digital
2. **Backend Migration** : Porter les workflows n8n vers TypeScript pour architecture production-ready multi-tenant

---

#### Chantier 1 — Web Intelligence MCP Server (Semaines 1-2)

**Objectif :** Donner aux 4 agents la capacité de naviguer, analyser et auditer le web.

| Phase | Tâches | Livrable |
|-------|--------|----------|
| **1.1** (Jours 1-3) | Skeleton + 5 outils Cheerio/Axios | `web-scrape`, `web-extract-text`, `competitor-analysis`, `social-meta-check`, `link-checker` |
| **1.2** (Jours 4-6) | 3 outils Playwright + browser pool | `web-screenshot`, `landing-page-audit`, `ad-verification` + `browser-pool.ts` + `dom-snapshot.ts` |
| **1.3** (Jours 7-8) | Frontend UI components | 4 nouveaux types UI : `WEB_SCREENSHOT`, `COMPETITOR_REPORT`, `LANDING_PAGE_AUDIT`, `PIXEL_VERIFICATION` |
| **1.4** (Jours 9-10) | Intégration n8n temporaire | System prompts Orchestrator pour router intents web intelligence |

**Architecture :**

```
/mcp-servers/web-intelligence-server/
  src/
    index.ts                    # MCP server entry (8 tools)
    tools/
      web-scrape.ts             # Cheerio — extraction HTML structurée ✅
      web-extract-text.ts       # Readability — texte article propre ✅
      competitor-analysis.ts    # Tech stack, SEO, pixels ✅
      social-meta-check.ts      # Open Graph + Twitter Cards ✅
      link-checker.ts           # Vérif 100 liens parallèle ✅
      web-screenshot.ts         # Playwright — screenshot multi-device 🚧
      landing-page-audit.ts     # Audit CTA, forms, mobile, perf 🚧
      ad-verification.ts        # Network interception pixels 🚧
    lib/
      browser-pool.ts           # Pool Playwright (max 3 browsers) 🚧
      dom-snapshot.ts           # Accessibility tree + ref labels 🚧
      url-validator.ts          # SSRF protection ✅
      sanitizer.ts              # HTML/PII cleaning ✅
      cloudinary.ts             # Upload screenshots CDN 🚧
```

**Sécurité :**
- SSRF protection : blocage IPs privées (10.x, 172.16-31.x, 192.168.x, 127.x)
- Domaines bloqués : .gov, .mil, .onion, localhost
- Sanitization : suppression scripts, PII, truncation 50KB/100KB
- Browser pool : timeout 30s, memory limit 512MB, idle 5min

**Status Phase 1.1 :** ✅ COMPLÉTÉ (5 outils Cheerio/Axios créés, buildés, enregistrés dans MCP Bridge)

---

#### Chantier 2 — Backend TypeScript Migration (Semaines 3-6)

**Objectif :** Remplacer n8n par un backend TypeScript scalable pour 100+ clients.

| Phase | Tâches | Livrable |
|-------|--------|----------|
| **2.1** (Jours 11-15) | API Gateway Express/Fastify | Auth middleware, rate limiting, validation Zod, routes (`/api/chat`, `/api/genesis`, `/api/analytics`) |
| **2.2** (Jours 16-18) | Porter PM + Orchestrator | Routing logic, context-builder, memory-injector en TypeScript |
| **2.3** (Jours 19-25) | Porter les 4 agents | Luna → Sora → Marcus → Milo (system prompts + MCP calls) |
| **2.4** (Jours 26-28) | Connecter frontend | Changer `PM_WEBHOOK_URL` → `BACKEND_API_URL`, même payloads |
| **2.5** (Jours 29-30) | Tests + cutover | Load test 10 req simultanées, couper n8n |

**Architecture cible :**

```
/backend/
  src/
    index.ts                # Express/Fastify entry
    routes/
      chat.routes.ts        # POST /api/chat (remplace PM webhook)
      genesis.routes.ts
      analytics.routes.ts
    middleware/
      auth.middleware.ts           # Vérif token Supabase
      rate-limit.middleware.ts     # Par user_id + tier
      validation.middleware.ts     # Zod schemas
    services/
      supabase.service.ts   # Client DB typé
      mcp-bridge.service.ts # Wrapper HTTP MCP calls
      memory.service.ts     # R/W project_memory
      claude.service.ts     # Anthropic SDK
    agents/
      orchestrator.ts       # Routing intent → agent
      luna.agent.ts
      sora.agent.ts
      marcus.agent.ts
      milo.agent.ts
    shared/
      context-builder.ts
      response-parser.ts
      memory-injector.ts
      write-back.processor.ts
```

**Ce qui NE change PAS :**
- Les 14 MCP servers (restent identiques, communiquent via Bridge HTTP)
- Le MCP Bridge Express.js (reste identique)
- Supabase (DB + Auth + Realtime)
- Le frontend React (change juste l'URL d'API)

**Avantages migration :**

| Aspect | n8n | Backend TypeScript |
|--------|-----|-------------------|
| Capacité | ~20 clients (queue mode) | 100+ clients (scalable) |
| Multi-tenancy | Aucun | Natif (isolation par user_id) |
| Debugging | Cauchemar (20 workflows JSON) | Logs structurés + tracing |
| Tests | Impossibles | Jest + intégration + e2e |
| Latence P95 | 12s à 200 users | < 2s avec caching |

**Vérification Chantier 1 :**
- `curl http://localhost:3456/api/web-intelligence/tools` → 8 outils listés ✅ (5/8)
- Scraping < 5s ✅ | Screenshots < 10s 🚧 | Audit < 15s 🚧
- URL validator rejette IPs privées ✅
- UI components s'affichent dans le chat 🚧

**Vérification Chantier 2 :**
- `POST /api/chat` avec message Luna → réponse identique à n8n
- 4 agents fonctionnent via backend TS
- Write-back commands s'exécutent
- Auth Supabase bloque requêtes non-auth
- Rate limiting fonctionne
- `npx tsc --noEmit` → 0 erreur
- Load test : 10 req simultanées sans échec

**Impact business :**
- **Semaine 2 :** Demo "wow" possible — auditer site prospect en live pendant call commercial
- **Semaine 6 :** Architecture production-ready pour 100 clients SaaS
- **Différenciateur unique :** Seul outil combinant browsing IA + 4 agents marketing + mémoire collective

**Référence complète :** Voir `/CLAUDE.md` pour timeline détaillée, fichiers critiques, et spécifications techniques complètes.

---

## 6. CONTRATS API

### 6.1 Payloads existants

#### `genesis` :

```typescript
{
  action: 'genesis',
  project_name: string,
  scope: ProjectScope,
  metadata: ProjectMetadata,
  generated_tasks: Omit<Task, 'id' | 'project_id' | 'created_at'>[]
}
```

#### `task_launch` :

```typescript
{
  action: 'task_launch',
  chatInput: string,
  session_id: string,
  activeAgentId: string,     // backend ID (strategist, creative, etc.)
  system_instruction: string,
  chat_mode: 'task_execution',
  shared_memory: SharedProjectContext,
  task_context: TaskExecutionContext,
  image?: string             // Base64
}
```

#### `quick_action` :

```typescript
{
  action: 'quick_action',
  chatInput: string,
  session_id: string,
  activeAgentId: string,
  system_instruction: string,
  chat_mode: 'quick_research',
  shared_memory: SharedProjectContext
}
```

### 6.2 Nouveau payload — `analytics_fetch`

```typescript
// REQUEST
{
  action: 'analytics_fetch',
  project_id: string,
  source: AnalyticsSource,
  date_range: { start: string; end: string; preset: '7d' | '30d' | '90d' | 'custom' },
  metrics?: string[],
  shared_memory: SharedProjectContext
}

// RESPONSE
{
  success: boolean,
  data: {
    kpis: AnalyticsKPI[],
    charts: AnalyticsChart[],
    insights: AnalyticsInsight[]
  },
  meta: { source: AnalyticsSource, fetched_at: string, agent_id: 'sora' }
}
```

### 6.3 Nouveau payload — `files_search`

```typescript
// REQUEST
{
  action: 'files_search',
  project_id: string,
  query: string,
  filters?: { agent?: AgentRole; file_type?: string; phase?: TaskPhase }
}

// RESPONSE
{
  success: boolean,
  files: ProjectFile[],
  total: number
}
```

### 6.4 Format UI Components (référence)

| Type | Champs data | Agent |
|---|---|---|
| `CAMPAGNE_TABLE` | `image_url`, `prompt_used` | Milo |
| `AD_PREVIEW` | `video_url`, `script`, `headline` | Milo |
| `PDF_COPYWRITING` | `content`, `title`, `word_count` | Milo |
| `ANALYTICS_DASHBOARD` | `kpis[]`, `content`, `recommendations[]` | Sora |
| `PDF_REPORT` | `content`, `title`, `recommendations[]` | Luna |

---

## 7. SÉCURITÉ

### 7.1 Checklist par phase

Après CHAQUE phase du roadmap :

1. `npx tsc --noEmit` — 0 erreur
2. `npx eslint src/` — 0 warning
3. `npm run build` — succès
4. Grep `dangerouslySetInnerHTML` → tous protégés par DOMPurify
5. Grep `eval(` → 0 occurrence
6. Grep `innerHTML` → 0 occurrence non sanitizée
7. Grep `console.log` → seulement dans blocs `import.meta.env.DEV`
8. Grep `any` TypeScript → minimiser, justifier si nécessaire
9. Pas de secrets/URLs hardcodés hors `.env`
10. Toutes les réponses API validées avant usage
11. Inputs utilisateur sanitizés avant envoi backend

### 7.2 DOMPurify — Pattern obligatoire

```typescript
import DOMPurify from 'dompurify';

// AVANT (dangereux)
<div dangerouslySetInnerHTML={{ __html: content }} />

// APRÈS (sécurisé)
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }} />
```

### 7.3 Validation réponse API — Pattern obligatoire

```typescript
function validateResponse(raw: unknown): ParsedResponse {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid response format');
  }
  const data = raw as Record<string, unknown>;
  return {
    message: typeof data.message === 'string' ? data.message : '',
    ui_components: Array.isArray(data.ui_components) ? data.ui_components : [],
    write_back: Array.isArray(data.write_back) ? data.write_back : [],
  };
}
```

### 7.4 Audit de Sécurité & Hardening (2026-02-10)

#### 7.4.1 Contexte

Un audit de sécurité complet a été réalisé le 2026-02-10 pour préparer THE HIVE OS V4 au déploiement SaaS multi-tenant. **23 vulnérabilités** ont été identifiées :
- 🚨 **7 critiques** (bloquantes pour production)
- ⚠️ **12 moyennes** (à corriger avant lancement commercial)
- 🟡 **4 basses** (nice-to-have)

**Documents de référence :**
- `/SECURITY_AUDIT_AND_HARDENING.md` — Audit technique complet (1355 lignes)
- `/SECURITY_EXECUTIVE_SUMMARY.md` — Résumé exécutif pour CEO

---

#### 7.4.2 Vulnérabilités Critiques Corrigées (Phase 1)

**Status :** ✅ **7/7 CORRIGÉES** (2026-02-10)

##### 🚨 CRITICAL-001 : Multi-Tenancy (RLS)

**Problème :**
```sql
-- Avant : N'importe qui peut voir les projets de n'importe qui
CREATE POLICY "Allow all on projects" ON projects FOR ALL USING (true);
```

**Impact :** User A peut lire/modifier les projets de User B → Violation RGPD.

**Solution appliquée :**
- ✅ Migration `004_production_rls.sql` créée
- Ajout colonne `user_id` à toutes les tables (projects, tasks, chat_sessions, wizard_sessions, project_memory)
- Suppression des policies "Allow all"
- Création de policies RLS sécurisées : `auth.uid() = user_id`
- Triggers auto-set `user_id` sur INSERT
- Indexes `idx_*_user_id` pour performance

**Fichier :** `/cockpit/supabase/migrations/004_production_rls.sql`

---

##### 🚨 CRITICAL-002 : Authentification Utilisateur

**Problème :** Aucun système de login → Impossible d'identifier qui fait quoi.

**Solution appliquée :**
- ✅ Fonctions auth ajoutées à `supabase.ts` :
  - `signUp(email, password)`
  - `signIn(email, password)`
  - `signOut()`
  - `getCurrentUser()`
  - `onAuthStateChange(callback)`
- ✅ Composant `LoginView.tsx` créé (page de login avec design The Hive)

**Fichiers :**
- `/cockpit/src/lib/supabase.ts` (modifié)
- `/cockpit/src/views/LoginView.tsx` (créé)

---

##### 🚨 CRITICAL-003 : OAuth2 Credentials Partagées

**Problème :** Tous les users utilisent les MÊMES tokens OAuth2 (Meta Ads, Google Ads) → User A peut créer campagnes sur compte Meta de User B.

**Solution appliquée :**
- ✅ Migration `005_user_integrations.sql` créée
- Table `user_integrations` pour stocker credentials par utilisateur
- Colonnes : `user_id`, `platform`, `access_token`, `refresh_token`, `ad_account_id`
- RLS policies pour isolation totale des credentials
- Index `idx_user_integrations_user_platform`

**Fichier :** `/cockpit/supabase/migrations/005_user_integrations.sql`

**Note :** Les MCP Servers devront vérifier ownership avant chaque call API :
```javascript
const ownership = await verifyAdAccountOwnership(userId, ad_account_id);
if (!ownership) throw new Error('Unauthorized');
```

---

##### 🚨 CRITICAL-004 : Rate Limiting

**Problème :** Aucune limite sur appels API → Risque spam, factures Google Ads de $10,000+/mois, ban des comptes API.

**Solution appliquée :**
- ✅ Migration `006_rate_limiting.sql` créée
- Table `api_rate_limits` avec sliding window counters
- Fonction `check_rate_limit(user_id, endpoint, tier)`
- Tiers :
  - **Free** : 10/min, 100/hour, 500/day
  - **Pro** : 60/min, 1000/hour, 10000/day
  - **Enterprise** : 300/min, 10000/hour, 100000/day

**Fichier :** `/cockpit/supabase/migrations/006_rate_limiting.sql`

**Usage dans MCP Servers :**
```javascript
const allowed = await checkRateLimit(userId, 'create_campaign');
if (!allowed) throw new Error('Rate limit exceeded');
```

---

##### 🚨 CRITICAL-005 : SQL Injection

**Problème :** Injection SQL possible si inputs non validés.

**Solution appliquée :**
- ✅ Module `input_validation.js` créé avec utilitaires :
  - `sanitizeString()` — Remove HTML, injection chars
  - `validateUrl()` — Validate URLs (http/https only)
  - `validateNumber()` — Range validation
  - `validateDateRange()` — Whitelist validation
  - `validateEmail()` — Email format
  - `sanitizeError()` — Prevent credential leakage in error messages
  - `validateConfig()` — Required fields validation
  - `sanitizeCampaignConfig()` — Campaign-specific sanitization

**Fichier :** `/agents/mcp_utils/input_validation.js`

**Note :** Supabase utilise déjà parameterized queries (`.eq()`, `.in()`), mais validation additionnelle ajoutée.

---

##### 🚨 CRITICAL-006 : XSS dans Chat

**Problème :** ReactMarkdown render user input sans sanitization → Injection JavaScript, vol de tokens.

**Solution appliquée :**
- ✅ Package `dompurify` installé (`npm install dompurify @types/dompurify`)
- ✅ `ChatMessage.tsx` modifié :
  - Import DOMPurify
  - Sanitization avec whitelist stricte :
    - ALLOWED_TAGS : p, br, strong, em, code, pre, ul, ol, li, a, h1-h6, blockquote
    - FORBID_TAGS : script, style, iframe, object, embed, form, input, button
    - FORBID_ATTR : onerror, onload, onclick, onmouseover, onfocus, onblur

**Fichier :** `/cockpit/src/components/chat/ChatMessage.tsx` (modifié)

```typescript
const sanitizedContent = DOMPurify.sanitize(message.content, {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'code', 'pre', 'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3'],
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick'],
});
```

---

##### 🚨 CRITICAL-007 : Audit Logs

**Problème :** Aucun log des actions utilisateurs → Impossible d'investiguer incidents, non-compliance (SOC 2, ISO 27001).

**Solution appliquée :**
- ✅ Migration `007_audit_logs.sql` créée
- Table `audit_logs` avec :
  - **Who** : user_id, user_email
  - **What** : action, resource_type, resource_id
  - **When** : timestamp
  - **Where** : ip_address, user_agent
  - **Result** : success, error_message
- Fonction `log_audit()` pour logging centralisé
- Indexes : `idx_audit_logs_user_timestamp`, `idx_audit_logs_action`, `idx_audit_logs_resource`

**Fichier :** `/cockpit/supabase/migrations/007_audit_logs.sql`

**Usage dans MCP Servers :**
```javascript
await logAudit(userId, 'create_campaign', 'campaign', campaign_id, metadata, true);
```

---

#### 7.4.3 Fichiers Créés/Modifiés

**Migrations SQL (4 fichiers) :**
1. `/cockpit/supabase/migrations/004_production_rls.sql` — Multi-tenancy RLS
2. `/cockpit/supabase/migrations/005_user_integrations.sql` — OAuth2 per-user
3. `/cockpit/supabase/migrations/006_rate_limiting.sql` — Rate limiting
4. `/cockpit/supabase/migrations/007_audit_logs.sql` — Audit logs

**Code Frontend (3 fichiers) :**
5. `/cockpit/src/lib/supabase.ts` — Auth functions (modifié)
6. `/cockpit/src/components/chat/ChatMessage.tsx` — XSS protection (modifié)
7. `/cockpit/src/views/LoginView.tsx` — Login page (créé)

**Utilitaires Backend (1 fichier) :**
8. `/agents/mcp_utils/input_validation.js` — Input validation utilities (créé)

**Documentation (2 fichiers) :**
9. `/SECURITY_AUDIT_AND_HARDENING.md` — Audit technique complet
10. `/SECURITY_EXECUTIVE_SUMMARY.md` — Résumé CEO

---

#### 7.4.4 Options de Déploiement

##### **Option A : Mono-Utilisateur (MVP)** ⭐ **CHOIX ACTUEL**

**Temps :** 0 jour
**Pour :** Usage personnel (toi uniquement)
**Risques :** Aucun

**Actions :**
1. ❌ **NE PAS** appliquer les migrations SQL
2. ✅ Utiliser l'app en l'état (pas besoin d'auth)
3. ✅ Configurer tes credentials (Meta, Google Ads, etc.)
4. ✅ Tester THE HIVE OS sur tes propres campagnes

**Status :** ✅ **SAFE pour usage mono-user**

**Note importante :** Les migrations 004-007 sont **PRÊTES** mais **NON APPLIQUÉES**. Elles seront appliquées avant le passage à l'Option B.

---

##### **Option B : Beta SaaS (10-100 Utilisateurs)** 🚧 **À FAIRE AVANT LANCEMENT**

**Temps :** 3-5 jours de dev
**Pour :** Early adopters beta (amis, partenaires)

**Actions obligatoires :**
1. ✅ Appliquer migrations `004_production_rls.sql` à `007_audit_logs.sql`
2. ✅ Activer Supabase Auth (Dashboard > Authentication > Email Provider)
3. ✅ Intégrer `LoginView` dans `App.tsx` (auth gate)
4. ✅ Configurer `N8N_ENCRYPTION_KEY` (générer avec `openssl rand -hex 32`)
5. ✅ Tester multi-tenancy (créer 2 users, vérifier isolation)
6. ✅ Appliquer MEDIUM-001 à MEDIUM-012 (voir `/SECURITY_AUDIT_AND_HARDENING.md`)
7. ✅ Pen testing basique (OWASP ZAP)

**Status :** 🚧 **REQUIS AVANT INVITATION BETA USERS**

---

##### **Option C : Production SaaS (100+ Utilisateurs)** 🚧 **À FAIRE AVANT LANCEMENT COMMERCIAL**

**Temps :** 2-3 semaines de dev
**Pour :** Lancement commercial public

**Actions obligatoires :**
1. ✅ Tout de l'Option B
2. ✅ Monitoring (Sentry, Datadog)
3. ✅ RGPD compliance (Privacy Policy, Terms, Cookie banner, Data export, Account deletion)
4. ✅ Penetration testing par firme externe
5. ✅ Bug bounty program (HackerOne)
6. ✅ SOC 2 / ISO 27001 prep
7. ✅ Load testing (100+ users simultanés)
8. ✅ DDoS protection (Cloudflare)
9. ✅ Incident response plan
10. ✅ HTTPS obligatoire + Firewall + Backups automatiques

**Status :** 🚧 **REQUIS AVANT LANCEMENT COMMERCIAL PUBLIC**

---

#### 7.4.5 Vulnérabilités Moyennes (Phase 2)

⚠️ **12 vulnérabilités moyennes** à corriger avant Option B/C :

1. **MEDIUM-001** : Input validation dans tous les MCP servers
2. **MEDIUM-002** : Sanitize error messages (prevent credential leakage)
3. **MEDIUM-003** : Budget limits enforcement par user
4. **MEDIUM-004** : CORS configuration
5. **MEDIUM-005** : Pagination sur tous les endpoints (limite 100 items/page)
6. **MEDIUM-006** : OAuth2 token auto-refresh (n8n config)
7. **MEDIUM-007** : Webhook signature validation (HMAC)
8. **MEDIUM-008** : Realtime subscriptions avec filtres `user_id`
9. **MEDIUM-009** : Content Security Policy (CSP) headers
10. **MEDIUM-010** : Environment variables protection
11. **MEDIUM-011** : Timeouts sur tous les API calls (30s max)
12. **MEDIUM-012** : Error messages verbeux (remove stack traces in production)

**Référence :** Voir `/SECURITY_AUDIT_AND_HARDENING.md` section 2 pour détails.

---

#### 7.4.6 Checklist Déploiement SaaS

**Phase 1 : Sécurité de Base (OBLIGATOIRE avant Option B) :**

- [x] ✅ Migration 004: RLS multi-tenant créée
- [x] ✅ Migration 005: user_integrations créée
- [x] ✅ Migration 006: Rate limiting créée
- [x] ✅ Migration 007: Audit logs créée
- [x] ✅ Authentification Supabase implémentée
- [x] ✅ LoginView créée
- [x] ✅ DOMPurify installé et configuré
- [x] ✅ Input validation utilities créées
- [ ] ⏳ **Migrations SQL appliquées** (à faire lors du passage à Option B)
- [ ] ⏳ **LoginView intégrée dans App.tsx** (à faire lors du passage à Option B)
- [ ] ⏳ **N8N_ENCRYPTION_KEY générée** (à faire lors du passage à Option B)

**Phase 2 : Validation & Tests (OBLIGATOIRE avant Option B) :**

- [ ] ⏳ Tester multi-tenancy: User A ne voit pas projets User B
- [ ] ⏳ Tester rate limiting: Spam détecté et bloqué
- [ ] ⏳ Tester XSS: Injection `<script>alert('xss')</script>` bloquée
- [ ] ⏳ Tester OAuth2 isolation: User A ne peut pas utiliser compte Meta de User B
- [ ] ⏳ Penetration testing (Burp Suite, OWASP ZAP)
- [ ] ⏳ Code review sécurité (par un dev senior)

**Phase 3 : Monitoring (RECOMMANDÉ avant Option C) :**

- [ ] ⏳ Sentry configuré (error tracking)
- [ ] ⏳ Datadog/New Relic (APM)
- [ ] ⏳ Alertes sur rate limit violations
- [ ] ⏳ Alertes sur failed logins (brute force detection)
- [ ] ⏳ Alertes sur budget API dépassés

**Phase 4 : Compliance (OBLIGATOIRE avant Option C) :**

- [ ] ⏳ Privacy Policy rédigée
- [ ] ⏳ Terms of Service rédigés
- [ ] ⏳ Cookie consent banner
- [ ] ⏳ Data export feature (GDPR right to data portability)
- [ ] ⏳ Account deletion feature (GDPR right to erasure)
- [ ] ⏳ DPA (Data Processing Agreement) si clients EU

---

#### 7.4.7 Encryption & Credentials Storage

**n8n Encryption :**
- ✅ n8n chiffre déjà les credentials en base via `N8N_ENCRYPTION_KEY`
- ⚠️ **À FAIRE** : Générer une clé forte (32+ chars random) lors du passage à Option B
- ⚠️ **JAMAIS** committer `N8N_ENCRYPTION_KEY` dans Git
- ⚠️ Stocker en secret manager (AWS Secrets, HashiCorp Vault, etc.)

**Génération clé (à faire lors Option B) :**
```bash
# Générer clé de chiffrement n8n
openssl rand -hex 32

# Ajouter dans .env n8n (NEVER commit)
N8N_ENCRYPTION_KEY=la_cle_generee_ici
```

**Supabase Encryption :**
- Table `user_integrations.access_token` chiffrée automatiquement par Supabase
- RLS policies assurent isolation des credentials par user

---

#### 7.4.8 Status Sécurité Actuel

**Avant audit (2026-02-09) :**
- 🚨 7 vulnérabilités critiques
- ⚠️ Code non-sécurisé pour production SaaS
- ❌ Risque de fuite de données cross-tenant

**Après correctifs (2026-02-10) :**
- ✅ 7 vulnérabilités critiques **CORRIGÉES**
- ✅ Multi-tenancy avec RLS **PRÊT**
- ✅ Authentification complète **PRÊT**
- ✅ Rate limiting **PRÊT**
- ✅ XSS protection **APPLIQUÉ**
- ✅ Input validation **PRÊT**
- ✅ Audit logs **PRÊT**
- ⏳ Migrations SQL **PRÊTES** (non appliquées, en attente Option B)
- ✅ **SAFE pour Option A (mono-user)**
- 🚧 **REQUIS** : Appliquer migrations + MEDIUM-001 à MEDIUM-012 avant Options B/C

**Conclusion :** THE HIVE OS V4 est **sécurisé pour usage mono-utilisateur (Option A)** et **prêt techniquement pour multi-tenant** une fois les migrations appliquées.

---

## 8. TESTS & VÉRIFICATION

### 8.1 Protocole post-tâche (OBLIGATOIRE)

```bash
# 1. TypeScript
npx tsc --noEmit

# 2. ESLint
npx eslint src/

# 3. Build
npm run build

# 4. Sécurité (grep manuel)
# Vérifier: dangerouslySetInnerHTML, eval, innerHTML, console.log, any, secrets
```

### 8.2 Tests manuels par phase

- **Phase 1 :** Ouvrir l'app → naviguer toutes les vues → vérifier aucune régression après refactoring Board
- **Phase 2 :** Créer un projet Genesis → vérifier dépendances sur Board → compléter toutes tâches d'une phase → vérifier auto-transition
- **Phase 3 :** Naviguer vers Analytics → vérifier que les données GA4 s'affichent → changer de source → vérifier insights Sora
- **Phase 4 :** Lancer une tâche Milo → vérifier que le livrable apparaît dans Files → filtrer par agent → download
- **Phase 6 :** Lancer une tâche Luna → vérifier memory entry → lancer tâche Milo → vérifier que les recommandations Luna sont injectées

---

## 9. GLOSSAIRE

| Terme | Définition |
|---|---|
| **PM Central Brain** | Workflow n8n qui reçoit TOUTES les requêtes, lit la mémoire, route vers l'Orchestrateur |
| **Orchestrateur** | Workflow n8n qui route vers l'agent spécialiste approprié |
| **Write-Back** | Mécanisme par lequel un agent met à jour l'état du projet (tasks, flags, files) |
| **Memory Contribution** | JSON retourné par chaque agent résumant son travail pour la mémoire collective |
| **Memory Context** | JSON injecté dans chaque appel agent contenant le travail précédent pertinent |
| **State Flags** | Booléens dans `projects.state_flags` (`strategy_validated`, `budget_approved`, etc.) |
| **MCP Server** | Serveur TypeScript exposant des fonctions d'API externe (GA4, Meta, etc.) |
| **The Deck** | Panneau droit de l'interface, affiche aide agent + widgets pinnés + contenu contextuel |
| **TeamDock** | Sidebar gauche avec les avatars d'agents |
| **Genesis** | Wizard de création de projet (étape 1 du flow) |
| **SharedProjectContext** | Objet JSON contenant l'état complet du projet, injecté dans chaque requête backend |
| **Smart Silos** | Isolation des données par projet (1 projet = 1 mémoire = 1 contexte) |
| **Mixture of Experts** | Architecture future (V5) : 5 IA parallèles avec biais différents pour décisions complexes |

---

**FIN DU PRD** — Ce document est la source de vérité pour toute décision d'implémentation.
