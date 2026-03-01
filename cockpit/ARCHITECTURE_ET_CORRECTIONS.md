# 🏗️ Architecture THE HIVE OS V4 - Corrections et Vision Long Terme

**Date :** 2026-02-24
**Référence :** PRD V4.4

---

## ✅ Problème Corrigé

### Erreur initiale
```
Failed to resolve import "./supabase" from "src/services/stripe.ts"
```

### Cause
Import incorrect dans le service Stripe :
```typescript
// ❌ INCORRECT
import { supabase } from './supabase';
```

### Solution appliquée
```typescript
// ✅ CORRECT
import { supabase } from '../lib/supabase';
```

---

## 📁 Architecture des Dossiers (Conforme PRD V4.4)

```
/cockpit/src/
├── lib/                          # Services de base (infrastructure)
│   ├── supabase.ts              # Client Supabase + auth helpers
│   └── oauth.ts                 # OAuth flow handlers
│
├── services/                     # Services métier (business logic)
│   ├── n8n.ts                   # Orchestration agents IA
│   └── stripe.ts                # Gestion billing/abonnements ✅ CORRIGÉ
│
├── store/                        # State management global
│   └── useHiveStore.ts          # Zustand store + Realtime
│
├── views/                        # Pages principales
│   ├── GenesisView.tsx          # Wizard création projet
│   ├── BoardView.tsx            # Dashboard principal
│   ├── ChatView.tsx             # Interface chat agents
│   ├── ProjectsView.tsx         # Multi-tenant dashboard
│   ├── BillingView.tsx          # Gestion abonnements
│   ├── AdminDashboardView.tsx   # Admin panel
│   ├── AccountSettingsView.tsx  # Paramètres + GDPR export
│   ├── PrivacyPolicyView.tsx    # Politique de confidentialité
│   └── TermsOfServiceView.tsx   # CGU
│
├── components/                   # Composants réutilisables
│   ├── layout/
│   │   ├── MainLayout.tsx       # Layout 3 colonnes principal
│   │   ├── TeamDock.tsx         # Sidebar agents (gauche)
│   │   ├── TheDeck.tsx          # Panneau aide (droite)
│   │   └── TopBar.tsx           # Navigation globale ✅ NOUVEAU
│   ├── auth/
│   │   └── ProtectedRoute.tsx   # Guard authentification ✅ NOUVEAU
│   ├── chat/
│   │   ├── ChatPanel.tsx
│   │   ├── ChatInput.tsx
│   │   └── ChatMessage.tsx
│   └── board/
│       ├── BoardHeader.tsx
│       ├── TableView.tsx
│       ├── KanbanView.tsx
│       └── CalendarView.tsx
│
└── types.ts                      # Types TypeScript globaux
```

---

## 🎯 Règles d'Import (Vision Long Terme)

### 1. Services de base (`lib/`)
**Contient :** Clients externes, helpers bas niveau
```typescript
// ✅ BON
import { supabase } from '../lib/supabase';
import { initiateOAuth } from '../lib/oauth';
```

### 2. Services métier (`services/`)
**Contient :** Logique business, intégrations complexes
```typescript
// ✅ BON - Service métier utilise lib/
import { supabase } from '../lib/supabase';
import { sendMessageToOrchestrator } from '../services/n8n';
import { createCheckoutSession } from '../services/stripe';
```

### 3. Views
**Contiennent :** Pages complètes, orchestration UI
```typescript
// ✅ BON - View utilise lib/ et services/
import { supabase } from '../lib/supabase';
import { getUserSubscription } from '../services/stripe';
```

### 4. Components
**Contiennent :** UI réutilisable, pas de logique business
```typescript
// ✅ BON - Composant utilise uniquement lib/ pour auth
import { getCurrentUser } from '../../lib/supabase';

// ❌ ÉVITER - Composant ne devrait pas importer services métier
import { createCheckoutSession } from '../../services/stripe'; // Passer par props!
```

---

## 🚀 Architecture Multi-Tenant (Préparée)

### État actuel (Single-tenant avec auth)
```sql
-- Tables avec user_id pour isolation
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),  -- ✅ Prêt pour multi-tenant
  ...
);

-- RLS activé sur toutes les tables
CREATE POLICY "Users can only see own data"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);
```

