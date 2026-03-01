# GUIDE: Construction du Flow Orchestrator V4.3 dans n8n

## Vue d'Ensemble de l'Architecture

```
Frontend (React)
       │
       ▼
┌──────────────────┐
│   PM WEBHOOK     │  ← Point d'entrée unique
│  /pm-v4-entry    │
└────────┬─────────┘
         │
    ┌────▼────┐
    │  ROUTE  │  Switch: genesis | task_launch | quick_action | write_back
    │ DISPATCH│
    └────┬────┘
         │
    ┌────▼────────────────────────────────────────┐
    │                 PM BRAIN                     │
    │  ┌─────────────────────────────────────┐    │
    │  │ 1. Lire Mémoire Collective          │    │
    │  │ 2. Construire Contexte Enrichi      │    │
    │  │ 3. Appeler Orchestrator             │    │
    │  │ 4. Recevoir Résultat                │    │
    │  │ 5. Écrire dans Mémoire Collective   │    │
    │  └─────────────────────────────────────┘    │
    └────────────────────┬────────────────────────┘
                         │
                    ┌────▼────┐
                    │ORCHESTR.│  Tool Workflow
                    │ WEBHOOK │
                    └────┬────┘
                         │
         ┌───────┬───────┼───────┬───────┐
         ▼       ▼       ▼       ▼       ▼
     ┌──────┐┌──────┐┌──────┐┌──────┐
     │ LUNA ││ MILO ││MARCUS││ SORA │
     └──────┘└──────┘└──────┘└──────┘
```

---

## ÉTAPE 1: Créer le Webhook PM Entry Point

### 1.1 Node: Webhook Trigger

```
Name: PM Entry Point
HTTP Method: POST
Path: pm-v4-entry
Response Mode: Last Node
```

### 1.2 Input JSON Attendu

```json
{
  "action": "task_launch" | "quick_action" | "genesis" | "write_back",
  "chatInput": "Message utilisateur",
  "session_id": "project_xxx-agent-timestamp",

  "shared_memory": {
    "project_id": "proj_abc123",
    "project_name": "Campagne Été 2025",
    "project_status": "in_progress",
    "current_phase": "creative_production",
    "scope": "meta_ads",
    "state_flags": {...},
    "metadata": {...}
  },

  "task_context": {
    "task_id": "task_003",
    "task_title": "Copywriting Ads",
    "task_description": "Rédiger 3 variations",
    "task_phase": "Production",
    "context_questions": [...],
    "user_inputs": {...},
    "depends_on": []
  },

  "activeAgentId": "milo",
  "chat_mode": "task_execution" | "quick_research"
}
```

---

## ÉTAPE 2: Route Dispatcher

### 2.1 Node: Code - Extract Action

```javascript
// ============================================================================
// PM ROUTE DISPATCHER
// ============================================================================

const input = $input.first().json;
const body = input.body || input;

const payload = {
  action: body.action || 'quick_action',
  chatInput: body.chatInput || body.message || "",
  session_id: body.session_id || `pm-${Date.now()}`,
  shared_memory: body.shared_memory || null,
  task_context: body.task_context || null,
  activeAgentId: body.activeAgentId || 'orchestrator',
  chat_mode: body.chat_mode || 'quick_research',
  image: body.image || null,
  timestamp: new Date().toISOString()
};

return [{ json: payload }];
```

### 2.2 Node: Switch

```
Mode: Rules
Data Type: String
Value: {{ $json.action }}

Rules:
- genesis      → Output 0 (Genesis Handler)
- task_launch  → Output 1 (Task Launch with Memory)
- quick_action → Output 2 (Quick Action)
- write_back   → Output 3 (Write-Back Handler)
```

---

## ÉTAPE 3: Lecture de la Mémoire Collective (NOUVEAU V4.3)

### 3.1 Node: Supabase - Read Project Memory

Ajouter AVANT l'appel Orchestrator pour `task_launch` et `quick_action` :

```
Operation: Select
Table: project_memory
Filters:
  - project_id = {{ $json.shared_memory.project_id }}
Order: created_at DESC
Limit: 10
```

### 3.2 Node: Code - Build Memory Context

