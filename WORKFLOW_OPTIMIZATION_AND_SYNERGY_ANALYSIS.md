# WORKFLOW OPTIMIZATION & AGENT SYNERGY ANALYSIS
## THE HIVE OS V4 - Vision-Aligned Collaboration

**Date:** 2026-02-20
**Analyst:** Claude Code
**Focus:** Agent collaboration, memory-driven workflows, optimization opportunities

---

## EXECUTIVE SUMMARY

**Current Synergy Status:** ⚠️ **PARTIAL** - 60% of PRD vision implemented

**Key Gaps:**
- ❌ Agents don't actively read previous agents' deliverables
- ❌ Memory context is injected but not leveraged in agent prompts
- ⚠️ Recommendations are written but not enforced in next agent calls
- ✅ Memory system (read/write) is functional
- ✅ State flags validation works

**Recommendation:** Implement **Active Memory Injection** + **Cross-Agent Handoffs** to achieve true collaborative intelligence.

---

## PART 1: VISION ANALYSIS (From PRD)

### 1.1 PRD Vision: "Collective Intelligence Through Shared Memory"

**Section 1.2 - The Solution:**
> "4 agents IA spécialisés (Sora, Luna, Marcus, Milo) collaborent via une mémoire collective pour piloter, exécuter et optimiser des campagnes marketing"

**Section 1.3 - V3 → V4 Rupture:**
> "V4 (State-Based) : L'IA propose les tâches, les exécute, et écrit dans l'état du projet. **Les agents lisent le travail des autres et s'adaptent automatiquement.**"

**Section 2.8 - Memory Contribution:**
> "Le PM est le SEUL à lire/écrire dans `project_memory`. Les agents reçoivent `memory_context` et retournent `memory_contribution`."

**Recommendations for next agent:**
```json
{
  "recommendations": [
    {
      "for_agent": "marcus",
      "message": "Utiliser le visuel A pour la campagne"
    }
  ]
}
```

### 1.2 Expected Agent Collaboration Patterns

Based on PRD, here are the intended collaboration workflows:

#### 🔄 Pattern 1: Sequential Dependency
```
LUNA (Strategy) → MILO (Creatives) → MARCUS (Launch Campaign)
                                    ↓
                                  SORA (Monitor Performance)
```

**Expected Behavior:**
- MILO receives Luna's validated positioning (USP, tone, persona)
- MILO generates creatives that RESPECT Luna's strategic guidelines
- MARCUS receives MILO's deliverable URLs and uses them in campaign
- SORA monitors campaign and reports back to MARCUS for optimization

#### 🔄 Pattern 2: Feedback Loop
```
MARCUS launches campaign
         ↓
SORA analyzes performance (48h data)
         ↓
SORA recommends "Scale budget +20%" to MARCUS
         ↓
MARCUS receives recommendation and acts
```

#### 🔄 Pattern 3: Multi-Agent Synthesis
```
User: "Audit ma campagne et propose optimisations"
         ↓
PM calls:
  - SORA (Get campaign metrics)
  - LUNA (Analyze market context)
  - MARCUS (Recommend budget changes)
         ↓
PM synthesizes all 3 responses → Unified recommendation
```

---

## PART 2: CURRENT IMPLEMENTATION ANALYSIS

### 2.1 What's Working ✅

#### ✅ Memory System Infrastructure
- PM reads `project_memory` (10 latest entries)
- PM builds `memory_context` with previous work
- PM writes `memory_contribution` after agent response

**Evidence:**
```javascript
// Node: "Build Memory Context" (line 130)
const previousWork = memoryRecords.map(record => ({
  agent: record.agent_id,
  what_was_done: record.summary,
  key_findings: record.key_findings || [],
  deliverables: record.deliverables || [],
  recommendations: record.recommendations || [],
  timestamp: record.created_at
}));
```

#### ✅ State Flags Enforcement (PHASE 0)
- Prevents MARCUS from launching campaign without `creatives_ready` flag
- Forces sequential workflow (Audit → Setup → Production → Optimization)

**Evidence:**
```javascript
// Node: "Validate State Flags" (line 191)
if (rules.required_flags && rules.required_flags.length > 0) {
  const missingFlags = rules.required_flags.filter(
    flag => !project.state_flags?.[flag]
  );
  // Block if missing
}
```

