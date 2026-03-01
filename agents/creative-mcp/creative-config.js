/**
 * ============================================================================
 * CREATIVE CONFIG - Agency Killer V4 (Cloud Native)
 * ============================================================================
 *
 * Configuration et helpers pour l'Agent Creative.
 * Specifications Nano Banana Pro, formats plateformes, factories UI.
 *
 * ============================================================================
 */

// ============================================================================
// CONSTANTES - PLATFORM SPECIFICATIONS
// ============================================================================

const PLATFORM_SPECS = {
  meta_feed: {
    name: 'Instagram/Facebook Feed',
    aspect_ratio: '1:1',
    dimensions: '1080x1080',
    width: 1080,
    height: 1080,
    text_safe_zone: 'center',
    max_text_ratio: 0.20,
    cta_position: 'bottom_center',
    avoid_zones: [],
    recommended_formats: ['image', 'carousel', 'video']
  },

  meta_story: {
    name: 'Instagram/Facebook Story',
    aspect_ratio: '9:16',
    dimensions: '1080x1920',
    width: 1080,
    height: 1920,
    text_safe_zone: 'center_middle',
    max_text_ratio: 0.20,
    cta_position: 'bottom_center',
    avoid_zones: [
      { zone: 'top', pixels: 60, reason: 'Instagram UI' },
      { zone: 'bottom', pixels: 100, reason: 'Swipe up / CTA area' }
    ],
    recommended_formats: ['image', 'video']
  },

  meta_reel: {
    name: 'Instagram/Facebook Reel',
    aspect_ratio: '9:16',
    dimensions: '1080x1920',
    width: 1080,
    height: 1920,
    text_safe_zone: 'center',
    max_text_ratio: 0.15,
    cta_position: 'bottom_center',
    avoid_zones: [
      { zone: 'bottom', pixels: 150, reason: 'Reels UI overlay' },
      { zone: 'right', pixels: 80, reason: 'Interaction buttons' }
    ],
    recommended_formats: ['video']
  },

  linkedin_feed: {
    name: 'LinkedIn Feed Post',
    aspect_ratio: '1.91:1',
    dimensions: '1200x628',
    width: 1200,
    height: 628,
    text_safe_zone: 'right',
    max_text_ratio: 0.25,
    cta_position: 'right_center',
    avoid_zones: [
      { zone: 'left', pixels: 100, reason: 'Profile photo overlap on mobile' }
    ],
    recommended_formats: ['image', 'carousel', 'document']
  },

  linkedin_banner: {
    name: 'LinkedIn Profile Banner',
    aspect_ratio: '4:1',
    dimensions: '1584x396',
    width: 1584,
    height: 396,
    text_safe_zone: 'right',
    max_text_ratio: 0.30,
    cta_position: 'right_center',
    avoid_zones: [
      { zone: 'left', pixels: 200, reason: 'Profile photo' },
      { zone: 'bottom_left', pixels: 150, reason: 'Name and title' }
    ],
    recommended_formats: ['image']
  },

  google_display: {
    name: 'Google Display Network',
    aspect_ratio: '1.91:1',
    dimensions: '1200x628',
    width: 1200,
    height: 628,
    text_safe_zone: 'center',
    max_text_ratio: 0.20,
    cta_position: 'bottom_right',
    avoid_zones: [],
    recommended_formats: ['image', 'responsive']
  },

  youtube_thumbnail: {
    name: 'YouTube Thumbnail',
    aspect_ratio: '16:9',
    dimensions: '1280x720',
    width: 1280,
    height: 720,
    text_safe_zone: 'left_center',
    max_text_ratio: 0.30,
    cta_position: 'center',
    avoid_zones: [
      { zone: 'bottom_right', pixels: 100, reason: 'Duration badge' }
    ],
    recommended_formats: ['image']
  }
};

// ============================================================================
// CONSTANTES - CREATIVE ANGLES
// ============================================================================

