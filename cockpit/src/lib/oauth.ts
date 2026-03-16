// ═══════════════════════════════════════════════════════════════
// THE HIVE OS V4 - OAuth 2.0 Service
// Gestion sécurisée des OAuth flows pour Meta et Google
// ═══════════════════════════════════════════════════════════════

import { supabase } from './supabase';

// ─────────────────────────────────────────────────────────────────
// Configuration OAuth
// ─────────────────────────────────────────────────────────────────

const OAUTH_CONFIG = {
  meta: {
    clientId: import.meta.env.VITE_META_CLIENT_ID || '',
    redirectUri: `${window.location.origin}/oauth/callback/meta`,
    authUrl: 'https://www.facebook.com/v21.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v21.0/oauth/access_token',
    scopes: ['ads_management', 'business_management', 'pages_read_engagement'],
  },
  meta_business: {
    clientId: import.meta.env.VITE_META_CLIENT_ID || '',
    redirectUri: `${window.location.origin}/oauth/callback/meta-business`,
    authUrl: 'https://www.facebook.com/v21.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v21.0/oauth/access_token',
    scopes: [
      'pages_manage_posts',
      'pages_read_engagement',
      'instagram_basic',
      'instagram_content_publish',
      'pages_show_list',
    ],
  },
  google: {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
    redirectUri: `${window.location.origin}/oauth/callback/google`,
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: [
      'https://www.googleapis.com/auth/analytics.readonly',
      'https://www.googleapis.com/auth/webmasters.readonly',
      'https://www.googleapis.com/auth/business.manage',
    ],
  },
  linkedin: {
    clientId: import.meta.env.VITE_LINKEDIN_CLIENT_ID || '',
    redirectUri: `${window.location.origin}/oauth/callback/linkedin`,
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    scopes: ['w_organization_social', 'r_organization_social', 'rw_organization_admin'],
  },
  twitter: {
    clientId: import.meta.env.VITE_TWITTER_CLIENT_ID || '',
    redirectUri: `${window.location.origin}/oauth/callback/twitter`,
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
  },
  tiktok: {
    clientId: import.meta.env.VITE_TIKTOK_CLIENT_ID || '',
    redirectUri: `${window.location.origin}/oauth/callback/tiktok`,
    authUrl: 'https://www.tiktok.com/v2/auth/authorize/',
    tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token/',
    scopes: ['user.info.basic', 'video.list', 'video.publish'],
  },
};

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

export type OAuthProvider = 'meta' | 'meta_business' | 'google' | 'linkedin' | 'twitter' | 'tiktok';

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
  scope?: string;
}

// ─────────────────────────────────────────────────────────────────
// OAuth Flow - Étape 1 : Générer l'URL d'autorisation
// ─────────────────────────────────────────────────────────────────

export function getOAuthUrl(provider: OAuthProvider, state: string): string {
  const config = OAUTH_CONFIG[provider];

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(' '),
    response_type: 'code',
    state, // CSRF protection
    access_type: 'offline', // Pour obtenir un refresh token
    prompt: 'consent', // Forcer l'affichage du consentement
  });

  return `${config.authUrl}?${params.toString()}`;
}

// ─────────────────────────────────────────────────────────────────
// OAuth Flow - Étape 2 : Échanger le code contre un access token
// ─────────────────────────────────────────────────────────────────

export async function exchangeCodeForToken(
  provider: OAuthProvider,
  code: string
): Promise<OAuthTokens> {
  const config = OAUTH_CONFIG[provider];

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: import.meta.env[`VITE_${provider.toUpperCase()}_CLIENT_SECRET`] || '',
      code,
      redirect_uri: config.redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OAuth token exchange failed: ${error.error_description || error.error}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
    scope: data.scope,
  };
}

// ─────────────────────────────────────────────────────────────────
// OAuth Flow - Étape 3 : Refresh un token expiré
// ─────────────────────────────────────────────────────────────────

export async function refreshAccessToken(
  provider: OAuthProvider,
  refreshToken: string
): Promise<OAuthTokens> {
  const config = OAUTH_CONFIG[provider];

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: import.meta.env[`VITE_${provider.toUpperCase()}_CLIENT_SECRET`] || '',
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Token refresh failed: ${error.error_description || error.error}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken, // Certains providers ne renvoient pas de nouveau refresh token
    expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
    scope: data.scope,
  };
}