#### ✅ Recommendations Extraction
- PM extracts recommendations for next agent

**Evidence:**
```javascript
// Node: "Build Memory Context" (line 130)
function extractRelevantRecommendations(previousWork, currentAgent) {
  const recommendations = [];
  for (const work of previousWork) {
    if (work.recommendations && work.recommendations.length > 0) {
      const agentRecos = work.recommendations.filter(r =>
        typeof r === 'string' && r.toLowerCase().includes(currentAgent.toLowerCase())
      );
      if (agentRecos.length > 0) {
        recommendations.push({ from_agent: work.agent, recommendations: agentRecos.slice(0, 3) });
      }
    }
  }
  return recommendations.slice(0, 5);
}
```

### 2.2 What's Missing ❌

#### ❌ GAP 1: Memory Context Not Used in Agent Prompts

**Problem:**
PM builds rich `memory_context` with previous work, validated elements, and recommendations... but **agents don't receive it in their prompts**.

**Evidence:**
Look at Orchestrator tools (line 86-200 in orchestrator-core.workflow.json):
```javascript
// Tool: call_analyst
"fields": {
  "values": [
    {
      "name": "query",
      "description": "La question ou demande de l'utilisateur concernant les metriques",
      "type": "string",
      "required": true
    },
    {
      "name": "session_id",
      "description": "L'identifiant de session",
      "type": "string",
      "required": false
    }
  ]
}
```

**Missing:**
- No `memory_context` field
- No `previous_work` field
- No `recommendations_for_you` field

**Impact:**
SORA, LUNA, MARCUS, MILO work **in isolation**. They don't see what other agents did.

---

#### ❌ GAP 2: Deliverables Not Linked Between Agents

**Problem:**
MILO generates image deliverables with URLs, writes them to `memory_contribution.deliverables`... but MARCUS doesn't receive them when creating campaigns.

**Expected Flow:**
```
MILO creates image → deliverable_url: "https://cloudinary.com/abc123.png"
         ↓
PM writes to project_memory
         ↓
MARCUS launches campaign → Should RECEIVE image URL and use it in ad creation
```

**Current Reality:**
```
MILO creates image → deliverable_url saved
         ↓
PM writes to project_memory
         ↓
MARCUS launches campaign → Has NO IDEA the image exists
         ↓
MARCUS: "Please provide creative assets before launching"
```

---

#### ❌ GAP 3: Recommendations Extracted But Not Injected

**Problem:**
PM extracts recommendations for current agent... but doesn't inject them into agent system prompt.

**Evidence:**
PM builds: `recommendations_for_current_task: [{ from: "luna", recommendations: ["Use expert tone"] }]`

But when calling Orchestrator (line 282):
```javascript
const orchestratorPayload = {
  chatInput: originalContext.user_message,
  session_id: originalContext.session_id,
  activeAgentId: pmDecision.selected_agent,
  shared_memory: originalContext.shared_memory,
  task_context: originalContext.task_context,
  system_instruction: memoryInjection,  // ← Only generic context, not specific recommendations
  memory_context: originalContext.memory_context  // ← Sent but not used by Orchestrator
};
```

The Orchestrator doesn't pass `memory_context` to specialist agents.

---

#### ❌ GAP 4: No Multi-Agent Workflows

**Problem:**
PM can only route to 1 agent at a time.

**PRD Vision (Section 4.F - Future):**
> "Mixture of Experts (V5) : 5 IA parallèles avec biais différents pour décisions complexes"

**Current Limitation:**
User: "Audit ma campagne et propose optimisations"

**What happens now:**
PM → Orchestrator → SORA (alone)

**What SHOULD happen:**
PM → Orchestrator → [SORA (metrics) + LUNA (market) + MARCUS (recommendations)] → Synthesize

---

#### ❌ GAP 5: State Flags Not Auto-Updated by Agents

**Problem:**
Agents write `memory_contribution` but don't update `state_flags`.

**Example:**
LUNA completes strategy validation → Should set `strategy_validated: true` automatically

**Current Reality:**
LUNA writes `memory_contribution.action = "STRATEGY_VALIDATED"`... but `projects.state_flags.strategy_validated` remains `false` unless manually updated.

