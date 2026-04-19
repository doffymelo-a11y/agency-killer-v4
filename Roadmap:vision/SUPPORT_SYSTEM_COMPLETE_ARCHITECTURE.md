# Support System - Architecture Complète Multi-Niveaux
**Date**: 2026-04-18
**Vision**: Production-Ready SaaS avec séparation Client/Admin/Super Admin
**Status**: ARCHITECTURE DÉFINITIVE

---

## 🎭 LES 3 NIVEAUX D'ACCÈS

### Niveau 1 : UTILISATEUR (Customer)
**Qui** : Client qui utilise Hive OS pour son business
**Accès** : Application principale (app.hive-os.com)
**Peut** :
- ✅ Utiliser les 4 agents IA (Luna, Sora, Marcus, Milo)
- ✅ Créer et gérer ses projets
- ✅ Voir ses tasks et deliverables
- ✅ **Créer des tickets de support** quand il a un problème
- ✅ Voir et répondre à SES tickets de support uniquement

**Ne peut PAS** :
- ❌ Voir les tickets des autres utilisateurs
- ❌ Accéder au dashboard admin (monitoring système)
- ❌ Modifier le statut/priorité des tickets
- ❌ Voir les metrics système ou les logs

---

### Niveau 2 : ADMIN (Customer Success / Support Agent)
**Qui** : Utilisateur avec rôle 'admin' (client premium ou membre d'équipe)
**Accès** : Application principale + Dashboard Admin
**Peut** :
- ✅ **Tout ce qu'un utilisateur peut faire**
- ✅ Accéder au dashboard admin (monitoring, stats, agent activity)
- ✅ Voir les métriques de performance des agents
- ✅ Voir les logs système de SON compte/organisation
- ✅ Gérer les utilisateurs de SON organisation (si multi-user)

**Ne peut PAS** :
- ❌ Voir les tickets des AUTRES organisations
- ❌ Accéder aux tickets de support GLOBAUX
- ❌ Modifier le code ou corriger des bugs
- ❌ Voir les failles de sécurité système
- ❌ Accéder aux logs systèmes globaux

**Use Case** :
Un client entreprise avec plusieurs utilisateurs. L'admin de l'entreprise peut monitorer l'usage de son équipe, voir les stats, mais reste dans SON périmètre.

---

### Niveau 3 : SUPER ADMIN (Fondateur / DevOps)
**Qui** : Toi, le fondateur de Hive OS
**Accès** : **Interface Backoffice Externe** (backoffice.hive-os.com)
**Peut** :
- ✅ **Voir TOUS les tickets de TOUS les clients**
- ✅ Gérer les bugs, failles de sécurité, feature requests
- ✅ Accéder aux logs système GLOBAUX (tous les users)
- ✅ Monitorer la santé de toute la plateforme
- ✅ Accéder à la base de données (via interface sécurisée)
- ✅ Déclencher des corrections de code (via Claude Code)
- ✅ Gérer les déploiements et mises à jour
- ✅ Voir les métriques business (MRR, churn, usage)
- ✅ Gérer les rôles et permissions de tous les users

**Use Case** :
Tu es en mode "maintenance" de l'outil. Tu vois tous les problèmes remontés par les clients, tu les corriges, tu déploies. C'est ton cockpit de gestion de la plateforme.

---

## 🏗️ ARCHITECTURE TECHNIQUE - 2 APPLICATIONS

### A. APPLICATION PRINCIPALE (Frontend Client)
**URL** : `app.hive-os.com` ou `localhost:5173` (dev)
**Stack** : React + Vite + Supabase (existant)
**Rôles** : user, admin

#### Routes Utilisateur (Tous)
```
/                       → Dashboard (projets, agents)
/project/:id            → Détail projet
/support                → Liste SES tickets (vue client)
/support/:id            → Détail ticket (vue client simplifiée)
/settings               → Paramètres compte
```

#### Routes Admin (role: admin)
```
/admin                  → Admin Dashboard
  ├── Tab Users         → Users de SON organisation
  ├── Tab Tickets       → Tickets de SON organisation (si multi-user)
  ├── Tab SLA           → SLA de son organisation
  ├── Tab System Health → Health check (backend, MCP, Supabase)
  ├── Tab Agent Activity→ Activity de SES agents
  └── Tab Business Stats→ Stats de SON usage
```

**Sécurité** :
- Auth via Supabase Auth (JWT)
- RLS policies : user ne voit QUE ses données
- Admin ne voit QUE les données de son organisation
- Pas d'accès aux données des autres clients

---

### B. BACKOFFICE SUPER ADMIN (Interface Externe)
**URL** : `backoffice.hive-os.com` ou `localhost:5174` (dev)
**Stack** : React + Vite + Supabase (NOUVEAU projet)
**Rôle** : super_admin UNIQUEMENT

#### Architecture du Backoffice
```
backoffice/
  package.json
  vite.config.ts
  src/
    main.tsx
    App.tsx
    views/
      LoginView.tsx              → Login super admin (sécurisé, 2FA)
      DashboardView.tsx          → Overview global
      TicketsView.tsx            → TOUS les tickets de TOUS les clients
      TicketDetailView.tsx       → Détail ticket + Actions super admin
      BugsView.tsx               → Liste bugs critiques
      SecurityView.tsx           → Failles de sécurité détectées
      LogsView.tsx               → Logs système GLOBAUX
      UsersView.tsx              → TOUS les users de la plateforme
      DatabaseView.tsx           → Interface DB (read-only, exports)
      DeploymentsView.tsx        → Historique déploiements
      MetricsView.tsx            → Business metrics (MRR, users actifs, etc.)
    components/
      tickets/
        TicketsList.tsx          → Table tous les tickets
        TicketFilters.tsx        → Filtres avancés
        TicketActions.tsx        → Actions admin (assigner, résoudre, escalade)
        ClaudeCodeContextBtn.tsx → Génère contexte pour Claude Code
      logs/
        LogsViewer.tsx           → Interface de logs (tail -f like)
        LogsFilters.tsx          → Filtres par niveau, source, agent
      security/
        SecurityAlerts.tsx       → Alertes sécurité temps réel
        VulnerabilitiesTable.tsx → Table CVEs, failles détectées
    services/
      superadmin.service.ts      → API calls avec service_role key
      tickets.service.ts         → Gestion tickets globale
      logs.service.ts            → Lecture logs système
    types/
      backoffice.types.ts        → Types spécifiques backoffice
```

#### Routes Backoffice
```
/login                  → Login super admin (email + 2FA)
/                       → Dashboard overview
/tickets                → Tous les tickets (table filtrable)
/tickets/:id            → Détail ticket + Actions super admin
/bugs                   → Liste bugs (filtré depuis tickets)
/security               → Alertes sécurité + Vulnérabilités
/logs                   → Logs système en temps réel
/users                  → Tous les users de la plateforme
/database               → Interface DB (exports, requêtes safe)
/deployments            → Historique + Trigger déploiements
/metrics                → Business metrics (MRR, churn, usage)
```

---

## 🎫 WORKFLOW DE SUPPORT - VUE COMPLÈTE

### 1. Client Crée un Ticket (app.hive-os.com)
```
USER (app.hive-os.com/support) :
┌─────────────────────────────────────┐
│ + Nouveau ticket                    │
│                                     │
│ Sujet: L'agent Luna ne répond plus │
│ Catégorie: [Bug ▼]                 │
│ Description: [Texte...]            │
│ 📎 Screenshots                      │
│                                     │
│ [Soumettre]                         │
└─────────────────────────────────────┘
          ↓
    INSERT INTO support_tickets
    - user_id: abc123
    - status: 'open'
    - priority: 'high' (auto-calculé)
    - assigned_to: NULL
          ↓
    Email notification → super_admin@hive-os.com
```

### 2. Super Admin Voit le Ticket (backoffice.hive-os.com)
```
SUPER ADMIN (backoffice.hive-os.com/tickets) :
┌─────────────────────────────────────────────────┐
│ 🎫 Tickets Support - Vue Globale                │
│ Filtres: [Status] [Priority] [Category] [User] │
├─────────────────────────────────────────────────┤
│ 🔴 #TK-6093 - Bug                               │
│ L'agent Luna ne répond plus                     │
│ 👤 doffymelo@gmail.com                          │
│ 📅 Il y a 5min · 🟢 Ouvert · 🎯 Non assigné    │
│ [Voir détail] [Assigner à moi]                 │
└─────────────────────────────────────────────────┘
          ↓ Click "Voir détail"

SUPER ADMIN (backoffice.hive-os.com/tickets/TK-6093) :
┌─────────────────────────────────────────────────┐
│ ← Retour    #TK-6093 - Bug                      │
│                                                 │
│ 📊 Informations                                 │
│ User: doffymelo@gmail.com (ID: abc123)          │
│ Organisation: Personal (Free Plan)              │
│ Créé: Il y a 5min                               │
│ Dernière activité: Il y a 5min                  │
│                                                 │
│ 🎯 Actions Super Admin                          │
│ Status: [🟢 Ouvert ▼]                           │
│ Priority: [🔴 Critique ▼]                       │
│ Assigné à: [👨 Moi ▼]                           │
│ [Sauvegarder]                                   │
│                                                 │
│ 💬 Conversation                                 │
│ ┌─────────────────────────────────────────┐   │
│ │ 👤 doffymelo@gmail.com · Il y a 5min    │   │
│ │ L'agent Luna ne répond plus quand je    │   │
│ │ lui demande d'analyser mon site...      │   │
│ │ 📎 screenshot-error.png                 │   │
│ └─────────────────────────────────────────┘   │
│                                                 │
│ 🔒 Notes Internes (PAS visibles par user)      │
│ ┌─────────────────────────────────────────┐   │
│ │ 💭 Checker les logs de Luna pour ce    │   │
│ │ user. Possible timeout SEO audit.       │   │
│ └─────────────────────────────────────────┘   │
│ [Ajouter note interne]                         │
│                                                 │
│ 🤖 Actions Techniques                           │
│ [📋 Générer contexte Claude Code]              │
│ [📊 Voir logs du user]                         │
│ [🗄️ Voir données DB du user]                   │
│ [🔍 Reproduire le bug]                         │
│                                                 │
│ ✍️ Répondre au client                           │
│ 📋 Modèles: [Bug en cours d'investigation ▼]   │
│ ┌─────────────────────────────────────────┐   │
│ │ Bonjour,                                │   │
│ │                                         │   │
│ │ Merci pour votre retour. J'ai bien     │   │
│ │ identifié le problème avec Luna.       │   │
│ │ Je suis en train de corriger.          │   │
│ │                                         │   │
│ │ Je vous tiens informé dans les 2h.     │   │
│ └─────────────────────────────────────────┘   │
│ [Envoyer] [Envoyer et mettre "En cours"]      │
└─────────────────────────────────────────────────┘
```

### 3. Super Admin Génère Contexte pour Claude Code
```
Click "📋 Générer contexte Claude Code" :
          ↓
Copie dans le presse-papiers :
┌─────────────────────────────────────────────────┐
│ # Bug Report - Support Ticket TK-6093          │
│                                                 │
│ ## Informations Client                         │
│ - User: doffymelo@gmail.com (ID: abc123)       │
│ - Plan: Free                                   │
│ - Créé: 2026-04-18 19:30:00                    │
│                                                 │
│ ## Problème Reporté                            │
│ **Titre**: L'agent Luna ne répond plus         │
│ **Catégorie**: Bug                             │
│ **Priorité**: Critique                         │
│                                                 │
│ **Description**:                                │
│ L'agent Luna ne répond plus quand je lui       │
│ demande d'analyser mon site...                 │
│                                                 │
│ **Screenshots**:                                │
│ - screenshot-error.png                         │
│   https://cloudinary.com/.../screenshot.png    │
│                                                 │
│ ## Contexte Technique                          │
│ - Agent concerné: Luna (SEO & Content)         │
│ - Project ID: proj_789                         │
│ - Dernière question posée: "Analyse mon site"  │
│ - Timestamp erreur: 2026-04-18 19:25:00        │
│                                                 │
│ ## Logs Système                                │
│ ```                                            │
│ [2026-04-18 19:25:03] [agent-executor] Luna   │
│ [2026-04-18 19:25:05] [mcp-bridge] seo-audit  │
│ ERROR: Timeout after 30s                       │
│ ```                                            │
│                                                 │
│ ## Ce que j'attends de toi (Claude Code)       │
│ 1. Diagnostiquer la cause du timeout           │
│ 2. Vérifier si c'est lié au MCP seo-audit     │
│ 3. Proposer une solution technique             │
│ 4. Implémenter la correction si nécessaire     │
│ 5. Me fournir une réponse pour le client       │
│                                                 │
│ ## Priorité                                     │
│ 🔴 CRITIQUE - User bloqué, besoin de fix ASAP  │
└─────────────────────────────────────────────────┘
```

Super Admin colle ce contexte dans Claude Code (terminal) :
```bash
$ claude

You: [Colle le contexte copié]

Claude Code: Je vais diagnostiquer le problème...
[Analyse les logs, code, MCP servers]
[Identifie : timeout SEO audit à cause de...]
[Propose fix]
[Implémente la correction]
[Teste]
[Commit + Push]

Claude Code: ✅ Corrigé! Le problème venait de...
Voici la réponse pour ton client:
"Le problème était lié à un timeout sur l'analyse SEO.
J'ai augmenté la limite et optimisé le processus.
Cela devrait fonctionner maintenant."
```

### 4. Super Admin Répond au Client
```
SUPER ADMIN (backoffice.hive-os.com/tickets/TK-6093) :
          ↓ Colle la réponse de Claude Code
          ↓ Click "Envoyer et Résoudre"

UPDATE support_tickets SET status = 'resolved'
INSERT INTO support_messages (message = "...")
SEND EMAIL TO doffymelo@gmail.com
```

### 5. Client Voit la Réponse
```
USER (app.hive-os.com/support/TK-6093) :
┌─────────────────────────────────────────────────┐
│ #TK-6093 - Bug                                  │
│ L'agent Luna ne répond plus                     │
│                                                 │
│ ✅ Résolu                                        │
│                                                 │
│ 💬 Conversation                                 │
│ ┌─────────────────────────────────────────┐   │
│ │ 👤 Vous · Il y a 10min                  │   │
│ │ L'agent Luna ne répond plus...          │   │
│ └─────────────────────────────────────────┘   │
│                                                 │
│ ┌─────────────────────────────────────────┐   │
│ │ 👨‍💼 Support Hive OS · Il y a 2min          │   │
│ │ Bonjour,                                │   │
│ │                                         │   │
│ │ Le problème était lié à un timeout sur  │   │
│ │ l'analyse SEO. J'ai augmenté la limite  │   │
│ │ et optimisé le processus.               │   │
│ │                                         │   │
│ │ Cela devrait fonctionner maintenant.    │   │
│ │ Pouvez-vous réessayer ?                 │   │
│ └─────────────────────────────────────────┘   │
│                                                 │
│ ┌─────────────────────────────────────────┐   │
│ │ Ajouter un message...                   │   │
│ └─────────────────────────────────────────┘   │
│ [Envoyer] [✅ Confirmer résolu]                │
└─────────────────────────────────────────────────┘
```

---

## 🔐 SÉCURITÉ - BACKOFFICE SUPER ADMIN

### Authentification Renforcée
```sql
-- Table super_admins (séparée de user_roles)
CREATE TABLE super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  email TEXT NOT NULL UNIQUE,
  totp_secret TEXT, -- Pour 2FA
  last_login_at TIMESTAMPTZ,
  last_login_ip INET,
  login_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seuls les emails whitelistés peuvent être super admin
CREATE TABLE super_admin_whitelist (
  email TEXT PRIMARY KEY,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  added_by TEXT
);

INSERT INTO super_admin_whitelist (email, added_by) VALUES
('doffymelo@gmail.com', 'system');
```

### Login Backoffice (2FA Obligatoire)
```typescript
// backoffice/src/views/LoginView.tsx
async function handleLogin(email: string, password: string) {
  // 1. Vérifier si email est dans whitelist
  const { data: whitelist } = await supabase
    .from('super_admin_whitelist')
    .select('email')
    .eq('email', email)
    .single();

  if (!whitelist) {
    throw new Error('Unauthorized');
  }

  // 2. Auth Supabase normale
  const { data: session } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  // 3. Vérifier que user a rôle super_admin
  const { data: admin } = await supabase
    .from('super_admins')
    .select('*')
    .eq('user_id', session.user.id)
    .single();

  if (!admin) {
    throw new Error('Not a super admin');
  }

  // 4. Demander code 2FA (TOTP)
  const totpCode = prompt('Enter your 2FA code');
  const isValid = verifyTOTP(admin.totp_secret, totpCode);

  if (!isValid) {
    throw new Error('Invalid 2FA code');
  }

  // 5. Log l'accès
  await supabase.from('super_admin_access_logs').insert({
    super_admin_id: admin.id,
    action: 'login',
    ip: await getClientIP(),
    user_agent: navigator.userAgent
  });

  // 6. Redirect vers backoffice dashboard
  navigate('/');
}
```

### Audit Logs
Chaque action super admin est loguée :
```sql
CREATE TABLE super_admin_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  super_admin_id UUID REFERENCES super_admins(id),
  action TEXT NOT NULL, -- 'login', 'view_ticket', 'update_ticket', 'view_logs', etc.
  resource_type TEXT, -- 'ticket', 'user', 'logs', 'database'
  resource_id TEXT,
  ip INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour audit
CREATE INDEX idx_admin_logs_admin ON super_admin_access_logs(super_admin_id, created_at DESC);
CREATE INDEX idx_admin_logs_action ON super_admin_access_logs(action, created_at DESC);
```

### RLS Backoffice
```sql
-- Backoffice utilise SERVICE ROLE key (bypass RLS)
-- Mais on ajoute une couche app-level pour sécurité

-- Middleware dans backoffice/src/services/superadmin.service.ts
export async function isSuperAdmin(): Promise<boolean> {
  const { data: session } = await supabase.auth.getSession();
  if (!session) return false;

  const { data: admin } = await supabase
    .from('super_admins')
    .select('id')
    .eq('user_id', session.user.id)
    .single();

  return !!admin;
}

// Chaque requête backoffice vérifie isSuperAdmin()
export async function getAllTickets() {
  if (!await isSuperAdmin()) {
    throw new Error('Unauthorized - Super admin only');
  }

  // Utilise SERVICE ROLE key pour bypasser RLS
  return supabaseAdmin.from('support_tickets').select('*');
}
```

---

## 🗂️ STRUCTURE FICHIERS COMPLÈTE

```
hive-os-v4/
├── backend/                    # API Backend (existant)
│   └── src/
│       ├── routes/
│       │   └── admin.routes.ts # Routes admin dashboard
│       └── services/
│           └── logging.service.ts
│
├── cockpit/                    # Frontend Principal (existant)
│   └── src/
│       ├── views/
│       │   ├── SupportView.tsx           # Liste tickets USER
│       │   ├── SupportTicketDetailView.tsx # Détail ticket (vue USER simplifiée)
│       │   └── AdminDashboardView.tsx    # Dashboard admin (monitoring)
│       └── services/
│           └── support.service.ts
│
└── backoffice/                 # Frontend Backoffice (NOUVEAU)
    ├── package.json
    ├── vite.config.ts          # Port 5174
    ├── index.html
    ├── .env
    │   VITE_SUPABASE_URL=...
    │   VITE_SUPABASE_SERVICE_ROLE_KEY=... # SERVICE ROLE (pas anon)
    │   VITE_BACKEND_API_URL=http://localhost:3457
    │
    └── src/
        ├── main.tsx
        ├── App.tsx             # Router backoffice
        ├── views/
        │   ├── LoginView.tsx
        │   ├── DashboardView.tsx
        │   ├── TicketsView.tsx
        │   ├── TicketDetailView.tsx
        │   ├── BugsView.tsx
        │   ├── SecurityView.tsx
        │   ├── LogsView.tsx
        │   ├── UsersView.tsx
        │   ├── DatabaseView.tsx
        │   └── MetricsView.tsx
        ├── components/
        │   ├── layout/
        │   │   ├── BackofficeLayout.tsx
        │   │   └── BackofficeTopBar.tsx
        │   ├── tickets/
        │   │   ├── TicketsList.tsx
        │   │   ├── TicketFilters.tsx
        │   │   ├── TicketActions.tsx
        │   │   └── ClaudeCodeContextBtn.tsx
        │   ├── logs/
        │   │   ├── LogsViewer.tsx
        │   │   └── LogsFilters.tsx
        │   └── security/
        │       ├── SecurityAlerts.tsx
        │       └── VulnerabilitiesTable.tsx
        ├── services/
        │   ├── superadmin.service.ts # Auth + isSuperAdmin()
        │   ├── tickets.service.ts    # CRUD tickets (service role)
        │   ├── logs.service.ts       # Lecture logs système
        │   └── users.service.ts      # CRUD users (service role)
        ├── types/
        │   └── backoffice.types.ts
        └── lib/
            └── supabase.ts       # Client avec SERVICE ROLE key
```

---

## 📊 COMPARAISON DES 3 INTERFACES

| Fonctionnalité | USER (app) | ADMIN (app) | SUPER ADMIN (backoffice) |
|----------------|------------|-------------|--------------------------|
| **Utiliser les agents IA** | ✅ | ✅ | ❌ (interface séparée) |
| **Créer projets/tasks** | ✅ | ✅ | ❌ |
| **Créer tickets support** | ✅ | ✅ | ❌ (pas besoin, il gère) |
| **Voir SES tickets** | ✅ | ✅ | ✅ (+ tous les autres) |
| **Voir dashboard admin** | ❌ | ✅ | ✅ |
| **Voir métriques système** | ❌ | ✅ (son org) | ✅ (globales) |
| **Gérer TOUS les tickets** | ❌ | ❌ | ✅ |
| **Voir logs globaux** | ❌ | ❌ | ✅ |
| **Accès base de données** | ❌ | ❌ | ✅ |
| **Corriger bugs** | ❌ | ❌ | ✅ |
| **Gérer sécurité** | ❌ | ❌ | ✅ |
| **Business metrics** | ❌ | ❌ | ✅ |

---

## 🚀 PLAN D'IMPLÉMENTATION

### Phase 1 : Clarifier les Rôles (1h)
1. Mettre à jour `user_roles` table pour bien distinguer user/admin/super_admin
2. Créer table `super_admins` + `super_admin_whitelist`
3. Créer table `super_admin_access_logs`

### Phase 2 : Fix Vue Utilisateur (2h)
1. Modifier `SupportTicketDetailView.tsx` pour masquer contrôles admin aux users
2. Ajouter badges read-only pour statut/priorité
3. Tester qu'un user voit bien une interface simplifiée

### Phase 3 : Créer Backoffice (1-2 jours)
1. Init nouveau projet Vite : `backoffice/`
2. Setup Supabase client avec SERVICE ROLE key
3. Créer LoginView avec 2FA
4. Créer DashboardView overview
5. Créer TicketsView (liste tous les tickets)
6. Créer TicketDetailView (vue super admin complète)
7. Implémenter "Générer contexte Claude Code"

### Phase 4 : Features Avancées (2-3 jours)
1. LogsView en temps réel
2. SecurityView (alertes + vulnérabilités)
3. UsersView (gestion globale)
4. MetricsView (business metrics)
5. DatabaseView (interface safe pour exports)

---

## ✅ SUCCESS CRITERIA

### Pour les Utilisateurs
- ✅ Interface claire pour créer et suivre leurs tickets
- ✅ Pas de confusion avec des contrôles admin
- ✅ Réponses rapides du support

### Pour les Admins (clients premium)
- ✅ Dashboard de monitoring de leur usage
- ✅ Métriques de performance de leurs agents
- ✅ Gestion de leur équipe (si multi-user)

### Pour le Super Admin (Fondateur)
- ✅ Vue centralisée de TOUS les tickets
- ✅ Interface dédiée séparée de l'app production
- ✅ Outils pour diagnostiquer et corriger rapidement
- ✅ Workflow clair : Ticket → Diagnostic → Claude Code → Correction → Réponse client
- ✅ Audit complet de toutes les actions

---

## 🎯 VISION LONG-TERME

Cette architecture permet de **scaler** :

1. **Multi-tenant** : Chaque client dans son silo, super admin voit tout
2. **Équipe support** : Facile d'ajouter d'autres super admins (whitelisted)
3. **Automatisation** : Le backoffice peut trigger des scripts de correction automatique
4. **Monitoring** : Alertes Slack/Email quand ticket critique arrive
5. **Analytics** : Business metrics pour piloter la croissance
6. **Sécurité** : Séparation claire production vs backoffice, audit logs complet

**Résultat** : Un vrai SaaS professionnel avec support client structuré.
