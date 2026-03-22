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
} from 'lucide-react';
import { useCurrentProject } from '../store/useHiveStore';
import {
  getMyTickets,
  createTicket,
  formatTicketNumber,
  getRelativeTime,
} from '../services/support.service';
import { uploadScreenshot } from '../lib/cloudinary';
import type {
  SupportTicket,
  TicketStatus,
  TicketCategory,
  CreateTicketParams,
} from '../types/support.types';
import {
  TICKET_STATUS_CONFIG,
  TICKET_CATEGORY_CONFIG,
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

  useEffect(() => {
    loadTickets();
  }, [statusFilter]);

  useEffect(() => {
    // Update project_id when current project changes
    if (currentProject) {
      setFormData((prev) => ({ ...prev, project_id: currentProject.id }));
    }
  }, [currentProject]);

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
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
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
