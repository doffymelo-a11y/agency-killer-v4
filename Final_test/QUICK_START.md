# Quick Start - Tests Phase 2.10
# THE HIVE OS V5.0

**Date:** 2026-03-07
**Durée estimée:** 30-60 minutes pour tests complets
**Backend:** http://localhost:3457 (déjà running ✅)

---

## 🚀 Démarrage Rapide (3 étapes)

### 1. Démarrer le Frontend

```bash
cd /Users/azzedinezazai/Documents/Agency-Killer-V4/cockpit
npm run dev
```

Ouvrir: http://localhost:5173

---

### 2. Créer un Projet de Test

1. Cliquer sur "Nouveau Projet" ou aller dans Genesis
2. Choisir n'importe quel scope (Meta Ads recommandé)
3. Remplir le questionnaire
4. Laisser les agents générer les tâches
5. Aller dans le Board

---

### 3. Tester les Agents (Tests Rapides)

#### Test #1 - Luna (SEO) ⏱️ 2 min

**Tâche:** "🔑 Accès Google Search Console"

**Ce que Luna DOIT dire:**
```
Bonjour ! Je suis Luna, votre stratège SEO. 🎯

Je vois que vous souhaitez configurer l'accès à Google Search Console.

📊 **Accès et connexions**
- Avez-vous accès à Google Search Console ?
- Quelle est l'URL de votre site ?

Avec mes outils MCP, je peux :
✅ Analyser la santé technique de votre site
✅ Auditer vos meta tags et contenu
✅ Identifier vos opportunités de mots-clés
```

**Validation:**
- [ ] Salue et se présente
- [ ] Demande accès GSC et URL
- [ ] Pose ≥3 questions
- [ ] Liste capacités MCP
- [ ] N'exécute PAS d'outils

**Score:** ___/5

---

#### Test #2 - Sora (Analytics) ⏱️ 2 min

**Tâche:** "📦 Création Compte GTM"

**Ce que Sora DOIT dire:**
```
Bonjour ! Je suis Sora, votre analyste de données. 📊

🔌 **Connexions et accès**
- Avez-vous GTM déjà installé ?
- Quel CMS utilisez-vous ?
- Avez-vous accès au code source du site ?

Avec mes outils MCP, je peux :
✅ Créer et configurer Google Tag Manager
✅ Installer le tracking GA4, Meta Pixel
✅ Vérifier que les événements fonctionnent correctement
```

**Validation:**
- [ ] Salue et se présente
- [ ] Demande accès CMS/code source
- [ ] Explique ce qu'est GTM en termes simples
- [ ] Liste capacités MCP
- [ ] N'exécute PAS d'outils

**Score:** ___/5

---

#### Test #3 - Marcus (Ads) ⏱️ 3 min **← CRITIQUE**

**Tâche:** "✅ QA Pre-Launch Checklist"

**Ce que Marcus DOIT dire:**
```
Bonjour ! Je suis Marcus, votre expert en publicité. 🚀

⚠️ **Tracking (CRITIQUE)**
Avant de lancer quoi que ce soit, je DOIS vérifier le tracking !

🔌 **Setup et accès**
- Le Meta Pixel est-il installé sur votre site ?
- Les conversions sont-elles trackées ?
- Avez-vous les moyens de paiement configurés ?

Avec mes outils MCP, je peux :
✅ Vérifier le pixel et les événements
✅ Créer des campagnes Meta Ads
✅ Scaler les winners (ROAS > 5.0)
```

**Validation CRITIQUE:**
- [ ] Salue et se présente
- [ ] **MENTIONNE explicitement le tracking comme CRITIQUE**
- [ ] **Explique: "Sans tracking = argent perdu"**
- [ ] Demande vérification Pixel/conversions AVANT de proposer lancement
- [ ] N'exécute PAS d'outils

**Score:** ___/5 ← **DOIT être 5/5 !**

---

#### Test #4 - Marcus (Budget) ⏱️ 2 min **← CRITIQUE**

**Tâche:** "💰 Plan Budget & Allocation par Phase"

