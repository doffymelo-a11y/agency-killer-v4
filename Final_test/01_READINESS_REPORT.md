# Rapport de Préparation - Phase 2.10
# Intelligent Task Launch & Agent Proactivity

**Date:** 2026-03-07
**Status:** ✅ READY FOR USER TESTING
**Backend:** Running on http://localhost:3457

---

## 📊 Résumé Exécutif

### ✅ Ce qui a été fait

1. **Frontend - Message Initial Contextuel**
   - Fichier: `/cockpit/src/views/BoardView.tsx` (lines 132-156)
   - ❌ Supprimé le message générique "Lancement en cours..."
   - ✅ Ajouté un prompt intelligent qui transmet:
     - Le titre et la description complète de la tâche
     - Les `context_questions` de wizard-config.ts
     - Des instructions claires: "ENGAGE THE USER - DO NOT execute anything yet!"

2. **Backend - Task Launch Protocol pour TOUS les agents**
   - Fichier: `/backend/src/config/agents.config.ts`
   - ✅ **Luna** (lines 46-120): Protocol SEO avec vérification GSC/GA4
   - ✅ **Sora** (lines 147-225): Protocol Analytics avec vérification tracking
   - ✅ **Marcus** (lines 314-411): Protocol Ads avec vérification tracking CRITIQUE
   - ✅ **Milo** (lines 427-521): Protocol Creative avec approbation batch jobs

3. **Backend - Server Validation**
   - ✅ TypeScript compilation: SUCCESS
   - ✅ Backend running: http://localhost:3457
   - ✅ Health check: PASS
   - ✅ Services: Supabase ✓, Claude API ✓, MCP Bridge ✓

---

## 🎯 Critères de Validation (À Tester par l'Utilisateur)

### Pour CHAQUE tâche lancée, l'agent DOIT:

#### 1. ✅ Saluer et Accuser Réception
**Exemple attendu:**
```
"Bonjour ! Je suis Luna, votre stratège SEO. 🎯

Je vois que vous souhaitez configurer l'accès à Google Search Console. Excellente initiative !"
```

**Comment vérifier:**
- L'agent salue (Bonjour, Hello, etc.)
- L'agent se présente avec son nom et rôle
- L'agent confirme la tâche assignée

---

#### 2. ✅ Évaluer les Prérequis

**Luna (SEO):**
```
📊 **Accès et connexions**
- Avez-vous accès à Google Search Console pour ce site ?
- La propriété est-elle vérifiée ?
- Avez-vous Google Analytics 4 connecté ?
```

**Sora (Analytics):**
```
🔌 **Connexions et accès**
- Avez-vous des campagnes actives sur **Google Ads** et/ou **Meta Ads** ?
- Pouvez-vous me fournir vos identifiants de compte (Google Ads Customer ID, Meta Ad Account ID) ?
- Le tracking est-il configuré ? (Meta Pixel, GA4, Google Ads Conversion Tracking)
```

**Marcus (Ads):**
```
🔌 **Setup et accès**
- Avez-vous un compte Meta Business Manager avec facturation configurée ?
- Le **Meta Pixel** est-il installé sur votre site ? (je peux vérifier avec mes outils)
- Le tracking des conversions fonctionne-t-il ?
```

**Milo (Creative):**
```
🎯 **Brief créatif**
- Quel type de contenu avez-vous besoin ? (images, vidéos, voiceover)
- Pour quelle plateforme ? (Instagram, Facebook, TikTok, YouTube, site web)
- Combien d'assets avez-vous besoin ?
```

**Comment vérifier:**
- L'agent pose des questions spécifiques sur les accès/connexions nécessaires
- Les questions sont adaptées au contexte de la tâche
- Les questions sont compréhensibles pour un utilisateur non-technique

---

#### 3. ✅ Poser des Questions Proactives

**Exemples attendus:**

**Luna:**
- "Quelle est l'URL de votre site ?"
- "Quel est votre objectif principal ? (améliorer le ranking, réparer des problèmes techniques, analyser la concurrence ?)"
- "Y a-t-il des mots-clés spécifiques qui vous intéressent ?"

**Sora:**
- "Quelle période souhaitez-vous analyser ? (derniers 7 jours, 30 jours, autre)"
- "Quels KPIs vous intéressent le plus ? (ROAS, CPA, CTR, taux de conversion)"
- "Quel est votre ROAS/CPA cible ?"

**Marcus:**
- "Quel est votre objectif ? (Ventes, Leads, Trafic)"
- "Quelle est votre audience cible ?"
- "Quel est votre budget quotidien envisagé ?"

**Milo:**
- "Quelle est l'identité visuelle de votre marque ? (couleurs, style, mood)"
- "Quel est le message principal ?"
- "Quel est le call-to-action ?"

**Comment vérifier:**
- L'agent pose AU MOINS 3 questions
- Les questions sont ouvertes et engageantes
- Les questions guident l'utilisateur vers l'action

---

#### 4. ✅ Présenter ses Capacités MCP

