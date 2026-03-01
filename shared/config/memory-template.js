/**
 * ============================================================================
 * BRAND MEMORY TEMPLATE - Agency Killer V4 (Cloud Native Edition)
 * ============================================================================
 *
 * CLOUD NATIVE PRINCIPLE
 * ============================================================================
 * Ce template est concu pour etre COPIE directement dans les Code Nodes n8n.
 * Il remplace les fichiers JSON locaux (persona.json, strategy.json).
 *
 * POURQUOI ?
 * - VPS Docker n'a pas acces au filesystem local de dev
 * - Les workflows doivent etre PORTABLES entre environnements
 * - La configuration est VERSIONEE dans le workflow lui-meme
 *
 * USAGE DANS N8N
 * ============================================================================
 * 1. Creer un Code Node nomme "Load Brand Memory"
 * 2. Copier le contenu de getBrandMemory() dans ce node
 * 3. Personnaliser les valeurs pour chaque client
 * 4. Les autres nodes acceaent via: $('Load Brand Memory').item.json
 *
 * ALTERNATIVE: Variables d'environnement
 * - Pour les donnees sensibles (API keys), utiliser les credentials n8n
 * - Pour les configs simples, utiliser les variables d'environnement
 */

// ============================================================================
// BRAND MEMORY STRUCTURE
// ============================================================================

/**
 * Retourne l'objet Brand Memory complet.
 * Copier cette fonction dans votre Code Node n8n.
 */
