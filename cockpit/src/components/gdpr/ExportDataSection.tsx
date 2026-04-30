// ============================================
// THE HIVE OS V5 - Export Data (GDPR Right to Data Portability)
// Allows users to export all their data in JSON format
// ============================================

import { useState } from 'react';
import { Download, Loader, CheckCircle } from 'lucide-react';
import { getCurrentUser } from '../../lib/supabase';

export default function ExportDataSection() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExportData = async () => {
    setIsExporting(true);
    setError(null);
    setExportSuccess(false);

    try {
      const user = await getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      // Call backend API to generate export
      const response = await fetch('/api/gdpr/export-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      // Download JSON file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hive-os-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setExportSuccess(true);

      // Reset success message after 5 seconds
      setTimeout(() => setExportSuccess(false), 5000);
    } catch (err: any) {
      console.error('Error exporting data:', err);
      setError(err.message || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <Download className="w-6 h-6 text-blue-600" />
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Exporter mes données (RGPD)
          </h3>

          <p className="text-sm text-blue-700 mb-4 leading-relaxed">
            Téléchargez toutes vos données dans un fichier JSON portable, conforme à l'Article 20 du RGPD (droit à la portabilité des données).
          </p>

          <div className="bg-white rounded-lg p-4 mb-4 space-y-2">
            <p className="text-sm text-gray-900 font-medium">L'export inclut :</p>
            <ul className="text-sm text-gray-700 space-y-1 ml-4 list-disc">
              <li>Vos informations de compte (email, date de création)</li>
              <li>Tous vos projets et leurs configurations</li>
              <li>Toutes vos tâches et leur historique</li>
              <li>Votre historique de chat avec les agents IA</li>
              <li>Vos intégrations connectées</li>
              <li>Votre historique de facturation</li>
              <li>Vos préférences et paramètres</li>
            </ul>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-300 text-red-800 text-sm rounded-lg p-3 mb-4">
              {error}
            </div>
          )}

          {exportSuccess && (
            <div className="bg-green-100 border border-green-300 text-green-800 text-sm rounded-lg p-3 mb-4 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Export réussi ! Le fichier a été téléchargé.
            </div>
          )}

          <button
            onClick={handleExportData}
            disabled={isExporting}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Export en cours...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Télécharger mes données
              </>
            )}
          </button>

          <p className="text-xs text-blue-600 mt-3">
            Format : JSON • Taille : variable (selon vos données) • Encodage : UTF-8
          </p>
        </div>
      </div>
    </div>
  );
}
