# Agency Killer V4 - Cloud Native Edition

## The Hive: Autonomous Marketing Agency

> *"Replacing a human agency with 5 AI agents working as one."*

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              THE HIVE V4                                    │
│                         Cloud Native Architecture                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│     ┌─────────────┐                                                         │
│     │   Next.js   │◄──── Split-Screen "Cockpit" UI                          │
│     │  Frontend   │      - Left: Chat bubbles                               │
│     │  (Vercel)   │      - Right: Dynamic components                        │
│     └──────┬──────┘                                                         │
│            │                                                                │
│            │ JSON (UI Response Protocol)                                    │
│            ▼                                                                │
│     ┌─────────────┐                                                         │
│     │    n8n      │◄──── Workflow Orchestration                             │
│     │  (Docker)   │      Running on VPS (Hostinger)                         │
│     │   on VPS    │                                                         │
│     └──────┬──────┘                                                         │
│            │                                                                │
│            │ MCP Protocol                                                   │
│            ▼                                                                │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │                     AGENT CONSTELLATION                          │       │
│  │                                                                  │       │
│  │   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │       │
│  │   │ORCHESTRA-│  │ ANALYST  │  │STRATEGIST│  │ CREATIVE │       │       │
│  │   │   TOR    │  │          │  │          │  │          │       │       │
│  │   │ (Router) │  │  (Data)  │  │  (Intel) │  │ (Content)│       │       │
│  │   └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │       │
│  │        │             │             │             │              │       │
│  │        └─────────────┴─────────────┴─────────────┘              │       │
│  │                          │                                       │       │
│  │                   ┌──────┴──────┐                               │       │
│  │                   │   TRADER    │                               │       │
│  │                   │   (Ads)     │                               │       │
│  │                   └─────────────┘                               │       │
│  └─────────────────────────────────────────────────────────────────┘       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Cloud Native Principles

### What Changed from V3

| Aspect | V3 (Local Dev) | V4 (Cloud Native) |
|--------|----------------|-------------------|
| Config Storage | JSON files on disk | Code Nodes in n8n |
| Brand Memory | `persona.json` file | Embedded in workflow |
| Portability | Tied to local paths | 100% portable |
| Deployment | Manual copy | Docker + Import |
| Secrets | `.env` files | n8n Credentials |

### The Golden Rule

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   FORBIDDEN: Reading from local filesystem                      │
│   ─────────────────────────────────────────────────             │
│   - NO `Read Binary File` nodes                                 │
│   - NO `../../shared/` path references                          │
│   - NO external JSON file dependencies                          │
│                                                                 │
│   REQUIRED: Self-contained workflows                            │
│   ─────────────────────────────────────────────────             │
│   - Brand Memory in Code Nodes                                  │
│   - Schemas embedded in Code Nodes                              │
│   - Credentials in n8n Credentials Manager                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
Agency-Killer-V4/
│
├── agents/                      # Agent Workflows
│   ├── orchestrator/            # Central Router
│   │   └── orchestrator.workflow.json
│   │
│   ├── analyst/                 # Data Expert
│   │   ├── analyst.workflow.json
│   │   └── analyst.prompt.md
│   │
│   ├── strategist/              # Intel Expert
│   │   ├── strategist.workflow.json
│   │   └── strategist.prompt.md
│   │
│   ├── creative/                # Content Expert
│   │   ├── creative.workflow.json
│   │   └── creative.prompt.md
│   │
│   └── trader/                  # Ads Expert
│       ├── trader.workflow.json
│       └── trader.prompt.md
│
├── shared/                      # Shared Resources
│   │
│   ├── schemas/                 # Data Contracts
│   │   └── ui-response.schema.js   # Cockpit Protocol
│   │
│   └── config/                  # Templates (to copy into n8n)
│       └── memory-template.js      # Brand Memory Template
│
└── README_V4.md                 # This file
```

---

## The Cockpit Protocol (UI Response Schema)

Every agent response MUST follow this structure:

```javascript
{
  // Agent's internal reasoning (for logs/debug)
  thought_process: {
    step: "Analyzing Q1 metrics",
    reasoning: "Comparing ROAS against target of 3.0x",
    tools_used: ["tool_ga4_metrics"],
    data_sources: ["GA4", "Brand Memory"],
    confidence: 0.85
  },

  // Text for chat bubble (left panel)
  chat_message: {
    content: "**ROAS Analysis**\n\nYour ROAS is 3.2x...",
    tone: "positive",
    follow_up_questions: ["See channel breakdown?"]
  },

  // Visual components (right panel)
  ui_components: [
    {
      type: "KPI_CARD",
      data: {
        title: "ROAS",
        value: 3.2,
        formatted_value: "3.2x",
        trend: { direction: "up", value: 12, is_positive: true }
      },
      layout: { width: "quarter" }
    }
  ],

  // Metadata
  meta: {
    agent_id: "analyst",
    timestamp: "2024-03-15T10:30:00Z",
    request_id: "req_abc123"
  }
}
```

### Available UI Components

| Component | Agent | Purpose |
|-----------|-------|---------|
| `KPI_CARD` | Analyst, Trader | Single metric with trend |
| `CHART_WIDGET` | Analyst | Line, Bar, Area, Pie charts |
| `DATA_TABLE` | Analyst | Tabular data |
| `AD_PREVIEW` | Creative | Ad mockup with persona context |
| `IMAGE_PREVIEW` | Creative | Generated image with download button |
| `CAMPAIGN_TABLE` / `CAMPAGNE_TABLE` | Creative, Trader | Campaign/image data with CSV export |
| `VIDEO_PLAYER` | Creative | Video preview with download |
| `BATTLE_CARD` | Creative, Strategist | A/B comparison |
| `WEB_SEARCH_RESULT` | Strategist | Sourced intelligence |
| `COMPETITOR_INTEL` | Strategist | Competitive analysis |
| `CAMPAIGN_CARD` | Trader | Campaign summary |
| `ACTION_BUTTONS` | All | User actions |

---

## Agent Intelligence Guidelines

### Analyst - The Skeptical Data Scientist

```
HEURISTICS:
1. NEVER give a number without context (WoW, MoM, YoY)
2. Suspect bugs first when variation > 20% in 24h
3. Cross-reference GA4 vs GSC (they lie differently)
4. Business metrics > Vanity metrics
5. Always compare against Brand Memory targets
```

### Strategist - The Intelligence Operative

```
GOLDEN RULES:
1. SERP Reality Check - Who ranks? If Amazon/Wikipedia, abandon.
2. Reverse Engineering - Find competitor WEAKNESSES, not just strengths.
3. Algorithmic Watch - Check for Google updates before any strategy.
4. Intent First - Intent > SERP > Feasibility > Volume
```

### Creative - The Brand Guardian

```
PROTOCOLS:
1. Brand Safety - Check every word against banned_words list.
2. Persona First - ALWAYS specify target_persona in AD_PREVIEW.
3. A/B by Default - Never propose a single variant. Use BATTLE_CARD.
4. Trigger Mapping - Match creative to buying_triggers from persona.
```

### Trader - The Budget Optimizer

```
PRINCIPLES:
1. ROAS Obsession - Every decision justified by ROAS impact.
2. Guardrails - Auto-pause if ROAS < threshold from Brand Memory.
3. Attribution Skeptic - Question last-click attribution.
4. Budget Discipline - Never exceed daily/monthly limits.
```

---

## Deployment Guide

### Prerequisites

- VPS with Docker installed (Hostinger, DigitalOcean, etc.)
- n8n running in Docker
- Next.js frontend deployed (Vercel recommended)

### Step 1: Deploy n8n on VPS

```bash
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -e N8N_BASIC_AUTH_ACTIVE=true \
  -e N8N_BASIC_AUTH_USER=admin \
  -e N8N_BASIC_AUTH_PASSWORD=your_password \
  -v n8n_data:/home/node/.n8n \
  n8nio/n8n
