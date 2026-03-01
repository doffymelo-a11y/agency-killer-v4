# 🛡️ Guide d'Intégration du Système d'Approbation dans n8n

**Date :** 2026-02-27
**Migration 010 :** ✅ Appliquée
**Objectif :** Configurer les 4 agents IA pour demander approbation avant actions risquées

---

## 📋 Vue d'Ensemble

Chaque agent (SORA, MARCUS, LUNA, MILO) doit pouvoir :
1. **Détecter** quand une action nécessite approbation
2. **Créer** une demande d'approbation dans Supabase
3. **Envoyer** un UI_COMPONENT au frontend pour afficher la carte
4. **Attendre** la réponse (approved/rejected)
5. **Exécuter** l'action si approuvée, ou annuler si rejetée

---

## 🎯 Workflows à Modifier

| Workflow | Fichier | Actions Risquées |
|----------|---------|------------------|
| **SORA** | `FINALE_SORA_MCP.workflow.json` | Modifier GTM tags, changer pixels tracking |
| **MARCUS** | `FINALE_MARCUS_MCP.workflow.json.BACKUP` | Lancer campagnes pub >$50/jour |
| **LUNA** | `FINALE_LUNA_MCP.workflow.json` | Publier contenu sans review |
| **MILO** | `FINALE_MILO_MCP.workflow.json` | Générer vidéos >$500 |

---

## 📝 Modifications à Appliquer

### ✅ ÉTAPE 1 : Ajouter le Tool `request_approval` aux Agents

Pour **chaque agent** (SORA, MARCUS, LUNA, MILO), dans le node **"Prepare [Agent] Context"** :

#### 🔍 Localiser le Node

- **Nom du node :** `Prepare SORA Context` / `Prepare MARCUS Context` / etc.
- **Type :** Code (JavaScript)
- **Position :** Avant le node "AI Agent"

#### 📝 Code à Ajouter

Dans la section où tu définis les `TOOLS`, **ajoute ce tool** :

```javascript
const TOOLS = [
  // ... existing tools (gtm_manager, google_ads_manager, etc.) ...

  // ═══════════════════════════════════════════════════════════
  // 🛡️ APPROVAL SYSTEM - Request Human Approval
  // ═══════════════════════════════════════════════════════════
  {
    name: 'request_approval',
    description: 'Request human approval before executing risky actions (campaigns >$50/day, pixel modifications, content publishing, expensive creatives). Returns approval_id to track the request status.',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          description: 'Action identifier (e.g., launch_facebook_campaign, modify_gtm_tags, publish_blog_posts, generate_veo3_videos)',
          examples: ['launch_facebook_campaign', 'modify_gtm_tags', 'publish_blog_posts']
        },
        title: {
          type: 'string',
          description: 'Short title for the approval request (max 100 chars)',
          examples: ['Lancer campagne Facebook Ads - Investis10']
        },
        description: {
          type: 'string',
          description: 'Detailed description of what will happen. Include budget, targets, impact.'
        },
        risk_level: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'critical'],
          description: 'Risk assessment: low (<$20/day), medium ($20-50/day), high ($50-200/day), critical (>$200/day or irreversible changes)'
        },
        estimated_cost_7_days: {
          type: 'number',
          description: 'Estimated financial impact over 7 days in USD (e.g., daily_budget * 7)'
        },
        expires_in_hours: {
          type: 'number',
          description: 'How many hours until approval expires (default: 24)',
          default: 24
        },
        metadata: {
          type: 'object',
          description: 'Additional context (campaign details, tag IDs, etc.)',
          properties: {}
        }
      },
      required: ['action', 'title', 'risk_level']
    }
  }
];
```

---

### ✅ ÉTAPE 2 : Implémenter le Handler du Tool

Dans le node **"Handle [Agent] Tools"** (ou le node qui exécute les tools), **ajoute ce handler** :

#### 🔍 Localiser le Node

