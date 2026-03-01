# 🛠️ GUIDE: AJOUTER LES TOOLS DANS N8N (SORA)

## OBJECTIF
Ajouter les 4 nouveaux MCP tools dans le workflow `analyst-core` (Sora) pour lui permettre d'exécuter les tâches TYPE A.

---

## PRÉREQUIS

Avant de commencer, assure-toi d'avoir:
1. ✅ Les 4 MCP servers installés et fonctionnels (GTM, Google Ads, Meta Ads, Looker)
2. ✅ Accès admin à n8n
3. ✅ Le workflow `analyst-core.workflow.json` ouvert

---

## 📍 ÉTAPE 1: LOCALISER LE NŒUD "Analyst Brain1"

1. Ouvre n8n dans ton navigateur
2. Va dans le workflow **"Analyst MCP V5 - Bio-Brain Data Expert"**
3. Trouve le nœud **"Analyst Brain1"** (type: AI Agent)
   - C'est le nœud central avec l'icône "🧠"
   - Il contient actuellement le tool "Check Integrations"

**Visuel:**
```
[Data Fetcher GA4 + GSC1] → [Merge1] → [Crafting1] → [Analyst Brain1] → [Format UI Response1]
                                            ↑
                                  [Tool: Check Integrations]
```

---

## 📍 ÉTAPE 2: OUVRIR LA CONFIGURATION DU NŒUD

1. **Double-clique** sur le nœud **"Analyst Brain1"**
2. La fenêtre de configuration s'ouvre
3. Tu vois plusieurs sections:
   - Chat Model (Google Gemini Chat Model)
   - Memory (Tool)
   - **Tools** ← C'est ici qu'on va ajouter les tools

---

## 📍 ÉTAPE 3: AJOUTER LES 4 NOUVEAUX TOOLS

### Vue d'ensemble des tools à ajouter

| Tool Name | Description | Fonctions principales |
|-----------|-------------|----------------------|
| `gtm_manager` | Gère Google Tag Manager | Créer tags, déclencheurs, variables, publier |
| `google_ads_manager` | Gère Google Ads (LECTURE SEULE) | Lire campagnes, créer audiences, analyser |
| `meta_ads_manager` | Gère Meta Ads (LECTURE SEULE) | Lire insights, monitorer Learning Phase |
| `looker_manager` | Gère Looker Studio | Créer dashboards, ajouter graphiques |

---

### 3.1 Ajouter le tool "GTM Manager"

1. Dans la section **"Tools"**, clique sur **"+ Add Tool"**
2. Sélectionne **"Custom Tool"** (ou "Code Tool" selon version n8n)
3. Configure le tool:

**Nom:** `gtm_manager`

**Description:**
```
Gère Google Tag Manager. Permet de créer des tags, déclencheurs, variables et publier des versions. Utilise l'API GTM pour automatiser la configuration du tracking.
```