**Luna:**
```
Avec mes outils MCP, je peux :
✅ Analyser la santé technique de votre site (vitesse, mobile, indexation)
✅ Auditer vos meta tags, headings, et contenu
✅ Identifier vos opportunités de mots-clés
✅ Comparer votre site à vos concurrents
```

**Sora:**
```
Avec mes outils MCP, je peux :
✅ Analyser vos campagnes Google Ads (spend, ROAS, conversions, quality score)
✅ Analyser vos campagnes Meta Ads (ROAS, learning phase, audience overlap)
✅ Vérifier le tracking (GTM, Meta Pixel, événements GA4)
✅ Créer des rapports Looker automatisés
```

**Marcus:**
```
Avec mes outils MCP, je peux :
✅ Créer des campagnes Meta Ads optimisées
✅ Configurer le ciblage et les budgets
✅ Scaler les campagnes gagnantes (ROAS > 5.0)
✅ Couper les campagnes perdantes (ROAS < 1.5)
```

**Milo:**
```
Avec mes outils créatifs, je peux :
✅ Générer des images 4K ultra-réalistes (Nano Banana Pro)
✅ Créer des vidéos marketing jusqu'à 8s (Veo-3)
✅ Produire des voiceovers professionnels (ElevenLabs)
✅ Adapter le style à votre brand voice
```

**Comment vérifier:**
- L'agent liste explicitement ses outils MCP
- L'agent explique ce qu'il PEUT faire avec ces outils
- L'agent mentionne ses capacités techniques

---

#### 5. ✅ NE PAS Exécuter Sans Confirmation

**Exemples de phrases attendues:**

**Luna:**
```
"Dites-moi ce que vous avez et je vous proposerai un plan d'action concret ! 🚀"
```

**Sora:**
```
"Dites-moi ce que vous avez et je vous proposerai une analyse complète ! 🎯"
```

**Marcus:**
```
"Une fois que j'aurai toutes ces infos, je vous proposerai une stratégie de campagne complète avec preview AVANT de dépenser le moindre euro ! 💰"
```

**Milo:**
```
"Une fois que j'aurai ces infos, je vous proposerai des concepts créatifs concrets ! 🚀"
```

**Comment vérifier:**
- L'agent NE doit PAS afficher de résultats d'outils MCP immédiatement
- L'agent dit clairement qu'il attend les informations de l'utilisateur
- L'agent propose un plan d'action APRÈS avoir compris la situation

---

## ⚠️ Points Critiques à Valider

### Marcus (Ads Expert) - CRITIQUE

**Doit TOUJOURS inclure:**
```
⚠️ **Tracking (CRITIQUE)**
Sans tracking configuré, vous dépenserez de l'argent sans pouvoir mesurer les résultats !
```

**Pour les budgets > 50€/day:**
- Marcus DOIT demander approbation explicite
- Marcus DOIT montrer un preview de la campagne
- Marcus DOIT attendre la confirmation "GO" de l'utilisateur

**Test spécifique:**
1. Lancer la tâche "Création Structure Campagne" avec Marcus
2. Dire qu'on veut un budget de 100€/jour
3. Marcus DOIT demander confirmation et montrer les implications budgétaires

---

### Sora (Data Analyst)

**Doit expliquer les acronymes:**
- GTM = "Google Tag Manager (outil de gestion des balises de tracking)"
- GA4 = "Google Analytics 4 (outil d'analyse d'audience)"
- CAPI = "Conversions API (tracking côté serveur pour contourner les bloqueurs)"
- ROAS = "Return on Ad Spend (revenus générés / dépenses publicitaires)"
- CPA = "Cost Per Acquisition (coût moyen pour acquérir un client)"

**Test spécifique:**
1. Lancer la tâche "Configuration GA4" avec Sora
2. Sora DOIT expliquer ce qu'est GA4 en termes simples
3. Sora NE doit PAS supposer que l'utilisateur connaît les termes techniques

---

### Luna (Strategist)

**Doit utiliser un langage accessible:**
- Éviter le jargon SEO technique sans explication
- Donner des exemples concrets
- Proposer des quick wins et des actions long terme

**Test spécifique:**
1. Lancer la tâche "Keyword Research" avec Luna
2. Luna DOIT demander le secteur et les objectifs en langage simple
3. Luna DOIT expliquer ce qu'est le keyword difficulty

---

### Milo (Creative Director)

**Doit demander approbation pour batch jobs:**
- >5 vidéos OU >10 images = demande d'approbation AVANT génération
- Expliquer les coûts créatifs

**Test spécifique:**
1. Lancer la tâche "Production Visuels (6 variations)" avec Milo
2. Dire qu'on veut 15 images
3. Milo DOIT demander confirmation car > 10 images

---

## 📋 Plan de Test Frontend (Pour l'Utilisateur)

### Prérequis
1. ✅ Backend running: `npm run dev` dans `/backend`
2. ✅ Frontend running: `npm run dev` dans `/cockpit`
3. ✅ Créer un projet de test via Genesis

### Tests Recommandés (30 tests au total)

