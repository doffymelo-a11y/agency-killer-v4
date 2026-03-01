# THE HIVE OS V4 - MANIFESTO & TECHNICAL BLUEPRINT
## "The Monday Killer" - AI-Powered Marketing ERP

**Version:** 4.3 "The Collective Memory"
**Date:** 2025-02-03
**Last Update:** 2026-02-03
**Vision:** L'ERP Marketing où l'IA planifie, exécute ET se souvient.

---

## 1. LA RUPTURE FONDAMENTALE (V3 → V4)

### Avant (V3) - Chat-Based
- L'utilisateur **demande**
- Mémoire = Historique linéaire de conversation
- Agents **lisent** le contexte
- Chat = Interface principale
- Concurrent de ChatGPT

### Après (V4) - State-Based
- L'IA **propose** les tâches
- Mémoire = **État du projet** (Postgres)
- Agents **lisent ET écrivent**
- Board = Interface principale, Chat = Exécution
- **Concurrent de Monday.com + Notion AI**

---

## 2. CORE FLOW

```
GENESIS → BOARD → CONTEXT MODAL → CHAT EXECUTION → WRITE-BACK → DONE
```

### Phase 1: Genesis (Onboarding)
- Si aucun projet : Wizard interactif (3-4 questions)
- PM Agent génère la structure projet (tasks + calendar + assignments)
- Output : Board pré-rempli avec tâches intelligentes

### Phase 2: Project View (Le QG)
- Board avec 3 vues : Tableur / Kanban / Calendrier
- Chaque tâche = bouton "Lancer"
- Quick Action = Discussion libre via Orchestrator

### Phase 3: Context Loop (Le Clic)
- User clique "Lancer" sur une tâche
- Modal affiche les questions contextuelles
- User répond → Redirection Chat avec Expert assigné
- Contexte pré-injecté automatiquement

### Phase 4: Write-Back (La Validation)
- Agent livre le travail dans le Chat
- User valide → Agent écrit dans le Project State
- Redirection Board → Tâche marquée "Done"

---

## 3. SHARED PROJECT STATE (Le Cahier de Projet)

### Concept
Ce n'est PAS un historique de conversation.
C'est un JSON structuré / BDD contenant la VÉRITÉ du projet à l'instant T.

### Exemple de Structure
```json
{
  "project_id": "proj_abc123",
  "project_name": "Campagne Été 2025",
  "status": "in_progress",
  "current_phase": "creative_production",

  "state_flags": {
    "strategy_validated": true,
    "budget_approved": true,
    "creatives_ready": false,
    "ads_live": false
  },

  "tasks": [
    {
      "id": "task_001",
      "title": "Définir le positionnement",
      "expert": "luna",
      "status": "done",
      "completed_at": "2025-02-01",
      "deliverable_url": null
    },
    {
      "id": "task_002",
      "title": "Créer 3 visuels Meta",
      "expert": "milo",
      "status": "in_progress",
      "context_questions": ["Format ?", "Accroche ?"],
      "user_inputs": { "format": "1080x1080", "accroche": "Soldes été" },
      "estimated_duration": 4,
      "due_date": "2025-02-10"
    }
  ],

  "metadata": {
    "website_url": "https://example.com",
    "monthly_budget": 5000,
    "campaign_launch_date": "2025-03-15",
    "target_audience": "25-45 ans, France"
  }
}
```

### La Magie du Write-Back
- Marcus lit `"creatives_ready": false` → Sait qu'il ne peut pas lancer les pubs
- Milo termine → Écrit `"creatives_ready": true`
- Marcus est automatiquement débloqué SANS intervention de l'utilisateur

---

## 4. ARCHITECTURE DES AGENTS

```
                    ┌──────────────────┐
                    │    POSTGRES      │
                    │  (Project State) │
                    └────────┬─────────┘
                             │
                      READ / WRITE
                             │
                    ┌────────▼─────────┐
                    │   ORCHESTRATOR   │
                    │  (State Machine) │
                    │                  │
                    │ • Route requests │
                    │ • Manage state   │
                    │ • Handle writes  │
                    └────────┬─────────┘
                             │
         ┌───────┬───────┬───┴───┬───────┬───────┐
         ▼       ▼       ▼       ▼       ▼       ▼
     ┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐
     │  PM  ││ LUNA ││ MILO ││MARCUS││ SORA │
     │ NEW! ││      ││      ││      ││      │
     └──────┘└──────┘└──────┘└──────┘└──────┘
```

### Les 6 Entités

| Agent | Rôle | Capacités Write-Back |
|-------|------|---------------------|
| **Orchestrator** | State Machine + Router | Gère tous les writes |
| **PM (NEW)** | Genesis + Planning | Crée tasks, calcule dates |
| **Luna** | Stratégie | `strategy_validated` |
| **Milo** | Créatif | `creatives_ready`, deliverables |
| **Marcus** | Ads/Trading | `ads_live`, budget_spent |
| **Sora** | Analytics | `report_generated` |

---

## 5. DATA SCHEMA (TypeScript)

```typescript
// ═══════════════════════════════════════════════════════════════
// PROJECT STATE
// ═══════════════════════════════════════════════════════════════

interface ProjectState {
  id: string;
  name: string;
  status: 'planning' | 'in_progress' | 'completed' | 'paused';
  current_phase: string;

  state_flags: {
    strategy_validated: boolean;
    budget_approved: boolean;
    creatives_ready: boolean;
    ads_live: boolean;
    [key: string]: boolean; // Extensible
  };

  tasks: Task[];

  metadata: ProjectMetadata;

  created_at: string;
  updated_at: string;
}

// ═══════════════════════════════════════════════════════════════
// TASK
// ═══════════════════════════════════════════════════════════════

interface Task {
  id: string;
  title: string;
  description?: string;

  expert_role: 'pm' | 'luna' | 'milo' | 'marcus' | 'sora';
  status: 'todo' | 'in_progress' | 'done' | 'blocked';

  // Context Loop
  context_questions: string[];
  user_inputs?: Record<string, string>;

  // Calendar Intelligence
  estimated_duration: number; // En heures
  due_date: string;

  // Dependencies (pour blocages automatiques)
  depends_on?: string[]; // task_ids

  // Deliverables
  deliverable_url?: string;
  deliverable_type?: 'image' | 'video' | 'pdf' | 'text';

  // Timestamps
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

// ═══════════════════════════════════════════════════════════════
// CHAT SESSION
// ═══════════════════════════════════════════════════════════════

interface ChatSession {
  id: string;
  project_id: string;

  // Mode
  mode: 'quick_research' | 'task_execution';
  linked_task_id?: string; // null si quick_research

  // Context injecté
  injected_context?: {
    task: Task;
    user_inputs: Record<string, string>;
    project_metadata: ProjectMetadata;
  };

  messages: ChatMessage[];

  created_at: string;
}

// ═══════════════════════════════════════════════════════════════
// PROJECT METADATA
// ═══════════════════════════════════════════════════════════════

interface ProjectMetadata {
  website_url?: string;
  industry?: string;
  target_audience?: string;
  monthly_budget?: number;
  campaign_launch_date?: string;
  competitors?: string[];
  usp?: string;
  brand_tone?: string;
}
```

