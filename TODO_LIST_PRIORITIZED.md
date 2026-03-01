# 📋 TODO LIST - THE HIVE OS V4
**Mise à jour:** 2026-02-10
**Basé sur:** PRD_THE_HIVE_OS_V4.4.md + PRD_ANALYSIS_AND_RECOMMENDATIONS.md

---

## ✅ TERMINÉ (Session actuelle)

### Phase 1: Refactoring & MCP Servers
- [x] **BoardView refactoring** (1194L → 333L) ✅
- [x] **8 composants extraits** (AgentAvatar, StatusBadge, etc.) ✅
- [x] **Nano Banana Pro MCP Server** (5 outils, 4K) ✅
- [x] **Veo-3 MCP Server** (5 outils, vidéo) ✅
- [x] **ElevenLabs MCP Server** (5 outils, voice) ✅
- [x] **Workflow Milo créé** pour n8n ✅

---

## 🔥 PRIORITÉ CRITIQUE (À faire maintenant)

### Phase 2: Analytics Cache System ⚠️ URGENT
**Pourquoi:** Sans cache, les quotas API seront épuisés en quelques heures!

**Tasks:**
- [ ] **2.1** Créer table Supabase `analytics_cache`
  ```sql
  CREATE TABLE analytics_cache (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(id),
    source TEXT, -- 'ga4', 'meta_ads', 'google_ads'
    date_range_hash TEXT,
    data JSONB,
    fetched_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE INDEX ON analytics_cache (project_id, source, date_range_hash);
  ```

- [ ] **2.2** Modifier MCP servers Sora pour utiliser le cache
  - GTM Server: Cache TTL 60 min
  - GA4 Server: Cache TTL 5 min
  - Meta Ads Server: Cache TTL 15 min
  - Google Ads Server: Cache TTL 15 min
  - Looker Server: Cache TTL 30 min

- [ ] **2.3** Ajouter logique de cache dans n8n workflow Sora
  ```javascript
  // Avant d'appeler MCP server
  1. Check cache (date_range_hash)
  2. Si cache valide (expires_at > NOW) → return cached data
  3. Sinon → call MCP server → save to cache
  ```

- [ ] **2.4** Dashboard Analytics temps réel avec badge cache
  - Afficher "Dernière sync: il y a 2 min"
  - Bouton "Rafraîchir maintenant"

**Estimation:** 4-6 heures
**Impact:** Évite rate limits + réduit latence de 3s à 100ms

---

## 🚀 PRIORITÉ HAUTE (Semaine 1-2)

### Phase 3: Importation Workflows n8n
- [ ] **3.1** Importer workflow PM Central Brain
  ```bash
  # Dans n8n:
  1. Settings → Import from file
  2. Upload: pm-central-brain.workflow.json
  3. Configurer WEBHOOK_URL
  4. Activer workflow
  ```

- [ ] **3.2** Importer workflow Sora
  - Upload: analyst-core-v4.5-with-tools.workflow.json
  - Configurer MCP server paths
  - Tester avec une tâche TYPE A

- [ ] **3.3** Importer workflow Milo
  - Upload: milo-creative.workflow.json
  - Configurer MCP server paths (Nano Banana Pro, Veo-3, ElevenLabs)
  - Tester génération d'image 4K

- [ ] **3.4** Configurer variables d'environnement n8n
  ```env
  # Google Cloud (Nano Banana Pro + Veo-3)
  GOOGLE_CLOUD_PROJECT=...
  GOOGLE_APPLICATION_CREDENTIALS=...

  # ElevenLabs
  ELEVENLABS_API_KEY=...

  # Supabase
  SUPABASE_URL=...
  SUPABASE_KEY=...
  ```

**Estimation:** 2-3 heures
**Bloqueur:** Nécessite credentials Google Cloud + ElevenLabs

---

### Phase 4: Tests End-to-End
- [ ] **4.1** Test complet Sora (TYPE A task)
  - Lancer tâche "Setup GA4"
  - Vérifier appel MCP servers
  - Vérifier write-backs
  - Vérifier mémoire collective

- [ ] **4.2** Test complet Milo (Creative task)
  - Lancer tâche "Generate social media images"
  - Vérifier génération 4K via Nano Banana Pro
  - Vérifier sauvegarde dans project_files
  - Vérifier write-backs

- [ ] **4.3** Test Board View refactorisé
  - Table View: Tri, filtres, actions
  - Kanban View: Drag & drop status
  - Calendar View: Événements par deadline
  - Modal détail: Tous champs affichés

**Estimation:** 3-4 heures
**Dépend de:** Phase 3 terminée

---

## 📈 PRIORITÉ MOYENNE (Semaine 3-4)

### Phase 5: Features UX Recommandées par PRD

#### 5.1 Command Palette (Cmd+K)
**Pourquoi:** Navigation rapide + productivité x2

- [ ] Créer `<CommandPalette>` component
  - Raccourci: Cmd+K (Mac), Ctrl+K (Windows)
  - Search: projets, tâches, agents, files
  - Actions: "New project", "Launch task", "Switch agent"
  - Fuzzy search avec Fuse.js

**Estimation:** 4-6 heures
**Impact:** UX +50%, productivité +100%

---

#### 5.2 Dark Mode
**Pourquoi:** Confort visuel + tendance 2026

- [ ] Créer `useDarkMode` hook
- [ ] Dupliquer toutes les couleurs Tailwind (dark variants)
- [ ] Toggle switch dans header
- [ ] Sauvegarder préférence dans localStorage

**Estimation:** 6-8 heures
**Impact:** UX +30%, accessibilité

---

#### 5.3 Notifications System
**Pourquoi:** User doit savoir quand tâche terminée

