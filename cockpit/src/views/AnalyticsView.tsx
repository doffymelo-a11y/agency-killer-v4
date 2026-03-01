import TopBar from '../components/layout/TopBar';
// ═══════════════════════════════════════════════════════════════
// THE HIVE OS V4 - Analytics Hub (THE DATA OBSERVER)
// Dashboard temps réel avec interprétation IA
// ═══════════════════════════════════════════════════════════════

import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  Users,
  Zap,
  Target,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  MessageSquare,
  RefreshCw,
  AlertTriangle,
  Sparkles,
  ArrowLeft,
  Database,
} from 'lucide-react';
import {
  useHiveStore,
  useCurrentProject,
  useTasks,
  useProjectProgress,
} from '../store/useHiveStore';
import { AGENTS, type AgentRole, type TaskStatus } from '../types';

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

interface KPICard {
  id: string;
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: typeof BarChart3;
  color: string;
}

interface AgentPerformance {
  agent: AgentRole;
  tasksTotal: number;
  tasksCompleted: number;
  avgDuration: number; // hours
  efficiency: number; // percentage
}

interface AIInsight {
  id: string;
  type: 'success' | 'warning' | 'info';
  message: string;
  action?: string;
}

// ─────────────────────────────────────────────────────────────────
// KPI Card Component
// ─────────────────────────────────────────────────────────────────

function KPICardComponent({ kpi }: { kpi: KPICard }) {
  const Icon = kpi.icon;
  const TrendIcon = kpi.trend === 'up' ? TrendingUp : kpi.trend === 'down' ? TrendingDown : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-slate-100 p-6 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${kpi.color}20` }}
        >
          <Icon className="w-6 h-6" style={{ color: kpi.color }} />
        </div>
        {kpi.change !== undefined && TrendIcon && (
          <div
            className={`flex items-center gap-1 text-sm font-medium ${
              kpi.trend === 'up' ? 'text-emerald-600' : 'text-red-500'
            }`}
          >
            <TrendIcon className="w-4 h-4" />
            {Math.abs(kpi.change)}%
          </div>
        )}
      </div>
      <div className="text-3xl font-bold text-slate-900 mb-1">{kpi.value}</div>
      <div className="text-sm text-slate-500">{kpi.label}</div>
      {kpi.changeLabel && (
        <div className="text-xs text-slate-400 mt-2">{kpi.changeLabel}</div>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Agent Performance Card
// ─────────────────────────────────────────────────────────────────

function AgentPerformanceCard({ perf }: { perf: AgentPerformance }) {
  const agent = AGENTS[perf.agent];
  const completionRate = perf.tasksTotal > 0
    ? Math.round((perf.tasksCompleted / perf.tasksTotal) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100 hover:shadow-md transition-shadow"
    >
      <img
        src={agent.avatar}
        alt={agent.name}
        className="w-12 h-12 rounded-xl object-cover ring-2 ring-offset-2"
        style={{ '--tw-ring-color': agent.color.primary } as React.CSSProperties}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-semibold text-slate-800">{agent.name}</h4>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: agent.color.light, color: agent.color.dark }}
          >
            {agent.role}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-500">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {perf.tasksCompleted}/{perf.tasksTotal}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {perf.avgDuration.toFixed(1)}h moy
          </span>
        </div>
        {/* Progress Bar */}
        <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionRate}%` }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="h-full rounded-full"
            style={{ backgroundColor: agent.color.primary }}
          />
        </div>
      </div>
      <div className="text-right">
        <div className="text-2xl font-bold text-slate-900">{completionRate}%</div>
        <div className="text-xs text-slate-400">Completion</div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────
// AI Insight Card
// ─────────────────────────────────────────────────────────────────