---

## 6. FRONTEND VIEWS

### 6.1 Genesis View (Wizard)
- **Condition:** `projects.length === 0`
- **UI:** Wizard conditionnel multi-step (voir Section 13 pour la logique complète)
- **Output:** Appel PM Agent → Création projet + tasks adaptées au scope choisi

### 6.2 Board View (Le QG)
3 sous-onglets commutables :

| Vue | Librairie | Description |
|-----|-----------|-------------|
| **Tableur** | TanStack Table | Colonnes: Tâche, Expert, Deadline, Statut, Action |
| **Kanban** | @dnd-kit/core | Colonnes: To Do, In Progress, Done |
| **Calendrier** | FullCalendar | Distribution intelligente des tâches |

Chaque tâche possède :
- Badge Expert (couleur)
- Statut visuel
- Bouton "Lancer" (→ Context Modal)

**Quick Action Button (Header):**
- Ouvre Chat avec Orchestrator (silencieux)
- Routing automatique selon la demande

### 6.3 Context Modal
- **Trigger:** Clic sur "Lancer"
- **Contenu:** `task.context_questions` sous forme de formulaire
- **Submit:**
  1. Stocke `user_inputs`
  2. Set `chatMode: 'task_execution'`
  3. Redirect vers Chat View

### 6.4 Chat View (Execution Mode)

| Mode | Description | UI Spécifique |
|------|-------------|---------------|
| `quick_research` | Discussion libre | Pas de bouton validation |
| `task_execution` | Lié à une tâche | Bouton "Valider & Retour au Board" |

**En mode task_execution:**
- Header affiche la tâche en cours
- Contexte pré-injecté au premier message
- Bouton validation → Write-back → Redirect Board

### 6.5 Analytics Hub View (THE DATA OBSERVER)

**Concept:** Dashboarding temps réel connecté (simulé ou API) à GA4/GSC/Meta Ads.

**Intelligence:** L'IA ne fait pas que montrer les chiffres, elle les *interprète* :
- "Ton CPA a augmenté de 20% à cause de la créa B"
- "Le trafic organique a chuté suite à la Google Update de novembre"
- Alertes automatiques sur anomalies détectées

**Tech Stack:**
- Graphiques Recharts complexes (line, bar, pie, area)
- Cards KPI avec analyse de tendance (↑↓)
- Section "AI Insights" générée automatiquement
- Bouton "Parler à Sora" pour analyse approfondie

**Composants UI:**
| Composant | Description |
|-----------|-------------|
| `<KPICard />` | Métrique + tendance + interprétation AI |
| `<TrendChart />` | Graphique avec annotations contextuelles |
| `<AIInsightsPanel />` | Recommandations automatiques basées sur les données |
| `<DataSourceSelector />` | Choix GA4 / GSC / Meta Ads / All |

### 6.6 Files & Assets View (THE LIBRARIAN)

**Concept:** Un Drive intelligent où chaque fichier généré (PDF Audit, PNG Pub, DOCX Blog) est classé automatiquement par Projet.

**Intelligence:**
- Classification automatique par type (image, video, pdf, text)
- Tagging par agent créateur (Milo, Luna, Sora, Marcus)
- Recherche en langage naturel : "Ressors-moi les visuels de Noël 2024"
- Filtrage contextuel par projet, date, agent

**Tech Stack:**
- Grid/List view toggle
- Preview modal avec téléchargement
- Search bar avec NLP (via AI)
- Filtres multi-critères (agent, type, date)

**Composants UI:**
| Composant | Description |
|-----------|-------------|
| `<FileGrid />` | Affichage mosaïque des assets |
| `<FileList />` | Affichage liste avec métadonnées |
| `<FilePreview />` | Modal de prévisualisation |
| `<AISearchBar />` | Recherche en langage naturel |
| `<FilterPanel />` | Filtres par agent, type, projet |

**Interaction IA:**
- "Demander à l'IA" → Ouvre le chat en contexte fichiers
- L'IA peut filtrer, trier, suggérer des fichiers pertinents

---

## 7. CALENDAR INTELLIGENCE

### Input
```json
{
  "tasks": [
    { "title": "Stratégie", "estimated_duration": 4, "expert": "luna" },
    { "title": "Visuels x3", "estimated_duration": 8, "expert": "milo" },
    { "title": "Setup Ads", "estimated_duration": 2, "expert": "marcus" }
  ],
  "project_deadline": "2025-03-15",
  "today": "2025-02-03"
}
```

### Règles de Calcul (PM Agent)
1. Ne pas surcharger un jour (max 6h de tâches/jour)
2. Respecter les dépendances implicites (stratégie → créatifs → ads)
3. Laisser buffer avant deadline finale
4. Répartir équitablement sur les jours disponibles

### Output
```json
{
  "task_001": { "due_date": "2025-02-05" },
  "task_002": { "due_date": "2025-02-10" },
  "task_003": { "due_date": "2025-02-12" }
}
```

L'utilisateur peut ensuite **drag & drop** pour ajuster manuellement.

---

## 8. WRITE-BACK CYCLE (Diagramme)

