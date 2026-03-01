// ═══════════════════════════════════════════════════════════════
// THE HIVE OS V4 - OAuth Callback Handler
// Gestion du retour OAuth après autorisation
// ═══════════════════════════════════════════════════════════════

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { exchangeCodeForToken, saveIntegrationCredentials } from '../../lib/oauth';

export default function OAuthCallback({ provider }: { provider: 'meta' | 'google' }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      const projectId = sessionStorage.getItem('oauth_project_id');
      navigate(`/integrations/${projectId || ''}`, {
        state: { error: 'Autorisation refusée. Veuillez réessayer.' },
      });
      return;
    }

    if (!code || !state) {
      navigate('/');
      return;
    }

    // Vérifier le state (CSRF protection)
    const savedState = sessionStorage.getItem('oauth_state');
    if (state !== savedState) {
      console.error('CSRF attack detected - state mismatch');
      navigate('/', { state: { error: 'Erreur de sécurité détectée' } });
      return;
    }

    // Récupérer le project_id depuis sessionStorage
    const projectId = sessionStorage.getItem('oauth_project_id');
    if (!projectId) {
      navigate('/');
      return;
    }

    // Échanger le code contre un access token
    exchangeCodeForToken(provider, code)
      .then(async (tokens) => {
        // Déterminer le type d'intégration
        let integrationType: string;
        if (provider === 'meta') {
          integrationType = 'meta_ads';
        } else {
          // Google - déterminer si c'est GA4, GSC ou GBP selon les scopes
          const scope = tokens.scope || '';
          if (scope.includes('analytics')) {
            integrationType = 'google_analytics_4';
          } else if (scope.includes('webmasters')) {
            integrationType = 'google_search_console';
          } else if (scope.includes('business')) {
            integrationType = 'google_business_profile';
          } else {
            integrationType = 'google_analytics_4'; // Défaut
          }
        }

        // Sauvegarder les credentials
        await saveIntegrationCredentials(projectId, integrationType, tokens);

        // Cleanup
        sessionStorage.removeItem('oauth_state');
        sessionStorage.removeItem('oauth_project_id');

        // Redirect back to integrations
        navigate(`/integrations/${projectId}`, {
          state: {
            success: `${provider === 'meta' ? 'Meta Ads' : 'Google'} connecté avec succès !`,
          },
        });
      })
      .catch((error) => {
        console.error('Token exchange error:', error);
        navigate(`/integrations/${projectId}`, {
          state: { error: 'Échec de la connexion. Veuillez réessayer.' },
        });
      });
  }, [searchParams, navigate, provider]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mx-auto mb-4 animate-pulse">
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">
          Connexion en cours...
        </h2>
        <p className="text-slate-500">
          {provider === 'meta' ? 'Meta Ads' : 'Google'} en cours de connexion
        </p>
      </div>
    </div>
  );
}
