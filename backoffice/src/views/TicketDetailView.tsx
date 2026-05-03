// ═══════════════════════════════════════════════════════════════
// Ticket Detail View - Super Admin Backoffice (Redesigned)
// Professional, modern UI with better visual hierarchy
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  Loader2,
  AlertCircle,
  Lock,
  FileText,
  CheckCircle,
  Clock,
  User,
  MessageSquare,
  Calendar,
} from 'lucide-react';
import { api } from '../lib/api';
import type { SupportTicket, SupportMessage, InternalNote } from '../types';
import { Badge, Button, Card } from '../components/ui';

const STATUS_CONFIG = {
  open: { label: 'Open', variant: 'open' as const, icon: '🔵' },
  in_progress: { label: 'In Progress', variant: 'in_progress' as const, icon: '⏳' },
  waiting_user: { label: 'En attente client', variant: 'waiting_user' as const, icon: '⏰' },
  resolved: { label: 'Resolved', variant: 'resolved' as const, icon: '✅' },
  closed: { label: 'Closed', variant: 'closed' as const, icon: '🔒' },
};

const PRIORITY_CONFIG = {
  low: { label: 'Low', variant: 'low' as const, icon: '⬇️', color: 'text-slate-400' },
  medium: { label: 'Medium', variant: 'medium' as const, icon: '➡️', color: 'text-blue-400' },
  high: { label: 'High', variant: 'high' as const, icon: '⬆️', color: 'text-orange-400' },
  critical: { label: 'Critical', variant: 'critical' as const, icon: '🚨', color: 'text-red-400' },
};

const CATEGORY_CONFIG = {
  bug: { label: 'Bug', emoji: '🐛' },
  feature_request: { label: 'Feature Request', emoji: '✨' },
  question: { label: 'Question', emoji: '❓' },
  billing: { label: 'Billing', emoji: '💳' },
  integration: { label: 'Integration', emoji: '🔌' },
  other: { label: 'Other', emoji: '📝' },
};

