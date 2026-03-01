/**
 * Context Builder - Constructs SharedProjectContext
 * Assembles all project information into a structured context for agents
 */

import { supabaseAdmin } from '../services/supabase.service.js';
import type { SharedProjectContext } from '../types/api.types.js';

/**
 * Build shared project context from project_id
 * This context is injected into every agent's system prompt
 */
export async function buildProjectContext(
  projectId: string
): Promise<SharedProjectContext> {
  try {
    // Fetch project from database
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      console.error('[Context Builder] Error fetching project:', projectError);
      throw new Error(`Project ${projectId} not found`);
    }

    // Fetch project metadata (budget, goals, kpis, etc.)
    const { data: metadata } = await supabaseAdmin
      .from('project_metadata')
      .select('*')
      .eq('project_id', projectId)
      .single();

    // Fetch active tasks
    const { data: tasks } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .in('status', ['pending', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(10);

    // Fetch deliverables
    const { data: deliverables } = await supabaseAdmin
      .from('deliverables')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Build context object
    const context: SharedProjectContext = {
      project_id: projectId,
      project_name: project.name,
      project_scope: project.scope || '',
      industry: project.industry || '',
      target_audience: project.target_audience || '',
      brand_voice: metadata?.brand_voice || '',
      budget: metadata?.budget || 0,
      goals: metadata?.goals || [],
      kpis: metadata?.kpis || [],
      timeline: metadata?.timeline || '',
      active_tasks: tasks || [],
      deliverables: deliverables || [],
    };

    return context;
  } catch (error: any) {
    console.error('[Context Builder] Error building context:', error);
    throw error;
  }
}

/**
 * Build minimal context for new projects (used in genesis)
 */
export function buildGenesisContext(
  projectName: string,
  industry: string,
  targetAudience: string,
  projectScope: string
): Partial<SharedProjectContext> {
  return {
    project_name: projectName,
    industry,
    target_audience: targetAudience,
    project_scope: projectScope,
    active_tasks: [],
    deliverables: [],
  };
}
