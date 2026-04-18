/**
 * SystemHealthTab - System health monitoring tab
 * Sprint 2.6 - Admin Monitoring Dashboard
 */

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { getSystemHealth, getRecentLogs } from '../../services/admin.service';
import type { SystemLog } from '../../services/admin.service';
import type { MCPServerStatus } from '../../types/admin.types';
import ServiceHealthGrid from './ServiceHealthGrid';
import MCPServerGrid from './MCPServerGrid';
import RecentErrorsTable from './RecentErrorsTable';

// Mapping of MCP servers to primary agents (business logic)
const SERVER_PRIMARY_AGENTS: Record<string, 'luna' | 'sora' | 'marcus' | 'milo' | 'doffy' | 'ALL'> = {
  'web-intelligence': 'ALL',
  'cms-connector': 'luna',
  'seo-audit': 'luna',
  'keyword-research': 'luna',
  'google-ads': 'sora',
  'meta-ads': 'sora',
  'google-ads-launcher': 'marcus',
  'budget-optimizer': 'marcus',
  'gtm': 'sora',
  'looker': 'sora',
  'elevenlabs': 'milo',
  'nano-banana-pro': 'milo',
  'veo3': 'milo',
  'social-media': 'doffy',
};

export default function SystemHealthTab() {
  const [health, setHealth] = useState<any>(null);
  const [errors, setErrors] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorsLoading, setErrorsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [mcpServers, setMcpServers] = useState<MCPServerStatus[]>([]);

  useEffect(() => {
    loadData();

    // Polling every 30 seconds
    const interval = setInterval(loadData, 30000);

    // Setup Realtime subscription for error logs
    const channel = supabase
      .channel('system_logs_errors')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'system_logs',
          filter: 'level=eq.error',
        },
        (payload) => {
          console.log('[SystemHealthTab] New error received:', payload);
          const newError = payload.new as SystemLog;

          // Prepend new error to the list
          setErrors((prev) => [newError, ...prev].slice(0, 20));
        }
      )
      .subscribe((status) => {
        console.log('[SystemHealthTab] Subscription status:', status);
        setIsLive(status === 'SUBSCRIBED');
      });

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadData() {
    await Promise.all([loadHealth(), loadErrors()]);
  }

  async function loadHealth() {
    setLoading(true);
    try {
      const data = await getSystemHealth();
      setHealth(data);

      // Extract MCP servers from health data and add primary agents
      if (data?.mcp_bridge?.servers) {
        const serversWithAgents = data.mcp_bridge.servers.map((server: MCPServerStatus) => ({
          ...server,
          primary_agent: SERVER_PRIMARY_AGENTS[server.name] || 'ALL',
        }));
        setMcpServers(serversWithAgents);
      } else {
        setMcpServers([]);
      }
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
      <MCPServerGrid servers={mcpServers} isLoading={loading} />

      {/* Recent Errors */}
      <RecentErrorsTable errors={errors} isLoading={errorsLoading} isLive={isLive} />
    </div>
  );
}
