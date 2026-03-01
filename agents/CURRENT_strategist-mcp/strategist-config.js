/**
 * ============================================================================
 * STRATEGIST CONFIG - Agency Killer V4 (Cloud Native)
 * ============================================================================
 *
 * Configuration et helpers pour l'Agent Strategist.
 * A copier dans les Code Nodes n8n pour utilisation standalone.
 *
 * ============================================================================
 */

// ============================================================================
// CONSTANTES - SERP THRESHOLDS
// ============================================================================

const SERP_THRESHOLDS = {
  // Domain Authority minimum pour considerer battre un concurrent
  beatable_da_max: 70,

  // Giants a eviter (ne jamais recommander un KW ou ils dominent)
  giants: [
    'amazon.com', 'amazon.fr',
    'wikipedia.org',
    'hubspot.com',
    'salesforce.com',
    'mailchimp.com',
    'semrush.com',
    'ahrefs.com',
    'moz.com',
    'google.com',
    'facebook.com',
    'linkedin.com'
  ],

  // Seuils de difficulte keyword
  keyword_difficulty: {
    easy: 30,      // < 30 = facile
    medium: 50,    // 30-50 = moyen
    hard: 70,      // 50-70 = difficile
    impossible: 70 // > 70 = a eviter
  }
};

// ============================================================================
// CONSTANTES - ALGORITHM UPDATES
// ============================================================================

const ALGORITHM_UPDATES = {
  // Derniere update connue
  latest: {
    name: 'March 2024 Core Update',
    date: '2024-03-05',
    focus: ['E-E-A-T', 'Helpful Content', 'UX Mobile'],
    impact_areas: ['Reviews', 'YMYL', 'AI Content']
  },

  // Seuils de stabilite
  stability_thresholds: {
    volatile: 14,    // < 14 jours = volatil
    cautious: 30,    // 14-30 jours = prudent
    stable: 30       // > 30 jours = stable
  }
};

// ============================================================================
// CONSTANTES - COMPETITOR SCAN PRIORITIES
// ============================================================================

const SCAN_PRIORITIES = {
  technical_issues: [
    { issue: 'missing_alt_tags', severity: 'medium', opportunity: 'SEO images + accessibilite' },
    { issue: 'slow_lcp', severity: 'high', opportunity: 'UX superieure = meilleur ranking' },
    { issue: 'no_https', severity: 'critical', opportunity: 'Trust signal superieur' },
    { issue: 'missing_meta_descriptions', severity: 'medium', opportunity: 'CTR advantage' },
    { issue: 'no_schema_markup', severity: 'low', opportunity: 'Rich snippets' },
    { issue: 'mobile_ux_issues', severity: 'high', opportunity: 'Mobile-first indexing advantage' }
  ],

  content_gaps: [
    { type: 'comparison_page', priority: 'high', value: 'Differentiation directe' },
    { type: 'roi_calculator', priority: 'high', value: 'Lead magnet puissant' },
    { type: 'video_content', priority: 'medium', value: 'Engagement + SERP features' },
    { type: 'case_studies', priority: 'high', value: 'Social proof + E-E-A-T' },
    { type: 'free_templates', priority: 'medium', value: 'Lead generation' }
  ]
};

// ============================================================================
// HELPERS - SERP ANALYSIS
// ============================================================================

/**
 * Analyse une SERP et determine si le keyword est gagnant
 * @param {array} serpResults - Top 10 results avec domain et DA
 * @returns {object} Analyse SERP
 */
function analyzeSERP(serpResults) {
  const dominated = serpResults.filter(r =>
    SERP_THRESHOLDS.giants.some(g => r.domain?.includes(g)) ||
    r.domain_authority > SERP_THRESHOLDS.beatable_da_max
  ).length;

  const beatable = serpResults.length - dominated;

  let recommendation = '';
  let action = '';

  if (dominated >= 3) {
    recommendation = 'ABANDON';
    action = 'Pivoter vers long-tail. SERP dominee par geants.';
  } else if (beatable >= 5) {
    recommendation = 'GO';
    action = 'Opportunite reelle de ranking Top 10.';
  } else {
    recommendation = 'PRUDENT';
    action = 'Investissement eleve pour resultat incertain. Evaluer ROI.';
  }

  return {
    is_winnable: beatable >= 5,
    dominated_positions: dominated,
    beatable_positions: beatable,
    recommendation,
    action,
    alternative: dominated >= 3 ? 'Focus sur keywords long-tail + content clusters' : null
  };
}

/**
 * Verifie si un domaine est un "giant" a eviter
 * @param {string} domain
 * @returns {boolean}
 */
function isGiant(domain) {
  return SERP_THRESHOLDS.giants.some(g => domain?.toLowerCase().includes(g));
}

