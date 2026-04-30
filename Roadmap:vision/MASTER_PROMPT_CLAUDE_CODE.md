# MASTER PROMPT — A copier dans Claude Code Terminal

**Usage :** Copie le prompt de la PHASE que tu veux executer dans Claude Code terminal.
**Ordre obligatoire :** Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5

---

## PHASE 1 : SECURITE CRITIQUE (Copier ce bloc en entier)

```
Tu es le dev senior de The Hive OS, un ERP Marketing Autonome avec 5 agents IA. 

CONTEXTE CRITIQUE : Un audit securite complet a revele 33 vulnerabilites dont 13 CRITIQUES. ZERO n'a ete corrigee. Tu dois corriger les 11 failles les plus dangereuses MAINTENANT.

REFERENCES A LIRE EN PREMIER :
- /Roadmap:vision/RE_AUDIT_SECURITE_27_AVRIL_2026.md (audit complet)
- /Roadmap:vision/AUDIT_SECURITE_COMPLET.md (premier audit)

LES 11 CORRECTIONS A FAIRE (dans cet ordre) :

1. GITIGNORE ET SECRETS :
   - Verifie que .env est dans le .gitignore de backend/, cockpit/, mcp-bridge/ et chaque mcp-server
   - Cree des .env.example pour chaque sous-projet avec des valeurs placeholder (JAMAIS les vraies valeurs)
   - Cherche dans TOUS les fichiers .ts/.tsx/.js les patterns : sk-ant, sk-proj, eyJhbGci, Nejisasuke, FOUNDER_USER_ID hardcode, et remplace par des references process.env ou import.meta.env

2. AUTH MIDDLEWARE — Lis CHAQUE fichier dans /backend/src/routes/ :
   - chat.routes.ts : decommenter authMiddleware, supprimer le fallback 'test-user'
   - cms.routes.ts : decommenter authMiddleware sur /execute, /rollback, /pending, supprimer 'test-user'
   - genesis.routes.ts : decommenter authMiddleware si commente
   - phase-transition.routes.ts : AJOUTER authMiddleware (n'a jamais ete implemente — pas juste commente)
   - task-explainer.routes.ts : AJOUTER authMiddleware + rate limiting
   - analytics.routes.ts : AJOUTER authMiddleware
   - files.routes.ts : verifier que authMiddleware est actif
   - telegram.routes.ts : supprimer le FOUNDER_USER_ID hardcode ('96fac17b-ac0c-418f-9c11-516fcdce3b8c'), implementer un vrai systeme de liaison compte
   - admin.routes.ts : verifier que authMiddleware + checkAdminRole sont actifs
   Pour CHAQUE route : si userId est manquant apres l'auth, retourner 401 (pas de fallback)

3. VERIFICATION OWNERSHIP PROJET :
   - Dans /backend/src/agents/agent-executor.ts : AVANT d'executer un agent, verifier que userId est proprietaire du project_id via Supabase
   - Dans /backend/src/shared/write-back.processor.ts : AVANT chaque write-back command, verifier ownership
   - Pattern : SELECT id FROM projects WHERE id = project_id AND user_id = userId

4. XSS FIX :
   - Lis /cockpit/src/components/chat/UIComponentRenderer.tsx EN ENTIER
   - Trouve CHAQUE occurrence de dangerouslySetInnerHTML
   - Ajoute DOMPurify.sanitize() sur CHAQUE une (DOMPurify est deja installe)
   - Dans parseMarkdownToHTML() : sanitiser la sortie avec DOMPurify APRES les transformations regex
   - Dans les templates PDF (ReportComponent, AnalyticsDashboardComponent) : echapper le contenu dans les template literals avec une fonction escapeHtml()
   - Bloquer le protocole javascript: dans les liens markdown
   - Cherche dans TOUT cockpit/src/ d'autres occurrences de dangerouslySetInnerHTML et protege-les

5. MCP BRIDGE CORS :
   - Lis /mcp-bridge/src/index.ts
   - Remplace app.use(cors()) par app.use(cors({ origin: 'http://localhost:3457' })) — restreindre au backend uniquement
   - Le MCP Bridge ne doit JAMAIS etre accessible depuis le navigateur directement

APRES CHAQUE CORRECTION, VERIFIE :
- cd backend && npx tsc --noEmit
- cd cockpit && npx tsc --noEmit && npm run build
- grep -r "// authMiddleware\|test-user\|FOUNDER_USER_ID" --include="*.ts" backend/src/
- grep -r "dangerouslySetInnerHTML" --include="*.tsx" cockpit/src/ | grep -v "DOMPurify"

NE FAIS AUCUNE AUTRE MODIFICATION. Focus uniquement sur la securite.
```

