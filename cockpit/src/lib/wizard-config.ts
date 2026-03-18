// ═══════════════════════════════════════════════════════════════
// THE HIVE OS V4 - Genesis Wizard Configuration
// Complete questionnaires and task generation for all scopes
// ═══════════════════════════════════════════════════════════════

import type {
  ProjectScope,
  WizardQuestion,
  WizardAnswer,
  TaskPhase,
  AgentRole,
  Task,
  ProjectMetadata,
} from '../types';

// ─────────────────────────────────────────────────────────────────
// Scope Options (Q0)
// ─────────────────────────────────────────────────────────────────

export interface ScopeOption {
  value: ProjectScope;
  label: string;
  description: string;
  icon: string;
  color: string;
}

export const SCOPE_OPTIONS: ScopeOption[] = [
  {
    value: 'meta_ads',
    label: 'Meta Ads',
    description: 'Facebook & Instagram Advertising',
    icon: '📱',
    color: '#1877F2',
  },
  {
    value: 'sem',
    label: 'Google Ads',
    description: 'Search Engine Marketing (SEM)',
    icon: '🔍',
    color: '#4285F4',
  },
  {
    value: 'seo',
    label: 'SEO',
    description: 'Référencement Naturel',
    icon: '📈',
    color: '#34A853',
  },
  {
    value: 'analytics',
    label: 'Analytics & Tracking',
    description: 'Fondations Data (GA4, GTM)',
    icon: '📊',
    color: '#EA4335',
  },
  {
    value: 'social_media',
    label: 'Social Media',
    description: 'Gestion des Réseaux Sociaux',
    icon: '📱',
    color: '#10B981', // Emerald (couleur Doffy)
  },
  {
    value: 'full_scale',
    label: 'Full Scale',
    description: 'Lancement Complet (tous les leviers)',
    icon: '🚀',
    color: '#8B5CF6',
  },
];

// ─────────────────────────────────────────────────────────────────
// STEP 0: Global Identity Questions (All Scopes)
// Injected into Project Metadata for all agents
// ─────────────────────────────────────────────────────────────────

export interface ContextQuestion {
  id: keyof ProjectMetadata;
  question: string;
  type: 'text' | 'select' | 'multiselect';
  placeholder?: string;
  options?: { value: string; label: string }[];
  injectTo: AgentRole[];
  scopes: ProjectScope[] | 'all';
}

export const GLOBAL_CONTEXT_QUESTIONS: ContextQuestion[] = [
  {
    id: 'website_url',
    question: "Quelle est l'URL du site web ?",
    type: 'text',
    placeholder: 'https://example.com',
    injectTo: ['marcus', 'luna', 'sora'],
    scopes: 'all',
  },
  {
    id: 'usp',
    question: 'Quelle est votre proposition de valeur unique (USP) en une phrase ?',
    type: 'text',
    placeholder: 'Ex: Livraison en 24h partout en France',
    injectTo: ['luna', 'milo'],
    scopes: 'all',
  },
  // ═══ NEW: Global Identity Questions ═══
  {
    id: 'industry',
    question: "Quel est votre secteur d'activité ?",
    type: 'select',
    options: [
      { value: 'ecommerce', label: 'E-commerce / Retail' },
      { value: 'saas', label: 'SaaS / Tech' },
      { value: 'services_b2b', label: 'Services B2B / Consulting' },
      { value: 'services_b2c', label: 'Services B2C' },
      { value: 'health', label: 'Santé / Bien-être' },
      { value: 'real_estate', label: 'Immobilier' },
      { value: 'education', label: 'Education / Formation' },
      { value: 'hospitality', label: 'Restauration / Hôtellerie' },
      { value: 'fashion', label: 'Mode / Beauté' },
      { value: 'finance', label: 'Finance / Assurance' },
      { value: 'other', label: 'Autre' },
    ],
    injectTo: ['luna', 'sora', 'marcus', 'milo', 'doffy'],
    scopes: 'all',
  },
  {
    id: 'business_goal',
    question: 'Quel est votre objectif business principal ?',
    type: 'select',
    options: [
      { value: 'increase_sales', label: 'Augmenter les ventes en ligne' },
      { value: 'generate_leads', label: 'Générer des leads qualifiés' },
      { value: 'brand_awareness', label: 'Développer la notoriété de marque' },
      { value: 'retain_customers', label: 'Fidéliser les clients existants' },
      { value: 'launch_product', label: 'Lancer un nouveau produit/service' },
      { value: 'grow_audience', label: 'Développer une audience/communauté' },
    ],
    injectTo: ['luna', 'sora', 'marcus', 'milo', 'doffy'],
    scopes: 'all',
  },
  {
    id: 'persona',
    question: 'Décrivez votre client idéal en une phrase',
    type: 'text',
    placeholder: 'Ex: Femmes 25-40 ans, urbaines, sensibles au bien-être',
    injectTo: ['luna', 'sora', 'marcus', 'milo', 'doffy'],
    scopes: 'all',
  },
  {
    id: 'competitors',
    question: 'Quels sont vos 3 concurrents principaux ?',
    type: 'text',
    placeholder: 'Ex: concurrent1.com, concurrent2.com, concurrent3.com',
    injectTo: ['luna', 'sora', 'marcus', 'milo', 'doffy'],
    scopes: 'all',
  },
  {
    id: 'brand_voice',
    question: 'Quel est le ton de communication de votre marque ?',
    type: 'select',
    options: [
      { value: 'expert', label: 'Expert / Didactique' },
      { value: 'friendly', label: 'Amical / Décontracté' },
      { value: 'bold', label: 'Audacieux / Provocant' },
      { value: 'inspirational', label: 'Inspirant / Motivant' },
      { value: 'corporate', label: 'Corporate / Professionnel' },
    ],
    injectTo: ['luna', 'sora', 'marcus', 'milo', 'doffy'],
    scopes: 'all',
  },
];

// ─────────────────────────────────────────────────────────────────
// STEP 1: Scope-Specific Context Questions
// ─────────────────────────────────────────────────────────────────

export const META_ADS_CONTEXT_QUESTIONS: ContextQuestion[] = [
  {
    id: 'persona',
    question: 'Quel est votre Avatar Client idéal (Persona) ?',
    type: 'text',
    placeholder: 'Ex: Femmes 25-40 ans, urbaines, intérêt yoga',
    injectTo: ['marcus', 'luna', 'milo'],
    scopes: ['meta_ads', 'full_scale'],
  },
  {
    id: 'pain_point',
    question: 'Quel est le "Pain Point" (Douleur) principal que vous résolvez ?',
    type: 'text',
    placeholder: 'Ex: Mal de dos au bureau',
    injectTo: ['milo'],
    scopes: ['meta_ads', 'full_scale'],
  },
  {
    id: 'offer_hook',
    question: 'Quelle est votre offre irrésistible (Hook) ?',
    type: 'text',
    placeholder: 'Ex: -50% sur le 2ème achat ou Ebook gratuit',
    injectTo: ['luna', 'marcus', 'milo'],
    scopes: ['meta_ads', 'full_scale'],
  },
  {
    id: 'visual_tone',
    question: "Quelle est l'ambiance visuelle souhaitée ?",
    type: 'select',
    options: [
      { value: 'minimalist', label: 'Minimaliste / Luxe' },
      { value: 'colorful', label: 'Coloré / Pop' },
      { value: 'tech', label: 'Tech / Sombre' },
      { value: 'corporate', label: 'Corporatif / Pro' },
    ],
    injectTo: ['milo'],
    scopes: ['meta_ads', 'full_scale'],
  },
];

export const SEO_CONTEXT_QUESTIONS: ContextQuestion[] = [
  {
    id: 'competitors',
    question: 'Quels sont vos 3 concurrents directs sur Google ? (URLs)',
    type: 'text',
    placeholder: 'Ex: competitor1.com, competitor2.com, competitor3.com',
    injectTo: ['luna'],
    scopes: ['seo', 'full_scale'],
  },
  {
    id: 'geo_target',
    question: 'Quelle est la zone géographique cible ?',
    type: 'select',
    options: [
      { value: 'local', label: 'Local (Ville/Région)' },
      { value: 'national', label: 'National' },
      { value: 'international', label: 'International' },
    ],
    injectTo: ['marcus', 'luna'],
    scopes: ['seo', 'sem', 'full_scale'],
  },
  {
    id: 'editorial_tone',
    question: 'Quel est le ton éditorial de la marque ?',
    type: 'select',
    options: [
      { value: 'expert', label: 'Expert / Didactique' },
      { value: 'friendly', label: 'Amical / Tutoyement' },
      { value: 'journalistic', label: 'Journalistique / Neutre' },
    ],
    injectTo: ['milo', 'luna'],
    scopes: ['seo', 'full_scale'],
  },
];

export const SEM_CONTEXT_QUESTIONS: ContextQuestion[] = [
  {
    id: 'budget_monthly',
    question: 'Quel est votre Budget Mensuel Max (Cap) ?',
    type: 'text',
    placeholder: 'Ex: 5000€',
    injectTo: ['marcus'],
    scopes: ['sem', 'full_scale'],
  },
  {
    id: 'negative_keywords',
    question: 'Quels sont les mots-clés "Interdits" (Négatifs) ?',
    type: 'text',
    placeholder: 'Ex: gratuit, pas cher, emploi, stage',
    injectTo: ['marcus'],
    scopes: ['sem', 'full_scale'],
  },
  {
    id: 'competitive_advantage',
    question: "Quel est l'avantage concurrentiel #1 face aux autres annonces ?",
    type: 'text',
    placeholder: 'Ex: Livraison 24h, Service Client 7/7',
    injectTo: ['luna', 'milo'],
    scopes: ['sem', 'full_scale'],
  },
];

export const ANALYTICS_CONTEXT_QUESTIONS: ContextQuestion[] = [
  {
    id: 'cms_platform',
    question: 'Quelle plateforme/CMS utilisez-vous ?',
    type: 'select',
    options: [
      { value: 'shopify', label: 'Shopify' },
      { value: 'wordpress', label: 'WordPress / WooCommerce' },
      { value: 'webflow', label: 'Webflow' },
      { value: 'custom', label: 'Site Custom / Autre' },
    ],
    injectTo: ['sora'],
    scopes: ['analytics', 'full_scale'],
  },
  {
    id: 'tracking_events',
    question: 'Quels événements clés souhaitez-vous tracker ?',
    type: 'text',
    placeholder: 'Ex: Achat, Lead, Ajout panier, Scroll 50%',
    injectTo: ['sora'],
    scopes: ['analytics', 'full_scale'],
  },
  {
    id: 'conversion_goals',
    question: 'Quelles sont vos conversions principales à mesurer ?',
    type: 'text',
    placeholder: 'Ex: Vente, Formulaire contact, Téléchargement PDF',
    injectTo: ['sora', 'marcus'],
    scopes: ['analytics', 'full_scale'],
  },
];

export const SOCIAL_MEDIA_CONTEXT_QUESTIONS: ContextQuestion[] = [
  {
    id: 'brand_tone',
    question: 'Quel est le ton de votre marque sur les réseaux sociaux ?',
    type: 'select',
    options: [
      { value: 'professional', label: 'Professionnel / Expert' },
      { value: 'casual', label: 'Décontracté / Accessible' },
      { value: 'bold', label: 'Audacieux / Provocant' },
      { value: 'inspirational', label: 'Inspirant / Motivant' },
    ],
    injectTo: ['doffy', 'milo'],
    scopes: ['social_media', 'full_scale'],
  },
  {
    id: 'persona',
    question: 'Quel est votre Avatar Client idéal (Persona) ?',
    type: 'text',
    placeholder: 'Ex: Entrepreneurs 30-45 ans, tech-savvy, LinkedIn actifs',
    injectTo: ['doffy', 'milo', 'luna'],
    scopes: ['social_media', 'full_scale'],
  },
  {
    id: 'competitors',
    question: 'Quels sont vos 3 concurrents les plus actifs sur les réseaux ?',
    type: 'text',
    placeholder: 'Ex: @concurrent1, @concurrent2, @concurrent3',
    injectTo: ['doffy', 'luna'],
    scopes: ['social_media', 'full_scale'],
  },
];

// ─────────────────────────────────────────────────────────────────
// SCALE QUESTION (Universal - filters task count)
// ─────────────────────────────────────────────────────────────────

export const SCALE_QUESTION: WizardQuestion = {
  id: 'project_scale',
  question: "Quelle est l'envergure de ce projet ?",
  options: [
    {
      value: 'sprint',
      label: 'Action ciblée (1-2 semaines)',
      description: 'Un objectif précis : lancer une campagne, créer des posts, auditer un site',
    },
    {
      value: 'campaign',
      label: 'Campagne structurée (1-2 mois)',
      description: 'Projet avec setup et exécution, audit léger',
    },
    {
      value: 'strategy',
      label: 'Stratégie complète (3+ mois)',
      description: 'Accompagnement de A à Z, toutes les phases',
    },
  ],
};

// Helper to get context questions for a scope
export function getContextQuestionsForScope(scope: ProjectScope): ContextQuestion[] {
  const questions = [...GLOBAL_CONTEXT_QUESTIONS];

  if (scope === 'meta_ads' || scope === 'full_scale') {
    questions.push(...META_ADS_CONTEXT_QUESTIONS);
  }
  if (scope === 'seo' || scope === 'full_scale') {
    questions.push(...SEO_CONTEXT_QUESTIONS);
  }
  if (scope === 'sem' || scope === 'full_scale') {
    questions.push(...SEM_CONTEXT_QUESTIONS);
  }
  if (scope === 'analytics' || scope === 'full_scale') {
    questions.push(...ANALYTICS_CONTEXT_QUESTIONS);
  }
  if (scope === 'social_media' || scope === 'full_scale') {
    questions.push(...SOCIAL_MEDIA_CONTEXT_QUESTIONS);
  }

  // Deduplicate by id
  const seen = new Set<string>();
  return questions.filter((q) => {
    if (seen.has(q.id)) return false;
    seen.add(q.id);
    return true;
  });
}

// ─────────────────────────────────────────────────────────────────
// Questionnaire Questions (Scope Selection Questions)
// These determine WHICH tasks are generated
// ─────────────────────────────────────────────────────────────────

export const META_ADS_QUESTIONS: WizardQuestion[] = [
  {
    id: 'meta_objective',
    question: "Quel est l'objectif principal de votre campagne ?",
    options: [
      { value: 'roas', label: 'Ventes / ROAS', description: 'E-commerce, maximiser le retour' },
      { value: 'lead_gen', label: 'Génération de Leads', description: 'Formulaires, prospects' },
      { value: 'awareness', label: 'Notoriété', description: 'Faire connaître la marque' },
    ],
  },
  {
    id: 'meta_assets',
    question: 'Quels assets créatifs devons-nous produire ?',
    options: [
      { value: 'all', label: 'Tout (Visuels + Vidéos + Copy)', description: 'Production complète' },
      { value: 'visuals_copy', label: 'Visuels + Copy', description: "J'ai mes vidéos" },
      { value: 'copy_only', label: 'Copywriting uniquement', description: "J'ai tous mes visuels" },
      { value: 'none', label: "J'ai tous mes assets", description: 'Je fournirai tout' },
    ],
  },
  {
    id: 'meta_tracking',
    question: 'Quel est le niveau de votre infrastructure technique ?',
    options: [
      { value: 'none', label: 'Rien en place', description: 'BM, Pixel, CAPI à configurer' },
      { value: 'partial', label: 'Partiellement configuré', description: 'BM OK, Pixel à optimiser' },
      { value: 'ready', label: 'Tout est prêt', description: 'BM, Pixel, CAPI actifs' },
    ],
  },
];

export const SEM_QUESTIONS: WizardQuestion[] = [
  {
    id: 'sem_type',
    question: 'Quel type de campagne Google Ads souhaitez-vous ?',
    options: [
      { value: 'search', label: 'Search (Mots-clés)', description: 'Annonces textuelles sur recherche' },
      { value: 'pmax', label: 'Performance Max', description: 'Campagne multi-canaux automatisée' },
      { value: 'both', label: 'Search + PMax', description: 'Stratégie complète' },
    ],
  },
  {
    id: 'sem_existing',
    question: 'Avez-vous un compte Google Ads existant ?',
    options: [
      { value: 'new', label: 'Nouveau compte', description: 'Démarrage from scratch' },
      { value: 'existing', label: 'Compte existant à optimiser', description: 'Audit et amélioration' },
    ],
  },
  {
    id: 'sem_copy',
    question: 'Les annonces RSA sont-elles prêtes ?',
    options: [
      { value: 'ready', label: 'Oui, annonces rédigées', description: 'Je fournirai mes titres' },
      { value: 'create', label: 'À créer', description: "L'IA rédigera les RSA" },
    ],
  },
];

export const SEO_QUESTIONS: WizardQuestion[] = [
  {
    id: 'seo_audit',
    question: "Avez-vous besoin d'un état des lieux SEO ?",
    options: [
      { value: 'full', label: 'Audit complet', description: 'Technique + Sémantique + Concurrence' },
      { value: 'partial', label: 'Audit partiel', description: 'Sémantique uniquement' },
      { value: 'none', label: "Non, j'ai ma stratégie", description: 'Passer à l\'exécution' },
    ],
  },
  {
    id: 'seo_content',
    question: 'Qui rédigera les contenus SEO ?',
    options: [
      { value: 'ai', label: "L'IA (Milo)", description: 'Rédaction optimisée SEO' },
      { value: 'internal', label: 'En interne', description: 'Votre équipe rédigera' },
      { value: 'mix', label: 'Mix IA + Interne', description: 'Collaboration' },
    ],
  },
  {
    id: 'seo_migration',
    question: 'Y a-t-il une migration de site prévue ?',
    options: [
      { value: 'yes', label: 'Oui, migration prévue', description: 'Redirections 301 à gérer' },
      { value: 'no', label: 'Non', description: 'Site existant stable' },
    ],
  },
];

