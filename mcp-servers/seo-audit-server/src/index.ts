#!/usr/bin/env node

/**
 * MCP Server for SEO Auditing & Analysis
 * Agent: LUNA (Strategist)
 *
 * Features:
 * - Technical SEO audits
 * - PageSpeed Insights integration
 * - Site health checks
 * - Schema markup validation
 * - Semantic content analysis
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as dotenv from 'dotenv';

dotenv.config();

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || '';
const PAGESPEED_API = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

// ─────────────────────────────────────────────────────────────────
// Tool Definitions
// ─────────────────────────────────────────────────────────────────

const TOOLS: Tool[] = [
  {
    name: 'technical_seo_audit',
    description: 'Perform comprehensive technical SEO audit including HTTPS, mobile-friendliness, indexability, and site speed',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'Website URL to audit (e.g., https://example.com)',
        },
        include_pagespeed: {
          type: 'boolean',
          description: 'Include Google PageSpeed Insights data',
          default: true,
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'pagespeed_insights',
    description: 'Get Google PageSpeed scores and Core Web Vitals for mobile and desktop',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'Page URL to analyze',
        },
        strategy: {
          type: 'string',
          enum: ['mobile', 'desktop', 'both'],
          description: 'Device type to test',
          default: 'both',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'semantic_audit',
    description: 'Analyze on-page SEO: meta tags, headings, keyword density, content quality',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'Page URL to analyze',
        },
        target_keywords: {
          type: 'array',
          items: { type: 'string' },
          description: 'Keywords to check presence and density',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'site_health_check',
    description: 'Crawl website to find broken links, redirects, 5xx errors, and sitemap coverage',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'Website base URL',
        },
        max_pages: {
          type: 'number',
          description: 'Maximum pages to crawl',
          default: 50,
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'schema_markup_check',
    description: 'Verify structured data (JSON-LD, Microdata) and identify schema types',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'Page URL to check',
        },
      },
      required: ['url'],
    },
  },
];

// ─────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────

async function technicalSEOAudit(params: any) {
  const { url, include_pagespeed = true } = params;

  try {
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 SEO-Audit-Bot/1.0' },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const isHTTPS = url.startsWith('https://');
    const hasCanonical = $('link[rel="canonical"]').length > 0;
    const hasViewport = $('meta[name="viewport"]').length > 0;
    const hasRobots = $('meta[name="robots"]').length > 0;

    let pagespeedData = null;
    if (include_pagespeed && GOOGLE_API_KEY) {
      pagespeedData = await getPageSpeedInsights(url, 'mobile');
    }

    return {
      success: true,
      audit: {
        url,
        https: isHTTPS,
        mobile_friendly: hasViewport,
        canonical_tag: hasCanonical,
        robots_meta: hasRobots,
        title_tag: $('title').text() || 'Missing',
        meta_description: $('meta[name="description"]').attr('content') || 'Missing',
        h1_count: $('h1').length,
        images_without_alt: $('img:not([alt])').length,
        internal_links: $('a[href^="/"], a[href*="' + new URL(url).hostname + '"]').length,
        external_links: $('a[href^="http"]').not('[href*="' + new URL(url).hostname + '"]').length,
      },
      pagespeed: pagespeedData,
      recommendations: generateRecommendations({
        isHTTPS,
        hasCanonical,
        hasViewport,
        hasRobots,
        h1Count: $('h1').length,
        imagesWithoutAlt: $('img:not([alt])').length,
      }),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function getPageSpeedInsights(url: string, strategy: string) {
  if (!GOOGLE_API_KEY) {
    return { error: 'GOOGLE_API_KEY not configured' };
  }

  try {
    const response = await axios.get(PAGESPEED_API, {
      params: {
        url,
        strategy,
        key: GOOGLE_API_KEY,
        category: ['performance', 'accessibility', 'best-practices', 'seo'],
      },
    });

    const { lighthouseResult } = response.data;
    const categories = lighthouseResult.categories;
    const audits = lighthouseResult.audits;

    return {
      scores: {
        performance: Math.round((categories.performance?.score || 0) * 100),
        accessibility: Math.round((categories.accessibility?.score || 0) * 100),
        best_practices: Math.round((categories['best-practices']?.score || 0) * 100),
        seo: Math.round((categories.seo?.score || 0) * 100),
      },
      core_web_vitals: {
        lcp: audits['largest-contentful-paint']?.displayValue || 'N/A',
        fid: audits['max-potential-fid']?.displayValue || 'N/A',
        cls: audits['cumulative-layout-shift']?.displayValue || 'N/A',
        fcp: audits['first-contentful-paint']?.displayValue || 'N/A',
        ttfb: audits['server-response-time']?.displayValue || 'N/A',
      },
      strategy,
    };
  } catch (error: any) {
    return {
      error: error.response?.data?.error?.message || error.message,
    };
  }
}

async function semanticAudit(params: any) {
  const { url, target_keywords = [] } = params;

  try {
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 SEO-Audit-Bot/1.0' },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const bodyText = $('body').text().toLowerCase();
    const title = $('title').text();
    const metaDesc = $('meta[name="description"]').attr('content') || '';

    const headings = {
      h1: $('h1').map((_, el) => $(el).text()).get(),
      h2: $('h2').map((_, el) => $(el).text()).get(),
      h3: $('h3').map((_, el) => $(el).text()).get(),
    };

    const keywordAnalysis = target_keywords.map((keyword: string) => {
      const kwLower = keyword.toLowerCase();
      const count = (bodyText.match(new RegExp(kwLower, 'g')) || []).length;
      const density = ((count / bodyText.split(' ').length) * 100).toFixed(2);

      return {
        keyword,
        count,
        density: `${density}%`,
        in_title: title.toLowerCase().includes(kwLower),
        in_meta_desc: metaDesc.toLowerCase().includes(kwLower),
        in_h1: headings.h1.some((h: string) => h.toLowerCase().includes(kwLower)),
      };
    });

    return {
      success: true,
      analysis: {
        url,
        title: {
          text: title,
          length: title.length,
          optimal: title.length >= 30 && title.length <= 60,
        },
        meta_description: {
          text: metaDesc,
          length: metaDesc.length,
          optimal: metaDesc.length >= 120 && metaDesc.length <= 160,
        },
        headings,
        word_count: bodyText.split(' ').length,
        keywords: keywordAnalysis,
        images: {
          total: $('img').length,
          with_alt: $('img[alt]').length,
          without_alt: $('img:not([alt])').length,
        },
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function siteHealthCheck(params: any) {
  const { url, max_pages = 50 } = params;

  try {
    const baseUrl = new URL(url);
    const visited = new Set<string>();
    const issues: any[] = [];
    const toVisit = [url];

    while (toVisit.length > 0 && visited.size < max_pages) {
      const currentUrl = toVisit.pop()!;
      if (visited.has(currentUrl)) continue;

      visited.add(currentUrl);

      try {
        const response = await axios.get(currentUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 SEO-Health-Bot/1.0' },
          timeout: 5000,
          maxRedirects: 0,
          validateStatus: () => true,
        });

        if (response.status === 404) {
          issues.push({ type: '404', url: currentUrl });
        } else if (response.status >= 500) {
          issues.push({ type: '5xx', url: currentUrl, status: response.status });
        } else if (response.status >= 300 && response.status < 400) {
          issues.push({
            type: 'redirect',
            url: currentUrl,
            status: response.status,
            location: response.headers.location,
          });
        }

        if (response.status === 200) {
          const $ = cheerio.load(response.data);
          $('a[href]').each((_, el) => {
            const href = $(el).attr('href');
            if (!href) return;

            try {
              const absoluteUrl = new URL(href, currentUrl);
              if (absoluteUrl.hostname === baseUrl.hostname && !visited.has(absoluteUrl.href)) {
                toVisit.push(absoluteUrl.href);
              }
            } catch {}
          });
        }
      } catch (error: any) {
        issues.push({ type: 'error', url: currentUrl, error: error.message });
      }
    }

    return {
      success: true,
      health_check: {
        pages_crawled: visited.size,
        issues_found: issues.length,
        issues,
        breakdown: {
          not_found: issues.filter((i) => i.type === '404').length,
          server_errors: issues.filter((i) => i.type === '5xx').length,
          redirects: issues.filter((i) => i.type === 'redirect').length,
          other_errors: issues.filter((i) => i.type === 'error').length,
        },
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function schemaMarkupCheck(params: any) {
  const { url } = params;

  try {
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 SEO-Schema-Bot/1.0' },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const schemas: any[] = [];

    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const schema = JSON.parse($(el).html() || '{}');
        schemas.push(schema);
      } catch {}
    });

    return {
      success: true,
      schema_check: {
        url,
        json_ld_found: schemas.length,
        schemas: schemas.map((s) => ({
          type: s['@type'] || 'Unknown',
          context: s['@context'] || 'Unknown',
        })),
        raw_schemas: schemas,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

function generateRecommendations(audit: any) {
  const recommendations: string[] = [];

  if (!audit.isHTTPS) {
    recommendations.push('🔒 Enable HTTPS for security and SEO benefits');
  }
  if (!audit.hasCanonical) {
    recommendations.push('🔗 Add canonical tags to prevent duplicate content issues');
  }
  if (!audit.hasViewport) {
    recommendations.push('📱 Add viewport meta tag for mobile-friendliness');
  }
  if (audit.h1Count === 0) {
    recommendations.push('📝 Add at least one H1 heading per page');
  }
  if (audit.h1Count > 1) {
    recommendations.push('⚠️ Use only one H1 heading per page');
  }
  if (audit.imagesWithoutAlt > 0) {
    recommendations.push(`🖼️ Add alt text to ${audit.imagesWithoutAlt} images for accessibility and SEO`);
  }

  return recommendations;
}

// ─────────────────────────────────────────────────────────────────
// MCP Server Setup
// ─────────────────────────────────────────────────────────────────

const server = new Server(
  {
    name: 'seo-audit-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args) {
    throw new Error('Arguments are required');
  }

  try {
    let result;

    switch (name) {
      case 'technical_seo_audit':
        result = await technicalSEOAudit(args);
        break;
      case 'pagespeed_insights':
        result = await getPageSpeedInsights(String(args.url), String(args.strategy || 'both'));
        break;
      case 'semantic_audit':
        result = await semanticAudit(args);
        break;
      case 'site_health_check':
        result = await siteHealthCheck(args);
        break;
      case 'schema_markup_check':
        result = await schemaMarkupCheck(args);
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2),
      }],
    };
  } catch (error: any) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: false,
          error: error.message,
          tool: name,
        }, null, 2),
      }],
      isError: true,
    };
  }
});

async function main() {
  console.error('SEO Audit MCP Server starting...');
  console.error(`Google API Key: ${GOOGLE_API_KEY ? 'Configured ✓' : 'Missing (PageSpeed disabled)'}`);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('SEO Audit MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
