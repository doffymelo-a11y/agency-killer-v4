// ═══════════════════════════════════════════════════════════════
// Support View - User Tickets List & Creation
// Phase 3.1 - Support System
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LifeBuoy,
  Plus,
  X,
  Upload,
  Loader2,
  CheckCircle2,
  Clock,
  MessageCircle,
  ArrowLeft,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { useCurrentProject } from '../store/useHiveStore';
import HelpButton from '../components/support/HelpButton';
import {
  getMyTickets,
  createTicket,
  formatTicketNumber,
  getRelativeTime,
  searchKnowledgeBase,
  getPublicTemplates,
  incrementTemplateUsage,
  type KBArticle,
  type TicketTemplate,
} from '../services/support.service';
import { uploadScreenshot } from '../lib/cloudinary';
import { supabase } from '../lib/supabase';
import type {
  SupportTicket,
  TicketStatus,
  TicketCategory,
  TicketPriority,
  CreateTicketParams,
} from '../types/support.types';
import {
  TICKET_STATUS_CONFIG,
  TICKET_CATEGORY_CONFIG,
  TICKET_PRIORITY_CONFIG,
} from '../types/support.types';

export default function SupportView() {
  const navigate = useNavigate();
  const currentProject = useCurrentProject();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateTicketParams>({
    subject: '',
    description: '',
    category: 'bug',
    project_id: currentProject?.id,
  });
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);

  // AI Suggestion state
  const [aiSuggestion, setAiSuggestion] = useState<any | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // KB Article suggestions
  const [kbSuggestions, setKbSuggestions] = useState<KBArticle[]>([]);
  const [_loadingKB, setLoadingKB] = useState(false);

  // Ticket templates
  const [templates, setTemplates] = useState<TicketTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  useEffect(() => {
    loadTickets();
  }, [statusFilter]);

  useEffect(() => {
    // Update project_id when current project changes
    if (currentProject) {
      setFormData((prev) => ({ ...prev, project_id: currentProject.id }));
    }
  }, [currentProject]);

  // Auto-search KB when subject changes (debounced)
  useEffect(() => {
    if (formData.subject && formData.subject.length >= 10) {
      const timer = setTimeout(async () => {
        setLoadingKB(true);
        try {
          const articles = await searchKnowledgeBase(formData.subject, 3);
          setKbSuggestions(articles);
        } catch (error) {
          console.error('[Support] Error searching KB:', error);
        } finally {
          setLoadingKB(false);
        }
      }, 500); // 500ms debounce

      return () => clearTimeout(timer);
    } else {
      setKbSuggestions([]);
    }
  }, [formData.subject]);

  // Load templates when form opens
  useEffect(() => {
    if (showForm) {
      loadTemplates();
    }
  }, [showForm]);

  async function loadTemplates() {
    try {
      const data = await getPublicTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('[Support] Error loading templates:', error);
    }
  }

  async function applyTemplate(templateId: string) {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    setFormData({
      ...formData,
      category: template.category,
      subject: template.subject_template,
      description: template.description_template,
    });

    setSelectedTemplate(templateId);

    // Increment usage count (fire and forget)
    incrementTemplateUsage(templateId).catch(console.error);
  }

  // ─────────────────────────────────────────────────────────────────
  // Load Tickets
  // ─────────────────────────────────────────────────────────────────

  const loadTickets = async () => {
    setLoading(true);
    try {
      const filter = statusFilter === 'all' ? undefined : statusFilter;
      const data = await getMyTickets(filter);
      setTickets(data);
    } catch (error) {
      console.error('[Support] Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // Get AI Suggestion
  // ─────────────────────────────────────────────────────────────────

  const handleGetAISuggestion = async () => {
    if (!formData.subject || formData.subject.length < 5) {
      setAiError('Veuillez d\'abord remplir le sujet (min 5 caractères)');
      return;
    }

    if (!formData.description || formData.description.length < 20) {
      setAiError('Veuillez d\'abord remplir la description (min 20 caractères)');
      return;
    }

    setLoadingAI(true);
    setAiError(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-categorize-ticket', {
        body: {
          subject: formData.subject,
          description: formData.description,
        },
      });

      if (error) throw error;

      if (data && data.success) {
        setAiSuggestion(data.analysis);
        // Optionally auto-apply suggestion if high confidence
        if (data.analysis.confidence >= 0.75) {
          setFormData((prev) => ({
            ...prev,
            category: data.analysis.suggested_category,
          }));
        }
      }
    } catch (error: any) {
      console.error('[Support] Error getting AI suggestion:', error);
      setAiError(error.message || 'Erreur lors de l\'analyse IA');
    } finally {
      setLoadingAI(false);
    }
  };

  const handleApplyAISuggestion = () => {
    if (aiSuggestion) {
      setFormData((prev) => ({
        ...prev,
        category: aiSuggestion.suggested_category,
      }));
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // Create Ticket
  // ─────────────────────────────────────────────────────────────────

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.subject || formData.subject.length < 5) {
      alert('Le sujet doit contenir au moins 5 caractères');
      return;
    }

    if (!formData.description || formData.description.length < 20) {
      alert('La description doit contenir au moins 20 caractères');
      return;
    }

    setCreating(true);

    try {
      // Upload screenshot if provided
      let screenshot_url: string | undefined;
      if (screenshot) {
        setUploading(true);
        screenshot_url = await uploadScreenshot(screenshot);
        setUploading(false);
      }

      // Auto-capture context
      const params: CreateTicketParams = {
        ...formData,
        screenshot_url,
        page_url: window.location.href,
        user_agent: navigator.userAgent,
      };

      await createTicket(params);

      // Reset form
      setFormData({
        subject: '',
        description: '',
        category: 'bug',
        project_id: currentProject?.id,
      });
      setScreenshot(null);
      setShowForm(false);

      // Reload tickets
      await loadTickets();
    } catch (error: any) {
      console.error('[Support] Error creating ticket:', error);
      alert(`Erreur création ticket : ${error.message}`);
    } finally {
      setCreating(false);
      setUploading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // Filter Tickets
  // ─────────────────────────────────────────────────────────────────

  const filteredTickets = tickets;

  const openTickets = tickets.filter((t) => ['open', 'in_progress', 'waiting_user'].includes(t.status));
  const resolvedTickets = tickets.filter((t) => ['resolved', 'closed'].includes(t.status));

  // ─────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="Retour au tableur de tâches"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                <LifeBuoy className="w-7 h-7 text-cyan-600" />
                Support & Aide
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Signalez un bug ou demandez une fonctionnalité
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Annuler' : 'Nouveau ticket'}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6">
        {/* Creation Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <form onSubmit={handleCreateTicket} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Créer un nouveau ticket</h2>

                {/* Template Selector */}
                {templates.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Utiliser un modèle (optionnel)
                    </label>
                    <select
                      value={selectedTemplate}
                      onChange={(e) => {
                        if (e.target.value) {
                          applyTemplate(e.target.value);
                        }
                      }}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white"
                    >
                      <option value="">📝 Commencer sans modèle</option>
                      <optgroup label="⭐ Modèles populaires">
                        {templates
                          .filter((t) => t.is_featured)
                          .map((template) => (
                            <option key={template.id} value={template.id}>
                              {TICKET_CATEGORY_CONFIG[template.category as TicketCategory].emoji} {template.name}
                            </option>
                          ))}
                      </optgroup>
                      <optgroup label="Tous les modèles">
                        {templates
                          .filter((t) => !t.is_featured)
                          .map((template) => (
                            <option key={template.id} value={template.id}>
                              {TICKET_CATEGORY_CONFIG[template.category as TicketCategory].emoji} {template.name}
                            </option>
                          ))}
                      </optgroup>
                    </select>
                    {selectedTemplate && templates.find((t) => t.id === selectedTemplate)?.description && (
                      <p className="text-xs text-slate-600 mt-1">
                        {templates.find((t) => t.id === selectedTemplate)?.description}
                      </p>
                    )}
                  </div>
                )}

                {/* Category */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Catégorie *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as TicketCategory })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    required
                  >
                    {Object.entries(TICKET_CATEGORY_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.emoji} {config.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subject */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Sujet * <span className="text-xs text-slate-500">(5-200 caractères)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Ex: L'agent Luna ne répond plus"
                    maxLength={200}
                    minLength={5}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">{formData.subject.length}/200</p>
                </div>

                {/* KB Article Suggestions */}
                {kbSuggestions.length > 0 && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="text-blue-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h4 className="font-medium text-blue-900">
                        Articles qui pourraient vous aider :
                      </h4>
                    </div>

                    <div className="space-y-2">
                      {kbSuggestions.map((article) => (
                        <a
                          key={article.id}
                          href={`/help/${article.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-3 bg-white border border-blue-100 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition group"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-blue-700 group-hover:text-blue-800 mb-1">
                                {article.title}
                              </div>
                              {article.excerpt && (
                                <p className="text-sm text-slate-600 line-clamp-2">
                                  {article.excerpt}
                                </p>
                              )}
                            </div>
                            <div className="flex-shrink-0 text-blue-500 group-hover:text-blue-600">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>

                    <p className="text-xs text-blue-700 mt-3">
                      Votre problème persiste ? Continuez à remplir le formulaire ci-dessous.
                    </p>
                  </div>
                )}

                {/* Description */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description * <span className="text-xs text-slate-500">(min 20 caractères)</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={TICKET_CATEGORY_CONFIG[formData.category].placeholder}
                    rows={5}
                    minLength={20}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">{formData.description.length} caractères</p>
                </div>

                {/* AI Suggestion */}
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={handleGetAISuggestion}
                    disabled={loadingAI || !formData.subject || !formData.description}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingAI ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analyse en cours...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Obtenir une suggestion IA
                      </>
                    )}
                  </button>

                  {/* AI Error */}
                  {aiError && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">{aiError}</p>
                    </div>
                  )}

                  {/* AI Suggestion Result */}
                  {aiSuggestion && (
                    <div className="mt-3 p-4 bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <h4 className="font-semibold text-purple-900">
                          Suggestion IA (confiance: {(aiSuggestion.confidence * 100).toFixed(0)}%)
                        </h4>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-700">Catégorie suggérée:</span>
                          <span className="px-2 py-0.5 bg-white border border-purple-200 rounded text-purple-700 font-medium">
                            {TICKET_CATEGORY_CONFIG[aiSuggestion.suggested_category as TicketCategory].emoji}{' '}
                            {TICKET_CATEGORY_CONFIG[aiSuggestion.suggested_category as TicketCategory].label}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-700">Priorité suggérée:</span>
                          <span className={`px-2 py-0.5 bg-white border rounded font-medium ${
                            aiSuggestion.suggested_priority === 'critical'
                              ? 'border-red-200 text-red-700'
                              : aiSuggestion.suggested_priority === 'high'
                              ? 'border-orange-200 text-orange-700'
                              : aiSuggestion.suggested_priority === 'medium'
                              ? 'border-yellow-200 text-yellow-700'
                              : 'border-slate-200 text-slate-700'
                          }`}>
                            {TICKET_PRIORITY_CONFIG[aiSuggestion.suggested_priority as TicketPriority].icon}{' '}
                            {TICKET_PRIORITY_CONFIG[aiSuggestion.suggested_priority as TicketPriority].label}
                          </span>
                        </div>

                        {aiSuggestion.sentiment && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-700">Sentiment:</span>
                            <span className="text-slate-600">
                              {aiSuggestion.sentiment === 'positive' && '😊 Positif'}
                              {aiSuggestion.sentiment === 'neutral' && '😐 Neutre'}
                              {aiSuggestion.sentiment === 'negative' && '😞 Négatif'}
                              {aiSuggestion.sentiment === 'frustrated' && '😠 Frustré'}
                              {aiSuggestion.sentiment === 'urgent' && '⚡ Urgent'}
                            </span>
                          </div>
                        )}

                        {aiSuggestion.urgency_score && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-700">Score d'urgence:</span>
                            <span className="text-slate-600">{aiSuggestion.urgency_score}/10</span>
                          </div>
                        )}

                        <div className="pt-2 border-t border-purple-200">
                          <span className="font-medium text-slate-700">Raisonnement:</span>
                          <p className="text-slate-600 mt-1">{aiSuggestion.reasoning}</p>
                        </div>

                        {aiSuggestion.confidence >= 0.75 && (
                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={handleApplyAISuggestion}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium transition"
                            >
                              Appliquer la suggestion
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Screenshot Upload */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Screenshot (optionnel)
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                      <Upload className="w-4 h-4 text-slate-600" />
                      <span className="text-sm text-slate-700">Choisir un fichier</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>
                    {screenshot && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        {screenshot.name}
                        <button
                          type="button"
                          onClick={() => setScreenshot(null)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">JPG, PNG ou WebP · Max 5MB</p>
                </div>

                {/* Submit */}
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={creating || uploading}
                    className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {(creating || uploading) && <Loader2 className="w-4 h-4 animate-spin" />}
                    {uploading ? 'Upload en cours...' : creating ? 'Création...' : 'Créer le ticket'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-cyan-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Tous ({tickets.length})
          </button>
          <button
            onClick={() => setStatusFilter('open')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === 'open'
                ? 'bg-cyan-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Ouverts ({openTickets.length})
          </button>
          <button
            onClick={() => setStatusFilter('resolved')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === 'resolved'
                ? 'bg-cyan-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Résolus ({resolvedTickets.length})
          </button>
        </div>

        {/* Tickets List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <LifeBuoy className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucun ticket</h3>
            <p className="text-slate-500 mb-4">
              {statusFilter === 'all'
                ? 'Vous n\'avez pas encore créé de ticket'
                : `Aucun ticket ${statusFilter === 'open' ? 'ouvert' : 'résolu'}`}
            </p>
            {statusFilter === 'all' && (
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Créer votre premier ticket
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} onClick={() => navigate(`/support/${ticket.id}`)} />
            ))}
          </div>
        )}
      </div>

      {/* Help Button */}
      <HelpButton />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Ticket Card Component
// ─────────────────────────────────────────────────────────────────

function TicketCard({ ticket, onClick }: { ticket: SupportTicket; onClick: () => void }) {
  const statusConfig = TICKET_STATUS_CONFIG[ticket.status];
  const categoryConfig = TICKET_CATEGORY_CONFIG[ticket.category];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="bg-white rounded-xl border border-slate-200 p-5 hover:border-cyan-300 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          <span className="text-2xl">{categoryConfig.emoji}</span>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-slate-900 mb-1 truncate">{ticket.subject}</h3>
            <p className="text-sm text-slate-500 line-clamp-2">{ticket.description}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig.bgColor} ${statusConfig.color}`}>
          {statusConfig.icon} {statusConfig.label}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Clock className="w-3.5 h-3.5" />
          {getRelativeTime(ticket.created_at)}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="font-mono">{formatTicketNumber(ticket.id)}</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <MessageCircle className="w-3.5 h-3.5" />
          <span>Dernière maj: {getRelativeTime(ticket.updated_at)}</span>
        </div>
      </div>
    </motion.div>
  );
}
