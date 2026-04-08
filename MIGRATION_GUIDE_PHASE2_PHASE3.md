# Guide de Migration - Support System Phase 2 & 3

**Date:** 2026-04-07
**Version:** 4.4
**Migrations:** 018-026

---

## ⚠️ IMPORTANT: Migrations SQL Requises

Les 9 migrations SQL doivent être appliquées **dans l'ordre** avant d'utiliser les fonctionnalités Phase 2 & 3.

### Méthode Recommandée: Fichier Consolidé

Un fichier unique contenant toutes les migrations a été créé :

```
/cockpit/supabase/migrations/APPLY_NOW_phase2_phase3.sql
```

**Étapes pour appliquer :**

1. **Via Supabase Dashboard (Recommandé)**
   - Allez sur https://supabase.com/dashboard/project/qizahdzfrgzkyztvbpqy/editor
   - Cliquez sur "SQL Editor"
   - Cliquez sur "New query"
   - Copiez le contenu de `APPLY_NOW_phase2_phase3.sql`
   - Cliquez sur "Run" (en bas à droite)
   - Attendez la confirmation "Success"

2. **Via CLI Supabase (Alternative)**
   ```bash
   npx supabase db push --db-url "postgresql://postgres.qizahdzfrgzkyztvbpqy:Nejisasuke%237@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"
   ```
   (Note : Le `#` dans le mot de passe doit être encodé en `%23`)

3. **Via psql (Si installé)**
   ```bash
   PGPASSWORD="Nejisasuke#7" psql \
     -h aws-0-eu-central-1.pooler.supabase.com \
     -p 6543 \
     -U postgres.qizahdzfrgzkyztvbpqy \
     -d postgres \
     -f cockpit/supabase/migrations/APPLY_NOW_phase2_phase3.sql
   ```

---

## Migrations Incluses (Ordre d'Exécution)

### ✅ Migration 018: Email Notifications
**Fichier:** `018_email_notifications.sql`

**Tables créées:**
- `email_logs` - Historique des emails envoyés
- `user_email_preferences` - Préférences notifications par user

**Functions créées:**
- `notify_user_on_admin_message()` - Trigger auto-email

**Features:**
- Notifications email quand admin répond
- Notifications changement de statut
- Préférences configurables par user

---

### ✅ Migration 019: Internal Admin Notes
**Fichier:** `019_internal_notes.sql`

**Tables créées:**
- `support_internal_notes` - Notes privées admins

**Functions créées:**
- `get_internal_notes(ticket_id)` - Récupérer les notes
- `create_internal_note(ticket_id, note)` - Ajouter une note
- `delete_internal_note(note_id)` - Supprimer une note

**RLS Policies:**
- Visibles uniquement par admins (`role IN ('admin', 'super_admin')`)

---

### ✅ Migration 020: SLA Tracking
**Fichier:** `020_sla_tracking.sql`

**Colonnes ajoutées à `support_tickets`:**
- `first_response_at TIMESTAMPTZ` - Timestamp première réponse admin
- `sla_breached BOOLEAN` - Indicateur breach SLA
- `sla_breach_reason TEXT` - Raison du breach

**Functions créées:**
- `calculate_ticket_sla(ticket_id)` - Calcul métriques SLA
- `set_first_response_at()` - Trigger auto first_response
- `refresh_sla_dashboard()` - Refresh materialized view

**Materialized View:**
- `ticket_sla_dashboard` - Métriques agrégées par jour

**SLA Targets:**
- Critique : 4h first response
- Haute : 24h first response
- Moyenne : 48h first response
- Basse : 72h first response

---

### ✅ Migration 021: AI Features
**Fichier:** `021_ai_features.sql`

**Colonnes ajoutées à `support_tickets`:**
- `ai_suggested_category ticket_category` - Catégorie suggérée par IA
- `ai_suggested_priority ticket_priority` - Priorité suggérée
- `ai_confidence NUMERIC(3,2)` - Score de confiance (0.00-1.00)
- `ai_reasoning TEXT` - Explication de l'IA
- `sentiment TEXT` - Sentiment (positive/neutral/negative)
- `urgency_score SMALLINT` - Score urgence (1-10)

**Features:**
- Auto-catégorisation via Claude API
- Analyse de sentiment
- Score d'urgence

---

