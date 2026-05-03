# Skills Anthropic Integration Log

**Date de decouverte :** 2026-05-03
**Version Claude Code :** 2.1.126
**Skills cherches initialement :** Hyperframes, Marketing psy, Agent browser
**Source de verite :** https://github.com/anthropics/skills (branche `main`, lue le 2026-05-03 via GitHub API)

---

## TL;DR

Aucun des trois noms cibles **n'existe en l'etat** dans le catalogue Anthropic officiel ni dans la liste des skills disponibles localement (Claude Code 2.1.126). Etat verifie :

| Nom cherche | Existe chez Anthropic ? | Realite |
|---|---|---|
| Hyperframes | NON | Outil tiers de **HeyGen** (open-source Apache 2.0, HTML→video pour agents) — `github.com/heygen-com/hyperframes` |
| Marketing psy | NON | Aucun skill Anthropic sur la psychologie marketing. A creer custom dans `agents/skills/luna/copywriting-psychology.skill.md`. |
| Agent browser | NON (par ce nom) | Le skill officiel le plus proche thematiquement est `webapp-testing` (Playwright). C'est un harness de test, pas un agent de browsing au sens OpenClaw. |

**Implication directe :** la directive 2 du `00_BIS_DIRECTIVES_GLOBALES.md` doit etre comprise comme **"s'inspirer de"** ces trois references, pas **"installer telles quelles"**. Le plan d'integration ci-dessous reflete cette realite.

---

## 1. Inventaire reel — skills Anthropic publies (2026-05-03)

Le repo `anthropics/skills` contient **17 skills officiels** dans `/skills/`. Liste exhaustive obtenue par `GET https://api.github.com/repos/anthropics/skills/contents/skills` :

| # | Skill | Domaine | Pertinence pour Hive OS V4 |
|---|---|---|---|
| 1 | `algorithmic-art` | Creation generative | Faible |
| 2 | **`brand-guidelines`** | Identite visuelle (couleurs, typo) | **Forte — Milo** (cohérence brand des creas) |
| 3 | `canvas-design` | Design surfacique | Moyenne — Milo |
| 4 | `claude-api` | Anthropic SDK | Moyenne — Backend TS (orchestrator) |
| 5 | `doc-coauthoring` | Redaction collaborative | Faible |
| 6 | `docx` | Word | Faible |
| 7 | **`frontend-design`** | UI production-grade | **Forte — Cockpit** (Skills Catalog Modal, Quick Actions) |
| 8 | `internal-comms` | Comms internes | Faible |
| 9 | **`mcp-builder`** | Construire un MCP server | **Forte — Chantier 1** (Web Intelligence MCP server) |
| 10 | `pdf` | Generation PDF | Moyenne — Sora (rapports clients) |
| 11 | `pptx` | PowerPoint | Moyenne — Orchestrator (deck client) |
| 12 | `skill-creator` | Bootstrap d'un SKILL.md | **Forte — Chantier V4** (gabarit de creation) |
| 13 | `slack-gif-creator` | GIF Slack | Faible |
| 14 | `theme-factory` | Design tokens | Moyenne — Cockpit |
| 15 | `web-artifacts-builder` | Artifacts web | Moyenne |
| 16 | **`webapp-testing`** | Playwright-based test/inspect | **Forte — Web Intelligence MCP** (pattern reconnaissance-then-action) |
| 17 | `xlsx` | Excel | Moyenne — Sora (export data) |

**Skills critiques retenus pour V4 : `mcp-builder`, `skill-creator`, `webapp-testing`, `frontend-design`, `brand-guidelines`.**

---

## 2. Skills natifs decouverts en detail

### 2.1 `webapp-testing` — substitut le plus proche d'"Agent browser"

- **Categorie :** Browser automation / QA
- **Source :** https://github.com/anthropics/skills/blob/main/skills/webapp-testing/SKILL.md
- **Methodologie principale :**
  - Decision tree : statique vs dynamique, serveur deja up vs a demarrer
  - Helper `scripts/with_server.py` pour orchestrer un ou plusieurs serveurs
  - Pattern **"reconnaissance-then-action"** : `goto` → `wait_for_load_state('networkidle')` → screenshot/DOM inspect → identifier les selecteurs depuis l'etat rendu → executer l'action
  - Toujours Chromium en `headless=True`
  - Toujours attendre `networkidle` avant d'inspecter (sinon DOM partiel sur les SPA)
  - Utiliser `--help` sur les helpers AVANT de lire leur source (eviter de polluer le contexte)
