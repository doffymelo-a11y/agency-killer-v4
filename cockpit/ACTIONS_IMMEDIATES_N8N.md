# ⚡ ACTIONS IMMÉDIATES - THE HIVE OS V4
## Configuration n8n en 2 heures chrono

**Objectif:** Rendre fonctionnel le flow "Audit Technique Data Layer" end-to-end

---

## 🎯 QUE FAIRE MAINTENANT (Pendant que Stripe se configure)

### ✅ ÉTAPE 1: Credentials n8n (5 min)

#### Dans n8n → Settings → Credentials → Add Credential

**1. Supabase API**
```
Type: Supabase
Name: Supabase - The Hive V4
Host: vngkmmrglfajyccpbukh.supabase.co
Service Role Key: [Copier depuis Supabase Dashboard → Settings → API → service_role (secret)]
```

**2. OpenAI API**
```
Type: OpenAI
Name: OpenAI - The Hive
API Key: [Votre clé OpenAI sk-proj-...]
```

**3. Google AI (Gemini)**
```
Type: Google PaLM API / Google Gemini
Name: Google AI - Gemini Flash
API Key: [Depuis https://aistudio.google.com/app/apikey]
```

---

### ✅ ÉTAPE 2: Variables d'Environnement (3 min)

#### Dans n8n → Settings → Variables

Ajouter ces variables (ou dans votre fichier `.env`) :

```bash
SUPABASE_URL=https://vngkmmrglfajyccpbukh.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (depuis Supabase Dashboard → API → anon public)
ORCHESTRATOR_WEBHOOK_URL=https://VOTRE-DOMAINE-N8N.com/webhook/orchestrator-v5-entry
```

> **Remplacer `VOTRE-DOMAINE-N8N.com`** par votre vrai domaine n8n (ex: `n8n.srv1234539.hstgr.cloud`)

---

### ✅ ÉTAPE 3: PM AI Brain - System Message (5 min)

#### Workflow: pm-core-v4.4-validated.workflow.json

1. Ouvrir le workflow dans n8n
2. Cliquer sur le nœud **"PM AI Brain"**
3. Dans **Parameters → Options → System Message**, copier-coller :

```markdown
Tu es le PM (Project Manager) de THE HIVE OS V4, un ERP marketing autonome.

## CONTEXTE
Tu coordonnes 4 agents IA spécialisés:
- **SORA** (Analyst): Audit, Analytics, Tracking, Performance
- **LUNA** (Strategist): Stratégie, SEO, Content, Planning
- **MARCUS** (Trader): Campagnes publicitaires, Budget, Scaling
- **MILO** (Creative): Créatifs, Vidéos, Assets visuels/audio

## MÉMOIRE COLLECTIVE
Tu as accès à l'historique complet du projet via memory_context:
- previous_work: Travaux déjà réalisés
- validated_elements: Décisions validées
- recommendations_for_current_task: Conseils des agents

## TÂCHE
Analyser la requête utilisateur et **déléguer à l'agent approprié**.

### Règles de délégation:
1. **SORA** si: audit, analyse, tracking, KPIs, dashboards, pixel, GTM
2. **LUNA** si: stratégie, SEO, keywords, content plan, competitor analysis
3. **MARCUS** si: lancer campagne, ajuster budget, scaling, bid optimization
4. **MILO** si: créer créatifs, générer images/vidéos, assets publicitaires

### OUTPUT REQUIS (JSON strict):
```json
{
  "selected_agent": "sora|luna|marcus|milo",
  "routing_reason": "Explication en 1 phrase",
  "context_for_agent": {
    "priority": "high|medium|low",
    "expected_deliverables": ["liste"],
    "memory_highlights": "Points clés de la mémoire à utiliser"
  }
}
```

## IMPORTANT
- Si plusieurs agents possibles, privilégier celui mentionné dans task.assignee
- Toujours inclure memory_highlights pour continuité
- Ne jamais exécuter de tâche toi-même, DÉLÉGUER
```

4. **Vérifier Chat Model:**
   - Model: `gpt-4o`
   - Temperature: `0.3`
   - Max Tokens: `2000`

5. **Sauvegarder** le workflow

---

### ✅ ÉTAPE 4: SORA AI Agent - System Prompt (10 min)

#### Workflow: FINALE_SORA_MCP.workflow.json

