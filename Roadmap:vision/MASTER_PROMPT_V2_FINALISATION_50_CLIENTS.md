# MASTER PROMPT V2 — Finalisation 50 Clients

**Date :** 2026-04-28
**Etat actuel :** Securite a 90%, Score global 82%. Il reste 18% pour atteindre la vision PRD V5.0.
**Usage :** Copie le prompt de la PHASE que tu veux executer dans Claude Code terminal.
**Ordre obligatoire :** Phase A → Phase B → Phase C → Phase D → Phase E → Phase F

---

## PHASE A : SECURITE → 100% (Nettoyage final)

```
Tu es le dev senior de The Hive OS. La securite est a 90%. Il reste du nettoyage pour atteindre 100%.

REFERENCES :
- /Roadmap:vision/VERIFICATION_POST_FIX_28_AVRIL_2026.md (etat actuel)
- /Roadmap:vision/PRD_THE_HIVE_OS_V5.0.md (section 4.E — protocole post-tache)

3 CHANTIERS DE NETTOYAGE :

--- CHANTIER 1 : Supprimer les console.log en production (~80 instances) ---

1. Cherche dans TOUT /backend/src/ les occurrences de console.log, console.error, console.warn
2. Pour CHAQUE occurrence :
   - Si c'est du debug/info : entoure avec `if (process.env.NODE_ENV === 'development')`
   - Si c'est une erreur critique qui doit etre loggee : garde console.error MAIS sans donnees sensibles (pas de userId, pas de tokens, pas de project data). Log uniquement le message d'erreur et le code.
   - Si c'est inutile : supprime
3. Fais la meme chose dans /cockpit/src/ mais avec `import.meta.env.DEV` au lieu de `process.env.NODE_ENV`
4. Verifie qu'aucun console.log ne leak des donnees sensibles (tokens, passwords, API keys, user emails)

--- CHANTIER 2 : Eliminer les `any` TypeScript (78 instances) ---

1. Dans /backend/src/, cherche toutes les occurrences de `: any`, `as any`, `<any>`
2. Pour CHAQUE une, remplace par le type correct :
   - `(req as any).user` → definis une interface `AuthenticatedRequest` si elle n'existe pas deja, et type correctement
   - Reponses API sans type → cree des interfaces dans /backend/src/types/
   - Parametres de callback → type explicitement
3. Fais la meme chose dans /cockpit/src/
4. L'objectif est ZERO `any` ou au maximum 5 justifies avec un commentaire // eslint-disable-next-line @typescript-eslint/no-explicit-any -- raison

--- CHANTIER 3 : Migration project_files (audit trail) ---

1. Verifie si /supabase/migrations/011_project_files.sql existe
2. Si NON, cree-le avec le schema complet :
   - Table project_files (id UUID PK, project_id FK, task_id FK nullable, agent_id TEXT, filename TEXT NOT NULL, url TEXT NOT NULL, file_type TEXT NOT NULL, mime_type TEXT, size_bytes BIGINT, tags TEXT[] DEFAULT '{}', metadata JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW())
   - Indexes sur project_id, agent_id, file_type
   - RLS : users voient/inserent les fichiers de leurs projets uniquement
3. Si OUI, verifie que le schema est complet et que RLS est active

VERIFICATION :
cd backend && npx tsc --noEmit   # 0 erreur
cd cockpit && npx tsc --noEmit && npm run build   # 0 erreur
grep -r "console\.log\|console\.error" --include="*.ts" backend/src/ | grep -v "NODE_ENV\|development" | wc -l   # doit etre < 5
grep -r ": any\|as any" --include="*.ts" --include="*.tsx" backend/src/ cockpit/src/ | wc -l   # doit etre < 10
```

---

## PHASE B : ANALYTICS HUB → 100% (Connexion donnees reelles)

