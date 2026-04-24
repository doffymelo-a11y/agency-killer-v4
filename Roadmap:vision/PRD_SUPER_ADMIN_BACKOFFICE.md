# Plan — Super Admin Backoffice (Hive OS V5)

## Context

Le support system actuel sépare correctement les vues user/admin dans `SupportTicketDetailView.tsx` (commit `eebb6f0`), mais le founder n'a **aucune interface globale** pour triager et résoudre les tickets efficacement. L'admin dashboard existant (`/cockpit/src/views/AdminDashboardView.tsx`) mélange monitoring projet (tier 2 "admin") et gestion globale (tier 3 "super_admin") — ce n'est pas scalable pour 100+ clients SaaS.

**Objectif :** construire une application frontend dédiée (`/backoffice/`) sur `backoffice.hive-os.com` réservée aux `super_admin`, qui permet au founder de :
- Voir tous les tickets de tous les users en temps réel
- Répondre aux users, assigner, changer statut/priorité
- Générer un "Claude Code Context" collable dans son terminal pour fixer les bugs
- Consulter logs système, métriques business, actions sensibles — avec audit trail complet

**Contraintes architecturales retenues (validées avec le founder) :**
1. **SERVICE_ROLE_KEY jamais dans le frontend** — le backoffice utilise `ANON_KEY + JWT` et passe par de **nouveaux endpoints `/api/superadmin/*`** dans le backend Express, seul détenteur du service_role
2. **App frontend séparée** dans `/backoffice/` (port 5174 en dev, subdomain en prod)
3. **Claude Code Context = clipboard + terminal manuel** (MVP, pas de GitHub integration auto ni webhook pour cette phase)

**Ce qui existe déjà (à réutiliser, NE PAS recréer) :**
- Table `support_tickets`, `support_messages`, `support_internal_notes`, `admin_response_templates` (migrations 017, 019)
- Table `user_roles` avec enum `user` / `admin` / `super_admin` (migration 008)
- Fonction SQL `is_admin(uuid)` durcie (migration 014 search_path fix)
- Table `system_logs` + RPC `get_agent_stats`, `get_recent_logs`, `get_business_stats` (migrations 028, 029)
- Middleware backend `authMiddleware` + `requireAdmin` + rate limit 30/min (`/backend/src/middleware/`)
- Service frontend `/cockpit/src/services/support.service.ts` (à copier/partager)
- Types `/cockpit/src/types/support.types.ts` + `admin.types.ts`
- Client Supabase `/cockpit/src/lib/supabase.ts`
- Founder `doffymelo@gmail.com` déjà auto-promu `super_admin` au signup

---

## Phase 1 — Database : tables super_admin + RLS (Jour 1) ✅ COMPLETED

**Fichier créé :** `/cockpit/supabase/migrations/030_super_admin_backoffice.sql`

### 1.1 Table d'audit trail super_admin ✅

```sql
CREATE TABLE super_admin_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  super_admin_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,                    -- 'UPDATE_TICKET', 'ADD_NOTE', 'VIEW_TICKET', 'UPDATE_USER_ROLE', 'VIEW_LOGS', 'VIEW_METRICS'
  resource_type TEXT,                      -- 'ticket', 'user', 'logs', 'metrics'
  resource_id TEXT,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',             -- ex: { old_status: 'open', new_status: 'resolved' }
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_super_admin_logs_admin_id ON super_admin_access_logs(super_admin_id);
CREATE INDEX idx_super_admin_logs_created_at ON super_admin_access_logs(created_at DESC);
CREATE INDEX idx_super_admin_logs_action ON super_admin_access_logs(action);
```

### 1.2 RLS policies ✅

- `super_admin_access_logs` : SELECT réservé aux `super_admin` seuls ; INSERT via authenticated users
- Réutilisation de `is_admin()` qui couvre déjà `admin` + `super_admin`

### 1.3 Helper functions ✅

```sql
-- Fonction is_super_admin() créée
-- Fonction is_admin() créée
-- Fonction log_super_admin_action() créée
```

**Status**: ✅ Migration 030 appliquée avec succès

---

## Phase 2 — Backend : endpoints `/api/superadmin/*` (Jours 2-4) ✅ COMPLETED

**Fichier créé :** `/backend/src/routes/super-admin.routes.ts`

### 2.1 Middleware `requireSuperAdmin` ✅

**Fichier créé :** `/backend/src/middleware/super-admin.middleware.ts`

Vérifie strictement `role = 'super_admin'` (pas `admin`). Inclut rate limiting et auto-logging des actions.

### 2.2 Endpoints tickets (lecture/écriture globale) ✅