```
┌─────────────────────────────────────────────────────────────────┐
│                     CYCLE WRITE-BACK                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. USER clique "Lancer" sur une tâche                         │
│                    ↓                                            │
│  2. MODAL demande le contexte (questions ciblées)              │
│                    ↓                                            │
│  3. PM AGENT transmet à ORCHESTRATOR :                         │
│     - task_id                                                   │
│     - expert_assigned                                           │
│     - user_inputs                                               │
│                    ↓                                            │
│  4. ORCHESTRATOR route vers l'EXPERT avec contexte injecté     │
│                    ↓                                            │
│  5. EXPERT travaille dans le CHAT                              │
│                    ↓                                            │
│  6. USER valide : "Oui c'est bon"                              │
│                    ↓                                            │
│  7. EXPERT exécute WRITE-BACK via ORCHESTRATOR :               │
│     - task.status = "done"                                      │
│     - state_flags.X = true                                      │
│     - deliverable_url = "..."                                   │
│                    ↓                                            │
│  8. POSTGRES mis à jour                                        │
│                    ↓                                            │
│  9. FRONTEND reçoit la mise à jour → Redirige vers BOARD       │
│                    ↓                                            │
│  10. TÂCHE apparaît barrée ✓                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. TECH STACK

### Frontend
| Composant | Technologie |
|-----------|-------------|
| Framework | React + TypeScript |
| State | Zustand (existant) + extension |
| Routing | React Router (à ajouter) |
| Tableur | TanStack Table v8 |
| Kanban | @dnd-kit/core |
| Calendar | @fullcalendar/react |
| UI | Tailwind + Framer Motion (existant) |

### Backend
| Composant | Technologie |
|-----------|-------------|
| Orchestration | n8n (existant) |
| Agents | MCP Workflows (existant) |
| Database | PostgreSQL (nouveau) |
| State Management | n8n + Postgres nodes |

### New n8n Nodes Required
- `READ_PROJECT_STATE` - Lecture de l'état projet
- `WRITE_PROJECT_STATE` - Mise à jour de l'état
- `PM_AGENT` - Nouvel agent Project Manager

---

## 10. IMPLEMENTATION PHASES

### Phase 0: Fondations
- [ ] Setup Postgres (local ou Supabase)
- [ ] Créer schéma DB (projects, tasks, sessions)
- [ ] Créer service API frontend ↔ Postgres

### Phase 1: Board Views
- [ ] Composant `<ProjectBoard />`
- [ ] Vue Tableur (TanStack Table)
- [ ] Vue Kanban (@dnd-kit)
- [ ] Vue Calendar (FullCalendar)
- [ ] TaskCard avec bouton "Lancer"

### Phase 2: Genesis Wizard
- [ ] Composant `<GenesisWizard />`
- [ ] Flow multi-step
- [ ] n8n: PM Agent workflow
- [ ] Génération automatique des tâches

### Phase 3: Context Loop
- [ ] `<TaskContextModal />`
- [ ] Injection contexte dans Chat
- [ ] Mode `task_execution` vs `quick_research`

### Phase 4: Write-Back
- [ ] n8n: WRITE_PROJECT_STATE node
- [ ] Frontend: Bouton "Valider & Retour"
- [ ] Synchronisation temps réel (WebSocket ou polling)

### Phase 5: Polish
- [ ] Calendar Intelligence (calcul dates)
- [ ] Quick Action button
- [ ] Animations et UX
- [ ] Tests E2E

---

## 11. SUCCESS METRICS

- **Time to First Task:** < 2 minutes (Genesis → Board)
- **Task Completion Rate:** > 80%
- **Context Questions Answered:** 100% avant exécution
- **Write-Back Success:** Tâche marquée done automatiquement

---

## 12. MANTRA

> "L'utilisateur ne devrait JAMAIS avoir à expliquer deux fois le même contexte.
> L'IA propose, l'humain valide, la ruche mémorise."
>
> **"Chaque abeille enrichit la ruche. Chaque agent enrichit le projet."**
>
> Ce que Luna découvre, Milo l'utilise.
> Ce que Milo crée, Marcus l'optimise.
> Ce que Sora mesure, tout le monde l'apprend.

---

## 13. GENESIS WIZARD - LOGIQUE D'ATTRIBUTION (V4.2)

### 13.1 Le Sélecteur Initial (Q0 - Le Scope)

Avant de plonger dans les détails, on définit le terrain de jeu.

**Question 0:** "Sur quel levier souhaitez-vous lancer ce nouveau projet ?"

| Option | Action |
|--------|--------|
| Meta Ads (Facebook/Instagram) | Déclenche Questionnaire A |
| Google Ads (SEM) | Déclenche Questionnaire B |
| SEO (Référencement Naturel) | Déclenche Questionnaire C |
| Analytics & Tracking (Fondations) | Déclenche Questionnaire D |
| **Full Scale (Lancement Complet)** | Déclenche A + B + C + D |

---

### 13.2 Questionnaire A: META ADS (Social Advertising)

```
Q1: Quel est l'objectif de la campagne ?
├─ a) Ventes / ROAS
│     → MARCUS: "Structuration Campagne CBO & Allocation Budget"
└─ b) Lead Gen
      → MARCUS: "Paramétrage Campagne Lead Gen & Ciblage"

Q2: Avez-vous les textes publicitaires (Ad Copy) ?
├─ a) Oui → (pas de tâche)
└─ b) Non
      → MILO: "Copywriting Ads : 3 variations (Hook/Corps/CTA)"

Q3: De quels assets visuels avez-vous besoin ?
├─ a) Images Statiques
│     → MILO: "Génération Visuels Midjourney/DALL-E"
└─ b) Vidéos
      → MILO: "Génération Vidéo (Runway) & Scripting"

Q4: Le Tracking est-il configuré ?
├─ a) Oui → (pas de tâche)
└─ b) Non
      → SORA: "Audit & Setup Pixel Meta via GTM"
```

**Note:** Milo gère TOUT le créatif (Image + Vidéo + Texte).

---

### 13.3 Questionnaire B: SEM (Google Ads)

```
Q1: Stratégie d'enchères ?
└─ a) Maximiser les conversions
      → MARCUS: "Setup Campagne Search & Stratégie d'Enchères"

