#!/usr/bin/env node

/**
 * MCP Server for Google Tag Manager
 * Allows Sora to manage GTM containers, tags, triggers, and variables
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

const tagmanager = google.tagmanager('v2');

// Initialize MCP Server
const server = new Server(
  {
    name: 'gtm-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Helper: Get OAuth2 Client from credentials
function getOAuth2Client(credentials: any): OAuth2Client {
  const { access_token, refresh_token, expiry_date } = credentials;

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token,
    refresh_token,
    expiry_date,
  });

  return oauth2Client;
}

// Define available tools
const tools: Tool[] = [
  {
    name: 'gtm_list_containers',
    description: 'Liste tous les conteneurs GTM d\'un compte Google Tag Manager',
    inputSchema: {
      type: 'object',
      properties: {
        account_id: {
          type: 'string',
          description: 'ID du compte GTM (format: "accounts/123456")',
        },
        credentials: {
          type: 'object',
          description: 'OAuth2 credentials (access_token, refresh_token)',
        },
      },
      required: ['account_id', 'credentials'],
    },
  },
  {
    name: 'gtm_list_tags',
    description: 'Liste tous les tags dans un conteneur GTM',
    inputSchema: {
      type: 'object',
      properties: {
        container_id: {
          type: 'string',
          description: 'ID du conteneur GTM (format: "accounts/123/containers/456")',
        },
        workspace_id: {
          type: 'string',
          description: 'ID du workspace (optionnel, défaut = workspace par défaut)',
        },
        credentials: {
          type: 'object',
          description: 'OAuth2 credentials',
        },
      },
      required: ['container_id', 'credentials'],
    },
  },
  {
    name: 'gtm_create_tag',
    description: 'Crée un nouveau tag dans GTM (GA4, Google Ads Conversion, Conversion Linker, Custom HTML)',
    inputSchema: {
      type: 'object',
      properties: {
        container_id: {
          type: 'string',
          description: 'ID du conteneur GTM',
        },
        tag_config: {
          type: 'object',
          description: 'Configuration du tag',
          properties: {
            name: { type: 'string', description: 'Nom du tag (ex: "GA4 Configuration")' },
            type: {
              type: 'string',
              description: 'Type de tag: gaawe (GA4), awct (Google Ads), gclidw (Conversion Linker), html (Custom HTML)',
            },
            parameters: { type: 'array', description: 'Paramètres du tag' },
            firing_trigger_ids: {
              type: 'array',
              description: 'IDs des déclencheurs (ex: ["2147479553"] pour All Pages)',
            },
          },
        },
        credentials: {
          type: 'object',
          description: 'OAuth2 credentials',
        },
      },
      required: ['container_id', 'tag_config', 'credentials'],
    },
  },
  {
    name: 'gtm_create_trigger',
    description: 'Crée un déclencheur (trigger) dans GTM pour activer les tags',
    inputSchema: {
      type: 'object',
      properties: {
        container_id: { type: 'string' },
        trigger_config: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Nom du trigger (ex: "Click - Email Links")' },
            type: {
              type: 'string',
              description: 'Type: pageview, linkClick, formSubmission, customEvent',
            },
            filters: { type: 'array', description: 'Conditions du trigger' },
          },
        },
        credentials: { type: 'object' },
      },
      required: ['container_id', 'trigger_config', 'credentials'],
    },
  },
  {
    name: 'gtm_create_variable',
    description: 'Crée une variable GTM pour capturer des données du Data Layer',
    inputSchema: {
      type: 'object',
      properties: {
        container_id: { type: 'string' },
        variable_config: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Nom de la variable (ex: "DLV - Transaction ID")' },
            type: { type: 'string', description: 'Type: v (Data Layer Variable), u (URL), etc.' },
            parameters: { type: 'array' },
          },
        },
        credentials: { type: 'object' },
      },
      required: ['container_id', 'variable_config', 'credentials'],
    },
  },
  {
    name: 'gtm_publish_version',
    description: 'Publie une nouvelle version du conteneur GTM (met en ligne les modifications)',
    inputSchema: {
      type: 'object',
      properties: {
        container_id: { type: 'string' },
        version_name: {
          type: 'string',
          description: 'Nom de la version (ex: "v1.2 - GA4 Setup by Sora")',
        },
        version_description: { type: 'string', description: 'Description des changements' },
        credentials: { type: 'object' },
      },
      required: ['container_id', 'version_name', 'credentials'],
    },
  },
  {
    name: 'gtm_preview_mode',
    description: 'Active le mode Preview (debug) pour tester les tags avant publication',
    inputSchema: {
      type: 'object',
      properties: {
        container_id: { type: 'string' },
        credentials: { type: 'object' },
      },
      required: ['container_id', 'credentials'],
    },
  },
];

// Handle tool list request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args) {
    throw new Error('Arguments are required');
  }

  try {
    const auth = getOAuth2Client(args.credentials as any);

    switch (name) {
      case 'gtm_list_containers': {
        const response = await tagmanager.accounts.containers.list({
          auth,
          parent: args.account_id as string,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                containers: response.data.container?.map((c: any) => ({
                  container_id: c.path,
                  name: c.name,
                  public_id: c.publicId,
                  usage_context: c.usageContext,
                  domain_name: c.domainName,
                })) || [],
              }, null, 2),
            },
          ],
        };
      }

      case 'gtm_list_tags': {
        const workspacePath = (args.workspace_id as string) || `${args.container_id}/workspaces/default`;

        const response = await tagmanager.accounts.containers.workspaces.tags.list({
          auth,
          parent: workspacePath as string,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                tags: response.data.tag?.map((t: any) => ({
                  tag_id: t.tagId,
                  name: t.name,
                  type: t.type,
                  firing_triggers: t.firingTriggerId,
                  parameters: t.parameter,
                })) || [],
              }, null, 2),
            },
          ],
        };
      }

      case 'gtm_create_tag': {
        const tagConfig = args.tag_config as any;
        const workspacePath = `${args.container_id}/workspaces/default`;

        const response = await tagmanager.accounts.containers.workspaces.tags.create({
          auth,
          parent: workspacePath as string,
          requestBody: {
            name: tagConfig.name,
            type: tagConfig.type,
            parameter: tagConfig.parameters,
            firingTriggerId: tagConfig.firing_trigger_ids,
            tagFiringOption: 'oncePerEvent',
          },
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                tag_id: response.data.tagId,
                tag_name: response.data.name,
                message: 'Tag créé avec succès',
              }, null, 2),
            },
          ],
        };
      }

      case 'gtm_create_trigger': {
        const triggerConfig = args.trigger_config as any;
        const workspacePath = `${args.container_id}/workspaces/default`;

        const response = await tagmanager.accounts.containers.workspaces.triggers.create({
          auth,
          parent: workspacePath as string,
          requestBody: {
            name: triggerConfig.name,
            type: triggerConfig.type,
            filter: triggerConfig.filters,
          },
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                trigger_id: response.data.triggerId,
                trigger_name: response.data.name,
              }, null, 2),
            },
          ],
        };
      }

      case 'gtm_create_variable': {
        const variableConfig = args.variable_config as any;
        const workspacePath = `${args.container_id}/workspaces/default`;

        const response = await tagmanager.accounts.containers.workspaces.variables.create({
          auth,
          parent: workspacePath as string,
          requestBody: {
            name: variableConfig.name,
            type: variableConfig.type,
            parameter: variableConfig.parameters,
          },
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                variable_id: response.data.variableId,
                variable_name: response.data.name,
              }, null, 2),
            },
          ],
        };
      }

      case 'gtm_publish_version': {
        // Step 1: Create version
        const workspacePath = `${args.container_id}/workspaces/default`;

        const createVersionResponse = await tagmanager.accounts.containers.workspaces.create_version({
          auth,
          path: workspacePath as string,
          requestBody: {
            name: args.version_name as string,
            notes: (args.version_description as string) || '',
          },
        });

        // Step 2: Publish version
        const versionPath = createVersionResponse.data.containerVersion?.path as string;

        await tagmanager.accounts.containers.versions.publish({
          auth,
          path: versionPath,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                version_id: createVersionResponse.data.containerVersion?.containerVersionId,
                container_version_id: versionPath,
                message: 'Version publiée avec succès',
              }, null, 2),
            },
          ],
        };
      }

      case 'gtm_preview_mode': {
        // GTM Preview Mode must be activated manually by the user
        // We return the URL to access it
        const containerIdParts = (args.container_id as string).split('/');
        const containerPublicId = containerIdParts.pop();
        const accountId = containerIdParts[1];

        const previewUrl = `https://tagmanager.google.com/#/container/accounts/${accountId}/containers/${containerPublicId}/workspaces/default/preview`;

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                preview_url: previewUrl,
                message: 'Mode Preview activé. Colle cette URL dans ton navigateur pour tester.',
              }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error.message,
            details: error.response?.data || error.toString(),
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('GTM MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