// ============================================================================
// HELPERS - ALGORITHM CHECK
// ============================================================================

/**
 * Verifie le statut de l'algorithme Google
 * @param {string} lastUpdateDate - Date ISO de la derniere update
 * @returns {object} Statut et recommandation
 */
function checkAlgorithmStatus(lastUpdateDate) {
  const now = new Date();
  const updateDate = new Date(lastUpdateDate || ALGORITHM_UPDATES.latest.date);
  const daysSince = Math.floor((now - updateDate) / (1000 * 60 * 60 * 24));

  const thresholds = ALGORITHM_UPDATES.stability_thresholds;

  let status = 'stable';
  let recommendation = '';
  let canPublish = true;

  if (daysSince < thresholds.volatile) {
    status = 'volatile';
    recommendation = 'ATTENDRE: Update recente en cours de deploiement. Reporter changements majeurs.';
    canPublish = false;
  } else if (daysSince < thresholds.cautious) {
    status = 'cautious';
    recommendation = 'PRUDENT: Volatilite possible. Monitorer rankings avant gros changements.';
    canPublish = true;
  } else {
    status = 'stable';
    recommendation = 'STABLE: Conditions favorables pour nouvelles publications.';
    canPublish = true;
  }

  return {
    status,
    days_since_update: daysSince,
    last_update: ALGORITHM_UPDATES.latest.name,
    recommendation,
    can_publish: canPublish,
    eeat_focus: ALGORITHM_UPDATES.latest.focus.includes('E-E-A-T')
  };
}

// ============================================================================
// HELPERS - COMPETITOR ANALYSIS
// ============================================================================

/**
 * Analyse les failles techniques d'un concurrent
 * @param {object} scanData - Donnees du scan concurrent
 * @returns {array} Failles exploitables
 */
function analyzeCompetitorWeaknesses(scanData) {
  const weaknesses = [];

  // Technical issues
  if (scanData.technical_issues) {
    for (const issue of scanData.technical_issues) {
      const priority = SCAN_PRIORITIES.technical_issues.find(p =>
        issue.issue?.toLowerCase().includes(p.issue.replace(/_/g, ' '))
      );

      weaknesses.push({
        type: 'technical',
        issue: issue.issue,
        severity: issue.severity || priority?.severity || 'medium',
        count: issue.count || 1,
        our_opportunity: issue.our_opportunity || priority?.opportunity || 'Avantage potentiel'
      });
    }
  }

  // Content gaps
  if (scanData.content_gaps) {
    for (const gap of scanData.content_gaps) {
      weaknesses.push({
        type: 'content',
        topic: gap.topic,
        traffic_potential: gap.traffic_estimate || 0,
        priority: gap.priority || 'medium',
        brief: gap.brief || `Creer contenu sur: ${gap.topic}`
      });
    }
  }

  return weaknesses.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return (severityOrder[a.severity] || 2) - (severityOrder[b.severity] || 2);
  });
}

// ============================================================================
// HELPERS - CREATIVE BRIEF GENERATION
// ============================================================================

/**
 * Genere un brief creatif pour le Creative Agent / Nano Banana
 * @param {object} insights - Insights strategiques
 * @param {object} brand - Brand memory
 * @returns {object} Brief complet
 */
function generateCreativeBrief(insights, brand) {
  const brandName = brand?.global_identity?.name || 'Agency Killer';

  // Extract key stat from insights
  const statInsight = insights?.find(i => i.category === 'opportunity' || i.category === 'trend');
  const statText = statInsight?.insight?.match(/\d+%/)?.[0] || '67%';

  return {
    // Headlines
    headline_suggestions: [
      `${brandName}: L'IA qui remplace votre agence`,
      `Stop aux fees d'agence. Hello ROI automatise.`,
      `${statText} des PME passent a l'IA marketing. Et vous ?`,
      `Votre agence vous coute 5000EUR/mois. Nous, 99EUR.`
    ],

    // Image overlay text
    image_text_overlay: {
      primary_text: 'ROI x3 garanti',
      secondary_text: 'Sans agence. Sans equipe.',
      cta_text: 'Essai gratuit 14j',
      variations: [
        { primary: 'ROI x3', secondary: 'Sans fees d\'agence' },
        { primary: statText + ' adoptent l\'IA', secondary: 'Rejoignez le mouvement' },
        { primary: '99EUR/mois', secondary: 'vs 5000EUR d\'agence' }
      ]
    },

    // Ad angles
    ad_angles: [
      {
        angle: 'Pain Point',
        hook: 'Votre agence vous coute 5000EUR/mois pour des resultats moyens ?',
        visual: 'Split screen: facture agence vs dashboard The Hive',
        emotion: 'Frustration → Solution'
      },
      {
        angle: 'Social Proof',
        hook: `${statText} des PME adoptent l'IA marketing en 2025`,
        visual: 'Chiffre en grand + visage satisfait entrepreneur',
        emotion: 'FOMO → Confiance'
      },
      {
        angle: 'Comparison',
        hook: 'Agence traditionnelle vs The Hive',
        visual: 'Tableau comparatif anime',
        emotion: 'Rationalite → Decision'
      }
    ],

    // Nano Banana Pro specific
    nano_banana_instructions: {
      tool: 'Nano Banana Pro',
      text_to_include: 'ROI x3 | Sans Agence',
      style: 'Modern, clean, professional, dark theme',
      formats: ['1080x1080 (Feed)', '1080x1920 (Story)', '1200x628 (Link)'],
      color_palette: {
        background: '#0A0A0A',
        primary_text: '#FFFFFF',
        accent: '#FFD700',
        cta: '#10B981'
      },
      key_elements: [
        'Logo discret en bas a droite',
        'Chiffre ROI prominent (grande typo)',
        'CTA visible avec contraste',
        'Espace negatif suffisant'
      ],
      avoid: [
        'Stock photos generiques',
        'Trop de texte (< 20% image)',
        'Couleurs criardes ou neon',
        'Polices fantaisie',
        'Effets 3D kitsch'
      ]
    }
  };
}

