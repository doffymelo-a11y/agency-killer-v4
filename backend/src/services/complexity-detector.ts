/**
 * Complexity Detector - Détecte la complexité d'une question utilisateur
 * Ajuste dynamiquement max_tokens et timeout en conséquence
 *
 * Principe : Plutôt qu'un timeout fixe, adapter aux besoins réels
 */

export interface ComplexityAnalysis {
  level: 'simple' | 'moderate' | 'complex';
  maxTokens: number;
  timeout: number; // en millisecondes
  reasoning: string;
}

// Mots-clés indicateurs de complexité
const COMPLEX_KEYWORDS = [
  'complet', 'complete', 'stratégie', 'strategy',
  'plan détaillé', 'detailed plan', 'élabore', 'elaborate',
  'exhaustif', 'comprehensive', 'approfondi', 'in-depth',
  'étape par étape', 'step by step', 'tout', 'all',
  'conception', 'design', 'architecture', 'framework'
];

const MODERATE_KEYWORDS = [
  'comment', 'how', 'pourquoi', 'why',
  'liste', 'list', 'recommandations', 'recommendations',
  'analyse', 'analysis', 'compare', 'comparer',
  'exemples', 'examples', 'options', 'choices'
];

/**
 * Détecte la complexité d'une question utilisateur
 */
export function detectComplexity(userMessage: string): ComplexityAnalysis {
  const messageLower = userMessage.toLowerCase();
  const wordCount = userMessage.trim().split(/\s+/).length;

  // Comptage des indicateurs
  const complexIndicators = COMPLEX_KEYWORDS.filter(kw => messageLower.includes(kw)).length;
  const moderateIndicators = MODERATE_KEYWORDS.filter(kw => messageLower.includes(kw)).length;

  // Questions très courtes (< 5 mots) = simple MAIS avec timeout généreux (system prompts 15-23KB)
  if (wordCount < 5) {
    return {
      level: 'simple',
      maxTokens: 2048, // Réponse courte attendue
      timeout: 25000, // 25s pour gérer les gros system prompts même sur questions simples
      reasoning: `Question courte (${wordCount} mots)`
    };
  }

  // Questions longues avec mots-clés complexes
  // CRITIQUE: Peut déclencher tool use (MCP) → 2-3 rounds Claude → 80s nécessaires
  if (complexIndicators >= 2 || (complexIndicators >= 1 && wordCount > 15)) {
    return {
      level: 'complex',
      maxTokens: 6144, // Réponse détaillée nécessaire
      timeout: 80000, // 80s pour traiter tool use + retry (augmenté de 60s)
      reasoning: `Question complexe (${complexIndicators} indicateurs, ${wordCount} mots)`
    };
  }

  // Questions moyennes - CRITIQUE: System prompts 15-23KB nécessitent plus de temps
  // CHANGEMENT: >= 5 mots considérés comme modérés (au lieu de >= 10)
  if (moderateIndicators >= 1 || wordCount >= 5) {
    return {
      level: 'moderate',
      maxTokens: 4096, // Réponse standard
      timeout: 50000, // 50s (augmenté de 45s car TOUTE question >= 5 mots demande du contexte)
      reasoning: `Question modérée (${moderateIndicators} indicateurs, ${wordCount} mots)`
    };
  }

  // Par défaut : simple (ne devrait presque jamais arriver maintenant)
  return {
    level: 'simple',
    maxTokens: 3072,
    timeout: 40000, // 40s par défaut pour sécurité
    reasoning: `Question simple (${wordCount} mots)`
  };
}

/**
 * Log la décision de complexité pour debugging
 */
export function logComplexityDecision(userMessage: string, analysis: ComplexityAnalysis): void {
  console.log('[Complexity Detector]', {
    level: analysis.level,
    maxTokens: analysis.maxTokens,
    timeout: `${analysis.timeout / 1000}s`,
    reasoning: analysis.reasoning,
    preview: userMessage.substring(0, 60) + '...'
  });
}
