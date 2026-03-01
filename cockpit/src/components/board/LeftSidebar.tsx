// ═══════════════════════════════════════════════════════════════
// Left Sidebar Component
// Navigation + Agent Avatars
// ═══════════════════════════════════════════════════════════════

import { FolderOpen, BarChart3, Plug } from 'lucide-react';
import { AGENTS } from '../../types';
import type { Task } from '../../types';

export interface LeftSidebarProps {
  projectId: string;
  tasks: Task[];
  onNavigate: (path: string) => void;
}

export default function LeftSidebar({ projectId, tasks, onNavigate }: LeftSidebarProps) {
  const navigationItems = [
    {
      id: 'integrations',
      label: 'Integrations',
      icon: Plug,
      path: `/integrations/${projectId}`,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 hover:bg-purple-100',
    },
    {
      id: 'files',
      label: 'Fichiers',
      icon: FolderOpen,
      path: `/files/${projectId}`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      path: `/analytics/${projectId}`,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 hover:bg-emerald-100',
    },
  ];

  const agents = Object.entries(AGENTS)
    .filter(([id]) => id !== 'orchestrator')
    .map(([id, agent]) => {
      const agentTasks = tasks.filter((t) => t.assignee === id);
      const completed = agentTasks.filter((t) => t.status === 'done').length;
      const inProgress = agentTasks.filter((t) => t.status === 'in_progress').length;

      return {
        id,
        agent,
        total: agentTasks.length,
        completed,
        inProgress,
      };
    });

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
      {/* Navigation Section */}
      <div className="p-4 border-b border-slate-200">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Navigation
        </h3>
        <div className="space-y-2">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${item.bgColor}`}
            >
              <item.icon className={`w-5 h-5 ${item.color}`} />
              <span className="font-medium text-slate-700">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Agents Section */}
      <div className="flex-1 p-4 overflow-y-auto">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Agents
        </h3>
        <div className="space-y-3">
          {agents.map((stat) => (
            <div
              key={stat.id}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
            >
              <div className="relative">
                <img
                  src={stat.agent.avatar}
                  alt={stat.agent.name}
                  className="w-10 h-10 rounded-full ring-2 ring-offset-2 transition-transform group-hover:scale-105"
                  style={{ '--tw-ring-color': stat.agent.color.primary } as React.CSSProperties}
                />
                {stat.inProgress > 0 && (
                  <div
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg"
                    style={{ backgroundColor: stat.agent.color.primary }}
                  >
                    {stat.inProgress}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 text-sm truncate">
                  {stat.agent.name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${stat.total > 0 ? (stat.completed / stat.total) * 100 : 0}%`,
                        backgroundColor: stat.agent.color.primary,
                      }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    {stat.completed}/{stat.total}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