export default function TicketDetailView() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [internalNotes, setInternalNotes] = useState<InternalNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (ticketId) {
      loadTicketData();
    }
  }, [ticketId]);

  const loadTicketData = async () => {
    if (!ticketId) return;

    setLoading(true);
    setError('');

    // Backend returns everything in one call: { ticket, messages, internal_notes }
    const response = await api.get<{
      ticket: SupportTicket;
      messages: SupportMessage[];
      internal_notes: InternalNote[];
    }>(`/api/superadmin/tickets/${ticketId}`);

    if (!response.success || !response.data) {
      setError(response.error?.message || 'Failed to load ticket');
      setLoading(false);
      return;
    }

    // Extract data from response
    setTicket(response.data.ticket);
    setMessages(response.data.messages || []);
    setInternalNotes(response.data.internal_notes || []);

    setLoading(false);
  };

  const handleSendMessage = async () => {
    if (!ticketId || !newMessage.trim()) return;

    setSendingMessage(true);
    const response = await api.post(`/api/superadmin/tickets/${ticketId}/reply`, {
      message: newMessage,
    });

    if (response.success) {
      setNewMessage('');
      await loadTicketData(); // Reload to get new message
    } else {
      alert(response.error?.message || 'Failed to send message');
    }

    setSendingMessage(false);
  };

  const handleAddNote = async () => {
    if (!ticketId || !newNote.trim()) return;

    setAddingNote(true);
    const response = await api.post(`/api/superadmin/tickets/${ticketId}/internal-notes`, {
      note: newNote,
    });

    if (response.success) {
      setNewNote('');
      await loadTicketData(); // Reload to get new note
    } else {
      alert(response.error?.message || 'Failed to add note');
    }

    setAddingNote(false);
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!ticketId) return;

    setUpdatingStatus(true);
    const response = await api.patch(`/api/superadmin/tickets/${ticketId}/status`, {
      status: newStatus,
    });

    if (response.success) {
      await loadTicketData(); // Reload to get updated status
    } else {
      alert(response.error?.message || 'Failed to update status');
    }

    setUpdatingStatus(false);
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-cyan-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-lg">Loading ticket details...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/tickets')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tickets
        </Button>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-300 mb-2">Error Loading Ticket</h3>
            <p className="text-sm text-red-400">{error || 'Ticket not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  const categoryConfig = CATEGORY_CONFIG[ticket.category as keyof typeof CATEGORY_CONFIG] || CATEGORY_CONFIG.other;

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      {/* Breadcrumb Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/tickets')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tickets
        </Button>
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <span>Tickets</span>
          <span>/</span>
          <span className="text-white font-medium">
            #{ticket.id.slice(0, 8).toUpperCase()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Ticket Header Card */}
          <Card className="p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{categoryConfig.emoji}</span>
                  <div>
                    <h1 className="text-2xl font-bold text-white leading-tight">
                      {ticket.subject}
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">{categoryConfig.label}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={STATUS_CONFIG[ticket.status].variant}>
                  {STATUS_CONFIG[ticket.status].icon} {STATUS_CONFIG[ticket.status].label}
                </Badge>
                <Badge variant={PRIORITY_CONFIG[ticket.priority].variant}>
                  {PRIORITY_CONFIG[ticket.priority].icon} {PRIORITY_CONFIG[ticket.priority].label}
                </Badge>
              </div>
            </div>

            <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                {ticket.description}
              </p>
            </div>

            <div className="flex items-center gap-6 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span className="font-medium text-slate-300">{ticket.user_email || 'Unknown'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Created {getRelativeTime(ticket.created_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Updated {getRelativeTime(ticket.updated_at)}</span>
              </div>
            </div>
          </Card>

          {/* Conversation Card */}
          <Card>
            <div className="px-6 py-4 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-cyan-500" />
                <h2 className="text-lg font-semibold text-white">Conversation</h2>
                <span className="text-sm text-slate-500">({messages.length})</span>
              </div>
            </div>

            <div className="p-6">
              {/* Messages */}
              <div className="space-y-4 mb-6 max-h-[600px] overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">No messages yet</p>
                    <p className="text-sm text-slate-600 mt-1">
                      Be the first to respond to this ticket
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] ${
                          message.sender_type === 'admin'
                            ? 'bg-gradient-to-br from-cyan-600 to-cyan-700'
                            : 'bg-slate-800/80'
                        } rounded-2xl p-4 shadow-lg`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                              message.sender_type === 'admin'
                                ? 'bg-cyan-500/20 text-cyan-200'
                                : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {message.sender_type === 'admin' ? '👨‍💼' : '👤'}
                          </div>
                          <span
                            className={`text-xs font-medium ${
                              message.sender_type === 'admin' ? 'text-cyan-100' : 'text-slate-400'
                            }`}
                          >
                            {message.sender_type === 'admin' ? 'Admin' : 'User'}
                          </span>
                          <span className="text-xs text-slate-400">•</span>
                          <span
                            className={`text-xs ${
                              message.sender_type === 'admin' ? 'text-cyan-200/80' : 'text-slate-500'
                            }`}
                          >
                            {getRelativeTime(message.created_at)}
                          </span>
                        </div>
                        <div
                          className={`text-sm leading-relaxed whitespace-pre-wrap ${
                            message.sender_type === 'admin' ? 'text-white' : 'text-slate-200'
                          }`}
                        >
                          {message.message}
                        </div>
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-3 space-y-1.5">
                            {message.attachments.map((file, i) => (
                              <a
                                key={i}
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-xs text-cyan-300 hover:text-cyan-200 hover:underline"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                {file.filename}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Reply Input */}
              <div className="border-t border-slate-700/50 pt-6">
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Your Response
                </label>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your response to the user..."
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none transition"
                  rows={4}
                />
                <div className="mt-3 flex justify-end">
                  <Button
                    variant="primary"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendingMessage}
                  >
                    {sendingMessage ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Reply
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Internal Notes Card */}
          <Card className="border-amber-500/20 bg-amber-500/5">
            <div className="px-6 py-4 border-b border-amber-500/20">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-semibold text-amber-300">Internal Notes</h2>
                <span className="text-xs text-amber-600 bg-amber-500/10 px-2 py-1 rounded-full border border-amber-500/20">
                  Admin Only
                </span>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-3 mb-4">
                {internalNotes.length === 0 ? (
                  <p className="text-amber-700 text-sm italic py-2">No internal notes yet</p>
                ) : (
                  internalNotes.map((note) => (
                    <div key={note.id} className="bg-slate-900/30 rounded-lg p-4 border border-amber-500/10">
                      <div className="flex items-center gap-2 mb-2 text-xs text-amber-600">
                        <span className="font-semibold">{note.author_email || 'Admin'}</span>
                        <span>•</span>
                        <span>{getRelativeTime(note.created_at)}</span>
                      </div>
                      <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                        {note.note}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-amber-500/20 pt-4">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add an internal note (only visible to admins)..."
                  className="w-full px-3 py-2 bg-slate-900/50 border border-amber-500/30 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none text-sm transition"
                  rows={2}
                />
                <div className="mt-2 flex justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleAddNote}
                    disabled={!newNote.trim() || addingNote}
                  >
                    {addingNote ? 'Adding...' : 'Add Note'}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Status
            </h3>
            <select
              value={ticket.status}
              onChange={(e) => handleUpdateStatus(e.target.value)}
              disabled={updatingStatus}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white font-medium focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50 cursor-pointer hover:bg-slate-900/70 transition"
            >
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.icon} {config.label}
                </option>
              ))}
            </select>
            {updatingStatus && (
              <p className="text-xs text-slate-500 mt-2">Updating status...</p>
            )}
          </Card>

          {/* Priority Card */}
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Priority
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{PRIORITY_CONFIG[ticket.priority].icon}</span>
              <div>
                <div className={`text-lg font-bold ${PRIORITY_CONFIG[ticket.priority].color}`}>
                  {PRIORITY_CONFIG[ticket.priority].label}
                </div>
                <div className="text-xs text-slate-500">Priority Level</div>
              </div>
            </div>
          </Card>

          {/* Timeline Card */}
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Timeline
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-300">Created</div>
                  <div className="text-xs text-slate-500">{getRelativeTime(ticket.created_at)}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-300">Last Updated</div>
                  <div className="text-xs text-slate-500">{getRelativeTime(ticket.updated_at)}</div>
                </div>
              </div>

              {ticket.resolved_at && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-green-300">Resolved</div>
                    <div className="text-xs text-slate-500">{getRelativeTime(ticket.resolved_at)}</div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Quick Actions Card */}
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Quick Actions
            </h3>
            <div className="space-y-2">
              {ticket.status !== 'resolved' && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleUpdateStatus('resolved')}
                  className="w-full justify-start"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark as Resolved
                </Button>
              )}
              {ticket.status !== 'closed' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUpdateStatus('closed')}
                  className="w-full justify-start text-slate-400"
                >
                  <Lock className="w-4 h-4" />
                  Close Ticket
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
