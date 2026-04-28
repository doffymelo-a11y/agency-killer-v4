import { Calendar } from 'lucide-react';
import type { AnalyticsDateRange } from '../../types';

interface DateRangeSelectorProps {
  dateRange: AnalyticsDateRange;
  onChange: (range: AnalyticsDateRange) => void;
}

export default function DateRangeSelector({ dateRange, onChange }: DateRangeSelectorProps) {
  const presets = [
    { value: '7d', label: '7 derniers jours' },
    { value: '30d', label: '30 derniers jours' },
    { value: '90d', label: '90 derniers jours' },
    { value: 'custom', label: 'Personnalisé' },
  ];

  const handlePresetChange = (preset: '7d' | '30d' | '90d' | 'custom') => {
    const end = new Date();
    let start = new Date();

    switch (preset) {
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
      case 'custom':
        // Keep current dates for custom
        onChange({ ...dateRange, preset: 'custom' });
        return;
    }

    onChange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
      preset,
    });
  };

  return (
    <div className="flex items-center gap-3">
      <Calendar className="w-5 h-5 text-slate-400" />

      <div className="flex items-center gap-2">
        {presets.map((preset) => (
          <button
            key={preset.value}
            onClick={() => handlePresetChange(preset.value as any)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              dateRange.preset === preset.value
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {dateRange.preset === 'custom' && (
        <div className="flex items-center gap-2 ml-3">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => onChange({ ...dateRange, start: e.target.value })}
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg"
          />
          <span className="text-sm text-slate-500">→</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => onChange({ ...dateRange, end: e.target.value })}
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg"
          />
        </div>
      )}
    </div>
  );
}
