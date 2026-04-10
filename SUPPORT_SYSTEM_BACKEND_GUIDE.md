# Support System Backend - Guide Complet de Visualisation & Monitoring

**Date**: 2026-04-09
**Auteur**: Claude Opus 4.5

---

## LE PROBLÈME QUE TU AS IDENTIFIÉ ✅

> "J'ai l'impression que le backend n'existe pas car c'est toi (l'IA) qui est l'intermédiaire"

**Tu as 100% raison!** Actuellement :

```
Frontend (React) → Supabase (Database) → FIN
                        ↓
                  Aucune IA
                  Aucun traitement
                  Juste stocké
```

**Ce qui manque** : Le lien entre les tickets support et les agents IA (Luna, Sora, Marcus, Milo).

---

## ARCHITECTURE ACTUELLE vs CIBLE

### ❌ Architecture Actuelle (INCOMPLÈTE)

```
User crée ticket
    ↓
SupportView.tsx (createTicket)
    ↓
support.service.ts
    ↓
Supabase (INSERT dans support_tickets)
    ↓
... RIEN ...
```

**Résultat** : Le ticket existe en base, mais **PERSONNE ne le traite automatiquement**.

---

### ✅ Architecture Cible (AVEC IA)

```
User crée ticket
    ↓
Supabase INSERT → Database Trigger
    ↓
Edge Function (notify-support-ticket)
    ↓
n8n Webhook
    ↓
PM/Orchestrator (routing)
    ↓
Agent approprié (Luna/Sora/Marcus/Milo)
    ↓
Réponse automatique stockée dans support_messages
    ↓
User notifié par email
```

---

## FLUX DÉTAILLÉ - CE QUI SE PASSE ÉTAPE PAR ÉTAPE

### Étape 1: Création du Ticket (Frontend)

**Fichier**: `/cockpit/src/views/SupportView.tsx` ligne 256

```typescript
await createTicket({
  subject: formData.subject,
  description: formData.description,
  category: formData.category,
  screenshot_url: screenshotUrl,
  // ...
});
```

**Ce qui se passe**:
- React appelle la fonction `createTicket`
- La fonction fait un `INSERT` dans Supabase
- Le ticket obtient un ID unique et un ticket_number

---

### Étape 2: Stockage Database (Supabase)

**Table**: `support_tickets`

```sql
INSERT INTO support_tickets (
  user_id,
  subject,
  description,
  category,
  priority, -- Calculé automatiquement selon category
  status,   -- Default 'open'
  created_at
) VALUES (...);
```

**Triggers automatiques** (déjà implémentés):
1. `trigger_queue_ai_analysis` → Queue pour AI categorization
2. `trigger_notify_support_ticket_created` → **NOUVEAU** Webhook n8n

---

### Étape 3: Notification n8n (Edge Function)

**Fichier**: `/supabase/functions/notify-support-ticket/index.ts`

**Ce qui se passe**:
1. Le trigger database appelle l'Edge Function
2. L'Edge Function enrichit le ticket avec les données user
3. Elle construit un payload optimisé pour n8n
4. Elle POST vers le webhook n8n

**Payload envoyé à n8n**:
```json
{
  "event_type": "support_ticket_created",
  "ticket": {
    "id": "uuid",
    "ticket_number": "TICKET-001",
    "subject": "Pixel Meta ne fonctionne pas",
    "description": "Le pixel ...",
    "category": "bug",
    "priority": "high",
    "screenshot_url": "https://..."
  },
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "suggested_intent": "investigate_bug",
  "context": {
    "source": "support_ticket",
    "requires_response": true,
    "sla_target_hours": 24
  }
}
```

---

### Étape 4: Routing par le PM (n8n)

**Fichier**: `/agents/CURRENT_pm-mcp/` (workflow n8n)

