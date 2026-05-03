# 01 — BUG FIX + TASK SKILL MAPPING

**Effort :** 5 jours total
**Bloquant :** OUI — sans ces 2 fixes, les 51 skills crees ne servent a rien
**Ordre :** B1 d'abord, puis B2

---

## PROMPT B0 — Lecture des directives + decouverte skills Anthropic (1 jour)

CE PROMPT DOIT ETRE EXECUTE AVANT B1 ET B2.

[Le contenu du Prompt B0 sera donne a l execution, voir le fichier 00_BIS_DIRECTIVES_GLOBALES.md pour les directives a respecter]

---

## PROMPT B1 — Fix bug critique de lancement de tache (2 jours)

```
Tu es le dev senior de The Hive OS. Quand l'utilisateur clique "Lancer la tache" depuis le tableur, 3 problemes :
1. Le message d'attente "🐝 Sora lance l'analyse..." disparait trop vite
2. Les agents retournent "Une erreur s'est produite..." au lieu de la vraie erreur
3. La cause racine de l'erreur n'est pas identifiee

Ce prompt corrige les 3 problemes en profondeur.

REFERENCES A LIRE :
- /cockpit/src/views/BoardView.tsx (lignes 80-327, fonction launchTask + catch error ligne 308-326)
- /cockpit/src/components/chat/ChatPanel.tsx (rendering du chat)
- /backend/src/agents/agent-executor.ts (lignes 48-256, securite check ligne 52-77)
- /backend/src/routes/chat.routes.ts (lignes 63-110)
- /backend/src/routes/task-explainer.routes.ts (verifier que l'endpoint existe)

TACHE 1 : RESTAURER LE MESSAGE D'ATTENTE AU CENTRE DU CHAT (4h)

1. Cree un nouveau composant /cockpit/src/components/chat/TaskLaunchOverlay.tsx :
   - S'affiche en CENTER du chat avec backdrop blur
   - Montre l'avatar de l'agent (selon assignee de la tache)
   - Affiche le titre EXACT de la tache lancee (ex: "🎯 Definition Objectif & KPIs Campagne")
   - Spinner anime + texte progressif :
     - 0-2s : "🐝 [Agent] prepare votre session..."
     - 2-5s : "🐝 [Agent] analyse le contexte du projet..."
     - 5-10s : "🐝 [Agent] interroge ses outils..."
     - 10s+ : "🐝 [Agent] finalise la reponse..."
   - Reste visible MINIMUM 2 secondes meme si la reponse arrive plus vite
   - Disparait quand soit (a) la reponse arrive, soit (b) une erreur survient

2. Modifie /cockpit/src/views/BoardView.tsx fonction launchTask :
   - Ligne ~111 ou isThinking: true : ajoute aussi un nouvel etat dans useHiveStore :
     ```typescript
     taskLaunchOverlay: {
       visible: true,
       agentId: task.assignee,
       taskTitle: task.title,
       startedAt: Date.now(),
     }
     ```
   - Dans le catch error : delai minimum 2s avant de cacher l'overlay et afficher l'erreur

3. Modifie /cockpit/src/components/chat/ChatPanel.tsx :
   - Render <TaskLaunchOverlay /> au CENTRE quand state.taskLaunchOverlay.visible === true
   - Position : absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
   - Background : white/95 backdrop-blur-md, shadow-2xl, rounded-2xl, p-8

TACHE 2 : AFFICHER LA VRAIE ERREUR EN DEV MODE + MESSAGE CLAIR EN PROD (2h)

Modifie le catch block dans BoardView.tsx (ligne 308-326) :

```typescript
} catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
  const errorStack = error instanceof Error ? error.stack : undefined;
  const errorCode = (error as any)?.response?.status || (error as any)?.code || 'UNKNOWN';
  
  logger.error('[Board] Error launching task:', { 
    errorMessage, 
    errorStack: errorStack?.substring(0, 500),
    errorCode,
    taskId: task.id,
    taskTitle: task.title,
    agent: task.assignee,
  });
  
  let userMessage: string;
  
  if (import.meta.env.DEV) {
    // Dev mode : montrer la vraie erreur
    userMessage = `❌ **ERREUR DE LANCEMENT (DEV)**\n\n` +
      `**Tache :** ${task.title}\n` +
      `**Agent :** ${task.assignee}\n` +
      `**Code :** ${errorCode}\n` +
      `**Message :** ${errorMessage}\n\n` +
      `**Stack (debut) :**\n\`\`\`\n${errorStack?.substring(0, 300)}\n\`\`\``;
  } else {
    // Prod mode : message clair selon le type d'erreur
    if (errorCode === 401 || errorCode === 'UNAUTHORIZED') {
      userMessage = `🔒 Votre session a expire. Veuillez vous reconnecter.`;
    } else if (errorCode === 403 || errorCode === 'FORBIDDEN') {
      userMessage = `⛔ Vous n'avez pas les permissions pour ce projet.`;
    } else if (errorCode === 429 || errorCode === 'RATE_LIMIT') {
      userMessage = `⏳ Vous avez atteint votre limite. Mettez a niveau votre plan ou attendez quelques minutes.`;
    } else if (errorCode === 504 || errorMessage.includes('timeout')) {
      userMessage = `⏱️ La tache prend plus de temps que prevu. Reessayez dans quelques secondes.`;
    } else {
      userMessage = `❌ Une erreur technique est survenue lors du lancement de "${task.title}".\n\n` +
        `Pas de panique, voici ce que vous pouvez faire :\n` +
        `- Reessayez dans quelques secondes\n` +
        `- Decrivez ce que vous voulez faire et ${task.assignee} vous aidera\n` +
        `- Contactez le support si le probleme persiste`;
    }
  }
  
  useHiveStore.setState((s) => ({
    chatMessages: [
      ...s.chatMessages,
      {
        id: uuidv4(),
        role: 'assistant',
        content: userMessage,
        agent_id: task.assignee,
        timestamp: new Date(),
        created_at: new Date().toISOString(),
      },
    ],
    isThinking: false,
    taskLaunchOverlay: { visible: false, agentId: null, taskTitle: null, startedAt: 0 },
  }));
}
```

TACHE 3 : FIXER LA CAUSE RACINE DE L'ERREUR (8h)

3.1. Verifier l'endpoint task-explainer :
   - Lis /backend/src/routes/task-explainer.routes.ts
   - Si l'endpoint POST /api/task-explainer/explain n'existe pas ou retourne 404 :
     - Soit creer l'endpoint complet avec authMiddleware + logique d'explication
     - Soit supprimer l'appel optionnel dans BoardView.tsx ligne ~151-170

3.2. Securiser agent-executor.ts ownership check (ligne 52-77) :
   - Le check actuel throw "Unauthorized" si userId manquant ou ownership echoue
   - Modifier pour distinguer les cas :
     ```typescript
     if (!context.userId) {
       throw new AppError('UNAUTHORIZED', 'No user ID provided', 401);
     }
     
     const { data: project, error: ownershipError } = await supabaseAdmin
       .from('projects')
       .select('id, user_id')
       .eq('id', context.projectContext.project_id)
       .single();
     
     if (ownershipError) {
       logger.error('[Agent Executor] Project ownership check failed:', { 
         projectId: context.projectContext.project_id,
         error: ownershipError.message 
       });
       throw new AppError('PROJECT_NOT_FOUND', `Project not found: ${context.projectContext.project_id}`, 404);
     }
     
     if (project.user_id !== context.userId) {
       logger.warn('[Agent Executor] SECURITY: Ownership mismatch', { 
         userId: context.userId, 
         projectOwner: project.user_id 
       });
       throw new AppError('FORBIDDEN', 'You do not have access to this project', 403);
     }
     ```

3.3. Ajouter timeout court sur l'appel Claude :
   - Dans /backend/src/services/claude.service.ts : ajouter `timeout: 90_000` (90 secondes max au lieu de 10 minutes)
   - Si timeout : throw AppError('TIMEOUT', 'Agent prend trop de temps', 504)

3.4. Verifier que processChat dans /backend/src/agents/orchestrator.ts catche correctement les erreurs :
   - Si une exception se propage, doit etre logged avec stack trace
   - Doit retourner un objet d'erreur structure au lieu de propager une exception generique

VERIFICATION :
- cd cockpit && npx tsc --noEmit && npm run build
- cd backend && npx tsc --noEmit
- Demarrer backend + frontend
- Creer un projet Genesis (Meta Ads par exemple)
- Cliquer "Lancer" sur la 1ere tache "🎯 Definition Objectif & KPIs Campagne"
- Verifier :
  ✓ Le message d'attente apparait au CENTRE du chat
  ✓ Reste visible 2-3 secondes minimum
  ✓ Si succes : agent repond normalement
  ✓ Si echec : message d'erreur SPECIFIQUE (pas generique)
  ✓ Logs backend montrent la vraie cause de l'erreur

REGLES :
- Aucun "any" sans justification
- Aucun console.log non-garde
- Tests TypeScript passent
- Aucune regression sur les fixes precedents
```

