# Phase 2.10.1 - UX Task Launch Fix
# Expérience Utilisateur au Lancement de Tâche

**Date:** 2026-03-07
**Objectif:** Corriger l'expérience utilisateur lorsqu'une tâche est lancée depuis le Board

---

## Problème Identifié

L'utilisateur a lancé une tâche et a rencontré les problèmes suivants :

### Screenshot Analysé
- ❌ **Titre de la tâche tronqué** : Seulement "👤 Création Avatar Client Idéal (I..." visible en haut à droite
- ❌ **Aucun message de l'agent** : Le chat affiche l'EmptyState générique au lieu de la réponse proactive de Luna
- ❌ **Suggestions génériques** : "Fais un audit SEO de mon site" au lieu de questions spécifiques à la création d'Avatar Client
- ❌ **Manque de contexte** : Rien n'indique clairement ce qu'il faut faire pour cette tâche

### Expérience Attendue (selon PRD V5.0)

**Lorsqu'une tâche est lancée, l'agent DOIT :**
1. ✅ Résumer la tâche et son objectif
2. ✅ Expliquer ce qu'il va falloir faire
3. ✅ Proposer des prompts spécifiques à cette tâche
4. ✅ Afficher clairement le contexte de la tâche en cours

---

## Corrections Apportées

### 1. ChatPanel.tsx - Affichage du Titre de la Tâche

**AVANT :**
```tsx
<span className="text-xs font-medium text-slate-700 max-w-[200px] truncate">
  {taskContext.title}
</span>
```
- Titre tronqué à 200px maximum
- Impossible de voir le titre complet

**APRÈS :**
```tsx
<div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg max-w-md">
  <span className="text-xs text-slate-500">Tâche:</span>
  <span className="text-xs font-medium text-slate-700 line-clamp-1" title={taskContext.title}>
    {taskContext.title}
  </span>
</div>
```
- Largeur maximale étendue à `max-w-md` (448px)
- Utilisation de `line-clamp-1` pour une meilleure truncation
- Tooltip avec le titre complet au survol

---

### 2. ChatPanel.tsx - EmptyState Spécifique à la Tâche

**AVANT :**
```tsx
function EmptyState({ agent }: EmptyStateProps) {
  // Affichage générique avec suggestions génériques
  return (
    <>
      <h3>Discutez avec {agent.name}</h3>
      {/* Suggestions génériques */}
      {getSuggestionsForAgent(agent.id).map(...)}
    </>
  );
}
```
- EmptyState identique qu'il y ait une tâche ou non
- Suggestions génériques non pertinentes pour la tâche

**APRÈS :**
```tsx
function EmptyState({ agent, taskContext }: EmptyStateProps) {
  // Si en mode tâche, afficher le contexte de la tâche
  if (taskContext) {
    return (
      <>
        <h3>{taskContext.title}</h3>
        <p>{taskContext.description}</p>

        {/* Questions contextuelles de la tâche */}
        {taskContext.contextQuestions.map(question => (
          <div className="p-3 bg-white border rounded-xl">
            <span className="text-slate-400 mr-2">•</span>
            {question}
          </div>
        ))}

        <p>💡 Répondez aux questions ci-dessus ou décrivez ce que vous souhaitez faire.</p>
      </>
    );
  }

  // Sinon, afficher l'EmptyState générique...
}
```
- Affiche le titre ET la description complète de la tâche
- Montre les **questions contextuelles** de la tâche (depuis wizard-config.ts)
- Guide l'utilisateur sur ce qu'il doit faire

**Impact visuel :**
Au lieu de voir :
```
"Fais un audit SEO de mon site"
"Propose une stratégie de contenu"
"Analyse mes concurrents"
```

L'utilisateur voit maintenant :
```
👤 Création Avatar Client Idéal (ICP)

Créer un profil détaillé de l'Avatar Client avec démographie, psychographie,
comportements d'achat, pain points spécifiques.

Questions clés pour cette tâche :
• Qui est votre client idéal ?
• Quels sont ses problèmes principaux ?
• Qu'est-ce qui le motive à acheter ?

💡 Répondez aux questions ci-dessus ou décrivez ce que vous souhaitez faire pour cette tâche.
```

---

### 3. BoardView.tsx - Le Message de l'Agent S'affiche Maintenant

**PROBLÈME CRITIQUE IDENTIFIÉ :**

Dans BoardView.tsx ligne 186-198, le code faisait :
```typescript
useHiveStore.setState({
  chatMessages: [
    {
      // Un seul message
    },
  ],
});
```