function getBrandMemory() {
  return {
    // ─────────────────────────────────────────────────────────────────────────
    // METADATA
    // ─────────────────────────────────────────────────────────────────────────
    _meta: {
      version: '4.0.0',
      brand_id: 'template_brand', // PERSONNALISER
      last_updated: new Date().toISOString(),
      environment: 'production'  // 'development' | 'staging' | 'production'
    },

    // ─────────────────────────────────────────────────────────────────────────
    // BRAND IDENTITY
    // ─────────────────────────────────────────────────────────────────────────
    identity: {
      name: 'Nom de la Marque',           // PERSONNALISER
      tagline: 'Votre tagline ici',       // PERSONNALISER
      industry: 'e-commerce',             // e-commerce | saas | service | retail | b2b
      business_model: 'subscription',     // subscription | one-time | freemium | marketplace
      website: 'https://example.com',     // PERSONNALISER
      founding_year: 2020
    },

    // ─────────────────────────────────────────────────────────────────────────
    // TARGET AUDIENCE (Pour le Creative)
    // ─────────────────────────────────────────────────────────────────────────
    audience: {
      primary: {
        id: 'persona_primary',
        name: 'Sophie, la Startupeuse',   // PERSONNALISER
        demographics: {
          age_range: '28-42',
          gender: 'all',                  // all | male | female
          location: ['France', 'Belgique', 'Suisse'],
          income_level: 'medium-high'     // low | medium | medium-high | high
        },
        psychographics: {
          values: ['efficacite', 'innovation', 'qualite'],
          pain_points: [
            'Manque de temps pour tout gerer',
            'Outils trop complexes',
            'ROI difficile a mesurer'
          ],
          goals: [
            'Automatiser les taches repetitives',
            'Avoir une vision claire des performances',
            'Scaler sans recruter'
          ],
          buying_triggers: [
            'urgency',                    // Offre limitee
            'social_proof',               // Temoignages
            'authority',                  // Expertise demontree
            'fear_of_missing_out'         // FOMO
          ]
        },
        // Ou la trouver (pour le Trader)
        channels: ['meta_feed', 'linkedin', 'google_search'],
        content_preferences: ['video_short', 'case_study', 'checklist']
      },

      secondary: {
        id: 'persona_secondary',
        name: 'Marc, le Directeur Marketing',
        demographics: {
          age_range: '35-50',
          gender: 'all',
          location: ['France'],
          income_level: 'high'
        },
        psychographics: {
          values: ['resultats', 'fiabilite', 'reporting'],
          pain_points: [
            'Pression sur les budgets',
            'Manque de visibilite cross-canal',
            'Difficulte a prouver le ROI'
          ],
          goals: [
            'Justifier les investissements',
            'Centraliser les donnees',
            'Optimiser chaque euro depense'
          ],
          buying_triggers: ['roi_proof', 'case_study', 'free_trial']
        },
        channels: ['linkedin', 'google_search', 'email'],
        content_preferences: ['whitepaper', 'demo', 'roi_calculator']
      }
    },

    // ─────────────────────────────────────────────────────────────────────────
    // BRAND VOICE (Pour le Creative - Brand Safety)
    // ─────────────────────────────────────────────────────────────────────────
    voice: {
      tone: 'professional',               // professional | casual | luxury | playful | authoritative
      personality_traits: ['expert', 'accessible', 'direct', 'empathique'],
      language_style: {
        formality: 'vous',                // vous | tu
        vocabulary: 'technique_accessible', // simple | technique | technique_accessible | luxe
        emoji_usage: 'minimal',           // never | minimal | moderate | heavy
        humor: 'subtle'                   // never | subtle | frequent
      },

      // BRAND SAFETY - Mots interdits
      banned_words: [
        'pas cher',
        'gratuit',
        'meilleur',
        'numero 1',
        'revolutionnaire',
        'magique',
        'miracle',
        'garanti 100%'
      ],

      // Expressions preferees
      preferred_expressions: [
        'solution sur-mesure',
        'accompagnement expert',
        'resultats mesurables',
        'optimisation continue',
        'approche data-driven'
      ],

      // Templates de hooks par plateforme
      hook_templates: {
        meta: [
          '[Pain Point] vous empeche de [Goal] ?',
          'Comment [Persona] a [Achievement] en [Timeframe]',
          'Arretez de [Bad Practice]. Voici pourquoi :'
        ],
        linkedin: [
          '[Stat choc] des [Industry] echouent a [Task].',
          'J\'ai analyse [X] campagnes. Voici ce qui marche vraiment :',
          'La verite sur [Topic] que personne ne vous dit'
        ],
        google: [
          '[Keyword] | [Benefit 1] | [Benefit 2]',
          '[Solution] pour [Target] - [USP]'
        ]
      }
    },

    // ─────────────────────────────────────────────────────────────────────────
    // COMPETITORS (Pour le Strategist)
    // ─────────────────────────────────────────────────────────────────────────
    competitors: [
      {
        id: 'competitor_a',
        name: 'Concurrent A',             // PERSONNALISER
        url: 'https://concurrent-a.com',
        positioning: 'low-cost',          // low-cost | mid-market | premium | enterprise
        known_strengths: ['prix agressif', 'notoriete', 'distribution large'],
        known_weaknesses: ['SAV mediocre', 'qualite variable', 'UX datee'],
        threat_level: 'medium'            // low | medium | high
      },
      {
        id: 'competitor_b',
        name: 'Concurrent B',             // PERSONNALISER
        url: 'https://concurrent-b.com',
        positioning: 'premium',
        known_strengths: ['image de marque', 'qualite produit', 'innovation'],
        known_weaknesses: ['prix eleve', 'cible limitee', 'lent a reagir'],
        threat_level: 'high'
      }
    ],

    // ─────────────────────────────────────────────────────────────────────────
    // BUSINESS OBJECTIVES (Pour l'Analyst)
    // ─────────────────────────────────────────────────────────────────────────
    objectives: {
      primary_kpi: 'ROAS',                // ROAS | CPA | CAC | LTV | Revenue

      targets: {
        roas: 3.0,                        // Minimum acceptable
        cpa: 25,                          // Maximum acceptable (EUR)
        cac: 50,                          // Cost d'acquisition client
        ltv: 250,                         // Lifetime value
        conversion_rate: 2.5,             // % cible
        aov: 120                          // Panier moyen cible (EUR)
      },

      priorities: [
        {
          rank: 1,
          objective: 'Acquisition nouveaux clients',
          weight: 0.5                     // 50% du focus
        },
        {
          rank: 2,
          objective: 'Retention et upsell',
          weight: 0.3                     // 30% du focus
        },
        {
          rank: 3,
          objective: 'Notoriete de marque',
          weight: 0.2                     // 20% du focus
        }
      ],

      // Seuils d'alerte pour l'Analyst
      alert_thresholds: {
        roas_minimum: 2.0,                // Alerte si ROAS < 2.0
        cpa_maximum: 35,                  // Alerte si CPA > 35
        conversion_rate_minimum: 1.5,     // Alerte si CVR < 1.5%
        budget_overspend_percent: 10      // Alerte si > 10% over budget
      }
    },

    // ─────────────────────────────────────────────────────────────────────────
    // BUDGET CONSTRAINTS (Pour le Trader)
    // ─────────────────────────────────────────────────────────────────────────
    budget: {
      monthly_total: 10000,               // EUR / mois
      allocation: {
        meta: 0.40,                       // 40% sur Meta
        google: 0.35,                     // 35% sur Google
        linkedin: 0.15,                   // 15% sur LinkedIn
        other: 0.10                       // 10% reserve
      },
      rules: {
        max_daily_spend: 500,             // Max par jour
        min_campaign_budget: 50,          // Min par campagne
        auto_pause_threshold: 0.5         // Pause si ROAS < 0.5x
      }
    },

    // ─────────────────────────────────────────────────────────────────────────
    // PLATFORM PERMISSIONS
    // ─────────────────────────────────────────────────────────────────────────
    platforms: {
      allowed: ['meta', 'google', 'linkedin'],
      excluded: ['tiktok', 'pinterest', 'snapchat'],
      reasons: {
        tiktok: 'Audience trop jeune pour notre cible',
        pinterest: 'Pas de fit produit',
        snapchat: 'ROI historiquement faible'
      }
    },

    // ─────────────────────────────────────────────────────────────────────────
    // CONTENT RESTRICTIONS (Brand Safety)
    // ─────────────────────────────────────────────────────────────────────────
    content_restrictions: [
      'Pas de comparaison directe avec les concurrents nommes',
      'Pas de promesses de resultats garantis',
      'Pas de references politiques ou religieuses',
      'Pas de stereotypes de genre',
      'Eviter les superlatifs non prouvables'
    ],

    // ─────────────────────────────────────────────────────────────────────────
    // LEARNINGS (Pour l'Analyst et le Creative - CRO Loop)
    // ─────────────────────────────────────────────────────────────────────────
    learnings: [
      {
        id: 'learning_001',
        date: '2024-02-15',
        type: 'creative',
        insight: 'Les visuels avec personnes performent 40% mieux que les flat designs',
        confidence: 0.85,
        source: 'A/B test campaign_q1_2024'
      },
      {
        id: 'learning_002',
        date: '2024-03-01',
        type: 'audience',
        insight: 'Le segment 35-45 ans convertit 2x mieux que le 25-35',
        confidence: 0.90,
        source: 'Meta Audience Insights'
      },
      {
        id: 'learning_003',
        date: '2024-03-10',
        type: 'copy',
        insight: 'Les headlines avec chiffres ont un CTR +25%',
        confidence: 0.80,
        source: 'Google Ads experiments'
      }
    ],

    // ─────────────────────────────────────────────────────────────────────────
    // ACTIVE CAMPAIGNS (Context for Trader)
    // ─────────────────────────────────────────────────────────────────────────
    active_campaigns: [
      {
        id: 'camp_001',
        name: 'Acquisition Q1',
        platform: 'meta',
        objective: 'conversions',
        status: 'active',
        daily_budget: 150,
        start_date: '2024-01-15',
        end_date: null
      }
    ]
  };
}