Q2: Création des Annonces (RSA) ?
├─ a) À faire
│     → MILO: "Copywriting Titres & Descriptions Google Ads"
└─ b) Déjà fait → (pas de tâche)

Q3: Analyse de la rentabilité actuelle ?
├─ a) Besoin d'analyse
│     → SORA: "Analyse KPI & Audit compte Google Ads existant"
└─ b) Pas nécessaire → (pas de tâche)
```

---

### 13.4 Questionnaire C: SEO (Search Engine Optimization)

```
Q1: Avez-vous besoin d'un état des lieux ?
├─ a) Oui
│     → LUNA: "Audit SEO Technique & Sémantique complet"
└─ b) Non, j'ai ma stratégie → (pas de tâche)

Q2: Quelle est votre cible de mots-clés ?
├─ a) Je ne sais pas
│     → LUNA: "Recherche Opportunités Keywords & Analyse Concurrence"
└─ b) J'ai ma liste → (pas de tâche)

Q3: Qui rédige les contenus ?
├─ a) L'IA (Nous)
│     → MILO: "Rédaction Articles de Blog optimisés SEO"
│       (sur brief de Luna - DÉPENDANCE)
└─ b) En interne → (pas de tâche)

Q4: Comment suivrons-nous les résultats ?
└─ a) Google Search Console
      → SORA: "Connexion GSC & Configuration Rapport de Positionnement"
```

**Logique importante:** Luna définit la stratégie (QUOI dire), Milo rédige (COMMENT le dire).

---

### 13.5 Questionnaire D: ANALYTICS (Tracking & Data)

```
Q1: L'infrastructure de mesure est-elle prête ?
├─ a) Non
│     → SORA: "Plan de Taggage complet (GA4 + GTM)"
└─ b) Oui → (pas de tâche)

Q2: Avez-vous des anomalies de données ?
├─ a) Oui (Différence Back-office vs Analytics)
│     → SORA: "Détection anomalies & Debugging Data Layer"
└─ b) Non → (pas de tâche)
```

---

### 13.6 Agent Roles Mapping (JSON pour PM Agent)

```json
{
  "agent_roles": {
    "SORA": {
      "role": "Analyst",
      "expertise": [
        "GA4",
        "GTM",
        "KPI Analysis",
        "Tracking Setup",
        "Debugging",
        "Reporting"
      ],
      "color": "#3B82F6"
    },
    "LUNA": {
      "role": "Strategist",
      "expertise": [
        "SEO Audit",
        "Keyword Research",
        "Content Strategy",
        "Competitor Analysis",
        "Positioning"
      ],
      "color": "#8B5CF6"
    },
    "MARCUS": {
      "role": "Trader",
      "expertise": [
        "Paid Ads Setup",
        "Budget Allocation",
        "Scaling Decisions",
        "Cutting Decisions",
        "Campaign Optimization"
      ],
      "color": "#10B981"
    },
    "MILO": {
      "role": "Creative",
      "expertise": [
        "Copywriting",
        "Image Generation",
        "Video Generation",
        "Brainstorming",
        "Content Production"
      ],
      "color": "#EC4899"
    }
  }
}
```

---

### 13.7 Workflow Logic (Task Generation Templates)

```json
{
  "workflow_logic": [
    {
      "context": "NEW_PROJECT_META_ADS",
      "tasks_to_generate": [
        {
          "title": "Setup Technique & Budget CBO",
          "assignee": "MARCUS",
          "phase": "Setup",
          "estimated_hours": 2,
          "context_questions": [
            "Budget quotidien ?",
            "Objectif ROAS cible ?",
            "Audiences existantes ?"
          ]
        },
        {
          "title": "Setup Tracking (Pixel/CAPI)",
          "assignee": "SORA",
          "phase": "Setup",
          "estimated_hours": 3,
          "context_questions": [
            "GTM déjà installé ?",
            "Événements à tracker ?"
          ]
        },
        {
          "title": "Production Créative (Visuels + Copy)",
          "assignee": "MILO",
          "phase": "Production",
          "estimated_hours": 4,
          "depends_on": ["Setup Tracking"],
          "context_questions": [
            "Format préféré ?",
            "Ton de la marque ?",
            "Éléments visuels existants ?"
          ]
        }
      ]
    },
    {
      "context": "NEW_PROJECT_SEO",
      "tasks_to_generate": [
        {
          "title": "Audit Sémantique & Technique",
          "assignee": "LUNA",
          "phase": "Audit",
          "estimated_hours": 5,
          "context_questions": [
            "URL du site ?",
            "Concurrents principaux ?",
            "Mots-clés prioritaires ?"
          ]
        },
        {
          "title": "Configuration GSC & Analytics",
          "assignee": "SORA",
          "phase": "Setup",
          "estimated_hours": 1,
          "context_questions": [
            "Accès GSC disponible ?",
            "GA4 configuré ?"
          ]
        },
        {
          "title": "Rédaction Page Pilier",
          "assignee": "MILO",
          "phase": "Production",
          "depends_on": ["Audit Sémantique & Technique"],
          "estimated_hours": 3,
          "context_questions": [
            "Sujet principal ?",
            "Longueur souhaitée ?",
            "Call-to-action ?"
          ]
        }
      ]
    },
    {
      "context": "NEW_PROJECT_SEM",
      "tasks_to_generate": [
        {
          "title": "Setup Campagne Search",
          "assignee": "MARCUS",
          "phase": "Setup",
          "estimated_hours": 3,
          "context_questions": [
            "Budget mensuel ?",
            "Zones géographiques ?",
            "Stratégie d'enchères ?"
          ]
        },
        {
          "title": "Copywriting RSA",
          "assignee": "MILO",
          "phase": "Production",
          "estimated_hours": 2,
          "context_questions": [
            "USP principale ?",
            "Offre à mettre en avant ?",
            "Ton souhaité ?"
          ]
        },
        {
          "title": "Audit Compte Existant",
          "assignee": "SORA",
          "phase": "Audit",
          "estimated_hours": 2,
          "context_questions": [
            "Accès Google Ads ?",
            "Historique de performance ?"
          ]
        }
      ]
    },
    {
      "context": "NEW_PROJECT_ANALYTICS",
      "tasks_to_generate": [
        {
          "title": "Plan de Taggage GA4 + GTM",
          "assignee": "SORA",
          "phase": "Setup",
          "estimated_hours": 4,
          "context_questions": [
            "Événements clés à tracker ?",
            "Conversions principales ?",
            "Intégrations tierces ?"
          ]
        },
        {
          "title": "Debugging Data Layer",
          "assignee": "SORA",
          "phase": "Audit",
          "estimated_hours": 2,
          "depends_on": ["Plan de Taggage GA4 + GTM"],
          "context_questions": [
            "Anomalies constatées ?",
            "Différences avec back-office ?"
          ]
        }
      ]
    },
    {
      "context": "NEW_PROJECT_FULL_SCALE",
      "description": "Combine toutes les tâches de A + B + C + D avec ordonnancement intelligent",
      "phase_order": ["Audit", "Setup", "Production", "Optimization"],
      "auto_dependencies": true
    }
  ]
}
```

---

### 13.8 Frontend Implementation - Wizard State Machine

```typescript
// ═══════════════════════════════════════════════════════════════
// GENESIS WIZARD TYPES
// ═══════════════════════════════════════════════════════════════

