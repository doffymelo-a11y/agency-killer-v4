#!/usr/bin/env node

/**
 * MCP Server for Web Intelligence & Browsing
 * Hive OS V5 - Phase 1.1 (Cheerio/Axios tools)
 *
 * Features:
 * - Web scraping (structured content extraction)
 * - Text extraction (Readability)
 * - Competitor analysis (tech stack, SEO, pixels)
 * - Social meta validation (Open Graph, Twitter Cards)
 * - Link checking (broken links, redirects)
 *
 * Agents: LUNA, SORA, MARCUS, MILO
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import * as dotenv from 'dotenv';

// Tool imports
import { webScrape } from './tools/web-scrape.js';
import { webExtractText } from './tools/web-extract-text.js';
import { competitorAnalysis } from './tools/competitor-analysis.js';
import { socialMetaCheck } from './tools/social-meta-check.js';
import { linkChecker } from './tools/link-checker.js';
import { webScreenshot } from './tools/web-screenshot.js';
import { landingPageAudit } from './tools/landing-page-audit.js';
import { adVerification } from './tools/ad-verification.js';

dotenv.config();

// ─────────────────────────────────────────────────────────────────
// Tool Definitions
// ─────────────────────────────────────────────────────────────────

const TOOLS: Tool[] = [
  {
    name: 'web_scrape',
    description:
      'Extract structured content from a web page: title, meta tags, headings (H1-H3), links (internal/external), and images. Uses Cheerio for fast HTML parsing.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL to scrape (must be http or https)',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'web_extract_text',
    description:
      'Extract clean article text from a web page using Mozilla Readability. Removes navigation, ads, and sidebars to get the main content. Returns both HTML and plain text.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL to extract text from',
        },
        remove_pii: {
          type: 'boolean',
          description: 'Remove personally identifiable information (emails, phones, SSNs)',
          default: true,
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'competitor_analysis',
    description:
      'Comprehensive competitive analysis: detect tech stack (CMS, frameworks, analytics), SEO structure, social links, tracking pixels (Meta, GA4, TikTok), and performance metrics.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'Competitor website URL to analyze',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'social_meta_check',
    description:
      'Validate social sharing meta tags: Open Graph (Facebook), Twitter Cards, and basic SEO meta. Identifies missing tags, formatting issues, and provides recommendations.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL to check social meta tags',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'link_checker',
    description:
      'Check all links on a page in parallel. Detects broken links (404), redirects (3xx), server errors (5xx), and timeouts. Returns summary statistics and individual link status.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL of the page to check links on',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'web_screenshot',
    description:
      'Capture screenshot of a web page using Playwright. Supports multi-device presets (desktop 1280x800, mobile iPhone 375x812, tablet iPad 768x1024). Can capture full-page or viewport only. Uploads to Cloudinary CDN.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL to screenshot',
        },
        device: {
          type: 'string',
          enum: ['desktop', 'mobile', 'tablet'],
          description: 'Device preset to use',
          default: 'desktop',
        },
        full_page: {
          type: 'boolean',
          description: 'Capture full page (scroll height) or just viewport',
          default: false,
        },
        wait_for_selector: {
          type: 'string',
          description: 'Optional CSS selector to wait for before screenshot',
        },
        wait_time: {
          type: 'number',
          description: 'Additional wait time in ms before screenshot (for animations)',
          default: 1000,
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'landing_page_audit',
    description:
      'Comprehensive landing page audit with score 0-100. Checks: CTA visible above fold, form present, mobile responsive (viewport meta), load time < 3s, HTTPS enabled, trust signals (testimonials, security badges, social proof). Returns screenshot and actionable recommendations.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'Landing page URL to audit',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'ad_verification',
    description:
      'Verify tracking pixels installation via Playwright network interception. Detects: Meta Pixel (Facebook), Google Analytics 4 (GA4), Google Tag Manager (GTM), Google Ads conversion tag, TikTok Pixel, LinkedIn Insight Tag. Captures network requests and extracts pixel IDs. Returns screenshot as proof.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL to verify tracking pixels on',
        },
      },
      required: ['url'],
    },
  },
];

// ─────────────────────────────────────────────────────────────────
// MCP Server Setup
// ─────────────────────────────────────────────────────────────────

const server = new Server(
  {
    name: 'web-intelligence-mcp-server',
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
      case 'web_scrape':
        result = await webScrape(String(args.url));
        break;

      case 'web_extract_text':
        result = await webExtractText(String(args.url), Boolean(args.remove_pii ?? true));
        break;

      case 'competitor_analysis':
        result = await competitorAnalysis(String(args.url));
        break;

      case 'social_meta_check':
        result = await socialMetaCheck(String(args.url));
        break;

      case 'link_checker':
        result = await linkChecker(String(args.url));
        break;

      case 'web_screenshot':
        result = await webScreenshot(
          String(args.url),
          (args.device as any) || 'desktop',
          {
            fullPage: Boolean(args.full_page),
            waitForSelector: args.wait_for_selector ? String(args.wait_for_selector) : undefined,
            waitTime: args.wait_time ? Number(args.wait_time) : undefined,
          }
        );
        break;

      case 'landing_page_audit':
        result = await landingPageAudit(String(args.url));
        break;

      case 'ad_verification':
        result = await adVerification(String(args.url));
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: false,
              error: error.message,
              tool: name,
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  console.error('Web Intelligence MCP Server starting...');
  console.error('Phase 1.2 COMPLETE - Cheerio/Axios + Playwright Tools (8 tools available)');
  console.error('Cheerio Tools: web_scrape, web_extract_text, competitor_analysis, social_meta_check, link_checker');
  console.error('Playwright Tools: web_screenshot, landing_page_audit, ad_verification');

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Web Intelligence MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