```
Tu es le dev senior de The Hive OS. L'Analytics Hub a son architecture complete (composants, routes, store) mais les donnees MCP reelles ne transitent pas encore car les credentials API tierces ne sont pas wired end-to-end.

REFERENCES A LIRE :
- /Roadmap:vision/PRD_THE_HIVE_OS_V5.0.md (section 4.B — Analytics Hub)
- /backend/src/services/analytics.service.ts (service existant)
- /backend/src/services/mcp-bridge.service.ts (client MCP Bridge)
- /cockpit/src/views/AnalyticsView.tsx (vue existante)
- /cockpit/src/components/analytics/ (composants existants)
- /mcp-bridge/src/config.ts (servers enregistres)
- /mcp-servers/google-ads-server/ (server Google Ads)
- /mcp-servers/meta-ads-server/ (server Meta Ads)

4 CHANTIERS :

--- CHANTIER 1 : Verifier le flow end-to-end Analytics ---

1. Lis analytics.service.ts EN ENTIER. Comprends comment il mappe chaque source vers un MCP server.
2. Lis mcp-bridge.service.ts — comprends comment il appelle le Bridge HTTP.
3. Verifie que les noms de serveurs dans analytics.service.ts matchent EXACTEMENT les noms dans mcp-bridge/config.ts :
   - ga4 → quel server ? (google-ads ? un nouveau ga4-connector ?)
   - meta_ads → meta-ads
   - google_ads → google-ads
   - gsc → seo-audit (ou un server dedie ?)
4. Si des mappings sont incorrects ou manquants, corrige-les.
5. Verifie que les noms de tools appeles matchent les tools reels exposes par chaque MCP server :
   - Pour google-ads : les tools sont google_ads_get_accounts, google_ads_get_campaigns, google_ads_get_search_terms, google_ads_get_keywords_quality_score
   - Pour meta-ads : meta_ads_get_ad_accounts, meta_ads_get_campaigns, meta_ads_get_insights
   - Pour seo-audit : technical_seo_audit, pagespeed_insights, etc.

--- CHANTIER 2 : Formatter les donnees MCP en KPI/Chart/Insight ---

1. Dans analytics.service.ts, verifie les fonctions de transformation :
   - Les donnees brutes du MCP server doivent etre transformees en AnalyticsKPI[]
   - Chaque KPI doit avoir : label, value, previousValue, trend (%), trendDirection
   - Les charts doivent avoir : type, title, data array, xKey, yKeys
2. Si les transformations sont des stubs ou trop generiques, implemente-les correctement :
   - GA4 KPIs : Sessions, Users, Bounce Rate, Avg Session Duration, Conversions, Revenue
   - Meta Ads KPIs : Spend, ROAS, CPA, CTR, Impressions, Reach, Frequency
   - Google Ads KPIs : Spend, Conversions, CPA, CTR, Quality Score moyen, Impression Share
   - GSC KPIs : Clicks, Impressions, Avg CTR, Avg Position
3. Pour chaque source, genere au minimum 3 insights automatiques :
   - Tendance principale (hausse/baisse du KPI le plus important)
   - Anomalie si variation > 20%
   - Recommandation actionnable

--- CHANTIER 3 : Gestion sources non connectees ---

1. Verifie que quand une source n'a pas de credentials (user_integrations vide pour cette source), l'UI affiche un etat vide elegant :
   - Message "Cette source n'est pas encore connectee"
   - Bouton "Connecter [Source]" qui redirige vers /integrations/:projectId
   - PAS d'appel MCP (eviter les erreurs)
2. La verification doit se faire AVANT l'appel analytics_fetch
3. Cote backend : si les credentials sont manquantes, retourner un JSON clair { connected: false, message: "..." } au lieu d'une erreur 500

--- CHANTIER 4 : Overview Dashboard cross-sources ---

1. Verifie que OverviewDashboard.tsx :
   - Affiche 1 ligne de KPIs par source CONNECTEE (pas les non connectees)
   - A un graphique combine (Recharts ComposedChart) : trafic + depenses + conversions sur la meme timeline
   - Affiche les top 3 insights les plus critiques toutes sources confondues
   - A un "score de sante marketing" global (moyenne ponderee des performances)
2. Si ce n'est pas implemente, implemente-le en suivant le pattern de SLADashboard.tsx pour les charts

VERIFICATION :
cd backend && npx tsc --noEmit
cd cockpit && npx tsc --noEmit && npm run build
# Test manuel : ouvrir /analytics/:projectId → chaque onglet doit rendre sans erreur
# Sources non connectees : doivent afficher l'etat vide, pas une erreur
```

---

## PHASE C : FILES → 100% + STRIPE → 100%