```javascript
// ============================================================================
// BUILD MEMORY CONTEXT - Construit le contexte enrichi pour l'agent
// ============================================================================

const input = $input.first().json;
const memoryRecords = $input.all().slice(1).map(item => item.json) || [];

// Construire le résumé des travaux précédents
const previousWork = memoryRecords.map(record => ({
  agent: record.agent_id,
  what_was_done: record.summary,
  key_recommendations: record.recommendations || [],
  timestamp: record.created_at
}));

// Construire le contexte enrichi
const memoryContext = {
  project_summary: input.shared_memory?.project_name || "Projet en cours",

  previous_work: previousWork,

  validated_elements: {
    usp: input.shared_memory?.metadata?.usp || null,
    persona: input.shared_memory?.metadata?.targetPersona || null,
    competitors: input.shared_memory?.metadata?.competitors || [],
    tone: input.shared_memory?.metadata?.editorial_tone || "professional"
  },

  current_state: {
    phase: input.shared_memory?.current_phase || "setup",
    flags: input.shared_memory?.state_flags || {}
  },

  // Extraire les recommandations pertinentes pour l'agent actuel
  recommendations_for_current_task: extractRelevantRecommendations(
    previousWork,
    input.activeAgentId
  )
};

function extractRelevantRecommendations(previousWork, currentAgent) {
  const recommendations = [];

  for (const work of previousWork) {
    if (work.key_recommendations && work.key_recommendations.length > 0) {
      // Ajouter les recommandations des autres agents
      if (work.agent !== currentAgent) {
        recommendations.push({
          from_agent: work.agent,
          recommendations: work.key_recommendations.slice(0, 3)
        });
      }
    }
  }

  return recommendations.slice(0, 5); // Max 5 sources
}

return [{
  json: {
    ...input,
    memory_context: memoryContext
  }
}];
```

---

## ÉTAPE 4: Injection Contexte Enrichi

### 4.1 Node: Code - Build Orchestrator Payload

```javascript
// ============================================================================
// BUILD ORCHESTRATOR PAYLOAD - Prépare l'appel à l'Orchestrator
// ============================================================================

const input = $input.first().json;

// Construire le system instruction enrichi avec la mémoire
const memoryInjection = input.memory_context ? `

## 📁 CONTEXTE PROJET (MÉMOIRE COLLECTIVE)

**Projet:** ${input.memory_context.project_summary}
**Phase actuelle:** ${input.memory_context.current_state?.phase || 'Setup'}

### Travaux précédents des agents:
${input.memory_context.previous_work?.map(work =>
  `- **${work.agent.toUpperCase()}:** ${work.what_was_done}`
).join('\n') || 'Aucun travail précédent.'}

### Recommandations à prendre en compte:
${input.memory_context.recommendations_for_current_task?.map(rec =>
  `**De ${rec.from_agent}:**\n${rec.recommendations.map(r => `  - ${r}`).join('\n')}`
).join('\n\n') || 'Aucune recommandation spécifique.'}

### Éléments validés:
- USP: ${input.memory_context.validated_elements?.usp || 'Non définie'}
- Persona: ${input.memory_context.validated_elements?.persona || 'Non défini'}
- Ton: ${input.memory_context.validated_elements?.tone || 'Professionnel'}

**IMPORTANT:** Utilise ces informations pour assurer la COHÉRENCE avec les travaux précédents.
` : '';

const orchestratorPayload = {
  chatInput: input.chatInput,
  session_id: input.session_id,
  activeAgentId: input.activeAgentId,

  // Injecter le contexte projet
  shared_memory: input.shared_memory,

  // Injecter le contexte tâche
  task_context: input.task_context,

  // Mode de chat
  chat_mode: input.chat_mode,

  // System instruction enrichi avec mémoire
  system_instruction: memoryInjection,

  // Image si présente
  image: input.image || null
};

return [{ json: orchestratorPayload }];
```

---

## ÉTAPE 5: Appeler l'Orchestrator

### 5.1 Node: HTTP Request - Call Orchestrator

```
Method: POST
URL: {{ $env.ORCHESTRATOR_WEBHOOK_URL }}
Body Type: JSON
Body: {{ $json }}
Timeout: 600000 (10 minutes)
```

OU utiliser **Execute Workflow** si l'orchestrator est dans le même n8n.

---

## ÉTAPE 6: Traiter la Réponse et Écrire dans la Mémoire

### 6.1 Node: Code - Process Response & Extract Memory Contribution

```javascript
// ============================================================================
// PROCESS ORCHESTRATOR RESPONSE - Extrait la contribution mémoire
// ============================================================================

const input = $input.first().json;
const orchestratorResponse = $input.last().json;

// Extraire la contribution mémoire si présente
const memoryContribution = orchestratorResponse.memory_contribution || null;

// Si l'agent a retourné une contribution mémoire
const writeBackData = memoryContribution ? {
  project_id: input.shared_memory?.project_id,
  agent_id: orchestratorResponse.meta?.agent_id || input.activeAgentId,
  task_id: input.task_context?.task_id || null,
  action: memoryContribution.action || 'TASK_COMPLETED',
  summary: memoryContribution.summary || orchestratorResponse.chat_message?.substring(0, 200),
  key_findings: JSON.stringify(memoryContribution.key_findings || []),
  deliverables: JSON.stringify(memoryContribution.deliverables || []),
  recommendations: JSON.stringify(memoryContribution.recommendations_for_next_agent || [])
} : null;

// Extraire les flags à mettre à jour
const flagsToUpdate = memoryContribution?.flags_to_update || null;

return [{
  json: {
    // Réponse originale pour le frontend
    chat_message: orchestratorResponse.chat_message,
    ui_components: orchestratorResponse.ui_components || [],
    meta: orchestratorResponse.meta,

    // Données pour write-back
    write_back_data: writeBackData,
    flags_to_update: flagsToUpdate,

    // Contexte original
    project_id: input.shared_memory?.project_id,
    task_id: input.task_context?.task_id
  }
}];
```