function AIInsightCard({ insight, onAction }: { insight: AIInsight; onAction?: () => void }) {
  const config = {
    success: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2, iconColor: 'text-emerald-600' },
    warning: { bg: 'bg-amber-50', border: 'border-amber-200', icon: AlertTriangle, iconColor: 'text-amber-600' },
    info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: Sparkles, iconColor: 'text-blue-600' },
  };

  const { bg, border, icon: Icon, iconColor } = config[insight.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${bg} ${border} border rounded-xl p-4`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          <p className="text-sm text-slate-700">{insight.message}</p>
          {insight.action && (
            <button
              onClick={onAction}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 mt-2 flex items-center gap-1"
            >
              {insight.action}
              <ArrowUpRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Task Status Chart (Simple Bar)
// ─────────────────────────────────────────────────────────────────

function TaskStatusChart({ tasks }: { tasks: { status: TaskStatus }[] }) {
  const statusCounts = useMemo(() => {
    const counts = { todo: 0, in_progress: 0, done: 0, blocked: 0 };
    tasks.forEach((t) => counts[t.status]++);
    return counts;
  }, [tasks]);

  const total = tasks.length || 1;
  const statuses = [
    { key: 'todo', label: 'A faire', color: '#94A3B8', count: statusCounts.todo },
    { key: 'in_progress', label: 'En cours', color: '#F59E0B', count: statusCounts.in_progress },
    { key: 'done', label: 'Termine', color: '#10B981', count: statusCounts.done },
    { key: 'blocked', label: 'Bloque', color: '#EF4444', count: statusCounts.blocked },
  ];

  return (
    <div className="space-y-4">
      {statuses.map((status) => (
        <div key={status.key} className="flex items-center gap-4">
          <div className="w-24 text-sm text-slate-600">{status.label}</div>
          <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(status.count / total) * 100}%` }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="h-full rounded-lg flex items-center justify-end pr-2"
              style={{ backgroundColor: status.color }}
            >
              {status.count > 0 && (
                <span className="text-xs font-medium text-white">{status.count}</span>
              )}
            </motion.div>
          </div>
          <div className="w-12 text-right text-sm font-medium text-slate-700">
            {Math.round((status.count / total) * 100)}%
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Timeline Chart (Phases)
// ─────────────────────────────────────────────────────────────────