- [ ] Créer table `notifications` Supabase
  ```sql
  CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(id),
    user_id UUID REFERENCES auth.users(id),
    type TEXT, -- 'task_completed', 'approval_needed', 'error'
    title TEXT,
    message TEXT,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

- [ ] Créer `<NotificationBell>` component
  - Badge avec count non lues
  - Dropdown liste notifications
  - Mark as read

- [ ] Subscribe to Supabase Realtime
  ```typescript
  supabase
    .channel('notifications')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' },
      (payload) => showToast(payload.new)
    )
    .subscribe()
  ```

**Estimation:** 6-8 heures
**Impact:** UX +40%, engagement +200%

---

## 🔧 PRIORITÉ BASSE (Semaine 5+)

### Phase 6: Optimisations Techniques

#### 6.1 Smart Memory Retrieval
**Problème actuel:** `LIMIT 20` = entries anciennes perdues

- [ ] Implémenter algorithme de pertinence
  ```sql
  SELECT * FROM project_memory
  WHERE project_id = $1
  ORDER BY
    (action = 'STRATEGY_VALIDATED')::int * 100 DESC,
    (recommendations IS NOT NULL)::int * 50 DESC,
    created_at DESC
  LIMIT 20
  ```

- [ ] Alternative: OpenAI Embeddings + similarity search
  - Vectoriser les 500 dernières entries
  - Cosine similarity avec contexte actuel
  - Retourner top 20 les plus pertinentes

**Estimation:** 8-12 heures
**Impact:** Qualité agents +30%, contexte preserved

---

#### 6.2 Error Handling MCP Servers
**Problème:** Pas de fallback si MCP down

- [ ] Wrapper tous les appels MCP
  ```typescript
  interface MCPResponse<T> {
    success: boolean;
    data?: T;
    error?: {
      code: 'MCP_DOWN' | 'RATE_LIMIT' | 'AUTH_EXPIRED';
      message: string;
      retry_after?: number;
    };
    fallback?: T; // Cached data
  }
  ```

- [ ] UI Fallback
  - Afficher données cachées avec badge "Dernière sync: 2h ago"
  - Bouton "Réessayer"
  - Toast notification

**Estimation:** 4-6 heures
**Impact:** UX +20%, reliability +80%

---

#### 6.3 Rate Limiting Intelligent
**Problème:** APIs externes ont des limits

- [ ] Implémenter rate limiter per-API
  ```typescript
  const rateLimits = {
    ga4: { calls: 10000, per: 'day', current: 0 },
    meta_ads: { calls: 200, per: 'hour', current: 0 },
    google_ads: { calls: 10000, per: 'day', current: 0 },
  };
  ```

- [ ] Dashboard rate limits
  - Progress bars par API
  - Alertes à 80%
  - Reset counters automatiques

**Estimation:** 3-4 heures
**Impact:** Évite bans, prédictibilité

---

### Phase 7: Agents Luna & Marcus (Future)

#### 7.1 Luna (Strategist)
- [ ] Créer workflow Luna n8n
- [ ] MCP Servers Luna (none needed, uses Sora's)
- [ ] System prompt Luna
- [ ] Tests stratégie validation

**Estimation:** 6-8 heures

---

#### 7.2 Marcus (Execution Manager)
- [ ] Créer workflow Marcus n8n
- [ ] MCP Servers Marcus:
  - Meta Ads API (écriture)
  - Google Ads API (écriture)
  - GTM API (écriture)
- [ ] System prompt Marcus
- [ ] Tests campaign launch

**Estimation:** 12-16 heures

---

## 📊 RÉSUMÉ PAR PRIORITÉ

| Priorité | Tasks | Estimation | Impact |
|---|---|---|---|
| 🔥 **CRITIQUE** | Analytics Cache | 4-6h | Évite rate limits |
| 🚀 **HAUTE** | Import workflows + Tests | 5-7h | Débloque production |
| 📈 **MOYENNE** | Command Palette + Dark Mode + Notifications | 16-22h | UX +40% |
| 🔧 **BASSE** | Smart Memory + Error Handling + Rate Limiting | 15-22h | Qualité +30% |
| 🎯 **FUTURE** | Luna + Marcus agents | 18-24h | Feature complete |

---

## 🎯 PLAN D'ACTION RECOMMANDÉ

### Cette semaine (Semaine 1)
1. ✅ ~~Refactoring BoardView~~ (TERMINÉ)
2. ✅ ~~MCP Servers Milo~~ (TERMINÉ)
3. 🔥 **Analytics Cache System** (CRITIQUE - 4-6h)
4. 🚀 **Import workflows n8n** (2-3h)
5. 🚀 **Tests end-to-end** (3-4h)

### Semaine 2
6. Command Palette (4-6h)
7. Dark Mode (6-8h)

### Semaine 3
8. Notifications System (6-8h)
9. Smart Memory Retrieval (8-12h)

### Semaine 4+
10. Error Handling MCP
11. Rate Limiting
12. Luna agent
13. Marcus agent

---

## ✅ CRITÈRES D'ACCEPTATION

### Pour passer en production:
- [ ] Analytics cache implémenté (TTL configuré)
- [ ] Tous workflows importés et testés
- [ ] 0 erreurs TypeScript
- [ ] Tests manuels: Board, Sora, Milo fonctionnent
- [ ] Credentials configurés (Google Cloud, ElevenLabs)
- [ ] Monitoring basic en place (logs Supabase)

### Pour v4.5 complète:
- [ ] Command Palette opérationnel
- [ ] Dark Mode activable
- [ ] Notifications temps réel
- [ ] Smart Memory avec priorités
- [ ] Error handling robuste
- [ ] Luna et Marcus agents actifs

---

**Créé par Claude Code - The Hive OS V4**
**Date:** 2026-02-10
