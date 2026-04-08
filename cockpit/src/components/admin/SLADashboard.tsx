/**
 * SLA Dashboard Component (Admin Only)
 * Displays SLA metrics, trends, and alerts for support tickets
 */

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Activity,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

interface SLASummary {
  total_tickets: number;
  total_resolved: number;
  avg_first_response_hours: number;
  avg_resolution_hours: number;
  sla_breaches: number;
  sla_met_percentage: number;
  critical_breaches: number;
  high_breaches: number;
}

interface TicketAtRisk {
  ticket_id: string;
  subject: string;
  priority: string;
  created_at: string;
  hours_since_creation: number;
  target_hours: number;
  hours_remaining: number;
  user_email: string;
}

interface DashboardMetric {
  date: string;
  avg_first_response_hours: number;
  avg_resolution_hours: number;
  sla_breaches: number;
  total_tickets: number;
}

// ─────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────

export default function SLADashboard() {
  const [summary, setSummary] = useState<SLASummary | null>(null);
  const [ticketsAtRisk, setTicketsAtRisk] = useState<TicketAtRisk[]>([]);
  const [trendData, setTrendData] = useState<DashboardMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<7 | 30 | 90>(30);

  useEffect(() => {
    loadSLAData();
  }, [selectedPeriod]);

  async function loadSLAData() {
    setLoading(true);

    try {
      // Load SLA summary
      const { data: summaryData, error: summaryError } = await supabase
        .rpc('get_sla_summary', { days_back: selectedPeriod });

      if (summaryError) throw summaryError;
      if (summaryData && summaryData.length > 0) {
        setSummary(summaryData[0]);
      }

      // Load tickets at risk
      const { data: riskData, error: riskError } = await supabase
        .rpc('get_tickets_at_risk');

      if (riskError) throw riskError;
      setTicketsAtRisk(riskData || []);

      // Load trend data from materialized view
      const { data: trendData, error: trendError } = await supabase
        .from('ticket_sla_dashboard')
        .select('*')
        .order('date', { ascending: false })
        .limit(selectedPeriod);

      if (trendError) throw trendError;

      // Aggregate by date (sum across all priorities/categories)
      const aggregated = (trendData || []).reduce((acc: any[], row: any) => {
        const existingDate = acc.find((item) => item.date === row.date);

        if (existingDate) {
          existingDate.avg_first_response_hours =
            (existingDate.avg_first_response_hours + (row.avg_first_response_hours || 0)) / 2;
          existingDate.avg_resolution_hours =
            (existingDate.avg_resolution_hours + (row.avg_resolution_hours || 0)) / 2;
          existingDate.sla_breaches += row.sla_breaches || 0;
          existingDate.total_tickets += row.total_tickets || 0;
        } else {
          acc.push({
            date: row.date,
            avg_first_response_hours: row.avg_first_response_hours || 0,
            avg_resolution_hours: row.avg_resolution_hours || 0,
            sla_breaches: row.sla_breaches || 0,
            total_tickets: row.total_tickets || 0,
          });
        }

        return acc;
      }, []);

      setTrendData(aggregated.reverse());
    } catch (error: any) {
      console.error('[SLADashboard] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  function getPriorityColor(priority: string) {
    switch (priority) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="text-center text-slate-500 py-12">
        Aucune donnée SLA disponible
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">SLA Performance</h2>
          <p className="text-sm text-slate-600 mt-1">
            Métriques de temps de réponse et de résolution
          </p>
        </div>

        {/* Period selector */}
        <div className="flex gap-2">
          {([7, 30, 90] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                selectedPeriod === period
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {period} jours
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="Temps de 1ère réponse"
          value={`${summary.avg_first_response_hours?.toFixed(1) || 0}h`}
          target="< 24h"
          isGood={(summary.avg_first_response_hours || 0) < 24}
        />

        <StatCard
          icon={<Activity className="w-5 h-5" />}
          label="Temps de résolution"
          value={`${summary.avg_resolution_hours?.toFixed(1) || 0}h`}
          target="< 72h"
          isGood={(summary.avg_resolution_hours || 0) < 72}
        />

        <StatCard
          icon={<CheckCircle2 className="w-5 h-5" />}
          label="SLA Respecté"
          value={`${summary.sla_met_percentage?.toFixed(0) || 0}%`}
          target="> 90%"
          isGood={(summary.sla_met_percentage || 0) >= 90}
        />

        <StatCard
          icon={<AlertTriangle className="w-5 h-5" />}
          label="Dépassements SLA"
          value={summary.sla_breaches?.toString() || '0'}
          detail={`${summary.critical_breaches || 0} critiques, ${summary.high_breaches || 0} hauts`}
          isGood={(summary.sla_breaches || 0) === 0}
        />
      </div>

      {/* Tickets at Risk */}
      {ticketsAtRisk.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-red-900">
              Tickets à risque de dépassement SLA ({ticketsAtRisk.length})
            </h3>
          </div>

          <div className="space-y-2">
            {ticketsAtRisk.slice(0, 5).map((ticket) => (
              <a
                key={ticket.ticket_id}
                href={`/support/${ticket.ticket_id}`}
                className="flex items-center justify-between p-3 bg-white border border-red-100 rounded-lg hover:bg-red-50 transition"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium border ${getPriorityColor(
                        ticket.priority
                      )}`}
                    >
                      {ticket.priority}
                    </span>
                    <span className="text-sm font-medium text-slate-900 truncate">
                      {ticket.subject}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {ticket.user_email} • Créé{' '}
                    {formatDistanceToNow(new Date(ticket.created_at), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </div>
                </div>

                <div className="text-right ml-4">
                  <div className="text-sm font-semibold text-red-600">
                    {ticket.hours_remaining > 0
                      ? `${ticket.hours_remaining.toFixed(1)}h restantes`
                      : `En retard de ${Math.abs(ticket.hours_remaining).toFixed(1)}h`}
                  </div>
                  <div className="text-xs text-slate-500">
                    Cible: {ticket.target_hours}h
                  </div>
                </div>
              </a>
            ))}

            {ticketsAtRisk.length > 5 && (
              <button
                onClick={() => (window.location.href = '/support?filter=at_risk')}
                className="w-full py-2 text-sm text-red-700 hover:text-red-800 font-medium"
              >
                Voir tous les tickets à risque ({ticketsAtRisk.length})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Response Time Trend */}
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="font-semibold text-slate-900 mb-4">
            Temps de réponse (heures)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                fontSize={12}
                tickFormatter={(value) => new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
              />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="avg_first_response_hours"
                stroke="#06b6d4"
                strokeWidth={2}
                name="1ère réponse"
                dot={{ fill: '#06b6d4', r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="avg_resolution_hours"
                stroke="#8b5cf6"
                strokeWidth={2}
                name="Résolution"
                dot={{ fill: '#8b5cf6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* SLA Breaches Trend */}
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="font-semibold text-slate-900 mb-4">
            Dépassements SLA par jour
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                fontSize={12}
                tickFormatter={(value) => new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
              />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="sla_breaches" fill="#ef4444" name="Dépassements" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-sm text-slate-600 mb-1">Total tickets</div>
          <div className="text-2xl font-bold text-slate-900">
            {summary.total_tickets}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-sm text-slate-600 mb-1">Résolus</div>
          <div className="text-2xl font-bold text-green-600">
            {summary.total_resolved}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-sm text-slate-600 mb-1">Taux de résolution</div>
          <div className="text-2xl font-bold text-blue-600">
            {summary.total_tickets > 0
              ? ((summary.total_resolved / summary.total_tickets) * 100).toFixed(0)
              : 0}
            %
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-sm text-slate-600 mb-1">En attente</div>
          <div className="text-2xl font-bold text-orange-600">
            {summary.total_tickets - summary.total_resolved}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Stat Card Component
// ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  target?: string;
  detail?: string;
  isGood?: boolean;
}

function StatCard({ icon, label, value, target, detail, isGood }: StatCardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${isGood ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className={isGood ? 'text-green-600' : 'text-red-600'}>{icon}</div>
        </div>
        {isGood !== undefined && (
          <div className={`text-xs font-medium ${isGood ? 'text-green-600' : 'text-red-600'}`}>
            {isGood ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          </div>
        )}
      </div>

      <div className="text-sm text-slate-600 mb-1">{label}</div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>

      {target && (
        <div className="text-xs text-slate-500 mt-1">Objectif: {target}</div>
      )}

      {detail && (
        <div className="text-xs text-slate-500 mt-1">{detail}</div>
      )}
    </div>
  );
}
