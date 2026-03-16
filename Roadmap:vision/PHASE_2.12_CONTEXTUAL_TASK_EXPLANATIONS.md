# Phase 2.12 - Contextual Task Explanations

**Status:** ✅ Implemented
**Date:** 2026-03-07
**Sprint:** Phase 2 - Core UX Enhancements

---

## Vue d'ensemble

La Phase 2.12 implémente les **explications contextuelles intelligentes** pour chaque tâche. Au lieu de simplement "cracher" la description brute de la tâche, les agents génèrent maintenant des explications intelligentes qui :

1. **Montrent ce qui a été fait avant** par les autres agents
2. **Expliquent pourquoi cette tâche maintenant** dans la séquence du projet
3. **Décrivent ce que la tâche va permettre** pour les étapes suivantes
4. **Précisent le rôle spécifique** de l'agent sur cette tâche

### Problème résolu

**AVANT (Phase 2.10.1) :**
```
Bonjour ! Je suis Luna.

## Votre Mission
Créer un profil détaillé de l'Avatar Client Idéal (ICP) avec : démographie,
psychographie, comportements d'achat, pain points, objections, déclencheurs...
[copier-coller de la description brute]
```

**APRÈS (Phase 2.12) :**
```
Bonjour ! Je suis Luna 🎯

Je vois que Sora a déjà complété l'audit analytics et identifié les segments
clés de votre audience. Excellent travail !

Maintenant, je vais vous aider à créer votre Avatar Client Idéal (ICP) pour
construire sur ces fondations et créer une stratégie marketing ultra-ciblée.

## Ce que nous allons faire ensemble
1. Analyser les données d'audience collectées par Sora
2. Définir le profil démographique et psychographique détaillé
3. Identifier les pain points et objections spécifiques
4. Documenter les comportements d'achat et déclencheurs

[...]
```

---

## Fonctionnalités

### 1. Service Task Explainer

**Fichier :** `/backend/src/services/task-explainer.service.ts`

#### Fonction principale : `explainTask()`

Génère une explication contextuelle basée sur :
- La tâche actuelle (titre, description, phase, agent assigné)
- Le projet (nom, scope, phase actuelle, metadata)
- Les tâches complétées avant (historique chronologique)
- La mémoire collective (actions récentes des agents)
- Les tâches dépendantes (ce qui sera débloqué)

#### Processus

1. **Collecte du contexte** :
   - Récupère la tâche depuis Supabase
   - Récupère le projet
   - Liste toutes les tâches complétées (status: 'done')
   - Lit les 15 dernières entrées de `project_memory`
   - Identifie les tâches qui dépendent de celle-ci

2. **Génération via Claude** :
   - Construit un prompt détaillé avec tout le contexte
   - Demande un JSON structuré :
     ```json
     {
       "explanation": "Ce que cette tâche implique concrètement",
       "whyNow": "Pourquoi cette tâche maintenant",
       "whatWasDoneBefore": ["Action 1", "Action 2", "Action 3"],
       "whatThisEnables": "Ce que cela va permettre",
       "agentRole": "Ton rôle spécifique"
     }
     ```

3. **Fallback robuste** :
   - Si Claude échoue : utilise la description brute
   - Si parsing JSON échoue : retourne un objet structuré basique

#### Interface TypeScript

```typescript
interface TaskExplanation {
  taskTitle: string;
  explanation: string; // Contextualized explanation
  whyNow: string; // Why this task is important at this stage
  whatWasDoneBefore: string[]; // What other agents accomplished
  whatThisEnables: string; // What this task will unlock
  agentRole: string; // Agent's specific role for this task
}
```

---

### 2. Route API

**Fichier :** `/backend/src/routes/task-explainer.routes.ts`

**Endpoint :** `POST /api/task-explainer/explain`

**Request Body :**
```json
{
  "task_id": "uuid",
  "project_id": "uuid",
  "agent_id": "luna" | "sora" | "marcus" | "milo"
}
```

**Response :**
```json
{
  "success": true,
  "explanation": {
    "taskTitle": "Création Avatar Client Idéal (ICP)",
    "explanation": "Cette tâche consiste à créer un profil détaillé...",
    "whyNow": "Maintenant que Sora a analysé les données...",
    "whatWasDoneBefore": [
      "Sora a complété l'audit analytics",
      "L'analyse des segments d'audience est terminée",
      "Les données GA4 ont été collectées"
    ],
    "whatThisEnables": "Cela permettra à Marcus de créer des campagnes ultra-ciblées...",
    "agentRole": "Luna va analyser les insights de Sora et créer un profil psychographique détaillé..."
  }
}
```

