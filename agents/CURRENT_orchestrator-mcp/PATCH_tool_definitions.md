# PATCH: Tool Definitions avec Shared Memory

## Instructions pour mettre à jour les tools dans n8n

Chaque tool (call_analyst, call_strategist, call_creative, call_trader) doit être mis à jour pour passer le contexte projet aux agents spécialistes.

---

## 1. Tool: Call Analyst (Sora)

**Configuration n8n:**

```
Name: call_analyst
Description: Appelle Sora (The Analyst) pour les questions sur les CHIFFRES, le TRAFIC, les VENTES, le BILAN, le ROAS, le CPA, et toutes les METRIQUES de performance. INCLURE le contexte projet dans la query.

Fields:
- query (string, required): La question + contexte projet
- session_id (string, optional): ID de session pour la mémoire
- project_id (string, optional): ID du projet pour l'isolation
- shared_memory (json, optional): Contexte complet du projet
```

---

## 2. Tool: Call Strategist (Luna)

**Configuration n8n:**

```
Name: call_strategist
Description: Appelle Luna (The Strategist) pour les questions sur la CONCURRENCE, le SEO, les TENDANCES, les GOOGLE UPDATES. INCLURE le contexte projet et les concurrents dans la query.

Fields:
- query (string, required): La question + contexte projet
- session_id (string, optional): ID de session pour la mémoire
- project_id (string, optional): ID du projet pour l'isolation
- shared_memory (json, optional): Contexte complet du projet
```

---

## 3. Tool: Call Creative (Milo)

**Configuration n8n:**

```
Name: call_creative
Description: Appelle Milo (The Creative) pour les demandes de VISUELS, PUBLICITES, AD COPY. INCLURE le contexte de marque (USP, persona, ton) dans la query.

Fields:
- query (string, required): La demande + contexte marque
- format (string, optional): Format demandé (banner, video, copy)
- session_id (string, optional): ID de session
- project_id (string, optional): ID du projet
- shared_memory (json, optional): Contexte complet (inclut USP, persona, etc.)
```

---

## 4. Tool: Call Trader (Marcus)

**Configuration n8n:**

```
Name: call_trader
Description: Appelle Marcus (The Trader) pour la GESTION DE BUDGET, COUPER une campagne, SCALER. INCLURE le budget et les objectifs ROAS dans la query.

Fields:
- query (string, required): La demande + contexte budget
- action (string, optional): Action demandée (cut, scale, analyze)
- session_id (string, optional): ID de session
- project_id (string, optional): ID du projet
- shared_memory (json, optional): Contexte complet (inclut budget, ROAS cible)
```

---

## Comment appliquer le patch

### Dans n8n:

1. Ouvrir le workflow "Orchestrator V5 - Agency Killer Core"

2. Pour chaque node Tool (call_analyst, call_strategist, call_creative, call_trader):
   - Cliquer sur le node
   - Aller dans Parameters > Fields
   - Ajouter les nouveaux champs: `project_id`, `shared_memory`

3. Mettre à jour le node "Load Global Context":
   - Remplacer le code par le contenu de `PATCH_shared_memory.js`

4. Mettre à jour le node "Inject System Prompt":
   - Remplacer le code par le contenu de `PATCH_inject_system_prompt.js`

5. Sauvegarder et activer le workflow

---

## Vérification

Après avoir appliqué le patch, vérifier dans les logs n8n que:

1. `shared_memory` apparaît dans les données entrantes
2. `project_context_string` est bien injecté dans le system prompt
3. Les tools reçoivent le `project_id` pour l'isolation

---

## Isolation Mémoire Garantie

Avec ces patches:
- Chaque projet a son propre session_id: `${project_id}-${agent}-session`
- Les agents reçoivent le contexte du projet actif uniquement
- Pas de mélange entre les contextes de différents projets
