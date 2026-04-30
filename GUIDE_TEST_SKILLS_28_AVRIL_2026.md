# Guide de Test — Phase 5 Skills (28 avril 2026)

**Status:** 171/171 tests unitaires ✅ → Validation production requise

---

## LUNA — SEO & Stratégie (7 skills)

### 1. `seo-audit-complete`
**Trigger:** Audit SEO complet d'un site
**Prompt test:**
```
Fais un audit SEO complet de https://www.stripe.com
```
**Validation attendue:**
- ✅ Appel MCP `seo-audit` → `full_seo_audit`
- ✅ Rapport avec score global, balises, performance, mobile, accessibility
- ✅ UI Component: `SEO_AUDIT_REPORT`
- ✅ Recommendations actionnables

### 2. `keyword-research`
**Trigger:** Recherche de mots-clés pour un sujet
**Prompt test:**
```
Fais une recherche de mots-clés pour "logiciel CRM pour PME"
```
**Validation attendue:**
- ✅ Appel MCP `seo-audit` → `keyword_research`
- ✅ Liste de mots-clés avec volume, difficulté, CPC
- ✅ UI Component: `KEYWORD_TABLE`

### 3. `competitor-seo-analysis`
**Trigger:** Analyse concurrentielle SEO
**Prompt test:**
```
Analyse le SEO de https://www.hubspot.com vs https://www.salesforce.com
```
**Validation attendue:**
- ✅ Appel MCP `seo-audit` → `full_seo_audit` (×2)
- ✅ Comparaison scores, backlinks, mots-clés
- ✅ UI Component: `COMPETITOR_COMPARISON`

### 4. `backlink-analysis`
**Trigger:** Analyse de profil de backlinks
**Prompt test:**
```
Analyse le profil de backlinks de https://www.shopify.com
```
**Validation attendue:**
- ✅ Appel MCP `seo-audit` → `backlink_check`
- ✅ Nombre de backlinks, domaines référents, qualité
- ✅ UI Component: `BACKLINK_REPORT`

### 5. `content-optimization`
**Trigger:** Optimisation d'un contenu existant
**Prompt test:**
```
Optimise le contenu de ma page /services pour le mot-clé "marketing digital"
```
**Validation attendue:**
- ✅ Lecture du contenu (via CMS connector ou file upload)
- ✅ Suggestions: balises H1/H2, meta, mots-clés LSI
- ✅ UI Component: `CONTENT_OPTIMIZATION_SUGGESTIONS`

### 6. `seo-strategy-plan`
**Trigger:** Plan stratégique SEO sur 3-6 mois
**Prompt test:**
```
Crée un plan stratégique SEO pour mon projet e-commerce mode
```
**Validation attendue:**
- ✅ Analyse du projet (industry, goals, competitors)
- ✅ Roadmap mensuelle (audit, keywords, content, backlinks)
- ✅ UI Component: `STRATEGIC_PLAN`

### 7. `technical-seo-fix`
**Trigger:** Correction technique SEO (robots.txt, sitemap, schema)
**Prompt test:**
```
Vérifie mes paramètres techniques SEO et corrige les erreurs
```
**Validation attendue:**
- ✅ Appel MCP `seo-audit` → `technical_check`
- ✅ Détection erreurs (robots.txt, sitemap, HTTPS, canonicals)
- ✅ UI Component: `TECHNICAL_SEO_CHECKLIST`

---

## SORA — Analytics & Tracking (7 skills)

### 1. `analytics-dashboard-setup`
**Trigger:** Configuration dashboard analytics
**Prompt test:**
```
Configure un dashboard analytics pour mon site e-commerce
```
**Validation attendue:**
- ✅ Appel MCP `gtm` → `create_container` + `create_tags`
- ✅ Tags recommandés: GA4, Meta Pixel, Google Ads
- ✅ UI Component: `ANALYTICS_SETUP_GUIDE`

