# 🧪 MCP SERVERS - PLAN DE TESTS COMPLET

**Date:** 2026-02-20
**Objectif:** Tester tous les MCP servers avec le bridge HTTP avant déploiement Hostinger

---

## ✅ STATUS TESTS

| Agent | MCP Server | Tools | Status | Date Test |
|-------|------------|-------|--------|-----------|
| **MILO** | nano-banana-pro | 3 | ✅ PASSED | 19/02/2026 |
| **MILO** | veo3 | 5 | ✅ PASSED | 20/02/2026 |
| **MILO** | elevenlabs | 5 | ✅ PASSED | 20/02/2026 |
| **SORA** | google-ads | 7 | ✅ PASSED | 20/02/2026 |
| **SORA** | meta-ads | 7 | ✅ PASSED | 20/02/2026 |
| **SORA** | gtm | 7 | ✅ PASSED | 20/02/2026 |
| **SORA** | looker | 7 | ✅ PASSED | 20/02/2026 |
| **LUNA** | seo-audit | 5 | ✅ PASSED | 20/02/2026 |
| **LUNA** | keyword-research | 5 | ✅ PASSED | 20/02/2026 |
| **MARCUS** | meta-campaign-launcher* | 7 | ❌ NOT IMPLEMENTED | - |
| **MARCUS** | google-ads-launcher* | 7 | ❌ NOT IMPLEMENTED | - |
| **MARCUS** | budget-optimizer | 7 | ❌ NOT IMPLEMENTED | - |

**Note:** * = WRITE operations, tester avec précaution (budgets réels)

---

## 🎯 SORA (Analyst) - 4 MCP Servers (28 Tools)

### Prérequis
- Bridge running: `npm run dev` dans `/mcp-bridge/`
- Credentials Google Ads API configurés
- Credentials Meta Ads API configurés

### Test 1: Google Ads Manager (7 fonctions READ)

#### 1.1 List Available Tools
```bash
curl http://localhost:3456/api/google-ads/tools | jq
```

**Résultat attendu:**
```json
{
  "success": true,
  "server": "google-ads",
  "tools": [
    {"name": "get_accounts", "description": "..."},
    {"name": "get_campaigns", "description": "..."},
    {"name": "get_search_terms", "description": "..."},
    {"name": "get_keywords_quality_score", "description": "..."},
    {"name": "get_conversions", "description": "..."},
    {"name": "create_audience", "description": "..."},
    {"name": "get_performance_report", "description": "..."}
  ]
}
```

#### 1.2 Test get_accounts
```bash
curl -X POST http://localhost:3456/api/google-ads/call \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "get_accounts",
    "arguments": {}
  }'
```

**Validation:**
- ✅ Liste des comptes Google Ads retournée
- ✅ customer_id, name, currency présents

#### 1.3 Test get_campaigns
```bash
curl -X POST http://localhost:3456/api/google-ads/call \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "get_campaigns",
    "arguments": {
      "customer_id": "1234567890",
      "date_range": "LAST_7_DAYS"
    }
  }'
```

**Validation:**
- ✅ Campagnes retournées avec métriques (spend, revenue, ROAS, conversions)

---

### Test 2: Meta Ads Manager (7 fonctions READ)

#### 2.1 List Tools
```bash
curl http://localhost:3456/api/meta-ads/tools | jq
```

#### 2.2 Test get_ad_accounts
```bash
curl -X POST http://localhost:3456/api/meta-ads/call \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "get_ad_accounts",
    "arguments": {
      "user_id": "me"
    }
  }'
```

**Validation:**
- ✅ Comptes publicitaires Meta retournés

#### 2.3 Test get_campaigns
```bash
curl -X POST http://localhost:3456/api/meta-ads/call \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "get_campaigns",
    "arguments": {
      "ad_account_id": "act_123456789",
      "date_range": {"since": "2026-02-13", "until": "2026-02-20"}
    }
  }'
```

**Validation:**
- ✅ Campagnes Meta retournées avec insights

#### 2.4 Test check_learning_phase ⭐
```bash
curl -X POST http://localhost:3456/api/meta-ads/call \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "check_learning_phase",
    "arguments": {
      "ad_set_id": "123456789"
    }
  }'
```

**Validation:**
- ✅ Learning Phase status retourné (ACTIVE, EXITED)
- ✅ Progress, conversions_needed présents

---

### Test 3: GTM Manager (7 fonctions SETUP)

#### 3.1 List Tools
```bash
curl http://localhost:3456/api/gtm/tools | jq
```

