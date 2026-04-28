// ═══════════════════════════════════════════════════════════════
// CMS Change Preview Component
// Display pending CMS changes with diff viewer and approval actions
// Phase 4.4 - CMS Connector Frontend UI
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCurrentProject } from '../../store/useHiveStore';
import type { CMSChange } from '../../types/cms.types';
import CMSChangeCard from './CMSChangeCard';

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3457';

interface CMSChangePreviewProps {
  onChangeApproved?: () => void;
}

export default function CMSChangePreview({ onChangeApproved }: CMSChangePreviewProps) {
  const currentProject = useCurrentProject();
  const [pendingChanges, setPendingChanges] = useState<CMSChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // ─────────────────────────────────────────────────────────────────
  // Fetch Pending Changes
  // ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!currentProject) return;
    fetchPendingChanges();
  }, [currentProject]);

  const fetchPendingChanges = async () => {
    if (!currentProject) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cms_change_log')
        .select('*')
        .eq('project_id', currentProject.id)
        .eq('requires_approval', true)
        .eq('approved', false)
        .eq('rolled_back', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingChanges((data || []) as CMSChange[]);
    } catch (error) {
      console.error('[CMSChangePreview] Error fetching pending changes:', error);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // Approve Change
  // ─────────────────────────────────────────────────────────────────

  const handleApprove = async (changeId: string) => {
    setProcessingId(changeId);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Non authentifié');

      const { error } = await supabase
        .from('cms_change_log')
        .update({
          approved: true,
          approved_at: new Date().toISOString(),
          approved_by: userData.user.id,
        })
        .eq('change_id', changeId);

      if (error) throw error;

      // Refresh list
      await fetchPendingChanges();

      // Callback
      if (onChangeApproved) {
        onChangeApproved();
      }
    } catch (error: any) {
      console.error('[CMSChangePreview] Error approving change:', error);
      alert(`Erreur approbation : ${error.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // Rollback Change
  // ─────────────────────────────────────────────────────────────────

  const handleRollback = async (changeId: string) => {
    const reason = prompt('Raison du rejet (optionnel) :');

    setProcessingId(changeId);

    try {
      const response = await fetch(`${BACKEND_API_URL}/api/cms/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ change_id: changeId, reason: reason || '' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Rollback failed');
      }

      // Refresh list
      await fetchPendingChanges();
    } catch (error: any) {
      console.error('[CMSChangePreview] Error rolling back change:', error);
      alert(`Erreur rollback : ${error.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
      </div>
    );
  }

  if (pendingChanges.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          Aucun changement en attente
        </h3>
        <p className="text-slate-500 text-sm">
          Tous les changements CMS ont été approuvés ou rejetés
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-orange-500" />
            Changements CMS en attente
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {pendingChanges.length} changement{pendingChanges.length > 1 ? 's' : ''} nécessite
            {pendingChanges.length > 1 ? 'nt' : ''} votre approbation
          </p>
        </div>
      </div>

      {/* Changes List */}
      <div className="space-y-3">
        {pendingChanges.map((change) => (
          <CMSChangeCard
            key={change.change_id}
            change={change}
            onApprove={() => handleApprove(change.change_id)}
            onRollback={() => handleRollback(change.change_id)}
            isProcessing={processingId === change.change_id}
          />
        ))}
      </div>
    </div>
  );
}
