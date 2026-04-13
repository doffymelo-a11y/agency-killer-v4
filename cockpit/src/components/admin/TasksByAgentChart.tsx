/**
 * TasksByAgentChart - Horizontal bar chart of tasks by agent
 * Sprint 4.3 - Admin Monitoring Dashboard
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CheckSquare } from 'lucide-react';
import type { BusinessStats } from '../../services/admin.service';

interface TasksByAgentChartProps {
  stats: BusinessStats | null;
  isLoading?: boolean;
}

const AGENT_COLORS: Record<string, { completed: string; remaining: string; name: string }> = {
  luna: {
    completed: '#9333ea', // purple-600
    remaining: '#e9d5ff', // purple-200
    name: 'Luna'
  },
  sora: {
    completed: '#2563eb', // blue-600
    remaining: '#bfdbfe', // blue-200
    name: 'Sora'
  },
  marcus: {
    completed: '#16a34a', // green-600
    remaining: '#bbf7d0', // green-200
    name: 'Marcus'
  },
  milo: {
    completed: '#ea580c', // orange-600
    remaining: '#fed7aa', // orange-200
    name: 'Milo'
  },
  doffy: {
    completed: '#ec4899', // pink-600
    remaining: '#fbcfe8', // pink-200
    name: 'Doffy'
  },
};

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-[400px]">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
        <CheckSquare className="w-8 h-8 text-slate-400" />
      </div>
      <p className="text-slate-600 font-medium">Aucune tâche assignée</p>
      <p className="text-sm text-slate-500 mt-1">Les tâches apparaîtront ici une fois assignées</p>
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="animate-pulse h-[400px] space-y-4 flex flex-col justify-center px-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="w-16 h-4 bg-slate-200 rounded" />
          <div className="flex-1 h-8 bg-slate-200 rounded" />
        </div>
      ))}
    </div>
  );
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const data = payload[0].payload;

  return (
    <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
      <p className="text-sm font-semibold text-slate-900 mb-2">{data.agentName}</p>
      <div className="space-y-1 text-xs">
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-600">Completed:</span>
          <span className="font-semibold text-emerald-600">{data.completed}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-600">Remaining:</span>
          <span className="font-semibold text-amber-600">{data.remaining}</span>
        </div>
        <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-200">
          <span className="text-slate-600">Total:</span>
          <span className="font-bold text-slate-900">{data.total}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-600">Progress:</span>
          <span className="font-bold text-blue-600">{data.completionRate}%</span>
        </div>
      </div>
    </div>
  );
}

export default function TasksByAgentChart({ stats, isLoading }: TasksByAgentChartProps) {
  if (isLoading || !stats) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">
          Tasks by Agent
        </h3>
        <SkeletonChart />
      </div>
    );
  }

  const tasksByAgent = stats.tasks_by_agent || [];

  if (tasksByAgent.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">
          Tasks by Agent
        </h3>
        <EmptyState />
      </div>
    );
  }

  // Transform data for chart
  const chartData = tasksByAgent.map((item) => {
    const agentId = item.agent.toLowerCase();
    const agentConfig = AGENT_COLORS[agentId] || {
      completed: '#64748b',
      remaining: '#e2e8f0',
      name: item.agent
    };

    const completionRate = item.total > 0
      ? ((item.completed / item.total) * 100).toFixed(1)
      : '0.0';

    return {
      agent: agentId,
      agentName: agentConfig.name,
      total: item.total,
      completed: item.completed,
      remaining: item.total - item.completed,
      completionRate,
      completedColor: agentConfig.completed,
      remainingColor: agentConfig.remaining,
    };
  });

  // Sort by total tasks descending
  chartData.sort((a, b) => b.total - a.total);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900">
          Tasks by Agent
        </h3>
        <div className="text-sm">
          <span className="text-slate-500">Total: </span>
          <span className="font-bold text-slate-900">{stats.tasks_total} tâches</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
          <XAxis type="number" stroke="#64748b" fontSize={12} />
          <YAxis
            type="category"
            dataKey="agentName"
            stroke="#64748b"
            fontSize={12}
            width={80}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Completed bar */}
          <Bar dataKey="completed" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`completed-${index}`} fill={entry.completedColor} />
            ))}
          </Bar>

          {/* Remaining bar */}
          <Bar dataKey="remaining" stackId="a" fill="#fbbf24" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`remaining-${index}`} fill={entry.remainingColor} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-emerald-600 rounded" />
          <span className="text-slate-600">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-slate-300 rounded" />
          <span className="text-slate-600">Remaining</span>
        </div>
      </div>
    </div>
  );
}
