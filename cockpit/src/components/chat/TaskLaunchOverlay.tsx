// ═══════════════════════════════════════════════════════════════
// THE HIVE OS V4 - Task Launch Overlay
// Centered overlay shown while a task launch round-trips to the backend.
// Stays visible at least 2s (handled by the caller in BoardView).
// Inspired by Anthropic's frontend-design skill: distinctive POV,
// generous spacing, subtle motion, prefers-reduced-motion respected.
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { AGENTS, type AgentRole } from '../../types';

interface TaskLaunchOverlayProps {
  agentId: AgentRole;
  taskTitle: string;
  startedAt: number;
}

const PHASES: { thresholdMs: number; verb: string }[] = [
  { thresholdMs: 0, verb: 'prépare votre session' },
  { thresholdMs: 2000, verb: 'analyse le contexte du projet' },
  { thresholdMs: 5000, verb: 'interroge ses outils' },
  { thresholdMs: 10000, verb: 'finalise la réponse' },
];

function pickPhaseVerb(elapsedMs: number): string {
  let verb = PHASES[0].verb;
  for (const phase of PHASES) {
    if (elapsedMs >= phase.thresholdMs) verb = phase.verb;
  }
  return verb;
}

export default function TaskLaunchOverlay({
  agentId,
  taskTitle,
  startedAt,
}: TaskLaunchOverlayProps) {
  const agent = AGENTS[agentId];
  const reduceMotion = useReducedMotion();
  const [elapsedMs, setElapsedMs] = useState(() => Date.now() - startedAt);

  useEffect(() => {
    const id = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, 500);
    return () => window.clearInterval(id);
  }, [startedAt]);

  const verb = pickPhaseVerb(elapsedMs);

  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.18 }}
      className="absolute inset-0 z-40 flex items-center justify-center pointer-events-auto"
    >
      {/* Backdrop blur layer */}
      <div className="absolute inset-0 bg-white/60 backdrop-blur-md" />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="relative bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl px-10 py-9 max-w-md w-[min(28rem,90%)] border border-slate-100"
        style={{
          boxShadow: `0 24px 60px -20px ${agent.color.primary}33, 0 8px 24px -8px rgba(15,23,42,0.12)`,
        }}
      >
        {/* Avatar with agent halo */}
        <div className="flex flex-col items-center text-center">
          <motion.div
            animate={
              reduceMotion
                ? undefined
                : { scale: [1, 1.04, 1], rotate: [0, 1.5, -1.5, 0] }
            }
            transition={
              reduceMotion
                ? undefined
                : { duration: 2.6, repeat: Infinity, ease: 'easeInOut' }
            }
            className="w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-offset-4 mb-5 shadow-lg"
            style={{ '--tw-ring-color': agent.color.light } as React.CSSProperties}
          >
            <img
              src={agent.avatar}
              alt={agent.name}
              className="w-full h-full object-cover"
            />
          </motion.div>

          {/* Title */}
          <p
            className="text-[11px] uppercase tracking-[0.18em] font-semibold mb-2"
            style={{ color: agent.color.primary }}
          >
            {agent.name} — {agent.role}
          </p>
          <h3 className="text-lg font-semibold text-slate-800 leading-snug mb-1 text-balance">
            {taskTitle}
          </h3>

          {/* Progressive verb */}
          <p className="text-sm text-slate-500 mt-3">
            {agent.name} {verb}
            <span aria-hidden="true">…</span>
          </p>

          {/* Animated dots row (skipped if reduced motion) */}
          {!reduceMotion && (
            <div className="flex gap-2 justify-center pt-5">
              {[0, 1, 2].map((index) => (
                <motion.span
                  key={index}
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: agent.color.primary }}
                  animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                  transition={{
                    duration: 1.4,
                    repeat: Infinity,
                    delay: index * 0.18,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>
          )}
          {reduceMotion && (
            <p className="text-xs text-slate-400 mt-4">Chargement en cours.</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