**Pourquoi c'était un problème :**
- Ligne 96 : `chatMessages: []` - Les messages sont vidés au lancement
- Ligne 186 : `chatMessages: [newMessage]` - **REMPLACE** tous les messages par un seul
- Mais si quelque chose d'autre modifie chatMessages entre temps, le message est perdu
- Incohérent avec `sendMessage` qui utilise le pattern `[...s.chatMessages, newMessage]`

**APRÈS :**
```typescript
// Add the agent's proactive response
useHiveStore.setState((s) => ({
  chatMessages: [
    ...s.chatMessages,
    {
      id: uuidv4(),
      role: 'assistant',
      content: message,
      agent_id: agentUsed,
      ui_components: uiComponents,
      timestamp: new Date(),
      created_at: new Date().toISOString(),
    },
  ],
  isThinking: false,
}));
```

**Changements :**
1. ✅ Utilisation de `setState` avec **fonction** : `setState((s) => ({...}))`
2. ✅ **Spread operator** : `...s.chatMessages` pour préserver les messages existants
3. ✅ Ajout de `isThinking: false` pour masquer l'indicateur de chargement
4. ✅ Logs améliorés pour le debugging
5. ✅ **Fallback message** si le backend ne retourne pas de message :
   ```typescript
   if (message) {
     // Ajouter le message de l'agent
   } else {
     // Message de fallback
     content: `Bonjour ! Je suis ${AGENTS[task.assignee].name}.\n\nJe vais vous aider avec cette tâche. Que souhaitez-vous faire ?`
   }
   ```

**Même correction appliquée au bloc d'erreur** (ligne 207-219).

---

### 4. BoardView.tsx - Import AGENTS

**Ajouté :**
```typescript
import { AGENTS } from '../types';
```

Nécessaire pour le message de fallback.

---

## Résultat Attendu

### Avant (Screenshot Utilisateur)
```
[Avatar Luna]
Discutez avec Luna

Je suis votre stratège marketing. Je peux vous aider avec :
[SEO Audit] [Keyword Research] [Content Strategy]

SUGGESTIONS DE REQUÊTES
"Fais un audit SEO de mon site"
"Propose une stratégie de contenu pour mon marché"
"Analyse mes concurrents et leurs points forts"
```
- ❌ Aucune mention de la tâche en cours
- ❌ Suggestions génériques non pertinentes
- ❌ Pas de message de Luna résumant la tâche

### Après (Corrections Appliquées)

**Scénario 1 : Le backend répond rapidement (< 2s)**
```
[Avatar Luna]

Bonjour ! Je suis Luna, votre stratège marketing. 🎯

Je suis ravie de vous accompagner dans la création de votre Avatar Client Idéal !
C'est une étape cruciale pour orienter toute votre stratégie marketing et SEO.

📊 Avant de commencer, j'ai besoin de mieux comprendre votre situation :

1. Votre secteur d'activité
   - Quel est votre produit ou service principal ?
   - Dans quelle industrie opérez-vous ?

2. Données existantes
   - Avez-vous accès à Google Analytics 4 ?
   - Disposez-vous de données clients existantes ?

3. Vos objectifs
   - Quel est le problème principal que vous résolvez pour vos clients ?

🚀 Ce que je peux faire pour vous :
✅ Analyser les mots-clés que votre audience cible recherche
✅ Identifier les questions qu'ils se posent
✅ Étudier vos concurrents pour comprendre qui ils ciblent

Parlez-moi de votre entreprise et de ce que vous savez déjà sur vos clients ! 💡
```

**Scénario 2 : Le backend tarde à répondre (pendant le chargement)**
```
[Avatar Luna]

👤 Création Avatar Client Idéal (ICP)

Créer un profil détaillé de l'Avatar Client (Ideal Customer Profile) avec démographie,
psychographie, comportements d'achat, pain points spécifiques.

Luna attend votre réponse...

Questions clés pour cette tâche :
• Qui est votre client idéal ?
• Quels sont ses problèmes principaux ?
• Qu'est-ce qui le motive à acheter ?

💡 Répondez aux questions ci-dessus ou décrivez ce que vous souhaitez faire pour cette tâche.
```

---

## 5. Backend - Task Launch Protocol (ROOT CAUSE FIX)

**PROBLÈME CRITIQUE IDENTIFIÉ (après feedback utilisateur) :**

