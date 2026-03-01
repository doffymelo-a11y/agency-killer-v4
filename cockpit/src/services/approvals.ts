// ═══════════════════════════════════════════════════════════════
// THE HIVE OS V4 - Approval Requests Service
// Handles approval workflow for risky AI agent actions
// ═══════════════════════════════════════════════════════════════

import { supabase } from '../lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

export type AgentId = 'sora' | 'marcus' | 'luna' | 'milo';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface ApprovalRequest {
  id: string;
  user_id: string;
  project_id?: string;
  agent_id: AgentId;
  action: string;
  title: string;
  description?: string;
  risk_level: RiskLevel;
  estimated_cost_7_days?: number;
  currency?: string;
  status: ApprovalStatus;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  expires_at: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateApprovalRequestParams {
  user_id: string;
  project_id?: string;
  agent_id: AgentId;
  action: string;
  title: string;
  description?: string;
  risk_level: RiskLevel;
  estimated_cost_7_days?: number;
  currency?: string;
  expires_in_hours?: number; // Default: 24h
  metadata?: Record<string, any>;
}

// ─────────────────────────────────────────────────────────────────
// Create Approval Request
// ─────────────────────────────────────────────────────────────────

export async function createApprovalRequest(
  params: CreateApprovalRequestParams,
  client: SupabaseClient = supabase
): Promise<{ success: boolean; approval?: ApprovalRequest; error?: string }> {
  try {
    // Calculate expiration (default 24 hours)
    const expiresInHours = params.expires_in_hours || 24;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    const { data, error } = await client
      .from('approval_requests')
      .insert({
        user_id: params.user_id,
        project_id: params.project_id,
        agent_id: params.agent_id,
        action: params.action,
        title: params.title,
        description: params.description,
        risk_level: params.risk_level,
        estimated_cost_7_days: params.estimated_cost_7_days,
        currency: params.currency || 'USD',
        expires_at: expiresAt.toISOString(),
        metadata: params.metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error('[Approval Service] Create error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, approval: data };
  } catch (err) {
    console.error('[Approval Service] Create exception:', err);
    return { success: false, error: 'Failed to create approval request' };
  }
}

// ─────────────────────────────────────────────────────────────────
// Get Approval Request by ID
// ─────────────────────────────────────────────────────────────────

export async function getApprovalRequest(
  approvalId: string,
  client: SupabaseClient = supabase
): Promise<{ success: boolean; approval?: ApprovalRequest; error?: string }> {
  try {
    const { data, error } = await client
      .from('approval_requests')
      .select('*')
      .eq('id', approvalId)
      .single();

    if (error) {
      console.error('[Approval Service] Get error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, approval: data };
  } catch (err) {
    console.error('[Approval Service] Get exception:', err);
    return { success: false, error: 'Failed to fetch approval request' };
  }
}

// ─────────────────────────────────────────────────────────────────
// List Approval Requests (with filters)
// ─────────────────────────────────────────────────────────────────

export async function listApprovalRequests(
  userId: string,
  filters?: {
    status?: ApprovalStatus;
    project_id?: string;
    agent_id?: AgentId;
  },
  client: SupabaseClient = supabase
): Promise<{ success: boolean; approvals?: ApprovalRequest[]; error?: string }> {
  try {
    let query = client
      .from('approval_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.project_id) {
      query = query.eq('project_id', filters.project_id);
    }
    if (filters?.agent_id) {
      query = query.eq('agent_id', filters.agent_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Approval Service] List error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, approvals: data };
  } catch (err) {
    console.error('[Approval Service] List exception:', err);
    return { success: false, error: 'Failed to fetch approval requests' };
  }
}

// ─────────────────────────────────────────────────────────────────
// Approve Request (via RPC for security)
// ─────────────────────────────────────────────────────────────────

export async function approveRequest(
  approvalId: string,
  userId: string,
  client: SupabaseClient = supabase
): Promise<{ success: boolean; message?: string }> {
  try {
    const { data, error } = await client.rpc('approve_approval_request', {
      p_approval_id: approvalId,
      p_user_id: userId,
    });

    if (error) {
      console.error('[Approval Service] Approve RPC error:', error);
      return { success: false, message: error.message };
    }

    // RPC returns array of { success, message }
    const result = data[0];
    return {
      success: result.success,
      message: result.message,
    };
  } catch (err) {
    console.error('[Approval Service] Approve exception:', err);
    return { success: false, message: 'Failed to approve request' };
  }
}

// ─────────────────────────────────────────────────────────────────
// Reject Request (via RPC for security)
// ─────────────────────────────────────────────────────────────────

export async function rejectRequest(
  approvalId: string,
  userId: string,
  reason?: string,
  client: SupabaseClient = supabase
): Promise<{ success: boolean; message?: string }> {
  try {
    const { data, error } = await client.rpc('reject_approval_request', {
      p_approval_id: approvalId,
      p_user_id: userId,
      p_reason: reason || null,
    });

    if (error) {
      console.error('[Approval Service] Reject RPC error:', error);
      return { success: false, message: error.message };
    }

    // RPC returns array of { success, message }
    const result = data[0];
    return {
      success: result.success,
      message: result.message,
    };
  } catch (err) {
    console.error('[Approval Service] Reject exception:', err);
    return { success: false, message: 'Failed to reject request' };
  }
}

// ─────────────────────────────────────────────────────────────────
// Count Pending Approvals (for badge notifications)
// ─────────────────────────────────────────────────────────────────

export async function countPendingApprovals(
  userId: string,
  client: SupabaseClient = supabase
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const { count, error } = await client
      .from('approval_requests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString());

    if (error) {
      console.error('[Approval Service] Count error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, count: count || 0 };
  } catch (err) {
    console.error('[Approval Service] Count exception:', err);
    return { success: false, error: 'Failed to count pending approvals' };
  }
}

// ─────────────────────────────────────────────────────────────────
// Subscribe to Approval Requests (Realtime)
// ─────────────────────────────────────────────────────────────────

export function subscribeToApprovalRequests(
  userId: string,
  onApprovalCreated: (approval: ApprovalRequest) => void,
  onApprovalUpdated: (approval: ApprovalRequest) => void,
  client: SupabaseClient = supabase
) {
  const channel = client
    .channel('approval_requests_changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'approval_requests',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        console.log('[Approval Realtime] New approval:', payload.new);
        onApprovalCreated(payload.new as ApprovalRequest);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'approval_requests',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        console.log('[Approval Realtime] Updated approval:', payload.new);
        onApprovalUpdated(payload.new as ApprovalRequest);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