---

## PROMPT B2 — Systeme de mapping task->skill (3 jours)

```
Tu es le dev senior de The Hive OS. Apres B1, le bug est fixe mais les agents ne savent toujours pas QUEL skill charger pour CHAQUE tache Genesis. Actuellement, ils utilisent du regex sur le message utilisateur, ce qui marche mal.

Ce prompt cree un systeme de mapping direct task->skill base sur le titre EXACT de la tache.

REFERENCES :
- /cockpit/src/lib/wizard-config.ts (les 102 taches Genesis sont definies ici)
- /backend/src/agents/agent-executor.ts (fonction loadRelevantSkills - a modifier)
- /backend/src/services/ (creer un nouveau service)

TACHE 1 : Creer le service de mapping (2h)

1. Cree /backend/src/services/task-skill-mapping.service.ts :

```typescript
/**
 * Mapping direct titre_de_tache -> skill_path
 * Format: "TITRE_EXACT": "agent_id/skill_filename_without_extension"
 * 
 * IMPORTANT : Le titre doit matcher EXACTEMENT (avec emojis si presents)
 * 102 taches uniques mappees ici (extraction de wizard-config.ts)
 */
export const TASK_TO_SKILL_MAPPING: Record<string, string | null> = {
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
  '🔗 Liaison Comptes (GA4 + GSC)': 'sora/tracking-setup-auditor',  // OK
  '📊 Suivi Conversions + Enhanced Conversions': 'sora/tracking-setup-auditor',  // OK
  '✅ Vérification Global Site Tag': 'sora/tracking-setup-auditor',  // OK
  '👥 Création Audiences (Segments)': 'sora/sem-audience-builder',  // TODO
  '🏗️ Découpage Campagnes': 'marcus/sem-campaign-structure',  // TODO
  '📁 Configuration Ad Groups (STAGs)': 'marcus/sem-adgroup-configurator',  // TODO
  '✍️ Rédaction RSA (Annonces)': 'milo/ad-copy-frameworks',  // OK
  '🔗 Configuration Extensions (Assets)': 'milo/sem-ad-extensions-optimizer',  // TODO
  '📞 Call to Action Optimization': 'milo/ad-copy-frameworks',  // OK
  '🌍 Paramètres Géographiques': 'marcus/sem-geo-targeting',  // TODO
  '💹 Stratégie Enchères': 'marcus/sem-bidding-strategy',  // TODO
  '💵 Configuration Budget': 'marcus/budget-optimizer-weekly',  // OK
  '✅ QA Check Pre-Launch': 'marcus/campaign-launch-checklist',  // OK
  '🚀 Mise en Ligne Campagnes': 'marcus/campaign-launch-checklist',  // OK
  '🔍 Analyse Termes de Recherche (J+3)': 'sora/sem-search-terms-analyzer',  // TODO
  '⭐ Analyse Quality Score': 'sora/sem-quality-score-analyzer',  // TODO
  '📈 Ajustements Enchères': 'marcus/sem-bid-adjustments',  // TODO

  // ===== SEO (26 taches) =====
  '🔑 Accès Google Search Console': 'sora/access-management',  // TODO
  '📊 Accès Google Analytics (GA4)': 'sora/access-management',  // TODO (meme skill)
  '🔧 Accès CMS': 'sora/access-management',  // TODO (meme skill)
  '🔍 Analyse Concurrents': 'luna/competitor-deep-dive',  // OK
  '🕷️ Crawl Complet': 'sora/site-crawl-analyzer',  // TODO
  '⚡ Vitesse (Core Web Vitals)': 'sora/core-web-vitals-optimizer',  // TODO
  '📱 Compatibilité Mobile': 'sora/mobile-compatibility-auditor',  // TODO
  '🔗 Structure URLs': 'sora/url-structure-optimizer',  // TODO
  '🗺️ Sitemap & Robots.txt': 'sora/xml-sitemap-manager',  // TODO
  '🔒 Sécurité SSL': 'sora/ssl-security-setup',  // TODO
  '📋 Audit Existant': 'luna/seo-audit-complete',  // OK
  '🔑 Keyword Research': 'luna/seo-keyword-research',  // TODO
  '📊 Gap Analysis': 'luna/seo-gap-analysis',  // TODO
  '🗂️ Mapping Sémantique': 'luna/content-strategy-builder',  // OK
  '🏷️ Optimisation Balises Title': 'milo/seo-title-meta-optimizer',  // TODO
  '📝 Optimisation Méta Descriptions': 'milo/seo-title-meta-optimizer',  // TODO (meme skill)
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
  '📦 Création Compte GTM': 'sora/tracking-setup-auditor',  // OK
  '📊 Configuration GA4': 'sora/tracking-setup-auditor',  // OK
  '⚙️ Réglages GA4': 'sora/ga4-advanced-settings',  // TODO
  '🚫 Filtres Internes': 'sora/gtm-filters-configurator',  // TODO
  '🍪 Choix CMP (Consent Banner)': 'sora/cmp-selector-advisor',  // TODO
  '✅ Consent Mode v2': 'sora/consent-mode-v2-setup',  // TODO
  '🔍 Audit Technique Data Layer': 'sora/datalayer-auditor',  // TODO
  '📋 Specs Développeur': 'sora/developer-specs-generator',  // TODO
  '🏷️ Balise Configuration GA4': 'sora/tracking-setup-auditor',  // OK
  '🔗 Conversion Linker': 'sora/tracking-setup-auditor',  // OK
  '👆 Suivi des Clics': 'sora/gtm-click-tracking-setup',  // TODO
  '📝 Suivi des Formulaires': 'sora/gtm-form-tracking-setup',  // TODO
  '🛒 Events E-commerce Standard': 'sora/ecommerce-events-configurator',  // TODO
  '💰 Variables Data Layer E-com': 'sora/ecommerce-datalayer-builder',  // TODO
  '📱 Meta Pixel + CAPI': 'sora/tracking-setup-auditor',  // OK
  '🔍 Google Ads Conversion': 'sora/tracking-setup-auditor',  // OK
  '💼 LinkedIn/TikTok Insight Tags': 'sora/multi-pixel-manager',  // TODO
  '🔬 GTM Preview Mode': 'sora/gtm-preview-qa-validator',  // TODO
  '📡 GA4 DebugView': 'sora/ga4-debugview-validator',  // TODO
  '📊 Connexion Looker Studio': 'sora/looker-studio-dashboard-builder',  // TODO
  '📈 Dashboarding': 'sora/kpi-dashboard-builder',  // OK

  // ===== SOCIAL_MEDIA (15 taches) =====
  '📱 Audit Présence Social Media Actuelle': 'doffy/social-analytics-interpreter',  // OK partiel (a enrichir)
  '🎯 Définition Stratégie & Objectifs Social Media': 'doffy/social-strategy-framework',  // TODO
  '🔍 Analyse Concurrents & Benchmark Social': 'doffy/social-competitor-analyzer',  // TODO
  '👤 Définition Audiences & Personas par Plateforme': 'doffy/social-audience-personas',  // TODO
  '🔗 Connexion Comptes Réseaux Sociaux': 'doffy/social-account-connector',  // TODO
  '📋 Création Calendrier Éditorial Mensuel': 'doffy/social-content-calendar',  // OK existant a enrichir
  '🎨 Création Templates & Assets Visuels': 'milo/visual-brief-creator',  // OK
  '✍️ Définition Piliers & Templates de Copywriting': 'doffy/social-copywriting-framework',  // TODO
  '📝 Rédaction Batch de Posts (Semaine 1)': 'doffy/social-batch-copywriter',  // TODO
  '🎬 Production Vidéos Courtes (Reels/TikTok/Stories)': 'milo/video-ad-producer',  // OK
  '📅 Programmation & Scheduling des Posts': 'doffy/social-post-scheduler',  // TODO
  '🚀 Publication & Lancement Social Media': 'doffy/social-publication-manager',  // TODO
  '📊 Analyse Performance & Engagement Semaine 1': 'doffy/social-analytics-interpreter',  // OK existant a enrichir
  '🔄 Optimisation Contenu & Horaires de Publication': 'doffy/social-optimization-strategist',  // TODO
  '📈 Rapport Social Media & Recommandations': 'doffy/social-monthly-reporter',  // TODO
};