const CREATIVE_ANGLES = {
  pain_point: {
    id: 'pain_point',
    name: 'Pain Point Attack',
    description: 'Attaque directe sur le probleme du prospect',
    template: {
      headline: 'Stop aux [probleme].',
      subheadline: '[Solution] en [timeframe].',
      embedded_text: '[Chiffre] GARANTI',
      cta: 'Essai Gratuit'
    },
    visual_direction: 'Fond sombre, chiffre impact, accent neon sur CTA',
    best_for: ['awareness', 'consideration']
  },

  social_proof: {
    id: 'social_proof',
    name: 'Social Proof',
    description: 'Stats et temoignages pour credibilite',
    template: {
      headline: '[X]% des [cible] font ca.',
      subheadline: 'Et vous ?',
      embedded_text: '[X]%',
      cta: 'Rejoindre'
    },
    visual_direction: 'Stat en tres grand, gradient subtil, visage humain',
    best_for: ['consideration', 'conversion']
  },

  value_prop: {
    id: 'value_prop',
    name: 'Value Proposition',
    description: 'Benefice direct et prix',
    template: {
      headline: '[Benefice]. [Prix].',
      subheadline: 'Pas [alternative]. Juste [resultat].',
      embedded_text: '[Prix]/mois',
      cta: 'Commencer'
    },
    visual_direction: 'Prix en evidence, comparaison visuelle',
    best_for: ['conversion', 'retargeting']
  },

  fomo: {
    id: 'fomo',
    name: 'FOMO / Urgency',
    description: 'Creer urgence et peur de rater',
    template: {
      headline: 'Vos concurrents [action].',
      subheadline: 'Et vous ?',
      embedded_text: 'MAINTENANT',
      cta: 'Ne pas rater'
    },
    visual_direction: 'Timer visuel, couleurs urgence, fleche progression',
    best_for: ['conversion', 'promo']
  },

  comparison: {
    id: 'comparison',
    name: 'Before/After Comparison',
    description: 'Montrer la transformation',
    template: {
      headline: 'Avant / Apres',
      subheadline: 'La difference [produit].',
      embedded_text: 'AVANT → APRES',
      cta: 'Transformer'
    },
    visual_direction: 'Split screen, contraste fort, fleche transformation',
    best_for: ['awareness', 'consideration']
  }
};

// ============================================================================
// CONSTANTES - NANO BANANA PRO SETTINGS
// ============================================================================

const NANO_BANANA_DEFAULTS = {
  // Negative prompt global
  negative_prompt: 'blurry, low quality, watermark, stock photo feel, clipart, cartoon, amateur, busy background, multiple focal points, text unreadable, oversaturated, generic corporate, hands with wrong fingers',

  // Style presets
  style_presets: {
    tech_dark: {
      prompt_suffix: 'minimalist tech aesthetic, dark gradient background, soft neon glow, premium futuristic mood, clean composition',
      background: '#000000',
      accent: '#FF00FF'
    },
    corporate_clean: {
      prompt_suffix: 'professional corporate style, clean white background, subtle shadows, modern business aesthetic',
      background: '#FFFFFF',
      accent: '#3B82F6'
    },
    bold_vibrant: {
      prompt_suffix: 'bold vibrant colors, energetic composition, dynamic angles, high contrast',
      background: '#1a1a2e',
      accent: '#FFD700'
    },
    minimal_elegant: {
      prompt_suffix: 'elegant minimalist design, lots of negative space, sophisticated typography, premium feel',
      background: '#0a0a0a',
      accent: '#FFFFFF'
    }
  },

  // Text rendering guidelines
  text_guidelines: {
    primary_max_chars: 20,
    secondary_max_chars: 40,
    cta_max_chars: 15,
    recommended_fonts: ['Inter', 'Space Grotesk', 'Roboto', 'Montserrat'],
    min_contrast_ratio: 4.5
  }
};

// ============================================================================
// HELPERS - PLATFORM DETECTION
// ============================================================================

/**
 * Detecte la plateforme a partir du message utilisateur
 * @param {string} message - Message de l'utilisateur
 * @returns {string} ID de la plateforme
 */
function detectPlatform(message) {
  const msg = message.toLowerCase();

  if (msg.includes('story') || msg.includes('stories')) return 'meta_story';
  if (msg.includes('reel')) return 'meta_reel';
  if (msg.includes('linkedin')) {
    return msg.includes('banner') ? 'linkedin_banner' : 'linkedin_feed';
  }
  if (msg.includes('google') || msg.includes('display')) return 'google_display';
  if (msg.includes('youtube') || msg.includes('thumbnail')) return 'youtube_thumbnail';
  if (msg.includes('feed') || msg.includes('post') || msg.includes('instagram') || msg.includes('facebook')) {
    return 'meta_feed';
  }

  return 'meta_feed'; // Default
}

/**
 * Retourne les specs d'une plateforme
 * @param {string} platformId - ID de la plateforme
 * @returns {object} Specifications
 */
function getPlatformSpecs(platformId) {
  return PLATFORM_SPECS[platformId] || PLATFORM_SPECS.meta_feed;
}

// ============================================================================
// HELPERS - BRAND SAFETY
// ============================================================================

/**
 * Verifie la conformite brand safety d'un copy
 * @param {string} text - Texte a verifier
 * @param {array} bannedWords - Liste des mots interdits
 * @returns {object} Resultat du check
 */
function checkBrandSafety(text, bannedWords = []) {
  const textLower = text.toLowerCase();
  const foundBanned = bannedWords.filter(word =>
    textLower.includes(word.toLowerCase())
  );

  return {
    passed: foundBanned.length === 0,
    banned_words_found: foundBanned,
    text_checked: text,
    recommendation: foundBanned.length > 0
      ? `Reformuler pour eviter: ${foundBanned.join(', ')}`
      : 'OK - Aucun mot interdit'
  };
}

