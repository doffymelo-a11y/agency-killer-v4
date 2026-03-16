import TopBar from '../components/layout/TopBar';
// ═══════════════════════════════════════════════════════════════
// THE HIVE OS V4 - Integrations Hub
// Gestion des connexions OAuth (Meta, GA4, GSC, CMS, GBP)
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Plug,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Info,
  ArrowLeft,
  Facebook,
  BarChart3,
  Search,
  MapPin,
  Tag,
  PieChart,
  Linkedin,
  Instagram,
  Twitter,
  Music2,
} from 'lucide-react';
import { useCurrentProject } from '../store/useHiveStore';
import { supabase } from '../lib/supabase';
import { getOAuthUrl } from '../lib/oauth';

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

type IntegrationType =
  | 'meta_ads'
  | 'google_analytics_4'
  | 'google_search_console'
  | 'google_business_profile'
  | 'google_tag_manager'
  | 'looker_studio'
  | 'woocommerce'
  | 'webflow'
  | 'meta_business_suite'
  | 'linkedin_pages'
  | 'twitter_x'
  | 'tiktok_business';

type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'expired';

interface Integration {
  id: string;
  integration_type: IntegrationType;
  integration_name?: string;
  status: IntegrationStatus;
  connected_at?: string;
  last_sync_at?: string;
  expires_at?: string;
  error_message?: string;
}

interface IntegrationConfig {
  type: IntegrationType;
  name: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
  requiredBy: string[]; // Agents qui en ont besoin
  setupGuide: {
    title: string;
    steps: string[];
    docsUrl?: string;
  };
}

// ─────────────────────────────────────────────────────────────────
// Configuration des intégrations
// ─────────────────────────────────────────────────────────────────

