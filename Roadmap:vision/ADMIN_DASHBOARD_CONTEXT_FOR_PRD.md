# Contexte pour PRD - Admin Monitoring Dashboard

**À fournir à Claude pour créer le PRD parfait**

---

## CONTEXTE DU PROJET

**Nom du projet** : The Hive OS V4 - Agency Killer Cockpit
**Type** : SaaS marketing automation avec 5 agents IA spécialisés
**Stack technique** : React + TypeScript + Supabase + n8n + 14 MCP servers

### Les 5 Agents IA
1. **LUNA** - Expert SEO, Keywords, Content Strategy, Technical SEO
2. **SORA** - Expert Analytics (GA4, GTM, Meta Pixel, TikTok), Data Analysis
3. **MARCUS** - Expert Ads (Meta, Google, TikTok), Campaign Management, Budget
4. **MILO** - Expert Créatif (Images, Vidéos, Audio), Content Generation
5. **DOFFY** - Expert Social Media (LinkedIn, Instagram, Twitter/X, TikTok, Facebook), Content Scheduling, Community Engagement

### Architecture Backend Actuelle
```
Frontend (React Cockpit)
  ↓
n8n Workflows (PM + Orchestrator + 5 Agents)
  ↓
MCP Bridge (Express.js HTTP server)
  ↓
14 MCP Servers (stdio) : seo-audit, google-ads, meta-ads, analytics, social-media, etc.
  ↓
Supabase (PostgreSQL + Auth + Realtime + Edge Functions)
```

---

## PROBLÈME IDENTIFIÉ PAR L'UTILISATEUR

> "Le backend m'est totalement invisible. Je ne sais pas ce qui se passe quand un utilisateur interagit avec l'app. Les agents IA travaillent mais je ne vois rien. J'ai l'impression que le système n'existe pas."

**Symptômes** :
- Impossible de voir en temps réel ce que font les agents IA
- Pas de visibilité sur les workflows n8n en cours
- Pas de métriques de performance
- Pas de logs centralisés
- Pas de debug possible quand un problème arrive

---

## CE QUI EXISTE DÉJÀ

### Support Ticket System (Récemment implémenté - Phase 2 & 3)
**Tables** :
- `support_tickets` - Tickets utilisateurs
- `support_messages` - Messages du thread
- `support_internal_notes` - Notes privées admin
- `ticket_satisfaction` - Enquêtes CSAT
- `email_logs` - Tracking des emails envoyés

**Métriques disponibles** :
- SLA tracking (first response time, resolution time, SLA breaches)
- AI categorization (confidence, sentiment, urgency score)
- CSAT scores (ratings 1-5)
- Duplicate detection (vector similarity)

**Vues matérialisées** :
- `ticket_sla_dashboard` - Métriques SLA agrégées par date/priorité/catégorie
- `ticket_csat_metrics` - Scores CSAT agrégés par date

### Architecture Supabase
**Database** :
- PostgreSQL avec RLS (Row Level Security)
- Realtime subscriptions (postgres_changes)
- Edge Functions (Deno)
- pgvector extension (similarity search)

**Auth** :
- Supabase Auth
- Roles : `user`, `admin`, `super_admin` (table `user_roles`)

### Frontend Existant
**Framework** : React 18 + TypeScript + Vite
**UI Library** : Tailwind CSS + Framer Motion
**Charts** : Recharts (déjà installé)
**Icons** : Lucide React

**Composants Support déjà créés** :
- `SLADashboard.tsx` - Graphiques SLA (existe mais pas intégré)
- `SupportView.tsx` - Liste tickets + création
- `SupportTicketDetailView.tsx` - Détail ticket + messages
- `FileUploader.tsx` - Upload multi-fichiers
- `SatisfactionSurvey.tsx` - Enquête CSAT

**Layout existant** :
- `MainLayout.tsx` - Sidebar avec navigation
- `AdminDashboardView.tsx` - Vue admin existante (mais basique)

---

## CE QUI MANQUE (À CONSTRUIRE)

### 1. Visibilité Backend n8n
**Problème** : Les workflows n8n tournent mais on ne voit rien depuis le cockpit.