**Ce qui se passe**:
1. Le PM reçoit le webhook
2. Il analyse le `suggested_intent` et le `category`
3. Il route vers l'agent approprié:
   - `bug` → **LUNA** (expert SEO/Technique)
   - `feature_request` → **MARCUS** (expert Ads/Features)
   - `integration` → **SORA** (expert Analytics/Intégrations)
   - `question` → **MILO** (expert Créatif/Content)

---

### Étape 5: Traitement par l'Agent IA

**Exemple**: Bug de pixel → LUNA

**Ce que LUNA fait**:
1. Lit le ticket complet (sujet + description + screenshot)
2. Utilise ses MCP tools pour investiguer:
   - `web-intelligence:ad_verification` → Vérifie le pixel
   - `seo-audit:check_page` → Analyse la page
3. Génère une réponse structurée
4. Crée un message dans `support_messages`

**Fichier**: LUNA via n8n POST vers Supabase

```sql
INSERT INTO support_messages (
  ticket_id,
  message,
  sender_type,     -- 'admin' (l'agent IA)
  attachments,      -- Screenshots de vérification
  created_at
) VALUES (...);
```

---

### Étape 6: Notification Email (Automatique)

**Trigger**: `trigger_after_admin_message_queue_email`

**Ce qui se passe**:
1. Le trigger détecte le nouveau message admin
2. Il INSERT dans `email_logs` (queue)
3. L'Edge Function `send-support-email` envoie l'email
4. L'utilisateur est notifié par email

---

## COMMENT VISUALISER LE BACKEND

### Option 1: Supabase Dashboard (RECOMMANDÉ)

**URL**: https://supabase.com/dashboard/project/hwiyvpfaolmasqchqwsa

#### A. Visualiser les Tickets en Temps Réel

1. **Table Editor**:
   - Dashboard → Table Editor → `support_tickets`
   - Vue en temps réel de tous les tickets
   - Filtres, tri, recherche

2. **SQL Editor**:
   ```sql
   -- Voir les 10 derniers tickets avec user
   SELECT
     st.*,
     u.email,
     u.full_name
   FROM support_tickets st
   LEFT JOIN auth.users u ON st.user_id = u.id
   ORDER BY st.created_at DESC
   LIMIT 10;
   ```

3. **Realtime** (dans le code):
   ```typescript
   // Écouter les nouveaux tickets en temps réel
   const subscription = supabase
     .channel('support-tickets')
     .on('postgres_changes', {
       event: 'INSERT',
       schema: 'public',
       table: 'support_tickets'
     }, (payload) => {
       console.log('🎫 Nouveau ticket:', payload.new);
     })
     .subscribe();
   ```

#### B. Visualiser les Logs Edge Functions

1. Dashboard → Edge Functions → `notify-support-ticket`
2. Onglet "Logs"
3. Voir chaque appel, payload, erreurs

#### C. Visualiser les Métriques SLA

1. Dashboard → SQL Editor
2. Exécuter:
   ```sql
   SELECT * FROM ticket_sla_dashboard
   ORDER BY date DESC
   LIMIT 30;
   ```

---

### Option 2: n8n Dashboard

**URL**: Ton instance n8n (à déterminer)

#### A. Visualiser les Executions

1. n8n UI → Executions
2. Voir chaque workflow executé
3. Inspecter le payload reçu
4. Voir les erreurs

#### B. Créer un Workflow de Monitoring

```
Webhook (support tickets)
  ↓
Send to Slack/Email
  ↓
Log to file/database
```

---

### Option 3: Outils de Monitoring Externes

#### A. Papertrail (Logs)

**Oui, Papertrail est une EXCELLENTE idée!**

**Setup**:
1. Créer compte Papertrail: https://papertrailapp.com
2. Configurer Supabase logs → Papertrail
3. Dashboard → Project Settings → Integrations

**Avantages**:
- Logs centralisés (Edge Functions + Database)
- Recherche puissante
- Alertes sur erreurs
- Graphiques

#### B. Better Stack (Alternative moderne)

