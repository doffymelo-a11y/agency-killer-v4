# Genesis V2 - Guide de Test Frontend

## Status Technique

### ✅ Backend
- **100% opérationnel et testé** (16/16 tests réussis)
- Injection contexte validée
- Tous les agents fonctionnels

### ✅ Frontend - Code Modifié
- `cockpit/src/lib/wizard-config.ts` : GLOBAL_CONTEXT_QUESTIONS + SCALE_QUESTION
- `cockpit/src/services/api.ts` : transformSharedMemory enrichi
- `cockpit/src/types/index.ts` : ProjectMetadata mis à jour

### ⚠️ Frontend - Tests Manuels Requis
Les modifications frontend n'ont PAS encore été testées end-to-end depuis l'interface utilisateur.

---

## Test Rapide (5 minutes)

### Prérequis
1. Backend démarré : `cd backend && npm run dev` (port 3457)
2. Frontend démarré : `cd cockpit && npm run dev` (port 5175)
3. Ouvrir navigateur : **http://localhost:5175**

---

## Test 1 : Vérifier les Questions Globales

### Étape 1 : Créer un nouveau projet
1. Cliquer sur le bouton **Créer un projet** ou **+**
2. Sélectionner un scope (par exemple : **Meta Ads**)

### Étape 2 : Vérifier les 7 questions globales
✅ Ces questions doivent apparaître **EN PREMIER**, avant les questions spécifiques au scope :

| # | Question | Champ | Exemple réponse |
|---|----------|-------|-----------------|
| 1 | Dans quel secteur d'activité... | industry | Ecommerce |
| 2 | Quel est votre objectif business... | business_goal | Augmenter les ventes |
| 3 | Décrivez votre audience cible... | persona | Femmes 25-40 ans, urbaines |
| 4 | Qui sont vos principaux concurrents... | competitors | nike.com, adidas.com |
| 5 | Quel ton souhaitez-vous... | brand_voice | Friendly |
| 6 | Quel est votre budget mensuel... | budget | 5000 |
| 7 | Quelle est l'envergure de ce projet ? | project_scale | **Campagne structurée (1-2 mois)** |

### Étape 3 : Vérifier la question SCALE
**Question SCALE (nouvelle) :**
```
Quelle est l'envergure de ce projet ?

○ Action ciblée (1-2 semaines) [sprint - 40% des tâches]
○ Campagne structurée (1-2 mois) [campaign - 70% des tâches]
○ Stratégie complète (3+ mois) [strategy - 100% des tâches]
```

**Validation :**
- [ ] La question SCALE apparaît **JUSTE AVANT** les questions spécifiques du scope
- [ ] Les 3 options sont visibles
- [ ] On peut sélectionner une option

---

## Test 2 : Vérifier la Création de Projet

### Étape 1 : Remplir le wizard
1. Remplir toutes les questions globales
2. Sélectionner **campaign** pour le scale
3. Remplir les questions spécifiques au scope (Meta Ads)
4. Cliquer sur **Créer le projet**

### Étape 2 : Vérifier le nombre de tâches
**Expected behavior :**
- **Sprint (40%)** : ~6 tâches pour Meta Ads
- **Campaign (70%)** : ~10 tâches pour Meta Ads
- **Strategy (100%)** : ~14 tâches pour Meta Ads

**Validation :**
- [ ] Le projet est créé sans erreur
- [ ] Le nombre de tâches correspond au scale sélectionné
- [ ] Les tâches apparaissent dans le Board

---

## Test 3 : Vérifier l'Injection de Contexte dans les Agents

### Étape 1 : Ouvrir le chat
1. Dans le projet créé, ouvrir le **Chat Panel**
2. Sélectionner un agent (par exemple : **MARCUS**)

### Étape 2 : Poser une question contextuelle
**Question test :**
```
Quel est mon objectif business et mon budget pour cette campagne ?
```

**Expected behavior :**
L'agent MARCUS doit mentionner dans sa réponse :
- L'objectif business que vous avez indiqué (ex: "augmenter les ventes")
- Le budget mensuel (ex: "5000€")
- Possiblement d'autres infos du contexte (persona, secteur)

**Validation :**
- [ ] L'agent répond en moins de 30 secondes
- [ ] La réponse mentionne l'objectif business
- [ ] La réponse mentionne le budget
- [ ] Le contexte est cohérent avec ce qui a été saisi dans le wizard

---

## Test 4 : Vérifier Tous les Scopes

Répéter le **Test 1** et **Test 2** pour chacun de ces scopes :

| Scope | Scale à tester | Tâches attendues |
|-------|---------------|------------------|
| ✅ Meta Ads | campaign | ~10 tâches |
| ✅ Google Ads (SEM) | sprint | ~7 tâches |
| ✅ SEO | strategy | ~26 tâches |
| ✅ Analytics | campaign | ~11 tâches |
| ✅ Social Media | sprint | ~4 tâches |

**Validation :**
- [ ] Tous les scopes affichent les 7 questions globales + SCALE
- [ ] Le nombre de tâches varie selon le scale
- [ ] Pas de doublon de questions

---

## Debugging : Vérifier le Payload Frontend → Backend