#### 3.2 Test list_containers
```bash
curl -X POST http://localhost:3456/api/gtm/call \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "list_containers",
    "arguments": {
      "account_id": "accounts/123456"
    }
  }'
```

**Validation:**
- ✅ Conteneurs GTM listés

#### 3.3 Test list_tags
```bash
curl -X POST http://localhost:3456/api/gtm/call \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "list_tags",
    "arguments": {
      "container_id": "accounts/123/containers/456"
    }
  }'
```

**Validation:**
- ✅ Tags GTM retournés

---

### Test 4: Looker Manager (7 fonctions REPORTING)

#### 4.1 List Tools
```bash
curl http://localhost:3456/api/looker/tools | jq
```

#### 4.2 Test create_report
```bash
curl -X POST http://localhost:3456/api/looker/call \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "create_report",
    "arguments": {
      "report_name": "Test Dashboard - The Hive",
      "data_sources": ["GA4", "Google Ads"]
    }
  }'
```

**Validation:**
- ✅ Rapport Looker créé
- ✅ report_id, edit_url retournés

---

## 🎯 LUNA (Strategist) - 2 MCP Servers (14 Tools)

### Test 1: SEO Audit Tool (7 fonctions)

#### 1.1 List Tools
```bash
curl http://localhost:3456/api/seo-audit/tools | jq
```

**Résultat attendu:**
```json
{
  "success": true,
  "server": "seo-audit",
  "tools": [
    {"name": "audit_technical", "description": "..."},
    {"name": "audit_on_page", "description": "..."},
    {"name": "analyze_mobile_friendly", "description": "..."},
    {"name": "check_page_speed", "description": "..."},
    {"name": "analyze_meta_tags", "description": "..."},
    {"name": "check_schema_markup", "description": "..."},
    {"name": "generate_seo_report", "description": "..."}
  ]
}
```

#### 1.2 Test audit_technical
```bash
curl -X POST http://localhost:3456/api/seo-audit/call \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "audit_technical",
    "arguments": {
      "url": "https://example.com"
    }
  }'
```

**Validation:**
- ✅ Audit technique SEO retourné
- ✅ Erreurs, warnings, recommandations présents

#### 1.3 Test check_page_speed
```bash
curl -X POST http://localhost:3456/api/seo-audit/call \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "check_page_speed",
    "arguments": {
      "url": "https://example.com",
      "device": "mobile"
    }
  }'
```

**Validation:**
- ✅ Score PageSpeed retourné
- ✅ Métriques Core Web Vitals présentes

---

### Test 2: Keyword Research Tool (7 fonctions)

#### 2.1 List Tools
```bash
curl http://localhost:3456/api/keyword-research/tools | jq
```

#### 2.2 Test search_keywords
```bash
curl -X POST http://localhost:3456/api/keyword-research/call \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "search_keywords",
    "arguments": {
      "seed_keyword": "marketing automation",
      "language": "en",
      "location": "US"
    }
  }'
```

**Validation:**
- ✅ Keywords retournés avec search_volume, competition, CPC

#### 2.3 Test analyze_serp
```bash
curl -X POST http://localhost:3456/api/keyword-research/call \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "analyze_serp",
    "arguments": {
      "keyword": "best crm software",
      "location": "US"
    }
  }'
```

**Validation:**
- ✅ SERP analysis retournée
- ✅ Top 10 résultats avec domain_authority, backlinks

---

## 💰 MARCUS (Trader) - 3 MCP Servers (21 Tools WRITE)

**⚠️ ATTENTION: CES TOOLS DÉPENSENT DE L'ARGENT RÉEL**

### Prérequis
- Tester UNIQUEMENT avec `status: "PAUSED"`
- Budgets de test < 10€/jour
- Approval workflow activé (migration 009)

### Test 1: Budget Optimizer (7 fonctions - SAFE)

#### 1.1 List Tools
```bash
curl http://localhost:3456/api/budget-optimizer/tools | jq
```

#### 1.2 Test analyze_campaign_performance
```bash
curl -X POST http://localhost:3456/api/budget-optimizer/call \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "analyze_campaign_performance",
    "arguments": {
      "campaigns": [
        {"id": "c1", "spend": 1000, "revenue": 5000, "conversions": 50, "clicks": 1200, "impressions": 50000, "daily_budget": 50}
      ],
      "optimization_goal": "ROAS",
      "target_roas": 4.0
    }
  }'
```

**Validation:**
- ✅ Performance scores retournés (0-100)
- ✅ Grades (A, B, C, D) attribués
- ✅ Status (WINNING, TESTING, LOSING)

