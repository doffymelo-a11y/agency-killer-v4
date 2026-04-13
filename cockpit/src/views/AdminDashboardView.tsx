// ============================================
// THE HIVE OS V4 - Admin Dashboard
// View all users, global stats, manage roles
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, LifeBuoy, BarChart3, Clock } from 'lucide-react';
import { supabase, getCurrentUser } from '../lib/supabase';
import {
  getAllTickets,
  formatTicketNumber,
  getRelativeTime,
} from '../services/support.service';
import type { SupportTicketWithUser, TicketStatus, TicketPriority, TicketCategory } from '../types/support.types';
import {
  TICKET_STATUS_CONFIG,
  TICKET_PRIORITY_CONFIG,
  TICKET_CATEGORY_CONFIG,
} from '../types/support.types';
import SLADashboard from '../components/admin/SLADashboard';

interface UserStats {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string;
  role: string;
  project_count: number;
  task_count: number;
  chat_session_count: number;
}

interface GlobalStats {
  total_users: number;
  total_projects: number;
  total_tasks: number;
  active_users_last_7_days: number;
  projects_created_today: number;
  tasks_created_today: number;
}

type TabType = 'users' | 'tickets' | 'sla' | 'stats';

export default function AdminDashboardView() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [users, setUsers] = useState<UserStats[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Tickets state
  const [tickets, setTickets] = useState<SupportTicketWithUser[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | 'all'>('all');

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  async function checkAdminAndLoad() {
    setLoading(true);

    const user = await getCurrentUser();
    if (!user) {
      navigate('/login');
      return;
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const adminRole = roleData?.role === 'admin' || roleData?.role === 'super_admin';
    setIsAdmin(adminRole);

    if (!adminRole) {
      navigate('/projects');
      return;
    }

    // Load global stats
    const { data: stats } = await supabase.rpc('get_global_stats');
    setGlobalStats(stats);

    // Load all users
    const { data: usersData } = await supabase
      .from('admin_users_stats')
      .select('*')
      .order('created_at', { ascending: false });

    setUsers(usersData || []);
    setLoading(false);
  }

  async function loadTickets() {
    setTicketsLoading(true);
    try {
      const filters: any = {};
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (priorityFilter !== 'all') filters.priority = priorityFilter;
      if (categoryFilter !== 'all') filters.category = categoryFilter;

      const data = await getAllTickets(filters);
      setTickets(data);
    } catch (error) {
      console.error('[Admin] Error loading tickets:', error);
    } finally {
      setTicketsLoading(false);
    }
  }

  useEffect(() => {
    if (isAdmin && activeTab === 'tickets') {
      loadTickets();
    }
  }, [activeTab, statusFilter, priorityFilter, categoryFilter, isAdmin]);

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
              <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20">
                ADMIN
              </span>
            </div>
            <p className="text-slate-400">System-wide statistics and user management</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/monitoring')}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white transition font-medium"
            >
              📊 System Monitoring
            </button>
            <button
              onClick={() => navigate('/projects')}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition"
            >
              ← Back to Projects
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'users'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'tickets'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <LifeBuoy className="w-4 h-4" />
            Tickets ({tickets.length})
          </button>
          <button
            onClick={() => setActiveTab('sla')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'sla'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <Clock className="w-4 h-4" />
            SLA Performance
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'stats'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Stats
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <>
            {/* Global Stats Grid */}
            {globalStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-400 text-sm">Total Users</p>
                <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-4xl font-bold text-white">{globalStats.total_users}</p>
              <p className="text-xs text-slate-500 mt-1">
                {globalStats.active_users_last_7_days} active last 7 days
              </p>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-400 text-sm">Total Projects</p>
                <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
              </div>
              <p className="text-4xl font-bold text-white">{globalStats.total_projects}</p>
              <p className="text-xs text-slate-500 mt-1">
                +{globalStats.projects_created_today} today
              </p>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-400 text-sm">Total Tasks</p>
                <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <p className="text-4xl font-bold text-white">{globalStats.total_tasks}</p>
              <p className="text-xs text-slate-500 mt-1">
                +{globalStats.tasks_created_today} today
              </p>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">All Users</h2>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by email..."
              className="px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left text-sm font-semibold text-slate-300 pb-3">Email</th>
                  <th className="text-left text-sm font-semibold text-slate-300 pb-3">Role</th>
                  <th className="text-center text-sm font-semibold text-slate-300 pb-3">Projects</th>
                  <th className="text-center text-sm font-semibold text-slate-300 pb-3">Tasks</th>
                  <th className="text-center text-sm font-semibold text-slate-300 pb-3">Chats</th>
                  <th className="text-left text-sm font-semibold text-slate-300 pb-3">Created</th>
                  <th className="text-left text-sm font-semibold text-slate-300 pb-3">Last Sign In</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-slate-700/50 hover:bg-slate-750 transition">
                    <td className="py-4 text-white text-sm">{user.email}</td>
                    <td className="py-4">
                      <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${
                        user.role === 'super_admin'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : user.role === 'admin'
                          ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                          : 'bg-slate-600/50 text-slate-300 border border-slate-600'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-4 text-center text-slate-300">{user.project_count}</td>
                    <td className="py-4 text-center text-slate-300">{user.task_count}</td>
                    <td className="py-4 text-center text-slate-300">{user.chat_session_count}</td>
                    <td className="py-4 text-slate-400 text-sm">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 text-slate-400 text-sm">
                      {user.last_sign_in_at
                        ? new Date(user.last_sign_in_at).toLocaleDateString()
                        : 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-400">No users found</p>
              </div>
            )}
          </div>
        </div>
          </>
        )}

        {/* Tickets Tab */}
        {activeTab === 'tickets' && (
          <>
            {/* Filters */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 mb-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-400">Status:</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as TicketStatus | 'all')}
                    className="px-3 py-1.5 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="all">All</option>
                    {Object.entries(TICKET_STATUS_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-400">Priority:</label>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value as TicketPriority | 'all')}
                    className="px-3 py-1.5 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="all">All</option>
                    {Object.entries(TICKET_PRIORITY_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-400">Category:</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value as TicketCategory | 'all')}
                    className="px-3 py-1.5 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="all">All</option>
                    {Object.entries(TICKET_CATEGORY_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.emoji} {config.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="ml-auto text-sm text-slate-400">
                  {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>

            {/* Tickets Table */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
              {ticketsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading tickets...</p>
                  </div>
                </div>
              ) : tickets.length === 0 ? (
                <div className="text-center py-12">
                  <LifeBuoy className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No tickets found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left text-sm font-semibold text-slate-300 pb-3">ID</th>
                        <th className="text-left text-sm font-semibold text-slate-300 pb-3">Priority</th>
                        <th className="text-left text-sm font-semibold text-slate-300 pb-3">Category</th>
                        <th className="text-left text-sm font-semibold text-slate-300 pb-3">Subject</th>
                        <th className="text-left text-sm font-semibold text-slate-300 pb-3">User</th>
                        <th className="text-left text-sm font-semibold text-slate-300 pb-3">Status</th>
                        <th className="text-left text-sm font-semibold text-slate-300 pb-3">Created</th>
                        <th className="text-left text-sm font-semibold text-slate-300 pb-3">Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.map((ticket) => {
                        const statusConfig = TICKET_STATUS_CONFIG[ticket.status];
                        const priorityConfig = TICKET_PRIORITY_CONFIG[ticket.priority];
                        const categoryConfig = TICKET_CATEGORY_CONFIG[ticket.category];

                        return (
                          <tr
                            key={ticket.id}
                            onClick={() => navigate(`/support/${ticket.id}`)}
                            className="border-b border-slate-700/50 hover:bg-slate-750 cursor-pointer transition"
                          >
                            <td className="py-4 text-slate-400 text-xs font-mono">
                              {formatTicketNumber(ticket.id)}
                            </td>
                            <td className="py-4">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${priorityConfig.color}`}>
                                {priorityConfig.icon} {priorityConfig.label}
                              </span>
                            </td>
                            <td className="py-4">
                              <span className="text-lg">{categoryConfig.emoji}</span>
                              <span className="text-xs text-slate-400 ml-2">{categoryConfig.label}</span>
                            </td>
                            <td className="py-4 text-white text-sm max-w-xs truncate">
                              {ticket.subject}
                            </td>
                            <td className="py-4 text-slate-300 text-sm">
                              {ticket.user_email || 'Unknown'}
                            </td>
                            <td className="py-4">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${statusConfig.bgColor} ${statusConfig.color}`}>
                                {statusConfig.icon} {statusConfig.label}
                              </span>
                            </td>
                            <td className="py-4 text-slate-400 text-sm flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {getRelativeTime(ticket.created_at)}
                            </td>
                            <td className="py-4 text-slate-400 text-sm">
                              {getRelativeTime(ticket.updated_at)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* SLA Tab */}
        {activeTab === 'sla' && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
            <SLADashboard />
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-12 text-center">
            <BarChart3 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Advanced statistics coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}
