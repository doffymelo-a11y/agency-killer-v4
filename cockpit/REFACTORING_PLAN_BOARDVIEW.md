# 🔨 PLAN DE REFACTORING - BoardView.tsx

**Date:** 2026-02-10
**Fichier cible:** `src/views/BoardView.tsx` (1194 lignes, 41KB)
**Objectif:** Découper en sous-composants < 400 lignes, BoardView orchestrateur < 250 lignes

---

## 📊 ÉTAT ACTUEL

| Métrique | Valeur |
|---|---|
| **Lignes totales** | 1194 |
| **Taille** | 41KB |
| **Composants inline** | 12 |
| **Dépendances** | 25 imports |
| **Maintenabilité** | ❌ Critique |

---

## 🎯 ARCHITECTURE CIBLE

```
views/
  └── BoardView.tsx                     (< 250L — orchestrateur)

components/board/
  ├── common/
  │   ├── AgentAvatar.tsx               (25L)
  │   ├── StatusBadge.tsx               (25L)
  │   └── PhaseBadge.tsx                (20L)
  ├── BoardHeader.tsx                   (150L — stats + nav + view toggle)
  ├── TableView.tsx                     (350L — TanStack table)
  ├── KanbanView.tsx                    (300L — dnd-kit)
  ├── CalendarView.tsx                  (120L — FullCalendar)
  ├── TaskDetailModal.tsx               (250L — modal détail tâche)
  └── types.ts                          (50L — types locaux)
```

---

## 📋 EXTRACTION PLAN

### Phase 1: Composants Communs (simples)

#### 1.1 AgentAvatar.tsx
**Lignes source:** 61-85 (25 lignes)
**Destination:** `components/board/common/AgentAvatar.tsx`

**Props:**
```typescript
interface AgentAvatarProps {
  agentId: AgentRole;
  size?: 'sm' | 'md' | 'lg';
}
```

**Dépendances:**
- `AGENTS` from `../../types`
- `AgentRole` from `../../types`

---

#### 1.2 StatusBadge.tsx
**Lignes source:** 91-111 (21 lignes)
**Destination:** `components/board/common/StatusBadge.tsx`

**Props:**
```typescript
interface StatusBadgeProps {
  status: TaskStatus;
}
```

**Dépendances:**
- `TaskStatus` from `../../types`
- Icons: `Circle`, `Clock`, `CheckCircle2`, `Lock` from `lucide-react`

---

#### 1.3 PhaseBadge.tsx
**Lignes source:** 113-124 (12 lignes)
**Destination:** `components/board/common/PhaseBadge.tsx`

**Props:**
```typescript
interface PhaseBadgeProps {
  phase: string;
}
```

---

### Phase 2: Composants de Vue Complexes

#### 2.1 TaskDetailModal.tsx
**Lignes source:** 126-269 (144 lignes)
**Destination:** `components/board/TaskDetailModal.tsx`

**Props:**
```typescript
interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onLaunch: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}
```

**Composants internes:**
- Utilise `AgentAvatar`, `StatusBadge`, `PhaseBadge`

**Dépendances:**
- `motion.div` from `framer-motion`
- `X`, `MessageSquare`, `Calendar`, `User`, `Tag`, `Clock`, `Trash2` from `lucide-react`
- `Task` from `../../types`

---

#### 2.2 TableView.tsx
**Lignes source:** 418-490 (73 lignes) + TaskRow 271-417 (147 lignes) = **220 lignes total**
**Destination:** `components/board/TableView.tsx`

**Props:**
```typescript
interface TableViewProps {
  tasks: Task[];
  onLaunchTask: (taskId: string) => void;
  onTaskClick: (task: Task) => void;
}
```

**Composants internes:**
- `TaskRow` (à intégrer dans TableView.tsx)
- Utilise `AgentAvatar`, `StatusBadge`, `PhaseBadge`

**Dépendances:**
- `motion.tr` from `framer-motion`
- `ChevronRight` from `lucide-react`
- `Task` from `../../types`

