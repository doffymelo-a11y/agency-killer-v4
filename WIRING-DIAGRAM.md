# AGENCY KILLER V4 - WIRING DIAGRAM
## Architecture Complete - Cloud Native

---

## VUE D'ENSEMBLE

```
                    ┌─────────────────────────────────────────┐
                    │           ORCHESTRATOR V4.1             │
                    │         (Chef d'Orchestre)              │
                    │                                         │
                    │  ┌─────────────────────────────────┐   │
                    │  │        AI Agent Router          │   │
                    │  │         (GPT-4o)                │   │
                    │  └──────────┬──────────────────────┘   │
                    │             │                          │
                    │    ┌────────┼────────┬────────┐       │
                    │    │        │        │        │       │
                    └────┼────────┼────────┼────────┼───────┘
                         │        │        │        │
              ┌──────────┴───┐    │        │   ┌────┴──────────┐
              │              │    │        │   │               │
              ▼              ▼    ▼        ▼   ▼               ▼
    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
    │  ANALYST    │  │ STRATEGIST  │  │  CREATIVE   │  │   TRADER    │
    │    MCP      │  │    MCP      │  │    MCP      │  │    MCP      │
    ├─────────────┤  ├─────────────┤  ├─────────────┤  ├─────────────┤
    │ KPI_CARD    │  │ WEB_SEARCH  │  │ AD_PREVIEW  │  │ CAMPAIGN_   │
    │ CHART_      │  │ COMPETITOR_ │  │ BATTLE_CARD │  │ TABLE       │
    │ WIDGET      │  │ INTEL       │  │             │  │             │
    └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
```

---

## NOMS DES WORKFLOWS (Pour Import n8n)

| Agent | Nom du Workflow (exact) |
|-------|------------------------|
| Orchestrator | `Orchestrator V4 - Agency Killer Core` |
| Analyst | `Analyst MCP - Agency Killer V4` |
| Strategist | `Strategist MCP - Agency Killer V4` |
| Creative | `Creative MCP - Agency Killer V4` |
| Trader | `Trader MCP - Agency Killer V4` |

**IMPORTANT:** Les noms doivent correspondre EXACTEMENT car le routing utilise le mode "by name" (pas d'ID en dur).

---

## OUTILS DE L'ORCHESTRATOR

| Tool Name | Target Workflow | Trigger Keywords |
|-----------|-----------------|------------------|
| `call_analyst` | Analyst MCP | chiffres, trafic, ventes, bilan, ROAS, CPA, metriques |
| `call_strategist` | Strategist MCP | concurrence, SEO, tendances, Google Updates |
| `call_creative` | Creative MCP | visuels, publicites, bannieres, Nano Banana Pro |
| `call_trader` | Trader MCP | budget, couper, scaler, ROAS campagne |

---

## FLOW D'EXECUTION

```
1. Webhook Trigger
       │
       ▼
2. Load Global Context (Code Node - Hardcoded)
   - Brand Memory
   - Specialists Registry
   - UI Components
       │
       ▼
3. Inject System Prompt (Code Node - Hardcoded)
   - Delegation Protocol
   - Routing Rules
       │
       ▼
4. AI Agent Router (GPT-4o + 4 Tools)
   - Analyse l'intent utilisateur
   - Appelle le tool approprie
       │
       ├─── call_analyst ────► Analyst MCP ────┐
       ├─── call_strategist ► Strategist MCP ──┤
       ├─── call_creative ──► Creative MCP ────┤
       └─── call_trader ────► Trader MCP ──────┤
                                               │
       ◄───────────────────────────────────────┘
       │
       ▼
5. Format UI Response (Code Node)
   - Merge les reponses des agents
   - Formate pour le UI Schema
       │
       ▼
6. Respond to Webhook
   - JSON Response
   - Header: X-Agency-Killer-Version: v4.1-wired
```

---

## CONNEXIONS AI (ai_tool)

```json
"Tool: Call Analyst": {
  "ai_tool": [[{ "node": "AI Agent Router", "type": "ai_tool", "index": 0 }]]
},
"Tool: Call Strategist": {
  "ai_tool": [[{ "node": "AI Agent Router", "type": "ai_tool", "index": 0 }]]
},
"Tool: Call Creative": {
  "ai_tool": [[{ "node": "AI Agent Router", "type": "ai_tool", "index": 0 }]]
},
"Tool: Call Trader": {
  "ai_tool": [[{ "node": "AI Agent Router", "type": "ai_tool", "index": 0 }]]
}
```

---

## CHECKLIST DE DEPLOIEMENT

### Pre-requis
- [ ] n8n v1.20+ installe sur VPS
- [ ] OpenAI API Key configure
- [ ] Credentials Nano Banana Pro (pour Creative)

### Import des Workflows
1. [ ] Importer `Analyst MCP - Agency Killer V4`
2. [ ] Importer `Strategist MCP - Agency Killer V4`
3. [ ] Importer `Creative MCP - Agency Killer V4`
4. [ ] Importer `Trader MCP - Agency Killer V4`
5. [ ] Importer `Orchestrator V4 - Agency Killer Core` (EN DERNIER)

### Verification
- [ ] Activer tous les workflows
- [ ] Tester le webhook Orchestrator avec `{ "message": "Salut" }`
- [ ] Verifier que le menu s'affiche
- [ ] Tester `{ "message": "Quel est mon ROAS ?" }` → call_analyst
- [ ] Tester `{ "message": "Analyse mes concurrents" }` → call_strategist
- [ ] Tester `{ "message": "Cree une banniere" }` → call_creative
- [ ] Tester `{ "message": "Optimise mes campagnes" }` → call_trader

---

## RESPONSES KEYS

| Agent | Response Property | UI Component |
|-------|------------------|--------------|
| Analyst | `analyst_response` | KPI_CARD, CHART_WIDGET |
| Strategist | `strategist_response` | WEB_SEARCH_RESULT, COMPETITOR_INTEL |
| Creative | `creative_response` | AD_PREVIEW, BATTLE_CARD |
| Trader | `trader_response` | CAMPAIGN_TABLE |

---

## VERSION

**v4.1.0-wired** - Cablage final des 4 agents
- 4 Tool Workflow nodes connectes a l'AI Agent
- Mode "by name" pour portabilite VPS
- System Prompt avec Delegation Protocol
- Format UI Response unifie

---

## FICHIERS DU PROJET

```
/agents/
├── orchestrator-mcp/
│   ├── orchestrator-core.workflow.json  ← PRINCIPAL
│   ├── orchestrator-system.prompt.md
│   └── orchestrator-config.js
│
├── analyst-mcp/
│   └── analyst-core.workflow.json
│
├── strategist-mcp/
│   └── strategist-core.workflow.json
│
├── creative-mcp/
│   └── creative-core.workflow.json
│
└── trader-mcp/
    ├── trader-core.workflow.json
    ├── trader-system.prompt.md
    └── VALIDATION.md

/shared/
└── schemas/
    └── ui-response.schema.js

WIRING-DIAGRAM.md  ← CE FICHIER
```