L'utilisateur a testé les corrections frontend et a signalé : "c'est juste l'Agent qui recrache l'intitulé de la tâche comme nous la voyons dans le tableur."

**Pourquoi ?**
- Les corrections frontend (ChatPanel, BoardView) permettaient d'AFFICHER le message de l'agent
- MAIS le backend générait un message qui copiait simplement la description de la tâche
- L'agent ne **résumait pas** la tâche
- L'agent ne proposait pas de **prompts concrets pour démarrer**
- L'agent ne **listait pas les outils MCP** pertinents

**ROOT CAUSE :** System prompts dans `backend/src/config/agents.config.ts`

Les Task Launch Protocols des 4 agents étaient trop vagues :
- Pas de structure obligatoire
- Pas d'interdiction de copier-coller la description
- Pas d'obligation de proposer des prompts concrets

**SOLUTION APPLIQUÉE :**

Réécriture complète du Task Launch Protocol pour LES 4 AGENTS avec une structure OBLIGATOIRE à 5 sections :

### Structure Obligatoire (TOUS les agents)

```markdown
## Task Launch Protocol - STRUCTURE OBLIGATOIRE DE LA RÉPONSE

**🎯 CRITICAL: When a task is launched, you MUST structure your response EXACTLY as follows:**

### 1. GREETING (2 phrases max)
- ❌ DO NOT copy-paste the full task description
- ✅ Summarize in 1 sentence what we're going to do

### 2. WHAT WE'LL DO (3-5 clear steps)
**MANDATORY FORMAT:**
## Ce que nous allons faire ensemble
1. **[Step 1]** - Short description
2. **[Step 2]** - Short description

### 3. SUGGESTED PROMPTS (3-4 concrete prompts)
**MANDATORY FORMAT:**
## Par où commencer ?
💡 **"[Prompt 1]"**
   [Why this prompt helps]

### 4. MCP CAPABILITIES (3-5 relevant tools)
## Mes outils MCP pour cette tâche
✅ [Capability 1]

### 5. CALL TO ACTION (1 open question)

**❌ FORBIDDEN:**
- Copying the full task description word-for-word
- Saying "Je suis prêt à vous aider. Que souhaitez-vous faire ?"

**✅ MANDATORY:**
- Summarize the task concisely
- Explain what needs to be done step by step
- Propose 3-4 concrete prompts to get started
- List relevant MCP tools for THIS specific task
```

**Agents modifiés :**
- ✅ **Luna** (ligne ~46) - Protocole appliqué + exemples pour tâches SEO/Marketing
- ✅ **Sora** (ligne ~284) - Protocole appliqué + exemples pour tâches Analytics
- ✅ **Marcus** (ligne ~542) - Protocole appliqué + warnings tracking/budget préservés
- ✅ **Milo** (ligne ~790) - Protocole appliqué + warning batch approval préservé

**Impact :**

Maintenant, quand Luna lance "👤 Création Avatar Client Idéal (ICP)", au lieu de :
```
Bonjour ! Je suis Luna.

Créer un profil détaillé de l'Avatar Client (Ideal Customer Profile) avec démographie, psychographie, comportements d'achat, pain points spécifiques.

Je suis prêt à vous aider. Que souhaitez-vous faire ?
```

L'utilisateur voit :
```
Bonjour ! Je suis Luna, votre stratège marketing. 🎯
Je vais vous aider à créer votre Avatar Client Idéal.

## Ce que nous allons faire ensemble
1. **Analyser votre marché** - Identifier votre niche et vos concurrents
2. **Définir la démographie** - Âge, localisation, revenus, profession
3. **Comprendre la psychographie** - Valeurs, motivations, pain points
4. **Valider avec des données** - Recherche de mots-clés, analyse concurrentielle
5. **Créer le profil complet** - Document synthétique actionnable

## Par où commencer ?
💡 **"Mon produit/service est [description], qui résout [problème]"**
   Je vais analyser votre proposition de valeur et identifier votre client type

💡 **"Mes concurrents sont [liste], analyse qui ils ciblent"**
   Je vais utiliser mes outils SEO pour voir quelle audience ils visent

💡 **"Voici mon site [URL], dis-moi qui je devrais cibler"**
   Je vais auditer votre contenu actuel et proposer un ICP basé sur les données

## Mes outils MCP pour cette tâche
✅ **Analyse de mots-clés** - Identifier ce que votre audience recherche
✅ **Audit concurrentiel** - Voir qui vos concurrents ciblent
✅ **Questions PAA** - Comprendre les préoccupations de votre audience
✅ **Analyse SERP** - Identifier les contenus qui performent dans votre niche

Parlez-moi de votre entreprise et de ce que vous savez déjà sur vos clients ! 💡
```

