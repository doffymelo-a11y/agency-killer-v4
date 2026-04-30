// ============================================
// THE HIVE OS V5 - Delete Account (GDPR Right to be Forgotten)
// Allows users to request account deletion
// ============================================

import { useState } from 'react';
import { Trash2, AlertTriangle, Loader } from 'lucide-react';
import { supabase, getCurrentUser } from '../../lib/supabase';

export default function DeleteAccountSection() {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeleteAccount = async () => {
    if (confirmationText !== 'SUPPRIMER') {
      setError('Veuillez taper "SUPPRIMER" pour confirmer');
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const user = await getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      // Call backend API to handle deletion (30-day soft delete)
      const response = await fetch('/api/gdpr/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete account');
      }

      // Sign out user
      await supabase.auth.signOut();

      // Redirect to deletion confirmation page
      window.location.href = '/account-deleted';
    } catch (err: any) {
      console.error('Error deleting account:', err);
      setError(err.message || 'Une erreur est survenue. Veuillez réessayer.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <Trash2 className="w-6 h-6 text-red-600" />
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            Supprimer mon compte
          </h3>

          {!showConfirmation ? (
            <>
              <p className="text-sm text-red-700 mb-4 leading-relaxed">
                <strong>Attention :</strong> La suppression de votre compte est <strong>irréversible</strong>.
                Toutes vos données seront supprimées après 30 jours, conformément au RGPD (droit à l'oubli).
              </p>

              <div className="bg-white rounded-lg p-4 mb-4 space-y-2">
                <p className="text-sm text-gray-900 font-medium">Seront supprimés :</p>
                <ul className="text-sm text-gray-700 space-y-1 ml-4 list-disc">
                  <li>Votre compte utilisateur</li>
                  <li>Tous vos projets et tâches</li>
                  <li>Votre historique de chat avec les agents IA</li>
                  <li>Vos intégrations connectées (Google Ads, Meta Ads, etc.)</li>
                  <li>Vos données de facturation</li>
                  <li>Vos fichiers uploadés (logos, images, documents)</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">Période de rétention de 30 jours</p>
                    <p>
                      Votre compte sera désactivé immédiatement, mais conservé 30 jours avant suppression définitive.
                      Vous pourrez annuler la suppression pendant ces 30 jours en nous contactant.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowConfirmation(true)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Continuer la suppression
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-red-700 mb-4">
                Pour confirmer la suppression, tapez <strong>SUPPRIMER</strong> ci-dessous :
              </p>

              <input
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="SUPPRIMER"
                className="w-full px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent mb-3"
                disabled={isDeleting}
              />

              {error && (
                <div className="bg-red-100 border border-red-300 text-red-800 text-sm rounded-lg p-3 mb-3">
                  {error}
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || confirmationText !== 'SUPPRIMER'}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Suppression en cours...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Confirmer la suppression
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setShowConfirmation(false);
                    setConfirmationText('');
                    setError(null);
                  }}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Annuler
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