**Fonctions disponibles:**
```json
{
  "type": "object",
  "functions": [
    {
      "name": "gtm_list_containers",
      "description": "Liste tous les conteneurs GTM d'un compte Google Tag Manager",
      "parameters": {
        "type": "object",
        "properties": {
          "account_id": {
            "type": "string",
            "description": "ID du compte GTM (format: 'accounts/123456')"
          }
        },
        "required": ["account_id"]
      }
    },
    {
      "name": "gtm_list_tags",
      "description": "Liste tous les tags dans un conteneur GTM",
      "parameters": {
        "type": "object",
        "properties": {
          "container_id": {
            "type": "string",
            "description": "ID du conteneur GTM (format: 'accounts/123/containers/456')"
          },
          "workspace_id": {
            "type": "string",
            "description": "ID du workspace (optionnel, défaut = workspace par défaut)"
          }
        },
        "required": ["container_id"]
      }
    },
    {
      "name": "gtm_create_tag",
      "description": "Crée un nouveau tag dans GTM (GA4, Google Ads Conversion, Conversion Linker, Custom HTML)",
      "parameters": {
        "type": "object",
        "properties": {
          "container_id": {
            "type": "string",
            "description": "ID du conteneur GTM"
          },
          "tag_config": {
            "type": "object",
            "description": "Configuration du tag",
            "properties": {
              "name": {"type": "string", "description": "Nom du tag (ex: 'GA4 Configuration')"},
              "type": {"type": "string", "description": "Type de tag: gaawe (GA4), awct (Google Ads), gclidw (Conversion Linker), html (Custom HTML)"},
              "parameters": {"type": "array", "description": "Paramètres du tag"},
              "firing_trigger_ids": {"type": "array", "description": "IDs des déclencheurs (ex: ['2147479553'] pour All Pages)"}
            }
          }
        },
        "required": ["container_id", "tag_config"]
      }
    },
    {
      "name": "gtm_create_trigger",
      "description": "Crée un déclencheur (trigger) dans GTM pour activer les tags",
      "parameters": {
        "type": "object",
        "properties": {
          "container_id": {"type": "string"},
          "trigger_config": {
            "type": "object",
            "properties": {
              "name": {"type": "string", "description": "Nom du trigger (ex: 'Click - Email Links')"},
              "type": {"type": "string", "description": "Type: pageview, linkClick, formSubmission, customEvent"},
              "filters": {"type": "array", "description": "Conditions du trigger"}
            }
          }
        },
        "required": ["container_id", "trigger_config"]
      }
    },
    {
      "name": "gtm_create_variable",
      "description": "Crée une variable GTM pour capturer des données du Data Layer",
      "parameters": {
        "type": "object",
        "properties": {
          "container_id": {"type": "string"},
          "variable_config": {
            "type": "object",
            "properties": {
              "name": {"type": "string", "description": "Nom de la variable (ex: 'DLV - Transaction ID')"},
              "type": {"type": "string", "description": "Type: v (Data Layer Variable), u (URL), etc."},
              "parameters": {"type": "array"}
            }
          }
        },
        "required": ["container_id", "variable_config"]
      }
    },
    {
      "name": "gtm_publish_version",
      "description": "Publie une nouvelle version du conteneur GTM (met en ligne les modifications)",
      "parameters": {
        "type": "object",
        "properties": {
          "container_id": {"type": "string"},
          "version_name": {"type": "string", "description": "Nom de la version (ex: 'v1.2 - GA4 Setup by Sora')"},
          "version_description": {"type": "string", "description": "Description des changements"}
        },
        "required": ["container_id", "version_name"]
      }
    },
    {
      "name": "gtm_preview_mode",
      "description": "Active le mode Preview (debug) pour tester les tags avant publication",
      "parameters": {
        "type": "object",
        "properties": {
          "container_id": {"type": "string"}
        },
        "required": ["container_id"]
      }
    }
  ]
}
```

**Code d'implémentation (JavaScript):**
```javascript
// Ce code appelle le MCP server GTM
const functionName = $input.item.json.functionName;
const parameters = $input.item.json.parameters;

// Récupérer les credentials de l'utilisateur depuis Supabase
const project_id = $input.item.json.project_id;
const user_id = $input.item.json.user_id;

// TODO: Implémenter l'appel au MCP server GTM
// Exemple:
// const result = await mcpClient.callTool('gtm_manager', functionName, parameters);

// Pour l'instant, retourner un placeholder
return {
  json: {
    success: true,
    function_called: functionName,
    result: "MCP GTM Server call placeholder",
    message: `Fonction ${functionName} appelée avec succès`
  }
};
```

**Note:** Le code ci-dessus est un placeholder. L'implémentation réelle dépend de comment tu as déployé les MCP servers.

---

### 3.2 Ajouter le tool "Google Ads Manager"

1. Clique à nouveau sur **"+ Add Tool"**
2. Sélectionne **"Custom Tool"**
3. Configure:

**Nom:** `google_ads_manager`

