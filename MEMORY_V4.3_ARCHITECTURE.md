# THE HIVE OS - Architecture Memoire Collective V4.3

> Ce document decrit la logique de memoire partagee entre agents.
> A consulter si tu oublies comment fonctionne la memoire collective.

---

## 1. Principe Fondamental

```
"Chaque agent enrichit la ruche. Chaque tache enrichit le projet."
```

**Le PM est le SEUL a lire/ecrire dans la memoire Supabase.**
Les agents specialistes (Luna, Milo, Marcus, Sora) recoivent le contexte et retournent leurs contributions.

---

## 2. Architecture Globale

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                    │
│                         (React Cockpit)                                  │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     PM CENTRAL BRAIN (Chef de Projet)                    │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  1. RECEVOIR la requete utilisateur                             │    │
│  │  2. LIRE la memoire collective (Supabase)                       │    │
│  │  3. ANALYSER avec son cerveau IA (intent, contexte)             │    │
│  │  4. DECIDER quel agent doit intervenir                          │    │
│  │  5. CONSTRUIRE le contexte enrichi                              │    │
│  │  6. APPELER l'Orchestrator avec le contexte                     │    │
│  │  7. RECEVOIR la reponse + memory_contribution                   │    │
│  │  8. ECRIRE dans la memoire collective                           │    │
│  │  9. RETOURNER la reponse au frontend                            │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           ORCHESTRATOR                                   │
│              (Route vers le bon agent specialiste)                       │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
              ┌──────────┬───────┴───────┬──────────┐
              ▼          ▼               ▼          ▼
           ┌──────┐  ┌──────┐       ┌──────┐  ┌──────┐
           │ LUNA │  │ MILO │       │MARCUS│  │ SORA │
           │      │  │      │       │      │  │      │
           └──────┘  └──────┘       └──────┘  └──────┘
```

---

## 3. Table Supabase : project_memory

```sql
CREATE TABLE project_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id),
  task_id UUID REFERENCES tasks(id),
  agent_id TEXT NOT NULL,           -- 'luna', 'milo', 'marcus', 'sora'
  action memory_action NOT NULL,    -- ENUM: voir ci-dessous
  summary TEXT NOT NULL,            -- Resume de ce qui a ete fait
  key_findings JSONB DEFAULT '[]',  -- Decouvertes cles
  deliverables JSONB DEFAULT '[]',  -- Livrables crees
  recommendations JSONB DEFAULT '[]', -- Recommandations pour autres agents
  context_snapshot JSONB DEFAULT '{}',
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Types d'actions
CREATE TYPE memory_action AS ENUM (
  'TASK_STARTED',
  'TASK_COMPLETED',
  'DELIVERABLE_CREATED',
  'STRATEGY_VALIDATED',
  'RECOMMENDATION_MADE',
  'INSIGHT_DISCOVERED',
  'ASSET_GENERATED',
  'ANALYSIS_COMPLETED'
);
```

---

## 4. Format memory_contribution (retourne par les agents)

Chaque agent DOIT retourner ce format dans sa reponse :

```javascript
{
  "memory_contribution": {
    "action": "TASK_COMPLETED",           // Type d'action effectuee
    "summary": "Visuel cree: Image pub Meta format carre",  // Resume humain
    "key_findings": [                     // Decouvertes importantes
      "Style minimaliste choisi",
      "Couleurs: bleu #1A73E8, blanc"
    ],
    "deliverables": [                     // Livrables produits
      {
        "type": "image",
        "url": "https://...",
        "title": "Visuel Meta Ads v1",
        "description": "Format 1:1 pour feed"
      }
    ],
    "recommendations_for_next_agent": [   // Conseils pour autres agents
      "Pour Marcus: Visuel pret pour integration campagne",
      "Pour Sora: Configurer tracking click sur visuel"
    ],
    "flags_to_update": {                  // Flags projet a mettre a jour
      "creatives_ready": true
    }
  }
}
```

---

## 5. Format memory_context (injecte aux agents)

Le PM construit ce contexte AVANT d'appeler l'Orchestrator :

```javascript
{
  "memory_context": {
    "project_summary": "Campagne Meta Ads - Ete 2025",

    "previous_work": [
      {
        "agent": "luna",
        "what_was_done": "Strategie definie: Ciblage 25-45 ans, ton expert",
        "key_findings": ["USP: IA marketing", "Persona: Dir. Marketing PME"],
        "recommendations": ["Pour Milo: ton expert mais accessible"]
      },
      {
        "agent": "sora",
        "what_was_done": "Tracking configure: Pixel + CAPI",
        "key_findings": ["GTM installe", "Events: ViewContent, AddToCart, Purchase"]
      }
    ],

    "validated_elements": {
      "usp": "L'IA qui automatise le marketing",
      "persona": "Directeur Marketing PME",
      "tone": "Expert mais accessible",
      "competitors": ["HubSpot", "Semrush"]
    },

    "current_state": {
      "phase": "Production",
      "flags": {
        "strategy_validated": true,
        "tracking_ready": true,
        "creatives_ready": false
      }
    },

    "recommendations_for_current_task": [
      {
        "from_agent": "luna",
        "recommendations": [
          "Pour Milo: Utiliser le ton expert mais accessible",
          "Pour Milo: Mettre en avant la simplicite d'utilisation"
        ]
      }
    ]
  }
}
```

---

## 6. Flux de Donnees Complet

### 6.1 Utilisateur lance une tache

```
1. Frontend envoie:
   {
     "action": "task_launch",
     "chatInput": "Cree un visuel pour Meta Ads",
     "activeAgentId": "milo",
     "shared_memory": { "project_id": "xxx", ... },
     "task_context": { "task_id": "yyy", ... }
   }