**Note:** TanStack React Table peut être ajouté plus tard pour améliorer les perfs, mais garder la version simple pour l'instant.

---

#### 2.3 KanbanView.tsx
**Lignes source:** 614-674 (61L) + KanbanCard 491-556 (66L) + KanbanColumn 557-613 (57L) = **184 lignes total**
**Destination:** `components/board/KanbanView.tsx`

**Props:**
```typescript
interface KanbanViewProps {
  tasks: Task[];
  onLaunchTask: (taskId: string) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
}
```

**Composants internes:**
- `KanbanCard` (à intégrer)
- `KanbanColumn` (à intégrer)
- Utilise `AgentAvatar`, `StatusBadge`

**Dépendances:**
- `DndContext`, `closestCenter`, etc. from `@dnd-kit/core`
- `SortableContext`, `useSortable`, etc. from `@dnd-kit/sortable`
- `CSS` from `@dnd-kit/utilities`
- `motion.div` from `framer-motion`
- `MessageSquare`, `Clock` from `lucide-react`

---

#### 2.4 CalendarView.tsx
**Lignes source:** 675-730 (56 lignes)
**Destination:** `components/board/CalendarView.tsx`

**Props:**
```typescript
interface CalendarViewProps {
  tasks: Task[];
  onLaunchTask: (taskId: string) => void;
}
```

**Dépendances:**
- `FullCalendar` from `@fullcalendar/react`
- `dayGridPlugin` from `@fullcalendar/daygrid`
- `frLocale` from `@fullcalendar/core/locales/fr`
- `AGENTS` from `../../types`

---

#### 2.5 BoardHeader.tsx (nouveau composant)
**Lignes source:** À extraire de BoardView principal (807-1194)
**Destination:** `components/board/BoardHeader.tsx`

**Contenu à extraire:**
- Stats widget (AgentStatsWidget ligne 767-806)
- ViewToggle (ligne 731-766)
- Boutons navigation (Files, Analytics, Integrations)
- Bouton "Nouvelle tâche"

**Props:**
```typescript
interface BoardHeaderProps {
  projectName: string;
  tasks: Task[];
  viewMode: 'table' | 'kanban' | 'calendar';
  onViewModeChange: (mode: 'table' | 'kanban' | 'calendar') => void;
  onNewTask: () => void;
  onNavigate: (path: string) => void;
}
```

**Composants internes:**
- `ViewToggle`
- `AgentStatsWidget`

---

### Phase 3: Orchestrateur BoardView.tsx

**Lignes cible:** < 250 lignes

**Responsabilités:**
1. ✅ Charger le projet depuis Supabase
2. ✅ Gérer les subscriptions Realtime
3. ✅ Gérer le state local (selectedTask, viewMode)
4. ✅ Dispatcher les actions (updateTask, launchTask, deleteTask)
5. ✅ Render layout avec sous-composants

**Structure simplifiée:**
```typescript
export default function BoardView() {
  // ─── Hooks ───
  const { projectId } = useParams();
  const navigate = useNavigate();
  const project = useCurrentProject();
  const tasks = useTasks();
  const { viewMode, setViewMode } = useBoardView();
  const isLoading = useIsLoading();

  // ─── Local State ───
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ─── Effects ───
  useEffect(() => {
    // Load project + subscribe
  }, [projectId]);

  // ─── Handlers ───
  const handleLaunchTask = (taskId: string) => { /* ... */ };
  const handleTaskClick = (task: Task) => { /* ... */ };
  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => { /* ... */ };
  const handleDeleteTask = (taskId: string) => { /* ... */ };
  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => { /* ... */ };

  // ─── Render ───
  if (isLoading) return <LoadingSpinner />;
  if (!project) return <ErrorState />;

  return (
    <div className="h-screen flex flex-col">
      <BoardHeader
        projectName={project.name}
        tasks={tasks}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onNewTask={() => {/* ... */}}
        onNavigate={navigate}
      />

      <div className="flex-1 overflow-auto p-6">
        {viewMode === 'table' && (
          <TableView
            tasks={tasks}
            onLaunchTask={handleLaunchTask}
            onTaskClick={handleTaskClick}
          />
        )}
        {viewMode === 'kanban' && (
          <KanbanView
            tasks={tasks}
            onLaunchTask={handleLaunchTask}
            onStatusChange={handleStatusChange}
          />
        )}
        {viewMode === 'calendar' && (
          <CalendarView
            tasks={tasks}
            onLaunchTask={handleLaunchTask}
          />
        )}
      </div>

      <TaskDetailModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdate={handleUpdateTask}
        onLaunch={() => handleLaunchTask(selectedTask!.id)}
        onDelete={handleDeleteTask}
      />
    </div>
  );
}
```

