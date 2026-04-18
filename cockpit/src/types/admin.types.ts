/**
 * Admin Types - Types for admin dashboard
 * Sprint 2.1 - Admin Monitoring Dashboard
 */

// ─────────────────────────────────────────────────────────────────
// System Health Types
// ─────────────────────────────────────────────────────────────────

export type ServiceStatus = 'healthy' | 'degraded' | 'down';

export interface ServiceHealth {
  name: string;
  status: ServiceStatus;
  uptime?: string; // e.g., "23h 45min"
  lastCheck?: string; // ISO timestamp
  details?: string;
}

export interface MCPBridgeHealth extends ServiceHealth {
  servers?: MCPServerStatus[];
}

export interface SystemHealth {
  backend: ServiceHealth;
  mcp_bridge: MCPBridgeHealth;
  supabase: ServiceHealth;
  claude_api: ServiceHealth;
  timestamp: string;
}

export interface MCPServerStatus {
  name: string;
  displayName?: string;
  status: 'active' | 'inactive' | 'error' | 'healthy';
  tools_count?: number;
  primary_agent?: 'luna' | 'sora' | 'marcus' | 'milo' | 'doffy' | 'ALL';
  last_call?: string; // ISO timestamp
  path?: string;
}

// ─────────────────────────────────────────────────────────────────
// Agent Activity Types
// ─────────────────────────────────────────────────────────────────

export interface AgentActivity {
  id: string;
  agent_id: 'luna' | 'sora' | 'marcus' | 'milo' | 'doffy';
  action_type: string;
  summary: string;
  deliverables?: any[];
  recommendations?: any[];
  created_at: string;
}

export interface AgentCostData {
  date: string;
  luna: number;
  sora: number;
  marcus: number;
  milo: number;
  doffy: number;
}

// ─────────────────────────────────────────────────────────────────
// Business Stats Types (augment existing)
// ─────────────────────────────────────────────────────────────────

export interface ProjectBreakdown {
  scope: string;
  count: number;
  percentage: number;
}

export interface TasksByAgent {
  agent: string;
  total: number;
  completed: number;
  completion_rate: number;
}

export interface CSATTrend {
  date: string;
  rating: number;
  responses_count: number;
}

// ─────────────────────────────────────────────────────────────────
// Top Metrics with Trends
// ─────────────────────────────────────────────────────────────────

export interface MetricWithTrend {
  label: string;
  value: number | string;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
    previous_value: number;
  };
}
