# SKILLS FRAMEWORK — Agents The Hive OS

**Date :** 2026-04-27
**Objectif :** Definir les skills (expertises metier structurees) que chaque agent doit maitriser pour remplacer une agence marketing digitale a 5K$/mois pour une PME.
**Format :** Chaque skill = une methodologie, un framework de decision ou un protocole d'execution que l'agent suit systematiquement.

---

## PHILOSOPHIE

Un **outil MCP** = ce que l'agent PEUT faire (scraper un site, lancer une campagne).
Un **skill** = ce que l'agent SAIT faire (comment structurer un audit SEO, quand couper une campagne, comment rediger un brief creatif).

Les skills transforment un agent qui "a acces aux outils" en un agent qui "delivre comme un expert senior".

---

## LUNA — The Strategist (SEO, Content, Competition)

### Skill 1 : `seo-audit-complete.skill.md`
**Declencheur :** "audite le SEO de [site]" ou tache de type audit SEO
**Methodologie :**
1. Audit technique (PageSpeed, mobile, HTTPS, indexabilite, Core Web Vitals)
2. Audit on-page (meta titles/descriptions, H1-H6, keyword density, images alt, liens internes)
3. Audit off-page (backlinks profil, domaines referents, ancres)
4. Analyse SERP (position Top 10 pour keywords cibles, featured snippets, PAA)
5. Schema markup validation
6. Score global 0-100 avec priorites d'action
**Output :** Rapport structure avec score, top 5 quick wins, plan d'action 30/60/90 jours

### Skill 2 : `content-strategy-builder.skill.md`
**Declencheur :** "cree une strategie de contenu" ou phase Production SEO
**Methodologie :**
1. Analyser les keywords valides (search volume > seuil, difficulty < seuil)
2. Mapper les keywords aux etapes du funnel (TOFU/MOFU/BOFU)
3. Identifier les content gaps vs concurrents
4. Generer un calendrier editorial 12 semaines (1-3 articles/semaine)
5. Pour chaque article : titre, keyword principal, keywords secondaires, intent, longueur cible, structure H2/H3
6. Prioriser par impact SEO estime (volume x faisabilite)
**Output :** Calendrier editorial JSON + brief par article transmis au PM pour creation de taches Milo

### Skill 3 : `competitor-deep-dive.skill.md`
**Declencheur :** "analyse le concurrent [X]" ou tache analyse concurrentielle
**Methodologie :**
1. Web scraping du site (tech stack, meta, tracking pixels, social links)
2. Analyse SEO (DA, keywords ranking, top pages par trafic estime)
3. Analyse contenu (frequence publication, formats, ton, sujets)
4. Analyse social (presence, engagement rate, frequence)
5. Analyse ads (si visible : Meta Ad Library, Google Ads Transparency)
6. Forces/faiblesses/opportunites (matrice SWOT simplifiee)
7. Recommandations actionnables : "voici 3 choses que [concurrent] fait mieux et comment les surpasser"
**Output :** COMPETITOR_REPORT UI component + recommandations pour Marcus et Milo

### Skill 4 : `landing-page-optimizer.skill.md`
**Declencheur :** "optimise cette landing page" ou "audite cette page"
**Methodologie :**
1. Screenshot multi-device (desktop, mobile, tablet)
2. Above-the-fold analysis (CTA visible ? Headline clair ? Value prop ?)
3. Trust signals (temoignages, logos clients, certifications, SSL)
4. Formulaire audit (nombre de champs, friction, CTA label)
5. Page speed (LCP, FID, CLS)
6. Tracking verification (pixels Meta, GA4, GTM)
7. Score 0-100 avec checklist pass/fail
**Output :** LANDING_PAGE_AUDIT UI component avec recommandations priorisees

