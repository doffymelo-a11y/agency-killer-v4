// ============================================
// THE HIVE OS V5 - No Analytics Empty State
// Displayed when analytics are not connected
// ============================================

import { BarChart3, Link, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function NoAnalyticsYet() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
    >
      <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6">
        <BarChart3 className="w-12 h-12 text-green-600" />
      </div>

      <h3 className="text-2xl font-bold text-gray-900 mb-3">
        Aucune donnée analytics disponible
      </h3>

      <p className="text-gray-600 mb-2 max-w-md text-lg">
        Connectez vos plateformes pour voir vos métriques en temps réel.
      </p>

      <p className="text-sm text-gray-500 mb-8 max-w-md">
        Sora analysera vos performances Google Ads, Meta Ads, GA4 et bien plus.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <button
          onClick={() => navigate('/integrations')}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Link className="w-5 h-5" />
          Connecter mes plateformes
        </button>

        <button
          onClick={() => navigate('/chat')}
          className="px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Play className="w-5 h-5" />
          Voir la démo
        </button>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl">
        {[
          {
            title: 'Google Ads',
            description: 'Campagnes, CPC, ROAS, conversions',
            icon: '🎯',
            color: 'blue'
          },
          {
            title: 'Meta Ads',
            description: 'Facebook, Instagram, CTR, reach',
            icon: '📱',
            color: 'purple'
          },
          {
            title: 'Google Analytics 4',
            description: 'Trafic, sessions, conversions',
            icon: '📊',
            color: 'green'
          },
        ].map((platform) => (
          <div
            key={platform.title}
            className={`p-6 bg-white rounded-lg border border-gray-200 hover:border-${platform.color}-300 transition-colors`}
          >
            <div className="text-4xl mb-3">{platform.icon}</div>
            <h4 className="font-semibold text-gray-900 mb-2">{platform.title}</h4>
            <p className="text-sm text-gray-600">{platform.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-blue-50 p-6 rounded-lg max-w-2xl">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold">i</span>
          </div>
          <div className="text-left">
            <h4 className="font-semibold text-blue-900 mb-1">Intégration sécurisée</h4>
            <p className="text-sm text-blue-700">
              Vos données restent privées. Nous utilisons OAuth 2.0 pour une connexion sécurisée.
              Aucune donnée sensible n'est stockée sur nos serveurs.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