### ✅ Migration 022: Knowledge Base
**Fichier:** `022_knowledge_base.sql`

**Tables créées:**
- `kb_articles` - Articles de documentation

**Colonnes:**
- `title, slug, content, category, tags[]`
- `view_count, helpful_count` - Métriques engagement
- `search_vector tsvector` - Full-text search

**Functions créées:**
- `search_kb_articles(query, limit)` - Recherche FTS avec ranking
- `increment_kb_view(article_id)` - Compteur vues
- `mark_kb_helpful(article_id)` - Compteur helpful
- `get_kb_stats()` - Statistiques KB

**Indexes:**
- GIN index sur `search_vector` (fast FTS)
- GIN index sur `tags` (array search)

---

### ✅ Migration 023: Ticket Templates
**Fichier:** `023_ticket_templates.sql`

**Tables créées:**
- `ticket_templates` - Templates pré-remplis

**Seed Data:**
- 7 templates populaires (Bug, Feature, Question, Billing, Integration)

**Functions créées:**
- `get_public_templates(category_filter)` - Liste templates publics
- `increment_template_usage(template_id)` - Compteur utilisation

**Features:**
- Templates pré-remplis pour création rapide
- Filtrage par catégorie
- Templates "featured" (is_featured)

---

### ✅ Migration 024: Satisfaction Surveys
**Fichier:** `024_satisfaction_surveys.sql`

**Tables créées:**
- `ticket_satisfaction` - Enquêtes CSAT post-résolution

**Colonnes:**
- `rating SMALLINT` (1-5 étoiles)
- `feedback TEXT` (commentaire optionnel)
- `positive_tags TEXT[]` - Tags positifs
- `negative_tags TEXT[]` - Tags négatifs

**Materialized View:**
- `ticket_csat_metrics` - Métriques CSAT agrégées

**Functions créées:**
- `get_csat_summary(days_back)` - Résumé CSAT période
- `ticket_has_survey(ticket_id)` - Check si survey existe
- `get_ticket_satisfaction(ticket_id)` - Récupérer survey
- `get_low_rated_tickets()` - Tickets mal notés pour analyse
- `refresh_csat_metrics()` - Refresh materialized view

**RLS Policies:**
- Users peuvent créer survey pour leurs propres tickets résolus
- Users peuvent update dans les 24h
- Admins peuvent voir tous les surveys

---

### ✅ Migration 025: Admin Response Templates
**Fichier:** `025_response_templates.sql`

**Tables créées:**
- `admin_response_templates` - Templates réponses admins

**Seed Data:**
- 10 templates courants (bug investigation, feature roadmap, FAQ, etc.)

**Functions créées:**
- `get_response_templates(category_filter)` - Liste templates admin
- `increment_response_template_usage(template_id)` - Compteur

**Features:**
- Templates partagés (is_shared) ou privés
- Filtrage par catégorie ticket
- Usage counter pour identifier les plus populaires

---

### ✅ Migration 026: Duplicate Detection
**Fichier:** `026_duplicate_detection.sql`

**Extension requise:**
- `vector` (pgvector) - Vector similarity search

**Colonnes ajoutées à `support_tickets`:**
- `embedding vector(1536)` - Embedding OpenAI (text-embedding-ada-002)
- `embedding_generated_at TIMESTAMPTZ` - Date génération

**Indexes:**
- `ivfflat` index sur `embedding` avec cosine similarity

**Functions créées:**
- `find_similar_tickets(embedding, threshold, limit)` - Recherche similarité
- `find_ticket_duplicates(ticket_id, threshold, limit)` - Doublons d'un ticket
- `mark_ticket_as_duplicate(ticket_id, original_id)` - Marquer doublon
- `get_tickets_pending_embedding(limit)` - Tickets sans embedding

**View:**
- `duplicate_detection_stats` - Stats couverture embeddings

**Seuil recommandé:** 0.80 (80% similarity)

---

## Vérification Post-Migration

### Commande de Vérification

