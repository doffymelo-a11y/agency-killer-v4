// ═══════════════════════════════════════════════════════════════
// Phase Badge Component
// ═══════════════════════════════════════════════════════════════

export interface PhaseBadgeProps {
  phase: string;
}

export default function PhaseBadge({ phase }: PhaseBadgeProps) {
  const phaseClass = `phase-${phase.toLowerCase()}`;
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${phaseClass}`}>
      {phase}
    </span>
  );
}
