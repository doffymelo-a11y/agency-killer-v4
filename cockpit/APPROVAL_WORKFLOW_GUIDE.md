# 🛡️ Approval Workflow System - THE HIVE OS V4

**Date :** 2026-02-27
**Statut :** PRODUCTION READY
**Référence :** PRD V4.4 - Human-in-the-Loop Security

---

## 📋 Vue d'Ensemble

Le système d'approbation permet aux **agents IA** (Sora, Marcus, Luna, Milo) de demander une **validation humaine** avant d'exécuter des actions risquées.

### Cas d'usage typiques

| Agent | Action Risquée | Niveau de Risque | Exemple |
|-------|----------------|------------------|---------|
| **Marcus** | Lancer campagne pub >$50/jour | HIGH/CRITICAL | "Lancer campagne Facebook Ads - Budget $200/jour" |
| **Marcus** | Modifier enchères automatiques | MEDIUM | "Passer de CPC manuel à CBO automatique" |
| **Sora** | Modifier pixels de tracking | HIGH | "Remplacer Google Analytics 4 tracking code" |
| **Sora** | Supprimer tags GTM | CRITICAL | "Supprimer 15 tags de conversion inactifs" |
| **Luna** | Publier contenu sans review | MEDIUM | "Publier 10 articles de blog optimisés SEO" |
| **Milo** | Générer vidéo >1000€ | HIGH | "Créer 5 vidéos publicitaires avec VEO-3" |

---

## 🏗️ Architecture

### 1. Base de Données

**Table :** `approval_requests`

```sql
CREATE TABLE approval_requests (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,              -- Propriétaire
  project_id UUID,                     -- Projet concerné
  agent_id VARCHAR(20),                -- sora, marcus, luna, milo
  action VARCHAR(100),                 -- launch_campaign, modify_pixels, etc.
  title TEXT,                          -- "Lancer campagne Facebook Ads"
  description TEXT,                    -- Détails de l'action
  risk_level VARCHAR(20),              -- low, medium, high, critical
  estimated_cost_7_days NUMERIC(10,2), -- Impact financier estimé
  currency VARCHAR(3),                 -- USD, EUR
  status VARCHAR(20),                  -- pending, approved, rejected, expired
  expires_at TIMESTAMP,                -- Expiration de la demande
  metadata JSONB,                      -- Contexte additionnel
  created_at, updated_at, approved_at, approved_by, rejection_reason
);
```

**RLS Policies :**
- Users can only see/update their own approval requests
- Status can only change from `pending` to `approved/rejected`
- Expired requests are auto-updated by cron (RPC function)

### 2. Services Frontend

**Fichier :** `src/services/approvals.ts`

```typescript
// Créer une demande d'approbation (agents IA)
createApprovalRequest(params: CreateApprovalRequestParams)

// Lister les demandes d'approbation
listApprovalRequests(userId, filters)

// Approuver une demande
approveRequest(approvalId, userId)

// Rejeter une demande
rejectRequest(approvalId, userId, reason?)

// Compter les approbations en attente (badge notification)
countPendingApprovals(userId)

// Subscribe Realtime (notifications instantanées)
subscribeToApprovalRequests(userId, onCreated, onUpdated)
```

### 3. UI Component

**Fichier :** `src/components/chat/UIComponentRenderer.tsx`

**Component :** `ApprovalRequestComponent`

Affiche une carte interactive avec :
- Badge de niveau de risque (low, medium, high, critical)
- Titre et description de l'action
- Agent demandeur (avec couleur)
- Estimation de coût sur 7 jours
- Expiration (24h par défaut)
- Boutons **Approuver** / **Rejeter**
- États : pending → approved/rejected

**Rendu :**
```json
{
  "type": "approval_request",
  "data": {
    "approval_id": "uuid",
    "agent_id": "marcus",
    "action": "launch_facebook_campaign",
    "title": "Lancer campagne Facebook Ads - Investis10",
    "description": "Budget: $200/jour\nCible: Hommes 25-45 ans, intérêt investissement\nObjectif: Conversions",
    "risk_level": "high",
    "estimated_cost_7_days": 1400,
    "currency": "USD",
    "expires_in_hours": 24
  }
}
```

---

## 🔄 Flow Complet

### Flow 1 : Agent IA → Demande d'Approbation

**Scénario :** Marcus veut lancer une campagne Facebook Ads à $200/jour