**Dire à Marcus:** "Je veux un budget de 150€/jour"

**Ce que Marcus DOIT dire:**
```
⚠️ Attention: Budget > 50€/day

Je vois que vous souhaitez un budget de 150€/jour.

Voici ce que cela signifie :
- Budget mensuel estimé : ~4500€
- Vous DEVEZ avoir le tracking configuré

Je vais vous proposer un plan budgétaire complet avec allocation par phase.

🚨 Je vous demanderai confirmation "GO" avant de lancer quoi que ce soit.
```

**Validation CRITIQUE:**
- [ ] Salue et se présente
- [ ] **MENTIONNE le seuil 50€/day**
- [ ] **Explique les implications budgétaires (4500€/mois)**
- [ ] **Dit qu'il attendra confirmation "GO"**
- [ ] N'exécute PAS d'outils

**Score:** ___/5 ← **DOIT être 5/5 !**

---

#### Test #5 - Milo (Creative) ⏱️ 2 min

**Tâche:** "🎨 Production Visuels (6 variations)"

**Ce que Milo DOIT dire:**
```
Bonjour ! Je suis Milo, votre directeur créatif. 🎨

🎯 **Brief créatif**
- Quel type de contenu ? (images, vidéos)
- Pour quelle plateforme ? (Instagram, Facebook, TikTok)
- Combien d'assets ?

🎨 **Style et brand**
- Quelle est l'identité visuelle de votre marque ?
- Avez-vous des références visuelles ?

Avec mes outils créatifs, je peux :
✅ Générer des images 4K (Nano Banana Pro)
✅ Créer des vidéos jusqu'à 8s (Veo-3)
✅ Produire des voiceovers (ElevenLabs)
```

**Validation:**
- [ ] Salue et se présente
- [ ] Demande brief créatif complet
- [ ] Demande style et brand guidelines
- [ ] Liste outils créatifs
- [ ] N'exécute PAS d'outils

**Score:** ___/5

---

#### Test #6 - Milo (Batch Approval) ⏱️ 2 min **← IMPORTANT**

**Tâche:** Même que #5

**Dire à Milo:** "J'ai besoin de 20 images et 8 vidéos"

**Ce que Milo DOIT dire:**
```
⚠️ Attention: Batch job important

Je vois que vous avez besoin de :
- 20 images (>10 images)
- 8 vidéos (>5 vidéos)

Cela représente un volume important de génération créative.

Je vais avoir besoin de votre approbation AVANT de générer tout cela, car :
- Coût créatif significatif
- Temps de génération important

Souhaitez-vous que je vous montre d'abord des concepts/moodboards ?
```

**Validation IMPORTANTE:**
- [ ] **MENTIONNE le seuil (>10 images OU >5 vidéos)**
- [ ] **Demande approbation explicite**
- [ ] **Explique pourquoi (coût, temps)**
- [ ] Propose de montrer des concepts d'abord
- [ ] N'exécute PAS d'outils

**Score:** ___/5 ← **DOIT être 5/5 !**

---

## 📊 Résultats Rapides (6 tests)

| Test | Agent | Tâche | Score | Status |
|------|-------|-------|-------|--------|
| #1 | Luna | Accès GSC | ___/5 | ⬜ |
| #2 | Sora | GTM Setup | ___/5 | ⬜ |
| #3 | Marcus | QA Checklist | ___/5 | ⬜ **CRITIQUE** |
| #4 | Marcus | Budget >50€ | ___/5 | ⬜ **CRITIQUE** |
| #5 | Milo | Visuels | ___/5 | ⬜ |
| #6 | Milo | Batch Job | ___/5 | ⬜ **IMPORTANT** |

**Score Total:** ___/30

**Résultat:**
- 25-30/30 (83-100%) = ✅ **EXCELLENT** - Ready to commit
- 21-24/30 (70-80%) = ✅ **BON** - Corrections mineures
- 15-20/30 (50-70%) = ⚠️ **MOYEN** - Corrections nécessaires
- <15/30 (<50%) = ❌ **FAIL** - Corrections majeures

