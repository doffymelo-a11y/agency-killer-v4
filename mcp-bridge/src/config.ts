/**
 * MCP Bridge Server - Configuration
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3456', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',

  // MCP Servers
  mcpServersPath: process.env.MCP_SERVERS_PATH || path.join(process.cwd(), '../mcp-servers'),

  // Google Cloud (Nano Banana Pro, VEO3)
  googleCloud: {
    projectId: process.env.GOOGLE_CLOUD_PROJECT || '',
    location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
    credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS || '',
  },

  // ElevenLabs
  elevenlabs: {
    apiKey: process.env.ELEVENLABS_API_KEY || '',
  },

  // Meta Ads
  metaAds: {
    accessToken: process.env.META_ACCESS_TOKEN || '',
    adAccountId: process.env.META_AD_ACCOUNT_ID || '',
  },

  // Google Ads
  googleAds: {
    developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '',
    clientId: process.env.GOOGLE_ADS_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET || '',
    refreshToken: process.env.GOOGLE_ADS_REFRESH_TOKEN || '',
    customerId: process.env.GOOGLE_ADS_CUSTOMER_ID || '',
  },

  // GTM
  gtm: {
    containerId: process.env.GTM_CONTAINER_ID || '',
  },

  // Looker
  looker: {
    baseUrl: process.env.LOOKER_BASE_URL || '',
    clientId: process.env.LOOKER_CLIENT_ID || '',
    clientSecret: process.env.LOOKER_CLIENT_SECRET || '',
  },

  // Cloudinary (CDN for MILO image storage)
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
};

// Server definitions
export const mcpServers = {
  'nano-banana-pro': {
    name: 'Nano Banana Pro',
    serverPath: path.join(config.mcpServersPath, 'nano-banana-pro-server'),
    command: 'node',
    args: ['dist/index.js'],
    env: {
      GOOGLE_CLOUD_PROJECT: config.googleCloud.projectId,
      GOOGLE_CLOUD_LOCATION: config.googleCloud.location,
      GOOGLE_APPLICATION_CREDENTIALS: config.googleCloud.credentials,
      CLOUDINARY_CLOUD_NAME: config.cloudinary.cloudName,
      CLOUDINARY_API_KEY: config.cloudinary.apiKey,
      CLOUDINARY_API_SECRET: config.cloudinary.apiSecret,
    },
  },
  'veo3': {
    name: 'VEO3 Video Generation',
    serverPath: path.join(config.mcpServersPath, 'veo3-server'),
    command: 'node',
    args: ['dist/index.js'],
    env: {
      GOOGLE_CLOUD_PROJECT: config.googleCloud.projectId,
      GOOGLE_CLOUD_LOCATION: config.googleCloud.location,
      GOOGLE_APPLICATION_CREDENTIALS: config.googleCloud.credentials,
      CLOUDINARY_CLOUD_NAME: config.cloudinary.cloudName,
      CLOUDINARY_API_KEY: config.cloudinary.apiKey,
      CLOUDINARY_API_SECRET: config.cloudinary.apiSecret,
    },
  },
  'elevenlabs': {
    name: 'ElevenLabs Audio',
    serverPath: path.join(config.mcpServersPath, 'elevenlabs-server'),
    command: 'node',
    args: ['dist/index.js'],
    env: {
      ELEVENLABS_API_KEY: config.elevenlabs.apiKey,
      CLOUDINARY_CLOUD_NAME: config.cloudinary.cloudName,
      CLOUDINARY_API_KEY: config.cloudinary.apiKey,
      CLOUDINARY_API_SECRET: config.cloudinary.apiSecret,
    },
  },
  'google-ads': {
    name: 'Google Ads',
    serverPath: path.join(config.mcpServersPath, 'google-ads-server'),
    command: 'node',
    args: ['dist/index.js'],
    env: {
      GOOGLE_ADS_DEVELOPER_TOKEN: config.googleAds.developerToken,
      GOOGLE_ADS_CLIENT_ID: config.googleAds.clientId,
      GOOGLE_ADS_CLIENT_SECRET: config.googleAds.clientSecret,
      GOOGLE_ADS_REFRESH_TOKEN: config.googleAds.refreshToken,
      GOOGLE_ADS_CUSTOMER_ID: config.googleAds.customerId,
    },
  },
  'meta-ads': {
    name: 'Meta Ads',
    serverPath: path.join(config.mcpServersPath, 'meta-ads-server'),
    command: 'node',
    args: ['dist/index.js'],
    env: {
      META_ACCESS_TOKEN: config.metaAds.accessToken,
      META_AD_ACCOUNT_ID: config.metaAds.adAccountId,
    },
  },
  'gtm': {
    name: 'Google Tag Manager',
    serverPath: path.join(config.mcpServersPath, 'gtm-server'),
    command: 'node',
    args: ['dist/index.js'],
    env: {
      GOOGLE_CLOUD_PROJECT: config.googleCloud.projectId,
      GOOGLE_APPLICATION_CREDENTIALS: config.googleCloud.credentials,
      GTM_CONTAINER_ID: config.gtm.containerId,
    },
  },
  'looker': {
    name: 'Looker Analytics',
    serverPath: path.join(config.mcpServersPath, 'looker-server'),
    command: 'node',
    args: ['dist/index.js'],
    env: {
      LOOKER_BASE_URL: config.looker.baseUrl,
      LOOKER_CLIENT_ID: config.looker.clientId,
      LOOKER_CLIENT_SECRET: config.looker.clientSecret,
    },
  },
  'seo-audit': {
    name: 'SEO Audit (LUNA)',
    serverPath: path.join(config.mcpServersPath, 'seo-audit-server'),
    command: 'node',
    args: ['dist/index.js'],
    env: {
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || '',
    },
  },
  'keyword-research': {
    name: 'Keyword Research (LUNA)',
    serverPath: path.join(config.mcpServersPath, 'keyword-research-server'),
    command: 'node',
    args: ['dist/index.js'],
    env: {
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || '',
    },
  },
  'budget-optimizer': {
    name: 'Budget Optimizer (MARCUS)',
    serverPath: path.join(config.mcpServersPath, 'budget-optimizer-server'),
    command: 'node',
    args: ['dist/index.js'],
    env: {},
  },
  'google-ads-launcher': {
    name: 'Google Ads Campaign Launcher (MARCUS)',
    serverPath: path.join(config.mcpServersPath, 'google-ads-launcher-server'),
    command: 'node',
    args: ['dist/index.js'],
    env: {
      GOOGLE_ADS_DEVELOPER_TOKEN: config.googleAds.developerToken,
      GOOGLE_ADS_CLIENT_ID: config.googleAds.clientId,
      GOOGLE_ADS_CLIENT_SECRET: config.googleAds.clientSecret,
      GOOGLE_ADS_REFRESH_TOKEN: config.googleAds.refreshToken,
      GOOGLE_ADS_CUSTOMER_ID: config.googleAds.customerId,
    },
  },
  'web-intelligence': {
    name: 'Web Intelligence & Browsing (ALL AGENTS)',
    serverPath: path.join(config.mcpServersPath, 'web-intelligence-server'),
    command: 'node',
    args: ['dist/index.js'],
    env: {
      CLOUDINARY_CLOUD_NAME: config.cloudinary.cloudName,
      CLOUDINARY_API_KEY: config.cloudinary.apiKey,
      CLOUDINARY_API_SECRET: config.cloudinary.apiSecret,
    },
  },
  'social-media': {
    name: 'Social Media Management (DOFFY)',
    serverPath: path.join(config.mcpServersPath, 'social-media-server'),
    command: 'node',
    args: ['dist/index.js'],
    env: {
      // Phase 2: No credentials needed (mock implementation)
      // Phase 3: OAuth tokens will be added here
    },
  },
  'cms-connector': {
    name: 'CMS Connector (WordPress/Shopify/Webflow) - LUNA',
    serverPath: path.join(config.mcpServersPath, 'cms-connector-server'),
    command: 'node',
    args: ['dist/index.js'],
    env: {
      // CMS credentials are passed per-call (multi-tenant model)
    },
  },
} as const;

export type MCPServerName = keyof typeof mcpServers;