2. PM recoit et:
   - Lit project_memory WHERE project_id = 'xxx'
   - Construit memory_context avec travaux precedents
   - Son cerveau IA analyse et enrichit le contexte
   - Appelle Orchestrator avec contexte complet

3. Orchestrator route vers Milo

4. Milo execute et retourne:
   - chat_message: "Voici votre visuel..."
   - ui_components: [{ type: "CAMPAGNE_TABLE", ... }]
   - memory_contribution: { action: "DELIVERABLE_CREATED", ... }

5. PM recoit et:
   - Extrait memory_contribution
   - INSERT INTO project_memory (...)
   - Retourne reponse au frontend
```

### 6.2 Propagation des recommandations

```
Luna travaille en premier:
  → Recommande: "Pour Milo: utiliser ton expert"
  → Sauvegarde dans project_memory

Milo travaille ensuite:
  → PM lit la memoire
  → Trouve recommandation de Luna pour Milo
  → Injecte dans le contexte de Milo
  → Milo voit: "Luna recommande: utiliser ton expert"
  → Milo applique et cree un visuel coherent

Marcus travaille apres:
  → PM lit la memoire
  → Voit: Luna a defini la strategie, Milo a cree les visuels
  → Marcus configure la campagne en coherence
```

---

## 7. Requetes SQL Utiles

### Lire la memoire d'un projet
```sql
SELECT * FROM project_memory
WHERE project_id = 'uuid-du-projet'
ORDER BY created_at DESC
LIMIT 10;
```

### Trouver les recommandations pour un agent
```sql
SELECT agent_id, recommendations, created_at
FROM project_memory
WHERE project_id = 'uuid-du-projet'
  AND recommendations::text ILIKE '%milo%'
ORDER BY created_at DESC;
```

### Stats des contributions par agent
```sql
SELECT
  agent_id,
  COUNT(*) as total_contributions,
  COUNT(*) FILTER (WHERE action = 'DELIVERABLE_CREATED') as deliverables
FROM project_memory
WHERE project_id = 'uuid-du-projet'
GROUP BY agent_id;
```

### Fonction helper (deja creee)
```sql
SELECT * FROM get_project_memory_context('uuid-du-projet', 10);
```

---

## 8. Agents et leurs Contributions Typiques

| Agent | Actions Typiques | Recommandations Vers |
|-------|-----------------|---------------------|
| **Luna** | STRATEGY_VALIDATED, ANALYSIS_COMPLETED | Milo (ton, style), Marcus (budget, ciblage) |
| **Milo** | DELIVERABLE_CREATED, ASSET_GENERATED | Marcus (visuels prets), Sora (tracking visuels) |
| **Marcus** | TASK_COMPLETED, INSIGHT_DISCOVERED | Milo (optimiser creatives), Sora (tracker conversions) |
| **Sora** | ANALYSIS_COMPLETED, INSIGHT_DISCOVERED | Luna (data SEO), Marcus (data performance) |

---

## 9. Regles Importantes

1. **SEUL le PM lit/ecrit dans Supabase** - Les agents ne touchent jamais la DB directement
2. **Chaque agent DOIT retourner memory_contribution** - Sinon pas de trace
3. **Les recommandations sont filtrees par nom d'agent** - "Pour Milo:" sera vu par Milo
4. **La memoire est scopee par project_id** - Pas de melange entre projets
5. **Limite de 10 entrees** - On ne charge pas tout l'historique, juste le recent

---

## 10. Debugging

### Verifier que la memoire s'ecrit
```sql
SELECT * FROM project_memory ORDER BY created_at DESC LIMIT 5;
```

### Verifier le contenu d'une contribution
```sql
SELECT
  agent_id,
  summary,
  key_findings,
  recommendations
FROM project_memory
WHERE id = 'uuid-de-la-contribution';
```

### Simuler ce que le PM va injecter
```sql
SELECT * FROM get_project_memory_context('uuid-du-projet', 10);
```

---

## 11. Version History

- **V4.0** : Architecture initiale sans memoire partagee
- **V4.2** : Ajout shared_memory dans les requetes
- **V4.3** : Memoire Collective complete avec project_memory table

---

> **Rappel:** Ce document doit etre lu si tu oublies comment fonctionne la memoire V4.3.
> Le manifesto THE_HIVE_OS_V4_MANIFESTO.md contient aussi la section 15 sur la memoire.
