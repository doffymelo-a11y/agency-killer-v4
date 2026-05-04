# B2.3 — Genesis Enrichment Needed (gap H3)

**Date :** 2026-05-04
**Source :** investigation B2.2 (cf. commits B2 + B2.1 + B2.2)
**Statut :** **non bloquant** pour V4 — B2.2 contourne via Quality Standard OVERRIDE qui force l'usage des Genesis project metadata + hypotheses explicites.

---

## 1. Le gap en 1 phrase

Le wizard Genesis collecte des reponses **niveau projet** (industry, audience, budget, etc.) mais **ne pre-remplit PAS les questions par tache** — donc `task.user_inputs` est `{}` au lancement, et chaque agent reçoit un bloc CONTEXTE DE LA TACHE vide pour les questions tache-specifiques.

## 2. Preuve code

### a) Le wizard cree les taches avec des `context_questions` hardcodees

`cockpit/src/lib/wizard-config.ts:597-625` — chaque tache META_ADS est definie comme :

```ts
{
  title: '👤 Création Avatar Client Idéal (ICP)',
  description: '...',
  assignee: 'luna',
  phase: 'Audit',
  category: 'strategy',
  order: 2,
  context_questions: [
    'Qui est votre client idéal ?',
    'Quels sont ses problèmes principaux ?',
    "Qu'est-ce qui le motive à acheter ?",
  ],
  // ⚠️ AUCUN champ user_inputs : les questions ne sont jamais posees
  // au moment de Genesis, elles n'existent que sur la tache une fois creee
}
```

Pareil pour les 102 taches : 3 questions par tache, **0 reponse pre-remplie**.

### b) Le wizard remplit uniquement les Genesis questions de scope

`cockpit/src/lib/wizard-config.ts` definit aussi des questions de scope (Q1-Q4 par scope) — celles-ci sont posees a l'utilisateur et leurs reponses atterrissent dans `project.metadata` (industry, target_audience, business_goal, pain_point, offer_hook, visual_tone, competitors, budget, etc.).

`cockpit/src/services/api.ts transformSharedMemory()` extrait ces champs et les envoie au backend dans le payload `shared_memory`.

`backend/src/agents/agent-executor.ts buildSystemPrompt()` les injecte dans le system prompt via `replacements.{industry, target_audience, ...}` et le bloc `genesis_context`.

→ Donc l'agent **a bien** les Genesis answers de niveau projet, mais **pas** de pre-remplissage par tache.

### c) `task.user_inputs` est ecrit *apres* le lancement, pas pendant Genesis

`cockpit/src/store/useHiveStore.ts:629` — `updateTaskUserInputs()` :

```ts
const { error } = await supabase
  .from('tasks')
  .update({ user_inputs: userInputs })
  .eq('id', taskId);
```

Cette fonction est appelee depuis le UI du chat / TaskDetailModal **apres** que l'utilisateur aie commence a interagir avec une tache. Elle n'est **jamais** appelee depuis Genesis.

## 3. Pourquoi ce n'est pas bloquant pour B2.2

Apres B2.2, le bloc CONTEXTE DE LA TACHE est **adaptatif** :

- Si `user_inputs` contient des reponses → on les affiche normalement (`Q1: ... Réponse: ...`).
- Si `user_inputs` est vide → on dit explicitement a l'agent : *"Aucune reponse pre-remplie sur ces questions specifiques. Les Genesis answers de niveau projet (industry, audience, budget, business_goal, pain_point, offer_hook, visual_tone, competitors_list) SONT DEJA disponibles dans le bloc CONTEXTE PROJET ci-dessus. Utilise-les comme base + des hypotheses EXPLICITES pour livrer une V1. Ne demande PAS ces informations au user."*

Combine avec l'OVERRIDE Quality Standard qui interdit les questions ouvertes et force le format V1 + 3 axes, l'agent doit livrer une V1 immediate basee sur le project metadata.

## 4. Champs manquants par scope (criticite)

Pour passer de "V1 acceptable basee sur project metadata" a "V1 excellente basee sur reponses precises", il faudrait collecter pendant Genesis :