export const ANALYTICS_QUESTIONS: WizardQuestion[] = [
  {
    id: 'analytics_state',
    question: "L'infrastructure de mesure est-elle prête ?",
    options: [
      { value: 'none', label: 'Rien en place', description: 'GTM + GA4 à configurer' },
      { value: 'partial', label: 'Partiellement', description: 'GA4 présent mais incomplet' },
      { value: 'ready', label: 'Tout est configuré', description: 'Tracking opérationnel' },
    ],
  },
  {
    id: 'analytics_ecommerce',
    question: 'Votre site est-il un e-commerce ?',
    options: [
      { value: 'yes', label: 'Oui, e-commerce', description: 'Tracking Enhanced E-commerce' },
      { value: 'no', label: 'Non, leadgen/vitrine', description: 'Tracking formulaires/events' },
    ],
  },
  {
    id: 'analytics_pixels',
    question: 'Quels pixels média devons-nous installer ?',
    options: [
      { value: 'all', label: 'Tous (Meta, Google, LinkedIn, TikTok)', description: 'Suite complète' },
      { value: 'meta_google', label: 'Meta + Google uniquement', description: 'Les essentiels' },
      { value: 'google_only', label: 'Google Ads uniquement', description: 'Minimum' },
      { value: 'none', label: 'Déjà installés', description: 'Pas de nouveaux pixels' },
    ],
  },
];

export const SOCIAL_MEDIA_QUESTIONS: WizardQuestion[] = [
  {
    id: 'social_platforms',
    question: 'Quelles plateformes voulez-vous gérer ?',
    options: [
      { value: 'all', label: 'Toutes (LinkedIn, Insta, X, TikTok, FB)', description: 'Couverture complète' },
      { value: 'linkedin_instagram', label: 'LinkedIn + Instagram', description: 'B2B & B2C essentials' },
      { value: 'instagram_tiktok', label: 'Instagram + TikTok', description: 'Visual & video-first' },
      { value: 'linkedin_only', label: 'LinkedIn uniquement', description: 'Focus B2B / thought leadership' },
    ],
  },
  {
    id: 'social_content',
    question: 'Quel type de contenu devons-nous produire ?',
    options: [
      { value: 'full', label: 'Tout (Textes + Visuels + Vidéos)', description: 'Production complète avec Milo' },
      { value: 'text_visuals', label: 'Textes + Visuels', description: "J'ai mes vidéos" },
      { value: 'text_only', label: 'Textes uniquement', description: "J'ai tous mes visuels et vidéos" },
      { value: 'calendar_only', label: 'Calendrier éditorial uniquement', description: 'Stratégie & planning seulement' },
    ],
  },
  {
    id: 'social_existing',
    question: "Quel est l'état actuel de votre présence social media ?",
    options: [
      { value: 'active', label: 'Comptes actifs avec audience', description: 'Déjà une communauté engagée' },
      { value: 'dormant', label: 'Comptes existants mais inactifs', description: 'Faut réactiver la présence' },
      { value: 'new', label: 'Pas encore de comptes', description: 'Tout est à créer' },
    ],
  },
];

export const WIZARD_FLOWS: Record<Exclude<ProjectScope, 'full_scale'>, WizardQuestion[]> = {
  meta_ads: META_ADS_QUESTIONS,
  sem: SEM_QUESTIONS,
  seo: SEO_QUESTIONS,
  analytics: ANALYTICS_QUESTIONS,
  social_media: SOCIAL_MEDIA_QUESTIONS,
};

export function getQuestionsForScope(scope: ProjectScope): WizardQuestion[] {
  if (scope === 'full_scale') {
    // Full scale = toujours strategy, pas besoin de demander l'envergure
    return [
      ...ANALYTICS_QUESTIONS,
      ...SEO_QUESTIONS,
      ...META_ADS_QUESTIONS,
      ...SEM_QUESTIONS,
      ...SOCIAL_MEDIA_QUESTIONS,
    ];
  }
  // Ajouter SCALE_QUESTION en premier pour les scopes individuels
  return [SCALE_QUESTION, ...WIZARD_FLOWS[scope]];
}

// ─────────────────────────────────────────────────────────────────
// Base Task Interface
// ─────────────────────────────────────────────────────────────────

export interface BaseTask {
  title: string;
  description: string;
  assignee: AgentRole;
  phase: TaskPhase;
  estimated_hours: number;
  context_questions: string[];
  category: string;
  order: number;
}

// ═══════════════════════════════════════════════════════════════
// META ADS TASKS (19 tâches)
// ═══════════════════════════════════════════════════════════════

export const META_ADS_TASKS: BaseTask[] = [
  // STRATÉGIE (Luna) & ANALYSE (Sora) & BUDGET (Marcus) - 4 tâches
  { title: '🎯 Définition Objectif & KPIs Campagne', description: 'Définir les objectifs SMART de la campagne Meta Ads et identifier les KPIs prioritaires : ROAS cible (e-commerce), CPA ou CPL cible (leadgen), taux de conversion, CTR. Établir les seuils de succès et d\'échec pour chaque métrique, documenter les critères qui déclencheront des ajustements (budgétaires, créatifs, ciblage). Créer le calendrier de mesure (J+7, J+14, J+30) et définir les benchmarks sectoriels de référence.', assignee: 'sora', phase: 'Audit', estimated_hours: 1.5, category: 'strategy', order: 1, context_questions: ['Quel est votre objectif business principal ?', 'Quel budget mensuel prévu ?', 'Quels KPIs utilisez-vous actuellement ?'] },
  { title: '👤 Création Avatar Client Idéal (ICP)', description: 'Créer un profil détaillé de l\'Avatar Client (Ideal Customer Profile) avec : démographie (âge, genre, localisation, revenu), psychographie (valeurs, croyances, aspirations), comportements d\'achat (où achète-t-il, quand, combien dépense-t-il), pain points spécifiques, objections principales, et déclencheurs d\'achat. Documenter ses plateformes préférées (Facebook vs Instagram), formats de contenu favoris (vidéo courte, carrousel, statique), et ton de communication qui résonne avec lui.', assignee: 'luna', phase: 'Audit', estimated_hours: 2, category: 'strategy', order: 2, context_questions: ['Qui est votre client idéal ?', 'Quels sont ses problèmes principaux ?', "Qu'est-ce qui le motive à acheter ?"] },
  { title: '💎 Formulation Offre Irrésistible', description: 'Formuler une offre commerciale irrésistible en structurant : l\'offre principale (produit/service + prix), les garanties (satisfait ou remboursé, garantie résultats), les bonus (produits complémentaires, services additionnels), les éléments d\'urgence et rareté (offre limitée dans le temps, stock limité), et la proposition de valeur unique (USP) qui différencie de la concurrence. Préparer 3 angles d\'accroche différents pour tester en publicité.', assignee: 'luna', phase: 'Audit', estimated_hours: 2, category: 'strategy', order: 3, context_questions: ['Quelle est votre offre principale ?', 'Quelles garanties proposez-vous ?', 'Avez-vous des bonus ou offres limitées ?'] },
  { title: '💰 Plan Budget & Allocation par Phase', description: 'Établir le plan budgétaire complet avec : budget de test initial (phase d\'apprentissage 7-14 jours), allocation par ad set (combien par audience), budget quotidien vs lifetime, règles de scaling vertical (augmentation progressive du budget quotidien) et horizontal (duplication des winners), seuils de performance pour augmenter/diminuer/stopper un ad set, et budget de réserve pour opportunités. Définir la stratégie CBO (Campaign Budget Optimization) vs ABO (Ad Set Budget Optimization).', assignee: 'marcus', phase: 'Audit', estimated_hours: 1.5, category: 'strategy', order: 4, context_questions: ['Budget quotidien initial ?', 'Budget phase de test ?', 'Objectif scaling à 30 jours ?'] },

  // TECHNIQUE (Sora) - 5 tâches
  { title: '🏢 Audit & Setup Business Manager', description: 'Auditer la structure actuelle du Business Manager : vérifier les accès administrateur, rôles et permissions des utilisateurs, Pages Facebook/Instagram liées, comptes publicitaires configurés. Nettoyer les accès obsolètes, organiser la structure en dossiers si plusieurs marques/projets, vérifier les moyens de paiement et limites de dépenses. S\'assurer que toutes les pages sont vérifiées et que le BM respecte les politiques Meta (pas de contenu dupliqué, ownership clair).', assignee: 'sora', phase: 'Setup', estimated_hours: 1, category: 'technical', order: 5, context_questions: ['Avez-vous accès admin au BM ?', 'Combien de comptes publicitaires ?', 'Page Facebook connectée ?'] },
  { title: '📍 Installation & Configuration Pixel Meta', description: 'Installer le Pixel Meta sur toutes les pages du site via Google Tag Manager (recommandé) ou directement dans le code source. Configurer les événements standards (PageView, ViewContent, AddToCart, InitiateCheckout, Purchase, Lead, CompleteRegistration). Vérifier le bon fonctionnement avec le Pixel Helper (extension Chrome) et l\'outil de test d\'événements Meta. Activer l\'Enhanced Matching pour améliorer l\'attribution (envoi email hashé, téléphone, nom).', assignee: 'sora', phase: 'Setup', estimated_hours: 2, category: 'technical', order: 6, context_questions: ['GTM déjà installé ?', 'Quel CMS (Shopify, WordPress) ?', 'Événements à tracker ?'] },
  { title: '🔗 Configuration CAPI (Conversions API)', description: 'Implémenter le Server-Side Tracking via Conversions API pour contourner les limitations iOS 14.5+ et améliorer la qualité de l\'attribution. Configurer via une intégration native (Shopify, WordPress plugins) ou via un partenaire (Stape.io, Elevar). Mettre en place la déduplication des événements (event_id identique entre Pixel et CAPI) pour éviter le double comptage. Tester la réception des événements dans Events Manager et vérifier le score de qualité des événements (Event Match Quality).', assignee: 'sora', phase: 'Setup', estimated_hours: 3, category: 'technical', order: 7, context_questions: ['Plateforme supporte CAPI nativement ?', 'Intégrations tierces ?', 'Niveau déduplication ?'] },
  { title: '🌐 Vérification & Configuration Domaine', description: 'Vérifier le domaine dans Business Manager pour prioriser les événements et contrer les restrictions ATT (App Tracking Transparency). Configurer les 8 événements prioritaires maximum dans l\'ordre d\'importance (généralement : Purchase, AddToCart, InitiateCheckout, Lead, ViewContent, AddToWishlist, CompleteRegistration, Search). Configurer l\'Aggregated Event Measurement pour respecter la limite iOS. Vérifier que le domaine est bien associé au bon compte publicitaire.', assignee: 'sora', phase: 'Setup', estimated_hours: 1, category: 'technical', order: 8, context_questions: ['Domaine déjà vérifié ?', '8 événements prioritaires ?', 'ATT configuré ?'] },
  { title: '📊 Configuration Événements & Conversions', description: 'Configurer les événements de conversion personnalisés au-delà des standards : événements custom basés sur les actions importantes du site (téléchargement PDF, visionnage vidéo, scroll 75%, temps sur page). Définir les valeurs de conversion dynamiques ou statiques pour chaque événement. Créer les audiences de remarketing basées sur ces événements (visiteurs 30j, ajout panier 7j, acheteurs 180j, engagement vidéo, etc.). Documenter le mapping événement → audience → campagne.', assignee: 'sora', phase: 'Setup', estimated_hours: 2, category: 'technical', order: 9, context_questions: ['Événements custom souhaités ?', 'Valeur moyenne conversion ?', 'Audiences remarketing à créer ?'] },

  // CRÉATIVE (Milo) - 2 tâches
  { title: '🎨 Production Visuels (6 variations)', description: 'Produire 6 variations visuelles respectant les spécifications Meta (résolution, poids, ratio) : 2 images statiques carrées (1080x1080px, format Feed), 2 carrousels de 3-5 cartes (storytelling produit ou avant/après), et 2 formats verticaux pour Stories/Reels (1080x1920px, 9:16). Respecter la règle des 20% de texte max sur image (ou utiliser Text Overlay Tool). Décliner chaque format en 2 variantes A/B (différence visuelle majeure : couleur de fond, placement produit, avec/sans humain). Optimiser pour mobile-first et s\'assurer que le message est compréhensible sans son.', assignee: 'milo', phase: 'Production', estimated_hours: 6, category: 'creative', order: 10, context_questions: ['Charte graphique (couleurs, fonts) ?', 'Produits/services à mettre en avant ?', 'Références visuelles inspirantes ?'] },
  { title: '✍️ Copywriting Ads (9 variations)', description: 'Rédiger 9 variations de copy publicitaire en testant 3 angles créatifs (pain point, bénéfice, urgence) × 3 variations d\'exécution. Structure : Hook accrocheur (première ligne visible sans "voir plus"), Corps développant la promesse avec bullet points ou émojis, CTA clair (Découvrir, Commander, S\'inscrire). Limiter le texte principal à 125 caractères pour maximiser la visibilité mobile. Créer 3 variations de Headline (40 caractères max) et 3 variations de Description (30 caractères max). Intégrer les mots-clés de recherche de l\'audience et adapter le ton selon la plateforme (Facebook plus long, Instagram plus court et visuel).', assignee: 'milo', phase: 'Production', estimated_hours: 4, category: 'creative', order: 11, context_questions: ['Ton de la marque ?', 'Bénéfices à mettre en avant ?', 'Mots-clés obligatoires ?'] },

  // CONFIGURATION (Marcus) - 3 tâches
  { title: '🎪 Création Structure Campagne', description: 'Créer la structure de campagne dans Ads Manager : choisir entre CBO (Campaign Budget Optimization - Meta gère l\'allocation) ou ABO (Ad Set Budget Optimization - contrôle manuel). Sélectionner l\'objectif de campagne (Ventes, Prospects, Trafic, Engagement) aligné avec le business goal. Configurer le budget quotidien vs lifetime selon la durée de campagne. Définir le calendrier de diffusion et les heures optimales. Choisir les placements (recommandé : Advantage+ Placements pour commencer, puis affiner avec données de performance). Nommer la campagne selon une convention claire (ex: BRAND_YYYY-MM_OBJECTIF_BUDGET).', assignee: 'marcus', phase: 'Production', estimated_hours: 1.5, category: 'configuration', order: 12, context_questions: ['CBO ou ABO ?', 'Budget quotidien ou lifetime ?', 'Placements auto ou manuels ?'] },
  { title: '🎯 Configuration Ad Sets (Ciblage)', description: 'Configurer 3-5 ad sets avec différentes stratégies d\'audience : 1) Broad Targeting (ciblage large avec optimisation Meta), 2) Interest-Based (centres d\'intérêt spécifiques), 3) Lookalike 1-3% (si données clients disponibles), 4) Custom Audiences (remarketing pixel, liste emails, engagement). Pour chaque ad set : définir géographie, âge, genre (ou laisser ouvert), exclure les acheteurs récents pour acquisition, définir le budget par ad set (si ABO). Utiliser des audiences de test de taille suffisante (>500k pour acquisition, >1k pour remarketing) pour sortir rapidement de la phase d\'apprentissage.', assignee: 'marcus', phase: 'Production', estimated_hours: 2, category: 'configuration', order: 13, context_questions: ['Audiences existantes ?', "Centres d'intérêt cible ?", 'Données pour Lookalikes ?'] },
  { title: '📱 Configuration Publicités', description: 'Créer les publicités en associant chaque variation visuelle avec chaque variation de copy (méthode combinatoire si <10 ads par ad set). Configurer pour chaque ad : Primary Text (le copy principal), Headline (titre court), Description (sous-titre optionnel), CTA button (Acheter, En savoir plus, S\'inscrire), Destination (URL de landing page avec UTM parameters pour tracking : utm_source=facebook, utm_medium=cpc, utm_campaign=nom_campagne, utm_content=nom_ad). Utiliser Dynamic Creative si Meta doit tester automatiquement les combinaisons. Prévisualiser tous les placements (Feed, Stories, Reels) avant publication.', assignee: 'marcus', phase: 'Production', estimated_hours: 2, category: 'configuration', order: 14, context_questions: ['URL destination (landing) ?', 'UTM parameters ?', 'CTA principal ?'] },

  // LANCEMENT (Marcus) - 2 tâches
  { title: '✅ QA Pre-Launch Checklist', description: 'Exécuter la checklist complète avant lancement : 1) Tester tous les liens de destination (clic sur chaque ad en preview), 2) Vérifier que le Pixel/CAPI track correctement (utiliser Pixel Helper et Events Manager Test), 3) Confirmer que les visuels respectent les règles Meta (pas de texte >20%, pas de contenu choquant/trompeur), 4) Relire tous les textes pour fautes d\'orthographe/grammaire, 5) Vérifier les UTM dans chaque URL, 6) S\'assurer que les moyens de paiement sont valides et sans limite, 7) Vérifier que les audiences ne se chevauchent pas excessivement (Overlap Tool), 8) Confirmer les budgets et calendrier.', assignee: 'marcus', phase: 'Production', estimated_hours: 1, category: 'launch', order: 15, context_questions: ['Liens testés ?', 'Visuels respectent règles Meta ?', 'Tracking fire en preview ?'] },
  { title: '🚀 Publication & Activation Campagne', description: 'Publier la campagne et activer la diffusion. Surveiller les premières heures : vérifier que les ads passent en "Active" (pas rejetées), que les impressions commencent à s\'accumuler (si 0 impression après 2h, investiguer), que le tracking fonctionne dans Events Manager (voir les événements en temps réel). Documenter l\'heure exacte de lancement pour analyse future. Configurer les alertes automatiques dans Ads Manager (baisse ROAS, hausse CPA, problème de diffusion). Prendre des screenshots de la config initiale pour référence future. Communiquer le lancement au client avec dashboard de suivi.', assignee: 'marcus', phase: 'Production', estimated_hours: 0.5, category: 'launch', order: 16, context_questions: ['Heure lancement préférée ?', 'Budget initial test ?', 'Alertes à configurer ?'] },

  // OPTIMISATION (Sora + Marcus) - 3 tâches
  { title: '📈 Monitoring Phase Apprentissage', description: 'Surveiller quotidiennement la sortie de Learning Phase (objectif : 50 conversions par ad set par semaine). NE PAS MODIFIER la campagne pendant les 3-5 premiers jours sauf si problème critique (0 impression, tracking cassé). Identifier les ad sets qui stagnent en Learning Limited (audience trop petite, budget trop bas) et ajuster. Surveiller les métriques early-signals : CTR (>1% bon, <0.5% problème), CPC, Reach, Frequency (idéalement <2 en phase test). Documenter les performances jour par jour pour identifier patterns (jour de semaine vs weekend, matin vs soir). Alerter si un ad set épuise son budget sans sortir de Learning après 7 jours.', assignee: 'sora', phase: 'Optimization', estimated_hours: 2, category: 'optimization', order: 17, context_questions: ["Seuil sortie apprentissage ?", 'Fréquence reporting ?', 'KPIs prioritaires ?'] },
  { title: '📊 Analyse Performance & Recommandations', description: 'Analyser les performances à J+7, J+14, J+30 en segmentant par : 1) Audience (quelle audience a le meilleur ROAS/CPA), 2) Creative (quel visuel + copy performe), 3) Placement (Feed vs Stories vs Reels), 4) Device (Mobile vs Desktop), 5) Âge et Genre (si données suffisantes). Identifier les winners (au-dessus du seuil ROAS/CPA cible) et losers (en dessous). Calculer la significativité statistique avant de couper (minimum 1000 impressions et 10 conversions par variante). Produire un rapport avec recommandations actionnables : quels ad sets scaler, quels ad sets optimiser (changer creative/copy), quels ad sets stopper.', assignee: 'sora', phase: 'Optimization', estimated_hours: 3, category: 'optimization', order: 18, context_questions: ['Segments à analyser ?', 'Seuil significativité ?', 'Format rapport ?'] },
  { title: '⚡ Scaling & Ajustements Continus', description: 'Exécuter le scaling des winners avec deux stratégies : 1) Scaling Vertical = augmenter le budget d\'un ad set performant de 10-20% tous les 3 jours (ne jamais doubler d\'un coup = réinitialise Learning), 2) Scaling Horizontal = dupliquer l\'ad set winner vers de nouvelles audiences (Lookalike 4-6%, autres intérêts, autres geos). KILLER immédiatement les losers (ROAS <seuil pendant 48h avec >20 conversions). Rafraîchir les creatives toutes les 2-3 semaines (ad fatigue quand Frequency >3). Tester en continu de nouvelles audiences, nouveaux formats (Reels si pas encore testé), nouveaux angles de copy. Tenir un changelog de tous les ajustements pour corrélation performance.', assignee: 'marcus', phase: 'Optimization', estimated_hours: 2, category: 'optimization', order: 19, context_questions: ['Stratégie scaling (vertical/horizontal) ?', 'Seuil CPA/ROAS pour killer ?', 'Budget max quotidien ?'] },
];