### Skill 5 : `cms-content-publisher.skill.md`
**Declencheur :** "publie cet article sur WordPress" ou tache publication
**Methodologie :**
1. Verifier connexion CMS (WordPress/Shopify/Webflow)
2. Optimiser le contenu pour SEO (meta title < 60 chars, meta desc < 160, alt images)
3. Verifier format (H2/H3, paragraphes courts, liens internes)
4. Creer en mode brouillon (JAMAIS publier directement)
5. Soumettre pour approbation utilisateur
6. Une fois approuve : publier + verifier indexation
**Output :** Lien vers le brouillon + checklist SEO validee

---

## SORA — The Analyst (Data, KPIs, Tracking)

### Skill 1 : `performance-report-generator.skill.md`
**Declencheur :** "genere un rapport de performance" ou fin de semaine/mois
**Methodologie :**
1. Collecter metriques GA4 (sessions, users, bounce, conversions, revenue)
2. Collecter metriques ads (spend, ROAS, CPA, CTR, impressions par plateforme)
3. Calculer variations WoW et MoM pour chaque KPI
4. Identifier les 3 meilleures performances + 3 pires
5. Generer insights IA (pourquoi ca a monte/baisse + hypotheses)
6. Formuler 3 recommandations actionnables avec impact estime
7. Score de sante marketing global (0-100)
**Output :** PDF_REPORT UI component avec resume executif, KPIs, graphiques, insights, recommandations

### Skill 2 : `anomaly-detective.skill.md`
**Declencheur :** Variation > 20% detectee sur n'importe quel KPI
**Methodologie :**
1. REGLE D'OR : Suspect un bug avant de celebrer
2. Verifier le tracking (tags fires correctement ? Pas de double comptage ?)
3. Verifier les filtres (spam traffic ? Bot traffic ? Referral spam ?)
4. Verifier les changements recents (nouvelle campagne ? Changement site ? Update algo ?)
5. Comparer avec donnees secondaires (GA4 vs Meta backend vs Google Ads)
6. Si confirme reel : quantifier l'impact business en euros
7. Si bug : alerter immediatement avec diagnostic
**Output :** Alerte structuree avec diagnostic, confiance (%), impact, action recommandee

### Skill 3 : `tracking-setup-auditor.skill.md`
**Declencheur :** "verifie le tracking de [site]" ou tache setup analytics
**Methodologie :**
1. Ad verification (Meta Pixel, GA4, GTM, Google Ads tag, TikTok Pixel, LinkedIn Insight)
2. Verifier les evenements cles (page_view, purchase, add_to_cart, lead, sign_up)
3. Verifier les parametres UTM sur les campagnes actives
4. Verifier le consent mode (RGPD compliance)
5. Cross-check : les conversions Meta matchent-elles GA4 ?
6. Score tracking 0-100 avec liste des tags manquants
**Output :** PIXEL_VERIFICATION UI component + checklist de corrections

### Skill 4 : `attribution-analyst.skill.md`
**Declencheur :** "quel canal performe le mieux ?" ou "comment repartir le budget ?"
**Methodologie :**
1. Collecter les conversions par canal (last-click)
2. Analyser les chemins de conversion (Google Analytics attribution)
3. Identifier les canaux assistants (qui initie le parcours vs qui convertit)
4. Calculer le CPA reel par canal (incluant les assisted conversions)
5. Recommander une repartition budget basee sur la contribution reelle
6. Flaguer les canaux sous-investis (fort ratio assisted/last-click)
**Output :** Tableau attribution multi-canal + recommandation budget pour Marcus

### Skill 5 : `kpi-dashboard-builder.skill.md`
**Declencheur :** "cree un dashboard" ou premiere connexion analytics
**Methodologie :**
1. Identifier les KPIs pertinents selon le scope projet (e-commerce vs lead gen vs SaaS)
2. Configurer les sources de donnees (GA4, Meta, Google Ads, GSC)
3. Definir les periodes de comparaison (WoW, MoM, YoY)
4. Creer les visualisations (KPI cards + line charts + bar charts)
5. Ajouter les benchmarks industrie quand disponibles
6. Configurer les alertes automatiques (seuils anomalie)
**Output :** ANALYTICS_DASHBOARD UI component avec KPIs temps reel

---

## MARCUS — The Trader (Ads, Budget, Scaling)