### 6.2 Node: IF - Has Memory Contribution

```
Condition: {{ $json.write_back_data !== null }}
True → Write to Supabase
False → Skip to Response
```

### 6.3 Node: Supabase - Insert Memory Contribution

```
Operation: Insert
Table: project_memory
Columns:
  - project_id: {{ $json.write_back_data.project_id }}
  - agent_id: {{ $json.write_back_data.agent_id }}
  - task_id: {{ $json.write_back_data.task_id }}
  - action: {{ $json.write_back_data.action }}
  - summary: {{ $json.write_back_data.summary }}
  - key_findings: {{ $json.write_back_data.key_findings }}
  - deliverables: {{ $json.write_back_data.deliverables }}
  - recommendations: {{ $json.write_back_data.recommendations }}
```

### 6.4 Node: IF - Has Flags to Update

```
Condition: {{ $json.flags_to_update !== null }}
True → Update Project Flags
False → Skip to Response
```

### 6.5 Node: Supabase - Update Project Flags

```
Operation: Update
Table: projects
Filters: id = {{ $json.project_id }}
Update Fields:
  - state_flags: Merge with existing flags
  - updated_at: NOW()
```

---

## ÉTAPE 7: Format Final Response

### 7.1 Node: Code - Format Response for Frontend

```javascript
// ============================================================================
// FORMAT FINAL RESPONSE
// ============================================================================

const input = $input.first().json;

const response = {
  success: true,

  // Message pour affichage
  chat_message: input.chat_message,

  // UI Components pour boutons téléchargement
  ui_components: input.ui_components || [],

  // Agent qui a répondu
  meta: {
    agent_id: input.meta?.agent_id || 'orchestrator',
    agent_name: input.meta?.agent_name,
    version: 'v4.3_collective_memory',
    timestamp: new Date().toISOString(),
    memory_updated: input.write_back_data !== null
  },

  // Write-back commands pour le frontend (optionnel)
  write_back: input.flags_to_update ? [{
    type: 'UPDATE_STATE_FLAGS',
    flags: input.flags_to_update
  }] : []
};

return [{ json: response }];
```

---

## ÉTAPE 8: Connecter les Nodes

### Flow Complet pour task_launch:

```
Webhook PM Entry
       │
       ▼
Route Dispatcher
       │
       ▼ (task_launch)
Supabase Read Memory
       │
       ▼
Build Memory Context
       │
       ▼
Build Orchestrator Payload
       │
       ▼
HTTP Request → Orchestrator
       │
       ▼
Process Response
       │
       ├──▶ IF Has Memory ──▶ Supabase Insert Memory
       │
       ├──▶ IF Has Flags ──▶ Supabase Update Flags
       │
       ▼
Format Final Response
       │
       ▼
Respond to Webhook
```

---

## Variables d'Environnement Requises

Dans n8n Settings > Variables:

```
ORCHESTRATOR_WEBHOOK_URL=https://votre-n8n.com/webhook/orchestrator-v4-entry
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_KEY=eyJ... (Service Role Key)
```

---

## Test du Flow

### Test 1: Task Launch avec Mémoire

```bash
curl -X POST https://votre-n8n.com/webhook/pm-v4-entry \
  -H "Content-Type: application/json" \
  -d '{
    "action": "task_launch",
    "chatInput": "Rédige 3 variations de copy pour Meta Ads",
    "activeAgentId": "milo",
    "chat_mode": "task_execution",
    "shared_memory": {
      "project_id": "test-123",
      "project_name": "Test Campaign",
      "project_status": "in_progress",
      "current_phase": "production",
      "scope": "meta_ads",
      "metadata": {
        "usp": "L IA qui automatise le marketing",
        "targetPersona": "Directeur Marketing PME"
      }
    },
    "task_context": {
      "task_id": "task-001",
      "task_title": "Copywriting Ads",
      "task_phase": "Production",
      "user_inputs": {
        "tone": "Expert mais accessible"
      }
    }
  }'
```

### Test 2: Vérifier la Mémoire

```sql
SELECT * FROM project_memory
WHERE project_id = 'test-123'
ORDER BY created_at DESC;
```

---

## Checklist de Validation

- [ ] Webhook PM Entry fonctionne
- [ ] Route Dispatcher route correctement
- [ ] Lecture Mémoire Collective fonctionne
- [ ] Injection Contexte enrichi fonctionne
- [ ] Appel Orchestrator réussit
- [ ] Écriture Mémoire Collective fonctionne
- [ ] Mise à jour Flags fonctionne
- [ ] Frontend reçoit la réponse correcte
- [ ] UI Components s'affichent avec boutons téléchargement

---

## Prochaines Étapes

1. **Créer la table `project_memory` dans Supabase**
2. **Mettre à jour les agents pour retourner `memory_contribution`**
3. **Tester le flow complet**
4. **Vérifier la cohérence entre agents**