// ═══════════════════════════════════════════════════════════════
// SEM / GOOGLE ADS TASKS (21 tâches)
// ═══════════════════════════════════════════════════════════════

export const SEM_TASKS: BaseTask[] = [
  // STRATÉGIE (Luna) & ANALYSE (Sora) - 4 tâches
  { title: '🎯 Définir KPIs (ROAS/CPA cible)', description: 'Définir les KPIs en fonction du business model : pour E-commerce, fixer un ROAS cible (ex: 4x = 4€ de revenu pour 1€ dépensé) basé sur la marge produit moyenne. Pour Leadgen, définir le CPA cible (Coût Par Acquisition) acceptable selon la valeur vie client (LTV). Calculer le seuil de rentabilité : si marge brute = 40% et panier moyen = 100€, alors CPA max = 40€ pour être rentable. Documenter les KPIs secondaires : CTR (>3% bon sur Search), Taux de conversion (benchmark secteur), Quality Score moyen (objectif >7/10), Impression Share (>80% sur marque).', assignee: 'sora', phase: 'Audit', estimated_hours: 1, category: 'strategy', order: 1, context_questions: ['Objectif principal (ventes/leads) ?', 'ROAS ou CPA cible ?', 'Marge produit moyenne ?'] },
  { title: '🔑 Keyword Research (Étude Mots-clés)', description: 'Utiliser Google Keyword Planner pour identifier 50-200 mots-clés pertinents. Segmenter par intention : Transactionnels (acheter, prix, livraison), Navigationnels (marque + produit), Informationnels (comment, guide, meilleur). Pour chaque mot-clé, noter : volume de recherche mensuel, CPC moyen enchère, niveau de concurrence. Prioriser les mots-clés à fort volume + CPC raisonnable + forte intention d\'achat. Identifier les long-tail keywords (3-5 mots) avec moins de concurrence mais meilleure conversion. Exporter tout dans un Google Sheet structuré par thème/catégorie produit.', assignee: 'luna', phase: 'Audit', estimated_hours: 3, category: 'strategy', order: 2, context_questions: ['Mots-clés principaux actuels ?', 'Concurrents à analyser ?', 'Zones géographiques ?'] },
  { title: '🚫 Liste Mots-clés Négatifs', description: 'Construire une liste exhaustive de mots-clés négatifs pour éviter le trafic non qualifié et protéger le budget. Catégories standards : 1) Gratuit (free, gratuit, gratis), 2) Emploi (job, emploi, recrutement, stage, CV), 3) Éducatif (cours, formation, tuto si vous ne vendez pas ça), 4) DIY si vous vendez des services (comment faire, DIY), 5) Concurrents directs (noms de marques). Créer une liste de 100-200 termes en français + anglais si audience bilingue. Organiser en listes réutilisables par thème. Prévoir d\'enrichir cette liste chaque semaine après analyse des termes de recherche réels.', assignee: 'luna', phase: 'Audit', estimated_hours: 1, category: 'strategy', order: 3, context_questions: ['Termes à exclure absolument ?', 'Secteur activité (pour exclusions standard) ?'] },
  { title: '🔍 Analyse Concurrence Ads', description: 'Utiliser Google Ads Transparency Center pour identifier les annonces actives des 3-5 principaux concurrents. Pour chaque concurrent, documenter : 1) Mots-clés ciblés (via outils comme SEMrush, Ahrefs), 2) Structure des annonces (titres, descriptions, extensions utilisées), 3) Landing pages utilisées, 4) USPs mis en avant (prix, livraison, garantie), 5) Promotions actives. Identifier les angles non exploités par les concurrents (opportunités de différenciation). Estimer leur budget publicitaire et position moyenne sur les mots-clés stratégiques. Créer un tableau comparatif : Nous vs Concurrent A vs B vs C.', assignee: 'luna', phase: 'Audit', estimated_hours: 2, category: 'strategy', order: 4, context_questions: ['3 concurrents principaux ?', 'USP à différencier ?', 'Budget concurrent estimé ?'] },

  // TRACKING (Sora) - 4 tâches
  { title: '🔗 Liaison Comptes (GA4 + GSC)', description: 'Lier Google Ads à Google Analytics 4 pour importer les données de conversion et analyser le comportement post-clic (pages vues, temps sur site, taux de rebond par campagne/mot-clé). Configuration : Google Ads > Admin > Linked accounts > Google Analytics 4 > Link. Activer l\'import automatique des objectifs GA4 comme conversions Google Ads. Lier également à Google Search Console pour voir les performances organiques vs payantes et éviter de payer pour des mots-clés où vous rankez déjà organiquement en position 1-3. Vérifier que le tagging automatique est activé (GCLID) pour tracking précis.', assignee: 'sora', phase: 'Setup', estimated_hours: 1, category: 'tracking', order: 5, context_questions: ['Accès admin GA4 ?', 'GSC configuré ?', 'Comptes à lier ?'] },
  { title: '📊 Suivi Conversions + Enhanced Conversions', description: 'Installer le Global Site Tag Google Ads sur toutes les pages (via GTM recommandé). Configurer les conversions principales : Achat/Transaction (avec valeur dynamique), Génération de lead (formulaire soumis), Inscription newsletter, Appel téléphonique (click-to-call). Activer Enhanced Conversions pour améliorer l\'attribution : envoyer les données first-party hashées (email, téléphone, nom, adresse) de manière sécurisée à Google pour matcher avec les utilisateurs connectés. Configuration via GTM (variables de dataLayer) ou directement dans le tag. Tester avec Google Tag Assistant et vérifier la réception dans Google Ads > Conversions.', assignee: 'sora', phase: 'Setup', estimated_hours: 2, category: 'tracking', order: 6, context_questions: ['Conversions principales ?', 'Email collecté au checkout ?', 'Valeurs dynamiques ?'] },
  { title: '✅ Vérification Global Site Tag', description: 'Vérifier que le Global Site Tag (gtag.js) ou Google Tag Manager est présent sur 100% des pages du site. Utiliser Google Tag Assistant (extension Chrome) pour scanner : 1) Présence du tag sur homepage, pages produits, panier, checkout, thank you page, 2) Absence d\'erreurs de configuration, 3) Déclenchement correct des événements de conversion. Tester un parcours complet : recherche Google Ads > clic annonce > ajout panier > achat, et vérifier dans Google Ads > Conversions que la conversion est bien attribuée avec GCLID. Corriger toute erreur avant de lancer les campagnes (sinon budget gaspillé sans data).', assignee: 'sora', phase: 'Setup', estimated_hours: 1, category: 'tracking', order: 7, context_questions: ['GTM ou tag direct ?', 'Toutes pages couvertes ?', 'Erreurs connues ?'] },
  { title: '👥 Création Audiences (Segments)', description: 'Créer des audiences de remarketing dans Google Ads pour recibler les visiteurs précédents : 1) Tous les visiteurs du site (30 jours), 2) Visiteurs de pages produits spécifiques (14 jours), 3) Paniers abandonnés (7 jours - haute intention), 4) Acheteurs récents (180 jours - pour cross-sell/up-sell ou exclusion en acquisition), 5) Engagement vidéo YouTube si applicable. Durée de rétention : adapter selon le cycle de vente (7 jours pour impulsif, 90 jours pour considération longue). Prévoir minimum 1000 utilisateurs dans une audience avant de l\'utiliser en campagne. Exporter ces audiences vers Google Analytics pour analyse cross-canal.', assignee: 'sora', phase: 'Setup', estimated_hours: 1.5, category: 'tracking', order: 8, context_questions: ['Audiences existantes ?', 'Durée rétention souhaitée ?', 'Segments prioritaires ?'] },

  // STRUCTURE (Marcus) - 2 tâches
  { title: '🏗️ Découpage Campagnes', description: 'Structurer le compte Google Ads en 3-4 campagnes séparées avec budgets distincts : 1) MARQUE (Brand) = termes incluant le nom de marque (défensive, CPC bas, ROI élevé), 2) HORS-MARQUE Générique (Generic) = termes catégorie produit sans marque, 3) CONCURRENTS (Competitors) = cibler les noms de marques concurrentes (risqué, Quality Score bas), 4) PERFORMANCE MAX (PMax) = campagne automatisée utilisant tous les placements Google (Search, Display, YouTube, Shopping, Gmail) - obligatoire si e-commerce/leads. Allouer le budget : 60% Marque, 30% Générique, 10% Test (Concurrents ou PMax). Nommer selon convention : [BRAND]_[TYPE]_[GEO]_[YYYY-MM].', assignee: 'marcus', phase: 'Setup', estimated_hours: 2, category: 'structure', order: 9, context_questions: ['Nom de marque à protéger ?', 'Budget par type campagne ?', 'PMax souhaité ?'] },
  { title: '📁 Configuration Ad Groups (STAGs)', description: 'Organiser chaque campagne en Ad Groups thématiques (Single Theme Ad Groups = STAGs) : 1 Ad Group = 1 intention utilisateur ou 1 catégorie produit. Exemple e-commerce chaussures : Ad Group "Baskets Running", "Chaussures Randonnée", "Sandales Été". Inclure 5-15 mots-clés par Ad Group, tous sur le même thème pour maximiser le Quality Score. Éviter SKAG (Single Keyword Ad Groups) sauf pour mots-clés à très fort volume. Utiliser les types de correspondance : Exacte [mot-clé] pour contrôle max, Expression "mot-clé" pour variantes proches, Large +mot +clé pour volume (mais surveiller termes de recherche). Appliquer la liste de mots-clés négatifs à toutes les campagnes.', assignee: 'marcus', phase: 'Setup', estimated_hours: 2, category: 'structure', order: 10, context_questions: ['Catégories produits/services ?', 'Intentions utilisateur principales ?', 'Structure SKAG ou STAG ?'] },

  // COPYWRITING (Milo) - 3 tâches
  { title: '✍️ Rédaction RSA (Annonces)', description: 'Rédiger des Responsive Search Ads (RSA) avec 15 titres (30 caractères max chacun) et 4 descriptions (90 caractères max chacune). Google teste automatiquement les combinaisons pour trouver les plus performantes. Règles : 1) Varier les angles dans les titres (bénéfice, prix, promo, urgence, trust), 2) Inclure le mot-clé principal dans 2-3 titres pour Quality Score, 3) Utiliser la capitalisation (Chaque Mot En Majuscule), 4) Inclure des chiffres (50% de réduction, Livraison 24h, +10k clients), 5) Épingler (pin) certains titres en position 1 si critique (ex: nom de marque). Dans les descriptions : développer l\'USP, call-to-action clair, bénéfices concrets. Créer 2-3 RSA par Ad Group pour tester différents angles.', assignee: 'milo', phase: 'Production', estimated_hours: 3, category: 'copywriting', order: 11, context_questions: ['USP principale ?', 'Promotions actuelles ?', 'Ton de marque ?'] },
  { title: '🔗 Configuration Extensions (Assets)', description: 'Configurer toutes les extensions d\'annonce (Assets) pour maximiser la visibilité et le CTR : 1) SITELINKS (4-6 liens vers pages importantes : Livraison, Contact, Avis, Promos), 2) ACCROCHES / Callouts (phrases courtes : "Livraison Gratuite", "SAV 7j/7", "Paiement Sécurisé"), 3) SNIPPETS STRUCTURÉS (listes : Marques, Services, Styles), 4) IMAGES (produits/services en format carré), 5) PRIX (si catalogue produits fixe), 6) PROMOTIONS (offres limitées avec dates), 7) APPEL (numéro cliquable mobile), 8) LOCALISATION (si boutiques physiques). Toutes ces extensions sont gratuites et améliorent le Quality Score + CTR. Les configurer au niveau compte (partagées) ou campagne (spécifiques).', assignee: 'milo', phase: 'Production', estimated_hours: 2, category: 'copywriting', order: 12, context_questions: ['Pages importantes pour sitelinks ?', 'Avantages à mettre en accroche ?', 'Images produits disponibles ?'] },
  { title: '📞 Call to Action Optimization', description: 'Optimiser les Call-to-Action (CTA) dans les annonces et landing pages pour maximiser la conversion. Verbes d\'action forts et spécifiques : "Acheter Maintenant" (e-commerce), "Demander un Devis" (B2B services), "Réserver une Démo" (SaaS), "Télécharger le Guide" (leadgen), "Essayer Gratuitement" (freemium). Éviter les CTA faibles ("En savoir plus", "Cliquer ici"). Tester 2 variantes de CTA par campagne : urgence ("Offre limitée - Commander") vs bénéfice ("Économiser 50% maintenant"). Analyser les CTAs concurrents et différenciez-vous. Sur la landing page, répéter le CTA 2-3 fois (above fold, milieu, fin) avec design contrasté (bouton orange sur fond blanc par exemple).', assignee: 'milo', phase: 'Production', estimated_hours: 1, category: 'copywriting', order: 13, context_questions: ['Action principale souhaitée ?', 'CTA concurrents ?', 'Tests A/B prévus ?'] },

  // CONFIGURATION (Marcus) - 3 tâches
  { title: '🌍 Paramètres Géographiques', description: 'Configurer le ciblage géographique avec l\'option "Présence ou intérêt régulier" (défaut) OU mieux "Présence" uniquement pour éviter le spam (ex: touristes recherchant "hôtel Paris" depuis l\'étranger mais vous livrez uniquement en France). Définir les zones : 1) Pays (France, Belgique, Suisse), 2) Régions (Île-de-France, PACA), 3) Villes (Paris, Lyon), ou 4) Rayon autour d\'une adresse (20km pour commerces locaux). Exclure les zones non pertinentes (DOM-TOM si pas de livraison, régions concurrentes). Ajuster les enchères par zone : +20% Paris si meilleur ROI, -30% zones rurales si mauvais taux conversion.', assignee: 'marcus', phase: 'Production', estimated_hours: 1, category: 'configuration', order: 14, context_questions: ['Zones à cibler ?', 'Zones à exclure ?', 'Rayon autour adresse ?'] },
  { title: '💹 Stratégie Enchères', description: 'Choisir la stratégie d\'enchères selon la maturité du compte : 1) PHASE TEST (nouveau compte, <30 conversions/mois) = "Maximiser les clics" avec limite CPC max (ex: 2€) pour générer du trafic et des données, 2) PHASE OPTIMISATION (30-100 conversions/mois) = "Maximiser les conversions" (Google optimise pour volume conversion), 3) PHASE SCALE (>100 conversions/mois) = "CPA cible" (vous définissez le CPA souhaité, ex: 40€) ou "ROAS cible" (ex: 400% = 4x). Éviter "Manuel CPC" sauf si vous voulez contrôle total mais c\'est chronophage. Pour débuter : Maximiser les clics avec CPC max = 1,5x le CPC moyen du Keyword Planner.', assignee: 'marcus', phase: 'Production', estimated_hours: 1, category: 'configuration', order: 15, context_questions: ['Stratégie préférée ?', 'CPC max acceptable ?', 'Historique conversions ?'] },
  { title: '💵 Configuration Budget', description: 'Définir le budget quotidien pour chaque campagne en divisant le budget mensuel total par 30, puis répartir selon priorités : 50-60% campagne Marque (ROI élevé), 30-40% campagne Générique, 10% Tests. Exemple : Budget mensuel 3000€ = 100€/jour → 60€ Marque, 30€ Générique, 10€ Tests. Google peut dépenser jusqu\'à 2x le budget quotidien certains jours (compense les jours faibles) mais ne dépassera jamais Budget quotidien × 30.4 sur le mois. Option budget partagé si plusieurs petites campagnes (Google alloue automatiquement). Planifier les jours/heures de diffusion : désactiver weekend si B2B, concentrer sur soirées si B2C.', assignee: 'marcus', phase: 'Production', estimated_hours: 0.5, category: 'configuration', order: 16, context_questions: ['Budget total mensuel ?', 'Répartition entre campagnes ?', 'Jours de diffusion ?'] },

  // LANCEMENT (Marcus) - 2 tâches
  { title: '✅ QA Check Pre-Launch', description: 'Checklist complète avant activation : 1) Tester chaque URL finale (clic manuel) → landing page charge rapidement (<3s), responsive mobile, formulaire fonctionne, 2) Relire toutes les annonces pour fautes d\'orthographe/grammaire (Google rejette les annonces avec erreurs), 3) Vérifier que le tracking conversion fonctionne (Google Tag Assistant, test achat/formulaire factice), 4) Confirmer que toutes les extensions sont approuvées, 5) Vérifier que les mots-clés négatifs sont appliqués, 6) Confirmer les budgets et moyens de paiement valides (carte non expirée), 7) S\'assurer que la campagne est sur "Paused" avant validation finale. Cocher une checklist Excel/Google Sheet.', assignee: 'marcus', phase: 'Production', estimated_hours: 1, category: 'launch', order: 17, context_questions: ['Landing pages testées ?', 'Tracking vérifié ?', 'Approbation obtenue ?'] },
  { title: '🚀 Mise en Ligne Campagnes', description: 'Activer les campagnes (passer de "Paused" à "Enabled") au moment optimal : généralement lundi matin 9h (B2B) ou dimanche soir (B2C e-commerce). Surveiller les 2 premières heures : 1) Vérifier que les annonces passent en "Eligible" (pas "Disapproved"), 2) Vérifier que les impressions commencent (si 0 impression après 1h, vérifier enchères trop basses ou ciblage trop restreint), 3) Vérifier les premières conversions dans Google Ads (délai 24-48h parfois). Configurer les alertes automatiques : baisse >50% impressions, hausse >100% CPC, conversions = 0 pendant 48h. Documenter l\'heure de lancement pour analyser les patterns de performance. Communiquer au client avec accès dashboard temps réel.', assignee: 'marcus', phase: 'Production', estimated_hours: 0.5, category: 'launch', order: 18, context_questions: ['Date/heure lancement ?', 'Budget initial ?', 'Notifications configurées ?'] },

  // OPTIMISATION (Sora + Marcus) - 3 tâches
  { title: '🔍 Analyse Termes de Recherche (J+3)', description: 'À partir de J+3, analyser quotidiennement le rapport "Termes de recherche" (Search Terms Report) pour voir les requêtes réelles qui ont déclenché vos annonces. Identifier les termes non pertinents (ex: vous vendez des chaussures de course et vous voyez "chaussures de sécurité") et les ajouter immédiatement en mots-clés négatifs. Identifier aussi les termes performants non encore ciblés (bon CTR, conversions) et les ajouter comme nouveaux mots-clés en Exacte. Seuil d\'action : exclure si >100 impressions et 0 conversion OU CTR <0.5%. Faire cet audit 1x/semaine (phase test) puis 1x/mois (phase mature). Automatiser avec règles automatiques si >50 mots-clés.', assignee: 'sora', phase: 'Optimization', estimated_hours: 1.5, category: 'optimization', order: 19, context_questions: ['Fréquence analyse ?', 'Seuil impressions pour exclure ?', 'Rapport automatique ?'] },
  { title: '⭐ Analyse Quality Score', description: 'Analyser le Quality Score (QS) de chaque mot-clé (1-10, objectif >7) car il impacte directement le CPC (QS élevé = CPC réduit) et la position d\'annonce. Le QS dépend de 3 facteurs : 1) Pertinence de l\'annonce (le mot-clé est-il dans le titre de l\'annonce ?), 2) Taux de clics attendu (basé sur historique), 3) Expérience de la page de destination (vitesse, mobile-friendly, contenu pertinent). Pour améliorer QS : regrouper mots-clés similaires dans même Ad Group, écrire annonces ultra-pertinentes avec mot-clé dans Titre 1, optimiser la landing page (ajouter le mot-clé dans H1, améliorer vitesse). Prioriser l\'optimisation des mots-clés à fort volume avec QS <5.', assignee: 'sora', phase: 'Optimization', estimated_hours: 2, category: 'optimization', order: 20, context_questions: ['QS actuel moyen ?', 'Pages à améliorer ?', 'Historique performances ?'] },
  { title: '📈 Ajustements Enchères', description: 'Affiner les enchères via les modificateurs (Bid Adjustments) selon performances par segment : 1) APPAREIL (Device) : si mobile convertit 30% moins, appliquer -30% sur mobile; si tablette ne convertit pas, -100%, 2) HORAIRE (Ad Schedule) : identifier les heures/jours performants (ex: 18h-22h en semaine) et augmenter +50%, diminuer -50% nuit/weekend, 3) DÉMOGRAPHIE (si données suffisantes) : ajuster par âge/genre (ex: 25-34 ans convertit mieux, +20%), 4) AUDIENCE (Remarketing) : +100% sur paniers abandonnés, -50% sur acheteurs récents (exclusion meilleure). Analyser avec minimum 100 conversions par segment avant d\'ajuster. Documenter tous les ajustements dans un changelog avec date et raison.', assignee: 'marcus', phase: 'Optimization', estimated_hours: 1.5, category: 'optimization', order: 21, context_questions: ['Performances par device ?', 'Heures de pointe ?', 'Ajustements démographiques ?'] },
];

