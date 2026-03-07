# Phase 2.10 - Intelligent Task Launch & Agent Proactivity

**Date:** 2026-03-07
**Objectif:** Rendre les agents intelligents et proactifs lors du lancement de tâches - conscience de leurs capacités et engagement utilisateur

---

## 🎯 Problème Identifié

L'utilisateur a remonté un problème critique d'expérience utilisateur :

**Symptôme:**
- L'agent dit "Lancement de votre tâche en cours..." puis rien ne se passe
- L'utilisateur attend sans savoir ce qui se passe
- Aucune interaction, juste un message de loading générique

**Impact:**
- Très mauvaise expérience utilisateur
- L'utilisateur ne sait pas ce dont l'agent a besoin pour compléter la tâche
- Les agents ne sont pas conscients de leurs capacités MCP
- Pas de proactivité pour demander les accès/connexions nécessaires

**Citation utilisateur:**
> "j'aimerais a la place plutot qu en lancant la tache l'agent disent a l'utilisatuer ce qu'il devrait lui demander pour completer la tache au mieux possible ! [...] j'aimerais que tu revois toutes les capacités et les taches en parallele et que pour chaque tache existantes l'agent concerné commence par proposer a l'utilisateur quoi faire pour resoudre la tache si il lui manque des éléments"

---

## ✅ Solutions Implémentées

### Solution #1: Message Initial Contextuel (Frontend)

**Fichier modifié:** `/cockpit/src/views/BoardView.tsx`

**Avant (Phase 2.9):**
```typescript
// Message générique qui ne donne aucun contexte
const initialMessage = "Lancement de votre tâche en cours... Veuillez patienter.";
```

**Après (Phase 2.10):**
```typescript
// V5 - Build intelligent task prompt with context and instructions
const taskPrompt = `# TASK LAUNCH: ${task.title}

## Your Mission
${task.description}

