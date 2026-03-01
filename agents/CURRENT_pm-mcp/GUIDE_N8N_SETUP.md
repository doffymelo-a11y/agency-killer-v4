# GUIDE: Création du Flow PM (Project Manager) dans n8n

## Vue d'ensemble

Le PM est le **cerveau central** de THE HIVE. Il est le point d'entrée unique pour toutes les requêtes frontend.

```
Frontend → PM (Entry Point) → Orchestrator (Tool) → Specialists
                ↓
          Supabase (State)
```

---

## Prérequis

1. **n8n** installé et accessible
2. **Credentials configurés:**
   - OpenAI API (pour GPT-4)
   - Supabase (URL + Service Role Key)
3. **Workflow Orchestrator** déjà créé et actif

---

## ÉTAPE 1: Créer le Workflow

1. Dans n8n, cliquer sur **"+ Create Workflow"**
2. Nommer le workflow: `PM Central Brain - Agency Killer V4`
3. Ajouter le tag: `pm-mcp`, `agency-killer-v4`

---

## ÉTAPE 2: Ajouter le Webhook Entry Point

### Node: Webhook Trigger

1. Ajouter un node **Webhook**
2. Configuration:
   ```
   HTTP Method: POST
   Path: pm-v4-entry
   Response Mode: Last Node
   ```
3. Noter l'URL générée (ex: `https://votre-n8n.com/webhook/pm-v4-entry`)

---

## ÉTAPE 3: Ajouter le Router d'Actions

### Node: Code - Route Dispatcher

Ajouter un node **Code** avec ce contenu:

```javascript
// ============================================================================
// PM ROUTE DISPATCHER - Détecte l'action demandée
// ============================================================================

const input = $input.first().json;
const body = input.body || input;

// Détecter l'action
const action = body.action || 'quick_action';

// Extraire les données communes
const payload = {
  action: action,
  chatInput: body.chatInput || body.message || "",
  session_id: body.session_id || `pm-${Date.now()}`,

  // Shared Memory (Context Projet)
  shared_memory: body.shared_memory || null,

  // Task Context (si task_launch)
  task_context: body.task_context || null,

  // Genesis Data (si genesis)
  scope: body.scope || null,
  answers: body.answers || [],
  project_name: body.project_name || null,
  deadline: body.deadline || null,
  context_data: body.context_data || {},

  // Active Agent
  activeAgentId: body.activeAgentId || 'orchestrator',

  // Write-Back Commands (si write_back)
  write_back_commands: body.write_back_commands || [],
  project_id: body.project_id || body.shared_memory?.project_id || null,

  // Timestamp
  timestamp: new Date().toISOString()
};

return [{ json: payload }];
```

---

## ÉTAPE 4: Ajouter le Switch d'Actions

### Node: Switch

1. Ajouter un node **Switch**
2. Configuration:
   ```
   Mode: Rules
   Data Type: String
   Value 1: ={{ $json.action }}

   Rules:
   - genesis     → Output 0
   - task_launch → Output 1
   - quick_action → Output 2
   - write_back  → Output 3
   ```

---

## ÉTAPE 5: Genesis Handler (Output 0)

### Node: Code - Genesis Handler