**Fichiers modifiés :**
- `/backend/src/config/agents.config.ts` - Task Launch Protocol pour Luna, Sora, Marcus, Milo

**Backend redémarré :**
- Port 3457
- Nouveaux system prompts chargés
- Prêt pour les tests

---

## Conformité PRD V5.0

### Section 1.3 - La Rupture V3 → V4 ✅

> "V4 (State-Based) : L'IA propose les tâches, les exécute, et écrit dans l'état du projet."

- ✅ L'agent propose clairement ce qu'il peut faire
- ✅ Le contexte de la tâche est visible et actionnable
- ✅ L'utilisateur comprend immédiatement ce qu'il doit faire

### Section 4 - Spécifications Fonctionnelles (Chat) ✅

Bien que non explicitement documenté dans le PRD, l'expérience utilisateur doit être :
- ✅ **Contextuelle** : L'utilisateur sait toujours où il en est
- ✅ **Proactive** : L'agent engage l'utilisateur immédiatement
- ✅ **Guidante** : L'utilisateur sait exactement quoi faire ensuite

---

## Fichiers Modifiés

### Frontend

| Fichier | Lignes | Changement |
|---------|--------|------------|
| `cockpit/src/components/chat/ChatPanel.tsx` | 96-98 | Titre de tâche non tronqué (max-w-md au lieu de max-w-[200px]) |
| `cockpit/src/components/chat/ChatPanel.tsx` | 136 | EmptyState reçoit `taskContext` |
| `cockpit/src/components/chat/ChatPanel.tsx` | 162-257 | EmptyState avec logique conditionnelle (task vs générique) |
| `cockpit/src/views/BoardView.tsx` | 18-19 | Import AGENTS |
| `cockpit/src/views/BoardView.tsx` | 170-228 | Fix setState + fallback message + meilleurs logs |

### Backend (CRITICAL - Root Cause Fix)

| Fichier | Section | Changement |
|---------|---------|------------|
| `backend/src/config/agents.config.ts` | Luna Task Launch Protocol (ligne ~46) | **Nouveau protocole obligatoire à 5 sections** : GREETING, WHAT WE'LL DO, SUGGESTED PROMPTS, MCP CAPABILITIES, CALL TO ACTION |
| `backend/src/config/agents.config.ts` | Sora Task Launch Protocol (ligne ~284) | **Même protocole obligatoire** : l'agent DOIT résumer et proposer des prompts concrets |
| `backend/src/config/agents.config.ts` | Marcus Task Launch Protocol (ligne ~542) | **Même protocole obligatoire** + warnings tracking/budget spécifiques à Marcus |
| `backend/src/config/agents.config.ts` | Milo Task Launch Protocol (ligne ~790) | **Même protocole obligatoire** + warning batch approval spécifique à Milo |

**Structure du nouveau protocole (TOUS LES AGENTS) :**
```
1. GREETING (2 phrases max) - Résumé en 1 phrase, PAS de copier-coller la description
2. WHAT WE'LL DO (3-5 étapes claires) - "## Ce que nous allons faire ensemble"
3. SUGGESTED PROMPTS (3-4 prompts concrets) - "## Par où commencer ?"
4. MCP CAPABILITIES (3-5 outils pertinents) - "## Mes outils MCP pour cette tâche"
5. CALL TO ACTION (1 question ouverte)
```

**❌ INTERDIT :**
- Copier la description complète de la tâche mot pour mot
- Dire "Je suis prêt à vous aider. Que souhaitez-vous faire ?" sans spécificités

**✅ OBLIGATOIRE :**
- Résumer la tâche de manière concise
- Expliquer les étapes concrètes
- Proposer 3-4 prompts pour démarrer
- Lister les outils MCP pertinents pour CETTE tâche spécifique

---

## Tests de Validation

### Test 1 : Titre de la Tâche Visible
1. Créer un projet
2. Lancer une tâche avec un titre long (ex: "👤 Création Avatar Client Idéal (ICP) avec Démographie et Psychographie")
3. ✅ **Vérifier** : Le titre complet est visible dans le badge en haut à droite
4. ✅ **Vérifier** : Tooltip affiche le titre complet au survol