- **Outputs attendus :** screenshots PNG, DOM HTML extrait, resultats d'assertions
- **Cas d'usage typiques :** verifier qu'un bouton existe, valider un flow de checkout, capturer l'etat visuel apres action
- **Difference vs OpenClaw / browsing IA :** c'est un harness de TEST (il sait deja quoi chercher), pas un agent capable d'interpreter un site inconnu en autonomie. La couche d'intelligence (LLM qui lit l'arbre d'accessibilite et decide quoi cliquer) reste a construire — c'est exactement le job du **Web Intelligence MCP server** decrit dans CLAUDE.md.

### 2.2 `brand-guidelines` — substitut le plus proche thematique brand consistency

- **Categorie :** Identite visuelle
- **Source :** https://github.com/anthropics/skills/blob/main/skills/brand-guidelines/SKILL.md
- **Methodologie principale :**
  - Couleurs main : `#141413` / `#faf9f5` / `#b0aea5` / `#e8e6dc`
  - Couleurs accent : `#d97757` (orange) / `#6a9bcc` (bleu) / `#788c5d` (vert)
  - Typo : Poppins pour headings >= 24pt, Lora pour body, fallback Arial/Georgia
  - Application via `python-pptx` (`RGBColor`)
  - Cycle automatique des accents pour les shapes
- **Outputs attendus :** documents PPTX/PDF stylises a l'identite Anthropic
- **Cas d'usage typiques :** generer un deck commercial, formatter un livrable client
- **Limite :** c'est l'identite **d'Anthropic** par defaut. Pour Hive OS il faudra un equivalent custom `hive-brand-guidelines` documentant les couleurs/typo de chaque agent (Luna, Sora, Marcus, Milo, Doffy).

### 2.3 `frontend-design` — substitut pour design distinctif

- **Categorie :** UI design / production
- **Source :** https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md
- **Methodologie principale :**
  - Phase 1 : *Design thinking* — purpose, tone, contraintes, differenciation AVANT le code
  - Forcer une direction esthetique extreme (brutalist / minimal / maximaliste / editorial / pastel...)
  - Bannir les cliches "AI slop" : Inter, Roboto, system fonts, gradients violets sur fond blanc
  - Privilegier typo distinctive (display + body assortis), couleurs CSS-variables, motion CSS-only quand possible
  - Composition spatiale : asymetrie, overlap, grid-breaking, espace negatif intentionnel
  - Faire correspondre la complexite du code a l'ambition esthetique (maximalist = beaucoup d'animations ; minimal = restraint precis)
- **Outputs attendus :** HTML/CSS/JS ou React production-grade avec POV esthetique fort
- **Cas d'usage typiques :** landing page, dashboard, composant React distinctif
- **Pertinence V4 :** la directive 3 (Skills Discoverability) demande de creer `SkillsCatalogModal.tsx`, `QuickActionsBar.tsx`, et d'enrichir `ChatPanel.tsx` — `frontend-design` impose qu'on les fasse au-dela du shadcn/ui par defaut.

### 2.4 `mcp-builder` — fondation du Chantier 1

- **Categorie :** MCP server scaffolding
- **Pertinence :** lecture obligatoire AVANT d'ecrire `mcp-servers/web-intelligence-server/`. Le PRD V5 prescrit deja le pattern (copier `seo-audit-server`), mais `mcp-builder` peut accelerer le bootstrap.

### 2.5 `skill-creator` — gabarit pour les 57 skills V4

- **Categorie :** SKILL.md scaffolding
- **Pertinence :** lecture obligatoire AVANT le batch SEO (fichier `02_SKILLS_SEO.md`). Le frontmatter Anthropic est plus minimaliste que celui exige par notre `00_BIS_DIRECTIVES_GLOBALES.md` § Directive 4 (notre version ajoute `agent`, `genesisTask`, `triggerPrompts`, `bestInClassTools`, `psychologicalAngles`). On garde NOTRE format (super-set), mais on s'aligne sur les conventions YAML d'Anthropic.

### 2.6 HyperFrames (HeyGen, tiers — pas Anthropic)

