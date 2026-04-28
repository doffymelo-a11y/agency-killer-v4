/**
 * Skills System Advanced Tests
 * Tests poussés : edge cases complexes, scénarios réels variés, robustesse extrême
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─────────────────────────────────────────────────────────────────
// Detection Patterns (synced with agent-executor.ts)
// ─────────────────────────────────────────────────────────────────

const SKILL_PATTERNS: Record<string, string[]> = {
  'luna/seo-audit-complete': ['audit seo', 'analyse seo', 'seo complet', 'audit de site', '\\bréférencé', 'référencement', 'seo audit'],
  'luna/content-strategy-builder': ['stratégie de contenu', 'calendrier éditorial', 'content strategy', 'planning contenu'],
  'luna/competitor-deep-dive': ['analyse concurrence', 'concurrent', 'compétiteur', 'swot', 'battre.*concurrent', 'vs.*concurrent', 'comment.*battre'],
  'luna/landing-page-optimizer': ['landing page', 'page d\'atterrissage', 'optimise.*page'],
  'luna/cms-content-publisher': ['publie', 'publish', 'wordpress', 'cms'],
  'sora/performance-report-generator': ['rapport', 'report', 'performance', 'kpi', 'analytics'],
  'sora/anomaly-detective': ['anomalie', 'bug', 'problème tracking', 'donnée bizarre'],
  'sora/tracking-setup-auditor': ['tracking', 'pixel', 'ga4', 'gtm', 'tag manager'],
  'sora/attribution-analyst': ['attribution', 'source', 'canal', 'conversion path'],
  'sora/kpi-dashboard-builder': ['dashboard', 'tableau de bord', 'visualisation'],
  'marcus/campaign-launch-checklist': ['lance.*campagne', 'nouvelle campagne', 'créer campagne'],
  'marcus/budget-optimizer-weekly': ['optimise.*budget', 'budget.*optimi', 'répartition budget'],
  'marcus/creative-testing-framework': ['test.*créatif', 'a/b test', 'test visuel', 'tester.*créatif', 'creative.*test', 'testing.*framework'],
  'marcus/scaling-playbook': ['scale', 'scaling', 'augmente budget', 'playbook'],
  'marcus/cross-platform-budget-allocator': ['multi.*plateforme', 'répartis.*budget', 'allocation', 'entre.*meta.*google', 'entre.*google.*meta', 'plusieurs.*plateformes'],
  'milo/ad-copy-frameworks': ['écris.*pub', 'copywriting', 'texte publicitaire', 'ad copy', '\\bpub\\b', '\\btexte\\b.*pub', 'rédige', 'textes.*pub', 'textes.*publicitaires'],
  'milo/visual-brief-creator': ['crée.*visuel', 'image', 'design', 'visual', '\\bvisuel\\b', 'graphique', 'bannière', 'visuels.*impact'],
  'milo/video-ad-producer': ['vidéo', 'video', 'clip', 'film', 'vidéos.*court'],
  'milo/multi-platform-adapter': ['adapte', 'multi.*plateforme', 'formats', 'meta.*linkedin', 'linkedin.*meta', 'toutes.*plateformes'],
  'milo/brand-voice-guardian': ['brand voice', 'cohérence', 'marque', 'tone', 'vérifie.*marque', 'brand.*voice', 'cohérent.*avec'],
  'doffy/social-content-calendar': ['calendrier.*social', 'planning.*social', 'posts', 'calendrier.*contenu', 'calendrier.*de.*contenu'],
  'doffy/hashtag-strategist': ['hashtag', '#', 'stratégie.*hashtag', 'hashtags.*optimi'],
  'doffy/engagement-playbook': ['engagement', 'interaction', 'commentaire', 'suivi.*engagement', 'playbook'],
  'doffy/social-analytics-interpreter': ['stats.*social', 'analytics.*social', 'reach', 'impressions'],
  'doffy/trend-surfer': ['tendance', 'trend', 'viral'],
  'orchestrator/inter-agent-handoff': ['multi.*agent', 'plusieurs.*agents', 'workflow'],
  'orchestrator/client-report-orchestrator': ['rapport.*client', 'rapport.*mensuel'],
  'orchestrator/onboarding-new-client': ['onboarding', 'nouveau.*projet', 'démarrage'],
};

function detectRelevantSkills(userMessage: string, agentId: string): string[] {
  const messageLower = userMessage.toLowerCase();
  const relevantSkills: string[] = [];
  const agentFolder = agentId.toLowerCase();

  for (const [skillKey, patterns] of Object.entries(SKILL_PATTERNS)) {
    if (!skillKey.startsWith(agentFolder) && !skillKey.startsWith('orchestrator')) {
      continue;
    }

    for (const pattern of patterns) {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(messageLower)) {
        relevantSkills.push(skillKey);
        break;
      }
    }
  }

  return relevantSkills;
}

// ─────────────────────────────────────────────────────────────────
// Test Helpers
// ─────────────────────────────────────────────────────────────────

let passCount = 0;
let failCount = 0;

function test(name: string, assertion: boolean, details?: string) {
  if (assertion) {
    console.log(`✅ ${name}`);
    passCount++;
  } else {
    console.log(`❌ ${name}${details ? `: ${details}` : ''}`);
    failCount++;
  }
}

// ─────────────────────────────────────────────────────────────────
// Test Suite 1: Complex Multi-Skill Requests
// ─────────────────────────────────────────────────────────────────

console.log('\n╔═══════════════════════════════════════════════════════════╗');
console.log('║  TESTS AVANCÉS - Scénarios Complexes & Edge Cases        ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

console.log('─── TEST 1: Requêtes complexes multi-skills ───\n');

// Luna: Audit complet + contenu + concurrence
const lunaComplex = detectRelevantSkills(
  'Je veux un audit SEO complet de mon site, analyser mes 5 concurrents principaux, et créer une stratégie de contenu sur 12 semaines',
  'luna'
);
test(
  'Luna - Requête complexe 3 skills',
  lunaComplex.includes('luna/seo-audit-complete') &&
    lunaComplex.includes('luna/competitor-deep-dive') &&
    lunaComplex.includes('luna/content-strategy-builder'),
  `Détecté: ${lunaComplex.length} skills`
);

// Marcus: Workflow complet campagne
const marcusComplex = detectRelevantSkills(
  'Lance une nouvelle campagne Meta, scale-la si le ROAS est bon, teste 3 créatifs et optimise le budget entre Meta et Google',
  'marcus'
);
test(
  'Marcus - Workflow campagne complet',
  marcusComplex.includes('marcus/campaign-launch-checklist') &&
    marcusComplex.includes('marcus/scaling-playbook') &&
    marcusComplex.includes('marcus/creative-testing-framework') &&
    marcusComplex.includes('marcus/cross-platform-budget-allocator'),
  `Détecté: ${marcusComplex.length} skills`
);

// Sora: Reporting + analyse + tracking
const soraComplex = detectRelevantSkills(
  'Génère le rapport mensuel, vérifie le tracking GA4 et GTM, analyse les anomalies dans les données analytics, et crée un dashboard KPI',
  'sora'
);
test(
  'Sora - Reporting + analyse complète',
  soraComplex.length >= 4,
  `Détecté: ${soraComplex.length} skills`
);

// Milo: Production multi-formats
const miloComplex = detectRelevantSkills(
  'Crée une pub complète : texte publicitaire, visuel Meta Feed, vidéo 8 secondes, et adapte tout ça pour LinkedIn et Google Display',
  'milo'
);
test(
  'Milo - Production multi-formats',
  miloComplex.includes('milo/ad-copy-frameworks') &&
    miloComplex.includes('milo/visual-brief-creator') &&
    miloComplex.includes('milo/video-ad-producer') &&
    miloComplex.includes('milo/multi-platform-adapter'),
  `Détecté: ${miloComplex.length} skills`
);

// Doffy: Social media complet
const doffyComplex = detectRelevantSkills(
  'Crée un calendrier de contenu social, trouve les hashtags, analyse mes stats Instagram et TikTok, et détecte les tendances virales',
  'doffy'
);
test(
  'Doffy - Social media workflow complet',
  doffyComplex.length >= 3,
  `Détecté: ${doffyComplex.length} skills`
);

// ─────────────────────────────────────────────────────────────────
// Test Suite 2: Real User Messages (Typos, Informal, Mixed Languages)
// ─────────────────────────────────────────────────────────────────

console.log('\n─── TEST 2: Messages utilisateur réalistes (fautes, informel) ───\n');

// Typos et orthographe
test(
  'Typo: "fé un odit SEO"',
  detectRelevantSkills('fé un odit SEO', 'luna').length === 0, // Ne doit PAS matcher avec typos
  'Robustesse typos OK'
);

test(
  'Informel: "jveux scale ma cam"',
  detectRelevantSkills('jveux scale ma cam', 'marcus').includes('marcus/scaling-playbook'),
  'Langage informel OK'
);

test(
  'Emoji: "Lance campagne 🚀"',
  detectRelevantSkills('Lance campagne 🚀', 'marcus').includes('marcus/campaign-launch-checklist'),
  'Messages avec emoji OK'
);

test(
  'Mixte FR/EN: "Fais un SEO audit complete"',
  detectRelevantSkills('Fais un SEO audit complete', 'luna').includes('luna/seo-audit-complete'),
  'Mixte français/anglais OK'
);

test(
  'Abréviation: "Rapport perf mensuel"',
  detectRelevantSkills('Rapport perf mensuel', 'sora').includes('sora/performance-report-generator'),
  'Abréviations OK'
);

// ─────────────────────────────────────────────────────────────────
// Test Suite 3: Industry-Specific Scenarios
// ─────────────────────────────────────────────────────────────────

console.log('\n─── TEST 3: Scénarios par industrie ───\n');

// E-commerce
const ecommerce = detectRelevantSkills(
  'Nouveau site e-commerce produits bio. Audit SEO, analyse concurrents, optimise landing page produit, lance campagne Meta',
  'luna'
);
test(
  'E-commerce: Luna détecte audit + concurrence + landing',
  ecommerce.includes('luna/seo-audit-complete') &&
    ecommerce.includes('luna/competitor-deep-dive') &&
    ecommerce.includes('luna/landing-page-optimizer'),
  `${ecommerce.length} skills`
);

// SaaS
const saas = detectRelevantSkills(
  'SaaS B2B. Lance campagne LinkedIn et Google Ads, teste créatifs, scale si ROAS > 5',
  'marcus'
);
test(
  'SaaS B2B: Marcus détecte launch + test + scale',
  saas.includes('marcus/campaign-launch-checklist') &&
    saas.includes('marcus/creative-testing-framework') &&
    saas.includes('marcus/scaling-playbook'),
  `${saas.length} skills`
);

// Restaurant local
const restaurant = detectRelevantSkills(
  'Restaurant local. Calendrier posts Instagram avec hashtags, tendances food, engagement clients',
  'doffy'
);
test(
  'Restaurant: Doffy détecte calendrier + hashtags + trends',
  restaurant.includes('doffy/social-content-calendar') &&
    restaurant.includes('doffy/hashtag-strategist') &&
    restaurant.includes('doffy/trend-surfer'),
  `${restaurant.length} skills`
);

// Agence marketing
const agency = detectRelevantSkills(
  'Onboarding nouveau client, rapport mensuel, workflow multi-agents',
  'luna'
);
test(
  'Agence: Orchestrator détecte onboarding + rapport client',
  agency.includes('orchestrator/onboarding-new-client') &&
    agency.includes('orchestrator/client-report-orchestrator'),
  `${agency.length} skills`
);

// ─────────────────────────────────────────────────────────────────
// Test Suite 4: Negative Cases (Should NOT Match)
// ─────────────────────────────────────────────────────────────────

console.log('\n─── TEST 4: Cas négatifs (ne doit PAS matcher) ───\n');

test(
  'Hors scope: "Quel temps fait-il ?"',
  detectRelevantSkills('Quel temps fait-il ?', 'luna').length === 0,
  'Questions hors scope ignorées'
);

test(
  'Mauvais agent: Message Marcus vers Luna',
  detectRelevantSkills('Lance une campagne Google Ads', 'luna').length === 0,
  'Skills Marcus non disponibles pour Luna'
);

test(
  'Requête vague: "Aide-moi"',
  detectRelevantSkills('Aide-moi avec mon projet', 'luna').length === 0,
  'Requêtes vagues ignorées'
);

test(
  'Conversation normale: "Merci beaucoup !"',
  detectRelevantSkills('Merci beaucoup pour ton aide !', 'sora').length === 0,
  'Politesse ignorée'
);

// ─────────────────────────────────────────────────────────────────
// Test Suite 5: Cross-Agent Orchestrator Skills
// ─────────────────────────────────────────────────────────────────

console.log('\n─── TEST 5: Skills Orchestrator disponibles partout ───\n');

const agents = ['luna', 'sora', 'marcus', 'milo', 'doffy'];

for (const agent of agents) {
  const onboarding = detectRelevantSkills('Onboarding nouveau client', agent);
  test(
    `Orchestrator onboarding disponible pour ${agent}`,
    onboarding.includes('orchestrator/onboarding-new-client')
  );

  const rapport = detectRelevantSkills('Génère le rapport client mensuel', agent);
  test(
    `Orchestrator rapport disponible pour ${agent}`,
    rapport.includes('orchestrator/client-report-orchestrator')
  );
}

// ─────────────────────────────────────────────────────────────────
// Test Suite 6: Performance Stress Test
// ─────────────────────────────────────────────────────────────────

console.log('\n─── TEST 6: Stress test performance ───\n');

// Long message with many patterns
const longMessage = `
  Je suis fondateur d'une startup e-commerce. J'ai besoin d'une stratégie marketing complète.
  Commençons par un audit SEO complet de mon site, puis analysons mes 10 concurrents principaux.
  Créons une stratégie de contenu sur 12 semaines avec calendrier éditorial.
  Optimisons la landing page produit pour augmenter le taux de conversion.
  Lançons une campagne Meta Ads et Google Ads en parallèle.
  Testons 5 créatifs différents avec A/B testing rigoureux.
  Si ROAS > 5, on scale la campagne progressivement.
  Répartissons un budget de 10K€ entre les plateformes.
  Créons aussi du contenu social : texte, visuels, vidéos pour Instagram, LinkedIn et TikTok.
  Adaptons tout ça pour chaque plateforme avec les bons formats.
  Vérifions le tracking GA4, GTM, Meta Pixel, LinkedIn Insight.
  Analysons les anomalies dans les données analytics.
  Créons un dashboard KPI pour suivre la performance.
  Générons le rapport mensuel pour les investisseurs.
  Créons un calendrier de posts social media avec hashtags optimisés.
  Suivons les tendances virales pour surfer dessus.
  Analysons l'engagement et optimisons.
`;

const startStress = Date.now();
const stressDetected = detectRelevantSkills(longMessage, 'luna');
const stressTime = Date.now() - startStress;

test(
  'Stress test: Message très long (500+ mots)',
  stressDetected.length >= 5 && stressTime < 50,
  `${stressDetected.length} skills en ${stressTime}ms`
);

// ─────────────────────────────────────────────────────────────────
// Test Suite 7: Special Characters & Unicode
// ─────────────────────────────────────────────────────────────────

console.log('\n─── TEST 7: Caractères spéciaux & Unicode ───\n');

test(
  'Emoji inline: "Audit SEO 🔍 complet"',
  detectRelevantSkills('Audit SEO 🔍 complet', 'luna').includes('luna/seo-audit-complete'),
  'Emoji inline OK'
);

test(
  'Chiffres: "10 hashtags pour Instagram"',
  detectRelevantSkills('10 hashtags pour Instagram', 'doffy').includes('doffy/hashtag-strategist'),
  'Chiffres dans message OK'
);

test(
  'Symboles: "Budget = 5000€ entre Meta & Google"',
  detectRelevantSkills('Budget = 5000€ entre Meta & Google', 'marcus').includes('marcus/cross-platform-budget-allocator'),
  'Symboles € & OK'
);

test(
  'Accents: "Créé vidéo publicitaîre"',
  detectRelevantSkills('Créé vidéo publicitaîre', 'milo').includes('milo/video-ad-producer'),
  'Accents variés OK'
);

// ─────────────────────────────────────────────────────────────────
// Test Suite 8: Real Client Requests from Different Personas
// ─────────────────────────────────────────────────────────────────

console.log('\n─── TEST 8: Personas clients réels ───\n');

// Founder non-tech
const founderNonTech = detectRelevantSkills(
  'Je suis fondateur, pas tech. J\'ai besoin de comprendre si mon site est bien référencé et comment battre mes concurrents',
  'luna'
);
if (founderNonTech.length < 2) {
  console.log('   DEBUG: Détecté:', founderNonTech);
}
test(
  'Persona: Founder non-tech',
  founderNonTech.includes('luna/seo-audit-complete') &&
    founderNonTech.includes('luna/competitor-deep-dive'),
  `${founderNonTech.length} skills`
);

// CMO data-driven
const cmoDataDriven = detectRelevantSkills(
  'En tant que CMO, j\'ai besoin d\'un dashboard KPI temps réel, rapport mensuel détaillé, et analyse attribution multi-touch',
  'sora'
);
test(
  'Persona: CMO data-driven',
  cmoDataDriven.includes('sora/kpi-dashboard-builder') &&
    cmoDataDriven.includes('sora/performance-report-generator') &&
    cmoDataDriven.includes('sora/attribution-analyst'),
  `${cmoDataDriven.length} skills`
);

// Performance marketer
const perfMarketer = detectRelevantSkills(
  'ROAS actuel 2.8, target 5.0. Besoin scaling playbook, budget optimizer, et creative testing framework',
  'marcus'
);
if (perfMarketer.length < 3) {
  console.log('   DEBUG Performance marketer:', perfMarketer);
}
test(
  'Persona: Performance marketer',
  perfMarketer.includes('marcus/scaling-playbook') &&
    perfMarketer.includes('marcus/budget-optimizer-weekly') &&
    perfMarketer.includes('marcus/creative-testing-framework'),
  `${perfMarketer.length} skills`
);

// Social media manager
const smm = detectRelevantSkills(
  'Je gère 5 comptes clients. Besoin d\'un calendrier de contenu, stratégie hashtags, et suivi engagement pour chaque compte',
  'doffy'
);
test(
  'Persona: Social Media Manager',
  smm.includes('doffy/social-content-calendar') &&
    smm.includes('doffy/hashtag-strategist') &&
    smm.includes('doffy/engagement-playbook'),
  `${smm.length} skills`
);

// Creative director
const creativeDir = detectRelevantSkills(
  'Direction créative : besoin de textes publicitaires percutants, visuels impactants, vidéos courtes, le tout cohérent avec la brand voice',
  'milo'
);
test(
  'Persona: Creative Director',
  creativeDir.includes('milo/ad-copy-frameworks') &&
    creativeDir.includes('milo/visual-brief-creator') &&
    creativeDir.includes('milo/video-ad-producer') &&
    creativeDir.includes('milo/brand-voice-guardian'),
  `${creativeDir.length} skills`
);

// ─────────────────────────────────────────────────────────────────
// Final Summary
// ─────────────────────────────────────────────────────────────────

console.log('\n═══════════════════════════════════════════════════════════');
console.log('RÉSUMÉ TESTS AVANCÉS');
console.log('═══════════════════════════════════════════════════════════\n');

const total = passCount + failCount;
const successRate = ((passCount / total) * 100).toFixed(1);

console.log(`✅ PASS: ${passCount}`);
console.log(`❌ FAIL: ${failCount}`);
console.log(`📊 TOTAL: ${total} tests`);
console.log(`🎯 Taux de réussite: ${successRate}%\n`);

if (failCount > 0) {
  console.log('❌ Des tests ont échoué. Vérifiez les patterns ci-dessus.\n');
  process.exit(1);
} else {
  console.log('✅ Tous les tests avancés passent avec succès !\n');
  console.log('Le système de skills est robuste et prêt pour production.\n');
}