const INTEGRATIONS_CONFIG: IntegrationConfig[] = [
  {
    type: 'meta_ads',
    name: 'Meta Ads',
    title: 'Publicités Facebook & Instagram',
    description: 'Connectez votre compte Meta Business pour lancer et gérer vos campagnes publicitaires sur Facebook et Instagram',
    icon: Facebook,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    requiredBy: ['Marcus'],
    setupGuide: {
      title: 'Connecter Meta Ads',
      steps: [
        'Accédez à Facebook for Developers et créez ou sélectionnez votre app',
        'Allez dans les paramètres Facebook Login',
        'Ajoutez l\'URI de redirection OAuth de cette application',
        'Cliquez sur Connecter ci-dessous pour autoriser l\'accès',
        'Accordez les permissions nécessaires lorsque demandé',
      ],
      docsUrl: 'https://developers.facebook.com/docs/marketing-apis',
    },
  },
  {
    type: 'google_analytics_4',
    name: 'Google Analytics 4',
    title: 'Analytics & Insights Web',
    description: 'Accédez à vos données GA4 pour analyser le trafic, le comportement utilisateur, les conversions et les performances avec Sora',
    icon: BarChart3,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    requiredBy: ['Sora'],
    setupGuide: {
      title: 'Connecter Google Analytics 4',
      steps: [
        'Accédez à votre compte Google Analytics 4',
        'Repérez votre Property ID et Measurement ID',
        'Activez l\'API Analytics Data dans Google Cloud Console',
        'Cliquez sur Connecter ci-dessous pour autoriser l\'accès',
        'Sélectionnez la propriété GA4 que vous souhaitez connecter',
      ],
      docsUrl: 'https://developers.google.com/analytics/devguides/reporting/data/v1',
    },
  },
  {
    type: 'google_search_console',
    name: 'Google Search Console',
    title: 'Suivi des Performances SEO',
    description: 'Surveillez vos performances de recherche organique, suivez vos positions de mots-clés et optimisez votre présence SEO',
    icon: Search,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    requiredBy: ['Sora'],
    setupGuide: {
      title: 'Connecter Google Search Console',
      steps: [
        'Assurez-vous que votre site est vérifié dans Google Search Console',
        'Activez l\'API Search Console dans Google Cloud Console',
        'Cliquez sur Connecter ci-dessous pour autoriser l\'accès',
        'Sélectionnez la propriété de site que vous souhaitez connecter',
        'Accordez les permissions de lecture lorsque demandé',
      ],
      docsUrl: 'https://developers.google.com/webmaster-tools',
    },
  },
  {
    type: 'google_business_profile',
    name: 'Google Business Profile',
    title: 'Gestion de Présence Locale',
    description: 'Gérez votre présence locale, répondez aux avis, publiez des actualités et suivez l\'engagement client avec Marcus',
    icon: MapPin,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
    requiredBy: ['Marcus'],
    setupGuide: {
      title: 'Connecter Google Business Profile',
      steps: [
        'Vérifiez votre établissement sur Google Business Profile',
        'Activez l\'API Business Profile dans Google Cloud Console',
        'Cliquez sur Connecter ci-dessous pour autoriser l\'accès',
        'Sélectionnez l\'emplacement que vous souhaitez connecter',
        'Accordez les permissions de gestion lorsque demandé',
      ],
      docsUrl: 'https://developers.google.com/my-business',
    },
  },
  {
    type: 'google_tag_manager',
    name: 'Google Tag Manager',
    title: 'Gestion des Tags & Événements',
    description: 'Connectez GTM pour gérer vos tags, suivre les événements custom et configurer le tracking avancé avec Sora',
    icon: Tag,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10',
    requiredBy: ['Sora'],
    setupGuide: {
      title: 'Connecter Google Tag Manager',
      steps: [
        'Accédez à votre compte Google Tag Manager',
        'Repérez votre Container ID (GTM-XXXXXX)',
        'Activez l\'API Tag Manager dans Google Cloud Console',
        'Cliquez sur Connecter ci-dessous pour autoriser l\'accès',
        'Sélectionnez le container que vous souhaitez connecter',
      ],
      docsUrl: 'https://developers.google.com/tag-platform/tag-manager/api/v2',
    },
  },
  {
    type: 'looker_studio',
    name: 'Looker Studio',
    title: 'Dashboards & Rapports',
    description: 'Connectez Looker Studio pour accéder à vos dashboards, créer des rapports automatisés et visualiser vos données avec Sora',
    icon: PieChart,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    requiredBy: ['Sora'],
    setupGuide: {
      title: 'Connecter Looker Studio',
      steps: [
        'Accédez à votre compte Looker Studio (anciennement Data Studio)',
        'Repérez l\'ID de votre rapport ou dashboard',
        'Activez l\'API Looker Studio dans Google Cloud Console',
        'Cliquez sur Connecter ci-dessous pour autoriser l\'accès',
        'Accordez les permissions de lecture lorsque demandé',
      ],
      docsUrl: 'https://developers.google.com/looker-studio',
    },
  },
  {
    type: 'meta_business_suite',
    name: 'Meta Business Suite',
    title: 'Instagram & Facebook Organique',
    description: 'Connectez vos comptes Instagram Business et Pages Facebook pour publier, programmer et analyser vos contenus organiques avec Doffy',
    icon: Instagram,
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
    requiredBy: ['Doffy'],
    setupGuide: {
      title: 'Connecter Meta Business Suite',
      steps: [
        'Vérifiez que votre compte Instagram est un compte Business (professionnel)',
        'Liez votre Instagram Business à une Page Facebook dans Meta Business Suite',
        'Assurez-vous d\'avoir les droits admin sur la Page Facebook',
        'Cliquez sur Connecter ci-dessous pour autoriser l\'accès',
        'Sélectionnez les Pages et comptes Instagram que vous souhaitez connecter',
        'Accordez les permissions de publication et lecture lorsque demandé',
      ],
      docsUrl: 'https://developers.facebook.com/docs/instagram-api',
    },
  },
  {
    type: 'linkedin_pages',
    name: 'LinkedIn Pages',
    title: 'LinkedIn Company Pages',
    description: 'Connectez vos Pages LinkedIn d\'entreprise pour publier des contenus professionnels, gérer votre présence B2B et analyser l\'engagement avec Doffy',
    icon: Linkedin,
    color: 'text-blue-600',
    bgColor: 'bg-blue-600/10',
    requiredBy: ['Doffy'],
    setupGuide: {
      title: 'Connecter LinkedIn Pages',
      steps: [
        'Créez ou accédez à votre Page Entreprise LinkedIn',
        'Vérifiez que vous êtes Admin de la Page',
        'Accédez au LinkedIn Developers Portal et créez une Application',
        'Ajoutez l\'URI de redirection OAuth de cette application',
        'Demandez les permissions "Share on LinkedIn" et "Sign In with LinkedIn"',
        'Cliquez sur Connecter ci-dessous pour autoriser l\'accès',
      ],
      docsUrl: 'https://learn.microsoft.com/en-us/linkedin/marketing/community-management',
    },
  },
  {
    type: 'twitter_x',
    name: 'Twitter (X)',
    title: 'Twitter / X API',
    description: 'Connectez votre compte Twitter/X pour publier des tweets, gérer les threads, analyser l\'engagement et suivre vos performances avec Doffy',
    icon: Twitter,
    color: 'text-slate-900',
    bgColor: 'bg-slate-900/10',
    requiredBy: ['Doffy'],
    setupGuide: {
      title: 'Connecter Twitter/X',
      steps: [
        'Accédez au Twitter Developer Portal (developer.twitter.com)',
        'Créez un nouveau projet et une application',
        'Configurez les OAuth 2.0 settings avec PKCE',
        'Ajoutez l\'URI de redirection OAuth de cette application',
        'Activez les scopes : tweet.read, tweet.write, users.read, offline.access',
        'Cliquez sur Connecter ci-dessous pour autoriser l\'accès',
      ],
      docsUrl: 'https://developer.twitter.com/en/docs/twitter-api',
    },
  },
  {
    type: 'tiktok_business',
    name: 'TikTok for Business',
    title: 'TikTok Business Account',
    description: 'Connectez votre compte TikTok Business pour publier des vidéos courtes, exploiter les tendances et analyser vos performances virales avec Doffy',
    icon: Music2,
    color: 'text-slate-900',
    bgColor: 'bg-gradient-to-br from-cyan-500/10 to-pink-500/10',
    requiredBy: ['Doffy'],
    setupGuide: {
      title: 'Connecter TikTok for Business',
      steps: [
        'Convertissez votre compte TikTok en compte Business (Paramètres > Gérer le compte)',
        'Accédez à TikTok for Developers (developers.tiktok.com)',
        'Créez une nouvelle application et configurez OAuth 2.0',
        'Ajoutez l\'URI de redirection OAuth de cette application',
        'Demandez les scopes : user.info.basic, video.list, video.publish',
        'Cliquez sur Connecter ci-dessous pour autoriser l\'accès',
      ],
      docsUrl: 'https://developers.tiktok.com/doc/overview',
    },
  },
];

