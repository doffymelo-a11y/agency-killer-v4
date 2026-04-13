/**
 * MetricsCards - Display business metrics in cards
 * Sprint 2.2 - Admin Dashboard UI Components
 */

import {
  Users,
  FolderKanban,
  CheckCircle2,
  TrendingUp,
  Star,
  Activity,
} from 'lucide-react';
import type { BusinessStats } from '../../services/admin.service';

interface MetricsCardsProps {
  stats: BusinessStats | null;
  isLoading?: boolean;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  color: 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'yellow';
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    trend: 'text-blue-600',
  },
  green: {
    bg: 'bg-green-50',
    icon: 'text-green-600',
    trend: 'text-green-600',
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'text-purple-600',
    trend: 'text-purple-600',
  },
  orange: {
    bg: 'bg-orange-50',
    icon: 'text-orange-600',
    trend: 'text-orange-600',
  },
  pink: {
    bg: 'bg-pink-50',
    icon: 'text-pink-600',
    trend: 'text-pink-600',
  },
  yellow: {
    bg: 'bg-yellow-50',
    icon: 'text-yellow-600',
    trend: 'text-yellow-600',
  },
};

function MetricCard({ title, value, subtitle, icon, trend, color }: MetricCardProps) {
  const colors = colorClasses[color];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-900">{value}</p>
          {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 ${colors.trend}`}>
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">
                {trend.value > 0 ? '+' : ''}
                {trend.value}%
              </span>
              <span className="text-sm text-slate-500">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={`flex-shrink-0 ${colors.bg} p-3 rounded-lg`}>
          <div className={colors.icon}>{icon}</div>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/2 mb-3"></div>
        <div className="h-8 bg-slate-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-slate-200 rounded w-1/3"></div>
      </div>
    </div>
  );
}

export default function MetricsCards({ stats, isLoading }: MetricsCardsProps) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  const metrics: MetricCardProps[] = [
    {
      title: 'Total Users',
      value: stats.users_total.toLocaleString(),
      subtitle: `${stats.users_active_7d} active in last 7 days`,
      icon: <Users className="w-6 h-6" />,
      color: 'blue',
    },
    {
      title: 'Total Projects',
      value: stats.projects_total.toLocaleString(),
      subtitle: `${stats.projects_active} in progress`,
      icon: <FolderKanban className="w-6 h-6" />,
      color: 'green',
    },
    {
      title: 'Tasks Completion',
      value: `${stats.tasks_completion_rate}%`,
      subtitle: `${stats.tasks_completed} / ${stats.tasks_total} tasks`,
      icon: <CheckCircle2 className="w-6 h-6" />,
      color: 'purple',
    },
    {
      title: 'Agent Actions',
      value: stats.agent_actions_30d.toLocaleString(),
      subtitle: 'Last 30 days',
      icon: <Activity className="w-6 h-6" />,
      color: 'orange',
    },
    {
      title: 'Customer Satisfaction',
      value: stats.avg_csat ? `${stats.avg_csat}/5` : 'N/A',
      subtitle: stats.avg_csat ? 'Average rating' : 'No ratings yet',
      icon: <Star className="w-6 h-6" />,
      color: stats.avg_csat && stats.avg_csat >= 4 ? 'yellow' : 'pink',
    },
    {
      title: 'Most Active Scope',
      value:
        stats.projects_by_scope && stats.projects_by_scope.length > 0
          ? stats.projects_by_scope[0].scope.replace('_', ' ')
          : 'N/A',
      subtitle:
        stats.projects_by_scope && stats.projects_by_scope.length > 0
          ? `${stats.projects_by_scope[0].count} projects`
          : undefined,
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'pink',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  );
}