### META_ADS (scope `paid_ads_launch`)
| Tache | Question manquante (suggestion) | Criticite |
|---|---|---|
| 🎯 Définition Objectif & KPIs Campagne | ROAS cible specifique (ex: 4x), CPL acceptable | **HIGH** — sans ca, l'agent doit deviner les benchmarks |
| 👤 Création Avatar Client Idéal (ICP) | Tranche d'age cible, % H/F, geo precise, revenu moyen | **MEDIUM** — Genesis a deja `target_audience` mais en texte libre |
| 💰 Plan Budget & Allocation par Phase | Budget de test (€/jour), budget scaling 30j | **HIGH** — Genesis a `budget_monthly` mais pas le split test/scale |
| 📍 Installation & Configuration Pixel Meta | CMS site (Shopify/WordPress/custom), GTM en place ? | **MEDIUM** — l'agent peut detecter via web-intelligence |
| 🎨 Production Visuels | Charte graphique URL, references visuelles | **HIGH** — sans ca, Milo invente le branding |
| ✍️ Copywriting Ads | Ton de marque (formel/cool/expert/...), USP texte | **HIGH** — Genesis a `brand_voice` mais souvent un mot |

### SEM (scope `paid_ads_launch`)
- ROAS/CPA cible, marge produit moyenne
- Mots-cles principaux deja connus (vs research from scratch)
- Concurrents directs (top 3-5 noms)

### SEO (scope `seo_campaign`)
- URL du site (CRITIQUE — actuellement absente !)
- Acces GSC + GA4 deja faits (oui/non)
- Mots-cles cibles prioritaires (top 10)

### ANALYTICS (scope `website_audit`)
- Stack tracking actuel (GA4 oui/non, GTM oui/non, CMP utilise)
- Plateforme e-com (si applicable)
- Budgets ads pour calculer ROAS reel

### SOCIAL_MEDIA (scope `social_media_campaign`)
- Plateformes prioritaires (LinkedIn / IG / TikTok / Twitter)
- Volume publication par semaine
- Comptes existants (URL) pour audit

## 5. Solutions possibles (a evaluer dans B2.3)

### Solution 1 — Etendre le wizard Genesis
Ajouter une **6e etape** au wizard apres les 5 actuelles : "Questions tache-critiques" qui pose les 5-10 questions les plus impactantes pour le scope choisi. Stocker les reponses dans `project.metadata.task_inputs[task_title]`.

**Effort** : 2-3 jours frontend + 0.5 jour backend mapping.
**Pro** : aligne avec le modele actuel (Genesis = 1 questionnaire).
**Contra** : 5-10 questions de plus = friction d'onboarding.

### Solution 2 — Inline forms dans TaskDetailModal
Quand l'utilisateur clique sur une tache, lui presenter un formulaire pre-Lancement qui pose les `context_questions` (les 3 deja definies par tache). Stocker dans `task.user_inputs` et seulement apres permettre "Lancer".

**Effort** : 1-2 jours frontend.
**Pro** : friction repartie, contextualisee, optionnel (l'utilisateur peut skip et laisser l'agent travailler en hypotheses).
**Contra** : ralentit le 1er lancement.

### Solution 3 — Inferer depuis l'URL du site
Pour les scopes SEO/Analytics/Ads, demander l'URL du site en Genesis et faire un crawl initial via `web-intelligence` MCP pour extraire industry, mots-cles, USP, concurrents directs, stack tech. Pre-remplir les `task.user_inputs` avec les decouvertes.

**Effort** : 1 semaine (necessite web-intelligence MCP + scoring).
**Pro** : zero friction utilisateur.
**Contra** : depend du build de web-intelligence MCP (Chantier 1 du PRD V5).

### Solution 4 — Hybride (recommande)
Genesis collecte URL site + 3-5 questions critiques globales. Tache-par-tache, l'agent demande **inline** les 1-2 inputs manquants APRES avoir livre une V1 sur hypotheses (pattern actuel B2.2 + question contextuelle dans les "3 axes").

**Effort** : 0 (deja le comportement post-B2.2).
**Pro** : aucune friction Genesis, V1 livree immediatement, raffinement par dialogue.
**Contra** : la V1 peut etre approximative si les hypotheses tombent a cote.

## 6. Decision

**Pas d'action en B2.2.** Documente ici pour B2.3 dedie. Le user lance B2.3 quand il aura valide que B2.2 livre des V1 acceptables sur Luna ICP + Marcus Budget + au moins 3 autres taches.

Si la V1 par hypothese est jugee insuffisante par le user → Solution 4 (hybride) en priorite, puis Solution 1 (extension Genesis) en backup.

---

**Liens** :
- Commit B2 : `6599eeb`
- Commit B2.1 : `6f7b618`
- Commit B2.2 : (a venir)
- Roadmap V4 source : `/Roadmap:vision/V4_PROMPTS/00_INDEX_MASTER_V4.md`