### 2. `conversion-tracking-setup`
**Trigger:** Mise en place tracking conversions
**Prompt test:**
```
Configure le tracking conversions pour mon formulaire de contact
```
**Validation attendue:**
- ✅ Appel MCP `gtm` → `create_tag` (conversion tracking)
- ✅ Code GTM à installer
- ✅ UI Component: `TRACKING_CODE_SNIPPET`

### 3. `analytics-audit`
**Trigger:** Audit setup analytics existant
**Prompt test:**
```
Audite mon installation Google Analytics et détecte les erreurs
```
**Validation attendue:**
- ✅ Appel MCP `google-analytics` → `get_account_summaries`
- ✅ Détection erreurs: double tracking, tags manquants, config incorrecte
- ✅ UI Component: `ANALYTICS_AUDIT_REPORT`

### 4. `event-tracking-plan`
**Trigger:** Plan de tracking événements personnalisés
**Prompt test:**
```
Crée un plan de tracking pour mon app SaaS (signup, upgrade, churn)
```
**Validation attendue:**
- ✅ Analyse du funnel projet
- ✅ Liste événements recommandés (custom events GA4)
- ✅ UI Component: `EVENT_TRACKING_PLAN`

### 5. `attribution-analysis`
**Trigger:** Analyse attribution multi-touch
**Prompt test:**
```
Analyse l'attribution de mes conversions sur les 30 derniers jours
```
**Validation attendue:**
- ✅ Appel MCP `google-analytics` → `run_report` (attribution data)
- ✅ Modèle attribution: first-click, last-click, linear
- ✅ UI Component: `ATTRIBUTION_CHART`

### 6. `funnel-analysis`
**Trigger:** Analyse de funnel de conversion
**Prompt test:**
```
Analyse mon funnel de conversion: landing → signup → payment
```
**Validation attendue:**
- ✅ Appel MCP `google-analytics` → `run_report` (funnel data)
- ✅ Taux de conversion par étape, drop-offs
- ✅ UI Component: `FUNNEL_VISUALIZATION`

### 7. `ecommerce-tracking-setup`
**Trigger:** Configuration enhanced e-commerce tracking
**Prompt test:**
```
Configure le tracking e-commerce pour ma boutique Shopify
```
**Validation attendue:**
- ✅ Appel MCP `cms-connector` → `get_products`
- ✅ Configuration GA4 Enhanced E-commerce
- ✅ UI Component: `ECOMMERCE_SETUP_GUIDE`

---

## MARCUS — Ads & Budget (7 skills)

### 1. `campaign-creation-full`
**Trigger:** Création campagne ads complète (Meta ou Google)
**Prompt test:**
```
Crée une campagne Meta Ads pour promouvoir mon nouveau produit SaaS (budget 500€)
```
**Validation attendue:**
- ✅ Appel MCP `meta-ads` → `create_campaign` + `create_adset` + `create_ad`
- ✅ Ciblage, créatifs, budget, enchères
- ✅ UI Component: `CAMPAIGN_PREVIEW`

### 2. `campaign-optimization`
**Trigger:** Optimisation campagne ads existante
**Prompt test:**
```
Optimise ma campagne Meta Ads #123456 qui a un CTR faible
```
**Validation attendue:**
- ✅ Appel MCP `meta-ads` → `get_campaign_insights`
- ✅ Recommandations: ajuster ciblage, tester nouveaux créatifs, modifier enchères
- ✅ UI Component: `OPTIMIZATION_RECOMMENDATIONS`

### 3. `ad-performance-report`
**Trigger:** Rapport de performance ads
**Prompt test:**
```
Génère un rapport de performance pour mes campagnes Google Ads du mois dernier
```
**Validation attendue:**
- ✅ Appel MCP `google-ads` → `get_campaigns` + `get_campaign_metrics`
- ✅ Métriques: impressions, clics, CTR, CPC, conversions, ROAS
- ✅ UI Component: `AD_PERFORMANCE_DASHBOARD`

