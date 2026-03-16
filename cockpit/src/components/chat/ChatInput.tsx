// ============================================
// THE HIVE OS V4 - Chat Input Component
// ============================================

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Image, X, Loader2 } from 'lucide-react';
import { AGENTS, type AgentRole } from '../../types';

interface ChatInputProps {
  activeAgent: AgentRole;
  isThinking: boolean;
  onSendMessage: (text: string, imageBase64?: string) => void;
}

export default function ChatInput({ activeAgent, isThinking, onSendMessage }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const agent = AGENTS[activeAgent];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && !imagePreview) return;
    if (isThinking) return;

    onSendMessage(message.trim(), imagePreview || undefined);
    setMessage('');
    setImagePreview(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Veuillez selectionner une image');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const clearImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      {/* Image Preview */}
      <AnimatePresence>
        {imagePreview && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mb-3 relative inline-block"
          >
            <img
              src={imagePreview}
              alt="Preview"
              className="h-20 rounded-lg border border-slate-200 shadow-sm"
            />
            <button
              type="button"
              onClick={clearImage}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Container */}
      <div
        className="flex items-end gap-2 bg-white rounded-2xl border shadow-sm p-2 transition-all duration-200"
        style={{
          borderColor: isThinking ? agent.color.primary : '#E2E8F0',
          boxShadow: isThinking ? `0 0 0 2px ${agent.color.glow}` : undefined,
        }}
      >
        {/* Image Upload Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isThinking}
          className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50"
        >
          <Image className="w-5 h-5 text-slate-400" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />

        {/* Text Input */}
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isThinking
              ? `${agent.name} reflechit...`
              : `Ecrivez a ${agent.name}...`
          }
          disabled={isThinking}
          rows={1}
          className="flex-1 resize-none border-0 focus:ring-0 text-sm text-slate-800 placeholder:text-slate-400 bg-transparent py-2.5 px-1 max-h-32 disabled:opacity-50"
          style={{ minHeight: '40px' }}
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={isThinking || (!message.trim() && !imagePreview)}
          className="p-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: message.trim() || imagePreview ? agent.color.primary : '#F1F5F9',
            color: message.trim() || imagePreview ? 'white' : '#94A3B8',
          }}
        >
          {isThinking ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Thinking Indicator */}
      <AnimatePresence>
        {isThinking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute -top-8 left-4 flex items-center gap-2"
          >
            <div className="flex gap-1">
              <span
                className="w-2 h-2 rounded-full animate-bounce"
                style={{ backgroundColor: agent.color.primary, animationDelay: '0ms' }}
              />
              <span
                className="w-2 h-2 rounded-full animate-bounce"
                style={{ backgroundColor: agent.color.primary, animationDelay: '150ms' }}
              />
              <span
                className="w-2 h-2 rounded-full animate-bounce"
                style={{ backgroundColor: agent.color.primary, animationDelay: '300ms' }}
              />
            </div>
            <span className="text-xs text-slate-500">
              {activeAgent === 'luna' && '🎯 Luna prépare votre analyse stratégique...'}
              {activeAgent === 'sora' && '📊 Sora lance l\'analyse et prépare votre session...'}
              {activeAgent === 'marcus' && '💰 Marcus prépare votre stratégie publicitaire...'}
              {activeAgent === 'milo' && '🎨 Milo prépare vos créations...'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}
