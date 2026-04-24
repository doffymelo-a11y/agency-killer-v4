// ═══════════════════════════════════════════════════════════════
// Tabs Component - Dark Theme
// Pill-style tabs with count badges
// ═══════════════════════════════════════════════════════════════

import { cn } from '../../lib/cn';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
            activeTab === tab.id
              ? 'bg-cyan-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
          )}
        >
          {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
          <span>{tab.label}</span>
          {tab.count !== undefined && (
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-xs font-bold',
                activeTab === tab.id
                  ? 'bg-cyan-700 text-cyan-100'
                  : 'bg-slate-700 text-slate-300'
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