// ═══════════════════════════════════════════════════════════════
// SEO TASKS (26 tâches)
// ═══════════════════════════════════════════════════════════════

export const SEO_TASKS: BaseTask[] = [
  // PRÉREQUIS (Sora) - 4 tâches
  { title: '🔑 Accès Google Search Console', description: 'Obtenir accès propriétaire/administrateur complet à Google Search Console pour le domaine. Vérifier la propriété du site (méthodes : balise HTML, Google Analytics, Google Tag Manager, DNS TXT, ou upload fichier HTML). Ajouter les autres utilisateurs nécessaires (client, équipe) avec les bons niveaux de permission (Propriétaire pour modifications, Utilisateur complet pour analyse). Vérifier que toutes les versions du domaine sont incluses : http/https, www/non-www, sous-domaines. Vérifier qu\'il n\'y a pas d\'erreurs critiques dans le rapport "Couverture" (pages indexées vs exclues).', assignee: 'sora', phase: 'Audit', estimated_hours: 0.5, category: 'prerequisites', order: 1, context_questions: ['Accès GSC existant ?', 'Propriété vérifiée ?', 'Utilisateurs à ajouter ?'] },
  { title: '📊 Accès Google Analytics (GA4)', description: 'Obtenir accès éditeur à Google Analytics 4 pour analyser le trafic organique, les conversions, et le comportement utilisateur. Vérifier que le tracking est correctement installé sur toutes les pages (aucune page orpheline). Configurer les événements de conversion pertinents pour SEO : soumission formulaire, achat, téléchargement, engagement. Analyser l\'historique : trafic organique des 6-12 derniers mois, pages d\'entrée principales, taux de rebond, durée session. Identifier les tendances saisonnières et pics de trafic pour planifier la stratégie SEO. Créer des segments personnalisés : trafic organique Google vs Bing, mobile vs desktop.', assignee: 'sora', phase: 'Audit', estimated_hours: 0.5, category: 'prerequisites', order: 2, context_questions: ['GA4 configuré ?', 'Conversions trackées ?', 'Données historiques ?'] },
  { title: '🔧 Accès CMS', description: 'Obtenir accès administrateur complet au CMS (WordPress, Shopify, Webflow, Wix, custom) pour pouvoir modifier : balises title/meta, URLs, contenu, structure Hn, images (Alt), redirections 301, fichiers sitemap/robots.txt, et plugins SEO. Pour WordPress : installer Yoast SEO ou Rank Math si absent. Pour Shopify : vérifier accès aux templates Liquid pour modifications avancées. Pour CMS custom : identifier le système de gestion de contenu et les limitations techniques. Documenter les limitations du CMS (certains CMS ont des contraintes SEO : URLs fixes, balises non modifiables, etc.) pour ajuster la stratégie en conséquence.', assignee: 'sora', phase: 'Audit', estimated_hours: 0.5, category: 'prerequisites', order: 3, context_questions: ['Quel CMS ?', 'Accès admin ?', 'Plugins SEO installés ?'] },
  { title: '🔍 Analyse Concurrents', description: 'Identifier les 3-5 concurrents directs qui rankent en position 1-5 sur Google pour les mots-clés stratégiques de votre secteur. Utiliser Google Search (recherches anonymes), Ahrefs, SEMrush, ou Ubersuggest pour analyser : 1) Mots-clés sur lesquels ils rankent (volume, difficulté), 2) Nombre de backlinks et qualité (DR/DA), 3) Structure du site (nombre de pages, profondeur, silo), 4) Contenu : longueur moyenne, types (blog, vidéo, infographies), fréquence publication, 5) Autorité domaine (DR Ahrefs, DA Moz). Identifier les "Content Gaps" : mots-clés où les concurrents rankent mais pas vous. Documenter leurs forces (à imiter) et faiblesses (opportunités).', assignee: 'luna', phase: 'Audit', estimated_hours: 2, category: 'prerequisites', order: 4, context_questions: ['Concurrents connus ?', 'Mots-clés communs ?', 'Gap à combler ?'] },

  // TECHNIQUE (Sora) - 6 tâches
  { title: '🕷️ Crawl Complet', description: 'Effectuer un crawl complet du site avec Screaming Frog SEO Spider, Sitebulb, ou Oncrawl (gratuit jusqu\'à 500 URLs avec Screaming Frog). Identifier toutes les erreurs techniques : 1) Erreurs 404 (pages cassées) → rediriger en 301 ou supprimer les liens pointant vers elles, 2) Erreurs 500 (serveur) → corriger immédiatement (empêche indexation), 3) Chaînes de redirections (A→B→C) → simplifier en A→C direct, 4) Pages orphelines (aucun lien interne pointant vers elles) → créer des liens, 5) Profondeur excessive (>4 clics depuis homepage) → améliorer l\'architecture. Exporter rapport Excel/CSV avec priorités : Critical > High > Medium > Low. Créer plan d\'action avec deadlines.', assignee: 'sora', phase: 'Audit', estimated_hours: 2, category: 'technical', order: 5, context_questions: ['Outil crawl préféré ?', 'Nombre pages estimé ?', 'Erreurs connues ?'] },
  { title: '⚡ Vitesse (Core Web Vitals)', description: 'Analyser la vitesse du site avec PageSpeed Insights et Google Search Console (rapport "Core Web Vitals"). Google utilise ces métriques comme facteur de ranking (Page Experience Update). Mesurer les 3 Core Web Vitals : 1) LCP (Largest Contentful Paint) < 2.5s (temps affichage contenu principal), 2) FID (First Input Delay) < 100ms (temps réactivité première interaction), 3) CLS (Cumulative Layout Shift) < 0.1 (stabilité visuelle, pas de décalages). Tester sur mobile ET desktop. Optimisations prioritaires : compresser images (WebP, lazy loading), minifier CSS/JS, activer cache navigateur, utiliser CDN (Cloudflare), éliminer ressources bloquantes render, optimiser serveur (passer de shared hosting à VPS si nécessaire). Objectif : score >90 mobile.', assignee: 'sora', phase: 'Audit', estimated_hours: 1.5, category: 'technical', order: 6, context_questions: ['Score actuel ?', 'Hébergement type ?', 'CDN en place ?'] },
  { title: '📱 Compatibilité Mobile', description: 'Vérifier que le site est 100% mobile-friendly car Google utilise le Mobile-First Indexing (version mobile = version principale pour indexation). Utiliser le Mobile-Friendly Test de Google et tester manuellement sur différents devices (iPhone, Android, tablettes). Points à vérifier : 1) Design responsive (s\'adapte à toutes les tailles d\'écran), 2) Texte lisible sans zoom (min 16px), 3) Boutons et liens cliquables (min 48x48px, espacement suffisant), 4) Pas de contenu horizontal scrollable (viewport bien configuré), 5) Formulaires utilisables sur mobile (champs larges, clavier adapté). Vérifier aussi que les pop-ups n\'envahissent pas l\'écran mobile (pénalité Google si interstitiel intrusif).', assignee: 'sora', phase: 'Audit', estimated_hours: 1, category: 'technical', order: 7, context_questions: ['Design responsive ?', 'Problèmes connus mobile ?', 'AMP utilisé ?'] },
  { title: '🔗 Structure URLs', description: 'Nettoyer et optimiser la structure des URLs pour lisibilité humaine ET moteurs de recherche. URLs SEO-friendly : courtes, descriptives, mot-clé inclus, tirets pour séparer (pas underscore), minuscules uniquement, pas de paramètres inutiles (?id=123). Exemple MAUVAIS : site.com/product.php?id=456&cat=12 → BIEN : site.com/chaussures-running-nike. Vérifier : 1) Absence de duplicate content (canonical tags en place pour versions multiples d\'une page), 2) Pas de paramètres tracking visibles (utiliser # ou UTM propres), 3) Structure logique hiérarchique (/categorie/sous-categorie/produit). Configurer les canonicals, éviter les URLs trop longues (max 75 caractères recommandé).', assignee: 'sora', phase: 'Setup', estimated_hours: 2, category: 'technical', order: 8, context_questions: ['Structure actuelle ?', 'Paramètres à nettoyer ?', 'Canonicals en place ?'] },
  { title: '🗺️ Sitemap & Robots.txt', description: 'Vérifier présence et validité du sitemap XML (sitemap.xml) : il doit lister toutes les URLs importantes à indexer (pages produits, articles blog, pages services) SANS les URLs inutiles (admin, login, pages privées). Format : <url><loc>https://site.com/page</loc><lastmod>2024-01-15</lastmod><priority>0.8</priority></url>. Soumettre le sitemap dans Google Search Console et Bing Webmaster Tools. Vérifier robots.txt (site.com/robots.txt) : il ne doit PAS bloquer les pages importantes (vérifier avec GSC > URL Inspection), doit bloquer les pages admin/privées, et doit référencer le sitemap. Exemple : User-agent: * / Disallow: /admin/ / Allow: / / Sitemap: https://site.com/sitemap.xml', assignee: 'sora', phase: 'Setup', estimated_hours: 1, category: 'technical', order: 9, context_questions: ['Sitemap existant ?', 'Pages à exclure ?', 'Robots.txt correct ?'] },
  { title: '🔒 Sécurité SSL', description: 'Vérifier que le site est 100% en HTTPS (certificat SSL actif) car Google favorise les sites sécurisés et Chrome affiche "Non sécurisé" pour HTTP. Vérifications : 1) Certificat SSL valide (pas expiré), 2) Toutes les pages en HTTPS (pas de pages HTTP restantes), 3) Redirections 301 automatiques de HTTP vers HTTPS, 4) Pas de "Contenu Mixte" (images/CSS/JS chargés en HTTP sur page HTTPS = casse le cadenas), 5) Mise à jour des liens internes vers HTTPS, 6) Mise à jour sitemap et canonicals en HTTPS. Tester avec SSL Labs (test SSLLabs.com) pour score A+. Si certificat manquant : installer Let\'s Encrypt (gratuit) via hébergeur.', assignee: 'sora', phase: 'Setup', estimated_hours: 0.5, category: 'technical', order: 10, context_questions: ['HTTPS actif ?', 'Redirections HTTP→HTTPS ?', 'Contenu mixte ?'] },

  // SÉMANTIQUE (Luna) - 4 tâches
  { title: '📋 Audit Existant', description: 'Avant de modifier quoi que ce soit, auditer l\'existant pour identifier les pages qui performent déjà organiquement (NE PAS Y TOUCHER sauf amélioration mineure). Utiliser GSC rapport "Performances" et GA4 pour lister : 1) Pages avec trafic organique >100 visiteurs/mois, 2) Pages positionnées en position 1-10 sur mots-clés stratégiques, 3) Pages avec taux de conversion élevé. Documenter dans Excel : URL, mot-clé principal, position actuelle, trafic mensuel, conversions. Ces pages sont votre capital SEO actuel : les préserver, ne pas casser les URLs (si refonte), ne pas modifier radicalement le contenu (risque perte de ranking). Identifier aussi les pages en position 11-20 (page 2 Google) = opportunités d\'optimisation rapide pour monter en page 1.', assignee: 'luna', phase: 'Audit', estimated_hours: 2, category: 'semantic', order: 11, context_questions: ['Pages performantes ?', 'Mots-clés positionnés ?', 'Traffic organique actuel ?'] },
  { title: '🔑 Keyword Research', description: 'Recherche de 100-300 mots-clés cibles segmentés par intention de recherche : 1) TRANSACTIONNELS (achat immédiat : "acheter X", "X pas cher", "livraison X") = forte conversion mais forte concurrence, 2) INFORMATIONNELS (recherche info : "comment faire X", "meilleur X", "guide X") = volume élevé mais conversion indirecte, 3) NAVIGATIONNELS (recherche marque/site : "marque X", "X login"). Utiliser Google Keyword Planner, Ubersuggest, AnswerThePublic. Pour chaque mot-clé noter : volume mensuel, difficulté SEO (facile <30, moyen 30-60, difficile >60), CPC (indicateur valeur commerciale). Prioriser long-tail (3-5 mots) : moins de concurrence, meilleur taux conversion. Ex: "chaussures running femme Nike rose" vs "chaussures".', assignee: 'luna', phase: 'Audit', estimated_hours: 4, category: 'semantic', order: 12, context_questions: ['Intentions prioritaires ?', 'Volume recherche cible ?', 'Difficulté acceptable ?'] },
  { title: '📊 Gap Analysis', description: 'Identifier les "Content Gaps" = mots-clés/thématiques où les concurrents rankent mais pas vous (= opportunités). Utiliser Ahrefs Content Gap, SEMrush Keyword Gap, ou manuellement : prendre les top 3 concurrents, exporter leurs mots-clés (via SEMrush), filtrer ceux où VOUS ne rankez pas. Segmenter les opportunités : 1) Quick Wins (faible difficulté, volume moyen, concurrent faible) = créer contenu rapidement, 2) Long-term (haute difficulté, fort volume) = investissement lourd, stratégie backlinks nécessaire. Identifier aussi les thématiques manquantes : si concurrents ont tous une section "Blog" ou "Guides" et vous non, c\'est un gap structurel. Créer roadmap de contenu priorisé : Q1, Q2, Q3, Q4.', assignee: 'luna', phase: 'Audit', estimated_hours: 3, category: 'semantic', order: 13, context_questions: ['Concurrents analysés ?', 'Thématiques manquantes ?', 'Quick wins identifiés ?'] },
  { title: '🗂️ Mapping Sémantique', description: 'Créer le mapping 1 PAGE = 1 MOT-CLÉ PRINCIPAL pour éviter la cannibalisation (plusieurs pages qui se battent pour le même mot-clé = aucune ne rank bien). Excel/Google Sheet avec colonnes : URL (existante ou à créer), Mot-clé principal, Mots-clés secondaires (3-5), Intention (transactionnel/informationnel), Priority (High/Medium/Low), Status (Existing/ToCreate/ToOptimize). Règles : 1) Une seule page par mot-clé principal exact, 2) Regrouper les variantes proches sur même page (ex: "chaussures running" et "running shoes" = même page), 3) Créer des pages séparées si intentions différentes ("acheter chaussures running" vs "comment choisir chaussures running"). Prévoir l\'architecture : pages piliers (larges) + pages satellites (niches) reliées par maillage interne.', assignee: 'luna', phase: 'Setup', estimated_hours: 3, category: 'semantic', order: 14, context_questions: ['Pages existantes ?', 'Pages à créer ?', 'Cannibalisation à éviter ?'] },

  // ON-PAGE (Milo) - 6 tâches
  { title: '🏷️ Optimisation Balises Title', description: 'Rédiger des balises <title> optimisées SEO pour chaque page : 1) UNIQUE (pas de duplicate), 2) Mot-clé principal au début (premiers mots = plus de poids), 3) MAX 60 caractères (sinon tronqué dans Google), 4) Inclure marque en suffix si espace (ex: "Chaussures Running Nike - MarqueX"), 5) Incitatif (donne envie de cliquer). Formule gagnante : [Mot-clé] - [Bénéfice/Modificateur] | [Marque]. Exemples : "Chaussures Running Femme - Livraison 24h | NikePro", "Guide Complet SEO 2024 - 50+ Astuces | BlogSEO". Éviter : keyword stuffing (répétition excessive), mots vides ("le", "la", "de"), caractères spéciaux superflus. Tester le rendu avec SERP Snippet Preview Tool. Priorité : homepage, pages catégories, top 20 pages trafic.', assignee: 'milo', phase: 'Production', estimated_hours: 3, category: 'onpage', order: 15, context_questions: ['Nombre de pages ?', 'Templates existants ?', 'Marque en suffix ?'] },
  { title: '📝 Optimisation Méta Descriptions', description: 'Rédiger des méta descriptions optimisées pour chaque page : 1) MAX 155 caractères (tronqué sinon), 2) Résumé clair de la page, 3) Inclure mot-clé principal (Google le met en gras dans les résultats), 4) Call-to-Action explicite ("Découvrez", "Commandez", "Téléchargez"), 5) USP/bénéfice unique. La méta description N\'impacte PAS le ranking MAIS impacte le CTR (taux de clic) = indirect impact sur SEO. Formule : [Résumé 1 phrase] + [Bénéfice/USP] + [CTA]. Exemple : "Découvrez notre gamme de chaussures running femme avec livraison gratuite 24h. Plus de 500 modèles Nike, Adidas, Asics. Commandez maintenant !" Éviter : duplicate, trop générique ("Bienvenue sur notre site"), promesses non tenues. Inclure émojis si approprié (e-commerce : ✓ Livraison gratuite).', assignee: 'milo', phase: 'Production', estimated_hours: 3, category: 'onpage', order: 16, context_questions: ['CTAs préférés ?', 'Ton de marque ?', 'USP à inclure ?'] },
  { title: '📑 Structure Hn', description: 'Optimiser la hiérarchie des titres (balises Hn) sur chaque page : 1) UN SEUL H1 par page = titre principal incluant mot-clé, 2) H2 pour sections principales (3-6 par page), 3) H3 pour sous-sections sous chaque H2, 4) H4-H6 rarement utilisés. Structure logique : H1 > H2 > H3 (pas de saut : H1 > H3 sans H2). Le H1 doit être différent du Title (Title = pour SERP, H1 = pour utilisateur sur page). Exemple structure article blog : H1 "Guide Complet Chaussures Running 2024" > H2 "Comment choisir" > H3 "Critères terrain", H3 "Critères morphologie" > H2 "Top 10 modèles" > H3 "Nike Pegasus", H3 "Adidas Boost". Inclure mots-clés secondaires dans H2/H3 naturellement.', assignee: 'milo', phase: 'Production', estimated_hours: 2, category: 'onpage', order: 17, context_questions: ['Structure actuelle ?', 'Templates page ?', 'Problèmes Hn connus ?'] },
  { title: '📄 Contenu & Densité', description: 'Rédiger/optimiser le contenu textuel des pages stratégiques avec focus sur QUALITÉ > quantité : 1) Répondre COMPLÈTEMENT à l\'intention de recherche (si user cherche "comment choisir X", donner guide exhaustif, pas juste vendre), 2) Longueur : minimum 300 mots (pages produits), 800-1500 mots (pages catégories), 1500-3000 mots (articles blog/guides), 3) Champ sémantique riche = utiliser synonymes et termes connexes (Google comprend le contexte), 4) Intégrer FAQ (souvent rankée en Featured Snippet), 5) Structurer : paragraphes courts (3-4 lignes), bullet points, sous-titres fréquents, 6) Inclure média : images, vidéos, tableaux (temps sur page ↑). Densité mot-clé : 1-2% (naturel, pas de bourrage). Analyser les top 3 Google pour voir niveau de détail attendu. Utiliser Clearscope ou SurferSEO pour optimisation sémantique.', assignee: 'milo', phase: 'Production', estimated_hours: 6, category: 'onpage', order: 18, context_questions: ['Longueur cible ?', 'Sujets à couvrir ?', 'FAQ à intégrer ?'] },
  { title: '🖼️ Optimisation Images', description: 'Optimiser toutes les images du site pour SEO et vitesse : 1) BALISE ALT descriptive incluant mot-clé si pertinent (ex: alt="chaussures-running-nike-pegasus-rose" pas alt="image123"), 2) Nom fichier descriptif (chaussures-running.jpg pas IMG_0001.jpg), 3) Compression SANS perte de qualité (TinyPNG, ShortPixel, ou Squoosh), 4) Format moderne WebP (70% plus léger que JPEG, supporté par 95%+ navigateurs, fallback JPEG pour vieux navigateurs), 5) Lazy loading (images chargées seulement si visibles = améliore LCP), 6) Dimensions appropriées (pas d\'image 3000px affichée en 300px), 7) CDN pour servir images (Cloudflare, Imgix). Priorité : images above-the-fold (visibles sans scroll), puis reste. Objectif : toutes images <200KB idéalement <100KB.', assignee: 'milo', phase: 'Production', estimated_hours: 2, category: 'onpage', order: 19, context_questions: ['Nombre images ?', 'Format actuel ?', 'CDN images ?'] },
  { title: '🔗 Maillage Interne', description: 'Créer un maillage interne (internal linking) stratégique pour distribuer le "jus SEO" (PageRank) vers les pages importantes et guider Googlebot : 1) Identifier pages PILIERS (haute autorité, fort trafic) et pages à pousser (nouvelles, faible ranking), 2) Créer liens contextuels (dans le contenu, pas footer/sidebar) des pages piliers vers pages à pousser avec ANCRES optimisées (texte cliquable = mot-clé cible, pas "cliquez ici"), 3) Règle 3-5 liens internes pertinents par page, 4) Éviter liens orphelins (pages sans aucun lien interne pointant vers elles), 5) Créer silos thématiques : pages d\'un même thème se linkent entre elles. Exemple : Article "Guide Chaussures Running" link vers "Top 10 Nike", "Top 10 Adidas", "Comment choisir pointure". Utiliser Screaming Frog pour visualiser structure de liens. Objectif : aucune page à >3 clics de la homepage.', assignee: 'milo', phase: 'Production', estimated_hours: 3, category: 'onpage', order: 20, context_questions: ['Pages piliers ?', 'Ancres à utiliser ?', 'Profondeur site ?'] },

  // MIGRATION (Sora) - 3 tâches (si applicable)
  { title: '📋 Mapping Redirections 301', description: 'Si refonte de site ou changement d\'URLs, créer un mapping exhaustif ANCIENNE URL → NOUVELLE URL pour éviter les erreurs 404 (perte de ranking et trafic). Excel/CSV avec colonnes : Old URL, New URL, Status Code (301), Priority (High/Medium/Low selon trafic), Notes. Exporter toutes les anciennes URLs depuis GSC + sitemap ancien site. Pour chaque ancienne URL : 1) Identifier nouvelle URL équivalente (même contenu/thématique), 2) Si pas d\'équivalent exact, rediriger vers page parent (ex: ancien produit discontinué → catégorie produits), 3) Homepage en dernier recours uniquement. JAMAIS de redirection 302 (temporaire) = utiliser 301 (permanente) pour transférer le jus SEO. Prioriser les URLs avec backlinks (vérifier dans Ahrefs/SEMrush) et fort trafic organique. Prévoir 2-4 semaines pour mapping complet si >1000 URLs.', assignee: 'sora', phase: 'Setup', estimated_hours: 4, category: 'migration', order: 21, context_questions: ['Nombre URLs à migrer ?', 'Structure nouvelle ?', 'Priorités redirection ?'] },
  { title: '⚙️ Implémentation Redirections', description: 'Implémenter les redirections 301 selon la stack technique : 1) Apache : fichier .htaccess à la racine (Redirect 301 /ancienne-page https://site.com/nouvelle-page), 2) Nginx : fichier de config (rewrite ^/ancienne-page$ /nouvelle-page permanent;), 3) WordPress : plugin Redirection (UI simple, gestion redirections + logs 404), 4) Shopify/Webflow : via interface admin. Pour >100 redirections : utiliser wildcards/regex (ex: anciennes URLs /blog/2023/* → /articles/*). TESTER chaque redirection avant mise en prod : 1) Vérifier code 301 (pas 302), 2) Vérifier destination correcte, 3) Pas de chaînes (A→B→C, simplifier en A→C). Garder backup du fichier de redirections. Documenter pour équipe (qui, quand, pourquoi).', assignee: 'sora', phase: 'Setup', estimated_hours: 2, category: 'migration', order: 22, context_questions: ['Méthode (htaccess, plugin) ?', 'Accès serveur ?', 'Test staging ?'] },
  { title: '✅ Vérification Post-Mise en ligne', description: 'IMMÉDIATEMENT après mise en ligne du nouveau site, vérifier que ZÉRO erreur 404 : 1) Crawler le site avec Screaming Frog (toutes URLs), 2) Vérifier dans GSC section "Couverture" (erreurs 404 remontent après 24-48h), 3) Monitorer Google Analytics : baisse trafic organique > 20% = problème critique. Checklist 48h post-migration : ancien sitemap soumis à GSC avec mention "site migré", redirections testées manuellement (top 50 pages), backlinks principaux vérifiés (pointent vers nouvelles URLs ou redirigés), robots.txt/sitemap à jour, canonicals corrects. Configurer alertes GSC pour erreurs 404. Prévoir rollback rapide (restauration backup) si perte trafic >50% après 7 jours. Suivre positions mots-clés quotidiennement pendant 1 mois (fluctuations normales ±10 positions, stabilisation sous 1-2 mois).', assignee: 'sora', phase: 'Setup', estimated_hours: 2, category: 'migration', order: 23, context_questions: ['Crawl automatisé ?', 'Alertes configurées ?', 'Rollback prévu ?'] },

  // OFF-PAGE (Luna + Marcus) - 3 tâches
  { title: '🔗 Audit Backlinks', description: 'Auditer le profil de backlinks (liens entrants) du site avec Ahrefs, Majestic, ou Moz : 1) Nombre total de backlinks et domaines référents (plus de domaines différents = mieux que beaucoup de liens d\'un seul domaine), 2) Autorité (Domain Rating Ahrefs, Domain Authority Moz) des sites linkant, 3) Ancres utilisées (doivent être naturelles, variées, pas 100% exact-match keyword = suspect), 4) IDENTIFIER LIENS TOXIQUES : domaines spam (DR <10, contenu adult/pharma/casino), ancres sur-optimisées, liens de fermes de liens. Si historique pénalité Google ou baisse ranking inexpliquée : créer fichier disavow (disavow.txt) listant domaines toxiques et le soumettre via GSC (domain:sitetoxique.com). Attention : désavouer uniquement si certain = risque de supprimer bons liens. Focus : nettoyer les liens toxiques AVANT de lancer campagne netlinking (sinon nouveau bon lien dilué par toxiques).', assignee: 'luna', phase: 'Audit', estimated_hours: 2, category: 'offpage', order: 24, context_questions: ['Outil backlinks ?', 'Historique pénalités ?', 'Concurrents backlinks ?'] },
  { title: '📍 Google Business Profile', description: 'Optimiser la fiche Google Business Profile (ex-Google My Business) pour SEO local et visibilité dans Maps/Local Pack : 1) Revendiquer/vérifier la fiche si pas fait (carte postale, téléphone, email), 2) NAP cohérent (Name, Address, Phone identiques PARTOUT web : site, annuaires, réseaux sociaux), 3) Catégorie principale précise (ex: "Magasin de chaussures" pas "Commerce de détail"), 4) Description optimisée (750 caractères) avec mots-clés locaux, 5) Heures d\'ouverture à jour, 6) PHOTOS récentes et de qualité (minimum 10 : devanture, intérieur, produits, équipe), 7) Récolter AVIS CLIENTS (demander après achat, QR code, email follow-up) et RÉPONDRE à tous les avis (même négatifs, avec professionnalisme), 8) Publier Posts régulièrement (offres, actualités). Objectif : >20 avis 4+ étoiles, photos fraîches mensuellement.', assignee: 'marcus', phase: 'Setup', estimated_hours: 1.5, category: 'offpage', order: 25, context_questions: ['Fiche existante ?', 'Avis clients ?', 'Photos à jour ?'] },
  { title: '🔗 Campagne Netlinking', description: 'Acquérir des backlinks de qualité (liens entrants depuis sites à forte autorité) pour augmenter le Domain Rating et ranking : Stratégies White Hat (légales, durables) : 1) GUEST POSTING = écrire articles invités sur blogs thématiques en échange d\'un lien (coût 50-500€/lien selon DR site), 2) DIGITAL PR = obtenir mentions presse (communiqués, HARO - Help A Reporter Out), 3) CRÉATION CONTENU LINKABLE = infographies, études/statistiques originales, outils gratuits (naturellement linkés), 4) BROKEN LINK BUILDING = trouver liens cassés sur sites cibles, proposer votre contenu en remplacement, 5) PARTENARIATS = échanges de liens avec partenaires non-concurrents (modération requise). Budget indicatif : 500-2000€/mois pour 5-20 liens DR50+. Critères qualité backlink : DR >30, thématiquement pertinent, trafic organique >1000/mois, pas de spam. Éviter : achats massifs liens low-quality, PBN (Private Blog Networks), échange excessif de liens réciproques. Objectif : +10-30 domaines référents/trimestre.', assignee: 'luna', phase: 'Optimization', estimated_hours: 5, category: 'offpage', order: 26, context_questions: ['Budget netlinking ?', 'Sites cibles ?', 'Stratégie (guest post, PR) ?'] },
];

