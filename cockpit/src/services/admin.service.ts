/**
 * Admin Service - API calls for admin dashboard
 * Sprint 2.1 - Admin Monitoring Dashboard
 */

import axios, { AxiosError } from 'axios';
import { supabase } from '../lib/supabase';

// Backend API URL
const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3457';

// Admin API Endpoints
const ENDPOINTS = {
  agentStats: `${BACKEND_API_URL}/api/admin/stats/agents`,
  businessStats: `${BACKEND_API_URL}/api/admin/stats/business`,
  recentLogs: `${BACKEND_API_URL}/api/admin/logs/recent`,
  errorCount: `${BACKEND_API_URL}/api/admin/logs/error-count`,
};

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

export interface AgentStats {
  agent_id: string;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  avg_duration_ms: number;
  total_cost_credits: number;
  last_execution_at: string;
}

export interface BusinessStats {
  users_total: number;
  users_active_7d: number;
  users_active_30d: number;
  projects_total: number;
  projects_active: number;
  projects_by_scope: Array<{ scope: string; count: number }>;
  tasks_total: number;
  tasks_completed: number;
  tasks_completion_rate: number;
  tasks_by_agent: Array<{ agent: string; total: number; completed: number }>;
  agent_actions_30d: number;
  avg_csat: number | null;
}

export interface SystemLog {
  id: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  source: string;
  agent_id: string | null;
  user_id: string | null;
  project_id: string | null;
  action: string;
  message: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ErrorCountResult {
  error_count: number;
  hours_back: number;
}

// ─────────────────────────────────────────────────────────────────
// Helper: Get auth token
// ─────────────────────────────────────────────────────────────────

async function getAuthToken(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session) {
    throw new Error('Not authenticated');
  }

  return data.session.access_token;
}

// ─────────────────────────────────────────────────────────────────
// API Functions
// ─────────────────────────────────────────────────────────────────

/**
 * Get agent performance statistics
 */
export async function getAgentStats(daysBack: number = 30): Promise<AgentStats[]> {
  try {
    const token = await getAuthToken();

    const response = await axios.get(ENDPOINTS.agentStats, {
      params: { days_back: daysBack },
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Failed to fetch agent stats');
    }

    return response.data.data;
  } catch (error) {
    console.error('[Admin Service] Error fetching agent stats:', error);
    if (axios.isAxiosError(error) && error.response?.status === 403) {
      throw new Error('Admin access required');
    }
    throw error;
  }
}

/**
 * Get business metrics
 */
export async function getBusinessStats(daysBack: number = 30): Promise<BusinessStats> {
  try {
    const token = await getAuthToken();

    const response = await axios.get(ENDPOINTS.businessStats, {
      params: { days_back: daysBack },
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Failed to fetch business stats');
    }

    return response.data.data;
  } catch (error) {
    console.error('[Admin Service] Error fetching business stats:', error);
    if (axios.isAxiosError(error) && error.response?.status === 403) {
      throw new Error('Admin access required');
    }
    throw error;
  }
}

/**
 * Get recent system logs
 */
export async function getRecentLogs(params: {
  limit?: number;
  level?: 'info' | 'warn' | 'error' | 'debug';
  source?: string;
  agent_id?: string;
}): Promise<SystemLog[]> {
  try {
    const token = await getAuthToken();

    const response = await axios.get(ENDPOINTS.recentLogs, {
      params: {
        limit: params.limit || 50,
        level: params.level,
        source: params.source,
        agent_id: params.agent_id,
      },
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Failed to fetch recent logs');
    }

    return response.data.data;
  } catch (error) {
    console.error('[Admin Service] Error fetching recent logs:', error);
    if (axios.isAxiosError(error) && error.response?.status === 403) {
      throw new Error('Admin access required');
    }
    throw error;
  }
}

/**
 * Get error count in last X hours
 */
export async function getErrorCount(hoursBack: number = 1): Promise<ErrorCountResult> {
  try {
    const token = await getAuthToken();

    const response = await axios.get(ENDPOINTS.errorCount, {
      params: { hours_back: hoursBack },
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Failed to fetch error count');
    }

    return response.data.data;
  } catch (error) {
    console.error('[Admin Service] Error fetching error count:', error);
    if (axios.isAxiosError(error) && error.response?.status === 403) {
      throw new Error('Admin access required');
    }
    throw error;
  }
}

/**
 * Check if current user is admin
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return false;
    }

    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    return userRole && ['admin', 'super_admin'].includes(userRole.role);
  } catch (error) {
    console.error('[Admin Service] Error checking admin status:', error);
    return false;
  }
}
