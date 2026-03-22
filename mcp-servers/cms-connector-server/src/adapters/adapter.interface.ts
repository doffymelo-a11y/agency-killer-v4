// ═══════════════════════════════════════════════════════════════
// CMS Adapter Interface
// Contrat commun pour WordPress/Shopify/Webflow adapters
// ═══════════════════════════════════════════════════════════════

import type {
  SiteInfo,
  CMSPost,
  CMSPage,
  CMSProduct,
  CMSMedia,
  CMSCategory,
  PaginatedResult,
  CreateResult,
  MutationResult,
  GetPostsParams,
  GetPostParams,
  CreatePostParams,
  UpdatePostParams,
  DeletePostParams,
  GetPagesParams,
  UpdatePageParams,
  GetMediaParams,
  UploadMediaParams,
  UpdateSEOMetaParams,
  GetCategoriesParams,
  ManageCategoryParams,
  GetProductsParams,
  UpdateProductParams,
  BulkUpdateSEOParams,
} from '../types.js';

/**
 * Interface commune pour tous les CMS adapters
 * Chaque adapter (WordPress, Shopify, Webflow) implémente cette interface
 */
export interface CMSAdapter {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Authentication & Site Info
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Valide les credentials (teste la connexion au CMS)
   * @returns { valid: true } si OK, { valid: false, error: '...' } sinon
   */
  validateCredentials(): Promise<{ valid: boolean; error?: string }>;

  /**
   * Récupère les informations du site
   * Version CMS, thème, plugin SEO détecté, stats (nb posts/pages)
   */
  getSiteInfo(): Promise<SiteInfo>;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Posts (Articles de blog)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Liste les articles avec pagination, recherche, filtres
   */
  getPosts(params: Omit<GetPostsParams, 'credentials'>): Promise<PaginatedResult<CMSPost>>;

  /**
   * Récupère un article complet par ID (contenu + meta SEO)
   */
  getPost(params: Omit<GetPostParams, 'credentials'>): Promise<CMSPost>;

  /**
   * Crée un nouvel article (TOUJOURS en brouillon)
   * @returns { success, id, permalink, status: 'draft' }
   */
  createPost(params: Omit<CreatePostParams, 'credentials'>): Promise<CreateResult>;

  /**
   * Modifie un article existant (contenu/titre/meta)
   * Requiert approval si status != 'draft'
   * @returns { success, previous_state, change_id, requires_approval }
   */
  updatePost(params: Omit<UpdatePostParams, 'credentials'>): Promise<MutationResult>;

  /**
   * Met un article à la corbeille (pas suppression permanente)
   * Requiert approval
   */
  deletePost(params: Omit<DeletePostParams, 'credentials'>): Promise<MutationResult>;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Pages
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Liste toutes les pages du site
   */
  getPages(params: Omit<GetPagesParams, 'credentials'>): Promise<PaginatedResult<CMSPage>>;

  /**
   * Modifie une page (contenu/meta SEO)
   * Requiert approval
   */
  updatePage(params: Omit<UpdatePageParams, 'credentials'>): Promise<MutationResult>;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Media (Médiathèque)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Liste les fichiers de la médiathèque
   */
  getMedia(params: Omit<GetMediaParams, 'credentials'>): Promise<PaginatedResult<CMSMedia>>;

  /**
   * Upload une image/fichier vers la médiathèque
   * @returns { id, url } du media uploadé
   */
  uploadMedia(params: Omit<UploadMediaParams, 'credentials'>): Promise<{ id: string; url: string }>;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SEO Meta (Title, Description, OG, etc.)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Modifie uniquement les champs SEO d'un contenu
   * Requiert approval
   */
  updateSEOMeta(params: Omit<UpdateSEOMetaParams, 'credentials'>): Promise<MutationResult>;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Taxonomies (Catégories, Tags, Collections)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Liste les catégories/tags/collections
   */
  getCategories(params: Omit<GetCategoriesParams, 'credentials'>): Promise<CMSCategory[]>;

  /**
   * Crée ou modifie une catégorie
   */
  manageCategory(params: Omit<ManageCategoryParams, 'credentials'>): Promise<CMSCategory>;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Products (Shopify/WooCommerce uniquement - optionnel)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Liste les produits (Shopify/WooCommerce)
   * Optionnel - WordPress sans WooCommerce retourne []
   */
  getProducts?(params: Omit<GetProductsParams, 'credentials'>): Promise<PaginatedResult<CMSProduct>>;

  /**
   * Modifie le SEO d'un produit
   * Requiert approval
   */
  updateProduct?(params: Omit<UpdateProductParams, 'credentials'>): Promise<MutationResult>;

  /**
   * Batch update meta SEO de N items
   * Requiert approval
   */
  bulkUpdateSEO?(params: Omit<BulkUpdateSEOParams, 'credentials'>): Promise<MutationResult>;
}