// ═══════════════════════════════════════════════════════════════
// SOCIAL MEDIA TASKS (15 tâches) - DOFFY
// ═══════════════════════════════════════════════════════════════

export const SOCIAL_MEDIA_TASKS: BaseTask[] = [
  // ═══ AUDIT PHASE (4 tâches) ═══

  {
    title: '📱 Audit Présence Social Media Actuelle',
    description: 'Analyser l\'état actuel de la présence sur les réseaux sociaux : 1) Audit de chaque compte (followers, taux engagement, fréquence publication, types de contenu qui performent), 2) Analyse du tone of voice actuel vs objectifs marque, 3) Identification des top posts des 3 derniers mois (engagement rate, reach, saves/shares), 4) Benchmark vs 3 concurrents directs (fréquence, formats, hashtags, heures de publication), 5) Analyse de l\'audience actuelle (demographics, heures actives, intérêts). Livrable : rapport d\'audit avec scores par plateforme et recommandations.',
    assignee: 'doffy',
    phase: 'Audit',
    estimated_hours: 2,
    category: 'strategy',
    order: 1,
    context_questions: [
      'Quels sont vos comptes social media actuels (URLs) ?',
      'Quel est votre taux d\'engagement actuel ?',
      'Quels types de posts fonctionnent le mieux ?',
    ],
  },
  {
    title: '🎯 Définition Stratégie & Objectifs Social Media',
    description: 'Définir la stratégie social media alignée avec les objectifs business : 1) Objectifs SMART par plateforme (croissance followers, engagement rate cible, leads générés, trafic site), 2) Choix des plateformes prioritaires selon audience et ressources, 3) Définition des piliers de contenu (3-5 thèmes récurrents), 4) Fréquence de publication par plateforme, 5) KPIs de suivi (engagement rate > X%, reach growth, conversion rate), 6) Budget temps et ressources nécessaires. Livrable : document stratégie avec objectifs chiffrés.',
    assignee: 'doffy',
    phase: 'Audit',
    estimated_hours: 2,
    category: 'strategy',
    order: 2,
    context_questions: [
      'Quel est votre objectif business principal ?',
      'Combien de temps par semaine pouvez-vous consacrer aux réseaux ?',
      'Avez-vous un budget pub social media ?',
    ],
  },
  {
    title: '🔍 Analyse Concurrents & Benchmark Social',
    description: 'Étude approfondie de la stratégie social media des 3 concurrents directs : 1) Analyse par plateforme (types de contenu, fréquence, engagement, croissance), 2) Identification des formats qui performent (carrousels vs vidéos vs images vs texte seul), 3) Analyse des hashtags utilisés et leur performance, 4) Horaires de publication et calendrier éditorial identifié, 5) Tone of voice et style visuel, 6) Points forts à reproduire et faiblesses à exploiter. Livrable : matrice concurrentielle avec opportunités.',
    assignee: 'doffy',
    phase: 'Audit',
    estimated_hours: 1.5,
    category: 'strategy',
    order: 3,
    context_questions: [
      'Quels sont vos 3 concurrents sur les réseaux ?',
      'Sur quelles plateformes sont-ils les plus actifs ?',
      'Qu\'admirez-vous dans leur stratégie social ?',
    ],
  },
  {
    title: '👤 Définition Audiences & Personas par Plateforme',
    description: 'Créer des personas détaillés par plateforme pour adapter le contenu : 1) LinkedIn : profil professionnel (poste, secteur, challenges), 2) Instagram : profil lifestyle (intérêts, esthétique, comportement), 3) Twitter/X : profil engagement (sujets de discussion, influenceurs suivis), 4) TikTok : profil découverte (trends, format préféré, durée attention), 5) Facebook : profil communauté (groupes, événements, partage). Pour chaque persona : demographics, pain points, contenus qui résonnent, CTA qui convertissent. Livrable : fiches personas par plateforme.',
    assignee: 'doffy',
    phase: 'Audit',
    estimated_hours: 1.5,
    category: 'strategy',
    order: 4,
    context_questions: [
      'Qui est votre client idéal (âge, profession, intérêts) ?',
      'Sur quelle plateforme votre audience est-elle la plus active ?',
      'Quel type de contenu consomme votre audience ?',
    ],
  },

  // ═══ SETUP PHASE (4 tâches) ═══

  {
    title: '🔗 Connexion Comptes Réseaux Sociaux',
    description: 'Connecter tous les comptes social media via OAuth pour permettre la publication automatisée : 1) LinkedIn : connexion compte entreprise (Company Page admin), 2) Instagram : connexion compte professionnel via Meta Business Suite, 3) Twitter/X : connexion compte via API v2, 4) TikTok : connexion compte Business via TikTok for Business, 5) Facebook : connexion Page Facebook. Pour chaque plateforme : autoriser les permissions de publication, vérifier le statut de connexion, tester un brouillon de post. Livrable : tous les comptes connectés et fonctionnels.',
    assignee: 'doffy',
    phase: 'Setup',
    estimated_hours: 1,
    category: 'configuration',
    order: 5,
    context_questions: [
      'Avez-vous les accès admin sur tous vos comptes ?',
      'Quels comptes devons-nous connecter en priorité ?',
      'Business Manager Meta est-il configuré ?',
    ],
  },
  {
    title: '📋 Création Calendrier Éditorial Mensuel',
    description: 'Créer un calendrier éditorial détaillé pour le premier mois : 1) Répartition par plateforme selon stratégie (ex: 5 posts LinkedIn/sem, 7 posts Insta/sem, 3 tweets/jour, 3 TikTok/sem), 2) Thèmes hebdomadaires alignés avec les piliers de contenu, 3) Mix de formats (40% image, 30% vidéo/reel, 20% carrousel, 10% texte seul), 4) Horaires optimaux par plateforme (basés sur analyse audience), 5) Intégration des marronniers (événements sectoriels, fêtes, actualités), 6) Buffer pour contenu réactif/actualité. Livrable : calendrier interactif CONTENT_CALENDAR avec tous les posts planifiés.',
    assignee: 'doffy',
    phase: 'Setup',
    estimated_hours: 3,
    category: 'planning',
    order: 6,
    context_questions: [
      'Combien de posts par semaine visez-vous ?',
      'Y a-t-il des événements importants ce mois-ci ?',
      'Avez-vous des thèmes de contenu préférés ?',
    ],
  },
  {
    title: '🎨 Création Templates & Assets Visuels',
    description: 'Produire les templates visuels et assets créatifs pour tous les formats social media : 1) Templates feed Instagram (1080x1080, 1080x1350), 2) Templates Stories/Reels (1080x1920), 3) Templates LinkedIn (1200x627 pour articles, 1080x1080 pour posts), 4) Palette couleurs et typo brand-ready, 5) Pack icônes et éléments graphiques récurrents, 6) Bannières et couvertures de profil par plateforme. Collaboration directe avec les outils de génération d\'image. Livrable : pack complet de templates prêts à l\'emploi.',
    assignee: 'milo',
    phase: 'Setup',
    estimated_hours: 4,
    category: 'creative',
    order: 7,
    context_questions: [
      'Avez-vous une charte graphique / brand guidelines ?',
      'Quelles couleurs et polices représentent votre marque ?',
      'Quel style visuel préférez-vous (photos, illustrations, mixte) ?',
    ],
  },
  {
    title: '✍️ Définition Piliers & Templates de Copywriting',
    description: 'Créer les fondations du copywriting social media : 1) Définir 3-5 piliers de contenu (ex: expertise, behind-the-scenes, témoignages, éducation, promotion), 2) Templates de post par pilier et par plateforme (hook, corps, CTA, hashtags), 3) Bank de hooks (accroches) testées et validées, 4) Ton de voix par plateforme (LinkedIn=expert, Insta=inspirant, TikTok=authentique), 5) Bibliothèque de hashtags par catégorie (brand, niche, trending, local), 6) CTA adaptés par objectif (engagement, trafic, conversion). Livrable : guide copywriting social media complet.',
    assignee: 'doffy',
    phase: 'Setup',
    estimated_hours: 2,
    category: 'planning',
    order: 8,
    context_questions: [
      'Quel ton utilisez-vous actuellement ?',
      'Quels sujets maîtrisez-vous le mieux ?',
      'Avez-vous des expressions ou tournures signatures ?',
    ],
  },

  // ═══ PRODUCTION PHASE (4 tâches) ═══

  {
    title: '📝 Rédaction Batch de Posts (Semaine 1)',
    description: 'Rédiger l\'ensemble des posts de la première semaine selon le calendrier éditorial : 1) Posts LinkedIn (articles courts, insights expertise, cas clients), 2) Posts Instagram (captions engageantes, hashtags recherchés, CTA stories), 3) Tweets/threads (contenu concis, punchlines, sondages), 4) Scripts TikTok (hooks 3 secondes, storytelling court, tendances), 5) Posts Facebook (communauté, partage, événements). Pour chaque post : texte + hashtags + CTA + timing recommandé + format media nécessaire. Adapter le même message fondamental en 5 versions plateforme-specific. Livrable : batch complet de posts prêts à publier.',
    assignee: 'doffy',
    phase: 'Production',
    estimated_hours: 3,
    category: 'content',
    order: 9,
    context_questions: [
      'Avez-vous des messages clés à communiquer cette semaine ?',
      'Y a-t-il des actualités à intégrer ?',
      'Préférez-vous un ton plus formel ou décontracté ?',
    ],
  },
  {
    title: '🎬 Production Vidéos Courtes (Reels/TikTok/Stories)',
    description: 'Produire les vidéos courtes pour les plateformes visuelles : 1) Reels Instagram (15-60s, 9:16, hooks visuels forts, texte overlay), 2) Vidéos TikTok (trends actuels, sons populaires, format authentique), 3) Stories animées (templates dynamiques, sondages, Q&A), 4) Shorts YouTube si pertinent. Pour chaque vidéo : script détaillé, storyboard, musique/son recommandé, texte overlay, CTA fin. Utiliser la génération vidéo IA pour les contenus automatisables (animations, motion graphics). Livrable : pack vidéos prêtes à publier.',
    assignee: 'milo',
    phase: 'Production',
    estimated_hours: 4,
    category: 'creative',
    order: 10,
    context_questions: [
      'Avez-vous du contenu vidéo brut (behind the scenes, produit) ?',
      'Quels types de vidéos fonctionnent dans votre secteur ?',
      'Souhaitez-vous des voix off sur les vidéos ?',
    ],
  },
  {
    title: '📅 Programmation & Scheduling des Posts',
    description: 'Programmer tous les posts de la semaine 1 aux horaires optimaux : 1) Utiliser les meilleurs horaires identifiés par l\'analyse d\'audience, 2) Espacement stratégique entre les posts (pas de spam, rythme régulier), 3) Programmer les posts cross-plateforme avec adaptation automatique (même message, format différent), 4) Configurer les rappels pour le contenu temps-réel (stories, lives), 5) Vérifier chaque post programmé (preview, liens, hashtags, media). Livrable : semaine 1 entièrement programmée avec preview de chaque post.',
    assignee: 'doffy',
    phase: 'Production',
    estimated_hours: 1,
    category: 'scheduling',
    order: 11,
    context_questions: [
      'Fuseau horaire de votre audience principale ?',
      'Préférez-vous publier le matin ou le soir ?',
      'Y a-t-il des jours à éviter (week-end ?) ?',
    ],
  },
  {
    title: '🚀 Publication & Lancement Social Media',
    description: 'Lancer la stratégie social media et publier les premiers posts : 1) Vérification finale de tous les posts programmés (orthographe, liens, media, hashtags), 2) Publication du premier post sur chaque plateforme, 3) Vérification que tous les posts sont en ligne et bien formatés, 4) Engagement initial (répondre aux premiers commentaires, liker les réponses), 5) Notification à l\'équipe que la stratégie est lancée. Livrable : tous les comptes actifs avec les premiers posts publiés.',
    assignee: 'doffy',
    phase: 'Production',
    estimated_hours: 0.5,
    category: 'launch',
    order: 12,
    context_questions: [
      'Prêt à lancer ? Validation finale des contenus ?',
      'Quelqu\'un gère les commentaires en interne ?',
      'Alertes en cas de message sensible ?',
    ],
  },

  // ═══ OPTIMIZATION PHASE (3 tâches) ═══

  {
    title: '📊 Analyse Performance & Engagement Semaine 1',
    description: 'Analyser les métriques de la première semaine pour identifier ce qui fonctionne : 1) KPIs par plateforme (impressions, reach, engagement rate, followers gained, link clicks), 2) Top 3 posts par engagement (analyser pourquoi ils ont performé), 3) Bottom 3 posts (comprendre ce qui n\'a pas marché), 4) Analyse des horaires (quels créneaux ont généré le plus d\'engagement), 5) Analyse des formats (vidéo vs image vs texte vs carrousel), 6) Comparaison avec benchmark initial. Livrable : dashboard SOCIAL_ANALYTICS avec métriques et insights.',
    assignee: 'doffy',
    phase: 'Optimization',
    estimated_hours: 2,
    category: 'analytics',
    order: 13,
    context_questions: [
      'Quels KPIs sont les plus importants pour vous ?',
      'Objectif de croissance followers cette semaine ?',
      'Souhaitez-vous un rapport détaillé ou synthétique ?',
    ],
  },
  {
    title: '🔄 Optimisation Contenu & Horaires de Publication',
    description: 'Ajuster la stratégie basée sur les données de la semaine 1 : 1) Doubler les formats qui performent (plus de carrousels si haut engagement, plus de reels si bonne reach), 2) Ajuster les horaires de publication (décaler vers les créneaux à meilleur engagement), 3) Affiner les hashtags (supprimer ceux sans impact, tester de nouveaux), 4) Adapter le ton si nécessaire (plus informel si l\'audience réagit mieux), 5) Planifier du contenu A/B test pour la semaine 2 (2 versions du même post), 6) Mettre à jour le calendrier éditorial avec les learnings. Livrable : calendrier semaine 2 optimisé.',
    assignee: 'doffy',
    phase: 'Optimization',
    estimated_hours: 1.5,
    category: 'optimization',
    order: 14,
    context_questions: [
      'Quels changements souhaitez-vous tester ?',
      'Budget pour boost de posts organiques ?',
      'Feedbacks de votre audience à intégrer ?',
    ],
  },
  {
    title: '📈 Rapport Social Media & Recommandations',
    description: 'Produire le rapport de performance complet avec recommandations stratégiques : 1) Résumé exécutif (3-5 KPIs clés avec évolution), 2) Performance par plateforme (tableau comparatif), 3) Meilleurs posts du mois (top 5 par engagement), 4) Croissance audience (graphique évolution followers), 5) Recommandations pour le mois suivant (formats à privilégier, nouveaux piliers, tendances à surfer), 6) Si pertinent : recommandation à Marcus pour booster les top posts en pub payante. Livrable : rapport PDF complet + recommandations actionnables.',
    assignee: 'doffy',
    phase: 'Optimization',
    estimated_hours: 1.5,
    category: 'reporting',
    order: 15,
    context_questions: [
      'À qui est destiné ce rapport ?',
      'Format préféré (PDF, dashboard live) ?',
      'Fréquence souhaitée des rapports ?',
    ],
  },
];