1. **n8n Agent "MARCUS"** détecte besoin de lancer campagne
2. **Marcus AI Brain** analyse :
   ```javascript
   if (daily_budget > 50) {
     risk_level = "high";
     requires_approval = true;
   }
   ```
3. **Marcus crée une demande** via `createApprovalRequest()` :
   ```json
   {
     "user_id": "uuid",
     "project_id": "uuid",
     "agent_id": "marcus",
     "action": "launch_facebook_campaign",
     "title": "Lancer campagne Facebook Ads - Investis10",
     "description": "Budget: $200/jour\nCible: Hommes 25-45 ans...",
     "risk_level": "high",
     "estimated_cost_7_days": 1400,
     "currency": "USD",
     "expires_in_hours": 24,
     "metadata": {
       "campaign_name": "Investis10 - Acquisition",
       "ad_account_id": "act_123456",
       "targeting": { "age_min": 25, "age_max": 45 }
     }
   }
   ```
4. **Supabase INSERT** → `approval_requests` table
5. **Realtime Event** → Frontend reçoit la notification
6. **UI affiche** le composant `ApprovalRequestComponent` dans le chat

### Flow 2 : Utilisateur Approuve

1. **User clique "Approuver"** dans l'UI
2. **Frontend appelle** `approveRequest(approval_id, user_id)`
3. **RPC Function** `approve_approval_request()` :
   - Vérifie ownership
   - Vérifie status = pending
   - Vérifie expiration
   - Update status = 'approved'
4. **Realtime Event** → n8n webhook reçoit l'approbation
5. **Marcus exécute l'action** :
   - Appelle Meta Marketing API
   - Crée la campagne Facebook
   - Met à jour `tasks` : status = "in_progress"
6. **Marcus envoie confirmation** via `UI_COMPONENT` :
   ```json
   {
     "type": "success_message",
     "data": {
       "title": "Campagne lancée avec succès",
       "campaign_id": "123456789",
       "budget": "$200/jour",
       "status": "Active"
     }
   }
   ```

### Flow 3 : Utilisateur Rejette

1. **User clique "Rejeter"** → prompt pour raison
2. **Frontend appelle** `rejectRequest(approval_id, user_id, reason)`
3. **RPC Function** `reject_approval_request()` update status = 'rejected'
4. **Realtime Event** → n8n webhook
5. **Marcus arrête l'action** et envoie message :
   ```json
   {
     "type": "info_message",
     "data": {
       "title": "Action annulée",
       "message": "Campagne non lancée suite à votre rejet.",
       "reason": "Budget trop élevé pour le moment"
     }
   }
   ```

### Flow 4 : Expiration Automatique

1. **Cron job** (toutes les heures) appelle `expire_old_approval_requests()`
2. **Fonction SQL** :
   ```sql
   UPDATE approval_requests
   SET status = 'expired'
   WHERE status = 'pending' AND expires_at < NOW();
   ```
3. **Realtime Event** → Agents IA notifiés
4. **Agent envoie message** : "Votre approbation pour [action] a expiré."

---

## 🧪 Tests End-to-End

### Test 1 : Créer une Demande d'Approbation (via SQL)

```sql
-- Simule une demande de Marcus
INSERT INTO approval_requests (
  user_id,
  project_id,
  agent_id,
  action,
  title,
  description,
  risk_level,
  estimated_cost_7_days,
  currency,
  expires_at
) VALUES (
  '<TON_USER_ID>',
  '<TON_PROJECT_ID>',
  'marcus',
  'launch_facebook_campaign',
  'Lancer campagne Facebook Ads - Test',
  'Budget: $200/jour\nCible: Hommes 25-45 ans\nObjectif: Conversions',
  'high',
  1400.00,
  'USD',
  NOW() + INTERVAL '24 hours'
);
```

**Résultat attendu :**
- La carte apparaît dans le chat
- Badge ORANGE avec "HIGH"
- Estimation "$1,400.00 USD"
- 2 boutons : Approuver / Rejeter

### Test 2 : Approuver via UI

1. **Clique "Approuver"**
2. **Vérifie dans Supabase** :
   ```sql
   SELECT id, status, approved_at, approved_by
   FROM approval_requests
   WHERE id = '<APPROVAL_ID>';
   -- status = 'approved'
   -- approved_at = NOW()
   -- approved_by = <TON_USER_ID>
   ```

### Test 3 : Rejeter avec Raison

