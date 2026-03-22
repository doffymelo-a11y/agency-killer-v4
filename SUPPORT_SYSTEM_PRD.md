# PRD - Système de Support Tickets

**Date de création** : 22 Mars 2026
**Status** : En implémentation
**Objectif** : Support natif intégré pour bugs et demandes utilisateurs

---

## 🎯 Contexte

Hive OS n'a actuellement **aucun système de support**. Quand un utilisateur rencontre un bug ou a une demande, il n'a aucun moyen de le signaler depuis l'interface.

**Besoin** : Un système de tickets simple, accessible depuis le menu compte, qui permette aux utilisateurs de remonter des bugs ou des demandes, et à l'équipe admin de les traiter.

---

## 🏗️ Architecture : Simple & Efficace

**Principe** : Pas de Zendesk ou d'outil tiers. Un système natif intégré dans Supabase.

```
Utilisateur                          Admin
    |                                  |
    ├─ /support (SupportView)          ├─ /admin > onglet "Tickets"
    │   ├─ Liste mes tickets           │   ├─ Tous les tickets
    │   ├─ Créer un ticket             │   ├─ Filtrer par status/priorité
    │   └─ Voir conversation           │   ├─ Répondre
    │                                  │   └─ Changer status/priorité
    ↓                                  ↓
    ════════════════════════════════════
              Supabase Tables
         support_tickets + messages
         + Realtime subscriptions
    ════════════════════════════════════
```

---

## 📊 Base de Données

### Tables

#### 1. `support_tickets`

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Owner (FK auth.users) |
| project_id | UUID | Projet concerné (optionnel) |
| subject | TEXT | Sujet (5-200 chars) |
| description | TEXT | Description (min 20 chars) |
| category | ENUM | bug, feature_request, question, billing, integration, other |
| priority | ENUM | low, medium, high, critical |
| status | ENUM | open, in_progress, waiting_user, resolved, closed |
| page_url | TEXT | URL auto-capturée |
| user_agent | TEXT | Browser/OS auto-capturé |
| screenshot_url | TEXT | Cloudinary URL |
| assigned_to | UUID | Admin assigné (FK auth.users) |
| created_at | TIMESTAMPTZ | Date création |
| updated_at | TIMESTAMPTZ | Dernière modif (auto-update) |
| resolved_at | TIMESTAMPTZ | Date résolution (auto-set) |
| closed_at | TIMESTAMPTZ | Date fermeture (auto-set) |

**RLS Policies** :
- Users voient uniquement leurs tickets
- Admins voient tous les tickets
- Users peuvent créer et modifier leurs tickets
- Admins peuvent tout modifier

#### 2. `support_messages`

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | Primary key |
| ticket_id | UUID | FK support_tickets |
| sender_id | UUID | FK auth.users |
| sender_type | ENUM | user, admin |
| message | TEXT | Contenu message |
| attachments | JSONB | [{url, filename, type, size}] |
| read_at | TIMESTAMPTZ | Date lecture |
| created_at | TIMESTAMPTZ | Date création |

**RLS Policies** :
- Users voient messages de leurs tickets
- Users peuvent poster dans leurs tickets (sender_type='user' only)
- Admins voient tous les messages
- Admins peuvent poster partout (sender_type='admin')

### Triggers

1. **update_ticket_on_message** : Met à jour `support_tickets.updated_at` quand un message est posté
2. **update_support_tickets_updated_at** : Met à jour `updated_at` sur UPDATE
3. **set_resolved_at_on_status_change** : Auto-set `resolved_at` et `closed_at` selon status

### Helper Functions

1. **get_user_unread_ticket_messages(user_id)** : Compte messages admin non lus (pour badge)
2. **get_ticket_stats()** : Stats globales pour admin dashboard

---

## 🎨 Frontend - Côté Utilisateur

### 1. Menu "Support" (TopBar)

**Fichier** : `cockpit/src/components/layout/TopBar.tsx`