```javascript
// ============================================================================
// GENESIS HANDLER - Création de projet + génération de tâches
// ============================================================================

const input = $input.first().json;

// Task Templates par scope
const TASK_TEMPLATES = {
  meta_ads: [
    {
      title: "Setup Technique & Budget CBO",
      description: "Configurer la structure de campagne Meta avec allocation budget optimisée",
      assignee: "marcus",
      phase: "Setup",
      estimated_hours: 2,
      context_questions: ["Budget quotidien prévu ?", "ROAS cible ?", "Audiences existantes ?"],
      depends_on: [],
      triggers_flag: null
    },
    {
      title: "Setup Tracking (Pixel/CAPI)",
      description: "Installer et configurer le Pixel Meta + Conversions API",
      assignee: "sora",
      phase: "Setup",
      estimated_hours: 3,
      context_questions: ["GTM déjà installé ?", "Événements à tracker ?", "CMS utilisé ?"],
      depends_on: [],
      triggers_flag: "tracking_ready"
    },
    {
      title: "Copywriting Ads (3 variations)",
      description: "Rédiger 3 variations de textes publicitaires (Hook/Corps/CTA)",
      assignee: "milo",
      phase: "Production",
      estimated_hours: 3,
      context_questions: ["Ton de la marque ?", "Offre principale ?", "CTA souhaité ?"],
      depends_on: ["Setup Tracking (Pixel/CAPI)"],
      triggers_flag: null
    },
    {
      title: "Génération Visuels Meta",
      description: "Créer les visuels publicitaires",
      assignee: "milo",
      phase: "Production",
      estimated_hours: 4,
      context_questions: ["Format préféré ?", "Éléments de marque ?", "Références visuelles ?"],
      depends_on: ["Setup Tracking (Pixel/CAPI)"],
      triggers_flag: "creatives_ready"
    }
  ],
  seo: [
    {
      title: "Audit Sémantique & Technique",
      description: "Analyser la structure SEO actuelle et identifier les opportunités",
      assignee: "luna",
      phase: "Audit",
      estimated_hours: 5,
      context_questions: ["URL du site ?", "Concurrents principaux ?", "Mots-clés prioritaires ?"],
      depends_on: [],
      triggers_flag: "strategy_validated"
    },
    // ... autres tâches SEO
  ],
  // ... autres scopes (sem, analytics, full_scale)
};

// Récupérer les templates pour le scope
const tasks = TASK_TEMPLATES[input.scope] || [];

// Calculer les due_dates avec Calendar Intelligence
function calculateDueDates(tasks, deadline) {
  const start = new Date();
  const end = new Date(deadline);
  end.setDate(end.getDate() - 2); // Buffer 2 jours

  const availableDays = Math.floor((end - start) / (1000 * 60 * 60 * 24));

  let currentDate = new Date(start);
  return tasks.map(task => {
    const dueDate = currentDate.toISOString().split('T')[0];
    const daysForTask = Math.ceil(task.estimated_hours / 6);
    currentDate.setDate(currentDate.getDate() + daysForTask);

    // Skip weekends
    while (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return { ...task, due_date: dueDate };
  });
}

const tasksWithDates = calculateDueDates(tasks, input.deadline);

// Préparer la réponse
const response = {
  success: true,
  action: 'genesis_complete',
  project: {
    name: input.project_name,
    scope: input.scope,
    status: 'planning',
    current_phase: 'setup',
    state_flags: {
      strategy_validated: false,
      budget_approved: false,
      creatives_ready: false,
      tracking_ready: false,
      ads_live: false
    },
    metadata: input.context_data
  },
  tasks: tasksWithDates,
  chat_message: {
    content: `**Projet "${input.project_name}" créé avec succès !**\n\nJ'ai généré ${tasksWithDates.length} tâches réparties intelligemment selon votre deadline du ${input.deadline}.`,
    tone: 'positive'
  },
  meta: {
    agent_id: 'pm',
    version: 'v4.3',
    tasks_generated: tasksWithDates.length,
    calendar_optimized: true
  }
};

return [{ json: response }];
```

### Après Genesis: Node Supabase - Insert Project

Ajouter un node **Supabase** après le Genesis Handler:

```
Operation: Insert
Table: projects
Columns:
  - name: {{ $json.project.name }}
  - scope: {{ $json.project.scope }}
  - status: {{ $json.project.status }}
  - current_phase: {{ $json.project.current_phase }}
  - state_flags: {{ JSON.stringify($json.project.state_flags) }}
  - metadata: {{ JSON.stringify($json.project.metadata) }}
```

### Puis: Node Supabase - Insert Tasks

```
Operation: Insert
Table: tasks
(en boucle sur $json.tasks)
```

---

## ÉTAPE 6: Task Launch Handler (Output 1)

### Node: Code - Task Launch Handler

```javascript
// ============================================================================
// TASK LAUNCH HANDLER - Prépare le contexte et appelle l'Orchestrator
// ============================================================================

const input = $input.first().json;

// Construire le contexte enrichi pour l'orchestrator
const enrichedContext = {
  chatInput: input.chatInput,
  session_id: `${input.shared_memory?.project_id}-${input.task_context?.task_id}-${Date.now()}`,

  // Injecter le contexte projet
  shared_memory: input.shared_memory,

  // Injecter le contexte tâche
  task_context: input.task_context,

  // Forcer l'agent assigné
  activeAgentId: input.task_context?.assignee || input.activeAgentId,

  // Mode task_execution
  chat_mode: 'task_execution',

  // System instruction enrichi
  system_instruction: `
CONTEXTE PROJET:
- Nom: ${input.shared_memory?.project_name || 'Non spécifié'}
- Scope: ${input.shared_memory?.scope || 'Non défini'}
- Phase: ${input.shared_memory?.current_phase || 'Setup'}

TÂCHE EN COURS:
- Titre: ${input.task_context?.task_title || 'Non spécifié'}
- Phase: ${input.task_context?.task_phase || 'Production'}
- Description: ${input.task_context?.task_description || ''}

RÉPONSES DU CLIENT:
${input.task_context?.user_inputs ? Object.entries(input.task_context.user_inputs).map(([k, v]) => `- ${k}: ${v}`).join('\n') : 'Aucune'}
  `
};

return [{ json: enrichedContext }];
```

### Après: Node Tool Workflow - Call Orchestrator

Ajouter un node **Execute Workflow Trigger** ou **HTTP Request** pour appeler l'orchestrator:

```
Method: POST
URL: {{ $env.ORCHESTRATOR_WEBHOOK_URL }}
Body: {{ JSON.stringify($json) }}
```

---

## ÉTAPE 7: Quick Action Handler (Output 2)

### Node: Code - Quick Action Handler

```javascript
// ============================================================================
// QUICK ACTION HANDLER - Forward à l'Orchestrator
// ============================================================================

const input = $input.first().json;

// Simplement forward avec le contexte projet
const forwardPayload = {
  chatInput: input.chatInput,
  session_id: input.shared_memory?.project_id
    ? `${input.shared_memory.project_id}-quick-${Date.now()}`
    : input.session_id,
  shared_memory: input.shared_memory,
  activeAgentId: input.activeAgentId,
  chat_mode: 'quick_research'
};