**Description:**
```
Gère Google Ads en LECTURE SEULE. Permet de lire les campagnes, analyser les performances, créer des audiences de remarketing. Ne peut PAS créer de campagnes (rôle de Marcus).
```

**Fonctions disponibles:**
```json
{
  "type": "object",
  "functions": [
    {
      "name": "google_ads_get_accounts",
      "description": "Liste tous les comptes Google Ads accessibles",
      "parameters": {"type": "object", "properties": {}}
    },
    {
      "name": "google_ads_get_campaigns",
      "description": "Liste toutes les campagnes d'un compte avec métriques de performance",
      "parameters": {
        "type": "object",
        "properties": {
          "customer_id": {"type": "string", "description": "ID du compte Google Ads (ex: '1234567890')"},
          "date_range": {"type": "string", "description": "LAST_7_DAYS, LAST_30_DAYS, THIS_MONTH", "enum": ["LAST_7_DAYS", "LAST_30_DAYS", "THIS_MONTH"]}
        },
        "required": ["customer_id"]
      }
    },
    {
      "name": "google_ads_get_search_terms",
      "description": "Rapport des termes de recherche réels qui ont déclenché les annonces",
      "parameters": {
        "type": "object",
        "properties": {
          "customer_id": {"type": "string"},
          "campaign_id": {"type": "string", "description": "Filtrer par campagne (optionnel)"},
          "date_range": {"type": "string", "enum": ["LAST_7_DAYS", "LAST_30_DAYS"]}
        },
        "required": ["customer_id"]
      }
    },
    {
      "name": "google_ads_get_keywords_quality_score",
      "description": "Quality Score de chaque mot-clé (1-10) avec composants (CTR, Ad Relevance, LP Experience)",
      "parameters": {
        "type": "object",
        "properties": {
          "customer_id": {"type": "string"},
          "ad_group_id": {"type": "string", "description": "Filtrer par ad group (optionnel)"}
        },
        "required": ["customer_id"]
      }
    },
    {
      "name": "google_ads_get_conversions",
      "description": "Liste toutes les conversions configurées dans le compte",
      "parameters": {
        "type": "object",
        "properties": {
          "customer_id": {"type": "string"}
        },
        "required": ["customer_id"]
      }
    },
    {
      "name": "google_ads_create_audience",
      "description": "Crée une audience de remarketing (visiteurs, paniers abandonnés, acheteurs)",
      "parameters": {
        "type": "object",
        "properties": {
          "customer_id": {"type": "string"},
          "audience_config": {
            "type": "object",
            "properties": {
              "name": {"type": "string", "description": "Nom de l'audience"},
              "description": {"type": "string"},
              "membership_duration_days": {"type": "number", "description": "Durée de rétention (7-540 jours)"},
              "rules": {"type": "array", "description": "Règles de l'audience"}
            }
          }
        },
        "required": ["customer_id", "audience_config"]
      }
    },
    {
      "name": "google_ads_get_performance_report",
      "description": "Rapport de performances personnalisé avec segmentation",
      "parameters": {
        "type": "object",
        "properties": {
          "customer_id": {"type": "string"},
          "metrics": {"type": "array", "description": "Métriques: impressions, clicks, conversions, cost, ctr, cpa, roas"},
          "dimensions": {"type": "array", "description": "Dimensions: campaign, ad_group, device, age, gender"},
          "date_range": {"type": "string"}
        },
        "required": ["customer_id", "metrics", "dimensions"]
      }
    }
  ]
}
```

**Code d'implémentation:** (similaire à GTM, appelle MCP server Google Ads)

---

### 3.3 Ajouter le tool "Meta Ads Manager"

1. Clique sur **"+ Add Tool"**
2. Sélectionne **"Custom Tool"**
3. Configure:

**Nom:** `meta_ads_manager`

**Description:**
```
Gère Meta Ads (Facebook/Instagram) en LECTURE SEULE. Analyse les performances, monitore la Learning Phase, vérifie les pixels. Ne peut PAS lancer de campagnes (rôle de Marcus avec 'Launch Meta Campaign' tool).
```