// ============================================================================
// HELPER FUNCTIONS (For n8n Code Nodes)
// ============================================================================

/**
 * Retourne le persona principal.
 */
function getPrimaryPersona(memory) {
  return memory.audience.primary;
}

/**
 * Retourne les objectifs cibles.
 */
function getTargets(memory) {
  return memory.objectives.targets;
}

/**
 * Retourne les concurrents.
 */
function getCompetitors(memory) {
  return memory.competitors;
}

/**
 * Verifie si un mot est interdit (Brand Safety).
 */
function isBannedWord(word, memory) {
  return memory.voice.banned_words.some(
    banned => word.toLowerCase().includes(banned.toLowerCase())
  );
}

/**
 * Retourne les learnings par type.
 */
function getLearningsByType(type, memory) {
  return memory.learnings.filter(l => l.type === type);
}

/**
 * Verifie si une plateforme est autorisee.
 */
function isPlatformAllowed(platform, memory) {
  return memory.platforms.allowed.includes(platform);
}

// ============================================================================
// N8N CODE NODE TEMPLATE
// ============================================================================
/*
 * TEMPLATE POUR LOAD BRAND MEMORY NODE
 *
 * Creer un Code Node au debut de chaque workflow agent avec ce contenu:
 *
 * // ============================================================================
 * // LOAD BRAND MEMORY - [Client Name]
 * // ============================================================================
 *
 * const brandMemory = {
 *   // COPIER LE CONTENU DE getBrandMemory() ICI
 *   // PERSONNALISER POUR LE CLIENT
 * };
 *
 * // Ajouter des helpers
 * brandMemory._helpers = {
 *   getPrimaryPersona: () => brandMemory.audience.primary,
 *   getTargets: () => brandMemory.objectives.targets,
 *   getCompetitors: () => brandMemory.competitors,
 *   isBannedWord: (word) => brandMemory.voice.banned_words.some(
 *     b => word.toLowerCase().includes(b.toLowerCase())
 *   )
 * };
 *
 * return { json: brandMemory };
 *
 * ============================================================================
 * ACCES DEPUIS LES AUTRES NODES
 * ============================================================================
 *
 * Dans les nodes suivants, acceder via:
 *
 * const memory = $('Load Brand Memory').item.json;
 * const targets = memory.objectives.targets;
 * const persona = memory.audience.primary;
 * const competitors = memory.competitors;
 *
 */

// ============================================================================
// EXPORTS (For Module Usage - Optional)
// ============================================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getBrandMemory,
    getPrimaryPersona,
    getTargets,
    getCompetitors,
    isBannedWord,
    getLearningsByType,
    isPlatformAllowed
  };
}