// ─────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────

export default function IntegrationsView() {
  const currentProject = useCurrentProject();
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationConfig | null>(null);
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  // ─────────────────────────────────────────────────────────────────
  // Charger les intégrations depuis Supabase
  // ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!currentProject) return;
    loadIntegrations();
  }, [currentProject]);

  const loadIntegrations = async () => {
    if (!currentProject) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('project_id', currentProject.id);

      if (error) throw error;
      setIntegrations(data || []);
    } catch (error) {
      console.error('Erreur chargement intégrations:', error);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // Obtenir le statut d'une intégration
  // ─────────────────────────────────────────────────────────────────

  const getIntegrationStatus = (type: IntegrationType): Integration | null => {
    return integrations.find((i) => i.integration_type === type) || null;
  };

  // ─────────────────────────────────────────────────────────────────
  // Connecter une intégration via OAuth
  // ─────────────────────────────────────────────────────────────────

  const handleConnect = async (type: IntegrationType) => {
    if (!currentProject) return;

    const state = Math.random().toString(36).substring(7);
    sessionStorage.setItem('oauth_state', state);
    sessionStorage.setItem('oauth_project_id', currentProject.id);

    // OAuth flow pour Meta
    if (type === 'meta_ads') {
      const oauthUrl = getOAuthUrl('meta', state);
      window.location.href = oauthUrl;
      return;
    }

    // OAuth flow pour Meta Business Suite (Instagram + Facebook organic)
    if (type === 'meta_business_suite') {
      const oauthUrl = getOAuthUrl('meta_business', state);
      window.location.href = oauthUrl;
      return;
    }

    // OAuth flow pour Google
    if (['google_analytics_4', 'google_search_console', 'google_business_profile', 'google_tag_manager', 'looker_studio'].includes(type)) {
      const oauthUrl = getOAuthUrl('google', state);
      window.location.href = oauthUrl;
      return;
    }

    // OAuth flow pour LinkedIn
    if (type === 'linkedin_pages') {
      const oauthUrl = getOAuthUrl('linkedin', state);
      window.location.href = oauthUrl;
      return;
    }

    // OAuth flow pour Twitter/X
    if (type === 'twitter_x') {
      const oauthUrl = getOAuthUrl('twitter', state);
      window.location.href = oauthUrl;
      return;
    }

    // OAuth flow pour TikTok
    if (type === 'tiktok_business') {
      const oauthUrl = getOAuthUrl('tiktok', state);
      window.location.href = oauthUrl;
      return;
    }

    // Pour les autres intégrations, afficher le guide de configuration manuel
    const config = INTEGRATIONS_CONFIG.find((c) => c.type === type);
    if (config) {
      setSelectedIntegration(config);
      setShowSetupGuide(true);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // Déconnecter une intégration
  // ─────────────────────────────────────────────────────────────────

  const handleDisconnect = async (integrationId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir déconnecter cette intégration ?')) return;

    try {
      const { error } = await supabase
        .from('user_integrations')
        .delete()
        .eq('id', integrationId);

      if (error) throw error;
      loadIntegrations();
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-white/60">Sélectionnez un projet pour voir ses intégrations</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/board/${currentProject?.id}`)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="Back to board"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                <Plug className="w-6 h-6 text-cyan-600" />
                Intégrations
              </h1>
              <p className="text-slate-500 text-sm mt-0.5">
                Connectez vos comptes pour permettre aux agents IA d'accéder à vos données
              </p>
            </div>
          </div>
          <button
            onClick={loadIntegrations}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 flex items-center gap-2 transition-colors text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">

        {/* Statistiques rapides */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            label="Intégrations actives"
            value={integrations.filter((i) => i.status === 'connected').length}
            total={INTEGRATIONS_CONFIG.length}
            icon={CheckCircle2}
            color="text-green-600"
          />
          <StatCard
            label="En attente"
            value={
              INTEGRATIONS_CONFIG.length -
              integrations.filter((i) => i.status === 'connected').length
            }
            total={INTEGRATIONS_CONFIG.length}
            icon={AlertTriangle}
            color="text-amber-600"
          />
          <StatCard
            label="Agents prêts"
            value={calculateReadyAgents(integrations)}
            total={5}
            icon={CheckCircle2}
            color="text-cyan-600"
          />
        </div>

        {/* Grille des intégrations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {INTEGRATIONS_CONFIG.map((config) => {
            const integration = getIntegrationStatus(config.type);
            const isConnected = integration?.status === 'connected';

            return (
              <IntegrationCard
                key={config.type}
                config={config}
                integration={integration}
                isConnected={isConnected}
                onConnect={() => handleConnect(config.type)}
                onDisconnect={() => integration && handleDisconnect(integration.id)}
                onShowGuide={() => {
                  setSelectedIntegration(config);
                  setShowSetupGuide(true);
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Modal Guide de configuration */}
      {showSetupGuide && selectedIntegration && (
        <SetupGuideModal
          config={selectedIntegration}
          onClose={() => {
            setShowSetupGuide(false);
            setSelectedIntegration(null);
          }}
          projectId={currentProject.id}
          onSuccess={() => {
            loadIntegrations();
            setShowSetupGuide(false);
            setSelectedIntegration(null);
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Sous-composants
// ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  total,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  total: number;
  icon: any;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-500 text-sm font-medium">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {value} <span className="text-lg text-slate-400">/ {total}</span>
          </p>
        </div>
        <div className={`p-3 rounded-lg bg-slate-50`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </motion.div>
  );
}

function IntegrationCard({
  config,
  integration,
  isConnected,
  onConnect,
  onDisconnect,
  onShowGuide,
}: {
  config: IntegrationConfig;
  integration: Integration | null;
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onShowGuide: () => void;
}) {
  const statusConfig = {
    connected: {
      icon: CheckCircle2,
      color: 'text-green-600',
      bg: 'bg-green-50',
      label: 'Connecté',
    },
    disconnected: {
      icon: XCircle,
      color: 'text-slate-400',
      bg: 'bg-slate-50',
      label: 'Non connecté',
    },
    error: {
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      label: 'Erreur',
    },
    expired: {
      icon: AlertTriangle,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      label: 'Expiré',
    },
  };

  const status = integration?.status || 'disconnected';
  const StatusIcon = statusConfig[status].icon;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-xl p-6 border border-slate-200 hover:border-slate-300 shadow-sm transition-all"
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className={`p-3 rounded-xl ${config.bgColor}`}>
          <Icon className={`w-6 h-6 ${config.color}`} />
        </div>
        <div className="flex-1">
          <h3 className="text-slate-900 font-semibold text-lg">{config.name}</h3>
          <p className="text-slate-500 text-xs mt-0.5">{config.title}</p>
        </div>
      </div>

      {/* Status Badge */}
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${statusConfig[status].bg} mb-4`}>
        <StatusIcon className={`w-3.5 h-3.5 ${statusConfig[status].color}`} />
        <span className={`text-xs font-medium ${statusConfig[status].color}`}>
          {statusConfig[status].label}
        </span>
      </div>

      {/* Description */}
      <p className="text-slate-600 text-sm mb-4 leading-relaxed">{config.description}</p>

      {/* Agents */}
      <div className="flex items-center gap-2 mb-5">
        <span className="text-xs text-slate-500 font-medium">Requis par :</span>
        {config.requiredBy.map((agent) => (
          <span
            key={agent}
            className="text-xs px-2.5 py-1 bg-slate-100 rounded-md text-slate-700 font-medium"
          >
            {agent}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {isConnected ? (
          <>
            <button
              onClick={onDisconnect}
              className="flex-1 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors"
            >
              Déconnecter
            </button>
            <button
              onClick={onShowGuide}
              className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
              title="View guide"
            >
              <Info className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onConnect}
              className="flex-1 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Plug className="w-4 h-4" />
              Connecter
            </button>
            <button
              onClick={onShowGuide}
              className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
              title="View guide"
            >
              <Info className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Infos connexion */}
      {isConnected && integration && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="text-xs text-slate-500 space-y-1">
            {integration.connected_at && (
              <p>Connecté le : {new Date(integration.connected_at).toLocaleDateString('fr-FR')}</p>
            )}
            {integration.last_sync_at && (
              <p>Dernière synchro : {new Date(integration.last_sync_at).toLocaleTimeString('fr-FR')}</p>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function SetupGuideModal({
  config,
  onClose,
  projectId,
  onSuccess,
}: {
  config: IntegrationConfig;
  onClose: () => void;
  projectId: string;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Non authentifié');

      const { error } = await supabase.from('user_integrations').upsert({
        project_id: projectId,
        user_id: userData.user.id,
        integration_type: config.type,
        status: 'connected',
        credentials: formData,
        connected_at: new Date().toISOString(),
      });

      if (error) throw error;
      onSuccess();
    } catch (error) {
      console.error('Erreur connexion:', error);
      alert('Erreur lors de la connexion. Vérifiez vos credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">{config.setupGuide.title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Steps */}
        <div className="space-y-4 mb-6">
          {config.setupGuide.steps.map((step, index) => (
            <div key={index} className="flex gap-4">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center text-sm font-bold">
                {index + 1}
              </div>
              <p className="text-slate-700 text-sm leading-relaxed pt-0.5">{step}</p>
            </div>
          ))}
        </div>

        {/* Docs link */}
        {config.setupGuide.docsUrl && (
          <a
            href={config.setupGuide.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-cyan-600 hover:text-cyan-700 text-sm mb-6 font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            Official Documentation
          </a>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-700 text-sm font-semibold mb-2">
              Configuration (JSON)
            </label>
            <textarea
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all font-mono text-sm"
              rows={6}
              placeholder={'{\n  "access_token": "...",\n  "account_id": "..."\n}'}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  setFormData(parsed);
                } catch (err) {
                  // Ignore parsing errors while typing
                }
              }}
            />
            <p className="text-xs text-slate-500 mt-2">
              Paste your credentials in JSON format
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || Object.keys(formData).length === 0}
              className="flex-1 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {loading ? 'Connexion...' : 'Connecter'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function calculateReadyAgents(integrations: Integration[]): number {
  const connectedTypes = integrations
    .filter((i) => i.status === 'connected')
    .map((i) => i.integration_type);

  let readyCount = 0;

  // Sora: needs GA4 OR GSC OR GTM OR Looker Studio
  if (
    connectedTypes.includes('google_analytics_4') ||
    connectedTypes.includes('google_search_console') ||
    connectedTypes.includes('google_tag_manager') ||
    connectedTypes.includes('looker_studio')
  ) {
    readyCount++;
  }

  // Marcus: needs Meta Ads OR GBP
  if (
    connectedTypes.includes('meta_ads') ||
    connectedTypes.includes('google_business_profile')
  ) {
    readyCount++;
  }

  // Milo: needs CMS
  if (
    connectedTypes.some((t) =>
      ['woocommerce', 'webflow'].includes(t)
    )
  ) {
    readyCount++;
  }

  // Doffy: needs at least one social media platform
  if (
    connectedTypes.includes('meta_business_suite') ||
    connectedTypes.includes('linkedin_pages') ||
    connectedTypes.includes('twitter_x') ||
    connectedTypes.includes('tiktok_business')
  ) {
    readyCount++;
  }

  // Luna: always ready (no integrations needed)
  readyCount++;

  return readyCount;
}
