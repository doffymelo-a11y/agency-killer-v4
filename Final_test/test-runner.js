/**
 * Test Runner - THE HIVE OS V5.0
 * Tests automatisés end-to-end pour Phase 2.10
 *
 * Usage: node test-runner.js
 */

const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════
// Test Configuration
// ═══════════════════════════════════════════════════════════════

const BACKEND_URL = 'http://localhost:3457';
const PROJECT_ID = 'test-project-phase-2-10'; // ID fictif pour tests

// ═══════════════════════════════════════════════════════════════
// Test Cases
// ═══════════════════════════════════════════════════════════════

const TEST_CASES = {
  luna: [
    {
      id: 'luna-01',
      title: '🔑 Accès Google Search Console',
      description: 'Obtenir les accès à Google Search Console pour analyser les performances SEO organiques du site : vérifier la propriété du domaine, configurer les utilisateurs autorisés, et s\'assurer que les données sont collectées correctement. Installer la balise de vérification si nécessaire (meta tag, fichier HTML, Google Analytics, ou DNS). Documenter le processus pour les futurs utilisateurs.',
      assignee: 'luna',
      phase: 'Audit',
      estimated_hours: 0.5,
      category: 'technical',
      context_questions: [
        'Accès GSC existant ?',
        'Propriété vérifiée ?',
        'Utilisateurs à ajouter ?'
      ]
    },
    {
      id: 'luna-02',
      title: '🔑 Keyword Research',
      description: 'Rechercher et analyser les mots-clés prioritaires pour le référencement naturel : identifier les termes de recherche à fort volume et faible concurrence alignés avec les intentions utilisateur (informationnelle, navigationnelle, transactionnelle, commerciale). Utiliser les outils de keyword research pour extraire le search volume mensuel moyen, le keyword difficulty, le CPC, et le SERP analysis. Catégoriser les keywords par clusters thématiques et priorité stratégique. Documenter les opportunités quick win vs long term.',
      assignee: 'luna',
      phase: 'Audit',
      estimated_hours: 3,
      category: 'strategy',
      context_questions: [
        'Intentions prioritaires ?',
        'Volume recherche cible ?',
        'Difficulté acceptable ?'
      ]
    },
    {
      id: 'luna-03',
      title: '🔍 Analyse Concurrents',
      description: 'Analyser les sites concurrents pour identifier leurs forces SEO et les opportunités de différenciation : étudier leur domain authority, backlinks profile, top ranking keywords, structure du site, qualité du contenu. Utiliser les outils de competitive analysis pour comparer le positionnement sur les mots-clés communs. Identifier les gaps de contenu (sujets couverts par les concurrents mais pas par nous) et les quick wins (keywords où nous sommes proches du top 10). Documenter les meilleures pratiques à reproduire et les faiblesses à exploiter.',
      assignee: 'luna',
      phase: 'Audit',
      estimated_hours: 2,
      category: 'audit',
      context_questions: [
        'Concurrents connus ?',
        'Mots-clés communs ?',
        'Gap à combler ?'
      ]
    },
    {
      id: 'luna-04',
      title: '👤 Création Avatar Client Idéal (ICP)',
      description: 'Créer un profil détaillé de l\'Avatar Client (Ideal Customer Profile) avec : démographie (âge, genre, localisation, revenu), psychographie (valeurs, croyances, aspirations), comportements d\'achat (où achète-t-il, quand, combien dépense-t-il), pain points spécifiques, objections principales, et déclencheurs d\'achat. Documenter ses plateformes préférées (Facebook vs Instagram), formats de contenu favoris (vidéo courte, carrousel, statique), et ton de communication qui résonne avec lui.',
      assignee: 'luna',
      phase: 'Audit',
      estimated_hours: 2,
      category: 'strategy',
      context_questions: [
        'Qui est votre client idéal ?',
        'Quels sont ses problèmes principaux ?',
        'Qu\'est-ce qui le motive à acheter ?'
      ]
    },
    {
      id: 'luna-05',
      title: '🔑 Keyword Research (SEM)',
      description: 'Rechercher et sélectionner les mots-clés Google Ads : analyser le search volume, la concurrence enchères (High/Medium/Low), le CPC moyen, et les tendances saisonnières via Keyword Planner. Catégoriser par intention (Brand, Generic, Competitor, Long-tail) et par funnel (TOFU, MOFU, BOFU). Prioriser selon le Quality Score potentiel et le ROAS estimé. Extraire les top 50-100 keywords avec métriques clés (volume, CPC, compétition). Identifier les opportunités low-hanging fruit (volume décent + concurrence faible).',
      assignee: 'luna',
      phase: 'Audit',
      estimated_hours: 2,
      category: 'research',
      context_questions: [
        'Mots-clés principaux actuels ?',
        'Concurrents à analyser ?',
        'Zones géographiques ?'
      ]
    },
    {
      id: 'luna-06',
      title: '🔍 Analyse Concurrence Ads',
      description: 'Analyser les stratégies publicitaires des concurrents sur Google Ads : identifier leurs campagnes actives (Search, Display, Shopping, Video), mots-clés ciblés, ad copy patterns (USP, CTAs, promotions), landing pages utilisées, et extensions activées. Utiliser les outils de competitive intelligence (Auction Insights, SpyFu, SEMrush) pour estimer leur budget, leur part de voix (Share of Voice), et leur positionnement moyen. Documenter leurs forces (ce qu\'ils font bien) et faiblesses (opportunités à saisir). Identifier les angles créatifs qui fonctionnent dans la niche.',
      assignee: 'luna',
      phase: 'Audit',
      estimated_hours: 2,
      category: 'competitive',
      context_questions: [
        '3 concurrents principaux ?',
        'USP à différencier ?',
        'Budget concurrent estimé ?'
      ]
    }
  ],

  sora: [
    {
      id: 'sora-01',
      title: '📦 Création Compte GTM',
      description: 'Créer un compte Google Tag Manager et configurer le conteneur : créer un compte GTM sous l\'organisation appropriée, créer un conteneur Web (ou Mobile si applicable), installer le code GTM sur toutes les pages du site (snippet dans <head> et <body>). Documenter les identifiants (GTM-XXXXXX). Configurer les permissions utilisateurs (admin, édition, lecture). Organiser le workspace de travail avec convention de nommage claire (tags, triggers, variables). Installer GTM Preview & Debug extension Chrome pour tests futurs.',
      assignee: 'sora',
      phase: 'Setup',
      estimated_hours: 1,
      category: 'technical',
      context_questions: [
        'GTM existant ?',
        'Accès au code source ?',
        'CMS utilisé ?'
      ]
    },
    {
      id: 'sora-02',
      title: '📊 Configuration GA4',
      description: 'Configurer Google Analytics 4 pour le tracking du site : créer une propriété GA4 dans Google Analytics, obtenir le Measurement ID (G-XXXXXXXXXX), configurer les data streams (Web, iOS, Android selon le cas). Activer les enhanced measurements automatiques (scrolls, outbound clicks, site search, video engagement, file downloads). Configurer les paramètres de rétention des données (2 mois vs 14 mois selon RGPD). Activer Google Signals pour le cross-device tracking. Lier à Google Ads et Search Console pour consolidation des données.',
      assignee: 'sora',
      phase: 'Setup',
      estimated_hours: 1.5,
      category: 'technical',
      context_questions: [
        'GA4 existant ?',
        'Domaines à tracker ?',
        'Cross-domain nécessaire ?'
      ]
    },
    {
      id: 'sora-03',
      title: '📱 Meta Pixel + CAPI',
      description: 'Installer le Meta Pixel et configurer les Conversions API pour un tracking serveur robuste : récupérer le Pixel ID depuis Meta Business Manager, installer le base code via GTM ou directement dans le site, configurer les événements standards (PageView, ViewContent, AddToCart, InitiateCheckout, Purchase, Lead). Implémenter le Server-Side Tracking via CAPI (Conversions API) pour contourner les bloqueurs de cookies et iOS 14.5+. Configurer l\'event deduplication avec event_id pour éviter le double comptage. Tester avec Pixel Helper et Events Manager Test Events.',
      assignee: 'sora',
      phase: 'Setup',
      estimated_hours: 3,
      category: 'technical',
      context_questions: [
        'Pixel ID ?',
        'CAPI via partenaire ?',
        'Events à tracker ?'
      ]
    },
    {
      id: 'sora-04',
      title: '🎯 Définition Objectif & KPIs Campagne',
      description: 'Définir les objectifs SMART de la campagne Meta Ads et identifier les KPIs prioritaires : ROAS cible (e-commerce), CPA ou CPL cible (leadgen), taux de conversion, CTR. Établir les seuils de succès et d\'échec pour chaque métrique, documenter les critères qui déclencheront des ajustements (budgétaires, créatifs, ciblage). Créer le calendrier de mesure (J+7, J+14, J+30) et définir les benchmarks sectoriels de référence.',
      assignee: 'sora',
      phase: 'Audit',
      estimated_hours: 1.5,
      category: 'strategy',
      context_questions: [
        'Quel est votre objectif business principal ?',
        'Quel budget mensuel prévu ?',
        'Quels KPIs utilisez-vous actuellement ?'
      ]
    },
    {
      id: 'sora-05',
      title: '📍 Installation & Configuration Pixel Meta',
      description: 'Installer le Pixel Meta sur toutes les pages du site via Google Tag Manager (recommandé) ou directement dans le code source. Configurer les événements standards (PageView, ViewContent, AddToCart, InitiateCheckout, Purchase, Lead, CompleteRegistration). Vérifier le bon fonctionnement avec le Pixel Helper (extension Chrome) et l\'outil de test d\'événements Meta. Activer l\'Enhanced Matching pour améliorer l\'attribution (envoi email hashé, téléphone, nom).',
      assignee: 'sora',
      phase: 'Setup',
      estimated_hours: 2,
      category: 'technical',
      context_questions: [
        'GTM déjà installé ?',
        'Quel CMS (Shopify, WordPress) ?',
        'Événements à tracker ?'
      ]
    },
    {
      id: 'sora-06',
      title: '📈 Monitoring Phase Apprentissage',
      description: 'Surveiller les métriques de la phase d\'apprentissage Meta Ads (Learning Phase) : tracker quotidiennement le nombre de conversions (~50 pour sortir de Learning), le spend rate (vitesse de dépense du budget), les variations de CPA/ROAS, et la fréquence. Documenter les changements importants (éditions créatives, budgets, audiences) qui réinitialisent le Learning. Alerter si le Learning est trop long (>7 jours) ou si les performances sont en chute libre. Proposer des ajustements budgétaires si nécessaire (augmentation progressive pour accélérer le Learning sans le réinitialiser).',
      assignee: 'sora',
      phase: 'Optimization',
      estimated_hours: 2,
      category: 'monitoring',
      context_questions: [
        'Seuil sortie apprentissage ?',
        'Fréquence reporting ?',
        'KPIs prioritaires ?'
      ]
    },
    {
      id: 'sora-07',
      title: '🎯 Définir KPIs (ROAS/CPA cible)',
      description: 'Définir les KPIs et objectifs de performance Google Ads : calculer le ROAS cible basé sur la marge produit (ex: marge 50% → ROAS min 2.0 pour breakeven), ou le CPA cible basé sur la lifetime value client (LTV / taux conversion = CPA max acceptable). Établir les seuils par type de campagne (Search, Shopping, Display) et par phase du funnel (Prospecting vs Remarketing). Documenter les benchmarks sectoriels pour contextualiser les performances. Définir la fréquence de reporting et les actions déclenchées par les seuils (pause, scale, optimize).',
      assignee: 'sora',
      phase: 'Audit',
      estimated_hours: 1,
      category: 'strategy',
      context_questions: [
        'Objectif principal (ventes/leads) ?',
        'ROAS ou CPA cible ?',
        'Marge produit moyenne ?'
      ]
    },
    {
      id: 'sora-08',
      title: '📊 Suivi Conversions + Enhanced Conversions',
      description: 'Configurer le suivi de conversions Google Ads avec Enhanced Conversions pour améliorer l\'attribution : créer les actions de conversion dans Google Ads (Purchase, Lead, Signup, etc.), obtenir les Conversion ID et Labels, implémenter les tags de conversion via GTM. Activer Enhanced Conversions qui envoie des données first-party hashées (email, phone, address) pour améliorer le match rate et contrer les restrictions cookies. Configurer les valeurs de conversion (dynamiques depuis le panier ou statiques). Tester avec Google Tag Assistant et valider dans Google Ads Conversions.',
      assignee: 'sora',
      phase: 'Setup',
      estimated_hours: 2,
      category: 'technical',
      context_questions: [
        'Conversions principales ?',
        'Email collecté au checkout ?',
        'Valeurs dynamiques ?'
      ]
    },
    {
      id: 'sora-09',
      title: '🕷️ Crawl Complet',
      description: 'Effectuer un crawl complet du site avec un outil SEO (Screaming Frog, OnCrawl, Sitebulb) pour identifier les problèmes techniques : erreurs 404, redirections 301/302 en chaîne, contenu dupliqué (title/meta desc identiques), images manquantes, pages orphelines (sans liens entrants), profondeur de clic excessive (>3 clics depuis la home), temps de chargement par page, canonical tags incorrects, hreflang errors. Exporter un rapport structuré avec priorisation des corrections (critique > important > mineur). Documenter l\'architecture du site et les opportunités d\'optimisation de crawl budget.',
      assignee: 'sora',
      phase: 'Audit',
      estimated_hours: 2,
      category: 'audit',
      context_questions: [
        'Outil crawl préféré ?',
        'Nombre pages estimé ?',
        'Erreurs connues ?'
      ]
    },
    {
      id: 'sora-10',
      title: '⚡ Vitesse (Core Web Vitals)',
      description: 'Auditer et optimiser les Core Web Vitals du site (métriques Google officielles pour l\'expérience utilisateur) : mesurer le LCP (Largest Contentful Paint - vitesse affichage contenu principal, cible <2.5s), le FID (First Input Delay - réactivité aux interactions, cible <100ms), et le CLS (Cumulative Layout Shift - stabilité visuelle, cible <0.1). Utiliser PageSpeed Insights, Lighthouse, et les données réelles de Chrome User Experience Report (CrUX). Identifier les causes de lenteur (images non optimisées, JavaScript bloquant, polices web, CSS non minifié, absence de lazy loading, serveur lent, absence de CDN). Proposer un plan d\'optimisation priorisé.',
      assignee: 'sora',
      phase: 'Audit',
      estimated_hours: 2,
      category: 'technical',
      context_questions: [
        'Score actuel ?',
        'Hébergement type ?',
        'CDN en place ?'
      ]
    }
  ],

  marcus: [
    {
      id: 'marcus-01',
      title: '💰 Plan Budget & Allocation par Phase',
      description: 'Établir le plan budgétaire complet avec : budget de test initial (phase d\'apprentissage 7-14 jours), allocation par ad set (combien par audience), budget quotidien vs lifetime, règles de scaling vertical (augmentation progressive du budget quotidien) et horizontal (duplication des winners), seuils de performance pour augmenter/diminuer/stopper un ad set, et budget de réserve pour opportunités. Définir la stratégie CBO (Campaign Budget Optimization) vs ABO (Ad Set Budget Optimization).',
      assignee: 'marcus',
      phase: 'Audit',
      estimated_hours: 1.5,
      category: 'strategy',
      context_questions: [
        'Budget quotidien initial ?',
        'Budget phase de test ?',
        'Objectif scaling à 30 jours ?'
      ]
    },
    {
      id: 'marcus-02',
      title: '🎪 Création Structure Campagne',
      description: 'Créer la structure de campagne dans Ads Manager : choisir entre CBO (Campaign Budget Optimization - Meta gère l\'allocation) ou ABO (Ad Set Budget Optimization - contrôle manuel). Sélectionner l\'objectif de campagne (Ventes, Prospects, Trafic, Engagement) aligné avec le business goal. Configurer le budget quotidien vs lifetime selon la durée de campagne. Définir le calendrier de diffusion et les heures optimales. Choisir les placements (recommandé : Advantage+ Placements pour commencer, puis affiner avec données de performance). Nommer la campagne selon une convention claire (ex: BRAND_YYYY-MM_OBJECTIF_BUDGET).',
      assignee: 'marcus',
      phase: 'Production',
      estimated_hours: 1.5,
      category: 'configuration',
      context_questions: [
        'CBO ou ABO ?',
        'Budget quotidien ou lifetime ?',
        'Placements auto ou manuels ?'
      ]
    },
    {
      id: 'marcus-03',
      title: '🎯 Configuration Ad Sets (Ciblage)',
      description: 'Configurer 3-5 ad sets avec différentes stratégies d\'audience : 1) Broad Targeting (ciblage large avec optimisation Meta), 2) Interest-Based (centres d\'intérêt spécifiques), 3) Lookalike 1-3% (si données clients disponibles), 4) Custom Audiences (remarketing pixel, liste emails, engagement). Pour chaque ad set : définir géographie, âge, genre (ou laisser ouvert), exclure les acheteurs récents pour acquisition, définir le budget par ad set (si ABO). Utiliser des audiences de test de taille suffisante (>500k pour acquisition, >1k pour remarketing) pour sortir rapidement de la phase d\'apprentissage.',
      assignee: 'marcus',
      phase: 'Production',
      estimated_hours: 2,
      category: 'configuration',
      context_questions: [
        'Audiences existantes ?',
        'Centres d\'intérêt cible ?',
        'Données pour Lookalikes ?'
      ]
    },
    {
      id: 'marcus-04',
      title: '✅ QA Pre-Launch Checklist',
      description: 'Exécuter la checklist complète avant lancement : 1) Tester tous les liens de destination (clic sur chaque ad en preview), 2) Vérifier que le Pixel/CAPI track correctement (utiliser Pixel Helper et Events Manager Test), 3) Confirmer que les visuels respectent les règles Meta (pas de texte >20%, pas de contenu choquant/trompeur), 4) Relire tous les textes pour fautes d\'orthographe/grammaire, 5) Vérifier les UTM dans chaque URL, 6) S\'assurer que les moyens de paiement sont valides et sans limite, 7) Vérifier que les audiences ne se chevauchent pas excessivement (Overlap Tool), 8) Confirmer les budgets et calendrier.',
      assignee: 'marcus',
      phase: 'Production',
      estimated_hours: 1,
      category: 'launch',
      context_questions: [
        'Liens testés ?',
        'Visuels respectent règles Meta ?',
        'Tracking fire en preview ?'
      ]
    },
    {
      id: 'marcus-05',
      title: '⚡ Scaling & Ajustements Continus',
      description: 'Scaler les campagnes gagnantes et optimiser les campagnes sous-performantes selon des règles strictes : SCALE si ROAS >5.0 ET hors Learning Phase (augmenter budget +20% max tous les 3 jours pour ne pas réinitialiser le Learning), OPTIMIZE si 1.5 ≤ ROAS ≤ 5.0 (tester nouvelles créatives, ciblages, placements), CUT si ROAS <1.5 pendant >3 jours consécutifs (stopper et réalloquer le budget aux winners). Pour le scaling horizontal : dupliquer les ad sets winners avec légères variations (audience, placement). Monitorer quotidiennement la fréquence (>3 = ad fatigue, besoin de refresh créatif). Documenter tous les changements dans un changelog.',
      assignee: 'marcus',
      phase: 'Optimization',
      estimated_hours: 3,
      category: 'optimization',
      context_questions: [
        'Stratégie scaling (vertical/horizontal) ?',
        'Seuil CPA/ROAS pour killer ?',
        'Budget max quotidien ?'
      ]
    },
    {
      id: 'marcus-06',
      title: '📁 Configuration Ad Groups (STAGs)',
      description: 'Créer les Ad Groups (groupes d\'annonces) avec structure STAG (Single Theme Ad Group) : regrouper 5-20 keywords par thème/intention (vs SKAG obsolète avec 1 seul keyword). Créer un Ad Group par catégorie de produit/service, par intention utilisateur (informationnel, commercial, transactionnel), ou par étape du funnel (awareness, consideration, purchase). Organiser la hiérarchie Campaign > Ad Group > Keywords + Ads selon une logique claire. Définir le budget par Ad Group si nécessaire (recommandé : laisser Google optimiser au niveau campagne avec Smart Bidding). Nommer selon une convention : [Campaign]_[Theme]_[MatchType].',
      assignee: 'marcus',
      phase: 'Setup',
      estimated_hours: 2,
      category: 'structure',
      context_questions: [
        'Catégories produits/services ?',
        'Intentions utilisateur principales ?',
        'Structure SKAG ou STAG ?'
      ]
    },
    {
      id: 'marcus-07',
      title: '💹 Stratégie Enchères',
      description: 'Choisir et configurer la stratégie d\'enchères Google Ads selon l\'objectif et la maturité du compte : pour les comptes avec historique de conversions (>50/mois), utiliser Smart Bidding automatisé (Target CPA pour leads, Target ROAS pour e-commerce, Maximize Conversions avec CPA cible). Pour les nouveaux comptes, commencer avec Manual CPC ou Maximize Clicks pour collecter des données, puis migrer vers Smart Bidding après 30 jours. Configurer les bid adjustments manuels si nécessaire (device, location, time, audience). Définir des CPC max/min pour protéger contre les dérives budgétaires. Documenter le ROAS/CPA baseline pour mesurer l\'amélioration.',
      assignee: 'marcus',
      phase: 'Production',
      estimated_hours: 1,
      category: 'bidding',
      context_questions: [
        'Stratégie préférée ?',
        'CPC max acceptable ?',
        'Historique conversions ?'
      ]
    },
    {
      id: 'marcus-08',
      title: '🚀 Mise en Ligne Campagnes',
      description: 'Lancer les campagnes Google Ads après validation finale : exécuter la QA checklist complète (tracking conversions testé, annonces approuvées, budgets configurés, extensions activées, audiences correctes, exclusions appliquées). Définir l\'heure de lancement optimale (éviter les weekends pour B2B, privilégier en semaine 9h-17h pour accumuler des données rapidement). Activer les campagnes et vérifier immédiatement dans Google Ads interface que le status est "Eligible" (pas "Pending", "Limited by budget", ou "Learning"). Configurer les alertes automatiques (baisse de conversions >30%, augmentation CPA >50%, budget épuisé avant 18h). Monitorer les 24 premières heures de près.',
      assignee: 'marcus',
      phase: 'Production',
      estimated_hours: 0.5,
      category: 'launch',
      context_questions: [
        'Date/heure lancement ?',
        'Budget initial ?',
        'Notifications configurées ?'
      ]
    }
  ],

  milo: [
    {
      id: 'milo-01',
      title: '🎨 Production Visuels (6 variations)',
      description: 'Produire 6 variations visuelles respectant les spécifications Meta (résolution, poids, ratio) : 2 images statiques carrées (1080x1080px, format Feed), 2 carrousels de 3-5 cartes (storytelling produit ou avant/après), et 2 formats verticaux pour Stories/Reels (1080x1920px, 9:16). Respecter la règle des 20% de texte max sur image (ou utiliser Text Overlay Tool). Décliner chaque format en 2 variantes A/B (différence visuelle majeure : couleur de fond, placement produit, avec/sans humain). Optimiser pour mobile-first et s\'assurer que le message est compréhensible sans son.',
      assignee: 'milo',
      phase: 'Production',
      estimated_hours: 6,
      category: 'creative',
      context_questions: [
        'Charte graphique (couleurs, fonts) ?',
        'Produits/services à mettre en avant ?',
        'Références visuelles inspirantes ?'
      ]
    },
    {
      id: 'milo-02',
      title: '✍️ Copywriting Ads (9 variations)',
      description: 'Rédiger 9 variations de copy publicitaire en testant 3 angles créatifs (pain point, bénéfice, urgence) × 3 variations d\'exécution. Structure : Hook accrocheur (première ligne visible sans "voir plus"), Corps développant la promesse avec bullet points ou émojis, CTA clair (Découvrir, Commander, S\'inscrire). Limiter le texte principal à 125 caractères pour maximiser la visibilité mobile. Créer 3 variations de Headline (40 caractères max) et 3 variations de Description (30 caractères max). Intégrer les mots-clés de recherche de l\'audience et adapter le ton selon la plateforme (Facebook plus long, Instagram plus court et visuel).',
      assignee: 'milo',
      phase: 'Production',
      estimated_hours: 4,
      category: 'creative',
      context_questions: [
        'Ton de la marque ?',
        'Bénéfices à mettre en avant ?',
        'Mots-clés obligatoires ?'
      ]
    },
    {
      id: 'milo-03',
      title: '✍️ Rédaction RSA (Annonces)',
      description: 'Rédiger des Responsive Search Ads (RSA) Google Ads avec 15 headlines et 4 descriptions variées : créer 15 headlines uniques (max 30 caractères chacune) testant différents angles (USP, prix, promotion, bénéfice, urgence, social proof, question, CTA direct). Créer 4 descriptions (max 90 caractères chacune) développant la proposition de valeur avec bullet points. Utiliser les Dynamic Keyword Insertion {KeyWord:Default} pour personnaliser. Respecter les best practices : inclure les mots-clés prioritaires dans au moins 3 headlines, varier les CTAs, tester avec/sans prix, utiliser les extensions de caractères spéciaux (®, ™, %). Pinner stratégiquement certains headlines en position 1 pour contrôler le message.',
      assignee: 'milo',
      phase: 'Production',
      estimated_hours: 2,
      category: 'copywriting',
      context_questions: [
        'USP principale ?',
        'Promotions actuelles ?',
        'Ton de marque ?'
      ]
    },
    {
      id: 'milo-04',
      title: '🔗 Configuration Extensions (Assets)',
      description: 'Configurer toutes les extensions Google Ads (Assets) pour maximiser l\'espace publicitaire et le CTR : Sitelinks (4-6 liens vers pages importantes avec descriptions 35 caractères), Callouts (avantages courts 25 caractères : "Livraison Gratuite", "Support 24/7"), Structured Snippets (listes de produits/services/marques), Image Extensions (visuels carrés et paysage 1.91:1), Call Extensions (numéro de téléphone cliquable pour mobile), Location Extensions (adresse Google My Business), Price Extensions (grille de prix avec 8 produits/services). Configurer au niveau campagne ET ad group pour maximiser la couverture. Scheduler les extensions selon les horaires d\'ouverture.',
      assignee: 'milo',
      phase: 'Production',
      estimated_hours: 1.5,
      category: 'assets',
      context_questions: [
        'Pages importantes pour sitelinks ?',
        'Avantages à mettre en accroche ?',
        'Images produits disponibles ?'
      ]
    },
    {
      id: 'milo-05',
      title: '🏷️ Optimisation Balises Title',
      description: 'Optimiser les balises <title> de toutes les pages stratégiques du site pour améliorer le CTR organique dans les SERPs : structurer selon le format optimal [Mot-clé Principal] | [Modificateur] | [Marque] (max 60 caractères pour éviter la troncature). Inclure le mot-clé prioritaire en début de title. Créer des titles uniques pour chaque page (pas de duplication). Utiliser des power words pour augmenter le CTR (Guide, Meilleur, Gratuit, 2026, Comparatif). Pour les pages e-commerce : [Nom Produit] | [Catégorie] - [Prix] | [Marque]. Pour les articles blog : [Titre Article Accrocheur] | [Blog] [Marque]. Tester les titles avec des outils de preview SERP.',
      assignee: 'milo',
      phase: 'Production',
      estimated_hours: 3,
      category: 'seo-content',
      context_questions: [
        'Nombre de pages ?',
        'Templates existants ?',
        'Marque en suffix ?'
      ]
    },
    {
      id: 'milo-06',
      title: '📄 Contenu & Densité',
      description: 'Rédiger du contenu SEO-optimisé respectant les meilleures pratiques de densité et structure : viser 1500-2500 mots pour les pages piliers (cornerstone content), 800-1200 pour les articles blog standard, 300-500 pour les pages produits. Intégrer naturellement le mot-clé principal (densité 1-2%) et les variantes sémantiques (LSI keywords). Structurer avec H1 unique (mot-clé principal), H2 pour sections principales (intégrer keywords secondaires), H3-H6 pour sous-sections. Inclure des bullet points, des tableaux comparatifs, des FAQ (markup schema.org). Optimiser le premier paragraphe (150 mots) avec mot-clé et réponse directe à l\'intention de recherche. Ajouter un CTA clair en fin de contenu.',
      assignee: 'milo',
      phase: 'Production',
      estimated_hours: 8,
      category: 'seo-content',
      context_questions: [
        'Longueur cible ?',
        'Sujets à couvrir ?',
        'FAQ à intégrer ?'
      ]
    }
  ]
};

