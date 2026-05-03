# DIRECTIVES GLOBALES V4 — A respecter dans CHAQUE skill

**Document de reference obligatoire pour tous les fichiers V4 (01-08)**
**Date :** 2026-05-03

---

## DIRECTIVE 1 — Outils best-in-class par categorie (2026)

Pour chaque skill cree, l'agent doit utiliser le MEILLEUR outil du marche dans sa categorie.

### Generation de contenu visuel (Milo)
| Type | Outil PRIMARY | Pourquoi | MCP server |
|------|---------------|----------|------------|
| Images publicitaires | **Nano Banana Pro (Google Imagen 3.0/4 via Vertex AI)** | Excellent texte dans image, integration MCP existante, predictible pricing Google Cloud | `nano-banana-pro` |
| Videos courtes (4-8s) | Veo 3 (Google) | Best-in-class qualite + integration Google Cloud | `veo3` |
| Voix off + sound effects | ElevenLabs Multilingual v2 | Standard de l'industrie, voice cloning | `elevenlabs` |

### SEO & Strategy (Luna)
| Type | Outil PRIMARY |
|------|---------------|
| Site audit technique | Screaming Frog SEO Spider + Sitebulb |
| Web Vitals | PageSpeed Insights + WebPageTest |
| Keyword research | Ahrefs Keywords Explorer |
| Backlink audit | Ahrefs Site Explorer |
| Content optimization | SurferSEO + MarketMuse |
| Local SEO | Google Business Profile API |

### Analytics & Tracking (Sora)
| Type | Outil PRIMARY |
|------|---------------|
| Web analytics | GA4 + Mixpanel (event-based) |
| Tag management | GTM Server-Side (avec Consent Mode v2) |
| Heatmaps | Hotjar + Microsoft Clarity |
| Server-side tracking | Stape.io |
| Attribution | Northbeam (e-com) / Triple Whale (Shopify) / Hyros (info products) |
| BI dashboards | Looker Studio + Metabase |

### Ads management (Marcus)
| Type | Outil PRIMARY |
|------|---------------|
| Meta Ads | Meta Ads Manager + API natif |
| Google Ads | Google Ads + Optmyzr |
| Cross-platform analytics | Northbeam ou Triple Whale |
| Budget optimization | Custom logic Marcus + budget-optimizer MCP server |

### Social Media (Doffy)
| Type | Outil PRIMARY |
|------|---------------|
| Scheduling | Buffer ou Sprout Social |
| Listening | Brandwatch ou Sprout Social Listening |
| Influencer outreach | Modash ou Aspire |
| Analytics | Native APIs + Sprout |

### Copywriting & AI (Tous agents)
| Type | Outil PRIMARY |
|------|---------------|
| LLM general | Claude 4.7 (1M context) ou GPT-5 |
| Templates copy | Jasper |
| A/B testing copy | Persado |

---

## DIRECTIVE 2 — Skills Anthropic officiels a integrer (verifie le 2026-05-03)

Verification effectuee via GitHub API du repo anthropics/skills (17 skills officiels).

Les noms initialement supposes (Hyperframes, Marketing psy, Agent browser) n'existent PAS comme skills Anthropic officiels :
- Hyperframes = outil HeyGen (HTML→video), pas un skill Anthropic. NE PAS UTILISER.
- Marketing psy = n'existe pas. A construire custom dans luna/copywriting-psychology.skill.md.
- Agent browser = n'existe pas. Substitut officiel = webapp-testing.

Skills Anthropic officiels retenus pour V4 :

### 1. skill-creator (PRIORITE 1 - utiliser des Fichier 02)
- Repo : github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md
- Utilite : meta-skill pour creer et ameliorer nos 51 skills V4
- Integration :
  * Charger ce skill au debut de chaque execution de fichier V4 (02-07)
  * Permet a Claude Code de creer des skills mieux structures, plus rapidement
- Beneficiaires : TOUS les agents (creation des skills V4)

### 2. mcp-builder (PRIORITE 2 - quand on enrichit les MCP servers)
- Repo : github.com/anthropics/skills/blob/main/skills/mcp-builder/SKILL.md
- Utilite : creer/etendre les MCP servers (notamment web-intelligence)
- Integration : referencer dans le prompt qui enrichit web-intelligence-server