// ─────────────────────────────────────────────────────────────────
// Sauvegarder les credentials dans Supabase (ENCRYPTED)
// ─────────────────────────────────────────────────────────────────

export async function saveIntegrationCredentials(
  projectId: string,
  integrationType: string,
  credentials: Record<string, any>
): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not authenticated');

  // Encrypt les credentials avant stockage
  const encryptedCreds = await encryptCredentials(credentials);

  const { error } = await supabase.from('user_integrations').upsert({
    project_id: projectId,
    user_id: userData.user.id,
    integration_type: integrationType,
    status: 'connected',
    credentials: encryptedCreds,
    connected_at: new Date().toISOString(),
    expires_at: credentials.expiresAt,
  });

  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────────
// Récupérer les credentials depuis Supabase (DECRYPT)
// ─────────────────────────────────────────────────────────────────

export async function getIntegrationCredentials(
  projectId: string,
  integrationType: string
): Promise<Record<string, any> | null> {
  const { data, error } = await supabase
    .from('user_integrations')
    .select('credentials, expires_at, status')
    .eq('project_id', projectId)
    .eq('integration_type', integrationType)
    .eq('status', 'connected')
    .single();

  if (error || !data) return null;

  // Decrypt les credentials
  const decryptedCreds = await decryptCredentials(data.credentials);

  // Vérifier si le token est expiré
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    // Token expiré → Tenter un refresh
    try {
      let provider: OAuthProvider;
      if (integrationType.includes('meta') || integrationType === 'meta_business_suite') {
        provider = integrationType === 'meta_business_suite' ? 'meta_business' : 'meta';
      } else if (integrationType.includes('google')) {
        provider = 'google';
      } else if (integrationType.includes('linkedin')) {
        provider = 'linkedin';
      } else if (integrationType.includes('twitter')) {
        provider = 'twitter';
      } else if (integrationType.includes('tiktok')) {
        provider = 'tiktok';
      } else {
        provider = 'google'; // default
      }
      const newTokens = await refreshAccessToken(provider, decryptedCreds.refreshToken);

      // Sauvegarder les nouveaux tokens
      await saveIntegrationCredentials(projectId, integrationType, newTokens);

      return newTokens;
    } catch (error) {
      // Échec du refresh → Marquer comme expiré
      await supabase
        .from('user_integrations')
        .update({ status: 'expired' })
        .eq('project_id', projectId)
        .eq('integration_type', integrationType);

      return null;
    }
  }

  return decryptedCreds;
}

// ─────────────────────────────────────────────────────────────────
// Encryption / Decryption (AES-256-GCM)
// ─────────────────────────────────────────────────────────────────

async function encryptCredentials(data: Record<string, any>): Promise<string> {
  const encoder = new TextEncoder();
  const dataString = JSON.stringify(data);

  // Générer une clé de chiffrement (dans un vrai projet, utiliser une clé stockée côté serveur)
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(import.meta.env.VITE_ENCRYPTION_KEY || 'default-encryption-key-change-me!!!'),
    'AES-GCM',
    false,
    ['encrypt']
  );

  // Générer un IV aléatoire
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Chiffrer
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(dataString)
  );

  // Combiner IV + encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);

  // Encoder en base64
  return btoa(String.fromCharCode(...combined));
}

async function decryptCredentials(encryptedData: string): Promise<Record<string, any>> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  // Décoder base64
  const combined = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0));

  // Extraire IV et encrypted data
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);

  // Importer la clé
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(import.meta.env.VITE_ENCRYPTION_KEY || 'default-encryption-key-change-me!!!'),
    'AES-GCM',
    false,
    ['decrypt']
  );

  // Déchiffrer
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);

  // Parser JSON
  return JSON.parse(decoder.decode(decrypted));
}

// ─────────────────────────────────────────────────────────────────
// Helper: Vérifier si une intégration est connectée
// ─────────────────────────────────────────────────────────────────

export async function isIntegrationConnected(
  projectId: string,
  integrationType: string
): Promise<boolean> {
  const { data } = await supabase
    .from('user_integrations')
    .select('status')
    .eq('project_id', projectId)
    .eq('integration_type', integrationType)
    .single();

  return data?.status === 'connected';
}