- **Nom du node :** `Handle SORA Tools` / `Handle MARCUS Tools` / etc.
- **Type :** Code (JavaScript)
- **Position :** Reçoit les tool calls de l'AI Agent

#### 📝 Code à Ajouter

Dans le `switch (functionName)` ou `if/else` qui gère les tools, **ajoute ce case** :

```javascript
// ═══════════════════════════════════════════════════════════
// 🛡️ Tool: request_approval
// ═══════════════════════════════════════════════════════════

if (functionName === 'request_approval') {
  const {
    action,
    title,
    description,
    risk_level,
    estimated_cost_7_days,
    expires_in_hours = 24,
    metadata = {}
  } = functionArgs;

  // Calculate expiration timestamp
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expires_in_hours);

  // Create approval request in Supabase
  const approvalPayload = {
    user_id: $json.shared_memory.user_id,
    project_id: $json.shared_memory.project_id || null,
    agent_id: 'sora', // ⚠️ CHANGE THIS: 'marcus', 'luna', 'milo'
    action: action,
    title: title,
    description: description || '',
    risk_level: risk_level,
    estimated_cost_7_days: estimated_cost_7_days || null,
    currency: 'USD',
    expires_at: expiresAt.toISOString(),
    metadata: metadata
  };

  // Insert into approval_requests table
  const { data: approvalData, error: approvalError } = await $supabase
    .from('approval_requests')
    .insert(approvalPayload)
    .select()
    .single();

  if (approvalError) {
    return {
      error: `Failed to create approval request: ${approvalError.message}`
    };
  }

  // Send UI Component to frontend to display approval card
  const uiComponent = {
    type: 'approval_request',
    data: {
      approval_id: approvalData.id,
      agent_id: approvalData.agent_id,
      action: approvalData.action,
      title: approvalData.title,
      description: approvalData.description,
      risk_level: approvalData.risk_level,
      estimated_cost_7_days: approvalData.estimated_cost_7_days,
      currency: approvalData.currency,
      expires_in_hours: expires_in_hours
    }
  };

  // Store UI component (will be sent to frontend via MEMORY_WRITE)
  const pendingApproval = {
    approval_id: approvalData.id,
    status: 'pending',
    expires_at: approvalData.expires_at,
    ui_component: uiComponent
  };

  // Return to AI Agent
  return {
    success: true,
    approval_id: approvalData.id,
    status: 'pending',
    expires_at: approvalData.expires_at,
    message: `Approval request created. The user will see a notification. Wait for approval before proceeding with "${action}".`,
    ui_component: uiComponent
  };
}
```

**⚠️ IMPORTANT :** Change `agent_id: 'sora'` par l'agent correspondant :
- SORA → `'sora'`
- MARCUS → `'marcus'`
- LUNA → `'luna'`
- MILO → `'milo'`

---

### ✅ ÉTAPE 3 : Envoyer le UI Component au Frontend

Après avoir créé l'approbation, l'agent doit **envoyer le UI Component** au frontend.

Dans le node **"Format AI Response"** ou **"Send to Frontend"**, ajoute cette logique :

```javascript
// Check if the AI response contains an approval request
const toolCalls = $json.tool_calls || [];
const approvalRequests = toolCalls.filter(tc => tc.function.name === 'request_approval');

if (approvalRequests.length > 0) {
  // Extract UI components from approval results
  const uiComponents = approvalRequests.map(ar => ar.result?.ui_component).filter(Boolean);

  // Add to chat messages
  return {
    json: {
      role: 'assistant',
      content: $json.content || 'J\'ai besoin de votre approbation pour continuer.',
      ui_components: uiComponents
    }
  };
}
```

---

### ✅ ÉTAPE 4 : Logique d'Attente d'Approbation (Optionnel Phase 1)

**Pour Phase 1 (SIMPLE) :** L'agent créée la demande et **s'arrête**. L'utilisateur voit la carte, approuve/rejette, et doit **relancer** manuellement l'action.

