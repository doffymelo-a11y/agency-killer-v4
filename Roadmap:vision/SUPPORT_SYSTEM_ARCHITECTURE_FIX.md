# Support System - Architecture Fix & Long-Term Vision
**Date**: 2026-04-18
**Status**: CRITICAL UX/ARCHITECTURE ISSUE
**Priority**: HIGH

---

## 🔴 PROBLÈME ACTUEL

### User Experience Incorrecte
Quand un **utilisateur** crée un ticket, il atterrit sur une page avec :
- ❌ Contrôles admin (changer statut, priorité, s'assigner)
- ❌ Modèles de réponse admin
- ❌ Fonctionnalités réservées au support

**Résultat** : L'utilisateur pense qu'il doit résoudre son propre ticket.

### Admin Experience Manquante
En tant qu'**admin/fondateur**, il n'y a :
- ❌ Aucune vue centralisée des tickets
- ❌ Aucune interface pour traiter les tickets entrants
- ❌ Aucun workflow de résolution

**Résultat** : Les tickets créés par les users ne peuvent pas être traités.

---

## 🎯 VISION CORRECTE - Séparation User/Admin

### A. UTILISATEUR (Customer Portal)

#### 1. Liste des Tickets (`/support`)
**Ce que l'user voit** :
```
┌─────────────────────────────────────────────────┐
│  🎫 Mes Tickets de Support                      │
│                                     [+ Nouveau] │
├─────────────────────────────────────────────────┤
│  Filtres: □ Ouverts  □ En cours  □ Résolus     │
├─────────────────────────────────────────────────┤
│                                                 │
│  🟢 Ouvert  #TK-6093                           │
│  L'agent ne répond plus                         │
│  Bug · Créé il y a 3min · Dernière màj: 3min   │
│  ───────────────────────────────────────────   │
│                                                 │
│  🟡 En cours  #TK-6012                         │
│  Problème de tracking Meta Pixel                │
│  Question · Créé il y a 2j · Dernière màj: 1h  │
│  ───────────────────────────────────────────   │
│                                                 │
│  ✅ Résolu  #TK-5987                           │
│  Comment ajouter un nouveau projet ?            │
│  Question · Créé il y a 5j · Résolu il y a 2j  │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Fonctionnalités** :
- ✅ Voir uniquement SES tickets
- ✅ Filtrer par statut
- ✅ Créer un nouveau ticket
- ✅ Click → Ouvrir le détail (conversation)

#### 2. Détail Ticket User (`/support/:ticketId`)
**Ce que l'user voit** :
```
┌─────────────────────────────────────────────────┐
│  ← Retour          #TK-6093 · Bug               │
│                                                 │
│  L'agent ne répond plus                         │
│                                                 │
│  🟢 Ouvert  🔶 Priorité Haute  📅 Créé il y a 3min
│                                                 │
├─────────────────────────────────────────────────┤
│  💬 Conversation                                │
├─────────────────────────────────────────────────┤
│                                                 │
│  👤 Vous · il y a 3min                          │
│  ┌─────────────────────────────────────────┐   │
│  │ **Agent concerné:**                      │   │
│  │ [] Luna (SEO & Content)                  │   │
│  │ [] Sora (Analytics & Tracking)           │   │
│  │ ...                                      │   │
│  │                                          │   │
│  │ **Comportement observé:**                │   │
│  │ [] L'agent ne répond pas du tout         │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  [Aucune réponse pour le moment]               │
│                                                 │
├─────────────────────────────────────────────────┤
│  ✍️ Votre réponse                               │
│  ┌─────────────────────────────────────────┐   │
│  │ Ajouter un message...                    │   │
│  │                                          │   │
│  │                                          │   │
│  └─────────────────────────────────────────┘   │
│  📎 Joindre des fichiers (screenshots, logs)   │
│                                    [Envoyer] │
└─────────────────────────────────────────────────┘
```

**Fonctionnalités USER** :
- ✅ Voir le statut du ticket (READ-ONLY badge)
- ✅ Voir la conversation complète
- ✅ Répondre au support (ajouter des messages)
- ✅ Uploader des fichiers (screenshots, logs)
- ✅ Bouton "Marquer comme résolu" (si satisfait de la réponse admin)
- ❌ PAS de dropdown statut/priorité
- ❌ PAS de bouton "S'assigner"
- ❌ PAS de modèles de réponse admin

---

### B. ADMIN (Support Dashboard)

#### 1. Admin Dashboard → Tab Tickets
**Ce que l'admin voit** :
```
┌─────────────────────────────────────────────────────────────┐
│  📊 Admin Dashboard                                          │
│  [Users] [Tickets] [SLA] [System] [Agent Activity] [Stats] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🎫 Tickets de Support - Vue Admin                          │
│                                                             │
│  Filtres:                                                   │
│  Status: [Tous ▼] Priority: [Tous ▼] Category: [Tous ▼]   │
│  Assigné à: [Tous ▼]  Période: [7 derniers jours ▼]       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  📊 Statistiques Rapides                            │   │
│  │  🔴 Urgents: 3   🟡 En attente: 12   ✅ Résolus: 45 │   │
│  │  ⏱️ Temps réponse moyen: 2h 34min                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  📋 Liste des Tickets (23 tickets)                         │
│                                                             │
│  ┌─ #TK-6093 ─────────────────────────────────────────┐   │
│  │ 🔴 URGENT  L'agent ne répond plus                   │   │
│  │ 👤 doffymelo@gmail.com  🐛 Bug  📅 Il y a 3min     │   │
│  │ 🟢 Ouvert  🎯 Non assigné  💬 1 message             │   │
│  │ [Assigner à moi] [Voir détail] [Marquer priorité] │   │
│  └───────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─ #TK-6012 ─────────────────────────────────────────┐   │
│  │ 🟡 HAUTE  Tracking Meta Pixel ne fonctionne pas     │   │
│  │ 👤 client@example.com  ❓ Question  📅 Il y a 2j   │   │
│  │ 🟡 En cours  👨 Assigné à moi  💬 5 messages        │   │
│  │ [Voir détail] [Résoudre] [Transférer]             │   │
│  └───────────────────────────────────────────────────┘   │
│                                                             │
│  [Précédent] Page 1/3 [Suivant]                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Fonctionnalités ADMIN (Vue Liste)** :
- ✅ Voir TOUS les tickets de TOUS les users
- ✅ Filtrer par statut, priorité, catégorie, assignation
- ✅ Statistiques temps réel (urgents, en attente, résolus)
- ✅ SLA monitoring (temps de réponse moyen, tickets breachés)
- ✅ Actions rapides (assigner, marquer priorité)
- ✅ Recherche par numéro ticket, email user, mots-clés

#### 2. Admin Ticket Detail (`/admin` → Tab Tickets → Click ticket)
**Ce que l'admin voit** :
```
┌─────────────────────────────────────────────────────────────┐
│  ← Retour à la liste                                         │
│                                                             │
│  🐛 #TK-6093 - Bug                                          │
│  L'agent ne répond plus                                     │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Status: [🟢 Ouvert ▼]  Priority: [🔶 Haute ▼]      │   │
│  │  Assigné à: [👨 Moi ▼]                               │   │
│  │  [Sauvegarder]                                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  📊 Informations Ticket                                     │
│  👤 Créé par: doffymelo@gmail.com                          │
│  📅 Créé le: Il y a 3min                                   │
│  🏷️ Catégorie: Bug                                         │
│  ⏱️ Temps de résolution SLA: 3h restantes                  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  💬 Conversation (Vue Admin)                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  👤 doffymelo@gmail.com · il y a 3min                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ **Agent concerné:**                                  │   │
│  │ [] Luna, Sora, Marcus, Milo                          │   │
│  │                                                      │   │
│  │ **Comportement observé:**                            │   │
│  │ [] L'agent ne répond pas du tout                     │   │
│  │ [] L'agent affiche une erreur                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  🔒 Notes Internes (PAS visibles par l'user)                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 💭 Ajouter une note interne pour l'équipe...        │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│  [Ajouter note]                                            │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  ✍️ Répondre au client                                      │
│  📋 Modèles: [Sélectionner un modèle... ▼]                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Votre réponse...                                     │   │
│  │                                                      │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│  📎 Joindre fichiers    [Envoyer] [Envoyer et Résoudre]   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🤖 Transférer à Claude Code pour correction          │   │
│  │ [Générer contexte] [Copier pour Claude Code]        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Fonctionnalités ADMIN (Détail Ticket)** :
- ✅ Modifier statut, priorité, assignation
- ✅ Voir toutes les infos du ticket (user, date, SLA)
- ✅ Conversation complète (messages user + admin)
- ✅ **Notes internes** (PAS visibles par l'user)
- ✅ Modèles de réponse (templates pré-remplis)
- ✅ Bouton "Envoyer et Résoudre" (répond + change statut en 1 click)
- ✅ **Transférer à Claude Code** : Génère un contexte complet pour que le fondateur puisse copier/coller dans Claude Code

---

## 🛠️ IMPLÉMENTATION - PLAN D'ACTION

### Phase 1 : Fix Critique - Vue Utilisateur (1-2 jours)

#### Étape 1.1 : Séparer les Vues
**Fichier** : `/cockpit/src/views/SupportTicketDetailView.tsx`

**Changement** :
```typescript
// Au lieu d'afficher les contrôles admin à tout le monde:
{isAdmin && (
  <>
    {/* Dropdowns status/priority/assign */}
    {/* Response templates */}
    {/* Internal notes */}
  </>
)}

// Vue USER simplifiée:
{!isAdmin && (
  <>
    {/* Badge status READ-ONLY */}
    {/* Conversation */}
    {/* Input réponse simple */}
    {/* Upload fichiers */}
    {/* Bouton "Marquer comme résolu" */}
  </>
)}
```

#### Étape 1.2 : Badge Status Read-Only (User)
Au lieu de :
```tsx
<select value={ticket.status} onChange={...}>
  <option>Ouvert</option>
  <option>En cours</option>
</select>
```

Afficher :
```tsx
<div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full">
  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
  Ouvert
</div>
```

#### Étape 1.3 : Bouton "Marquer comme résolu" (User)
```tsx
{!isAdmin && ticket.status === 'resolved' && (
  <button
    onClick={handleMarkResolved}
    className="px-4 py-2 bg-green-600 text-white rounded"
  >
    ✅ Marquer comme résolu
  </button>
)}
```

---

### Phase 2 : Interface Admin Complète (2-3 jours)

#### Étape 2.1 : Admin Tickets Tab - Vue Liste
**Fichier** : `/cockpit/src/components/admin/AdminTicketsTab.tsx` (NOUVEAU)

**Fonctionnalités** :
- Table de TOUS les tickets
- Filtres (status, priority, category, assigned_to)
- Stats rapides (urgents, en attente, résolus)
- SLA warnings (tickets breachés)
- Actions rapides (assigner à moi, marquer urgent)
- Pagination
- Recherche

**Composants** :
```
AdminTicketsTab.tsx (container)
  ├── TicketStatsCards.tsx (stats urgents/en attente/résolus)
  ├── TicketFilters.tsx (filtres status/priority/category)
  ├── TicketsTable.tsx (table avec actions)
  └── TicketQuickActions.tsx (assigner, marquer priorité)
```

#### Étape 2.2 : Admin Ticket Detail - Contrôles Complets
**Fichier** : `/cockpit/src/views/SupportTicketDetailView.tsx`

**Ajouter section ADMIN-ONLY** :
1. **Métadonnées éditables** :
   - Dropdown status
   - Dropdown priority
   - Dropdown assignation
   - Bouton "Sauvegarder"

2. **Notes internes** :
   - Textarea pour notes admin
   - Liste des notes existantes
   - Badge "🔒 Interne" pour bien indiquer que l'user ne voit pas

3. **Modèles de réponse** :
   - Dropdown avec templates pré-remplis
   - Click → Remplit le textarea

4. **Actions rapides** :
   - Bouton "Envoyer et Résoudre"
   - Bouton "Envoyer et Clore"
   - Bouton "Transférer à..."

#### Étape 2.3 : Fonctionnalité "Transférer à Claude Code"
**Bouton** : "🤖 Générer contexte pour Claude Code"

**Action** :
```typescript
function generateClaudeCodeContext(ticket: Ticket) {
  const context = `
# Support Ticket à Corriger

**Ticket**: #${ticket.number}
**Catégorie**: ${ticket.category}
**Priorité**: ${ticket.priority}

## Description du problème

${ticket.description}

## Messages de l'utilisateur

${ticket.messages.filter(m => m.sender_type === 'user').map(m => `
**User** (${m.created_at}):
${m.message}
`).join('\n')}

## Fichiers joints

${ticket.attachments?.map(a => `- ${a.filename} (${a.url})`).join('\n')}

## Contexte Technique

- User ID: ${ticket.user_id}
- Project ID: ${ticket.project_id || 'N/A'}
- Agent concerné: ${extractAgentFromDescription(ticket.description)}

## Ce que j'attends de toi

1. Diagnostiquer la cause du problème
2. Proposer une solution technique
3. Implémenter la correction si nécessaire
4. Me fournir une réponse claire pour le client
`;

  navigator.clipboard.writeText(context);
  toast.success('Contexte copié! Colle-le dans Claude Code');
}
```

---

### Phase 3 : Améliorations UX (1-2 jours)

#### 3.1 : Email Notifications
Quand admin répond → User reçoit un email :
```
Sujet: Nouvelle réponse sur votre ticket #TK-6093

Bonjour,

Nous avons répondu à votre ticket de support.

Ticket: L'agent ne répond plus
Statut: En cours

[Voir la réponse]

---
L'équipe Hive OS
```

#### 3.2 : Realtime Updates
User voit en temps réel quand admin répond (via Supabase Realtime).

#### 3.3 : Smart Routing
Quand user clique sur un ticket dans sa liste :
- Si USER → `/support/:ticketId` (vue simplifiée)
- Si ADMIN → Reste sur `/admin` tab Tickets (vue admin)

---

## 📊 ARCHITECTURE TECHNIQUE

### Routes
```
USER:
  /support                    → SupportView (liste SES tickets)
  /support/:ticketId          → SupportTicketDetailView (vue USER)

ADMIN:
  /admin → Tab Tickets        → AdminTicketsTab (liste TOUS les tickets)
  /admin → Tab Tickets → :id  → SupportTicketDetailView (vue ADMIN, contrôles complets)
```

### Conditional Rendering
```typescript
// Dans SupportTicketDetailView.tsx
const isAdmin = useIsAdmin(); // Hook pour vérifier le rôle

return (
  <div>
    {/* Header commun */}
    <TicketHeader ticket={ticket} readOnly={!isAdmin} />

    {/* Métadonnées */}
    {isAdmin ? (
      <AdminMetadataControls ticket={ticket} />
    ) : (
      <UserMetadataBadges ticket={ticket} />
    )}

    {/* Conversation */}
    <MessagesThread messages={messages} />

    {/* Notes internes (ADMIN ONLY) */}
    {isAdmin && <InternalNotes ticketId={ticket.id} />}

    {/* Input réponse */}
    {isAdmin ? (
      <AdminReplyBox templates={templates} />
    ) : (
      <UserReplyBox />
    )}

    {/* Actions */}
    {isAdmin ? (
      <AdminActions ticket={ticket} />
    ) : (
      <UserActions ticket={ticket} />
    )}
  </div>
);
```

### Database - Pas de changements nécessaires
La structure actuelle `support_tickets` + `support_messages` est correcte.
Juste ajouter `assigned_to` et `internal_notes` si pas déjà présents.

---

## ✅ SUCCESS METRICS

### User Experience
- ✅ User ne voit QUE ses tickets
- ✅ User ne peut PAS modifier statut/priorité
- ✅ User peut répondre et uploader fichiers
- ✅ User voit clairement le statut du ticket

### Admin Experience
- ✅ Admin voit TOUS les tickets de TOUS les users
- ✅ Admin peut filtrer, assigner, résoudre
- ✅ Admin a des notes internes (pas visibles user)
- ✅ Admin peut générer contexte pour Claude Code

### Business Outcome
- ✅ Tickets des users traités efficacement
- ✅ Workflow de support clair (user soumet → admin traite → user satisfait)
- ✅ Temps de résolution mesuré (SLA)

---

## 🚀 PRIORITÉS

### URGENT (Faire maintenant)
1. ✅ Masquer les contrôles admin aux users simples
2. ✅ Ajouter Tab Tickets dans Admin Dashboard avec liste complète

### HAUTE (Cette semaine)
3. ✅ Notes internes admin
4. ✅ Modèles de réponse
5. ✅ Bouton "Générer contexte Claude Code"

### MOYENNE (Prochaine semaine)
6. ✅ Email notifications
7. ✅ SLA tracking visuel
8. ✅ Realtime updates

---

**Conclusion** : Le système actuel mélange user et admin. Il faut séparer clairement les deux vues avec conditional rendering et créer une vraie interface admin de gestion des tickets.
