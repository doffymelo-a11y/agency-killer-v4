# 🚀 ANALYST CORE V4.5 - AVEC TOOLS SETUP

## ✅ Ce qui a été fait

### 1. **System Prompt mis à jour**
- ✅ Ajout de la logique TYPE A (exécutable) vs TYPE B (guidage)
- ✅ Règle **ZERO MOCK DATA** explicite
- ✅ Distinction avec Marcus (Sora analyse, Marcus lance campagnes)
- ✅ Workflows détaillés pour 4 cas: connecté, manquant, TYPE B, erreur
- ✅ Exemples de réponses pour chaque cas

### 2. **4 nouveaux tools ajoutés**
- ✅ **Tool: GTM Manager** - Gérer Google Tag Manager
- ✅ **Tool: Google Ads Manager** - Analyser Google Ads (LECTURE SEULE)
- ✅ **Tool: Meta Ads Manager** - Analyser Meta Ads (LECTURE SEULE)
- ✅ **Tool: Looker Manager** - Créer dashboards Looker Studio

### 3. **Connexions configurées**
- ✅ Les 4 tools sont connectés au nœud "Analyst Brain" via `ai_tool`
- ✅ Total: 5 tools disponibles (+ "Check Integrations" existant)

---

## 📦 Fichiers

| Fichier | Description | Taille |
|---------|-------------|--------|
| `analyst-core.workflow.json` | ❌ Ancien workflow (backup) | 35KB |
| **`analyst-core-v4.5-with-tools.workflow.json`** | ✅ **Nouveau workflow à utiliser** | 63KB |

---

## 🔧 Comment importer dans n8n

