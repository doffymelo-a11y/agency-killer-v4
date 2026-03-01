// ═══════════════════════════════════════════════════════════════
// Task Detail Modal Component
// ═══════════════════════════════════════════════════════════════

import { motion } from 'framer-motion';
import { X, ChevronRight } from 'lucide-react';
import { AGENTS } from '../../types';
import type { Task } from '../../types';
import AgentAvatar from './common/AgentAvatar';
import StatusBadge from './common/StatusBadge';
import PhaseBadge from './common/PhaseBadge';

export interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
  onLaunch: () => void;
}

export default function TaskDetailModal({
  task,
  onClose,
  onLaunch,
}: TaskDetailModalProps) {
  const agent = AGENTS[task.assignee];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-4 p-6 border-b border-slate-200">
          <AgentAvatar agentId={task.assignee} size="lg" />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              {task.title}
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-xs font-medium px-2 py-1 rounded-full"
                style={{
                  backgroundColor: agent.color.light,
                  color: agent.color.dark,
                }}
              >
                {agent.name}
              </span>
              <PhaseBadge phase={task.phase} />
              <StatusBadge status={task.status} />
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-200px)]">
          {/* Description */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">
              Description
            </h3>
            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
              {task.description || 'Aucune description disponible.'}
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Deadline
              </h4>
              <p className="text-slate-900 font-medium">
                {new Date(task.due_date).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Durée estimée
              </h4>
              <p className="text-slate-900 font-medium">{task.estimated_hours}h</p>
            </div>
          </div>

          {/* Context Questions */}
          {task.context_questions && task.context_questions.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                Questions de contexte
              </h3>
              <ul className="space-y-2">
                {task.context_questions.map((question, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-cyan-600 mt-0.5">•</span>
                    <span className="text-slate-600">{question}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* User Inputs */}
          {task.user_inputs && Object.keys(task.user_inputs).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                Informations fournies
              </h3>
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                {Object.entries(task.user_inputs).map(([key, value]) => (
                  <div key={key}>
                    <span className="text-xs font-medium text-slate-500">{key}:</span>
                    <span className="text-sm text-slate-900 ml-2">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
          <button onClick={onClose} className="btn btn-ghost">
            Fermer
          </button>
          {(task.status === 'todo' || task.status === 'in_progress') && (
            <button onClick={onLaunch} className="btn btn-primary">
              {task.status === 'todo' ? 'Lancer la tâche' : 'Continuer'}
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
