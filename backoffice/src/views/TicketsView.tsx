// ═══════════════════════════════════════════════════════════════
// Tickets View - Super Admin Backoffice (Redesigned)
// Modern card-based layout with better visual hierarchy
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Search, Filter, RefreshCw, AlertCircle, X, ChevronRight } from 'lucide-react';
import { api } from '../lib/api';
import type { SupportTicket, TicketFilters, TicketStatus, TicketPriority, TicketCategory } from '../types';
import { Badge, Button, Input, Card } from '../components/ui';

const STATUS_CONFIG: Record<TicketStatus, { label: string; variant: any; icon: string }> = {
  open: { label: 'Open', variant: 'open', icon: '🔵' },
  in_progress: { label: 'In Progress', variant: 'in_progress', icon: '⏳' },
  resolved: { label: 'Resolved', variant: 'resolved', icon: '✅' },
  closed: { label: 'Closed', variant: 'closed', icon: '🔒' },
  waiting_user: { label: 'Waiting on User', variant: 'waiting_user', icon: '⏸️' },
};

const PRIORITY_CONFIG: Record<TicketPriority, { label: string; variant: any; icon: string }> = {
  low: { label: 'Low', variant: 'low', icon: '⬇️' },
  medium: { label: 'Medium', variant: 'medium', icon: '➡️' },
  high: { label: 'High', variant: 'high', icon: '⬆️' },
  critical: { label: 'Critical', variant: 'critical', icon: '🚨' },
};

const CATEGORY_CONFIG: Record<TicketCategory, { label: string; emoji: string }> = {
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

  const hasActiveFilters = filters.status || filters.priority || filters.category;

  // Count tickets by status for quick stats
  const statusCounts = tickets.reduce((acc, ticket) => {
    acc[ticket.status] = (acc[ticket.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-8 max-w-[1800px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Support Tickets</h1>
            <p className="text-slate-400">Manage and respond to all user support requests</p>
          </div>
          <Button variant="secondary" onClick={loadTickets} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
            <Card key={key} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 mb-1">{config.label}</p>
                  <p className="text-2xl font-bold text-white">{statusCounts[key] || 0}</p>
                </div>
                <span className="text-3xl">{config.icon}</span>
              </div>
            </Card>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              icon={<Search />}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tickets by subject, description, or user email..."
            />
          </div>
          <Button
            variant={showFilters ? 'primary' : 'ghost'}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 px-2 py-0.5 bg-cyan-500 text-white text-xs rounded-full">
                {[filters.status, filters.priority, filters.category].filter(Boolean).length}
              </span>
            )}
          </Button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <Card className="mt-4 p-4">
            <div className="grid grid-cols-3 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value as any || undefined })}
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
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
                <label className="block text-sm font-medium text-slate-300 mb-2">Priority</label>
                <select
                  value={filters.priority || ''}
                  onChange={(e) => setFilters({ ...filters, priority: e.target.value as any || undefined })}
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
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
                <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                <select
                  value={filters.category || ''}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value as any || undefined })}
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
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

            <div className="mt-4 flex justify-end">
              <Button variant="ghost" onClick={() => setFilters({})}>
                <X className="w-4 h-4" />
                Clear Filters
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-300">Error Loading Tickets</p>
            <p className="text-sm text-red-400 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Tickets List */}
      {loading ? (
        <div className="text-center py-16">
          <RefreshCw className="w-10 h-10 text-cyan-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-lg">Loading tickets...</p>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-800/50 mb-6">
            <Ticket className="w-10 h-10 text-slate-600" />
          </div>
          <h3 className="text-xl font-semibold text-slate-300 mb-2">No tickets found</h3>
          <p className="text-slate-500">
            {searchTerm || hasActiveFilters
              ? 'Try adjusting your search or filters'
              : 'No support tickets have been created yet'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4">
            {filteredTickets.map((ticket) => (
              <Card
                key={ticket.id}
                onClick={() => navigate(`/tickets/${ticket.id}`)}
                className="p-6 cursor-pointer hover:bg-slate-800/70 transition-all hover:shadow-lg hover:shadow-cyan-500/10 group"
              >
                <div className="flex items-start gap-6">
                  {/* Category Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 rounded-xl bg-slate-900/50 flex items-center justify-center group-hover:bg-cyan-500/10 transition-colors">
                      <span className="text-3xl">{CATEGORY_CONFIG[ticket.category].emoji}</span>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors truncate">
                          {ticket.subject}
                        </h3>
                        <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                          {ticket.description}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-cyan-500 transition-colors flex-shrink-0" />
                    </div>

                    {/* Meta Info */}
                    <div className="flex items-center gap-4 flex-wrap">
                      <Badge variant={STATUS_CONFIG[ticket.status].variant}>
                        {STATUS_CONFIG[ticket.status].icon} {STATUS_CONFIG[ticket.status].label}
                      </Badge>
                      <Badge variant={PRIORITY_CONFIG[ticket.priority].variant}>
                        {PRIORITY_CONFIG[ticket.priority].icon} {PRIORITY_CONFIG[ticket.priority].label}
                      </Badge>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span>👤</span>
                        <span className="font-medium">{ticket.user_email || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span>🕐</span>
                        <span>Created {getRelativeTime(ticket.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span>📝</span>
                        <span>Updated {getRelativeTime(ticket.updated_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Results Count */}
          <div className="mt-6 text-center text-sm text-slate-500">
            Showing {filteredTickets.length} of {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
          </div>
        </>
      )}
    </div>
  );
}