**Pour Phase 2 (AVANCÉ) :** L'agent attend activement la réponse via Realtime ou Polling.

#### Option A : Polling Simple (30 secondes)

Après avoir appelé `request_approval`, l'agent attend 30s puis vérifie :

```javascript
// Wait 30 seconds for user response
await new Promise(resolve => setTimeout(resolve, 30000));

// Check approval status
const { data: approvalStatus, error } = await $supabase
  .from('approval_requests')
  .select('status, rejection_reason')
  .eq('id', approval_id)
  .single();

if (approvalStatus.status === 'approved') {
  // ✅ User approved - execute the risky action
  return await executeRiskyAction();
} else if (approvalStatus.status === 'rejected') {
  // ❌ User rejected
  return {
    error: `Action cancelled by user: ${approvalStatus.rejection_reason || 'No reason provided'}`
  };
} else {
  // ⏳ Still pending or expired
  return {
    error: 'Approval timeout - user did not respond in time'
  };
}
```

#### Option B : Webhook (Production)

1. Créer un webhook n8n : `/webhook/approval-response`
2. Trigger Supabase quand `approval_requests.status` change
3. Resume le workflow quand webhook reçu

---

## 🎯 Exemples Concrets par Agent

### 🔵 SORA - Modifier GTM Tags

**Dans le System Prompt de SORA**, ajoute :

```javascript
const SORA_SYSTEM_PROMPT = `
Tu es SORA, l'Analyst de THE HIVE OS V4.

## RÈGLES D'APPROBATION

**OBLIGATOIRE** - Tu DOIS demander approbation avant :
- Supprimer >3 tags GTM
- Modifier des pixels de tracking (GA4, Meta Pixel, etc.)
- Changer des triggers GTM en production
- Désactiver des conversions importantes

**Utilise le tool request_approval** avec :
- risk_level: 'high' si >5 tags, 'critical' si pixels conversion
- description: Liste exacte des tags/pixels modifiés
- metadata: { container_id, tag_ids, action_type }

## Exemple :

Si l'utilisateur demande "Supprimer les tags GTM inactifs" :

