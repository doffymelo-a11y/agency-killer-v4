/**
 * AgentStatsCards - Display performance stats for each agent
 * Sprint 3.1 - Admin Monitoring Dashboard
 */

import { formatDistanceToNow } from 'date-fns';
import { Brain, Clock, DollarSign } from 'lucide-react';
import type { AgentStats } from '../../services/admin.service';

interface AgentStatsCardsProps {
  stats: AgentStats[];
  isLoading?: boolean;
}

const AGENT_CONFIG: Record<string, {
  name: string;
  role: string;
  color: string;
  bg: string;
  borderColor: string;
}> = {
  luna: {
    name: 'Luna',
    role: 'SEO & Content Strategist',
    color: 'text-purple-700',
    bg: 'bg-purple-100',
    borderColor: 'border-purple-200'
  },
  sora: {
    name: 'Sora',
    role: 'Analytics & Tracking Expert',
    color: 'text-blue-700',
    bg: 'bg-blue-100',
    borderColor: 'border-blue-200'
  },
  marcus: {
    name: 'Marcus',
    role: 'Paid Ads Strategist',
    color: 'text-green-700',
    bg: 'bg-green-100',
    borderColor: 'border-green-200'
  },
  milo: {
    name: 'Milo',
    role: 'Creative Content Producer',
    color: 'text-orange-700',
    bg: 'bg-orange-100',
    borderColor: 'border-orange-200'
  },
  doffy: {
    name: 'Doffy',
    role: 'Social Media Manager',
    color: 'text-pink-700',
    bg: 'bg-pink-100',
    borderColor: 'border-pink-200'
  },
};

const AGENT_ORDER = ['luna', 'sora', 'marcus', 'milo', 'doffy'];

function AgentCard({ agentId, stats }: { agentId: string; stats?: AgentStats }) {
  const config = AGENT_CONFIG[agentId];

  if (!config) {
    return null;
  }

  // Calculate success rate
  const successRate = stats
    ? ((stats.successful_executions / stats.total_executions) * 100)
    : 0;

  // Determine progress bar color
  const progressColor = successRate >= 90
    ? 'bg-emerald-500'
    : successRate >= 70
    ? 'bg-amber-500'
    : 'bg-red-500';

  const progressBgColor = successRate >= 90
    ? 'bg-emerald-100'
    : successRate >= 70
    ? 'bg-amber-100'
    : 'bg-red-100';

  // Format average duration (ms to seconds)
  const avgDurationSeconds = stats
    ? (stats.avg_duration_ms / 1000).toFixed(1)
    : '0.0';

  // If no activity
  if (!stats || stats.total_executions === 0) {
    return (
      <div className={`bg-white rounded-xl border ${config.borderColor} p-6 opacity-60`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-full ${config.bg} flex items-center justify-center`}>
            <Brain className={`w-6 h-6 ${config.color}`} />
          </div>
          <div>
            <h4 className="font-bold text-slate-900">{config.name}</h4>
            <p className="text-xs text-slate-500">{config.role}</p>
          </div>
        </div>

        <div className="text-center py-6">
          <p className="text-slate-500 text-sm font-medium">Aucune activité</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border ${config.borderColor} p-6 hover:shadow-md transition-shadow`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-12 h-12 rounded-full ${config.bg} flex items-center justify-center`}>
          <Brain className={`w-6 h-6 ${config.color}`} />
        </div>
        <div>
          <h4 className="font-bold text-slate-900">{config.name}</h4>
          <p className="text-xs text-slate-500">{config.role}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Total executions */}
        <div>
          <p className="text-xs text-slate-500 mb-1">Exécutions</p>
          <p className="text-2xl font-bold text-slate-900">{stats.total_executions}</p>
        </div>

        {/* Success rate */}
        <div>
          <p className="text-xs text-slate-500 mb-1">Taux de succès</p>
          <p className="text-2xl font-bold text-slate-900">{successRate.toFixed(1)}%</p>
        </div>

        {/* Average duration */}
        <div>
          <div className="flex items-center gap-1 mb-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <p className="text-xs text-slate-500">Temps moyen</p>
          </div>
          <p className="text-lg font-semibold text-slate-700">{avgDurationSeconds}s</p>
        </div>

        {/* Total cost */}
        <div>
          <div className="flex items-center gap-1 mb-1">
            <DollarSign className="w-3 h-3 text-slate-400" />
            <p className="text-xs text-slate-500">Coût total</p>
          </div>
          <p className="text-lg font-semibold text-slate-700">
            {stats.total_cost_credits.toFixed(0)} cr
          </p>
        </div>
      </div>

      {/* Success Rate Progress Bar */}
      <div className="mb-3">
        <div className={`w-full h-2 ${progressBgColor} rounded-full overflow-hidden`}>
          <div
            className={`h-full ${progressColor} transition-all duration-500`}
            style={{ width: `${successRate}%` }}
          />
        </div>
      </div>

      {/* Last execution */}
      <div className="text-xs text-slate-500">
        Dernière exécution:{' '}
        <span className="text-slate-700 font-medium">
          {formatDistanceToNow(new Date(stats.last_execution_at), { addSuffix: true, locale: undefined })}
        </span>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-slate-200 rounded-full" />
          <div className="flex-1">
            <div className="h-4 bg-slate-200 rounded w-1/2 mb-2" />
            <div className="h-3 bg-slate-100 rounded w-2/3" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <div className="h-3 bg-slate-100 rounded w-2/3 mb-2" />
              <div className="h-6 bg-slate-200 rounded w-1/2" />
            </div>
          ))}
        </div>
        <div className="h-2 bg-slate-100 rounded mb-3" />
        <div className="h-3 bg-slate-100 rounded w-3/4" />
      </div>
    </div>
  );
}

export default function AgentStatsCards({ stats, isLoading }: AgentStatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
        {AGENT_ORDER.map((agentId) => (
          <SkeletonCard key={agentId} />
        ))}
      </div>
    );
  }

  // Create a map of agent stats for easy lookup
  const statsMap = new Map(stats.map(s => [s.agent_id, s]));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
      {AGENT_ORDER.map((agentId) => (
        <AgentCard
          key={agentId}
          agentId={agentId}
          stats={statsMap.get(agentId)}
        />
      ))}
    </div>
  );
}