- **Categorie :** HTML-to-video framework
- **Source :** https://github.com/heygen-com/hyperframes
- **License :** Apache 2.0 (commercial OK)
- **Pertinence pour Milo :** alternative serieuse a Veo 3 pour les videos courtes scriptees (bannieres animees, motion design, intros). Veo 3 reste meilleur pour le live-action/IA, HyperFrames est superieur pour le motion graphics deterministe.
- **Decision V4 :** **NON-bloquant pour la phase 1.** A reevaluer apres le Chantier 2 si on identifie un besoin de motion design programmatique. **PAS** integre dans le MCP server `veo3` actuel.

---

## 3. Plan d integration dans nos agents V4

### 3.1 Marketing psy → Luna + Milo + Doffy (a construire en custom)

**Constat :** aucun skill Anthropic publie ne couvre la psychologie marketing. **Action :** creer un skill maison.

- **Livrable :** `agents/skills/luna/copywriting-psychology.skill.md` (a creer dans Fichier 02 - SEO)
  - 8 leviers de Cialdini : reciprocite, scarcite, autorite, engagement, sympathie, preuve sociale, unite, contraste
  - Heuristiques Kahneman : ancrage, loss aversion (2.5x weight), framing, default effect
  - Mapping → frameworks copywriting : PAS, AIDA, BAB, PASTOR
  - Output : checklist par piece de copy + score psy 0-100

- **Enrichissement :** `agents/skills/milo/ad-copy-frameworks.skill.md` (Fichier 07)
  - Injection des angles psy dans la generation de variants A/B
  - 3 hooks par angle (loss aversion / social proof / curiosity gap)

- **Enrichissement :** `agents/skills/doffy/engagement-playbook.skill.md` (Fichier 06)
  - Patterns d'amorce psy par plateforme (LinkedIn = autorite, IG = preuve sociale, TikTok = curiosity gap)

- **Shared :** `agents/skills/_shared/anthropic-native-patterns.md`
  - Compile les patterns reutilisables tires de `brand-guidelines` (cycle accent), `frontend-design` (POV esthetique), `webapp-testing` (reconnaissance-then-action)

### 3.2 Agent browser → Web-Intelligence MCP + Orchestrator

**Constat :** `webapp-testing` est un test harness Playwright, pas un agent de browsing. Notre Web Intelligence MCP (Chantier 1, deja decide dans CLAUDE.md) reste l'approche correcte. On **emprunte les patterns** de `webapp-testing` :

- `mcp-servers/web-intelligence-server/src/lib/agent-browser-patterns.ts` (a creer Phase 1.2)
  - Helper `withServer()` (analogue de `with_server.py`) pour les flows multi-services
  - Fonction `reconnaissanceThenAction()` qui standardise : `goto → networkidle → snapshot → reason → act`
  - Wrapper `safeNetworkIdle()` avec timeout 30s + fallback `domcontentloaded`
  - Logging structure compatible avec `system_logs` (source: `mcp-server`)

- `mcp-servers/web-intelligence-server/src/lib/dom-snapshot.ts` (deja prevu Phase 1.2)
  - Importer le pattern OpenClaw `page.accessibility.snapshot()` + ref labels
  - Combiner avec le pattern `webapp-testing` : screenshot d'abord, DOM ensuite, jamais l'inverse sur SPA

- `backend/src/agents/orchestrator.ts` (Chantier 2)
  - Nouveau intent `web-recon` qui declenche le pattern reconnaissance-then-action via `web-intelligence`
  - Garde-fou : pas plus de 3 navigations en chaine sans validation utilisateur (eviter les boucles infinies)

### 3.3 Hyperframes → Milo (deferre)

**Constat :** HyperFrames (HeyGen) est un framework HTML→video. Pas un skill Anthropic.

- **Decision :** ne pas integrer en V4. Le MCP `veo3` couvre deja les videos courtes IA. HyperFrames serait pertinent si on identifie un besoin de **motion graphics deterministe** (ex : animer un dashboard de metriques pour un rapport video Sora). A reevaluer apres Phase 2.4 du Chantier 2.
- **Si retenu plus tard :** nouveau MCP server `hyperframes-server` separe de `veo3-server`. Pas de fusion — ils servent des cas d'usage differents (live-action IA vs motion graphics scripted).

### 3.4 Skills officiels Anthropic a brancher en bonus

