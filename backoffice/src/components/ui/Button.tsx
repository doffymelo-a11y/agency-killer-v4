// ═══════════════════════════════════════════════════════════════
// Button Component - Dark Theme
// Primary, secondary, and danger button variants
// ═══════════════════════════════════════════════════════════════

import { cn } from '../../lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-cyan-600 hover:bg-cyan-700 text-white',
  secondary: 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  ghost: 'bg-transparent hover:bg-slate-800/50 text-slate-400 hover:text-white',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2',
  lg: 'px-6 py-3 text-lg',
};

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900',
        variantClasses[variant],
        sizeClasses[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
