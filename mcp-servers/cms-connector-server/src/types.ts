// ═══════════════════════════════════════════════════════════════
// CMS Connector Server - TypeScript Types
// ═══════════════════════════════════════════════════════════════

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Credentials (passed as tool argument, same pattern as meta-ads-server)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface CMSCredentials {
  cms_type: 'wordpress' | 'shopify' | 'webflow';
  site_url: string; // "https://example.com"

  // WordPress (Application Passwords - built-in since WP 5.6)
  username?: string;
  app_password?: string;

  // Shopify (OAuth access token)
  shop_domain?: string; // "mystore.myshopify.com"
  access_token?: string;

  // Webflow (OAuth access token)
  api_token?: string;
  site_id?: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Site Info
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface SiteInfo {
  cms_type: string;
  cms_version: string;
  site_url: string;
  site_title: string;
  theme?: string;
  seo_plugin?: 'yoast' | 'rankmath' | 'none'; // WordPress only
  stats: {
    posts: number;
    pages: number;
    products?: number; // Shopify/WooCommerce
    media: number;
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Content Types (Posts, Pages, Products)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface CMSPost {
  id: string;
  title: string;
  content: string; // HTML
  excerpt?: string;
  status: 'draft' | 'published' | 'pending' | 'private';
  author: string;
  categories: string[];
  tags: string[];
  featured_image?: string;
  permalink: string;
  seo_meta?: SEOMeta;
  created_at: string;
  updated_at: string;
}

export interface CMSPage {
  id: string;
  title: string;
  content: string; // HTML
  status: 'draft' | 'published';
  permalink: string;
  parent_id?: string;
  template?: string;
  seo_meta?: SEOMeta;
  created_at: string;
  updated_at: string;
}

export interface CMSProduct {
  id: string;
  title: string;
  description: string; // HTML
  price: number;
  currency: string;
  sku?: string;
  stock?: number;
  images: Array<{
    id: string;
    url: string;
    alt_text?: string;
  }>;
  categories: string[];
  status: 'active' | 'draft' | 'archived';
  seo_meta?: SEOMeta;
  permalink: string;
}

export interface CMSMedia {
  id: string;
  url: string;
  title: string;
  alt_text?: string;
  caption?: string;
  mime_type: string;
  file_size: number;
  dimensions?: {
    width: number;
    height: number;
  };
  uploaded_at: string;
}

export interface CMSCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  count: number; // Number of items in this category
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SEO Meta
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface SEOMeta {
  title?: string; // SEO title (max 60 chars)
  description?: string; // Meta description (max 160 chars)
  canonical_url?: string;
  focus_keyword?: string;
  og_title?: string; // Open Graph
  og_description?: string;
  og_image?: string;
  twitter_title?: string;
  twitter_description?: string;
  twitter_image?: string;
  robots?: string; // "index,follow" | "noindex,nofollow"
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Tool Parameters (input for each tool)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface GetPostsParams {
  credentials: CMSCredentials;
  search?: string;
  status?: 'draft' | 'published' | 'pending' | 'any';
  category?: string;
  limit?: number; // Default 10, max 100
  offset?: number; // For pagination
}

export interface GetPostParams {
  credentials: CMSCredentials;
  post_id: string;
}

export interface CreatePostParams {
  credentials: CMSCredentials;
  title: string;
  content: string; // HTML
  excerpt?: string;
  categories?: string[];
  tags?: string[];
  featured_image_id?: string;
  seo_meta?: SEOMeta;
  // TOUJOURS créé en brouillon (status: 'draft')
}

export interface UpdatePostParams {
  credentials: CMSCredentials;
  post_id: string;
  title?: string;
  content?: string;
  excerpt?: string;
  status?: 'draft' | 'published' | 'pending';
  categories?: string[];
  tags?: string[];
  featured_image_id?: string;
  seo_meta?: SEOMeta;
}

export interface DeletePostParams {
  credentials: CMSCredentials;
  post_id: string;
}

export interface GetPagesParams {
  credentials: CMSCredentials;
  search?: string;
  status?: 'draft' | 'published' | 'any';
  limit?: number;
  offset?: number;
}

export interface UpdatePageParams {
  credentials: CMSCredentials;
  page_id: string;
  title?: string;
  content?: string;
  status?: 'draft' | 'published';
  seo_meta?: SEOMeta;
}

export interface GetMediaParams {
  credentials: CMSCredentials;
  search?: string;
  mime_type?: string; // 'image/*', 'video/*', 'application/pdf'
  limit?: number;
  offset?: number;
}

export interface UploadMediaParams {
  credentials: CMSCredentials;
  file_url?: string; // Upload from URL
  file_data?: Buffer; // Or upload raw bytes
  filename: string;
  alt_text?: string;
  caption?: string;
}

export interface UpdateSEOMetaParams {
  credentials: CMSCredentials;
  content_type: 'post' | 'page' | 'product';
  content_id: string;
  seo_meta: SEOMeta;
}

export interface GetCategoriesParams {
  credentials: CMSCredentials;
  taxonomy: 'category' | 'tag' | 'collection'; // WordPress: category/tag, Shopify: collection
}

export interface ManageCategoryParams {
  credentials: CMSCredentials;
  taxonomy: 'category' | 'tag' | 'collection';
  action: 'create' | 'update';
  category_id?: string; // Required for update
  name: string;
  slug?: string;
  description?: string;
  parent_id?: string;
}

export interface GetProductsParams {
  credentials: CMSCredentials;
  search?: string;
  status?: 'active' | 'draft' | 'archived' | 'any';
  collection?: string;
  limit?: number;
  offset?: number;
}

export interface UpdateProductParams {
  credentials: CMSCredentials;
  product_id: string;
  title?: string;
  description?: string;
  seo_meta?: SEOMeta;
  images?: Array<{
    id: string;
    alt_text: string;
  }>;
}

export interface BulkUpdateSEOParams {
  credentials: CMSCredentials;
  content_type: 'post' | 'page' | 'product';
  updates: Array<{
    content_id: string;
    seo_meta: Partial<SEOMeta>;
  }>;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Tool Results
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface CreateResult {
  success: boolean;
  id: string;
  permalink: string;
  status: 'draft'; // Toujours draft
  message: string;
}

export interface MutationResult {
  success: boolean;
  previous_state: Record<string, any>; // Snapshot avant modification
  change_id: string; // UUID pour rollback
  requires_approval?: boolean; // Si true, créer approval_request
  change_summary?: ChangeSummary; // Pour afficher dans l'UI
}

export interface ChangeSummary {
  content_type: 'post' | 'page' | 'product';
  content_id: string;
  content_title: string;
  site_url: string;
  changes: Array<{
    field: string;
    before: string | null;
    after: string | null;
  }>;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Error Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export class CMSError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'CMSError';
  }
}

export class AuthenticationError extends CMSError {
  constructor(message: string, details?: any) {
    super(message, 'AUTHENTICATION_ERROR', 401, details);
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends CMSError {
  constructor(message: string, retryAfter?: number) {
    super(message, 'RATE_LIMIT_ERROR', 429, { retryAfter });
    this.name = 'RateLimitError';
  }
}

export class NotFoundError extends CMSError {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}