return [{ json: forwardPayload }];
```

### Puis: Appeler l'Orchestrator (même pattern qu'étape 6)

---

## ÉTAPE 8: Write-Back Handler (Output 3)

### Node: Code - Write-Back Handler

```javascript
// ============================================================================
// WRITE-BACK HANDLER - Mise à jour Supabase centralisée
// ============================================================================

const input = $input.first().json;
const commands = input.write_back_commands || [];

const updates = {
  tasks_updated: [],
  flags_updated: [],
  errors: []
};

// Préparer les updates pour Supabase
for (const cmd of commands) {
  switch (cmd.type) {
    case 'UPDATE_TASK_STATUS':
      updates.tasks_updated.push({
        task_id: cmd.task_id,
        status: cmd.status,
        ...(cmd.status === 'in_progress' ? { started_at: new Date().toISOString() } : {}),
        ...(cmd.status === 'done' ? { completed_at: new Date().toISOString() } : {})
      });
      break;

    case 'UPDATE_STATE_FLAG':
      updates.flags_updated.push({
        project_id: input.project_id,
        flag_name: cmd.flag_name,
        flag_value: cmd.flag_value
      });
      break;

    case 'SET_DELIVERABLE':
      updates.tasks_updated.push({
        task_id: cmd.task_id,
        deliverable_url: cmd.deliverable_url,
        deliverable_type: cmd.deliverable_type || 'text'
      });
      break;

    case 'COMPLETE_TASK':
      updates.tasks_updated.push({
        task_id: cmd.task_id,
        status: 'done',
        completed_at: new Date().toISOString(),
        deliverable_url: cmd.deliverable_url
      });
      break;
  }
}

return [{ json: updates }];
```

### Après: Nodes Supabase pour les updates

1. **Loop** sur tasks_updated → **Supabase Update** table tasks
2. **Loop** sur flags_updated → **Supabase Update** table projects (state_flags)

---

## ÉTAPE 9: Response Formatter

### Node: Code - Format Final Response

```javascript
// ============================================================================
// FORMAT FINAL RESPONSE - Unifie le format de sortie
// ============================================================================

const input = $input.first().json;

// Le format dépend de l'action originale
const response = {
  success: true,
  ...input,
  meta: {
    agent_id: 'pm',
    version: 'v4.3',
    timestamp: new Date().toISOString()
  }
};

return [{ json: response }];
```

### Node: Respond to Webhook

```
Response Code: 200
Response Body: {{ JSON.stringify($json) }}
Headers:
  - Content-Type: application/json
  - X-PM-Version: v4.3
```

---

## ÉTAPE 10: Connecter les Nodes

```
Webhook → Route Dispatcher → Switch
                              ├── genesis    → Genesis Handler → Supabase Insert → Response
                              ├── task_launch → Task Launch → Call Orchestrator → Response
                              ├── quick_action → Quick Action → Call Orchestrator → Response
                              └── write_back → Write-Back → Supabase Updates → Response
```

---

## ÉTAPE 11: Configuration des Variables d'Environnement

Dans n8n Settings > Variables:

```
ORCHESTRATOR_WEBHOOK_URL=https://votre-n8n.com/webhook/orchestrator-v4-entry
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_KEY=eyJ... (ATTENTION: Service Role Key, pas Anon Key)
```

---

## ÉTAPE 12: Tester le Workflow

### Test 1: Genesis

```bash
curl -X POST https://votre-n8n.com/webhook/pm-v4-entry \
  -H "Content-Type: application/json" \
  -d '{
    "action": "genesis",
    "scope": "meta_ads",
    "project_name": "Test Campaign",
    "deadline": "2025-03-15",
    "answers": [],
    "context_data": {
      "website_url": "https://example.com"
    }
  }'
```

### Test 2: Quick Action

```bash
curl -X POST https://votre-n8n.com/webhook/pm-v4-entry \
  -H "Content-Type: application/json" \
  -d '{
    "action": "quick_action",
    "chatInput": "Bonjour, quel est mon ROAS actuel ?",
    "shared_memory": {
      "project_id": "test-123",
      "project_name": "Test Campaign"
    }
  }'
```

---

## Checklist Finale

- [ ] Webhook `/pm-v4-entry` créé et actif
- [ ] Route Dispatcher extrait correctement `action`
- [ ] Switch route vers les 4 handlers
- [ ] Genesis Handler génère les tâches avec Calendar Intelligence
- [ ] Task Launch transmet le contexte à l'Orchestrator
- [ ] Quick Action forward correctement
- [ ] Write-Back met à jour Supabase
- [ ] Variables d'environnement configurées
- [ ] Tests passent

---

## Prochaines Étapes

1. **Activer le workflow** dans n8n
2. **Mettre à jour le frontend** (`USE_PM_GENESIS = true` dans GenesisView)
3. **Appliquer les patches** à l'Orchestrator existant
4. **Tester le flow complet** Genesis → Board → Task → Chat → Write-Back