### Skill 1 : `campaign-launch-checklist.skill.md`
**Declencheur :** "lance une campagne" ou tache creation campagne
**Methodologie :**
1. PRE-FLIGHT CHECK (blocage si incomplet) :
   - Strategie validee par Luna ? (state_flag: strategy_validated)
   - Creatifs prets par Milo ? (state_flag: creatives_ready)
   - Tracking verifie par Sora ? (state_flag: tracking_ready)
   - Budget approuve par utilisateur ? (approval_request)
2. Configuration campagne :
   - Objectif (Conversions, Leads, Traffic, Awareness)
   - Budget journalier + budget total
   - Audience (geo, demo, interests, lookalike)
   - Placements (automatique ou manuel)
   - Encheres (CPA cible, ROAS cible, ou auto)
3. Creatifs :
   - Minimum 3 variations (test A/B/C)
   - Formats requis par placement
   - Textes (headline, description, CTA)
4. Validation avant lancement :
   - Preview de l'annonce
   - Estimation portee/resultats
   - Confirmation utilisateur
5. POST-LANCEMENT : attendre 3-5 jours avant toute optimisation (Learning Phase)
**Output :** APPROVAL_REQUEST UI component + resume campagne

### Skill 2 : `budget-optimizer-weekly.skill.md`
**Declencheur :** Chaque semaine ou "optimise le budget"
**Methodologie :**
1. Collecter ROAS/CPA de chaque campagne active (7 derniers jours)
2. Appliquer la matrice de decision :
   - ROAS > 5.0 → SCALE +20% (maximum +30% pour proteger Learning Phase)
   - 3.0 < ROAS < 5.0 → HOLD (optimiser creatifs)
   - 1.5 < ROAS < 3.0 → OPTIMIZE (tester nouvelles audiences)
   - ROAS < 1.5 → KILL (couper immediatement)
3. Verifier le spend velocity (on track pour le budget mensuel ?)
4. Verifier la fatigue creative (frequence > 3 = changer les creatifs)
5. Recommander la nouvelle repartition budget
6. Soumettre pour approbation si changement > 20%
**Output :** Tableau budget avec actions (SCALE/HOLD/OPTIMIZE/KILL) + cout projete

### Skill 3 : `creative-testing-framework.skill.md`
**Declencheur :** "teste des creatifs" ou campagne en phase OPTIMIZE
**Methodologie :**
1. Definir l'hypothese (quel element tester : visual, headline, CTA, audience ?)
2. Creer les variantes (demander a Milo via recommandation inter-agent)
3. Structure du test :
   - 1 variable a la fois (pas de test multivarie au debut)
   - Budget egal par variante
   - Duree minimum : 7 jours ou 1000 impressions par variante
4. Analyser les resultats :
   - Gagnant = CTR + CVR + CPA significativement meilleur (>10% difference)
   - Pas de gagnant = prolonger le test ou reformuler l'hypothese
5. Implementer le gagnant et archiver les learnings
**Output :** Plan de test + resultats + recommandation + learning documente dans project_memory

### Skill 4 : `scaling-playbook.skill.md`
**Declencheur :** Campagne avec ROAS > 5.0 pendant 7+ jours
**Methodologie :**
1. Verifier la stabilite (ROAS constant ou en baisse ?)
2. Scale horizontal d'abord (nouvelles audiences, nouveaux placements)
3. Scale vertical ensuite (+20% budget par jour max, jamais +50%)
4. Monitorer la frequence (si > 2.5 = saturation audience)
5. Preparer des creatifs de releve (demander a Milo)
6. Seuil d'alerte : si CPA augmente > 15% post-scale → revenir au budget precedent
**Output :** Plan de scaling step-by-step + seuils d'alerte + timeline

### Skill 5 : `cross-platform-budget-allocator.skill.md`
**Declencheur :** "repartis le budget entre les plateformes" ou planning mensuel
**Methodologie :**
1. Collecter les performances par plateforme (Meta, Google, TikTok, LinkedIn)
2. Calculer le ROAS marginal de chaque plateforme
3. Appliquer la regle 70/20/10 :
   - 70% sur le canal le plus performant
   - 20% sur le second canal
   - 10% en test sur un nouveau canal