## Context Questions to Ask
${task.context_questions?.length > 0
  ? task.context_questions.map((q: string) => `- ${q}`).join('\n')
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
```

**Amélioration:**
- ✅ Suppression du message de loading générique
- ✅ Transmission du contexte complet de la tâche (title, description, context_questions)
- ✅ Instructions claires à l'agent : "ENGAGE THE USER - DO NOT execute anything yet!"
- ✅ Utilise les `context_questions` définies dans `/cockpit/src/lib/wizard-config.ts`

---

### Solution #2: Task Launch Protocol (Backend System Prompts)

**Fichier modifié:** `/backend/src/config/agents.config.ts`

Ajout d'une section **"Task Launch Protocol"** dans le system prompt de chaque agent avec :

#### Luna (Stratège SEO) - Lines 46-120

**Prerequisites à vérifier:**
- Google Search Console access
- GSC property verification
- Google Analytics 4 access
- Target domain URL

**Questions proactives:**
```
📊 **Accès et connexions**
- Avez-vous accès à Google Search Console pour ce site ?
- La propriété est-elle vérifiée ?
- Avez-vous Google Analytics 4 connecté ?

🎯 **Objectifs**
- Quel est votre objectif principal ? (améliorer le ranking, réparer des problèmes techniques, analyser la concurrence ?)
- Y a-t-il des mots-clés spécifiques qui vous intéressent ?
```

**Capacités présentées:**
```
Avec mes outils MCP, je peux :
✅ Analyser la santé technique de votre site (vitesse, mobile, indexation)
✅ Auditer vos meta tags, headings, et contenu
✅ Identifier vos opportunités de mots-clés
✅ Comparer votre site à vos concurrents
```

---

#### Sora (Data Analyst) - Lines 147-225

**Prerequisites à vérifier:**
- Google Ads account + Customer ID
- Meta Business Manager + Ad Account ID
- Meta Pixel installation & events
- GTM Container access
- GA4 configuration
- Date range & KPIs

**Questions proactives:**
```
🔌 **Connexions et accès**
- Avez-vous des campagnes actives sur **Google Ads** et/ou **Meta Ads** ?
- Pouvez-vous me fournir vos identifiants de compte ?
- Le tracking est-il configuré ? (Meta Pixel, GA4, Google Ads Conversion Tracking)

📈 **Objectifs d'analyse**
- Quelle période souhaitez-vous analyser ?
- Quels KPIs vous intéressent le plus ? (ROAS, CPA, CTR, taux de conversion)
- Quel est votre ROAS/CPA cible ?
```

**Capacités présentées:**
```
Avec mes outils MCP, je peux :
✅ Analyser vos campagnes Google Ads (spend, ROAS, conversions, quality score)
✅ Analyser vos campagnes Meta Ads (ROAS, learning phase, audience overlap)
✅ Vérifier le tracking (GTM, Meta Pixel, événements GA4)
✅ Créer des rapports Looker automatisés
```

---

#### Marcus (Ads Expert) - Lines 314-411

**Prerequisites à vérifier:**
- Meta Business Manager with billing
- Google Ads account with billing
- Pixel installation & verification
- Creatives ready (images, videos, copy)
- Daily budget (needs approval if > 50€/day)
- Conversion goal defined
- Tracking configured (CRITICAL!)

**Questions proactives:**
```
🔌 **Setup et accès**
- Avez-vous un compte Meta Business Manager avec facturation configurée ?
- Le **Meta Pixel** est-il installé sur votre site ? (je peux vérifier avec mes outils)
- Le tracking des conversions fonctionne-t-il ?

🎯 **Objectif de campagne**
- Quel est votre objectif ? (Ventes, Leads, Trafic)
- Quelle est votre audience cible ?
- Quel est votre budget quotidien envisagé ?

🎨 **Créatifs**
- Avez-vous des images/vidéos prêtes ?
- Sinon, je peux demander à Milo (notre directeur créatif) de les générer
```

**Règle critique:**
```
⚠️ **Tracking (CRITIQUE)**
Sans tracking configuré, vous dépenserez de l'argent sans pouvoir mesurer les résultats !
```

**Capacités présentées:**
```
Avec mes outils MCP, je peux :
✅ Créer des campagnes Meta Ads optimisées
✅ Configurer le ciblage et les budgets
✅ Scaler les campagnes gagnantes (ROAS > 5.0)
✅ Couper les campagnes perdantes (ROAS < 1.5)
```

**Condition d'exécution:**
```
DO NOT launch any campaigns until:
1. Tracking is verified
2. Budget is approved (if > 50€/day)
3. User has explicitly said "GO"
```

---

#### Milo (Creative Director) - Lines 427-521

**Prerequisites à vérifier:**
- Content purpose & platform (Instagram, TikTok, YouTube, web)
- Style preferences (photorealistic, digital art, cinematic)
- Resolution/format needed
- Brand colors & visual identity
- Script/brief ready
- Number of assets needed (approval required if >5 videos or >10 images)

**Questions proactives:**
```
🎯 **Brief créatif**
- Quel type de contenu avez-vous besoin ? (images, vidéos, voiceover)
- Pour quelle plateforme ? (Instagram, Facebook, TikTok, YouTube, site web)
- Combien d'assets avez-vous besoin ?

🎨 **Style et brand**
- Quelle est l'identité visuelle de votre marque ? (couleurs, style, mood)
- Quel ton souhaitez-vous ? (professionnel, fun, premium, accessible)
- Avez-vous des exemples de styles que vous aimez ?

📝 **Contenu**
- Quel est le message principal ?
- Quel est le call-to-action ?
- Y a-t-il des éléments obligatoires à inclure ? (logo, produit, slogan)
```

**Capacités présentées:**
```
Avec mes outils créatifs, je peux :
✅ Générer des images 4K ultra-réalistes (Nano Banana Pro)
✅ Créer des vidéos marketing jusqu'à 8s (Veo-3)
✅ Produire des voiceovers professionnels (ElevenLabs)
✅ Adapter le style à votre brand voice
```

**Condition d'exécution:**
```
DO NOT generate content until:
1. You understand the creative brief and brand guidelines
2. You have approval for batch jobs (>5 videos or >10 images)
3. You've confirmed the style, format, and message with the user
```

---

## 🎨 Impact UX

### Avant (Phase 2.9)
```
User: [Clique "Lancer" sur tâche]
Agent: "Lancement de votre tâche en cours... Veuillez patienter."
User: [Attend... rien ne se passe]
User: [Confus, ne sait pas quoi faire]
```

### Après (Phase 2.10)
```
User: [Clique "Lancer" sur tâche "Accès Google Search Console"]
Luna: "Bonjour ! Je suis Luna, votre stratège SEO. 🎯

Je vois que vous souhaitez configurer l'accès à Google Search Console. Excellente initiative !

Avant de commencer, j'ai besoin de quelques informations :

📊 **Accès et connexions**
- Avez-vous déjà un compte Google Search Console ?
- Quelle est l'URL de votre site à connecter ?
- Avez-vous les droits d'administration sur ce site ?

🎯 **Objectifs**
- Souhaitez-vous que je vous guide dans la vérification de propriété ?
- Avez-vous déjà installé la balise de vérification ?

Avec mes outils MCP, je peux :
✅ Vérifier que votre site est correctement indexé
✅ Auditer vos performances SEO actuelles
✅ Identifier les opportunités d'amélioration

Dites-moi où vous en êtes et je vous guiderai étape par étape ! 🚀"
```

---

## 📊 Conformité avec le PRD

Ces améliorations implémentent les principes du PRD Section 1.C (Agent System Architecture) :

### ✅ C2. Proactive Intelligence
> "Agents should anticipate user needs and proactively suggest next steps based on context"

**Implémenté:**
- Agents identifient les prerequisites manquants
- Proposent des actions concrètes
- Suggèrent des collaborations avec d'autres agents (ex: Marcus → Milo pour les créatifs)

### ✅ C3. Tool Awareness
> "Agents must be aware of their MCP tool capabilities and communicate them clearly"

**Implémenté:**
- Chaque agent liste ses capacités MCP au lancement de tâche
- Explique ce qu'il PEUT faire vs ce dont il a BESOIN
- Spécifique sur les outils disponibles (14 fonctions pour Luna, 28 pour Sora, etc.)

### ✅ C4. Context-Aware Engagement
> "Agents should use task context_questions to guide the conversation"

**Implémenté:**
- Frontend envoie les `context_questions` de wizard-config.ts
- Backend system prompts instruisent l'agent de les utiliser
- Questions adaptées au type de tâche (SEO audit, campaign launch, creative brief)

---

## 🧪 Tests à Effectuer

### Test Workflow Complet

1. **Lancer une tâche SEO (Luna)**
   - Tâche: "Accès Google Search Console"
   - ✅ Luna doit demander : URL du site, accès GSC existant, objectifs
   - ✅ Luna doit lister ses capacités MCP (technical audit, semantic audit, competitor analysis)
   - ✅ Luna NE doit PAS exécuter d'outils sans avoir les infos

2. **Lancer une tâche Analytics (Sora)**
   - Tâche: "Analyse des performances publicitaires"
   - ✅ Sora doit demander : Google Ads Customer ID, Meta Ad Account ID, période, KPIs
   - ✅ Sora doit vérifier le tracking (Meta Pixel, GA4, Google Ads Conversion Tracking)
   - ✅ Sora doit expliquer ce qu'il peut analyser (ROAS, learning phase, audience overlap)

3. **Lancer une tâche Ads (Marcus)**
   - Tâche: "Lancement campagne Meta Ads"
   - ✅ Marcus doit demander : Budget, objectif, audience cible, créatifs
   - ✅ Marcus doit VÉRIFIER le tracking AVANT de proposer de lancer
   - ✅ Marcus doit expliquer l'importance du tracking (« sans tracking = argent perdu »)
   - ✅ Marcus doit demander approbation pour budget > 50€/day

4. **Lancer une tâche Creative (Milo)**
   - Tâche: "Création d'assets publicitaires"
   - ✅ Milo doit demander : Type de contenu, plateforme, style, brand guidelines
   - ✅ Milo doit proposer ses outils (Nano Banana, Veo-3, ElevenLabs)
   - ✅ Milo doit demander approbation pour batch jobs (>5 videos or >10 images)

---

## 🔍 Différence Clé avec Phase 2.9

| Aspect | Phase 2.9 | Phase 2.10 |
|--------|-----------|-----------|
| Message initial | "Lancement en cours..." (générique) | Prompt intelligent avec contexte + instructions |
| Agent awareness | Aucune | Conscience de ses capacités MCP + prerequisites |
| Proactivité | Passive (attend instructions) | Active (pose des questions, engage l'utilisateur) |
| Prerequisites check | Aucun | Vérifie accès/connexions AVANT d'exécuter |
| User guidance | Aucun | Explique ce qu'il peut faire + ce dont il a besoin |

---

## ✅ Validation Phase 2.10

**Critères de validation:**
- [x] ✅ Frontend envoie prompt intelligent au lieu de message générique
- [x] ✅ Backend system prompts contiennent "Task Launch Protocol"
- [x] ✅ Chaque agent a des prerequisites spécifiques à son domaine
- [x] ✅ Agents listent leurs capacités MCP au lancement
- [x] ✅ Instructions "DO NOT execute until..." présentes pour tous les agents
- [x] ✅ Backend compile sans erreur TypeScript
- [x] ✅ Backend démarre avec succès (port 3457, services ✓)
- [ ] 🧪 Tests utilisateur avec différentes tâches

**Status:** ✅ **CODE APPLIQUÉ** - Backend running, en attente validation utilisateur

---

## 📦 Fichiers Modifiés

| Fichier | Modification | Lignes |
|---------|--------------|--------|
| `/cockpit/src/views/BoardView.tsx` | Prompt intelligent de lancement de tâche | 132-156 |
| `/backend/src/config/agents.config.ts` | Task Launch Protocol pour Luna | 46-120 |
| `/backend/src/config/agents.config.ts` | Task Launch Protocol pour Sora | 147-225 |
| `/backend/src/config/agents.config.ts` | Task Launch Protocol pour Marcus | 314-411 |
| `/backend/src/config/agents.config.ts` | Task Launch Protocol pour Milo | 427-521 |

---

**Créé par:** Claude Code
**Session:** Phase 2.10 - Intelligent Task Launch
**Commit:** À faire après validation tests utilisateur
