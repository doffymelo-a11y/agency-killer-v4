import KPICard from './KPICard';
import type { AnalyticsKPI } from '../../types';

interface KPIGridProps {
  kpis: AnalyticsKPI[];
}

export default function KPIGrid({ kpis }: KPIGridProps) {
  if (kpis.length === 0) {
    return (
      <div className="bg-slate-50 rounded-lg border border-slate-200 p-12 text-center">
        <p className="text-slate-600">Aucune métrique disponible pour cette période</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <KPICard key={kpi.id} kpi={kpi} />
      ))}
    </div>
  );
}