// ═══════════════════════════════════════════════════════════════
// ANALYTICS TASKS (21 tâches)
// ═══════════════════════════════════════════════════════════════

export const ANALYTICS_TASKS: BaseTask[] = [
  // FONDATION (Sora) - 4 tâches
  { title: '📦 Création Compte GTM', description: 'Créer un compte Google Tag Manager (GTM) et un Conteneur Web : 1) Aller sur tagmanager.google.com, créer compte + conteneur (type: Web), 2) GTM génère 2 snippets de code (Head et Body), les installer sur TOUTES les pages du site (idéalement via CMS global header/footer ou theme template), 3) Vérifier installation avec GTM Preview Mode (bouton "Preview" dans GTM = ouvre le site en mode debug). GTM remplace l\'installation directe de pixels/tags = tous les tags (GA4, Meta Pixel, Google Ads, TikTok...) seront gérés via GTM sans toucher le code du site. Avantages : modifications sans développeur, gestion centralisée, versioning, testing avant publication. Pour WordPress : plugin gratuit "GTM4WP" facilite l\'installation. Pour Shopify : intégration native dans Settings > Checkout.', assignee: 'sora', phase: 'Setup', estimated_hours: 1, category: 'foundation', order: 1, context_questions: ['GTM existant ?', 'Accès au code source ?', 'CMS utilisé ?'] },
  { title: '📊 Configuration GA4', description: 'Créer une propriété Google Analytics 4 (GA4, remplace Universal Analytics obsolète depuis juillet 2023) : 1) Aller sur analytics.google.com, créer Compte > Propriété > Flux de données Web, 2) Configurer le flux : URL du site, nom du flux, activer "Enhanced measurement" (track automatique scroll, clics sortants, recherche site, engagement vidéo, téléchargement fichiers), 3) Noter le Measurement ID (format: G-XXXXXXXXXX), 4) Si multi-domaines (ex: site principal + boutique sur sous-domaine), activer Cross-Domain Tracking dans GA4 Admin > Data Streams > Configure tag settings > Configure your domains. GA4 utilise un modèle événementiel (tout est événement) contrairement à UA (sessions/pageviews). Lier la propriété au compte Google Search Console et Google Ads pour import de données.', assignee: 'sora', phase: 'Setup', estimated_hours: 1, category: 'foundation', order: 2, context_questions: ['GA4 existant ?', 'Domaines à tracker ?', 'Cross-domain nécessaire ?'] },
  { title: '⚙️ Réglages GA4', description: 'Configurer les paramètres importants de GA4 : 1) RÉTENTION DONNÉES : par défaut 2 mois (insuffisant !) → passer à 14 mois max (Admin > Data Settings > Data retention), permet analyse long-terme, 2) SIGNAUX GOOGLE : activer (Admin > Data Settings > Data collection > Google signals) pour remarketing et données démographiques (âge/genre), MAIS impact RGPD = nécessite consentement utilisateur, 3) DATA SHARING : configurer selon besoins (partage avec Google products, benchmarks, support), 4) EXCLURE TRAFIC DÉVELOPPEUR : créer filtre pour exclure trafic interne (paramètres > Data filters > Create filter > Developer traffic), 5) DEVISE : vérifier devise par défaut (EUR, USD), 6) TIMEZONE : aligner avec timezone business (pas serveur).', assignee: 'sora', phase: 'Setup', estimated_hours: 0.5, category: 'foundation', order: 3, context_questions: ['Rétention actuelle ?', 'Signaux Google activés ?', 'Data sharing ?'] },
  { title: '🚫 Filtres Internes', description: 'Exclure le trafic interne (équipe, bureau, tests) de Google Analytics pour ne pas polluer les données et les conversions : 1) MÉTHODE IP : identifier adresses IP fixes du bureau/maison (whatismyip.com), créer filtre GA4 (Admin > Data Settings > Data Filters > Internal Traffic > Define IP addresses), 2) MÉTHODE COOKIE : créer un cookie "internal_user=true" sur navigateurs internes via extension Chrome ou bookmark JavaScript, puis exclure dans GA4 via Custom Dimension, 3) Pour équipes distantes/VPN : utiliser méthode cookie (IP changeante). Important : tester que le filtre fonctionne en visitant le site depuis IP bureau puis vérifier dans GA4 DebugView que le trafic est tagué "Internal". Activer le filtre en mode "Testing" d\'abord (7 jours) pour vérifier volumes avant activation définitive.', assignee: 'sora', phase: 'Setup', estimated_hours: 0.5, category: 'foundation', order: 4, context_questions: ['IPs à exclure ?', 'VPN utilisé ?', 'Équipe distante ?'] },

  // CONFORMITÉ (Sora) - 2 tâches
  { title: '🍪 Choix CMP (Consent Banner)', description: 'Sélectionner et implémenter une Consent Management Platform (CMP) = bannière cookies conforme RGPD/CCPA obligatoire pour Europe/Californie : 1) OPTIONS : Cookiebot (€25-100/mois, complet, multi-langues), Axeptio (français, design moderne, €0-300/mois), OneTrust (entreprise, €€€), Osano, Termly (gratuit limité). 2) FONCTIONNALITÉS REQUISES : catégories cookies (nécessaires/analytics/marketing), opt-in explicite (pas pré-coché), opt-out facile, multi-langues auto-détectée, design personnalisable (couleurs marque), scan automatique cookies, preuve consentement (légal). 3) INSTALLATION : script CMP AVANT GTM dans <head> (CMP doit charger avant tout tracking), configurer catégories, lier à Consent Mode v2 Google. Préférer Consent Mode "Advanced" (track avec consentement + mode dégradé sans). Tester avec utilisateurs EU et US.', assignee: 'sora', phase: 'Setup', estimated_hours: 2, category: 'compliance', order: 5, context_questions: ['Budget CMP ?', 'Régions ciblées (RGPD, Loi 25) ?', 'Design personnalisé ?'] },
  { title: '✅ Consent Mode v2', description: 'Implémenter Google Consent Mode v2 (obligatoire depuis mars 2024 pour Europe, sinon perte 40-70% de données GA4/Google Ads) : Le Consent Mode permet à Google de recevoir des données anonymisées MÊME si l\'utilisateur refuse les cookies = meilleure modélisation. 2 modes : 1) BASIC = si refus, aucun tag ne fire (perte complète données), 2) ADVANCED = si refus, tags fire quand même en mode "cookieless" avec données anonymisées + conversion modeling (recommandé, conforme RGPD). Configuration : dans GTM, ajouter balise Consent Mode avec états par défaut (denied avant choix utilisateur) et mise à jour après interaction bannière. Variables : ad_storage (Google Ads), analytics_storage (GA4), ad_user_data, ad_personalization. Tester : 1) Refuser cookies → vérifier GA4 reçoit events en mode "without cookies", 2) Accepter → vérifier cookies posés. Valider conformité avec IAB Consent String.', assignee: 'sora', phase: 'Setup', estimated_hours: 2, category: 'compliance', order: 6, context_questions: ['CMP compatible ?', 'Mode dégradé souhaité ?', 'Tests conformité ?'] },

  // DATA LAYER (Sora) - 2 tâches
  { title: '🔍 Audit Technique Data Layer', description: 'Auditer le Data Layer existant (ou constater son absence) : Le Data Layer est un objet JavaScript (window.dataLayer = []) qui stocke les informations structurées du site (user ID, catégorie page, infos produit, transaction...) pour alimenter GTM/GA4. 1) Ouvrir Console navigateur (F12) > taper "dataLayer" pour voir si existe, 2) Analyser quelles variables sont déjà disponibles : page type, user info, cart value, product details, 3) Identifier les GAPS : variables manquantes nécessaires pour tracking (ex: product ID, transaction_id, user_type membre/visiteur), 4) Documenter dans Excel : Variable Name, Available (Yes/No), Example Value, Used By (GA4/Meta/Ads). Si aucun dataLayer : il faudra le créer from scratch (collaboration développeur nécessaire). Si dataLayer partiel : identifier ce qu\'il faut ajouter. Priorité : events e-commerce (panier, achat) et conversions (lead, signup).', assignee: 'sora', phase: 'Audit', estimated_hours: 2, category: 'datalayer', order: 7, context_questions: ['Data layer existant ?', 'Variables disponibles ?', 'Documentation dev ?'] },
  { title: '📋 Specs Développeur', description: 'Créer la documentation technique pour les développeurs afin qu\'ils implémentent le Data Layer correctement : 1) FORMAT : Google Sheet ou document JSON avec 3 colonnes (Event Name, Variables, Example), 2) EVENTS E-COMMERCE : view_item (page produit), add_to_cart (ajout panier), remove_from_cart, begin_checkout (page panier), add_payment_info, add_shipping_info, purchase (confirmation achat), 3) EVENTS LEADS : generate_lead (form submit), sign_up (création compte), 4) VARIABLES REQUISES par event : items[] (array produits avec id, name, price, quantity, category), transaction_id, value, currency, user_id (hashé). Exemple code : dataLayer.push({ event: "purchase", transaction_id: "T12345", value: 99.99, currency: "EUR", items: [{item_id: "SKU123", item_name: "Chaussures", price: 99.99, quantity: 1}] }). Inclure où placer chaque push (page produit, after add to cart, page confirmation). Estimer charge dev : 2-10 jours selon complexité plateforme.', assignee: 'sora', phase: 'Setup', estimated_hours: 3, category: 'datalayer', order: 8, context_questions: ['Format spec (JSON, Sheet) ?', 'Variables requises ?', 'Délai dev estimé ?'] },

  // TRACKING CORE (Sora) - 4 tâches
  { title: '🏷️ Balise Configuration GA4', description: 'Installer la balise Google Tag (GA4) dans GTM : 1) Dans GTM, créer nouvelle balise > Type "Google Tag" (ou "GA4 Configuration" si ancienne version GTM), 2) Tag ID = Measurement ID (G-XXXXXXXXXX copié depuis GA4), 3) Déclencheur : All Pages (toutes les pages), 4) Paramètres avancés : activer "Send page view event automatically" (pageviews automatiques), configurer User Properties si besoin (user_id, customer_type), 5) ENHANCED MEASUREMENT : vérifier activé dans GA4 (track scroll, outbound clicks, site search, video engagement, file downloads automatiquement SANS code), 6) DEBUG MODE : activer temporairement pour tests (paramètre debug_mode: true) pour voir events en temps réel dans GA4 DebugView. Publier le conteneur GTM (bouton Submit > Version name + description). Tester : visiter site, vérifier dans GA4 Realtime que pageviews apparaissent.', assignee: 'sora', phase: 'Setup', estimated_hours: 1, category: 'tracking', order: 9, context_questions: ['Measurement ID ?', 'Enhanced measurement ?', 'Debug mode ?'] },
  { title: '🔗 Conversion Linker', description: 'Activer la balise Conversion Linker (essentielle pour attribution cross-domain et multi-devices) : 1) Dans GTM, créer balise > Type "Conversion Linker", 2) Déclencheur : All Pages (DOIT fire avant toutes autres balises), 3) Fonction : stocke les clics publicitaires dans cookies 1st party (GCLID pour Google Ads, FBCLID pour Meta) pour attribuer conversions au bon clic pub même si utilisateur change de device ou browser. CRITIQUE pour iOS 14.5+ où cookies 3rd party bloqués. 4) OPTIONS : Enable link decoration (si cross-domain), Enable cookie overwriting (recommandé), 5) Ordonner les balises : Conversion Linker doit avoir "Tag Sequencing" > Fire before autre tags (GA4, Google Ads, Meta Pixel). Tester : cliquer sur pub Google Ads > vérifier dans Storage navigateur (F12 > Application > Cookies) présence _gcl_* cookie.', assignee: 'sora', phase: 'Setup', estimated_hours: 0.5, category: 'tracking', order: 10, context_questions: ['Cross-domain ?', 'Linker déjà actif ?', 'Cookies 1st party ?'] },
  { title: '👆 Suivi des Clics', description: 'Configurer le tracking des clics sur éléments importants (liens email, téléphone, boutons CTA, liens externes) : 1) MÉTHODE GTM : créer déclencheurs (Triggers) > Type "Just Links" ou "All Elements" avec conditions CSS (ex: class contient "btn-cta" OU href contient "mailto:" OU href contient "tel:"), 2) Créer balise GA4 Event pour chaque type de clic : event_name = "click_email" / "click_phone" / "click_cta" avec paramètres custom (link_url, link_text), 3) NAMING CONVENTION : standardiser noms events (snake_case, préfixe par catégorie : click_, form_, engagement_), 4) CLICS PRIORITAIRES : email (contact), téléphone (leads), boutons CTA principaux (acheter, s\'inscrire, demander devis), liens partenaires/affiliés, téléchargements PDF/brochures. Tester avec GTM Preview : cliquer sur chaque élément, vérifier que le bon event fire avec bons paramètres.', assignee: 'sora', phase: 'Setup', estimated_hours: 2, category: 'tracking', order: 11, context_questions: ['Clics prioritaires ?', 'Sélecteurs CSS ?', 'Events naming convention ?'] },
  { title: '📝 Suivi des Formulaires', description: 'Configurer le tracking des soumissions de formulaires (contact, devis, newsletter, inscription) = événements de conversion critiques : 1) MÉTHODE A - Thank You Page : si redirection après submit vers /merci ou /confirmation → déclencheur GTM "Page View" avec condition URL contains "merci", balise GA4 Event "generate_lead" ou "sign_up", 2) MÉTHODE B - Form Submit : déclencheur GTM "Form Submission" (détection automatique <form>) avec conditions (Form ID égal "contact-form" OU Form Class contient "lead-form"), balise GA4 Event au submit. ATTENTION : Form Submit peut fire AVANT validation serveur (double conversion si erreur form) → préférer Thank You Page ou AJAX success callback, 3) VARIABLES DATAlayer : capturer form_name, form_id, et idéalement user email/phone hashé (SHA-256) pour Enhanced Conversions. Tester : remplir form, submit, vérifier event dans GA4 DebugView avec tous paramètres. Configurer comme conversion dans GA4 (Admin > Events > Mark as conversion).', assignee: 'sora', phase: 'Setup', estimated_hours: 2, category: 'tracking', order: 12, context_questions: ['Type formulaires ?', 'Thank you page ?', 'Validation AJAX ?'] },

  // E-COMMERCE (Sora) - 2 tâches
  { title: '🛒 Events E-commerce Standard', description: 'Implémenter les 8 événements e-commerce standards de GA4 (recommandés Google, nécessaires pour rapports e-commerce et remarketing dynamique) : 1) view_item (page produit vue), 2) view_item_list (liste produits/catégorie vue), 3) add_to_cart (ajout panier), 4) remove_from_cart (retrait panier), 5) view_cart (vue panier), 6) begin_checkout (début checkout), 7) add_payment_info (infos paiement saisies), 8) purchase (achat confirmé). Chaque event doit inclure items[] array avec : item_id (SKU), item_name, price, quantity, item_category, item_brand. Pour Shopify/WooCommerce : plugins natifs existent (GA4 par Littledata, Enhanced Ecommerce). Pour CMS custom : développement required, push dataLayer à chaque étape. CRITIQUE : event "purchase" doit fire UNIQUEMENT sur page confirmation (pas à chaque refresh = éviter double comptage) avec transaction_id unique. Activer Enhanced Ecommerce dans GA4 (automatique si events bien nommés).', assignee: 'sora', phase: 'Setup', estimated_hours: 4, category: 'ecommerce', order: 13, context_questions: ['Plateforme e-com ?', 'Events existants ?', 'Enhanced ecom ?'] },
  { title: '💰 Variables Data Layer E-com', description: 'Configurer les variables Data Layer pour capturer les informations transactionnelles (essentielles pour rapports revenus, ROAS, funnel e-commerce) : 1) TRANSACTION : transaction_id (unique, format : "T" + timestamp + random), value (montant total TTC), tax (montant taxes), shipping (frais livraison), currency (EUR, USD...), coupon (code promo si applicable), 2) ITEMS : array de produits avec item_id (SKU), item_name, item_category (hiérarchie cat/sous-cat), item_brand, price (unitaire), quantity, discount (montant réduc par item), 3) USER : user_id (hashé SHA-256 si membre connecté), 4) ADVANCED : affiliation (canal vente : "web", "app", "marketplace"), payment_type (CB, PayPal, virement). Créer variables GTM qui lisent ces valeurs depuis dataLayer : {{DLV - Transaction ID}}, {{DLV - Value}}, etc. Tester chaque variable dans GTM Preview en mode Variables.', assignee: 'sora', phase: 'Setup', estimated_hours: 2, category: 'ecommerce', order: 14, context_questions: ['Variables disponibles ?', 'Devise unique ?', 'Tax incluse ?'] },

  // PIXELS MÉDIA (Sora) - 3 tâches
  { title: '📱 Meta Pixel + CAPI', description: 'Installer le Meta Pixel (Facebook Pixel) en DOUBLE IMPLEMENTATION (Client-side + Server-side pour contourner iOS 14.5+ tracking prevention) : 1) CLIENT-SIDE via GTM : créer balise GTM > Type "Custom HTML" avec code Meta Pixel (ou utiliser template Community "Facebook Pixel" si disponible), Pixel ID depuis Meta Events Manager, événements : PageView (all pages), ViewContent (produit), AddToCart, InitiateCheckout, Purchase avec paramètres (content_ids, value, currency), 2) SERVER-SIDE CAPI (Conversions API) : 3 options = a) Intégration native Shopify/WooCommerce, b) Partenaire tier (Stape.io, Elevar - 50-200$/mois), c) Custom server (Node.js/Python script POST vers Graph API), 3) DÉDUPLICATION : utiliser event_id identique entre Pixel et CAPI (ex: transaction_id pour Purchase) pour éviter double comptage. Tester : Meta Pixel Helper extension Chrome, Events Manager Test Events. Objectif : Event Match Quality >7/10 dans Events Manager.', assignee: 'sora', phase: 'Setup', estimated_hours: 3, category: 'pixels', order: 15, context_questions: ['Pixel ID ?', 'CAPI via partenaire ?', 'Events à tracker ?'] },
  { title: '🔍 Google Ads Conversion', description: 'Installer le tracking de conversion Google Ads (différent de GA4, nécessaire pour optimisation campagnes Google Ads) : 1) Dans Google Ads > Goals > Conversions > New Conversion Action > Website, sélectionner type (Achat, Lead, Sign-up, Page view), 2) Google génère Conversion ID (AW-XXXXXXXXX) et Conversion Label (unique par conversion), 3) Dans GTM : créer balise "Google Ads Conversion Tracking" avec Conversion ID/Label, déclencheur = page confirmation ou event (ex: purchase, generate_lead), 4) VALEUR DYNAMIQUE : configurer variable GTM pour {{Transaction Value}} (e-commerce) ou valeur fixe (lead = 50€ par ex.), 5) ATTRIBUTION : activer Enhanced Conversions (envoyer email/phone hashé pour améliorer attribution) via paramètres balise ou variable dataLayer. Tester avec Google Tag Assistant, vérifier conversions apparaissent dans Google Ads > Tools > Conversions après 24-48h (délai processing). Lier Google Ads à GA4 pour import conversions automatique (optionnel mais recommandé).', assignee: 'sora', phase: 'Setup', estimated_hours: 1.5, category: 'pixels', order: 16, context_questions: ['Conversion ID ?', 'Conversion Label ?', 'Valeur dynamique ?'] },
  { title: '💼 LinkedIn/TikTok Insight Tags', description: 'Installer les pixels additionnels pour remarketing et mesure si campagnes actives sur ces plateformes : 1) LINKEDIN INSIGHT TAG : dans LinkedIn Campaign Manager > Account Assets > Insight Tag, copier code, créer balise GTM "Custom HTML" avec code, déclencheur All Pages, configurer event tracking (Lead, SignUp) via balise additionnelle avec _linkedin_data_partner_ids, 2) TIKTOK PIXEL : dans TikTok Ads Manager > Assets > Events, copier Pixel ID, créer balise GTM (template Community "TikTok Pixel" OU Custom HTML), événements : ViewContent, AddToCart, CompletePayment avec paramètres (content_id, value, currency), 3) AUTRES : Pinterest Tag, Snapchat Pixel, Twitter Pixel selon besoins (même logique : Custom HTML OU template GTM). IMPORTANT : tous ces pixels alourdissent le site = installer UNIQUEMENT si campagnes actives sur plateforme, sinon inutile et ralentit page. Tester avec extensions navigateur officielles (LinkedIn Insight Tag Helper, TikTok Pixel Helper).', assignee: 'sora', phase: 'Setup', estimated_hours: 1.5, category: 'pixels', order: 17, context_questions: ['Comptes LinkedIn Ads ?', 'TikTok for Business ?', 'Events prioritaires ?'] },

  // QA (Sora) - 2 tâches
  { title: '🔬 GTM Preview Mode', description: 'Tester exhaustivement TOUS les tags avant publication avec GTM Preview Mode (mode debug) : 1) Dans GTM, cliquer "Preview" (coin haut droit), choisir workspace, entrer URL site → ouvre site en mode debug avec panneau GTM en bas, 2) SCÉNARIOS À TESTER : a) Navigation normale (homepage, catégories, produits) = vérifier tags GA4/Meta fire, b) Ajout panier, checkout, achat = vérifier events e-commerce, c) Soumission formulaire = vérifier conversion, d) Clics email/tel/CTA = vérifier events clics, e) Cross-device/cross-browser (mobile Chrome, Safari iOS, desktop Firefox), 3) Pour chaque tag : vérifier Status = "Succeeded" (pas "Not fired" ni "Error"), vérifier Data Layer contient bonnes variables, vérifier requêtes HTTP partent (onglet Network), 4) CHECKLIST QA : créer Excel avec tous les tags, cocher chaque test (Page/Event/Device/Status). Corriger erreurs avant publication. Ne JAMAIS publier sans QA = risque pertes conversions/données.', assignee: 'sora', phase: 'Audit', estimated_hours: 2, category: 'qa', order: 18, context_questions: ['Scénarios de test ?', 'Devices à tester ?', 'Checklist QA ?'] },
  { title: '📡 GA4 DebugView', description: 'Valider la réception des événements dans GA4 en temps réel avec DebugView (complémentaire GTM Preview, vérifie côté GA4) : 1) Activer : dans GTM, ajouter paramètre debug_mode: true à la balise GA4 Config OU installer extension Chrome "GA Debugger", 2) Dans GA4 > Configure > DebugView, apparaissent les events en temps réel avec détails : event_name, paramètres, user_properties, device info, 3) VÉRIFICATIONS : a) Tous events custom apparaissent (purchase, generate_lead, click_cta...), b) Paramètres corrects (value en number pas string, currency = EUR, items array bien formé), c) User ID si applicable, d) Géolocalisation correcte, e) Source/Medium attribution (organic, cpc, referral), 4) ERREURS COMMUNES : value envoyé en string ("99.99" au lieu de 99.99) = fixe rapports revenus, paramètres manquants, events duplicated (double fire). Laisser DebugView actif 48-72h après lancement pour monitorer. Désactiver debug_mode en prod (flood logs sinon). Valider aussi dans Reports > Realtime (vue utilisateur final, sans debug).', assignee: 'sora', phase: 'Audit', estimated_hours: 1.5, category: 'qa', order: 19, context_questions: ['Events à valider ?', 'Paramètres custom ?', 'User properties ?'] },

  // VISUALISATION (Sora) - 2 tâches
  { title: '📊 Connexion Looker Studio', description: 'Connecter Google Looker Studio (ex-Data Studio, outil gratuit de dashboarding Google) aux sources de données : 1) Aller sur lookerstudio.google.com, créer nouveau rapport (Create > Data source), 2) SOURCES À CONNECTER : a) Google Analytics 4 (choisir propriété + vue), b) Google Ads (choisir compte + campagnes), c) Google Search Console (données SEO), d) Google Sheets (si data additionnelle : budget, prévisions), e) Facebook Ads via connecteur Community (Supermetrics - payant OU connecteur Meta officiel si dispo), 3) BLENDING : fusionner plusieurs sources sur clé commune (ex: Date) pour rapports cross-canal (GA4 + Google Ads + Meta sur même graphique), 4) ACCÈS : partager rapport en mode "Viewer" avec client (email), mode "Editor" avec équipe. Templates gratuits disponibles : chercher "GA4 template Looker Studio" sur Google. Alternative : utiliser template pré-fait puis customiser (gain temps 50-80%).', assignee: 'sora', phase: 'Setup', estimated_hours: 1.5, category: 'visualization', order: 20, context_questions: ['Sources de données ?', 'Accès Looker Studio ?', 'Template existant ?'] },
  { title: '📈 Dashboarding', description: 'Créer un dashboard mensuel automatique (Looker Studio ou Google Sheets) avec KPIs prioritaires pour client/management : 1) STRUCTURE RAPPORT : a) Page 1 = Executive Summary (chiffres clés : Trafic, Conversions, Revenue, ROAS, CPA), b) Page 2 = Acquisition (sources trafic : Organic, Paid, Direct, Referral, Social), c) Page 3 = Comportement (pages vues, bounce rate, temps session, funnel checkout), d) Page 4 = Conversions (objectifs complétés, valeur conversions, top landing pages), e) Page 5 = E-commerce si applicable (revenus, panier moyen, top produits), 2) KPIS PAR OBJECTIF : E-commerce (Revenue, Transactions, AOV, ROAS), Leadgen (Leads, Cost per Lead, Conversion Rate), Content (Sessions, Engagement Rate, Pages/Session), 3) COMPARAISONS : mois actuel vs mois précédent vs même mois année passée (YoY), 4) AUTOMATISATION : configurer email automatique mensuel (Looker Studio > Schedule delivery), 5) DESIGN : utiliser couleurs marque, éviter surcharge graphiques (max 5-7 charts/page), privilégier scorecards (chiffre unique) pour KPIs principaux. Temps création initial : 4-6h, puis maintenance 30min/mois (ajustements).', assignee: 'sora', phase: 'Production', estimated_hours: 4, category: 'visualization', order: 21, context_questions: ['KPIs prioritaires ?', 'Destinataires rapport ?', 'Fréquence envoi ?'] },
];