### Étape 1: Ouvrir n8n
1. Va sur ton instance n8n (http://localhost:5678 ou ton URL)
2. Connecte-toi

### Étape 2: Importer le workflow
1. Clique sur **"Workflows"** (menu de gauche)
2. Clique sur **"Add workflow"** > **"Import from File"**
3. Sélectionne le fichier:
   ```
   /Users/azzedinezazai/Documents/Agency-Killer-V4/agents/CURRENT_analyst-mcp/analyst-core-v4.5-with-tools.workflow.json
   ```
4. Clique sur **"Import"**

### Étape 3: Vérifier les nœuds
Le workflow devrait avoir **20 nœuds** dont **5 tools**:

**Tools (connectés à Analyst Brain):**
- ✅ Tool: Check Integrations (existant)
- 🆕 Tool: GTM Manager
- 🆕 Tool: Google Ads Manager
- 🆕 Tool: Meta Ads Manager
- 🆕 Tool: Looker Manager

**Vérification visuelle:**
- Les 5 tools doivent avoir une ligne pointillée bleue qui les relie au nœud "Analyst Brain"
- Cela signifie qu'ils sont disponibles comme `ai_tool` pour l'agent

### Étape 4: Sauvegarder
1. Clique sur **"Save"** en haut à droite
2. Renomme le workflow: **"Analyst MCP V5 - With Setup Tools"**
3. Clique sur **"Activate"** pour activer le workflow

---

## 🧪 Tests à effectuer

### Test 1: Tâche "Définir KPIs" sans intégrations ⚡

**Objectif:** Vérifier que Sora propose 3 options (A/B/C) au lieu d'utiliser mock data.

**Steps:**
1. Va dans BoardView
2. Clique sur la tâche **"🎯 Définir KPIs (ROAS/CPA cible)"**
3. Clique sur **"Lancer"**

**Résultat attendu:**
```markdown
Pour établir des KPIs pertinents, j'ai besoin d'accéder à tes données historiques.

**Intégrations requises:**
- ✅ Google Analytics 4 (GA4)
- ✅ Meta Ads / Google Ads

**Actuellement:** Aucune intégration connectée

## 🚀 TROIS OPTIONS POUR AVANCER

### Option A: Connecter les intégrations (RECOMMANDÉ) ⭐
[...]

### Option B: Fournir les données manuellement
[...]

### Option C: Benchmarks secteur (approximation)
[...]
```

**❌ ÉCHEC si:**
- Sora utilise des "GA4 Mock" ou données fictives
- Sora dit "ROAS 8.33" ou invente des chiffres
- Sora ne propose pas les 3 options

---

### Test 2: Appel d'un tool (GTM Manager) 🛠️

**Objectif:** Vérifier que Sora peut appeler les nouveaux tools.

**Steps:**
1. Dans le chat, envoie: **"Liste mes conteneurs GTM"**
2. Observe la réponse

**Résultat attendu (pour l'instant):**
```json
{
  "success": true,
  "tool": "gtm_manager",
  "function_called": "gtm_list_containers",
  "message": "MCP Server call placeholder - À implémenter",
  "note": "Ce tool nécessite l'implémentation du MCP server correspondant"
}
```

**✅ SUCCÈS si:**
- Sora appelle le tool `gtm_manager`
- Le placeholder retourne un message (même si ce n'est pas les vraies données)

**Note:** Les tools sont en mode **placeholder** pour l'instant. L'implémentation des MCP servers viendra après.

---

### Test 3: Guidage pour installation Pixel Meta (TYPE B) 🧑‍🏫

**Objectif:** Vérifier que Sora guide l'utilisateur pour les tâches TYPE B.

**Steps:**
1. Crée une tâche fictive "Installer Pixel Meta" ou envoie dans le chat: **"Aide-moi à installer le Pixel Meta"**

**Résultat attendu:**
```markdown
🧑‍🏫 Je vais te guider étape par étape pour installer le Pixel Meta...

## 📋 ÉTAPES D'INSTALLATION

### Étape 1: Récupérer ton Pixel ID
[Instructions détaillées]

### Étape 2: Installation via GTM
[Instructions détaillées]

### Étape 3: Vérifier l'installation
[Instructions détaillées]

Dis-moi quand tu as terminé l'étape [X]...
```

**✅ SUCCÈS si:**
- Sora fournit un guide step-by-step
- Sora dit clairement qu'il ne peut PAS accéder au site
- Sora ne fait pas l'action lui-même (TYPE B = guidage seulement)

---

## 🐛 Debugging

### Si les tools n'apparaissent pas dans Analyst Brain

1. **Vérifier les connexions:**
   - Ouvre le workflow dans n8n
   - Clique sur chaque tool (GTM Manager, Google Ads Manager, etc.)
   - Vérifie qu'il y a une ligne pointillée bleue vers "Analyst Brain"
   - Si manquante: Clique sur le point `ai_tool` du tool → Relie à "Analyst Brain"

2. **Vérifier le type de nœud:**
   - Chaque tool doit être de type `@n8n/n8n-nodes-langchain.toolCode`
   - Si ce n'est pas le cas, supprime et recrée

3. **Redémarrer n8n:**
   ```bash
   n8n restart
   ```

---

### Si Sora n'utilise pas les tools

1. **Vérifier le system prompt:**
   - Ouvre le nœud "Analyst Brain"
   - Va dans **Options** > **System Message**
   - Vérifie que le system prompt contient la section **"🎯 CATÉGORIES DE TÂCHES: TYPE A vs TYPE B"**
   - Si absent, copie-colle le contenu de:
     ```
     /Users/azzedinezazai/Documents/Agency-Killer-V4/SORA_SYSTEM_PROMPT_FINAL_V4.5.txt
     ```

2. **Vérifier les logs:**
   - Dans n8n, clique sur **"Executions"** (menu de gauche)
   - Ouvre la dernière exécution
   - Cherche les appels aux tools dans les logs

---

### Si Sora utilise encore des mock data

1. **Vérifier le system prompt:**
   - La règle **"🚨 ZERO MOCK DATA"** doit être présente
   - Section **"RÈGLE ABSOLUE POUR TÂCHES DE SETUP"** doit être présente

2. **Relancer avec tâche explicite:**
   - Envoie dans le chat: **"[SETUP_TASK_DETECTED] Exécute la tâche Définir KPIs"**
   - Sora devrait détecter que c'est une tâche de setup

---

## 📝 Prochaines étapes

### 1. **Implémenter les MCP servers (optionnel pour tests initiaux)**
Les tools sont en mode **placeholder** pour l'instant. Pour une intégration complète:
- Installer les dépendances des MCP servers (voir `/mcp-servers/gtm-server/`)
- Builder: `npm install && npm run build`
- Configurer les credentials OAuth (Google + Meta)

### 2. **Tester avec vraies intégrations**
- Connecter GA4 + Meta Ads dans l'onglet **Intégrations**
- Relancer la tâche "Définir KPIs"
- Sora devrait maintenant analyser les vraies données

### 3. **Passer aux autres catégories de tâches**
Une fois que les tâches de SETUP fonctionnent:
- Appliquer la même logique aux tâches de PRODUCTION (Milo)
- Appliquer aux tâches d'OPTIMISATION (Marcus)
- Appliquer aux tâches de STRATÉGIE (Luna)

---

## 📚 Documentation complète

- **Specs MCP servers:** `/Users/azzedinezazai/Documents/Agency-Killer-V4/MCP_SERVERS_SPECS_SORA.md`
- **System prompt Sora:** `/Users/azzedinezazai/Documents/Agency-Killer-V4/SORA_SYSTEM_PROMPT_FINAL_V4.5.txt`
- **Catégorisation tâches:** `/Users/azzedinezazai/Documents/Agency-Killer-V4/SORA_TASKS_CATEGORIZATION.md`
- **Guide complet setup logic:** `/Users/azzedinezazai/Documents/Agency-Killer-V4/SYSTEM_PROMPTS_SETUP_LOGIC.md`

---

**Créé par Claude Code - The Hive OS V4.5**
**Date:** 2026-02-09