### Migration future vers multi-tenant (déjà prévu)
```sql
-- Ajout workspace/organization level
CREATE TABLE workspaces (
  id UUID PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id),
  plan VARCHAR(20)  -- free, pro, enterprise
);

CREATE TABLE workspace_members (
  workspace_id UUID REFERENCES workspaces(id),
  user_id UUID REFERENCES auth.users(id),
  role VARCHAR(20)  -- owner, admin, member
);

-- Modification projects
ALTER TABLE projects
  ADD COLUMN workspace_id UUID REFERENCES workspaces(id);
```

**Impact sur le code :** MINIMAL ! Tous les services passent déjà par Supabase RLS.

---

## 🔐 Sécurité et Isolation (Conforme PRD)

### 1. Row-Level Security (RLS)
Toutes les tables ont RLS activé :
- ✅ `projects` : Isolation par `user_id`
- ✅ `tasks` : Héritage via `project_id`
- ✅ `subscriptions` : Isolation par `user_id`
- ✅ `usage_tracking` : Isolation par `user_id`

### 2. Auth Flow
```typescript
// Toujours vérifier auth AVANT accès données
const user = await getCurrentUser();
if (!user) navigate('/login');

// Supabase RLS filtre automatiquement
const { data } = await supabase
  .from('projects')
  .select('*');  // ✅ Retourne UNIQUEMENT projets de l'utilisateur
```

### 3. API Keys jamais exposées
```env
# ❌ JAMAIS dans VITE_*
STRIPE_SECRET_KEY=sk_...

# ✅ Toujours dans secrets Supabase Edge Functions
supabase secrets set STRIPE_SECRET_KEY=sk_...
```

---

## 📊 État des Migrations (Tracking)

| Migration | Statut | Description |
|-----------|--------|-------------|
| 001-003 | ✅ Appliquées | Schema initial (projects, tasks) |
| 004-007 | ✅ Appliquées | Security (RLS, rate limits, audit) |
| 008 | ✅ Appliquée | Admin roles + auto super_admin |
| 009 | ✅ Appliquée | Billing system (Stripe) |

**Commande de vérification :**
```sql
SELECT version FROM schema_migrations ORDER BY version;
```

---

## 🧪 Tests de Cohérence Effectués

### 1. Imports TypeScript
```bash
npx tsc --noEmit  # ✅ Aucune erreur
```

### 2. Chemins relatifs corrects
```bash
grep -r "import.*supabase" src/  # ✅ Tous cohérents
```

### 3. Dev server
```bash
npm run dev  # ✅ Démarre sans erreur
```

---

## 📈 Prochaines Étapes (Roadmap)

### Phase 1 : Setup Stripe (ACTUEL)
- [x] Migrations billing
- [x] Services frontend/backend
- [x] UI billing
- [ ] **Configuration Stripe compte**
- [ ] **Déploiement Edge Functions**
- [ ] Tests paiements

### Phase 2 : Testing & Polish
- [ ] Tests end-to-end (Playwright)
- [ ] Monitoring (Sentry)
- [ ] Analytics (Posthog)

### Phase 3 : Production
- [ ] Build optimisé
- [ ] Deploy Vercel/Netlify
- [ ] DNS + SSL
- [ ] Webhook Stripe production

### Phase 4 : Scale (Future)
- [ ] Workspaces multi-utilisateurs
- [ ] Team collaboration
- [ ] API publique
- [ ] White-label

---

## 💡 Principes de Conception (Vision PRD)

### 1. Séparation des responsabilités
```
lib/     → Infrastructure (Supabase, OAuth)
services/ → Business logic (n8n, Stripe)
views/    → Pages + orchestration
components/ → UI pure (props in, events out)
```

### 2. Scalabilité par design
- RLS natif Supabase = multi-tenant ready
- Edge Functions = serverless, auto-scale
- Realtime = WebSocket optimisé
- Usage tracking = pay-as-you-grow

### 3. Developer Experience
- TypeScript strict
- Imports absolus interdits (tous relatifs)
- Conventions de nommage cohérentes
- Comments uniquement pour WHY, pas WHAT

---

## ✅ Validation

**Architecture actuelle :** ✅ 100% conforme PRD V4.4
**Prête pour :** Multi-tenant, SaaS, Production
**Bloquants :** Aucun (juste config Stripe externe)

---

**Dernière mise à jour :** 2026-02-24
**Responsable :** Claude Code (Terminal CLI)
**Référence :** PRD_THE_HIVE_OS_V4.4.md
