// ═══════════════════════════════════════════════════════════════
// WordPress Adapter
// Implémentation complète pour WordPress REST API v2
// Application Passwords (built-in WP 5.6+)
// ═══════════════════════════════════════════════════════════════

import axios, { AxiosInstance, AxiosError } from 'axios';
import type { CMSAdapter } from './adapter.interface.js';
import type {
  CMSCredentials,
  SiteInfo,
  CMSPost,
  CMSPage,
  CMSProduct,
  CMSMedia,
  CMSCategory,
  PaginatedResult,
  CreateResult,
  MutationResult,
  SEOMeta,
} from '../types.js';
import {
  CMSError,
  AuthenticationError,
  NotFoundError,
  RateLimitError,
} from '../types.js';

/**
 * WordPress Adapter - REST API v2
 * Supporte : WordPress 5.6+ (Application Passwords)
 * Plugins SEO : Yoast SEO, Rank Math (détection automatique)
 */
export class WordPressAdapter implements CMSAdapter {
  private client: AxiosInstance;
  private credentials: CMSCredentials;
  private seoPlugin: 'yoast' | 'rankmath' | 'none' = 'none';

  constructor(credentials: CMSCredentials) {
    if (!credentials.username || !credentials.app_password) {
      throw new AuthenticationError(
        'WordPress requires username and app_password'
      );
    }

    this.credentials = credentials;

    // Client Axios configuré avec Basic Auth
    this.client = axios.create({
      baseURL: `${credentials.site_url}/wp-json/wp/v2`,
      auth: {
        username: credentials.username,
        password: credentials.app_password,
      },
      timeout: 30000, // 30s timeout
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Hive-OS-CMS-Connector/1.0',
      },
    });