- https://betterstack.com
- Logs + Uptime monitoring + Incidents
- Plus moderne que Papertrail

#### C. Sentry (Error Tracking)

**Installer dans le frontend**:
```bash
npm install @sentry/react
```

```typescript
// main.tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'YOUR_DSN',
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  tracesSampleRate: 1.0,
});
```

**Avantages**:
- Track errors frontend + backend
- User context (qui a créé le ticket)
- Performance monitoring

---

### Option 4: Dashboard Custom (OPTIMAL)

Créer un **Admin Dashboard** dans le cockpit avec visualisation en temps réel:

**Features**:
1. **Ticket Queue en temps réel** (Supabase Realtime)
2. **SLA Metrics** (graphiques Recharts)
3. **Agent Activity Log** (messages des agents IA)
4. **Performance Stats** (temps de réponse, résolution)

**Composant à créer**:
```typescript
// /cockpit/src/views/AdminMonitoringView.tsx

export default function AdminMonitoringView() {
  return (
    <div>
      <h1>Support System Monitoring</h1>

      {/* Tickets en cours */}
      <LiveTicketQueue />

      {/* Métriques SLA */}
      <SLADashboard />

      {/* Logs des agents IA */}
      <AgentActivityLog />

      {/* Performance */}
      <PerformanceMetrics />
    </div>
  );
}
```

---

## SETUP COMPLET - CONNECTER LE SUPPORT AUX AGENTS IA

### Étape 1: Déployer l'Edge Function

```bash
cd /Users/azzedinezazai/Documents/Agency-Killer-V4/cockpit
supabase functions deploy notify-support-ticket
```

### Étape 2: Configurer le Webhook n8n

**Option A - Créer un nouveau workflow n8n**:

1. n8n → New Workflow → "Support Ticket Handler"
2. Ajouter node "Webhook"
   - HTTP Method: POST
   - Path: `/support-tickets`
3. Copier l'URL webhook générée

**Option B - Modifier le PM existant**:

1. Ouvrir `/agents/CURRENT_pm-mcp/`
2. Ajouter un nouveau trigger "Webhook"
3. Ajouter logique de routing pour `event_type === 'support_ticket_created'`

### Étape 3: Configurer les Variables d'Environnement

**Supabase Dashboard** → Edge Functions → notify-support-ticket → Secrets:

```env
N8N_SUPPORT_WEBHOOK_URL=https://your-n8n.com/webhook/support-tickets
```

### Étape 4: Activer le Trigger Database

**Option A - Via pg_net** (plus complexe):
```sql
-- Enable pg_net extension
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Set webhook URL
ALTER DATABASE postgres
SET app.settings.support_webhook_url TO
'https://your-project.supabase.co/functions/v1/notify-support-ticket';
```

**Option B - Via Database Webhooks** (RECOMMANDÉ - plus simple):

1. Supabase Dashboard → Database → Webhooks
2. Create Webhook:
   - Name: `support-ticket-created`
   - Table: `support_tickets`
   - Events: `INSERT`
   - Type: `HTTP Request`
   - Method: `POST`
   - URL: `https://your-project.supabase.co/functions/v1/notify-support-ticket`
   - Headers:
     ```json
     {
       "Content-Type": "application/json",
       "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"
     }
     ```

### Étape 5: Tester le Flux Complet

1. **Créer un ticket** via l'UI
2. **Vérifier Supabase** :
   - Table Editor → `support_tickets` → Nouveau ticket visible
3. **Vérifier Edge Function Logs**:
   - Dashboard → Edge Functions → notify-support-ticket → Logs
   - Voir le payload envoyé à n8n
4. **Vérifier n8n**:
   - n8n → Executions → Voir le webhook reçu
5. **Vérifier la réponse IA**:
   - Table Editor → `support_messages` → Message de l'agent

---

## DEBUGGING - QUAND ÇA NE MARCHE PAS

