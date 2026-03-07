// ═══════════════════════════════════════════════════════════════
// Table View Component
// ═══════════════════════════════════════════════════════════════

import { motion } from 'framer-motion';
import { ChevronRight, CheckCircle2, Circle } from 'lucide-react';
import { AGENTS } from '../../types';
import type { Task } from '../../types';
import AgentAvatar from './common/AgentAvatar';
import StatusBadge from './common/StatusBadge';
import PhaseBadge from './common/PhaseBadge';

// ─────────────────────────────────────────────────────────────────
// Task Row Component
// ─────────────────────────────────────────────────────────────────

interface TaskRowProps {
  task: Task;
  onLaunch: () => void;
  onClickTask: () => void;
  onComplete: () => void;
  onReopen: () => void;
}

function TaskRow({
  task,
  onLaunch,
  onClickTask,
  onComplete,
  onReopen,
}: TaskRowProps) {
  const agent = AGENTS[task.assignee];
  const isBlocked = task.status === 'blocked';

  // Truncate description to ~100 chars
  const truncatedDescription = task.description
    ? task.description.length > 100
      ? task.description.substring(0, 100) + '...'
      : task.description
    : '';

  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`task-row group ${isBlocked ? 'task-row-blocked' : ''} cursor-pointer hover:bg-slate-50`}
      onClick={onClickTask}
    >
      {/* Task Title */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <AgentAvatar agentId={task.assignee} />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-slate-900">{task.title}</p>
          </div>
        </div>
      </td>

      {/* Description */}
      <td className="px-4 py-3">
        <p className="text-sm text-slate-600 line-clamp-2 max-w-md">
          {truncatedDescription || 'Aucune description'}
        </p>
      </td>

      {/* Agent */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-medium px-2 py-1 rounded-full"
            style={{
              backgroundColor: agent.color.light,
              color: agent.color.dark,
            }}
          >
            {agent.name}
          </span>
        </div>
      </td>

      {/* Phase */}
      <td className="px-4 py-3">
        <PhaseBadge phase={task.phase} />
      </td>

      {/* Due Date */}
      <td className="px-4 py-3 text-sm text-slate-600">
        {new Date(task.due_date).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'short',
        })}
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <StatusBadge status={task.status} />
      </td>

      {/* Hours */}
      <td className="px-4 py-3 text-sm text-slate-500">
        {task.estimated_hours}h
      </td>

      {/* Action */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {/* Launch button - visible on hover */}
          {task.status === 'todo' && !isBlocked && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLaunch();
              }}
              className="btn btn-primary text-sm opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Lancer
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
          {/* Continue + Complete buttons - always visible when in_progress */}
          {task.status === 'in_progress' && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onLaunch();
                }}
                className="btn btn-secondary text-sm"
              >
                Continuer
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onComplete();
                }}
                className="btn btn-primary text-sm bg-green-600 hover:bg-green-700"
                title="Marquer comme terminée"
              >
                Terminer
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </>
          )}
          {/* Reopen button - visible on hover */}
          {task.status === 'done' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReopen();
              }}
              className="btn btn-ghost text-sm opacity-0 group-hover:opacity-100 transition-opacity"
              title="Rouvrir la tâche"
            >
              <Circle className="w-4 h-4" />
              Rouvrir
            </button>
          )}
          {/* Blocked indicator */}
          {isBlocked && (
            <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">
              🔒 Bloqué
            </span>
          )}
        </div>
      </td>
    </motion.tr>
  );
}

// ─────────────────────────────────────────────────────────────────
// Table View Component
// ─────────────────────────────────────────────────────────────────

export interface TableViewProps {
  tasks: Task[];
  onLaunchTask: (taskId: string) => void;
  onClickTask: (task: Task) => void;
  onCompleteTask: (taskId: string) => void;
  onReopenTask: (taskId: string) => void;
}

export default function TableView({
  tasks,
  onLaunchTask,
  onClickTask,
  onCompleteTask,
  onReopenTask,
}: TableViewProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Aucune tâche pour le moment</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Tâche
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-1/3">
              Description
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Agent
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Phase
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Deadline
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Statut
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Durée
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onLaunch={() => onLaunchTask(task.id)}
              onClickTask={() => onClickTask(task)}
              onComplete={() => onCompleteTask(task.id)}
              onReopen={() => onReopenTask(task.id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