#### Luna (6 tests)
1. 🔑 Accès Google Search Console
2. 🔑 Keyword Research
3. 🔍 Analyse Concurrents
4. 👤 Création Avatar Client Idéal
5. 🔑 Keyword Research (SEM)
6. 🔍 Analyse Concurrence Ads

#### Sora (10 tests)
1. 📦 Création Compte GTM
2. 📊 Configuration GA4
3. 📱 Meta Pixel + CAPI
4. 🎯 Définition Objectif & KPIs Campagne
5. 📍 Installation & Configuration Pixel Meta
6. 📈 Monitoring Phase Apprentissage
7. 🎯 Définir KPIs (ROAS/CPA cible)
8. 📊 Suivi Conversions + Enhanced Conversions
9. 🕷️ Crawl Complet
10. ⚡ Vitesse (Core Web Vitals)

#### Marcus (8 tests)
1. 💰 Plan Budget & Allocation par Phase
2. 🎪 Création Structure Campagne
3. 🎯 Configuration Ad Sets (Ciblage)
4. ✅ QA Pre-Launch Checklist ← **TEST CRITIQUE**
5. ⚡ Scaling & Ajustements Continus
6. 📁 Configuration Ad Groups (STAGs)
7. 💹 Stratégie Enchères
8. 🚀 Mise en Ligne Campagnes ← **TEST CRITIQUE**

#### Milo (6 tests)
1. 🎨 Production Visuels (6 variations)
2. ✍️ Copywriting Ads (9 variations)
3. ✍️ Rédaction RSA (Annonces)
4. 🔗 Configuration Extensions (Assets)
5. 🏷️ Optimisation Balises Title
6. 📄 Contenu & Densité

### Procédure de Test

**Pour chaque tâche:**

1. **Lancer la tâche depuis le Board**
   - Cliquer sur "Lancer" ou "Continuer"
   - Observer le message initial de l'agent

2. **Vérifier les 5 critères**
   - [ ] Salue et confirme
   - [ ] Demande prérequis/accès
   - [ ] Pose questions proactives (≥ 3)
   - [ ] Liste capacités MCP
   - [ ] N'exécute PAS immédiatement

3. **Noter le score**
   - 5/5 = ✅ PARFAIT
   - 4/5 = ✅ BON (acceptable)
   - 3/5 = ⚠️ MOYEN (corrections mineures nécessaires)
   - 2/5 ou moins = ❌ FAIL (corrections majeures nécessaires)

4. **Documenter les problèmes**
   - Capturer des screenshots si problèmes
   - Noter les phrases problématiques
   - Proposer des améliorations

---

## 📊 Statistiques du Projet

### Tâches Totales Disponibles
- **79 tâches** définies dans wizard-config.ts
- **4 scopes** : Meta Ads, SEM, SEO, Analytics

### Distribution par Agent
- **Luna:** 13 tâches (Stratégie & Contenu)
- **Sora:** 32 tâches (Analytics & Technique)
- **Marcus:** 19 tâches (Exécution Ads)
- **Milo:** 15 tâches (Création Creative)

### Distribution par Phase
- **Audit:** 28 tâches
- **Setup:** 29 tâches
- **Production:** 18 tâches
- **Optimization:** 4 tâches

---

## 🎯 Objectif de Conformité

**À la fin des tests, TOUS les agents doivent atteindre:**

- ✅ **80%+ de score moyen** sur tous les tests
- ✅ **100% sur les points critiques** (Marcus tracking, approbation budgets)
- ✅ **Langage accessible** pour utilisateurs non-techniques
- ✅ **Engagement proactif** sans exécution immédiate

**Conformité 100% avec:**
- PRD V5.0 Section 1.C (Agent System Architecture)
- PRD V5.0 Section 2.6 (Système d'Agents)

---

## 🔄 Prochaines Étapes

1. **L'utilisateur teste** les 30 tâches recommandées via le frontend
2. **Si problèmes identifiés:**
   - Documenter dans Final_test/
   - Corriger les system prompts backend
   - Re-tester les tâches problématiques
3. **Si tout est OK:**
   - Commit Phase 2.10
   - Push vers repo
   - Passer à Phase 2.11 (Auto-transition de phase)

---

## ✅ Assurance Qualité

**Je confirme que:**

1. ✅ Tous les system prompts backend ont été mis à jour avec Task Launch Protocol
2. ✅ Le frontend envoie des prompts intelligents (pas de message générique)
3. ✅ Le backend compile sans erreur TypeScript
4. ✅ Le backend tourne correctement sur localhost:3457
5. ✅ Les 4 agents ont des protocols adaptés à leurs domaines
6. ✅ Les points critiques sont documentés (Marcus tracking, Milo batch approval)
7. ✅ Les critères de validation sont clairs et testables
8. ✅ Un plan de test complet est fourni

**Le système est PRÊT pour vos tests frontend end-to-end.**

---

**Créé par:** Claude Code
**Session:** Phase 2.10 - Final Readiness Report
**Date:** 2026-03-07
