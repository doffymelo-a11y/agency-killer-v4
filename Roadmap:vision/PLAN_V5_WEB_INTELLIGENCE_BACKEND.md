# Plan Stratégique : Hive OS V5 — Web Intelligence + Migration Backend

**Date :** 2026-03-01
**Auteur :** Analyse stratégique Claude Opus (session de planification avec le fondateur)
**Destinataire :** Claude Code (Terminal CLI) — tu es le dev senior qui implémente ce plan
**PRD de référence :** `/Roadmap:vision/PRD_THE_HIVE_OS_V4.4.md`

---

## 0. DÉCISIONS STRATÉGIQUES — CONTEXTE COMPLET

### Décision 1 : Web Intelligence (inspiré OpenClaw)

**Problème identifié :** Hive OS a 13 MCP servers et 63 fonctions API, mais ZÉRO capacité de web browsing/crawling. C'est un angle mort critique pour un "Agency Killer" marketing :
- Impossible d'analyser un site concurrent
- Impossible d'auditer une landing page client
- Impossible de vérifier qu'un pixel de tracking est installé
- Impossible de monitorer les changements sur un site web
- Impossible d'extraire des données d'un site sans API

**Étude réalisée : OpenClaw**
OpenClaw est un agent IA open-source (MIT license, 200K+ GitHub stars) créé par Peter Steinberger. Il utilise Playwright/CDP pour contrôler un navigateur, combiné avec des LLMs pour "comprendre" les pages web.

**Pourquoi ne PAS utiliser OpenClaw directement :**
1. **Sécurité** : 800+ skills malveillants détectés sur ClawHub, exploit RCE découvert, 42,000 instances exposées
2. **Pas multi-tenant** : OpenClaw est un agent PERSONNEL (WhatsApp/Telegram), pas un backend SaaS
3. **Incertitude** : Le créateur a rejoint OpenAI en février 2026
4. **Overhead** : 80% du code d'OpenClaw (Gateway, channels, ClawHub) est inutile pour nous

**Décision prise : Approche hybride**
- Réutiliser les PATTERNS techniques d'OpenClaw (MIT-licensed) : DOM snapshots avec ref labels (`page.accessibility.snapshot()`), vision mode (screenshot → LLM), Playwright/CDP
- Construire un MCP server custom "Web Intelligence" intégré nativement dans notre architecture MCP Bridge
- Spécialiser pour le marketing numérique (audit landing page, vérification pixels, analyse concurrentielle)
- Résultat : même puissance de browsing qu'OpenClaw, PLUS l'intelligence des 4 agents marketing

**Supériorité sur OpenClaw :**
| Aspect | OpenClaw | Notre Web Intelligence |
|--------|----------|------------------------|
| Intelligence métier | Générique | 4 experts marketing spécialisés |
| Mémoire | Fichiers Markdown locaux | Supabase collective memory |
| Multi-tenant | Non (agent personnel) | Oui (conçu pour 100 clients) |
| Sécurité | 800+ skills malveillants | Contrôle total, code audité |
| Intégration | Standalone | Natif dans l'écosystème MCP |

---

### Décision 2 : Migration Backend n8n → TypeScript

**Problème identifié :** n8n est le backend actuel de Hive OS (orchestration des 4 agents IA, routing, memory). Une analyse objective a révélé que n8n ne tiendra PAS pour 100 clients SaaS :

**Benchmarks n8n :**
- Single mode (setup actuel) : plafonne à ~100 users virtuels, latence 12s à 200 users, 1% failure rate
- Queue mode (Redis + workers) : jusqu'à 162 req/s — MAIS chaque appel IA bloque un worker pendant 30-120 secondes

**5 problèmes structurels de n8n pour un SaaS :**
1. **Pas de multi-tenancy** : Aucun concept de "tenant". Un crash affecte TOUS les clients
2. **Appels IA long-running** : 30-120s par appel saturent les workers. 10 clients simultanés = 1 worker saturé
3. **Debugging impossible** : 20+ workflows × 100 clients = cauchemar de logs
4. **Pas de tests automatisés** : Les workflows sont des JSON visuels, pas du code testable
5. **Coût infrastructure** : Queue mode nécessite PostgreSQL + Redis + VPS puissant