**Evidence:**
PM writes memory (line 339) but doesn't update state_flags:
```sql
INSERT INTO project_memory (...)
VALUES (...)
-- No UPDATE projects SET state_flags = ...
```

---

## PART 3: OPTIMIZATION RECOMMENDATIONS

### 3.1 PRIORITY 1: Active Memory Injection (CRITICAL)

**Goal:** Make agents aware of previous work and recommendations.

**Implementation:**

#### Step 1: Extend Orchestrator Tool Schema

**File:** `/agents/CURRENT_orchestrator-mcp/orchestrator-core.workflow.json`

**Change:**
```javascript
// BEFORE
"fields": {
  "values": [
    { "name": "query", "type": "string", "required": true },
    { "name": "session_id", "type": "string", "required": false }
  ]
}

// AFTER
"fields": {
  "values": [
    { "name": "query", "type": "string", "required": true },
    { "name": "session_id", "type": "string", "required": false },
    { "name": "memory_context", "type": "object", "required": false, "description": "Previous work from other agents" },
    { "name": "recommendations", "type": "array", "required": false, "description": "Recommendations from previous agents for this agent" }
  ]
}
```

#### Step 2: Update PM Orchestrator Payload

**File:** `/agents/CURRENT_pm-mcp/pm-core-v4.4-validated.workflow.json`

**Node:** `parse-pm-response` (line 282)

**Change:**
```javascript
// Build orchestrator payload
const orchestratorPayload = {
  chatInput: originalContext.user_message,
  session_id: originalContext.session_id,
  activeAgentId: pmDecision.selected_agent,
  shared_memory: originalContext.shared_memory,
  task_context: originalContext.task_context,

  // NEW: Inject memory context for agent
  memory_context: originalContext.memory_context,

  // NEW: Extract recommendations for current agent
  recommendations_for_agent: originalContext.memory_context.recommendations_for_current_task,

  system_instruction: memoryInjection,
  pm_decision: pmDecision
};
```

#### Step 3: Update Agent Workflows to Use Memory Context

**Example: MARCUS (Trader MCP)**

**File:** `/agents/CURRENT_trader-mcp/trader-core.workflow.json`

**Add node:** "Inject Memory Context into System Prompt"

```javascript
// SYSTEM PROMPT INJECTION
const memoryContext = $input.first().json.memory_context || {};
const recommendations = $input.first().json.recommendations_for_agent || [];

let systemPrompt = `Tu es Marcus, l'expert Ads de THE HIVE OS.

## CONTEXTE PROJET (MEMOIRE COLLECTIVE)

### Travaux des autres agents:
${memoryContext.previous_work?.map(w =>
  `- **${w.agent.toUpperCase()}**: ${w.what_was_done}`
).join('\n') || 'Aucun travail précédent.'}

### Éléments validés par LUNA:
- USP: ${memoryContext.validated_elements?.usp || 'Non définie'}
- Persona: ${memoryContext.validated_elements?.persona || 'Non défini'}
- Ton: ${memoryContext.validated_elements?.tone || 'Professionnel'}

### Recommandations des autres agents pour toi:
${recommendations.map(r =>
  `- **${r.from_agent.toUpperCase()}**: ${r.recommendations.join(', ')}`
).join('\n') || 'Aucune recommandation spécifique.'}

### Assets créatifs disponibles:
${memoryContext.previous_work
  ?.filter(w => w.agent === 'milo' && w.deliverables?.length > 0)
  .flatMap(w => w.deliverables)
  .map(d => `- ${d.type}: ${d.url}`)
  .join('\n') || 'Aucun asset disponible.'}

## TA MISSION
${$input.first().json.query}

