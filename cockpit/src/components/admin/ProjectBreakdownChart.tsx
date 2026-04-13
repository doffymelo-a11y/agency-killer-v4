/**
 * ProjectBreakdownChart - Pie chart of projects by scope
 * Sprint 4.2 - Admin Monitoring Dashboard
 */

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { FolderOpen } from 'lucide-react';
import type { BusinessStats } from '../../services/admin.service';

interface ProjectBreakdownChartProps {
  stats: BusinessStats | null;
  isLoading?: boolean;
}

const SCOPE_COLORS: Record<string, string> = {
  meta_ads: '#ec4899', // pink-500
  sem: '#f59e0b', // amber-500
  seo: '#8b5cf6', // purple-500
  analytics: '#3b82f6', // blue-500
  social_media: '#10b981', // emerald-500
  full_scale: '#6366f1', // indigo-500
};

const SCOPE_LABELS: Record<string, string> = {
  meta_ads: 'Meta Ads',
  sem: 'SEM',
  seo: 'SEO',
  analytics: 'Analytics',
  social_media: 'Social Media',
  full_scale: 'Full Scale',
};

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-[400px]">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
        <FolderOpen className="w-8 h-8 text-slate-400" />
      </div>
      <p className="text-slate-600 font-medium">Aucun projet</p>
      <p className="text-sm text-slate-500 mt-1">Les projets apparaîtront ici une fois créés</p>
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="animate-pulse h-[400px] flex items-center justify-center">
      <div className="w-64 h-64 bg-slate-200 rounded-full" />
    </div>
  );
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const data = payload[0];

  return (
    <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
      <p className="text-sm font-semibold text-slate-900 mb-1">{data.name}</p>
      <p className="text-sm text-slate-600">
        {data.value} projet{data.value !== 1 ? 's' : ''} ({data.payload.percentage}%)
      </p>
    </div>
  );
}

function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) {
    return null; // Don't show label if slice is too small
  }

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-sm font-bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export default function ProjectBreakdownChart({ stats, isLoading }: ProjectBreakdownChartProps) {
  if (isLoading || !stats) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">
          Projects by Scope
        </h3>
        <SkeletonChart />
      </div>
    );
  }

  const projectsByScope = stats.projects_by_scope || [];

  if (projectsByScope.length === 0 || stats.projects_total === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">
          Projects by Scope
        </h3>
        <EmptyState />
      </div>
    );
  }

  // Transform data for chart
  const chartData = projectsByScope.map((item) => ({
    name: SCOPE_LABELS[item.scope] || item.scope,
    value: item.count,
    percentage: ((item.count / stats.projects_total) * 100).toFixed(1),
  }));

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900">
          Projects by Scope
        </h3>
        <div className="text-sm">
          <span className="text-slate-500">Total: </span>
          <span className="font-bold text-slate-900">{stats.projects_total} projets</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={CustomLabel}
            outerRadius={150}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => {
              const scope = projectsByScope[index].scope;
              const color = SCOPE_COLORS[scope] || '#64748b'; // fallback to slate-500
              return <Cell key={`cell-${index}`} fill={color} />;
            })}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
            formatter={(value, entry: any) => (
              <span className="text-sm text-slate-700">
                {value} ({entry.payload.value})
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