type ProjectScope = 'meta_ads' | 'sem' | 'seo' | 'analytics' | 'full_scale';

interface GenesisWizardState {
  step: number;
  scope: ProjectScope | null;
  answers: Record<string, string>;
  generatedTasks: Task[];
  isGenerating: boolean;
}

interface WizardQuestion {
  id: string;
  question: string;
  options: {
    value: string;
    label: string;
    generates_task?: {
      title: string;
      assignee: AgentRole;
      estimated_hours: number;
    };
  }[];
  condition?: (answers: Record<string, string>) => boolean;
}

// ═══════════════════════════════════════════════════════════════
// WIZARD FLOW CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const WIZARD_FLOWS: Record<ProjectScope, WizardQuestion[]> = {
  meta_ads: [
    {
      id: 'meta_objective',
      question: "Quel est l'objectif de la campagne ?",
      options: [
        {
          value: 'roas',
          label: 'Ventes / ROAS',
          generates_task: {
            title: 'Structuration Campagne CBO & Allocation Budget',
            assignee: 'marcus',
            estimated_hours: 2
          }
        },
        {
          value: 'lead_gen',
          label: 'Lead Generation',
          generates_task: {
            title: 'Paramétrage Campagne Lead Gen & Ciblage',
            assignee: 'marcus',
            estimated_hours: 2
          }
        }
      ]
    },
    {
      id: 'meta_copy',
      question: "Avez-vous les textes publicitaires (Ad Copy) ?",
      options: [
        { value: 'yes', label: 'Oui, ils sont prêts' },
        {
          value: 'no',
          label: 'Non, à créer',
          generates_task: {
            title: 'Copywriting Ads : 3 variations (Hook/Corps/CTA)',
            assignee: 'milo',
            estimated_hours: 3
          }
        }
      ]
    },
    {
      id: 'meta_visuals',
      question: "De quels assets visuels avez-vous besoin ?",
      options: [
        {
          value: 'images',
          label: 'Images Statiques',
          generates_task: {
            title: 'Génération Visuels Midjourney/DALL-E',
            assignee: 'milo',
            estimated_hours: 4
          }
        },
        {
          value: 'videos',
          label: 'Vidéos',
          generates_task: {
            title: 'Génération Vidéo (Runway) & Scripting',
            assignee: 'milo',
            estimated_hours: 6
          }
        },
        { value: 'none', label: 'J\'ai déjà mes assets' }
      ]
    },
    {
      id: 'meta_tracking',
      question: "Le Tracking est-il configuré ?",
      options: [
        { value: 'yes', label: 'Oui, Pixel + CAPI actifs' },
        {
          value: 'no',
          label: 'Non, à configurer',
          generates_task: {
            title: 'Audit & Setup Pixel Meta via GTM',
            assignee: 'sora',
            estimated_hours: 3
          }
        }
      ]
    }
  ],
  // ... autres flows (sem, seo, analytics)
};
```

---

### 13.9 Diagramme de Flux Genesis

```
┌─────────────────────────────────────────────────────────────────┐
│                     GENESIS WIZARD FLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. USER arrive (aucun projet)                                  │
│                    ↓                                            │
│  2. WIZARD affiche Q0 (Sélecteur de Scope)                     │
│     [ ] Meta Ads  [ ] SEM  [ ] SEO  [ ] Analytics  [ ] Full    │
│                    ↓                                            │
│  3. USER sélectionne → Active le questionnaire correspondant   │
│                    ↓                                            │
│  4. WIZARD pose les questions conditionnelles                   │
│     → Chaque réponse peut générer 0 ou 1 tâche                 │
│                    ↓                                            │
│  5. Fin du questionnaire → PM AGENT reçoit :                   │
│     - scope                                                     │
│     - answers                                                   │
│     - tasks_generated (partiellement rempli)                   │
│                    ↓                                            │
│  6. PM AGENT enrichit et ordonnance :                          │
│     - Ajoute context_questions manquantes                      │
│     - Calcule due_dates (Calendar Intelligence)                │
│     - Définit depends_on                                        │
│                    ↓                                            │
│  7. WRITE to Postgres (project + tasks)                        │
│                    ↓                                            │
│  8. REDIRECT vers Board View                                    │
│     → Tâches apparaissent ordonnées et prêtes                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 14. TECHNICAL DECISIONS (VALIDÉES)

### 14.1 State Machine Frontend (XState Pattern)

```typescript
// Approche robuste pour les transitions conditionnelles du Wizard
type WizardEvent =
  | { type: 'SELECT_SCOPE'; scope: ProjectScope }
  | { type: 'ANSWER'; questionId: string; value: string }
  | { type: 'NEXT' }
  | { type: 'BACK' }
  | { type: 'SUBMIT' };

type WizardState =
  | { status: 'scope_selection' }
  | { status: 'questionnaire'; scope: ProjectScope; step: number }
  | { status: 'preview'; tasks: Task[] }
  | { status: 'generating' }
  | { status: 'complete'; projectId: string };
```