---

## PHASE 2 : SECURITE AVANCEE (Copier apres Phase 1)

```
Suite de la Phase 1 securite. Les corrections critiques sont faites. Maintenant les corrections de priorite haute.

REFERENCES :
- /Roadmap:vision/RE_AUDIT_SECURITE_27_AVRIL_2026.md (Phase 2 du plan)
- /backend/src/middleware/ (tous les middleware)
- /mcp-servers/web-intelligence-server/src/lib/url-validator.ts

8 CORRECTIONS A FAIRE :

1. CSRF PROTECTION :
   - Lis /backend/src/index.ts
   - Ajoute une verification Origin header sur les requetes POST/PUT/DELETE
   - Verifie que l'origin match ALLOWED_ORIGINS (env var)
   - Alternative : double-submit cookie pattern

2. UPLOAD VALIDATION :
   - /cockpit/src/components/chat/ChatInput.tsx : ajouter limite 5MB + verifier les premiers bytes du fichier (magic numbers PNG: 89504E47, JPEG: FFD8FF)
   - /mcp-servers/web-intelligence-server/src/lib/cloudinary.ts : limite buffer 10MB + sanitiser filename avec path.basename() + regex [^a-zA-Z0-9._-]

3. SSRF IPv4-MAPPED IPv6 :
   - /mcp-servers/web-intelligence-server/src/lib/url-validator.ts : ajouter le blocage de ::ffff:127.0.0.1 et ::ffff:10.x.x.x et toutes les variantes IPv4-mapped

4. HEADERS SECURITE :
   - /backend/src/index.ts : configurer Helmet avec CSP stricte, Referrer-Policy: strict-origin-when-cross-origin, Permissions-Policy: camera=(), microphone=()

5. ERROR MASKING :
   - /backend/src/middleware/error.middleware.ts : en production, retourner UNIQUEMENT { success: false, error: { message: "Internal server error", code: "INTERNAL_ERROR" } }. JAMAIS de stack trace ni de details.

6. WRITE-BACK VALIDATION :
   - /backend/src/shared/write-back.processor.ts : ajouter parametre userId, verifier ownership, limiter a 50 commandes par requete, whitelist des types autorises

7. TELEGRAM INPUT SANITIZATION :
   - /backend/src/routes/telegram.routes.ts : valider longueur (max 100 chars) et caracteres de username/first_name/last_name, echapper les caracteres speciaux

8. ENV VALIDATION FRONTEND :
   - Creer /cockpit/src/lib/env-validator.ts qui verifie au demarrage que VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_BACKEND_API_URL existent et ne sont pas des placeholders
   - L'appeler dans main.tsx

VERIFICATION :
- cd backend && npx tsc --noEmit
- cd cockpit && npx tsc --noEmit && npm run build
- grep -r "app.use(cors())" --include="*.ts" mcp-bridge/src/ (doit retourner 0)
```

---

## PHASE 3 : ANALYTICS HUB (Copier apres Phase 2)