**Fonctions disponibles:**
```json
{
  "type": "object",
  "functions": [
    {
      "name": "meta_ads_get_ad_accounts",
      "description": "Liste tous les comptes publicitaires Meta accessibles",
      "parameters": {"type": "object", "properties": {}}
    },
    {
      "name": "meta_ads_get_campaigns",
      "description": "Liste toutes les campagnes d'un compte publicitaire",
      "parameters": {
        "type": "object",
        "properties": {
          "ad_account_id": {"type": "string", "description": "ID du compte pub (format: 'act_123456789')"},
          "date_range": {"type": "object", "description": "Ex: {since: '2024-01-01', until: '2024-01-31'}"}
        },
        "required": ["ad_account_id"]
      }
    },
    {
      "name": "meta_ads_get_insights",
      "description": "Insights détaillés d'une campagne/ad set/ad avec métriques de performance",
      "parameters": {
        "type": "object",
        "properties": {
          "object_id": {"type": "string", "description": "ID de la campagne/ad set/ad"},
          "object_type": {"type": "string", "enum": ["campaign", "adset", "ad"]},
          "metrics": {"type": "array", "description": "impressions, clicks, spend, conversions, ctr, cpc, cpa, roas"},
          "date_range": {"type": "object"},
          "breakdown": {"type": "array", "description": "age, gender, device_platform, placement"}
        },
        "required": ["object_id", "object_type", "metrics", "date_range"]
      }
    },
    {
      "name": "meta_ads_get_ad_sets",
      "description": "Liste tous les ad sets d'une campagne avec targeting et performances",
      "parameters": {
        "type": "object",
        "properties": {
          "campaign_id": {"type": "string"},
          "include_insights": {"type": "boolean", "description": "Inclure les métriques (défaut: true)"}
        },
        "required": ["campaign_id"]
      }
    },
    {
      "name": "meta_ads_check_learning_phase",
      "description": "Vérifie le statut de Learning Phase d'un ad set (ACTIVE, LEARNING_LIMITED, LEARNING_EXITED)",
      "parameters": {
        "type": "object",
        "properties": {
          "ad_set_id": {"type": "string"}
        },
        "required": ["ad_set_id"]
      }
    },
    {
      "name": "meta_ads_get_pixel_events",
      "description": "Liste tous les événements configurés sur un pixel Meta avec Event Match Quality",
      "parameters": {
        "type": "object",
        "properties": {
          "pixel_id": {"type": "string", "description": "ID du pixel (format: '123456789012345')"},
          "date_range": {"type": "object"}
        },
        "required": ["pixel_id"]
      }
    },
    {
      "name": "meta_ads_get_audience_overlap",
      "description": "Vérifie le chevauchement entre audiences (max 5 audiences)",
      "parameters": {
        "type": "object",
        "properties": {
          "ad_account_id": {"type": "string"},
          "audience_ids": {"type": "array", "description": "IDs des audiences à comparer (max 5)"}
        },
        "required": ["ad_account_id", "audience_ids"]
      }
    }
  ]
}
```

**Note:** Marcus a déjà le tool "Launch Meta Campaign" qui lui permet de CRÉER et LANCER des campagnes. Sora a seulement LECTURE pour analyser.

---

### 3.4 Ajouter le tool "Looker Manager"

1. Clique sur **"+ Add Tool"**
2. Sélectionne **"Custom Tool"**
3. Configure:

**Nom:** `looker_manager`

**Description:**
```
Gère Looker Studio (ex-Data Studio). Crée des dashboards automatiquement, ajoute des graphiques, connecte des sources de données (GA4, Google Ads, GSC), planifie des emails.
```

