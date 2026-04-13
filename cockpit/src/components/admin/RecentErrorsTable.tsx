/**
 * RecentErrorsTable - Display 20 most recent errors from system_logs
 * Sprint 2.5 - Admin Monitoring Dashboard
 */

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ChevronDown, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';
import type { SystemLog } from '../../services/admin.service';

interface RecentErrorsTableProps {
  errors: SystemLog[];
  isLoading?: boolean;
  isLive?: boolean;
}

const SOURCE_COLORS: Record<string, string> = {
  'agent-executor': 'bg-purple-100 text-purple-700',
  'mcp-bridge': 'bg-blue-100 text-blue-700',
  'backend': 'bg-green-100 text-green-700',
  'orchestrator': 'bg-orange-100 text-orange-700',
  'mcp-server': 'bg-pink-100 text-pink-700',
};

const AGENT_COLORS: Record<string, string> = {
  luna: 'bg-purple-100 text-purple-700',
  sora: 'bg-blue-100 text-blue-700',
  marcus: 'bg-green-100 text-green-700',
  milo: 'bg-orange-100 text-orange-700',
  doffy: 'bg-pink-100 text-pink-700',
};

function ErrorRow({ error }: { error: SystemLog }) {
  const [expanded, setExpanded] = useState(false);
  const sourceColor = SOURCE_COLORS[error.source] || 'bg-slate-100 text-slate-700';
  const agentColor = error.agent_id ? AGENT_COLORS[error.agent_id] : '';

  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <div
        className="p-4 hover:bg-slate-50 cursor-pointer transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3">
          {/* Expand icon */}
          <button className="flex-shrink-0 mt-1 text-slate-400">
            {expanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          {/* Timestamp */}
          <div className="flex-shrink-0 min-w-[100px] text-xs text-slate-500">
            {formatDistanceToNow(new Date(error.created_at), { addSuffix: true })}
          </div>

          {/* Source badge */}
          <div className="flex-shrink-0">
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${sourceColor}`}>
              {error.source}
            </span>
          </div>

          {/* Agent badge */}
          {error.agent_id && (
            <div className="flex-shrink-0">
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${agentColor}`}>
                {error.agent_id}
              </span>
            </div>
          )}

          {/* Message */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-900 truncate">{error.message}</p>
            <p className="text-xs text-slate-500 mt-0.5">{error.action}</p>
          </div>

          {/* Error icon */}
          <div className="flex-shrink-0">
            <XCircle className="w-4 h-4 text-red-500" />
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 bg-slate-50 border-t border-slate-100">
          <div className="mt-3 space-y-2">
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-1">Full Message:</p>
              <p className="text-sm text-slate-900">{error.message}</p>
            </div>

            {error.metadata && Object.keys(error.metadata).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-1">Metadata:</p>
                <pre className="text-xs text-slate-700 bg-white p-2 rounded border border-slate-200 overflow-x-auto">
                  {JSON.stringify(error.metadata, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex gap-4 text-xs text-slate-500">
              {error.user_id && <span>User: {error.user_id.slice(0, 8)}...</span>}
              {error.project_id && <span>Project: {error.project_id.slice(0, 8)}...</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RecentErrorsTable({ errors, isLoading, isLive }: RecentErrorsTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Errors</h3>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-slate-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Recent Errors</h3>
        <div className="flex items-center gap-3">
          {isLive && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              LIVE
            </span>
          )}
          <span className="text-sm text-slate-500">{errors.length} error{errors.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {errors.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">Aucune erreur récente</p>
          <p className="text-sm text-slate-500 mt-1">Le système fonctionne normalement</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {errors.map((error) => (
            <ErrorRow key={error.id} error={error} />
          ))}
        </div>
      )}
    </div>
  );
}
