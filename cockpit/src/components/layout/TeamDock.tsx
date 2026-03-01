// ============================================
// THE HIVE OS V4 - Team Dock Component
// Barre laterale gauche avec les agents
// ============================================

import { motion } from 'framer-motion';
import { HelpCircle } from 'lucide-react';
import { AGENTS, type AgentRole } from '../../types';

interface TeamDockProps {
  activeAgent: AgentRole;
  onAgentSelect: (agent: AgentRole) => void;
  onAgentHelpClick: (agent: AgentRole) => void;
}

// Agent order in dock (excluding orchestrator)
const AGENT_ORDER: AgentRole[] = ['sora', 'luna', 'marcus', 'milo'];

export default function TeamDock({
  activeAgent,
  onAgentSelect,
  onAgentHelpClick,
}: TeamDockProps) {
  return (
    <div className="w-20 bg-slate-900 flex flex-col items-center py-6">
      {/* Logo */}
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg mb-8">
        <span className="text-white font-bold text-xl">H</span>
      </div>

      {/* Agents */}
      <div className="flex-1 flex flex-col items-center gap-3">
        {AGENT_ORDER.map((agentId) => {
          const agent = AGENTS[agentId];
          const isActive = activeAgent === agentId;

          return (
            <div key={agentId} className="relative group">
              {/* Agent Avatar Button */}
              <motion.button
                onClick={() => onAgentSelect(agentId)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`relative w-12 h-12 rounded-xl overflow-hidden transition-all duration-200 ${
                  isActive
                    ? 'ring-2 ring-offset-2 ring-offset-slate-900 shadow-lg'
                    : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  ringColor: isActive ? agent.color.primary : undefined,
                  boxShadow: isActive ? `0 0 20px ${agent.color.glow}` : undefined,
                }}
              >
                <img
                  src={agent.avatar}
                  alt={agent.name}
                  className="w-full h-full object-cover"
                />

                {/* Active Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute inset-0 rounded-xl"
                    style={{ boxShadow: `inset 0 0 0 2px ${agent.color.primary}` }}
                  />
                )}
              </motion.button>

              {/* Help Button (on hover) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAgentHelpClick(agentId);
                }}
                className="absolute -right-1 -top-1 w-5 h-5 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-600"
              >
                <HelpCircle className="w-3 h-3" />
              </button>

              {/* Tooltip */}
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                <div
                  className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shadow-lg"
                  style={{
                    backgroundColor: agent.color.primary,
                    color: 'white',
                  }}
                >
                  {agent.name} - {agent.role}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Section */}
      <div className="mt-auto">
        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-slate-700 transition-colors cursor-pointer">
          <span className="text-sm font-medium">?</span>
        </div>
      </div>
    </div>
  );
}