### 4. `budget-allocation`
**Trigger:** Allocation budget cross-plateformes
**Prompt test:**
```
J'ai 2000€/mois à répartir entre Meta Ads et Google Ads, conseille-moi
```
**Validation attendue:**
- ✅ Analyse historique performance (si dispo)
- ✅ Recommandation split budget (ex: 60% Meta, 40% Google)
- ✅ UI Component: `BUDGET_ALLOCATION_CHART`

### 5. `audience-targeting`
**Trigger:** Configuration ciblage audience avancé
**Prompt test:**
```
Crée un ciblage audience pour mon produit B2B SaaS (décideurs tech, entreprises 50-200 employés)
```
**Validation attendue:**
- ✅ Analyse du projet (industry, target audience)
- ✅ Paramètres ciblage: interests, demographics, behaviors
- ✅ UI Component: `AUDIENCE_CONFIG`

### 6. `ad-creative-testing`
**Trigger:** A/B test créatifs publicitaires
**Prompt test:**
```
Configure un test A/B de mes 3 visuels publicitaires sur Meta Ads
```
**Validation attendue:**
- ✅ Appel MCP `meta-ads` → `create_ad` (×3 variants)
- ✅ Configuration split test (même budget, durée test)
- ✅ UI Component: `AB_TEST_SETUP`

### 7. `competitor-ads-analysis`
**Trigger:** Analyse ads concurrents
**Prompt test:**
```
Analyse les publicités de mes concurrents (Stripe, Shopify) sur Meta
```
**Validation attendue:**
- ⚠️ Note: nécessite Meta Ad Library API (public data)
- ✅ Scraping Ad Library pour créatifs concurrents
- ✅ UI Component: `COMPETITOR_ADS_GALLERY`

---

## MILO — Créatif & Assets (7 skills)

### 1. `image-generation`
**Trigger:** Génération d'images IA
**Prompt test:**
```
Génère une image pour ma campagne : "entrepreneur travaillant sur laptop, style moderne, couleurs bleues"
```
**Validation attendue:**
- ✅ Appel MCP `image-generation` → `generate_image`
- ✅ Image HD retournée (URL Cloudinary)
- ✅ UI Component: `IMAGE_GALLERY`

### 2. `video-generation`
**Trigger:** Génération vidéo courte (ex: Synthesia, Runway)
**Prompt test:**
```
Crée une vidéo de 15 secondes présentant mon produit SaaS
```
**Validation attendue:**
- ✅ Appel MCP `video-creation` → `create_video`
- ✅ Vidéo générée (URL)
- ✅ UI Component: `VIDEO_PLAYER`

### 3. `audio-generation`
**Trigger:** Génération voix-off IA (ElevenLabs)
**Prompt test:**
```
Génère une voix-off pour ma vidéo : "Découvrez notre nouveau CRM"
```
**Validation attendue:**
- ✅ Appel MCP `audio-creation` → `text_to_speech`
- ✅ Audio MP3 retourné (URL)
- ✅ UI Component: `AUDIO_PLAYER`

### 4. `copywriting-ads`
**Trigger:** Rédaction copy publicitaire
**Prompt test:**
```
Rédige 5 copies pour mes Meta Ads (produit: CRM pour PME, angle: gain de temps)
```
**Validation attendue:**
- ✅ Analyse du projet (brand voice, target audience)
- ✅ 5 variantes copy (headline + body + CTA)
- ✅ UI Component: `COPY_VARIANTS`

### 5. `landing-page-copy`
**Trigger:** Rédaction landing page complète
**Prompt test:**
```
Rédige une landing page pour mon lancement de produit SaaS
```
**Validation attendue:**
- ✅ Structure complète: headline, subheadline, benefits, features, pricing, FAQ, CTA
- ✅ UI Component: `LANDING_PAGE_PREVIEW`