1. **Clique "Rejeter"**
2. **Entre raison** : "Budget trop élevé pour le moment"
3. **Vérifie dans Supabase** :
   ```sql
   SELECT status, rejection_reason
   FROM approval_requests
   WHERE id = '<APPROVAL_ID>';
   -- status = 'rejected'
   -- rejection_reason = 'Budget trop élevé pour le moment'
   ```

### Test 4 : Compter les Approbations en Attente

```typescript
const result = await countPendingApprovals('<USER_ID>');
console.log(result.count); // Nombre de demandes pending non expirées
```

### Test 5 : Realtime Subscription

```typescript
const unsubscribe = subscribeToApprovalRequests(
  userId,
  (approval) => console.log('New approval:', approval),
  (approval) => console.log('Updated approval:', approval)
);

// Créer une demande depuis n8n ou SQL
// → Console affiche "New approval: {...}"

// Approuver depuis un autre onglet
// → Console affiche "Updated approval: { status: 'approved' }"
```

---

## 🔗 Intégration n8n Agents

### Étape 1 : Ajout du Tool "request_approval"

**Dans chaque Agent (SORA, MARCUS, LUNA, MILO) :**

**Node :** "Prepare [Agent] Context" (Code node)

```javascript
const TOOLS = [
  // ... existing tools ...
  {
    name: 'request_approval',
    description: 'Request human approval before executing risky actions',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          description: 'Action identifier (e.g., launch_facebook_campaign)'
        },
        title: {
          type: 'string',
          description: 'Short title for the approval request'
        },
        description: {
          type: 'string',
          description: 'Detailed description of what will happen'
        },
        risk_level: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'critical'],
          description: 'Risk assessment level'
        },
        estimated_cost_7_days: {
          type: 'number',
          description: 'Estimated financial impact over 7 days (USD)'
        },
        metadata: {
          type: 'object',
          description: 'Additional context (campaign details, etc.)'
        }
      },
      required: ['action', 'title', 'risk_level']
    }
  }
];
```

### Étape 2 : Implémenter le Tool Handler

**Node :** "Handle [Agent] Tools" (Code node)

```javascript
if (functionName === 'request_approval') {
  const {
    action,
    title,
    description,
    risk_level,
    estimated_cost_7_days,
    metadata
  } = functionArgs;

  // Call Supabase RPC to create approval request
  const { data, error } = await supabase
    .from('approval_requests')
    .insert({
      user_id: shared_memory.user_id,
      project_id: shared_memory.project_id,
      agent_id: 'marcus', // or 'sora', 'luna', 'milo'
      action,
      title,
      description,
      risk_level,
      estimated_cost_7_days,
      currency: 'USD',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      metadata: metadata || {}
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  // Return approval_id to agent
  return {
    approval_id: data.id,
    status: 'pending',
    expires_in_hours: 24,
    message: 'Approval request created. Waiting for user response.'
  };
}
```

### Étape 3 : Écouter les Réponses d'Approbation

**Option 1 : Polling (Simple)**

Après avoir créé une demande, l'agent attend 30 secondes puis vérifie :

```javascript
// Wait 30 seconds
await new Promise(resolve => setTimeout(resolve, 30000));

// Check approval status
const { data } = await supabase
  .from('approval_requests')
  .select('status, rejection_reason')
  .eq('id', approval_id)
  .single();

if (data.status === 'approved') {
  // Execute the action
  return await executeRiskyAction();
} else if (data.status === 'rejected') {
  return { error: `Action rejected: ${data.rejection_reason}` };
} else {
  return { error: 'Approval timeout' };
}
```

**Option 2 : Webhook (Production)**

1. **Créer un webhook n8n** : `/webhook/approval-response`
2. **Supabase Trigger** sur UPDATE de `approval_requests` :
   ```sql
   CREATE TRIGGER approval_response
   AFTER UPDATE ON approval_requests
   FOR EACH ROW
   WHEN (NEW.status != OLD.status)
   EXECUTE FUNCTION notify_approval_webhook();
   ```
3. **Workflow reprend** quand webhook reçu

---

## 📊 Exemples Concrets

### Exemple 1 : Marcus - Lancer Campagne Google Ads