**3 options évaluées :**
| Option | Capacité | Effort | Verdict |
|--------|----------|--------|---------|
| A : n8n + Queue Mode | ~20 clients | 2-3 jours | Court terme seulement |
| B : API Gateway + n8n derrière | ~50 clients | 1-2 semaines | Bricolage, 2 systèmes |
| **C : Backend TS custom** | **100+ clients** | **3-4 semaines** | **La vraie réponse** |

**Décision prise : Option C — Backend TypeScript custom**

**Ce qui change :**
- Les workflows n8n → fonctions TypeScript typées et testables
- Les webhooks → endpoints API REST propres
- Le routing visuel → code avec `if/switch` (plus rapide, plus fiable)

**Ce qui NE change PAS (important !) :**
- Les 13 MCP servers (déjà du TypeScript propre) → restent identiques
- Le MCP Bridge Express.js → reste identique
- Supabase (DB, auth, realtime) → reste identique
- Le frontend React → change juste l'URL d'API
- La logique métier des agents → portée de JSON workflow vers code TS

**Architecture cible :**

```
Frontend (React — inchangé)
  ↓
API Backend (Express/Fastify TypeScript) ← NOUVEAU
  ├── Auth (Supabase Auth) + Rate Limiting + Validation
  ├── Orchestrator (routing agent, remplace PM n8n)
  └── Agent Functions (luna, sora, marcus, milo)
  ↓
MCP Bridge (Express.js — inchangé)
  ↓
14 MCP Servers (13 existants + web-intelligence) — inchangés
  ↓
Supabase (DB + Auth + Realtime — inchangé)
```

**Avantage clé de l'ordre :** Le MCP server Web Intelligence est backend-agnostic (fonctionne via le Bridge HTTP). On le construit AVANT la migration backend — il marchera avec n8n puis automatiquement avec le backend TS.

---

## CHANTIER 1 — Web Intelligence MCP Server (Semaines 1-2)

### Phase 1.1 — Skeleton + Outils Cheerio (Jours 1-3)

**Créer :** `/mcp-servers/web-intelligence-server/`

```
web-intelligence-server/
  package.json         # playwright, cheerio, axios, @mozilla/readability, cloudinary
  tsconfig.json        # ES2022, Node16 (copier pattern seo-audit-server)
  .env.example
  src/
    index.ts           # MCP server entry — ListTools + CallTool handlers
    tools/
      web-scrape.ts               # Cheerio — extraction contenu structuré (titre, meta, headings, liens, images)
      web-extract-text.ts         # Readability — texte propre mode article
      competitor-analysis.ts      # Cheerio — tech stack, meta SEO, social links, tracking pixels
      social-meta-check.ts        # Cheerio — Open Graph, Twitter Cards
      link-checker.ts             # Axios — vérification liens (404, redirects)
      web-screenshot.ts           # Playwright — screenshot multi-device
      landing-page-audit.ts       # Playwright — audit CTA, forms, mobile, performance, above-fold
      ad-verification.ts          # Playwright — vérification pixels via network interception
    lib/
      browser-pool.ts    # Pool Playwright (max 3 Chromium, timeout 30s, memory max 512MB, idle 5min)
      dom-snapshot.ts    # Accessibility tree + ref labels (pattern OpenClaw : page.accessibility.snapshot())
      url-validator.ts   # Blocklist domaines financiers/gov + SSRF protection (rejeter IPs privées)
      cloudinary.ts      # Upload screenshots vers Cloudinary CDN
      sanitizer.ts       # Nettoyage contenu extrait (strip scripts, PII, tronquer à 50KB)
    types.ts
```

