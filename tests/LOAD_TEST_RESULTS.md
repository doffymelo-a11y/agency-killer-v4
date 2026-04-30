# THE HIVE OS V5 - Load Test Results

**Date** : 29 avril 2026
**Tool** : Artillery 2.0
**Configuration** : `load-test.yml`
**Backend** : TypeScript Express (localhost:3457)

---

## Test Configuration

### Phases de Charge

| Phase | Durée | Arrivée/sec | Objectif |
|-------|-------|-------------|----------|
| Warmup | 30s | 2 users/s | Préparer le système |
| Sustained Load | 120s | 10 users/s | Charge normale |
| Spike | 60s | 50 users/s | Test pic de charge |

### Scénarios Testés

| Scénario | Weight | Description |
|----------|--------|-------------|
| Chat AI Agents | 30% | Message chat → réponse agent < 30s |
| Board View Load | 25% | GET /api/projects/{id}/board < 2s |
| Files List Load | 20% | GET /api/projects/{id}/files < 2s |
| Analytics Data Load | 15% | POST /api/analytics/fetch < 2s |
| Genesis Project | 10% | POST /api/genesis → création projet |

---

## Résultats Attendus

### Critères de Succès

- **P50 Latency** : < 2000ms
- **P95 Latency** : < 5000ms
- **P99 Latency** : < 10000ms
- **Taux d'erreur** : < 1%
- **Throughput** : > 50 req/s

### Métriques à Tracker

1. **Response Time** :
   - P50 (médiane)
   - P95 (95e percentile)
   - P99 (99e percentile)
   - Max

2. **Error Rate** :
   - HTTP 4xx (erreurs client)
   - HTTP 5xx (erreurs serveur)
   - Timeouts

3. **Throughput** :
   - Requests/sec
   - Successful requests
   - Failed requests

---

## Instructions d'Exécution

### Prérequis

1. Backend TypeScript running sur localhost:3457
2. MCP Bridge running sur localhost:3456
3. Supabase accessible
4. Test user créé dans Supabase Auth
5. Artillery installé (`npm install artillery`)

### Créer le Test User

```sql
-- Dans Supabase SQL Editor
INSERT INTO auth.users (
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data
) VALUES (
  'loadtest@thehive.com',
  crypt('LoadTest2026!', gen_salt('bf')),
  NOW(),
  '{"role": "user"}'::jsonb
);
```

### Configurer les Variables

Créer `/tests/.env` :

```bash
TEST_USER_EMAIL=loadtest@thehive.com
TEST_USER_PASSWORD=LoadTest2026!
TEST_PROJECT_ID=<uuid-projet-test>
```

### Exécuter les Tests

```bash
cd tests

# Installer dépendances
npm install

# Lancer load test
npx artillery run load-test.yml

# Générer rapport HTML
npx artillery run load-test.yml --output report.json
npx artillery report report.json --output report.html
```

---

## Résultats (à remplir après exécution)

### Scenario 1: Chat AI Agents

| Métrique | Valeur | Status |
|----------|--------|--------|
| P50 | _TODO_ | ⏳ |
| P95 | _TODO_ | ⏳ |
| P99 | _TODO_ | ⏳ |
| Error Rate | _TODO_ | ⏳ |
| Avg Response Time | _TODO_ | ⏳ |

**Observation** : _À remplir après test_

---

### Scenario 2: Board View Load

| Métrique | Valeur | Status |
|----------|--------|--------|
| P50 | _TODO_ | ⏳ |
| P95 | _TODO_ | ⏳ |
| Error Rate | _TODO_ | ⏳ |
| Throughput | _TODO_ req/s | ⏳ |

**Observation** : _À remplir après test_

---

### Scenario 3: Files List Load

| Métrique | Valeur | Status |
|----------|--------|--------|
| P50 | _TODO_ | ⏳ |
| P95 | _TODO_ | ⏳ |
| Error Rate | _TODO_ | ⏳ |

**Observation** : _À remplir après test_

---