function PhaseTimeline({ tasks }: { tasks: { phase: string; status: TaskStatus }[] }) {
  const phases = ['Audit', 'Setup', 'Production', 'Optimization'];

  const phaseStats = useMemo(() => {
    return phases.map((phase) => {
      const phaseTasks = tasks.filter((t) => t.phase === phase);
      const completed = phaseTasks.filter((t) => t.status === 'done').length;
      return {
        phase,
        total: phaseTasks.length,
        completed,
        percentage: phaseTasks.length > 0 ? Math.round((completed / phaseTasks.length) * 100) : 0,
      };
    });
  }, [tasks]);

  return (
    <div className="relative">
      <div className="absolute top-5 left-6 right-6 h-1 bg-slate-200 rounded-full" />
      <div className="relative flex justify-between">
        {phaseStats.map((stat, index) => (
          <div key={stat.phase} className="flex flex-col items-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${
                stat.percentage === 100
                  ? 'bg-emerald-500 text-white'
                  : stat.percentage > 0
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {stat.percentage === 100 ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <span className="text-sm font-medium">{stat.percentage}%</span>
              )}
            </motion.div>
            <div className="mt-3 text-center">
              <div className="text-sm font-medium text-slate-700">{stat.phase}</div>
              <div className="text-xs text-slate-400">
                {stat.completed}/{stat.total} taches
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────

export default function AnalyticsView() {
  const navigate = useNavigate();
  const project = useCurrentProject();
  const tasks = useTasks();
  const progress = useProjectProgress();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastCacheSync, setLastCacheSync] = useState<Date | null>(null);
  const [cacheStatus, setCacheStatus] = useState<'fresh' | 'stale' | 'none'>('none');

  // Calculate KPIs
  const kpis = useMemo<KPICard[]>(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'done').length;
    const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
    const blockedTasks = tasks.filter((t) => t.status === 'blocked').length;

    const totalHours = tasks.reduce((acc, t) => acc + (t.estimated_hours || 0), 0);
    const completedHours = tasks
      .filter((t) => t.status === 'done')
      .reduce((acc, t) => acc + (t.estimated_hours || 0), 0);

    return [
      {
        id: 'progress',
        label: 'Progression Globale',
        value: `${progress}%`,
        change: 12,
        changeLabel: 'vs semaine derniere',
        trend: 'up',
        icon: Target,
        color: '#8B5CF6',
      },
      {
        id: 'completed',
        label: 'Taches Terminees',
        value: completedTasks,
        change: completedTasks > 0 ? 8 : 0,
        trend: 'up',
        icon: CheckCircle2,
        color: '#10B981',
      },
      {
        id: 'in_progress',
        label: 'En Cours',
        value: inProgressTasks,
        trend: 'neutral',
        icon: Clock,
        color: '#F59E0B',
      },
      {
        id: 'blocked',
        label: 'Bloquees',
        value: blockedTasks,
        change: blockedTasks > 0 ? -5 : 0,
        trend: blockedTasks > 0 ? 'down' : 'neutral',
        icon: AlertTriangle,
        color: '#EF4444',
      },
      {
        id: 'hours_done',
        label: 'Heures Completees',
        value: `${completedHours}h`,
        changeLabel: `sur ${totalHours}h estimees`,
        icon: Zap,
        color: '#06B6D4',
      },
      {
        id: 'agents_active',
        label: 'Agents Actifs',
        value: new Set(tasks.filter((t) => t.status === 'in_progress').map((t) => t.assignee)).size,
        icon: Users,
        color: '#EC4899',
      },
    ];
  }, [tasks, progress]);

  // Calculate agent performance
  const agentPerformances = useMemo<AgentPerformance[]>(() => {
    const agents: AgentRole[] = ['sora', 'luna', 'marcus', 'milo'];

    return agents.map((agent) => {
      const agentTasks = tasks.filter((t) => t.assignee === agent);
      const completed = agentTasks.filter((t) => t.status === 'done');
      const avgDuration = completed.length > 0
        ? completed.reduce((acc, t) => acc + (t.estimated_hours || 0), 0) / completed.length
        : 0;

      return {
        agent,
        tasksTotal: agentTasks.length,
        tasksCompleted: completed.length,
        avgDuration,
        efficiency: agentTasks.length > 0 ? Math.round((completed.length / agentTasks.length) * 100) : 0,
      };
    }).filter((p) => p.tasksTotal > 0);
  }, [tasks]);

  // Generate AI insights
  const insights = useMemo<AIInsight[]>(() => {
    const insightsList: AIInsight[] = [];

    const blockedTasks = tasks.filter((t) => t.status === 'blocked').length;
    if (blockedTasks > 0) {
      insightsList.push({
        id: 'blocked',
        type: 'warning',
        message: `${blockedTasks} tache${blockedTasks > 1 ? 's' : ''} bloquee${blockedTasks > 1 ? 's' : ''}. Verifiez les dependances ou les ressources manquantes.`,
        action: 'Voir les taches bloquees',
      });
    }

    const completionRate = tasks.length > 0
      ? (tasks.filter((t) => t.status === 'done').length / tasks.length) * 100
      : 0;

    if (completionRate >= 80) {
      insightsList.push({
        id: 'almost_done',
        type: 'success',
        message: 'Excellent ! Le projet est a plus de 80% complete. Continuez sur cette lancee.',
      });
    }

    const overdueCount = tasks.filter((t) => {
      if (t.status === 'done') return false;
      return new Date(t.due_date) < new Date();
    }).length;

    if (overdueCount > 0) {
      insightsList.push({
        id: 'overdue',
        type: 'warning',
        message: `${overdueCount} tache${overdueCount > 1 ? 's ont depasse leur' : ' a depasse sa'} deadline. Considerez une re-priorisation.`,
        action: 'Re-planifier',
      });
    }

    // Agent performance insight
    const topAgent = agentPerformances.reduce((a, b) =>
      a.efficiency > b.efficiency ? a : b, agentPerformances[0]);

    if (topAgent && topAgent.tasksCompleted > 0) {
      insightsList.push({
        id: 'top_performer',
        type: 'info',
        message: `${AGENTS[topAgent.agent].name} a le meilleur taux de completion (${topAgent.efficiency}%). Les taches creatives avancent bien.`,
      });
    }

    return insightsList;
  }, [tasks, agentPerformances]);

  // Check cache status on mount and refresh
  const checkCacheStatus = () => {
    // In a real implementation, this would query Supabase for actual cache timestamps
    // For now, simulate cache check
    const mockLastSync = new Date(Date.now() - Math.random() * 10 * 60 * 1000); // Random time in last 10 min
    setLastCacheSync(mockLastSync);

    const ageMinutes = (Date.now() - mockLastSync.getTime()) / 60000;
    setCacheStatus(ageMinutes < 5 ? 'fresh' : 'stale');
  };

  // Update cache status on mount
  useEffect(() => {
    if (project) {
      checkCacheStatus();
    }
  }, [project]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (project) {
      await useHiveStore.getState().fetchProjectWithTasks(project.id);
      // Update cache timestamp after refresh
      setLastCacheSync(new Date());
      setCacheStatus('fresh');
    }
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleAskAnalyst = () => {
    if (project) {
      useHiveStore.getState().setActiveAgent('sora');
      navigate(`/chat/${project.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`/board/${project?.id}`)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title="Back to board"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h1 className="font-semibold text-slate-900 text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Analytics Hub
                </h1>
                <p className="text-sm text-slate-500">
                  {project?.name} - Real-time updates
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Cache Status Badge */}
              {lastCacheSync && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                  cacheStatus === 'fresh'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  <Database className="w-4 h-4" />
                  <span className="font-medium">
                    Cache: {(() => {
                      const diffMs = Date.now() - lastCacheSync.getTime();
                      const diffMin = Math.floor(diffMs / 60000);
                      if (diffMin < 1) return 'à l\'instant';
                      if (diffMin === 1) return 'il y a 1 min';
                      return `il y a ${diffMin} min`;
                    })()}
                  </span>
                </div>
              )}

              <button
                onClick={handleRefresh}
                className={`btn btn-secondary ${isRefreshing ? 'opacity-50' : ''}`}
                disabled={isRefreshing}
                title="Forcer le rafraîchissement (bypass cache)"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Actualiser
              </button>
              <button onClick={handleAskAnalyst} className="btn btn-primary">
                <MessageSquare className="w-4 h-4" />
                Demander a Sora
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* KPI Cards */}
        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Vue d'ensemble</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {kpis.map((kpi, index) => (
              <motion.div
                key={kpi.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <KPICardComponent kpi={kpi} />
              </motion.div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Charts */}
          <div className="lg:col-span-2 space-y-8">
            {/* Task Status Distribution */}
            <section className="bg-white rounded-xl border border-slate-100 p-6">
              <h3 className="font-semibold text-slate-800 mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-slate-500" />
                Repartition des Taches
              </h3>
              <TaskStatusChart tasks={tasks} />
            </section>

            {/* Phase Timeline */}
            <section className="bg-white rounded-xl border border-slate-100 p-6">
              <h3 className="font-semibold text-slate-800 mb-6 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-slate-500" />
                Progression par Phase
              </h3>
              <PhaseTimeline tasks={tasks} />
            </section>

            {/* Agent Performance */}
            <section className="bg-white rounded-xl border border-slate-100 p-6">
              <h3 className="font-semibold text-slate-800 mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-slate-500" />
                Performance des Agents
              </h3>
              <div className="space-y-4">
                {agentPerformances.length > 0 ? (
                  agentPerformances.map((perf, index) => (
                    <motion.div
                      key={perf.agent}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <AgentPerformanceCard perf={perf} />
                    </motion.div>
                  ))
                ) : (
                  <p className="text-center text-slate-500 py-8">
                    Aucune tache assignee pour le moment
                  </p>
                )}
              </div>
            </section>
          </div>

          {/* Right Column - AI Insights */}
          <div className="space-y-6">
            <section className="bg-white rounded-xl border border-slate-100 p-6">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-500" />
                Analyses IA
              </h3>
              {insights.length > 0 ? (
                <div className="space-y-3">
                  {insights.map((insight, index) => (
                    <motion.div
                      key={insight.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <AIInsightCard
                        insight={insight}
                        onAction={() => navigate(`/board/${project?.id}`)}
                      />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-500 py-8">
                  Pas d'alertes pour le moment
                </p>
              )}
            </section>

            {/* Quick Actions */}
            <section className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl p-6 text-white">
              <h3 className="font-semibold mb-2">Besoin d'une analyse approfondie ?</h3>
              <p className="text-sm text-violet-100 mb-4">
                Sora peut analyser vos KPIs et vous donner des recommandations personnalisees.
              </p>
              <button
                onClick={handleAskAnalyst}
                className="w-full py-2.5 bg-white text-violet-600 rounded-lg font-medium hover:bg-violet-50 transition-colors flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Parler a Sora
              </button>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
