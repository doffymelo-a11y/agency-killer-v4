// ═══════════════════════════════════════════════════════════════
// Logs View - Super Admin Backoffice
// View system logs and audit trail
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { FileText, Search, RefreshCw, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';
import type { AuditLog, SystemLog } from '../types';

const ACTION_CONFIG: Record<string, { label: string; color: string }> = {
  UPDATE_TICKET: { label: 'Update Ticket', color: 'text-blue-600' },
  ADD_NOTE: { label: 'Add Note', color: 'text-green-600' },
  VIEW_TICKET: { label: 'View Ticket', color: 'text-slate-600' },
  UPDATE_USER_ROLE: { label: 'Update User Role', color: 'text-amber-600' },
  VIEW_LOGS: { label: 'View Logs', color: 'text-slate-600' },
  VIEW_METRICS: { label: 'View Metrics', color: 'text-slate-600' },
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
        // Backend returns { data: { logs: [...], pagination: {...} } }
        setAuditLogs(response.data.logs || []);
      } else {
        setError(response.error?.message || 'Failed to load audit logs');
      }
    } else {
      const response = await api.get<{ logs: SystemLog[] }>('/api/superadmin/logs/system');
      if (response.success && response.data) {
        // Backend returns { data: { logs: [...] } }
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

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-600 bg-red-50';
      case 'warn':
        return 'text-orange-600 bg-orange-50';
      case 'info':
        return 'text-blue-600 bg-blue-50';
      case 'debug':
        return 'text-slate-600 bg-slate-50';
      default:
        return 'text-slate-600 bg-slate-50';
    }
  };

  const uniqueActions = Array.from(new Set(auditLogs.map((log) => log.action)));

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">System Logs</h1>
            <p className="text-slate-600">Monitor system activity and audit trail</p>
          </div>
          <button
            onClick={loadLogs}
            disabled={loading}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'audit'
                ? 'bg-amber-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            Audit Logs
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'system'
                ? 'bg-amber-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            System Logs
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
              placeholder={
                activeTab === 'audit'
                  ? 'Search audit logs by admin, action, or details...'
                  : 'Search system logs by message, level, or source...'
              }
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          {activeTab === 'audit' && (
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">Error Loading Logs</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Logs List */}
      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 text-amber-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading logs...</p>
        </div>
      ) : activeTab === 'audit' ? (
        filteredAuditLogs.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 text-lg">No audit logs found</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    IP Address
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredAuditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                      {getRelativeTime(log.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="font-medium text-slate-900">{log.admin_email || 'Unknown'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-sm font-medium ${
                          ACTION_CONFIG[log.action]?.color || 'text-slate-600'
                        }`}
                      >
                        {ACTION_CONFIG[log.action]?.label || log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-md truncate">
                      {log.details || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-mono">{log.ip_address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : filteredSystemLogs.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 text-lg">No system logs found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredSystemLogs.map((log) => (
            <div
              key={log.id}
              className={`p-4 rounded-lg border ${getLevelColor(log.level)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-semibold uppercase">{log.level}</span>
                    {log.source && (
                      <span className="text-xs px-2 py-0.5 bg-white rounded">{log.source}</span>
                    )}
                    <span className="text-xs opacity-75">{getRelativeTime(log.created_at)}</span>
                  </div>
                  <div className="text-sm font-medium">{log.message}</div>
                  {log.metadata && (
                    <pre className="mt-2 text-xs bg-white p-2 rounded overflow-x-auto">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results Count */}
      {!loading && (
        <div className="mt-4 text-sm text-slate-600 text-center">
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