4. Ajuster selon la saisonnalite (historique du client)
5. Verifier les minimums budget par plateforme (Meta: 5$/jour min, Google: 10$/jour)
**Output :** Tableau repartition avec justification + projection resultats

---

## MILO — The Creative (Copy, Visuals, Video, Audio)

### Skill 1 : `ad-copy-frameworks.skill.md`
**Declencheur :** "ecris une pub" ou tache copywriting
**Methodologie :**
Utiliser le framework le plus adapte selon le contexte :
- **AIDA** (Attention-Interest-Desire-Action) : pour les produits nouveaux
- **PAS** (Problem-Agitate-Solve) : pour les services B2B
- **BAB** (Before-After-Bridge) : pour les transformations
- **4Ps** (Promise-Picture-Proof-Push) : pour les landing pages
- **FOMO** (Fear Of Missing Out) : pour les offres limitees

Pour CHAQUE pub, generer 3 variations :
1. Version emotionnelle (storytelling)
2. Version rationnelle (chiffres/preuves)
3. Version directe (offre claire)

Chaque version = headline (max 40 chars) + primary text (max 125 chars) + CTA
**Output :** 3 variations formatees par plateforme + justification du framework choisi

### Skill 2 : `visual-brief-creator.skill.md`
**Declencheur :** "cree un visuel" ou tache creation visuelle
**Methodologie :**
1. Lire le brand context du projet (couleurs, ton, industrie, cible)
2. Choisir le format selon la plateforme :
   - Meta Feed : 1080x1080 ou 1200x628
   - Meta Story/Reel : 1080x1920
   - LinkedIn : 1200x627
   - Google Display : 300x250, 728x90, 160x600
3. Definir le concept visuel :
   - Hero element (produit, personne, illustration)
   - Texte embedded (headline + CTA)
   - Couleur de fond (marque ou contraste)
4. Generer via Imagen 3.0 avec prompt structure :
   - Style (photorealistic, digital_art, minimalist, professional_photo)
   - Composition (rule of thirds, centered, left-aligned)
   - Mood (confiant, urgence, celebratoire, serein)
5. Verification brand safety :
   - Couleurs coherentes avec la charte ?
   - Texte lisible sur mobile ?
   - Ratio texte < 20% ?
   - Pas de mots interdits ?
**Output :** Image generee + metadata (prompt, style, format) + check brand safety

### Skill 3 : `video-ad-producer.skill.md`
**Declencheur :** "cree une video" ou tache production video
**Methodologie :**
1. Script structure (5-8 secondes) :
   - 0-2s : Hook (question choc ou visuel accrocheur)
   - 2-5s : Probleme + Solution
   - 5-7s : Preuve (chiffre, temoignage, demo)
   - 7-8s : CTA clair
2. Choisir le format :
   - Vertical 9:16 (Reels, Stories, TikTok)
   - Horizontal 16:9 (YouTube, Display)
   - Carre 1:1 (Feed universel)
3. Generer via Veo-3 :
   - Duration : 4s ou 8s
   - Resolution : 1080p
   - FPS : 30
4. Audio optionnel via ElevenLabs :
   - Voix off narrative
   - Musique de fond (sound effect)
**Output :** Video generee + script + voix off optionnelle

### Skill 4 : `multi-platform-adapter.skill.md`
**Declencheur :** "adapte ce contenu pour toutes les plateformes"
**Methodologie :**
A partir d'UN concept creatif, generer les declinaisons :
1. Meta Feed (1080x1080) — texte court, CTA direct
2. Meta Story (1080x1920) — plein ecran, swipe up
3. LinkedIn (1200x627) — ton professionnel, stat/chiffre
4. Google Display (3 formats) — minimaliste, CTA visible
5. Email banner (600x200) — preview-friendly
Chaque adaptation respecte les zones safe de la plateforme :
- Meta Story : pas de texte dans les 60px haut / 100px bas
- LinkedIn : marge gauche 200px pour l'avatar
**Output :** Pack creatif multi-format avec preview par plateforme

