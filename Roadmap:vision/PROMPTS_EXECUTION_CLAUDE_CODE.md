# PROMPTS D'EXECUTION POUR CLAUDE CODE (Terminal)

**Objectif :** Chaque section ci-dessous est un prompt optimise a copier-coller dans Claude Code.
**Ordre d'execution :** Suivre les numeros dans l'ordre. Chaque prompt depend du precedent.
**Regle d'or :** Apres chaque prompt, verifier que `npx tsc --noEmit` et `npm run build` passent.

---

## PHASE 1 : SECURITE CRITIQUE (Prompts 1-4)

> A executer AVANT tout autre travail. Bloquant pour la production.

---

### PROMPT 1 — Nettoyage des secrets et protection Git

```
CONTEXTE : Notre projet The Hive OS a des fichiers .env commites dans git contenant des credentials sensibles (Supabase keys, Anthropic API key, Meta/Google OAuth secrets, mot de passe DB). C'est une faille de securite CRITIQUE.

TACHES :
1. Verifie que `.env` est bien dans le `.gitignore` de CHAQUE sous-projet (cockpit/, backend/, mcp-bridge/, mcp-servers/). Si ce n'est pas le cas, ajoute-le.

2. Pour CHAQUE fichier .env existant (backend/.env, cockpit/.env, mcp-bridge/.env), cree un fichier .env.example correspondant qui contient les memes cles MAIS avec des valeurs placeholder (ex: `SUPABASE_URL=your_supabase_url_here`). Ne copie JAMAIS les vraies valeurs.

3. Verifie qu'il n'y a AUCUN secret hardcode dans les fichiers TypeScript/JavaScript du projet. Cherche dans TOUS les fichiers :
   - Cles API (patterns: `sk-ant`, `sk-proj`, `eyJhbG`, `AIza`)
   - Mots de passe en dur
   - URLs avec credentials dans le query string
   - Tokens OAuth hardcodes

4. Si tu trouves des secrets hardcodes, remplace-les par des references a des variables d'environnement (`process.env.XXX` ou `import.meta.env.VITE_XXX`).

5. Verifie que les credentials Google Cloud (`the-hive-os-v4-*.json`) ne sont pas dans un dossier commite. Si oui, ajoute le pattern au .gitignore.

IMPORTANT : Ne supprime PAS les .env actuels (l'utilisateur en a besoin pour le dev local), assure-toi juste qu'ils sont ignores par git. Apres ce travail, fais `npx tsc --noEmit` dans cockpit/ ET backend/ pour verifier que rien n'est casse.
```

---

### PROMPT 2 — Fix authentification et autorisation

```
CONTEXTE : Le middleware d'authentification est COMMENTE sur toutes les routes critiques du backend. De plus, il y a un fallback 'test-user' qui permet un acces anonyme. C'est une faille CRITIQUE.

REFERENCES :
- Backend routes : /backend/src/routes/ (tous les fichiers .ts)
- Auth middleware : /backend/src/middleware/auth.middleware.ts
- PRD securite : /Roadmap:vision/AUDIT_SECURITE_COMPLET.md (CRIT-02)

TACHES :
1. Lis TOUS les fichiers dans /backend/src/routes/ et identifie CHAQUE endroit ou `authMiddleware` est commente (patterns: `// authMiddleware` ou `// TODO.*auth`).

2. Decommenter `authMiddleware` sur CHAQUE route qui le necessite :
   - chat.routes.ts : POST /api/chat
   - cms.routes.ts : POST /execute, POST /rollback, GET /pending
   - genesis.routes.ts : POST /api/genesis
   - phase-transition.routes.ts : toutes les routes
   - task-explainer.routes.ts : toutes les routes
   - analytics.routes.ts : toutes les routes
   - files.routes.ts : toutes les routes

3. Cherche et SUPPRIME tout fallback `'test-user'` ou `'anonymous'` dans le code. Si un userId n'est pas disponible apres l'auth, retourne un 401 Unauthorized.

4. Verifie que auth.middleware.ts :
   - Extrait correctement le token Bearer du header Authorization
   - Verifie le token avec Supabase
   - Attache l'utilisateur a la request
   - Retourne 401 avec message clair si pas de token ou token invalide
   - NE LEAK PAS de details d'erreur sensibles

