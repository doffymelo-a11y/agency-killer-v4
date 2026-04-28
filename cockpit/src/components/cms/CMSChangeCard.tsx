// ═══════════════════════════════════════════════════════════════
// CMS Change Card Component
// Individual change card with diff viewer and action buttons
// Phase 4.5 - CMS Connector Frontend UI
// ═══════════════════════════════════════════════════════════════

import { motion } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Globe,
  ShoppingBag,
  Layout,
  Loader2,
  Bot,
  ExternalLink,
} from 'lucide-react';
import type { CMSChange } from '../../types/cms.types';

interface CMSChangeCardProps {
  change: CMSChange;
  onApprove: () => void;
  onRollback: () => void;
  isProcessing: boolean;
}

const CMS_ICONS = {
  wordpress: Globe,
  shopify: ShoppingBag,
  webflow: Layout,
};

const CMS_COLORS = {
  wordpress: 'text-blue-600 bg-blue-50',
  shopify: 'text-green-600 bg-green-50',
  webflow: 'text-purple-600 bg-purple-50',
};

const ACTION_COLORS = {
  create: 'text-green-600 bg-green-50',
  update: 'text-orange-600 bg-orange-50',
  delete: 'text-red-600 bg-red-50',
};

export default function CMSChangeCard({
  change,
  onApprove,
  onRollback,
  isProcessing,
}: CMSChangeCardProps) {
  const CMSIcon = CMS_ICONS[change.cms_type as keyof typeof CMS_ICONS] || Globe;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm"
    >
      {/* Header */}
      <div className="p-5 border-b border-slate-200">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-lg ${
                CMS_COLORS[change.cms_type as keyof typeof CMS_COLORS]
              }`}
            >
              <CMSIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                {change.change_summary.content_title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-500">{change.content_type}</span>
                <span className="text-xs text-slate-300">•</span>
                <span className="text-xs text-slate-500">{change.site_url}</span>
              </div>
            </div>
          </div>

          {/* Action Badge */}
          <div
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${
              ACTION_COLORS[change.action as keyof typeof ACTION_COLORS]
            }`}
          >
            {change.action === 'create' ? 'Création' : ''}
            {change.action === 'update' ? 'Modification' : ''}
            {change.action === 'delete' ? 'Suppression' : ''}
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-4 text-xs text-slate-500">
          {change.executed_by_agent && (
            <div className="flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5" />
              <span>Agent : {change.executed_by_agent}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{new Date(change.created_at).toLocaleString('fr-FR')}</span>
          </div>
        </div>
      </div>

      {/* Diff Viewer */}
      {change.change_summary.changes.length > 0 && (
        <div className="p-5 bg-slate-50">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">
            Champs modifiés ({change.change_summary.fields_changed.length})
          </h4>
          <div className="space-y-3">
            {change.change_summary.changes.map((diff, i) => (
              <div key={i} className="bg-white rounded-lg p-3 border-l-4 border-orange-500">
                <p className="text-sm font-medium text-slate-700 mb-2">{diff.field}</p>
                <div className="space-y-1.5">
                  {/* Before */}
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-red-600 font-bold mt-0.5">−</span>
                    <div className="flex-1 bg-red-50 border border-red-200 rounded px-2 py-1.5">
                      <span className="text-sm text-red-900 line-through break-words">
                        {diff.before}
                      </span>
                    </div>
                  </div>
                  {/* After */}
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-green-600 font-bold mt-0.5">+</span>
                    <div className="flex-1 bg-green-50 border border-green-200 rounded px-2 py-1.5">
                      <span className="text-sm text-green-900 break-words">{diff.after}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
        <a
          href={change.site_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-cyan-600 hover:text-cyan-700 flex items-center gap-1.5 font-medium"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Voir le site
        </a>

        <div className="flex items-center gap-2">
          <button
            onClick={onRollback}
            disabled={isProcessing}
            className="px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
            Rejeter
          </button>
          <button
            onClick={onApprove}
            disabled={isProcessing}
            className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            Approuver
          </button>
        </div>
      </div>
    </motion.div>
  );
}
