/**
 * CMS Service - Execute and rollback CMS changes
 * Manages CMS change log and interacts with MCP Bridge
 */

import { supabaseAdmin } from './supabase.service.js';
import { mcpBridge } from './mcp-bridge.service.js';
import type {
  CMSExecuteRequest,
  CMSRollbackRequest,
  CMSExecuteResponse,
  CMSRollbackResponse,
} from '../types/api.types.js';

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

interface CMSChangeLogRecord {
  id: string;
  user_id: string;
  project_id: string | null;
  change_id: string;
  cms_type: string;
  site_url: string;
  content_type: string;
  content_id: string;
  action: string;
  previous_state: any;
  new_state: any;
  change_summary: any;
  requires_approval: boolean;
  approved: boolean;
  approved_at: string | null;
  approved_by: string | null;
  rolled_back: boolean;
  rolled_back_at: string | null;
  rolled_back_by: string | null;
  rollback_reason: string | null;
  executed_by_agent: string | null;
  mcp_tool_name: string | null;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────────
// Execute CMS Change
// ─────────────────────────────────────────────────────────────────

export async function executeCMSChange(
  request: CMSExecuteRequest,
  userId: string
): Promise<CMSExecuteResponse> {
  try {
    // 1. Récupérer le change log record
    const { data: changeRecord, error: fetchError } = await supabaseAdmin
      .from('cms_change_log')
      .select('*')
      .eq('change_id', request.change_id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !changeRecord) {
      return {
        success: false,
        message: 'Change record not found',
        error: fetchError?.message,
      };
    }

    const record = changeRecord as CMSChangeLogRecord;

    // 2. Vérifier que le changement n'est pas déjà rolled back
    if (record.rolled_back) {
      return {
        success: false,
        message: 'Change has been rolled back and cannot be executed',
      };
    }

    // 3. Vérifier que le changement requiert approval et n'est pas encore approuvé
    if (record.requires_approval && !record.approved) {
      return {
        success: false,
        message: 'Change requires approval before execution',
      };
    }

    // 4. Si déjà approuvé, exécuter le changement via MCP Bridge
    if (record.approved) {
      // Exécuter via MCP Bridge
      // Le changement a déjà été appliqué au moment de la création du record
      // Cette fonction sert surtout à marquer comme exécuté si besoin

      return {
        success: true,
        message: 'Change executed successfully',
        change_id: record.change_id,
        result: record.new_state,
      };
    }

    // 5. Si pas besoin d'approval (ex: create draft), exécuter directement
    // Le changement a normalement déjà été appliqué par l'agent
    // Mais on peut re-valider ici si nécessaire

    return {
      success: true,
      message: 'Change executed successfully',
      change_id: record.change_id,
      result: record.new_state,
    };
  } catch (error) {
    console.error('[CMS Service] Execute error:', error);
    return {
      success: false,
      message: 'Failed to execute CMS change',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ─────────────────────────────────────────────────────────────────
// Rollback CMS Change
// ─────────────────────────────────────────────────────────────────

export async function rollbackCMSChange(
  request: CMSRollbackRequest,
  userId: string
): Promise<CMSRollbackResponse> {
  try {
    // 1. Récupérer le change log record
    const { data: changeRecord, error: fetchError } = await supabaseAdmin
      .from('cms_change_log')
      .select('*')
      .eq('change_id', request.change_id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !changeRecord) {
      return {
        success: false,
        message: 'Change record not found',
        error: fetchError?.message,
      };
    }

    const record = changeRecord as CMSChangeLogRecord;

    // 2. Vérifier que le changement n'est pas déjà rolled back
    if (record.rolled_back) {
      return {
        success: false,
        message: 'Change has already been rolled back',
      };
    }

    // 3. Récupérer les credentials CMS depuis user_integrations
    const { data: integrations, error: integrationsError } = await supabaseAdmin
      .from('user_integrations')
      .select('encrypted_credentials')
      .eq('user_id', userId)
      .eq('type', record.cms_type)
      .single();

    if (integrationsError || !integrations) {
      return {
        success: false,
        message: 'CMS credentials not found',
        error: integrationsError?.message,
      };
    }

    // 4. Décrypter les credentials (TODO: implémenter decryption)
    const credentials = integrations.encrypted_credentials; // Assume already decrypted for now

    // 5. Déterminer l'outil MCP à utiliser pour rollback
    let mcpTool: string;
    let mcpArgs: any;

    switch (record.action) {
      case 'create':
        // Rollback create → delete
        mcpTool = 'delete_cms_post'; // ou page/product selon content_type
        mcpArgs = {
          credentials,
          post_id: record.content_id,
        };
        break;

      case 'update':
        // Rollback update → restore previous state
        mcpTool =
          record.content_type === 'post' ? 'update_cms_post' : 'update_cms_page';
        mcpArgs = {
          credentials,
          [`${record.content_type}_id`]: record.content_id,
          ...record.previous_state,
        };
        break;

      case 'delete':
        // Rollback delete → restore (WordPress untrash)
        // Note: WordPress REST API ne supporte pas untrash direct
        // Nécessite plugin ou workaround
        return {
          success: false,
          message: 'Cannot rollback delete operation (not supported by WordPress REST API)',
        };

      default:
        return {
          success: false,
          message: `Unknown action type: ${record.action}`,
        };
    }

    // 6. Exécuter le rollback via MCP Bridge
    const mcpResult = await mcpBridge.call('cms-connector', mcpTool, mcpArgs);

    if (!mcpResult.success) {
      return {
        success: false,
        message: 'Failed to execute rollback via MCP',
        error: mcpResult.error,
      };
    }

    // 7. Marquer comme rolled back dans cms_change_log
    const { error: updateError } = await supabaseAdmin
      .from('cms_change_log')
      .update({
        rolled_back: true,
        rolled_back_at: new Date().toISOString(),
        rolled_back_by: userId,
        rollback_reason: request.reason || 'User requested rollback',
        updated_at: new Date().toISOString(),
      })
      .eq('change_id', request.change_id);

    if (updateError) {
      console.error('[CMS Service] Failed to update cms_change_log:', updateError);
      return {
        success: false,
        message: 'Rollback executed but failed to update change log',
        error: updateError.message,
      };
    }

    return {
      success: true,
      message: 'Change rolled back successfully',
      change_id: record.change_id,
    };
  } catch (error) {
    console.error('[CMS Service] Rollback error:', error);
    return {
      success: false,
      message: 'Failed to rollback CMS change',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ─────────────────────────────────────────────────────────────────
// Get Pending CMS Approvals
// ─────────────────────────────────────────────────────────────────

export async function getPendingCMSApprovals(userId: string): Promise<any[]> {
  try {
    // Utiliser la fonction Supabase helper
    const { data, error } = await supabaseAdmin.rpc('get_pending_cms_approvals', {
      p_user_id: userId,
    });

    if (error) {
      console.error('[CMS Service] Failed to fetch pending approvals:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[CMS Service] Get pending error:', error);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────
// Record CMS Change (appelé par les agents)
// ─────────────────────────────────────────────────────────────────

export async function recordCMSChange(params: {
  user_id: string;
  project_id: string | null;
  change_id: string;
  cms_type: string;
  site_url: string;
  content_type: string;
  content_id: string;
  action: string;
  previous_state: any;
  new_state: any;
  change_summary: any;
  requires_approval: boolean;
  executed_by_agent: string;
  mcp_tool_name: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('cms_change_log')
      .insert({
        user_id: params.user_id,
        project_id: params.project_id,
        change_id: params.change_id,
        cms_type: params.cms_type,
        site_url: params.site_url,
        content_type: params.content_type,
        content_id: params.content_id,
        action: params.action,
        previous_state: params.previous_state,
        new_state: params.new_state,
        change_summary: params.change_summary,
        requires_approval: params.requires_approval,
        approved: !params.requires_approval, // Auto-approved si pas besoin d'approval
        executed_by_agent: params.executed_by_agent,
        mcp_tool_name: params.mcp_tool_name,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[CMS Service] Failed to record change:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      id: data.id,
    };
  } catch (error) {
    console.error('[CMS Service] Record change error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