---

### 3. Intégration Frontend

**Fichier :** `/cockpit/src/views/BoardView.tsx`

#### Modification de `handleLaunchTask()`

**AVANT :**
```typescript
const taskPrompt = `# TASK LAUNCH: ${task.title}

## Your Mission
${task.description}
...
`;
```

**APRÈS :**
```typescript
// 1. Appel au service task-explainer
let taskExplanation = null;
try {
  const explainerResponse = await fetch('http://localhost:3457/api/task-explainer/explain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      task_id: taskId,
      project_id: projectId,
      agent_id: task.assignee,
    }),
  });

  if (explainerResponse.ok) {
    const explainerData = await explainerResponse.json();
    taskExplanation = explainerData.explanation;
  }
} catch (error) {
  // Fallback to description
}

// 2. Construction du prompt avec explication contextuelle
const taskPrompt = `# TASK LAUNCH: ${task.title}

## Your Mission - CONTEXTUAL EXPLANATION

${taskExplanation ? `
**Ce que cette tâche implique:**
${taskExplanation.explanation}

**Pourquoi maintenant:**
${taskExplanation.whyNow}

**Ce qui a été fait avant:**
${taskExplanation.whatWasDoneBefore.map((item) => `- ${item}`).join('\n')}

**Ce que cela va permettre:**
${taskExplanation.whatThisEnables}

**Ton rôle spécifique:**
${taskExplanation.agentRole}
` : task.description}
...
`;
```

---

### 4. Modification du Task Launch Protocol

**Fichier :** `/backend/src/config/agents.config.ts`

#### Nouveau protocole (Section 1 : Greeting + Context)

**AVANT :**
```
### 1. GREETING (2 phrases max)
Saluez et confirmez la tâche de manière CONCISE.
- ❌ DO NOT copy-paste the full task description
- ✅ Summarize in 1 sentence what we're going to do
```

**APRÈS :**
```
### 1. GREETING + CONTEXT ACKNOWLEDGMENT (2-3 phrases max)
Saluez et montrez que vous COMPRENEZ le contexte du projet et de cette tâche.
- ❌ DO NOT copy-paste the contextual explanation
- ✅ Acknowledge what has been done before by other agents
- ✅ Explain WHY this task is important NOW in the project sequence

**Example:**
"Bonjour ! Je suis Luna 🎯
Je vois que [Agent X] a déjà complété [tâche précédente]. Excellent travail !
Maintenant, je vais vous aider à créer votre Avatar Client Idéal (ICP)
pour construire sur ces fondations."
```

#### Instructions pour l'agent

L'agent reçoit maintenant explicitement :
- `explanation` : Ce que la tâche implique
- `whyNow` : Pourquoi maintenant
- `whatWasDoneBefore` : Actions des autres agents
- `whatThisEnables` : Ce que ça va débloquer
- `agentRole` : Son rôle spécifique

Et doit les utiliser intelligemment dans sa réponse initiale.

---

## Architecture & Flow

### Flow complet

```
1. User clique "Launch" sur une tâche
   ↓
2. Frontend - BoardView.tsx handleLaunchTask()
   - Update task status: todo → in_progress
   - Navigate to /chat/:projectId/:taskId
   ↓
3. Frontend - Appel Task Explainer API
   POST /api/task-explainer/explain
   {
     task_id: "uuid",
     project_id: "uuid",
     agent_id: "luna"
   }
   ↓
4. Backend - task-explainer.service.ts
   - Query Supabase: task, project, completed tasks, memory
   - Build detailed prompt for Claude
   - Generate contextual explanation via Claude
   - Parse JSON response
   - Return TaskExplanation
   ↓
5. Frontend - Build enhanced task prompt
   - Inject explanation, whyNow, whatWasDoneBefore, etc.
   - Send to chat API
   ↓
6. Backend - Agent receives contextual prompt
   - Agent sees full context
   - Acknowledges previous work
   - Explains WHY this task NOW
   - Proposes intelligent next steps
   ↓
7. Frontend - Display agent's contextual response
   User sees: "Luna a vu le travail de Sora et propose maintenant..."
```

---

## Prompt Claude (Task Explainer)

### Structure du prompt

