// ═══════════════════════════════════════════════════════════════
// Input Component - Dark Theme
// Text input with optional icon
// ═══════════════════════════════════════════════════════════════

import { cn } from '../../lib/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  containerClassName?: string;
}

export function Input({ icon, className, containerClassName, ...props }: InputProps) {
  return (
    <div className={cn('relative', containerClassName)}>
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400">
          {icon}
        </div>
      )}
      <input
        className={cn(
          'w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500',
          'focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent',
          'transition-all',
          icon && 'pl-10',
          className
        )}
        {...props}
      />
    </div>
  );
}