### 6. `brand-asset-library`
**Trigger:** Création bibliothèque d'assets de marque
**Prompt test:**
```
Crée une bibliothèque d'assets pour mon projet : logo variations, palette couleurs, fonts
```
**Validation attendue:**
- ✅ Génération logo variations (si image-generation dispo)
- ✅ Palette couleurs extraite du projet
- ✅ UI Component: `BRAND_LIBRARY`

### 7. `social-media-content`
**Trigger:** Génération contenu social media (posts + visuels)
**Prompt test:**
```
Crée 5 posts LinkedIn pour promouvoir mon article de blog sur le SEO
```
**Validation attendue:**
- ✅ 5 posts rédigés (adaptés à LinkedIn tone)
- ✅ Suggestions visuels (via image-generation)
- ✅ UI Component: `SOCIAL_POST_GRID`

---

## Méthodologie de Test

### Étape 1 : Préparation
1. **Lancer l'app:**
   ```bash
   cd /Users/azzedinezazai/Documents/Agency-Killer-V4/cockpit
   npm run dev
   ```
2. **Ouvrir le Cockpit:** http://localhost:5173
3. **Connecter un projet test** (ou créer un nouveau)

### Étape 2 : Tests Agent par Agent

Pour chaque agent (Luna, Sora, Marcus, Milo):
1. **Envoyer le prompt de test** dans le chat
2. **Vérifier 5 points:**
   - ✅ Agent correct routé (vérifier la couleur de réponse)
   - ✅ MCP tool call exécuté (vérifier les logs backend)
   - ✅ UI Component affiché correctement
   - ✅ Données réelles retournées (pas de mock)
   - ✅ Write-back commands exécutés (si applicable)

### Étape 3 : Logs à Monitorer

**Backend logs:**
```bash
# Terminal 2
cd /Users/azzedinezazai/Documents/Agency-Killer-V4/backend
npm start
```
Vérifier dans les logs:
- `[Agent Routing] Intent: ... → Agent: luna`
- `[MCP Bridge] Calling tool: seo-audit.full_seo_audit`
- `[Skills] Detected skill: seo-audit-complete`

**Frontend console:**
- Ouvrir DevTools → Console
- Vérifier les appels API vers `/api/chat`
- Vérifier le rendering des UI Components

### Étape 4 : Validation Résultats

Pour chaque skill testé, remplir ce tableau:

| Skill | Agent | Prompt | Routage OK | MCP Call OK | UI Component OK | Données Réelles | Notes |
|-------|-------|--------|------------|-------------|-----------------|-----------------|-------|
| `seo-audit-complete` | Luna | "Audite https://stripe.com" | ✅ | ✅ | ✅ | ✅ | - |
| `keyword-research` | Luna | "Mots-clés CRM" | ✅ | ✅ | ✅ | ✅ | - |
| ... | ... | ... | ... | ... | ... | ... | ... |

---

## Critères de Succès Global

✅ **Phase 5 validée si:**
- **28/28 skills** fonctionnent en production
- **Routage correct** pour 100% des prompts test
- **MCP calls** s'exécutent sans erreur
- **UI Components** s'affichent correctement
- **Temps de réponse** < 10s pour skills simples, < 30s pour skills complexes

❌ **Échec si:**
- > 3 skills ne fonctionnent pas (10% de marge d'erreur)
- Routage incorrect > 20% des cas
- MCP calls timeout > 30% des cas
- UI Components cassés > 10% des cas

---

## Prochaines Étapes après Validation

**Si Phase 5 ✅:**
→ **Phase 6: Production Hardening**
- Rate limiting skills par user tier (free vs pro)
- Caching responses MCP (Redis)
- Monitoring observabilité (Sentry + custom metrics)

**Si Phase 5 ❌:**
→ **Debug & Fix**
- Identifier skills défaillants
- Analyser logs backend + MCP Bridge
- Corriger routing ou appels MCP
- Re-tester

---

**Date:** 28 avril 2026
**Testeur:** Fondateur + Claude Opus 4.5
**Validation:** Manuelle + automatisée (171/171 tests unitaires déjà ✅)
