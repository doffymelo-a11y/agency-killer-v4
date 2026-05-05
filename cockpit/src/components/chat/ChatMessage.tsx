// ============================================
// THE HIVE OS V4 - Chat Message Component
// Renders messages with ui_components (download buttons)
// ============================================

import { useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DOMPurify from 'dompurify';
import { AGENTS, type ChatMessage as ChatMessageType } from '../../types';
import { useHiveStore } from '../../store/useHiveStore';
import { parseAxesPattern } from '../../lib/parseAxesPattern';
import UIComponentRenderer from './UIComponentRenderer';

interface ChatMessageProps {
  message: ChatMessageType;
}

// V4 B2.5 — Markdown components shared by every agent message.
// remark-gfm parses tables; these renderers give them the proper
// table/thead/th/td styling that the previous setup was missing.
const MARKDOWN_COMPONENTS: Components = {
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
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-slate-50">{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr className="hover:bg-slate-50/60 transition-colors">{children}</tr>,
  th: ({ children }) => (
    <th className="px-3 py-2 text-left font-semibold text-slate-700 border-b border-slate-200">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 border-b border-slate-100 align-top">{children}</td>
  ),
};

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  // Determine which agent avatar to show
  const displayAgent = message.responding_agent || message.agent_id;
  const agent = displayAgent ? AGENTS[displayAgent] : null;

  const sendMessage = useHiveStore((s) => s.sendMessage);

  // V4 B2.2 → B2.5: detect the universal "N axes ... Lequel je lance ?"
  // suffix so we can render the axes as clickable buttons. Falls back to
  // null (= normal rendering) when the pattern isn't detected.
  const axes = useMemo(
    () => (isUser ? null : parseAxesPattern(message.content)),
    [isUser, message.content]
  );

  const handleAxeClick = useCallback(
    (idx: number, axe: string) => {
      const text = `Je veux que tu lances l'axe ${idx + 1} : ${axe}`;
      void sendMessage(text);
    },
    [sendMessage]
  );

  // Sanitize message content to prevent XSS attacks
  // V4 B2.5: 'table'/'thead'/'tbody'/'tr'/'th'/'td' added so remark-gfm
  // tables survive sanitization when the LLM emits raw HTML tables.
  const sanitizeOptions = {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'code', 'pre', 'ul', 'ol', 'li', 'a',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
    ],
    ALLOWED_ATTR: ['href', 'title', 'class'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  };

  const sanitizedContent = DOMPurify.sanitize(message.content, sanitizeOptions);
  const sanitizedBeforeAxes = axes
    ? DOMPurify.sanitize(axes.beforeAxes, sanitizeOptions)
    : '';

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
            {axes ? (
              <>
                {sanitizedBeforeAxes && (
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
                    {sanitizedBeforeAxes}
                  </ReactMarkdown>
                )}
                <div className="not-prose mt-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                    {axes.intro}
                  </div>
                  <div className="flex flex-col gap-2">
                    {axes.axes.map((axe, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAxeClick(idx, axe)}
                        aria-label={`Lancer l'axe ${idx + 1} : ${axe}`}
                        className="group text-left px-4 py-3 rounded-xl border bg-white hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 transition-colors"
                        style={{
                          borderColor: agent?.color.light ?? '#e2e8f0',
                          ['--tw-ring-color' as string]: agent?.color.primary ?? '#6366f1',
                        } as React.CSSProperties}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{
                              backgroundColor: agent?.color.light ?? '#eef2ff',
                              color: agent?.color.primary ?? '#4f46e5',
                            }}
                          >
                            {idx + 1}
                          </span>
                          <span className="flex-1 text-sm text-slate-800 leading-snug">{axe}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  {axes.outro && (
                    <div className="mt-2 text-xs italic text-slate-400">{axes.outro}</div>
                  )}
                </div>
              </>
            ) : (
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
                {sanitizedContent}
              </ReactMarkdown>
            )}
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
