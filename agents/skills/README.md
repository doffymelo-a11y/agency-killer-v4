# Skills Agents — Index Complet

**Total skills : 28** (Luna 5 + Sora 5 + Marcus 5 + Milo 5 + Doffy 5 + Orchestrator 3)

## Vue d'ensemble

Les **Skills** transforment nos agents IA de "bons" à "exceptionnels". Ce sont des méthodologies expertes step-by-step que les agents suivent pour garantir un output professionnel.

**Tools vs Skills :**
- **Tools** (MCP) = ce que l'agent **PEUT** faire (lancer une campagne, générer une image)
- **Skills** = ce que l'agent **SAIT** faire (méthodologie pour optimiser un budget, framework de copywriting)

---

## Index des Skills

### Luna (SEO & Content Strategist) — 5 skills

| Skill | Déclencheur | Output | Fichier |
|-------|-------------|--------|---------|
| SEO Audit Complete | "fais un audit SEO complet" | `SEO_AUDIT_REPORT` (score 0-100, quick wins, plan 30/60/90j) | [seo-audit-complete.skill.md](luna/seo-audit-complete.skill.md) |
| Content Strategy Builder | "crée une stratégie de contenu" | `CONTENT_CALENDAR` (12 semaines, mapping TOFU/MOFU/BOFU) | [content-strategy-builder.skill.md](luna/content-strategy-builder.skill.md) |
| Competitor Deep Dive | "analyse mes concurrents" | `COMPETITOR_REPORT` (SWOT, tech stack, SEO, social, ads) | [competitor-deep-dive.skill.md](luna/competitor-deep-dive.skill.md) |
| Landing Page Optimizer | "optimise cette landing page" | `LANDING_PAGE_AUDIT` (score 0-100, above-fold, trust signals) | [landing-page-optimizer.skill.md](luna/landing-page-optimizer.skill.md) |
| CMS Content Publisher | "publie ce contenu sur WordPress" | `PUBLISH_CONFIRMATION` (approval_request, jamais auto-publish) | [cms-content-publisher.skill.md](luna/cms-content-publisher.skill.md) |

### Sora (Analytics & Data Scientist) — 5 skills

| Skill | Déclencheur | Output | Fichier |
|-------|-------------|--------|---------|
| Performance Report Generator | "génère le rapport de performance" | `PDF_REPORT` (KPIs, insights, health score 0-100) | [performance-report-generator.skill.md](sora/performance-report-generator.skill.md) |
| Anomaly Detective | Détection automatique écarts >30% | `ANOMALY_ALERT` (suspect bug before celebrating, root cause) | [anomaly-detective.skill.md](sora/anomaly-detective.skill.md) |
| Tracking Setup Auditor | "vérifie mon tracking" | `TRACKING_AUDIT` (pixel check, events, UTM, score 0-100) | [tracking-setup-auditor.skill.md](sora/tracking-setup-auditor.skill.md) |
| Attribution Analyst | "analyse l'attribution multi-canal" | `ATTRIBUTION_REPORT` (CPA réel, budget recommendations) | [attribution-analyst.skill.md](sora/attribution-analyst.skill.md) |
| KPI Dashboard Builder | "crée un dashboard KPI" | `DASHBOARD_CONFIG` (KPIs sélectionnés par scope) | [kpi-dashboard-builder.skill.md](sora/kpi-dashboard-builder.skill.md) |

### Marcus (Paid Ads Specialist) — 5 skills

| Skill | Déclencheur | Output | Fichier |
|-------|-------------|--------|---------|
| Campaign Launch Checklist | "lance une nouvelle campagne" | `CAMPAIGN_CONFIG` (pre-flight check, validation) | [campaign-launch-checklist.skill.md](marcus/campaign-launch-checklist.skill.md) |
| Budget Optimizer Weekly | Tâche hebdomadaire automatique | `BUDGET_RECOMMENDATIONS` (SCALE/HOLD/OPTIMIZE/KILL matrix) | [budget-optimizer-weekly.skill.md](marcus/budget-optimizer-weekly.skill.md) |
| Creative Testing Framework | "teste ces créatifs" | `AB_TEST_CONFIG` (méthodologie A/B testing) | [creative-testing-framework.skill.md](marcus/creative-testing-framework.skill.md) |
| Scaling Playbook | "scale cette campagne" | `SCALING_PLAN` (horizontal puis vertical, +20%/day max) | [scaling-playbook.skill.md](marcus/scaling-playbook.skill.md) |
| Cross-Platform Budget Allocator | "répartis le budget entre plateformes" | `BUDGET_ALLOCATION` (70/20/10 rule, ROAS marginal) | [cross-platform-budget-allocator.skill.md](marcus/cross-platform-budget-allocator.skill.md) |

### Milo (Creative Producer) — 5 skills