```
Tu es le dev senior de The Hive OS. Files est a 85% et Stripe a 30%. On doit finir les deux.

REFERENCES :
- /Roadmap:vision/PRD_THE_HIVE_OS_V5.0.md (section 4.C — Files & Assets, section 6.3 — payload files_search)
- /cockpit/src/views/FilesView.tsx
- /cockpit/src/services/stripe.ts
- /cockpit/src/views/BillingView.tsx
- /backend/src/routes/files.routes.ts
- /backend/src/middleware/rate-limit.middleware.ts

--- CHANTIER A : FILES — Bulk download + Recherche IA ---

1. BULK DOWNLOAD :
   - Dans FilesView.tsx, ajoute un mode selection multiple (checkboxes sur chaque fichier)
   - Bouton "Telecharger la selection" qui apparait quand >= 1 fichier selectionne
   - Cote backend : cree un endpoint POST /api/files/:projectId/bulk-download
     - Recoit un array de file IDs
     - Telecharge chaque URL (Cloudinary) cote serveur
     - Cree un ZIP avec la librairie `archiver` (npm install archiver @types/archiver)
     - Stream le ZIP en reponse
   - Cote frontend : appelle l'endpoint et declenche le telechargement du ZIP
   - AuthMiddleware + verification ownership sur l'endpoint

2. RECHERCHE IA FILES :
   - Cree un endpoint POST /api/files/:projectId/search dans files.routes.ts
   - Body : { query: string, filters?: { agent?: string, file_type?: string, phase?: string } }
   - Implementation :
     a. Parse la query en keywords
     b. Cherche dans project_files avec ILIKE sur filename + tags + metadata
     c. Si l'utilisateur est dans le chat et envoie "montre-moi les visuels de Noel" :
        - L'orchestrateur detecte l'intent "file search"
        - Appelle l'endpoint search
        - Retourne les resultats en UI components
   - Ajoute le filtre de recherche dans FilesView.tsx (barre de recherche qui appelle l'endpoint)

--- CHANTIER B : STRIPE BILLING COMPLET ---

1. Lis /cockpit/src/services/stripe.ts EN ENTIER. Identifie ce qui est desactive/commente.

2. Verifie/cree les RPC Supabase :
   - get_user_subscription(user_id) → retourne { plan: 'free'|'pro'|'enterprise', status, period_end }
   - check_usage_limit(user_id) → retourne { allowed: boolean, current: number, limit: number }
   - increment_usage(user_id, action, tokens_used) → incremente le compteur
   Si ces RPCs n'existent pas, cree-les dans une migration /supabase/migrations/029_stripe_billing.sql avec une table user_subscriptions (user_id, plan, stripe_customer_id, stripe_subscription_id, status, current_period_end, usage_count, usage_limit)

3. Reactive stripe.ts :
   - checkUsageLimit doit appeler la RPC
   - incrementUsage doit logger chaque appel API
   - createCheckoutSession doit creer une session Stripe avec le price_id correct
   - createCustomerPortalSession doit ouvrir le portail Stripe

4. Connecte le rate limiter backend au plan :
   - Dans rate-limit.middleware.ts, le plan de l'utilisateur est deja lu depuis le token auth
   - Verifie que les limites correspondent : free=5/min, pro=30/min, enterprise=100/min

5. Verifie BillingView.tsx :
   - Affiche le plan actif de l'utilisateur
   - Affiche l'usage actuel vs la limite
   - Boutons "Upgrade" et "Manage subscription" fonctionnels
   - Plans avec prix clairs

6. Ajoute le check d'usage AVANT chaque appel agent :
   - Dans agent-executor.ts ou chat.routes.ts : avant de lancer un agent, verifier checkUsageLimit
   - Si limite atteinte : retourner un message clair "Vous avez atteint votre limite. Upgradez votre plan." avec un bouton upgrade

VERIFICATION :
cd backend && npx tsc --noEmit
cd cockpit && npx tsc --noEmit && npm run build
# Test : creer un user free, envoyer 6 messages → le 6e doit etre bloque
# Test : BillingView affiche plan + usage + boutons
```

---

## PHASE D : DOFFY SOCIAL MEDIA REEL (Remplacer le mock)