**Pourquoi XState/Reducer plutôt que useState:**
- Transitions explicites et prévisibles
- Impossible d'atteindre un état invalide
- Facilite le "Back" sans perdre les réponses
- Testable unitairement

### 14.2 Full Scale = Merge Intelligent

Quand l'utilisateur choisit "Full Scale", le système doit :

```typescript
function mergeQuestionnaires(scopes: ProjectScope[]): WizardQuestion[] {
  const allQuestions = scopes.flatMap(s => WIZARD_FLOWS[s]);

  // 1. Dédupliquer par domaine (ex: Tracking apparaît 1 seule fois)
  const deduped = deduplicateByDomain(allQuestions);

  // 2. Ordonnancer par phase
  const phaseOrder = ['Audit', 'Setup', 'Production', 'Optimization'];
  return sortByPhase(deduped, phaseOrder);
}
```

**Règles de déduplication:**
- Si Tracking demandé dans Meta ET Analytics → 1 seule tâche SORA (la plus complète)
- Si Copy demandé dans Meta ET SEM → 2 tâches MILO distinctes (contextes différents)

### 14.3 PM Agent Contract (n8n Workflow)

**Input attendu:**
```json
{
  "scope": "meta_ads" | "sem" | "seo" | "analytics" | "full_scale",
  "answers": {
    "meta_objective": "roas",
    "meta_copy": "no",
    "meta_visuals": "images",
    "meta_tracking": "no"
  },
  "project_name": "Campagne Été 2025",
  "deadline": "2025-03-15"
}
```

**Output attendu (JSON strict):**
```json
{
  "project": {
    "name": "Campagne Été 2025",
    "scope": "meta_ads",
    "status": "planning"
  },
  "tasks": [
    {
      "title": "Structuration Campagne CBO & Allocation Budget",
      "assignee": "marcus",
      "phase": "Setup",
      "estimated_hours": 2,
      "due_date": "2025-02-10",
      "context_questions": [
        "Budget quotidien prévu ?",
        "ROAS cible ?",
        "Audiences existantes à réutiliser ?"
      ],
      "depends_on": []
    },
    {
      "title": "Audit & Setup Pixel Meta via GTM",
      "assignee": "sora",
      "phase": "Setup",
      "estimated_hours": 3,
      "due_date": "2025-02-08",
      "context_questions": [
        "GTM déjà installé ?",
        "Événements de conversion à tracker ?"
      ],
      "depends_on": []
    },
    {
      "title": "Génération Visuels Midjourney/DALL-E",
      "assignee": "milo",
      "phase": "Production",
      "estimated_hours": 4,
      "due_date": "2025-02-12",
      "context_questions": [
        "Format préféré (carré, story, paysage) ?",
        "Éléments de marque à inclure ?",
        "Références visuelles ?"
      ],
      "depends_on": ["Audit & Setup Pixel Meta via GTM"]
    },
    {
      "title": "Copywriting Ads : 3 variations",
      "assignee": "milo",
      "phase": "Production",
      "estimated_hours": 3,
      "due_date": "2025-02-12",
      "context_questions": [
        "Ton de la marque ?",
        "Offre principale à mettre en avant ?",
        "Call-to-action souhaité ?"
      ],
      "depends_on": []
    }
  ]
}
```

---

## 15. MÉMOIRE COLLECTIVE DES AGENTS (V4.3 - LA RUCHE)

### 15.1 Concept Fondamental

> **"Chaque abeille enrichit la ruche. Chaque agent enrichit le projet."**

La Mémoire Collective est le système qui permet à chaque agent d'inscrire ce qu'il a fait pour que le prochain agent sache exactement où en est le projet. C'est la **conscience partagée de la ruche**.

### 15.2 Architecture : PM comme Cerveau Central