| Skill | Déclencheur | Output | Fichier |
|-------|-------------|--------|---------|
| Ad Copy Frameworks | "écris une pub" | `AD_COPY_VARIATIONS` (AIDA, PAS, BAB, 4Ps, 3 variations) | [ad-copy-frameworks.skill.md](milo/ad-copy-frameworks.skill.md) |
| Visual Brief Creator | "crée un visuel" | `IMAGE_BRIEF` (Imagen 3.0 prompt, brand safety check) | [visual-brief-creator.skill.md](milo/visual-brief-creator.skill.md) |
| Video Ad Producer | "crée une vidéo" | `VIDEO_BRIEF` (script 5-8s, Veo-3 generation, ElevenLabs audio) | [video-ad-producer.skill.md](milo/video-ad-producer.skill.md) |
| Multi-Platform Adapter | "adapte ce contenu pour toutes les plateformes" | `PLATFORM_ADAPTATIONS` (Meta Feed/Story, LinkedIn, Google Display) | [multi-platform-adapter.skill.md](milo/multi-platform-adapter.skill.md) |
| Brand Voice Guardian | "vérifie la cohérence de marque" | `BRAND_CHECK` (score 0-100, tone, keywords, violations) | [brand-voice-guardian.skill.md](milo/brand-voice-guardian.skill.md) |

### Doffy (Social Media Manager) — 5 skills

| Skill | Déclencheur | Output | Fichier |
|-------|-------------|--------|---------|
| Social Content Calendar | "crée un calendrier de contenu social" | `CONTENT_CALENDAR` (mix 40/30/30, fréquence optimale) | [social-content-calendar.skill.md](doffy/social-content-calendar.skill.md) |
| Hashtag Strategist | "trouve des hashtags pour ce post" | `HASHTAG_STRATEGY` (mix 70/20/10, éviter shadowban) | [hashtag-strategist.skill.md](doffy/hashtag-strategist.skill.md) |
| Engagement Playbook | "comment augmenter l'engagement ?" | `ENGAGEMENT_TACTICS` (questions, polls, carrousels, UGC) | [engagement-playbook.skill.md](doffy/engagement-playbook.skill.md) |
| Social Analytics Interpreter | "analyse mes stats social media" | `SOCIAL_ANALYTICS_REPORT` (reach, engagement, anomalies, benchmark) | [social-analytics-interpreter.skill.md](doffy/social-analytics-interpreter.skill.md) |
| Trend Surfer | "quelles sont les tendances du moment ?" | `TREND_REPORT` (trending topics, relevance, timing, angle) | [trend-surfer.skill.md](doffy/trend-surfer.skill.md) |

### Orchestrator (Multi-Agent Coordination) — 3 skills

| Skill | Déclencheur | Output | Fichier |
|-------|-------------|--------|---------|
| Inter-Agent Handoff | Requête multi-agents | `WORKFLOW` (décomposition en sous-tâches, ordre, handoffs) | [inter-agent-handoff.skill.md](orchestrator/inter-agent-handoff.skill.md) |
| Client Report Orchestrator | "génère le rapport client mensuel" | `CLIENT_REPORT` (agrégation data tous agents, PDF) | [client-report-orchestrator.skill.md](orchestrator/client-report-orchestrator.skill.md) |
| Onboarding New Client | Nouveau projet créé | `ONBOARDING_CHECKLIST` (baseline audit, plan 30/60/90j) | [onboarding-new-client.skill.md](orchestrator/onboarding-new-client.skill.md) |

---

## Utilisation dans le code

Les skills sont injectés dynamiquement dans le system prompt de chaque agent selon le contexte détecté.

**Exemple (agent-executor.ts) :**

```typescript
// Détection contexte
const context = detectContext(userMessage, projectData);

// Load skills pertinents
const skills = await loadSkills(agentName, context);

// Injection dans system prompt
const systemPrompt = `
${BASE_SYSTEM_PROMPT}

# SKILLS DISPONIBLES

${skills.map(s => s.content).join('\n\n')}

Utilise ces méthodologies pour garantir un output professionnel.
`;
```

**Contexte détection patterns :**
- "audit SEO" → load `seo-audit-complete.skill`
- "lance campagne" → load `campaign-launch-checklist.skill`
- Message avec "budget" + "optimise" → load `budget-optimizer-weekly.skill`
- Rapport mensuel automatique → load `performance-report-generator.skill` + `client-report-orchestrator.skill`

---

## Évolution

**Phase suivante :**
- Skills apprenants (machine learning sur success rate)
- Custom skills par client (méthodologies spécifiques)
- Skill marketplace (partage entre utilisateurs)

**Contribution :**
Pour ajouter un nouveau skill, créer un fichier `.skill.md` suivant le format :
```markdown
# Nom du Skill — Agent

## Déclencheur
- Pattern de détection

## Méthodologie
1. Étape 1
2. Étape 2
...

## Output
```json
{
  "format": "exemple"
}
```
```

---

**Dernière mise à jour :** 2026-04-27
**Auteur :** Hive OS V5 Development Team
