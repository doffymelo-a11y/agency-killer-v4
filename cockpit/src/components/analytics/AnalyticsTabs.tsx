import { BarChart3, TrendingUp, Search, Globe } from 'lucide-react';
import type { AnalyticsSource } from '../../types';

interface AnalyticsTabsProps {
  activeSource: AnalyticsSource;
  onSourceChange: (source: AnalyticsSource) => void;
}

export default function AnalyticsTabs({ activeSource, onSourceChange }: AnalyticsTabsProps) {
  const tabs: Array<{ id: AnalyticsSource; label: string; Icon: any }> = [
    { id: 'overview', label: 'Vue d\'ensemble', Icon: BarChart3 },
    { id: 'ga4', label: 'Google Analytics', Icon: Globe },
    { id: 'meta_ads', label: 'Meta Ads', Icon: TrendingUp },
    { id: 'google_ads', label: 'Google Ads', Icon: TrendingUp },
    { id: 'gsc', label: 'Search Console', Icon: Search },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
      {tabs.map((tab) => {
        const Icon = tab.Icon;
        const isActive = activeSource === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onSourceChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-medium text-sm transition-all whitespace-nowrap ${
              isActive
                ? 'bg-white text-slate-900 border-l border-r border-t border-slate-200 -mb-px'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