**Position** : Entre "Billing" et séparateur Admin

**Features** :
- Icône LifeBuoy
- Badge rouge avec count de messages non lus
- Clic → `/support`

### 2. SupportView (`/support`)

**Fichier** : `cockpit/src/views/SupportView.tsx`

**Layout** :
```
┌──────────────────────────────────────────────┐
│  Support & Aide                    [+ Nouveau]│
├──────────────────────────────────────────────┤
│  Filtres: [Tous] [Ouverts] [Résolus]          │
├──────────────────────────────────────────────┤
│  ┌────────────────────────────────────────┐   │
│  │ 🐛 Bug: L'agent Luna ne répond plus   │   │
│  │ Ouvert · Il y a 2h · #TK-0042         │   │
│  │ Dernière réponse: Admin · Il y a 30min │   │
│  └────────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
```

**Features** :
- Liste paginée des tickets (`updated_at DESC`)
- Filtres tabs : Tous / Ouverts / Résolus
- Badge couleur par status
- Badge emoji par catégorie
- Bouton "+ Nouveau ticket" → formulaire

### 3. Formulaire Création Ticket

**Inline dans SupportView** (se déploie en haut)

**Champs** :

| Champ | Type | Requis | Détails |
|-------|------|--------|---------|
| Catégorie | select | Oui | Bug / Demande / Question / Facturation / Intégration / Autre |
| Sujet | text | Oui | Max 200 chars |
| Description | textarea | Oui | Min 20 chars, placeholder dynamique selon catégorie |
| Projet concerné | select | Non | Dropdown projets user (auto-fill si sur projet) |
| Screenshot | file | Non | jpg/png/webp, max 5MB → Cloudinary |

**Auto-capture** (invisible) :
- `page_url` : `window.location.href`
- `user_agent` : `navigator.userAgent`

**Priorité auto-déterminée** :
- Bug → high
- Integration → medium
- Billing → medium
- Feature request → low
- Question → low
- Other → medium

### 4. SupportTicketDetailView (`/support/:ticketId`)

**Fichier** : `cockpit/src/views/SupportTicketDetailView.tsx`

**Layout** :
```
┌──────────────────────────────────────────────┐
│  ← Retour   #TK-0042 · Bug                   │
│  "L'agent Luna ne répond plus"                │
│  Status: En cours · Priorité: Haute           │
├──────────────────────────────────────────────┤
│  ┌──── Vous · Il y a 2h ────────────────┐    │
│  │ Description du bug...                  │    │
│  │ [screenshot.png]                       │    │
│  └───────────────────────────────────────┘    │
│                                               │
│  ┌──── Support · Il y a 30min ───────────┐   │
│  │ Merci, nous avons identifié le bug.   │   │
│  └───────────────────────────────────────┘    │
│                                               │
│  ┌──── Ajouter un message ──────────────┐    │
│  │ [textarea]                  [Envoyer] │    │
│  └───────────────────────────────────────┘    │
│                                               │
│  [Marquer comme résolu]                       │
└──────────────────────────────────────────────┘
```

**Features** :
- Timeline messages (user gauche, admin droite)
- Messages user : `bg-slate-700/50`
- Messages admin : `bg-cyan-900/30` + badge "Support Team"
- Textarea + "Envoyer"
- Bouton "Marquer comme résolu" (status → resolved)
- **Supabase Realtime** : subscription sur messages

---

## 🔧 Frontend - Côté Admin

### 1. Onglet "Tickets" dans AdminDashboardView

**Fichier** : `cockpit/src/views/AdminDashboardView.tsx`

**Système de tabs** : `[Users] [Tickets] [Stats]`

**Layout onglet Tickets** :
```
┌──────────────────────────────────────────────────┐
│  Tickets (42 ouverts)                             │
│  [Tous] [Ouverts] [En cours] [En attente]         │
├──────────────────────────────────────────────────┤
│  Priorité │ Sujet             │ User    │ Status  │
│  ──────────────────────────────────────────────── │
│  🔴 High  │ Luna tourne boucle│ j@ex.com│ open    │
│  🟡 Med   │ Facturation       │ k@ex.com│ waiting │
│  🟢 Low   │ Export PDF        │ l@ex.com│ progress│
└──────────────────────────────────────────────────┘
```

