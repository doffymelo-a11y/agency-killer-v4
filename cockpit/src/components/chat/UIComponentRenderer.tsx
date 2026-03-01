// ============================================
// THE HIVE OS V4 - UI Component Renderer
// Renders ui_components from backend with download buttons
// ============================================
// MILO: CAMPAGNE_TABLE (image), AD_PREVIEW (video), PDF_COPYWRITING (text)
// SORA: ANALYTICS_DASHBOARD (analytics PDF)
// LUNA: PDF_REPORT (strategic report PDF)
// MARCUS: (no UI components)
// ============================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Image, Video, FileText, BarChart3, TrendingUp, ExternalLink, AlertCircle, XCircle, Target, DollarSign, Activity, PlayCircle, Clock, CheckCircle, Shield } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import type { UIComponent } from '../../types';
import { approveRequest, rejectRequest } from '../../services/approvals';
import { useHiveStore } from '../../store/useHiveStore';

interface UIComponentRendererProps {
  components: UIComponent[];
}

interface ComponentData {
  image_url?: string;
  video_url?: string;
  title?: string;
  content?: string;
  body?: string;
  headline?: string;
  prompt_used?: string;
  script?: string;
  word_count?: number;
  char_count?: number;
  kpis?: Array<{ label: string; value: string; trend?: number }>;
  metrics?: Record<string, number>;
  recommendations?: string[];
  sections?: Array<{ title: string; content: string }>;
  rows?: Array<{ visuel: string; description: string; format: string }>;
  generated_at?: string;
  [key: string]: unknown;
}

// ============================================
// Markdown to HTML Parser (Professional Rendering)
// ============================================
function parseMarkdownToHTML(markdown: string): string {
  if (!markdown) return '';

  let html = markdown;

  // Remove backslash line breaks (markdown artifacts)
  html = html.replace(/\\\n/g, '\n');
  html = html.replace(/\\/g, '');

  // Parse headings
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');

  // Parse bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

  // Parse italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');

  // Parse lists (unordered)
  html = html.replace(/^[\-\*\+] (.*?)$/gm, '<li>$1</li>');

  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li>.*?<\/li>\n?)+/gs, (match) => {
    return `<ul>${match}</ul>`;
  });

  // Parse numbered lists
  html = html.replace(/^\d+\.\s+(.*?)$/gm, '<li>$1</li>');

  // Parse paragraphs (any line that's not empty and not already wrapped in tags)
  html = html.split('\n').map(line => {
    line = line.trim();
    if (!line) return '';
    if (line.startsWith('<')) return line; // Already a tag
    return `<p>${line}</p>`;
  }).join('\n');

  // Clean up multiple consecutive breaks
  html = html.replace(/(<p><\/p>\n?)+/g, '');

  return html;
}

export default function UIComponentRenderer({ components }: UIComponentRendererProps) {
  if (!components || components.length === 0) return null;

  return (
    <div className="space-y-3 mt-3">
      {components.map((component, index) => (
        <RenderComponent key={component.id || index} component={component} />
      ))}
    </div>
  );
}

function RenderComponent({ component }: { component: UIComponent }) {
  const data = component.data as ComponentData;
  const type = component.type?.toUpperCase() || '';

  switch (type) {
    case 'CAMPAGNE_TABLE':
      return <ImageComponent data={data} />;
    case 'AD_PREVIEW':
      return <VideoComponent data={data} />;
    case 'PDF_COPYWRITING':
      return <CopywritingComponent data={data} title={component.title} />;
    case 'PDF_REPORT':
      return <ReportComponent data={data} title={component.title} />;
    case 'ANALYTICS_DASHBOARD':
      return <AnalyticsDashboardComponent data={data} title={component.title} />;
    case 'ACTION_BUTTONS':
      return <ActionButtonsComponent data={data} />;
    case 'KPI_CARD':
      return <KPICardComponent data={data} />;
    case 'ERROR_BLOCKED_ACTION':
      return <ErrorBlockedActionComponent data={data} />;
    case 'ERROR_DEPENDENCIES_BLOCKED':
      return <DependenciesBlockedComponent data={data} />;
    case 'APPROVAL_REQUEST':
      return <ApprovalRequestComponent data={data} />;
    default:
      return <GenericComponent component={component} />;
  }
}

// ============================================
// MILO - Image Component (CAMPAGNE_TABLE)
// ============================================
function ImageComponent({ data }: { data: ComponentData }) {
  const imageUrl = data.image_url || data.rows?.[0]?.visuel;
  const promptUsed = data.prompt_used || data.rows?.[0]?.description || '';

  if (!imageUrl) return null;

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hive-image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(imageUrl, '_blank');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden border border-pink-100 bg-gradient-to-br from-pink-50 to-white"
    >
      <div className="relative group">
        <img
          src={imageUrl}
          alt="Generated visual"
          className="w-full max-h-[400px] object-contain bg-slate-50"
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-white rounded-lg font-medium text-slate-800 flex items-center gap-2 hover:bg-slate-100 transition-colors"
          >
            <Download className="w-4 h-4" />
            Telecharger HD
          </button>
        </div>
      </div>
      <div className="p-3 border-t border-pink-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Image className="w-3.5 h-3.5 text-pink-500" />
            <span>Image generee par Milo</span>
          </div>
          <button
            onClick={handleDownload}
            className="px-3 py-1.5 bg-pink-500 text-white text-xs rounded-lg font-medium flex items-center gap-1.5 hover:bg-pink-600 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Telecharger
          </button>
        </div>
        {promptUsed && (
          <p className="text-xs text-slate-400 mt-2 line-clamp-2">{promptUsed}</p>
        )}
      </div>
    </motion.div>
  );
}

