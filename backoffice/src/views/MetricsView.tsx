// ═══════════════════════════════════════════════════════════════
// Metrics View - Super Admin Backoffice
// View global system metrics and analytics
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { Activity, RefreshCw, AlertCircle, TrendingUp, Users, Ticket, Clock } from 'lucide-react';
import { api } from '../lib/api';
import type { GlobalMetrics } from '../types';

export default function MetricsView() {
  const [metrics, setMetrics] = useState<GlobalMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    setError('');

    const response = await api.get<GlobalMetrics>('/api/superadmin/metrics/global');

    if (response.success && response.data) {
      setMetrics(response.data);
    } else {
      setError(response.error?.message || 'Failed to load metrics');
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-amber-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading metrics...</p>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="p-8">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">Error Loading Metrics</p>
            <p className="text-sm text-red-700 mt-1">{error || 'Failed to load metrics'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Global Metrics</h1>
            <p className="text-slate-600">System-wide analytics and performance indicators</p>
          </div>
          <button
            onClick={loadMetrics}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          icon={<Users className="w-6 h-6" />}
          label="Total Users"
          value={metrics.total_users}
          color="blue"
        />
        <MetricCard
          icon={<Ticket className="w-6 h-6" />}
          label="Total Tickets"
          value={metrics.total_tickets}
          color="green"
        />
        <MetricCard
          icon={<Activity className="w-6 h-6" />}
          label="Active Today"
          value={metrics.active_users_today || 0}
          color="purple"
        />
        <MetricCard
          icon={<Clock className="w-6 h-6" />}
          label="Avg Response Time"
          value={
            metrics.avg_response_time_hours
              ? `${metrics.avg_response_time_hours.toFixed(1)}h`
              : 'N/A'
          }
          color="amber"
        />
      </div>

      {/* User Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Users by Role</h2>
          <div className="space-y-3">
            <RoleBar
              label="Regular Users"
              count={metrics.users_by_role.user || 0}
              total={metrics.total_users}
              color="bg-slate-500"
            />
            <RoleBar
              label="Admins"
              count={metrics.users_by_role.admin || 0}
              total={metrics.total_users}
              color="bg-blue-500"
            />
            <RoleBar
              label="Super Admins"
              count={metrics.users_by_role.super_admin || 0}
              total={metrics.total_users}
              color="bg-amber-500"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Tickets by Status</h2>
          <div className="space-y-3">
            <StatusBar
              label="Open"
              count={metrics.tickets_by_status.open || 0}
              total={metrics.total_tickets}
              color="bg-blue-500"
            />
            <StatusBar
              label="In Progress"
              count={metrics.tickets_by_status.in_progress || 0}
              total={metrics.total_tickets}
              color="bg-yellow-500"
            />
            <StatusBar
              label="Resolved"
              count={metrics.tickets_by_status.resolved || 0}
              total={metrics.total_tickets}
              color="bg-green-500"
            />
            <StatusBar
              label="Closed"
              count={metrics.tickets_by_status.closed || 0}
              total={metrics.total_tickets}
              color="bg-slate-500"
            />
          </div>
        </div>
      </div>

      {/* Ticket Priority */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Tickets by Priority</h2>
        <div className="grid grid-cols-4 gap-4">
          <PriorityCard
            label="Critical"
            count={metrics.tickets_by_priority.critical || 0}
            color="red"
            icon="🚨"
          />
          <PriorityCard
            label="High"
            count={metrics.tickets_by_priority.high || 0}
            color="orange"
            icon="⬆️"
          />
          <PriorityCard
            label="Medium"
            count={metrics.tickets_by_priority.medium || 0}
            color="blue"
            icon="➡️"
          />
          <PriorityCard
            label="Low"
            count={metrics.tickets_by_priority.low || 0}
            color="slate"
            icon="⬇️"
          />
        </div>
      </div>
    </div>
  );
}

// Helper Components

function MetricCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    amber: 'bg-amber-100 text-amber-600',
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color as keyof typeof colorClasses]}`}>
          {icon}
        </div>
        <TrendingUp className="w-4 h-4 text-green-500" />
      </div>
      <div className="text-2xl font-bold text-slate-900 mb-1">{value}</div>
      <div className="text-sm text-slate-600">{label}</div>
    </div>
  );
}

function RoleBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-sm text-slate-600">
          {count} ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function StatusBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-sm text-slate-600">
          {count} ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function PriorityCard({
  label,
  count,
  color,
  icon,
}: {
  label: string;
  count: number;
  color: string;
  icon: string;
}) {
  const colorClasses = {
    red: 'bg-red-50 border-red-200 text-red-900',
    orange: 'bg-orange-50 border-orange-200 text-orange-900',
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    slate: 'bg-slate-50 border-slate-200 text-slate-900',
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold mb-1">{count}</div>
      <div className="text-sm">{label}</div>
    </div>
  );
}
