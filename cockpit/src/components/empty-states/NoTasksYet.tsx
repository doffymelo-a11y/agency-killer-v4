// ============================================
// THE HIVE OS V5 - No Tasks Empty State
// Displayed when project has no tasks yet
// ============================================

import { CheckCircle, Zap, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface NoTasksYetProps {
  onCreateQuickAction?: () => void;
  onOpenChat?: () => void;
}

export default function NoTasksYet({ onCreateQuickAction, onOpenChat }: NoTasksYetProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4"
    >
      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-6">
        <CheckCircle className="w-10 h-10 text-gray-400" />
      </div>

      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        Aucune tâche pour ce projet
      </h3>

      <p className="text-gray-600 mb-8 max-w-md">
        Commencez par créer une Quick Action ou discutez avec les agents dans le chat pour générer des tâches.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <button
          onClick={onCreateQuickAction}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Zap className="w-5 h-5" />
          Créer une Quick Action
        </button>

        <button
          onClick={onOpenChat}
          className="px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <MessageCircle className="w-5 h-5" />
          Ouvrir le chat
        </button>
      </div>

      <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        <div className="p-4 bg-blue-50 rounded-lg text-left">
          <div className="font-semibold text-blue-900 mb-2">💡 Quick Action</div>
          <p className="text-sm text-blue-700">
            Lancez une tâche rapide comme "Audit SEO" ou "Créer un ad" sans passer par Genesis.
          </p>
        </div>

        <div className="p-4 bg-purple-50 rounded-lg text-left">
          <div className="font-semibold text-purple-900 mb-2">💬 Chat</div>
          <p className="text-sm text-purple-700">
            Discutez avec Luna, Sora, Marcus ou Milo pour obtenir des recommandations et générer des tâches.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
