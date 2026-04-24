// ═══════════════════════════════════════════════════════════════
// Card Component - Dark Theme
// Reusable card wrapper matching cockpit design
// ═══════════════════════════════════════════════════════════════

import { cn } from '../../lib/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-slate-800/50 border border-slate-700/50 rounded-xl backdrop-blur-sm',
        onClick && 'cursor-pointer hover:bg-slate-800/70 transition-colors',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('px-6 py-4 border-b border-slate-700/50', className)}>{children}</div>;
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('p-6', className)}>{children}</div>;
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn('text-lg font-semibold text-white', className)}>{children}</h3>;
}
