# Phase 2.9 - Améliorations du Workflow de Tâches

**Date:** 2026-03-03
**Objectif:** Améliorer l'UX du système de gestion des tâches (déblocage automatique, boutons visibles, complétion depuis le chat)

---

## 🎯 Problèmes Identifiés

L'utilisateur a remonté 3 problèmes critiques après les tests Phase 2.8 :

### Problème #1: Tâches dépendantes bloquées
**Symptôme:**
- Tâche #1 complétée → ✅ Status "Terminé"
- Tâche #2 (qui dépend de #1) → ❌ Reste "Bloqué" au lieu de passer à "À faire"

**Impact:** L'utilisateur doit manuellement débloquer chaque tâche, cassant le flow de productivité.

---

### Problème #2: Bouton de complétion invisible
**Symptôme:**
- Le bouton "Terminer la tâche" (petit rond CheckCircle2) n'apparaît que sur hover
- Impossible de le voir si on ne sait pas qu'il existe
- Pas au même niveau de visibilité que le bouton "Lancer"

**Impact:** Les utilisateurs ne savent pas comment marquer une tâche comme terminée.

---

### Problème #3: Pas de bouton de complétion dans le chat
**Symptôme:**
- L'utilisateur travaille avec un agent sur une tâche dans la vue Chat
- Aucun moyen de marquer la tâche comme terminée sans retourner au Board
- Workflow cassé : Chat → Board → Clic Terminer → Retour Chat

**Impact:** Friction UX majeure, perte de contexte.

---

## ✅ Solutions Implémentées

### Solution #1: Déblocage automatique des tâches dépendantes

**Fichier modifié:** `/cockpit/src/store/useHiveStore.ts`

**Logique ajoutée dans `updateTaskStatus`:**

```typescript
// V5 - Auto-unblock dependent tasks when this task is completed
if (status === 'done') {
  console.log('[HIVE] Task completed, checking for dependent tasks to unblock...');

  // Find all tasks that depend on this task
  const dependentTasks = state.tasks.filter((t) =>
    t.depends_on && t.depends_on.includes(taskId) && t.status === 'blocked'
  );

  // For each dependent task, check if all dependencies are now done
  for (const depTask of dependentTasks) {
    const allDependenciesDone = depTask.depends_on?.every((depId) => {
      const dep = state.tasks.find((t) => t.id === depId);
      return dep?.status === 'done';
    });

    if (allDependenciesDone) {
      console.log('[HIVE] Unblocking task:', depTask.title);
      // Unblock this task by setting status to 'todo'
      await supabase.from('tasks').update({ status: 'todo' }).eq('id', depTask.id);

      // Update local state + notification
      state.addNotification({
        type: 'success',
        message: `✅ Tâche débloquée: ${depTask.title}`,
        duration: 5000,
      });
    }
  }
}
```

**Résultat:**
- ✅ Quand une tâche est marquée "Terminé", toutes les tâches qui en dépendent sont automatiquement vérifiées
- ✅ Si toutes les dépendances d'une tâche sont résolues, elle passe de "Bloqué" à "À faire"
- ✅ Notification toast confirmant le déblocage

**Exemple:**
```
Tâche A (done) ← Tâche B (depends_on: [A]) → Passe à "todo" automatiquement
Tâche A, C (done) ← Tâche D (depends_on: [A, C]) → Passe à "todo" automatiquement
Tâche A (done), C (in_progress) ← Tâche D (depends_on: [A, C]) → Reste "blocked" (C pas finie)
```

---

### Solution #2: Bouton de complétion toujours visible

**Fichier modifié:** `/cockpit/src/components/board/TableView.tsx`

**Avant:**
```tsx
{task.status === 'in_progress' && (
  <>
    <button className="btn btn-secondary">Continuer</button>
    <button className="opacity-0 group-hover:opacity-100"> {/* ❌ Invisible */}
      <CheckCircle2 />
    </button>
  </>
)}
```

