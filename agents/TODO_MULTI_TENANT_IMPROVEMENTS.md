# 🏢 MULTI-TENANT IMPROVEMENTS - THE HIVE OS V4

**Date:** 2026-02-20
**Priority:** Phase 3-4 (Après migration backend)
**Status:** ✅ Architecture actuelle fonctionne pour MVP, optimisations pour scale

---

## ✅ État Actuel (Fonctionne)

### Isolation Données (PARFAIT)
- ✅ Supabase tables filtrées par `user_id`
- ✅ Projects, tasks, files, memory isolés
- ✅ Credentials isolés via `user_integrations`
- ✅ Write-backs ciblent le bon user

### Isolation Compute (BASIQUE)
- ✅ MCP Bridge stateless
- ✅ Workflows n8n isolés par exécution
- ⚠️ Ressources partagées (rate limit, concurrency, queue)

---

## 🚀 Améliorations Phase 3: Resource Management

### 1. Rate Limiting par User

**Problème actuel:**
```typescript
// mcp-bridge rate limiting (global)
app.use(rateLimit({
  windowMs: 60000,
  max: 500  // 500 req/min POUR TOUS LES USERS
}));
```

**Solution:**
```typescript
// Rate limit par user_id
app.use(rateLimitByUser({
  windowMs: 60000,
  max: (user_id) => {
    const plan = getUserPlan(user_id);
    return plan === 'free' ? 100 : plan === 'pro' ? 500 : 2000;
  }
}));
```

**Implémentation:**
- Ajouter `user_id` dans header `X-User-Id` pour toutes les requêtes au bridge
- Créer middleware `rateLimitByUser` avec Redis (cache des compteurs)
- Différencier rate limits par plan (free/pro/enterprise)

---

### 2. MCP Server Concurrency par User

**Problème actuel:**
```json
// config/servers.json
{
  "veo3": {
    "max_concurrent": 5  // 5 POUR TOUS LES USERS
  }
}
```

**Solution:**
```typescript
// Pool de process par user
class MCPProcessPool {
  private userPools: Map<string, ProcessQueue>;

  async executeForUser(user_id: string, server: string, tool: string) {
    const plan = await getUserPlan(user_id);
    const maxConcurrent = plan === 'free' ? 1 : plan === 'pro' ? 3 : 10;

    const userQueue = this.getUserQueue(user_id, maxConcurrent);
    return userQueue.execute(server, tool);
  }
}
```

**Implémentation:**
- Pool de process par user_id avec quotas
- Free: 1 VEO-3 simultané
- Pro: 3 simultanés
- Enterprise: 10 simultanés

---

### 3. n8n Fair Scheduling

**Problème actuel:**
- Queue globale FIFO (First In First Out)
- Si User A lance 100 tasks, User B attend

**Solution Option A: Round-Robin par User**
```typescript
// Custom n8n queue
class FairQueue {
  private userQueues: Map<string, Queue>;

  async scheduleTask(user_id: string, task: Task) {
    // Round-robin entre users
    const userQueue = this.getUserQueue(user_id);
    userQueue.add(task);

    // Schedule next task from least-recently-served user
    const nextUser = this.getLeastRecentlyServedUser();
    return this.executeNextTask(nextUser);
  }
}
```

**Solution Option B: Migrer vers backend avec Bull Queue**
```typescript
// Utiliser Bull (Redis-backed queue)
import Bull from 'bull';

const taskQueue = new Bull('tasks', {
  limiter: {
    max: 10,  // 10 jobs/sec max
    duration: 1000,
    groupKey: 'user_id'  // Fair scheduling par user
  }
});

taskQueue.process(async (job) => {
  const { user_id, task } = job.data;
  return executeTask(user_id, task);
});
```

---

### 4. Usage Quotas (Déjà prévu Migration 008)

**Déjà implémenté:**
```sql
-- migration 008: api_usage_tracking.sql
CREATE TABLE api_usage (
  user_id UUID REFERENCES auth.users,
  service TEXT,
  cost_usd DECIMAL(10,4),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fonction check_quota déjà créée
CREATE FUNCTION check_user_quota(p_user_id UUID, p_service TEXT)
RETURNS JSON;
```

**À faire:**
- Définir quotas par plan (free/pro/enterprise)
- Bloquer génération si quota dépassé
- UI dans Cockpit pour voir usage

**Exemple quotas:**
```typescript
const QUOTAS = {
  free: {
    images_per_day: 10,
    videos_per_day: 2,
    api_calls_per_day: 100
  },
  pro: {
    images_per_day: 100,
    videos_per_day: 20,
    api_calls_per_day: 1000
  },
  enterprise: {
    images_per_day: -1,  // unlimited
    videos_per_day: -1,
    api_calls_per_day: -1
  }
};
```

---

## 🏗️ Améliorations Phase 4: Architecture Scalable

### 1. Dedicated Worker Pools

**Architecture actuelle:**
```
All Users → MCP Bridge → Shared MCP Servers
```

**Architecture scalable:**
```
Free Users → Worker Pool 1 (low priority)
Pro Users → Worker Pool 2 (normal priority)
Enterprise → Worker Pool 3 (high priority + dedicated)
```

**Implémentation:**
- Kubernetes pods avec différentes priorités
- Auto-scaling basé sur usage
- SLA garantis par plan

---

### 2. Caching & CDN

**Déjà implémenté:**
- ✅ Cloudinary CDN pour images/vidéos

**À améliorer:**
- Redis cache pour réponses API fréquentes
- Cache Supabase queries (ex: user plan, integrations)
- Edge caching pour assets statiques

---

### 3. Monitoring & Alertes

**À implémenter:**
- Prometheus metrics par user
- Alertes si user dépasse rate limits
- Dashboard admin pour voir usage par user
- Logs structurés avec `user_id` dans chaque log

**Exemple metrics:**
```typescript
// Prometheus metrics
const userRequestCounter = new Counter({
  name: 'user_requests_total',
  help: 'Total requests per user',
  labelNames: ['user_id', 'endpoint', 'status']
});

const userQuotaGauge = new Gauge({
  name: 'user_quota_remaining',
  help: 'Remaining quota per user',
  labelNames: ['user_id', 'resource']
});
```

---

## 📊 Plan d'Implémentation

### Phase 3A: Rate Limiting & Quotas (1 semaine)
1. Ajouter `user_id` dans headers bridge
2. Implémenter rate limiting par user (Redis)
3. Activer quotas via migration 008
4. UI usage dashboard dans Cockpit

### Phase 3B: Fair Scheduling (1 semaine)
1. Migrer queue n8n vers Bull (Redis)
2. Implémenter round-robin par user
3. Tester avec load tests (10+ users simultanés)

### Phase 4A: Worker Pools (2 semaines)
1. Setup Kubernetes avec multiple pools
2. Router requests par plan (free/pro/enterprise)
3. Auto-scaling basé sur metrics

### Phase 4B: Monitoring (1 semaine)
1. Setup Prometheus + Grafana
2. Dashboard admin pour monitoring
3. Alertes Slack/Email si incidents

---

## 🎯 Priorités

**Maintenant (Phase 0-1):**
- ✅ Architecture actuelle fonctionne pour MVP
- Focus: Tester MCP servers + déployer bridge

**Court terme (Phase 2-3):**
- Rate limiting par user
- Quotas enforcement
- Fair scheduling

**Moyen terme (Phase 4):**
- Worker pools dédiés
- Auto-scaling
- Monitoring avancé

---

**Créé:** 2026-02-20
**Owner:** Azzeddine Zazai
**Status:** TODO pour Phase 3-4