```bash
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://qizahdzfrgzkyztvbpqy.supabase.co',
  'YOUR_SERVICE_ROLE_KEY'
);

async function verify() {
  const checks = [
    { name: 'Email Logs', table: 'email_logs' },
    { name: 'Internal Notes', table: 'support_internal_notes' },
    { name: 'SLA Column', table: 'support_tickets', column: 'first_response_at' },
    { name: 'AI Category', table: 'support_tickets', column: 'ai_suggested_category' },
    { name: 'KB Articles', table: 'kb_articles' },
    { name: 'Ticket Templates', table: 'ticket_templates' },
    { name: 'Satisfaction', table: 'ticket_satisfaction' },
    { name: 'Response Templates', table: 'admin_response_templates' },
    { name: 'Embeddings', table: 'support_tickets', column: 'embedding' }
  ];

  for (const check of checks) {
    const query = check.column
      ? supabase.from(check.table).select(check.column).limit(1)
      : supabase.from(check.table).select('id').limit(1);
    const { error } = await query;
    console.log(error ? \`❌ \${check.name}\` : \`✅ \${check.name}\`);
  }
}

verify();
"
```

### Résultat Attendu

```
✅ Email Logs
✅ Internal Notes
✅ SLA Column
✅ AI Category
✅ KB Articles
✅ Ticket Templates
✅ Satisfaction
✅ Response Templates
✅ Embeddings
```

---

## Edge Functions à Déployer

Après application des migrations, déployez les Edge Functions :

### 1. send-support-email
```bash
npx supabase functions deploy send-support-email
```

**Env vars requises:**
- `SENDGRID_API_KEY`
- `SENDGRID_FROM_EMAIL`
- `SENDGRID_FROM_NAME`

### 2. check-sla-breaches
```bash
npx supabase functions deploy check-sla-breaches
```

**Cron:** Configurer dans Supabase Dashboard pour run toutes les heures

### 3. ai-categorize-ticket
```bash
npx supabase functions deploy ai-categorize-ticket
```

**Env vars requises:**
- `ANTHROPIC_API_KEY`

### 4. generate-ticket-embedding
```bash
npx supabase functions deploy generate-ticket-embedding
```

**Env vars requises:**
- `OPENAI_API_KEY`

---

## Rollback (En cas de problème)

Les migrations peuvent être rollback en supprimant les tables/colonnes créées :

```sql
-- Rollback Migration 026
ALTER TABLE support_tickets DROP COLUMN IF EXISTS embedding;
ALTER TABLE support_tickets DROP COLUMN IF EXISTS embedding_generated_at;
DROP TABLE IF EXISTS duplicate_detection_stats;

-- Rollback Migration 025
DROP TABLE IF EXISTS admin_response_templates CASCADE;

-- Rollback Migration 024
DROP TABLE IF EXISTS ticket_satisfaction CASCADE;
DROP MATERIALIZED VIEW IF EXISTS ticket_csat_metrics;

-- Rollback Migration 023
DROP TABLE IF EXISTS ticket_templates CASCADE;

-- Rollback Migration 022
DROP TABLE IF EXISTS kb_articles CASCADE;

-- Rollback Migration 021
ALTER TABLE support_tickets DROP COLUMN IF EXISTS ai_suggested_category;
ALTER TABLE support_tickets DROP COLUMN IF EXISTS ai_suggested_priority;
ALTER TABLE support_tickets DROP COLUMN IF EXISTS ai_confidence;
ALTER TABLE support_tickets DROP COLUMN IF EXISTS ai_reasoning;
ALTER TABLE support_tickets DROP COLUMN IF EXISTS sentiment;
ALTER TABLE support_tickets DROP COLUMN IF EXISTS urgency_score;

-- Rollback Migration 020
ALTER TABLE support_tickets DROP COLUMN IF EXISTS first_response_at;
ALTER TABLE support_tickets DROP COLUMN IF EXISTS sla_breached;
ALTER TABLE support_tickets DROP COLUMN IF EXISTS sla_breach_reason;
DROP MATERIALIZED VIEW IF EXISTS ticket_sla_dashboard;

-- Rollback Migration 019
DROP TABLE IF EXISTS support_internal_notes CASCADE;

-- Rollback Migration 018
DROP TABLE IF EXISTS email_logs CASCADE;
DROP TABLE IF EXISTS user_email_preferences CASCADE;
```

---

## Support & Questions

Si vous rencontrez des problèmes pendant la migration :

1. Vérifiez les logs Supabase Dashboard
2. Consultez le fichier de migration individuel pour comprendre l'erreur
3. Vérifiez que pgvector extension est installée (pour migration 026)
4. Vérifiez les RLS policies existantes

---

**Fin du Guide de Migration**
