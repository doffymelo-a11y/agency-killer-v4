// ============================================
// THE HIVE OS V5 - No Projects Empty State
// Displayed when user has no projects yet
// ============================================

import { useNavigate } from 'react-router-dom';
import { FolderOpen, Rocket } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NoProjectsYet() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
    >
      <div className="mb-6 relative">
        <div className="w-24 h-24 rounded-full bg-purple-100 flex items-center justify-center">
          <FolderOpen className="w-12 h-12 text-purple-600" />
        </div>
        <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg animate-bounce">
          <Rocket className="w-5 h-5 text-yellow-900" />
        </div>
      </div>

      <h3 className="text-2xl font-bold text-gray-900 mb-3">
        Aucun projet pour le moment
      </h3>

      <p className="text-gray-600 mb-2 max-w-md text-lg">
        Créez votre premier projet pour démarrer avec Luna, Sora, Marcus et Milo.
      </p>

      <p className="text-sm text-gray-500 mb-8 max-w-md">
        Nos 4 agents IA vous accompagnent dans le SEO, les publicités, l'analytics et la création de contenu.
      </p>

      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/genesis')}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
        >
          <Rocket className="w-5 h-5" />
          Créer mon premier projet
        </button>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl">
        {[
          { agent: 'Luna', role: 'SEO & Référencement', color: 'blue', icon: '🔍' },
          { agent: 'Sora', role: 'Analytics & Tracking', color: 'green', icon: '📊' },
          { agent: 'Marcus', role: 'Publicité Payante', color: 'purple', icon: '🎯' },
          { agent: 'Milo', role: 'Creative Director', color: 'pink', icon: '🎨' },
        ].map((agent) => (
          <div
            key={agent.agent}
            className="p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
          >
            <div className="text-3xl mb-2">{agent.icon}</div>
            <h4 className="font-semibold text-gray-900 mb-1">{agent.agent}</h4>
            <p className="text-xs text-gray-600">{agent.role}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
