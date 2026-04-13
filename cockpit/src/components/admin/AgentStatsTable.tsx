/**
 * AgentStatsTable - Displays agent performance statistics
 * Sprint 2.2 - Admin Dashboard UI Components
 */

import { formatDistanceToNow } from 'date-fns';
import { CheckCircle2, XCircle, TrendingUp, DollarSign, Clock } from 'lucide-react';
import type { AgentStats } from '../../services/admin.service';

interface AgentStatsTableProps {
  stats: AgentStats[];
  isLoading?: boolean;
}

const AGENT_CONFIG: Record<string, { name: string; emoji: string; color: string }> = {
  luna: { name: 'Luna', emoji: '🌙', color: 'text-purple-600' },
  sora: { name: 'Sora', emoji: '📊', color: 'text-blue-600' },
  marcus: { name: 'Marcus', emoji: '💰', color: 'text-green-600' },
  milo: { name: 'Milo', emoji: '🎨', color: 'text-orange-600' },
  doffy: { name: 'Doffy', emoji: '📱', color: 'text-pink-600' },
};

export default function AgentStatsTable({ stats, isLoading }: AgentStatsTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-slate-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats || stats.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
        <p className="text-slate-500">No agent activity data available</p>
      </div>
    );
  }

  const totalExecutions = stats.reduce((sum, s) => sum + s.total_executions, 0);
  const totalCost = stats.reduce((sum, s) => sum + s.total_cost_credits, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900">Agent Performance</h3>
        <p className="text-sm text-slate-500 mt-1">
          {totalExecutions} total executions • ${totalCost.toFixed(4)} total cost
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Agent
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Executions
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Success Rate
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Avg Duration
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Cost
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Last Active
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {stats.map((stat) => {
              const config = AGENT_CONFIG[stat.agent_id] || {
                name: stat.agent_id,
                emoji: '🤖',
                color: 'text-slate-600',
              };
              const successRate =
                stat.total_executions > 0
                  ? (stat.successful_executions / stat.total_executions) * 100
                  : 0;

              return (
                <tr key={stat.agent_id} className="hover:bg-slate-50 transition-colors">
                  {/* Agent Name */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{config.emoji}</span>
                      <div>
                        <div className={`font-semibold ${config.color}`}>{config.name}</div>
                        <div className="text-xs text-slate-500">{stat.agent_id}</div>
                      </div>
                    </div>
                  </td>

                  {/* Executions */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-sm font-semibold text-slate-900">
                      {stat.total_executions}
                    </div>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle2 className="w-3 h-3" />
                        {stat.successful_executions}
                      </div>
                      {stat.failed_executions > 0 && (
                        <div className="flex items-center gap-1 text-xs text-red-600">
                          <XCircle className="w-3 h-3" />
                          {stat.failed_executions}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Success Rate */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="inline-flex items-center gap-1.5">
                      <div
                        className={`text-sm font-semibold ${
                          successRate >= 90
                            ? 'text-green-600'
                            : successRate >= 70
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}
                      >
                        {successRate.toFixed(1)}%
                      </div>
                    </div>
                  </td>

                  {/* Avg Duration */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="inline-flex items-center gap-1.5 text-sm text-slate-700">
                      <Clock className="w-4 h-4 text-slate-400" />
                      {stat.avg_duration_ms
                        ? `${(stat.avg_duration_ms / 1000).toFixed(1)}s`
                        : 'N/A'}
                    </div>
                  </td>

                  {/* Cost */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="inline-flex items-center gap-1.5 text-sm text-slate-700">
                      <DollarSign className="w-4 h-4 text-slate-400" />
                      {stat.total_cost_credits.toFixed(4)}
                    </div>
                  </td>

                  {/* Last Active */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {stat.last_execution_at
                      ? formatDistanceToNow(new Date(stat.last_execution_at), {
                          addSuffix: true,
                        })
                      : 'Never'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
