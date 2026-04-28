import { useNavigate } from 'react-router-dom';
import KPIGrid from './KPIGrid';
import InsightCard from './InsightCard';
import type { AnalyticsData } from '../../types';

interface OverviewDashboardProps {
  data: AnalyticsData;
  projectId: string;
}

export default function OverviewDashboard({ data, projectId }: OverviewDashboardProps) {
  const navigate = useNavigate();

  const handleInsightAction = (insight: any) => {
    if (insight.actionUrl) {
      navigate(insight.actionUrl);
    }
  };

  return (
    <div className="space-y-8">
      {/* KPIs Section */}
      <section>
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          Métriques clés
        </h2>
        <KPIGrid kpis={data.kpis} />
      </section>

      {/* Insights Section */}
      {data.insights.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Insights & Recommandations
          </h2>
          <div className="space-y-3">
            {data.insights.map((insight) => (
              <InsightCard
                key={insight.id}
                insight={insight}
                onAction={() => handleInsightAction(insight)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {!data.isConnected && (
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-slate-200 p-12 text-center">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Connectez vos sources de données
          </h3>
          <p className="text-slate-600 mb-6">
            Connectez Google Analytics, Meta Ads ou Google Ads pour voir vos métriques ici.
          </p>
          <button
            onClick={() => navigate(`/integrations/${projectId}`)}
            className="px-6 py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
          >
            Gérer les intégrations
          </button>
        </div>
      )}
    </div>
  );
}
