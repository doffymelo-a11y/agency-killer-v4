/**
 * ServiceHealthGrid - Display health status of 4 core services
 * Sprint 2.3 - Admin Monitoring Dashboard
 */

import { Server, Network, Database, Brain } from 'lucide-react';
import type { ServiceHealth, ServiceStatus } from '../../types/admin.types';

interface ServiceHealthGridProps {
  health: {
    backend: ServiceHealth;
    mcp_bridge: ServiceHealth;
    supabase: ServiceHealth;
    claude_api: ServiceHealth;
  } | null;
  isLoading?: boolean;
}

const STATUS_CONFIG: Record<ServiceStatus, { color: string; bg: string; label: string }> = {
  healthy: {
    color: 'text-emerald-600',
    bg: 'bg-emerald-500',
    label: 'Healthy',
  },
  degraded: {
    color: 'text-amber-600',
    bg: 'bg-amber-500',
    label: 'Degraded',
  },
  down: {
    color: 'text-red-600',
    bg: 'bg-red-500',
    label: 'Down',
  },
};

const SERVICE_CONFIG = {
  backend: {
    icon: Server,
    name: 'Backend API',
  },
  mcp_bridge: {
    icon: Network,
    name: 'MCP Bridge',
  },
  supabase: {
    icon: Database,
    name: 'Supabase',
  },
  claude_api: {
    icon: Brain,
    name: 'Claude API',
  },
};

function ServiceCard({ service, config }: { service: ServiceHealth; config: typeof SERVICE_CONFIG.backend }) {
  const statusConfig = STATUS_CONFIG[service.status];
  const Icon = config.icon;

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded-lg">
            <Icon className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-900">{config.name}</h4>
            <p className="text-xs text-slate-500">{service.name}</p>
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${statusConfig.bg}`}></div>
          <span className={`text-sm font-medium ${statusConfig.color}`}>
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* Uptime */}
      {service.uptime && (
        <div className="text-sm text-slate-600">
          <span className="text-slate-500">Uptime:</span> {service.uptime}
        </div>
      )}

      {/* Details */}
      {service.details && (
        <div className="mt-2 text-xs text-slate-500">{service.details}</div>
      )}

      {/* Last check */}
      {service.lastCheck && (
        <div className="mt-2 text-xs text-slate-400">
          Last check: {new Date(service.lastCheck).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4">
      <div className="animate-pulse">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-slate-200 rounded-lg"></div>
          <div className="flex-1">
            <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-slate-100 rounded w-1/3"></div>
          </div>
        </div>
        <div className="h-3 bg-slate-100 rounded w-2/3"></div>
      </div>
    </div>
  );
}

export default function ServiceHealthGrid({ health, isLoading }: ServiceHealthGridProps) {
  if (isLoading || !health) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <ServiceCard service={health.backend} config={SERVICE_CONFIG.backend} />
      <ServiceCard service={health.mcp_bridge} config={SERVICE_CONFIG.mcp_bridge} />
      <ServiceCard service={health.supabase} config={SERVICE_CONFIG.supabase} />
      <ServiceCard service={health.claude_api} config={SERVICE_CONFIG.claude_api} />
    </div>
  );
}