/**
 * Retourne le skill correspondant a la tache
 * Si null = pas de skill defini (fallback regex)
 * Si "TODO" prefix = skill a creer
 */
export function getSkillForTask(taskTitle: string): string | null {
  const skill = TASK_TO_SKILL_MAPPING[taskTitle];
  if (!skill) {
    logger.warn(`[TaskSkillMapping] No skill mapped for task: "${taskTitle}"`);
    return null;
  }
  return skill;
}

/**
 * Stats : combien de taches sont mappees vers un skill existant ?
 */
export function getMappingStats(): { total: number; mapped: number; missing: number } {
  const total = Object.keys(TASK_TO_SKILL_MAPPING).length;
  const mapped = Object.values(TASK_TO_SKILL_MAPPING).filter(v => v !== null).length;
  return { total, mapped, missing: total - mapped };
}
```

TACHE 2 : Modifier agent-executor.ts pour utiliser le mapping (4h)

1. Lis /backend/src/agents/agent-executor.ts fonction loadRelevantSkills.

2. Modifie la fonction pour utiliser le mapping en PRIORITE :

```typescript
import { getSkillForTask } from '../services/task-skill-mapping.service.js';

async function loadRelevantSkills(
  message: string, 
  agent: string, 
  taskTitle?: string
): Promise<string[]> {
  // PRIORITE 1 : Mapping direct task -> skill (si on lance une tache Genesis)
  if (taskTitle) {
    const directSkill = getSkillForTask(taskTitle);
    if (directSkill && !directSkill.startsWith('TODO')) {
      logger.log(`[Agent Executor] Loaded skill via direct mapping: ${directSkill}`);
      return [directSkill];
    }
    if (directSkill?.startsWith('TODO')) {
      logger.warn(`[Agent Executor] Skill not yet created for task: ${taskTitle}, fallback to regex`);
    }
  }
  
  // PRIORITE 2 : Detection par regex sur le message (existing logic)
  return detectSkillsByPattern(message, agent);
}
```

TACHE 3 : Passer task_title du frontend au backend (3h)

1. Modifier /cockpit/src/services/api.ts :
   - Dans le payload de sendChatMessage, ajouter task_title si task_context existe :
     ```typescript
     task_title: context?.task_context?.task_title,
     ```

2. Modifier /backend/src/types/agent.types.ts :
   - Ajouter taskTitle?: string dans AgentExecutionContext

3. Modifier /backend/src/routes/chat.routes.ts :
   - Extraire task_title du body et le passer a processChat
   - Passer dans context.taskTitle

4. Modifier /backend/src/agents/orchestrator.ts processChat :
   - Passer context.taskTitle a loadRelevantSkills via agent-executor

TACHE 4 : Ajouter context_questions de la tache dans le system prompt (3h)

Quand un agent lance une tache, il doit avoir les context_questions de la tache injectees dans son prompt.

1. Lis /cockpit/src/views/BoardView.tsx pour voir comment task.context_questions est structure.

2. Modifier la fonction buildSystemPrompt dans agent-executor.ts :
   ```typescript
   if (context.task?.context_questions && context.task.context_questions.length > 0) {
     prompt += `\n\n## CONTEXTE DE LA TACHE (Questions du wizard Genesis)\n`;
     prompt += `L'utilisateur a deja repondu aux questions suivantes. Utilise ces reponses pour personnaliser ta reponse.\n\n`;
     context.task.context_questions.forEach((q, idx) => {
       const answer = context.task.user_inputs?.[`question_${idx}`] || 'Pas encore repondu';
       prompt += `**Q${idx + 1} :** ${q}\n**Reponse :** ${answer}\n\n`;
     });
   }
   ```

3. Modifier l'envoi du context.task complet (avec context_questions et user_inputs) du frontend au backend.

VERIFICATION :

1. cd backend && npx tsc --noEmit
2. Verifier les stats du mapping :
   ```typescript
   import { getMappingStats } from './services/task-skill-mapping.service';
   console.log(getMappingStats());
   // Doit afficher : { total: 102, mapped: ~37 (existing skills), missing: ~65 (TODO) }
   ```
3. Tester end-to-end :
   - Creer projet Genesis
   - Lancer tache "Audit Existant" (SEO scope)
   - Verifier dans les logs : "[Agent Executor] Loaded skill via direct mapping: luna/seo-audit-complete"
   - Lancer tache "Crawl Complet" (skill TODO)
   - Verifier dans les logs : "[Agent Executor] Skill not yet created for task: 🕷️ Crawl Complet, fallback to regex"

REGLES :
- Aucun any
- Logger correctement les chargements de skills
- Le mapping doit avoir EXACTEMENT 102 entrees apres ce prompt
- Les valeurs "TODO" prefixees seront remplacees au fur et a mesure que les skills sont crees (fichiers 02-07)
```

---

## VERIFICATION POST-FICHIER 01

```bash
# Backend compile
cd backend && npx tsc --noEmit

# Frontend compile
cd cockpit && npx tsc --noEmit && npm run build

# Mapping en place
grep -c "':" /backend/src/services/task-skill-mapping.service.ts   # >= 102

# Test : lancer une tache Genesis et voir le bon skill chargé
# (ou message "skill not yet created" pour les TODO)
```

**Apres ce fichier : passer a `02_SKILLS_SEO.md`** (le scope le plus mal couvert).
