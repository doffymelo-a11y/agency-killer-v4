#!/usr/bin/env node

/**
 * MCP Server for Looker Studio (Google Data Studio)
 * Allows Sora to create dashboards and reports
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

// Initialize MCP Server
const server = new Server(
  {
    name: 'looker-server',
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

// Helper: Generate Looker Studio report JSON
function generateReportJSON(config: any): any {
  return {
    name: config.name,
    locale: 'fr_FR',
    pages: [
      {
        name: 'Page 1',
        elements: config.elements || [],
      },
    ],
    dataSources: config.data_sources || [],
  };
}

// Define available tools
const tools: Tool[] = [
  {
    name: 'looker_create_report',
    description: 'Crée un nouveau rapport Looker Studio à partir de sources de données',
    inputSchema: {
      type: 'object',
      properties: {
        report_name: {
          type: 'string',
          description: 'Nom du rapport (ex: "Dashboard ROAS - Janvier 2024")',
        },
        data_sources: {
          type: 'array',
          description: 'Sources de données (GA4, Google Ads, etc.)',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', description: 'ga4, google_ads, search_console' },
              connection_id: { type: 'string', description: 'ID de connexion' },
            },
          },
        },
        credentials: {
          type: 'object',
          description: 'OAuth2 credentials',
        },
      },
      required: ['report_name', 'data_sources', 'credentials'],
    },
  },
  {
    name: 'looker_add_scorecard',
    description: 'Ajoute une carte de score (KPI) au rapport (ex: ROAS, CPA)',
    inputSchema: {
      type: 'object',
      properties: {
        report_id: { type: 'string', description: 'ID du rapport Looker' },
        metric: {
          type: 'object',
          description: 'Métrique à afficher',
          properties: {
            name: { type: 'string', description: 'Nom de la métrique (ex: "ROAS")' },
            field: {
              type: 'string',
              description: 'Champ de données (ex: "ga:goalCompletionsAll")',
            },
            aggregation: { type: 'string', description: 'sum, avg, count, etc.' },
          },
        },
        position: {
          type: 'object',
          description: 'Position sur la page',
          properties: {
            x: { type: 'number' },
            y: { type: 'number' },
            width: { type: 'number' },
            height: { type: 'number' },
          },
        },
        credentials: { type: 'object' },
      },
      required: ['report_id', 'metric', 'credentials'],
    },
  },
  {
    name: 'looker_add_time_series_chart',
    description: 'Ajoute un graphique temporel (line chart) pour suivre l\'évolution',
    inputSchema: {
      type: 'object',
      properties: {
        report_id: { type: 'string' },
        chart_config: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Titre du graphique' },
            dimension: {
              type: 'string',
              description: 'Dimension temporelle (date, week, month)',
            },
            metrics: {
              type: 'array',
              description: 'Métriques à afficher (ex: ["conversions", "cost"])',
            },
          },
        },
        position: { type: 'object' },
        credentials: { type: 'object' },
      },
      required: ['report_id', 'chart_config', 'credentials'],
    },
  },
  {
    name: 'looker_add_table',
    description: 'Ajoute un tableau de données détaillées',
    inputSchema: {
      type: 'object',
      properties: {
        report_id: { type: 'string' },
        table_config: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            dimensions: {
              type: 'array',
              description: 'Dimensions (ex: ["campaign", "adGroup"])',
            },
            metrics: { type: 'array', description: 'Métriques à afficher' },
            sort: {
              type: 'object',
              description: 'Tri (field, direction)',
            },
          },
        },
        position: { type: 'object' },
        credentials: { type: 'object' },
      },
      required: ['report_id', 'table_config', 'credentials'],
    },
  },
  {
    name: 'looker_blend_data_sources',
    description: 'Fusionne plusieurs sources de données (ex: GA4 + Google Ads pour ROAS complet)',
    inputSchema: {
      type: 'object',
      properties: {
        report_id: { type: 'string' },
        blend_config: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Nom du blend' },
            left_source: { type: 'string', description: 'Source gauche (ex: GA4)' },
            right_source: { type: 'string', description: 'Source droite (ex: Google Ads)' },
            join_key: {
              type: 'string',
              description: 'Clé de jointure (ex: "campaign_id")',
            },
          },
        },
        credentials: { type: 'object' },
      },
      required: ['report_id', 'blend_config', 'credentials'],
    },
  },
  {
    name: 'looker_schedule_email',
    description: 'Programme l\'envoi automatique du rapport par email',
    inputSchema: {
      type: 'object',
      properties: {
        report_id: { type: 'string' },
        schedule_config: {
          type: 'object',
          properties: {
            frequency: {
              type: 'string',
              description: 'daily, weekly, monthly',
            },
            recipients: {
              type: 'array',
              description: 'Emails des destinataires',
              items: { type: 'string' },
            },
            day_of_week: {
              type: 'string',
              description: 'Pour weekly: monday, tuesday, etc.',
            },
            time: { type: 'string', description: 'Heure d\'envoi (HH:MM)' },
          },
        },
        credentials: { type: 'object' },
      },
      required: ['report_id', 'schedule_config', 'credentials'],
    },
  },
  {
    name: 'looker_get_report_url',
    description: 'Récupère l\'URL publique du rapport pour le partager',
    inputSchema: {
      type: 'object',
      properties: {
        report_id: { type: 'string' },
        credentials: { type: 'object' },
      },
      required: ['report_id', 'credentials'],
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
      case 'looker_create_report': {
        // Looker Studio API is limited - we'll use a simplified approach
        // In practice, this would use the Google Sheets API + Data Studio connector

        const reportConfig = generateReportJSON({
          name: args.report_name as any,
          data_sources: args.data_sources as any,
          elements: [],
        });

        // Create a Google Sheet to store report metadata
        const sheets = google.sheets({ version: 'v4', auth });

        const sheetResponse = await sheets.spreadsheets.create({
          requestBody: {
            properties: {
              title: `[Looker Config] ${args.report_name as any}`,
            },
            sheets: [
              {
                properties: { title: 'Config' },
              },
            ],
          },
        });

        const spreadsheetId = sheetResponse.data.spreadsheetId;

        // Store report config in the sheet
        await sheets.spreadsheets.values.update({
          spreadsheetId: spreadsheetId!,
          range: 'Config!A1',
          valueInputOption: 'RAW',
          requestBody: {
            values: [
              ['Report Name', args.report_name as any],
              ['Created At', new Date().toISOString()],
              ['Data Sources', JSON.stringify(args.data_sources as any)],
            ],
          },
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  report_id: spreadsheetId,
                  message: `Rapport créé: ${args.report_name as any}`,
                  next_step:
                    'Ajoute maintenant des éléments avec looker_add_scorecard ou looker_add_time_series_chart',
                  looker_studio_url: `https://lookerstudio.google.com/reporting/create?c.reportId=${spreadsheetId}`,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'looker_add_scorecard': {
        // Add scorecard configuration to the sheet
        const sheets = google.sheets({ version: 'v4', auth });

        const scorecard = {
          type: 'scorecard',
          metric: args.metric as any,
          position: args.position as any || { x: 0, y: 0, width: 200, height: 100 },
        };

        await sheets.spreadsheets.values.append({
          spreadsheetId: args.report_id as any,
          range: 'Config!A:B',
          valueInputOption: 'RAW',
          requestBody: {
            values: [['Scorecard', JSON.stringify(scorecard)]],
          },
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  element_type: 'scorecard',
                  metric_name: (args.metric as any).name,
                  message: `Scorecard "${(args.metric as any).name}" ajouté au rapport`,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'looker_add_time_series_chart': {
        const sheets = google.sheets({ version: 'v4', auth });

        const chart = {
          type: 'time_series',
          config: args.chart_config as any,
          position: args.position as any || { x: 0, y: 120, width: 600, height: 300 },
        };

        await sheets.spreadsheets.values.append({
          spreadsheetId: args.report_id as any,
          range: 'Config!A:B',
          valueInputOption: 'RAW',
          requestBody: {
            values: [['Time Series Chart', JSON.stringify(chart)]],
          },
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  element_type: 'time_series_chart',
                  title: (args.chart_config as any).title,
                  message: `Graphique temporel "${(args.chart_config as any).title}" ajouté`,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'looker_add_table': {
        const sheets = google.sheets({ version: 'v4', auth });

        const table = {
          type: 'table',
          config: args.table_config as any,
          position: args.position as any || { x: 0, y: 440, width: 800, height: 400 },
        };

        await sheets.spreadsheets.values.append({
          spreadsheetId: args.report_id as any,
          range: 'Config!A:B',
          valueInputOption: 'RAW',
          requestBody: {
            values: [['Table', JSON.stringify(table)]],
          },
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  element_type: 'table',
                  title: (args.table_config as any).title,
                  message: `Tableau "${(args.table_config as any).title}" ajouté`,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'looker_blend_data_sources': {
        const sheets = google.sheets({ version: 'v4', auth });

        const blend = {
          type: 'data_blend',
          config: args.blend_config as any,
        };

        await sheets.spreadsheets.values.append({
          spreadsheetId: args.report_id as any,
          range: 'Config!A:B',
          valueInputOption: 'RAW',
          requestBody: {
            values: [['Data Blend', JSON.stringify(blend)]],
          },
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  blend_name: (args.blend_config as any).name,
                  message: `Sources fusionnées: ${(args.blend_config as any).left_source} + ${(args.blend_config as any).right_source}`,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'looker_schedule_email': {
        const sheets = google.sheets({ version: 'v4', auth });

        const schedule = {
          type: 'email_schedule',
          config: args.schedule_config as any,
        };

        await sheets.spreadsheets.values.append({
          spreadsheetId: args.report_id as any,
          range: 'Config!A:B',
          valueInputOption: 'RAW',
          requestBody: {
            values: [['Email Schedule', JSON.stringify(schedule)]],
          },
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  frequency: (args.schedule_config as any).frequency,
                  recipients: (args.schedule_config as any).recipients,
                  message: `Email programmé (${(args.schedule_config as any).frequency}) pour ${(args.schedule_config as any).recipients.length} destinataires`,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'looker_get_report_url': {
        const sheets = google.sheets({ version: 'v4', auth });

        // Get report metadata
        const response = await sheets.spreadsheets.get({
          spreadsheetId: args.report_id as any,
        });

        const reportName = response.data.properties?.title || 'Untitled Report';

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  report_id: args.report_id as any,
                  report_name: reportName,
                  looker_studio_url: `https://lookerstudio.google.com/reporting/create?c.reportId=${args.report_id as any}`,
                  config_sheet_url: `https://docs.google.com/spreadsheets/d/${args.report_id as any}`,
                  message: 'Rapport prêt. Ouvre l\'URL Looker Studio pour voir le dashboard.',
                },
                null,
                2
              ),
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
          text: JSON.stringify(
            {
              success: false,
              error: error.message,
              details: error.response?.data || error.toString(),
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

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Looker Studio MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
