import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
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

  // Group KPIs by source
  const kpisBySource = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    data.kpis.forEach((kpi) => {
      if (!grouped[kpi.source]) {
        grouped[kpi.source] = [];
      }
      grouped[kpi.source].push(kpi);
    });
    return grouped;
  }, [data.kpis]);

  // Calculate marketing health score
  const healthScore = useMemo(() => {
    if (data.kpis.length === 0) return 0;

    // Calculate score based on KPI trends
    let score = 0;
    let count = 0;

    data.kpis.forEach((kpi) => {
      if (kpi.trendDirection === 'up') {
        score += 100;
        count++;
      } else if (kpi.trendDirection === 'down') {
        score += 0;
        count++;
      } else if (kpi.trendDirection === 'neutral') {
        score += 50;
        count++;
      }
    });

    return count > 0 ? Math.round(score / count) : 0;
  }, [data.kpis]);

  const getHealthColor = (score: number) => {
    if (score >= 75) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthBgColor = (score: number) => {
    if (score >= 75) return 'bg-green-50 border-green-200';
    if (score >= 50) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getHealthLabel = (score: number) => {
    if (score >= 75) return 'Excellent';
    if (score >= 50) return 'Moyen';
    return 'À améliorer';
  };

  const sourceLabels: Record<string, string> = {
    ga4: 'Google Analytics 4',
    meta_ads: 'Meta Ads',
    google_ads: 'Google Ads',
    gsc: 'Google Search Console',
  };

  return (
    <div className="space-y-8">
      {/* Health Score Banner */}
      {data.isConnected && data.kpis.length > 0 && (
        <section>
          <div className={`rounded-lg border-2 p-6 ${getHealthBgColor(healthScore)}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-slate-600 mb-1">
                  Score de santé marketing
                </h3>
                <div className="flex items-baseline gap-3">
                  <span className={`text-4xl font-bold ${getHealthColor(healthScore)}`}>
                    {healthScore}
                  </span>
                  <span className={`text-lg font-medium ${getHealthColor(healthScore)}`}>
                    {getHealthLabel(healthScore)}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-600">
                  {data.insights.filter((i) => i.type === 'success').length} insights positifs
                </p>
                <p className="text-sm text-slate-600">
                  {data.insights.filter((i) => i.type === 'danger' || i.type === 'warning').length} alertes
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* KPIs by Source */}
      {Object.entries(kpisBySource).map(([source, kpis]) => (
        <section key={source}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900">
              {sourceLabels[source] || source}
            </h2>
            <span className="text-sm text-slate-500">
              {kpis.length} métriques
            </span>
          </div>
          <KPIGrid kpis={kpis} />
        </section>
      ))}

      {/* Top Insights */}
      {data.insights.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Insights prioritaires
          </h2>
          <div className="space-y-3">
            {data.insights.slice(0, 5).map((insight) => (
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