1. Ouvrir le workflow dans n8n
2. Cliquer sur le nœud **"Prepare SORA Context"** (nœud Code avant "SORA AI Agent")
3. **Remplacer TOUT le code** par :

```javascript
const SORA_SYSTEM_PROMPT = `Tu es SORA, l'Analyst de THE HIVE OS V4.

## IDENTITÉ
Expert en Analytics, Tracking, Audit technique, Performance Marketing.

## TOOLS DISPONIBLES (28 fonctions)

### Google Ads Manager (READ-ONLY)
1. get_accounts() - Liste comptes Google Ads
2. get_campaigns(account_id) - Campagnes actives
3. get_search_terms(campaign_id) - Termes de recherche
4. get_keywords_quality_score(ad_group_id) - Quality Score mots-clés
5. get_conversions(account_id, date_range) - Données conversions
6. create_audience(account_id, audience_data) - Créer audience remarketing
7. get_performance_report(account_id, metrics, date_range) - Rapport perf

### Meta Ads Manager (READ-ONLY)
8. get_ad_accounts() - Liste comptes Meta
9. get_campaigns(ad_account_id) - Campagnes actives
10. get_insights(campaign_id, metrics, date_range) - Insights détaillés
11. get_ad_sets(campaign_id) - Ad Sets avec statut
12. check_learning_phase(ad_set_id) - Statut Learning Phase
13. get_pixel_events(pixel_id, date_range) - Événements Pixel
14. get_audience_overlap(audience_ids) - Chevauchement audiences

### GTM Manager
15. list_containers(account_id) - Liste conteneurs GTM
16. list_tags(container_id) - Tags existants
17. create_tag(container_id, tag_data) - Créer nouveau tag
18. create_trigger(container_id, trigger_data) - Créer déclencheur
19. create_variable(container_id, variable_data) - Créer variable
20. publish_version(container_id) - Publier version
21. preview_mode(container_id) - Activer mode preview

### Looker Manager
22. create_report(data_source, config) - Créer rapport Looker
23. add_scorecard(report_id, metric, title) - Ajouter scorecard
24. add_time_series_chart(report_id, metric, dimension) - Graphique temps
25. add_table(report_id, dimensions, metrics) - Tableau données
26. blend_data_sources(sources, join_keys) - Combiner sources
27. schedule_email(report_id, emails, frequency) - Planifier envoi
28. get_report_url(report_id) - URL public du rapport

## TÂCHE ACTUELLE
${$json.task_title || 'Non spécifié'}

### Description
${$json.task_description || 'Non fournie'}

### Phase: ${$json.task_phase || 'Non définie'}

## PROJET CONTEXT
${JSON.stringify($json.sharedMemory || $json.shared_memory, null, 2)}

## WRITE-BACK COMMANDS (OBLIGATOIRES)

À la fin de ton analyse, tu DOIS inclure dans ta réponse:

\`\`\`json
{
  "MEMORY_WRITE": {
    "action": "NOM_ACTION_UPPERCASE",
    "summary": "Résumé de ton travail",
    "key_findings": ["Finding 1", "Finding 2"],
    "deliverables": ["URL Excel", "URL Dashboard"],
    "recommendations": ["Pour MARCUS: ...", "Pour MILO: ..."]
  },
  "UPDATE_TASK_STATUS": {
    "status": "in_progress|done",
    "progress_percentage": 25
  },
  "UI_COMPONENT": {
    "type": "DATA_LAYER_AUDIT|PERFORMANCE_REPORT",
    "data": {...}
  }
}
\`\`\`

## IMPORTANT
- Utilise les TOOLS pour analyses réelles
- Documente TOUT dans MEMORY_WRITE
- Recommandations pour autres agents si nécessaire
- Format markdown structuré pour réponse
`;

// Build context object
const context = {
  ...$input.item.json,
  system_prompt: SORA_SYSTEM_PROMPT,
  chatInput: $input.item.json.query || $input.item.json.user_input || $input.item.json.chatInput || $input.item.json.task_description
};

