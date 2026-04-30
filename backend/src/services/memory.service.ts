/**
 * Memory Service - Project memory read/write operations
 * Manages collective memory in project_memory table
 */

import { supabaseAdmin } from './supabase.service.js';
import type {
  ProjectMemoryEntry,
  MemoryContribution,
  AgentId,
  Recommendation,
} from '../types/api.types.js';

// ─────────────────────────────────────────────────────────────────
// Read Operations
// ─────────────────────────────────────────────────────────────────

/**
 * Get recent memory entries for a project
 * Returns last N entries, newest first
 */
export async function getRecentMemory(
  projectId: string,
  limit: number = 20
): Promise<ProjectMemoryEntry[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('project_memory')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Memory Service] Error fetching memory:', error);
      return [];
    }

    return data || [];
  } catch (error: unknown) {
    console.error('[Memory Service] Exception fetching memory:', error);
    return [];
  }
}

/**
 * Get memory entries filtered by agent
 */
export async function getMemoryByAgent(
  projectId: string,
  agentId: AgentId,
  limit: number = 10
): Promise<ProjectMemoryEntry[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('project_memory')
      .select('*')
      .eq('project_id', projectId)
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Memory Service] Error fetching agent memory:', error);
      return [];
    }

    return data || [];
  } catch (error: unknown) {
    console.error('[Memory Service] Exception fetching agent memory:', error);
    return [];
  }
}

/**
 * Get recommendations for a specific agent
 * Looks through memory for recommendations targeted at this agent
 */
export async function getRecommendationsForAgent(
  projectId: string,
  targetAgent: AgentId,
  limit: number = 10
): Promise<Recommendation[]> {
  try {
    const memory = await getRecentMemory(projectId, 50); // Check last 50 entries

    const recommendations: Recommendation[] = [];

    for (const entry of memory) {
      if (entry.recommendations && Array.isArray(entry.recommendations)) {
        const relevantRecs = entry.recommendations.filter(
          (rec: any) => rec.for_agent === targetAgent
        );
        recommendations.push(...relevantRecs);
      }

      if (recommendations.length >= limit) {
        break;
      }
    }

    return recommendations.slice(0, limit);
  } catch (error: unknown) {
    console.error('[Memory Service] Error fetching recommendations:', error);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────
// Write Operations
// ─────────────────────────────────────────────────────────────────

/**
 * Add a memory contribution to project_memory
 */
export async function writeMemory(
  projectId: string,
  agentId: AgentId,
  contribution: MemoryContribution
): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin.from('project_memory').insert({
      project_id: projectId,
      agent_id: agentId,
      action: contribution.action,
      summary: contribution.summary,
      key_findings: contribution.key_findings || [],
      deliverables: contribution.deliverables || [],
      recommendations: contribution.recommendations || [],
    });

    if (error) {
      console.error('[Memory Service] Error writing memory:', error);
      return false;
    }

    return true;
  } catch (error: unknown) {
    console.error('[Memory Service] Exception writing memory:', error);
    return false;
  }
}

/**
 * Delete old memory entries (for cleanup)
 * Keeps only the most recent N entries per project
 */
export async function cleanupOldMemory(
  projectId: string,
  keepCount: number = 100
): Promise<number> {
  try {
    // Get IDs of entries to keep (most recent N)
    const { data: toKeep, error: fetchError } = await supabaseAdmin
      .from('project_memory')
      .select('id')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(keepCount);

    if (fetchError || !toKeep) {
      console.error('[Memory Service] Error fetching entries to keep:', fetchError);
      return 0;
    }

    const keepIds = toKeep.map((entry) => entry.id);

    // Delete entries NOT in the keep list
    const { error: deleteError, count } = await supabaseAdmin
      .from('project_memory')
      .delete({ count: 'exact' })
      .eq('project_id', projectId)
      .not('id', 'in', `(${keepIds.join(',')})`);

    if (deleteError) {
      console.error('[Memory Service] Error deleting old memory:', deleteError);
      return 0;
    }

    return count || 0;
  } catch (error: unknown) {
    console.error('[Memory Service] Exception cleaning up memory:', error);
    return 0;
  }
}

// ─────────────────────────────────────────────────────────────────
// Search Operations
// ─────────────────────────────────────────────────────────────────

/**
 * Search memory entries by keyword (in summary or key_findings)
 */
export async function searchMemory(
  projectId: string,
  keyword: string,
  limit: number = 10
): Promise<ProjectMemoryEntry[]> {
  try {
    const memory = await getRecentMemory(projectId, 100);

    const lowerKeyword = keyword.toLowerCase();

    const matches = memory.filter((entry) => {
      const summaryMatch = entry.summary.toLowerCase().includes(lowerKeyword);
      const findingsMatch =
        entry.key_findings?.some((finding) => finding.toLowerCase().includes(lowerKeyword)) ||
        false;

      return summaryMatch || findingsMatch;
    });

    return matches.slice(0, limit);
  } catch (error: unknown) {
    console.error('[Memory Service] Error searching memory:', error);
    return [];
  }
}