### Skill 5 : `brand-voice-guardian.skill.md`
**Declencheur :** Automatique sur chaque creation de contenu
**Methodologie :**
1. Lire le brand context du projet (metadata.tone, metadata.industry, metadata.usp)
2. Verifier chaque creation contre les regles de la marque :
   - Ton coherent ? (formel/informel/expert/amical)
   - Vocabulaire adapte a la cible ?
   - Pas de promesses exagerees ?
   - Coherence avec les creatifs precedents (project_memory)
3. Si incoherence detectee : reformuler avant de livrer
4. Logger le style valide dans project_memory pour reference future
**Output :** Score coherence marque + ajustements si necessaire

---

## DOFFY — The Social Media Manager

### Skill 1 : `social-content-calendar.skill.md`
**Declencheur :** "cree un calendrier social" ou phase Production Social
**Methodologie :**
1. Definir la cadence par plateforme :
   - LinkedIn : 3-5 posts/semaine
   - Instagram : 4-7 posts/semaine (mix feed + stories + reels)
   - Twitter/X : 1-3 posts/jour
   - TikTok : 3-5 videos/semaine
   - Facebook : 3-5 posts/semaine
2. Mixer les types de contenu (regle 80/20) :
   - 80% valeur (education, inspiration, entertainment)
   - 20% promotion (offres, produits, CTA)