| Méthode | Endpoint | Description | Status |
|---------|----------|-------------|--------|
| `GET` | `/api/superadmin/tickets` | Liste paginée tous tickets avec filtres | ✅ |
| `GET` | `/api/superadmin/tickets/:id` | Détail ticket + user info + messages + notes | ✅ |
| `PATCH` | `/api/superadmin/tickets/:id` | Update status, priority, assigned_to | ✅ |
| `POST` | `/api/superadmin/tickets/:id/messages` | Répondre au ticket | ✅ |
| `GET` | `/api/superadmin/tickets/:id/messages` | Récupérer les messages | ✅ |
| `POST` | `/api/superadmin/tickets/:id/internal-notes` | Ajouter note interne | ✅ |
| `GET` | `/api/superadmin/tickets/:id/internal-notes` | Récupérer notes internes | ✅ |
| `POST` | `/api/superadmin/tickets/:id/claude-context` | Générer Claude Code Context | ⏳ Phase future |
| `GET` | `/api/superadmin/tickets/stats` | Counts par status/priority | ✅ |

### 2.3 Endpoints annexes ✅

- `GET /api/superadmin/users` : liste avec filtres ✅
- `PATCH /api/superadmin/users/:id/role` : change role ✅
- `GET /api/superadmin/logs/audit` : lecture audit logs ✅
- `GET /api/superadmin/logs/system` : system logs ✅
- `GET /api/superadmin/metrics/global` : métriques globales ✅

### 2.4 Sécurité renforcée ✅

- Toutes les réponses passent par error handling sécurisé
- Rate limit : 60 req/min pour super_admin
- Logging automatique de toutes les actions

**Status**: ✅ 13 endpoints super admin créés et fonctionnels

---

## Phase 3 — App frontend `/backoffice/` (Jours 5-10) ✅ COMPLETED

### 3.1 Structure ✅

```
/backoffice/
├── package.json              # React 19, Vite 7, Tailwind 4, Zustand, Supabase JS
├── vite.config.ts            # port 5174
├── tsconfig.json
├── tailwind.config.js
├── .env
└── src/
    ├── main.tsx                           ✅
    ├── App.tsx                            ✅
    ├── lib/
    │   ├── supabase.ts                    ✅
    │   └── api.ts                         ✅ (JWT Bearer auth)
    ├── store/
    │   └── useBackofficeStore.ts          ✅ (Zustand)
    ├── types/
    │   └── index.ts                       ✅
    ├── components/
    │   ├── Layout.tsx                     ✅
    │   └── auth/
    │       └── ProtectedSuperAdminRoute.tsx ✅
    └── views/
        ├── LoginView.tsx                  ✅
        ├── DashboardView.tsx              ✅
        ├── TicketsView.tsx                ✅
        ├── TicketDetailView.tsx           ✅
        ├── UsersView.tsx                  ✅
        ├── LogsView.tsx                   ✅
        └── MetricsView.tsx                ✅
```

### 3.2 Auth flow ✅

1. `LoginView` : email + password Supabase Auth ✅
2. Vérification role `super_admin` via `user_roles` table ✅
3. Refus automatique si pas super_admin ✅
4. `ProtectedSuperAdminRoute` sur toutes les routes ✅
5. JWT automatique via Supabase + Bearer header ✅

### 3.3 Vue centrale : `TicketsView` ✅

Interface principale avec:
- Filtres (status/priority/category/search) ✅
- Liste des tickets ✅
- Vue détail avec conversation ✅
- Internal notes (panneau rouge) ✅
- Reply box ✅
- Metadata et informations utilisateur ✅

**Realtime** : ⏳ À implémenter en Phase future
- Abonnement Supabase pour updates live
- Premier usage de Realtime dans le projet

### 3.4 Bouton "Generate Claude Code Context" ⏳

**Status**: ⏳ Prévu pour Phase future

Le backend générera:
1. Ticket + user + messages + notes
2. Logs système filtrés (2h avant création)
3. Commits git récents
4. Fichiers suspects détectés
5. Markdown structuré pour Claude Code

---

## Phase 4 — Intégration cockpit : nettoyage admin dashboard ⏳

**Fichier à modifier :** `/cockpit/src/views/AdminDashboardView.tsx`

**Status**: ⏳ Prévu pour Phase future

Changes prévus:
- Retirer l'onglet "Tickets" global
- Retirer l'onglet "Users" global
- Garder: System Health, Agent Activity, Business Stats
- Ajouter: bandeau "Super admin? Open Backoffice →"

---

