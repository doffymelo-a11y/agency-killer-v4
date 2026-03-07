# Plan de Test Exhaustif - THE HIVE OS V5.0
# Phase 2.10 - Intelligent Task Launch

**Date:** 2026-03-07
**Objectif:** Valider end-to-end que chaque agent est proactif, conscient de ses capacités, et engage intelligemment l'utilisateur
**Scope:** 79 tâches totales (13 Luna + 32 Sora + 19 Marcus + 15 Milo)

---

## 🎯 Critères de Succès

### Pour CHAQUE tâche testée, l'agent DOIT:

1. **Saluer et Accuser Réception**
   - Saluer professionnellement
   - Confirmer la tâche assignée
   - Montrer de l'enthousiasme

2. **Évaluer les Prérequis**
   - Identifier les accès/connexions nécessaires (GSC, GA4, Meta BM, Google Ads, etc.)
   - Demander proactivement si ces accès sont disponibles
   - Utiliser les `context_questions` de la tâche

3. **Poser des Questions Proactives**
   - Questions adaptées au contexte de la tâche
   - Questions compréhensibles pour un utilisateur non-technique
   - Questions qui guident l'utilisateur vers l'action

4. **Présenter ses Capacités MCP**
   - Lister les outils spécifiques disponibles
   - Expliquer ce qu'il PEUT faire (avec outils)
   - Expliquer ce dont il a BESOIN (de l'utilisateur)

5. **NE PAS Exécuter Sans Confirmation**
   - L'agent NE doit PAS exécuter d'outils MCP immédiatement
   - L'agent DOIT d'abord engager et comprendre la situation
   - Instruction claire: "DO NOT execute until..."

---

## 📊 Répartition des Tâches

| Agent | Tâches Totales | Tâches à Tester (Échantillon Représentatif) |
|-------|---------------|----------------------------------------------|
| **LUNA** | 13 | 6 (50%) - Mix SEO, Meta Ads, SEM |
| **SORA** | 32 | 10 (31%) - Mix Analytics, Meta Ads, SEO, SEM |
| **MARCUS** | 19 | 8 (42%) - Mix Meta Ads, SEM, Analytics |
| **MILO** | 15 | 6 (40%) - Mix Meta Ads, SEM, SEO |
| **TOTAL** | **79** | **30 tests** |

---

## 🧪 Méthodologie de Test

### Rôle: Utilisateur Non-Technique

Je me mettrai dans la peau d'un utilisateur qui:
- N'a PAS de connaissances en stratégie numérique
- Ne connaît PAS les acronymes (GTM, CAPI, ROAS, CPA, etc.)
- A besoin d'être guidé étape par étape
- Peut avoir ou non les accès nécessaires

### Format de Test

Pour chaque tâche:

1. **Setup:**
   - Créer le contexte de tâche (titre, description, context_questions)
   - Simuler un utilisateur qui lance la tâche

2. **Exécution:**
   - Envoyer une requête au backend V5 (`POST http://localhost:3457/api/chat`)
   - Payload: task prompt intelligent (comme dans BoardView.tsx)
   - Recevoir la réponse de l'agent

3. **Validation:**
   - ✅ Agent salue et confirme la tâche
   - ✅ Agent demande les prérequis (accès/connexions)
   - ✅ Agent pose des questions adaptées au contexte
   - ✅ Agent liste ses capacités MCP
   - ✅ Agent N'exécute PAS d'outils sans confirmation
   - ❌ Identifier les problèmes (ton trop technique, pas de questions, exécution immédiate, etc.)

4. **Documentation:**
   - Capturer la requête envoyée
   - Capturer la réponse complète de l'agent
   - Noter les points forts et faibles
   - Proposer des corrections si nécessaire

---

## 📋 Tâches Sélectionnées pour Tests

### LUNA (6 tâches)

#### SEO
1. **Accès Google Search Console** (Phase: Audit)
   - Context: "Accès GSC existant ?", "Propriété vérifiée ?", "Utilisateurs à ajouter ?"
   - Attendu: Luna demande l'URL du site, vérifie si GSC est déjà configuré, guide la vérification de propriété

2. **Keyword Research** (Phase: Audit)
   - Context: "Intentions prioritaires ?", "Volume recherche cible ?", "Difficulté acceptable ?"
   - Attendu: Luna demande le secteur, les concurrents, les objectifs SEO

3. **Analyse Concurrents** (Phase: Audit)
   - Context: "Concurrents connus ?", "Mots-clés communs ?", "Gap à combler ?"
   - Attendu: Luna demande les URLs des concurrents, explique son outil de competitive analysis

#### Meta Ads
4. **Création Avatar Client Idéal (ICP)** (Phase: Audit)
   - Context: "Qui est votre client idéal ?", "Quels sont ses problèmes principaux ?", "Qu'est-ce qui le motive à acheter ?"
   - Attendu: Luna pose des questions sur la démographie, psychographie, comportements

#### SEM
5. **Keyword Research (SEM)** (Phase: Audit)
   - Context: "Mots-clés principaux actuels ?", "Concurrents à analyser ?", "Zones géographiques ?"
   - Attendu: Luna demande le secteur, le budget, les objectifs CPC

6. **Analyse Concurrence Ads** (Phase: Audit)
   - Context: "3 concurrents principaux ?", "USP à différencier ?", "Budget concurrent estimé ?"
   - Attendu: Luna explique comment elle analysera les ads concurrents

---

### SORA (10 tâches)

#### Analytics
1. **Création Compte GTM** (Phase: Setup)
   - Context: "GTM existant ?", "Accès au code source ?", "CMS utilisé ?"
   - Attendu: Sora demande l'accès au site, explique ce qu'est GTM en termes simples

2. **Configuration GA4** (Phase: Setup)
   - Context: "GA4 existant ?", "Domaines à tracker ?", "Cross-domain nécessaire ?"
   - Attendu: Sora explique GA4, demande les objectifs de tracking

3. **Meta Pixel + CAPI** (Phase: Setup)
   - Context: "Pixel ID ?", "CAPI via partenaire ?", "Events à tracker ?"
   - Attendu: Sora explique l'importance du tracking, demande si Meta BM est configuré

#### Meta Ads
4. **Définition Objectif & KPIs Campagne** (Phase: Audit)
   - Context: "Quel est votre objectif business principal ?", "Quel budget mensuel prévu ?", "Quels KPIs utilisez-vous actuellement ?"
   - Attendu: Sora pose des questions sur les objectifs (ventes, leads), explique ROAS/CPA

5. **Installation & Configuration Pixel Meta** (Phase: Setup)
   - Context: "GTM déjà installé ?", "Quel CMS (Shopify, WordPress) ?", "Événements à tracker ?"
   - Attendu: Sora vérifie GTM, explique le processus d'installation Pixel

6. **Monitoring Phase Apprentissage** (Phase: Optimization)
   - Context: "Seuil sortie apprentissage ?", "Fréquence reporting ?", "KPIs prioritaires ?"
   - Attendu: Sora explique la Learning Phase, propose un monitoring automatisé

#### SEM
7. **Définir KPIs (ROAS/CPA cible)** (Phase: Audit)
   - Context: "Objectif principal (ventes/leads) ?", "ROAS ou CPA cible ?", "Marge produit moyenne ?"
   - Attendu: Sora explique ROAS/CPA en termes simples, aide à définir des KPIs réalistes

8. **Suivi Conversions + Enhanced Conversions** (Phase: Setup)
   - Context: "Conversions principales ?", "Email collecté au checkout ?", "Valeurs dynamiques ?"
   - Attendu: Sora explique Enhanced Conversions, vérifie le setup Google Ads

#### SEO
9. **Crawl Complet** (Phase: Audit)
   - Context: "Outil crawl préféré ?", "Nombre pages estimé ?", "Erreurs connues ?"
   - Attendu: Sora propose son outil de technical audit, demande l'URL du site

10. **Vitesse (Core Web Vitals)** (Phase: Audit)
    - Context: "Score actuel ?", "Hébergement type ?", "CDN en place ?"
    - Attendu: Sora explique les Core Web Vitals, propose un audit PageSpeed

---

### MARCUS (8 tâches)

#### Meta Ads
1. **Plan Budget & Allocation par Phase** (Phase: Audit)
   - Context: "Budget quotidien initial ?", "Budget phase de test ?", "Objectif scaling à 30 jours ?"
   - Attendu: Marcus demande le budget total, explique la stratégie de scaling

2. **Création Structure Campagne** (Phase: Production)
   - Context: "CBO ou ABO ?", "Budget quotidien ou lifetime ?", "Placements auto ou manuels ?"
   - Attendu: Marcus explique CBO vs ABO en termes simples, recommande une approche

3. **Configuration Ad Sets (Ciblage)** (Phase: Production)
   - Context: "Audiences existantes ?", "Centres d'intérêt cible ?", "Données pour Lookalikes ?"
   - Attendu: Marcus demande l'ICP, propose des stratégies de ciblage

4. **QA Pre-Launch Checklist** (Phase: Production)
   - Context: "Liens testés ?", "Visuels respectent règles Meta ?", "Tracking fire en preview ?"
   - Attendu: **CRITIQUE** - Marcus DOIT vérifier le tracking AVANT de proposer le lancement

5. **Scaling & Ajustements Continus** (Phase: Optimization)
   - Context: "Stratégie scaling (vertical/horizontal) ?", "Seuil CPA/ROAS pour killer ?", "Budget max quotidien ?"
   - Attendu: Marcus explique les règles de scaling (max +20% pour protéger Learning Phase)

#### SEM
6. **Configuration Ad Groups (STAGs)** (Phase: Setup)
   - Context: "Catégories produits/services ?", "Intentions utilisateur principales ?", "Structure SKAG ou STAG ?"
   - Attendu: Marcus explique STAG vs SKAG, propose une structure adaptée

7. **Stratégie Enchères** (Phase: Production)
   - Context: "Stratégie préférée ?", "CPC max acceptable ?", "Historique conversions ?"
   - Attendu: Marcus explique les stratégies d'enchères (Target CPA, Target ROAS, etc.)

8. **Mise en Ligne Campagnes** (Phase: Production)
   - Context: "Date/heure lancement ?", "Budget initial ?", "Notifications configurées ?"
   - Attendu: **CRITIQUE** - Marcus DOIT demander confirmation explicite "GO" pour budget > 50€/day

---

### MILO (6 tâches)

#### Meta Ads
1. **Production Visuels (6 variations)** (Phase: Production)
   - Context: "Charte graphique (couleurs, fonts) ?", "Produits/services à mettre en avant ?", "Références visuelles inspirantes ?"
   - Attendu: Milo demande le brief créatif, explique Nano Banana Pro (génération 4K)

2. **Copywriting Ads (9 variations)** (Phase: Production)
   - Context: "Ton de la marque ?", "Bénéfices à mettre en avant ?", "Mots-clés obligatoires ?"
   - Attendu: Milo demande l'ICP, les pain points, propose 3 angles créatifs

#### SEM
3. **Rédaction RSA (Annonces)** (Phase: Production)
   - Context: "USP principale ?", "Promotions actuelles ?", "Ton de marque ?"
   - Attendu: Milo demande les assets, explique le format RSA (15 headlines, 4 descriptions)

4. **Configuration Extensions (Assets)** (Phase: Production)
   - Context: "Pages importantes pour sitelinks ?", "Avantages à mettre en accroche ?", "Images produits disponibles ?"
   - Attendu: Milo propose des callouts, sitelinks, structured snippets

#### SEO
5. **Optimisation Balises Title** (Phase: Production)
   - Context: "Nombre de pages ?", "Templates existants ?", "Marque en suffix ?"
   - Attendu: Milo demande les mots-clés cibles par page, propose une structure optimisée

6. **Contenu & Densité** (Phase: Production)
   - Context: "Longueur cible ?", "Sujets à couvrir ?", "FAQ à intégrer ?"
   - Attendu: Milo propose une structure de contenu SEO-friendly avec H1-H6, keyword density

---

## ⚠️ Points Critiques à Valider

### MARCUS (Ads Expert)
- **CRITIQUE:** Doit TOUJOURS vérifier le tracking AVANT de proposer de lancer des campagnes
- **CRITIQUE:** Doit demander approbation explicite "GO" pour budgets > 50€/day
- **CRITIQUE:** Doit expliquer: "Sans tracking = argent perdu !"

### SORA (Data Analyst)
- Doit expliquer les acronymes (GTM, GA4, CAPI, ROAS, CPA, etc.) en termes simples
- Doit vérifier les accès (Google Ads Customer ID, Meta Ad Account ID) AVANT de proposer des analyses

### LUNA (Strategist)
- Doit utiliser un langage accessible (pas trop technique)
- Doit proposer des exemples concrets

### MILO (Creative Director)
- Doit demander approbation pour batch jobs (>5 vidéos ou >10 images)
- Doit expliquer ses outils créatifs (Nano Banana, Veo-3, ElevenLabs)

---

## 📝 Format de Documentation des Résultats

Pour chaque test, documenter:

```markdown
### Test #X - [Agent] - [Titre Tâche]

**Tâche:** [titre complet]
**Agent:** [Luna/Sora/Marcus/Milo]
**Phase:** [Audit/Setup/Production/Optimization]
**Context Questions:** [liste]

#### Requête Envoyée
[JSON payload]

#### Réponse Agent
[Texte complet de la réponse]

#### Validation

| Critère | Résultat | Commentaires |
|---------|----------|--------------|
| ✅ Salue et confirme | ✅/❌ | ... |
| ✅ Demande prérequis | ✅/❌ | ... |
| ✅ Questions proactives | ✅/❌ | ... |
| ✅ Liste capacités MCP | ✅/❌ | ... |
| ✅ N'exécute PAS immédiatement | ✅/❌ | ... |

#### Score: X/5

#### Problèmes Identifiés
- [Liste des problèmes]

#### Corrections Nécessaires
- [Liste des corrections à apporter]
```

---

## 🔄 Processus de Test

1. **Créer un projet de test** dans Supabase
2. **Pour chaque tâche:**
   - Envoyer la requête au backend
   - Analyser la réponse
   - Documenter les résultats
3. **Identifier les patterns de problèmes**
4. **Appliquer les corrections** au backend system prompts si nécessaire
5. **Re-tester** les tâches problématiques
6. **Documenter** les résultats finaux

---

## 🎯 Objectif Final

À la fin des tests, TOUS les agents doivent:
- ✅ Être conscients de leurs capacités MCP
- ✅ Poser des questions proactives et pertinentes
- ✅ Utiliser un langage accessible pour utilisateurs non-techniques
- ✅ Guider l'utilisateur vers les bonnes actions
- ✅ NE PAS exécuter d'outils sans avoir compris la situation

**Conformité 100% avec le PRD V5.0 Section 1.C (Agent System Architecture)**