**Features** :
- Vue tabulaire de TOUS les tickets
- Filtres : status, priorité, catégorie
- Tri par date, priorité
- Badge count dans onglet "Tickets (N)"
- Clic → detail ticket

### 2. Actions Admin (dans SupportTicketDetailView)

**Détection admin** : Via `user_roles` table

**Actions supplémentaires** :
- Dropdown "Changer status" (5 options)
- Dropdown "Changer priorité" (4 options)
- Dropdown "S'assigner" (liste admins)
- Style messages différent (badge "Support Team")

---

## 🔔 Notifications

### 1. Badge Menu Support

**Condition** : Tickets avec messages admin non lus

**Query** :
```typescript
const unreadCount = await get_user_unread_ticket_messages(user_id);
```

**Affichage** : Badge rouge avec nombre sur item "Support"

### 2. Realtime Updates

**Utilisateur** :
- Nouveau message admin → apparaît dans timeline (pas de refresh)
- Update ticket → status/priorité mis à jour automatiquement

**Admin** :
- Nouveau ticket créé → badge count +1
- Message user → notification

---

## 📁 Fichiers

### À Créer

| Fichier | Description | Lignes |
|---------|-------------|--------|
| `cockpit/supabase/migrations/017_support_tickets.sql` | Migration complète | 320 |
| `cockpit/src/types/support.types.ts` | Types TypeScript | 239 |
| `cockpit/src/services/support.service.ts` | Service CRUD + Realtime | 370 |
| `cockpit/src/lib/cloudinary.ts` | Helper upload screenshots | 120 |
| `cockpit/src/views/SupportView.tsx` | Liste + formulaire | ~400 |
| `cockpit/src/views/SupportTicketDetailView.tsx` | Conversation ticket | ~350 |

### À Modifier

| Fichier | Modification |
|---------|--------------|
| `cockpit/src/components/layout/TopBar.tsx` | Ajouter item "Support" + badge (ligne ~135) |
| `cockpit/src/App.tsx` | Routes `/support` et `/support/:ticketId` |
| `cockpit/src/views/AdminDashboardView.tsx` | Système tabs + onglet Tickets |

---

## ✅ Tests de Validation

### Test 1 : Création ticket
1. Menu compte → "Support" → "+ Nouveau ticket"
2. Remplir : catégorie Bug, sujet, description
3. ✅ Ticket apparaît liste, status "Ouvert"
4. ✅ DB : `page_url` et `user_agent` auto-capturés

### Test 2 : Conversation
1. Clic ticket → vue détail
2. Écrire message → apparaît timeline
3. ✅ DB : `support_messages` nouvelle ligne

### Test 3 : Admin répond
1. Login admin → `/admin` → onglet "Tickets"
2. Tous tickets visibles
3. Clic ticket → écrire réponse
4. ✅ Message avec `sender_type: 'admin'`
5. Changer status → "En cours"

### Test 4 : Realtime
1. User a ticket ouvert
2. Admin répond dans autre onglet
3. ✅ Message admin apparaît en temps réel (sans refresh)

### Test 5 : Badge notifications
1. Admin répond
2. ✅ Badge rouge sur "Support" dans menu
3. Ouvrir ticket → messages marqués lus → badge disparaît

### Test 6 : Screenshot upload
1. Créer ticket avec screenshot
2. ✅ Image uploadée Cloudinary
3. ✅ URL stockée en DB
4. ✅ Visible dans détail ticket

### Test 7 : Sécurité RLS
1. User A ne voit PAS tickets de User B
2. Admin voit TOUS les tickets
3. User ne peut PAS changer priorité (admin only)

---

## 📈 Métriques de Succès

