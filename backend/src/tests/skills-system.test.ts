/**
 * Skills System End-to-End Tests
 * Tests exhaustifs du système de skills : chargement, détection, injection
 */

import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─────────────────────────────────────────────────────────────────
// Test Configuration
// ─────────────────────────────────────────────────────────────────

interface TestResult {
  category: string;
  test: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  details?: any;
}

const results: TestResult[] = [];

function logTest(category: string, test: string, status: 'PASS' | 'FAIL' | 'WARN', message: string, details?: any) {
  const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${emoji} [${category}] ${test}: ${message}`);
  if (details) {
    console.log(`   Details:`, details);
  }
  results.push({ category, test, status, message, details });
}

// ─────────────────────────────────────────────────────────────────
// Expected Skills Configuration
// ─────────────────────────────────────────────────────────────────

const EXPECTED_SKILLS = {
  luna: [
    'seo-audit-complete.skill.md',
    'content-strategy-builder.skill.md',
    'competitor-deep-dive.skill.md',
    'landing-page-optimizer.skill.md',
    'cms-content-publisher.skill.md',
  ],
  sora: [
    'performance-report-generator.skill.md',
    'anomaly-detective.skill.md',
    'tracking-setup-auditor.skill.md',
    'attribution-analyst.skill.md',
    'kpi-dashboard-builder.skill.md',
  ],
  marcus: [
    'campaign-launch-checklist.skill.md',
    'budget-optimizer-weekly.skill.md',
    'creative-testing-framework.skill.md',
    'scaling-playbook.skill.md',
    'cross-platform-budget-allocator.skill.md',
  ],
  milo: [
    'ad-copy-frameworks.skill.md',
    'visual-brief-creator.skill.md',
    'video-ad-producer.skill.md',
    'multi-platform-adapter.skill.md',
    'brand-voice-guardian.skill.md',
  ],
  doffy: [
    'social-content-calendar.skill.md',
    'hashtag-strategist.skill.md',
    'engagement-playbook.skill.md',
    'social-analytics-interpreter.skill.md',
    'trend-surfer.skill.md',
  ],
  orchestrator: [
    'inter-agent-handoff.skill.md',
    'client-report-orchestrator.skill.md',
    'onboarding-new-client.skill.md',
  ],
};

// ─────────────────────────────────────────────────────────────────
// Detection Patterns (copied from agent-executor.ts)
// ─────────────────────────────────────────────────────────────────

const SKILL_PATTERNS: Record<string, string[]> = {
  // Luna skills
  'luna/seo-audit-complete': ['audit seo', 'analyse seo', 'seo complet', 'audit de site'],
  'luna/content-strategy-builder': ['stratégie de contenu', 'calendrier éditorial', 'content strategy', 'planning contenu'],
  'luna/competitor-deep-dive': ['analyse concurrence', 'concurrent', 'compétiteur', 'swot'],
  'luna/landing-page-optimizer': ['landing page', 'page d\'atterrissage', 'optimise.*page'],
  'luna/cms-content-publisher': ['publie', 'publish', 'wordpress', 'cms'],

  // Sora skills
  'sora/performance-report-generator': ['rapport', 'report', 'performance', 'kpi', 'analytics'],
  'sora/anomaly-detective': ['anomalie', 'bug', 'problème tracking', 'donnée bizarre'],
  'sora/tracking-setup-auditor': ['tracking', 'pixel', 'ga4', 'gtm', 'tag manager'],
  'sora/attribution-analyst': ['attribution', 'source', 'canal', 'conversion path'],
  'sora/kpi-dashboard-builder': ['dashboard', 'tableau de bord', 'visualisation'],

  // Marcus skills
  'marcus/campaign-launch-checklist': ['lance.*campagne', 'nouvelle campagne', 'créer campagne'],
  'marcus/budget-optimizer-weekly': ['optimise budget', 'budget', 'répartition budget'],
  'marcus/creative-testing-framework': ['test.*créatif', 'a/b test', 'test visuel'],
  'marcus/scaling-playbook': ['scale', 'augmente budget', 'scaling'],
  'marcus/cross-platform-budget-allocator': ['multi.*plateforme', 'répartis.*budget', 'allocation', 'entre.*meta.*google', 'entre.*google.*meta', 'plusieurs.*plateformes'],

  // Milo skills
  'milo/ad-copy-frameworks': ['écris.*pub', 'copywriting', 'texte publicitaire', 'ad copy', '\\bpub\\b', '\\btexte\\b.*pub', 'rédige'],
  'milo/visual-brief-creator': ['crée.*visuel', 'image', 'design', 'visual', '\\bvisuel\\b', 'graphique', 'bannière'],
  'milo/video-ad-producer': ['vidéo', 'video', 'clip', 'film'],
  'milo/multi-platform-adapter': ['adapte', 'multi.*plateforme', 'formats', 'meta.*linkedin', 'linkedin.*meta', 'toutes.*plateformes'],
  'milo/brand-voice-guardian': ['brand voice', 'cohérence', 'marque', 'tone', 'vérifie.*marque'],

  // Doffy skills
  'doffy/social-content-calendar': ['calendrier.*social', 'planning.*social', 'posts'],
  'doffy/hashtag-strategist': ['hashtag', '#'],
  'doffy/engagement-playbook': ['engagement', 'interaction', 'commentaire'],
  'doffy/social-analytics-interpreter': ['stats.*social', 'analytics.*social', 'reach', 'impressions'],
  'doffy/trend-surfer': ['tendance', 'trend', 'viral'],

  // Orchestrator skills
  'orchestrator/inter-agent-handoff': ['multi.*agent', 'plusieurs.*agents', 'workflow'],
  'orchestrator/client-report-orchestrator': ['rapport.*client', 'rapport.*mensuel'],
  'orchestrator/onboarding-new-client': ['onboarding', 'nouveau.*projet', 'démarrage'],
};

// ─────────────────────────────────────────────────────────────────
// Test 1: File System - Verify all skills exist
// ─────────────────────────────────────────────────────────────────

async function testSkillFilesExist() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('TEST 1: Vérification fichiers skills (28 fichiers)');
  console.log('═══════════════════════════════════════════════════\n');

  const skillsBasePath = join(__dirname, '../../../agents/skills');
  let totalExpected = 0;
  let totalFound = 0;

  for (const [agent, skillFiles] of Object.entries(EXPECTED_SKILLS)) {
    for (const skillFile of skillFiles) {
      totalExpected++;
      const skillPath = join(skillsBasePath, agent, skillFile);

      try {
        const content = await readFile(skillPath, 'utf-8');

        if (content.length === 0) {
          logTest('Files', `${agent}/${skillFile}`, 'FAIL', 'Fichier vide');
        } else if (content.length < 100) {
          logTest('Files', `${agent}/${skillFile}`, 'WARN', `Fichier très court (${content.length} chars)`);
          totalFound++;
        } else {
          logTest('Files', `${agent}/${skillFile}`, 'PASS', `Fichier OK (${content.length} chars)`);
          totalFound++;
        }
      } catch (error: any) {
        logTest('Files', `${agent}/${skillFile}`, 'FAIL', `Fichier introuvable: ${error.message}`);
      }
    }
  }

  console.log(`\n📊 Résultat: ${totalFound}/${totalExpected} fichiers trouvés`);
}

// ─────────────────────────────────────────────────────────────────
// Test 2: Skill Content Structure
// ─────────────────────────────────────────────────────────────────

async function testSkillContentStructure() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('TEST 2: Validation structure contenu skills');
  console.log('═══════════════════════════════════════════════════\n');

  const skillsBasePath = join(__dirname, '../../../agents/skills');
  const requiredSections = ['## Déclencheur', '## Méthodologie', '## Output'];

  for (const [agent, skillFiles] of Object.entries(EXPECTED_SKILLS)) {
    for (const skillFile of skillFiles) {
      const skillPath = join(skillsBasePath, agent, skillFile);

      try {
        const content = await readFile(skillPath, 'utf-8');
        const missingSections: string[] = [];

        for (const section of requiredSections) {
          if (!content.includes(section)) {
            missingSections.push(section);
          }
        }

        if (missingSections.length === 0) {
          logTest('Structure', `${agent}/${skillFile}`, 'PASS', 'Toutes les sections présentes');
        } else {
          logTest('Structure', `${agent}/${skillFile}`, 'FAIL', 'Sections manquantes', missingSections);
        }

        // Vérifier présence code JSON dans Output
        const hasJsonOutput = content.includes('```json') || content.includes('```');
        if (hasJsonOutput) {
          logTest('Structure', `${agent}/${skillFile} (JSON)`, 'PASS', 'Format JSON présent');
        } else {
          logTest('Structure', `${agent}/${skillFile} (JSON)`, 'WARN', 'Pas de bloc JSON trouvé');
        }
      } catch (error: any) {
        logTest('Structure', `${agent}/${skillFile}`, 'FAIL', `Erreur lecture: ${error.message}`);
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────
// Test 3: Pattern Detection
// ─────────────────────────────────────────────────────────────────

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

async function testPatternDetection() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('TEST 3: Détection patterns contextuelle');
  console.log('═══════════════════════════════════════════════════\n');

  // Test cases réalistes par agent
  const testCases = [
    // Luna
    { agent: 'luna', message: 'Fais un audit SEO complet de mon site', expectedSkill: 'luna/seo-audit-complete' },
    { agent: 'luna', message: 'Crée une stratégie de contenu pour 3 mois', expectedSkill: 'luna/content-strategy-builder' },
    { agent: 'luna', message: 'Analyse mes concurrents principaux', expectedSkill: 'luna/competitor-deep-dive' },
    { agent: 'luna', message: 'Optimise ma landing page produit', expectedSkill: 'luna/landing-page-optimizer' },
    { agent: 'luna', message: 'Publie cet article sur WordPress', expectedSkill: 'luna/cms-content-publisher' },

    // Sora
    { agent: 'sora', message: 'Génère le rapport de performance mensuel', expectedSkill: 'sora/performance-report-generator' },
    { agent: 'sora', message: 'J\'ai une anomalie dans mes données analytics', expectedSkill: 'sora/anomaly-detective' },
    { agent: 'sora', message: 'Vérifie mon tracking GA4', expectedSkill: 'sora/tracking-setup-auditor' },
    { agent: 'sora', message: 'Analyse l\'attribution multi-canal', expectedSkill: 'sora/attribution-analyst' },
    { agent: 'sora', message: 'Crée un dashboard KPI pour le CEO', expectedSkill: 'sora/kpi-dashboard-builder' },

    // Marcus
    { agent: 'marcus', message: 'Lance une nouvelle campagne Meta Ads', expectedSkill: 'marcus/campaign-launch-checklist' },
    { agent: 'marcus', message: 'Optimise mon budget publicitaire', expectedSkill: 'marcus/budget-optimizer-weekly' },
    { agent: 'marcus', message: 'Je veux tester 3 créatifs différents', expectedSkill: 'marcus/creative-testing-framework' },
    { agent: 'marcus', message: 'Scale ma meilleure campagne', expectedSkill: 'marcus/scaling-playbook' },
    { agent: 'marcus', message: 'Répartis 5000€ entre Meta et Google', expectedSkill: 'marcus/cross-platform-budget-allocator' },

    // Milo
    { agent: 'milo', message: 'Écris une pub pour ce produit', expectedSkill: 'milo/ad-copy-frameworks' },
    { agent: 'milo', message: 'Crée un visuel Meta Feed', expectedSkill: 'milo/visual-brief-creator' },
    { agent: 'milo', message: 'Produis une vidéo publicitaire de 8 secondes', expectedSkill: 'milo/video-ad-producer' },
    { agent: 'milo', message: 'Adapte ce contenu pour toutes les plateformes', expectedSkill: 'milo/multi-platform-adapter' },
    { agent: 'milo', message: 'Vérifie la cohérence de marque de ce texte', expectedSkill: 'milo/brand-voice-guardian' },

    // Doffy
    { agent: 'doffy', message: 'Crée un calendrier de contenu social pour avril', expectedSkill: 'doffy/social-content-calendar' },
    { agent: 'doffy', message: 'Trouve des hashtags pour ce post Instagram', expectedSkill: 'doffy/hashtag-strategist' },
    { agent: 'doffy', message: 'Comment augmenter l\'engagement sur mes posts ?', expectedSkill: 'doffy/engagement-playbook' },
    { agent: 'doffy', message: 'Analyse mes stats social media', expectedSkill: 'doffy/social-analytics-interpreter' },
    { agent: 'doffy', message: 'Quelles sont les tendances du moment ?', expectedSkill: 'doffy/trend-surfer' },

    // Orchestrator (disponible pour tous)
    { agent: 'luna', message: 'Onboarding nouveau client avec workflow complet', expectedSkill: 'orchestrator/onboarding-new-client' },
    { agent: 'sora', message: 'Génère le rapport client mensuel', expectedSkill: 'orchestrator/client-report-orchestrator' },
  ];

  let passCount = 0;
  let failCount = 0;

  for (const testCase of testCases) {
    const detected = detectRelevantSkills(testCase.message, testCase.agent);

    if (detected.includes(testCase.expectedSkill)) {
      logTest('Pattern', testCase.message.slice(0, 50), 'PASS', `Détecté: ${testCase.expectedSkill}`);
      passCount++;
    } else {
      logTest('Pattern', testCase.message.slice(0, 50), 'FAIL', `Expected: ${testCase.expectedSkill}, Got: ${detected.join(', ') || 'aucun'}`);
      failCount++;
    }
  }

  console.log(`\n📊 Résultat: ${passCount}/${testCases.length} patterns détectés correctement`);
}

// ─────────────────────────────────────────────────────────────────
// Test 4: Edge Cases & Robustness
// ─────────────────────────────────────────────────────────────────

async function testEdgeCases() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('TEST 4: Edge cases et robustesse');
  console.log('═══════════════════════════════════════════════════\n');

  // Test 4.1: Message vide
  const emptyDetected = detectRelevantSkills('', 'luna');
  logTest('EdgeCase', 'Message vide', emptyDetected.length === 0 ? 'PASS' : 'FAIL', `Détecté: ${emptyDetected.length} skills`);

  // Test 4.2: Message sans pattern
  const noPatternDetected = detectRelevantSkills('Bonjour comment ça va ?', 'luna');
  logTest('EdgeCase', 'Message sans pattern', noPatternDetected.length === 0 ? 'PASS' : 'FAIL', `Détecté: ${noPatternDetected.length} skills`);

  // Test 4.3: Multiple patterns dans un message
  const multiDetected = detectRelevantSkills('Fais un audit SEO puis crée une stratégie de contenu', 'luna');
  logTest('EdgeCase', 'Multiple patterns', multiDetected.length >= 2 ? 'PASS' : 'WARN', `Détecté: ${multiDetected.length} skills`);

  // Test 4.4: Pattern case insensitive
  const uppercaseDetected = detectRelevantSkills('AUDIT SEO COMPLET', 'luna');
  logTest('EdgeCase', 'Case insensitive', uppercaseDetected.includes('luna/seo-audit-complete') ? 'PASS' : 'FAIL', `Détecté: ${uppercaseDetected.join(', ')}`);

  // Test 4.5: Pattern avec accents
  const accentDetected = detectRelevantSkills('Crée une vidéo publicitaire', 'milo');
  logTest('EdgeCase', 'Accents français', accentDetected.includes('milo/video-ad-producer') ? 'PASS' : 'FAIL', `Détecté: ${accentDetected.join(', ')}`);

  // Test 4.6: Agent inexistant
  const invalidAgentDetected = detectRelevantSkills('audit SEO', 'invalid-agent');
  logTest('EdgeCase', 'Agent inexistant', invalidAgentDetected.length === 0 ? 'PASS' : 'FAIL', `Détecté: ${invalidAgentDetected.length} skills`);

  // Test 4.7: Orchestrator skills disponibles pour tous les agents
  const orchestratorForLuna = detectRelevantSkills('onboarding nouveau client', 'luna');
  const orchestratorForSora = detectRelevantSkills('onboarding nouveau client', 'sora');
  logTest('EdgeCase', 'Orchestrator skills pour Luna', orchestratorForLuna.includes('orchestrator/onboarding-new-client') ? 'PASS' : 'FAIL', '');
  logTest('EdgeCase', 'Orchestrator skills pour Sora', orchestratorForSora.includes('orchestrator/onboarding-new-client') ? 'PASS' : 'FAIL', '');
}

// ─────────────────────────────────────────────────────────────────
// Test 5: Real User Scenarios (End-to-End)
// ─────────────────────────────────────────────────────────────────

async function testRealUserScenarios() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('TEST 5: Scénarios utilisateur réalistes (E2E)');
  console.log('═══════════════════════════════════════════════════\n');

  const scenarios = [
    {
      name: 'Nouveau client e-commerce',
      agent: 'luna',
      message: 'J\'ai un nouveau client qui vend des produits bio en ligne. Je veux analyser ses concurrents et optimiser sa landing page.',
      expectedSkills: ['luna/competitor-deep-dive', 'luna/landing-page-optimizer'],
    },
    {
      name: 'Optimisation campagne existante',
      agent: 'marcus',
      message: 'Ma campagne Meta tourne depuis 2 semaines avec un ROAS de 3.2. Je veux la scale et tester de nouveaux créatifs.',
      expectedSkills: ['marcus/scaling-playbook', 'marcus/creative-testing-framework'],
    },
    {
      name: 'Reporting mensuel client',
      agent: 'sora',
      message: 'Génère le rapport mensuel avec toutes les KPIs et analyse les anomalies détectées.',
      expectedSkills: ['sora/performance-report-generator', 'sora/anomaly-detective'],
    },
    {
      name: 'Création contenu social',
      agent: 'doffy',
      message: 'Crée un calendrier de posts Instagram pour le mois prochain avec les hashtags optimisés.',
      expectedSkills: ['doffy/social-content-calendar', 'doffy/hashtag-strategist'],
    },
    {
      name: 'Production créative complète',
      agent: 'milo',
      message: 'J\'ai besoin d\'une pub complète : texte, visuel et vidéo adaptés pour Meta et LinkedIn.',
      expectedSkills: ['milo/ad-copy-frameworks', 'milo/visual-brief-creator', 'milo/video-ad-producer', 'milo/multi-platform-adapter'],
    },
  ];

  for (const scenario of scenarios) {
    const detected = detectRelevantSkills(scenario.message, scenario.agent);
    const foundAll = scenario.expectedSkills.every(skill => detected.includes(skill));

    if (foundAll) {
      logTest('E2E', scenario.name, 'PASS', `${detected.length} skills détectés`, detected);
    } else {
      const missing = scenario.expectedSkills.filter(skill => !detected.includes(skill));
      logTest('E2E', scenario.name, 'FAIL', `Skills manquants: ${missing.join(', ')}`, { detected, expected: scenario.expectedSkills });
    }
  }
}

// ─────────────────────────────────────────────────────────────────
// Test 6: Performance & Scale
// ─────────────────────────────────────────────────────────────────

async function testPerformance() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('TEST 6: Performance et scalabilité');
  console.log('═══════════════════════════════════════════════════\n');

  const skillsBasePath = join(__dirname, '../../../agents/skills');

  // Test 6.1: Temps de chargement d'un skill
  const startLoadOne = Date.now();
  try {
    await readFile(join(skillsBasePath, 'luna/seo-audit-complete.skill.md'), 'utf-8');
    const loadTime = Date.now() - startLoadOne;
    logTest('Performance', 'Chargement 1 skill', loadTime < 50 ? 'PASS' : 'WARN', `${loadTime}ms`);
  } catch (error) {
    logTest('Performance', 'Chargement 1 skill', 'FAIL', 'Erreur lecture');
  }

  // Test 6.2: Temps de chargement de tous les skills
  const startLoadAll = Date.now();
  let loadedCount = 0;
  for (const [agent, skillFiles] of Object.entries(EXPECTED_SKILLS)) {
    for (const skillFile of skillFiles) {
      try {
        await readFile(join(skillsBasePath, agent, skillFile), 'utf-8');
        loadedCount++;
      } catch (error) {
        // Skip
      }
    }
  }
  const loadAllTime = Date.now() - startLoadAll;
  logTest('Performance', `Chargement ${loadedCount} skills`, loadAllTime < 500 ? 'PASS' : 'WARN', `${loadAllTime}ms (${(loadAllTime / loadedCount).toFixed(1)}ms/skill)`);

  // Test 6.3: Temps de détection de patterns
  const startDetect = Date.now();
  for (let i = 0; i < 100; i++) {
    detectRelevantSkills('Fais un audit SEO complet et crée une stratégie de contenu', 'luna');
  }
  const detectTime = Date.now() - startDetect;
  logTest('Performance', '100 détections de patterns', detectTime < 100 ? 'PASS' : 'WARN', `${detectTime}ms (${(detectTime / 100).toFixed(2)}ms/détection)`);
}

// ─────────────────────────────────────────────────────────────────
// Test 7: Agent-Specific Coverage
// ─────────────────────────────────────────────────────────────────

async function testAgentCoverage() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('TEST 7: Couverture skills par agent');
  console.log('═══════════════════════════════════════════════════\n');

  for (const [agent, expectedFiles] of Object.entries(EXPECTED_SKILLS)) {
    const agentSkills = Object.keys(SKILL_PATTERNS).filter(key => key.startsWith(`${agent}/`));

    if (agentSkills.length === expectedFiles.length) {
      logTest('Coverage', `Agent ${agent}`, 'PASS', `${agentSkills.length}/${expectedFiles.length} skills avec patterns`);
    } else {
      logTest('Coverage', `Agent ${agent}`, 'FAIL', `${agentSkills.length}/${expectedFiles.length} skills avec patterns`);
    }
  }
}

// ─────────────────────────────────────────────────────────────────
// Main Test Runner
// ─────────────────────────────────────────────────────────────────

async function runAllTests() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║  SKILLS SYSTEM - TESTS EXHAUSTIFS END-TO-END              ║');
  console.log('║  28 skills × 6 agents × tests complets                    ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  await testSkillFilesExist();
  await testSkillContentStructure();
  await testPatternDetection();
  await testEdgeCases();
  await testRealUserScenarios();
  await testPerformance();
  await testAgentCoverage();

  // Final Summary
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('RÉSUMÉ FINAL');
  console.log('═══════════════════════════════════════════════════════════\n');

  const passCount = results.filter(r => r.status === 'PASS').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;
  const warnCount = results.filter(r => r.status === 'WARN').length;
  const total = results.length;

  console.log(`✅ PASS: ${passCount}`);
  console.log(`❌ FAIL: ${failCount}`);
  console.log(`⚠️  WARN: ${warnCount}`);
  console.log(`📊 TOTAL: ${total} tests`);
  console.log(`\n🎯 Taux de réussite: ${((passCount / total) * 100).toFixed(1)}%`);

  if (failCount > 0) {
    console.log('\n❌ ÉCHECS DÉTECTÉS:\n');
    results
      .filter(r => r.status === 'FAIL')
      .forEach(r => {
        console.log(`  • [${r.category}] ${r.test}: ${r.message}`);
        if (r.details) {
          console.log(`    Details:`, r.details);
        }
      });
  }

  if (warnCount > 0) {
    console.log('\n⚠️  WARNINGS:\n');
    results
      .filter(r => r.status === 'WARN')
      .forEach(r => {
        console.log(`  • [${r.category}] ${r.test}: ${r.message}`);
      });
  }

  console.log('\n═══════════════════════════════════════════════════════════\n');

  // Exit with error code if failures
  if (failCount > 0) {
    process.exit(1);
  }
}

// Run tests
runAllTests().catch((error) => {
  console.error('❌ ERREUR CRITIQUE:', error);
  process.exit(1);
});