### Problème 1: Le ticket est créé mais aucun webhook

**Check**:
1. Supabase → Database → Webhooks → Vérifier activé
2. Edge Function Logs → Voir si appelée
3. Si pas appelée → Problème trigger database

**Fix**:
```sql
-- Vérifier que le trigger existe
SELECT * FROM pg_trigger WHERE tgname = 'trigger_notify_support_ticket_created';

-- Re-créer si nécessaire
DROP TRIGGER IF EXISTS trigger_notify_support_ticket_created ON support_tickets;
CREATE TRIGGER trigger_notify_support_ticket_created
  AFTER INSERT ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION notify_support_ticket_created();
```

### Problème 2: Edge Function appelée mais n8n ne reçoit rien

**Check**:
1. Edge Function Logs → Voir erreur
2. Vérifier `N8N_SUPPORT_WEBHOOK_URL` configurée
3. Tester l'URL n8n manuellement:
   ```bash
   curl -X POST https://your-n8n.com/webhook/support-tickets \
     -H "Content-Type: application/json" \
     -d '{"test": "data"}'
   ```

### Problème 3: n8n reçoit mais l'agent ne répond pas

**Check**:
1. n8n Execution Logs → Voir erreur
2. Vérifier routing dans PM
3. Vérifier que l'agent cible est actif

---

## MONITORING OPTIMAL - MA RECOMMANDATION

### Setup Minimal (1 heure)

1. **Supabase Dashboard** (gratuit)
   - Table Editor pour voir les données
   - Edge Function Logs
   - Database Webhooks

2. **n8n Dashboard** (déjà installé)
   - Execution logs
   - Error tracking

3. **Sentry** (plan gratuit: 5K events/mois)
   - Frontend error tracking
   - User context

### Setup Avancé (1 jour)

1. **Better Stack** (~$20/mois)
   - Logs centralisés
   - Alertes Slack/Email
   - Uptime monitoring

2. **Admin Dashboard Custom**
   - Créer `/cockpit/src/views/AdminMonitoringView.tsx`
   - Realtime ticket queue
   - SLA metrics
   - Agent activity log

3. **Grafana + Prometheus** (si tu veux aller loin)
   - Métriques custom
   - Dashboards avancés
   - Alerting sophistiqué

---

## PROCHAINES ÉTAPES IMMÉDIATES

### 1. Tester l'UI (maintenant)

```bash
# L'app devrait tourner sur http://localhost:5173
# Rafraîchis le navigateur
```

Si ça marche, tu devrais voir l'app sans erreur.

### 2. Configurer le Webhook (15 minutes)

Décide:
- [ ] Utiliser Database Webhooks Supabase (plus simple)
- [ ] OU Utiliser pg_net trigger (plus flexible)

### 3. Déployer l'Edge Function (5 minutes)

```bash
supabase functions deploy notify-support-ticket
```

### 4. Tester le flux complet (10 minutes)

1. Créer un ticket dans l'UI
2. Vérifier qu'il apparaît dans Supabase
3. Vérifier les logs Edge Function
4. (Si n8n configuré) Vérifier qu'il reçoit le webhook

---

## CONCLUSION

**Tu avais raison** : Le backend était invisible car incomplet. Maintenant avec :

1. ✅ Edge Function `notify-support-ticket`
2. ✅ Database Webhook/Trigger
3. ✅ Intégration n8n
4. ✅ Routing vers agents IA

**Le backend devient visible et automatisé!**

**Pour la visualisation** :
- **Niveau 1** : Supabase Dashboard (gratuit, immédiat)
- **Niveau 2** : Papertrail/Better Stack (logs centralisés)
- **Niveau 3** : Admin Dashboard custom (optimal, 1 jour de dev)

**Ma recommandation** : Commence par Supabase Dashboard + n8n Dashboard, puis ajoute Better Stack quand tu veux scaler.

---

**Questions ?** Dis-moi où tu veux que je commence en premier !
