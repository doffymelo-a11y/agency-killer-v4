// ═══════════════════════════════════════════════════════════════
// Status Badge Component
// ═══════════════════════════════════════════════════════════════

import { Circle, Clock, CheckCircle2, Lock } from 'lucide-react';
import type { TaskStatus } from '../../../types';

export interface StatusBadgeProps {
  status: TaskStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
    todo: { icon: Circle, label: 'À faire', className: 'status-todo' },
    in_progress: { icon: Clock, label: 'En cours', className: 'status-in-progress' },
    done: { icon: CheckCircle2, label: 'Terminé', className: 'status-done' },
    blocked: { icon: Lock, label: 'Bloqué', className: 'status-blocked' },
  };

  const { icon: Icon, label, className } = config[status];

  return (
    <span className={`status-badge ${className}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}