---

## 🔄 ORDRE D'EXÉCUTION

### Étape 1: Créer dossier structure
```bash
mkdir -p cockpit/src/components/board/common
touch cockpit/src/components/board/types.ts
```

### Étape 2: Extraire composants communs (simples)
1. ✅ `AgentAvatar.tsx`
2. ✅ `StatusBadge.tsx`
3. ✅ `PhaseBadge.tsx`

### Étape 3: Extraire composants de vue (complexes)
4. ✅ `TaskDetailModal.tsx`
5. ✅ `CalendarView.tsx` (le plus simple des 3)
6. ✅ `TableView.tsx` (inclut TaskRow)
7. ✅ `KanbanView.tsx` (inclut KanbanCard + KanbanColumn)

### Étape 4: Créer BoardHeader
8. ✅ `BoardHeader.tsx` (extrait de BoardView + ViewToggle + AgentStatsWidget)

### Étape 5: Refactorer BoardView.tsx
9. ✅ Supprimer tous les composants inline
10. ✅ Importer les nouveaux composants
11. ✅ Simplifier la logique (< 250 lignes)

### Étape 6: Vérification
12. ✅ `npm run build` — succès
13. ✅ `npx tsc --noEmit` — 0 erreur
14. ✅ Test manuel — aucune régression

---

## 📝 CHECKLIST DE QUALITÉ

Après CHAQUE extraction de composant:

- [ ] TypeScript strict — 0 `any`
- [ ] Props interface exportée
- [ ] Imports optimisés (pas de `import *`)
- [ ] Composant < 400 lignes
- [ ] `export default function ComponentName()`
- [ ] Pas de `console.log` (sauf `import.meta.env.DEV`)

Après refactoring complet:

- [ ] BoardView.tsx < 250 lignes ✅
- [ ] Tous sous-composants < 400 lignes ✅
- [ ] `npm run build` succès ✅
- [ ] `npx tsc --noEmit` 0 erreur ✅
- [ ] Protocole sécurité (grep dangerouslySetInnerHTML, eval, etc.) ✅
- [ ] Tests manuels: Table, Kanban, Calendar, Modal ✅

---

## 🎯 RÉSULTAT ATTENDU

**Avant:**
```
BoardView.tsx: 1194 lignes, 41KB ❌
```

**Après:**
```
BoardView.tsx:             ~200 lignes ✅
BoardHeader.tsx:           ~150 lignes ✅
TableView.tsx:             ~220 lignes ✅
KanbanView.tsx:            ~184 lignes ✅
CalendarView.tsx:          ~56 lignes ✅
TaskDetailModal.tsx:       ~144 lignes ✅
AgentAvatar.tsx:           ~25 lignes ✅
StatusBadge.tsx:           ~21 lignes ✅
PhaseBadge.tsx:            ~12 lignes ✅

Total: ~1012 lignes réparties (au lieu de 1194 en un seul fichier)
Maintenabilité: ✅ Excellente
```

---

**Créé par Claude Code - The Hive OS V4**
**Status:** 📋 Plan approuvé — Prêt à exécuter
