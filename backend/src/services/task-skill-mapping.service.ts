/**
 * Task → Skill direct mapping service
 *
 * Maps the EXACT 102 Genesis task titles (with emojis, byte-for-byte from the
 * wizard config) to the agent/skill that should be loaded by agent-executor.
 *
 * Source of truth: /Roadmap:vision/V4_PROMPTS/01_BUG_FIX_AND_MAPPING.md
 *                  TACHE 1, lines 224-336.
 *
 * IMPORTANT — emoji bytes matter:
 *   Task titles are matched verbatim against the strings the wizard inserts
 *   into the `tasks.title` column. A single emoji variant change (FE0F vs
 *   no FE0F, ZWJ sequence reordered) will cause a silent miss → fallback to
 *   the legacy regex detector in agent-executor.
 *
 * Two flavours of mapping:
 *   - "OK existant"  → skill file exists in /agents/skills/<agent>/<skill>.skill.md
 *   - "TODO"         → skill path is decided but file not yet created (will
 *                      be authored in V4 files 02-07). Returned by
 *                      getSkillForTask() as null so the executor falls back
 *                      to regex/quality-standard plain reasoning.
 */

import { logger } from '../lib/logger.js';

// ─────────────────────────────────────────────────────────────────
// Mapping (102 entries)
// ─────────────────────────────────────────────────────────────────