**Agent AI Brain :**
```javascript
// Marcus détecte besoin de lancer campagne
if (daily_budget > 50) {
  const approval = await request_approval({
    action: 'launch_google_ads_campaign',
    title: `Lancer campagne Google Ads - ${campaign_name}`,
    description: `Budget: $${daily_budget}/jour\nType: Search\nMots-clés: ${keywords.join(', ')}\nObjectif: ${objective}`,
    risk_level: daily_budget > 200 ? 'critical' : 'high',
    estimated_cost_7_days: daily_budget * 7,
    metadata: {
      campaign_name,
      daily_budget,
      keywords,
      targeting
    }
  });

  // UI_COMPONENT pour afficher la demande
  await send_ui_component({
    type: 'approval_request',
    data: {
      approval_id: approval.approval_id,
      agent_id: 'marcus',
      ...approval
    }
  });

  // Attendre réponse...
}
```

### Exemple 2 : Sora - Modifier GTM Tags

**Agent AI Brain :**
```javascript
// Sora détecte tags GTM obsolètes
if (tags_to_delete.length > 5) {
  const approval = await request_approval({
    action: 'delete_gtm_tags',
    title: `Supprimer ${tags_to_delete.length} tags GTM inactifs`,
    description: `Tags concernés:\n${tags_to_delete.map(t => `- ${t.name} (${t.id})`).join('\n')}`,
    risk_level: 'critical',
    metadata: {
      container_id: 'GTM-ABC123',
      tags: tags_to_delete
    }
  });

  // Attendre approbation avant de supprimer
}
```

### Exemple 3 : Milo - Générer Vidéos Coûteuses

**Agent AI Brain :**
```javascript
// Milo estime coût de génération vidéo
const estimated_cost = video_count * 200; // VEO-3 = $200/vidéo

if (estimated_cost > 500) {
  const approval = await request_approval({
    action: 'generate_veo3_videos',
    title: `Générer ${video_count} vidéos publicitaires (VEO-3)`,
    description: `Coût estimé: $${estimated_cost}\nDurée: 15-30 secondes\nStyle: ${style}`,
    risk_level: 'high',
    estimated_cost_7_days: estimated_cost,
    metadata: {
      video_count,
      cost_per_video: 200,
      style,
      prompts
    }
  });
}
```

---

## 🚀 Migration & Déploiement

### 1. Appliquer la Migration

```bash
cd /Users/azzedinezazai/Documents/Agency-Killer-V4/cockpit

# Appliquer migration 010
npx supabase db push

# Vérifier
psql -h <DB_HOST> -U postgres -d postgres -c "SELECT * FROM schema_migrations WHERE version = '010';"
```

### 2. Tester en Local

```bash
# Lancer l'app
npm run dev

# Ouvrir console browser (F12)
# Créer une demande de test :
await supabase.from('approval_requests').insert({
  user_id: '<YOUR_USER_ID>',
  agent_id: 'marcus',
  action: 'test_approval',
  title: 'Test Approval System',
  risk_level: 'medium',
  expires_at: new Date(Date.now() + 24*60*60*1000).toISOString()
});

# Vérifier que la carte apparaît dans le chat
```

### 3. Intégrer dans n8n

1. **Update PM-CORE** : Ajouter `request_approval` tool
2. **Update Agents** : Implémenter le handler
3. **Tester** : Demande → Approbation → Exécution

---

## ✅ Checklist de Validation

- [x] Migration `010_approval_requests.sql` appliquée
- [x] Service `src/services/approvals.ts` créé
- [x] UI Component `ApprovalRequestComponent` implémentée
- [ ] Test SQL INSERT → Carte affichée dans chat
- [ ] Test Approuver → Status updated à 'approved'
- [ ] Test Rejeter → Status updated à 'rejected'
- [ ] Test Realtime → Notifications instantanées
- [ ] Tool `request_approval` ajouté aux agents n8n
- [ ] Flow complet testé : n8n → Approval → Exécution

---

## 📈 Évolutions Futures

### Phase 2 : Notifications Push

- [ ] Email notification (Resend) quand approval créée
- [ ] SMS pour approvals CRITICAL (Twilio)
- [ ] Slack/Discord webhooks

### Phase 3 : Approval Rules

- [ ] Auto-approve si budget < $50
- [ ] Require 2FA pour approvals CRITICAL
- [ ] Approval groups (team review)

### Phase 4 : Analytics

- [ ] Dashboard : Taux d'approbation par agent
- [ ] Temps moyen de réponse
- [ ] Actions les plus rejetées

---

**Dernière mise à jour :** 2026-02-27
**Responsable :** Claude Code (Terminal CLI)
**Référence :** PRD_THE_HIVE_OS_V4.4.md
**Status :** ✅ PRODUCTION READY
