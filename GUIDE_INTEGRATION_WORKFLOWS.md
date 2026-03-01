# 🔧 GUIDE - Mise à Jour Workflows PM et Orchestrator

## Vue d'ensemble

Ce guide explique comment ajouter la détection des intégrations (Meta Ads, GA4, GSC, GBP) aux workflows PM et Orchestrator pour guider proactivement les utilisateurs vers la page Integrations.

---

## 1. ORCHESTRATOR - Ajout du tool `check_integrations`

### 1.1 Nouveau Node à Ajouter

**Type**: `@n8n/n8n-nodes-langchain.toolCode`
**Name**: `Tool: Check Integrations`
**Position**: `[1200, 800]` (en dessous de "Tool: Call Trader")

**Parameters**:
```json
{
  "name": "check_integrations",
  "description": "Vérifie quelles intégrations (Meta Ads, Google Analytics 4, Google Search Console, Google Business Profile) sont connectées pour le projet actuel. Utilise cet outil AVANT de proposer des actions qui nécessitent ces intégrations.",
  "code": "// Tool code here (voir section suivante)"
}
```

### 1.2 Code du Tool

```javascript
// ============================================================
// TOOL: CHECK INTEGRATIONS (Orchestrator)
// Vérifie les connexions Meta Ads, GA4, GSC, GBP
// ============================================================

const { project_id } = $input.json;

if (!project_id) {
  return {
    success: false,
    error: "project_id manquant"
  };
}

// TODO: En production, faire un vrai appel à Supabase
// const { data, error } = await supabase
//   .from('user_integrations')
//   .select('integration_type, status')
//   .eq('project_id', project_id)
//   .eq('status', 'connected');

// Pour l'instant, simuler
const mockIntegrations = [
  // Décommenter pour tester :
  // { integration_type: 'meta_ads', status: 'connected' },
  // { integration_type: 'google_analytics_4', status: 'connected' },
  // { integration_type: 'google_search_console', status: 'connected' },
  // { integration_type: 'google_business_profile', status: 'connected' },
];

const result = {
  project_id,
  integrations: {
    meta_ads: mockIntegrations.some(i => i.integration_type === 'meta_ads'),
    google_analytics_4: mockIntegrations.some(i => i.integration_type === 'google_analytics_4'),
    google_search_console: mockIntegrations.some(i => i.integration_type === 'google_search_console'),
    google_business_profile: mockIntegrations.some(i => i.integration_type === 'google_business_profile')
  },
  has_any: mockIntegrations.length > 0,
  message: mockIntegrations.length === 0
    ? "Aucune intégration connectée. L'utilisateur doit aller dans Intégrations pour connecter ses comptes."
    : `${mockIntegrations.length} intégration(s) connectée(s).`
};

return result;
```

### 1.3 JSON Schema Example

```json
{
  "project_id": "uuid-project-123"
}
```

### 1.4 Connexion

Connecte le node `Tool: Check Integrations` au `AI Agent Router` via le port `ai_tool`.

---

## 2. ORCHESTRATOR - Mise à Jour du System Prompt

Dans le node `Inject System Prompt`, remplace le système prompt par :

```javascript
const ORCHESTRATOR_SYSTEM_PROMPT = `Tu es le DIRECTEUR DE STRATEGIE de "The Hive" - Agency Killer V4.

## DELEGATION PROTOCOL - REGLE ABSOLUE

Tu es le chef d'orchestre. NE REPONDS PAS toi-meme aux questions techniques.
Ta valeur ajoutee est de CHOISIR LE BON EXPERT, pas de faire le travail.

### REGLES DE DELEGATION IMMEDIATE

1. **AUDIT / CHIFFRES / PERFORMANCE** → Delegue a call_analyst
   - Questions sur: trafic, ventes, ROAS, CPA, metriques, bilan, rapport
   - ⚠️ AVANT de deleguer: Verifie si GA4/GSC est connecte avec check_integrations
   - JAMAIS tu ne calcules toi-meme les KPIs

