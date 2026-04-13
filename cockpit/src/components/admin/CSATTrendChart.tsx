/**
 * CSATTrendChart - Line chart of CSAT scores over time
 * Sprint 4.4 - Admin Monitoring Dashboard
 */

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Star } from 'lucide-react';

interface CSATDataPoint {
  date: string;
  score: number;
}

interface CSATTrendChartProps {
  data?: CSATDataPoint[];
  isLoading?: boolean;
}

// Generate mock CSAT data for last 30 days
function generateMockCSATData(): CSATDataPoint[] {
  const data: CSATDataPoint[] = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });

    // Generate score between 3.5 and 4.8 with some variance
    const baseScore = 4.2;
    const variance = (Math.random() - 0.5) * 1.2;
    const score = Math.max(3.0, Math.min(5.0, baseScore + variance));

    data.push({
      date: dateStr,
      score: parseFloat(score.toFixed(2)),
    });
  }

  return data;
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-[400px]">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
        <Star className="w-8 h-8 text-slate-400" />
      </div>
      <p className="text-slate-600 font-medium">Aucune donnée CSAT disponible</p>
      <p className="text-sm text-slate-500 mt-1">Les scores apparaîtront une fois que des tickets seront évalués</p>
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
          style={{ height: `${50 + Math.random() * 50}%` }}
        />
      ))}
    </div>
  );
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const data = payload[0];
  const score = data.value;

  // Determine color based on score
  let scoreColor = 'text-emerald-600';
  let scoreBg = 'bg-emerald-100';
  if (score < 3.0) {
    scoreColor = 'text-red-600';
    scoreBg = 'bg-red-100';
  } else if (score < 4.0) {
    scoreColor = 'text-amber-600';
    scoreBg = 'bg-amber-100';
  }

  return (
    <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
      <p className="text-sm font-semibold text-slate-900 mb-2">{data.payload.date}</p>
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded ${scoreBg}`}>
        <Star className={`w-4 h-4 ${scoreColor} fill-current`} />
        <span className={`text-sm font-bold ${scoreColor}`}>
          {score.toFixed(2)} / 5.00
        </span>
      </div>
    </div>
  );
}

export default function CSATTrendChart({ data, isLoading }: CSATTrendChartProps) {
  // Use provided data or generate mock data
  const chartData = data || generateMockCSATData();

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">
          CSAT Trend (Last 30 Days)
        </h3>
        <SkeletonChart />
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">
          CSAT Trend (Last 30 Days)
        </h3>
        <EmptyState />
      </div>
    );
  }

  // Calculate average CSAT
  const avgCSAT = chartData.reduce((sum, item) => sum + item.score, 0) / chartData.length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900">
          CSAT Trend (Last 30 Days)
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Average:</span>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
            <span className="font-bold text-slate-900">{avgCSAT.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />

          {/* Reference lines for score zones */}
          <ReferenceLine
            y={4.0}
            stroke="#10b981"
            strokeDasharray="3 3"
            label={{ value: 'Excellent (4.0+)', position: 'right', fill: '#10b981', fontSize: 12 }}
          />
          <ReferenceLine
            y={3.0}
            stroke="#f59e0b"
            strokeDasharray="3 3"
            label={{ value: 'Good (3.0+)', position: 'right', fill: '#f59e0b', fontSize: 12 }}
          />

          <XAxis
            dataKey="date"
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[1, 5]}
            ticks={[1, 2, 3, 4, 5]}
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            label={{ value: 'Score (1-5)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
          />

          <Tooltip content={<CustomTooltip />} />

          <Line
            type="monotone"
            dataKey="score"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ fill: '#3b82f6', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-emerald-500 rounded" />
          <span className="text-slate-600">Excellent (4.0+)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-amber-500 rounded" />
          <span className="text-slate-600">Good (3.0-4.0)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded" />
          <span className="text-slate-600">Poor (&lt; 3.0)</span>
        </div>
      </div>
    </div>
  );
}