```
Tu es le dev senior de The Hive OS. Doffy (Social Media Manager) est actuellement en mode MOCK — le social-media-server retourne des donnees fictives. On doit le connecter a de vraies APIs.

REFERENCES :
- /mcp-servers/social-media-server/ (server actuel mock)
- /agents/skills/doffy/ (5 skills du social media manager)
- /cockpit/src/components/chat/UIComponentRenderer.tsx (composants SOCIAL_POST_PREVIEW, CONTENT_CALENDAR, SOCIAL_ANALYTICS)
- /cockpit/src/views/IntegrationsView.tsx (connexions OAuth)

APPROCHE : Implementation progressive — commencer par LinkedIn et Instagram (les plus demandes par les PME), puis Twitter/X et TikTok.

--- CHANTIER 1 : LinkedIn Pages API ---

1. Cree /mcp-servers/social-media-server/src/providers/linkedin.provider.ts :
   - Utilise l'API LinkedIn Pages (https://learn.microsoft.com/linkedin/marketing/)
   - Endpoints necessaires :
     a. POST ugcPosts (creer un post texte/image/lien)
     b. GET organizationalEntityShareStatistics (metriques : impressions, clicks, likes, comments, shares)
     c. GET shares (lister les posts)
   - Authentification : OAuth 2.0 avec access_token depuis user_integrations
   - Rate limits LinkedIn : 100 calls/jour pour les posts

2. Modifie les tools du social-media-server :
   - create_post : si platform = 'linkedin', appelle linkedin.provider au lieu du mock
   - get_post_performance : idem, donnees reelles
   - schedule_post : LinkedIn ne supporte pas le scheduling natif → stocker dans une table scheduled_posts et utiliser un cron pour publier

--- CHANTIER 2 : Instagram Graph API ---

1. Cree /mcp-servers/social-media-server/src/providers/instagram.provider.ts :
   - Utilise l'Instagram Graph API (via Facebook/Meta Business SDK)
   - Endpoints necessaires :
     a. POST /{ig-user}/media + POST /{ig-user}/media_publish (publication en 2 etapes)
     b. GET /{ig-user}/insights (metriques compte)
     c. GET /{media-id}/insights (metriques post : reach, impressions, engagement, saves)
   - Authentification : Meta OAuth avec permissions instagram_basic, instagram_content_publish, instagram_manage_insights
   - Types de contenu : image, carousel, reel (video)

2. Connecte a IntegrationsView :
   - L'integration Instagram est deja listee dans IntegrationsView
   - Verifie que le callback OAuth stocke correctement le token dans user_integrations
   - Le token doit inclure les permissions Instagram

--- CHANTIER 3 : Scheduling System ---

1. Cree une migration /supabase/migrations/030_scheduled_posts.sql :
   ```sql
   CREATE TABLE scheduled_posts (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     project_id UUID NOT NULL REFERENCES projects(id),
     user_id UUID NOT NULL,
     platform TEXT NOT NULL,
     content TEXT NOT NULL,
     media_urls TEXT[] DEFAULT '{}',
     hashtags TEXT[] DEFAULT '{}',
     scheduled_at TIMESTAMPTZ NOT NULL,
     published_at TIMESTAMPTZ,
     status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'publishing', 'published', 'failed')),
     error_message TEXT,
     platform_post_id TEXT,
     metadata JSONB DEFAULT '{}',
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

2. Cree un backend endpoint POST /api/social/schedule qui :
   - Valide le contenu
   - Insere dans scheduled_posts
   - Retourne la confirmation

3. Cree un cron job (Supabase Edge Function ou backend scheduled task) qui :
   - Toutes les minutes, cherche les posts ou scheduled_at <= NOW() AND status = 'scheduled'
   - Publie via le provider correspondant (linkedin ou instagram)
   - Met a jour le status (published ou failed)

--- CHANTIER 4 : Twitter/X + TikTok ---

Si le temps le permet, ajoute les providers pour :
- Twitter/X : API v2 avec OAuth 2.0 (posts, metriques)
- TikTok : TikTok Business API (videos, metriques)

Sinon, garde le mock pour ces plateformes et documente-le clairement.

VERIFICATION :
cd backend && npx tsc --noEmit
# Test : connecter un compte LinkedIn test → creer un post → verifier qu'il apparait sur LinkedIn
# Test : schedule_post avec scheduled_at dans 2 minutes → verifier publication automatique
# Test : get_post_performance → verifier que les metriques sont reelles
```

---

## PHASE E : ENRICHIR SKILLS + ONBOARDING + RGPD + LOAD TEST

```
Tu es le dev senior de The Hive OS. On finalise les derniers elements pour les 50 clients.

REFERENCES :
- /Roadmap:vision/SKILLS_AGENTS_FRAMEWORK.md (skills actuels)
- /agents/skills/ (fichiers skills)
- /Roadmap:vision/VERIFICATION_POST_FIX_28_AVRIL_2026.md (items restants)

4 CHANTIERS :

--- CHANTIER 1 : Enrichir les skills Marcus et Milo ---

Les skills de Marcus (24-72 lignes) et Milo (28-48 lignes) sont fonctionnels mais concis par rapport a Luna/Sora (108-192 lignes). Enrichis-les pour atteindre le meme niveau de profondeur.

