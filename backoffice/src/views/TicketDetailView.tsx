// ═══════════════════════════════════════════════════════════════
// Ticket Detail View - Super Admin Backoffice
// View and manage individual ticket with messages and internal notes
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
} from 'lucide-react';
import { api } from '../lib/api';
import type { SupportTicket, SupportMessage, InternalNote } from '../types';

const STATUS_CONFIG = {
  open: { label: 'Open', color: 'bg-blue-100 text-blue-800', icon: '🔵' },
  in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800', icon: '✅' },
  closed: { label: 'Closed', color: 'bg-slate-100 text-slate-800', icon: '🔒' },
};

const PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'text-slate-600', icon: '⬇️' },
  medium: { label: 'Medium', color: 'text-blue-600', icon: '➡️' },
  high: { label: 'High', color: 'text-orange-600', icon: '⬆️' },
  critical: { label: 'Critical', color: 'text-red-600', icon: '🚨' },
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

    // Load ticket details
    const ticketResponse = await api.get<SupportTicket>(`/api/superadmin/tickets/${ticketId}`);
    if (!ticketResponse.success) {
      setError(ticketResponse.error?.message || 'Failed to load ticket');
      setLoading(false);
      return;
    }
    setTicket(ticketResponse.data!);

    // Load messages
    const messagesResponse = await api.get<SupportMessage[]>(
      `/api/superadmin/tickets/${ticketId}/messages`
    );
    if (messagesResponse.success && messagesResponse.data) {
      setMessages(messagesResponse.data);
    }

    // Load internal notes
    const notesResponse = await api.get<InternalNote[]>(
      `/api/superadmin/tickets/${ticketId}/internal-notes`
    );
    if (notesResponse.success && notesResponse.data) {
      setInternalNotes(notesResponse.data);
    }

    setLoading(false);
  };

  const handleSendMessage = async () => {
    if (!ticketId || !newMessage.trim()) return;

    setSendingMessage(true);
    const response = await api.post(`/api/superadmin/tickets/${ticketId}/messages`, {
      message: newMessage,
      sender_type: 'admin',
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
    const response = await api.patch(`/api/superadmin/tickets/${ticketId}`, {
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-amber-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="p-8">
        <button
          onClick={() => navigate('/tickets')}
          className="mb-6 flex items-center gap-2 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tickets
        </button>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">Error</p>
            <p className="text-sm text-red-700 mt-1">{error || 'Ticket not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <button
        onClick={() => navigate('/tickets')}
        className="mb-6 flex items-center gap-2 text-slate-600 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Tickets
      </button>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content - Messages */}
        <div className="col-span-2 space-y-6">
          {/* Ticket Header */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">{ticket.subject}</h1>
                <p className="text-slate-600">{ticket.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600">{ticket.user_email || 'Unknown'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600">Created {getRelativeTime(ticket.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Conversation</h2>

            <div className="space-y-4 mb-6">
              {messages.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No messages yet</p>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-4 ${
                        message.sender_type === 'admin'
                          ? 'bg-amber-100 text-slate-900'
                          : 'bg-slate-100 text-slate-900'
                      }`}
                    >
                      <div className="text-xs text-slate-500 mb-2">
                        {message.sender_type === 'admin' ? 'Admin' : 'User'} •{' '}
                        {getRelativeTime(message.created_at)}
                      </div>
                      <div className="text-sm whitespace-pre-wrap">{message.message}</div>
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {message.attachments.map((file, i) => (
                            <a
                              key={i}
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-xs text-blue-600 hover:underline"
                            >
                              <FileText className="w-3 h-3" />
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

            {/* Message Input */}
            <div className="border-t border-slate-200 pt-4">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your response..."
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                rows={4}
              />
              <div className="mt-2 flex justify-end">
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                </button>
              </div>
            </div>
          </div>

          {/* Internal Notes */}
          <div className="bg-red-50 rounded-xl border border-red-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-5 h-5 text-red-600" />
              <h2 className="text-lg font-semibold text-red-900">Internal Notes (Admin Only)</h2>
            </div>

            <div className="space-y-3 mb-4">
              {internalNotes.length === 0 ? (
                <p className="text-red-700 text-sm">No internal notes yet</p>
              ) : (
                internalNotes.map((note) => (
                  <div key={note.id} className="bg-white p-3 rounded-lg">
                    <div className="text-xs text-slate-500 mb-1">
                      {note.author_email || 'Admin'} • {getRelativeTime(note.created_at)}
                    </div>
                    <div className="text-sm text-slate-900 whitespace-pre-wrap">{note.note}</div>
                  </div>
                ))
              )}
            </div>

            {/* Add Note Form */}
            <div>
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add an internal note (only visible to admins)..."
                className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none text-sm"
                rows={2}
              />
              <div className="mt-2 flex justify-end">
                <button
                  onClick={handleAddNote}
                  disabled={!newNote.trim() || addingNote}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 text-sm"
                >
                  {addingNote ? 'Adding...' : 'Add Note'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Ticket Info */}
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Status</h3>
            <select
              value={ticket.status}
              onChange={(e) => handleUpdateStatus(e.target.value)}
              disabled={updatingStatus}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50"
            >
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.icon} {config.label}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Priority</h3>
            <div className={`text-lg font-medium ${PRIORITY_CONFIG[ticket.priority].color}`}>
              {PRIORITY_CONFIG[ticket.priority].icon} {PRIORITY_CONFIG[ticket.priority].label}
            </div>
          </div>

          {/* Timestamps */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Timeline</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="w-4 h-4" />
                <span>Created: {getRelativeTime(ticket.created_at)}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="w-4 h-4" />
                <span>Updated: {getRelativeTime(ticket.updated_at)}</span>
              </div>
              {ticket.resolved_at && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>Resolved: {getRelativeTime(ticket.resolved_at)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
