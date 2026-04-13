/**
 * AgentActivityTab - Container for agent activity monitoring
 * Sprint 3.4 - Admin Monitoring Dashboard
 */

import { useState, useEffect } from 'react';
import { Filter } from 'lucide-react';
import { getAgentStats, getAgentActivity } from '../../services/admin.service';
import type { AgentStats, AgentActivity } from '../../services/admin.service';
import AgentStatsCards from './AgentStatsCards';
import AgentActivityTimeline from './AgentActivityTimeline';
import AgentCostChart from './AgentCostChart';

// Generate mock cost data for last 30 days
function generateMockCostData() {
  const data = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });

    data.push({
      date: dateStr,
      luna: Math.floor(Math.random() * 500) + 100,
      sora: Math.floor(Math.random() * 400) + 80,
      marcus: Math.floor(Math.random() * 600) + 150,
      milo: Math.floor(Math.random() * 300) + 50,
      doffy: Math.floor(Math.random() * 350) + 70,
    });
  }

  return data;
}

export default function AgentActivityTab() {
  const [stats, setStats] = useState<AgentStats[]>([]);
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [costData, setCostData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<string | 'all'>('all');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    await Promise.all([loadStats(), loadActivities(), loadCostData()]);
  }

  async function loadStats() {
    setLoading(true);
    try {
      const data = await getAgentStats(30);
      setStats(data);
    } catch (error) {
      console.error('[AgentActivityTab] Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadActivities() {
    setActivitiesLoading(true);
    try {
      const params: any = { limit: 50 };
      if (selectedAgent !== 'all') {
        params.agent_id = selectedAgent;
      }

      const data = await getAgentActivity(params);
      setActivities(data);
    } catch (error) {
      console.error('[AgentActivityTab] Error loading activities:', error);
    } finally {
      setActivitiesLoading(false);
    }
  }

  async function loadCostData() {
    try {
      // TODO: Replace with real data from api_usage_tracking or system_logs
      // For now, generate mock data
      const data = generateMockCostData();
      setCostData(data);
    } catch (error) {
      console.error('[AgentActivityTab] Error loading cost data:', error);
    }
  }

  // Reload activities when agent filter changes
  useEffect(() => {
    loadActivities();
  }, [selectedAgent]);

  const AGENT_OPTIONS = [
    { value: 'all', label: 'All Agents' },
    { value: 'luna', label: 'Luna' },
    { value: 'sora', label: 'Sora' },
    { value: 'marcus', label: 'Marcus' },
    { value: 'milo', label: 'Milo' },
    { value: 'doffy', label: 'Doffy' },
  ];

  return (
    <div className="space-y-6">
      {/* Agent Stats Cards */}
      <AgentStatsCards stats={stats} isLoading={loading} />

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-slate-500" />
        <label className="text-sm font-medium text-slate-700">Filter by agent:</label>
        <select
          value={selectedAgent}
          onChange={(e) => setSelectedAgent(e.target.value)}
          className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          {AGENT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Grid layout for Timeline and Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Timeline */}
        <AgentActivityTimeline
          activities={activities}
          isLoading={activitiesLoading}
        />

        {/* Cost Chart */}
        <AgentCostChart data={costData} isLoading={false} />
      </div>
    </div>
  );
}