// ─────────────────────────────────────────────────────────────────
// Task Generation Functions
// ─────────────────────────────────────────────────────────────────

function filterTasksByAnswers(
  tasks: BaseTask[],
  scope: ProjectScope,
  answers: WizardAnswer[]
): BaseTask[] {
  let filtered = [...tasks];

  // ═══ SCALE FILTER (universel, s'applique à tous les scopes) ═══
  const scaleAnswer = answers.find((a) => a.questionId === 'project_scale')?.value;

  if (scaleAnswer === 'sprint') {
    // Sprint = seulement Production + premiers Setup essentiels
    // Garde: les tâches Setup de type 'configuration' + 'technical' (nécessaires pour exécuter)
    // Garde: les tâches Production
    // Supprime: Audit complet + Optimization
    filtered = filtered.filter((t) => {
      if (t.phase === 'Audit') return false;
      if (t.phase === 'Optimization') return false;
      // En Setup, garder uniquement technique/config (pas strategy/planning)
      if (t.phase === 'Setup' && ['strategy', 'planning', 'semantic'].includes(t.category))
        return false;
      return true;
    });
  } else if (scaleAnswer === 'campaign') {
    // Campaign = Setup + Production + 1 tâche Optimization (reporting)
    // Supprime: Audit stratégique profond (garder seulement les prérequis)
    filtered = filtered.filter((t) => {
      if (t.phase === 'Audit' && t.category === 'strategy') return false;
      // Garder les prérequis d'audit (accès, technique)
      if (t.phase === 'Audit' && ['prerequisites', 'technical'].includes(t.category)) return true;
      if (t.phase === 'Audit') return false;
      return true;
    });
  }
  // 'strategy' = pas de filtre scale, toutes les tâches

  // ═══ SCOPE-SPECIFIC FILTERS (existants, inchangés) ═══
  if (scope === 'meta_ads' || scope === 'full_scale') {
    const assetsAnswer = answers.find((a) => a.questionId === 'meta_assets')?.value;
    const trackingAnswer = answers.find((a) => a.questionId === 'meta_tracking')?.value;

    if (assetsAnswer === 'none') {
      filtered = filtered.filter((t) => t.category !== 'creative');
    } else if (assetsAnswer === 'copy_only') {
      filtered = filtered.filter((t) => !t.title.includes('Visuels'));
    }

    if (trackingAnswer === 'ready') {
      filtered = filtered.filter((t) => t.category !== 'technical');
    } else if (trackingAnswer === 'partial') {
      filtered = filtered.filter((t) => t.title !== '🏢 Audit & Setup Business Manager');
    }
  }

  if (scope === 'seo' || scope === 'full_scale') {
    const auditAnswer = answers.find((a) => a.questionId === 'seo_audit')?.value;
    const contentAnswer = answers.find((a) => a.questionId === 'seo_content')?.value;
    const migrationAnswer = answers.find((a) => a.questionId === 'seo_migration')?.value;

    if (auditAnswer === 'none') {
      filtered = filtered.filter((t) => t.phase !== 'Audit' || t.category === 'prerequisites');
    }

    if (contentAnswer === 'internal') {
      filtered = filtered.filter((t) => t.category !== 'onpage' || !t.title.includes('Contenu'));
    }

    if (migrationAnswer === 'no') {
      filtered = filtered.filter((t) => t.category !== 'migration');
    }
  }

  if (scope === 'sem' || scope === 'full_scale') {
    const existingAnswer = answers.find((a) => a.questionId === 'sem_existing')?.value;
    const copyAnswer = answers.find((a) => a.questionId === 'sem_copy')?.value;

    if (existingAnswer === 'new') {
      filtered = filtered.filter((t) => !t.title.includes('Audit') || t.category !== 'strategy');
    }

    if (copyAnswer === 'ready') {
      filtered = filtered.filter((t) => t.category !== 'copywriting');
    }
  }

  if (scope === 'analytics' || scope === 'full_scale') {
    const stateAnswer = answers.find((a) => a.questionId === 'analytics_state')?.value;
    const ecomAnswer = answers.find((a) => a.questionId === 'analytics_ecommerce')?.value;
    const pixelsAnswer = answers.find((a) => a.questionId === 'analytics_pixels')?.value;

    if (stateAnswer === 'ready') {
      filtered = filtered.filter((t) => t.category !== 'foundation');
    }

    if (ecomAnswer === 'no') {
      filtered = filtered.filter((t) => t.category !== 'ecommerce');
    }

    if (pixelsAnswer === 'none') {
      filtered = filtered.filter((t) => t.category !== 'pixels');
    }
  }

  if (scope === 'social_media' || scope === 'full_scale') {
    const platformsAnswer = answers.find((a) => a.questionId === 'social_platforms')?.value;
    const contentAnswer = answers.find((a) => a.questionId === 'social_content')?.value;
    const videosAnswer = answers.find((a) => a.questionId === 'social_videos')?.value;

    // Si aucune plateforme sélectionnée, garder toutes les tâches (défaut)
    // La logique de filtrage peut être ajoutée ici selon les réponses

    if (contentAnswer === 'ready') {
      filtered = filtered.filter((t) => t.category !== 'planning' || !t.title.includes('Copywriting'));
    }

    if (videosAnswer === 'no') {
      filtered = filtered.filter((t) => !t.title.includes('Vidéos Courtes'));
    }
  }

  return filtered;
}