```

### Step 2: Import Workflows

1. Open n8n at `https://your-vps:5678`
2. Go to Workflows > Import
3. Import each `*.workflow.json` from `/agents/`

### Step 3: Configure Brand Memory

For each agent workflow:
1. Find the "Load Brand Memory" Code Node
2. Paste the contents from `/shared/config/memory-template.js`
3. Customize values for your client

### Step 4: Set up Credentials

In n8n Credentials:
- Add Google OAuth for GA4/GSC
- Add Meta Marketing API credentials
- Add OpenAI/Anthropic API keys
- Add any MCP server credentials

### Step 5: Connect Frontend

Set the n8n webhook URLs in your Next.js environment:

```env
NEXT_PUBLIC_ORCHESTRATOR_URL=https://your-vps:5678/webhook/orchestrator
```

---

## Development Workflow

### Adding a New Client

1. **Copy memory-template.js**
   - Create `clients/client-name/memory.js`
   - Customize all fields

2. **Create Workflow Variants**
   - Duplicate base workflows
   - Inject client-specific Brand Memory

3. **Test in n8n**
   - Use Manual Execution
   - Verify UI Response format

4. **Deploy**
   - Export workflow
   - Import to production n8n

### Modifying Agents

1. **Update System Prompt**
   - Edit `agents/[agent]/[agent].prompt.md`
   - Copy into the AI Node in n8n

2. **Update Tools**
   - Modify Code Nodes in workflow
   - Ensure output matches UI Response Schema

3. **Test**
   - Manual execution with sample inputs
   - Verify all UI components render correctly

---

## File Reference

### `/shared/schemas/ui-response.schema.js`

The complete UI Response Protocol including:
- `UI_COMPONENTS` enum
- `COMPONENT_SCHEMAS` for each component type
- `UI_RESPONSE_SCHEMA` main structure
- Factory functions for creating components

**Usage:** Copy relevant parts into n8n Code Nodes.

### `/shared/config/memory-template.js`

Brand Memory template including:
- Brand Identity
- Audience/Personas
- Voice & Brand Safety
- Competitors
- Objectives & Targets
- Budget Constraints
- Learnings

**Usage:** Copy `getBrandMemory()` into "Load Brand Memory" Code Node.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| V4.6.5 | 2025-01-23 | **Creative V6 Major Update** - imgbb migration, Ghost Buster V6.5, Format UI Response V4.5. See CHANGELOG-V6.md |
| V4.6.0 | 2025-01 | Creative V6 workflow avec Nano Banana Pro (Gemini) et Veo-3 video generator |
| V4.0.0 | 2024-03 | Cloud Native rewrite. Filesystem-free architecture. |
| V3.x | 2024-02 | Local dev version with JSON files. |
| V2.x | 2024-01 | Initial MCP implementation. |
| V1.x | 2023-12 | Proof of concept. |

---

## Next Steps

1. [ ] Create Orchestrator workflow
2. [ ] Create Analyst workflow with GA4/GSC mock tools
3. [ ] Create Strategist workflow with Web Search mock tools
4. [ ] Create Creative workflow with DALL-E integration
5. [ ] Create Trader workflow with Meta/Google API integration
6. [ ] Build Next.js Cockpit frontend
7. [ ] End-to-end testing
8. [ ] Production deployment

---

*Agency Killer V4 - Cloud Native Edition*
*Built for scale. Built for portability. Built for autonomy.*
