// ═══════════════════════════════════════════════════════════════
// Metrics View - Super Admin Backoffice
// View global system metrics and analytics
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { Activity, RefreshCw, AlertCircle, Users, Ticket, Clock } from 'lucide-react';
import { api } from '../lib/api';
import type { GlobalMetrics } from '../types';
import { StatCard, Button, Card, CardHeader, CardTitle, CardContent } from '../components/ui';

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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading metrics...</p>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-300">Error Loading Metrics</p>
            <p className="text-sm text-red-400 mt-1">{error || 'Failed to load metrics'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Global Metrics</h1>
            <p className="text-slate-400">System-wide analytics and performance indicators</p>
          </div>
          <Button variant="secondary" onClick={loadMetrics}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<Users />}
          label="Total Users"
          value={metrics.total_users}
          subtext="All registered accounts"
          color="purple"
        />
        <StatCard
          icon={<Ticket />}
          label="Total Tickets"
          value={metrics.total_tickets}
          subtext="Support requests"
          color="green"
        />
        <StatCard
          icon={<Activity />}
          label="Active Today"
          value={metrics.active_users_today || 0}
          subtext="Users online today"
          color="cyan"
        />
        <StatCard
          icon={<Clock />}
          label="Avg Response Time"
          value={
            metrics.avg_response_time_hours
              ? `${metrics.avg_response_time_hours.toFixed(1)}h`
              : 'N/A'
          }
          subtext="First response time"
          color="amber"
        />
      </div>

      {/* User Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Users by Role</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <RoleBar
                label="Regular Users"
                count={metrics.users_by_role.user || 0}
                total={metrics.total_users}
                color="bg-purple-500"
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tickets by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
          </CardContent>
        </Card>
      </div>

      {/* Ticket Priority */}
      <Card>
        <CardHeader>
          <CardTitle>Tickets by Priority</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
        </CardContent>
      </Card>
    </div>
  );
}

// Helper Components

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
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-300">{label}</span>
        <span className="text-sm text-slate-400">
          {count} ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div className="w-full bg-slate-700/50 rounded-full h-2.5">
        <div className={`${color} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }} />
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
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-300">{label}</span>
        <span className="text-sm text-slate-400">
          {count} ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div className="w-full bg-slate-700/50 rounded-full h-2.5">
        <div className={`${color} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }} />
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
    red: 'bg-red-500/10 border-red-500/20 text-red-300',
    orange: 'bg-orange-500/10 border-orange-500/20 text-orange-300',
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
    slate: 'bg-slate-500/10 border-slate-500/20 text-slate-300',
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-white mb-1">{count}</div>
      <div className="text-sm">{label}</div>
    </div>
  );
}
