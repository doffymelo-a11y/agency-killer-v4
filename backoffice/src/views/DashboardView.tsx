// ═══════════════════════════════════════════════════════════════
// Dashboard View - Super Admin Backoffice
// Home page with quick stats and overview
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Ticket, Users, AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';
import type { TicketStats } from '../types';
import { StatCard, Badge, Button, Card, CardHeader, CardTitle, CardContent } from '../components/ui';

export default function DashboardView() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    const response = await api.get<TicketStats>('/api/superadmin/tickets/stats');
    if (response.success && response.data) {
      setStats(response.data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-white">Super Admin Dashboard</h1>
          <Badge variant="super_admin">SUPER ADMIN</Badge>
        </div>
        <p className="text-slate-400">System-wide statistics and management portal</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link to="/tickets">
          <StatCard
            icon={<Ticket />}
            label="Total Tickets"
            value={stats?.total || 0}
            subtext="View all support tickets"
            color="cyan"
          />
        </Link>

        <Link to="/users">
          <StatCard
            icon={<Users />}
            label="Total Users"
            value="—"
            subtext="Manage all users"
            color="purple"
          />
        </Link>

        <Link to="/logs">
          <StatCard
            icon={<AlertTriangle />}
            label="System Logs"
            value="—"
            subtext="View audit trail"
            color="amber"
          />
        </Link>

        <Link to="/metrics">
          <StatCard
            icon={<Clock />}
            label="Avg Response"
            value={stats?.avg_response_time_hours?.toFixed(1) ? `${stats.avg_response_time_hours.toFixed(1)}h` : '—'}
            subtext="First response time"
            color="green"
          />
        </Link>
      </div>

      {/* Tickets Breakdown */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* By Status */}
          <Card>
            <CardHeader>
              <CardTitle>Tickets by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(stats.by_status).map(([status, count]) => (
                  <div key={status} className="bg-slate-900/50 p-4 rounded-lg text-center">
                    <p className="text-3xl font-bold text-white mb-1">{count}</p>
                    <p className="text-sm text-slate-400 capitalize">{status.replace('_', ' ')}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* By Priority */}
          <Card>
            <CardHeader>
              <CardTitle>Tickets by Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(stats.by_priority).map(([priority, count]) => (
                  <div key={priority} className="bg-slate-900/50 p-4 rounded-lg text-center">
                    <p className="text-3xl font-bold text-white mb-1">{count}</p>
                    <p className="text-sm text-slate-400 capitalize">{priority}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-8 flex items-center gap-4">
        <Button variant="primary" onClick={() => navigate('/tickets')}>
          <Ticket className="w-4 h-4" />
          View All Tickets
        </Button>
        <Button variant="secondary" onClick={loadStats}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
    </div>
  );
}
