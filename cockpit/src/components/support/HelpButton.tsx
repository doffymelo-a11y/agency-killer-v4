/**
 * Help Button Component
 * Floating help button with guide modal for support system
 */

import { useState } from 'react';
import { HelpCircle, X, User, Shield, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HelpSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: {
    title: string;
    description: string;
  }[];
}

const USER_HELP: HelpSection[] = [
  {
    id: 'create',
    title: 'Créer un Ticket',
    icon: <User className="w-5 h-5" />,
    content: [
      {
        title: '1. Cliquez sur "+ Nouveau ticket"',
        description: 'Dans la page Support',
      },
      {
        title: '2. Choisissez un modèle (optionnel)',
        description: 'Des modèles pré-remplis sont disponibles pour vous guider',
      },
      {
        title: '3. Remplissez les informations',
        description: 'Catégorie, sujet, description détaillée',
      },
      {
        title: '4. Ajoutez un screenshot si nécessaire',
        description: 'Glissez-déposez une capture d\'écran',
      },
    ],
  },
  {
    id: 'track',
    title: 'Suivre vos Tickets',
    icon: <Search className="w-5 h-5" />,
    content: [
      {
        title: 'Vue Liste',
        description: 'Tous vos tickets avec numéro, statut, catégorie, priorité',
      },
      {
        title: 'Filtres',
        description: 'Filtrez par statut : Tous, Ouverts, En cours, Résolus',
      },
      {
        title: 'Notifications Email',
        description: 'Recevez un email quand un admin répond ou change le statut',
      },
    ],
  },
  {
    id: 'files',
    title: 'Ajouter des Fichiers',
    icon: <HelpCircle className="w-5 h-5" />,
    content: [
      {
        title: 'Types acceptés',
        description: 'Images (PNG, JPG), Documents (PDF, DOC), Logs (TXT, JSON)',
      },
      {
        title: 'Limites',
        description: 'Max 5 fichiers par message, 10MB par fichier',
      },
      {
        title: 'Comment',
        description: 'Cliquez sur "📎 Joindre des fichiers" dans la conversation',
      },
    ],
  },
];

const ADMIN_HELP: HelpSection[] = [
  {
    id: 'respond',
    title: 'Répondre aux Tickets',
    icon: <Shield className="w-5 h-5" />,
    content: [
      {
        title: 'Utiliser les templates',
        description: 'Sélectionnez un modèle de réponse pour gagner du temps',
      },
      {
        title: 'Changer le statut',
        description: 'Ouvert → En cours → Résolu → Fermé',
      },
      {
        title: 'Ajuster la priorité',
        description: 'Critique (4h) → Haute (24h) → Moyenne (48h) → Basse (72h)',
      },
    ],
  },
  {
    id: 'notes',
    title: 'Notes Internes',
    icon: <Shield className="w-5 h-5" />,
    content: [
      {
        title: 'Visibles uniquement par les admins',
        description: 'Le user ne voit jamais ces notes',
      },
      {
        title: 'Partager des informations',
        description: 'Contexte technique, investigation, instructions',
      },
      {
        title: 'Section dédiée',
        description: 'En bas de chaque ticket (zone rouge)',
      },
    ],
  },
  {
    id: 'duplicates',
    title: 'Détection de Doublons',
    icon: <Shield className="w-5 h-5" />,
    content: [
      {
        title: 'Détection automatique par IA',
        description: 'Utilise OpenAI embeddings pour trouver les tickets similaires',
      },
      {
        title: 'Score de similarité',
        description: 'Affiche le % de ressemblance avec d\'autres tickets',
      },
      {
        title: 'Marquer comme doublon',
        description: 'Ferme automatiquement et redirige vers le ticket original',
      },
    ],
  },
];

export default function HelpButton() {
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'user' | 'admin'>('user');

  const sections = activeTab === 'user' ? USER_HELP : ADMIN_HELP;

  return (
    <>
      {/* Floating Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center z-40 transition-shadow"
        title="Guide d'utilisation"
      >
        <HelpCircle className="w-6 h-6" />
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-4xl md:max-h-[80vh] bg-white rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-cyan-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                      <HelpCircle className="w-6 h-6 text-blue-600" />
                      Guide d'Utilisation
                    </h2>
                    <p className="text-sm text-slate-600 mt-1">
                      Système de Support Tickets - Version 4.4
                    </p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 rounded-lg hover:bg-white/50 text-slate-600 hover:text-slate-900 transition"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setActiveTab('user')}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      activeTab === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <User className="w-4 h-4 inline mr-2" />
                    Pour les Utilisateurs
                  </button>
                  <button
                    onClick={() => setActiveTab('admin')}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      activeTab === 'admin'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Shield className="w-4 h-4 inline mr-2" />
                    Pour les Admins
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {sections.map((section) => (
                  <div key={section.id} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                        {section.icon}
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {section.title}
                      </h3>
                    </div>

                    <div className="pl-12 space-y-3">
                      {section.content.map((item, idx) => (
                        <div key={idx} className="space-y-1">
                          <h4 className="font-medium text-slate-900 text-sm">
                            {item.title}
                          </h4>
                          <p className="text-sm text-slate-600">
                            {item.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* SLA Info (Admin Only) */}
                {activeTab === 'admin' && (
                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                      ⚡ Temps de Réponse SLA
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-medium text-red-700">🔴 Critique:</span>
                        <span className="text-slate-700 ml-2">4h</span>
                      </div>
                      <div>
                        <span className="font-medium text-orange-700">🟠 Haute:</span>
                        <span className="text-slate-700 ml-2">24h</span>
                      </div>
                      <div>
                        <span className="font-medium text-yellow-700">🟡 Moyenne:</span>
                        <span className="text-slate-700 ml-2">48h</span>
                      </div>
                      <div>
                        <span className="font-medium text-green-700">🟢 Basse:</span>
                        <span className="text-slate-700 ml-2">72h</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Link to Full Guide */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                  <p className="text-sm text-blue-900 mb-2">
                    Pour plus de détails, consultez le guide complet :
                  </p>
                  <code className="text-xs text-blue-700 bg-blue-100 px-3 py-1 rounded">
                    /Guides d'utilisation/Guide-Support-Tickets.md
                  </code>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 text-center">
                <p className="text-xs text-slate-600">
                  Besoin d'aide ? Créez un ticket avec la catégorie{' '}
                  <span className="font-medium">❓ Question</span>
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