2. **CONCURRENCE / SEO / TENDANCES** → Delegue a call_strategist
   - Questions sur: concurrents, Google Updates, marche, veille, strategie
   - ⚠️ AVANT de deleguer: Verifie si GSC est connecte avec check_integrations
   - JAMAIS tu ne fais de recherche toi-meme

3. **VISUELS / PUBLICITES / CREATIONS** → Delegue a call_creative
   - Demandes de: banniere, image, video, ad copy, headline
   - JAMAIS tu ne rediges de copy toi-meme
   - Note: Utilise Nano Banana Pro pour la generation

4. **BUDGET / CAMPAGNES / SCALING** → Delegue a call_trader
   - Questions sur: couper campagne, scaler, budget, ROAS campagne
   - ⚠️ AVANT de deleguer: Verifie si Meta Ads/GBP est connecte avec check_integrations
   - JAMAIS tu ne prends de decision budgetaire toi-meme

### OUTILS DISPONIBLES

Tu disposes de 5 outils que tu DOIS utiliser:
- check_integrations: Pour verifier les connexions disponibles AVANT de deleguer
- call_analyst: Pour toute question sur les donnees et performances
- call_strategist: Pour toute question sur la concurrence et le SEO
- call_creative: Pour toute demande de creation visuelle ou textuelle
- call_trader: Pour toute decision de budget ou gestion de campagne

### GESTION DES INTEGRATIONS MANQUANTES

Si check_integrations indique qu'une integration necessaire n'est PAS connectee:

**Pour Meta Ads/GBP manquant:**
"🔌 **Intégration requise**

Je ne peux pas [action demandée] car ton compte [Meta Ads/Google Business Profile] n'est pas connecté.

**Pour connecter tes comptes :**
1. Va dans **Intégrations** (icône 🔌 en haut à droite)
2. Clique sur **Connecter** pour [Meta Ads/Google Business Profile]
3. Autorise l'accès à ton compte
4. Reviens me parler une fois connecté !

C'est rapide (moins de 2 minutes) et tes identifiants sont chiffrés et sécurisés."

**Pour GA4/GSC manquant:**
"🔌 **Intégration requise**

Je ne peux pas [action demandée] car ton compte [Google Analytics 4/Search Console] n'est pas connecté.

**Pour connecter tes comptes :**
1. Va dans **Intégrations** (icône 🔌 en haut à droite)
2. Clique sur **Connecter** pour [Google Analytics 4/Search Console]
3. Autorise l'accès à ton compte Google
4. Reviens me parler une fois connecté !

C'est rapide (moins de 2 minutes) et tes identifiants sont chiffrés et sécurisés."

### FORMAT DE REPONSE

Quand tu delegues, explique BRIEVEMENT pourquoi tu mobilises cet expert.
Exemple: "Je mobilise The Analyst pour diagnostiquer votre baisse de ROAS."

Si la demande est vague ou de type "bonjour", presente le menu des services.

### CE QUE TU FAIS TOI-MEME

- Accueillir et orienter l'utilisateur
- Presenter le menu des services
- Verifier les integrations connectees
- Guider vers la page Integrations si necessaire
- Synthetiser les resultats des experts
- Recommander des combinaisons d'experts (multi-agent)
- Challenger les mauvaises decisions

## CONTEXTE MARQUE
- Brand: ${context.brand_memory.identity.name}
- Tone: ${context.brand_memory.identity.tone}
- Primary KPI: ${context.brand_memory.objectives.primary_kpi}
- Target ROAS: ${context.brand_memory.objectives.targets.roas}x
- Max CPA: ${context.brand_memory.objectives.targets.cpa}EUR`;
```

---

## 3. PM - Mise à Jour du System Prompt

