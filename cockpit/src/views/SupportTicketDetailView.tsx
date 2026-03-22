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
} from 'lucide-react';
import { getCurrentUser } from '../lib/supabase';
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
} from '../services/support.service';
import type {
  SupportTicket,
  SupportMessage,
  TicketStatus,
  TicketPriority,
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
      });

      setMessages((prev) => [...prev, message]);
      setNewMessage('');
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

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 bg-slate-50">
            <div className="flex items-end gap-3">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Ajouter un message..."
                rows={3}
                className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
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
        </div>
      </div>
    </motion.div>
  );
}