Pour CHAQUE skill de Marcus (/agents/skills/marcus/) :
1. Lis le skill actuel
2. Ajoute : plus de detail dans chaque etape de la methodologie, des exemples concrets, des seuils chiffres, des edge cases a gerer, des patterns de decision
3. Cible : 100-150 lignes par skill (meme profondeur que Luna)
4. Specifiquement :
   - creative-testing-framework.skill.md : ajoute la methodologie de test A/B detaillee (taille echantillon, duree, criteres de significativite statistique)
   - scaling-playbook.skill.md : ajoute les cas de figure (scale apres Learning Phase, scale avec nouveau creatif, scale geographique)
   - cross-platform-budget-allocator.skill.md : ajoute les regles par industrie (e-commerce vs SaaS vs local), la saisonnalite, les minimums par plateforme

Pour CHAQUE skill de Milo (/agents/skills/milo/) :
1. Meme exercice — enrichir chaque skill
2. Specifiquement :
   - visual-brief-creator.skill.md : ajoute les regles de composition par plateforme, les zones safe detaillees, les styles photographiques par industrie
   - video-ad-producer.skill.md : ajoute les structures narratives detaillees (hook types, CTA variations), les specs techniques par plateforme
   - multi-platform-adapter.skill.md : ajoute les dimensions exactes par placement (Meta Feed, Story, Reel, LinkedIn Feed, Article, Google Display 300x250, 728x90, 160x600, YouTube pre-roll)

--- CHANTIER 2 : Onboarding flow ---

Cree un flow d'onboarding pour les nouveaux utilisateurs :

1. Cree /cockpit/src/components/onboarding/OnboardingWizard.tsx :
   - S'affiche au premier login (verifie un flag `has_completed_onboarding` dans le profil user)
   - 4 etapes :
     a. "Bienvenue sur The Hive OS" — intro rapide (3 phrases + animation)
     b. "Votre equipe d'agents" — presentation de Luna, Sora, Marcus, Milo, Doffy avec leur role
     c. "Creez votre premier projet" — CTA vers /genesis
     d. "Connectez vos outils" — CTA vers /integrations
   - Bouton "Passer" pour skipper
   - Marque `has_completed_onboarding = true` a la fin

2. Ajoute des tooltips contextuels sur les features cles :
   - Premier visit sur /board → tooltip "Cliquez sur une tache pour la lancer avec un agent"
   - Premier visit sur /chat → tooltip "Selectionnez un agent dans la barre laterale"
   - Utilise une librairie legere (react-joyride ou un composant custom simple)

3. Ameliore les empty states :
   - /projects (aucun projet) → message + CTA "Creez votre premier projet en 2 minutes"
   - /analytics (pas de source connectee) → message + CTA "Connectez vos outils marketing"
   - /files (aucun fichier) → message "Les fichiers generes par vos agents apparaitront ici"

--- CHANTIER 3 : RGPD Compliance ---

1. Cookie consent banner :
   - Cree /cockpit/src/components/common/CookieConsent.tsx
   - S'affiche en bas de page au premier visit (verifie localStorage 'cookie-consent')
   - Options : "Accepter tout" | "Refuser" | "Personnaliser"
   - Personnaliser : toggles pour analytics, marketing, fonctionnel
   - Si refuse : ne pas charger de scripts analytics tiers
   - Design : barre fixe en bas, fond blanc, ombre, responsive

2. Droit a l'oubli :
   - Dans AccountSettingsView.tsx, ajoute une section "Supprimer mon compte"
   - Modal de confirmation avec re-saisie email
   - Backend endpoint DELETE /api/user/delete-account :
     a. Supprime TOUTES les donnees : projects, tasks, files, memory, sessions, integrations, tickets
     b. Supprime le compte Supabase Auth
     c. Retourne confirmation
   - authMiddleware obligatoire

3. Export des donnees :
   - Dans AccountSettingsView.tsx, ajoute un bouton "Exporter mes donnees"
   - Backend endpoint GET /api/user/export-data :
     a. Collecte : projets, taches, fichiers (URLs), sessions chat, integrations (sans credentials)
     b. Formate en JSON structure
     c. Retourne en fichier .json telechargeble
   - authMiddleware obligatoire

4. Mets a jour PrivacyPolicyView.tsx :
   - Ajoute la section "Vos droits" (acces, rectification, suppression, portabilite)
   - Ajoute le contact DPO (email)
   - Ajoute la duree de conservation (donnees supprimees 30 jours apres cloture compte)

--- CHANTIER 4 : Export PDF rapports ---