Le workflow PM ne dialogue pas directement avec l'utilisateur, mais il peut enrichir le contexte pour l'Orchestrator.

Dans le node `PM System Prompt`, ajoute cette section AVANT "## DEMANDE UTILISATEUR" :

```
## INTEGRATIONS DISPONIBLES

Avant de router vers un agent, prends en compte les intégrations connectées :
- **meta_ads** → Requis pour Marcus (campagnes publicitaires)
- **google_analytics_4** → Requis pour Sora (analyse trafic)
- **google_search_console** → Requis pour Sora (SEO)
- **google_business_profile** → Requis pour Marcus (présence locale)

Si une tâche nécessite une intégration qui n'est PAS connectée, ajoute dans `context_enrichment` :
"⚠️ Attention : L'utilisateur devra connecter [nom de l'intégration] dans la page Intégrations avant de commencer cette tâche."
```

---

## 4. TESTS

### Test 1 : Orchestrator détecte l'intégration manquante

**Request** :
```bash
curl -X POST https://votre-n8n.com/webhook/orchestrator-v5-entry \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Analyse mes performances Meta",
    "project_id": "test-proj-123"
  }'
```

**Résultat attendu** :
```json
{
  "chat_message": "🔌 **Intégration requise**\n\nJe ne peux pas analyser tes performances Meta car ton compte Meta Ads n'est pas connecté...",
  "meta": {
    "agent_id": "orchestrator",
    "integrations_checked": true,
    "integrations_missing": ["meta_ads"]
  }
}
```

### Test 2 : Avec intégration connectée (simulée)

Dans le code du tool, décommenter :
```javascript
const mockIntegrations = [
  { integration_type: 'meta_ads', status: 'connected' },
];
```

**Request** (même que ci-dessus)

**Résultat attendu** :
L'Orchestrator délègue normalement à l'Analyst/Trader.

---

## 5. DÉPLOIEMENT

### Orchestrator

1. Ouvre le workflow `Orchestrator V5 - Agency Killer Core` dans n8n
2. Ajoute le node `Tool: Check Integrations` (voir section 1.1)
3. Connecte-le à `AI Agent Router` via `ai_tool`
4. Mets à jour le system prompt dans `Inject System Prompt`
5. Sauvegarde et active le workflow

### PM (Optionnel)

1. Ouvre le workflow `PM Central Brain - Agency Killer V4.3` dans n8n
2. Mets à jour le system prompt dans `PM System Prompt`
3. Sauvegarde et active le workflow

---

## 6. MIGRATION VERS PRODUCTION

Une fois que tu as configuré les OAuth credentials (Meta + Google) et que le .env est rempli, remplace le code du tool `check_integrations` par :

```javascript
// VERSION PRODUCTION avec Supabase
const { project_id } = $input.json;

if (!project_id) {
  return {
    success: false,
    error: "project_id manquant"
  };
}

// Appel Supabase réel
const response = await fetch(`https://VOTRE_SUPABASE_URL/rest/v1/user_integrations?project_id=eq.${project_id}&status=eq.connected&select=integration_type,status`, {
  headers: {
    'apikey': 'VOTRE_SUPABASE_ANON_KEY',
    'Authorization': `Bearer VOTRE_SUPABASE_ANON_KEY`
  }
});

const integrations = await response.json();

const result = {
  project_id,
  integrations: {
    meta_ads: integrations.some(i => i.integration_type === 'meta_ads'),
    google_analytics_4: integrations.some(i => i.integration_type === 'google_analytics_4'),
    google_search_console: integrations.some(i => i.integration_type === 'google_search_console'),
    google_business_profile: integrations.some(i => i.integration_type === 'google_business_profile')
  },
  has_any: integrations.length > 0,
  message: integrations.length === 0
    ? "Aucune intégration connectée."
    : `${integrations.length} intégration(s) connectée(s).`
};

return result;
```

---

**TOUT EST PRÊT ! 🚀**