**Fonctions disponibles:**
```json
{
  "type": "object",
  "functions": [
    {
      "name": "looker_create_report",
      "description": "Crée un nouveau rapport Looker Studio avec sources de données",
      "parameters": {
        "type": "object",
        "properties": {
          "report_name": {"type": "string", "description": "Nom du rapport (ex: 'Dashboard Marketing Q1 2024')"},
          "data_sources": {
            "type": "array",
            "description": "Sources à connecter",
            "items": {
              "type": "object",
              "properties": {
                "type": {"type": "string", "enum": ["GA4", "GOOGLE_ADS", "SEARCH_CONSOLE", "FACEBOOK_ADS"]},
                "property_id": {"type": "string", "description": "ID de la propriété/compte"},
                "name": {"type": "string"}
              }
            }
          }
        },
        "required": ["report_name", "data_sources"]
      }
    },
    {
      "name": "looker_add_scorecard",
      "description": "Ajoute une scorecard KPI au rapport (ex: Revenue, Sessions, ROAS)",
      "parameters": {
        "type": "object",
        "properties": {
          "report_id": {"type": "string"},
          "config": {
            "type": "object",
            "properties": {
              "metric": {"type": "string", "description": "sessions, revenue, conversions, roas"},
              "data_source": {"type": "string"},
              "comparison_type": {"type": "string", "enum": ["PREVIOUS_PERIOD", "PREVIOUS_YEAR"]},
              "position": {"type": "object"},
              "style": {"type": "object"}
            }
          }
        },
        "required": ["report_id", "config"]
      }
    },
    {
      "name": "looker_add_time_series_chart",
      "description": "Ajoute un graphique série temporelle (ligne) au rapport",
      "parameters": {
        "type": "object",
        "properties": {
          "report_id": {"type": "string"},
          "config": {
            "type": "object",
            "properties": {
              "title": {"type": "string"},
              "data_source": {"type": "string"},
              "dimension": {"type": "string", "description": "date, week, month"},
              "metrics": {"type": "array", "description": "revenue, transactions, sessions"},
              "date_range": {"type": "string"},
              "position": {"type": "object"}
            }
          }
        },
        "required": ["report_id", "config"]
      }
    },
    {
      "name": "looker_add_table",
      "description": "Ajoute un tableau de données au rapport (ex: Top 10 Pages)",
      "parameters": {
        "type": "object",
        "properties": {
          "report_id": {"type": "string"},
          "config": {
            "type": "object",
            "properties": {
              "title": {"type": "string"},
              "data_source": {"type": "string"},
              "dimensions": {"type": "array"},
              "metrics": {"type": "array"},
              "sort": {"type": "object"},
              "row_limit": {"type": "number"},
              "position": {"type": "object"}
            }
          }
        },
        "required": ["report_id", "config"]
      }
    },
    {
      "name": "looker_blend_data_sources",
      "description": "Fusionne plusieurs sources de données (blend) pour croiser GA4 + Google Ads par exemple",
      "parameters": {
        "type": "object",
        "properties": {
          "report_id": {"type": "string"},
          "blend_config": {
            "type": "object",
            "properties": {
              "name": {"type": "string"},
              "sources": {"type": "array"},
              "join_type": {"type": "string", "enum": ["LEFT", "INNER", "FULL"]},
              "metrics": {"type": "array"}
            }
          }
        },
        "required": ["report_id", "blend_config"]
      }
    },
    {
      "name": "looker_schedule_email",
      "description": "Configure l'envoi automatique par email du rapport",
      "parameters": {
        "type": "object",
        "properties": {
          "report_id": {"type": "string"},
          "recipients": {"type": "array", "description": "Emails des destinataires"},
          "frequency": {"type": "string", "enum": ["DAILY", "WEEKLY", "MONTHLY"]},
          "day_of_week": {"type": "string", "enum": ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]},
          "day_of_month": {"type": "number", "minimum": 1, "maximum": 31}
        },
        "required": ["report_id", "recipients", "frequency"]
      }
    },
    {
      "name": "looker_get_report_url",
      "description": "Récupère les URLs du rapport (visualisation, édition, embed)",
      "parameters": {
        "type": "object",
        "properties": {
          "report_id": {"type": "string"}
        },
        "required": ["report_id"]
      }
    }
  ]
}
```