5. Verifie que le rate limiter utilise le userId (pas juste l'IP) comme cle quand l'utilisateur est authentifie.

6. Apres les modifs, fais `npx tsc --noEmit` dans backend/ pour verifier 0 erreurs.
```

---

### PROMPT 3 — Fix XSS et sanitisation HTML

```
CONTEXTE : Le fichier UIComponentRenderer.tsx a un dangerouslySetInnerHTML sans sanitisation DOMPurify. La fonction parseMarkdownToHTML() ne sanitise pas non plus. C'est une faille XSS CRITIQUE.

REFERENCES :
- /cockpit/src/components/chat/UIComponentRenderer.tsx (2201 lignes)
- /cockpit/src/components/chat/ChatMessage.tsx (utilise DOMPurify correctement — pattern de reference)
- /Roadmap:vision/AUDIT_SECURITE_COMPLET.md (CRIT-03, CRIT-14)

TACHES :
1. Lis UIComponentRenderer.tsx en entier. Identifie CHAQUE occurrence de :
   - `dangerouslySetInnerHTML`
   - `innerHTML`
   - Tout rendu HTML non sanitise

2. Pour CHAQUE occurrence trouvee, ajoute la sanitisation DOMPurify :
   ```typescript
   import DOMPurify from 'dompurify';
   // AVANT : dangerouslySetInnerHTML={{ __html: htmlContent }}
   // APRES : dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(htmlContent) }}
   ```

3. Corrige la fonction `parseMarkdownToHTML()` pour :
   - Sanitiser la sortie avec DOMPurify APRES les transformations regex
   - Bloquer le protocole `javascript:` dans les liens markdown
   - Echapper les caracteres HTML dangereux dans le contenu brut AVANT les transformations

4. Verifie ChatMessage.tsx — il devrait deja utiliser DOMPurify. Confirme que c'est bien le cas.

5. Cherche dans TOUT le dossier cockpit/src/ d'autres occurrences de `dangerouslySetInnerHTML` et assure-toi que CHACUNE est protegee par DOMPurify.

6. Apres les modifs : `cd cockpit && npx tsc --noEmit && npm run build`
```

---

### PROMPT 4 — Validation des inputs et protection SSRF

```
CONTEXTE : Plusieurs points d'entree acceptent des inputs utilisateur sans validation suffisante. Le validateur d'URL du web-intelligence server ne bloque pas IPv6 localhost.

REFERENCES :
- /cockpit/src/components/chat/ChatInput.tsx (upload fichiers)
- /mcp-servers/web-intelligence-server/src/lib/url-validator.ts
- /mcp-servers/web-intelligence-server/src/lib/cloudinary.ts
- /backend/src/middleware/validation.middleware.ts
- /Roadmap:vision/AUDIT_SECURITE_COMPLET.md (CRIT-05, HIGH-03, HIGH-04)

TACHES :
1. ChatInput.tsx — Ajoute la validation d'upload fichier :
   - Limite de taille : 5MB maximum
   - Validation du type MIME cote client
   - Message d'erreur clair si le fichier est trop gros
   - Ne change PAS le design/layout existant du composant

2. url-validator.ts — Corrige le bypass IPv6 :
   - Bloque `::1` (localhost IPv6)
   - Bloque les ranges IPv6 prives complets (fc00::/7, fe80::/10, ff00::/8)
   - Bloque `[::1]` et variantes dans les URLs
   - Teste avec : `http://[::1]:6379/`, `http://[fc00::1]/`, `http://[fe80::1]/`

3. cloudinary.ts — Ajoute la validation d'upload :
   - Limite buffer a 10MB
   - Sanitise le filename : `path.basename()` + regex `[^a-zA-Z0-9._-]` remplace par `_`
   - Verifie les premiers bytes (magic numbers) pour PNG (89504E47) ou JPEG (FFD8FF)

4. validation.middleware.ts — Verifie que les schemas Zod valident :
   - chatInput : string, max 10000 caracteres
   - project_id : UUID valide
   - session_id : UUID ou string valide
   - Pas de caracteres de controle dans les champs texte

5. Apres les modifs, verifie avec `npx tsc --noEmit` dans cockpit/, backend/ et les mcp-servers concernes.
```

---

## PHASE 2 : FONCTIONNALITES CORE (Prompts 5-8)

> A executer apres la Phase 1 securite.

---

### PROMPT 5 — Analytics Hub : Types + Backend Route

```
CONTEXTE : L'Analytics Hub est le GAP CRITIQUE de notre outil. Actuellement AnalyticsView.tsx affiche des metriques de TACHES (completion rate, heures estimees), mais PAS de donnees marketing reelles (GA4, Meta Ads, Google Ads). Le backend route analytics est un placeholder TODO.

REFERENCES :
- PRD section 4.B : /Roadmap:vision/PRD_THE_HIVE_OS_V5.0.md (chercher "4.B — ANALYTICS HUB")
- Frontend actuel : /cockpit/src/views/AnalyticsView.tsx
- Backend route : /backend/src/routes/analytics.routes.ts
- Types existants : /cockpit/src/types/index.ts
- MCP servers analytics : google-ads-server, meta-ads-server, gtm-server, looker-server
- MCP Bridge service : /backend/src/services/mcp-bridge.service.ts
- Agent Sora : /backend/src/agents/ + /agents/CURRENT_analyst-mcp/

TACHES :
1. Ajoute les types Analytics dans /cockpit/src/types/index.ts (tel que defini dans le PRD section 4.B — B1) :
   - AnalyticsKPI (id, label, value, previousValue, trend, trendDirection, period, source)
   - AnalyticsChart (id, type, title, data, xKey, yKeys, colors)
   - AnalyticsInsight (id, type, message, action, agent, source)
   - AnalyticsSource = 'ga4' | 'meta_ads' | 'google_ads' | 'gsc' | 'overview'
   - AnalyticsState (data par source, activeSource, dateRange, isLoading, lastFetchedAt)

2. Implemente la route backend /api/analytics dans analytics.routes.ts :
   - POST /api/analytics avec payload `analytics_fetch` (voir PRD section 6.2)
   - La route doit :
     a. Authentifier l'utilisateur (authMiddleware)
     b. Valider le body (source, date_range, project_id)
     c. Appeler le MCP Bridge pour le server correspondant a la source
     d. Formater les donnees brutes MCP en AnalyticsKPI[], AnalyticsChart[], AnalyticsInsight[]
     e. Retourner le format standardise du PRD

3. Cree un service /backend/src/services/analytics.service.ts qui :
   - Map chaque AnalyticsSource vers le MCP server correspondant (ga4 -> google-ads, meta_ads -> meta-ads, etc.)
   - Appelle mcp-bridge.service pour executer les tools
   - Transforme les donnees brutes en format Analytics standardise
   - Genere des insights basiques (tendances, anomalies, recommendations)

4. Ajoute les types correspondants cote backend dans /backend/src/types/ si necessaire.

5. Verifie : `npx tsc --noEmit` dans cockpit/ et backend/
```

---

### PROMPT 6 — Analytics Hub : Composants Frontend

```
CONTEXTE : Suite du Prompt 5. Les types et le backend sont en place. Il faut maintenant creer les composants frontend de l'Analytics Hub.

REFERENCES :
- PRD section 4.B : /Roadmap:vision/PRD_THE_HIVE_OS_V5.0.md (section "B2. Dashboards temps reel via MCP")
- Types qu'on vient de creer dans /cockpit/src/types/index.ts
- Design system : Premium Light Mode, Tailwind, couleurs agents (Sora = Cyan #06B6D4)
- Patterns existants : /cockpit/src/components/board/ (reference pour la structure des composants)
- Librairie charts : Recharts (deja dans package.json)

TACHES :
1. Cree le dossier /cockpit/src/components/analytics/ avec ces composants :

   a. AnalyticsTabs.tsx — Navigation par source (GA4, Meta Ads, Google Ads, GSC, Overview)
      - Onglets horizontaux avec icones
      - Onglet actif avec indicateur visuel (couleur Sora cyan)
      - Badge "connecte/non connecte" par source

   b. KPICard.tsx — Card individuelle pour une metrique
      - Valeur principale grande
      - Label descriptif
      - Fleche tendance (up vert / down rouge / stable gris)
      - Pourcentage variation
      - Periode (vs semaine derniere, vs mois dernier)

   c. KPIGrid.tsx — Grille de KPICards (4 colonnes desktop, 2 mobile)
      - Responsive
      - Loading skeleton quand isLoading

   d. ChartWidget.tsx — Wrapper Recharts generique
      - Supporte : LineChart, BarChart, AreaChart, PieChart
      - Titre + legende
      - Tooltip interactif
      - Couleurs personnalisables
      - Responsive container

   e. InsightCard.tsx — Insight genere par Sora
      - Icone par type (success/warning/danger/info)
      - Message texte
      - Bouton action optionnel
      - Badge "Sora" avec couleur agent

   f. DateRangeSelector.tsx — Selecteur de periode
      - Presets : 7j, 30j, 90j
      - Option custom avec date picker
      - Bouton refresh

   g. OverviewDashboard.tsx — Vue agregee cross-sources
      - 1 ligne de KPIs par source connectee
      - Graphique combine (trafic + depenses + conversions)
      - Top 3 insights critiques

2. Chaque composant doit :
   - Etre < 200 lignes
   - Utiliser Tailwind pour le style (pas de CSS custom)
   - Etre type strictement en TypeScript (pas de `any`)
   - Suivre le design system existant (bg-white rounded-xl border border-slate-100)

3. Verifie : `cd cockpit && npx tsc --noEmit && npm run build`
```

---

### PROMPT 7 — Analytics Hub : Rewrite AnalyticsView + Store

```
CONTEXTE : Suite des Prompts 5-6. Types, backend et composants sont prets. Il faut maintenant reecrire AnalyticsView.tsx pour utiliser les donnees reelles et ajouter le slice analytics au store Zustand.

REFERENCES :
- Vue actuelle : /cockpit/src/views/AnalyticsView.tsx (a reecrire)
- Store : /cockpit/src/store/useHiveStore.ts
- Service API : /cockpit/src/services/api.ts
- Composants crees au Prompt 6 : /cockpit/src/components/analytics/
- PRD section 4.B (B2-B5)

TACHES :
1. Ajoute un slice analytics dans useHiveStore.ts :
   ```typescript
   // State
   analyticsData: Record<AnalyticsSource, { kpis: AnalyticsKPI[]; charts: AnalyticsChart[]; insights: AnalyticsInsight[] }>;
   analyticsActiveSource: AnalyticsSource;
   analyticsDateRange: { start: string; end: string; preset: '7d' | '30d' | '90d' | 'custom' };
   analyticsLoading: boolean;
   analyticsLastFetched: string | null;

   // Actions
   fetchAnalytics: (projectId: string, source: AnalyticsSource, dateRange: DateRange) => Promise<void>;
   setAnalyticsSource: (source: AnalyticsSource) => void;
   setAnalyticsDateRange: (range: DateRange) => void;
   ```

2. Ajoute la fonction `fetchAnalytics` dans api.ts :
   ```typescript
   export async function fetchAnalytics(projectId: string, source: AnalyticsSource, dateRange: DateRange): Promise<AnalyticsResponse>
   ```
   - POST vers `/api/analytics` avec le payload analytics_fetch
   - Timeout 30 secondes (les requetes MCP peuvent etre lentes)
   - Gestion d'erreur avec message user-friendly

3. Reecris AnalyticsView.tsx :
   - Utilise les composants AnalyticsTabs, KPIGrid, ChartWidget, InsightCard, DateRangeSelector, OverviewDashboard
   - Au mount : charge les donnees de la source active
   - Au changement d'onglet : charge les donnees de la nouvelle source
   - Etat vide elegant quand pas de donnees (AnalyticsEmpty avec lien vers /integrations)
   - Loading skeleton pendant le fetch
   - AnalyticsView.tsx doit etre < 250 lignes (orchestrateur)

4. Verifie : `cd cockpit && npx tsc --noEmit && npm run build`

IMPORTANT : Si une source n'est pas connectee (pas de credentials dans user_integrations), affiche un etat vide avec un bouton "Connecter [Source]" qui redirige vers /integrations/:projectId. Ne fais PAS d'appel MCP pour une source non connectee.
```

---

### PROMPT 8 — Files & Assets : Persistence Supabase

```
CONTEXTE : Le systeme de fichiers (The Librarian) existe en frontend mais les fichiers ne sont PAS persistes dans Supabase. Il faut creer la table project_files et connecter le frontend.

REFERENCES :
- PRD section 4.C : /Roadmap:vision/PRD_THE_HIVE_OS_V5.0.md (section "4.C — FILES & ASSETS")
- Vue actuelle : /cockpit/src/views/FilesView.tsx
- Store : /cockpit/src/store/useHiveStore.ts
- Backend routes files : /backend/src/routes/files.routes.ts
- Migrations existantes : /supabase/migrations/
- Write-back types : chercher ADD_FILE dans les types

TACHES :
1. Cree la migration SQL /supabase/migrations/011_project_files.sql :
   ```sql
   CREATE TABLE project_files (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
     task_id UUID REFERENCES tasks(id),
     agent_id TEXT,
     filename TEXT NOT NULL,
     url TEXT NOT NULL,
     file_type TEXT NOT NULL, -- 'image' | 'video' | 'pdf' | 'audio' | 'document'
     mime_type TEXT,
     size_bytes BIGINT,
     tags TEXT[] DEFAULT '{}',
     metadata JSONB DEFAULT '{}',
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Index pour les requetes frequentes
   CREATE INDEX idx_project_files_project ON project_files(project_id);
   CREATE INDEX idx_project_files_agent ON project_files(agent_id);
   CREATE INDEX idx_project_files_type ON project_files(file_type);

   -- RLS
   ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Users can view their project files"
     ON project_files FOR SELECT
     USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));
   CREATE POLICY "Users can insert files in their projects"
     ON project_files FOR INSERT
     WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));
   ```

2. Implemente le backend /api/files :
   - GET /api/files/:projectId — Liste les fichiers avec filtres (agent, type, tags)
   - POST /api/files/:projectId — Upload un fichier (metadata + URL Cloudinary)
   - DELETE /api/files/:fileId — Supprime un fichier (soft delete ou hard delete)

3. Implemente le write-back ADD_FILE dans le write-back processor :
   - Quand un agent genere un delivrable (image, video, PDF), il envoie une commande ADD_FILE
   - Le processor insere dans project_files avec les tags automatiques (agent, phase, task)

4. Ajoute le slice files dans useHiveStore.ts :
   - fetchProjectFiles(projectId, filters?)
   - addFile(file)
   - deleteFile(fileId)

5. Mets a jour FilesView.tsx pour lire depuis le store (pas de donnees hardcodees) :
   - Au mount : fetchProjectFiles
   - Filtres fonctionnels (agent, type)
   - Download via URL Cloudinary

6. Verifie : `npx tsc --noEmit` dans cockpit/ et backend/
```

---

## PHASE 3 : CONSOLIDATION (Prompts 9-11)

---

### PROMPT 9 — Stripe Billing actif

```
CONTEXTE : Le service Stripe existe (cockpit/src/services/stripe.ts) mais les fonctions RPC Supabase sont manquantes et la logique est partiellement desactivee. Il faut activer la monetisation.

REFERENCES :
- Service Stripe : /cockpit/src/services/stripe.ts
- Vue Billing : /cockpit/src/views/BillingView.tsx
- Rate limiting : /backend/src/middleware/rate-limit.middleware.ts
- PRD : Tiers free (10/min), pro (60/min), enterprise (300/min)

TACHES :
1. Cree les RPC functions Supabase manquantes :
   - check_usage_limit(user_id, tier) — retourne si l'utilisateur a depasse sa limite
   - increment_usage(user_id, endpoint, tokens_used) — incremente le compteur
   - get_user_subscription(user_id) — retourne le plan actif
   - get_usage_stats(user_id, period) — stats d'utilisation

2. Reactive la logique dans stripe.ts :
   - checkUsageLimit doit appeler la RPC
   - incrementUsage doit logger chaque appel API
   - Les limites doivent correspondre aux tiers du PRD

3. Connecte le rate limiter backend au tier de l'utilisateur :
   - Lis le tier depuis Supabase (ou cache Redis si disponible)
   - Applique la bonne limite par tier
   - Retourne un header X-RateLimit-Remaining

4. Verifie que BillingView.tsx affiche correctement :
   - Plan actif
   - Usage actuel vs limite
   - Bouton upgrade/downgrade (si Stripe est configure)

5. Verifie : `npx tsc --noEmit` dans cockpit/ et backend/
```

---

### PROMPT 10 — Couper n8n definitivement

```
CONTEXTE : Le backend TypeScript est en place et fonctionnel. Le service n8n.ts legacy est encore present dans le frontend. Il faut verifier que TOUT passe par le backend TS et supprimer les references n8n.

REFERENCES :
- Service legacy : /cockpit/src/services/n8n.ts (781 lignes)
- Service V5 : /cockpit/src/services/api.ts
- Store : /cockpit/src/store/useHiveStore.ts
- Backend : /backend/src/

TACHES :
1. Lis n8n.ts et api.ts. Identifie TOUTES les fonctions de n8n.ts et leur equivalent dans api.ts.

2. Cherche dans TOUT le code frontend (cockpit/src/) les imports de n8n.ts :
   - `import.*from.*n8n`
   - `PM_WEBHOOK_URL`
   - Toute reference directe a des URLs n8n

3. Pour chaque reference trouvee :
   - Verifie que l'equivalent existe dans api.ts
   - Si oui, remplace l'import par api.ts
   - Si non, cree la fonction equivalente dans api.ts

4. Verifie que api.ts couvre TOUTES les actions :
   - genesis
   - task_launch
   - quick_action
   - write_back
   - analytics_fetch (ajoute au Prompt 5)

5. Une fois que ZERO import de n8n.ts existe dans le code :
   - Ne supprime PAS n8n.ts immediatement (garde-le comme reference)
   - Ajoute un commentaire en haut : `// DEPRECATED - Ce service est remplace par api.ts. Ne pas utiliser pour les nouveaux developpements.`

6. Verifie : `cd cockpit && npx tsc --noEmit && npm run build`

IMPORTANT : Ne casse PAS les fonctionnalites existantes. Si un type ou interface est defini dans n8n.ts et utilise ailleurs, deplace-le dans types/index.ts avant de toucher a n8n.ts.
```

---

### PROMPT 11 — Refactoring UIComponentRenderer (securite + maintenabilite)

```
CONTEXTE : UIComponentRenderer.tsx fait 2201 lignes (la regle est < 400 lignes). Il contient 20+ types de composants UI rendus dans le chat. Il faut le decouper en sous-composants sans casser aucune fonctionnalite.

REFERENCES :
- Fichier : /cockpit/src/components/chat/UIComponentRenderer.tsx (2201L)
- Types UI : /cockpit/src/types/index.ts (UIComponentType)
- PRD regle : max 400 lignes par fichier

TACHES :
1. Lis UIComponentRenderer.tsx en entier. Identifie chaque "case" ou "type" qui rend un composant different.

2. Cree le dossier /cockpit/src/components/chat/ui-components/ et decoupe chaque rendu en son propre fichier :
   - ImageComponent.tsx (CAMPAGNE_TABLE)
   - VideoComponent.tsx (AD_PREVIEW)
   - CopywritingComponent.tsx (PDF_COPYWRITING)
   - ReportComponent.tsx (PDF_REPORT)
   - AnalyticsDashboardComponent.tsx (ANALYTICS_DASHBOARD)
   - ActionButtonsComponent.tsx (ACTION_BUTTONS)
   - KPICardComponent.tsx (KPI_CARD)
   - ErrorComponents.tsx (ERROR, ERROR_BLOCKED_ACTION, ERROR_DEPENDENCIES_BLOCKED)
   - ApprovalComponent.tsx (APPROVAL_REQUEST)
   - WebScreenshotComponent.tsx (WEB_SCREENSHOT)
   - CompetitorReportComponent.tsx (COMPETITOR_REPORT)
   - LandingPageAuditComponent.tsx (LANDING_PAGE_AUDIT)
   - PixelVerificationComponent.tsx (PIXEL_VERIFICATION)
   - SocialComponents.tsx (SOCIAL_POST_PREVIEW, CONTENT_CALENDAR, SOCIAL_ANALYTICS)
   - GenericComponent.tsx (fallback)

3. UIComponentRenderer.tsx devient un simple routeur < 100 lignes :
   ```typescript
   export default function UIComponentRenderer({ component }: Props) {
     switch (component.type) {
       case 'CAMPAGNE_TABLE': return <ImageComponent data={component.data} />;
       case 'AD_PREVIEW': return <VideoComponent data={component.data} />;
       // ... etc
       default: return <GenericComponent data={component.data} type={component.type} />;
     }
   }
   ```

4. La fonction `parseMarkdownToHTML()` va dans un fichier utilitaire : /cockpit/src/lib/markdown-parser.ts
   - Assure-toi que DOMPurify.sanitize() est TOUJOURS appele (fix du Prompt 3)

5. AUCUNE regression : le rendu de chaque composant doit etre IDENTIQUE avant et apres le refactoring.

6. Verifie : `cd cockpit && npx tsc --noEmit && npm run build`
```

---

## PHASE 4 : SECURITE AVANCEE (Prompts 12-13)

---

### PROMPT 12 — Headers securite + CSRF + Error handling

```
CONTEXTE : Le backend utilise Helmet avec la config par defaut. Il faut renforcer les headers HTTP, ajouter la protection CSRF et securiser les messages d'erreur.

REFERENCES :
- Backend entry : /backend/src/index.ts
- Error middleware : /backend/src/middleware/error.middleware.ts
- /Roadmap:vision/AUDIT_SECURITE_COMPLET.md (CRIT-08, HIGH-01, HIGH-02)

TACHES :
1. Configure Helmet avec des directives strictes dans /backend/src/index.ts :
   - Content-Security-Policy : default-src 'self', script-src 'self', style-src 'self' 'unsafe-inline', img-src 'self' data: https:, connect-src 'self' (+ URL Supabase + URL frontend)
   - Referrer-Policy : strict-origin-when-cross-origin
   - Permissions-Policy : camera=(), microphone=(), geolocation=()
   - X-Content-Type-Options : nosniff
   - X-Frame-Options : DENY

2. Ajoute la protection CSRF :
   - Installe et configure un middleware CSRF (csurf ou double-submit cookie pattern)
   - Le frontend doit envoyer le token CSRF dans les headers
   - Les requetes GET sont exemptees
   - Alternative si csurf est trop complexe : utilise le pattern SameSite=Strict sur les cookies + verification Origin header

3. Securise error.middleware.ts :
   - En production : retourne UNIQUEMENT { success: false, error: { message: "Internal server error", code: "INTERNAL_ERROR" } }
   - JAMAIS de stack trace, details techniques ou noms de fichiers en production
   - En dev seulement : log les details dans la console (pas dans la reponse)
   - Ajoute des codes d'erreur standardises (AUTH_REQUIRED, RATE_LIMITED, VALIDATION_ERROR, INTERNAL_ERROR)

4. Verifie : `cd backend && npx tsc --noEmit`
```

---

### PROMPT 13 — Write-back securite + Audit logging

```
CONTEXTE : Les write-back commands modifient directement la base de donnees sans verifier l'ownership ni logger les operations. C'est un risque d'injection et d'acces non autorise.

REFERENCES :
- /backend/src/shared/write-back.processor.ts
- /backend/src/agents/agent-executor.ts
- /Roadmap:vision/AUDIT_SECURITE_COMPLET.md (CRIT-06, MED-02, MED-03, MED-04)

TACHES :
1. Securise write-back.processor.ts :
   a. Ajoute un parametre userId a executeWriteBackCommands
   b. AVANT chaque operation, verifie que userId est proprietaire du projectId :
      ```typescript
      const { data } = await supabase.from('projects').select('id').eq('id', projectId).eq('user_id', userId).single();
      if (!data) throw new Error('Access denied');
      ```
   c. Limite a 50 commandes maximum par requete
   d. Whitelist des types de commandes autorises (rejete tout type inconnu)

2. Ajoute le logging d'audit :
   a. Cree une table (ou utilise la table existante si elle existe) pour logger :
      - user_id, project_id, action, command_type, details (JSONB), ip_address, timestamp, success/failure
   b. Chaque write-back command doit etre loggee AVANT execution
   c. Le resultat (succes/echec) doit etre mis a jour APRES execution

3. Securise agent-executor.ts :
   a. Sanitise les reponses Claude avant de parser les write-back commands
   b. Valide la structure de chaque commande (schema Zod)
   c. Rejete les commandes avec des champs inattendus

4. Verifie : `cd backend && npx tsc --noEmit`
```

---

## PHASE 5 : RGPD & COMPLIANCE (Prompt 14)

---

### PROMPT 14 — Compliance RGPD

```
CONTEXTE : Pour operer en France/UE avec 50 clients, nous devons etre RGPD-compliant. Plusieurs elements manquent.

REFERENCES :
- Pages existantes : /cockpit/src/views/PrivacyPolicyView.tsx, TermsOfServiceView.tsx
- /Roadmap:vision/AUDIT_SECURITE_COMPLET.md (section RGPD)

TACHES :
1. Cookie consent banner :
   - Cree un composant CookieConsent.tsx qui s'affiche en bas de page au premier visit
   - Options : "Accepter tout", "Refuser tout", "Personnaliser"
   - Stocke le choix dans localStorage
   - N'active les analytics/tracking QU'apres consentement
   - Design coherent avec le design system (bg-white, rounded, shadow)

2. Droit a l'oubli :
   - Ajoute un bouton "Supprimer mon compte et mes donnees" dans AccountSettingsView
   - Backend : cree un endpoint DELETE /api/user/delete-account qui :
     a. Supprime TOUTES les donnees de l'utilisateur (projets, taches, fichiers, sessions, memory)
     b. Supprime le compte Supabase Auth
     c. Envoie un email de confirmation
   - Demande une confirmation double (modal + re-saisie du mot de passe)

3. Portabilite des donnees :
   - Ajoute un bouton "Exporter mes donnees" dans AccountSettingsView
   - Backend : cree un endpoint GET /api/user/export qui :
     a. Exporte projets, taches, fichiers, sessions en format JSON
     b. Retourne un fichier ZIP telechargeble
   - Format lisible et structure

4. Mets a jour PrivacyPolicyView avec :
   - Contact DPO (email)
   - Liste des traitements et leur base legale
   - Duree de conservation des donnees
   - Droits des utilisateurs (acces, rectification, suppression, portabilite)

5. Verifie : `npx tsc --noEmit` dans cockpit/ et backend/
```

---

## NOTES POUR L'EXECUTION

### Ordre obligatoire :
```
Prompt 1 (secrets) → Prompt 2 (auth) → Prompt 3 (XSS) → Prompt 4 (validation)
→ Prompt 5 (analytics types+backend) → Prompt 6 (analytics composants) → Prompt 7 (analytics view+store)
→ Prompt 8 (files) → Prompt 9 (stripe) → Prompt 10 (couper n8n) → Prompt 11 (refactor UIRenderer)
→ Prompt 12 (headers+CSRF) → Prompt 13 (write-back securite) → Prompt 14 (RGPD)
```

### Verification apres CHAQUE prompt :
```bash
# Frontend
cd cockpit && npx tsc --noEmit && npm run build

# Backend
cd backend && npx tsc --noEmit

# Securite
grep -r "dangerouslySetInnerHTML" cockpit/src/ | grep -v "DOMPurify"
grep -r "// authMiddleware" backend/src/routes/
grep -r "test-user\|anonymous" backend/src/
```

### Regles pour Claude Code :
- Ne JAMAIS ajouter de `any` TypeScript
- Ne JAMAIS laisser de `console.log` hors `import.meta.env.DEV` / `process.env.NODE_ENV === 'development'`
- Chaque fichier < 400 lignes
- DOMPurify sur TOUT `dangerouslySetInnerHTML`
- Pas de secrets hardcodes