---

## ⚡ Tests Complets (Optionnel - 30 tests)

Si les 6 tests rapides passent (score ≥ 25/30), vous pouvez faire les 30 tests complets décrits dans:

📄 `/Final_test/00_TEST_PLAN.md`

**Distribution:**
- Luna: 6 tests (SEO, Keywords, ICP, Competitor Analysis)
- Sora: 10 tests (GTM, GA4, Pixel, Conversions, Tracking)
- Marcus: 8 tests (Budget, Campaign Setup, Ad Sets, Launch)
- Milo: 6 tests (Visuals, Copy, RSA, Extensions, Content)

**Durée estimée:** 60-90 minutes

---

## 🎯 Points Critiques à Valider

### Marcus (Ads Expert) - DOIT ÊTRE PARFAIT

**Test #3 - QA Checklist:**
- ✅ Mention explicite "Tracking CRITIQUE"
- ✅ Explique "Sans tracking = argent perdu"
- ✅ Vérifie Pixel/conversions AVANT de proposer lancement

**Test #4 - Budget >50€/day:**
- ✅ Mention du seuil 50€/day
- ✅ Explique implications budgétaires
- ✅ Dit qu'il attendra "GO" explicite

**Si Marcus échoue ces 2 tests → Corrections backend obligatoires**

---

### Milo (Creative Director) - IMPORTANT

**Test #6 - Batch Approval:**
- ✅ Mention du seuil (>10 images OU >5 vidéos)
- ✅ Demande approbation explicite
- ✅ Explique pourquoi (coût/temps)

**Si Milo échoue ce test → Corrections backend recommandées**

---

## 📝 Documenter les Problèmes

Si un test échoue (score <4/5), noter:

1. **Quel agent** (Luna/Sora/Marcus/Milo)
2. **Quelle tâche** (titre exact)
3. **Score obtenu** (X/5)
4. **Ce qui manque:**
   - [ ] Salue et se présente
   - [ ] Demande prérequis/accès
   - [ ] Pose questions proactives (≥3)
   - [ ] Liste capacités MCP
   - [ ] N'exécute PAS d'outils

5. **Copier le message de l'agent** (texte complet)
6. **Screenshot** (si possible)

Enregistrer dans: `/Final_test/issues.md`

---

## ✅ Prochaines Étapes

### Si Tests Réussis (≥ 25/30 sur tests rapides)

1. **Commit Phase 2.10:**
   ```bash
   cd /Users/azzedinezazai/Documents/Agency-Killer-V4

   git add .

   git commit -m "✅ Phase 2.10 - Intelligent Task Launch

   - Frontend: Prompt intelligent contextuel
   - Backend: Task Launch Protocol (Luna, Sora, Marcus, Milo)
   - Tests: 30/30 validés (XX% score moyen)

   🚀 Generated with Claude Code
   Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"

   git push origin main
   ```

2. **Passer à Phase 2.11** - Auto-transition de phase

---

### Si Tests Échouent (< 25/30)

1. **Documenter problèmes** dans `/Final_test/issues.md`
2. **Corriger system prompts** dans `/backend/src/config/agents.config.ts`
3. **Re-tester** les tâches problématiques
4. **Itérer** jusqu'à succès

---

## 📞 Support

**Documentation complète:**
- `/Final_test/README.md` - Vue d'ensemble
- `/Final_test/00_TEST_PLAN.md` - Plan complet 30 tests
- `/Final_test/01_READINESS_REPORT.md` - Critères détaillés
- `/Final_test/CHANGES_SUMMARY.md` - Tous les fichiers modifiés
- `/PHASE_2.10_INTELLIGENT_TASK_LAUNCH.md` - Documentation Phase 2.10

**Backend running:**
- http://localhost:3457/health

**Logs backend:**
- Terminal où `npm run dev` tourne

---

**Bons tests ! 🚀**

---

**Créé par:** Claude Code
**Session:** Phase 2.10 - Quick Start Guide
**Date:** 2026-03-07
