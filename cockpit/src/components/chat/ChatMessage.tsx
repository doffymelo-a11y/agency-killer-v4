// ============================================
// THE HIVE OS V4 - Chat Message Component
// Renders messages with ui_components (download buttons)
// ============================================

import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import DOMPurify from 'dompurify';
import { AGENTS, type ChatMessage as ChatMessageType } from '../../types';
import UIComponentRenderer from './UIComponentRenderer';

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  // Determine which agent avatar to show
  const displayAgent = message.responding_agent || message.agent_id;
  const agent = displayAgent ? AGENTS[displayAgent] : null;

  // Sanitize message content to prevent XSS attacks
  const sanitizedContent = DOMPurify.sanitize(message.content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'code', 'pre', 'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote'],
    ALLOWED_ATTR: ['href', 'title', 'class'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {isUser ? (
          <div className="w-9 h-9 rounded-xl bg-slate-200 flex items-center justify-center">
            <User className="w-5 h-5 text-slate-600" />
          </div>
        ) : agent ? (
          <div
            className="w-9 h-9 rounded-xl overflow-hidden ring-2 ring-offset-2"
            style={{
              '--tw-ring-color': agent.color.primary,
              backgroundColor: agent.color.light
            } as React.CSSProperties}
          >
            <img
              src={agent.avatar}
              alt={agent.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
            <span className="text-sm font-bold text-amber-600">H</span>
          </div>
        )}
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-[80%] ${isUser ? 'text-right' : ''}`}>
        {/* Agent Name */}
        {!isUser && agent && (
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-xs font-semibold"
              style={{ color: agent.color.primary }}
            >
              {agent.name}
            </span>
            <span className="text-[10px] text-slate-400">{agent.role}</span>
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={`inline-block px-4 py-2.5 rounded-2xl ${
            isUser
              ? 'bg-slate-900 text-white rounded-tr-md'
              : 'bg-white border border-slate-100 shadow-sm rounded-tl-md'
          }`}
        >
          {/* Image Preview */}
          {message.image_url && (
            <div className="mb-2">
              <img
                src={message.image_url}
                alt="Attached"
                className="max-w-[200px] rounded-lg"
              />
            </div>
          )}

          {/* Text Content */}
          <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : ''}`}>
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                ul: ({ children }) => <ul className="list-disc pl-4 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="text-sm">{children}</li>,
                code: ({ children }) => (
                  <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-xs font-mono">
                    {children}
                  </code>
                ),
              }}
            >
              {sanitizedContent}
            </ReactMarkdown>
          </div>
        </div>

        {/* UI Components (Download Buttons, Images, Videos, PDFs) */}
        {!isUser && message.ui_components && message.ui_components.length > 0 && (
          <UIComponentRenderer components={message.ui_components} />
        )}

        {/* Timestamp */}
        <div className={`text-[10px] text-slate-400 mt-1 ${isUser ? 'text-right' : ''}`}>
          {new Date(message.timestamp).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </motion.div>
  );
}