### Option 1 : Console DevTools
1. Ouvrir DevTools (F12)
2. Aller dans l'onglet **Network**
3. Filtrer par **Fetch/XHR**
4. Créer un projet
5. Inspecter la requête POST vers `/api/projects/create` ou `/genesis`

**Payload attendu :**
```json
{
  "project_name": "...",
  "project_scope": "meta_ads",
  "project_metadata": {
    "industry": "ecommerce",
    "business_goal": "increase_sales",
    "persona": "Femmes 25-40 ans...",
    "competitors": "nike.com, adidas.com",
    "brand_voice": "friendly",
    "budget": "5000",
    "project_scale": "campaign",
    // + champs spécifiques au scope
  }
}
```

**Validation :**
- [ ] Le payload contient `industry`, `business_goal`, `persona`, `competitors`, `brand_voice`
- [ ] Le payload contient `project_scale`
- [ ] Les valeurs correspondent à ce qui a été saisi

### Option 2 : Logs Backend
Terminal backend doit afficher :
```
[Agent Executor] Context injected into system prompt: {
  project_name: 'Mon Projet Test',
  industry: 'ecommerce',
  target_audience: 'Femmes 25-40 ans...',
  brand_voice: 'friendly',
  budget: 5000,
  ...
}
```

---

## Problèmes Connus

### 1. Questions en double
**Symptôme :** La question "persona" apparaît 2 fois
**Cause :** GLOBAL_CONTEXT_QUESTIONS + question scope-specific avec même ID
**Fix :** La deduplication par ID devrait gérer ça automatiquement

**Vérifier :**
```typescript
// Dans wizard-config.ts ligne ~371
const questions = [...GLOBAL_CONTEXT_QUESTIONS];
const scopeQuestions = WIZARD_FLOWS[scope] || [];

// Deduplication
const existingIds = new Set(questions.map(q => q.id));
for (const q of scopeQuestions) {
  if (!existingIds.has(q.id)) {
    questions.push(q);
  }
}
```

### 2. Scale ne filtre pas les tâches
**Symptôme :** Toutes les tâches sont créées quel que soit le scale
**Cause :** `filterTasksByAnswers()` non appelé ou bug dans le filtrage

**Vérifier :**
```typescript
// Dans wizard-config.ts ligne ~1036
export function filterTasksByAnswers(
  tasks: Task[],
  answers: WizardAnswers
): Task[] {
  const scale = answers.project_scale as TaskScale | undefined;
  if (!scale) return tasks; // Pas de filtrage si pas de scale

  return tasks.filter(task => {
    if (!task.available_at_scale) return true; // Garder si pas de restriction
    return task.available_at_scale.includes(scale);
  });
}
```

### 3. Contexte pas injecté dans les agents
**Symptôme :** L'agent ne mentionne pas le contexte du projet
**Cause :** `transformSharedMemory()` ne mappe pas les nouveaux champs

**Vérifier :**
```typescript
// Dans api.ts ligne ~147
export function transformSharedMemory(metadata: ProjectMetadata) {
  return {
    // ... existing fields
    business_goal: metadata.business_goal || metadata.businessGoal || '',
    pain_point: metadata.pain_point || '',
    offer_hook: metadata.offer_hook || '',
    visual_tone: metadata.visual_tone || '',
    competitors_list: Array.isArray(metadata.competitors)
      ? metadata.competitors.join(', ')
      : metadata.competitors || '',
    // ...
  };
}
```

---

## Checklist Finale

### Backend
- [x] Tests automatisés réussis (16/16)
- [x] Contexte injecté dans system prompts
- [x] `buildGenesisContextBlock()` fonctionne

### Frontend - Code
- [x] `GLOBAL_CONTEXT_QUESTIONS` ajouté (7 questions)
- [x] `SCALE_QUESTION` ajouté
- [x] `transformSharedMemory()` enrichi
- [x] Types `ProjectMetadata` mis à jour
- [x] Deduplication par ID implémentée
- [x] `filterTasksByAnswers()` mis à jour

### Frontend - Tests Manuels
- [ ] Questions globales apparaissent dans le wizard
- [ ] Question SCALE fonctionne
- [ ] Projet créé avec scale = nombre tâches correct
- [ ] Agents reçoivent et utilisent le contexte
- [ ] Tous les scopes fonctionnent
- [ ] Pas de doublon de questions

---

## Résultat Attendu

Si Genesis V2 fonctionne correctement en frontend :

✅ **Wizard amélioré** : 7 questions globales + échelle projet
✅ **Filtrage intelligent** : 40% / 70% / 100% des tâches selon scale
✅ **Contexte enrichi** : Agents utilisent industry, business_goal, persona, etc.
✅ **Zero breaking change** : Anciens projets continuent de fonctionner

**Si tout est vert** → Genesis V2 est 100% opérationnel frontend + backend !

---

## Next Steps

1. **Test manuel** : Suivre ce guide (15 minutes)
2. **Fixer bugs éventuels** : Si des problèmes sont détectés
3. **Test de régression** : Vérifier qu'un ancien projet fonctionne toujours
4. **Deploy** : Si tout est OK, déployer en production

---

**Testé par :** À faire manuellement
**Date :** 18 mars 2026
**Version :** Genesis V2 (commit b7d6351 backend + 1b4323f tests)
