import { CheckCircle2, AlertCircle, AlertTriangle, Info, ArrowRight } from 'lucide-react';
import { AGENTS, type AgentRole, type AnalyticsInsight } from '../../types';

interface InsightCardProps {
  insight: AnalyticsInsight;
  onAction?: () => void;
}

export default function InsightCard({ insight, onAction }: InsightCardProps) {
  const agent = AGENTS[insight.agent as AgentRole] || AGENTS.sora;

  const typeStyles = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      iconColor: 'text-green-600',
      Icon: CheckCircle2,
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      iconColor: 'text-amber-600',
      Icon: AlertTriangle,
    },
    danger: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      iconColor: 'text-red-600',
      Icon: AlertCircle,
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      iconColor: 'text-blue-600',
      Icon: Info,
    },
  };

  const style = typeStyles[insight.type];
  const Icon = style.Icon;

  return (
    <div className={`${style.bg} ${style.border} border rounded-lg p-4`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${style.iconColor} flex-shrink-0 mt-0.5`} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded"
              style={{ backgroundColor: agent.color.light, color: agent.color.dark }}
            >
              {agent.name}
            </span>
          </div>

          <p className="text-sm text-slate-700 leading-relaxed">{insight.message}</p>

          {insight.action && (
            <button
              onClick={onAction}
              className="mt-2 text-sm font-medium text-slate-700 hover:text-slate-900 flex items-center gap-1 transition-colors"
            >
              {insight.action}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