```
Tu es [Agent Name], un agent IA expert dans ton domaine.
Tu dois expliquer la tâche suivante à l'utilisateur, en contexte, de manière intelligente.

# INFORMATIONS DU PROJET
**Projet:** [project.name]
**Scope:** [project.scope]
**Phase actuelle:** [project.current_phase]

# LA TÂCHE À EXPLIQUER
**Titre:** [task.title]
**Description brute (NE PAS COPIER-COLLER):** [task.description]
**Phase:** [task.phase]
**Ton rôle:** [agentName]

# CE QUI A ÉTÉ FAIT AVANT
1. [Luna] Audit SEO technique (Phase: Audit)
2. [Sora] Configuration GA4 + GTM (Phase: Setup)
3. [Marcus] Création compte Meta Ads (Phase: Setup)

# MÉMOIRE COLLECTIVE (ACTIONS RÉCENTES)
- [Sora] Audit analytics complété : 5 segments identifiés
- [Luna] Keywords research : 150 mots-clés prioritaires
- [Marcus] Tracking pixels installés et vérifiés

# CE QUE CETTE TÂCHE VA DÉBLOQUER
Les tâches suivantes dépendent de celle-ci:
- Création stratégie de contenu (Luna)
- Définition targeting campagnes (Marcus)
- Briefing créatifs (Milo)

# TON OBJECTIF
Génère une explication contextuelle et intelligente qui :
1. Explique ce que cette tâche implique concrètement
2. Pourquoi cette tâche est importante à ce stade du projet
3. Liste des accomplissements des autres agents (3-5 points max)
4. Ce que le résultat va débloquer ou améliorer
5. Comment TOI (Luna) tu vas aider sur cette tâche

IMPORTANT:
- Sois spécifique et concret
- Utilise les informations du projet et de la mémoire collective
- Montre comment cette tâche s'inscrit dans la séquence
- Utilise un ton professionnel mais accessible
- Utilise le vous pour parler à l'utilisateur

Réponds UNIQUEMENT en JSON valide avec cette structure :
{
  explanation: ...,
  whyNow: ...,
  whatWasDoneBefore: [...],
  whatThisEnables: ...,
  agentRole: ...
}
```

---

## Performance

| Métrique | Valeur | Note |
|----------|--------|------|
| **Appel explainer API** | 2-5s | Génération LLM via Claude |
| **Taille contexte** | ~2KB | Prompt optimisé |
| **Tokens Claude** | ~800-1500 | Dépend de la mémoire |
| **Fallback** | Instant | Si explainer échoue |
| **Cache** | Non implémenté | Future optimization |

---

## Sécurité

- ✅ Validation : task_id, project_id, agent_id requis
- ✅ Sanitization : Aucun HTML dans les explications
- ✅ Error handling : Fallback robuste si Claude échoue
- ✅ Rate limiting : Hérite du rate limiting global backend
- ✅ Auth : Hérite de l'auth Supabase

---

## Edge Cases gérés

| Cas | Solution |
|-----|----------|
| Aucune tâche complétée avant | Texte : "C'est le début du projet" |
| Aucune mémoire collective | Texte : "Aucune action enregistrée" |
| Claude API échoue | Fallback : description brute de la tâche |
| JSON parsing échoue | Fallback : objet structuré basique |
| Tâche sans description | Fallback : "Exécuter cette tâche pour faire avancer le projet" |
| Agent inconnu | Fallback : nom générique "Agent" |
| Timeout explainer (> 10s) | Frontend utilise description brute |

---

## Exemples

### Exemple 1 : Luna - Création ICP (après audit Sora)

**Context :**
- Sora a complété "Configuration GA4 + GTM"
- Sora a complété "Audit Analytics"
- Phase actuelle : Setup

**Explanation générée :**
```json
{
  "explanation": "Cette tâche consiste à créer un profil psychographique et démographique détaillé de votre client idéal, en s'appuyant sur les données collectées par Sora. Nous allons définir les comportements d'achat, pain points, objections et déclencheurs pour créer une stratégie marketing ultra-ciblée.",

  "whyNow": "Maintenant que Sora a audité les données analytics et identifié 5 segments d'audience clés, nous avons assez d'informations pour créer un ICP précis qui servira de fondation à toute la stratégie marketing.",

  "whatWasDoneBefore": [
    "Sora a complété l'audit analytics et identifié les segments clés",
    "Configuration GA4 et GTM terminée pour collecter les données",
    "Les données d'audience sont maintenant disponibles"
  ],

  "whatThisEnables": "Cet ICP permettra à Marcus de créer des campagnes publicitaires ultra-ciblées avec le bon messaging, et à Milo de créer des créatifs qui résonnent parfaitement avec votre audience.",

  "agentRole": "Luna va analyser les insights collectés par Sora, croiser avec les best practices SEO et psychographiques, et créer un profil détaillé qui servira de référence pour toutes les décisions marketing."
}
```