function getTasksForScope(scope: ProjectScope): BaseTask[] {
  switch (scope) {
    case 'meta_ads':
      return META_ADS_TASKS;
    case 'sem':
      return SEM_TASKS;
    case 'seo':
      return SEO_TASKS;
    case 'analytics':
      return ANALYTICS_TASKS;
    case 'social_media':
      return SOCIAL_MEDIA_TASKS;
    case 'full_scale':
      // Combine all tasks with intelligent ordering
      return [
        ...ANALYTICS_TASKS.map((t) => ({ ...t, order: t.order })),
        ...SEO_TASKS.map((t) => ({ ...t, order: t.order + 100 })),
        ...META_ADS_TASKS.map((t) => ({ ...t, order: t.order + 200 })),
        ...SEM_TASKS.map((t) => ({ ...t, order: t.order + 300 })),
        ...SOCIAL_MEDIA_TASKS.map((t) => ({ ...t, order: t.order + 400 })),
      ].sort((a, b) => {
        // Sort by phase first, then by order
        const phaseOrder = { Audit: 0, Setup: 1, Production: 2, Optimization: 3 };
        const phaseDiff = phaseOrder[a.phase] - phaseOrder[b.phase];
        if (phaseDiff !== 0) return phaseDiff;
        return a.order - b.order;
      });
    default:
      return [];
  }
}

export function generateTasksForScope(
  scope: ProjectScope,
  deadline: string,
  answers: WizardAnswer[]
): Omit<Task, 'id' | 'project_id' | 'created_at'>[] {
  const baseTasks = getTasksForScope(scope);
  const filteredTasks = filterTasksByAnswers(baseTasks, scope, answers);

  const deadlineDate = new Date(deadline);
  const totalDays = Math.max(7, Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  const phaseDistribution = {
    Audit: 0.15,
    Setup: 0.30,
    Production: 0.40,
    Optimization: 0.15,
  };

  return filteredTasks
    .sort((a, b) => a.order - b.order)
    .map((task, index) => {
      const phaseOffset = {
        Audit: 0,
        Setup: phaseDistribution.Audit,
        Production: phaseDistribution.Audit + phaseDistribution.Setup,
        Optimization: phaseDistribution.Audit + phaseDistribution.Setup + phaseDistribution.Production,
      };

      const tasksInPhase = filteredTasks.filter((t) => t.phase === task.phase).length;
      const taskIndexInPhase = filteredTasks.filter((t) => t.phase === task.phase && t.order < task.order).length;
      const phaseProgress = tasksInPhase > 0 ? taskIndexInPhase / tasksInPhase : 0;

      const taskOffset = phaseOffset[task.phase] + phaseProgress * phaseDistribution[task.phase];
      const dueDate = new Date(Date.now() + totalDays * taskOffset * 24 * 60 * 60 * 1000);

      if (dueDate > deadlineDate) {
        dueDate.setTime(deadlineDate.getTime() - (filteredTasks.length - index) * 24 * 60 * 60 * 1000);
      }

      return {
        title: task.title,
        description: task.description,
        assignee: task.assignee,
        phase: task.phase,
        status: index === 0 ? 'todo' : 'blocked' as const,
        context_questions: task.context_questions,
        estimated_hours: task.estimated_hours,
        due_date: dueDate.toISOString().split('T')[0],
        depends_on: [],
      };
    });
}

// Legacy export for backward compatibility
export const generateMetaAdsTasks = (deadline: string, answers: WizardAnswer[]) =>
  generateTasksForScope('meta_ads', deadline, answers);

// ─────────────────────────────────────────────────────────────────
// Phase & Dependencies
// ─────────────────────────────────────────────────────────────────

export const PHASE_ORDER: TaskPhase[] = ['Audit', 'Setup', 'Production', 'Optimization'];

export function getPhaseIndex(phase: TaskPhase): number {
  return PHASE_ORDER.indexOf(phase);
}
