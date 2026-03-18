// ═══════════════════════════════════════════════════════════════
// Right Sidebar Component
// Project Summary & Context
// ═══════════════════════════════════════════════════════════════

import { CheckCircle2, Circle, Target, Rocket, TrendingUp } from 'lucide-react';
import type { Project, Task } from '../../types';

export interface RightSidebarProps {
  project: Project;
  tasks: Task[];
}

const scopeLabels: Record<string, string> = {
  meta_ads: 'Meta Ads',
  sem: 'Google Ads (SEM)',
  seo: 'SEO',
  analytics: 'Analytics',
  full_scale: 'Full Scale Marketing',
};

const phaseEmojis: Record<string, string> = {
  'Audit': '🔍',
  'Setup': '⚙️',
  'Production': '🎨',
  'Launch': '🚀',
  'Optimization': '📈',
};

export default function RightSidebar({ project, tasks }: RightSidebarProps) {
  // Extraire l'objectif principal
  const mainGoal = project.metadata?.usp ||
                   project.metadata?.businessGoal ||
                   project.metadata?.competitive_advantage ||
                   'Accélérer votre croissance digitale';

  // Calculer les prochaines tâches
  const nextTasks = tasks
    .filter((t) => t.status === 'todo' || t.status === 'in_progress')
    .sort((a, b) => {
      // Prioriser les tâches in_progress
      if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
      if (b.status === 'in_progress' && a.status !== 'in_progress') return 1;
      // Ensuite trier par due_date
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    })
    .slice(0, 3);

  // Préparer les state flags
  const flags = [
    { key: 'strategy_validated', label: 'Stratégie validée', value: project.state_flags?.strategy_validated },
    { key: 'budget_approved', label: 'Budget approuvé', value: project.state_flags?.budget_approved },
    { key: 'creatives_ready', label: 'Créatifs prêts', value: project.state_flags?.creatives_ready },
    { key: 'tracking_ready', label: 'Tracking configuré', value: project.state_flags?.tracking_ready },
    { key: 'ads_live', label: 'Campagnes live', value: project.state_flags?.ads_live },
  ];

  return (
    <aside className="w-80 bg-gradient-to-br from-slate-50 to-white border-l border-slate-200 flex flex-col overflow-y-auto">
      {/* Project Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg">
            <Rocket className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-slate-900 text-lg leading-tight mb-1 truncate">
              {project.name}
            </h2>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-1 rounded-md bg-purple-100 text-purple-700 text-xs font-medium">
                {scopeLabels[project.scope] || project.scope}
              </span>
              <span className="text-xs text-slate-500">
                {phaseEmojis[project.current_phase] || '📊'} {project.current_phase}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Goal */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-start gap-3">
          <Target className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-slate-900 text-sm mb-1">Objectif Final</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              {mainGoal}
            </p>
          </div>
        </div>
      </div>

      {/* State Flags */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          <h3 className="font-semibold text-slate-900 text-sm">Avancement</h3>
        </div>
        <div className="space-y-2.5">
          {flags.map((flag) => (
            <div key={flag.key} className="flex items-center gap-3">
              {flag.value ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-slate-300 flex-shrink-0" />
              )}
              <span className={`text-sm ${flag.value ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                {flag.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Next Steps */}
      <div className="flex-1 p-6">
        <h3 className="font-semibold text-slate-900 text-sm mb-4 flex items-center gap-2">
          <span>🎯</span>
          Prochaines étapes
        </h3>
        {nextTasks.length > 0 ? (
          <div className="space-y-3">
            {nextTasks.map((task, index) => (
              <div
                key={task.id}
                className="p-3 rounded-lg bg-white border border-slate-200 hover:border-purple-300 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-100 text-purple-600 text-xs font-bold flex items-center justify-center mt-0.5">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 leading-snug truncate">
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {task.status === 'in_progress' && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">
                          En cours
                        </span>
                      )}
                      <span className="text-xs text-slate-500">
                        {task.phase}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-sm text-slate-500">
              Toutes les tâches sont terminées !
            </p>
          </div>
        )}
      </div>

      {/* Project Meta Info (Footer) */}
      {project.metadata?.website_url && (
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 animate-pulse" />
            <a
              href={project.metadata.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-600 hover:text-purple-600 transition-colors truncate"
            >
              {project.metadata.website_url}
            </a>
          </div>
        </div>
      )}
    </aside>
  );
}