// ═══════════════════════════════════════════════════════════════
// Test Execution Functions
// ═══════════════════════════════════════════════════════════════

/**
 * Build intelligent task prompt (same as frontend BoardView.tsx)
 */
function buildTaskPrompt(task) {
  return `# TASK LAUNCH: ${task.title}

## Your Mission
${task.description}

## Context Questions to Ask
${task.context_questions.length > 0
    ? task.context_questions.map(q => `- ${q}`).join('\n')
    : '- Prerequisites needed?\n- Access/connections required?\n- Information to gather?'
  }

## INSTRUCTIONS
🎯 **START BY ENGAGING THE USER - DO NOT execute anything yet!**

1. **Greet professionally** and acknowledge the task launch
2. **Assess what's needed**: Based on the context questions above, identify what information, connections, or prerequisites are required
3. **Ask proactive questions**: Engage the user by asking about:
   - What connections/access they have (GA4, GSC, CMS, etc.)
   - What information is available or missing
   - Their goals and constraints for this specific task
4. **Propose an action plan**: Once you understand the situation, propose concrete next steps

**Remember:** You have powerful MCP tools at your disposal. Be specific about what you can do and what you need from the user to proceed.

Let's start! 🚀`;
}

/**
 * Send request to backend V5 API
 */
async function sendTaskRequest(task) {
  const taskPrompt = buildTaskPrompt(task);

  const payload = {
    message: taskPrompt,
    session_id: `test-${task.id}-${Date.now()}`,
    shared_memory: {
      project_id: PROJECT_ID,
      project_name: 'Test Project Phase 2.10',
      project_scope: 'meta_ads', // Default scope for tests
      project_status: 'active',
      current_phase: task.phase,
      state_flags: {
        strategy_validated: false,
        budget_approved: false,
        creatives_ready: false,
        tracking_ready: false,
        ads_live: false
      },
      metadata: {}
    },
    agent_id: task.assignee,
    chat_mode: 'task_execution'
  };

  try {
    const response = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      timeout: 60000 // 60 seconds timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`[ERROR] Failed to send request for task ${task.id}:`, error.message);
    return { error: error.message };
  }
}