| Métrique | Cible |
|----------|-------|
| Temps création ticket | < 2 min |
| Temps réponse admin | < 24h |
| Taux résolution 7j | > 80% |
| Satisfaction user | > 4.5/5 |
| Screenshots joints | > 30% des bugs |

---

## 🚀 Roadmap d'Implémentation

| Phase | Durée | Tâches |
|-------|-------|--------|
| **Phase 1** | 1h | Migration SQL + RLS + Triggers |
| **Phase 2** | 1.5h | Types TS + Service + Cloudinary helper |
| **Phase 3** | 2.5h | SupportView + SupportTicketDetailView |
| **Phase 4** | 2h | Admin tabs + Actions admin |
| **Phase 5** | 1h | Realtime + Badges + Mark read |
| **Phase 6** | 1h | Tests + Documentation |
| **Total** | ~9h | Système complet |

---

## 🔒 Sécurité

### RLS Policies

✅ **Users** :
- Voient uniquement leurs tickets
- Peuvent créer tickets
- Peuvent poster messages (sender_type='user' forcé)
- Peuvent marquer résolu/fermé

✅ **Admins** :
- Voient TOUS les tickets
- Peuvent modifier status/priorité/assignment
- Peuvent poster messages (sender_type='admin')
- Accès complet via `user_roles` table

### Validation

✅ **Formulaire** :
- Subject : 5-200 chars
- Description : min 20 chars
- Screenshot : max 5MB, images only
- sender_type validation (user ne peut pas poster en tant qu'admin)

✅ **Context Auto-Capture** :
- page_url : pour debug
- user_agent : pour identifier browser/OS
- Auto-set au moment création (pas modifiable par user)

---

## 🎨 Design Patterns Réutilisés

| Pattern | Source | Usage |
|---------|--------|-------|
| Menu dropdown item | TopBar.tsx ligne 85-168 | Item "Support" |
| Admin check | AdminDashboardView.tsx | user_roles query |
| Supabase Realtime | Existant | Messages temps réel |
| RLS policies | Toutes migrations | Security-first |
| Modal form | CMSConnectionModal.tsx | Tabs system (si besoin) |
| Inline form | AccountSettingsView.tsx | useState + validation |

---

## 📝 Notes d'Implémentation

### Priorités Auto-Déterminées

L'utilisateur **NE CHOISIT PAS** la priorité. Elle est auto-déterminée par catégorie :

```typescript
Bug → high
Integration → medium
Billing → medium
Feature request → low
Question → low
Other → medium
```

L'admin peut changer après si besoin.

### Placeholders Dynamiques

Le placeholder de description change selon la catégorie :
- Bug : "Décrivez le bug, étapes pour reproduire..."
- Feature : "Décrivez la fonctionnalité souhaitée..."
- Question : "Posez votre question..."

### Ticket Number Format

Format : `TK-XXXX` (ex: TK-0042)

Généré depuis les 4 derniers chars du UUID :
```typescript
const last4 = ticketId.slice(-4);
const num = parseInt(last4, 16) % 10000;
return `TK-${num.toString().padStart(4, '0')}`;
```

### Relative Time

Messages affichent temps relatif :
- < 1min : "À l'instant"
- < 60min : "Il y a Xmin"
- < 24h : "Il y a Xh"
- < 7j : "Il y a Xj"
- < 4sem : "Il y a Xsem"
- Sinon : Date complète

---

## 🔮 Futures Évolutions (Post-MVP)

1. **Email notifications** (optionnel)
2. **Attachments multiples** (actuellement 1 screenshot)
3. **Recherche full-text** dans tickets
4. **Templates réponses** pour admin
5. **SLA tracking** (temps réponse, résolution)
6. **Tags custom** sur tickets
7. **Satisfaction survey** après résolution
8. **Export CSV** des tickets (admin)

---

**Créé le** : 22 Mars 2026
**Par** : Claude Code - PRD Système Support
**Status** : ✅ Approuvé pour implémentation