#### 1.3 Test learning_phase_protection ⭐
```bash
curl -X POST http://localhost:3456/api/budget-optimizer/call \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "learning_phase_protection",
    "arguments": {
      "campaign_id": "camp_1",
      "current_budget": 50,
      "proposed_budget": 75,
      "learning_phase_status": "ACTIVE",
      "platform": "meta"
    }
  }'
```

**Validation:**
- ✅ Risk level retourné (LOW, MEDIUM, HIGH)
- ✅ will_reset boolean
- ✅ safe_to_proceed boolean

---

### Test 2: Meta Campaign Launcher (7 fonctions - DANGER ⚠️)

**⚠️ TESTS EN MODE PAUSED UNIQUEMENT**

#### 2.1 List Tools
```bash
curl http://localhost:3456/api/meta-campaign-launcher/tools | jq
```

#### 2.2 Test create_campaign (MODE TEST)
```bash
curl -X POST http://localhost:3456/api/meta-campaign-launcher/call \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "create_campaign",
    "arguments": {
      "ad_account_id": "act_TEST",
      "name": "[TEST] Campaign Bridge Test",
      "objective": "OUTCOME_TRAFFIC",
      "daily_budget": 500000,
      "status": "PAUSED"
    }
  }'
```

**Validation:**
- ✅ Campaign créée en PAUSED
- ✅ campaign_id retourné
- ✅ JAMAIS ACTIVER sans approval

---

### Test 3: Google Ads Launcher (7 fonctions - DANGER ⚠️)

**⚠️ TESTS EN MODE PAUSED UNIQUEMENT**

#### 3.1 List Tools
```bash
curl http://localhost:3456/api/google-ads-launcher/tools | jq
```

#### 3.2 Test create_search_campaign (MODE TEST)
```bash
curl -X POST http://localhost:3456/api/google-ads-launcher/call \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "create_search_campaign",
    "arguments": {
      "customer_id": "1234567890",
      "name": "[TEST] Bridge Test Campaign",
      "daily_budget_micros": 5000000,
      "bidding_strategy": "TARGET_CPA",
      "target_cpa": 25000000,
      "geo_target_constants": ["1006"],
      "language_constants": ["1002"],
      "status": "PAUSED"
    }
  }'
```

**Validation:**
- ✅ Campaign créée en PAUSED
- ✅ campaign_id retourné
- ✅ JAMAIS ACTIVER sans approval

---

## 📊 CHECKLIST DE VALIDATION

### Pour chaque MCP Server testé:

- [ ] Bridge démarre sans erreur
- [ ] Server apparaît dans `/api/servers`
- [ ] `/api/:serverName/tools` retourne tous les tools
- [ ] Test d'au moins 2 tools réussi
- [ ] Pas d'erreur credentials
- [ ] Pas de timeout
- [ ] Logs bridge propres

### Critères de succès:

✅ **ALL GREEN** → Prêt pour déploiement Hostinger
⚠️ **YELLOW** → Corrections mineures nécessaires
❌ **RED** → Blocker - ne pas déployer

---

## 🚀 EXÉCUTION DES TESTS

### Étape 1: Démarrer le bridge
```bash
cd /Users/azzedinezazai/Documents/Agency-Killer-V4/mcp-bridge
npm run dev
```

### Étape 2: Tests SORA (READ-ONLY - SAFE)
```bash
# Copier-coller les commandes curl ci-dessus
# Documenter résultats dans ce fichier
```

### Étape 3: Tests LUNA (READ-ONLY - SAFE)
```bash
# Copier-coller les commandes curl ci-dessus
```

### Étape 4: Tests MARCUS (WRITE - DANGER)
```bash
# ATTENTION: BUDGETS RÉELS
# Tester UNIQUEMENT Budget Optimizer d'abord
# Meta/Google Ads en MODE PAUSED seulement
```

### Étape 5: Documentation résultats
- ✅ Marquer chaque test comme PASSED/FAILED
- 📸 Screenshots des réponses curl
- 📝 Noter tout problème rencontré

---

## 📝 TEMPLATE RÉSULTATS

```markdown
### Test: [SERVER_NAME] - [TOOL_NAME]
**Date:** 2026-02-XX
**Commande:**
\`\`\`bash
[curl command]
\`\`\`

**Résultat:**
\`\`\`json
[response]
\`\`\`

**Status:** ✅ PASSED / ❌ FAILED
**Notes:** [any issues]
```

---

**Créé:** 2026-02-20
**Owner:** Azzeddine Zazai
**Next:** Exécuter tests SORA, LUNA, MARCUS
