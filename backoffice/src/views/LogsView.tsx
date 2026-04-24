// ═══════════════════════════════════════════════════════════════
// Logs View - Super Admin Backoffice
// View system logs and audit trail
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { FileText, Search, RefreshCw, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';
import type { AuditLog, SystemLog } from '../types';
import {
  Badge,
  Button,
  Input,
  Tabs,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmptyState,
  Card,
} from '../components/ui';

const ACTION_CONFIG: Record<string, { label: string; variant: any }> = {
  UPDATE_TICKET: { label: 'Update Ticket', variant: 'open' },
  ADD_NOTE: { label: 'Add Note', variant: 'resolved' },
  VIEW_TICKET: { label: 'View Ticket', variant: 'user' },
  UPDATE_USER_ROLE: { label: 'Update User Role', variant: 'admin' },
  VIEW_LOGS: { label: 'View Logs', variant: 'user' },
  VIEW_METRICS: { label: 'View Metrics', variant: 'user' },
};

const LEVEL_CONFIG: Record<string, { label: string; variant: any }> = {
  error: { label: 'Error', variant: 'critical' },
  warn: { label: 'Warning', variant: 'high' },
  info: { label: 'Info', variant: 'open' },
  debug: { label: 'Debug', variant: 'user' },
};

export default function LogsView() {
  const [activeTab, setActiveTab] = useState<'audit' | 'system'>('audit');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('');

  useEffect(() => {
    loadLogs();
  }, [activeTab]);

  const loadLogs = async () => {
    setLoading(true);
    setError('');

    if (activeTab === 'audit') {
      const response = await api.get<{ logs: AuditLog[]; pagination: any }>('/api/superadmin/logs/audit');
      if (response.success && response.data) {
        setAuditLogs(response.data.logs || []);
      } else {
        setError(response.error?.message || 'Failed to load audit logs');
      }
    } else {
      const response = await api.get<{ logs: SystemLog[] }>('/api/superadmin/logs/system');
      if (response.success && response.data) {
        setSystemLogs(response.data.logs || []);
      } else {
        setError(response.error?.message || 'Failed to load system logs');
      }
    }

    setLoading(false);
  };

  const filteredAuditLogs = auditLogs.filter((log) => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        log.admin_email?.toLowerCase().includes(search) ||
        log.action.toLowerCase().includes(search) ||
        log.details?.toLowerCase().includes(search);
      if (!matchesSearch) return false;
    }

    if (actionFilter && log.action !== actionFilter) {
      return false;
    }

    return true;
  });

  const filteredSystemLogs = systemLogs.filter((log) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      log.message.toLowerCase().includes(search) ||
      log.level.toLowerCase().includes(search) ||
      log.source?.toLowerCase().includes(search)
    );
  });

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const uniqueActions = Array.from(new Set(auditLogs.map((log) => log.action)));

  const tabs = [
    { id: 'audit' as const, label: 'Audit Logs' },
    { id: 'system' as const, label: 'System Logs' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">System Logs</h1>
            <p className="text-slate-400">Monitor system activity and audit trail</p>
          </div>
          <Button variant="secondary" onClick={loadLogs} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Tabs */}
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={(tabId) => setActiveTab(tabId as 'audit' | 'system')}
        />

        {/* Search and Filters */}
        <div className="flex gap-3 mt-6">
          <div className="flex-1">
            <Input
              icon={<Search />}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                activeTab === 'audit'
                  ? 'Search audit logs by admin, action, or details...'
                  : 'Search system logs by message, level, or source...'
              }
            />
          </div>
          {activeTab === 'audit' && (
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              <option value="">All Actions</option>
              {uniqueActions.map((action) => (
                <option key={action} value={action}>
                  {ACTION_CONFIG[action]?.label || action}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-300">Error Loading Logs</p>
            <p className="text-sm text-red-400 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Logs List */}
      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading logs...</p>
        </div>
      ) : activeTab === 'audit' ? (
        filteredAuditLogs.length === 0 ? (
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Time</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>IP Address</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              <TableEmptyState
                icon={<FileText className="w-12 h-12" />}
                title="No audit logs found"
              />
            </TableBody>
          </Table>
        ) : (
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Time</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>IP Address</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {filteredAuditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap">
                    {getRelativeTime(log.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-white">{log.admin_email || 'Unknown'}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={ACTION_CONFIG[log.action]?.variant || 'user'}>
                      {ACTION_CONFIG[log.action]?.label || log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-md truncate">
                    {log.details || '—'}
                  </TableCell>
                  <TableCell className="font-mono text-slate-500">{log.ip_address}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )
      ) : filteredSystemLogs.length === 0 ? (
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Level</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Time</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            <TableEmptyState
              icon={<FileText className="w-12 h-12" />}
              title="No system logs found"
            />
          </TableBody>
        </Table>
      ) : (
        <div className="space-y-3">
          {filteredSystemLogs.map((log) => (
            <Card key={log.id}>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Badge variant={LEVEL_CONFIG[log.level]?.variant || 'user'}>
                      {LEVEL_CONFIG[log.level]?.label || log.level.toUpperCase()}
                    </Badge>
                    {log.source && (
                      <span className="text-xs px-2 py-1 bg-slate-900/50 text-slate-400 rounded">
                        {log.source}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500">{getRelativeTime(log.created_at)}</span>
                </div>
                <div className="text-sm text-white font-medium mb-2">{log.message}</div>
                {log.metadata && (
                  <pre className="text-xs bg-slate-900/50 text-slate-400 p-3 rounded overflow-x-auto">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Results Count */}
      {!loading && (
        <div className="mt-4 text-sm text-slate-500 text-center">
          Showing{' '}
          {activeTab === 'audit' ? filteredAuditLogs.length : filteredSystemLogs.length} log
          {(activeTab === 'audit' ? filteredAuditLogs.length : filteredSystemLogs.length) !== 1
            ? 's'
            : ''}
        </div>
      )}
    </div>
  );
}
