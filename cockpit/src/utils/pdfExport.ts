// ============================================
// THE HIVE OS V5 - PDF Export Utility
// Exports analytics reports as PDF documents
// ============================================

import html2pdf from 'html2pdf.js';
import type { AnalyticsData, AnalyticsKPI, AnalyticsInsight } from '../types';

interface PDFExportOptions {
  projectName: string;
  analyticsData: AnalyticsData;
  dateRange: {
    start: string;
    end: string;
  };
  source: string;
}

/**
 * Format source name for display
 */
function formatSourceName(source: string): string {
  const sourceNames: Record<string, string> = {
    overview: 'Vue d\'ensemble',
    ga4: 'Google Analytics 4',
    meta_ads: 'Meta Ads',
    google_ads: 'Google Ads',
    gsc: 'Google Search Console',
  };
  return sourceNames[source] || source;
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format number with separators
 */
function formatNumber(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(value);
}

/**
 * Format percentage
 */
function formatPercentage(value: number): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
}

/**
 * Get trend icon
 */
function getTrendIcon(trend: 'up' | 'down' | 'neutral'): string {
  if (trend === 'up') return '↑';
  if (trend === 'down') return '↓';
  return '→';
}

/**
 * Get trend color
 */
function getTrendColor(trend: 'up' | 'down' | 'neutral'): string {
  if (trend === 'up') return '#10b981'; // green
  if (trend === 'down') return '#ef4444'; // red
  return '#94a3b8'; // gray
}

/**
 * Build KPI HTML section
 */
function buildKPISection(kpis: AnalyticsKPI[]): string {
  if (kpis.length === 0) return '';

  const kpiCards = kpis
    .map(
      (kpi) => `
    <div style="
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
    ">
      <div style="
        font-size: 12px;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 8px;
      ">
        ${kpi.label}
      </div>
      <div style="
        font-size: 28px;
        font-weight: 700;
        color: #0f172a;
        margin-bottom: 8px;
      ">
        ${typeof kpi.value === 'number' ? formatNumber(kpi.value) : kpi.value}
      </div>
      ${
        kpi.trend !== undefined && kpi.trendDirection
          ? `
        <div style="
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 14px;
          color: ${getTrendColor(kpi.trendDirection)};
          font-weight: 600;
        ">
          <span>${getTrendIcon(kpi.trendDirection)}</span>
          <span>${formatPercentage(kpi.trend)}</span>
        </div>
      `
          : ''
      }
    </div>
  `
    )
    .join('');

  return `
    <div style="margin-bottom: 32px;">
      <h2 style="
        font-size: 20px;
        font-weight: 700;
        color: #0f172a;
        margin-bottom: 16px;
      ">
        Métriques clés
      </h2>
      <div style="
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
      ">
        ${kpiCards}
      </div>
    </div>
  `;
}

/**
 * Build insights HTML section
 */
function buildInsightsSection(insights: AnalyticsInsight[]): string {
  if (insights.length === 0) return '';

  const insightCards = insights
    .map(
      (insight) => `
    <div style="
      background: ${
        insight.type === 'success'
          ? '#f0fdf4'
          : insight.type === 'warning'
          ? '#fef3c7'
          : insight.type === 'info'
          ? '#dbeafe'
          : '#fef2f2'
      };
      border: 1px solid ${
        insight.type === 'success'
          ? '#bbf7d0'
          : insight.type === 'warning'
          ? '#fde68a'
          : insight.type === 'info'
          ? '#bfdbfe'
          : '#fecaca'
      };
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
    ">
      <div style="
        font-size: 13px;
        color: #475569;
        line-height: 1.6;
      ">
        ${insight.message}
      </div>
      ${
        insight.action
          ? `
        <div style="
          margin-top: 8px;
          font-size: 12px;
          font-weight: 600;
          color: #0f172a;
        ">
          → ${insight.action}
        </div>
      `
          : ''
      }
    </div>
  `
    )
    .join('');

  return `
    <div style="margin-bottom: 32px;">
      <h2 style="
        font-size: 20px;
        font-weight: 700;
        color: #0f172a;
        margin-bottom: 16px;
      ">
        Insights & Recommandations
      </h2>
      ${insightCards}
    </div>
  `;
}

/**
 * Build complete HTML document for PDF
 */
function buildHTMLDocument(options: PDFExportOptions): string {
  const { projectName, analyticsData, dateRange, source } = options;

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>Rapport Analytics - ${projectName}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #0f172a;
          line-height: 1.6;
          padding: 40px;
        }
      </style>
    </head>
    <body>
      <!-- Header -->
      <div style="
        border-bottom: 2px solid #0f172a;
        padding-bottom: 24px;
        margin-bottom: 32px;
      ">
        <div style="
          display: flex;
          align-items: center;
          justify-content: space-between;
        ">
          <div>
            <h1 style="
              font-size: 32px;
              font-weight: 800;
              color: #0f172a;
              margin-bottom: 8px;
            ">
              Rapport Analytics
            </h1>
            <div style="
              font-size: 16px;
              color: #64748b;
            ">
              ${projectName}
            </div>
          </div>
          <div style="
            text-align: right;
          ">
            <div style="
              font-size: 14px;
              color: #64748b;
              margin-bottom: 4px;
            ">
              Source : ${formatSourceName(source)}
            </div>
            <div style="
              font-size: 14px;
              color: #64748b;
            ">
              ${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}
            </div>
          </div>
        </div>
      </div>

      <!-- KPIs Section -->
      ${buildKPISection(analyticsData.kpis)}

      <!-- Insights Section -->
      ${buildInsightsSection(analyticsData.insights)}

      <!-- Charts Note -->
      ${
        analyticsData.charts.length > 0
          ? `
        <div style="
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 32px;
        ">
          <div style="
            font-size: 14px;
            font-weight: 600;
            color: #0f172a;
            margin-bottom: 8px;
          ">
            📊 Graphiques
          </div>
          <div style="
            font-size: 13px;
            color: #475569;
          ">
            ${analyticsData.charts.length} graphique(s) disponible(s) dans le dashboard en ligne.
            Les graphiques interactifs ne peuvent pas être exportés en PDF.
          </div>
        </div>
      `
          : ''
      }

      <!-- Footer -->
      <div style="
        border-top: 1px solid #e2e8f0;
        padding-top: 24px;
        margin-top: 48px;
        text-align: center;
      ">
        <div style="
          font-size: 12px;
          color: #94a3b8;
        ">
          Généré par The Hive OS le ${formatDate(new Date().toISOString())}
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Export analytics data as PDF
 */
export async function exportAnalyticsPDF(options: PDFExportOptions): Promise<void> {
  try {
    // Build HTML document
    const htmlContent = buildHTMLDocument(options);

    // Create temporary container
    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    document.body.appendChild(container);

    // PDF options
    const pdfOptions = {
      margin: [10, 10, 10, 10] as [number, number, number, number],
      filename: `hive-analytics-${options.projectName
        .toLowerCase()
        .replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
      },
      jsPDF: {
        unit: 'mm' as const,
        format: 'a4' as const,
        orientation: 'portrait' as const,
      },
    };

    // Generate PDF
    await html2pdf().from(container).set(pdfOptions).save();

    // Cleanup
    document.body.removeChild(container);
  } catch (error) {
    console.error('Error exporting PDF:', error);
    throw new Error('Failed to export PDF. Please try again.');
  }
}
