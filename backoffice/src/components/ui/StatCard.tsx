// ═══════════════════════════════════════════════════════════════
// StatCard Component - Dark Theme
// Stat display card with icon, label, value, and subtext
// ═══════════════════════════════════════════════════════════════

import { cn } from '../../lib/cn';
import { Card, CardContent } from './Card';

type StatColor = 'cyan' | 'purple' | 'green' | 'amber' | 'red' | 'blue';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
  color?: StatColor;
  className?: string;
}

const colorClasses: Record<StatColor, { bg: string; text: string }> = {
  cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-400' },
  green: { bg: 'bg-green-500/10', text: 'text-green-400' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
  red: { bg: 'bg-red-500/10', text: 'text-red-400' },
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
};

export function StatCard({
  icon,
  label,
  value,
  subtext,
  color = 'cyan',
  className,
}: StatCardProps) {
  const colors = colorClasses[color];

  return (
    <Card className={className}>
      <CardContent>
        <div className="flex items-center justify-between mb-3">
          <p className="text-slate-400 text-sm font-medium">{label}</p>
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', colors.bg)}>
            <div className={cn('w-5 h-5', colors.text)}>{icon}</div>
          </div>
        </div>
        <p className="text-4xl font-bold text-white mb-1">{value}</p>
        {subtext && <p className="text-xs text-slate-500">{subtext}</p>}
      </CardContent>
    </Card>
  );
}
