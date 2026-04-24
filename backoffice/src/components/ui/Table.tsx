// ═══════════════════════════════════════════════════════════════
// Table Component - Dark Theme
// Data table with dark styling and empty state
// ═══════════════════════════════════════════════════════════════

import { cn } from '../../lib/cn';
import { Card } from './Card';

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export function Table({ children, className }: TableProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full">{children}</table>
      </div>
    </Card>
  );
}

export function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <thead className="bg-slate-900/50">
      <tr>{children}</tr>
    </thead>
  );
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-slate-700/50">{children}</tbody>;
}

export function TableRow({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        'transition-colors',
        onClick && 'cursor-pointer hover:bg-slate-700/30',
        className
      )}
    >
      {children}
    </tr>
  );
}

export function TableHead({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        'px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider',
        className
      )}
    >
      {children}
    </th>
  );
}

export function TableCell({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn('px-6 py-4 text-sm text-slate-300', className)}>{children}</td>;
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
}

export function TableEmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <tr>
      <td colSpan={100} className="px-6 py-12">
        <div className="text-center">
          {icon && <div className="w-12 h-12 text-slate-600 mx-auto mb-4">{icon}</div>}
          <p className="text-slate-400 font-medium mb-1">{title}</p>
          {description && <p className="text-slate-500 text-sm">{description}</p>}
        </div>
      </td>
    </tr>
  );
}