/**
 * Verifie le ratio texte/image
 * @param {number} textAreaPercent - Pourcentage de l'image couvert par le texte
 * @param {string} platform - Plateforme cible
 * @returns {object} Resultat du check
 */
function checkTextRatio(textAreaPercent, platform) {
  const specs = PLATFORM_SPECS[platform] || PLATFORM_SPECS.meta_feed;
  const maxRatio = specs.max_text_ratio * 100;

  return {
    passed: textAreaPercent <= maxRatio,
    current_ratio: textAreaPercent,
    max_allowed: maxRatio,
    platform: platform,
    recommendation: textAreaPercent > maxRatio
      ? `Reduire le texte de ${Math.round(textAreaPercent - maxRatio)}% pour Meta compliance`
      : 'OK - Ratio texte respecte'
  };
}

// ============================================================================
// HELPERS - NANO BANANA PRO PROMPT BUILDER
// ============================================================================

/**
 * Construit un prompt optimise pour Nano Banana Pro
 * @param {object} options - Options de generation
 * @returns {object} Prompt complet
 */
function buildNanaBananaPrompt({
  visualDescription,
  stylePreset = 'tech_dark',
  brandColors = {},
  embeddedText = {},
  platform = 'meta_feed'
}) {
  const preset = NANO_BANANA_DEFAULTS.style_presets[stylePreset] || NANO_BANANA_DEFAULTS.style_presets.tech_dark;
  const specs = PLATFORM_SPECS[platform];

  return {
    prompt: `${visualDescription}, ${preset.prompt_suffix}`,
    negative_prompt: NANO_BANANA_DEFAULTS.negative_prompt,

    embedded_text: {
      primary: embeddedText.primary || '',
      secondary: embeddedText.secondary || '',
      cta: embeddedText.cta || ''
    },

    aspect_ratio: specs.aspect_ratio,
    dimensions: specs.dimensions,

    style_params: {
      background: brandColors.primary || preset.background,
      text_color: brandColors.secondary || '#FFFFFF',
      accent_color: brandColors.accent || preset.accent,
      text_position: specs.text_safe_zone
    },

    avoid_zones: specs.avoid_zones
  };
}

// ============================================================================
// FACTORY - AD_PREVIEW COMPONENT
// ============================================================================

/**
 * Cree un composant AD_PREVIEW conforme au schema UI
 */
function createAdPreview({
  platform,
  imageUrl,
  headline,
  primaryText,
  description = '',
  cta,
  destinationUrl = '',
  embeddedText = {},
  persona = null,
  rationale = '',
  trigger = '',
  width = 'half'
}) {
  const ctaMap = {
    'Essai Gratuit': 'sign_up',
    'Commencer': 'sign_up',
    'Decouvrir': 'learn_more',
    'En savoir plus': 'learn_more',
    'Rejoindre': 'sign_up',
    'Acheter': 'shop_now',
    'Telecharger': 'download',
    'Reserver': 'book_now',
    'Contacter': 'contact_us'
  };

  return {
    type: 'AD_PREVIEW',
    data: {
      platform: platform,
      format: platform.includes('story') || platform.includes('reel') ? 'story' : 'feed',
      image_url: imageUrl,
      video_url: null,
      headline: headline,
      primary_text: primaryText,
      description: description,
      cta: ctaMap[cta] || 'learn_more',
      destination_url: destinationUrl,
      target_persona: persona,
      creative_rationale: rationale,
      trigger_used: trigger,
      embedded_text: embeddedText
    },
    layout: { width, order: 1 }
  };
}

// ============================================================================
// FACTORY - BATTLE_CARD COMPONENT (Creative Variants)
// ============================================================================

/**
 * Cree un composant BATTLE_CARD pour les variantes creatives
 */
function createCreativeBattleCard({
  variants,
  testHypothesis = 'Test d\'angle creatif',
  width = 'half'
}) {
  return {
    type: 'BATTLE_CARD',
    data: {
      title: 'Choisissez votre variante',
      test_hypothesis: testHypothesis,
      variants: variants.map((v, i) => ({
        id: v.id || `variant_${i}`,
        name: v.name || v.angle,
        badge: i === 0 ? 'recommended' : 'challenger',
        preview: {
          image_url: v.image_url,
          headline: v.headline,
          primary_text: v.body_text?.substring(0, 100) + '...',
          cta: v.cta
        },
        metrics: v.metrics || null,
        rationale: v.rationale
      })),
      selection_prompt: 'Quelle version preferez-vous lancer ?',
      agent_recommendation: {
        recommended_variant_id: variants[0]?.id || 'variant_0',
        reason: variants[0]?.rationale || 'Meilleur score predit',
        confidence: 0.85
      }
    },
    layout: { width, order: 2 }
  };
}