/**
 * Validate agent response against criteria
 */
function validateResponse(task, response) {
  const agentMessage = response.agent_response?.message || response.chat_message || '';

  const validation = {
    greets: false,
    asksPrerequisites: false,
    asksProactiveQuestions: false,
    liststMCPCapabilities: false,
    doesNotExecuteImmediately: true, // Assume true unless we find tool calls
    score: 0,
    issues: [],
    strengths: []
  };

  // Check if agent greets
  const greetings = ['bonjour', 'hello', 'hi', 'salut', 'bienvenue'];
  if (greetings.some(g => agentMessage.toLowerCase().includes(g))) {
    validation.greets = true;
    validation.score++;
    validation.strengths.push('Agent salue l\'utilisateur');
  } else {
    validation.issues.push('❌ Agent ne salue pas l\'utilisateur');
  }

  // Check if agent asks about prerequisites/access
  const prerequisiteKeywords = ['accès', 'access', 'connexion', 'connection', 'compte', 'account', 'avez-vous', 'do you have'];
  if (prerequisiteKeywords.some(k => agentMessage.toLowerCase().includes(k))) {
    validation.asksPrerequisites = true;
    validation.score++;
    validation.strengths.push('Agent demande les prérequis/accès');
  } else {
    validation.issues.push('❌ Agent ne demande pas les prérequis/accès');
  }

  // Check if agent asks proactive questions
  const questionMarks = (agentMessage.match(/\?/g) || []).length;
  if (questionMarks >= 3) {
    validation.asksProactiveQuestions = true;
    validation.score++;
    validation.strengths.push(`Agent pose ${questionMarks} questions`);
  } else {
    validation.issues.push(`❌ Agent pose seulement ${questionMarks} questions (< 3)`);
  }

  // Check if agent lists MCP capabilities
  const capabilityKeywords = ['outils', 'tools', 'mcp', 'analyser', 'analyze', 'créer', 'create', 'générer', 'generate', 'je peux', 'i can'];
  if (capabilityKeywords.some(k => agentMessage.toLowerCase().includes(k))) {
    validation.liststMCPCapabilities = true;
    validation.score++;
    validation.strengths.push('Agent liste ses capacités MCP');
  } else {
    validation.issues.push('❌ Agent ne liste pas ses capacités MCP');
  }

  // Check if agent executed tools immediately (BAD)
  if (response.agent_response?.tool_calls || response.tool_calls) {
    validation.doesNotExecuteImmediately = false;
    validation.issues.push('❌ CRITIQUE: Agent a exécuté des outils immédiatement sans engagement');
  } else {
    validation.score++;
    validation.strengths.push('✅ Agent n\'exécute pas d\'outils immédiatement');
  }

  return validation;
}