```
┌─────────────────────────────────────────────────────────────────┐
│                  MÉMOIRE COLLECTIVE ARCHITECTURE                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                      ┌─────────────┐                            │
│                      │  SUPABASE   │                            │
│                      │  (Source of │                            │
│                      │   Truth)    │                            │
│                      └──────┬──────┘                            │
│                             │                                   │
│                        READ │ WRITE                             │
│                             │                                   │
│                      ┌──────▼──────┐                            │
│        ┌─────────────┤     PM      ├─────────────┐              │
│        │             │ (Cerveau    │             │              │
│        │             │  Central)   │             │              │
│        │             └──────┬──────┘             │              │
│        │                    │                    │              │
│   ┌────▼────┐         ┌─────▼─────┐        ┌────▼────┐         │
│   │  LIRE   │         │  INJECTER │        │ ÉCRIRE  │         │
│   │ Mémoire │         │  Contexte │        │ Résultat│         │
│   └────┬────┘         └─────┬─────┘        └────▲────┘         │
│        │                    │                   │               │
│        │              ┌─────▼─────┐             │               │
│        │              │ORCHESTRATOR│             │               │
│        │              │  (Router)  │             │               │
│        │              └─────┬─────┘             │               │
│        │                    │                   │               │
│        │    ┌───────┬───────┼───────┬───────┐   │               │
│        │    ▼       ▼       ▼       ▼       ▼   │               │
│        │ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐       │               │
│        │ │LUNA │ │MILO │ │MARCUS│ │SORA │       │               │
│        │ └──┬──┘ └──┬──┘ └──┬──┘ └──┬──┘       │               │
│        │    │       │       │       │          │               │
│        │    └───────┴───────┴───────┴──────────┘               │
│        │                 RÉSULTAT                               │
│        │                    │                                   │
│        └────────────────────┘                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Pourquoi PM comme cerveau central ?**
- **Un seul point d'écriture** : Cohérence garantie
- **Agents simples** : Reçoivent contexte → Produisent résultat
- **Traçabilité** : PM log tout ce qui passe
- **Évolutivité** : Facile d'ajouter de nouveaux agents

### 15.3 Structure de la Mémoire Collective

```json
{
  "project_id": "proj_abc123",
  "project_name": "Campagne Été 2025",

  "collective_memory": {
    "last_updated": "2025-02-03T14:30:00Z",
    "summary": "Luna a validé la stratégie SEO. Milo a créé 3 visuels.",

    "agent_contributions": [
      {
        "agent": "luna",
        "task_id": "task_001",
        "action": "AUDIT_SEO_COMPLETED",
        "timestamp": "2025-02-01T10:00:00Z",
        "summary": "Audit SEO complet réalisé. 47 opportunités de mots-clés identifiées.",
        "key_findings": [
          "Position moyenne actuelle: 34",
          "Mot-clé principal: 'logiciel marketing'",
          "Concurrents analysés: HubSpot, Semrush, Ahrefs"
        ],
        "deliverables": [
          { "type": "pdf", "url": "https://...", "title": "Audit SEO Complet" }
        ],
        "recommendations_for_next_agent": [
          "Cibler les mots-clés longue traîne d'abord",
          "Éviter les termes trop génériques",
          "Ton recommandé: Expert & Accessible"
        ]
      },
      {
        "agent": "milo",
        "task_id": "task_002",
        "action": "VISUALS_CREATED",
        "timestamp": "2025-02-02T15:00:00Z",
        "summary": "3 visuels créés pour campagne Meta Ads.",
        "key_findings": [
          "Format: 1080x1080 (carré)",
          "Style: Minimaliste tech",
          "Couleurs: Dégradé violet/bleu"
        ],
        "deliverables": [
          { "type": "image", "url": "https://...", "title": "Visual 1 - Hero" },
          { "type": "image", "url": "https://...", "title": "Visual 2 - Features" },
          { "type": "image", "url": "https://...", "title": "Visual 3 - CTA" }
        ],
        "recommendations_for_next_agent": [
          "Utiliser l'accroche 'Automatisez votre marketing'",
          "CTA recommandé: 'Essai gratuit 14 jours'",
          "Le visuel 1 a le meilleur potentiel de hook"
        ]
      }
    ],

    "shared_context": {
      "validated_strategy": {
        "positioning": "Solution tout-en-un pour PME",
        "target_persona": "Directeur Marketing PME, 35-50 ans",
        "usp": "L'IA qui planifie ET exécute",
        "tone": "Expert mais accessible",
        "competitors": ["HubSpot", "Monday.com", "Notion"]
      },
      "validated_assets": {
        "keywords": ["logiciel marketing", "automatisation marketing", "IA marketing"],
        "visuals_ready": true,
        "copy_ready": false
      },
      "blockers": [],
      "next_priority": "task_003 - Copywriting Ads"
    }
  },

  "state_flags": {
    "strategy_validated": true,
    "creatives_ready": true,
    "copy_ready": false,
    "tracking_ready": true,
    "ads_live": false
  }
}
```

### 15.4 Cycle de Vie d'une Tâche avec Mémoire

```
┌─────────────────────────────────────────────────────────────────┐
│               CYCLE TÂCHE AVEC MÉMOIRE COLLECTIVE               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. USER clique "Lancer" sur tâche "Copywriting Ads"           │
│                    ↓                                            │
│  2. PM lit la Mémoire Collective :                             │
│     - Luna a fait: "Cibler longue traîne, ton expert"          │
│     - Milo a fait: "3 visuels, accroche 'Automatisez...'"      │
│                    ↓                                            │
│  3. PM construit le CONTEXTE ENRICHI :                         │
│     {                                                           │
│       "task": "Copywriting Ads",                               │
│       "assignee": "milo",                                      │
│       "memory_injection": {                                    │
│         "from_luna": "Ton: Expert & Accessible",               │
│         "from_milo_visuals": "Accroche: Automatisez...",       │
│         "validated_usp": "L'IA qui planifie ET exécute"        │
│       }                                                        │
│     }                                                           │
│                    ↓                                            │
│  4. PM → ORCHESTRATOR → MILO avec contexte injecté             │
│                    ↓                                            │
│  5. MILO produit le copywriting COHÉRENT avec les travaux      │
│     précédents (il sait ce que Luna et lui-même ont fait)      │
│                    ↓                                            │
│  6. USER valide : "C'est parfait"                              │
│                    ↓                                            │
│  7. PM ÉCRIT dans la Mémoire Collective :                      │
│     - agent_contributions.push(milo_copywriting)               │
│     - shared_context.validated_assets.copy_ready = true        │
│     - state_flags.copy_ready = true                            │
│                    ↓                                            │
│  8. MARCUS (prochain agent) pourra LIRE :                      │
│     "Luna: stratégie SEO validée"                              │
│     "Milo: 3 visuels + 3 copies prêts"                         │
│     → Marcus sait qu'il peut lancer la campagne                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 15.5 Format d'Injection pour les Agents

Quand PM appelle un agent, il injecte ce contexte :

```json
{
  "chatInput": "Rédige 3 variations de copy pour les ads Meta",
  "task_context": {
    "task_id": "task_003",
    "task_title": "Copywriting Ads",
    "user_inputs": {
      "tone": "Expert mais accessible",
      "cta": "Essai gratuit 14 jours"
    }
  },
  "memory_context": {
    "project_summary": "Campagne Été 2025 - PME Marketing Automation",
    "previous_work": [
      {
        "agent": "luna",
        "what_was_done": "Audit SEO - 47 keywords identifiés",
        "key_recommendations": [
          "Cibler: 'automatisation marketing PME'",
          "Éviter: termes trop génériques",
          "Ton: Expert & Accessible"
        ]
      },
      {
        "agent": "milo",
        "what_was_done": "3 visuels campagne créés",
        "key_recommendations": [
          "Accroche suggérée: 'Automatisez votre marketing'",
          "Visual 1 = meilleur potentiel hook"
        ]
      }
    ],
    "validated_elements": {
      "usp": "L'IA qui planifie ET exécute",
      "persona": "Directeur Marketing PME, 35-50 ans",
      "competitors_to_beat": ["HubSpot", "Monday.com"]
    },
    "constraints": [
      "Ne pas mentionner de prix dans les copies",
      "Éviter le jargon technique"
    ]
  }
}
```

### 15.6 Format de Retour des Agents (Write-Back)

Chaque agent doit retourner ses contributions pour enrichir la mémoire :