return [{ json: context }];
```

4. **Vérifier le nœud "SORA AI Agent":**
   - Model: `gemini-2.0-flash-exp`
   - Temperature: `0.2`
   - System Message field: `={{ $json.system_prompt }}`
   - Prompt field: `={{ $json.chatInput }}`

5. **Sauvegarder** le workflow

---

### ✅ ÉTAPE 5: Orchestrator Routing (5 min)

#### Workflow: orchestrator-core.workflow.json

1. Ouvrir le workflow dans n8n
2. Cliquer sur le nœud **"AI Agent Router"**
3. Dans **Parameters → Options → System Message**, copier-coller :

```markdown
Tu es l'ORCHESTRATOR de THE HIVE OS V4.

## RÔLE
Router les requêtes vers les agents spécialisés en fonction du contexte.

## AGENTS DISPONIBLES
- **call_analyst** (SORA): Analytics, Tracking, Audit technique
- **call_strategist** (LUNA): Stratégie marketing, SEO, Planning
- **call_creative** (MILO): Génération assets visuels/audio
- **call_trader** (MARCUS): Gestion campagnes publicitaires

## TOOLS À UTILISER
Appelle EXACTEMENT UN tool en fonction de la requête.

### Exemples:
- "Auditer le Data Layer" → **call_analyst**
- "Créer une stratégie de contenu" → **call_strategist**
- "Générer 5 visuels pour Meta Ads" → **call_creative**
- "Lancer une campagne Google Ads" → **call_trader**

## IMPORTANT
- Appelle UN SEUL tool par requête
- Passe TOUS les paramètres nécessaires (query, session_id)
- Si incertain, privilégier call_analyst pour analyses
```

4. **Vérifier Tool "call_analyst":**
   - Cliquer sur le tool
   - **Workflow ID:** Changer en mode "Name" et entrer `FINALE SORA MCP - THE HIVE OS V4`
   - **Field to Return:** `analyst_response`
   - **Extra Workflow Inputs:**
     ```json
     {
       "query": "={{ $fromAI('query') }}",
       "session_id": "={{ $json.session_id || $('Load Global Context').item.json.session_id }}",
       "shared_memory": "={{ $json.shared_memory || {} }}",
       "task_context": "={{ $json.task_context || {} }}"
     }
     ```

5. **Sauvegarder** le workflow

---

### ✅ ÉTAPE 6: GTM Manager Tool (OPTIONNEL - 15 min)

**ATTENTION:** Cette étape nécessite OAuth2 Google configuré.

#### Si vous voulez tester avec des données MOCK (plus rapide):

1. Dans SORA workflow, cliquer sur le tool **"gtm_manager"**
2. Remplacer le code par ce MOCK simple :

```javascript
const functionName = $fromAI('function');
const params = $fromAI('params') || {};

// MOCK Data pour tests
const MOCK_CONTAINERS = [
  { containerId: 'GTM-ABC123', name: 'Investis10 - Production', accountId: 'accounts/123456' },
  { containerId: 'GTM-XYZ789', name: 'Investis10 - Staging', accountId: 'accounts/123456' }
];

const MOCK_TAGS = [
  { tagId: '1', name: 'Google Analytics 4', type: 'gaawe' },
  { tagId: '2', name: 'Meta Pixel', type: 'awct' },
  { tagId: '3', name: 'Conversion Linker', type: 'gclidw' }
];

switch (functionName) {
  case 'list_containers':
    return {
      containers: MOCK_CONTAINERS,
      total: MOCK_CONTAINERS.length
    };

  case 'list_tags':
    const containerId = params.container_id;
    return {
      container_id: containerId,
      tags: MOCK_TAGS,
      total: MOCK_TAGS.length
    };

  case 'preview_mode':
    const containerIdPreview = params.container_id || 'GTM-ABC123';
    return {
      preview_url: `https://tagassistant.google.com/#/?container_id=${containerIdPreview}`,
      message: 'Ouvrir cette URL dans le navigateur pour tester le Data Layer'
    };

  default:
    return {
      error: `Function ${functionName} non disponible`,
      available_functions: ['list_containers', 'list_tags', 'preview_mode']
    };
}
```

3. **Sauvegarder** le workflow

> Pour la version PRODUCTION avec vraie API GTM, voir `GUIDE_IMPLEMENTATION_N8N_COMPLETE.md` Section 2.2

---

### ✅ ÉTAPE 7: TEST COMPLET (10 min)

#### Ouvrir un terminal et exécuter:

```bash
curl -X POST https://VOTRE-DOMAINE-N8N.com/webhook/pm-v4-entry \
  -H "Content-Type: application/json" \
  -d '{
    "action": "task_launch",
    "chatInput": "Exécute la tâche: Audit Technique Data Layer",
    "task_id": "test-data-layer-001",
    "task_title": "Audit Technique Data Layer",
    "task_description": "Auditer le Data Layer existant (ou constater son absence) pour le site Investis10. Vérifier window.dataLayer, identifier les variables disponibles, lister les GAPS.",
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
      "state_flags": {
        "ads_live": false
      }
    }
  }'
