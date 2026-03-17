# 🧪 TEST END-TO-END: Contexte Genesis → Agent

**Date**: 2026-03-16
**Objectif**: Vérifier que les agents ont accès à TOUTES les réponses Genesis

---

## ✅ Modifications Appliquées

### 1. Frontend (`/cockpit/src/services/api.ts`)
- **Modifié `transformSharedMemory()`** pour extraire les réponses Genesis depuis `metadata`
- Les champs sont maintenant envoyés au niveau racine du payload (pas nested)
- Mapping intelligent des champs:
  - `industry` → depuis `metadata.industry`
  - `target_audience` → depuis `metadata.target_audience` OU `metadata.persona`
  - `brand_voice` → depuis `metadata.brand_tone` OU `metadata.editorial_tone`
  - `budget` → depuis `metadata.budget_monthly`
  - `goals` → depuis `metadata.businessGoal` (converti en array)
  - `kpis` → depuis `metadata.conversion_goals`
  - `timeline` → depuis `metadata.campaign_launch_date`

### 2. Backend (`/backend/src/agents/agent-executor.ts`)
- **Ajout de logs de debugging** dans `buildSystemPrompt()`
- Affiche les valeurs injectées dans le system prompt
- Permet de vérifier que le contexte Genesis est bien transmis

### 3. Backend (`/backend/src/agents/orchestrator.ts`)
- **Ajout de logs de debugging** dans `processChat()`
- Affiche le contexte reçu du frontend
- Permet de vérifier que `transformSharedMemory()` fonctionne

---

## 📋 Plan de Test End-to-End

### ÉTAPE 1: Créer un Nouveau Projet Social Media

1. Aller sur http://localhost:5173
2. Cliquer sur "Nouveau projet"
3. Sélectionner **"Social Media"**
4. Remplir les informations du projet:
   - **Nom**: "Test Contexte Genesis"
   - **Deadline**: Aujourd'hui + 30 jours
5. **IMPORTANT**: Remplir TOUTES les questions Genesis avec des réponses distinctives:

   **Exemple de réponses:**
   - **Industry**: `E-commerce de mode`
   - **Target Audience**: `Femmes 25-35 ans urbaines`
   - **Brand Tone**: `Inspirational`
   - **Business Goal**: `Augmenter engagement de 50% en 3 mois`
   - **Website URL**: `https://example-fashion.com`
   - **USP**: `Mode éthique et accessible`

6. Valider et créer le projet

---

### ÉTAPE 2: Lancer une Tâche avec Doffy

1. Une fois sur le board, cliquer sur la première tâche Doffy:
   - Exemple: "📱 Audit Présence Social Media Actuelle"
2. Le chat s'ouvre avec le message d'attente (avatar animé ✓)
3. **Attendre la réponse de Doffy**

---

### ÉTAPE 3: Vérifier les Logs Backend

**Ouvrir le terminal où le backend tourne** et chercher ces logs:

#### 3.1 Contexte reçu du frontend (Orchestrator)
```
[Orchestrator] Genesis context received: {
  project_name: 'Test Contexte Genesis',
  industry: 'E-commerce de mode',  // ✅ Doit être rempli
  target_audience: 'Femmes 25-35 ans urbaines',  // ✅ Doit être rempli
  brand_voice: 'Inspirational',  // ✅ Doit être rempli
  budget: 0,
  has_metadata: true,
  metadata_keys: [ 'industry', 'target_audience', 'brand_tone', ... ]
}
```

#### 3.2 Contexte injecté dans le system prompt (Agent Executor)
```
[Agent Executor] Context injected into system prompt: {
  project_name: 'Test Contexte Genesis',
  industry: 'E-commerce de mode',  // ✅ Doit être rempli
  target_audience: 'Femmes 25-35 ans urbaines',  // ✅ Doit être rempli
  brand_voice: 'Inspirational',  // ✅ Doit être rempli
  budget: '0',
  goals: 'Augmenter engagement de 50% en 3 mois',  // ✅ Doit être rempli
  kpis: '(empty)',
  timeline: '(empty)'
}
```