// ============================================================================
// FACTORY - WEB SEARCH RESULT COMPONENT
// ============================================================================

/**
 * Cree un composant WEB_SEARCH_RESULT conforme au schema UI
 */
function createWebSearchResult({
  query,
  results,
  summary,
  insights = [],
  actions = [],
  width = 'full'
}) {
  return {
    type: 'WEB_SEARCH_RESULT',
    data: {
      query,
      searched_at: new Date().toISOString(),
      summary,
      results: results.map(r => ({
        title: r.title,
        url: r.url,
        snippet: r.snippet,
        source_type: r.source_type || 'blog',
        relevance_score: r.relevance_score || 0.7,
        published_date: r.published_date || null,
        tags: r.tags || []
      })),
      key_insights: insights.map(i => ({
        insight: i.insight,
        category: i.category || 'fact',
        source_index: i.source_index || 0
      })),
      suggested_actions: actions
    },
    layout: { width, order: 1 }
  };
}

// ============================================================================
// FACTORY - COMPETITOR INTEL COMPONENT
// ============================================================================

/**
 * Cree un composant COMPETITOR_INTEL conforme au schema UI
 */
function createCompetitorIntel({
  name,
  url,
  domainAuthority,
  strengths = [],
  weaknesses = [],
  contentGaps = [],
  technicalIssues = [],
  ourAdvantages = [],
  strategy,
  width = 'full'
}) {
  return {
    type: 'COMPETITOR_INTEL',
    data: {
      competitor_name: name,
      competitor_url: url,
      scanned_at: new Date().toISOString(),
      domain_authority: domainAuthority,
      analysis: {
        strengths,
        weaknesses,
        content_gaps: contentGaps,
        technical_issues: technicalIssues
      },
      our_advantages: ourAdvantages,
      recommended_strategy: strategy
    },
    layout: { width, order: 2 }
  };
}

// ============================================================================
// FACTORY - BATTLE CARD COMPONENT
// ============================================================================

/**
 * Cree un composant BATTLE_CARD conforme au schema UI
 */
function createBattleCard({
  ourBrand,
  competitors,
  dimensions,
  width = 'full'
}) {
  // Calculate wins
  const ourWins = dimensions.filter(d => d.winner === 'us').length;

  return {
    type: 'BATTLE_CARD',
    data: {
      title: `${ourBrand} vs Concurrence`,
      test_hypothesis: 'Comparaison multi-dimensionnelle',
      variants: [
        {
          id: 'us',
          name: ourBrand,
          badge: 'recommended',
          preview: {
            headline: 'Notre Solution',
            primary_text: `${ourWins}/${dimensions.length} dimensions gagnees`
          },
          rationale: 'Leader sur valeur et innovation'
        },
        ...competitors.map((c, i) => ({
          id: `competitor_${i}`,
          name: c.name,
          badge: 'challenger',
          preview: {
            headline: c.positioning || 'Concurrent',
            primary_text: `${dimensions.filter(d => d.winner === `competitor_${i}`).length}/${dimensions.length} dimensions`
          },
          rationale: c.strength || ''
        }))
      ],
      selection_prompt: 'Voir le detail par dimension ?',
      agent_recommendation: {
        recommended_variant_id: 'us',
        reason: `Nous gagnons sur ${ourWins} dimensions critiques`,
        confidence: ourWins / dimensions.length
      },
      _dimensions: dimensions
    },
    layout: { width, order: 3 }
  };
}

// ============================================================================
// FACTORY - ALGORITHM ALERT COMPONENT
// ============================================================================

