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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // SECURITY: Validate file size (5MB max)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      alert('L\'image est trop volumineuse (max 5MB)');
      return;
    }

    // SECURITY: Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Veuillez selectionner une image');
      return;
    }

    // SECURITY: Verify magic numbers (first bytes of file)
    try {
      const arrayBuffer = await file.slice(0, 8).arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      // Check magic numbers for common image formats
      const isPNG = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
      const isJPEG = bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;
      const isGIF = bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46;
      const isWEBP = bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;

      if (!isPNG && !isJPEG && !isGIF && !isWEBP) {
        alert('Format d\'image non supporté. Utilisez PNG, JPEG, GIF ou WEBP.');
        return;
      }
    } catch (error) {
      console.error('Error validating image:', error);
      alert('Erreur lors de la validation de l\'image');
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
