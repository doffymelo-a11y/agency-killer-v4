# 🎯 CATÉGORISATION DES TÂCHES SORA

## RÈGLE DE SÉCURITÉ
**Les agents NE SE CONNECTENT JAMAIS directement aux sites des utilisateurs (code source, CMS, serveur).**

---

## ✅ TYPE A: TÂCHES EXÉCUTABLES (Sora fait le travail)

Sora peut exécuter ces tâches car il a accès via MCP/API aux plateformes EXTERNES (pas le site de l'utilisateur).

### OUTILS ACTUELLEMENT DISPONIBLES (selon workflow)
1. ✅ **GA4** (Google Analytics 4) - via Data Fetcher
2. ✅ **GSC** (Google Search Console) - via Data Fetcher
3. ✅ **Check Integrations** - via Tool

### OUTILS À AJOUTER (MCP servers nécessaires)
4. 🆕 **GTM** (Google Tag Manager) - Lire/Écrire tags, variables, déclencheurs
5. 🆕 **Google Ads** (Business Manager) - Lire campagnes, conversions, audiences
6. 🆕 **Meta Ads** (Business Manager) - Lire campagnes, ad sets, insights, pixels
7. 🆕 **Looker Studio** - Créer dashboards, connecter sources de données

---

### LISTE DES TÂCHES EXÉCUTABLES

#### 1. ANALYSE & KPIS (avec données des plateformes)
| Tâche | Outils MCP requis | Action Sora |
|-------|------------------|-------------|
| 🎯 Définir KPIs (ROAS/CPA cible) | GA4 + Meta Ads/Google Ads | Lire historique performances → Calculer ROAS actuel → Recommander objectifs |
| 📊 Analyse Performance & Recommandations | GA4 + Meta Ads/Google Ads | Segmenter par audience, creative, placement → Identifier winners/losers |
| 📈 Monitoring Phase Apprentissage | Meta Ads | Surveiller Learning Phase → Alerter si Learning Limited |
| 🔍 Analyse Termes de Recherche | Google Ads | Lire Search Terms Report → Identifier termes non pertinents → Recommander exclusions |
| ⭐ Analyse Quality Score | Google Ads | Lire Quality Score par keyword → Identifier mots-clés <5 → Recommander optimisations |

#### 2. TRACKING & ANALYTICS (lecture/configuration plateformes externes)
| Tâche | Outils MCP requis | Action Sora |
|-------|------------------|-------------|
| 🔗 Liaison GA4 + GSC | GA4 + GSC | Vérifier liaison existante → Guider configuration si manquante → Tester import données |
| 📊 Configuration GA4 | GA4 | Vérifier Enhanced Measurement → Configurer Data Retention (14 mois) → Créer conversions |
| ⚙️ Réglages GA4 | GA4 | Activer Google Signals → Configurer Data Sharing → Vérifier timezone/devise |
| 🚫 Filtres Internes | GA4 | Créer filtres IP → Tester exclusion trafic interne |
| 👥 Création Audiences (Google Ads) | Google Ads + GA4 | Créer audiences remarketing (visiteurs, paniers abandonnés, acheteurs) |
| 🏷️ Balise Configuration GA4 (dans GTM) | GTM + GA4 | Créer balise Google Tag → Configurer Measurement ID → Activer pageviews auto |
| 🔗 Conversion Linker (dans GTM) | GTM | Créer balise Conversion Linker → Configurer link decoration → Ordonner avant autres tags |
| 👆 Suivi des Clics (dans GTM) | GTM | Créer déclencheurs (email, phone, CTA) → Créer balises GA4 Event |
| 📝 Suivi Formulaires (dans GTM) | GTM + GA4 | Créer déclencheur Form Submission → Balise generate_lead |
| 🔍 Google Ads Conversion (dans GTM) | GTM + Google Ads | Créer balise Google Ads Conversion → Configurer Conversion ID/Label |

#### 3. DASHBOARDING & VISUALISATION
| Tâche | Outils MCP requis | Action Sora |
|-------|------------------|-------------|
| 📊 Connexion Looker Studio | Looker Studio + GA4 + Google Ads + GSC | Créer rapport → Connecter sources → Configurer blending |
| 📈 Dashboarding | Looker Studio + GA4 | Créer dashboard avec KPIs (Revenue, ROAS, CPA) → Configurer email auto |

#### 4. AUDITS (lecture seule, pas de modification site)
| Tâche | Outils MCP requis | Action Sora |
|-------|------------------|-------------|
| 🔑 Accès Google Search Console | GSC | Vérifier propriété → Lister utilisateurs → Vérifier erreurs couverture |
| 📊 Accès GA4 | GA4 | Vérifier tracking installé → Analyser historique trafic → Identifier tendances |
| 🔬 GTM Preview Mode (test) | GTM | Guider utilisation Preview Mode → Interpréter résultats tests |
| 📡 GA4 DebugView (test) | GA4 | Analyser events en temps réel → Vérifier paramètres → Détecter erreurs |

---

## 🧑‍🏫 TYPE B: TÂCHES DE GUIDAGE (Sora guide l'utilisateur)

Sora NE PEUT PAS exécuter ces tâches car elles nécessitent un accès direct au site/serveur/code de l'utilisateur.

**Rôle de Sora:** Assistant expert qui fournit des instructions step-by-step, checklist, code à copier-coller.

### LISTE DES TÂCHES DE GUIDAGE

#### 1. ACCÈS TECHNIQUES (Sora ne peut pas se connecter)
| Tâche | Pourquoi guidage seulement | Ce que Sora fait |
|-------|---------------------------|------------------|
| 🏢 Audit & Setup Business Manager | Accès admin BM requis | Checklist des éléments à vérifier → Captures d'écran demandées → Interprétation |
| 🔧 Accès CMS | Accès admin CMS (WP/Shopify) | Lister les accès nécessaires → Expliquer où les trouver |
| 🔒 Sécurité SSL | Accès hébergeur/serveur | Guider installation Let's Encrypt → Checklist vérification HTTPS |

#### 2. INSTALLATION CODE/PIXELS (Sora ne modifie pas le site)
| Tâche | Pourquoi guidage seulement | Ce que Sora fait |
|-------|---------------------------|------------------|
| 📍 Installation Pixel Meta | Accès code source/GTM | Fournir code pixel → Expliquer où le coller (GTM ou <head>) → Guider test avec Pixel Helper |
| 🔗 Configuration CAPI | Accès serveur/plateforme e-com | Expliquer 3 méthodes (native, partenaire, custom) → Guider déduplication event_id |
| 🌐 Configuration Domaine | Accès BM + DNS | Guider vérification domaine → Expliquer configuration 8 événements prioritaires |
| 📊 Configuration Événements Meta | Accès Events Manager | Guider création événements custom → Mapping événement → audience |
| ✅ Vérification Global Site Tag | Accès site | Guider test avec Google Tag Assistant → Interpréter résultats |
| 📱 Meta Pixel + CAPI | Accès code + serveur | Fournir code client-side → Expliquer setup CAPI (Stape.io, Elevar) → Guider déduplication |
| 💼 LinkedIn/TikTok Tags | Accès code/GTM | Fournir code tags → Expliquer installation GTM → Tester avec extensions |

#### 3. CONFIGURATION TECHNIQUE SITE (Sora ne touche pas au site)
| Tâche | Pourquoi guidage seulement | Ce que Sora fait |
|-------|---------------------------|------------------|
| 📦 Création Compte GTM | Accès code source | Guider création compte → Fournir snippet code → Expliquer où coller (head + body) |
| 🍪 Choix CMP (Consent Banner) | Accès code source + budget | Comparer CMP (Cookiebot, Axeptio, OneTrust) → Recommander selon budget → Guider installation |
| ✅ Consent Mode v2 | Accès GTM + CMP | Fournir code Consent Mode → Expliquer configuration états (denied/granted) → Guider test |
| 🔍 Audit Data Layer | Accès code source (console JS) | Guider ouverture Console → Expliquer commande "dataLayer" → Interpréter résultats |
| 📋 Specs Développeur | Documentation technique | Créer specs techniques (format JSON) → Exemples code dataLayer.push() → Estimer charge dev |
| 🛒 Events E-commerce | Accès plateforme e-com | Fournir specs 8 events GA4 → Exemples code → Recommander plugins (Shopify/WooCommerce) |
| 💰 Variables Data Layer | Accès code source | Lister variables requises → Fournir structure JSON → Expliquer où placer le code |

#### 4. OPTIMISATIONS TECHNIQUES SITE (Sora ne modifie pas le site)
| Tâche | Pourquoi guidage seulement | Ce que Sora fait |
|-------|---------------------------|------------------|
| 🕷️ Crawl Complet | Télécharger Screaming Frog | Expliquer comment installer Screaming Frog → Guider lancement crawl → Interpréter rapport |
| ⚡ Vitesse (Core Web Vitals) | Accès code/hébergeur | Analyser PageSpeed Insights → Prioriser optimisations (images WebP, minify CSS) → Guider implémentation |
| 📱 Compatibilité Mobile | Accès code/CSS | Guider test Mobile-Friendly → Identifier problèmes (viewport, tailles boutons) → Recommander fixes CSS |
| 🔗 Structure URLs | Accès CMS/serveur | Recommander structure SEO-friendly → Guider configuration canonicals → Expliquer redirections |
| 🗺️ Sitemap & Robots.txt | Accès serveur/CMS | Guider génération sitemap.xml → Fournir template robots.txt → Expliquer soumission GSC |

---

## 🛠️ MCP SERVERS À AJOUTER POUR SORA

Pour que Sora puisse exécuter les tâches TYPE A, il faut ajouter ces MCP servers à son workflow:

### 1. **GTM (Google Tag Manager) MCP Server**
**Fonctions nécessaires:**
- `gtm_list_tags()` - Lister tous les tags du conteneur
- `gtm_create_tag(type, parameters, triggers)` - Créer un nouveau tag
- `gtm_create_trigger(type, conditions)` - Créer un déclencheur
- `gtm_create_variable(type, name, value)` - Créer une variable
- `gtm_publish_version(name, description)` - Publier une version du conteneur
- `gtm_preview_mode(url)` - Activer le mode preview (retourne lien debug)

**Tâches débloquées:**
- 🏷️ Balise GA4
- 🔗 Conversion Linker
- 👆 Suivi Clics
- 📝 Suivi Formulaires
- 🔍 Google Ads Conversion

---

### 2. **Google Ads (Business Manager) MCP Server**
**Fonctions nécessaires:**
- `google_ads_get_campaigns(account_id)` - Lister campagnes
- `google_ads_get_conversions(account_id)` - Lister conversions configurées
- `google_ads_get_search_terms(campaign_id, date_range)` - Rapport termes de recherche
- `google_ads_get_keywords_quality_score(ad_group_id)` - Quality Score par keyword
- `google_ads_create_audience(name, description, rules)` - Créer audience remarketing
- `google_ads_get_performance_report(account_id, metrics, date_range)` - Rapport performances

**Tâches débloquées:**
- 🎯 Définir KPIs (SEM)
- 👥 Création Audiences
- 🔍 Analyse Termes de Recherche
- ⭐ Analyse Quality Score
- 📊 Analyse Performance

---

### 3. **Meta Ads (Business Manager) MCP Server**
**Fonctions nécessaires:**
- `meta_ads_get_campaigns(account_id)` - Lister campagnes
- `meta_ads_get_ad_sets(campaign_id)` - Lister ad sets
- `meta_ads_get_ads(ad_set_id)` - Lister ads
- `meta_ads_get_insights(object_id, metrics, date_range)` - Insights/performances
- `meta_ads_get_pixel_events(pixel_id)` - Événements pixel configurés
- `meta_ads_check_learning_phase(ad_set_id)` - Statut Learning Phase
- `meta_ads_get_audience_overlap(audience_ids)` - Chevauchement audiences

**Tâches débloquées:**
- 🎯 Définir KPIs (Meta Ads)
- 📈 Monitoring Phase Apprentissage
- 📊 Analyse Performance
- 🌐 Configuration Domaine (lecture seule)

---

### 4. **Looker Studio MCP Server**
**Fonctions nécessaires:**
- `looker_create_report(name)` - Créer nouveau rapport
- `looker_add_data_source(report_id, source_type, credentials)` - Ajouter source (GA4, Google Ads, GSC)
- `looker_create_chart(report_id, type, metrics, dimensions)` - Créer graphique
- `looker_create_scorecard(report_id, metric, comparison)` - Créer scorecard KPI
- `looker_blend_data_sources(sources, join_key)` - Fusionner sources
- `looker_schedule_email(report_id, recipients, frequency)` - Configurer envoi auto
- `looker_get_report_url(report_id)` - Obtenir URL du rapport

**Tâches débloquées:**
- 📊 Connexion Looker Studio
- 📈 Dashboarding

---

## 📝 MISE À JOUR DU SYSTEM PROMPT SORA

Ajouter cette section au system prompt:

```markdown
## 🎯 CATÉGORIES DE TÂCHES

### TYPE A: TÂCHES EXÉCUTABLES
Tu peux EXÉCUTER ces tâches car tu as accès aux plateformes via MCP:
- ✅ GA4 (Google Analytics 4)
- ✅ GSC (Google Search Console)
- ✅ GTM (Google Tag Manager)
- ✅ Google Ads (Business Manager)
- ✅ Meta Ads (Business Manager)
- ✅ Looker Studio (Dashboarding)

**Pour ces tâches, tu dis:**
> "✅ Je vais m'en occuper pour toi. Laisse-moi accéder à [plateforme]..."
> [APPELER MCP TOOL]
> "✅ C'est fait ! J'ai configuré [X]. Voici ce que j'ai mis en place:"

**Exemples:**
- 🏷️ Balise GA4 (dans GTM) → Tu crées le tag via `gtm_create_tag()`
- 👥 Création Audiences → Tu crées via `google_ads_create_audience()`
- 📊 Dashboarding → Tu crées le dashboard via `looker_create_report()`

---

### TYPE B: TÂCHES DE GUIDAGE
Tu NE PEUX PAS exécuter ces tâches car elles nécessitent:
- Accès code source du site de l'utilisateur
- Accès CMS (WordPress, Shopify, etc.)
- Accès serveur/hébergeur
- Installation manuelle de pixels/scripts

**Pour ces tâches, tu dis:**
> "🧑‍🏫 Je vais te guider étape par étape pour faire cette configuration.
>
> **Étape 1:** [Action à faire]
> **Étape 2:** [Action à faire]
> [...]
>
> Dis-moi quand tu as terminé l'étape [X] et je t'aide pour la suite ! 🚀"

**Exemples:**
- 📍 Installation Pixel Meta → Tu fournis le code, tu expliques où le coller
- 🛒 Events E-commerce → Tu fournis les specs dev, tu ne codes pas
- 🍪 Choix CMP → Tu recommandes des outils, l'utilisateur installe
- 📦 Création GTM → Tu guides l'installation, tu ne touches pas au code site

---

### COMMENT SAVOIR SI C'EST TYPE A OU B ?

**TYPE A (EXÉCUTABLE) si:**
- La tâche concerne uniquement des plateformes externes (GA4, GTM, Google Ads, Meta Ads, Looker)
- Tu as un MCP tool disponible pour cette plateforme
- Aucune modification du code source du site n'est requise

**TYPE B (GUIDAGE) si:**
- La tâche nécessite d'accéder au code HTML/JS du site
- La tâche nécessite d'installer un plugin CMS
- La tâche nécessite un accès serveur/hébergeur
- La tâche nécessite de coller un script/pixel dans le <head>

**En cas de doute:**
→ Demande-toi: "Est-ce que je peux faire ça SANS toucher au site de l'utilisateur ?"
→ OUI = TYPE A (exécutable)
→ NON = TYPE B (guidage)
```

---

## 🔄 WORKFLOW N8N MODIFIÉ POUR SORA

### Nœuds à ajouter:

```
[Analyst Brain]
    ↓
[Tool: Check Integrations] ← EXISTANT ✅
    ↓
[Tool: GTM Manager] ← 🆕 NOUVEAU
    ↓
[Tool: Google Ads Manager] ← 🆕 NOUVEAU
    ↓
[Tool: Meta Ads Manager] ← 🆕 NOUVEAU
    ↓
[Tool: Looker Studio Manager] ← 🆕 NOUVEAU
    ↓
[Format UI Response]
```

---

## 📋 CHECKLIST IMPLÉMENTATION

### Étape 1: Ajouter MCP Servers
- [ ] Installer **GTM MCP Server** (ou créer custom n8n nodes)
- [ ] Installer **Google Ads MCP Server**
- [ ] Installer **Meta Ads MCP Server**
- [ ] Installer **Looker Studio MCP Server**

### Étape 2: Configurer les Tools dans Analyst Brain
- [ ] Ajouter tool `gtm_manager` avec fonctions (create_tag, create_trigger, etc.)
- [ ] Ajouter tool `google_ads_manager` avec fonctions (get_campaigns, create_audience, etc.)
- [ ] Ajouter tool `meta_ads_manager` avec fonctions (get_insights, check_learning_phase, etc.)
- [ ] Ajouter tool `looker_manager` avec fonctions (create_report, add_data_source, etc.)

### Étape 3: Mettre à jour System Prompt
- [ ] Ajouter section "CATÉGORIES DE TÂCHES" (TYPE A vs TYPE B)
- [ ] Ajouter exemples de réponses pour TYPE A (exécutable)
- [ ] Ajouter exemples de réponses pour TYPE B (guidage)

### Étape 4: Tester
- [ ] Test TYPE A: Créer une balise GA4 dans GTM via MCP
- [ ] Test TYPE A: Créer un dashboard Looker Studio
- [ ] Test TYPE B: Demander installation Pixel Meta (guidage)
- [ ] Test TYPE B: Demander configuration CAPI (guidage)

---

**FIN DE LA CATÉGORISATION**
