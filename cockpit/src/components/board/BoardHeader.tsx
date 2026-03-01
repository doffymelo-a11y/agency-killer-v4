// ═══════════════════════════════════════════════════════════════
// Board Header Component
// ═══════════════════════════════════════════════════════════════

import { motion } from 'framer-motion';
import {
  LayoutGrid,
  Table2,
  Calendar as CalendarIcon,
  Plus,
  MessageSquare,
} from 'lucide-react';
import type { Task } from '../../types';
import { useHiveStore, useBoardView } from '../../store/useHiveStore';

// ─────────────────────────────────────────────────────────────────
// View Toggle Component
// ─────────────────────────────────────────────────────────────────

function ViewToggle() {
  const boardView = useBoardView();
  const setBoardView = useHiveStore((state) => state.setBoardView);

  const views = [
    { id: 'table', icon: Table2, label: 'Tableur' },
    { id: 'kanban', icon: LayoutGrid, label: 'Kanban' },
    { id: 'calendar', icon: CalendarIcon, label: 'Calendrier' },
  ] as const;

  return (
    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
      {views.map((view) => (
        <button
          key={view.id}
          onClick={() => setBoardView(view.id)}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
            ${boardView === view.id
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }
          `}
        >
          <view.icon className="w-4 h-4" />
          {view.label}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Board Header Component
// ─────────────────────────────────────────────────────────────────

export interface BoardHeaderProps {
  projectName: string;
  tasks: Task[];
  progress: number;
  projectId: string;
  onNavigate: (path: string) => void;
}

export default function BoardHeader({
  projectName,
  tasks,
  progress,
  projectId,
  onNavigate,
}: BoardHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-10">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Project Info */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('/genesis')}
              className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center hover:bg-slate-800 transition-colors"
            >
              <span className="text-lg font-bold text-white">H</span>
            </button>
            <div>
              <h1 className="font-semibold text-slate-900 text-lg">{projectName}</h1>
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <span>{tasks.length} tâches</span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span className="text-emerald-600 font-medium">{progress}% complété</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <ViewToggle />

            <button
              onClick={() => onNavigate(`/chat/${projectId}`)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors text-slate-900 text-sm font-medium"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Quick Action</span>
            </button>

            <button
              onClick={() => onNavigate('/genesis')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors text-white text-sm font-medium shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>New Project</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, #8B5CF6, #EC4899, #F59E0B)',
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
