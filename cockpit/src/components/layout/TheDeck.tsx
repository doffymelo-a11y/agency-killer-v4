// ============================================
// THE HIVE OS V4 - The Deck Component
// Panneau droit retractable avec instructions/help agent
// ============================================

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { type AgentRole } from '../../types';
import AgentHelp from '../deck/AgentHelp';

interface TheDeckProps {
  showAgentHelp: AgentRole | null;
  onCloseHelp: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function TheDeck({
  showAgentHelp,
  onCloseHelp,
  isCollapsed,
  onToggleCollapse
}: TheDeckProps) {
  return (
    <div className="relative flex">
      {/* Toggle Button */}
      <button
        onClick={onToggleCollapse}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-6 h-12 bg-white border border-slate-200 rounded-l-lg shadow-sm flex items-center justify-center hover:bg-slate-50 transition-colors"
      >
        {isCollapsed ? (
          <ChevronLeft className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {/* Panel */}
      <motion.div
        initial={false}
        animate={{
          width: isCollapsed ? 0 : 380,
          opacity: isCollapsed ? 0 : 1,
        }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="bg-white border-l border-slate-100 flex flex-col h-full overflow-hidden"
      >
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            showAgentHelp ? (
              <AgentHelp
                key={showAgentHelp}
                agentId={showAgentHelp}
                onClose={onCloseHelp}
              />
            ) : (
              <DefaultDeckContent key="default" />
            )
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ============================================
// Default Deck Content (when no agent help is shown)
// ============================================
function DefaultDeckContent() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center h-full p-6 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <span className="text-2xl">?</span>
      </div>
      <h3 className="font-semibold text-slate-800 mb-2">
        Instructions Agent
      </h3>
      <p className="text-sm text-slate-500 max-w-[280px]">
        Cliquez sur le <span className="font-medium">?</span> a cote d'un avatar pour voir
        les capacites et requetes types de chaque agent.
      </p>
    </motion.div>
  );
}
