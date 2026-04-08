// ═══════════════════════════════════════════════════════════════
// Support Ticket Detail View - Conversation
// Phase 3.2 - Support System
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Send,
  Loader2,
  CheckCircle2,
  User,
  Bot,
  Image as ImageIcon,
  Clock,
  AlertTriangle,
  Lock,
  Trash2,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { getCurrentUser, supabase } from '../lib/supabase';
import FileUploader, {
  FileAttachmentDisplay,
  type FileAttachment,
} from '../components/support/FileUploader';
import SatisfactionSurvey from '../components/support/SatisfactionSurvey';
import HelpButton from '../components/support/HelpButton';
import {
  getTicket,
  getTicketMessages,
  sendMessage,
  markTicketMessagesAsRead,
  markTicketResolved,
  updateTicketStatus,
  updateTicketPriority,
  assignTicket,
  subscribeToTicketMessages,
  subscribeToTicketUpdates,
  formatTicketNumber,
  getRelativeTime,
  getInternalNotes,
  createInternalNote,
  deleteInternalNote,
  getResponseTemplates,
  incrementResponseTemplateUsage,
  generateTicketEmbedding,
  findTicketDuplicates,
  markTicketAsDuplicate,
  type ResponseTemplate,
  type SimilarTicket,
} from '../services/support.service';
import type {
  SupportTicket,
  SupportMessage,
  TicketStatus,
  TicketPriority,
  InternalNote,
} from '../types/support.types';
import {
  TICKET_STATUS_CONFIG,
  TICKET_PRIORITY_CONFIG,
  TICKET_CATEGORY_CONFIG,
} from '../types/support.types';