```json
{
  "chat_message": "Voici les 3 variations de copy...",
  "ui_components": [...],

  "memory_contribution": {
    "action": "COPYWRITING_COMPLETED",
    "summary": "3 variations de copy créées pour Meta Ads",
    "key_findings": [
      "Hook le plus percutant: 'Stop au marketing manuel'",
      "CTA testé: 'Démarrer gratuitement'"
    ],
    "deliverables": [
      { "type": "text", "content": "Copy 1: ...", "title": "Variation A - Urgence" },
      { "type": "text", "content": "Copy 2: ...", "title": "Variation B - Bénéfice" },
      { "type": "text", "content": "Copy 3: ...", "title": "Variation C - Social Proof" }
    ],
    "recommendations_for_next_agent": [
      "Variation A recommandée pour test initial",
      "Budget suggéré: 50€/jour minimum pour A/B test",
      "Cibler l'audience 'Marketing Managers' en priorité"
    ],
    "flags_to_update": {
      "copy_ready": true
    }
  }
}
```

### 15.7 Règles de la Mémoire Collective

1. **PM est le SEUL à écrire dans Supabase**
   - Les agents retournent des `memory_contribution`
   - PM valide et écrit

2. **Chaque agent REÇOIT le contexte pertinent**
   - Pas toute la mémoire (trop volumineux)
   - Seulement ce qui est utile pour sa tâche

3. **Les recommandations sont PROPAGÉES**
   - Ce que Luna recommande → Milo le voit
   - Ce que Milo crée → Marcus le voit

4. **La mémoire est CUMULATIVE**
   - On ne supprime jamais (historique complet)
   - On ajoute toujours (enrichissement continu)

5. **Le summary est MIS À JOUR à chaque action**
   - Résumé lisible par humain
   - Utile pour le debug et l'affichage frontend

### 15.8 Bénéfices de la Mémoire Collective

| Sans Mémoire Collective | Avec Mémoire Collective |
|------------------------|-------------------------|
| Marcus ne sait pas que Luna a défini le ton | Marcus applique le ton validé par Luna |
| Milo refait un travail déjà fait | Milo s'appuie sur les visuels existants |
| Chaque agent repart de zéro | Chaque agent enrichit le travail précédent |
| Incohérences entre les livrables | Cohérence totale du projet |
| L'utilisateur doit répéter le contexte | L'utilisateur valide, la ruche mémorise |

### 15.9 Table Supabase pour la Mémoire

```sql
-- Table: project_memory
CREATE TABLE project_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  -- Contribution
  agent_id TEXT NOT NULL, -- 'luna', 'milo', 'marcus', 'sora'
  task_id UUID REFERENCES tasks(id),
  action TEXT NOT NULL, -- 'AUDIT_COMPLETED', 'VISUALS_CREATED', etc.

  -- Content
  summary TEXT NOT NULL,
  key_findings JSONB DEFAULT '[]',
  deliverables JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour requêtes rapides
CREATE INDEX idx_project_memory_project ON project_memory(project_id);
CREATE INDEX idx_project_memory_agent ON project_memory(agent_id);

-- Vue pour le contexte injecté
CREATE VIEW v_project_context AS
SELECT
  project_id,
  jsonb_agg(
    jsonb_build_object(
      'agent', agent_id,
      'what_was_done', summary,
      'recommendations', recommendations
    ) ORDER BY created_at DESC
  ) as memory_context
FROM project_memory
GROUP BY project_id;
```

---

## 16. IMPLEMENTATION CHECKLIST (MISE À JOUR V4.3)

### Phase 0: Fondations
- [x] Setup Supabase (Database + Auth + Realtime)
- [x] Créer schéma DB (projects, tasks)
- [ ] Créer table `project_memory` pour Mémoire Collective
- [ ] Configurer Row Level Security
- [x] Créer hooks Zustand pour sync real-time

### Phase 1: Genesis Wizard
- [x] Composant `<ScopeSelector />` (Q0)
- [x] Composant `<WizardQuestion />` générique
- [x] State machine pour navigation conditionnelle
- [ ] Service `pmAgent.generateTasks(scope, answers)` via n8n
- [x] Animation de transition Wizard → Board

### Phase 2: Board Views
- [x] Composant `<ProjectBoard />` avec toggle vues
- [x] Vue Tableur (TanStack Table)
- [ ] Vue Kanban (@dnd-kit)
- [ ] Vue Calendar (FullCalendar)
- [x] TaskCard avec badge agent + bouton "Lancer"

### Phase 3: Context Loop & Execution
- [x] `<TaskContextModal />` avec questions dynamiques
- [x] Mode `task_execution` dans Chat
- [x] Injection contexte automatique
- [x] Bouton "Valider & Retour au Board"
- [x] UI Components avec boutons téléchargement

### Phase 4: Mémoire Collective (V4.3 - NOUVEAU)
- [ ] Table Supabase `project_memory`
- [ ] PM: Lecture mémoire avant appel agent
- [ ] PM: Injection contexte enrichi (previous_work, recommendations)
- [ ] Agents: Retour `memory_contribution` dans réponse
- [ ] PM: Écriture résultat dans mémoire
- [ ] Frontend: Affichage résumé mémoire dans Board

### Phase 5: n8n Flows
- [ ] PM Flow: Entry Point central
- [ ] PM Flow: Genesis Handler
- [ ] PM Flow: Task Launch avec injection mémoire
- [ ] PM Flow: Quick Action
- [ ] PM Flow: Write-Back centralisé
- [ ] Orchestrator: Mise à jour pour recevoir contexte mémoire
- [ ] Agents: Mise à jour pour retourner memory_contribution

---

## 17. SUCCESS METRICS (V4.3)

| Métrique | Cible | Mesure |
|----------|-------|--------|
| Time to First Board | < 90s | Genesis start → Board visible |
| Questions Answering Rate | 100% | Toutes questions wizard répondues |
| Task Generation Accuracy | > 95% | Tâches pertinentes vs scope |
| Write-Back Success Rate | > 99% | Tâches marquées done sans erreur |
| Real-time Sync Latency | < 500ms | Update Postgres → UI refresh |
| **Memory Propagation** | **100%** | **Contexte transmis entre agents** |
| **Agent Coherence** | **> 90%** | **Livrables alignés avec travaux précédents** |

---

*Document mis à jour le 2026-02-03 - THE HIVE OS V4.3 "The Collective Memory"*