**Dépendances :**
- `@modelcontextprotocol/sdk` (pattern existant dans tous les MCP servers)
- `playwright` (browser automation — même lib qu'OpenClaw utilise)
- `axios` + `cheerio` (scraping léger — même pattern que le seo-audit-server existant)
- `@mozilla/readability` + `jsdom` (extraction texte article)
- `cloudinary` (upload screenshots)

**Enregistrer dans Bridge :** modifier `/mcp-bridge/src/config.ts` — ajouter entrée `web-intelligence`

**Pattern de référence à copier :** `/mcp-servers/seo-audit-server/src/index.ts`

### Phase 1.2 — Outils Playwright (Jours 4-6)

**`browser-pool.ts`** (inspiré architecture OpenClaw Browser) :
- Singleton pool avec max 3 instances Chromium concurrentes
- `acquirePage()` → retourne une `Page` Playwright + callback `release()`
- Timeout hard 30s par opération page
- Memory monitoring : kill browser si > 512MB
- Idle timeout : ferme les browsers inactifs après 5min
- Browser contexts pour isolation entre requêtes concurrentes

**`dom-snapshot.ts`** (pattern OpenClaw) :
- `page.accessibility.snapshot()` pour obtenir l'arbre d'accessibilité
- Ajout de ref labels (`ref=e12`) pour que le LLM puisse cibler des éléments
- Mode compact pour limiter la taille du contexte

**Outils Playwright :**

| Outil | Fonction | Agent principal |
|-------|----------|----------------|
| `web_screenshot` | Screenshot full-page ou viewport, presets device (desktop 1280x800, mobile iPhone 375x812, tablet 768x1024), upload Cloudinary | MILO, MARCUS |
| `landing_page_audit` | Score global 0-100 + checklist : CTA visible above fold, formulaire présent, mobile responsive, load time < 3s, trust signals (SSL, testimonials) | MARCUS, LUNA |
| `ad_verification` | Intercepte les requêtes réseau pour détecter : Meta Pixel, GA4, GTM, Google Ads tag, TikTok Pixel, LinkedIn Insight. Screenshot preuve | MARCUS, SORA |
| `link_checker` | Vérifie tous les liens d'une page en parallèle (status code, redirects, temps de réponse) | LUNA, SORA |

### Phase 1.3 — Frontend UI Components (Jours 7-8)

**Modifier :** `/cockpit/src/types/index.ts`
- Ajouter à `UIComponentType` : `WEB_SCREENSHOT`, `COMPETITOR_REPORT`, `LANDING_PAGE_AUDIT`, `PIXEL_VERIFICATION`
- Ajouter interfaces : `CompetitorAnalysis`, `LandingPageAuditResult`, `PixelVerificationResult`

**Modifier :** `/cockpit/src/components/chat/UIComponentRenderer.tsx`
- `WEB_SCREENSHOT` : Image avec badge device type + bouton download + lien open-in-new-tab
- `COMPETITOR_REPORT` : Card avec tags tech stack + résumé SEO + social links + pixels détectés
- `LANDING_PAGE_AUDIT` : Checklist pass/fail/warning avec score global coloré + screenshot + recommandations
- `PIXEL_VERIFICATION` : Grille de pixels avec indicateur vert checkmark / rouge X par pixel

### Phase 1.4 — Intégration n8n temporaire (Jours 9-10)

Intégrer via les workflows n8n existants (temporaire, sera remplacé au Chantier 2) :
- Ajouter HTTP Request nodes : `POST http://localhost:3456/api/web-intelligence/call`
- Mettre à jour les system prompts de l'Orchestrateur pour router les intents web intelligence :
  - "analyse le site X" → LUNA + `competitor_analysis`
  - "vérifie le tracking sur X" → SORA + `ad_verification`
  - "audite cette landing page" → MARCUS + `landing_page_audit`
  - "screenshot de X" → MILO + `web_screenshot`

---

## CHANTIER 2 — Migration Backend n8n → TypeScript (Semaines 3-6)

### Phase 2.1 — API Gateway (Jours 11-15)

**Créer :** `/backend/` (nouveau dossier racine)

```
backend/
  package.json
  tsconfig.json
  .env
  src/
    index.ts           # Express/Fastify entry point
    routes/
      chat.routes.ts      # POST /api/chat — point d'entrée principal (remplace PM webhook)
      genesis.routes.ts   # POST /api/genesis — création projet
      analytics.routes.ts # POST /api/analytics — fetch données
      files.routes.ts     # POST /api/files — recherche fichiers
    middleware/
      auth.middleware.ts        # Vérification token Supabase Auth sur chaque requête
      rate-limit.middleware.ts  # Rate limiting par user_id + endpoint (tiers free/pro/enterprise)
      validation.middleware.ts  # Zod schema validation sur chaque body de requête
      error.middleware.ts       # Error handling centralisé (pas de stack traces en prod, pas de credentials leakées)
    services/
      supabase.service.ts    # Client Supabase typé (DB queries + Auth + Realtime subscriptions)
      mcp-bridge.service.ts  # Client HTTP vers MCP Bridge — wrapper typé autour des calls MCP
      memory.service.ts      # Lecture/écriture dans project_memory (Supabase)
      claude.service.ts      # Appels directs API Claude (Anthropic SDK) / OpenAI
    agents/
      orchestrator.ts    # Routing logic : analyse l'intent → choisit l'agent → injecte le contexte
      luna.agent.ts      # Luna execute() : system prompt + Claude + MCP tools (SEO, keywords, web-intel)
      sora.agent.ts      # Sora execute() : system prompt + Claude + MCP tools (GA4, GTM, ads analytics)
      marcus.agent.ts    # Marcus execute() : system prompt + Claude + MCP tools (ad launchers, budget)
      milo.agent.ts      # Milo execute() : system prompt + Claude + MCP tools (image gen, video, audio)
    shared/
      context-builder.ts       # Construit SharedProjectContext (même format JSON que le n8n actuel)
      response-parser.ts       # Parse réponse LLM → { message, ui_components[], write_back[], memory_contribution }
      memory-injector.ts       # Lit les 20 dernières entrées project_memory, filtre par agent cible, construit memory_context
      write-back.processor.ts  # Exécute les write-back commands (UPDATE_TASK_STATUS, SET_DELIVERABLE, ADD_FILE, etc.)
    types/
      api.types.ts     # Types requêtes/réponses API
      agent.types.ts   # AgentContext, AgentResponse, MemoryContribution, WriteBackCommand
    config/
      agents.config.ts      # System prompts complets, couleurs, MCP tools par agent
      rate-limits.config.ts # Limites par tier : free (10/min), pro (60/min), enterprise (300/min)
```

### Phase 2.2 — Porter le PM/Orchestrator (Jours 16-18)

**Ce que le PM + Orchestrator n8n font (à traduire en TypeScript) :**
1. Recevoir la requête frontend (action, chatInput, shared_memory, session_id)
2. Lire `project_memory` pour les 20 dernières entrées du projet
3. Filtrer les recommendations pertinentes pour l'agent cible
4. Construire `memory_context` JSON
5. Router vers l'agent approprié selon l'intent du message
6. Retourner la réponse + exécuter les write-back commands

**Fichiers source n8n à lire pour extraire la logique :**
- `/agents/CURRENT_pm-mcp/` — PM Central Brain workflow
- `/agents/CURRENT_orchestrator-mcp/` — Orchestrator workflow

**Fichiers cibles TypeScript :**
- `agents/orchestrator.ts` — routing logic
- `agents/shared/context-builder.ts` — construction contexte
- `agents/shared/memory-injector.ts` — injection mémoire

### Phase 2.3 — Porter les 4 Agents (Jours 19-25)

**Pattern commun à chaque agent (identique au workflow n8n, mais en code) :**
```typescript
async function execute(context: AgentContext): Promise<AgentResponse> {
  // 1. Construire le system prompt avec le contexte projet + mémoire
  const systemPrompt = buildSystemPrompt(AGENT_CONFIG, context);

  // 2. Appeler Claude avec le message utilisateur
  const llmResponse = await claude.chat(systemPrompt, context.userMessage, context.images);

  // 3. Si le LLM demande un outil MCP, l'exécuter via le Bridge
  if (llmResponse.toolCalls) {
    const toolResults = await executeMCPTools(llmResponse.toolCalls);
    // Re-appeler Claude avec les résultats
  }

  // 4. Parser la réponse finale
  return parseAgentResponse(llmResponse);
}
```

**Ordre de migration :** Luna → Sora → Marcus → Milo (du plus simple au plus complexe)

**L'appel MCP Bridge reste strictement identique :**
```typescript
// Même chose qu'un HTTP Request node n8n
await mcpBridge.call('web-intelligence', 'competitor_analysis', { url: '...' });
await mcpBridge.call('seo-audit', 'full_seo_audit', { url: '...' });
await mcpBridge.call('google-ads-launcher', 'create_campaign', { ... });
```

### Phase 2.4 — Connecter le Frontend (Jours 26-28)

**Modifier :** `/cockpit/src/services/n8n.ts`
- Changer `PM_WEBHOOK_URL` → `BACKEND_API_URL` (variable .env)
- Les payloads restent le MÊME format (genesis, task_launch, quick_action, write_back)
- Le frontend ne voit quasiment aucune différence

**Alternative plus propre :** créer `/cockpit/src/services/api.ts` comme nouveau service et migrer progressivement les appels

### Phase 2.5 — Tests + Cutover (Jours 29-30)

- Faire tourner n8n ET le backend TS en parallèle
- Tester chaque agent via le backend TS — comparer les résultats avec n8n
- Vérifier write-back commands, memory read/write, auth, rate limiting
- Couper n8n quand tout est validé

---

## Fichiers critiques

### À créer

| Fichier | Description |
|---------|-------------|
| `/mcp-servers/web-intelligence-server/` | MCP server complet (8 outils web browsing) |
| `/backend/` | Backend TypeScript complet (API + 4 agents + orchestrator) |

### À modifier

| Fichier | Modification |
|---------|--------------|
| `/mcp-bridge/src/config.ts` | Ajouter entrée web-intelligence dans mcpServers |
| `/cockpit/src/types/index.ts` | Ajouter 4 types UI web intelligence + interfaces résultats |
| `/cockpit/src/components/chat/UIComponentRenderer.tsx` | Ajouter 4 nouveaux renderers |
| `/cockpit/src/services/n8n.ts` (ou nouveau api.ts) | Pointer vers le backend TS au lieu du webhook n8n |

### Référence (lecture seule — ne pas modifier)

| Fichier | Pourquoi le lire |
|---------|------------------|
| `/mcp-servers/seo-audit-server/src/index.ts` | Pattern MCP server à reproduire |
| `/mcp-bridge/src/config.ts` | Pattern d'enregistrement d'un MCP server |
| `/mcp-bridge/src/mcpClient.ts` | Comprendre la connexion stdio Bridge → Server |
| `/cockpit/src/services/n8n.ts` | Payloads actuels (format à garder identique) |
| `/cockpit/src/store/useHiveStore.ts` | Write-back logic + processWriteBackCommands() |
| Workflows n8n dans `/agents/CURRENT_*/` | System prompts + routing logic à extraire et porter |

---

## Vérification

### Chantier 1 (Web Intelligence)
- `curl http://localhost:3456/api/web-intelligence/tools` → 8 outils listés
- `curl -X POST .../call -d '{"tool":"web_scrape","arguments":{"url":"https://example.com"}}'` → JSON structuré
- Performance : screenshot < 10s, scraping < 5s, audit < 15s
- UI components s'affichent correctement dans le chat
- Sécurité : URL validator rejette les IPs privées, domaines bloqués, protocoles non-HTTP

### Chantier 2 (Backend TS)
- `POST /api/chat` avec message Luna → réponse identique à n8n
- Les 4 agents fonctionnent correctement via le backend TS
- Write-back commands s'exécutent (UPDATE_TASK_STATUS, SET_DELIVERABLE, etc.)
- Memory read/write fonctionne (project_memory)
- Auth Supabase bloque les requêtes non-authentifiées
- Rate limiting bloque le spam
- `npx tsc --noEmit` → 0 erreur TypeScript
- Load test : 10 requêtes simultanées sans échec

---

## Timeline résumée

| Semaine | Chantier | Livrable |
|---------|----------|----------|
| 1-2 | Web Intelligence MCP | 8 outils web browsing IA + 4 UI components |
| 3 | API Gateway + Orchestrator TS | Endpoints API + routing agent + auth + rate limit |
| 4 | Migration agents Luna + Sora | 2 agents fonctionnels en TypeScript |
| 5 | Migration agents Marcus + Milo | 4 agents fonctionnels en TypeScript |
| 6 | Frontend reconnexion + tests | Frontend pointe vers backend TS, n8n désactivé |

---

## Impact business

- **Semaine 2 :** Demo "wow" possible — auditer le site d'un prospect en live pendant un call commercial
- **Semaine 6 :** Architecture production-ready pour 100 clients SaaS
- **Différenciateur unique :** seul outil au monde combinant browsing IA + 4 agents marketing spécialisés + mémoire collective
