// ═══════════════════════════════════════════════════════════════
// Change Recorder
// Enregistre tous les changements CMS pour rollback
// Stockage in-memory (sera remplacé par Supabase cms_change_log)
// ═══════════════════════════════════════════════════════════════

import type { MutationResult, ChangeSummary } from '../types.js';

export interface ChangeRecord {
  change_id: string;
  cms_type: 'wordpress' | 'shopify' | 'webflow';
  site_url: string;
  content_type: 'post' | 'page' | 'product';
  content_id: string;
  action: 'create' | 'update' | 'delete';
  previous_state: any; // JSON snapshot de l'état avant modification
  new_state?: any; // JSON snapshot après modification (pour create/update)
  change_summary: ChangeSummary;
  requires_approval: boolean;
  approved: boolean;
  executed_at: string; // ISO timestamp
  approved_at?: string;
  approved_by?: string; // user_id
  rolled_back: boolean;
  rolled_back_at?: string;
}

/**
 * Change Recorder - Enregistre les modifications CMS
 * Version in-memory pour Phase 1
 * Phase 2 : remplacer par insert Supabase cms_change_log
 */
export class ChangeRecorder {
  private records: Map<string, ChangeRecord> = new Map();

  /**
   * Enregistre un changement
   */
  record(
    changeId: string,
    options: {
      cms_type: 'wordpress' | 'shopify' | 'webflow';
      site_url: string;
      content_type: 'post' | 'page' | 'product';
      content_id: string;
      action: 'create' | 'update' | 'delete';
      previous_state: any;
      new_state?: any;
      change_summary: ChangeSummary;
      requires_approval: boolean;
    }
  ): ChangeRecord {
    const record: ChangeRecord = {
      change_id: changeId,
      cms_type: options.cms_type,
      site_url: options.site_url,
      content_type: options.content_type,
      content_id: options.content_id,
      action: options.action,
      previous_state: options.previous_state,
      new_state: options.new_state,
      change_summary: options.change_summary,
      requires_approval: options.requires_approval,
      approved: !options.requires_approval, // Auto-approuvé si pas besoin d'approval
      executed_at: new Date().toISOString(),
      rolled_back: false,
    };

    this.records.set(changeId, record);
    return record;
  }

  /**
   * Récupère un changement par ID
   */
  get(changeId: string): ChangeRecord | undefined {
    return this.records.get(changeId);
  }

  /**
   * Liste tous les changements d'un site
   */
  listBySite(siteUrl: string): ChangeRecord[] {
    return Array.from(this.records.values()).filter(
      (record) => record.site_url === siteUrl
    );
  }

  /**
   * Liste les changements en attente d'approval
   */
  listPendingApprovals(siteUrl?: string): ChangeRecord[] {
    return Array.from(this.records.values()).filter(
      (record) =>
        record.requires_approval &&
        !record.approved &&
        !record.rolled_back &&
        (!siteUrl || record.site_url === siteUrl)
    );
  }

  /**
   * Approuve un changement
   */
  approve(changeId: string, approvedBy: string): ChangeRecord {
    const record = this.records.get(changeId);
    if (!record) {
      throw new Error(`Change record not found: ${changeId}`);
    }

    if (record.rolled_back) {
      throw new Error('Cannot approve a rolled-back change');
    }

    record.approved = true;
    record.approved_at = new Date().toISOString();
    record.approved_by = approvedBy;

    return record;
  }

  /**
   * Marque un changement comme rollback
   */
  markRolledBack(changeId: string): ChangeRecord {
    const record = this.records.get(changeId);
    if (!record) {
      throw new Error(`Change record not found: ${changeId}`);
    }

    record.rolled_back = true;
    record.rolled_back_at = new Date().toISOString();

    return record;
  }

  /**
   * Récupère le previous_state pour rollback
   */
  getPreviousState(changeId: string): any {
    const record = this.records.get(changeId);
    if (!record) {
      throw new Error(`Change record not found: ${changeId}`);
    }

    return record.previous_state;
  }

  /**
   * Supprime tous les records (cleanup pour testing)
   */
  clear(): void {
    this.records.clear();
  }

  /**
   * Retourne les statistiques
   */
  getStats(siteUrl?: string): {
    total: number;
    pending_approval: number;
    approved: number;
    rolled_back: number;
  } {
    const records = siteUrl
      ? this.listBySite(siteUrl)
      : Array.from(this.records.values());

    return {
      total: records.length,
      pending_approval: records.filter(
        (r) => r.requires_approval && !r.approved && !r.rolled_back
      ).length,
      approved: records.filter((r) => r.approved).length,
      rolled_back: records.filter((r) => r.rolled_back).length,
    };
  }
}

// Instance singleton globale
export const globalChangeRecorder = new ChangeRecorder();

/**
 * Helper : Enregistre un MutationResult dans le recorder
 */
export function recordMutation(
  result: MutationResult,
  options: {
    cms_type: 'wordpress' | 'shopify' | 'webflow';
    site_url: string;
    action: 'create' | 'update' | 'delete';
  }
): ChangeRecord {
  if (!result.change_summary) {
    throw new Error('MutationResult must have change_summary');
  }

  return globalChangeRecorder.record(result.change_id, {
    cms_type: options.cms_type,
    site_url: options.site_url,
    content_type: result.change_summary.content_type,
    content_id: result.change_summary.content_id,
    action: options.action,
    previous_state: result.previous_state,
    change_summary: result.change_summary,
    requires_approval: result.requires_approval || false,
  });
}
