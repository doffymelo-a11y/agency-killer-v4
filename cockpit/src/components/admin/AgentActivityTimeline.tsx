/**
 * AgentActivityTimeline - Timeline of recent agent actions
 * Sprint 3.2 - Admin Monitoring Dashboard
 */

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ChevronDown, ExternalLink, Info } from 'lucide-react';
import type { AgentActivity } from '../../services/admin.service';

interface AgentActivityTimelineProps {
  activities: AgentActivity[];
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

const AGENT_CONFIG: Record<string, { name: string; color: string; bg: string; dotColor: string }> = {
  luna: {
    name: 'Luna',
    color: 'text-purple-700',
    bg: 'bg-purple-100',
    dotColor: 'bg-purple-500'
  },
  sora: {
    name: 'Sora',
    color: 'text-blue-700',
    bg: 'bg-blue-100',
    dotColor: 'bg-blue-500'
  },
  marcus: {
    name: 'Marcus',
    color: 'text-green-700',
    bg: 'bg-green-100',
    dotColor: 'bg-green-500'
  },
  milo: {
    name: 'Milo',
    color: 'text-orange-700',
    bg: 'bg-orange-100',
    dotColor: 'bg-orange-500'
  },
  doffy: {
    name: 'Doffy',
    color: 'text-pink-700',
    bg: 'bg-pink-100',
    dotColor: 'bg-pink-500'
  },
};

const ACTION_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  TASK_COMPLETED: {
    label: 'Task Completed',
    color: 'text-emerald-700',
    bg: 'bg-emerald-100'
  },
  STRATEGY_VALIDATED: {
    label: 'Strategy Validated',
    color: 'text-blue-700',
    bg: 'bg-blue-100'
  },
  DELIVERABLE_CREATED: {
    label: 'Deliverable Created',
    color: 'text-purple-700',
    bg: 'bg-purple-100'
  },
  ANALYSIS_COMPLETED: {
    label: 'Analysis Completed',
    color: 'text-cyan-700',
    bg: 'bg-cyan-100'
  },
  RECOMMENDATION_GENERATED: {
    label: 'Recommendation',
    color: 'text-amber-700',
    bg: 'bg-amber-100'
  },
  ERROR_OCCURRED: {
    label: 'Error',
    color: 'text-red-700',
    bg: 'bg-red-100'
  },
};

function ActivityItem({ activity }: { activity: AgentActivity }) {
  const [showRecommendations, setShowRecommendations] = useState(false);
  const agentConfig = AGENT_CONFIG[activity.agent_id] || {
    name: activity.agent_id,
    color: 'text-slate-700',
    bg: 'bg-slate-100',
    dotColor: 'bg-slate-500'
  };

  const actionConfig = ACTION_TYPE_CONFIG[activity.action_type] || {
    label: activity.action_type,
    color: 'text-slate-700',
    bg: 'bg-slate-100'
  };

  const hasDeliverables = activity.deliverables && Object.keys(activity.deliverables).length > 0;
  const hasRecommendations = activity.recommendations && Array.isArray(activity.recommendations) && activity.recommendations.length > 0;

  return (
    <div className="relative flex gap-4 pb-6 last:pb-0">
      {/* Timeline line and dot */}
      <div className="relative flex flex-col items-center">
        {/* Dot */}
        <div className={`w-3 h-3 rounded-full ${agentConfig.dotColor} border-2 border-white shadow-sm z-10`} />
        {/* Vertical line */}
        <div className="absolute top-3 bottom-0 w-px bg-slate-200" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0">
        {/* Header */}
        <div className="flex items-start gap-2 mb-2">
          {/* Timestamp */}
          <span className="text-xs text-slate-500 whitespace-nowrap">
            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
          </span>

          {/* Agent badge */}
          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${agentConfig.bg} ${agentConfig.color}`}>
            {agentConfig.name}
          </span>

          {/* Action type badge */}
          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${actionConfig.bg} ${actionConfig.color}`}>
            {actionConfig.label}
          </span>
        </div>

        {/* Summary */}
        <p className="text-sm text-slate-700 mb-2">{activity.summary}</p>

        {/* Project name */}
        {activity.project_name && (
          <p className="text-xs text-slate-500 mb-2">
            Project: <span className="font-medium text-slate-700">{activity.project_name}</span>
          </p>
        )}

        {/* Deliverables link */}
        {hasDeliverables && (
          <a
            href={`/projects/${activity.project_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:underline mb-2"
          >
            <ExternalLink className="w-3 h-3" />
            Voir le livrable
          </a>
        )}

        {/* Recommendations */}
        {hasRecommendations && (
          <div className="mt-2">
            <button
              onClick={() => setShowRecommendations(!showRecommendations)}
              className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-800 transition"
            >
              <Info className="w-3 h-3" />
              {activity.recommendations.length} recommandation(s)
              <ChevronDown className={`w-3 h-3 transition-transform ${showRecommendations ? 'rotate-180' : ''}`} />
            </button>

            {showRecommendations && (
              <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <ul className="space-y-1 text-xs text-slate-700">
                  {activity.recommendations.map((rec: string, idx: number) => (
                    <li key={idx} className="flex gap-2">
                      <span className="text-slate-400">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SkeletonItem() {
  return (
    <div className="relative flex gap-4 pb-6">
      <div className="relative flex flex-col items-center">
        <div className="w-3 h-3 rounded-full bg-slate-200" />
        <div className="absolute top-3 bottom-0 w-px bg-slate-200" />
      </div>
      <div className="flex-1 animate-pulse">
        <div className="flex gap-2 mb-2">
          <div className="h-4 bg-slate-200 rounded w-20" />
          <div className="h-4 bg-slate-200 rounded w-16" />
          <div className="h-4 bg-slate-200 rounded w-24" />
        </div>
        <div className="h-4 bg-slate-100 rounded w-full mb-2" />
        <div className="h-3 bg-slate-100 rounded w-1/2" />
      </div>
    </div>
  );
}

export default function AgentActivityTimeline({
  activities,
  isLoading,
  onLoadMore,
  hasMore = false
}: AgentActivityTimelineProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">Agent Activity Timeline</h3>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonItem key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Info className="w-8 h-8 text-slate-400" />
        </div>
        <p className="text-slate-600 font-medium">Aucune activité récente</p>
        <p className="text-sm text-slate-500 mt-1">Les actions des agents apparaîtront ici</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-6">
        Agent Activity Timeline ({activities.length})
      </h3>

      <div className="space-y-0">
        {activities.map((activity) => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </div>

      {/* Load More */}
      {hasMore && onLoadMore && (
        <div className="mt-6 text-center">
          <button
            onClick={onLoadMore}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
