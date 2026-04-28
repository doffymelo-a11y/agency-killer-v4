import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { AnalyticsChart } from '../../types';

interface ChartWidgetProps {
  chart: AnalyticsChart;
}

const DEFAULT_COLORS = ['#06B6D4', '#8B5CF6', '#F59E0B', '#EC4899', '#10B981'];

export default function ChartWidget({ chart }: ChartWidgetProps) {
  const colors = chart.colors || DEFAULT_COLORS;
  const height = chart.height || 300;
  const showLegend = chart.showLegend ?? true;
  const showGrid = chart.showGrid ?? true;

  const renderChart = () => {
    switch (chart.type) {
      case 'line':
        return (
          <LineChart data={chart.data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />}
            <XAxis
              dataKey={chart.xKey}
              stroke="#64748B"
              style={{ fontSize: '12px' }}
            />
            <YAxis stroke="#64748B" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFF',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
              }}
            />
            {showLegend && <Legend />}
            {chart.yKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart data={chart.data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />}
            <XAxis
              dataKey={chart.xKey}
              stroke="#64748B"
              style={{ fontSize: '12px' }}
            />
            <YAxis stroke="#64748B" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFF',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
              }}
            />
            {showLegend && <Legend />}
            {chart.yKeys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                fill={colors[index % colors.length]}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        );

      case 'area':
        return (
          <AreaChart data={chart.data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />}
            <XAxis
              dataKey={chart.xKey}
              stroke="#64748B"
              style={{ fontSize: '12px' }}
            />
            <YAxis stroke="#64748B" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFF',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
              }}
            />
            {showLegend && <Legend />}
            {chart.yKeys.map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                fill={colors[index % colors.length]}
                stroke={colors[index % colors.length]}
                fillOpacity={0.2}
              />
            ))}
          </AreaChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={chart.data}
              dataKey={chart.yKeys[0]}
              nameKey={chart.xKey}
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
            >
              {chart.data.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
            {showLegend && <Legend />}
          </PieChart>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
      {chart.title && (
        <h3 className="text-lg font-semibold text-slate-900 mb-4">{chart.title}</h3>
      )}

      {chart.data.length === 0 ? (
        <div className="flex items-center justify-center h-[300px] bg-slate-50 rounded-lg">
          <p className="text-slate-500">Aucune donnée disponible</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          {renderChart()}
        </ResponsiveContainer>
      )}
    </div>
  );
}