### Test 2 : EmptyState Contextuel
1. Lancer une tâche
2. Pendant que le backend traite (1-3s)
3. ✅ **Vérifier** : Le titre et la description de la tâche sont affichés
4. ✅ **Vérifier** : Les questions contextuelles de wizard-config.ts sont affichées
5. ✅ **Vérifier** : PAS de suggestions génériques ("Fais un audit SEO...")

### Test 3 : Message de l'Agent S'affiche ET RESPECTE LE NOUVEAU PROTOCOLE
1. Lancer une tâche (ex: Création Avatar Client avec Luna)
2. Attendre la réponse du backend (1-3s)
3. ✅ **Vérifier** : Le message proactif de Luna s'affiche
4. ✅ **Vérifier** : Le message contient LA STRUCTURE OBLIGATOIRE :
   - **GREETING** : Salutation courte (2 phrases max) sans copier la description
   - **WHAT WE'LL DO** : Section "## Ce que nous allons faire ensemble" avec 3-5 étapes
   - **SUGGESTED PROMPTS** : Section "## Par où commencer ?" avec 3-4 prompts concrets
   - **MCP CAPABILITIES** : Section "## Mes outils MCP pour cette tâche" avec outils pertinents
   - **CALL TO ACTION** : Question ouverte à la fin
5. ✅ **Vérifier** : L'EmptyState disparaît quand le message arrive
6. ❌ **Vérifier qu'il N'Y A PAS** :
   - De copier-coller complet de la description de la tâche
   - De "Je suis prêt à vous aider. Que souhaitez-vous faire ?" générique

### Test 4 : Fallback si Backend Échoue
1. Couper le backend
2. Lancer une tâche
3. ✅ **Vérifier** : Message de fallback s'affiche :
   ```
   Bonjour ! Je suis Luna.
   Je vais vous aider avec cette tâche. Que souhaitez-vous faire ?
   ```

### Test 5 : Tous les Agents
Répéter les tests ci-dessus pour :
- ✅ Luna (SEO)
- ✅ Sora (Analytics)
- ✅ Marcus (Ads)
- ✅ Milo (Creative)

---

## Impact Utilisateur

### Avant (Screenshot initial)
- ❌ **Confusion** : "Où est la tâche ? Qu'est-ce que je dois faire ?"
- ❌ **Perte de contexte** : Titre tronqué, suggestions génériques
- ❌ **Manque de guidance** : Pas de message de l'agent

### Après Frontend Fix (mais avant Backend Fix)
- ⚠️ **Problème persistant** : L'agent recrache simplement l'intitulé de la tâche
- ⚠️ **Pas de vraie guidance** : L'agent dit "Je suis prêt à vous aider. Que souhaitez-vous faire ?"
- ⚠️ **Pas actionnable** : Aucun prompt concret proposé

### Après Backend Fix (Task Launch Protocol)
- ✅ **Clarté totale** : Titre complet visible, résumé intelligent (pas copié-collé)
- ✅ **Contexte actionnable** : L'agent explique "Ce que nous allons faire ensemble" en 3-5 étapes
- ✅ **Guidance proactive** : Section "Par où commencer ?" avec 3-4 prompts concrets
- ✅ **Transparence outils** : L'agent liste "Mes outils MCP pour cette tâche"
- ✅ **Engagement immédiat** : Call-to-action qui guide naturellement vers l'action
- ✅ **Proactivité experte** : L'agent démontre son expertise dès le premier message

---

## Prochaines Étapes

1. ✅ **Frontend corrigé** - ChatPanel + BoardView
2. ✅ **Backend corrigé** - Task Launch Protocol pour les 4 agents
3. ✅ **Backend redémarré** - Nouveaux system prompts chargés (port 3457)
4. ⏳ **Tester dans le frontend** - Lancer une tâche pour chaque agent et vérifier :
   - Le message ne copie PAS la description mot pour mot
   - Le message contient "## Ce que nous allons faire ensemble"
   - Le message contient "## Par où commencer ?" avec 3-4 prompts concrets
   - Le message contient "## Mes outils MCP pour cette tâche"
   - L'agent résume intelligemment et propose des actions concrètes
5. ⏳ **Valider avec l'utilisateur** que l'expérience correspond à la vision PRD
6. ⏳ **Commit** si validé
7. ⏳ **Phase 2.11** - Auto Phase Transition

---

**Créé par:** Claude Code
**Session:** Phase 2.10.1 - UX Task Launch Fix
**Date:** 2026-03-07