**Après:**
```tsx
{task.status === 'in_progress' && (
  <>
    <button className="btn btn-secondary text-sm">
      Continuer
      <ChevronRight className="w-4 h-4" />
    </button>
    <button className="btn btn-primary text-sm bg-green-600 hover:bg-green-700"> {/* ✅ Visible */}
      Terminer
      <CheckCircle2 className="w-4 h-4" />
    </button>
  </>
)}
```

**Améliorations:**
- ✅ Bouton "Terminer" visible en permanence (pas de hover nécessaire)
- ✅ Même taille et style que "Lancer" et "Continuer" (cohérence UI)
- ✅ Couleur verte pour signifier l'action de validation
- ✅ Label texte "Terminer" + icône CheckCircle2

**Bonus ajouté:**
```tsx
{/* Blocked indicator */}
{isBlocked && (
  <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">
    🔒 Bloqué
  </span>
)}
```
- Badge "Bloqué" visible pour les tâches en attente de dépendances

---

### Solution #3: Bouton de complétion dans le chat + redirection

**Fichier modifié:** `/cockpit/src/components/chat/ChatPanel.tsx`

**Ajout dans le header:**
```tsx
{/* Task Badge + Complete Button (when in task mode) */}
{taskContext && (
  <div className="flex items-center gap-3">
    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
      <span className="text-xs text-slate-500">Tâche:</span>
      <span className="text-xs font-medium text-slate-700">
        {taskContext.title}
      </span>
    </div>
    <button
      onClick={async () => {
        if (window.confirm('Marquer cette tâche comme terminée ?')) {
          // Update task status to done
          await useHiveStore.getState().updateTaskStatus(taskContext.taskId, 'done');

          // Add success notification
          useHiveStore.getState().addNotification({
            type: 'success',
            message: `✅ Tâche terminée: ${taskContext.title}`,
            duration: 5000,
          });

          // Clear task context
          useHiveStore.setState({
            taskContext: null,
            activeTaskId: null,
          });

          // Redirect to board
          navigate(`/board/${project?.id}`);
        }
      }}
      className="btn btn-primary bg-green-600 hover:bg-green-700 text-sm"
    >
      <CheckCircle2 className="w-4 h-4" />
      Terminer
    </button>
  </div>
)}
```