3. Piliers de contenu (3-5 themes recurrents lies a l'industrie du client)
4. Pour chaque post : date, heure optimale, plateforme, type, texte, hashtags, media requis
5. Coordonner avec Milo pour les visuels necessaires
**Output :** CONTENT_CALENDAR UI component + taches de creation pour Milo

### Skill 2 : `hashtag-strategist.skill.md`
**Declencheur :** Automatique sur chaque post social
**Methodologie :**
1. 3 categories de hashtags :
   - Haute portee (>1M posts) : 2-3 hashtags pour la decouverte
   - Moyenne portee (10K-1M) : 3-5 hashtags pour l'engagement
   - Niche (<10K) : 2-3 hashtags pour le ciblage precis
2. Maximum : 30 pour Instagram, 5 pour LinkedIn, 3-5 pour Twitter
3. Toujours inclure 1 hashtag de marque
4. Varier les hashtags entre les posts (pas de copier-coller)
5. Tracker les performances par hashtag pour optimiser
**Output :** Set de hashtags categorise + hashtag de marque

### Skill 3 : `engagement-playbook.skill.md`
**Declencheur :** "ameliore l'engagement" ou tache optimisation social
**Methodologie :**
1. Analyser les posts des 30 derniers jours (engagement rate par type/heure/jour)
2. Identifier les patterns gagnants (quel format, quel sujet, quelle heure)
3. Recommandations CTA : questions ouvertes, sondages, "tag un ami"
4. Strategie reponse commentaires :
   - Repondre dans les 2h (idealement 30min)
   - Toujours poser une question en retour
   - Liker tous les commentaires
5. Strategie stories : 3-5 stories/jour avec engagement stickers (polls, quiz, slider)
**Output :** Plan d'engagement hebdomadaire + templates reponses

### Skill 4 : `social-analytics-interpreter.skill.md`
**Declencheur :** "analyse les performances social" ou rapport mensuel
**Methodologie :**
1. Collecter metriques par plateforme :
   - Reach, impressions, engagement rate, follower growth
   - Top 5 posts par engagement
   - Worst 5 posts (pour apprendre)
2. Calculer les benchmarks :
   - Engagement rate industrie (reference)
   - Growth rate vs mois precedent
3. Identifier les tendances :
   - Quel contenu resonne ? (format + sujet + heure)
   - Quel contenu echoue ?
4. Recommandations pour le mois suivant
**Output :** SOCIAL_ANALYTICS UI component + recommandations calendrier

### Skill 5 : `trend-surfer.skill.md`
**Declencheur :** "quelles sont les tendances ?" ou planification hebdomadaire
**Methodologie :**
1. Scanner les tendances par plateforme :
   - Twitter/X : trending topics
   - TikTok : trending sounds/challenges
   - Instagram : trending reels audio
   - LinkedIn : trending articles industrie
2. Filtrer les tendances pertinentes pour le client (industrie + audience)
3. Proposer 2-3 adaptations de tendances au contexte du client
4. Evaluer le timing (est-ce encore trend ou deja passe ?)
5. Brief pour Milo si visuel/video necessaire
**Output :** Liste tendances + 3 idees de posts adaptes + timing recommande

---

## ORCHESTRATEUR — Skills transversaux

### Skill 1 : `inter-agent-handoff.skill.md`
**Declencheur :** Automatique quand un agent genere une recommandation pour un autre
**Methodologie :**
1. Quand Luna recommande un contenu → creer tache pour Milo avec brief structure
2. Quand Sora detecte un CPA eleve → alerter Marcus avec contexte
3. Quand Marcus a besoin de creatifs → creer tache Milo avec specs exactes
4. Quand Milo cree un visuel → informer Marcus pour utilisation campagne
5. Quand Doffy planifie du contenu → creer taches Milo pour les visuels
**Principe :** Aucune recommandation ne doit rester orpheline. Chaque insight = action.

### Skill 2 : `client-report-orchestrator.skill.md`
**Declencheur :** Fin de semaine ou "genere un rapport client"
**Methodologie :**
1. Demander a Sora : rapport performance (KPIs, tendances, anomalies)
2. Demander a Marcus : performance ads (ROAS, spend, optimisations faites)
3. Demander a Luna : progression SEO (rankings, trafic organique, backlinks)
4. Demander a Doffy : performance social (engagement, growth, top posts)
5. Consolider en un rapport unique avec resume executif
6. Score de sante marketing global
**Output :** PDF_REPORT complet multi-agent avec resume, KPIs, insights, plan d'action

### Skill 3 : `onboarding-new-client.skill.md`
**Declencheur :** Nouveau projet cree (post-Genesis)
**Methodologie :**
1. Luna : audit SEO du site client + analyse concurrentielle
2. Sora : audit tracking (pixels, GA4, GTM) + baseline KPIs
3. Marcus : audit campagnes existantes (si actives) + benchmark CPA/ROAS
4. Milo : audit brand (visuels existants, ton, identite)
5. Doffy : audit social (presence, engagement, frequence)
6. PM : generer le plan de taches sur 90 jours
**Output :** Rapport d'onboarding complet + plan 30/60/90 jours

---

## IMPACT SUR LA ROADMAP 50 CLIENTS

### Quand implementer ces skills ?

| Priorite | Skills | Effort | Impact client |
|----------|--------|--------|--------------|
| **P0 (Semaine 3-4)** | `performance-report-generator` (Sora) + `campaign-launch-checklist` (Marcus) + `ad-copy-frameworks` (Milo) | 3 jours | Les 3 skills qui font "wow" en demo |
| **P1 (Semaine 5-6)** | `seo-audit-complete` (Luna) + `content-strategy-builder` (Luna) + `budget-optimizer-weekly` (Marcus) | 3 jours | Delivrables concrets pour les clients |
| **P2 (Semaine 7-8)** | `client-report-orchestrator` (Orchestrateur) + `anomaly-detective` (Sora) + `social-content-calendar` (Doffy) | 3 jours | Automatisation et reporting |
| **P3 (Semaine 9-10)** | Tous les autres skills | 4 jours | Excellence complete |

### Implementation technique

Chaque skill sera :
1. Un fichier `.skill.md` dans `/agents/skills/[agent_name]/`
2. Injecte dans le system prompt de l'agent quand le contexte le requiert
3. Le PM/Orchestrateur detecte le contexte et selectionne les skills pertinents
4. Les outputs de chaque skill sont structures (JSON) pour alimenter les UI components