```
La securite est corrigee. Maintenant le GAP FONCTIONNEL le plus critique : l'Analytics Hub. Actuellement AnalyticsView affiche des stats de TACHES, pas de donnees marketing reelles.

REFERENCES A LIRE :
- /Roadmap:vision/PRD_THE_HIVE_OS_V5.0.md (section 4.B — Analytics Hub)
- /Roadmap:vision/AUDIT_COMPLET_ET_ROADMAP_50_CLIENTS.md (section 2.2 — gap critique)
- /cockpit/src/views/AnalyticsView.tsx (vue actuelle a reecrire)
- /cockpit/src/components/admin/SLADashboard.tsx (pattern Recharts a copier)
- /backend/src/services/mcp-bridge.service.ts (comment appeler les MCP servers)

TACHES :

1. TYPES : Ajoute dans /cockpit/src/types/index.ts :
   - AnalyticsKPI { id, label, value, previousValue, trend, trendDirection, period, source }
   - AnalyticsChart { id, type: 'line'|'bar'|'area'|'pie', title, data, xKey, yKeys, colors }
   - AnalyticsInsight { id, type: 'success'|'warning'|'danger'|'info', message, action, agent, source }
   - AnalyticsSource = 'ga4' | 'meta_ads' | 'google_ads' | 'gsc' | 'overview'

2. BACKEND : Implemente /backend/src/routes/analytics.routes.ts (remplacer le TODO) :
   - POST /api/analytics avec authMiddleware
   - Body : { source, date_range: { start, end, preset }, project_id }
   - Appelle le MCP server correspondant via mcp-bridge.service
   - Formate en AnalyticsKPI[] + AnalyticsChart[] + AnalyticsInsight[]
   - Cree /backend/src/services/analytics.service.ts pour le mapping source → MCP server

3. COMPOSANTS : Cree /cockpit/src/components/analytics/ :
   - AnalyticsTabs.tsx : onglets GA4/Meta/Google Ads/GSC/Overview (< 150L)
   - KPICard.tsx : card metrique avec trend fleche + variation % (< 100L)
   - KPIGrid.tsx : grille responsive de KPICards (< 80L)
   - ChartWidget.tsx : wrapper Recharts generique (line/bar/area/pie) (< 200L)
   - InsightCard.tsx : insight Sora avec icone type + badge agent (< 100L)
   - DateRangeSelector.tsx : presets 7j/30j/90j + custom (< 100L)
   - OverviewDashboard.tsx : KPIs cross-sources + top insights (< 200L)
   Copie le style du SLADashboard.tsx existant. Utilise Recharts. Design light mode.

4. STORE : Ajoute le slice analytics dans useHiveStore.ts :
   - analyticsData, analyticsActiveSource, analyticsDateRange, analyticsLoading
   - fetchAnalytics(projectId, source, dateRange)
   - setAnalyticsSource, setAnalyticsDateRange

5. API : Ajoute fetchAnalytics() dans /cockpit/src/services/api.ts

6. VUE : Reecris AnalyticsView.tsx (< 250 lignes, orchestrateur) utilisant tous les composants

Si une source n'est pas connectee (pas de credentials dans user_integrations), affiche un etat vide avec bouton "Connecter [Source]" → /integrations/:projectId

VERIFICATION :
- cd cockpit && npx tsc --noEmit && npm run build
- cd backend && npx tsc --noEmit
```

---

## PHASE 4 : FILES + BILLING + COUPER N8N (Copier apres Phase 3)

```
Analytics Hub est fait. Maintenant les 3 autres gaps core.

REFERENCES :
- /Roadmap:vision/PRD_THE_HIVE_OS_V5.0.md (section 4.C — Files & Assets)
- /Roadmap:vision/AUDIT_COMPLET_ET_ROADMAP_50_CLIENTS.md (Tier 2)

3 CHANTIERS :

--- CHANTIER A : FILES PERSISTANT ---

1. Cree /supabase/migrations/011_project_files.sql :
   - Table project_files (id UUID, project_id FK, task_id FK, agent_id, filename, url, file_type, mime_type, size_bytes, tags TEXT[], metadata JSONB, created_at)
   - Indexes sur project_id, agent_id, file_type
   - RLS : users voient les fichiers de leurs projets

2. Backend : implemente /api/files/:projectId (GET liste + POST upload + DELETE)

3. Write-back ADD_FILE : dans write-back.processor.ts, quand un agent genere un delivrable, inserer dans project_files avec tags automatiques

4. Store : ajoute fetchProjectFiles, addFile, deleteFile dans useHiveStore

5. Frontend : connecte FilesView.tsx au store (read depuis Supabase, pas de donnees hardcodees)

--- CHANTIER B : STRIPE BILLING ---

1. Cree les RPC Supabase manquantes : check_usage_limit, increment_usage, get_user_subscription
2. Reactive la logique dans /cockpit/src/services/stripe.ts
3. Connecte le rate limiter backend au tier utilisateur
4. Verifie BillingView.tsx affiche plan + usage

--- CHANTIER C : COUPER N8N ---

1. Lis /cockpit/src/services/n8n.ts et /cockpit/src/services/api.ts
2. Cherche TOUS les imports de n8n.ts dans cockpit/src/
3. Remplace chaque import par api.ts (verifie que l'equivalent existe)
4. Deplace les types/interfaces de n8n.ts vers types/index.ts
5. Marque n8n.ts comme DEPRECATED (commente en haut)

VERIFICATION :
- cd cockpit && npx tsc --noEmit && npm run build
- cd backend && npx tsc --noEmit
- grep -r "from.*n8n" --include="*.ts" --include="*.tsx" cockpit/src/ (sauf n8n.ts lui-meme)
```