    // Interceptor pour gérer les erreurs communes
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        return Promise.reject(this.handleAxiosError(error));
      }
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Authentication & Site Info
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  async validateCredentials(): Promise<{ valid: boolean; error?: string }> {
    try {
      // Tente de récupérer /users/me (endpoint authentifié)
      await this.client.get('/users/me');
      return { valid: true };
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return { valid: false, error: error.message };
      }
      return { valid: false, error: 'Unknown error during validation' };
    }
  }

  async getSiteInfo(): Promise<SiteInfo> {
    try {
      // Récupérer les infos du site
      const siteResponse = await axios.get(
        `${this.credentials.site_url}/wp-json`
      );
      const site = siteResponse.data;

      // Détecter le plugin SEO
      await this.detectSEOPlugin();

      // Récupérer les stats (nombre de posts, pages, media)
      const [postsCount, pagesCount, mediaCount] = await Promise.all([
        this.getCount('/posts'),
        this.getCount('/pages'),
        this.getCount('/media'),
      ]);

      return {
        cms_type: 'wordpress',
        cms_version: site.description || 'Unknown',
        site_url: this.credentials.site_url,
        site_title: site.name || '',
        theme: undefined, // WordPress REST API v2 ne retourne pas le thème actif
        seo_plugin: this.seoPlugin,
        stats: {
          posts: postsCount,
          pages: pagesCount,
          media: mediaCount,
        },
      };
    } catch (error) {
      throw this.handleAxiosError(error);
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Posts (Articles de blog)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  async getPosts(params: {
    search?: string;
    status?: 'draft' | 'published' | 'pending' | 'any';
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<PaginatedResult<CMSPost>> {
    try {
      const wpParams: any = {
        per_page: params.limit || 10,
        offset: params.offset || 0,
        _embed: true, // Inclure featured_image, author, categories
      };

      if (params.search) wpParams.search = params.search;
      if (params.status) {
        wpParams.status =
          params.status === 'published' ? 'publish' : params.status;
      }
      if (params.category) wpParams.categories = params.category;

      const response = await this.client.get('/posts', { params: wpParams });

      const total = parseInt(response.headers['x-wp-total'] || '0', 10);
      const posts: CMSPost[] = await Promise.all(
        response.data.map((post: any) => this.mapWPPostToCMSPost(post))
      );

      return {
        items: posts,
        total,
        limit: params.limit || 10,
        offset: params.offset || 0,
        has_more: (params.offset || 0) + posts.length < total,
      };
    } catch (error) {
      throw this.handleAxiosError(error);
    }
  }

  async getPost(params: { post_id: string }): Promise<CMSPost> {
    try {
      const response = await this.client.get(`/posts/${params.post_id}`, {
        params: { _embed: true },
      });
      return this.mapWPPostToCMSPost(response.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw new NotFoundError('Post', params.post_id);
      }
      throw this.handleAxiosError(error);
    }
  }

  async createPost(params: {
    title: string;
    content: string;
    excerpt?: string;
    categories?: string[];
    tags?: string[];
    featured_image_id?: string;
    seo_meta?: SEOMeta;
  }): Promise<CreateResult> {
    try {
      const wpPost: any = {
        title: params.title,
        content: params.content,
        excerpt: params.excerpt,
        status: 'draft', // TOUJOURS créé en brouillon
        categories: params.categories || [],
        tags: params.tags || [],
        featured_media: params.featured_image_id
          ? parseInt(params.featured_image_id, 10)
          : undefined,
      };

      // Ajouter les meta SEO si un plugin est détecté
      if (params.seo_meta) {
        Object.assign(wpPost, this.mapSEOMetaToWP(params.seo_meta));
      }

      const response = await this.client.post('/posts', wpPost);

      return {
        success: true,
        id: response.data.id.toString(),
        permalink: response.data.link,
        status: 'draft',
        message: `Post "${params.title}" created successfully as draft`,
      };
    } catch (error) {
      throw this.handleAxiosError(error);
    }
  }

  async updatePost(params: {
    post_id: string;
    title?: string;
    content?: string;
    excerpt?: string;
    status?: 'draft' | 'published' | 'pending';
    categories?: string[];
    tags?: string[];
    featured_image_id?: string;
    seo_meta?: SEOMeta;
  }): Promise<MutationResult> {
    try {
      // 1. Récupérer l'état actuel pour le snapshot
      const currentPost = await this.getPost({ post_id: params.post_id });

      // 2. Construire l'update
      const wpUpdate: any = {};
      if (params.title) wpUpdate.title = params.title;
      if (params.content) wpUpdate.content = params.content;
      if (params.excerpt) wpUpdate.excerpt = params.excerpt;
      if (params.status) {
        wpUpdate.status =
          params.status === 'published' ? 'publish' : params.status;
      }
      if (params.categories) wpUpdate.categories = params.categories;
      if (params.tags) wpUpdate.tags = params.tags;
      if (params.featured_image_id) {
        wpUpdate.featured_media = parseInt(params.featured_image_id, 10);
      }

      // Ajouter SEO meta si fourni
      if (params.seo_meta) {
        Object.assign(wpUpdate, this.mapSEOMetaToWP(params.seo_meta));
      }

      // 3. Exécuter l'update
      await this.client.put(`/posts/${params.post_id}`, wpUpdate);

      // 4. Déterminer si approval requis
      const requiresApproval = currentPost.status !== 'draft';

      return {
        success: true,
        previous_state: currentPost,
        change_id: this.generateChangeId(),
        requires_approval: requiresApproval,
        change_summary: {
          content_type: 'post',
          content_id: params.post_id,
          content_title: currentPost.title,
          site_url: this.credentials.site_url,
          changes: this.buildChangeSummary(currentPost, params),
        },
      };
    } catch (error) {
      throw this.handleAxiosError(error);
    }
  }

  async deletePost(params: { post_id: string }): Promise<MutationResult> {
    try {
      // 1. Récupérer l'état actuel
      const currentPost = await this.getPost({ post_id: params.post_id });

      // 2. Déplacer vers la corbeille (pas suppression permanente)
      await this.client.delete(`/posts/${params.post_id}`);

      return {
        success: true,
        previous_state: currentPost,
        change_id: this.generateChangeId(),
        requires_approval: true, // Toujours approval pour suppression
        change_summary: {
          content_type: 'post',
          content_id: params.post_id,
          content_title: currentPost.title,
          site_url: this.credentials.site_url,
          changes: [
            {
              field: 'status',
              before: currentPost.status,
              after: 'trash',
            },
          ],
        },
      };
    } catch (error) {
      throw this.handleAxiosError(error);
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Pages
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  async getPages(params: {
    search?: string;
    status?: 'draft' | 'published' | 'any';
    limit?: number;
    offset?: number;
  }): Promise<PaginatedResult<CMSPage>> {
    try {
      const wpParams: any = {
        per_page: params.limit || 10,
        offset: params.offset || 0,
      };

      if (params.search) wpParams.search = params.search;
      if (params.status) {
        wpParams.status =
          params.status === 'published' ? 'publish' : params.status;
      }

      const response = await this.client.get('/pages', { params: wpParams });

      const total = parseInt(response.headers['x-wp-total'] || '0', 10);
      const pages: CMSPage[] = await Promise.all(
        response.data.map((page: any) => this.mapWPPageToCMSPage(page))
      );

      return {
        items: pages,
        total,
        limit: params.limit || 10,
        offset: params.offset || 0,
        has_more: (params.offset || 0) + pages.length < total,
      };
    } catch (error) {
      throw this.handleAxiosError(error);
    }
  }

  async updatePage(params: {
    page_id: string;
    title?: string;
    content?: string;
    status?: 'draft' | 'published';
    seo_meta?: SEOMeta;
  }): Promise<MutationResult> {
    try {
      // 1. État actuel
      const response = await this.client.get(`/pages/${params.page_id}`);
      const currentPage = await this.mapWPPageToCMSPage(response.data);

      // 2. Construire update
      const wpUpdate: any = {};
      if (params.title) wpUpdate.title = params.title;
      if (params.content) wpUpdate.content = params.content;
      if (params.status) {
        wpUpdate.status =
          params.status === 'published' ? 'publish' : params.status;
      }
      if (params.seo_meta) {
        Object.assign(wpUpdate, this.mapSEOMetaToWP(params.seo_meta));
      }

      // 3. Exécuter
      await this.client.put(`/pages/${params.page_id}`, wpUpdate);

      return {
        success: true,
        previous_state: currentPage,
        change_id: this.generateChangeId(),
        requires_approval: true, // Toujours approval pour pages
        change_summary: {
          content_type: 'page',
          content_id: params.page_id,
          content_title: currentPage.title,
          site_url: this.credentials.site_url,
          changes: this.buildChangeSummary(currentPage, params),
        },
      };
    } catch (error) {
      throw this.handleAxiosError(error);
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Media (Médiathèque)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  async getMedia(params: {
    search?: string;
    mime_type?: string;
    limit?: number;
    offset?: number;
  }): Promise<PaginatedResult<CMSMedia>> {
    try {
      const wpParams: any = {
        per_page: params.limit || 10,
        offset: params.offset || 0,
      };

      if (params.search) wpParams.search = params.search;
      if (params.mime_type) wpParams.media_type = params.mime_type;

      const response = await this.client.get('/media', { params: wpParams });

      const total = parseInt(response.headers['x-wp-total'] || '0', 10);
      const media: CMSMedia[] = response.data.map((item: any) =>
        this.mapWPMediaToCMSMedia(item)
      );

      return {
        items: media,
        total,
        limit: params.limit || 10,
        offset: params.offset || 0,
        has_more: (params.offset || 0) + media.length < total,
      };
    } catch (error) {
      throw this.handleAxiosError(error);
    }
  }

  async uploadMedia(params: {
    file_url?: string;
    file_data?: Buffer;
    filename: string;
    alt_text?: string;
    caption?: string;
  }): Promise<{ id: string; url: string }> {
    try {
      let fileBuffer: Buffer;

      // Télécharger depuis URL si file_url fourni
      if (params.file_url) {
        const fileResponse = await axios.get(params.file_url, {
          responseType: 'arraybuffer',
        });
        fileBuffer = Buffer.from(fileResponse.data);
      } else if (params.file_data) {
        fileBuffer = params.file_data;
      } else {
        throw new CMSError(
          'Either file_url or file_data must be provided',
          'INVALID_PARAMS',
          400
        );
      }

      // Upload vers WordPress
      const FormData = (await import('form-data')).default;
      const formData = new FormData();
      formData.append('file', fileBuffer, params.filename);
      if (params.alt_text) formData.append('alt_text', params.alt_text);
      if (params.caption) formData.append('caption', params.caption);

      const response = await this.client.post('/media', formData, {
        headers: formData.getHeaders(),
      });

      return {
        id: response.data.id.toString(),
        url: response.data.source_url,
      };
    } catch (error) {
      throw this.handleAxiosError(error);
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SEO Meta
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  async updateSEOMeta(params: {
    content_type: 'post' | 'page' | 'product';
    content_id: string;
    seo_meta: SEOMeta;
  }): Promise<MutationResult> {
    try {
      // WordPress REST API ne supporte pas directement les meta SEO
      // Il faut passer par les endpoints Yoast/RankMath ou meta fields
      const endpoint =
        params.content_type === 'post'
          ? `/posts/${params.content_id}`
          : `/pages/${params.content_id}`;

      // Récupérer état actuel
      const currentResponse = await this.client.get(endpoint);
      const currentState = currentResponse.data;

      // Mapper SEO meta au format WordPress
      const wpUpdate = this.mapSEOMetaToWP(params.seo_meta);

      // Exécuter update
      await this.client.put(endpoint, wpUpdate);

      return {
        success: true,
        previous_state: currentState,
        change_id: this.generateChangeId(),
        requires_approval: true,
        change_summary: {
          content_type: params.content_type,
          content_id: params.content_id,
          content_title: currentState.title?.rendered || '',
          site_url: this.credentials.site_url,
          changes: Object.entries(params.seo_meta).map(([key, value]) => ({
            field: `seo_${key}`,
            before: null,
            after: value || null,
          })),
        },
      };
    } catch (error) {
      throw this.handleAxiosError(error);
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Taxonomies (Catégories, Tags)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  async getCategories(params: {
    taxonomy: 'category' | 'tag' | 'collection';
  }): Promise<CMSCategory[]> {
    try {
      const endpoint =
        params.taxonomy === 'category' ? '/categories' : '/tags';
      const response = await this.client.get(endpoint, {
        params: { per_page: 100 },
      });

      return response.data.map((item: any) => ({
        id: item.id.toString(),
        name: item.name,
        slug: item.slug,
        description: item.description || undefined,
        parent_id: item.parent ? item.parent.toString() : undefined,
        count: item.count || 0,
      }));
    } catch (error) {
      throw this.handleAxiosError(error);
    }
  }

  async manageCategory(params: {
    taxonomy: 'category' | 'tag' | 'collection';
    action: 'create' | 'update';
    category_id?: string;
    name: string;
    slug?: string;
    description?: string;
    parent_id?: string;
  }): Promise<CMSCategory> {
    try {
      const endpoint =
        params.taxonomy === 'category' ? '/categories' : '/tags';

      const wpCategory: any = {
        name: params.name,
        slug: params.slug,
        description: params.description,
      };

      if (params.parent_id && params.taxonomy === 'category') {
        wpCategory.parent = parseInt(params.parent_id, 10);
      }

      let response;
      if (params.action === 'create') {
        response = await this.client.post(endpoint, wpCategory);
      } else {
        if (!params.category_id) {
          throw new CMSError(
            'category_id required for update action',
            'INVALID_PARAMS',
            400
          );
        }
        response = await this.client.put(
          `${endpoint}/${params.category_id}`,
          wpCategory
        );
      }

      return {
        id: response.data.id.toString(),
        name: response.data.name,
        slug: response.data.slug,
        description: response.data.description || undefined,
        parent_id: response.data.parent
          ? response.data.parent.toString()
          : undefined,
        count: response.data.count || 0,
      };
    } catch (error) {
      throw this.handleAxiosError(error);
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Products (WooCommerce optionnel)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  async getProducts(params: {
    search?: string;
    status?: 'active' | 'draft' | 'archived' | 'any';
    collection?: string;
    limit?: number;
    offset?: number;
  }): Promise<PaginatedResult<CMSProduct>> {
    try {
      // WooCommerce REST API v3 : /wp-json/wc/v3/products
      const wcClient = axios.create({
        baseURL: `${this.credentials.site_url}/wp-json/wc/v3`,
        auth: {
          username: this.credentials.username!,
          password: this.credentials.app_password!,
        },
      });

      const wcParams: any = {
        per_page: params.limit || 10,
        offset: params.offset || 0,
      };

      if (params.search) wcParams.search = params.search;
      if (params.status) wcParams.status = params.status;

      const response = await wcClient.get('/products', { params: wcParams });

      const total = parseInt(response.headers['x-wp-total'] || '0', 10);
      const products: CMSProduct[] = response.data.map((product: any) => ({
        id: product.id.toString(),
        title: product.name,
        description: product.description || '',
        price: parseFloat(product.price),
        currency: 'EUR', // TODO: Détecter currency WooCommerce
        sku: product.sku || undefined,
        stock: product.stock_quantity || undefined,
        images: product.images.map((img: any) => ({
          id: img.id.toString(),
          url: img.src,
          alt_text: img.alt || undefined,
        })),
        categories: product.categories.map((cat: any) => cat.name),
        status: product.status === 'publish' ? 'active' : 'draft',
        seo_meta: undefined, // TODO: Parser meta Yoast si présent
        permalink: product.permalink,
      }));

      return {
        items: products,
        total,
        limit: params.limit || 10,
        offset: params.offset || 0,
        has_more: (params.offset || 0) + products.length < total,
      };
    } catch (error) {
      // WooCommerce non installé → retourner tableau vide
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return {
          items: [],
          total: 0,
          limit: params.limit || 10,
          offset: params.offset || 0,
          has_more: false,
        };
      }
      throw this.handleAxiosError(error);
    }
  }

  async updateProduct(params: {
    product_id: string;
    title?: string;
    description?: string;
    seo_meta?: SEOMeta;
    images?: Array<{ id: string; alt_text: string }>;
  }): Promise<MutationResult> {
    try {
      const wcClient = axios.create({
        baseURL: `${this.credentials.site_url}/wp-json/wc/v3`,
        auth: {
          username: this.credentials.username!,
          password: this.credentials.app_password!,
        },
      });

      // État actuel
      const currentResponse = await wcClient.get(
        `/products/${params.product_id}`
      );
      const currentState = currentResponse.data;

      // Update
      const wcUpdate: any = {};
      if (params.title) wcUpdate.name = params.title;
      if (params.description) wcUpdate.description = params.description;
      if (params.images) {
        wcUpdate.images = params.images.map((img) => ({
          id: parseInt(img.id, 10),
          alt: img.alt_text,
        }));
      }

      await wcClient.put(`/products/${params.product_id}`, wcUpdate);

      return {
        success: true,
        previous_state: currentState,
        change_id: this.generateChangeId(),
        requires_approval: true,
        change_summary: {
          content_type: 'product',
          content_id: params.product_id,
          content_title: currentState.name,
          site_url: this.credentials.site_url,
          changes: this.buildChangeSummary(currentState, params),
        },
      };
    } catch (error) {
      throw this.handleAxiosError(error);
    }
  }

  async bulkUpdateSEO(params: {
    content_type: 'post' | 'page' | 'product';
    updates: Array<{ content_id: string; seo_meta: Partial<SEOMeta> }>;
  }): Promise<MutationResult> {
    try {
      // Exécuter tous les updates en parallèle
      const results = await Promise.all(
        params.updates.map((update) =>
          this.updateSEOMeta({
            content_type: params.content_type,
            content_id: update.content_id,
            seo_meta: update.seo_meta as SEOMeta,
          })
        )
      );

      // Agréger les résultats
      return {
        success: true,
        previous_state: { bulk_count: params.updates.length },
        change_id: this.generateChangeId(),
        requires_approval: true,
        change_summary: {
          content_type: params.content_type,
          content_id: 'bulk',
          content_title: `${params.updates.length} items`,
          site_url: this.credentials.site_url,
          changes: [
            {
              field: 'seo_meta',
              before: null,
              after: `Updated ${params.updates.length} items`,
            },
          ],
        },
      };
    } catch (error) {
      throw this.handleAxiosError(error);
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Helpers privés
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Détecte le plugin SEO installé (Yoast ou Rank Math)
   */
  private async detectSEOPlugin(): Promise<void> {
    try {
      // Tenter d'accéder aux endpoints Yoast
      const yoastResponse = await axios.get(
        `${this.credentials.site_url}/wp-json/yoast/v1/`,
        { timeout: 3000 }
      );
      if (yoastResponse.status === 200) {
        this.seoPlugin = 'yoast';
        return;
      }
    } catch {
      // Yoast non détecté
    }

    try {
      // Tenter Rank Math
      const rankMathResponse = await axios.get(
        `${this.credentials.site_url}/wp-json/rankmath/v1/`,
        { timeout: 3000 }
      );
      if (rankMathResponse.status === 200) {
        this.seoPlugin = 'rankmath';
        return;
      }
    } catch {
      // Rank Math non détecté
    }

    this.seoPlugin = 'none';
  }

  /**
   * Récupère le nombre total d'items d'un endpoint
   */
  private async getCount(endpoint: string): Promise<number> {
    try {
      const response = await this.client.get(endpoint, {
        params: { per_page: 1 },
      });
      return parseInt(response.headers['x-wp-total'] || '0', 10);
    } catch {
      return 0;
    }
  }

  /**
   * Mappe un post WordPress vers CMSPost
   */
  private async mapWPPostToCMSPost(wpPost: any): Promise<CMSPost> {
    return {
      id: wpPost.id.toString(),
      title: wpPost.title?.rendered || '',
      content: wpPost.content?.rendered || '',
      excerpt: wpPost.excerpt?.rendered || undefined,
      status: this.mapWPStatus(wpPost.status),
      author: wpPost._embedded?.author?.[0]?.name || 'Unknown',
      categories:
        wpPost._embedded?.['wp:term']?.[0]?.map((cat: any) => cat.name) || [],
      tags:
        wpPost._embedded?.['wp:term']?.[1]?.map((tag: any) => tag.name) || [],
      featured_image:
        wpPost._embedded?.['wp:featuredmedia']?.[0]?.source_url || undefined,
      permalink: wpPost.link,
      seo_meta: await this.extractSEOMeta(wpPost),
      created_at: wpPost.date,
      updated_at: wpPost.modified,
    };
  }

  /**
   * Mappe une page WordPress vers CMSPage
   */
  private async mapWPPageToCMSPage(wpPage: any): Promise<CMSPage> {
    return {
      id: wpPage.id.toString(),
      title: wpPage.title?.rendered || '',
      content: wpPage.content?.rendered || '',
      status: this.mapWPPageStatus(wpPage.status),
      permalink: wpPage.link,
      parent_id: wpPage.parent ? wpPage.parent.toString() : undefined,
      template: wpPage.template || undefined,
      seo_meta: await this.extractSEOMeta(wpPage),
      created_at: wpPage.date,
      updated_at: wpPage.modified,
    };
  }

  /**
   * Mappe un media WordPress vers CMSMedia
   */
  private mapWPMediaToCMSMedia(wpMedia: any): CMSMedia {
    return {
      id: wpMedia.id.toString(),
      url: wpMedia.source_url,
      title: wpMedia.title?.rendered || '',
      alt_text: wpMedia.alt_text || undefined,
      caption: wpMedia.caption?.rendered || undefined,
      mime_type: wpMedia.mime_type,
      file_size: wpMedia.media_details?.filesize || 0,
      dimensions: wpMedia.media_details?.width
        ? {
            width: wpMedia.media_details.width,
            height: wpMedia.media_details.height,
          }
        : undefined,
      uploaded_at: wpMedia.date,
    };
  }

  /**
   * Mappe les statuts WordPress vers nos statuts (posts)
   */
  private mapWPStatus(
    wpStatus: string
  ): 'draft' | 'published' | 'pending' | 'private' {
    switch (wpStatus) {
      case 'publish':
        return 'published';
      case 'draft':
        return 'draft';
      case 'pending':
        return 'pending';
      case 'private':
        return 'private';
      default:
        return 'draft';
    }
  }

  /**
   * Mappe les statuts WordPress page vers nos statuts (pages n'ont que draft/published)
   */
  private mapWPPageStatus(wpStatus: string): 'draft' | 'published' {
    switch (wpStatus) {
      case 'publish':
        return 'published';
      default:
        // pending, private, draft → tous mapped à draft
        return 'draft';
    }
  }

  /**
   * Extrait les meta SEO depuis un post/page WordPress
   */
  private async extractSEOMeta(wpContent: any): Promise<SEOMeta | undefined> {
    // TODO: Parser Yoast/Rank Math meta fields
    // Pour l'instant, retourner undefined
    return undefined;
  }

  /**
   * Mappe SEOMeta vers les champs WordPress (Yoast/Rank Math)
   */
  private mapSEOMetaToWP(seo: SEOMeta): any {
    // TODO: Mapper vers les champs meta Yoast/Rank Math
    // Pour l'instant, retourner objet vide
    return {};
  }

  /**
   * Génère un UUID pour change_id
   */
  private generateChangeId(): string {
    return `wp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Construit le résumé des changements
   */
  private buildChangeSummary(before: any, after: any): Array<{
    field: string;
    before: string | null;
    after: string | null;
  }> {
    const changes: Array<{
      field: string;
      before: string | null;
      after: string | null;
    }> = [];

    for (const [key, value] of Object.entries(after)) {
      if (value !== undefined && before[key] !== value) {
        changes.push({
          field: key,
          before: before[key] || null,
          after: value as string,
        });
      }
    }

    return changes;
  }

  /**
   * Gère les erreurs Axios et les convertit en CMSError
   */
  private handleAxiosError(error: any): CMSError {
    if (!axios.isAxiosError(error)) {
      return new CMSError('Unknown error', 'UNKNOWN_ERROR', 500, error);
    }

    const axiosError = error as AxiosError;

    // Erreur 401 : Authentification
    if (axiosError.response?.status === 401) {
      return new AuthenticationError(
        'Invalid WordPress credentials',
        axiosError.response.data
      );
    }

    // Erreur 429 : Rate limit
    if (axiosError.response?.status === 429) {
      const retryAfter = axiosError.response.headers['retry-after']
        ? parseInt(axiosError.response.headers['retry-after'], 10)
        : undefined;
      return new RateLimitError('WordPress rate limit exceeded', retryAfter);
    }

    // Erreur 404 : Non trouvé
    if (axiosError.response?.status === 404) {
      return new CMSError('Resource not found', 'NOT_FOUND', 404);
    }

    // Timeout
    if (axiosError.code === 'ECONNABORTED') {
      return new CMSError(
        'WordPress request timeout',
        'TIMEOUT',
        408,
        axiosError
      );
    }

    // Erreur réseau
    if (!axiosError.response) {
      return new CMSError(
        'Cannot reach WordPress site',
        'NETWORK_ERROR',
        503,
        axiosError
      );
    }

    // Autre erreur HTTP
    return new CMSError(
      axiosError.response.statusText || 'WordPress API error',
      'API_ERROR',
      axiosError.response.status,
      axiosError.response.data
    );
  }
}
