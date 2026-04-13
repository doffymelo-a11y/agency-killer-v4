/**
 * LogsViewer - Display and filter system logs
 * Sprint 2.2 - Admin Dashboard UI Components
 */

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Info,
  AlertTriangle,
  XCircle,
  Bug,
  Filter,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import type { SystemLog } from '../../services/admin.service';

interface LogsViewerProps {
  logs: SystemLog[];
  isLoading?: boolean;
  onFilterChange?: (filters: LogFilters) => void;
}

export interface LogFilters {
  level?: 'info' | 'warn' | 'error' | 'debug';
  source?: string;
  agent_id?: string;
}

const LOG_LEVEL_CONFIG = {
  info: {
    icon: Info,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  warn: {
    icon: AlertTriangle,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
  },
  error: {
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
  },
  debug: {
    icon: Bug,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
  },
};

function LogRow({ log }: { log: SystemLog }) {
  const [expanded, setExpanded] = useState(false);
  const config = LOG_LEVEL_CONFIG[log.level];
  const Icon = config.icon;

  return (
    <div className={`border-l-4 ${config.border} bg-white p-4 rounded-r-lg hover:shadow-sm transition-shadow`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 ${config.bg} p-2 rounded-lg`}>
          <Icon className={`w-4 h-4 ${config.color}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-bold uppercase ${config.color}`}>
                  {log.level}
                </span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs font-medium text-slate-700">{log.source}</span>
                {log.agent_id && (
                  <>
                    <span className="text-xs text-slate-500">•</span>
                    <span className="text-xs text-purple-600 font-medium">{log.agent_id}</span>
                  </>
                )}
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs text-slate-500">{log.action}</span>
              </div>
              <p className="text-sm text-slate-900 mt-1 font-medium">{log.message}</p>
              <p className="text-xs text-slate-500 mt-1">
                {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
              </p>
            </div>

            {/* Expand button */}
            {log.metadata && Object.keys(log.metadata).length > 0 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={expanded ? 'Collapse details' : 'Expand details'}
              >
                {expanded ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
              </button>
            )}
          </div>

          {/* Metadata */}
          {expanded && log.metadata && (
            <div className="mt-3 bg-slate-50 rounded-lg p-3 border border-slate-200">
              <p className="text-xs font-semibold text-slate-600 mb-2">Metadata:</p>
              <pre className="text-xs text-slate-700 overflow-x-auto whitespace-pre-wrap font-mono">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LogsViewer({ logs, isLoading, onFilterChange }: LogsViewerProps) {
  const [filters, setFilters] = useState<LogFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  const handleFilterChange = (key: keyof LogFilters, value: string) => {
    const newFilters = {
      ...filters,
      [key]: value === 'all' ? undefined : value,
    };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-slate-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header with filters */}
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">System Logs</h3>
            <p className="text-sm text-slate-500 mt-1">{logs.length} entries</p>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filters
            {showFilters ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Filter dropdowns */}
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Level filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Level
              </label>
              <select
                value={filters.level || 'all'}
                onChange={(e) => handleFilterChange('level', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All levels</option>
                <option value="info">Info</option>
                <option value="warn">Warning</option>
                <option value="error">Error</option>
                <option value="debug">Debug</option>
              </select>
            </div>

            {/* Source filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Source
              </label>
              <select
                value={filters.source || 'all'}
                onChange={(e) => handleFilterChange('source', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All sources</option>
                <option value="agent-executor">Agent Executor</option>
                <option value="mcp-bridge">MCP Bridge</option>
                <option value="backend">Backend</option>
                <option value="orchestrator">Orchestrator</option>
              </select>
            </div>

            {/* Agent filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Agent
              </label>
              <select
                value={filters.agent_id || 'all'}
                onChange={(e) => handleFilterChange('agent_id', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All agents</option>
                <option value="luna">Luna</option>
                <option value="sora">Sora</option>
                <option value="marcus">Marcus</option>
                <option value="milo">Milo</option>
                <option value="doffy">Doffy</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Logs list */}
      <div className="p-6 space-y-3 max-h-[600px] overflow-y-auto">
        {logs.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p>No logs found</p>
          </div>
        ) : (
          logs.map((log) => <LogRow key={log.id} log={log} />)
        )}
      </div>
    </div>
  );
}