// ============================================
// MILO - Video Component (AD_PREVIEW)
// ============================================
function VideoComponent({ data }: { data: ComponentData }) {
  const videoUrl = data.video_url;
  const script = data.script || data.prompt_used || data.primary_text || '';
  const headline = data.headline || '';

  if (!videoUrl) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `hive-video-${Date.now()}.mp4`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden border border-pink-100 bg-gradient-to-br from-pink-50 to-white"
    >
      <div className="relative">
        <video
          src={videoUrl}
          controls
          className="w-full max-h-[400px] bg-black"
          poster=""
        />
      </div>
      <div className="p-3 border-t border-pink-100">
        {headline && (
          <p className="text-sm font-medium text-slate-700 mb-2">{headline}</p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Video className="w-3.5 h-3.5 text-pink-500" />
            <span>Video generee par Milo</span>
          </div>
          <button
            onClick={handleDownload}
            className="px-3 py-1.5 bg-pink-500 text-white text-xs rounded-lg font-medium flex items-center gap-1.5 hover:bg-pink-600 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Telecharger
          </button>
        </div>
        {script && (
          <p className="text-xs text-slate-400 mt-2 line-clamp-2">{script}</p>
        )}
      </div>
    </motion.div>
  );
}

// ============================================
// MILO - Copywriting Component (PDF_COPYWRITING)
// Display text if < 1000 chars, otherwise show PDF download button
// ============================================
function CopywritingComponent({ data, title }: { data: ComponentData; title?: string }) {
  const content = data.content || data.body || '';
  const articleTitle = title || data.title || data.headline || 'Article';
  const wordCount = data.word_count || content.split(/\s+/).length;
  const charCount = content.length;

  // Determine if content is too long (> 1000 characters)
  const isLongContent = charCount > 1000;

  // Parse markdown to clean HTML for display
  const htmlContent = parseMarkdownToHTML(content);

  const handleDownloadPDF = async () => {
    // Create professional HTML document with elegant typography
    const documentHTML = `
      <div style="font-family: 'Georgia', 'Times New Roman', serif; max-width: 800px; margin: 0 auto; padding: 60px 40px; color: #1e293b;">
        <!-- Header with elegant styling -->
        <div style="border-bottom: 3px solid #ec4899; padding-bottom: 20px; margin-bottom: 40px;">
          <h1 style="color: #be185d; font-size: 36px; font-weight: 700; margin: 0 0 10px 0; letter-spacing: -0.5px; font-family: 'Georgia', serif;">
            ${articleTitle}
          </h1>
          <p style="color: #64748b; font-size: 14px; margin: 0; font-family: 'Arial', sans-serif;">
            Rédigé par Milo - ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} - ${wordCount} mots
          </p>
        </div>

        <!-- Main content with parsed markdown -->
        <div style="line-height: 1.9; color: #334155; font-size: 16px;">
          ${htmlContent}
        </div>

        <!-- Footer -->
        <div style="margin-top: 60px; padding-top: 30px; border-top: 2px solid #fce7f3; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0; font-family: 'Arial', sans-serif;">
            Document confidentiel - THE HIVE OS V4
          </p>
        </div>

        <!-- Inline styles for parsed HTML elements -->
        <style>
          h1 { color: #be185d; font-size: 32px; font-weight: 700; margin: 40px 0 24px 0; font-family: 'Georgia', serif; }
          h2 { color: #db2777; font-size: 26px; font-weight: 600; margin: 36px 0 20px 0; border-bottom: 2px solid #fce7f3; padding-bottom: 10px; font-family: 'Georgia', serif; }
          h3 { color: #ec4899; font-size: 20px; font-weight: 600; margin: 30px 0 16px 0; font-family: 'Georgia', serif; }
          p { margin: 0 0 18px 0; line-height: 1.9; color: #475569; font-size: 16px; text-align: justify; }
          ul { margin: 24px 0; padding-left: 0; list-style: none; }
          li { margin: 12px 0; padding-left: 35px; position: relative; color: #475569; line-height: 1.8; }
          li::before { content: "→"; position: absolute; left: 10px; color: #ec4899; font-weight: 700; font-size: 16px; }
          strong { color: #1e293b; font-weight: 700; }
          em { color: #64748b; font-style: italic; }
        </style>
      </div>
    `;

    // Generate PDF with html2pdf.js
    const opt = {
      margin: [10, 10],
      filename: `${articleTitle.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      await html2pdf().set(opt).from(documentHTML).save();
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erreur lors de la génération du PDF. Veuillez réessayer.');
    }
  };

  // If content is SHORT (< 1000 chars), display it directly
  if (!isLongContent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-pink-100 bg-white overflow-hidden shadow-sm"
      >
        {/* Header */}
        <div className="p-4 border-b border-pink-100 bg-gradient-to-r from-pink-50 to-white">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold text-slate-900 text-lg">{articleTitle}</h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-500">{wordCount} mots</span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span className="text-xs text-pink-600 font-medium">Copywriting</span>
              </div>
            </div>
            <button
              onClick={handleDownloadPDF}
              className="px-3 py-1.5 bg-pink-500 text-white text-xs rounded-lg font-medium flex items-center gap-1.5 hover:bg-pink-600 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export PDF
            </button>
          </div>
        </div>

        {/* Content with professional formatting */}
        <div className="p-6 max-h-[500px] overflow-y-auto">
          <div
            className="prose prose-slate max-w-none"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: '15px',
              lineHeight: '1.8',
              color: '#334155'
            }}
          />
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-pink-50/50 border-t border-pink-100">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <FileText className="w-3.5 h-3.5 text-pink-500" />
            <span>Texte redige par Milo</span>
          </div>
        </div>

        {/* Internal styles for rendered HTML */}
        <style>
          {`
            .prose h1 { color: #be185d; font-size: 24px; font-weight: 700; margin: 24px 0 16px 0; }
            .prose h2 { color: #db2777; font-size: 20px; font-weight: 600; margin: 20px 0 12px 0; border-bottom: 2px solid #fce7f3; padding-bottom: 6px; }
            .prose h3 { color: #ec4899; font-size: 18px; font-weight: 600; margin: 18px 0 10px 0; }
            .prose p { margin: 0 0 14px 0; line-height: 1.8; color: #475569; }
            .prose ul { margin: 16px 0; padding-left: 0; list-style: none; }
            .prose li { margin: 10px 0; padding-left: 28px; position: relative; color: #475569; line-height: 1.7; }
            .prose li::before { content: "→"; position: absolute; left: 8px; color: #ec4899; font-weight: 700; }
            .prose strong { color: #1e293b; font-weight: 700; }
            .prose em { color: #64748b; font-style: italic; }
          `}
        </style>
      </motion.div>
    );
  }

  // If content is LONG (> 1000 chars), only show download button
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-pink-100 bg-white overflow-hidden shadow-sm"
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-semibold text-slate-900 text-lg">{articleTitle}</h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-500">{wordCount} mots • {charCount} caractères</span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="text-xs text-pink-600 font-medium">Copywriting long-form</span>
            </div>
          </div>
          <button
            onClick={handleDownloadPDF}
            className="px-4 py-2 bg-pink-500 text-white text-sm rounded-lg font-medium flex items-center gap-2 hover:bg-pink-600 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Telecharger PDF
          </button>
        </div>
      </div>

      {/* Preview of first 300 chars */}
      <div className="px-4 pb-4">
        <div className="bg-pink-50/50 rounded-lg p-4 border border-pink-100">
          <p className="text-xs font-medium text-pink-700 mb-2">📄 Aperçu du contenu:</p>
          <p className="text-sm text-slate-600 line-clamp-4">
            {content.substring(0, 300)}...
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-pink-50/50 border-t border-pink-100">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <FileText className="w-3.5 h-3.5 text-pink-500" />
          <span>Article long-form redige par Milo - Telechargez le PDF pour lire le contenu complet</span>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// LUNA - Report Component (PDF_REPORT)
// ============================================
function ReportComponent({ data, title }: { data: ComponentData; title?: string }) {
  const content = data.content || data.body || '';
  const reportTitle = title || data.title || 'Rapport Strategique';
  const recommendations = data.recommendations || [];

  const handleDownloadPDF = async () => {
    // Convert markdown to professional HTML
    const htmlContent = parseMarkdownToHTML(content);

    // Create professional HTML document
    const documentHTML = `
      <div style="font-family: 'Inter', 'Segoe UI', system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 60px 40px; color: #1e293b;">
        <!-- Header with brand styling -->
        <div style="border-bottom: 4px solid #8b5cf6; padding-bottom: 20px; margin-bottom: 40px;">
          <h1 style="color: #6d28d9; font-size: 32px; font-weight: 700; margin: 0 0 10px 0; letter-spacing: -0.5px;">
            ${reportTitle}
          </h1>
          <p style="color: #64748b; font-size: 14px; margin: 0;">
            Généré par Luna - ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <!-- Main content with parsed markdown -->
        <div style="line-height: 1.8; color: #334155;">
          ${htmlContent}
        </div>

        ${recommendations.length > 0 ? `
          <!-- Recommendations section -->
          <div style="background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); padding: 30px; border-radius: 12px; margin-top: 40px; border-left: 4px solid #8b5cf6;">
            <h2 style="color: #6d28d9; font-size: 22px; font-weight: 700; margin: 0 0 20px 0;">
              📊 Recommandations Stratégiques
            </h2>
            <ul style="list-style: none; padding: 0; margin: 0;">
              ${recommendations.map(r => `
                <li style="padding: 12px 0; border-bottom: 1px solid #ddd6fe; color: #475569; font-size: 15px;">
                  <span style="color: #8b5cf6; font-weight: 600; margin-right: 8px;">→</span>
                  ${typeof r === 'string' ? r : r}
                </li>
              `).join('')}
            </ul>
          </div>
        ` : ''}

        <!-- Footer -->
        <div style="margin-top: 60px; padding-top: 30px; border-top: 2px solid #e2e8f0; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            Document confidentiel - THE HIVE OS V4
          </p>
        </div>

        <!-- Inline styles for parsed HTML elements -->
        <style>
          h1 { color: #6d28d9; font-size: 28px; font-weight: 700; margin: 40px 0 20px 0; }
          h2 { color: #7c3aed; font-size: 22px; font-weight: 600; margin: 35px 0 18px 0; border-bottom: 2px solid #e9d5ff; padding-bottom: 8px; }
          h3 { color: #8b5cf6; font-size: 18px; font-weight: 600; margin: 28px 0 14px 0; }
          p { margin: 0 0 16px 0; line-height: 1.8; color: #475569; font-size: 15px; }
          ul { margin: 20px 0; padding-left: 0; list-style: none; }
          li { margin: 10px 0; padding-left: 30px; position: relative; color: #475569; line-height: 1.7; }
          li::before { content: "•"; position: absolute; left: 10px; color: #8b5cf6; font-weight: 700; font-size: 18px; }
          strong { color: #1e293b; font-weight: 600; }
          em { color: #64748b; font-style: italic; }
        </style>
      </div>
    `;

    // Generate PDF with html2pdf.js
    const opt = {
      margin: [10, 10],
      filename: `${reportTitle.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      await html2pdf().set(opt).from(documentHTML).save();
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erreur lors de la génération du PDF. Veuillez réessayer.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white overflow-hidden"
    >
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-semibold text-slate-800">{reportTitle}</h4>
            <p className="text-xs text-slate-500 mt-1">Rapport strategique</p>
          </div>
          <button
            onClick={handleDownloadPDF}
            className="px-3 py-1.5 bg-violet-500 text-white text-xs rounded-lg font-medium flex items-center gap-1.5 hover:bg-violet-600 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Telecharger PDF
          </button>
        </div>
      </div>
      {recommendations.length > 0 && (
        <div className="px-4 py-3 bg-violet-50/50 border-t border-violet-100">
          <p className="text-xs font-medium text-violet-700 mb-2">Recommandations principales:</p>
          <ul className="text-xs text-slate-600 space-y-1">
            {recommendations.slice(0, 3).map((rec, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-violet-500">•</span>
                <span className="line-clamp-1">{typeof rec === 'string' ? rec : rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="px-4 py-2 bg-violet-50/30 border-t border-violet-100">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <BarChart3 className="w-3.5 h-3.5 text-violet-500" />
          <span>Rapport genere par Luna</span>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// SORA - Analytics Dashboard Component
// ============================================
function AnalyticsDashboardComponent({ data, title }: { data: ComponentData; title?: string }) {
  const dashboardTitle = title || data.title || 'Dashboard Analytics';
  const kpis = data.kpis || [];
  const content = data.content || '';
  const recommendations = data.recommendations || [];

  const handleDownloadPDF = async () => {
    // Convert markdown to professional HTML
    const htmlContent = parseMarkdownToHTML(content);

    // Create professional analytics report
    const documentHTML = `
      <div style="font-family: 'Inter', 'Segoe UI', system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 60px 40px; color: #1e293b;">
        <!-- Header with analytics styling -->
        <div style="border-bottom: 4px solid #0891b2; padding-bottom: 20px; margin-bottom: 40px;">
          <h1 style="color: #0369a1; font-size: 32px; font-weight: 700; margin: 0 0 10px 0; letter-spacing: -0.5px;">
            ${dashboardTitle}
          </h1>
          <p style="color: #64748b; font-size: 14px; margin: 0;">
            Généré par Sora - ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        ${kpis.length > 0 ? `
          <!-- KPIs Grid -->
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 30px 0;">
            ${kpis.map(kpi => `
              <div style="background: linear-gradient(135deg, #ecfeff 0%, #cffafe 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #0891b2;">
                <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 600; margin-bottom: 8px;">
                  ${kpi.label}
                </div>
                <div style="font-size: 28px; font-weight: 700; color: #0369a1; margin-bottom: 4px;">
                  ${kpi.value}
                </div>
                ${kpi.trend !== undefined ? `
                  <div style="font-size: 13px; font-weight: 600; color: ${kpi.trend > 0 ? '#10b981' : '#ef4444'};">
                    ${kpi.trend > 0 ? '↗' : '↘'} ${kpi.trend > 0 ? '+' : ''}${kpi.trend}%
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- Main content with parsed markdown -->
        <div style="line-height: 1.8; color: #334155; margin-top: 40px;">
          ${htmlContent}
        </div>

        ${recommendations.length > 0 ? `
          <!-- Recommendations section -->
          <div style="background: linear-gradient(135deg, #ecfeff 0%, #e0f2fe 100%); padding: 30px; border-radius: 12px; margin-top: 40px; border-left: 4px solid #0891b2;">
            <h2 style="color: #0369a1; font-size: 22px; font-weight: 700; margin: 0 0 20px 0;">
              📈 Recommandations Analytiques
            </h2>
            <ul style="list-style: none; padding: 0; margin: 0;">
              ${recommendations.map(r => `
                <li style="padding: 12px 0; border-bottom: 1px solid #bae6fd; color: #475569; font-size: 15px;">
                  <span style="color: #0891b2; font-weight: 600; margin-right: 8px;">→</span>
                  ${typeof r === 'string' ? r : r}
                </li>
              `).join('')}
            </ul>
          </div>
        ` : ''}

        <!-- Footer -->
        <div style="margin-top: 60px; padding-top: 30px; border-top: 2px solid #e2e8f0; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            Document confidentiel - THE HIVE OS V4
          </p>
        </div>

        <!-- Inline styles for parsed HTML elements -->
        <style>
          h1 { color: #0369a1; font-size: 28px; font-weight: 700; margin: 40px 0 20px 0; }
          h2 { color: #0891b2; font-size: 22px; font-weight: 600; margin: 35px 0 18px 0; border-bottom: 2px solid #cffafe; padding-bottom: 8px; }
          h3 { color: #06b6d4; font-size: 18px; font-weight: 600; margin: 28px 0 14px 0; }
          p { margin: 0 0 16px 0; line-height: 1.8; color: #475569; font-size: 15px; }
          ul { margin: 20px 0; padding-left: 0; list-style: none; }
          li { margin: 10px 0; padding-left: 30px; position: relative; color: #475569; line-height: 1.7; }
          li::before { content: "•"; position: absolute; left: 10px; color: #0891b2; font-weight: 700; font-size: 18px; }
          strong { color: #1e293b; font-weight: 600; }
          em { color: #64748b; font-style: italic; }
        </style>
      </div>
    `;

    // Generate PDF with html2pdf.js
    const opt = {
      margin: [10, 10],
      filename: `${dashboardTitle.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      await html2pdf().set(opt).from(documentHTML).save();
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erreur lors de la génération du PDF. Veuillez réessayer.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-cyan-100 bg-gradient-to-br from-cyan-50 to-white overflow-hidden"
    >
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-semibold text-slate-800">{dashboardTitle}</h4>
            <p className="text-xs text-slate-500 mt-1">Dashboard Analytics</p>
          </div>
          <button
            onClick={handleDownloadPDF}
            className="px-3 py-1.5 bg-cyan-500 text-white text-xs rounded-lg font-medium flex items-center gap-1.5 hover:bg-cyan-600 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Telecharger PDF
          </button>
        </div>
      </div>
      {kpis.length > 0 && (
        <div className="p-4 border-t border-cyan-100">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {kpis.slice(0, 6).map((kpi, i) => (
              <div key={i} className="bg-white rounded-lg p-3 border border-cyan-50">
                <p className="text-[10px] uppercase tracking-wide text-slate-400">{kpi.label}</p>
                <p className="text-lg font-bold text-cyan-600">{kpi.value}</p>
                {kpi.trend !== undefined && (
                  <p className={`text-xs ${kpi.trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {kpi.trend > 0 ? '+' : ''}{kpi.trend}%
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="px-4 py-2 bg-cyan-50/30 border-t border-cyan-100">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <TrendingUp className="w-3.5 h-3.5 text-cyan-500" />
          <span>Dashboard genere par Sora</span>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// Action Buttons Component
// ============================================
function ActionButtonsComponent({ data }: { data: ComponentData }) {
  const actions = (data as { actions?: Array<{ id: string; label: string; payload?: { message: string } }> }).actions || [];

  if (actions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap gap-2"
    >
      {actions.map((action) => (
        <button
          key={action.id}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-lg transition-colors"
        >
          {action.label}
        </button>
      ))}
    </motion.div>
  );
}

// ============================================
// KPI Card Component
// ============================================
function KPICardComponent({ data }: { data: ComponentData }) {
  const kpis = data.kpis || [];

  if (kpis.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-2 sm:grid-cols-3 gap-3"
    >
      {kpis.map((kpi, i) => (
        <div key={i} className="bg-white rounded-lg p-3 border border-slate-100 shadow-sm">
          <p className="text-[10px] uppercase tracking-wide text-slate-400">{kpi.label}</p>
          <p className="text-xl font-bold text-slate-800">{kpi.value}</p>
          {kpi.trend !== undefined && (
            <p className={`text-xs ${kpi.trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {kpi.trend > 0 ? '+' : ''}{kpi.trend}%
            </p>
          )}
        </div>
      ))}
    </motion.div>
  );
}

// ============================================
// PHASE 0 - Error Blocked Action Component
// ============================================
function ErrorBlockedActionComponent({ data }: { data: ComponentData }) {
  const validationResult = data as {
    error?: string;
    validation_type?: string;
    missing_flags?: Array<{
      flag: string;
      label: string;
      responsible_agent: string;
      icon: string;
    }>;
    resolution?: string;
    severity?: string;
    required_phases?: string[];
    current_phase?: string;
    hours_remaining?: number;
    hours_since_launch?: number;
    minimum_hours?: number;
  };

  // Map icon names to Lucide icons
  const iconMap: Record<string, typeof Target> = {
    'target': Target,
    'dollar-sign': DollarSign,
    'image': Image,
    'activity': Activity,
    'play-circle': PlayCircle,
  };

  // Map agent IDs to names and classes (prevents dynamic class purging)
  const agentMap: Record<string, { name: string; containerClass: string; iconClass: string; iconTextClass: string; textClass: string }> = {
    'luna': {
      name: 'Luna',
      containerClass: 'flex items-center gap-3 p-3 rounded-lg bg-white border border-violet-100',
      iconClass: 'p-2 rounded-lg bg-violet-100',
      iconTextClass: 'w-4 h-4 text-violet-600',
      textClass: 'text-xs text-violet-600 mt-0.5'
    },
    'marcus': {
      name: 'Marcus',
      containerClass: 'flex items-center gap-3 p-3 rounded-lg bg-white border border-blue-100',
      iconClass: 'p-2 rounded-lg bg-blue-100',
      iconTextClass: 'w-4 h-4 text-blue-600',
      textClass: 'text-xs text-blue-600 mt-0.5'
    },
    'milo': {
      name: 'Milo',
      containerClass: 'flex items-center gap-3 p-3 rounded-lg bg-white border border-pink-100',
      iconClass: 'p-2 rounded-lg bg-pink-100',
      iconTextClass: 'w-4 h-4 text-pink-600',
      textClass: 'text-xs text-pink-600 mt-0.5'
    },
    'sora': {
      name: 'Sora',
      containerClass: 'flex items-center gap-3 p-3 rounded-lg bg-white border border-cyan-100',
      iconClass: 'p-2 rounded-lg bg-cyan-100',
      iconTextClass: 'w-4 h-4 text-cyan-600',
      textClass: 'text-xs text-cyan-600 mt-0.5'
    },
    'user': {
      name: 'Vous',
      containerClass: 'flex items-center gap-3 p-3 rounded-lg bg-white border border-slate-100',
      iconClass: 'p-2 rounded-lg bg-slate-100',
      iconTextClass: 'w-4 h-4 text-slate-600',
      textClass: 'text-xs text-slate-600 mt-0.5'
    },
  };

  const getSeverityColor = (severity?: string) => {
    if (severity === 'blocking') return 'red';
    if (severity === 'warning') return 'orange';
    return 'yellow';
  };

  // Helper functions for Tailwind classes (prevents dynamic class purging)
  const getSeverityClasses = (severity?: string) => {
    const color = getSeverityColor(severity);
    if (color === 'red') {
      return {
        container: 'rounded-xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-white overflow-hidden shadow-lg',
        header: 'p-4 bg-red-100 border-b-2 border-red-200',
        icon: 'p-2 rounded-lg bg-red-500 text-white',
        title: 'font-bold text-red-900 text-lg',
        subtitle: 'text-sm text-red-700 mt-1',
        resolution: 'p-3 rounded-lg bg-red-50 border border-red-200',
        resolutionIcon: 'w-4 h-4 text-red-600 mt-0.5',
        resolutionTitle: 'text-xs font-semibold text-red-800 uppercase tracking-wide mb-1',
        resolutionText: 'text-sm text-red-700 leading-relaxed',
        footer: 'px-4 py-3 bg-red-50/50 border-t border-red-100',
        footerIcon: 'w-3.5 h-3.5 text-red-500'
      };
    } else if (color === 'orange') {
      return {
        container: 'rounded-xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white overflow-hidden shadow-lg',
        header: 'p-4 bg-orange-100 border-b-2 border-orange-200',
        icon: 'p-2 rounded-lg bg-orange-500 text-white',
        title: 'font-bold text-orange-900 text-lg',
        subtitle: 'text-sm text-orange-700 mt-1',
        resolution: 'p-3 rounded-lg bg-orange-50 border border-orange-200',
        resolutionIcon: 'w-4 h-4 text-orange-600 mt-0.5',
        resolutionTitle: 'text-xs font-semibold text-orange-800 uppercase tracking-wide mb-1',
        resolutionText: 'text-sm text-orange-700 leading-relaxed',
        footer: 'px-4 py-3 bg-orange-50/50 border-t border-orange-100',
        footerIcon: 'w-3.5 h-3.5 text-orange-500'
      };
    } else { // yellow
      return {
        container: 'rounded-xl border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-white overflow-hidden shadow-lg',
        header: 'p-4 bg-yellow-100 border-b-2 border-yellow-200',
        icon: 'p-2 rounded-lg bg-yellow-500 text-white',
        title: 'font-bold text-yellow-900 text-lg',
        subtitle: 'text-sm text-yellow-700 mt-1',
        resolution: 'p-3 rounded-lg bg-yellow-50 border border-yellow-200',
        resolutionIcon: 'w-4 h-4 text-yellow-600 mt-0.5',
        resolutionTitle: 'text-xs font-semibold text-yellow-800 uppercase tracking-wide mb-1',
        resolutionText: 'text-sm text-yellow-700 leading-relaxed',
        footer: 'px-4 py-3 bg-yellow-50/50 border-t border-yellow-100',
        footerIcon: 'w-3.5 h-3.5 text-yellow-500'
      };
    }
  };

  const classes = getSeverityClasses(validationResult.severity);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={classes.container}
    >
      {/* Header */}
      <div className={classes.header}>
        <div className="flex items-start gap-3">
          <div className={classes.icon}>
            <XCircle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className={classes.title}>
              Action Bloquée
            </h3>
            <p className={classes.subtitle}>
              {validationResult.error}
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        {/* Missing Flags */}
        {validationResult.validation_type === 'missing_flags' && validationResult.missing_flags && (
          <div>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">
              Validations Manquantes
            </p>
            <div className="space-y-2">
              {validationResult.missing_flags.map((flag, i) => {
                const Icon = iconMap[flag.icon] || AlertCircle;
                const agent = agentMap[flag.responsible_agent] || agentMap['user'];

                return (
                  <div
                    key={i}
                    className={agent.containerClass}
                  >
                    <div className={agent.iconClass}>
                      <Icon className={agent.iconTextClass} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">{flag.label}</p>
                      <p className={agent.textClass}>
                        Responsable: {agent.name}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Wrong Phase */}
        {validationResult.validation_type === 'wrong_phase' && (
          <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-orange-600" />
              <p className="text-xs font-semibold text-orange-800 uppercase tracking-wide">
                Phase Incorrecte
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-orange-600 mb-1">Phase actuelle:</p>
                <p className="font-medium text-orange-900">{validationResult.current_phase}</p>
              </div>
              <div>
                <p className="text-xs text-orange-600 mb-1">Phases requises:</p>
                <p className="font-medium text-orange-900">
                  {validationResult.required_phases?.join(', ')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Insufficient Runtime */}
        {validationResult.validation_type === 'insufficient_runtime' && (
          <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-orange-600" />
              <p className="text-xs font-semibold text-orange-800 uppercase tracking-wide">
                Temps d'attente Requis
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-xs text-orange-600 mb-1">Écoulé:</p>
                <p className="font-bold text-orange-900 text-lg">{validationResult.hours_since_launch}h</p>
              </div>
              <div>
                <p className="text-xs text-orange-600 mb-1">Minimum:</p>
                <p className="font-bold text-orange-900 text-lg">{validationResult.minimum_hours}h</p>
              </div>
              <div>
                <p className="text-xs text-orange-600 mb-1">Restant:</p>
                <p className="font-bold text-orange-900 text-lg">{validationResult.hours_remaining}h</p>
              </div>
            </div>
          </div>
        )}

        {/* Resolution */}
        {validationResult.resolution && (
          <div className={classes.resolution}>
            <div className="flex items-start gap-2">
              <AlertCircle className={classes.resolutionIcon} />
              <div>
                <p className={classes.resolutionTitle}>
                  Comment Résoudre
                </p>
                <p className={classes.resolutionText}>
                  {validationResult.resolution}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={classes.footer}>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <AlertCircle className={classes.footerIcon} />
          <span>
            Validation automatique - Phase 0
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// PHASE 0 - Dependencies Blocked Component
// ============================================
function DependenciesBlockedComponent({ data }: { data: ComponentData }) {
  const blockingData = data as {
    error?: string;
    blocking_tasks?: Array<{
      id: string;
      title: string;
      status: string;
      assignee: string;
      url?: string;
      status_display?: {
        label: string;
        color: string;
        icon: string;
      };
    }>;
    resolution?: string;
  };

  // Helper functions for agent colors (prevents dynamic class purging)
  const getAgentClasses = (agentId: string) => {
    const agentClassMap: Record<string, { border: string; textClass: string }> = {
      'luna': {
        border: 'flex items-center justify-between p-3 rounded-lg bg-white border border-violet-100 hover:border-violet-300 transition-colors cursor-pointer group',
        textClass: 'text-xs text-violet-600'
      },
      'marcus': {
        border: 'flex items-center justify-between p-3 rounded-lg bg-white border border-blue-100 hover:border-blue-300 transition-colors cursor-pointer group',
        textClass: 'text-xs text-blue-600'
      },
      'milo': {
        border: 'flex items-center justify-between p-3 rounded-lg bg-white border border-pink-100 hover:border-pink-300 transition-colors cursor-pointer group',
        textClass: 'text-xs text-pink-600'
      },
      'sora': {
        border: 'flex items-center justify-between p-3 rounded-lg bg-white border border-cyan-100 hover:border-cyan-300 transition-colors cursor-pointer group',
        textClass: 'text-xs text-cyan-600'
      },
    };
    return agentClassMap[agentId] || {
      border: 'flex items-center justify-between p-3 rounded-lg bg-white border border-slate-100 hover:border-slate-300 transition-colors cursor-pointer group',
      textClass: 'text-xs text-slate-600'
    };
  };

  // Helper function for status colors (prevents dynamic class purging)
  const getStatusClasses = (color?: string) => {
    const statusClassMap: Record<string, string> = {
      'green': 'text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700',
      'blue': 'text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700',
      'yellow': 'text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700',
      'orange': 'text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700',
      'red': 'text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700',
      'violet': 'text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700',
      'pink': 'text-xs px-2 py-0.5 rounded-full bg-pink-100 text-pink-700',
      'cyan': 'text-xs px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700',
      'slate': 'text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700',
    };
    return statusClassMap[color || 'slate'] || statusClassMap['slate'];
  };

  const handleTaskClick = (url?: string) => {
    if (url) {
      window.location.href = url;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-white overflow-hidden shadow-lg"
    >
      {/* Header */}
      <div className="p-4 bg-red-100 border-b-2 border-red-200">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-red-500 text-white">
            <XCircle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-red-900 text-lg">
              Tâches Dépendantes Non Terminées
            </h3>
            <p className="text-sm text-red-700 mt-1">
              {blockingData.error || "Cette tâche nécessite la complétion de tâches préalables"}
            </p>
          </div>
        </div>
      </div>

      {/* Body - Blocking Tasks */}
      <div className="p-4">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">
          Tâches Bloquantes ({blockingData.blocking_tasks?.length || 0})
        </p>
        <div className="space-y-2">
          {blockingData.blocking_tasks?.map((task, i) => {
            const agentClasses = getAgentClasses(task.assignee);
            const statusClasses = getStatusClasses(task.status_display?.color);

            return (
              <div
                key={i}
                onClick={() => handleTaskClick(task.url)}
                className={agentClasses.border}
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800 group-hover:text-blue-600 transition-colors">
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={statusClasses}>
                      {task.status_display?.label || task.status}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className={agentClasses.textClass}>
                      {task.assignee}
                    </span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </div>
            );
          })}
        </div>

        {/* Resolution */}
        {blockingData.resolution && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-red-800 uppercase tracking-wide mb-1">
                  Comment Résoudre
                </p>
                <p className="text-sm text-red-700 leading-relaxed">
                  {blockingData.resolution}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-red-50/50 border-t border-red-100">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <AlertCircle className="w-3.5 h-3.5 text-red-500" />
          <span>
            Vérification automatique des dépendances - Phase 0
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// PHASE 0 - Approval Request Component
// ============================================
function ApprovalRequestComponent({ data }: { data: ComponentData }) {
  const approvalData = data as {
    approval_id?: string;
    agent_id?: string;
    action?: string;
    title?: string;
    description?: string;
    risk_level?: string;
    estimated_cost_7_days?: number;
    currency?: string;
    expires_in_hours?: number;
  };

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const user = useHiveStore((state) => state.user);

  // Map risk level to colors
  const getRiskColor = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'critical':
        return {
          container: 'rounded-xl border-2 border-red-300 bg-red-100 overflow-hidden shadow-lg',
          header: 'p-4 bg-gradient-to-r from-white to-red-100 border-b-2 border-red-300',
          icon: 'p-2 rounded-lg bg-red-500 text-white',
          text: 'text-red-800',
          badgeText: 'px-2 py-0.5 rounded-full text-xs font-semibold uppercase bg-red-500 text-white'
        };
      case 'high':
        return {
          container: 'rounded-xl border-2 border-orange-300 bg-orange-100 overflow-hidden shadow-lg',
          header: 'p-4 bg-gradient-to-r from-white to-orange-100 border-b-2 border-orange-300',
          icon: 'p-2 rounded-lg bg-orange-500 text-white',
          text: 'text-orange-800',
          badgeText: 'px-2 py-0.5 rounded-full text-xs font-semibold uppercase bg-orange-500 text-white'
        };
      case 'medium':
        return {
          container: 'rounded-xl border-2 border-yellow-300 bg-yellow-100 overflow-hidden shadow-lg',
          header: 'p-4 bg-gradient-to-r from-white to-yellow-100 border-b-2 border-yellow-300',
          icon: 'p-2 rounded-lg bg-yellow-500 text-white',
          text: 'text-yellow-800',
          badgeText: 'px-2 py-0.5 rounded-full text-xs font-semibold uppercase bg-yellow-500 text-white'
        };
      default:
        return {
          container: 'rounded-xl border-2 border-blue-300 bg-blue-100 overflow-hidden shadow-lg',
          header: 'p-4 bg-gradient-to-r from-white to-blue-100 border-b-2 border-blue-300',
          icon: 'p-2 rounded-lg bg-blue-500 text-white',
          text: 'text-blue-800',
          badgeText: 'px-2 py-0.5 rounded-full text-xs font-semibold uppercase bg-blue-500 text-white'
        };
    }
  };

  const colors = getRiskColor(approvalData.risk_level);

  // Map agent to display info (prevents dynamic class purging)
  const agentInfo: Record<string, { name: string; textClass: string }> = {
    'marcus': { name: 'Marcus', textClass: 'font-medium text-blue-600' },
    'milo': { name: 'Milo', textClass: 'font-medium text-pink-600' },
    'luna': { name: 'Luna', textClass: 'font-medium text-violet-600' },
    'sora': { name: 'Sora', textClass: 'font-medium text-cyan-600' },
  };

  const agent = agentInfo[approvalData.agent_id || ''] || { name: approvalData.agent_id || 'Agent', textClass: 'font-medium text-slate-600' };

  const handleApprove = async () => {
    if (!approvalData.approval_id || !user?.id || loading) return;

    setLoading(true);
    const result = await approveRequest(approvalData.approval_id, user.id);
    setLoading(false);

    if (result.success) {
      setStatus('approved');
      console.log('[Approval] Approved:', result.message);
    } else {
      console.error('[Approval] Error:', result.message);
      alert(`Erreur: ${result.message}`);
    }
  };

  const handleReject = async () => {
    if (!approvalData.approval_id || !user?.id || loading) return;

    const reason = prompt('Raison du rejet (optionnel):');
    if (reason === null) return; // User cancelled

    setLoading(true);
    const result = await rejectRequest(approvalData.approval_id, user.id, reason || undefined);
    setLoading(false);

    if (result.success) {
      setStatus('rejected');
      console.log('[Approval] Rejected:', result.message);
    } else {
      console.error('[Approval] Error:', result.message);
      alert(`Erreur: ${result.message}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={colors.container}
    >
      {/* Header */}
      <div className={colors.header}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className={colors.icon}>
              <Shield className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`font-bold ${colors.text} text-lg`}>
                  Approbation Requise
                </h3>
                <span className={colors.badgeText}>
                  {approvalData.risk_level}
                </span>
              </div>
              <p className="text-sm text-slate-600">
                Demandé par <span className={agent.textClass}>{agent.name}</span>
              </p>
            </div>
          </div>
          {approvalData.expires_in_hours !== undefined && (
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Clock className="w-3.5 h-3.5" />
              <span>Expire dans {approvalData.expires_in_hours}h</span>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        {/* Title */}
        <div>
          <h4 className="font-semibold text-slate-900 text-base mb-2">
            {approvalData.title}
          </h4>
        </div>

        {/* Description */}
        {approvalData.description && (
          <div className="p-3 rounded-lg bg-white border border-slate-200">
            <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
              {approvalData.description}
            </pre>
          </div>
        )}

        {/* Cost Estimation */}
        {approvalData.estimated_cost_7_days && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
            <DollarSign className="w-5 h-5 text-amber-600" />
            <div>
              <p className="text-xs text-amber-700 font-medium uppercase tracking-wide">
                Estimation 7 jours
              </p>
              <p className="text-2xl font-bold text-amber-900">
                {approvalData.estimated_cost_7_days.toLocaleString('fr-FR', {
                  style: 'currency',
                  currency: approvalData.currency || 'EUR'
                })}
              </p>
            </div>
          </div>
        )}

        {/* Action Info */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <code className="px-2 py-1 rounded bg-slate-100 text-slate-700 font-mono">
            {approvalData.action}
          </code>
          <span>•</span>
          <span>ID: {approvalData.approval_id?.slice(0, 8)}...</span>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 bg-slate-50 border-t border-slate-200">
        {status === 'pending' ? (
          <>
            <div className="flex items-center gap-3">
              <button
                onClick={handleApprove}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-green-500 hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <CheckCircle className="w-4 h-4" />
                {loading ? 'En cours...' : 'Approuver'}
              </button>
              <button
                onClick={handleReject}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 disabled:bg-slate-100 disabled:cursor-not-allowed text-slate-800 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                {loading ? 'En cours...' : 'Rejeter'}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-3 text-center">
              ⚠️ L'action sera exécutée immédiatement après approbation
            </p>
          </>
        ) : status === 'approved' ? (
          <div className="flex items-center justify-center gap-2 py-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold">Approuvé - Action en cours d'exécution</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 py-2 text-slate-700">
            <XCircle className="w-5 h-5" />
            <span className="font-semibold">Rejeté - Aucune action exécutée</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================
// Generic Component (fallback)
// ============================================
function GenericComponent({ component }: { component: UIComponent }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 bg-slate-50 rounded-lg border border-slate-100"
    >
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
        <ExternalLink className="w-3.5 h-3.5" />
        <span>Composant: {component.type}</span>
      </div>
      {component.title && (
        <p className="text-sm font-medium text-slate-700">{component.title}</p>
      )}
    </motion.div>
  );
}
