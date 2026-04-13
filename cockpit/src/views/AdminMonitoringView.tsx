/**
 * Admin Monitoring View - System Health & Agent Activity Monitoring
 * Sprint 2.3 - Admin Dashboard Tabs
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, TrendingUp, AlertTriangle, RefreshCw } from 'lucide-react';
import {
  getAgentStats,
  getBusinessStats,
  getRecentLogs,
  getErrorCount,
  isCurrentUserAdmin,
  type AgentStats,
  type BusinessStats,
  type SystemLog,
} from '../services/admin.service';
import ErrorAlertBanner from '../components/admin/ErrorAlertBanner';
import AgentStatsTable from '../components/admin/AgentStatsTable';
import MetricsCards from '../components/admin/MetricsCards';
import LogsViewer, { type LogFilters } from '../components/admin/LogsViewer';

type TabType = 'system_health' | 'agent_activity' | 'business_stats';

export default function AdminMonitoringView() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('system_health');

  // Data states
  const [agentStats, setAgentStats] = useState<AgentStats[]>([]);
  const [businessStats, setBusinessStats] = useState<BusinessStats | null>(null);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [errorCount, setErrorCount] = useState(0);

  // Loading states
  const [agentStatsLoading, setAgentStatsLoading] = useState(false);
  const [businessStatsLoading, setBusinessStatsLoading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);

  // Filter state for logs
  const [logFilters, setLogFilters] = useState<LogFilters>({});

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  async function checkAdminAndLoad() {
    setLoading(true);

    const adminStatus = await isCurrentUserAdmin();
    setIsAdmin(adminStatus);

    if (!adminStatus) {
      navigate('/projects');
      return;
    }

    // Load initial data
    await loadData();
    setLoading(false);
  }

  async function loadData() {
    await Promise.all([
      loadAgentStats(),
      loadBusinessStats(),
      loadLogs(logFilters),
      loadErrorCount(),
    ]);
  }

  async function loadAgentStats() {
    setAgentStatsLoading(true);
    try {
      const stats = await getAgentStats(30);
      setAgentStats(stats);
    } catch (error) {
      console.error('[Admin Monitoring] Error loading agent stats:', error);
    } finally {
      setAgentStatsLoading(false);
    }
  }

  async function loadBusinessStats() {
    setBusinessStatsLoading(true);
    try {
      const stats = await getBusinessStats(30);
      setBusinessStats(stats);
    } catch (error) {
      console.error('[Admin Monitoring] Error loading business stats:', error);
    } finally {
      setBusinessStatsLoading(false);
    }
  }

  async function loadLogs(filters: LogFilters) {
    setLogsLoading(true);
    try {
      const logsData = await getRecentLogs({
        limit: 50,
        ...filters,
      });
      setLogs(logsData);
    } catch (error) {
      console.error('[Admin Monitoring] Error loading logs:', error);
    } finally {
      setLogsLoading(false);
    }
  }

  async function loadErrorCount() {
    try {
      const result = await getErrorCount(1);
      setErrorCount(result.error_count);
    } catch (error) {
      console.error('[Admin Monitoring] Error loading error count:', error);
    }
  }

  const handleRefresh = async () => {
    await loadData();
  };

  const handleLogFiltersChange = async (filters: LogFilters) => {
    setLogFilters(filters);
    await loadLogs(filters);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading monitoring dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-white">System Monitoring</h1>
              <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20">
                ADMIN
              </span>
            </div>
            <p className="text-slate-400">Real-time system health, agent activity, and business metrics</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition"
              title="Refresh data"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/admin')}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition"
            >
              ← Back to Admin
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('system_health')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'system_health'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <Activity className="w-4 h-4" />
            System Health
          </button>
          <button
            onClick={() => setActiveTab('agent_activity')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'agent_activity'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Agent Activity
          </button>
          <button
            onClick={() => setActiveTab('business_stats')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'business_stats'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Business Stats
          </button>
        </div>

        {/* System Health Tab */}
        {activeTab === 'system_health' && (
          <div className="space-y-6">
            {/* Error Alert Banner */}
            {errorCount > 0 && (
              <ErrorAlertBanner
                errorCount={errorCount}
                timeframe="last hour"
                onDismiss={() => setErrorCount(0)}
              />
            )}

            {/* Agent Stats Table */}
            <AgentStatsTable stats={agentStats} isLoading={agentStatsLoading} />

            {/* Recent Logs */}
            <LogsViewer
              logs={logs}
              isLoading={logsLoading}
              onFilterChange={handleLogFiltersChange}
            />
          </div>
        )}

        {/* Agent Activity Tab */}
        {activeTab === 'agent_activity' && (
          <div className="space-y-6">
            {/* Agent Stats */}
            <AgentStatsTable stats={agentStats} isLoading={agentStatsLoading} />

            {/* Filtered Logs - Agent Activity Only */}
            <LogsViewer
              logs={logs.filter(log => log.source === 'agent-executor' || log.source === 'orchestrator')}
              isLoading={logsLoading}
              onFilterChange={handleLogFiltersChange}
            />
          </div>
        )}

        {/* Business Stats Tab */}
        {activeTab === 'business_stats' && (
          <div className="space-y-6">
            {/* Metrics Cards */}
            <MetricsCards stats={businessStats} isLoading={businessStatsLoading} />

            {/* Agent Stats Table */}
            <AgentStatsTable stats={agentStats} isLoading={agentStatsLoading} />
          </div>
        )}
      </div>
    </div>
  );
}