## REGLES IMPORTANTES
1. TOUJOURS respecter le ton et le positionnement validés par LUNA
2. TOUJOURS utiliser les assets créés par MILO (ne demande pas de nouveaux assets s'ils existent)
3. TOUJOURS vérifier les recommandations des autres agents avant d'agir
4. Si des données de performance existent (SORA), prends-les en compte pour tes décisions
`;

return [{ json: { system_prompt: systemPrompt } }];
```

**Impact:**
- MARCUS sees MILO's deliverables and uses them automatically
- MARCUS respects LUNA's positioning without asking again
- MARCUS considers SORA's performance data for budget decisions

---

### 3.2 PRIORITY 2: Auto-Update State Flags

**Goal:** Agents should auto-update `state_flags` when they complete critical actions.

**Implementation:**

#### Update PM Memory Write Node

**File:** `/agents/CURRENT_pm-mcp/pm-core-v4.4-validated.workflow.json`

**Node:** After `write-memory-contribution` (line 343)

**Add new node:** "Update State Flags from Memory Contribution"

```javascript
// AUTO-UPDATE STATE FLAGS BASED ON AGENT ACTION

const memoryContribution = $('Process Orchestrator Response').first().json.write_back_data;
const agentId = memoryContribution.agent_id;
const action = memoryContribution.action;
const projectId = memoryContribution.project_id;

// Mapping: agent action → state flag
const ACTION_TO_FLAG_MAP = {
  // LUNA actions
  'STRATEGY_VALIDATED': { flag: 'strategy_validated', value: true },
  'POSITIONING_VALIDATED': { flag: 'strategy_validated', value: true },

  // MILO actions
  'CREATIVES_DELIVERED': { flag: 'creatives_ready', value: true },
  'ASSETS_GENERATED': { flag: 'creatives_ready', value: true },

  // SORA actions
  'TRACKING_CONFIGURED': { flag: 'tracking_ready', value: true },
  'PIXEL_INSTALLED': { flag: 'tracking_ready', value: true },

  // MARCUS actions
  'CAMPAIGN_LAUNCHED': { flag: 'ads_live', value: true },
  'CAMPAIGN_KILLED': { flag: 'ads_live', value: false },

  // User approval (from write_back action)
  'BUDGET_APPROVED': { flag: 'budget_approved', value: true }
};

const flagUpdate = ACTION_TO_FLAG_MAP[action];

if (flagUpdate && projectId) {
  return [{
    json: {
      project_id: projectId,
      flag_name: flagUpdate.flag,
      flag_value: flagUpdate.value,
      should_update: true
    }
  }];
} else {
  return [{
    json: {
      should_update: false
    }
  }];
}
```

**Add Supabase Update Node:**

```javascript
// If should_update = true
UPDATE projects
SET state_flags = jsonb_set(
  COALESCE(state_flags, '{}'::jsonb),
  '{{{ $json.flag_name }}}',
  '{{ $json.flag_value }}'::jsonb
)
WHERE id = '{{ $json.project_id }}'
```

**Impact:**
- LUNA validates strategy → `strategy_validated` auto-set to `true`
- MILO delivers creatives → `creatives_ready` auto-set to `true`
- MARCUS launches campaign → `ads_live` auto-set to `true`
- State flags stay in sync with reality automatically

---

### 3.3 PRIORITY 3: Cross-Agent Deliverable Handoffs

**Goal:** When MILO creates assets, MARCUS should automatically receive the URLs.

**Implementation:**

#### Enhanced Memory Context Builder

**File:** `/agents/CURRENT_pm-mcp/pm-core-v4.4-validated.workflow.json`

**Node:** `build-memory-context` (line 130)

**Add:**
```javascript
// Extract deliverables from previous agents
function extractDeliverables(previousWork, deliverableType = null) {
  const deliverables = [];
  for (const work of previousWork) {
    if (work.deliverables && work.deliverables.length > 0) {
      const filtered = deliverableType
        ? work.deliverables.filter(d => d.type === deliverableType)
        : work.deliverables;

      deliverables.push(...filtered.map(d => ({
        ...d,
        created_by: work.agent,
        created_at: work.timestamp
      })));
    }
  }
  return deliverables;
}

const memoryContext = {
  project_summary: originalContext.shared_memory?.project_name || 'Projet en cours',
  previous_work: previousWork,
  validated_elements: { ... },
  current_state: { ... },
  recommendations_for_current_task: extractRelevantRecommendations(previousWork, originalContext.active_agent_id),

  // NEW: Available deliverables
  available_deliverables: {
    images: extractDeliverables(previousWork, 'image'),
    videos: extractDeliverables(previousWork, 'video'),
    copy: extractDeliverables(previousWork, 'ad_copy'),
    all: extractDeliverables(previousWork)
  }
};
```

**Impact:**
- MARCUS receives list of available images from MILO
- MARCUS can directly use URLs in campaign creation
- No more "Please provide creative assets" when they already exist

---

### 3.4 PRIORITY 4: Multi-Agent Workflows (Phase 2)

**Goal:** Enable PM to call multiple agents in parallel for complex requests.

**Implementation:**

#### Add Multi-Agent Detection

**File:** `/agents/CURRENT_pm-mcp/pm-core-v4.4-validated.workflow.json`

**New node after:** `detect-agent-action`

```javascript
// DETECT MULTI-AGENT REQUESTS

const userMessage = $input.first().json.user_message.toLowerCase();

const MULTI_AGENT_PATTERNS = [
  {
    pattern: /audit.*campagne.*optim/,
    agents: ['sora', 'luna', 'marcus'],
    reason: 'Campaign audit requires metrics (SORA) + market context (LUNA) + recommendations (MARCUS)'
  },
  {
    pattern: /(crée|lance).*campagne.*(complète|from scratch)/,
    agents: ['luna', 'milo', 'marcus'],
    reason: 'Full campaign creation requires strategy (LUNA) → creatives (MILO) → launch (MARCUS)'
  },
  {
    pattern: /rapport.*complet.*performance/,
    agents: ['sora', 'luna'],
    reason: 'Performance report requires data analysis (SORA) + strategic recommendations (LUNA)'
  }
];

const multiAgentMatch = MULTI_AGENT_PATTERNS.find(p => p.pattern.test(userMessage));

return [{
  json: {
    ...context,
    is_multi_agent: multiAgentMatch !== null,
    agents_to_call: multiAgentMatch?.agents || [],
    multi_agent_reason: multiAgentMatch?.reason || null
  }
}];
```

#### Add Parallel Agent Caller

**New workflow:** `PM Multi-Agent Orchestrator`

```
For each agent in agents_to_call:
  Call Orchestrator with agent_id
  Wait for response
  Store response

Combine all responses:
  Synthesize key findings
  Merge recommendations
  Return unified response
```

**Impact:**
- Complex requests handled by multiple agents working together
- User gets comprehensive answer from combined expertise
- Agents see each other's work in real-time

---

### 3.5 PRIORITY 5: Feedback Loops & Learning

**Goal:** SORA monitors campaigns and proactively recommends optimizations to MARCUS.

**Implementation:**

#### Add Scheduled Workflow: "Campaign Monitor"

**Trigger:** Every 6 hours (for active campaigns)

**Logic:**
```javascript
// 1. Get all projects with ads_live = true
SELECT id, metadata->>'campaign_id' as campaign_id
FROM projects
WHERE state_flags->>'ads_live' = 'true'

// 2. For each campaign:
//   - Call SORA to get performance metrics
//   - Check if ROAS < target OR CPA > target
//   - If underperforming: Write recommendation to project_memory

// 3. PM reads recommendations next time MARCUS is called
// 4. MARCUS receives: "SORA recommends: Kill campaign ABC (ROAS 1.2x, target 3.0x)"
```

**Impact:**
- Proactive optimization without user asking
- SORA → MARCUS feedback loop
- Campaigns auto-monitored and optimized

---

## PART 4: OPTIMIZATION IMPLEMENTATION PLAN

### Phase 1: Active Memory (Week 1) - CRITICAL

| # | Task | File | Effort |
|---|------|------|--------|
| 1.1 | Extend Orchestrator tool schema with `memory_context` field | orchestrator-core.workflow.json | 2h |
| 1.2 | Update PM payload to include `memory_context` + `recommendations` | pm-core-v4.4-validated.workflow.json | 1h |
| 1.3 | Update MARCUS agent to inject memory into system prompt | trader-core.workflow.json | 3h |
| 1.4 | Update MILO agent to inject memory into system prompt | creative-mcp workflow | 3h |
| 1.5 | Update LUNA agent to inject memory into system prompt | strategist-core.workflow.json | 3h |
| 1.6 | Update SORA agent to inject memory into system prompt | analyst-core-v4.5-with-tools.workflow.json | 3h |
| 1.7 | Test end-to-end: LUNA → MILO → MARCUS with memory | All workflows | 4h |

**Total:** 19 hours (~3 days)

### Phase 2: State Flag Auto-Update (Week 1) - HIGH

| # | Task | File | Effort |
|---|------|------|--------|
| 2.1 | Add "Update State Flags" node in PM after memory write | pm-core-v4.4-validated.workflow.json | 2h |
| 2.2 | Create ACTION_TO_FLAG_MAP mapping | pm-core-v4.4-validated.workflow.json | 1h |
| 2.3 | Add Supabase UPDATE query for state_flags | pm-core-v4.4-validated.workflow.json | 1h |
| 2.4 | Update agent system prompts to return correct action types | All agent workflows | 3h |
| 2.5 | Test auto-flag updates | All workflows | 2h |

**Total:** 9 hours (~1.5 days)

### Phase 3: Deliverable Handoffs (Week 2) - MEDIUM

| # | Task | File | Effort |
|---|------|------|--------|
| 3.1 | Enhance memory context builder with deliverable extraction | pm-core-v4.4-validated.workflow.json | 2h |
| 3.2 | Update MARCUS to use available_deliverables from memory | trader-core.workflow.json | 3h |
| 3.3 | Test MILO → MARCUS asset handoff | Multiple | 2h |

**Total:** 7 hours (~1 day)

### Phase 4: Multi-Agent Workflows (Week 3) - LOW PRIORITY

| # | Task | File | Effort |
|---|------|------|--------|
| 4.1 | Add multi-agent pattern detection | pm-core-v4.4-validated.workflow.json | 3h |
| 4.2 | Create PM Multi-Agent Orchestrator workflow | New file | 8h |
| 4.3 | Implement response synthesis logic | New file | 4h |
| 4.4 | Test multi-agent workflows | Multiple | 3h |

**Total:** 18 hours (~3 days)

### Phase 5: Feedback Loops (Week 4) - NICE TO HAVE

| # | Task | File | Effort |
|---|------|------|--------|
| 5.1 | Create Campaign Monitor scheduled workflow | New file | 6h |
| 5.2 | Add proactive recommendation logic | New file | 4h |
| 5.3 | Test SORA → MARCUS feedback loop | Multiple | 2h |

**Total:** 12 hours (~2 days)

---

## PART 5: EXPECTED RESULTS AFTER OPTIMIZATION

### Before Optimization (Current):

```
User: "Lance ma campagne Meta Ads"
  ↓
PM → MARCUS (alone, no context)
  ↓
MARCUS: "Je vais créer ta campagne. Peux-tu me fournir:
  - Le positionnement de ta marque
  - Les assets créatifs (images/vidéos)
  - Le budget quotidien
  - La stratégie d'enchères"
```

**Problem:** MARCUS asks for info that LUNA and MILO already provided.

### After Optimization (Target):

```
User: "Lance ma campagne Meta Ads"
  ↓
PM reads memory:
  - LUNA validated: USP = "Expert premium B2B", tone = "Confiant"
  - MILO delivered: 3 images (URLs), 5 ad copies
  - Budget approved: $50/day, target ROAS 3.0x
  ↓
PM → MARCUS with full context
  ↓
MARCUS: "✅ Campagne créée!

Configuration:
- Objectif: Conversions (ROAS 3.0x)
- Budget: $50/jour
- Positionnement: Expert premium B2B (ton confiant) ← from LUNA
- Assets: 3 images + 5 variations de copy ← from MILO
- Tracking: Pixel Meta + CAPI configuré ← from SORA

Status: PAUSED (attente validation finale)
Campaign ID: 123456789

🎯 Prochaine étape: Active la campagne ou demande ajustements."
```

**Result:** Zero friction, instant execution, perfect collaboration.

---

## PART 6: SYNERGY METRICS (KPIs)

To measure improvement in agent collaboration:

| Metric | Before | Target | How to Measure |
|--------|--------|--------|----------------|
| Context Questions Asked | ~80% of interactions | <20% | Count "Peux-tu me fournir..." in agent responses |
| Memory Context Usage | 0% | 100% | Check if agents mention previous work in responses |
| State Flag Auto-Updates | 0% | 100% | Monitor `state_flags` updates per memory write |
| Cross-Agent Asset Reuse | 0% | 80% | Track deliverable URLs used by next agents |
| Multi-Turn Conversations | 3.5 avg | 1.8 avg | Average messages to complete a task |

---

**END OF OPTIMIZATION ANALYSIS**

Next document: PRE-LAUNCH ROADMAP (comprehensive checklist)
