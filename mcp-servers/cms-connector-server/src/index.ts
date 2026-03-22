#!/usr/bin/env node

// ═══════════════════════════════════════════════════════════════
// CMS Connector MCP Server
// WordPress / Shopify / Webflow Integration
// ═══════════════════════════════════════════════════════════════

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

import { createAdapter } from './adapters/adapter-factory.js';
import type { CMSCredentials } from './types.js';
import { globalRateLimiter } from './lib/rate-limiter.js';
import {
  sanitizeHTML,
  sanitizeSEOMeta,
  truncateContent,
} from './lib/content-sanitizer.js';
import {
  globalChangeRecorder,
  recordMutation,
} from './lib/change-recorder.js';
import {
  formatErrorForClient,
  logError,
  retryWithBackoff,
  assertDefined,
} from './lib/error-handler.js';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Tool Definitions (16 outils WordPress + Shopify/Webflow futurs)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const TOOLS: Tool[] = [
  // ──────────────────────────────────────────────────────────────
  // Authentication & Site Info (WRITE-SAFE)
  // ──────────────────────────────────────────────────────────────
  {
    name: 'validate_cms_credentials',
    description:
      'Validates CMS credentials (WordPress/Shopify/Webflow). Tests the connection and returns validation status.',
    inputSchema: {
      type: 'object',
      properties: {
        credentials: {
          type: 'object',
          description: 'CMS credentials with cms_type, site_url, and auth fields',
        },
      },
      required: ['credentials'],
    },
  },
  {
    name: 'get_cms_site_info',
    description:
      'Retrieves CMS site information including version, theme, SEO plugin detection, and content statistics.',
    inputSchema: {
      type: 'object',
      properties: {
        credentials: {
          type: 'object',
          description: 'CMS credentials',
        },
      },
      required: ['credentials'],
    },
  },

  // ──────────────────────────────────────────────────────────────
  // Posts (WRITE-SAFE read, WRITE-APPROVAL mutations)
  // ──────────────────────────────────────────────────────────────
  {
    name: 'get_cms_posts',
    description:
      'Lists blog posts with pagination, search, and filters. Returns posts with SEO metadata.',
    inputSchema: {
      type: 'object',
      properties: {
        credentials: { type: 'object', description: 'CMS credentials' },
        search: { type: 'string', description: 'Search query (optional)' },
        status: {
          type: 'string',
          enum: ['draft', 'published', 'pending', 'any'],
          description: 'Filter by status (optional)',
        },
        category: { type: 'string', description: 'Filter by category ID (optional)' },
        limit: { type: 'number', description: 'Results per page (default 10, max 100)' },
        offset: { type: 'number', description: 'Pagination offset (default 0)' },
      },
      required: ['credentials'],
    },
  },
  {
    name: 'get_cms_post',
    description:
      'Retrieves a single post by ID with full content, SEO meta, and featured image.',
    inputSchema: {
      type: 'object',
      properties: {
        credentials: { type: 'object', description: 'CMS credentials' },
        post_id: { type: 'string', description: 'Post ID' },
      },
      required: ['credentials', 'post_id'],
    },
  },
  {
    name: 'create_cms_post',
    description:
      'Creates a new blog post (ALWAYS as draft). Returns post ID and permalink. Safe operation - no approval required.',
    inputSchema: {
      type: 'object',
      properties: {
        credentials: { type: 'object', description: 'CMS credentials' },
        title: { type: 'string', description: 'Post title' },
        content: { type: 'string', description: 'Post content (HTML)' },
        excerpt: { type: 'string', description: 'Post excerpt (optional)' },
        categories: {
          type: 'array',
          items: { type: 'string' },
          description: 'Category IDs (optional)',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tag IDs (optional)',
        },
        featured_image_id: { type: 'string', description: 'Featured image ID (optional)' },
        seo_meta: { type: 'object', description: 'SEO metadata (optional)' },
      },
      required: ['credentials', 'title', 'content'],
    },
  },
  {
    name: 'update_cms_post',
    description:
      'Updates an existing post. Requires approval if post is published. Returns change_id for rollback.',
    inputSchema: {
      type: 'object',
      properties: {
        credentials: { type: 'object', description: 'CMS credentials' },
        post_id: { type: 'string', description: 'Post ID to update' },
        title: { type: 'string', description: 'New title (optional)' },
        content: { type: 'string', description: 'New content (optional)' },
        excerpt: { type: 'string', description: 'New excerpt (optional)' },
        status: {
          type: 'string',
          enum: ['draft', 'published', 'pending'],
          description: 'New status (optional)',
        },
        categories: { type: 'array', items: { type: 'string' } },
        tags: { type: 'array', items: { type: 'string' } },
        featured_image_id: { type: 'string' },
        seo_meta: { type: 'object' },
      },
      required: ['credentials', 'post_id'],
    },
  },
  {
    name: 'delete_cms_post',
    description:
      'Moves a post to trash (soft delete). Requires approval. Can be restored or permanently deleted later.',
    inputSchema: {
      type: 'object',
      properties: {
        credentials: { type: 'object', description: 'CMS credentials' },
        post_id: { type: 'string', description: 'Post ID to delete' },
      },
      required: ['credentials', 'post_id'],
    },
  },

  // ──────────────────────────────────────────────────────────────
  // Pages (WRITE-SAFE read, WRITE-APPROVAL mutations)
  // ──────────────────────────────────────────────────────────────
  {
    name: 'get_cms_pages',
    description: 'Lists all pages with pagination and search.',
    inputSchema: {
      type: 'object',
      properties: {
        credentials: { type: 'object', description: 'CMS credentials' },
        search: { type: 'string' },
        status: { type: 'string', enum: ['draft', 'published', 'any'] },
        limit: { type: 'number' },
        offset: { type: 'number' },
      },
      required: ['credentials'],
    },
  },
  {
    name: 'update_cms_page',
    description:
      'Updates a page (content, title, SEO meta). Requires approval. Returns change_id for rollback.',
    inputSchema: {
      type: 'object',
      properties: {
        credentials: { type: 'object', description: 'CMS credentials' },
        page_id: { type: 'string', description: 'Page ID to update' },
        title: { type: 'string' },
        content: { type: 'string' },
        status: { type: 'string', enum: ['draft', 'published'] },
        seo_meta: { type: 'object' },
      },
      required: ['credentials', 'page_id'],
    },
  },

  // ──────────────────────────────────────────────────────────────
  // Media (WRITE-SAFE read, WRITE-APPROVAL upload)
  // ──────────────────────────────────────────────────────────────
  {
    name: 'get_cms_media',
    description: 'Lists media library files with pagination and filtering.',
    inputSchema: {
      type: 'object',
      properties: {
        credentials: { type: 'object', description: 'CMS credentials' },
        search: { type: 'string' },
        mime_type: {
          type: 'string',
          description: 'Filter by MIME type (e.g., "image/*", "video/*")',
        },
        limit: { type: 'number' },
        offset: { type: 'number' },
      },
      required: ['credentials'],
    },
  },
  {
    name: 'upload_cms_media',
    description:
      'Uploads a file to the media library from URL or raw data. Returns media ID and URL.',
    inputSchema: {
      type: 'object',
      properties: {
        credentials: { type: 'object', description: 'CMS credentials' },
        file_url: { type: 'string', description: 'URL to download and upload (optional)' },
        filename: { type: 'string', description: 'Filename with extension' },
        alt_text: { type: 'string', description: 'Alt text for accessibility (optional)' },
        caption: { type: 'string', description: 'Media caption (optional)' },
      },
      required: ['credentials', 'filename'],
    },
  },

  // ──────────────────────────────────────────────────────────────
  // SEO Meta (WRITE-APPROVAL)
  // ──────────────────────────────────────────────────────────────
  {
    name: 'update_cms_seo_meta',
    description:
      'Updates SEO metadata for a post/page/product (title, description, Open Graph, Twitter Cards). Requires approval.',
    inputSchema: {
      type: 'object',
      properties: {
        credentials: { type: 'object', description: 'CMS credentials' },
        content_type: {
          type: 'string',
          enum: ['post', 'page', 'product'],
          description: 'Type of content',
        },
        content_id: { type: 'string', description: 'Content ID' },
        seo_meta: {
          type: 'object',
          description:
            'SEO fields: title, description, canonical_url, og_title, og_description, og_image, twitter_title, twitter_description, twitter_image, robots',
        },
      },
      required: ['credentials', 'content_type', 'content_id', 'seo_meta'],
    },
  },

  // ──────────────────────────────────────────────────────────────
  // Taxonomies (WRITE-SAFE read, WRITE-APPROVAL mutations)
  // ──────────────────────────────────────────────────────────────
  {
    name: 'get_cms_categories',
    description:
      'Lists categories, tags, or collections (WordPress: category/tag, Shopify: collection).',
    inputSchema: {
      type: 'object',
      properties: {
        credentials: { type: 'object', description: 'CMS credentials' },
        taxonomy: {
          type: 'string',
          enum: ['category', 'tag', 'collection'],
          description: 'Taxonomy type',
        },
      },
      required: ['credentials', 'taxonomy'],
    },
  },
  {
    name: 'manage_cms_category',
    description: 'Creates or updates a category/tag/collection.',
    inputSchema: {
      type: 'object',
      properties: {
        credentials: { type: 'object', description: 'CMS credentials' },
        taxonomy: { type: 'string', enum: ['category', 'tag', 'collection'] },
        action: { type: 'string', enum: ['create', 'update'] },
        category_id: { type: 'string', description: 'Required for update' },
        name: { type: 'string', description: 'Category name' },
        slug: { type: 'string', description: 'URL slug (optional)' },
        description: { type: 'string' },
        parent_id: { type: 'string', description: 'Parent category ID (optional)' },
      },
      required: ['credentials', 'taxonomy', 'action', 'name'],
    },
  },

  // ──────────────────────────────────────────────────────────────
  // Products (Shopify/WooCommerce - optionnel)
  // ──────────────────────────────────────────────────────────────
  {
    name: 'get_cms_products',
    description:
      'Lists products (Shopify/WooCommerce). Returns empty array if e-commerce not installed.',
    inputSchema: {
      type: 'object',
      properties: {
        credentials: { type: 'object', description: 'CMS credentials' },
        search: { type: 'string' },
        status: { type: 'string', enum: ['active', 'draft', 'archived', 'any'] },
        collection: { type: 'string', description: 'Filter by collection (Shopify)' },
        limit: { type: 'number' },
        offset: { type: 'number' },
      },
      required: ['credentials'],
    },
  },
  {
    name: 'update_cms_product',
    description:
      'Updates product title, description, SEO meta, or image alt texts. Requires approval.',
    inputSchema: {
      type: 'object',
      properties: {
        credentials: { type: 'object', description: 'CMS credentials' },
        product_id: { type: 'string', description: 'Product ID' },
        title: { type: 'string' },
        description: { type: 'string' },
        seo_meta: { type: 'object' },
        images: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              alt_text: { type: 'string' },
            },
          },
        },
      },
      required: ['credentials', 'product_id'],
    },
  },
  {
    name: 'bulk_update_cms_seo',
    description:
      'Batch updates SEO metadata for multiple items. Requires approval. Useful for mass optimization.',
    inputSchema: {
      type: 'object',
      properties: {
        credentials: { type: 'object', description: 'CMS credentials' },
        content_type: { type: 'string', enum: ['post', 'page', 'product'] },
        updates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              content_id: { type: 'string' },
              seo_meta: { type: 'object' },
            },
          },
        },
      },
      required: ['credentials', 'content_type', 'updates'],
    },
  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MCP Server Setup
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const server = new Server(
  {
    name: 'cms-connector-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// List Tools Handler
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Call Tool Handler
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    // 1. Valider les arguments
    if (!args || typeof args !== 'object') {
      throw new Error('Invalid arguments');
    }

    // 2. Valider les credentials
    assertDefined(args.credentials, 'credentials');
    const credentials = args.credentials as CMSCredentials;

    // 3. Rate limiting par site_url
    const rateLimitCheck = globalRateLimiter.check(credentials.site_url);
    if (!rateLimitCheck.allowed) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: 'Rate limit exceeded',
                retryAfter: rateLimitCheck.retryAfter,
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }

    // 3. Créer l'adapter
    const adapter = createAdapter(credentials);

    // 4. Router vers la bonne fonction
    let result: any;

    switch (name) {
      // ──────────────────────────────────────────────────────────
      // Authentication & Site Info
      // ──────────────────────────────────────────────────────────
      case 'validate_cms_credentials':
        result = await adapter.validateCredentials();
        break;

      case 'get_cms_site_info':
        result = await adapter.getSiteInfo();
        break;

      // ──────────────────────────────────────────────────────────
      // Posts
      // ──────────────────────────────────────────────────────────
      case 'get_cms_posts':
        result = await adapter.getPosts(args as any);
        break;

      case 'get_cms_post':
        assertDefined(args.post_id, 'post_id');
        result = await adapter.getPost({ post_id: args.post_id as string });
        break;

      case 'create_cms_post':
        assertDefined(args.title, 'title');
        assertDefined(args.content, 'content');

        // Sanitize content avant création
        const sanitizedContent = sanitizeHTML(args.content as string);
        const truncatedContent = truncateContent(sanitizedContent);

        result = await adapter.createPost({
          title: args.title as string,
          content: truncatedContent,
          excerpt: args.excerpt as string | undefined,
          categories: args.categories as string[] | undefined,
          tags: args.tags as string[] | undefined,
          featured_image_id: args.featured_image_id as string | undefined,
          seo_meta: args.seo_meta ? sanitizeSEOMeta(args.seo_meta as any) : undefined,
        });
        break;

      case 'update_cms_post':
        assertDefined(args.post_id, 'post_id');

        const updateResult = await adapter.updatePost({
          post_id: args.post_id as string,
          title: args.title as string | undefined,
          content: args.content
            ? truncateContent(sanitizeHTML(args.content as string))
            : undefined,
          excerpt: args.excerpt as string | undefined,
          status: args.status as 'draft' | 'published' | 'pending' | undefined,
          categories: args.categories as string[] | undefined,
          tags: args.tags as string[] | undefined,
          featured_image_id: args.featured_image_id as string | undefined,
          seo_meta: args.seo_meta ? sanitizeSEOMeta(args.seo_meta as any) : undefined,
        });

        // Enregistrer la mutation
        if (updateResult.success) {
          recordMutation(updateResult, {
            cms_type: credentials.cms_type,
            site_url: credentials.site_url,
            action: 'update',
          });
        }

        result = updateResult;
        break;

      case 'delete_cms_post':
        assertDefined(args.post_id, 'post_id');

        const deleteResult = await adapter.deletePost({ post_id: args.post_id as string });

        if (deleteResult.success) {
          recordMutation(deleteResult, {
            cms_type: credentials.cms_type,
            site_url: credentials.site_url,
            action: 'delete',
          });
        }

        result = deleteResult;
        break;

      // ──────────────────────────────────────────────────────────
      // Pages
      // ──────────────────────────────────────────────────────────
      case 'get_cms_pages':
        result = await adapter.getPages(args as any);
        break;

      case 'update_cms_page':
        assertDefined(args.page_id, 'page_id');

        const pageUpdateResult = await adapter.updatePage({
          page_id: args.page_id as string,
          title: args.title as string | undefined,
          content: args.content
            ? truncateContent(sanitizeHTML(args.content as string))
            : undefined,
          status: args.status as 'draft' | 'published' | undefined,
          seo_meta: args.seo_meta ? sanitizeSEOMeta(args.seo_meta as any) : undefined,
        });

        if (pageUpdateResult.success) {
          recordMutation(pageUpdateResult, {
            cms_type: credentials.cms_type,
            site_url: credentials.site_url,
            action: 'update',
          });
        }

        result = pageUpdateResult;
        break;

      // ──────────────────────────────────────────────────────────
      // Media
      // ──────────────────────────────────────────────────────────
      case 'get_cms_media':
        result = await adapter.getMedia(args as any);
        break;

      case 'upload_cms_media':
        assertDefined(args.filename, 'filename');
        result = await adapter.uploadMedia(args as any);
        break;

      // ──────────────────────────────────────────────────────────
      // SEO Meta
      // ──────────────────────────────────────────────────────────
      case 'update_cms_seo_meta':
        assertDefined(args.content_type, 'content_type');
        assertDefined(args.content_id, 'content_id');
        assertDefined(args.seo_meta, 'seo_meta');

        const seoUpdateResult = await adapter.updateSEOMeta({
          content_type: args.content_type as 'post' | 'page' | 'product',
          content_id: args.content_id as string,
          seo_meta: sanitizeSEOMeta(args.seo_meta as any),
        });

        if (seoUpdateResult.success) {
          recordMutation(seoUpdateResult, {
            cms_type: credentials.cms_type,
            site_url: credentials.site_url,
            action: 'update',
          });
        }

        result = seoUpdateResult;
        break;

      // ──────────────────────────────────────────────────────────
      // Taxonomies
      // ──────────────────────────────────────────────────────────
      case 'get_cms_categories':
        assertDefined(args.taxonomy, 'taxonomy');
        result = await adapter.getCategories({
          taxonomy: args.taxonomy as 'category' | 'tag' | 'collection',
        });
        break;

      case 'manage_cms_category':
        assertDefined(args.taxonomy, 'taxonomy');
        assertDefined(args.action, 'action');
        assertDefined(args.name, 'name');
        result = await adapter.manageCategory({
          taxonomy: args.taxonomy as 'category' | 'tag' | 'collection',
          action: args.action as 'create' | 'update',
          category_id: args.category_id as string | undefined,
          name: args.name as string,
          slug: args.slug as string | undefined,
          description: args.description as string | undefined,
          parent_id: args.parent_id as string | undefined,
        });
        break;

      // ──────────────────────────────────────────────────────────
      // Products (optionnel)
      // ──────────────────────────────────────────────────────────
      case 'get_cms_products':
        if (adapter.getProducts) {
          result = await adapter.getProducts(args as any);
        } else {
          result = { items: [], total: 0, limit: 10, offset: 0, has_more: false };
        }
        break;

      case 'update_cms_product':
        assertDefined(args.product_id, 'product_id');
        if (adapter.updateProduct) {
          const productUpdateResult = await adapter.updateProduct({
            product_id: args.product_id as string,
            title: args.title as string | undefined,
            description: args.description as string | undefined,
            seo_meta: args.seo_meta ? sanitizeSEOMeta(args.seo_meta as any) : undefined,
            images: args.images as any,
          });

          if (productUpdateResult.success) {
            recordMutation(productUpdateResult, {
              cms_type: credentials.cms_type,
              site_url: credentials.site_url,
              action: 'update',
            });
          }

          result = productUpdateResult;
        } else {
          throw new Error('Product management not supported for this CMS');
        }
        break;

      case 'bulk_update_cms_seo':
        assertDefined(args.content_type, 'content_type');
        assertDefined(args.updates, 'updates');
        if (adapter.bulkUpdateSEO) {
          const bulkResult = await adapter.bulkUpdateSEO({
            content_type: args.content_type as 'post' | 'page' | 'product',
            updates: (args.updates as any[]).map((update: any) => ({
              content_id: update.content_id,
              seo_meta: sanitizeSEOMeta(update.seo_meta),
            })),
          });

          if (bulkResult.success) {
            recordMutation(bulkResult, {
              cms_type: credentials.cms_type,
              site_url: credentials.site_url,
              action: 'update',
            });
          }

          result = bulkResult;
        } else {
          throw new Error('Bulk SEO update not supported for this CMS');
        }
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    // 5. Retourner le résultat
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    logError(`tool:${name}`, error, { args });

    const formattedError = formatErrorForClient(error);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(formattedError, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Start Server
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('CMS Connector MCP Server running on stdio');
  console.error('16 tools available: WordPress (Shopify/Webflow coming soon)');
}

main().catch((error) => {
  logError('main', error);
  process.exit(1);
});