---

## PHASE 5 : SKILLS AGENTS (Copier apres Phase 4)

```
L'outil est securise et fonctionnel. Maintenant on ajoute l'intelligence metier qui transforme nos agents de "bons" a "exceptionnels".

REFERENCE COMPLETE : /Roadmap:vision/SKILLS_AGENTS_FRAMEWORK.md

TACHES :

1. Cree la structure /agents/skills/ :
   /agents/skills/
     luna/
       seo-audit-complete.skill.md
       content-strategy-builder.skill.md
       competitor-deep-dive.skill.md
       landing-page-optimizer.skill.md
       cms-content-publisher.skill.md
     sora/
       performance-report-generator.skill.md
       anomaly-detective.skill.md
       tracking-setup-auditor.skill.md
       attribution-analyst.skill.md
       kpi-dashboard-builder.skill.md
     marcus/
       campaign-launch-checklist.skill.md
       budget-optimizer-weekly.skill.md
       creative-testing-framework.skill.md
       scaling-playbook.skill.md
       cross-platform-budget-allocator.skill.md
     milo/
       ad-copy-frameworks.skill.md
       visual-brief-creator.skill.md
       video-ad-producer.skill.md
       multi-platform-adapter.skill.md
       brand-voice-guardian.skill.md
     doffy/
       social-content-calendar.skill.md
       hashtag-strategist.skill.md
       engagement-playbook.skill.md
       social-analytics-interpreter.skill.md
       trend-surfer.skill.md
     orchestrator/
       inter-agent-handoff.skill.md
       client-report-orchestrator.skill.md
       onboarding-new-client.skill.md

2. Pour CHAQUE skill, le contenu doit suivre ce format :
   - Nom du skill
   - Declencheur (quand l'utiliser)
   - Methodologie step-by-step (numerotee)
   - Output attendu (format JSON/UI component)
   - Exemples d'utilisation
   Lis /Roadmap:vision/SKILLS_AGENTS_FRAMEWORK.md pour le contenu detaille de chaque skill.

3. Cree /agents/skills/README.md qui indexe tous les skills avec un tableau (agent | skill | declencheur | output)

4. Modifie /backend/src/agents/agent-executor.ts pour :
   - Detecter le contexte de la requete (tache SEO ? campagne ? rapport ?)
   - Charger le skill pertinent depuis le fichier .skill.md
   - L'injecter dans le system prompt de l'agent AVANT l'appel Claude

VERIFICATION :
- Verifie que chaque fichier .skill.md existe et contient la methodologie complete
- cd backend && npx tsc --noEmit
- Teste : envoie "audite le SEO de example.com" → Luna doit suivre la methodologie du skill seo-audit-complete
```

---

## PHASE 6 : ADMIN DASHBOARD MONITORING (Copier apres Phase 5)

```
Dernier chantier : le dashboard admin pour la visibilite backend.

REFERENCE COMPLETE : /Roadmap:vision/PRD_ADMIN_MONITORING_DASHBOARD.md

Lis ce PRD EN ENTIER avant de coder. Il contient :
- La migration system_logs (table + indexes + RLS + 4 RPCs)
- Le logging service a creer
- Les 3 tabs a ajouter a AdminDashboardView
- Les 12 composants frontend a creer
- Le plan sprint par sprint

Suis le PRD a la lettre. Les fichiers a creer et modifier sont listes dans les sections 3, 4, 5, 6.

IMPORTANT :
- Ne casse PAS les 3 tabs existants (Users, Tickets, SLA)
- Design light mode (meme que le cockpit)
- Recharts pour les graphiques (deja installe)
- Chaque composant < 200 lignes
- authMiddleware + checkAdminRole sur TOUTES les routes admin

VERIFICATION :
- cd cockpit && npx tsc --noEmit && npm run build
- cd backend && npx tsc --noEmit
- curl http://localhost:3457/api/admin/health
- Tous les 6 tabs rendent sans erreur dans /admin
```