## Phase 5 — Vérification end-to-end (Jour 12)

### 5.1 Tests manuels ✅

- [x] `cd /backoffice && npm install && npm run dev` → port 5174 démarre
- [x] Login avec `doffymelo@gmail.com` → dashboard super_admin s'affiche
- [x] Login avec un user normal → refus + toast
- [ ] Créer un ticket depuis cockpit → apparaît dans backoffice
- [x] Update status depuis backoffice → RLS check ok
- [x] Répondre au ticket → message enregistré
- [ ] Clic "Generate Claude Code Context" (Phase future)

### 5.2 Tests API ✅

- [x] Accès super_admin fonctionnel
- [x] Rejet user normal (403)
- [x] Rate limiting en place

### 5.3 Sécurité ✅

- [x] Aucun `SERVICE_ROLE_KEY` dans `/backoffice/src`
- [x] Tous les endpoints loggent dans `super_admin_access_logs`
- [x] `npx tsc --noEmit` → 0 erreur
- [x] Build production successful

### 5.4 Performance ✅

- [x] Build optimisé: 488KB (138KB gzipped)
- [x] TypeScript strict mode: 0 erreurs

---

## Fichiers critiques

**Créés (Phase 1-3) ✅:**
- `/cockpit/supabase/migrations/030_super_admin_backoffice.sql` ✅
- `/backend/src/middleware/super-admin.middleware.ts` ✅
- `/backend/src/routes/super-admin.routes.ts` ✅
- `/backoffice/` (app complète, 15+ fichiers) ✅

**À créer (Phases futures) ⏳:**
- `/backend/src/services/claude-context-generator.service.ts` ⏳
- `/backend/src/config/feature-files-map.ts` ⏳

**Modifiés ✅:**
- `/backend/src/index.ts` — route `super-admin.routes` enregistrée ✅

**Référence utilisée ✅:**
- `/cockpit/src/services/support.service.ts` — pattern réutilisé ✅
- `/backend/src/routes/admin.routes.ts` — pattern middleware ✅
- `/cockpit/src/lib/supabase.ts` — client Supabase ✅

---

## Ce que ce plan ne fait PAS (reporté phases futures)

- ⏳ Email notifications (Resend/Postmark)
- ⏳ 2FA TOTP pour super_admins
- ⏳ GitHub Issues auto-création
- ⏳ Webhook Claude Code SDK
- ⏳ SLA tracking avancé
- ⏳ AI ticket triage / auto-réponses
- ⏳ Knowledge base / self-service
- ⏳ Multi-super_admin avec permissions granulaires
- ⏳ Rate limiting IP-based
- ⏳ Realtime Supabase subscriptions

---

## Risques identifiés et mitigations

1. **Duplication de types** entre `/cockpit/src/types` et `/backoffice/src/types`
   - ✅ **Résolu**: Types définis directement dans `/backoffice/src/types/index.ts`
   - Alternative future: extraire vers `/shared/types/`

2. **Realtime Supabase** jamais utilisé dans le projet
   - ⏳ **Status**: Reporté à phase future
   - Nécessitera ~2h de debug sur les policies Realtime

3. **Bundle backoffice** réplique React/Tailwind/Zustand
   - ✅ **Acceptable**: 488KB (138KB gzipped) - apps distinctes
   - Pas de monorepo pour l'instant

4. **Clipboard API** nécessite HTTPS en prod
   - ⏳ **Mitigation prévue**: Fallback "Download as .md"

5. **Attack surface** avec endpoints `/api/superadmin/*`
   - ✅ **Mitigé**: Chaque route passe par `requireSuperAdmin` + audit log

---

## Status Global du Projet

### ✅ Completed (MVP Ready)
- **Phase 1**: Database foundation (migration 030)
- **Phase 2**: Backend API (13 endpoints super admin)
- **Phase 3**: Frontend Backoffice (React app complète)
- Authentication & Authorization
- Tickets CRUD complet
- Users management
- Logs & Metrics viewing
- Audit trail

### ⏳ Planned (Future Phases)
- Claude Code Context generation
- Realtime updates
- Email notifications
- Advanced SLA tracking
- Knowledge base integration
- AI-powered features

### 🎯 Next Immediate Steps
1. Test ticket création depuis cockpit
2. Vérifier realtime updates (ou implémenter polling simple)
3. Documenter workflow pour le founder
4. Préparer pour production deployment

---

**Document créé**: 2026-04-19
**Auteur**: Claude Opus 4.5 (avec supervision du founder)
**Status**: MVP Backoffice Completed ✅
**Commits**: 7b820ff, b05e692, f9ccd9d
