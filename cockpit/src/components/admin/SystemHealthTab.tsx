/**
 * SystemHealthTab - System health monitoring tab
 * Sprint 2.6 - Admin Monitoring Dashboard
 */

import { useState, useEffect } from 'react';
import { getSystemHealth, getRecentLogs } from '../../services/admin.service';
import type { SystemLog } from '../../services/admin.service';
import type { MCPServerStatus } from '../../types/admin.types';
import ServiceHealthGrid from './ServiceHealthGrid';
import MCPServerGrid from './MCPServerGrid';
import RecentErrorsTable from './RecentErrorsTable';

// Hardcoded MCP servers for now (could be fetched from backend later)
const MCP_SERVERS: MCPServerStatus[] = [
  { name: 'web-intelligence', status: 'healthy', tools_count: 8, primary_agent: 'ALL' },
  { name: 'cms-connector', status: 'healthy', tools_count: 12, primary_agent: 'luna' },
  { name: 'seo-audit', status: 'healthy', tools_count: 5, primary_agent: 'luna' },
  { name: 'keyword-research', status: 'healthy', tools_count: 4, primary_agent: 'luna' },
  { name: 'google-ads', status: 'healthy', tools_count: 6, primary_agent: 'sora' },
  { name: 'meta-ads', status: 'healthy', tools_count: 7, primary_agent: 'sora' },
  { name: 'google-ads-launcher', status: 'healthy', tools_count: 5, primary_agent: 'marcus' },
  { name: 'budget-optimizer', status: 'healthy', tools_count: 4, primary_agent: 'marcus' },
  { name: 'gtm', status: 'healthy', tools_count: 6, primary_agent: 'sora' },
  { name: 'looker', status: 'healthy', tools_count: 5, primary_agent: 'sora' },
  { name: 'elevenlabs', status: 'healthy', tools_count: 3, primary_agent: 'milo' },
  { name: 'nano-banana-pro', status: 'healthy', tools_count: 4, primary_agent: 'milo' },
  { name: 'veo3', status: 'healthy', tools_count: 3, primary_agent: 'milo' },
  { name: 'social-media', status: 'healthy', tools_count: 8, primary_agent: 'doffy' },
];

export default function SystemHealthTab() {
  const [health, setHealth] = useState<any>(null);
  const [errors, setErrors] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorsLoading, setErrorsLoading] = useState(true);

  useEffect(() => {
    loadData();

    // Polling every 30 seconds
    const interval = setInterval(loadData, 30000);

    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    await Promise.all([loadHealth(), loadErrors()]);
  }

  async function loadHealth() {
    setLoading(true);
    try {
      const data = await getSystemHealth();
      setHealth(data);
    } catch (error) {
      console.error('[SystemHealthTab] Error loading health:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadErrors() {
    setErrorsLoading(true);
    try {
      const logsData = await getRecentLogs({
        level: 'error',
        limit: 20,
      });
      setErrors(logsData);
    } catch (error) {
      console.error('[SystemHealthTab] Error loading errors:', error);
    } finally {
      setErrorsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Services Health */}
      <ServiceHealthGrid health={health} isLoading={loading} />

      {/* MCP Servers */}
      <MCPServerGrid servers={MCP_SERVERS} isLoading={false} />

      {/* Recent Errors */}
      <RecentErrorsTable errors={errors} isLoading={errorsLoading} isLive={false} />
    </div>
  );
}
