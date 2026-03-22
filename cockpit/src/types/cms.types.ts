/**
 * CMS Types - Frontend types for CMS Connector
 * Phase 4.1 - CMS Connection & Approval UI
 */

// ─────────────────────────────────────────────────────────────────
// CMS Connection Types
// ─────────────────────────────────────────────────────────────────

export type CMSType = 'wordpress' | 'shopify' | 'webflow';

export interface CMSCredentials {
  cms_type: CMSType;
  site_url: string;
  auth: {
    username?: string; // WordPress
    app_password?: string; // WordPress
    api_key?: string; // Shopify / Webflow
    site_id?: string; // Webflow
  };
}

export interface CMSConnectionFormData {
  site_url: string;
  username: string; // WordPress
  app_password: string; // WordPress
  api_key: string; // Shopify / Webflow
  site_id: string; // Webflow
}

export interface CMSTestResult {
  success: boolean;
  message: string;
  site_info?: {
    name: string;
    version: string;
    theme?: string;
  };
}

// ─────────────────────────────────────────────────────────────────
// CMS Change Types
// ─────────────────────────────────────────────────────────────────

export interface CMSChange {
  id: string;
  change_id: string;
  user_id: string;
  project_id: string | null;
  cms_type: string;
  site_url: string;
  content_type: string;
  content_id: string;
  action: 'create' | 'update' | 'delete';
  previous_state: Record<string, any>;
  new_state: Record<string, any> | null;
  change_summary: CMSChangeSummary;
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

export interface CMSChangeSummary {
  content_title: string;
  fields_changed: string[];
  changes: CMSFieldChange[];
}

export interface CMSFieldChange {
  field: string;
  before: string;
  after: string;
}

// ─────────────────────────────────────────────────────────────────
// API Response Types
// ─────────────────────────────────────────────────────────────────

export interface CMSPendingResponse {
  pending: CMSChange[];
}

export interface CMSApproveRequest {
  change_id: string;
}

export interface CMSRollbackRequest {
  change_id: string;
  reason?: string;
}

export interface CMSOperationResponse {
  success: boolean;
  message: string;
  change_id?: string;
  error?: string;
}