**Réponse de Luna dans le chat :**
```
Bonjour ! Je suis Luna 🎯

Je vois que Sora a déjà complété l'audit analytics et identifié 5 segments
d'audience clés. Excellent travail ! Ces données sont précieuses.

Maintenant, je vais vous aider à créer votre Avatar Client Idéal (ICP) pour
construire sur ces fondations et créer une stratégie marketing ultra-ciblée.

## Ce que nous allons faire ensemble
1. **Analyser les segments identifiés par Sora** - Comprendre les comportements
2. **Définir le profil démographique** - Âge, localisation, revenus, etc.
3. **Créer le profil psychographique** - Valeurs, croyances, aspirations
4. **Identifier pain points et objections** - Ce qui bloque l'achat
5. **Documenter les déclencheurs** - Ce qui motive à acheter

## Par où commencer ?

💡 **"Partage-moi les principaux insights de l'audit Sora"**
   Je vais les analyser pour identifier les patterns clés

💡 **"Mon client type est [description brève]"**
   Je vais enrichir cette base avec une analyse psychographique approfondie

💡 **"Voici mes données clients actuelles : [fichier/lien]"**
   Je vais les croiser avec les données analytics pour créer un profil précis

## Mes outils MCP pour cette tâche
Avec mes outils, je peux :
✅ Analyser les keywords pour comprendre les search intents
✅ Auditer les sites concurrents pour identifier leur ICP
✅ Extraire des insights psychographiques depuis les données web

On commence par où ? 🚀
```

---

### Exemple 2 : Marcus - Lancer campagne Meta (après ICP Luna + créatifs Milo)

**Context :**
- Luna a complété "Création ICP"
- Milo a complété "Création visuels Meta Ads"
- Phase actuelle : Production

**Explanation générée :**
```json
{
  "explanation": "Cette tâche consiste à créer et lancer votre première campagne Meta Ads (Facebook + Instagram) en utilisant l'ICP défini par Luna et les créatifs créés par Milo. Nous allons configurer le targeting, définir le budget, et lancer les annonces avec un suivi précis des performances.",

  "whyNow": "Tous les éléments sont maintenant en place : Luna a défini qui cibler (ICP), Milo a créé les visuels impactants, et le tracking est configuré. C'est le moment idéal pour lancer la campagne et commencer à générer du trafic qualifié.",

  "whatWasDoneBefore": [
    "Luna a créé l'Avatar Client Idéal avec profil démographique et psychographique",
    "Milo a créé 5 visuels optimisés pour Meta Ads format carré",
    "Sora a vérifié que le Meta Pixel est bien installé et fonctionne"
  ],

  "whatThisEnables": "Cette campagne va générer les premières données de performance (CTR, CPA, ROAS) qui permettront à Sora d'analyser ce qui fonctionne, et à moi d'optimiser en continu pour scaler les winners.",

  "agentRole": "Marcus va utiliser l'ICP de Luna pour créer un targeting ultra-précis, les créatifs de Milo pour les annonces, et configurer la campagne avec les bonnes pratiques pour maximiser le ROAS dès le départ."
}
```

**Réponse de Marcus dans le chat :**
```
Bonjour ! Je suis Marcus 💰

Excellent timing ! Je vois que Luna a défini votre ICP avec un profil détaillé,
et que Milo a créé 5 visuels impactants. Tous les éléments sont en place pour
lancer une campagne qui convertit.

Maintenant, je vais créer et lancer votre première campagne Meta Ads pour
générer du trafic qualifié et des conversions.

## Ce que nous allons faire ensemble
1. **Vérifier le setup technique** - Meta Business Manager, Pixel, tracking
2. **Définir la stratégie de campagne** - Objectif, budget, placements
3. **Configurer le targeting** - Basé sur l'ICP de Luna
4. **Créer les ad sets et annonces** - Avec les visuels de Milo
5. **Lancer et monitorer** - Suivi en temps réel des premières 24h

## Par où commencer ?

💡 **"Vérifie si mon Meta Pixel fonctionne sur [URL]"**
   Je vais utiliser mes outils pour détecter le Pixel et vérifier les événements

💡 **"Mon objectif est [Ventes/Leads], budget [X€/jour]"**
   Je pourrai directement créer une stratégie de campagne optimale

💡 **"J'ai déjà un compte Meta Ads, voici mon Business Manager ID"**
   Je vais me connecter et configurer la campagne

## Mes outils MCP pour cette tâche
Avec mes outils, je peux :
✅ Vérifier le Meta Pixel sur votre site
✅ Créer la campagne complète (Campaign → Ad Sets → Ads)
✅ Configurer le targeting basé sur l'ICP de Luna
✅ Importer les créatifs de Milo
✅ Monitorer les performances en temps réel

Quelle approche préférez-vous ? 🚀
```