**Besoin** :
- Voir les workflows n8n en cours d'exécution
- Voir les logs des agents IA (Luna, Sora, Marcus, Milo, Doffy)
- Voir les erreurs en temps réel
- Voir les performances (temps d'exécution, taux de succès)

**Données disponibles** :
- n8n expose une API REST : https://docs.n8n.io/api/
- Endpoints utiles :
  - `GET /executions` - Liste des executions
  - `GET /executions/{id}` - Détails d'une execution
  - `GET /workflows` - Liste des workflows
  - `GET /workflows/{id}/executions` - Executions d'un workflow

### 2. Visibilité MCP Servers
**Problème** : 14 MCP servers tournent via le Bridge mais aucune visibilité.

**Besoin** :
- Voir quels MCP servers sont actifs
- Voir les appels MCP en temps réel
- Voir les erreurs MCP
- Voir les performances par server

**Données disponibles** :
- MCP Bridge expose `GET /api/health` - Status des servers
- Logs dans stdout/stderr (à centraliser)

### 3. Métriques Utilisateur
**Problème** : On ne sait pas comment les users utilisent l'app.

**Besoin** :
- Nombre d'utilisateurs actifs
- Actions par utilisateur (projets créés, tâches lancées, etc.)
- Temps passé dans l'app
- Features les plus utilisées

**Données disponibles** :
- Table `users` (Supabase Auth)
- Table `projects` (user projects)
- Table `project_memory` (toutes les actions des agents)

### 4. Alertes & Monitoring
**Problème** : Si un agent crashe ou une API échoue, on ne sait rien.

**Besoin** :
- Alertes en temps réel (errors, SLA breaches, etc.)
- Status page (tous les services up/down)
- Notifications Slack/Email

---

## OBJECTIFS DU ADMIN DASHBOARD

### Objectif 1 : Visibilité Temps Réel
**User story** : "En tant qu'admin, je veux voir en temps réel ce qui se passe dans le backend pour pouvoir intervenir rapidement si nécessaire."

**Metrics clés** :
- Nombre de tickets support ouverts/in progress/resolved
- Nombre de workflows n8n en cours
- Nombre d'agents IA actifs (5 agents : Luna, Sora, Marcus, Milo, Doffy)
- Nombre d'erreurs dans la dernière heure

### Objectif 2 : Performance Monitoring
**User story** : "En tant qu'admin, je veux voir les performances du système pour identifier les bottlenecks et optimiser."

**Metrics clés** :
- SLA compliance rate (% de tickets résolus dans les délais)
- Temps moyen de première réponse
- Temps moyen de résolution
- Taux de succès des workflows n8n
- Temps d'exécution moyen par agent

### Objectif 3 : Debug & Troubleshooting
**User story** : "En tant qu'admin, quand un utilisateur reporte un problème, je veux pouvoir voir rapidement ce qui s'est passé."

**Features** :
- Logs centralisés avec recherche
- Timeline d'événements par ticket/user
- Stack traces des erreurs
- Replay des executions n8n

### Objectif 4 : Business Intelligence
**User story** : "En tant qu'admin/fondateur, je veux comprendre comment l'outil est utilisé pour prendre des décisions stratégiques."

**Metrics clés** :
- Users actifs (DAU, MAU, WAU)
- Taux de rétention
- Features les plus utilisées
- CSAT moyen
- Ticket volume trends

---

## CONTRAINTES TECHNIQUES

### Performance
- Le dashboard doit charger en < 2 secondes
- Les graphiques doivent être interactifs (zoom, filter)
- Realtime updates via Supabase subscriptions (pas de polling)

### Sécurité
- Admin-only (vérification role via RLS Supabase)
- Pas d'exposition de credentials
- Logs sanitisés (pas de PII sauf si nécessaire)

### Scalabilité
- Doit supporter 100+ users simultanés
- Doit supporter 1000+ tickets/jour
- Graphiques optimisés (aggregation côté DB)

---

## DESIGN PREFERENCES

### Style Visuel
- **Dark mode** (background: slate-900, accents: cyan-500/blue-500)
- **Glassmorphism** subtil (backdrop-blur, transparence)
- **Animations** Framer Motion pour les transitions
- **Charts** Recharts (ligne, bar, pie, area)

### Layout
- **Sidebar gauche** (navigation - déjà existant dans MainLayout)
- **Header** avec breadcrumb + user menu
- **Grid layout** responsive (Tailwind grid)
- **Cards** avec stats + graphiques

### Inspirations Design
- Vercel Analytics Dashboard
- Linear.app (clean, fast, beautiful)
- Supabase Dashboard (cards avec stats)
- Grafana (graphiques interactifs)

---

## FONCTIONNALITÉS PRIORITAIRES

### P0 (Must Have - MVP)
1. **Support Ticket Queue** - Liste des tickets en temps réel avec filtres
2. **SLA Metrics Dashboard** - Graphiques des métriques SLA
3. **System Health** - Status des services (Supabase, n8n, MCP Bridge)
4. **Recent Activity Log** - 50 derniers événements (tickets, errors, etc.)

### P1 (Should Have - V1.1)
5. **Agent Activity Timeline** - Voir ce que fait chaque agent IA
6. **n8n Executions Viewer** - Liste des workflows avec status
7. **Error Tracking** - Liste des erreurs avec stack traces
8. **User Analytics** - DAU, MAU, actions par user

### P2 (Nice to Have - V2)
9. **Custom Alerts** - Configurer des alertes Slack/Email
10. **Performance Profiling** - Flame graphs, slow queries
11. **A/B Testing Dashboard** - Si on lance des experiments
12. **Export/Reports** - Exporter les métriques en PDF/CSV

---

## INTÉGRATIONS REQUISES

### Supabase
- **Realtime** : `supabase.channel().on('postgres_changes', ...)`
- **Database Functions** : `supabase.rpc('get_sla_summary', ...)`
- **Edge Functions** : Appeler via `supabase.functions.invoke(...)`

### n8n (via API)
```typescript
const n8nClient = {
  baseURL: 'https://your-n8n.com/api/v1',
  headers: { 'X-N8N-API-KEY': 'xxx' }
};

// Get executions
GET /executions?status=running&limit=10

// Get workflow details
GET /workflows/{id}/executions
```

### MCP Bridge
```typescript
// Health check
GET http://localhost:3456/api/health

// Response:
{
  "status": "healthy",
  "servers": {
    "seo-audit": "active",
    "google-ads": "active",
    // ...
  }
}
```

---

## DONNÉES MOCKÉES POUR DÉVELOPPEMENT

### Support Tickets
```sql
-- Générer 100 tickets de test avec variety
INSERT INTO support_tickets (user_id, subject, description, category, priority, status, created_at)
SELECT
  (SELECT id FROM auth.users ORDER BY random() LIMIT 1),
  'Test ticket ' || i,
  'Description du ticket ' || i,
  (ARRAY['bug', 'feature_request', 'question', 'billing'])[floor(random() * 4 + 1)],
  (ARRAY['low', 'medium', 'high', 'critical'])[floor(random() * 4 + 1)],
  (ARRAY['open', 'in_progress', 'resolved', 'closed'])[floor(random() * 4 + 1)],
  NOW() - (random() * interval '30 days')
FROM generate_series(1, 100) i;
```

### n8n Executions Mock
```typescript
const mockExecutions = [
  {
    id: "1",
    workflowId: "luna-agent",
    status: "success",
    startedAt: "2024-01-15T10:30:00Z",
    stoppedAt: "2024-01-15T10:30:45Z",
    data: { inputData: {...}, outputData: {...} }
  },
  // ...
];
```

---

## LIVRABLES ATTENDUS DANS LE PRD

1. **User Stories détaillées** (avec critères d'acceptation)
2. **Wireframes/Mockups** (au moins sketches textuels)
3. **Architecture technique** (composants React, API calls, data flow)
4. **Schema de données** (nouvelles tables si nécessaire)
5. **Plan d'implémentation** (phases, timeline)
6. **Critères de succès** (métriques à tracker)

---

## CONTRAINTES & CONSIDÉRATIONS

### Ce qui est NON-NÉGOCIABLE
- **Performance** : Dashboard doit être rapide (< 2s load)
- **Sécurité** : Admin-only avec RLS stricte
- **Temps réel** : Pas de polling, utiliser Supabase Realtime
- **Mobile-friendly** : Dashboard utilisable sur iPad minimum

### Ce qui est FLEXIBLE
- Design exact (tant que c'est professionnel)
- Choix des graphiques (ligne vs bar vs area)
- Ordre des features (on peut réorganiser P0/P1/P2)

### Ce qu'il faut ÉVITER
- Over-engineering (garder simple et itératif)
- Trop de dépendances externes
- Polling intensif (utiliser websockets/realtime)
- UI trop chargée (privilégier la clarté)

---

## QUESTIONS À CLARIFIER DANS LE PRD

1. **Refresh rate** : Les données doivent se rafraîchir à quelle fréquence ?
   - Tickets : Temps réel (Supabase realtime)
   - SLA metrics : Toutes les 5 minutes ? 1 heure ? On-demand ?
   - n8n executions : Polling toutes les 10 secondes ? Webhook ?

2. **Rétention des logs** : Combien de temps garder les logs ?
   - 7 jours ? 30 jours ? 90 jours ?

3. **Permissions granulaires** : Tous les admins voient tout ou pas ?
   - Super admin : Tout
   - Admin : Tickets + metrics uniquement
   - Support : Tickets seulement

4. **Alerting priority** : Quelles alertes sont critiques ?
   - SLA breach : Email immédiat
   - n8n workflow fail : Slack notification
   - MCP server down : Email + Slack

---

## FICHIERS DE RÉFÉRENCE

Pour créer le PRD, référencer ces fichiers existants :

### Support System
- `/cockpit/src/views/AdminDashboardView.tsx` - Dashboard actuel (basique)
- `/cockpit/src/components/admin/SLADashboard.tsx` - Composant SLA existant
- `/cockpit/src/services/support.service.ts` - Service functions support

### Database Schema
- `/cockpit/supabase/migrations/020_sla_tracking.sql` - Schema SLA
- `/cockpit/supabase/migrations/024_satisfaction_surveys.sql` - Schema CSAT

### Documentation
- `/SUPPORT_SYSTEM_BACKEND_GUIDE.md` - Guide du backend complet
- `/cockpit/PHASE2_PHASE3_COMPLETION_REPORT.md` - Rapport features support

---

## EXEMPLE DE OUTPUT ATTENDU

**Section du PRD** :

```markdown
### Feature: Real-time Ticket Queue

**User Story**:
En tant qu'admin support, je veux voir tous les tickets ouverts en temps réel
pour pouvoir répondre rapidement aux urgences.

**Acceptance Criteria**:
- [ ] Liste paginée des tickets (20 par page)
- [ ] Filtres : status, priority, category, date range
- [ ] Tri : created_at, updated_at, priority
- [ ] Badge "NEW" sur tickets < 5 min
- [ ] Badge "SLA BREACH" sur tickets dépassant SLA
- [ ] Mise à jour temps réel (nouveau ticket apparaît automatiquement)
- [ ] Click sur ticket → ouvre SupportTicketDetailView

**Technical Implementation**:
```typescript
// Component: /src/components/admin/TicketQueue.tsx
const subscription = supabase
  .channel('ticket-queue')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'support_tickets'
  }, handleTicketUpdate)
  .subscribe();
```

**Data Source**:
- Table: `support_tickets`
- Realtime: Supabase postgres_changes
- Filters: Client-side pour performance

**Mockup** (textuel):
```
┌─────────────────────────────────────────────────────┐
│  Support Ticket Queue                     [Filters] │
├─────────────────────────────────────────────────────┤
│  ○ #TICKET-001 | Pixel tracking bug     | HIGH  🔴 │
│     User: john@example.com | 5 min ago             │
│                                                     │
│  ○ #TICKET-002 | Feature request         | MEDIUM  │
│     User: jane@example.com | 1 hour ago           │
│                                                     │
│  [Load More]                                        │
└─────────────────────────────────────────────────────┘
```
```

---

**FIN DU CONTEXTE**
