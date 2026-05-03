// ═══════════════════════════════════════════════════════════════
// Badge Component - Dark Theme
// Role, status, and priority badges
// ═══════════════════════════════════════════════════════════════

import { cn } from '../../lib/cn';

type BadgeVariant =
  | 'super_admin'
  | 'admin'
  | 'user'
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'open'
  | 'in_progress'
  | 'waiting_user'
  | 'resolved'
  | 'closed';

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  // Roles
  super_admin: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  admin: 'bg-red-500/10 text-red-400 border-red-500/20',
  user: 'bg-slate-500/10 text-slate-400 border-slate-500/20',

  // Priority
  critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  medium: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  low: 'bg-slate-500/10 text-slate-400 border-slate-500/20',

  // Status
  open: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  in_progress: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  waiting_user: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  resolved: 'bg-green-500/10 text-green-400 border-green-500/20',
  closed: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

export function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
