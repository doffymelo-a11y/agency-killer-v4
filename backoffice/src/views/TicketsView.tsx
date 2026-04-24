// ═══════════════════════════════════════════════════════════════
// Tickets View - Super Admin Backoffice
// List and manage all support tickets
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Search, Filter, RefreshCw, AlertCircle, X } from 'lucide-react';
import { api } from '../lib/api';
import type { SupportTicket, TicketFilters, TicketStatus, TicketPriority, TicketCategory } from '../types';
import {
  Badge,
  Button,
  Input,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmptyState,
  Card,
} from '../components/ui';

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
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
          <Card className="mt-4">
            <div className="p-4">
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
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading tickets...</p>
        </div>
      ) : filteredTickets.length === 0 ? (
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Ticket</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Updated</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            <TableEmptyState
              icon={<Ticket className="w-12 h-12" />}
              title="No tickets found"
              description={searchTerm || hasActiveFilters ? 'Try adjusting your search or filters' : undefined}
            />
          </TableBody>
        </Table>
      ) : (
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Ticket</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Updated</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {filteredTickets.map((ticket) => (
              <TableRow
                key={ticket.id}
                onClick={() => navigate(`/tickets/${ticket.id}`)}
              >
                <TableCell>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{CATEGORY_CONFIG[ticket.category].emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white truncate">{ticket.subject}</div>
                      <div className="text-sm text-slate-400 truncate">{ticket.description}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div className="font-medium text-white">{ticket.user_email || 'Unknown'}</div>
                    <div className="text-slate-500 text-xs">{ticket.user_id.slice(0, 8)}...</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_CONFIG[ticket.status].variant}>
                    {STATUS_CONFIG[ticket.status].icon} {STATUS_CONFIG[ticket.status].label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={PRIORITY_CONFIG[ticket.priority].variant}>
                    {PRIORITY_CONFIG[ticket.priority].icon} {PRIORITY_CONFIG[ticket.priority].label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-slate-400">{getRelativeTime(ticket.created_at)}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-slate-400">{getRelativeTime(ticket.updated_at)}</div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Results Count */}
      {!loading && (
        <div className="mt-4 text-sm text-slate-500 text-center">
          Showing {filteredTickets.length} of {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
