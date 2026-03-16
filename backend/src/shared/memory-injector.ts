/**
 * Memory Injector - Injects collective memory into agent context
 * Reads project_memory and formats it for agent system prompts
 */

import { getRecentMemory, getRecommendationsForAgent } from '../services/memory.service.js';
import type { AgentId, ProjectMemoryEntry, Recommendation } from '../types/api.types.js';

/**
 * Build memory context string for system prompt injection
 * Format: chronological list of recent actions + recommendations for this agent
 */
export async function buildMemoryContext(
  projectId: string,
  targetAgent: AgentId,
  limit: number = 20
): Promise<string> {
  try {
    // Get recent memory entries
    const recentMemory = await getRecentMemory(projectId, limit);

    // Get recommendations targeted at this agent
    const recommendations = await getRecommendationsForAgent(projectId, targetAgent, 5);

    // Build formatted context
    let context = '';

    // Section 1: Recent actions (chronological)
    if (recentMemory.length > 0) {
      context += '**Actions récentes des agents :**\n\n';

      recentMemory.reverse().forEach((entry: ProjectMemoryEntry) => {
        const timestamp = new Date(entry.created_at).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'short',
        });

        context += `- [${timestamp}] **${getAgentName(entry.agent_id)}** : ${entry.summary}\n`;

        // Add key findings if present
        if (entry.key_findings && entry.key_findings.length > 0) {
          entry.key_findings.forEach((finding) => {
            context += `  → ${finding}\n`;
          });
        }
      });

      context += '\n';
    }

    // Section 2: Recommendations for this agent
    if (recommendations.length > 0) {
      context += `**Recommandations pour toi (${getAgentName(targetAgent)}) :**\n\n`;

      recommendations.forEach((rec: Recommendation) => {
        const fromAgent = rec.from_agent ? getAgentName(rec.from_agent) : 'Agent';
        context += `- **De ${fromAgent}** : ${rec.message}\n`;
        if (rec.priority) {
          context += `  Priorité : ${rec.priority}\n`;
        }
      });

      context += '\n';
    }

    // If no memory, return a placeholder
    if (!context) {
      context = '**Mémoire collective :** Aucune action récente. C\'est le début du projet.\n';
    }

    return context;
  } catch (error: any) {
    console.error('[Memory Injector] Error building memory context:', error);
    return '**Mémoire collective :** Erreur de lecture de la mémoire.\n';
  }
}

/**
 * Get friendly agent name from agent_id
 */
function getAgentName(agentId: AgentId): string {
  const names: Record<AgentId, string> = {
    luna: 'Luna (SEO)',
    sora: 'Sora (Analytics)',
    marcus: 'Marcus (Ads)',
    milo: 'Milo (Créatif)',
    doffy: 'Doffy (Social Media)',
  };

  return names[agentId] || agentId;
}

/**
 * Extract memory contribution from agent response
 * This will be written to project_memory after each agent execution
 */
export function extractMemoryContribution(
  agentResponse: any,
  _agentId: AgentId
): { action: string; summary: string; key_findings: string[]; deliverables: string[]; recommendations: Recommendation[] } | null {
  // Check if agent provided a memory_contribution
  if (!agentResponse.memory_contribution) {
    return null;
  }

  const mc = agentResponse.memory_contribution;

  return {
    action: mc.action || 'unknown',
    summary: mc.summary || '',
    key_findings: mc.key_findings || [],
    deliverables: mc.deliverables || [],
    recommendations: mc.recommendations || [],
  };
}