1. Ajoute la capacite d'exporter les rapports en PDF :
   - Dans UIComponentRenderer, pour les types PDF_REPORT et ANALYTICS_DASHBOARD, ajoute un bouton "Exporter PDF"
   - Utilise html2pdf.js (deja dans les dependances) pour convertir le HTML rendu en PDF
   - Le PDF doit inclure : logo Hive OS, date, titre, contenu complet, graphiques
   - Nom du fichier : `hive-os-report-{date}-{type}.pdf`

VERIFICATION :
cd cockpit && npx tsc --noEmit && npm run build
cd backend && npx tsc --noEmit
# Test onboarding : creer un nouveau user → le wizard apparait
# Test RGPD : cliquer "Supprimer mon compte" → confirmer → compte supprime
# Test export : cliquer "Exporter mes donnees" → fichier JSON telecharge
# Test cookie : premier visit → banner apparait → cliquer Refuser → banner disparait
```

---

## PHASE F : LOAD TEST + VALIDATION FINALE

```
Tu es le dev senior de The Hive OS. Derniere phase avant production pour 50 clients.

3 CHANTIERS :

--- CHANTIER 1 : Load test ---

1. Installe Artillery ou k6 pour les tests de charge :
   npm install -g artillery

2. Cree /tests/load-test.yml :
   - Scenario 1 : 10 users simultanees envoient un message chat → verifie que toutes les reponses arrivent < 30s
   - Scenario 2 : 50 users simultanees font des requetes GET (board, files, analytics) → verifie latence < 2s
   - Scenario 3 : 5 users lancent des agents en parallele → verifie pas d'erreur 500

3. Execute les tests :
   - Contre le backend local
   - Note les resultats : latence P50, P95, P99, taux d'erreur
   - Si taux d'erreur > 1% ou P95 > 5s : identifie le bottleneck et optimise

4. Documente les resultats dans /tests/LOAD_TEST_RESULTS.md

--- CHANTIER 2 : Validation end-to-end ---

Cree un script de test end-to-end qui verifie chaque flow critique :

1. Auth flow : login → token → requete authentifiee → logout
2. Genesis flow : creer un projet "Meta Ads" → verifier que les taches sont generees
3. Chat flow : envoyer un message a Luna → verifier qu'on recoit une reponse avec des tools
4. Board flow : changer le status d'une tache → verifier le write-back
5. Files flow : lister les fichiers d'un projet → verifier la reponse
6. Analytics flow : fetch analytics pour une source → verifier le format de reponse
7. Admin flow : acceder au dashboard admin → verifier les 6 tabs
8. Security flow : envoyer une requete sans token → verifier 401
9. Rate limit flow : envoyer 10 requetes rapides → verifier que le rate limit s'active
10. Billing flow : verifier que les limites d'usage sont respectees

--- CHANTIER 3 : Documentation deploiement ---

1. Cree /DEPLOYMENT.md avec :
   - Prerequis (Node 20+, npm, Supabase project, Stripe account)
   - Variables d'environnement requises (liste complete backend + frontend + mcp-bridge)
   - Commandes pour demarrer chaque service
   - Healthcheck URLs
   - Procedure de mise a jour
   - Contacts support

2. Mets a jour le README.md racine avec :
   - Description du projet
   - Architecture
   - Quick start (3 commandes pour lancer en local)
   - Lien vers la documentation

VERIFICATION FINALE :
cd backend && npx tsc --noEmit
cd cockpit && npx tsc --noEmit && npm run build
cd mcp-bridge && npx tsc --noEmit
curl http://localhost:3457/health   # backend healthy
curl http://localhost:3456/health   # mcp-bridge healthy
# Load test passe
# Tous les flows e2e passent
# Documentation complete
```

---

## RECAPITULATIF DES PHASES

| Phase | Contenu | Effort | Score apres |
|-------|---------|--------|-------------|
| **A** | Nettoyage console.log + any + migration files | 3 jours | Securite 100% |
| **B** | Analytics Hub donnees reelles (MCP wiring) | 3 jours | Analytics 100% |
| **C** | Files bulk + Stripe complet | 3 jours | Files 100%, Billing 100% |
| **D** | Doffy Social Media reel (LinkedIn + Instagram) | 2 semaines | Social 80% |
| **E** | Skills enrichis + Onboarding + RGPD + Export PDF | 1 semaine | UX + Legal 100% |
| **F** | Load test + E2E + Documentation | 3 jours | Production-ready |

**Total : 5-6 semaines → 100% PRD V5.0 → 50 clients**
