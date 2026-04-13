/**
 * TopMetricsGrid - 6 KPI cards for business metrics
 * Sprint 4.1 - Admin Monitoring Dashboard
 */

import { Users, FolderOpen, CheckSquare, TrendingUp, Zap, Star, ArrowUp, ArrowDown } from 'lucide-react';
import type { BusinessStats } from '../../services/admin.service';

interface TopMetricsGridProps {
  stats: BusinessStats | null;
  isLoading?: boolean;
}

interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  trend?: number; // percentage change from previous period
  iconColor: string;
  iconBg: string;
}

function MetricCard({ icon: Icon, label, value, trend, iconColor, iconBg }: MetricCardProps) {
  const hasTrend = trend !== undefined && trend !== null;
  const isPositive = hasTrend && trend > 0;
  const isNegative = hasTrend && trend < 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 ${iconBg} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        {hasTrend && (
          <div className={`flex items-center gap-1 text-sm font-semibold ${
            isPositive ? 'text-emerald-600' : isNegative ? 'text-red-600' : 'text-slate-500'
          }`}>
            {isPositive && <ArrowUp className="w-4 h-4" />}
            {isNegative && <ArrowDown className="w-4 h-4" />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>

      <div>
        <p className="text-sm text-slate-500 mb-1">{label}</p>
        <p className="text-3xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="animate-pulse">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 bg-slate-200 rounded-lg" />
          <div className="h-4 w-12 bg-slate-200 rounded" />
        </div>
        <div className="h-3 bg-slate-100 rounded w-2/3 mb-2" />
        <div className="h-8 bg-slate-200 rounded w-1/2" />
      </div>
    </div>
  );
}

export default function TopMetricsGrid({ stats, isLoading }: TopMetricsGridProps) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  // Calculate completion rate as percentage
  const completionRate = stats.tasks_completion_rate || 0;

  // Format CSAT average (1-5 scale)
  const csatAvg = stats.avg_csat !== null && stats.avg_csat !== undefined
    ? stats.avg_csat.toFixed(2)
    : 'N/A';

  const metrics: Omit<MetricCardProps, 'trend'>[] = [
    {
      icon: Users,
      label: 'Users actifs (7j)',
      value: stats.users_active_7d,
      iconColor: 'text-cyan-600',
      iconBg: 'bg-cyan-100',
    },
    {
      icon: FolderOpen,
      label: 'Projets actifs',
      value: stats.projects_active,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-100',
    },
    {
      icon: CheckSquare,
      label: 'Tâches complétées',
      value: stats.tasks_completed,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-100',
    },
    {
      icon: TrendingUp,
      label: 'Taux de completion',
      value: `${completionRate.toFixed(1)}%`,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
    },
    {
      icon: Zap,
      label: 'Actions agents (30j)',
      value: stats.agent_actions_30d,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-100',
    },
    {
      icon: Star,
      label: 'CSAT moyen',
      value: csatAvg,
      iconColor: 'text-yellow-600',
      iconBg: 'bg-yellow-100',
    },
  ];

  // Mock trends for now (would come from previous period comparison in real implementation)
  const trends = [12.5, 8.3, -2.1, 5.7, 18.2, 0];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {metrics.map((metric, index) => (
        <MetricCard
          key={index}
          {...metric}
          trend={trends[index]}
        />
      ))}
    </div>
  );
}
