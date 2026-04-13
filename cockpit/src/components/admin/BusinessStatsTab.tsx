/**
 * BusinessStatsTab - Container for business metrics and charts
 * Sprint 4.5 - Admin Monitoring Dashboard
 */

import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { getBusinessStats } from '../../services/admin.service';
import type { BusinessStats } from '../../services/admin.service';
import TopMetricsGrid from './TopMetricsGrid';
import ProjectBreakdownChart from './ProjectBreakdownChart';
import TasksByAgentChart from './TasksByAgentChart';
import CSATTrendChart from './CSATTrendChart';

type PeriodOption = 7 | 30 | 90;

export default function BusinessStatsTab() {
  const [stats, setStats] = useState<BusinessStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodOption>(30);

  useEffect(() => {
    loadStats();
  }, [period]);

  async function loadStats() {
    setLoading(true);
    try {
      const data = await getBusinessStats(period);
      setStats(data);
    } catch (error) {
      console.error('[BusinessStatsTab] Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  }

  const PERIOD_OPTIONS: { value: PeriodOption; label: string }[] = [
    { value: 7, label: 'Last 7 Days' },
    { value: 30, label: 'Last 30 Days' },
    { value: 90, label: 'Last 90 Days' },
  ];

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-end gap-3">
        <Calendar className="w-4 h-4 text-slate-500" />
        <label className="text-sm font-medium text-slate-700">Period:</label>
        <select
          value={period}
          onChange={(e) => setPeriod(parseInt(e.target.value) as PeriodOption)}
          className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          {PERIOD_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Top Metrics Grid */}
      <TopMetricsGrid stats={stats} isLoading={loading} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Breakdown */}
        <ProjectBreakdownChart stats={stats} isLoading={loading} />

        {/* Tasks by Agent */}
        <TasksByAgentChart stats={stats} isLoading={loading} />
      </div>

      {/* CSAT Trend - Full Width */}
      <CSATTrendChart isLoading={loading} />
    </div>
  );
}