### 3. webapp-testing (PRIORITE 2 - pour web-intelligence)
- Repo : github.com/anthropics/skills/blob/main/skills/webapp-testing/SKILL.md
- Utilite : patterns Playwright pour browser automation
- Integration : enrichir /mcp-servers/web-intelligence-server avec ces patterns
- Beneficiaire : web-intelligence MCP (utilise par tous les agents)

### 4. frontend-design (PRIORITE 3 - pour UX Discoverability)
- Repo : github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md
- Utilite : best practices UI/UX pour les composants Discoverability
- Integration : utiliser quand on cree :
  * /cockpit/src/components/chat/SkillsCatalogModal.tsx
  * /cockpit/src/components/board/QuickActionsBar.tsx
  * /cockpit/src/components/chat/TaskLaunchOverlay.tsx (deja prevu dans B1)

### 5. brand-guidelines (PRIORITE 3 - pour Milo)
- Repo : github.com/anthropics/skills/blob/main/skills/brand-guidelines/SKILL.md
- Utilite : gestion d'identite de marque
- Integration : enrichir /agents/skills/milo/brand-voice-guardian.skill.md (deja existant)

### Marketing psychology (custom, a construire)
- Pas de skill officiel Anthropic
- A construire custom dans /agents/skills/luna/copywriting-psychology.skill.md (Fichier 02)
- Sources : livres (Cialdini Influence, Eyal Hooked, Sutherland Alchemy), patterns dark patterns vs ethical persuasion

---

## DIRECTIVE 3 — UX Skills Discoverability (CRITIQUE)

Chaque skill doit etre decouvrable par l utilisateur via 4 mecanismes :

### Mecanisme 1 : Suggestions de prompts pre-ecrits dans le chat
Dans /cockpit/src/components/chat/ChatPanel.tsx, ajouter une section "Suggestions" sous l input quand l utilisateur ouvre un chat avec un agent. Suggestions specifiques a l agent actif. Exemple Luna : "Audite le SEO de mon site", "Analyse mes 3 concurrents principaux", etc.

### Mecanisme 2 : Skills Catalog Modal
Bouton "Voir tous mes skills" qui ouvre une modale listant tous les skills de l agent actif avec icone, description, bouton "Lancer ce skill" qui prefille un prompt, tag "Recommande pour ton projet" si pertinent.
A creer : /cockpit/src/components/chat/SkillsCatalogModal.tsx

### Mecanisme 3 : Indicateur visuel de skill en cours
Dans TaskLaunchOverlay.tsx, afficher le nom du skill charge :
"Sora utilise son expertise : Generation de rapport de performance"
+ liste des etapes en cours

### Mecanisme 4 : Quick Actions sur le Board
Dans /cockpit/src/views/BoardView.tsx, ajouter une barre "Quick Actions" en haut : Audit SEO, Analyser concurrent, Lancer campagne ads, Generer rapport mensuel.
A creer : /cockpit/src/components/board/QuickActionsBar.tsx

---

## DIRECTIVE 4 — Format obligatoire de chaque .skill.md

Frontmatter YAML OBLIGATOIRE :

---
name: nom-du-skill
agent: luna|sora|marcus|milo|doffy|orchestrator
category: audit|setup|production|optimization
genesisTask: Titre EXACT de la tache Genesis correspondante
triggerPrompts:
  - Exemple naturel 1
  - Exemple naturel 2
  - Exemple naturel 3
shortDescription: Description courte 1 ligne pour le catalogue
estimatedMinutes: 5
tools:
  - mcp_tool_name_1
bestInClassTools:
  - Nano Banana Pro
psychologicalAngles:
  - Loss aversion
  - Social proof
---

# Nom du skill

## Trigger
[Description de quand utiliser ce skill]

## Methodologie
[Etapes numerotees, 7-15 etapes]

## Output Format
[JSON structure attendue]

## Cross-agent handoff
[Si la tache trigger une action chez un autre agent]

## UX Discoverability
- triggerPrompts visibles dans Chat suggestions: [oui/non]
- Quick Action button visible: [oui/non]
- Recommande pour scope: [meta_ads, sem, seo, analytics, social_media, all]

---

## DIRECTIVE 5 — Order de priorite

Quand un skill peut faire face a un dilemme :
1. Qualite finale pour le client (Tier 1 - prioritaire absolu)
2. Coherence avec les autres skills (Tier 2)
3. Optimisation des couts API (Tier 3)

Le client paye pour la qualite, pas pour qu on optimise nos couts.