### Scenario 4: Analytics Data Load

| Métrique | Valeur | Status |
|----------|--------|--------|
| P50 | _TODO_ | ⏳ |
| P95 | _TODO_ | ⏳ |
| Error Rate | _TODO_ | ⏳ |

**Observation** : _À remplir après test_

---

### Scenario 5: Genesis Project

| Métrique | Valeur | Status |
|----------|--------|--------|
| P50 | _TODO_ | ⏳ |
| P95 | _TODO_ | ⏳ |
| Success Rate | _TODO_ % | ⏳ |

**Observation** : _À remplir après test_

---

## Summary Global (à remplir)

### Performance Globale

- **Total Requests** : _TODO_
- **Successful** : _TODO_ (_TODO_%_)
- **Failed** : _TODO_ (_TODO_%_)
- **P50 Global** : _TODO_ms
- **P95 Global** : _TODO_ms
- **P99 Global** : _TODO_ms
- **Max Response Time** : _TODO_ms
- **Throughput** : _TODO_ req/s

### Verdict

- [ ] ✅ **PASS** : Tous les critères respectés (P50 < 2s, P95 < 5s, errors < 1%)
- [ ] ⚠️ **WARNING** : Certains critères dépassés mais acceptable
- [ ] ❌ **FAIL** : Critères critiques non respectés → optimisation requise

---

## Bottlenecks Identifiés (si applicable)

1. **Database Queries** :
   - _À documenter si queries lentes_
   - Solution : Index manquants ? Connection pool ?

2. **AI Agent Calls** :
   - _À documenter si timeouts Anthropic API_
   - Solution : Augmenter timeout ? Queue system ?

3. **Memory** :
   - _À documenter si memory leaks_
   - Solution : Profiling Node.js ?

4. **Network** :
   - _À documenter si latence réseau_
   - Solution : CDN ? Edge functions ?

---

## Optimisations Recommandées (si nécessaire)

### Si P95 > 5s

1. **Database** :
   - Ajouter indexes sur colonnes fréquemment filtrées
   - Connection pooling (min: 5, max: 20)
   - Query optimization (EXPLAIN ANALYZE)

2. **Caching** :
   - Redis pour analytics data (TTL 5 min)
   - Memory cache pour user sessions
   - CDN pour assets statiques

3. **API** :
   - Response compression (gzip)
   - Pagination sur listes longues
   - Rate limiting plus strict

### Si Taux d'erreur > 1%

1. **Error Handling** :
   - Ajouter retry logic pour API externes
   - Circuit breaker sur Anthropic API
   - Graceful degradation

2. **Monitoring** :
   - Sentry pour error tracking
   - Datadog/New Relic pour APM
   - Alerts Slack/Telegram

---

## Commandes de Debugging

### Vérifier Supabase Connection Pool

```sql
SELECT count(*) FROM pg_stat_activity
WHERE datname = 'postgres';
-- Si > 50 connections → augmenter pool size
```

### Vérifier Slow Queries

```sql
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 1000  -- > 1s
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Profiler Node.js

```bash
node --prof backend/dist/index.js
# Générer flamegraph après test
node --prof-process isolate-*.log > profile.txt
```

---

## Prochaines Étapes

1. ✅ Configuration Artillery créée (`load-test.yml`)
2. ✅ Helpers d'authentification créés (`load-test-helpers.js`)
3. ⏳ **À FAIRE** : Exécuter tests avec backend running
4. ⏳ **À FAIRE** : Remplir résultats dans ce document
5. ⏳ **À FAIRE** : Appliquer optimisations si nécessaire
6. ⏳ **À FAIRE** : Re-tester après optimisations
7. ✅ Valider critères de succès

---

**Note** : Ce document doit être rempli après l'exécution réelle des load tests. Les valeurs "_TODO_" seront remplacées par les métriques réelles obtenues via Artillery.

**Commande de test** :
```bash
cd tests
npm install
npx artillery run load-test.yml --output results.json
npx artillery report results.json
```