```

#### Réponse attendue (simplifié):

```json
{
  "success": true,
  "chat_message": "✅ Audit Data Layer terminé pour Investis10...",
  "agent_response": {
    "agent_used": "sora",
    "message": "J'ai audité le Data Layer...\n\n**Résultats:**\n- GTM Container: GTM-ABC123\n- Tags configurés: 3\n- Variables manquantes: user_id, product_id..."
  },
  "ui_components": [{
    "type": "DATA_LAYER_AUDIT",
    "data": {...}
  }]
}
```

---

### ✅ ÉTAPE 8: Vérification Supabase (2 min)

#### Dans Supabase SQL Editor:

```sql
-- Vérifier que le PM a écrit dans la mémoire
SELECT * FROM project_memory
WHERE project_id = '71b4ffbd-414a-4c70-bef1-4b47c3d38b34'
ORDER BY created_at DESC
LIMIT 5;
```

**Validation:**
- Vous devriez voir 1 nouveau record
- `agent_id` = "sora" ou "pm"
- `action` contient "AUDIT" ou "DATA_LAYER"
- `summary` non vide

---

## 🔥 SI ERREURS

### Erreur: "Credential not found"

```
FIX: Aller dans n8n Settings → Credentials
Vérifier que les credentials sont NOMMÉES EXACTEMENT:
- "Supabase - The Hive V4"
- "OpenAI - The Hive"
- "Google AI - Gemini Flash"
```

### Erreur: "ORCHESTRATOR_WEBHOOK_URL not defined"

```
FIX: n8n Settings → Variables
Ajouter: ORCHESTRATOR_WEBHOOK_URL=https://VOTRE-DOMAINE/webhook/orchestrator-v5-entry
```

### Erreur: "Workflow 'FINALE SORA MCP' not found"

```
FIX: Orchestrator workflow → Tool "call_analyst"
Vérifier que le nom du workflow est EXACT (respect casse/espaces)
OU utiliser mode "ID" avec l'ID du workflow SORA
```

### Pas de réponse / Timeout

```
FIX:
1. Vérifier que TOUS les workflows sont ACTIFS (toggle ON)
2. Vérifier logs n8n: docker logs n8n-container -f
3. Tester chaque workflow individuellement
```

---

## 📊 CHECKLIST FINALE

Avant de dire "C'EST BON":

- [ ] Credentials Supabase configurées + testées
- [ ] Credentials OpenAI configurées
- [ ] Variables env SUPABASE_URL + ORCHESTRATOR_WEBHOOK_URL définies
- [ ] PM Brain: System Message complet copié
- [ ] SORA: System Prompt injecté dans "Prepare SORA Context"
- [ ] Orchestrator: Tool call_analyst pointe vers SORA
- [ ] Test curl exécuté → Réponse JSON reçue
- [ ] Supabase project_memory → Nouveau record créé

---

## 🎯 RÉSULTAT ATTENDU

**Après ces 8 étapes (env. 40 min), vous aurez:**

1. ✅ Un flow PM → Orchestrator → SORA **100% fonctionnel**
2. ✅ SORA capable d'analyser une tâche et retourner une réponse structurée
3. ✅ Mémoire collective écrite dans Supabase
4. ✅ UI Components générés pour le frontend

**Ce qui reste à faire (Sprint 2):**
- Implémenter vraies APIs GTM/Google Ads/Meta (au lieu de MOCK)
- Configurer MARCUS/LUNA/MILO de la même façon
- Ajouter safeguards pour opérations WRITE
- Tests de charge

---

## 📞 NEXT STEPS

1. **Exécuter ces 8 étapes maintenant** (pendant config Stripe)
2. **Me dire si ça marche** → Je t'aide à débugger si besoin
3. **Si tout OK** → On passe à l'implémentation vraies APIs (Sprint 2)

---

**Bon courage ! Tu as TOUT ce qu'il faut. Let's make it work! 🚀**
