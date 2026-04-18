/**
 * MCPServerGrid - Display status of 14 MCP servers
 * Sprint 2.4 - Admin Monitoring Dashboard
 */

import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import type { MCPServerStatus } from '../../types/admin.types';

interface MCPServerGridProps {
  servers: MCPServerStatus[];
  isLoading?: boolean;
}

const SERVER_AGENTS: Record<string, 'luna' | 'sora' | 'marcus' | 'milo' | 'doffy' | 'ALL'> = {
  'web-intelligence': 'ALL',
  'cms-connector': 'luna',
  'seo-audit': 'luna',
  'keyword-research': 'luna',
  'google-ads': 'sora',
  'meta-ads': 'sora',
  'google-ads-launcher': 'marcus',
  'budget-optimizer': 'marcus',
  'gtm': 'sora',
  'looker': 'sora',
  'elevenlabs': 'milo',
  'nano-banana-pro': 'milo',
  'veo3': 'milo',
  'social-media': 'doffy',
};

const AGENT_CONFIG: Record<string, { name: string; color: string; bg: string }> = {
  luna: { name: 'Luna', color: 'text-purple-700', bg: 'bg-purple-100' },
  sora: { name: 'Sora', color: 'text-blue-700', bg: 'bg-blue-100' },
  marcus: { name: 'Marcus', color: 'text-green-700', bg: 'bg-green-100' },
  milo: { name: 'Milo', color: 'text-orange-700', bg: 'bg-orange-100' },
  doffy: { name: 'Doffy', color: 'text-pink-700', bg: 'bg-pink-100' },
  ALL: { name: 'All Agents', color: 'text-slate-700', bg: 'bg-slate-100' },
};

function ServerCard({ server }: { server: MCPServerStatus }) {
  const agentConfig = AGENT_CONFIG[server.primary_agent || 'ALL'];
  // Support both 'healthy'/'active' for healthy status
  const isHealthy = server.status === 'healthy' || server.status === 'active';
  const displayName = server.displayName || server.name;

  return (
    <div className={`bg-white rounded-lg border ${
      isHealthy ? 'border-slate-200' : 'border-red-200'
    } p-3 hover:shadow-sm transition-shadow`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h5 className="font-semibold text-sm text-slate-900 truncate">
            {displayName}
          </h5>
        </div>
        <div className="flex-shrink-0 ml-2">
          {isHealthy ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          ) : (
            <XCircle className="w-4 h-4 text-red-500" />
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-600">
          {server.tools_count ? `${server.tools_count} tool${server.tools_count !== 1 ? 's' : ''}` : 'Server'}
        </span>
        <span className={`px-2 py-0.5 rounded-full font-medium ${agentConfig.bg} ${agentConfig.color}`}>
          {agentConfig.name}
        </span>
      </div>

      {server.last_call && (
        <div className="mt-1 text-xs text-slate-400">
          Last: {new Date(server.last_call).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3">
      <div className="animate-pulse">
        <div className="flex items-center justify-between mb-2">
          <div className="h-4 bg-slate-200 rounded w-2/3"></div>
          <div className="w-4 h-4 bg-slate-200 rounded-full"></div>
        </div>
        <div className="h-3 bg-slate-100 rounded w-1/2"></div>
      </div>
    </div>
  );
}

export default function MCPServerGrid({ servers, isLoading }: MCPServerGridProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">MCP Servers</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {Array.from({ length: 14 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  const healthyCount = servers.filter((s) => s.status === 'healthy' || s.status === 'active').length;
  const totalCount = servers.length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">MCP Servers</h3>
        <div className="text-sm">
          <span className="font-semibold text-emerald-600">{healthyCount}</span>
          <span className="text-slate-500"> / {totalCount} healthy</span>
        </div>
      </div>

      {servers.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
          <p>Loading MCP servers...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {servers.map((server) => (
            <ServerCard key={server.name} server={server} />
          ))}
        </div>
      )}
    </div>
  );
}