/**
 * Generate test report for a task
 */
function generateTestReport(task, response, validation) {
  const agentMessage = response.agent_response?.message || response.chat_message || response.error || 'No response';

  return `
### Test ${task.id.toUpperCase()} - ${task.assignee.toUpperCase()} - ${task.title}

**Tâche:** ${task.title}
**Agent:** ${task.assignee}
**Phase:** ${task.phase}
**Context Questions:** ${task.context_questions.join(', ')}

#### Requête Envoyée
\`\`\`json
{
  "message": "[Task Prompt - ${task.title}]",
  "agent_id": "${task.assignee}",
  "chat_mode": "task_execution"
}
\`\`\`

#### Réponse Agent
\`\`\`
${agentMessage}
\`\`\`

#### Validation

| Critère | Résultat | Score |
|---------|----------|-------|
| Salue et confirme | ${validation.greets ? '✅' : '❌'} | ${validation.greets ? '1/1' : '0/1'} |
| Demande prérequis | ${validation.asksPrerequisites ? '✅' : '❌'} | ${validation.asksPrerequisites ? '1/1' : '0/1'} |
| Questions proactives | ${validation.asksProactiveQuestions ? '✅' : '❌'} | ${validation.asksProactiveQuestions ? '1/1' : '0/1'} |
| Liste capacités MCP | ${validation.liststMCPCapabilities ? '✅' : '❌'} | ${validation.liststMCPCapabilities ? '1/1' : '0/1'} |
| N'exécute PAS immédiatement | ${validation.doesNotExecuteImmediately ? '✅' : '❌'} | ${validation.doesNotExecuteImmediately ? '1/1' : '0/1'} |

**Score Total: ${validation.score}/5**

#### Points Forts
${validation.strengths.map(s => `- ${s}`).join('\n')}

#### Problèmes Identifiés
${validation.issues.map(i => `- ${i}`).join('\n')}

---
`;
}