---

### ÉTAPE 4: Vérifier la Réponse de Doffy

**Doffy DOIT mentionner le contexte Genesis dans sa réponse.**

#### ✅ Exemples de réponse CORRECTE (avec contexte):
> "Bonjour ! Je suis Doffy, votre Social Media Manager. 📱
>
> Je vois que nous travaillons pour votre marque de **mode éthique et accessible** ciblant les **femmes 25-35 ans urbaines**. Votre objectif est clair : **augmenter l'engagement de 50% en 3 mois**.
>
> Pour auditer votre présence actuelle sur les réseaux sociaux, j'ai besoin de quelques informations..."

#### ❌ Exemple de réponse INCORRECTE (sans contexte):
> "Bonjour ! Je suis Doffy, votre Social Media Manager.
>
> Pour auditer votre présence sur les réseaux sociaux, j'ai besoin de quelques informations sur votre entreprise, votre audience cible, et vos objectifs..."

**Si Doffy demande des infos déjà données dans Genesis → LE CONTEXTE N'EST PAS TRANSMIS**

---

### ÉTAPE 5: Test de Suivi (Optional mais Recommandé)

Envoyez un message de suivi pour tester la persistance du contexte:

**Message**: `Rappelle-moi mon audience cible et mon objectif principal`

**Réponse attendue** (Doffy doit se souvenir):
> "Bien sûr !
>
> - **Audience cible**: Femmes 25-35 ans urbaines
> - **Objectif principal**: Augmenter l'engagement de 50% en 3 mois
>
> C'est pour cela que nous..."

---

## 🐛 Debugging en Cas de Problème

### Problème 1: Logs "industry: (empty)" dans le backend

**Cause**: Le frontend n'envoie pas les champs extraits depuis metadata

**Solution**:
1. Vérifier que le frontend a bien hot-reload (rafraîchir la page http://localhost:5173)
2. Vérifier dans la console navigateur (F12 → Network → Payload du POST /api/chat)
3. Chercher `shared_memory.industry` dans le payload - doit être rempli

### Problème 2: Logs "has_metadata: false"

**Cause**: Le projet n'a pas de metadata (questions Genesis pas remplies)

**Solution**:
1. Créer un NOUVEAU projet (pas réutiliser un ancien)
2. Remplir TOUTES les questions Genesis
3. Vérifier dans Supabase (Table `projects` → colonne `metadata`)

### Problème 3: Doffy ne mentionne pas le contexte

**Cause**: System prompt mal formaté OU champs vides

**Solution**:
1. Vérifier les logs `[Agent Executor] Context injected`
2. Si les champs sont vides → problème frontend
3. Si les champs sont remplis MAIS Doffy ne les utilise pas → problème de system prompt template

---

## 📊 Critères de Succès

### ✅ Test RÉUSSI si:
1. Logs backend montrent `industry`, `target_audience`, `brand_voice` **remplis** (pas "(empty)")
2. Logs backend montrent `has_metadata: true` avec keys non vides
3. Doffy **mentionne explicitement** les informations Genesis (audience, objectif, etc.)
4. Doffy ne redemande PAS d'infos déjà fournies dans Genesis

### ❌ Test ÉCHOUÉ si:
1. Logs montrent "(empty)" pour tous les champs contexte
2. Doffy demande des infos déjà données (industrie, audience, objectif)
3. Doffy donne une réponse générique sans personnalisation

---

## 🔄 Prochaines Étapes (Si Test Réussi)

1. Tester avec d'autres agents (Luna, Sora, Marcus, Milo)
2. Tester avec d'autres scopes (Meta Ads, SEM, SEO)
3. Vérifier que le contexte persiste dans toute la conversation
4. Nettoyer les logs de debugging (optionnel)

---

**Note**: Les logs de debugging ajoutés peuvent être retirés plus tard. Ils sont utiles pour valider que le flow fonctionne correctement.