| Skill officiel | Cible Hive OS | Quand |
|---|---|---|
| `mcp-builder` | Web Intelligence MCP | Avant Phase 1.1 |
| `skill-creator` | Tous les batches V4 | Avant Fichier 02 |
| `frontend-design` | `SkillsCatalogModal.tsx`, `QuickActionsBar.tsx`, `ChatPanel.tsx` enrichi | Pendant la couche UX Discoverability |
| `brand-guidelines` (en fork) | `hive-brand-guidelines` interne pour Sora/Orchestrator (decks PPTX, rapports PDF) | Pendant Sora rapports + Orchestrator deck client |
| `xlsx` | Sora — export GA4/Ads vers Excel client | Phase Analytics |
| `pdf` | Sora — rapports mensuels signables | Phase Analytics |

---

## 4. Fichiers V4 qui devront integrer ces skills natifs

- `agents/skills/_shared/anthropic-native-patterns.md` *(a creer dans V4 — synthese reutilisable des 5 skills officiels retenus)*
- `agents/skills/luna/copywriting-psychology.skill.md` *(a creer dans Fichier 02 — base Cialdini + Kahneman, integre les patterns brand-guidelines pour la coherence visuelle de la copy)*
- `agents/skills/doffy/engagement-playbook.skill.md` *(a enrichir dans Fichier 06 — patterns psy par plateforme)*
- `agents/skills/milo/ad-copy-frameworks.skill.md` *(a enrichir dans Fichier 07 — injection psy dans les variants A/B)*
- `mcp-servers/web-intelligence-server/src/lib/agent-browser-patterns.ts` *(a creer Phase 1.2 du Chantier 1 — patterns webapp-testing portes en TypeScript)*
- `cockpit/src/components/chat/SkillsCatalogModal.tsx` *(a creer pour Directive 3 Mecanisme 2 — design selon `frontend-design`)*
- `cockpit/src/components/board/QuickActionsBar.tsx` *(a creer pour Directive 3 Mecanisme 4)*

---

## 5. Verifications faites

- `GET https://api.github.com/repos/anthropics/skills/contents/skills` — 17 entries listees, aucune ne s'appelle `hyperframes`, `marketing-psy`, `marketing-psychology`, ou `agent-browser`.
- `WebSearch "hyperframes"` — le projet "Hyperframes" pertinent est de **HeyGen**, pas d'Anthropic.
- `webapp-testing/SKILL.md` lu en entier (90 lignes).
- `brand-guidelines/SKILL.md` lu en entier (80 lignes).
- `frontend-design/SKILL.md` lu en entier (50+ lignes).
- Liste des skills installables via `Skill` tool dans cette session (Claude Code 2.1.126) : `update-config`, `keybindings-help`, `simplify`, `fewer-permission-prompts`, `loop`, `schedule`, `claude-api`, `init`, `review`, `security-review`. Aucun skill domain-specific des 17 du repo n'est pre-installe — il faudrait `/plugin install` pour les ajouter localement si on en a besoin pendant le developpement.

---

## 6. Recommandations pour le user

1. **Mettre a jour la Directive 2 du `00_BIS_DIRECTIVES_GLOBALES.md`** pour refleter la realite : remplacer les references "Hyperframes / Marketing psy / Agent browser" par "**S'inspirer de** `webapp-testing` (browser patterns), `brand-guidelines` (visuel coherent), construire **custom** le skill Marketing Psy". Le contenu suivant est propose en remplacement de la Directive 2 (pas applique automatiquement) :

   > Pour V4, on s'appuie sur 5 skills officiels Anthropic (`mcp-builder`, `skill-creator`, `webapp-testing`, `frontend-design`, `brand-guidelines`) comme references de pattern. La psychologie marketing est un skill custom maison (`luna/copywriting-psychology.skill.md`). HyperFrames (HeyGen) est documente mais defere — pas integre en V4.

2. **Ne pas attendre** un skill Anthropic "Marketing psy" : il n'arrivera pas. On le construit nous-memes.

3. **Lire `mcp-builder` et `skill-creator` AVANT** d'attaquer le Chantier 1. Ces deux skills officiels accelereront le bootstrap du Web Intelligence MCP server et la creation des 57 skills V4.

---

**Etat :** Decouverte complete. Pret pour Prompt B1.
