# AUDIT TECHNIQUE COMPLET - THE HIVE OS V4
## Architecture des Workflows n8n

**Date d'audit:** 2026-02-27
**Version:** V4.4 - Phase 0 Validated
**Auditeur:** Claude Code

---

# TABLE DES MATIERES

1. [Vue d'ensemble de l'architecture](#1-vue-densemble-de-larchitecture)
2. [Analyse detaillee par workflow](#2-analyse-detaillee-par-workflow)
3. [Inventaire des noeuds par type](#3-inventaire-des-noeuds-par-type)
4. [Parametres vides ou incomplets](#4-parametres-vides-ou-incomplets)
5. [Simulation du flow task_launch/sora](#5-simulation-du-flow-task_launchsora)
6. [Recommandations de configuration](#6-recommandations-de-configuration)
7. [Memory Stores requises](#7-memory-stores-requises)

---

# 1. VUE D'ENSEMBLE DE L'ARCHITECTURE

## 1.1 Hierarchie des workflows

```
                    +------------------+
                    |   PM-CORE V4.4   |
                    | (Point d'entree) |
                    +--------+---------+
                             |
              +--------------+---------------+
              |                              |
    +---------v----------+        +----------v---------+
    | ORCHESTRATOR-CORE  |        |   GENESIS HANDLER  |
    | (Routage agents)   |        |   (Creation projet)|
    +---------+----------+        +--------------------+
              |
    +---------+---------+---------+---------+
    |         |         |         |         |
+---v---+ +---v---+ +---v---+ +---v---+
| SORA  | |MARCUS | | LUNA  | | MILO  |
|Analyst| |Trader | |Strat. | |Creat. |
+-------+ +-------+ +-------+ +-------+
```

## 1.2 Tableau recapitulatif des workflows

| Workflow | Noeuds | AI Agents | Tools | Code Nodes | LLM | Memory |
|----------|--------|-----------|-------|------------|-----|--------|
| PM-CORE V4.4 | 26 | 1 | 0 | 11 | GPT-4o | Non |
| ORCHESTRATOR-CORE | 11 | 1 | 4 | 3 | GPT-4o | Oui (Window) |
| SORA (Analyst) | 12 | 1 | 4 | 4 | Gemini 2.0 Flash | Non |
| MARCUS (Trader) | 13 | 1 | 3 | 5 | Gemini 2.0 Flash | Non |
| LUNA (Strategist) | 12 | 1 | 2 | 6 | Gemini 2.0 Flash | Oui (Window) |
| MILO (Creative) | 14 | 1 | 3 | 7 | Gemini 2.0 Flash | Oui (Window) |

---

# 2. ANALYSE DETAILLEE PAR WORKFLOW

## 2.1 PM-CORE V4.4 (pm-core-v4.4-validated.workflow.json)

### Architecture
```
Main Entry Point (Webhook POST /pm-v4-entry)
    |
Route Dispatcher (Code)
    |
Action Switch (4 branches)
    |
    +-- genesis --> Genesis Handler --> Format Final Response
    +-- task_launch --> Task Launch Handler --> Read Project Memory --> Build Memory Context --> Detect Agent Action --> Validate State Flags --> PM AI Brain --> Call Orchestrator
    +-- write_back --> Write-Back Handler --> Format Final Response
    +-- quick_action --> Quick Action Handler --> Read Project Memory (same path as task_launch)
```

### Noeuds AI Agent (1)
| Noeud | Type | Model | Temperature | Tools connectes |
|-------|------|-------|-------------|-----------------|
| PM AI Brain | @n8n/n8n-nodes-langchain.agent v1.7 | GPT-4o | 0.3 | Aucun tool direct |

### Noeuds Code (11)
1. **Route Dispatcher** - Detecte action type et build context
2. **Genesis Handler** - Cree projet + tasks a partir de templates
3. **Task Launch Handler** - Prepare pour lecture memoire
4. **Build Memory Context** - Enrichit context avec memoire collective
5. **Detect Agent Action** - Phase 0: Detection action critique
6. **Validate State Flags** - Phase 0: Validation state flags
7. **Format Blocked Error** - Formate erreur si action bloquee
8. **Parse PM Decision** - Parse decision AI et build payload orchestrator
9. **Process Response** - Extrait memory contribution
10. **Merge Memory Result** - Merge resultat ecriture memoire
11. **Format Final Response** - Formate reponse pour frontend

### Parametres CRITIQUES configures
- **Webhook path:** `/pm-v4-entry`
- **Response mode:** `lastNode`
- **LLM:** GPT-4o, temperature 0.3
- **Supabase Credential ID:** `VOTRE_CREDENTIAL_ID` (A CONFIGURER)
- **OpenAI Credential ID:** `VOTRE_OPENAI_CREDENTIAL_ID` (A CONFIGURER)

### Parametres VIDES/INCOMPLETS
| Noeud | Parametre | Statut | Impact |
|-------|-----------|--------|--------|
| Read Project Memory | supabaseApi credential | PLACEHOLDER | BLOQUANT |
| Read Project State | supabaseApi credential | PLACEHOLDER | BLOQUANT |
| Write Memory | supabaseApi credential | PLACEHOLDER | BLOQUANT |
| PM Chat Model | openAiApi credential | PLACEHOLDER | BLOQUANT |
| Call Orchestrator | ORCHESTRATOR_WEBHOOK_URL | Variable env | A CONFIGURER |

---

## 2.2 ORCHESTRATOR-CORE (orchestrator-core.workflow.json)

### Architecture
```
Webhook Trigger / Chat Trigger
    |
Load Global Context (Code - Hardcoded config)
    |
Inject System Prompt (Code)
    |
AI Agent Router
    |-- OpenAI Chat Model (GPT-4o)
    |-- Simple Memory (Window Buffer)
    |-- Tool: Call Analyst
    |-- Tool: Call Strategist
    |-- Tool: Call Creative
    |-- Tool: Call Trader
    |
Format UI Response (Code)
    |
Respond to Webhook
```

### Noeuds AI Agent (1)
| Noeud | Type | Model | Temperature | Tools connectes |
|-------|------|-------|-------------|-----------------|
| AI Agent Router | @n8n/n8n-nodes-langchain.agent v1.7 | GPT-4o | 0.3 | 4 (call_analyst, call_strategist, call_creative, call_trader) |

### Noeuds Tool (4)
| Tool | Type | Workflow cible | Schema |
|------|------|----------------|--------|
| call_analyst | toolWorkflow v1.2 | Analyst MCP - Agency Killer V4 | query (string, required), session_id (string, optional) |
| call_strategist | toolWorkflow v1.2 | Strategist MCP - Agency Killer V4 | query (string, required), session_id (string, optional) |
| call_creative | toolWorkflow v1.2 | Creative MCP - Agency Killer V4 | query (string, required), format (string, optional), session_id (string, optional) |
| call_trader | toolWorkflow v1.2 | Trader MCP - Agency Killer V4 | query (string, required), action (string, optional), session_id (string, optional) |

### Memory Store
| Type | Configuration |
|------|---------------|
| memoryBufferWindow v1.2 | Session key dynamique: `$json.user_input?.session_id` |

### Parametres VIDES/INCOMPLETS
| Noeud | Parametre | Statut | Impact |
|-------|-----------|--------|--------|
| OpenAI Chat Model | Credential | NON VISIBLE (a verifier) | POTENTIEL |
| Tool: Call Analyst | workflowId | Mode "name" - workflow doit exister | A VERIFIER |
| Tool: Call Strategist | workflowId | Mode "name" - workflow doit exister | A VERIFIER |
| Tool: Call Creative | workflowId | Mode "name" - workflow doit exister | A VERIFIER |
| Tool: Call Trader | workflowId | Mode "name" - workflow doit exister | A VERIFIER |

---

## 2.3 SORA (FINALE_SORA_MCP.workflow.json)

### Architecture
```
Webhook Trigger (POST /sora-v4-finale)
    |
Load Context from Supabase (Code - axios)
    |
Check Task Dependencies (Code - RPC can_start_task)
    |
Prepare SORA Context (Code - System Prompt injection)
    |
SORA AI Agent
    |-- Google Gemini 2.0 Flash (temperature 0.2)
    |-- Tool: Google Ads Manager
    |-- Tool: Meta Ads Manager
    |-- Tool: GTM Manager
    |-- Tool: Looker Manager
    |
Parse Response & Execute Write-Backs (Code)
    |
Respond to Webhook
```

### Noeuds AI Agent (1)
| Noeud | Type | Model | Temperature | Tools connectes |
|-------|------|-------|-------------|-----------------|
| SORA AI Agent | @n8n/n8n-nodes-langchain.agent v1.7 | gemini-2.0-flash-exp | 0.2 | 4 (google_ads_manager, meta_ads_manager, gtm_manager, looker_manager) |

### Noeuds Tool (4)
| Tool | Type | Description | Statut Implementation |
|------|------|-------------|----------------------|
| google_ads_manager | toolCode v1.1 | 7 fonctions READ-ONLY Google Ads | PLACEHOLDER (mock) |
| meta_ads_manager | toolCode v1.1 | 7 fonctions READ-ONLY Meta Ads | PLACEHOLDER (mock) |
| gtm_manager | toolCode v1.1 | 7 fonctions GTM Setup | PLACEHOLDER (mock) |
| looker_manager | toolCode v1.1 | 7 fonctions Looker Studio | PLACEHOLDER (mock) |

### Fonctions documentees dans System Prompt (28 total)
**Google Ads Manager (7):**
1. get_accounts
2. get_campaigns
3. get_search_terms
4. get_keywords_quality_score
5. get_conversions
6. create_audience (SEULE fonction WRITE)
7. get_performance_report

**Meta Ads Manager (7):**
8. get_ad_accounts
9. get_campaigns
10. get_insights
11. get_ad_sets
12. check_learning_phase (CRITIQUE pour scaling)
13. get_pixel_events
14. get_audience_overlap

**GTM Manager (7):**
15. list_containers
16. list_tags
17. create_tag (WRITE - Setup)
18. create_trigger
19. create_variable
20. publish_version (WRITE - Production)
21. preview_mode

**Looker Manager (7):**
22. create_report
23. add_scorecard
24. add_time_series_chart
25. add_table
26. blend_data_sources
27. schedule_email
28. get_report_url

### Parametres VIDES/INCOMPLETS
| Noeud | Parametre | Statut | Impact |
|-------|-----------|--------|--------|
| Google Gemini 2.0 Flash | googlePalmApi credential | ID "google-ai-credentials" | A VERIFIER |
| Tool: Google Ads Manager | workflowCode | PLACEHOLDER MOCK | BLOQUANT - Pas de vraie API |
| Tool: Meta Ads Manager | workflowCode | PLACEHOLDER MOCK | BLOQUANT - Pas de vraie API |
| Tool: GTM Manager | workflowCode | PLACEHOLDER MOCK | BLOQUANT - Pas de vraie API |
| Tool: Looker Manager | workflowCode | PLACEHOLDER MOCK | BLOQUANT - Pas de vraie API |
| Load Context | SUPABASE_ANON_KEY | Hardcode dans code | SECURITE - A mettre en env var |

---

## 2.4 MARCUS (FINALE_MARCUS_MCP.workflow.json.BACKUP)

### Architecture
```
Webhook Trigger (POST /marcus-v4-finale)
    |
Load Context from Supabase (Code)
    |
Check Task Dependencies (Code)
    |
Check State Flags (Code) -- SPECIFIQUE MARCUS
    |
Prepare MARCUS Context (Code)
    |
MARCUS AI Agent
    |-- Google Gemini 2.0 Flash (temperature 0.3)
    |-- Tool: Meta Campaign Launcher
    |-- Tool: Google Ads Launcher
    |-- Tool: Budget Optimizer
    |
Parse Response & Execute Write-Backs (Code)
    |
Respond to Webhook
```

### Noeuds AI Agent (1)
| Noeud | Type | Model | Temperature | Tools connectes |
|-------|------|-------|-------------|-----------------|
| MARCUS AI Agent | @n8n/n8n-nodes-langchain.agent v1.7 | gemini-2.0-flash-exp | 0.3 | 3 (meta_campaign_toolkit, google_ads_toolkit, budget_optimizer_toolkit) |

### Noeuds Tool (3)
| Tool | Type | Description | Statut Implementation |
|------|------|-------------|----------------------|
| meta_campaign_toolkit | toolCode v1.1 | 7 fonctions WRITE Meta Ads | PLACEHOLDER (mock) |
| google_ads_toolkit | toolCode v1.1 | 7 fonctions WRITE Google Ads | PLACEHOLDER (mock) |
| budget_optimizer_toolkit | toolCode v1.1 | 7 fonctions optimisation budget | PLACEHOLDER (mock) |

### Fonctions documentees dans System Prompt (21 total)
**Meta Campaign Launcher (7):**
1. create_meta_campaign (WRITE - APPROBATION si >500EUR/jour)
2. create_meta_ad_set
3. create_meta_ad
4. update_meta_campaign_status
5. update_meta_ad_set_budget
6. scale_meta_ad_set (Learning Phase Protection)
7. kill_underperforming_meta_ad

**Google Ads Launcher (7):**
8. create_google_search_campaign
9. create_google_ad_group
10. add_google_keywords
11. create_google_rsa
12. add_google_negative_keywords
13. update_google_campaign_budget
14. update_google_campaign_status

**Budget Optimizer (7):**
15. analyze_campaign_performance
16. recommend_budget_reallocation
17. identify_winners_losers
18. calculate_optimal_distribution
19. learning_phase_protection (CRITIQUE)
20. multi_platform_balancing
21. confidence_interval_check

### State Flags requis (Check State Flags node)
```javascript
const requiredFlags = {
  'meta_pixel_configured': 'Meta Pixel must be configured before launching campaigns',
  'google_ads_conversion_tracking': 'Google Ads conversion tracking must be set up'
};
```

### Parametres VIDES/INCOMPLETS
| Noeud | Parametre | Statut | Impact |
|-------|-----------|--------|--------|
| Google Gemini 2.0 Flash | googlePalmApi credential | ID "google-ai-credentials" | A VERIFIER |
| Tool: Meta Campaign Launcher | workflowCode | PLACEHOLDER MOCK | BLOQUANT |
| Tool: Google Ads Launcher | workflowCode | PLACEHOLDER MOCK | BLOQUANT |
| Tool: Budget Optimizer | workflowCode | PLACEHOLDER MOCK | BLOQUANT |
| Check State Flags | Flags hardcodes | Incomplet | A ETENDRE |

---

## 2.5 LUNA (FINALE_LUNA_MCP.workflow.json)

### Architecture
```
Webhook Trigger (POST /luna-strategist-final)
    |
Execute Workflow Trigger (alternative entry)
    |
Load Full Context (Supabase - fetch API)
    |
Check Task Dependencies (Code)
    |
Prepare Luna Context (Code)
    |
Luna Brain (AI Agent)
    |-- Google Gemini 2.0 Flash (temperature 0.5)
    |-- Window Buffer Memory
    |-- Tool: SEO Audit
    |-- Tool: Keyword Research
    |
Parse Response & Commands (Code)
    |
Execute Write-Backs (Real) (Code)
    |
Respond to Webhook
```

### Noeuds AI Agent (1)
| Noeud | Type | Model | Temperature | Tools connectes |
|-------|------|-------|-------------|-----------------|
| Luna Brain (AI Agent) | @n8n/n8n-nodes-langchain.agent v1.7 | gemini-2.0-flash-exp | 0.5 | 2 (seo_audit, keyword_research) |

### Noeuds Tool (2)
| Tool | Type | Description | Statut Implementation |
|------|------|-------------|----------------------|
| seo_audit | toolCode v1.1 | Audit SEO technique + semantique | PLACEHOLDER (mock avec structure reelle) |
| keyword_research | toolCode v1.1 | Recherche mots-cles + volumes | PLACEHOLDER (mock avec structure reelle) |

### Memory Store
| Type | Configuration |
|------|---------------|
| memoryBufferWindow v1.2 | Default options |

### Fonctions documentees dans System Prompt (14 total)
**SEO Audit Tool (7):**
1. seo_technical_audit(url)
2. seo_semantic_audit(url)
3. competitor_analysis(url, competitors)
4. site_health_check(url)

**Keyword Research Tool (7):**
5. keyword_research(seed_keywords, location)
6. related_questions(keyword)
7. trending_keywords(topic, timeframe)
8. keyword_gap_analysis(your_url, competitor_urls)

### Parametres VIDES/INCOMPLETS
| Noeud | Parametre | Statut | Impact |
|-------|-----------|--------|--------|
| Google Gemini 2.0 Flash | googleGeminiOAuth2Api credential | ID "google-gemini-credentials" | A VERIFIER |
| Load Full Context | SUPABASE_URL, SUPABASE_ANON_KEY | Variables env | A CONFIGURER |
| Tool: SEO Audit | workflowCode | PLACEHOLDER MOCK | NON-BLOQUANT (retourne structure) |
| Tool: Keyword Research | workflowCode | PLACEHOLDER MOCK | NON-BLOQUANT (retourne structure) |

---

## 2.6 MILO (FINALE_MILO_MCP.workflow.json)

### Architecture
```
Webhook Trigger (POST /milo-creative-final)
    |
Execute Workflow Trigger (alternative entry)
    |
Load Full Context (Supabase - fetch API)
    |
Check Task Dependencies (Code)
    |
Check State Flags (Code) -- SPECIFIQUE MILO
    |
Prepare Milo Context (Code)
    |
Milo Brain (AI Agent)
    |-- Google Gemini 2.0 Flash (temperature 0.7)
    |-- Window Buffer Memory
    |-- Tool: Nano Banana Pro (Wrapped)
    |-- Tool: VEO-3 (Wrapped)
    |-- Tool: ElevenLabs (Wrapped)
    |
Parse Response & Commands (Code)
    |
Execute Write-Backs (Real) (Code)
    |
Respond to Webhook
```

### Noeuds AI Agent (1)
| Noeud | Type | Model | Temperature | Tools connectes |
|-------|------|-------|-------------|-----------------|
| Milo Brain (AI Agent) | @n8n/n8n-nodes-langchain.agent v1.7 | gemini-2.0-flash-exp | 0.7 | 3 (nano_banana_pro_wrapped, veo3_wrapped, elevenlabs_wrapped) |

### Noeuds Tool (3)
| Tool | Type | Description | Cout/Credits | Statut Implementation |
|------|------|-------------|--------------|----------------------|
| nano_banana_pro_wrapped | toolCode v1.1 | Generation images 4K (Imagen 3) | 10 credits, $0.04 | COMPLET avec quota tracking |
| veo3_wrapped | toolCode v1.1 | Generation video 4-8s | 100 credits, $0.12 | COMPLET avec quota tracking |
| elevenlabs_wrapped | toolCode v1.1 | TTS + Sound effects | 5 credits, $0.03 | COMPLET avec quota tracking |

### Memory Store
| Type | Configuration |
|------|---------------|
| memoryBufferWindow v1.2 | Default options |

### State Flags requis (Check State Flags node)
```javascript
const MILO_FLAG_RULES = {
  generate_creatives: {
    required_flags: ['tracking_ready'],
    required_phase: ['Production', 'Execution'],
    message: 'Tracking must be set up before creating ads'
  },
  generate_video_batch: {
    required_flags: ['strategy_validated'],
    required_phase: ['Production', 'Execution'],
    message: 'Strategy must be validated before creating video content'
  }
};
```

### Fonctions documentees dans System Prompt
**Nano Banana Pro (Image 4K):**
- prompt (required)
- resolution: 1024x1024, 2048x2048, 4096x4096
- style: photorealistic, digital_art, cinematic, professional_photo
- quality: standard, high, ultra, professional
- negative_prompt, creativity (0-100)

**VEO-3 (Video):**
- prompt (required)
- duration: 4s, 8s
- resolution: 720p, 1080p
- fps: 24, 30, 60
- style: cinematic, animation, realistic, artistic
- camera_motion: static, pan, zoom, tracking, dynamic
- aspect_ratio: 16:9, 9:16, 1:1

**ElevenLabs (Audio):**
- TTS: text, voice_id, model, stability, similarity_boost
- Sound Effects: prompt, duration_seconds (0.5-22), prompt_influence

### Parametres VIDES/INCOMPLETS
| Noeud | Parametre | Statut | Impact |
|-------|-----------|--------|--------|
| Google Gemini 2.0 Flash | googleGeminiOAuth2Api credential | ID "google-gemini-credentials" | A VERIFIER |
| Tool: Nano Banana Pro | GOOGLE_API_KEY, GOOGLE_PROJECT_ID | Variables env | BLOQUANT si non configure |
| Tool: VEO-3 | GOOGLE_API_KEY, GOOGLE_PROJECT_ID | Variables env | BLOQUANT si non configure |
| Tool: ElevenLabs | ELEVENLABS_API_KEY | Variable env | BLOQUANT si non configure |
| Tous Tools | SUPABASE_URL, SUPABASE_ANON_KEY | Variables env | BLOQUANT pour quota tracking |

---

# 3. INVENTAIRE DES NOEUDS PAR TYPE

## 3.1 Noeuds AI Agent (Total: 6)

| Workflow | Noeud | Model | Temperature | Tools | Memory |
|----------|-------|-------|-------------|-------|--------|
| PM-CORE | PM AI Brain | GPT-4o | 0.3 | 0 | Non |
| ORCHESTRATOR | AI Agent Router | GPT-4o | 0.3 | 4 | Window |
| SORA | SORA AI Agent | Gemini 2.0 Flash | 0.2 | 4 | Non |
| MARCUS | MARCUS AI Agent | Gemini 2.0 Flash | 0.3 | 3 | Non |
| LUNA | Luna Brain | Gemini 2.0 Flash | 0.5 | 2 | Window |
| MILO | Milo Brain | Gemini 2.0 Flash | 0.7 | 3 | Window |

## 3.2 Noeuds Tool (Total: 16)

| Workflow | Tool | Type | API Reelle | Statut |
|----------|------|------|-----------|--------|
| ORCHESTRATOR | call_analyst | toolWorkflow | N/A | A VERIFIER |
| ORCHESTRATOR | call_strategist | toolWorkflow | N/A | A VERIFIER |
| ORCHESTRATOR | call_creative | toolWorkflow | N/A | A VERIFIER |
| ORCHESTRATOR | call_trader | toolWorkflow | N/A | A VERIFIER |
| SORA | google_ads_manager | toolCode | Google Ads API | MOCK |
| SORA | meta_ads_manager | toolCode | Meta Marketing API | MOCK |
| SORA | gtm_manager | toolCode | GTM API | MOCK |
| SORA | looker_manager | toolCode | Looker Studio API | MOCK |
| MARCUS | meta_campaign_toolkit | toolCode | Meta Marketing API | MOCK |
| MARCUS | google_ads_toolkit | toolCode | Google Ads API | MOCK |
| MARCUS | budget_optimizer_toolkit | toolCode | Custom | MOCK |
| LUNA | seo_audit | toolCode | Custom SEO APIs | MOCK |
| LUNA | keyword_research | toolCode | Keyword APIs | MOCK |
| MILO | nano_banana_pro_wrapped | toolCode | Google Imagen 3 | COMPLET |
| MILO | veo3_wrapped | toolCode | Google VEO-3 | COMPLET |
| MILO | elevenlabs_wrapped | toolCode | ElevenLabs API | COMPLET |

## 3.3 Noeuds Code (Total: 36)

| Workflow | Noeuds Code | Complexite |
|----------|-------------|------------|
| PM-CORE | 11 | Haute (routing, validation, memory) |
| ORCHESTRATOR | 3 | Moyenne (context, prompt, UI) |
| SORA | 4 | Moyenne (context, dependencies, response) |
| MARCUS | 5 | Haute (context, dependencies, flags, response) |
| LUNA | 6 | Haute (context, dependencies, commands, writebacks) |
| MILO | 7 | Tres haute (context, dependencies, flags, tools wrap, writebacks) |

---

# 4. PARAMETRES VIDES OU INCOMPLETS

## 4.1 Credentials manquants (BLOQUANTS)

| Workflow | Credential Type | ID Reference | Impact |
|----------|----------------|--------------|--------|
| PM-CORE | supabaseApi | VOTRE_CREDENTIAL_ID | Lecture/ecriture memoire impossible |
| PM-CORE | openAiApi | VOTRE_OPENAI_CREDENTIAL_ID | PM AI Brain inoperant |
| ORCHESTRATOR | openAiApi | Non specifie | AI Agent Router inoperant |
| SORA | googlePalmApi | google-ai-credentials | SORA AI Agent inoperant |
| MARCUS | googlePalmApi | google-ai-credentials | MARCUS AI Agent inoperant |
| LUNA | googleGeminiOAuth2Api | google-gemini-credentials | Luna Brain inoperant |
| MILO | googleGeminiOAuth2Api | google-gemini-credentials | Milo Brain inoperant |

## 4.2 Variables d'environnement requises

| Variable | Workflows | Usage |
|----------|-----------|-------|
| SUPABASE_URL | TOUS | Connexion Supabase |
| SUPABASE_ANON_KEY | TOUS | Authentification Supabase |
| ORCHESTRATOR_WEBHOOK_URL | PM-CORE | Appel HTTP vers Orchestrator |
| GOOGLE_API_KEY | MILO | Imagen 3, VEO-3 |
| GOOGLE_PROJECT_ID | MILO | GCP Project |
| ELEVENLABS_API_KEY | MILO | ElevenLabs TTS |

## 4.3 Tools MOCK a remplacer (NON-PRODUCTION)

| Workflow | Tool | API a implementer |
|----------|------|-------------------|
| SORA | google_ads_manager | Google Ads API v17 |
| SORA | meta_ads_manager | Meta Marketing API v19 |
| SORA | gtm_manager | GTM API v2 |
| SORA | looker_manager | Looker Studio Embed API |
| MARCUS | meta_campaign_toolkit | Meta Marketing API v19 |
| MARCUS | google_ads_toolkit | Google Ads API v17 |
| MARCUS | budget_optimizer_toolkit | Custom logic |
| LUNA | seo_audit | Multiple: PageSpeed, GSC, etc. |
| LUNA | keyword_research | SEMrush/Ahrefs API |

---

# 5. SIMULATION DU FLOW TASK_LAUNCH/SORA

## 5.1 Requete Webhook entrante

```json
{
  "action": "task_launch",
  "task_id": "73d88758-a26b-433e-a0eb-672a6db62872",
  "task_title": "Audit Technique Data Layer",
  "task_description": "Auditer le Data Layer existant...",
  "task_phase": "Audit",
  "assignee": "sora",
  "context_questions": ["Data layer existant ?", "Variables disponibles ?", "Documentation dev ?"],
  "user_inputs": {},
  "depends_on": [],
  "shared_memory": {
    "project_id": "71b4ffbd-414a-4c70-bef1-4b47c3d38b34",
    "project_name": "Investis10",
    "project_status": "planning",
    "current_phase": "setup",
    "scope": "analytics",
    "state_flags": {"ads_live": false}
  }
}
```

## 5.2 Chemin d'execution

### Etape 1: PM-CORE (Entry Point)

```
1. Main Entry Point (POST /pm-v4-entry)
   Input: Requete webhook complete

2. Route Dispatcher
   - Detecte action = "task_launch"
   - Extrait task_data: {task_id, project_id, user_message, active_agent_id: "sora", shared_memory}

3. Action Switch
   - Route vers branche "task_launch"

4. Task Launch Handler
   - Prepare project_id_for_memory: "71b4ffbd-414a-4c70-bef1-4b47c3d38b34"
   - active_agent_id: "sora"

5. Read Project Memory (Supabase)
   - Query: SELECT * FROM project_memory WHERE project_id = '71b4ffbd...' ORDER BY created_at DESC LIMIT 10
   - RISQUE: Credential Supabase non configure = ECHEC

6. Build Memory Context
   - Construit previous_work, validated_elements, recommendations_for_current_task

7. Detect Agent Action
   - agent_type: "analyst" (sora = analyst)
   - user_message analyse pour detecter action critique
   - detected_action: "audit_tracking" (car "audit" + "data layer" dans description)
   - requires_validation: true

8. Requires Validation? (IF)
   - true -> Read Project State

9. Read Project State (Supabase)
   - Query: SELECT state_flags, current_phase FROM projects WHERE id = '71b4ffbd...'
   - RISQUE: Credential Supabase non configure = ECHEC

10. Validate State Flags
    - Regle pour analyst.audit_tracking:
      required_phase: ['Setup', 'Production']
      severity: 'warning'
    - current_phase: "setup" -> VALIDE
    - validation_passed: true

11. Validation Passed? (IF)
    - true -> PM AI Brain

12. PM AI Brain (GPT-4o)
    - System prompt avec memoire collective
    - Decide: selected_agent = "sora", routing_reason = "Demande d'audit technique Data Layer"
    - RISQUE: OpenAI credential non configure = ECHEC

13. Parse PM Decision
    - Build orchestratorPayload avec memory_context injection

14. Call Orchestrator (HTTP POST)
    - URL: $env.ORCHESTRATOR_WEBHOOK_URL
    - Body: orchestratorPayload
    - RISQUE: URL non configuree = ECHEC
```

### Etape 2: ORCHESTRATOR-CORE

```
1. Webhook Trigger / Load Global Context
   - Charge brand_memory, specialists config

2. Inject System Prompt
   - Delegation protocol hardcode

3. AI Agent Router (GPT-4o)
   - Analyse requete
   - Decide: call_analyst (car "audit", "data layer", "tracking")
   - RISQUE: OpenAI credential non configure = ECHEC

4. Tool: Call Analyst (toolWorkflow)
   - Execute workflow: "Analyst MCP - Agency Killer V4"
   - RISQUE: Workflow n'existe pas avec ce nom exact = ECHEC
   - Note: Ce devrait pointer vers SORA workflow, pas "Analyst MCP"
```

### Etape 3: SORA (si correctement route)

```
1. Webhook Trigger (POST /sora-v4-finale)
   - Note: L'orchestrator devrait appeler cette URL directement
   - OU utiliser Execute Workflow si meme instance n8n

2. Load Context from Supabase
   - project_id: "71b4ffbd..."
   - task_id: "73d88758..."
   - Charge project, task, memoryContext
   - RISQUE: Credential Supabase hardcode dans code = NON SECURISE

3. Check Task Dependencies
   - Appelle RPC can_start_task(p_task_id: "73d88758...")
   - depends_on: [] -> ready: true

4. Prepare SORA Context
   - Injecte SORA_SYSTEM_PROMPT (28 fonctions documentees)
   - Formate context complet

5. SORA AI Agent (Gemini 2.0 Flash)
   - Recoit context enrichi
   - Analyse task_description: "Auditer le Data Layer existant..."
   - DOIT utiliser: gtm_manager.list_containers, gtm_manager.list_tags
   - RISQUE: Tools sont MOCK = Pas de vraie analyse

6. Reponse attendue:
   "Je vais auditer le Data Layer pour le projet Investis10.

   **Audit Data Layer - Resultats:**

   - Data Layer detecte: NON (window.dataLayer = undefined)
   - Variables disponibles: Aucune
   - Documentation dev: Non fournie

   **Recommandations:**
   1. Creer Data Layer from scratch
   2. Variables requises: page_type, user_id, transaction_id, product_details
   3. Collaboration developpeur necessaire

   [MEMORY_WRITE]
   [UPDATE_TASK_STATUS: in_progress, 25%]
   [UI_COMPONENT: DATA_LAYER_AUDIT_RESULT]"

7. Parse Response & Execute Write-Backs
   - Extrait JSON commands de la reponse
   - Execute MEMORY_WRITE -> Supabase project_memory
   - Execute UPDATE_TASK_STATUS -> Supabase tasks
   - Collecte UI_COMPONENT pour frontend

8. Respond to Webhook
   - Headers: X-Agent: SORA-V4-FINALE, X-Hive-Version: 4.4
   - Body: {agent, timestamp, response, ui_component, write_backs_executed}
```

### Etape 4: Retour PM-CORE

```
15. Process Response
    - Extrait memory_contribution de la reponse SORA

16. Has Memory? (IF)
    - true -> Write Memory

17. Write Memory (Supabase)
    - INSERT INTO project_memory (...)

18. Merge Memory Result
    - Combine avec reponse originale

19. Format Final Response
    - success: true
    - chat_message: "Audit Data Layer complete..."
    - ui_components: [DATA_LAYER_AUDIT_RESULT]
    - memory_updated: true

20. Respond to Webhook
    - Retour au frontend cockpit
```

## 5.3 Points de blocage identifies

| Etape | Point de blocage | Severite | Solution |
|-------|------------------|----------|----------|
| PM-5 | Credential Supabase manquant | CRITIQUE | Configurer dans n8n credentials |
| PM-9 | Credential Supabase manquant | CRITIQUE | Configurer dans n8n credentials |
| PM-12 | Credential OpenAI manquant | CRITIQUE | Configurer dans n8n credentials |
| PM-14 | ORCHESTRATOR_WEBHOOK_URL manquant | CRITIQUE | Definir env variable |
| ORCH-3 | Credential OpenAI manquant | CRITIQUE | Configurer dans n8n credentials |
| ORCH-4 | Workflow "Analyst MCP" n'existe pas | CRITIQUE | Renommer ou creer workflow |
| SORA-2 | Credentials hardcodes dans code | SECURITE | Migrer vers env variables |
| SORA-5 | Tools sont MOCK | FONCTIONNEL | Implementer vraies APIs |

---

# 6. RECOMMANDATIONS DE CONFIGURATION

## 6.1 Configuration SORA pour cette tache

### Tools requis et configures

| Tool | Requis pour cette tache | Configuration necessaire |
|------|------------------------|--------------------------|
| gtm_manager | OUI (audit Data Layer) | GTM API credentials |
| google_ads_manager | NON | N/A |
| meta_ads_manager | NON | N/A |
| looker_manager | NON | N/A |

### System Prompt optimal pour Audit Data Layer

```
Tu es SORA, l'Analyst de THE HIVE OS V4.

## TACHE ACTUELLE
Audit Technique Data Layer pour le projet Investis10.

## CONTEXTE
- Scope: analytics
- Phase: Audit
- Project status: planning
- State flags: ads_live = false

## OBJECTIFS SPECIFIQUES
1. Verifier existence du Data Layer (window.dataLayer)
2. Identifier variables disponibles
3. Lister les GAPS (variables manquantes)
4. Documenter pour collaboration developpeur

## TOOLS A UTILISER
1. gtm_manager.list_containers() - Identifier conteneur GTM
2. gtm_manager.list_tags() - Voir tags existants
3. gtm_manager.preview_mode() - Tester en mode preview

## OUTPUT ATTENDU
- Tableau Excel: Variable Name, Available, Example Value, Used By
- Recommandations: Variables a creer (product_id, transaction_id, user_type)
- Next steps: Collaboration developpeur si Data Layer absent

## WRITE-BACK COMMANDS OBLIGATOIRES
1. MEMORY_WRITE avec:
   - action: "DATA_LAYER_AUDITED"
   - summary: Resume de l'audit
   - key_findings: Variables trouvees/manquantes
   - deliverables: Lien Excel si genere
   - recommendations: Actions pour Marcus/Milo

2. UPDATE_TASK_STATUS:
   - status: "in_progress" ou "done"
   - progress_percentage: 25%, 50%, 75%, 100%

3. UI_COMPONENT:
   - type: "DATA_LAYER_AUDIT"
   - data: resultats structures
```

### Memory Stores necessaires

| Store | Type | Contenu |
|-------|------|---------|
| project_memory | Supabase table | Historique travaux agents, contributions |
| task_context | JSON in-memory | Context tache courante |
| brand_memory | Hardcoded | Identite marque, personas |

## 6.2 Corrections prioritaires

### Priorite 1: Credentials (BLOQUANT)

```bash
# Dans n8n Settings > Credentials, creer:

1. Supabase Credentials
   - Name: "Supabase - The Hive V4"
   - URL: https://vngkmmrglfajyccpbukh.supabase.co
   - API Key: [ANON_KEY depuis Supabase Dashboard]

2. OpenAI Credentials
   - Name: "OpenAI"
   - API Key: [Votre cle OpenAI]

3. Google AI Credentials
   - Name: "Google AI (Gemini)"
   - API Key: [Votre cle Google AI Studio]

4. Google Gemini OAuth2
   - Name: "Google Gemini OAuth2"
   - OAuth2 config avec Service Account
```

### Priorite 2: Variables d'environnement

```bash
# Dans n8n Settings > Variables ou .env:

SUPABASE_URL=https://vngkmmrglfajyccpbukh.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
ORCHESTRATOR_WEBHOOK_URL=https://votre-n8n.com/webhook/orchestrator-v5-entry
GOOGLE_API_KEY=AIza...
GOOGLE_PROJECT_ID=the-hive-os-v4
ELEVENLABS_API_KEY=...
```

### Priorite 3: Routing Orchestrator -> SORA

Dans `orchestrator-core.workflow.json`, le Tool "call_analyst" pointe vers:
```json
{
  "workflowId": {
    "__rl": true,
    "mode": "name",
    "value": "Analyst MCP - Agency Killer V4"
  }
}
```

**Probleme:** Le workflow SORA s'appelle "FINALE SORA MCP - THE HIVE OS V4", pas "Analyst MCP - Agency Killer V4".

**Solutions:**
1. Renommer SORA workflow en "Analyst MCP - Agency Killer V4"
2. OU Modifier orchestrator pour pointer vers "FINALE SORA MCP - THE HIVE OS V4"
3. OU Utiliser workflowId en mode "id" avec l'ID exact du workflow

### Priorite 4: Implementer Tools reels

Les tools SORA sont des MOCK. Pour cette tache specifique (Audit Data Layer), implementer:

```javascript
// gtm_manager - Implementation reelle
const gtmManager = {
  async list_containers(account_id) {
    const response = await fetch(
      `https://tagmanager.googleapis.com/tagmanager/v2/accounts/${account_id}/containers`,
      {
        headers: {
          'Authorization': `Bearer ${GOOGLE_OAUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.json();
  },

  async list_tags(container_path) {
    const response = await fetch(
      `https://tagmanager.googleapis.com/tagmanager/v2/${container_path}/workspaces/1/tags`,
      {
        headers: {
          'Authorization': `Bearer ${GOOGLE_OAUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.json();
  },

  async preview_mode(container_id) {
    // Generer URL preview
    return {
      preview_url: `https://tagassistant.google.com/#/?container_id=${container_id}`
    };
  }
};
```

---

# 7. MEMORY STORES REQUISES

## 7.1 Architecture memoire

```
+-------------------+     +--------------------+     +------------------+
|   PROJECT_MEMORY  |     |   TASK_CONTEXT     |     |   BRAND_MEMORY   |
|   (Supabase)      |     |   (In-Memory)      |     |   (Hardcoded)    |
+-------------------+     +--------------------+     +------------------+
| project_id (FK)   |     | task_id            |     | identity         |
| task_id (FK)      |     | project_id         |     | personas[]       |
| agent_id          |     | user_inputs        |     | voice            |
| action            |     | context_questions  |     | objectives       |
| summary           |     | depends_on         |     +------------------+
| key_findings[]    |     | shared_memory      |
| deliverables[]    |     +--------------------+
| recommendations[] |
| created_at        |
+-------------------+
```

## 7.2 Tables Supabase requises

### project_memory
```sql
CREATE TABLE project_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  task_id UUID REFERENCES tasks(id),
  agent_id TEXT NOT NULL,
  action TEXT NOT NULL,
  summary TEXT,
  key_findings JSONB DEFAULT '[]',
  deliverables JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  context_snapshot JSONB,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_project_memory_project ON project_memory(project_id);
CREATE INDEX idx_project_memory_task ON project_memory(task_id);
CREATE INDEX idx_project_memory_agent ON project_memory(agent_id);
```

### projects (state_flags)
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  name TEXT,
  scope TEXT,
  status TEXT,
  current_phase TEXT,
  state_flags JSONB DEFAULT '{
    "strategy_validated": false,
    "budget_approved": false,
    "creatives_ready": false,
    "tracking_ready": false,
    "ads_live": false
  }',
  metadata JSONB,
  project_memory JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### RPC Functions requises
```sql
-- can_start_task
CREATE OR REPLACE FUNCTION can_start_task(p_task_id UUID)
RETURNS TABLE(ready BOOLEAN, error_message TEXT, blocking_count INT)
AS $$
  -- Implementation...
$$ LANGUAGE plpgsql;

-- get_blocking_tasks
CREATE OR REPLACE FUNCTION get_blocking_tasks(p_task_id UUID)
RETURNS SETOF tasks
AS $$
  -- Implementation...
$$ LANGUAGE plpgsql;

-- check_quota_before_operation (pour MILO)
CREATE OR REPLACE FUNCTION check_quota_before_operation(
  p_operation TEXT,
  p_credits_required INT
)
RETURNS TABLE(allowed BOOLEAN, error_message TEXT, error_code TEXT, credits_remaining INT, usage_percent NUMERIC)
AS $$
  -- Implementation...
$$ LANGUAGE plpgsql;

-- record_api_usage (pour MILO)
CREATE OR REPLACE FUNCTION record_api_usage(
  p_project_id UUID,
  p_task_id UUID,
  p_agent_id TEXT,
  p_operation TEXT,
  p_provider TEXT,
  p_model TEXT,
  p_credits_consumed INT,
  p_cost_usd NUMERIC,
  p_request_params JSONB,
  p_response_metadata JSONB,
  p_status TEXT,
  p_error_message TEXT
)
RETURNS VOID
AS $$
  -- Implementation...
$$ LANGUAGE plpgsql;
```

## 7.3 Memory par agent

| Agent | In-Memory (Window) | Supabase (Persistent) | Usage |
|-------|-------------------|----------------------|-------|
| PM | Non | project_memory (read) | Contexte collectif |
| ORCHESTRATOR | Oui (Window Buffer) | Non | Conversation session |
| SORA | Non | project_memory (read/write) | Historique analyses |
| MARCUS | Non | project_memory (read/write) | Historique trading |
| LUNA | Oui (Window Buffer) | project_memory (read/write) | Strategie + conversation |
| MILO | Oui (Window Buffer) | project_memory (read/write), api_usage | Creations + quotas |

---

# 8. RESUME EXECUTIF

## 8.1 Statut global

| Composant | Statut | Blocages |
|-----------|--------|----------|
| PM-CORE V4.4 | INCOMPLET | Credentials Supabase/OpenAI manquants |
| ORCHESTRATOR-CORE | INCOMPLET | Credentials + routing workflow incorrect |
| SORA | INCOMPLET | Tools MOCK, credentials |
| MARCUS | INCOMPLET | Tools MOCK, credentials |
| LUNA | PARTIELLEMENT FONCTIONNEL | Tools MOCK mais structure correcte |
| MILO | QUASI-COMPLET | Tools reels, quotas, mais credentials env |

## 8.2 Actions immediates requises

1. **Configurer credentials n8n** (30 min)
   - Supabase, OpenAI, Google AI

2. **Definir variables d'environnement** (15 min)
   - SUPABASE_URL, ORCHESTRATOR_WEBHOOK_URL, etc.

3. **Corriger routing Orchestrator** (15 min)
   - Renommer workflows ou modifier references

4. **Tester flow complet** (1h)
   - Envoyer requete task_launch, verifier chaque etape

5. **Implementer tools reels** (priorite moyenne)
   - GTM Manager pour cette tache specifique
   - Autres tools selon besoins

## 8.3 Architecture recommandee finale

```
Frontend Cockpit
       |
       v
+------+-------+
| PM-CORE V4.4 |  <-- Point d'entree unique
+------+-------+
       |
       v
+------+--------+
| ORCHESTRATOR  |  <-- Routing + Delegation
+------+--------+
       |
   +---+---+---+---+
   |   |   |   |   |
   v   v   v   v   v
SORA MARCUS LUNA MILO
(HTTP POST direct vers webhooks respectifs)
       |
       v
+------+--------+
|   SUPABASE    |  <-- State, Memory, Quotas
+---------------+
```

---

**Fin de l'audit technique.**
**Document genere le 2026-02-27 par Claude Code.**