---

## 📍 ÉTAPE 4: METTRE À JOUR LE SYSTEM PROMPT

1. Toujours dans le nœud **"Analyst Brain1"**, trouve la section **"System Message"**
2. **Remplace complètement** le system prompt actuel par le contenu de:
   ```
   /Users/azzedinezazai/Documents/Agency-Killer-V4/SORA_SYSTEM_PROMPT_FINAL_V4.5.txt
   ```

**Attention:** Le system prompt est long (~15 000 caractères). Assure-toi de tout copier-coller.

---

## 📍 ÉTAPE 5: SAUVEGARDER ET TESTER

### 5.1 Sauvegarder le workflow

1. Clique sur **"Save"** en haut à droite du nœud
2. Clique sur **"Save"** en haut à droite du workflow
3. Clique sur **"Activate"** pour activer le workflow

### 5.2 Tester avec une tâche TYPE A

**Test 1: Définir KPIs (sans intégrations)**
1. Va dans BoardView
2. Lance la tâche "🎯 Définir KPIs"
3. **Résultat attendu:** Sora propose 3 options (A: Connecter, B: Manuel, C: Benchmarks)

**Test 2: Créer balise GA4 (avec GTM connecté)**
1. Connecte GTM dans l'onglet Intégrations
2. Lance une tâche fictive "Créer balise GA4"
3. **Résultat attendu:** Sora appelle `gtm_create_tag()` et confirme la création

**Test 3: Guidage Pixel Meta (TYPE B)**
1. Lance une tâche "Installer Pixel Meta"
2. **Résultat attendu:** Sora fournit un guide étape par étape (ne fait PAS l'action lui-même)

---

## 🔍 DEBUGGING

### Si les tools n'apparaissent pas

1. Vérifie que les tools sont bien dans la section "Tools" du nœud "Analyst Brain1"
2. Vérifie que les noms correspondent exactement: `gtm_manager`, `google_ads_manager`, `meta_ads_manager`, `looker_manager`
3. Redémarre n8n: `n8n restart`

### Si Sora ne les utilise pas

1. Vérifie que le system prompt est à jour avec les sections TYPE A/B
2. Vérifie dans les logs n8n si l'appel au tool est fait:
   ```bash
   tail -f ~/.n8n/logs/n8n.log
   ```
3. Teste en demandant explicitement: "Utilise le tool gtm_manager pour lister mes conteneurs"

### Si l'appel MCP échoue

1. Vérifie que les MCP servers sont démarrés:
   ```bash
   ps aux | grep mcp
   ```
2. Vérifie les credentials dans Supabase `user_integrations` table
3. Teste l'API manuellement avec curl:
   ```bash
   curl -H "Authorization: Bearer $TOKEN" \
        https://www.googleapis.com/tagmanager/v2/accounts
   ```

---

## 📋 CHECKLIST FINALE

- [ ] 4 tools ajoutés dans "Analyst Brain1": gtm_manager, google_ads_manager, meta_ads_manager, looker_manager
- [ ] System prompt mis à jour avec TYPE A/B
- [ ] Workflow sauvegardé et activé
- [ ] Test TYPE A (Définir KPIs sans intégrations) → 3 options proposées
- [ ] Test TYPE B (Installer Pixel Meta) → Guidage fourni
- [ ] Logs n8n sans erreurs
- [ ] MCP servers fonctionnels

---

## 📖 RESSOURCES

- **Specs techniques MCP servers:** `/Users/azzedinezazai/Documents/Agency-Killer-V4/MCP_SERVERS_SPECS_SORA.md`
- **System prompt Sora:** `/Users/azzedinezazai/Documents/Agency-Killer-V4/SORA_SYSTEM_PROMPT_FINAL_V4.5.txt`
- **Catégorisation tâches:** `/Users/azzedinezazai/Documents/Agency-Killer-V4/SORA_TASKS_CATEGORIZATION.md`

---

**FIN DU GUIDE**