1. Analyse les tags inactifs
2. Si >3 tags :
   \`\`\`json
   {
     "action": "delete_gtm_tags",
     "title": "Supprimer 8 tags GTM inactifs",
     "description": "Tags concernés:\\n- Tag 1: Facebook Pixel (inactif 90j)\\n- Tag 2: Old GA (deprecated)\\n...",
     "risk_level": "high",
     "metadata": {
       "container_id": "GTM-ABC123",
       "tag_count": 8,
       "tag_ids": [12, 15, 18, ...]
     }
   }
   \`\`\`
3. Envoie le UI_COMPONENT
4. Attend approbation avant de supprimer
`;
```

---

### 🔴 MARCUS - Lancer Campagne Ads

**Dans le System Prompt de MARCUS**, ajoute :

```javascript
const MARCUS_SYSTEM_PROMPT = `
Tu es MARCUS, le Trader de THE HIVE OS V4.

## RÈGLES D'APPROBATION

**OBLIGATOIRE** - Tu DOIS demander approbation avant :
- Lancer une campagne avec budget >$50/jour
- Modifier des enchères de >20%
- Activer des campagnes sur de nouveaux marchés
- Augmenter un budget de >50%

**Calcul du risk_level :**
- low: <$20/jour
- medium: $20-50/jour
- high: $50-200/jour
- critical: >$200/jour OU modifications irréversibles

## Exemple :

Si l'utilisateur demande "Lance une campagne Facebook Ads $150/jour" :

\`\`\`json
{
  "action": "launch_facebook_campaign",
  "title": "Lancer campagne Facebook Ads - Investis10",
  "description": "Budget: $150/jour\\nCible: Hommes 25-45 ans, intérêt investissement\\nObjectif: Conversions (Lead)\\nPlacements: Feed + Stories\\nDurée: 7 jours minimum",
  "risk_level": "high",
  "estimated_cost_7_days": 1050,
  "metadata": {
    "campaign_name": "Investis10 - Acquisition Q1",
    "daily_budget": 150,
    "platform": "facebook",
    "objective": "conversions"
  }
}
\`\`\`
`;
```

---

### 🟣 LUNA - Publier Contenu

**Dans le System Prompt de LUNA**, ajoute :

```javascript
const LUNA_SYSTEM_PROMPT = `
Tu es LUNA, la Strategist de THE HIVE OS V4.

## RÈGLES D'APPROBATION

**OBLIGATOIRE** - Tu DOIS demander approbation avant :
- Publier >5 articles de blog
- Publier du contenu sensible (finance, santé, juridique)
- Modifier des pages piliers SEO
- Lancer une campagne email à >1000 contacts

## Exemple :

\`\`\`json
{
  "action": "publish_blog_posts",
  "title": "Publier 10 articles de blog optimisés SEO",
  "description": "Contenu généré par IA :\\n- 'Top 10 Investissements 2026' (2500 mots)\\n- 'Comment Diversifier son Portefeuille' (2200 mots)\\n...\\n\\nTous les articles ont été optimisés pour les mots-clés cibles.",
  "risk_level": "medium",
  "metadata": {
    "post_count": 10,
    "total_words": 24000,
    "keywords": ["investissement", "portefeuille", "finance"]
  }
}
\`\`\`
`;
```

---

### 🟡 MILO - Générer Vidéos

**Dans le System Prompt de MILO**, ajoute :

```javascript
const MILO_SYSTEM_PROMPT = `
Tu es MILO, le Creative de THE HIVE OS V4.

## RÈGLES D'APPROBATION

**OBLIGATOIRE** - Tu DOIS demander approbation avant :
- Générer des vidéos avec VEO-3 (coût >$200/vidéo)
- Créer >3 assets visuels coûteux
- Lancer une génération massive (>10 créatifs)

**Calcul du cost :**
- VEO-3 : $200/vidéo
- Stable Diffusion : $0.10/image
- ElevenLabs : $0.30/minute audio

## Exemple :

\`\`\`json
{
  "action": "generate_veo3_videos",
  "title": "Générer 5 vidéos publicitaires VEO-3",
  "description": "Vidéos de 15-30 secondes :\\n1. 'Investis10 - Présentation' (30s)\\n2. 'Témoignage Client' (20s)\\n3. 'Features Overview' (25s)\\n4. 'Call-to-Action' (15s)\\n5. 'Brand Story' (30s)\\n\\nCoût estimé: $1000 ($200/vidéo)",
  "risk_level": "high",
  "estimated_cost_7_days": 1000,
  "metadata": {
    "video_count": 5,
    "cost_per_video": 200,
    "total_duration_seconds": 120,
    "style": "professional"
  }
}
\`\`\`
`;
```

---

## 🧪 Test du Système

### Test 1 : Déclencher une Approbation depuis n8n

1. **Importe un workflow** (ex: SORA)
2. **Configure les credentials** Supabase
3. **Envoie une requête test** :

```json
{
  "action": "task_launch",
  "task_title": "Supprimer tags GTM inactifs",
  "task_description": "Analyser et supprimer tous les tags GTM qui n'ont pas été utilisés depuis 90 jours",
  "assignee": "sora",
  "shared_memory": {
    "user_id": "YOUR_USER_ID",
    "project_id": "YOUR_PROJECT_ID",
    "project_name": "Test Approval"
  }
}
```

4. **SORA devrait** :
   - Détecter que >3 tags doivent être supprimés
   - Appeler `request_approval`
   - Créer l'entrée dans `approval_requests`
   - Envoyer un `UI_COMPONENT`

5. **Vérifie dans Supabase** :

```sql
SELECT * FROM approval_requests ORDER BY created_at DESC LIMIT 1;
```

6. **Vérifie dans le Frontend** (http://localhost:5173) :
   - Une carte orange devrait apparaître dans le chat
   - Badge "HIGH"
   - Titre "Supprimer X tags GTM inactifs"
   - Boutons Approuver / Rejeter

### Test 2 : Approuver/Rejeter

1. **Clique "Approuver"** dans l'UI
2. **Vérifie dans Supabase** :

```sql
SELECT status, approved_at FROM approval_requests WHERE id = 'YOUR_APPROVAL_ID';
-- status = 'approved'
```

3. **L'agent devrait** (si polling implémenté) :
   - Détecter l'approbation
   - Exécuter l'action risquée
   - Envoyer confirmation

---

## 📊 Checklist d'Intégration

### Pour CHAQUE Agent (SORA, MARCUS, LUNA, MILO)

- [ ] Node "Prepare [Agent] Context"
  - [ ] Tool `request_approval` ajouté à `TOOLS`
  - [ ] System Prompt mis à jour avec règles d'approbation

- [ ] Node "Handle [Agent] Tools"
  - [ ] Handler `request_approval` implémenté
  - [ ] `agent_id` correct ('sora', 'marcus', 'luna', 'milo')
  - [ ] Insertion dans `approval_requests` fonctionnelle
  - [ ] UI Component créé et retourné

- [ ] Node "Format AI Response"
  - [ ] Extraction des `ui_components`
  - [ ] Envoi au frontend

- [ ] System Prompt
  - [ ] Règles d'approbation documentées
  - [ ] Exemples d'usage du tool
  - [ ] Risk levels expliqués

### Tests

- [ ] Test création approbation depuis n8n
- [ ] Vérification table `approval_requests` (SQL)
- [ ] Carte apparaît dans frontend
- [ ] Bouton "Approuver" fonctionne
- [ ] Bouton "Rejeter" fonctionne
- [ ] Status updated dans DB

---

## 🚀 Prochaines Étapes

### Phase 1 (ACTUEL) ✅
- [x] Migration 010 appliquée
- [x] Service frontend créé
- [x] UI Component prêt
- [ ] **Intégration n8n (4 agents)** ← TU ES ICI

### Phase 2 (Polling/Webhook)
- [ ] Implémenter polling 30s dans agents
- [ ] Ou créer webhook `/approval-response`
- [ ] Auto-resume workflow après approval

### Phase 3 (Notifications)
- [ ] Email notification (Resend)
- [ ] SMS pour CRITICAL (Twilio)
- [ ] Slack/Discord webhooks

---

## 📝 Résumé pour Toi

**Ce qu'il faut faire MAINTENANT :**

1. **Ouvre n8n** (https://ton-instance-n8n.com)

2. **Pour CHAQUE agent** (commence par SORA) :

   a. **Node "Prepare SORA Context"** → Ajoute le tool `request_approval` (copier-coller le code ci-dessus)

   b. **Node "Handle SORA Tools"** → Ajoute le handler (copier-coller le code ci-dessus) + change `agent_id: 'sora'`

   c. **System Prompt SORA** → Ajoute les règles d'approbation (copier-coller ci-dessus)

3. **Test avec SORA** (action qui nécessite approbation)

4. **Vérifie** que la carte apparaît dans http://localhost:5173

5. **Répète pour MARCUS, LUNA, MILO**

---

**Temps estimé :**
- 15 min par agent
- 1h pour les 4 agents
- 30 min de tests

**Difficulté :** Copier-coller, juste ajuster `agent_id` pour chaque agent

---

**Dernière mise à jour :** 2026-02-27
**Responsable :** Claude Code (Terminal CLI)
**Référence :** Migration 010 - Approval Requests System
**Status :** ✅ PRÊT À IMPLÉMENTER