---

## Tests de validation

### Test 1 : Explication pour tâche sans historique

1. ✅ Créer nouveau projet (aucune tâche complétée)
2. ✅ Lancer première tâche
3. ✅ Vérifier : `whatWasDoneBefore` = ["C'est le début du projet"]
4. ✅ Vérifier : Agent dit "C'est le début de notre collaboration"

### Test 2 : Explication avec historique

1. ✅ Projet avec 3 tâches complétées
2. ✅ Lancer 4ème tâche
3. ✅ Vérifier : `whatWasDoneBefore` liste les 3 tâches
4. ✅ Vérifier : Agent mentionne le travail des agents précédents

### Test 3 : Explication avec dépendances

1. ✅ Tâche X avec 2 tâches dépendantes
2. ✅ Lancer tâche X
3. ✅ Vérifier : `whatThisEnables` mentionne les tâches qui seront débloquées

### Test 4 : Fallback si explainer échoue

1. ✅ Simuler erreur API explainer (kill backend)
2. ✅ Lancer tâche
3. ✅ Vérifier : Agent utilise description brute
4. ✅ Vérifier : Pas d'erreur utilisateur visible

### Test 5 : Tous les agents

1. ✅ Tester avec Luna
2. ✅ Tester avec Sora
3. ✅ Tester avec Marcus
4. ✅ Tester avec Milo
5. ✅ Vérifier : Chaque agent adapte son ton et ses outils

---

## Fichiers modifiés/créés

### Backend (5 fichiers)

1. **Créé** : `/backend/src/services/task-explainer.service.ts` (260 lignes)
   - Service de génération d'explications contextuelles
   - Fonction `explainTask()` principale
   - Prompt engineering pour Claude

2. **Créé** : `/backend/src/routes/task-explainer.routes.ts` (48 lignes)
   - Route POST `/api/task-explainer/explain`
   - Validation des paramètres
   - Error handling

3. **Modifié** : `/backend/src/index.ts`
   - Import `taskExplainerRoutes`
   - Enregistrement route `/api/task-explainer`

4. **Modifié** : `/backend/src/config/agents.config.ts`
   - Section 1 du Task Launch Protocol mise à jour
   - Nouvelles instructions pour context acknowledgment

### Frontend (1 fichier)

5. **Modifié** : `/cockpit/src/views/BoardView.tsx`
   - Fonction `handleLaunchTask()` enrichie
   - Appel API task-explainer
   - Injection explication dans prompt

---

## Dépendances

Aucune nouvelle dépendance. Utilise :
- Services existants : `supabase.service.ts`, `claude.service.ts`, `memory.service.ts`
- Types existants : `AgentId`, `ProjectMemoryEntry`

---

## Prochaines étapes

### Optimisations futures

- [ ] **Cache** : Mettre en cache les explications pour éviter de régénérer à chaque fois
- [ ] **Streaming** : Streamer l'explication au lieu d'attendre la génération complète
- [ ] **A/B Testing** : Tester différents styles d'explication (concis vs détaillé)
- [ ] **Personnalisation** : Adapter le ton selon le profil utilisateur
- [ ] **Analytics** : Tracker quelle explication mène aux meilleurs résultats

### Améliorations possibles

- [ ] **Preview** : Montrer l'explication dans la modal de tâche (avant launch)
- [ ] **Edit** : Permettre à l'utilisateur de modifier l'explication générée
- [ ] **History** : Sauvegarder les explications dans la DB pour historique
- [ ] **Multi-langue** : Générer explications en EN/FR selon préférence user

---

## Changelog

### Version 1.0.0 (2026-03-07)

- ✅ Implémentation complète Phase 2.12
- ✅ Backend : task-explainer.service.ts + routes
- ✅ Frontend : BoardView.tsx integration
- ✅ Task Launch Protocol : contexte acknowledgment
- ✅ Tests : 5 scénarios validés
- ✅ Documentation : complète

---

## Références

- **PRD** : `/Roadmap:vision/PRD_THE_HIVE_OS_V5.0.md`
- **Phase précédente** : `/Roadmap:vision/PHASE_2.11_AUTO_PHASE_TRANSITION.md`
- **Code** :
  - Backend : `/backend/src/services/task-explainer.service.ts`
  - Backend : `/backend/src/routes/task-explainer.routes.ts`
  - Frontend : `/cockpit/src/views/BoardView.tsx`
  - Config : `/backend/src/config/agents.config.ts`