export default function SupportTicketDetailView() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);

  // Internal notes (admin only)
  const [internalNotes, setInternalNotes] = useState<InternalNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Satisfaction survey
  const [hasSurvey, setHasSurvey] = useState(false);

  // Response templates (admin only)
  const [responseTemplates, setResponseTemplates] = useState<ResponseTemplate[]>([]);

  // Similar tickets / duplicate detection (admin only)
  const [similarTickets, setSimilarTickets] = useState<SimilarTicket[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ticketId) {
      loadTicketAndMessages();
      checkIfAdmin();

      // Subscribe to realtime updates
      const messagesChannel = subscribeToTicketMessages(ticketId, (message) => {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
      });

      const ticketChannel = subscribeToTicketUpdates(ticketId, (updatedTicket) => {
        setTicket(updatedTicket);
      });

      return () => {
        messagesChannel.unsubscribe();
        ticketChannel.unsubscribe();
      };
    }
  }, [ticketId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load internal notes when admin status changes
  useEffect(() => {
    if (isAdmin && ticketId) {
      loadInternalNotes();
    }
  }, [isAdmin, ticketId]);

  // Load response templates when admin status changes
  useEffect(() => {
    if (isAdmin && ticket) {
      loadResponseTemplates();
    }
  }, [isAdmin, ticket]);

  // Load similar tickets when admin views ticket
  useEffect(() => {
    if (isAdmin && ticketId) {
      loadSimilarTickets();
    }
  }, [isAdmin, ticketId]);

  // ─────────────────────────────────────────────────────────────────
  // Load Data
  // ─────────────────────────────────────────────────────────────────

  const loadTicketAndMessages = async () => {
    if (!ticketId) return;

    setLoading(true);
    try {
      const [ticketData, messagesData] = await Promise.all([
        getTicket(ticketId),
        getTicketMessages(ticketId),
      ]);

      setTicket(ticketData);
      setMessages(messagesData);

      // Mark admin messages as read
      await markTicketMessagesAsRead(ticketId);

      // Check if ticket has satisfaction survey
      const { data: surveyData } = await supabase
        .from('ticket_satisfaction')
        .select('id')
        .eq('ticket_id', ticketId)
        .maybeSingle();

      setHasSurvey(!!surveyData);
    } catch (error) {
      console.error('[Support] Error loading ticket:', error);
      alert('Erreur chargement ticket');
      navigate('/support');
    } finally {
      setLoading(false);
    }
  };

  const checkIfAdmin = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      // Check if user has admin role
      const { supabase } = await import('../lib/supabase');
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      setIsAdmin(data?.role === 'admin' || data?.role === 'super_admin');
    } catch (error) {
      // Not admin or error
      setIsAdmin(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // Send Message
  // ─────────────────────────────────────────────────────────────────

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !ticketId) return;

    setSending(true);
    try {
      const message = await sendMessage({
        ticket_id: ticketId,
        message: newMessage.trim(),
        sender_type: isAdmin ? 'admin' : 'user',
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      setMessages((prev) => [...prev, message]);
      setNewMessage('');
      setAttachments([]);
      scrollToBottom();
    } catch (error: any) {
      console.error('[Support] Error sending message:', error);
      alert(`Erreur envoi message : ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // Actions
  // ─────────────────────────────────────────────────────────────────

  const handleMarkResolved = async () => {
    if (!ticketId) return;

    try {
      await markTicketResolved(ticketId);
      setTicket((prev) => (prev ? { ...prev, status: 'resolved' } : null));
    } catch (error: any) {
      alert(`Erreur : ${error.message}`);
    }
  };

  const handleUpdateStatus = async (status: TicketStatus) => {
    if (!ticketId || !isAdmin) return;

    try {
      await updateTicketStatus(ticketId, status);
      setTicket((prev) => (prev ? { ...prev, status } : null));
    } catch (error: any) {
      alert(`Erreur : ${error.message}`);
    }
  };

  const handleUpdatePriority = async (priority: TicketPriority) => {
    if (!ticketId || !isAdmin) return;

    try {
      await updateTicketPriority(ticketId, priority);
      setTicket((prev) => (prev ? { ...prev, priority } : null));
    } catch (error: any) {
      alert(`Erreur : ${error.message}`);
    }
  };

  const handleAssign = async () => {
    if (!ticketId || !isAdmin) return;

    const user = await getCurrentUser();
    if (!user) return;

    try {
      await assignTicket(ticketId, user.id);
      setTicket((prev) => (prev ? { ...prev, assigned_to: user.id } : null));
    } catch (error: any) {
      alert(`Erreur : ${error.message}`);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // Internal Notes (Admin Only)
  // ─────────────────────────────────────────────────────────────────

  const loadInternalNotes = async () => {
    if (!ticketId || !isAdmin) return;

    try {
      const notes = await getInternalNotes(ticketId);
      setInternalNotes(notes);
    } catch (error) {
      console.error('[Support] Error loading internal notes:', error);
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newNote.trim() || !ticketId) return;

    setSavingNote(true);
    try {
      const note = await createInternalNote(ticketId, newNote.trim());
      setInternalNotes((prev) => [...prev, note]);
      setNewNote('');
    } catch (error: any) {
      console.error('[Support] Error creating note:', error);
      alert(`Erreur : ${error.message}`);
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Supprimer cette note interne ?')) return;

    try {
      await deleteInternalNote(noteId);
      setInternalNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch (error: any) {
      console.error('[Support] Error deleting note:', error);
      alert(`Erreur : ${error.message}`);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // Response Templates (Admin Only)
  // ─────────────────────────────────────────────────────────────────

  const loadResponseTemplates = async () => {
    if (!ticketId || !isAdmin || !ticket) return;

    try {
      const templates = await getResponseTemplates(ticket.category);
      setResponseTemplates(templates);
    } catch (error) {
      console.error('[Support] Error loading response templates:', error);
    }
  };

  const handleInsertTemplate = async (templateId: string) => {
    const template = responseTemplates.find((t) => t.id === templateId);
    if (!template) return;

    setNewMessage(template.body);

    // Increment usage counter
    try {
      await incrementResponseTemplateUsage(templateId);
    } catch (error) {
      console.error('[Support] Error incrementing template usage:', error);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // Similar Tickets / Duplicate Detection (Admin Only)
  // ─────────────────────────────────────────────────────────────────

  const loadSimilarTickets = async () => {
    if (!ticketId || !isAdmin) return;

    setLoadingSimilar(true);
    try {
      // Try to find duplicates (requires embedding to exist)
      const similar = await findTicketDuplicates(ticketId, 0.80, 5);
      setSimilarTickets(similar);

      // If no embedding yet and no similar tickets found, generate embedding
      if (similar.length === 0) {
        console.log('[Support] No embedding found, generating...');
        const result = await generateTicketEmbedding(ticketId);
        if (result.similar_tickets) {
          setSimilarTickets(result.similar_tickets);
        }
      }
    } catch (error) {
      console.error('[Support] Error loading similar tickets:', error);
      // Don't show alert, just log - this is a non-critical feature
    } finally {
      setLoadingSimilar(false);
    }
  };

  const handleMarkAsDuplicate = async (originalTicketId: string) => {
    if (!ticketId) return;

    if (!confirm('Marquer ce ticket comme doublon ? Il sera automatiquement fermé.')) {
      return;
    }

    try {
      await markTicketAsDuplicate(ticketId, originalTicketId);
      // Reload ticket to show updated status
      await loadTicketAndMessages();
      alert('Ticket marqué comme doublon');
    } catch (error: any) {
      console.error('[Support] Error marking as duplicate:', error);
      alert(`Erreur : ${error.message}`);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // Utilities
  // ─────────────────────────────────────────────────────────────────

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ─────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Ticket introuvable</h2>
          <button
            onClick={() => navigate('/support')}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg"
          >
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = TICKET_STATUS_CONFIG[ticket.status];
  const categoryConfig = TICKET_CATEGORY_CONFIG[ticket.category];
  const priorityConfig = TICKET_PRIORITY_CONFIG[ticket.priority];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-3">
            <button
              onClick={() => navigate('/support')}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{categoryConfig.emoji}</span>
                <span className="text-sm font-mono text-slate-500">{formatTicketNumber(ticket.id)}</span>
                <span className="text-sm text-slate-400">·</span>
                <span className="text-sm text-slate-500">{categoryConfig.label}</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900">{ticket.subject}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className={`px-3 py-1.5 rounded-full text-sm font-medium border ${statusConfig.bgColor} ${statusConfig.color}`}>
              {statusConfig.icon} {statusConfig.label}
            </div>
            <div className={`px-3 py-1.5 rounded-lg text-sm font-medium ${priorityConfig.color}`}>
              {priorityConfig.icon} Priorité {priorityConfig.label}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-slate-500">
              <Clock className="w-4 h-4" />
              Créé {getRelativeTime(ticket.created_at)}
            </div>
          </div>

          {/* Admin Controls */}
          {isAdmin && (
            <div className="mt-4 pt-4 border-t border-slate-200 flex items-center gap-3">
              <select
                value={ticket.status}
                onChange={(e) => handleUpdateStatus(e.target.value as TicketStatus)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
              >
                {Object.entries(TICKET_STATUS_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.icon} {config.label}
                  </option>
                ))}
              </select>

              <select
                value={ticket.priority}
                onChange={(e) => handleUpdatePriority(e.target.value as TicketPriority)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
              >
                {Object.entries(TICKET_PRIORITY_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.icon} {config.label}
                  </option>
                ))}
              </select>

              {!ticket.assigned_to && (
                <button
                  onClick={handleAssign}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm"
                >
                  S'assigner
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Messages Timeline */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto">
            {/* Initial Description */}
            <MessageBubble
              message={{
                id: 'initial',
                ticket_id: ticket.id,
                sender_id: ticket.user_id,
                sender_type: 'user',
                message: ticket.description,
                attachments: [],
                read_at: null,
                created_at: ticket.created_at,
              }}
              isUser={true}
              timestamp={getRelativeTime(ticket.created_at)}
            />

            {/* Screenshot if present */}
            {ticket.screenshot_url && (
              <div className="flex justify-start">
                <div className="bg-slate-700/50 rounded-xl p-3 max-w-md">
                  <div className="flex items-center gap-2 text-xs text-slate-300 mb-2">
                    <ImageIcon className="w-3.5 h-3.5" />
                    Screenshot
                  </div>
                  <img
                    src={ticket.screenshot_url}
                    alt="Screenshot"
                    className="rounded-lg max-w-full"
                  />
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isUser={message.sender_type === 'user'}
                timestamp={getRelativeTime(message.created_at)}
              />
            ))}

            <div ref={messagesEndRef} />
          </div>

          {/* Satisfaction Survey - Only for resolved tickets without survey */}
          {ticket && (ticket.status === 'resolved' || ticket.status === 'closed') && !isAdmin && !hasSurvey && (
            <div className="p-4 border-t border-slate-200 bg-slate-50">
              <SatisfactionSurvey
                ticketId={ticket.id}
                onSubmit={() => {
                  setHasSurvey(true);
                }}
              />
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
            {/* File uploader */}
            <FileUploader
              onFilesUploaded={(files) => setAttachments(files)}
              disabled={sending}
            />

            {/* Response Templates (Admin Only) */}
            {isAdmin && responseTemplates.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  💬 Modèles de réponse
                </label>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleInsertTemplate(e.target.value);
                      e.target.value = ''; // Reset after selection
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white"
                  disabled={sending}
                  defaultValue=""
                >
                  <option value="">Sélectionner un modèle de réponse...</option>
                  {responseTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.title}
                      {template.usage_count > 0 && ` (utilisé ${template.usage_count}×)`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Message input */}
            <div className="flex items-end gap-3">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Ajouter un message..."
                rows={3}
                className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Envoyer
              </button>
            </div>
          </form>
        </div>

        {/* Internal Notes (Admin Only) */}
        {isAdmin && (
          <div className="mt-6 p-4 bg-red-50/50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-4 h-4 text-red-600" />
              <h3 className="text-sm font-semibold text-red-800">
                Notes Internes (Visibles uniquement par les admins)
              </h3>
            </div>

            {/* Existing notes */}
            {internalNotes.length > 0 && (
              <div className="space-y-2 mb-4">
                {internalNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3 bg-white border border-red-100 rounded-lg"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                          <span className="font-medium text-red-700">
                            {note.author_email || 'Admin'}
                          </span>
                          <span>•</span>
                          <span>{getRelativeTime(note.created_at)}</span>
                        </div>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">
                          {note.note}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-600 transition flex-shrink-0"
                        title="Supprimer cette note"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add note form */}
            <div className="space-y-2">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Ajouter une note interne (visible uniquement par les admins)..."
                className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows={3}
              />
              <button
                onClick={handleCreateNote}
                disabled={!newNote.trim() || savingNote}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {savingNote ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Ajouter une note interne
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Similar Tickets / Duplicate Detection (Admin Only) */}
        {isAdmin && (
          <div className="mt-6 p-4 bg-yellow-50/50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <Copy className="w-4 h-4 text-yellow-600" />
                <h3 className="text-sm font-semibold text-yellow-800">
                  Tickets similaires / Doublons potentiels
                </h3>
              </div>
              {loadingSimilar && (
                <Loader2 className="w-4 h-4 text-yellow-600 animate-spin" />
              )}
            </div>

            {similarTickets.length === 0 && !loadingSimilar && (
              <p className="text-sm text-slate-600">
                Aucun doublon détecté. L'IA a analysé ce ticket et n'a trouvé aucun ticket similaire.
              </p>
            )}

            {similarTickets.length > 0 && (
              <>
                <p className="text-xs text-yellow-700 mb-3">
                  {similarTickets.length} ticket(s) similaire(s) détecté(s) par IA
                </p>
                <div className="space-y-2">
                  {similarTickets.map((similar) => (
                    <div
                      key={similar.id}
                      className="p-3 bg-white border border-yellow-100 rounded-lg hover:border-yellow-300 transition"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono font-semibold text-yellow-700">
                              #{similar.ticket_number}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                TICKET_STATUS_CONFIG[similar.status].color
                              }`}
                            >
                              {TICKET_STATUS_CONFIG[similar.status].label}
                            </span>
                            <span className="text-xs font-medium text-yellow-600">
                              {(similar.similarity * 100).toFixed(0)}% similaire
                            </span>
                          </div>
                          <h4 className="text-sm font-medium text-slate-900 mb-1 line-clamp-1">
                            {similar.subject}
                          </h4>
                          <p className="text-xs text-slate-600 line-clamp-2">
                            {similar.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span
                              className={`text-xs ${
                                TICKET_CATEGORY_CONFIG[similar.category as TicketCategory].color
                              }`}
                            >
                              {TICKET_CATEGORY_CONFIG[similar.category as TicketCategory].emoji}{' '}
                              {TICKET_CATEGORY_CONFIG[similar.category as TicketCategory].label}
                            </span>
                            <span>•</span>
                            <span className="text-xs text-slate-500">
                              {getRelativeTime(similar.created_at)}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <a
                            href={`/support/${similar.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg hover:bg-yellow-100 text-yellow-600 hover:text-yellow-700 transition"
                            title="Voir le ticket"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleMarkAsDuplicate(similar.id)}
                            className="p-1.5 rounded-lg hover:bg-yellow-100 text-yellow-600 hover:text-yellow-700 transition"
                            title="Marquer comme doublon de ce ticket"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Actions */}
        {ticket.status !== 'resolved' && ticket.status !== 'closed' && !isAdmin && (
          <div className="mt-4">
            <button
              onClick={handleMarkResolved}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Marquer comme résolu
            </button>
          </div>
        )}
      </div>

      {/* Help Button */}
      <HelpButton />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Message Bubble Component
// ─────────────────────────────────────────────────────────────────

function MessageBubble({
  message,
  isUser,
  timestamp,
}: {
  message: SupportMessage;
  isUser: boolean;
  timestamp: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}
    >
      <div className={`max-w-2xl ${isUser ? '' : 'flex flex-col items-end'}`}>
        <div className="flex items-center gap-2 mb-1.5">
          {isUser ? (
            <>
              <div className="w-7 h-7 rounded-full bg-slate-600 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-slate-700">Vous</span>
            </>
          ) : (
            <>
              <span className="text-sm font-medium text-cyan-700">Support Team</span>
              <div className="w-7 h-7 rounded-full bg-cyan-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
            </>
          )}
          <span className="text-xs text-slate-400">· {timestamp}</span>
        </div>

        <div
          className={`px-4 py-3 rounded-xl ${
            isUser
              ? 'bg-slate-700/50 text-slate-100'
              : 'bg-cyan-900/30 text-cyan-950 border border-cyan-200'
          }`}
        >
          <p className="whitespace-pre-wrap">{message.message}</p>

          {/* File attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <FileAttachmentDisplay attachments={message.attachments as FileAttachment[]} />
          )}
        </div>
      </div>
    </motion.div>
  );
}
