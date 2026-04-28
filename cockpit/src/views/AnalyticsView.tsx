// ═══════════════════════════════════════════════════════════════
// THE HIVE OS V5 - Analytics Hub (Phase 3)
// Real marketing analytics from GA4, Meta Ads, Google Ads, GSC
// ═══════════════════════════════════════════════════════════════

import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw, TrendingUp } from 'lucide-react';
import { useHiveStore, useCurrentProject } from '../store/useHiveStore';
import type { AnalyticsSource } from '../types';

// Analytics Components
import AnalyticsTabs from '../components/analytics/AnalyticsTabs';
import DateRangeSelector from '../components/analytics/DateRangeSelector';
import OverviewDashboard from '../components/analytics/OverviewDashboard';
import KPIGrid from '../components/analytics/KPIGrid';
import ChartWidget from '../components/analytics/ChartWidget';
import InsightCard from '../components/analytics/InsightCard';

export default function AnalyticsView() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const project = useCurrentProject();

  // Analytics state
  const analyticsData = useHiveStore((state) => state.analyticsData);
  const analyticsActiveSource = useHiveStore((state) => state.analyticsActiveSource);
  const analyticsDateRange = useHiveStore((state) => state.analyticsDateRange);
  const analyticsLoading = useHiveStore((state) => state.analyticsLoading);

  // Analytics actions
  const fetchAnalytics = useHiveStore((state) => state.fetchAnalytics);
  const setAnalyticsSource = useHiveStore((state) => state.setAnalyticsSource);
  const setAnalyticsDateRange = useHiveStore((state) => state.setAnalyticsDateRange);

  // Fetch analytics on mount and when source/date range changes
  useEffect(() => {
    if (projectId) {
      fetchAnalytics(projectId, analyticsActiveSource, analyticsDateRange);
    }
  }, [projectId, analyticsActiveSource, analyticsDateRange, fetchAnalytics]);

  const handleRefresh = () => {
    if (projectId) {
      fetchAnalytics(projectId, analyticsActiveSource, analyticsDateRange);
    }
  };

  const handleSourceChange = (source: AnalyticsSource) => {
    setAnalyticsSource(source);
  };

  const handleDateRangeChange = (dateRange: typeof analyticsDateRange) => {
    setAnalyticsDateRange(dateRange);
  };

  const handleInsightAction = (insight: any) => {
    if (insight.actionUrl) {
      navigate(insight.actionUrl);
    }
  };

  // Render loading state
  if (analyticsLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-slate-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Chargement des analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`/board/${projectId}`)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title="Retour au board"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h1 className="font-semibold text-slate-900 text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Analytics Hub
                </h1>
                <p className="text-sm text-slate-500">{project?.name || 'Chargement...'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <DateRangeSelector
                dateRange={analyticsDateRange}
                onChange={handleDateRangeChange}
              />
              <button
                onClick={handleRefresh}
                className="btn btn-secondary"
                disabled={analyticsLoading}
              >
                <RefreshCw className={`w-4 h-4 ${analyticsLoading ? 'animate-spin' : ''}`} />
                Actualiser
              </button>
            </div>
          </div>

          {/* Tabs */}
          <AnalyticsTabs
            activeSource={analyticsActiveSource}
            onSourceChange={handleSourceChange}
          />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {analyticsActiveSource === 'overview' ? (
          // Overview Dashboard
          <OverviewDashboard
            data={analyticsData || {
              source: 'overview',
              dateRange: analyticsDateRange,
              kpis: [],
              charts: [],
              insights: [],
              isConnected: false,
            }}
            projectId={projectId || ''}
          />
        ) : (
          // Source-specific view
          <div className="space-y-8">
            {/* KPIs Section */}
            {analyticsData && analyticsData.kpis.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-slate-900 mb-4">
                  Métriques clés
                </h2>
                <KPIGrid kpis={analyticsData.kpis} />
              </section>
            )}

            {/* Charts Section */}
            {analyticsData && analyticsData.charts.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-slate-900 mb-4">
                  Graphiques
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {analyticsData.charts.map((chart) => (
                    <ChartWidget key={chart.id} chart={chart} />
                  ))}
                </div>
              </section>
            )}

            {/* Insights Section */}
            {analyticsData && analyticsData.insights.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-slate-900 mb-4">
                  Insights & Recommandations
                </h2>
                <div className="space-y-3">
                  {analyticsData.insights.map((insight) => (
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
            {analyticsData && !analyticsData.isConnected && (
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-slate-200 p-12 text-center">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Source non connectée
                </h3>
                <p className="text-slate-600 mb-6">
                  Connectez {analyticsActiveSource === 'ga4' ? 'Google Analytics' :
                    analyticsActiveSource === 'meta_ads' ? 'Meta Ads' :
                    analyticsActiveSource === 'google_ads' ? 'Google Ads' :
                    'Google Search Console'} pour voir vos métriques ici.
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
        )}
      </main>
    </div>
  );
}
