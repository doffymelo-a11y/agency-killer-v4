// ============================================
// THE HIVE OS V5 - Account Deleted Confirmation
// Displays confirmation after account deletion request
// ============================================

import { CheckCircle } from 'lucide-react';

export default function AccountDeletedView() {
  // Redirect to homepage or login
  const handleBackToHome = () => {
    window.location.href = '/login'; // Change to https://thehive.com when landing page exists
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-2xl mx-4">
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" strokeWidth={2} />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold mb-6 text-slate-900">
            Votre compte a été supprimé
          </h1>

          {/* Message */}
          <div className="text-slate-600 mb-8 space-y-4">
            <p className="text-lg leading-relaxed">
              Votre demande de suppression a bien été enregistrée.
            </p>
            <p className="text-lg leading-relaxed">
              Vos données seront effacées définitivement dans <strong className="text-slate-900">30 jours</strong>.
            </p>
            <p className="text-lg leading-relaxed">
              Si vous changez d'avis, vous pouvez annuler en vous reconnectant pendant ce délai.
            </p>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleBackToHome}
            className="px-8 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold transition-all shadow-md hover:shadow-lg"
          >
            Retour à l'accueil
          </button>

          {/* Footer Note */}
          <p className="mt-8 text-sm text-slate-400">
            Cette action a été enregistrée conformément au RGPD (Article 17).
          </p>
        </div>
      </div>
    </div>
  );
}