export const TASK_TO_SKILL_MAPPING: Record<string, string> = {
  // ===== META_ADS (19 taches) =====
  '🎯 Définition Objectif & KPIs Campagne': 'sora/meta-ads-strategy-framework',  // TODO: skill manquant
  '👤 Création Avatar Client Idéal (ICP)': 'luna/icp-builder',  // TODO: skill manquant
  '💎 Formulation Offre Irrésistible': 'luna/offer-formulator',  // TODO: skill manquant
  '💰 Plan Budget & Allocation par Phase': 'marcus/budget-allocation-planner',  // TODO: skill manquant
  '🏢 Audit & Setup Business Manager': 'sora/meta-business-manager-setup',  // TODO: skill manquant
  '📍 Installation & Configuration Pixel Meta': 'sora/tracking-setup-auditor',  // OK existant
  '🔗 Configuration CAPI (Conversions API)': 'sora/capi-configurator',  // TODO: skill manquant
  '🌐 Vérification & Configuration Domaine': 'sora/meta-domain-verification',  // TODO: skill manquant
  '📊 Configuration Événements & Conversions': 'sora/tracking-setup-auditor',  // OK existant
  '🎨 Production Visuels (6 variations)': 'milo/visual-brief-creator',  // OK existant
  '✍️ Copywriting Ads (9 variations)': 'milo/ad-copy-frameworks',  // OK existant
  '🎪 Création Structure Campagne': 'marcus/meta-ads-campaign-structure',  // TODO: skill manquant
  '🎯 Configuration Ad Sets (Ciblage)': 'marcus/meta-ads-adset-configurator',  // TODO: skill manquant
  '📱 Configuration Publicités': 'marcus/meta-ads-creative-assembler',  // TODO: skill manquant
  '✅ QA Pre-Launch Checklist': 'marcus/campaign-launch-checklist',  // OK existant
  '🚀 Publication & Activation Campagne': 'marcus/campaign-launch-checklist',  // OK existant
  '📈 Monitoring Phase Apprentissage': 'sora/meta-ads-learning-monitor',  // TODO: skill manquant
  '📊 Analyse Performance & Recommandations': 'sora/performance-report-generator',  // OK existant
  '⚡ Scaling & Ajustements Continus': 'marcus/scaling-playbook',  // OK existant

  // ===== SEM (21 taches) =====
  '🎯 Définir KPIs (ROAS/CPA cible)': 'sora/sem-strategy-framework',  // TODO
  '🔑 Keyword Research (Étude Mots-clés)': 'luna/keyword-research-engine',  // TODO
  '🚫 Liste Mots-clés Négatifs': 'luna/sem-negative-keywords-builder',  // TODO
  '🔍 Analyse Concurrence Ads': 'luna/competitor-deep-dive',  // OK existant
  '🔗 Liaison Comptes (GA4 + GSC)': 'sora/tracking-setup-auditor',  // OK existant
  '📊 Suivi Conversions + Enhanced Conversions': 'sora/tracking-setup-auditor',  // OK existant
  '✅ Vérification Global Site Tag': 'sora/tracking-setup-auditor',  // OK existant
  '👥 Création Audiences (Segments)': 'sora/sem-audience-builder',  // TODO
  '🏗️ Découpage Campagnes': 'marcus/sem-campaign-structure',  // TODO
  '📁 Configuration Ad Groups (STAGs)': 'marcus/sem-adgroup-configurator',  // TODO
  '✍️ Rédaction RSA (Annonces)': 'milo/ad-copy-frameworks',  // OK existant
  '🔗 Configuration Extensions (Assets)': 'milo/sem-ad-extensions-optimizer',  // TODO
  '📞 Call to Action Optimization': 'milo/ad-copy-frameworks',  // OK existant
  '🌍 Paramètres Géographiques': 'marcus/sem-geo-targeting',  // TODO
  '💹 Stratégie Enchères': 'marcus/sem-bidding-strategy',  // TODO
  '💵 Configuration Budget': 'marcus/budget-optimizer-weekly',  // OK existant
  '✅ QA Check Pre-Launch': 'marcus/campaign-launch-checklist',  // OK existant
  '🚀 Mise en Ligne Campagnes': 'marcus/campaign-launch-checklist',  // OK existant
  '🔍 Analyse Termes de Recherche (J+3)': 'sora/sem-search-terms-analyzer',  // TODO
  '⭐ Analyse Quality Score': 'sora/sem-quality-score-analyzer',  // TODO
  '📈 Ajustements Enchères': 'marcus/sem-bid-adjustments',  // TODO

  // ===== SEO (26 taches) =====
  '🔑 Accès Google Search Console': 'sora/access-management',  // TODO
  '📊 Accès Google Analytics (GA4)': 'sora/access-management',  // TODO
  '🔧 Accès CMS': 'sora/access-management',  // TODO
  '🔍 Analyse Concurrents': 'luna/competitor-deep-dive',  // OK existant
  '🕷️ Crawl Complet': 'sora/site-crawl-analyzer',  // TODO
  '⚡ Vitesse (Core Web Vitals)': 'sora/core-web-vitals-optimizer',  // TODO
  '📱 Compatibilité Mobile': 'sora/mobile-compatibility-auditor',  // TODO
  '🔗 Structure URLs': 'sora/url-structure-optimizer',  // TODO
  '🗺️ Sitemap & Robots.txt': 'sora/xml-sitemap-manager',  // TODO
  '🔒 Sécurité SSL': 'sora/ssl-security-setup',  // TODO
  '📋 Audit Existant': 'luna/seo-audit-complete',  // OK existant
  '🔑 Keyword Research': 'luna/seo-keyword-research',
  '📊 Gap Analysis': 'luna/seo-gap-analysis',  // TODO
  '🗂️ Mapping Sémantique': 'luna/content-strategy-builder',  // OK existant
  '🏷️ Optimisation Balises Title': 'milo/seo-title-meta-optimizer',  // TODO
  '📝 Optimisation Méta Descriptions': 'milo/seo-title-meta-optimizer',  // TODO
  '📑 Structure Hn': 'milo/seo-heading-structure-optimizer',  // TODO
  '📄 Contenu & Densité': 'milo/seo-content-density-optimizer',  // TODO
  '🖼️ Optimisation Images': 'milo/seo-image-optimizer',  // TODO
  '🔗 Maillage Interne': 'milo/seo-internal-linking',  // TODO
  '📋 Mapping Redirections 301': 'sora/seo-redirect-mapper',  // TODO
  '⚙️ Implémentation Redirections': 'sora/seo-redirect-implementer',  // TODO
  '✅ Vérification Post-Mise en ligne': 'sora/seo-post-migration-validator',  // TODO
  '🔗 Audit Backlinks': 'luna/backlink-audit-manager',  // TODO
  '📍 Google Business Profile': 'marcus/local-seo-optimizer',  // TODO
  '🔗 Campagne Netlinking': 'luna/netlinking-campaign-builder',  // TODO

  // ===== ANALYTICS (21 taches) =====
  '📦 Création Compte GTM': 'sora/tracking-setup-auditor',  // OK existant
  '📊 Configuration GA4': 'sora/tracking-setup-auditor',  // OK existant
  '⚙️ Réglages GA4': 'sora/ga4-advanced-settings',  // TODO
  '🚫 Filtres Internes': 'sora/gtm-filters-configurator',  // TODO
  '🍪 Choix CMP (Consent Banner)': 'sora/cmp-selector-advisor',  // TODO
  '✅ Consent Mode v2': 'sora/consent-mode-v2-setup',  // TODO
  '🔍 Audit Technique Data Layer': 'sora/datalayer-auditor',  // TODO
  '📋 Specs Développeur': 'sora/developer-specs-generator',  // TODO
  '🏷️ Balise Configuration GA4': 'sora/tracking-setup-auditor',  // OK existant
  '🔗 Conversion Linker': 'sora/tracking-setup-auditor',  // OK existant
  '👆 Suivi des Clics': 'sora/gtm-click-tracking-setup',  // TODO
  '📝 Suivi des Formulaires': 'sora/gtm-form-tracking-setup',  // TODO
  '🛒 Events E-commerce Standard': 'sora/ecommerce-events-configurator',  // TODO
  '💰 Variables Data Layer E-com': 'sora/ecommerce-datalayer-builder',  // TODO
  '📱 Meta Pixel + CAPI': 'sora/tracking-setup-auditor',  // OK existant
  '🔍 Google Ads Conversion': 'sora/tracking-setup-auditor',  // OK existant
  '💼 LinkedIn/TikTok Insight Tags': 'sora/multi-pixel-manager',  // TODO
  '🔬 GTM Preview Mode': 'sora/gtm-preview-qa-validator',  // TODO
  '📡 GA4 DebugView': 'sora/ga4-debugview-validator',  // TODO
  '📊 Connexion Looker Studio': 'sora/looker-studio-dashboard-builder',  // TODO
  '📈 Dashboarding': 'sora/kpi-dashboard-builder',  // OK existant

  // ===== SOCIAL_MEDIA (15 taches) =====
  '📱 Audit Présence Social Media Actuelle': 'doffy/social-analytics-interpreter',  // OK partiel (a enrichir)
  '🎯 Définition Stratégie & Objectifs Social Media': 'doffy/social-strategy-framework',  // TODO
  '🔍 Analyse Concurrents & Benchmark Social': 'doffy/social-competitor-analyzer',  // TODO
  '👤 Définition Audiences & Personas par Plateforme': 'doffy/social-audience-personas',  // TODO
  '🔗 Connexion Comptes Réseaux Sociaux': 'doffy/social-account-connector',  // TODO
  '📋 Création Calendrier Éditorial Mensuel': 'doffy/social-content-calendar',  // OK existant a enrichir
  '🎨 Création Templates & Assets Visuels': 'milo/visual-brief-creator',  // OK existant
  '✍️ Définition Piliers & Templates de Copywriting': 'doffy/social-copywriting-framework',  // TODO
  '📝 Rédaction Batch de Posts (Semaine 1)': 'doffy/social-batch-copywriter',  // TODO
  '🎬 Production Vidéos Courtes (Reels/TikTok/Stories)': 'milo/video-ad-producer',  // OK existant
  '📅 Programmation & Scheduling des Posts': 'doffy/social-post-scheduler',  // TODO
  '🚀 Publication & Lancement Social Media': 'doffy/social-publication-manager',  // TODO
  '📊 Analyse Performance & Engagement Semaine 1': 'doffy/social-analytics-interpreter',  // OK existant a enrichir
  '🔄 Optimisation Contenu & Horaires de Publication': 'doffy/social-optimization-strategist',  // TODO
  '📈 Rapport Social Media & Recommandations': 'doffy/social-monthly-reporter',  // TODO
};