/**
 * Cree un composant ALGORITHM_ALERT
 */
function createAlgorithmAlert({
  updateName,
  status,
  recommendation,
  eeatFocus = false
}) {
  return {
    type: 'ALGORITHM_ALERT',
    data: {
      update_name: updateName,
      status: status,
      recommendation: recommendation,
      eeat_focus: eeatFocus,
      timestamp: new Date().toISOString()
    },
    layout: { width: 'full', order: 0 }
  };
}

// ============================================================================
// TEMPLATES - CHAT MESSAGES
// ============================================================================

const CHAT_TEMPLATES = {

  serpWinnable: (keyword, beatablePositions) => ({
    content: `**ANALYSE SERP: OPPORTUNITE**

**Keyword:** "${keyword}"
**SERP Reality Check:** GO

${beatablePositions} positions accessibles detectees dans le Top 10.
Aucun geant (HubSpot, Wikipedia) en positions dominantes.

**Recommandation:** Creer du contenu optimise pour ce keyword.`,
    tone: 'positive',
    follow_up_questions: [
      'Generer un brief de contenu ?',
      'Analyser les concurrents sur ce KW ?',
      'Voir d\'autres opportunites ?'
    ]
  }),

  serpBlocked: (keyword, dominatedBy) => ({
    content: `**ANALYSE SERP: PIVOT NECESSAIRE**

**Keyword initial:** "${keyword}"
**SERP Reality Check:** ABANDON

Top positions dominees par: ${dominatedBy.join(', ')}
Probabilite de ranking Top 10: < 5%

**Alternative recommandee:**
Pivoter vers une variante long-tail du keyword.`,
    tone: 'warning',
    follow_up_questions: [
      'Suggerer des alternatives long-tail ?',
      'Analyser une autre requete ?',
      'Voir le detail SERP ?'
    ]
  }),

  competitorWeaknesses: (competitor, weaknessCount) => ({
    content: `**SCAN CONCURRENT: FAILLES DETECTEES**

**Concurrent:** ${competitor}
**Failles identifiees:** ${weaknessCount}

Plusieurs opportunites d'exploitation detectees:
- Failles techniques (Alt tags, Core Web Vitals)
- Content gaps (sujets non couverts)
- Backlink gaps (sources inexploitees)

Voir le detail ci-dessous.`,
    tone: 'positive',
    follow_up_questions: [
      'Exploiter ces failles en contenu ?',
      'Scanner un autre concurrent ?',
      'Generer un brief creatif ?'
    ]
  }),

  algorithmVolatile: (updateName, daysSince) => ({
    content: `**ALERTE ALGORITHME**

**Update:** ${updateName}
**Il y a:** ${daysSince} jours
**Statut:** VOLATILITE EN COURS

**Recommandation:** Reporter les changements majeurs SEO.
Attendre la stabilisation (> 30 jours post-update).`,
    tone: 'warning',
    follow_up_questions: [
      'Que puis-je faire en attendant ?',
      'Quels types de contenus privilegier ?',
      'Monitorer mes rankings ?'
    ]
  })
};

// ============================================================================
// EXPORTS
// ============================================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    // Constants
    SERP_THRESHOLDS,
    ALGORITHM_UPDATES,
    SCAN_PRIORITIES,

    // Helpers
    analyzeSERP,
    isGiant,
    checkAlgorithmStatus,
    analyzeCompetitorWeaknesses,
    generateCreativeBrief,

    // Factories
    createWebSearchResult,
    createCompetitorIntel,
    createBattleCard,
    createAlgorithmAlert,

    // Templates
    CHAT_TEMPLATES
  };
}

// ============================================================================
// N8N CODE NODE USAGE
// ============================================================================
/*
 * Copier les fonctions necessaires dans votre Code Node:
 *
 * // SERP Reality Check
 * const serpAnalysis = analyzeSERP(topResults);
 * if (!serpAnalysis.is_winnable) {
 *   // Recommander pivot long-tail
 * }
 *
 * // Algorithm Check
 * const algoStatus = checkAlgorithmStatus('2024-03-05');
 * if (!algoStatus.can_publish) {
 *   // Afficher warning volatilite
 * }
 *
 * // Generate Creative Brief
 * const brief = generateCreativeBrief(insights, brandMemory);
 * // Passer au Creative Agent
 *
 * // Create Battle Card
 * const battleCard = createBattleCard({
 *   ourBrand: 'Agency Killer',
 *   competitors: [{ name: 'CompetitorA', positioning: 'Enterprise' }],
 *   dimensions: [
 *     { dimension: 'Prix', us: { value: '99EUR', score: 5 }, competitor_0: { value: '499EUR', score: 2 }, winner: 'us' }
 *   ]
 * });
 */
