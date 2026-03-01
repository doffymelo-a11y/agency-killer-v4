// ═══════════════════════════════════════════════════════════════
// Kanban View Component
// ═══════════════════════════════════════════════════════════════

import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AGENTS } from '../../types';
import type { Task, TaskStatus } from '../../types';
import AgentAvatar from './common/AgentAvatar';

// ─────────────────────────────────────────────────────────────────
// Kanban Card Component (Draggable)
// ─────────────────────────────────────────────────────────────────

interface KanbanCardProps {
  task: Task;
  onLaunch: () => void;
}

function KanbanCard({ task, onLaunch }: KanbanCardProps) {
  const agent = AGENTS[task.assignee];
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="kanban-card p-4 cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-start gap-3">
        <AgentAvatar agentId={task.assignee} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 line-clamp-2">
            {task.title}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: agent.color.light,
                color: agent.color.dark,
              }}
            >
              {agent.name}
            </span>
            <span className="text-xs text-slate-400">
              {task.estimated_hours}h
            </span>
          </div>
        </div>
      </div>
      {(task.status === 'todo' || task.status === 'in_progress') && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onLaunch();
          }}
          className="mt-3 w-full btn btn-ghost text-xs justify-center"
        >
          {task.status === 'todo' ? 'Lancer' : 'Continuer'}
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Kanban Column Component
// ─────────────────────────────────────────────────────────────────

interface KanbanColumnProps {
  title: string;
  tasks: Task[];
  onLaunchTask: (taskId: string) => void;
  color: string;
}

function KanbanColumn({
  title,
  tasks,
  onLaunchTask,
  color,
}: KanbanColumnProps) {
  return (
    <div className="kanban-column p-4 min-w-[280px] max-w-[320px] flex-shrink-0">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          <h3 className="font-semibold text-slate-700">{title}</h3>
        </div>
        <span className="text-sm text-slate-400 bg-white px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>
      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          <AnimatePresence>
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <KanbanCard task={task} onLaunch={() => onLaunchTask(task.id)} />
              </motion.div>
            ))}
          </AnimatePresence>
          {tasks.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-sm">
              Aucune tâche
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Kanban View Component
// ─────────────────────────────────────────────────────────────────

export interface KanbanViewProps {
  tasks: Task[];
  onLaunchTask: (taskId: string) => void;
  onUpdateStatus: (taskId: string, status: TaskStatus) => void;
}

export default function KanbanView({
  tasks,
  onLaunchTask,
  onUpdateStatus,
}: KanbanViewProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const columns: { status: TaskStatus; title: string; color: string }[] = [
    { status: 'todo', title: 'À faire', color: '#94A3B8' },
    { status: 'in_progress', title: 'En cours', color: '#F59E0B' },
    { status: 'done', title: 'Terminé', color: '#10B981' },
    { status: 'blocked', title: 'Bloqué', color: '#EF4444' },
  ];

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      // Find which column the task was dropped into
      const taskId = active.id as string;
      const overTask = tasks.find((t) => t.id === over.id);
      if (overTask) {
        onUpdateStatus(taskId, overTask.status);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 px-2">
        {columns.map((col) => (
          <KanbanColumn
            key={col.status}
            title={col.title}
            color={col.color}
            tasks={tasks.filter((t) => t.status === col.status)}
            onLaunchTask={onLaunchTask}
          />
        ))}
      </div>
    </DndContext>
  );
}