// ─────────────────────────────────────────────────────────────────
// Skills known to ship today (file exists in /agents/skills/<agent>/<skill>.skill.md).
// Updated as new skills land via V4 files 02-07. A target listed in the
// mapping but absent from this set is treated as "TODO" → null returned by
// getSkillForTask so the executor falls back to the regex detector.
// ─────────────────────────────────────────────────────────────────

export const EXISTING_SKILLS: ReadonlySet<string> = new Set([
  // luna
  'luna/competitor-deep-dive',
  'luna/content-strategy-builder',
  'luna/seo-audit-complete',
  'luna/seo-keyword-research',
  // sora
  'sora/tracking-setup-auditor',
  'sora/performance-report-generator',
  'sora/kpi-dashboard-builder',
  // marcus
  'marcus/campaign-launch-checklist',
  'marcus/scaling-playbook',
  'marcus/budget-optimizer-weekly',
  // milo
  'milo/visual-brief-creator',
  'milo/ad-copy-frameworks',
  'milo/video-ad-producer',
  // doffy
  'doffy/social-analytics-interpreter',
  'doffy/social-content-calendar',
]);

// ─────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────

/**
 * Returns the skill path for a given Genesis task title — but only if the
 * skill file is known to exist today (via EXISTING_SKILLS). For TODO entries
 * (mapped to a future skill path that hasn't shipped yet) the function
 * returns null so the caller can fall back to regex-based detection or to
 * the universal Response Quality Standard.
 */
export function getSkillForTask(taskTitle: string): string | null {
  const skill = TASK_TO_SKILL_MAPPING[taskTitle];
  if (!skill) {
    logger.warn('[TaskSkillMapping] No mapping for task', { taskTitle });
    return null;
  }
  if (!EXISTING_SKILLS.has(skill)) {
    logger.warn('[TaskSkillMapping] Skill is TODO (not yet authored)', {
      taskTitle,
      plannedSkill: skill,
    });
    return null;
  }
  return skill;
}

/**
 * Counts mapping coverage: how many of the 102 Genesis tasks point to a
 * skill file that exists today. Useful as a health check / progress metric
 * while V4 files 02-07 land their respective skills.
 */
export function getMappingStats(): { total: number; mapped: number; missing: number } {
  const total = Object.keys(TASK_TO_SKILL_MAPPING).length;
  const mapped = Object.values(TASK_TO_SKILL_MAPPING).filter((skill) =>
    EXISTING_SKILLS.has(skill)
  ).length;
  return { total, mapped, missing: total - mapped };
}
