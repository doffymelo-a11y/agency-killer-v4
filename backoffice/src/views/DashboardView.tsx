// ═══════════════════════════════════════════════════════════════
// Dashboard View - Super Admin Backoffice
// Home page with quick stats and overview
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Users, FileText, Activity } from 'lucide-react';
import { api } from '../lib/api';
import type { TicketStats } from '../types';

export default function DashboardView() {
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

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Super Admin Dashboard</h1>
        <p className="text-slate-600">Welcome to the Hive OS V5 Management Portal</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link to="/tickets" className="block">
          <div className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Ticket className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm text-slate-500">View All</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-1">
              {loading ? '...' : stats?.total || 0}
            </h3>
            <p className="text-slate-600 text-sm">Total Tickets</p>
          </div>
        </Link>

        <Link to="/users" className="block">
          <div className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm text-slate-500">View All</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-1">—</h3>
            <p className="text-slate-600 text-sm">Users</p>
          </div>
        </Link>

        <Link to="/logs" className="block">
          <div className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm text-slate-500">View All</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-1">—</h3>
            <p className="text-slate-600 text-sm">System Logs</p>
          </div>
        </Link>

        <Link to="/metrics" className="block">
          <div className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-amber-600" />
              </div>
              <span className="text-sm text-slate-500">View All</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-1">—</h3>
            <p className="text-slate-600 text-sm">Metrics</p>
          </div>
        </Link>
      </div>

      {/* Ticket Status Breakdown */}
      {stats && (
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Tickets by Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.by_status).map(([status, count]) => (
              <div key={status} className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold text-slate-900">{count}</p>
                <p className="text-sm text-slate-600 capitalize">{status}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