// ============================================================================
// FACTORY - BRAND_VOICE_CHECK COMPONENT
// ============================================================================

/**
 * Cree un composant BRAND_VOICE_CHECK
 */
function createBrandVoiceCheck({
  overallScore,
  colorMatch,
  toneMatch,
  bannedWordsFound = [],
  textRatioOk = true
}) {
  return {
    type: 'BRAND_VOICE_CHECK',
    data: {
      overall_score: overallScore,
      checks: [
        {
          name: 'Coherence couleurs',
          status: colorMatch ? 'pass' : 'fail',
          details: colorMatch ? 'Palette respectee' : 'Couleurs hors charte'
        },
        {
          name: 'Tone of Voice',
          status: toneMatch > 0.8 ? 'pass' : toneMatch > 0.6 ? 'warning' : 'fail',
          details: `Score: ${Math.round(toneMatch * 100)}%`
        },
        {
          name: 'Mots interdits',
          status: bannedWordsFound.length === 0 ? 'pass' : 'fail',
          details: bannedWordsFound.length === 0
            ? 'Aucun mot interdit'
            : `Trouves: ${bannedWordsFound.join(', ')}`
        },
        {
          name: 'Ratio texte/image',
          status: textRatioOk ? 'pass' : 'warning',
          details: textRatioOk ? '< 20% - OK Meta' : '> 20% - Reach potentiellement reduit'
        }
      ]
    },
    layout: { width: 'full', order: 3 }
  };
}

// ============================================================================
// TEMPLATES - COPY VARIATIONS
// ============================================================================

const COPY_TEMPLATES = {
  pain_point: {
    headlines: [
      'Stop aux fees d\'agence.',
      'Arretez de payer 5000EUR/mois.',
      'Votre agence vous ruine.',
      'Fini les resultats moyens.'
    ],
    embedded_texts: [
      'ROI x3 GARANTI',
      '-80% DE COUTS',
      'RESULTATS 24H',
      'ZERO AGENCE'
    ],
    ctas: ['Essai Gratuit', 'Tester', 'Commencer']
  },

  social_proof: {
    headlines: [
      '67% des PME passent a l\'IA.',
      '+500 entreprises automatisees.',
      'Ils ont triple leur ROI.',
      'Le marketing change. Et vous ?'
    ],
    embedded_texts: [
      '67%',
      '+500',
      'ROI x3',
      '2025'
    ],
    ctas: ['Rejoindre', 'Decouvrir', 'Voir comment']
  },

  value_prop: {
    headlines: [
      'Une agence IA. 99EUR/mois.',
      'Tout votre marketing. 99EUR.',
      '4 experts IA. 1 prix.',
      'Marketing complet. Prix startup.'
    ],
    embedded_texts: [
      '99EUR/mois',
      '-90%',
      '4 EN 1',
      'TOUT INCLUS'
    ],
    ctas: ['Commencer', 'S\'abonner', 'Essayer']
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    // Constants
    PLATFORM_SPECS,
    CREATIVE_ANGLES,
    NANO_BANANA_DEFAULTS,
    COPY_TEMPLATES,

    // Helpers
    detectPlatform,
    getPlatformSpecs,
    checkBrandSafety,
    checkTextRatio,
    buildNanaBananaPrompt,

    // Factories
    createAdPreview,
    createCreativeBattleCard,
    createBrandVoiceCheck
  };
}

// ============================================================================
// N8N CODE NODE USAGE
// ============================================================================
/*
 * Copier les fonctions necessaires dans votre Code Node:
 *
 * // Detecter la plateforme
 * const platform = detectPlatform(userMessage);
 * const specs = getPlatformSpecs(platform);
 *
 * // Construire le prompt Nano Banana
 * const nanaBananaPrompt = buildNanaBananaPrompt({
 *   visualDescription: 'Professional marketing visual with laptop',
 *   stylePreset: 'tech_dark',
 *   brandColors: { primary: '#000000', accent: '#FF00FF' },
 *   embeddedText: { primary: 'ROI x3', secondary: 'Sans agence', cta: 'Essai Gratuit' },
 *   platform: 'meta_story'
 * });
 *
 * // Verifier brand safety
 * const safetyCheck = checkBrandSafety(copyText, ['meilleur', 'garanti 100%']);
 *
 * // Creer AD_PREVIEW
 * const adPreview = createAdPreview({
 *   platform: 'meta_feed',
 *   imageUrl: 'https://...',
 *   headline: 'Stop aux fees d\'agence.',
 *   primaryText: 'Votre marketing 100% automatise...',
 *   cta: 'Essai Gratuit',
 *   embeddedText: { primary: 'ROI x3', secondary: 'Sans agence' }
 * });
 */
