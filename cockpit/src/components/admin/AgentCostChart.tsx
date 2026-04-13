/**
 * AgentCostChart - Stacked area chart of credits used by agents
 * Sprint 3.3 - Admin Monitoring Dashboard
 */

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign } from 'lucide-react';

interface AgentCostData {
  date: string;
  luna: number;
  sora: number;
  marcus: number;
  milo: number;
  doffy: number;
}

interface AgentCostChartProps {
  data: AgentCostData[];
  isLoading?: boolean;
}

const AGENT_COLORS: Record<string, string> = {
  luna: '#9333ea', // purple-600
  sora: '#2563eb', // blue-600
  marcus: '#16a34a', // green-600
  milo: '#ea580c', // orange-600
  doffy: '#ec4899', // pink-600
};

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-[400px]">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
        <DollarSign className="w-8 h-8 text-slate-400" />
      </div>
      <p className="text-slate-600 font-medium">Aucune donnée de coût disponible</p>
      <p className="text-sm text-slate-500 mt-1">Les données apparaîtront une fois que les agents auront effectué des actions</p>
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="animate-pulse h-[400px] flex items-end gap-2 px-4">
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="flex-1 bg-slate-200 rounded-t"
          style={{ height: `${Math.random() * 100}%` }}
        />
      ))}
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const total = payload.reduce((sum: number, entry: any) => sum + (entry.value || 0), 0);

  return (
    <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
      <p className="text-sm font-semibold text-slate-900 mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center justify-between gap-4 text-xs mb-1">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-slate-600 capitalize">{entry.name}</span>
          </div>
          <span className="font-semibold text-slate-900">{entry.value.toFixed(0)} cr</span>
        </div>
      ))}
      <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between">
        <span className="text-xs text-slate-600">Total</span>
        <span className="text-xs font-bold text-slate-900">{total.toFixed(0)} cr</span>
      </div>
    </div>
  );
}

export default function AgentCostChart({ data, isLoading }: AgentCostChartProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">
          Credits Used (Last 30 Days)
        </h3>
        <SkeletonChart />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">
          Credits Used (Last 30 Days)
        </h3>
        <EmptyState />
      </div>
    );
  }

  // Calculate total credits
  const totalCredits = data.reduce((sum, day) => {
    return sum + (day.luna + day.sora + day.marcus + day.milo + day.doffy);
  }, 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900">
          Credits Used (Last 30 Days)
        </h3>
        <div className="text-sm">
          <span className="text-slate-500">Total: </span>
          <span className="font-bold text-slate-900">{totalCredits.toFixed(0)} credits</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorLuna" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={AGENT_COLORS.luna} stopOpacity={0.8} />
              <stop offset="95%" stopColor={AGENT_COLORS.luna} stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="colorSora" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={AGENT_COLORS.sora} stopOpacity={0.8} />
              <stop offset="95%" stopColor={AGENT_COLORS.sora} stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="colorMarcus" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={AGENT_COLORS.marcus} stopOpacity={0.8} />
              <stop offset="95%" stopColor={AGENT_COLORS.marcus} stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="colorMilo" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={AGENT_COLORS.milo} stopOpacity={0.8} />
              <stop offset="95%" stopColor={AGENT_COLORS.milo} stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="colorDoffy" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={AGENT_COLORS.doffy} stopOpacity={0.8} />
              <stop offset="95%" stopColor={AGENT_COLORS.doffy} stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="date"
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}cr`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
            formatter={(value) => (
              <span className="text-sm text-slate-700 capitalize">{value}</span>
            )}
          />
          <Area
            type="monotone"
            dataKey="luna"
            stackId="1"
            stroke={AGENT_COLORS.luna}
            fill="url(#colorLuna)"
            name="Luna"
          />
          <Area
            type="monotone"
            dataKey="sora"
            stackId="1"
            stroke={AGENT_COLORS.sora}
            fill="url(#colorSora)"
            name="Sora"
          />
          <Area
            type="monotone"
            dataKey="marcus"
            stackId="1"
            stroke={AGENT_COLORS.marcus}
            fill="url(#colorMarcus)"
            name="Marcus"
          />
          <Area
            type="monotone"
            dataKey="milo"
            stackId="1"
            stroke={AGENT_COLORS.milo}
            fill="url(#colorMilo)"
            name="Milo"
          />
          <Area
            type="monotone"
            dataKey="doffy"
            stackId="1"
            stroke={AGENT_COLORS.doffy}
            fill="url(#colorDoffy)"
            name="Doffy"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
