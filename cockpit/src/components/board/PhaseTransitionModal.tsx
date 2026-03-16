// ═══════════════════════════════════════════════════════════════
// THE HIVE OS V4 - Phase Transition Modal
// Phase 2.11 - Auto Phase Transition
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { CheckCircle2, ArrowRight, Sparkles, Clock, FileCheck, Calendar, Bot } from 'lucide-react';
import type { PhaseTransitionProposal, TaskPhase } from '../../types';

interface PhaseTransitionModalProps {
  proposal: PhaseTransitionProposal;
  onAccept: () => void;
  onDismiss: () => void;
}

// ─────────────────────────────────────────────────────────────────
// Phase Emojis
// ─────────────────────────────────────────────────────────────────

const PHASE_EMOJIS: Record<TaskPhase, string> = {
  Audit: '🔍',
  Setup: '⚙️',
  Production: '🚀',
  Optimization: '📈',
};

// ─────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────

export default function PhaseTransitionModal({
  proposal,
  onAccept,
  onDismiss,
}: PhaseTransitionModalProps) {
  const { width, height } = useWindowSize();
  const [showConfetti, setShowConfetti] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onDismiss();
        }
      }}
    >
      {/* Confetti Animation */}
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          numberOfPieces={300}
          recycle={false}
          onConfettiComplete={() => setShowConfetti(false)}
          gravity={0.3}
        />
      )}

      {/* Modal Card */}
      <motion.div
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 50 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative max-w-3xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header avec gradient */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-8 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 animate-pulse" />
            <h2 className="text-3xl font-bold">Phase Terminée !</h2>
          </div>
          <p className="text-purple-100 text-lg">
            Félicitations ! Vous avez complété la phase{' '}
            <span className="font-bold text-white">{PHASE_EMOJIS[proposal.currentPhase]} {proposal.currentPhase}</span>
          </p>
        </div>

        {/* Statistiques Grid */}
        <div className="grid grid-cols-4 gap-4 p-6 bg-slate-50">
          <StatCard
            label="Tâches"
            value={proposal.statistics.tasksCompleted}
            icon={CheckCircle2}
          />
          <StatCard
            label="Heures"
            value={proposal.statistics.totalHours}
            icon={Clock}
          />
          <StatCard
            label="Livrables"
            value={proposal.statistics.deliverables}
            icon={FileCheck}
          />
          <StatCard
            label="Jours"
            value={proposal.statistics.phaseDuration}
            icon={Calendar}
          />
        </div>

        {/* Résumé de l'agent */}
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Bot className="w-5 h-5 text-indigo-600" />
            Résumé de la phase
          </h3>
          <p className="text-slate-700 leading-relaxed mb-4">
            {proposal.agentSummary}
          </p>

          {/* Accomplissements clés */}
          {proposal.keyAccomplishments && proposal.keyAccomplishments.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-600 mb-2">
                Accomplissements clés :
              </p>
              {proposal.keyAccomplishments.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-2"
                >
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">{item}</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Preview prochaine phase */}
        <div className="p-6 bg-indigo-50 border-t border-indigo-100">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl">{PHASE_EMOJIS[proposal.nextPhase]}</span>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-indigo-900">
                Prochaine étape : {proposal.nextPhase}
              </h3>
              <p className="text-sm text-indigo-700 mt-1">
                {proposal.nextPhasePreview}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 flex gap-3 justify-end bg-slate-50 border-t">
          <button
            onClick={onDismiss}
            className="px-6 py-3 rounded-lg border border-slate-300 hover:bg-slate-100 transition-colors font-medium text-slate-700"
          >
            Plus tard
          </button>
          <button
            onClick={onAccept}
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
          >
            Lancer la phase {proposal.nextPhase}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Stat Card Component
// ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}

function StatCard({ label, value, icon: Icon }: StatCardProps) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200 }}
      className="bg-white p-4 rounded-lg border border-slate-200 text-center hover:shadow-md transition-shadow"
    >
      <Icon className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-xs text-slate-500 uppercase tracking-wide">{label}</div>
    </motion.div>
  );
}