/**
 * Run all tests for an agent
 */
async function runAgentTests(agentName) {
  const testCases = TEST_CASES[agentName];
  if (!testCases || testCases.length === 0) {
    console.log(`No test cases found for agent: ${agentName}`);
    return;
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Running ${testCases.length} tests for ${agentName.toUpperCase()}`);
  console.log(`${'='.repeat(60)}\n`);

  let allReports = `# Tests ${agentName.toUpperCase()} - Phase 2.10\n\n`;
  let totalScore = 0;
  let maxScore = testCases.length * 5;

  for (const task of testCases) {
    console.log(`Testing: ${task.id} - ${task.title}...`);

    const response = await sendTaskRequest(task);
    const validation = validateResponse(task, response);
    const report = generateTestReport(task, response, validation);

    allReports += report;
    totalScore += validation.score;

    console.log(`  Score: ${validation.score}/5`);
    console.log(`  Issues: ${validation.issues.length}`);
  }

  // Add summary
  const percentage = Math.round((totalScore / maxScore) * 100);
  allReports += `\n## RÉSUMÉ ${agentName.toUpperCase()}\n\n`;
  allReports += `- **Tests exécutés:** ${testCases.length}\n`;
  allReports += `- **Score total:** ${totalScore}/${maxScore} (${percentage}%)\n`;
  allReports += `- **Status:** ${percentage >= 80 ? '✅ PASS' : '❌ FAIL'}\n`;

  // Save report
  const reportPath = path.join(__dirname, `${agentName}_results.md`);
  fs.writeFileSync(reportPath, allReports, 'utf8');
  console.log(`\nReport saved: ${reportPath}`);
  console.log(`Total Score: ${totalScore}/${maxScore} (${percentage}%)\n`);
}

/**
 * Main test execution
 */
async function main() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  THE HIVE OS V5.0 - Test Runner Phase 2.10');
  console.log('  Intelligent Task Launch & Agent Proactivity');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Check backend is running
  try {
    const healthCheck = await fetch(`${BACKEND_URL}/health`);
    if (!healthCheck.ok) {
      console.error('❌ Backend is not running! Please start it first.');
      process.exit(1);
    }
    console.log('✅ Backend is running\n');
  } catch (error) {
    console.error('❌ Cannot connect to backend:', error.message);
    console.error('   Make sure backend is running on http://localhost:3457');
    process.exit(1);
  }

  // Run tests for each agent sequentially
  for (const agentName of ['luna', 'sora', 'marcus', 'milo']) {
    await runAgentTests(agentName);

    // Wait 2 seconds between agents
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  ALL TESTS COMPLETED');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('Check the results files in Final_test/ directory:');
  console.log('  - luna_results.md');
  console.log('  - sora_results.md');
  console.log('  - marcus_results.md');
  console.log('  - milo_results.md\n');
}

// Run tests
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