**Workflow complet:**
1. ✅ Utilisateur travaille avec un agent sur une tâche dans le chat
2. ✅ Bouton "Terminer" visible en haut à droite du chat (à côté du badge tâche)
3. ✅ Clic → Confirmation "Marquer cette tâche comme terminée ?"
4. ✅ Si Oui → Tâche marquée "done" + Notification success
5. ✅ Redirection automatique vers le Board (`/board/{projectId}`)
6. ✅ Tâche affichée comme "Terminé" dans le tableau
7. ✅ Tâches dépendantes débloquées automatiquement (Solution #1)
8. ✅ Prochaine tâche prête à être lancée avec bouton "Lancer" visible

---

## 🎨 Impact UX

### Avant (Phase 2.8)
```
┌──────────────────────────────────────────┐
│ Board View - Table                       │
├──────────────────────────────────────────┤
│ Tâche A  [Status: En cours]  [Continuer] │ ← Hover pour voir bouton Terminer
│ Tâche B  [Status: Bloqué]    [Bloqué]    │ ← Reste bloqué même si A finie
│ Tâche C  [Status: À faire]   (hover)     │ ← Hover pour voir bouton Lancer
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ Chat View - Agent Sora                   │
├──────────────────────────────────────────┤
│ Header: Sora | Badge: Tâche A           │ ← Aucun bouton pour terminer
│ [Messages...]                            │
└──────────────────────────────────────────┘
```

### Après (Phase 2.9)
```
┌────────────────────────────────────────────────────────┐
│ Board View - Table                                     │
├────────────────────────────────────────────────────────┤
│ Tâche A  [Status: En cours]  [Continuer] [✓ Terminer] │ ← Boutons toujours visibles
│ Tâche B  [Status: À faire]   [Lancer]                 │ ← Auto-débloqué quand A finie
│ Tâche C  [Status: À faire]   [Lancer]                 │ ← Bouton visible au hover
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ Chat View - Agent Sora                                 │
├────────────────────────────────────────────────────────┤
│ Header: Sora | Badge: Tâche A | [✓ Terminer]          │ ← Bouton terminer visible
│ [Messages...]                                          │
└────────────────────────────────────────────────────────┘
```

---

## 🧪 Tests à Effectuer

### Test Workflow Complet
1. **Créer un projet avec tâches dépendantes**
   - Tâche A (pas de dépendances)
   - Tâche B (depends_on: [A])
   - Tâche C (depends_on: [A, B])

2. **Lancer Tâche A depuis le Board**
   - ✅ Bouton "Lancer" visible
   - ✅ Redirection vers Chat avec Sora
   - ✅ Badge "Tâche: Accès Google Search Console" visible
   - ✅ Bouton "Terminer" visible à droite du badge

3. **Terminer Tâche A depuis le Chat**
   - ✅ Clic "Terminer" → Confirmation
   - ✅ Notification "✅ Tâche terminée"
   - ✅ Notification "✅ Tâche débloquée: Tâche B"
   - ✅ Redirection vers Board
   - ✅ Tâche A = "Terminé" (badge vert)
   - ✅ Tâche B = "À faire" (bouton "Lancer" visible)
   - ✅ Tâche C = "Bloqué" (badge rouge, attend que B soit finie)

4. **Terminer Tâche B depuis le Board**
   - ✅ Clic "Continuer" → Chat
   - ✅ Ou clic "Terminer" directement depuis le tableau
   - ✅ Tâche C auto-débloquée

---

## 📊 Conformité avec le PRD

Ces améliorations implémentent les spécifications du PRD Section 4.A :

### ✅ A2. Visualisation des dépendances
> "Tâches bloquées (dépendances non résolues) = status `blocked` automatique"

**Implémenté:**
- Auto-déblocage quand toutes les dépendances sont résolues
- Badge "🔒 Bloqué" visible dans le tableau

### ✅ A4. Automation de workflow
> "Quand toutes les tâches d'une phase sont 'done', auto-transition vers la phase suivante"

**Implémenté (partie 1/2):**
- Auto-déblocage des tâches dépendantes ✅
- Auto-transition de phase (à implémenter en Phase 2.10) 🚧

---

## 🎯 Prochaines Étapes (Phase 2.10)

### Auto-transition de phase
Quand toutes les tâches d'une phase sont "done", passer automatiquement à la phase suivante :

```typescript
// Dans updateTaskStatus, après le déblocage :
const currentPhase = state.currentProject?.current_phase;
const phaseTasks = state.tasks.filter(t => t.phase === currentPhase);
const allPhaseDone = phaseTasks.every(t => t.status === 'done');

if (allPhaseDone) {
  const nextPhase = getNextPhase(currentPhase);
  await state.updateProjectPhase(nextPhase);

  state.addNotification({
    type: 'success',
    message: `🎉 Phase ${currentPhase} terminée ! Passage à ${nextPhase}`,
    duration: 8000,
  });
}
```

---

## ✅ Validation Phase 2.9

**Critères de validation:**
- [x] ✅ Tâches dépendantes auto-débloquées quand dépendances résolues
- [x] ✅ Bouton "Terminer" visible en permanence dans TableView
- [x] ✅ Bouton "Terminer" présent dans ChatView
- [x] ✅ Redirection vers Board après complétion depuis le chat
- [x] ✅ Notifications success/débloquage affichées
- [ ] 🧪 Tests utilisateur validés

**Status:** ✅ **CODE APPLIQUÉ** - En attente validation utilisateur

---

**Créé par:** Claude Code
**Session:** Phase 2.9 - Task Workflow Improvements
**Commit:** À faire après validation tests
