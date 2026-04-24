// ═══════════════════════════════════════════════════════════════
// Tickets View - Super Admin Backoffice
// List and manage all support tickets
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Search, Filter, RefreshCw, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';
import type { SupportTicket, TicketFilters, TicketStatus } from '../types';

const STATUS_CONFIG: Record<TicketStatus, { label: string; color: string; icon: string }> = {
  open: { label: 'Open', color: 'bg-blue-100 text-blue-800', icon: '🔵' },
  in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800', icon: '✅' },
  closed: { label: 'Closed', color: 'bg-slate-100 text-slate-800', icon: '🔒' },
  waiting_user: { label: 'Waiting on User', color: 'bg-purple-100 text-purple-800', icon: '⏸️' },
};

const PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'text-slate-600', icon: '⬇️' },
  medium: { label: 'Medium', color: 'text-blue-600', icon: '➡️' },
  high: { label: 'High', color: 'text-orange-600', icon: '⬆️' },
  critical: { label: 'Critical', color: 'text-red-600', icon: '🚨' },
};

const CATEGORY_CONFIG = {
  bug: { label: 'Bug', emoji: '🐛' },
  feature_request: { label: 'Feature Request', emoji: '✨' },
  question: { label: 'Question', emoji: '❓' },
  billing: { label: 'Billing', emoji: '💰' },
  integration: { label: 'Integration', emoji: '🔌' },
  other: { label: 'Other', emoji: '📋' },
};

export default function TicketsView() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<TicketFilters>({});

  useEffect(() => {
    loadTickets();
  }, [filters]);

  const loadTickets = async () => {
    setLoading(true);
    setError('');

    const response = await api.get<{ tickets: SupportTicket[]; pagination: any }>('/api/superadmin/tickets', filters);

    if (response.success && response.data) {
      // Backend returns { data: { tickets: [...], pagination: {...} } }
      setTickets(response.data.tickets || []);
    } else {
      setError(response.error?.message || 'Failed to load tickets');
    }

    setLoading(false);
  };

  const filteredTickets = tickets.filter((ticket) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      ticket.subject.toLowerCase().includes(search) ||
      ticket.description.toLowerCase().includes(search) ||
      ticket.user_email?.toLowerCase().includes(search)
    );
  });

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Support Tickets</h1>
            <p className="text-slate-600">Manage and respond to all user support requests</p>
          </div>
          <button
            onClick={loadTickets}
            disabled={loading}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tickets by subject, description, or user email..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border rounded-lg transition flex items-center gap-2 ${
              showFilters
                ? 'bg-amber-50 border-amber-300 text-amber-700'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="grid grid-cols-3 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value as any || undefined })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="">All Statuses</option>
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.icon} {config.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Priority</label>
                <select
                  value={filters.priority || ''}
                  onChange={(e) => setFilters({ ...filters, priority: e.target.value as any || undefined })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="">All Priorities</option>
                  {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.icon} {config.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                <select
                  value={filters.category || ''}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value as any || undefined })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="">All Categories</option>
                  {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.emoji} {config.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-3 flex justify-end">
              <button
                onClick={() => setFilters({})}
                className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">Error Loading Tickets</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Tickets List */}
      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 text-amber-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading tickets...</p>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="text-center py-12">
          <Ticket className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 text-lg">No tickets found</p>
          {searchTerm && (
            <p className="text-slate-500 text-sm mt-2">Try adjusting your search or filters</p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Ticket
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                  className="hover:bg-slate-50 cursor-pointer transition"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{CATEGORY_CONFIG[ticket.category].emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900 truncate">{ticket.subject}</div>
                        <div className="text-sm text-slate-500 truncate">{ticket.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="font-medium text-slate-900">{ticket.user_email || 'Unknown'}</div>
                      <div className="text-slate-500 text-xs">{ticket.user_id.slice(0, 8)}...</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        STATUS_CONFIG[ticket.status].color
                      }`}
                    >
                      {STATUS_CONFIG[ticket.status].icon}
                      {STATUS_CONFIG[ticket.status].label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-medium ${PRIORITY_CONFIG[ticket.priority].color}`}>
                      {PRIORITY_CONFIG[ticket.priority].icon} {PRIORITY_CONFIG[ticket.priority].label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-600">{getRelativeTime(ticket.created_at)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-600">{getRelativeTime(ticket.updated_at)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Results Count */}
      {!loading && (
        <div className="mt-4 text-sm text-slate-600 text-center">
          Showing {filteredTickets.length} of {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
