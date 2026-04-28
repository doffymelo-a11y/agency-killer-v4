import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { AnalyticsKPI } from '../../types';

interface KPICardProps {
  kpi: AnalyticsKPI;
}

export default function KPICard({ kpi }: KPICardProps) {
  const TrendIcon = kpi.trendDirection === 'up' ? TrendingUp : kpi.trendDirection === 'down' ? TrendingDown : Minus;

  const trendColor =
    kpi.trendDirection === 'up' ? 'text-green-600' :
    kpi.trendDirection === 'down' ? 'text-red-600' : 'text-gray-400';

  const formatValue = (value: string | number): string => {
    if (typeof value === 'string') return value;

    switch (kpi.format) {
      case 'currency':
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
      case 'percentage':
        return `${value}%`;
      case 'number':
        return new Intl.NumberFormat('fr-FR').format(value);
      default:
        return String(value);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-slate-600 font-medium mb-2">{kpi.label}</p>
          <p className="text-3xl font-bold text-slate-900 mb-1">{formatValue(kpi.value)}</p>

          {kpi.trend !== undefined && (
            <div className="flex items-center gap-1.5">
              <TrendIcon className={`w-4 h-4 ${trendColor}`} />
              <span className={`text-sm font-semibold ${trendColor}`}>
                {kpi.trend > 0 ? '+' : ''}{kpi.trend}%
              </span>
              {kpi.period && (
                <span className="text-xs text-slate-500 ml-1">{kpi.period}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
