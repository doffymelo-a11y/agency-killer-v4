# 🔐 GUIDE COMPLET: Configuration des Credentials (NOOB-FRIENDLY)

**Ce guide est fait pour toi si tu débutes avec n8n et les APIs.**

**Durée estimée:** 45 minutes à 1 heure (la première fois)

**Prérequis:**
- ✅ Un compte Google Cloud (gratuit)
- ✅ Un compte Meta Business Manager
- ✅ Un compte ElevenLabs (gratuit ou payant)
- ✅ n8n installé et fonctionnel

---

## 📋 TABLE DES MATIÈRES

1. [Vue d'ensemble](#1-vue-densemble)
2. [Configuration n8n (Variables d'Environnement)](#2-configuration-n8n-variables-denvironnement)
3. [Obtenir les Clés API](#3-obtenir-les-clés-api)
4. [Importer les Workflows](#4-importer-les-workflows)
5. [Tester que Tout Fonctionne](#5-tester-que-tout-fonctionne)
6. [Dépannage (Troubleshooting)](#6-dépannage-troubleshooting)

---

## 1. Vue d'Ensemble

### Qu'est-ce qu'on va faire ?

On va donner à tes agents (MILO et SORA) l'accès aux services externes :
- **MILO** → Google Gemini (pour générer images/vidéos) + ElevenLabs (pour l'audio)
- **SORA** → Google Tag Manager, Google Ads, Meta Ads, Looker Studio

### Comment ça marche ?

Les clés API sont des "mots de passe" qui permettent à n8n d'accéder aux services.

**Analogie simple:**
- **n8n** = Ton assistant
- **Clé API** = Badge d'accès que tu donnes à ton assistant
- **Service (Google, Meta, etc.)** = Bâtiment sécurisé

Ton assistant (n8n) utilise le badge (clé API) pour entrer dans le bâtiment (service) et faire le travail.

---

## 2. Configuration n8n (Variables d'Environnement)

### 🤔 C'est quoi une "Variable d'Environnement" ?

C'est un endroit sécurisé dans n8n où tu stockes tes clés API. Comme un coffre-fort.

**Avantage:** Tu n'as à entrer tes clés qu'UNE SEULE FOIS, et tous tes workflows peuvent les utiliser.

---

### 📍 Méthode 1: Via l'Interface n8n (RECOMMANDÉ pour débutants)

**Étape 1:** Ouvre n8n dans ton navigateur
- URL: `http://localhost:5678` (si en local)
- OU ton URL n8n si hébergé ailleurs

**Étape 2:** Va dans les Settings
- Clique sur ton **avatar/nom** en haut à droite
- Clique sur **"Settings"**

**Étape 3:** Va dans "Variables"
- Dans le menu de gauche, clique sur **"Variables"** ou **"Environment Variables"**

**Étape 4:** Ajoute les variables suivantes

Pour chaque variable, clique sur **"+ Add Variable"** et entre :

#### Variables pour MILO (Creative)

| Nom de la Variable | Description | Exemple (ne pas copier) |
|-------------------|-------------|------------------------|
| `GOOGLE_API_KEY` | Clé API Google Cloud (Gemini/Imagen) | `AIzaSyXXXXXXXXXXXXXXXXXXXXXXX` |
| `ELEVENLABS_API_KEY` | Clé API ElevenLabs | `sk_XXXXXXXXXXXXXXXXXXXX` |

#### Variables pour SORA (Analyst)

| Nom de la Variable | Description | Exemple (ne pas copier) |
|-------------------|-------------|------------------------|
| `GOOGLE_DEVELOPER_TOKEN` | Developer Token Google Ads | `XXXXXXXXXXXXXXXXXXXX` |

**IMPORTANT:**
- ❌ Ne mets PAS les exemples ci-dessus (ce sont des faux)
- ✅ Entre TES vraies clés (on va les obtenir dans la section 3)

**Étape 5:** Sauvegarde
- Clique sur **"Save"** après chaque variable ajoutée
- ⚠️ **Redémarre n8n** pour que les variables soient prises en compte

**Comment redémarrer n8n ?**
- Si Docker: `docker-compose restart n8n`
- Si systemd: `sudo systemctl restart n8n`
- Si npm: Arrête (Ctrl+C) et relance `n8n start`

---

### 📍 Méthode 2: Via Fichier .env (Pour utilisateurs avancés)

**Si tu préfères éditer un fichier:**

**Étape 1:** Trouve ton fichier `.env` de n8n
- Souvent dans: `/home/user/.n8n/.env`
- Ou dans le dossier de ton projet n8n

**Étape 2:** Ouvre le fichier avec un éditeur de texte

**Étape 3:** Ajoute ces lignes à la fin du fichier

```bash
# ============================================
# MILO (Creative) - API Keys
# ============================================
GOOGLE_API_KEY=REMPLACE_PAR_TA_VRAIE_CLE
ELEVENLABS_API_KEY=REMPLACE_PAR_TA_VRAIE_CLE

# ============================================
# SORA (Analyst) - API Keys
# ============================================
GOOGLE_DEVELOPER_TOKEN=REMPLACE_PAR_TON_VRAI_TOKEN
```

**Étape 4:** Sauvegarde le fichier

**Étape 5:** Redémarre n8n (comme expliqué ci-dessus)

---

## 3. Obtenir les Clés API

Maintenant on va chercher les vraies clés API. **Prends ton temps, suis chaque étape.**

---

### 🔑 A. Google API Key (pour MILO - Gemini/Imagen/Veo)

**Ce qu'on va faire:** Créer un projet Google Cloud et obtenir une clé API.

#### Étape 1: Aller sur Google Cloud Console

1. Ouvre ton navigateur
2. Va sur: **https://console.cloud.google.com/**
3. Connecte-toi avec ton compte Google

#### Étape 2: Créer un Projet (si tu n'en as pas)

1. En haut de la page, clique sur **"Sélectionner un projet"**
2. Clique sur **"Nouveau projet"**
3. Donne-lui un nom: `"The-Hive-OS"` (ou ce que tu veux)
4. Clique sur **"Créer"**
5. Attends 10-15 secondes que le projet soit créé

#### Étape 3: Sélectionner ton Projet

1. Clique à nouveau sur **"Sélectionner un projet"**
2. Choisis le projet que tu viens de créer: `"The-Hive-OS"`

#### Étape 4: Activer les APIs nécessaires

1. Dans le menu de gauche, clique sur **"APIs et services"** > **"Bibliothèque"**
2. Cherche et active ces APIs (une par une):
   - **"Generative Language API"** (pour Gemini/Imagen)
   - **"Vertex AI API"** (pour Veo-3)
   - Clique sur chaque API → Clique sur **"Activer"**

#### Étape 5: Créer une Clé API

1. Dans le menu de gauche, clique sur **"APIs et services"** > **"Identifiants"**
2. En haut, clique sur **"+ Créer des identifiants"**
3. Choisis **"Clé API"**
4. Une popup s'affiche avec ta clé API (commence par `AIzaSy...`)
5. **COPIE LA CLÉ** et colle-la quelque part temporairement (bloc-notes)

⚠️ **IMPORTANT:** Garde cette clé secrète, ne la partage jamais publiquement.

#### Étape 6: Restreindre la Clé (Sécurité)

1. Clique sur **"Restreindre la clé"** dans la popup
2. Sous **"Restrictions relatives aux API"**, choisis **"Restreindre la clé"**
3. Sélectionne les APIs que tu as activées:
   - Generative Language API
   - Vertex AI API
4. Clique sur **"Enregistrer"**

✅ **Terminé !** Tu as ta `GOOGLE_API_KEY`

**Colle-la dans n8n:**
- Nom de la variable: `GOOGLE_API_KEY`
- Valeur: `AIzaSy...` (ta clé)

---

### 🔑 B. ElevenLabs API Key (pour MILO - Audio/Voix)

**Ce qu'on va faire:** Obtenir ta clé API ElevenLabs.

#### Étape 1: Créer un Compte ElevenLabs

1. Va sur: **https://elevenlabs.io/**
2. Clique sur **"Sign Up"** (ou "Get Started")
3. Crée un compte (gratuit ou payant selon tes besoins)

#### Étape 2: Aller dans Profile Settings

1. Une fois connecté, clique sur ton **avatar/profil** en haut à droite
2. Clique sur **"Profile Settings"** ou **"Profile + API Key"**

#### Étape 3: Copier ta Clé API

1. Tu verras une section **"API Key"**
2. Clique sur **"Copy"** ou sélectionne la clé et copie-la (commence par `sk_...`)
3. **COPIE LA CLÉ** et colle-la temporairement

✅ **Terminé !** Tu as ta `ELEVENLABS_API_KEY`

**Colle-la dans n8n:**
- Nom de la variable: `ELEVENLABS_API_KEY`
- Valeur: `sk_...` (ta clé)

---

### 🔑 C. Google Developer Token (pour SORA - Google Ads)

**⚠️ ATTENTION:** Le Developer Token Google Ads nécessite d'avoir un compte Google Ads avec des dépenses publicitaires.

#### Si tu n'as PAS encore de compte Google Ads actif:

**Option 1:** Utilise un Developer Token de test
- Va sur: https://developers.google.com/google-ads/api/docs/first-call/dev-token
- Demande un **Developer Token de test**
- Ce token fonctionne uniquement avec des comptes test

**Option 2:** Créer un compte Google Ads et dépenser quelques euros
- Va sur: https://ads.google.com/
- Crée un compte
- Lance une petite campagne (5-10€)
- Ensuite, demande le Developer Token

#### Si tu as DÉJÀ un compte Google Ads actif:

#### Étape 1: Aller dans Google Ads

1. Va sur: **https://ads.google.com/**
2. Connecte-toi

#### Étape 2: Aller dans API Center

1. Clique sur **"Outils et paramètres"** (icône clé à molette en haut)
2. Sous **"Configuration"**, clique sur **"API Center"**

#### Étape 3: Demander un Developer Token

1. Clique sur **"Request developer token"**
2. Remplis le formulaire
3. Google va examiner ta demande (peut prendre 1-2 jours ouvrés)

#### Étape 4: Copier le Token

1. Une fois approuvé, tu verras ton **Developer Token**
2. **COPIE LE TOKEN**

✅ **Terminé !** Tu as ton `GOOGLE_DEVELOPER_TOKEN`

**Colle-le dans n8n:**
- Nom de la variable: `GOOGLE_DEVELOPER_TOKEN`
- Valeur: `(ton token)`

⚠️ **Note:** Si tu n'as pas encore de Developer Token, tu peux **ignorer cette étape pour l'instant**. Les fonctionnalités Google Ads de SORA ne fonctionneront pas, mais le reste oui.

---

### 🔑 D. Meta Access Token (pour SORA - Meta Ads)

**Ce qu'on va faire:** Obtenir un Access Token Meta pour lire tes données publicitaires.

#### Étape 1: Aller sur Meta for Developers

1. Va sur: **https://developers.facebook.com/**
2. Connecte-toi avec ton compte Facebook

#### Étape 2: Créer une App (si tu n'en as pas)

1. Clique sur **"My Apps"** en haut à droite
2. Clique sur **"Create App"**
3. Choisis **"Business"** comme type d'app
4. Donne un nom: `"The-Hive-OS-SORA"`
5. Clique sur **"Create App"**

#### Étape 3: Ajouter le Produit "Marketing API"

1. Dans ton app, cherche **"Marketing API"** dans la liste des produits
2. Clique sur **"Set Up"**

#### Étape 4: Générer un Access Token

1. Va dans **"Tools"** > **"Graph API Explorer"**
2. En haut, sélectionne ton app dans **"Meta App"**
3. Clique sur **"Generate Access Token"**
4. Coche les permissions:
   - `ads_read`
   - `ads_management`
   - `business_management`
5. Clique sur **"Generate Token"**
6. **COPIE LE TOKEN** (commence par `EAA...`)

⚠️ **ATTENTION:** Ce token expire après 1-2 heures. Pour un token permanent:
1. Va sur: https://developers.facebook.com/tools/explorer/
2. Clique sur **"User Token"** > **"Get Long-Lived Token"**
3. Copie le nouveau token (expire après 60 jours)

✅ **Terminé !** Tu as ton `META_ACCESS_TOKEN`

**⚠️ Note:** Pour SORA, on utilisera plutôt **OAuth2 credentials** dans n8n (auto-refresh). Je t'expliquerai comment configurer ça dans la section suivante.

---

## 4. Importer les Workflows

Maintenant qu'on a les clés, on va importer les workflows MILO et SORA dans n8n.

### Étape 1: Télécharger les Workflows

Les workflows sont déjà créés dans ton dossier projet:
- **MILO:** `/agents/CURRENT_milo-creative/milo-creative-v4-with-toolcode.workflow.json`
- **SORA:** `/agents/CURRENT_analyst-mcp/analyst-core-v4.5-with-tools.workflow.json`

### Étape 2: Aller dans n8n

1. Ouvre n8n dans ton navigateur
2. Clique sur **"Workflows"** dans le menu de gauche

### Étape 3: Importer MILO

1. Clique sur **"Import from File"** (ou "Add Workflow" > "Import from File")
2. Sélectionne le fichier: `milo-creative-v4-with-toolcode.workflow.json`
3. Clique sur **"Import"**
4. Le workflow s'ouvre automatiquement

### Étape 4: Vérifier que les Variables sont Bien Chargées

1. Dans le workflow MILO, clique sur le node **"Tool: Nano Banana Pro"**
2. Fais défiler le code JavaScript
3. Cherche la ligne: `const GOOGLE_API_KEY = $env.GOOGLE_API_KEY;`
4. **C'est bon !** Le workflow utilise bien la variable d'environnement

### Étape 5: Sauvegarder le Workflow

1. En haut à droite, clique sur **"Save"**
2. Donne un nom: `"Milo - Creative Designer V4"`

### Étape 6: Répéter pour SORA

1. Répète les étapes 3-5 pour le workflow SORA
2. Nom du workflow: `"Sora - Analyst MCP V5"`

✅ **Terminé !** Les workflows sont importés.

---

## 5. Tester que Tout Fonctionne

Maintenant on teste chaque agent pour vérifier que les clés API fonctionnent.

### Test 1: MILO - Génération d'Image (Nano Banana Pro)

#### Étape 1: Ouvrir le Workflow MILO

1. Dans n8n, ouvre le workflow **"Milo - Creative Designer V4"**

#### Étape 2: Activer le Mode Test

1. Clique sur le node **"Webhook Trigger"** (le premier node en haut à gauche)
2. En bas, tu verras une URL de test (ex: `https://ton-n8n.com/webhook-test/milo-creative`)
3. **Copie cette URL**

#### Étape 3: Envoyer une Requête Test

Tu peux utiliser **Postman**, **Insomnia**, ou **curl** (ligne de commande).

**Avec curl (dans le terminal):**

```bash
curl -X POST https://ton-n8n.com/webhook-test/milo-creative \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "test-123",
    "task_title": "Test Génération Image",
    "message": "Génère une image professionnelle de smartphone sur fond blanc"
  }'
```

**Avec Postman:**
1. Crée une nouvelle requête **POST**
2. URL: `https://ton-n8n.com/webhook-test/milo-creative`
3. Body (JSON):
```json
{
  "project_id": "test-123",
  "task_title": "Test Génération Image",
  "message": "Génère une image professionnelle de smartphone sur fond blanc"
}
```
4. Clique sur **"Send"**

#### Étape 4: Vérifier le Résultat

1. Dans n8n, va dans **"Executions"** (menu de gauche)
2. Tu devrais voir une exécution récente du workflow MILO
3. Clique dessus
4. Vérifie que tous les nodes sont **VERTS** ✅
5. Clique sur le node **"Tool: Nano Banana Pro"**
6. Regarde la **sortie (output)**:
   - Si `success: true` → ✅ **Ça fonctionne !**
   - Si `error: "GOOGLE_API_KEY manquant"` → ❌ Reviens à la section 2 (Variables d'environnement)

---

### Test 2: SORA - Lecture Campaigns Google Ads

**⚠️ Skip ce test si tu n'as pas de Developer Token Google Ads.**

#### Étape 1: Ouvrir le Workflow SORA

1. Dans n8n, ouvre le workflow **"Sora - Analyst MCP V5"**

#### Étape 2: Configurer OAuth2 pour Google Ads

**SORA utilise OAuth2 (pas des variables d'environnement) pour Google Ads.**

1. Va dans **"Settings"** > **"Credentials"**
2. Clique sur **"+ Add Credential"**
3. Cherche **"Google OAuth2 API"**
4. Remplis:
   - **Client ID:** (de Google Cloud Console)
   - **Client Secret:** (de Google Cloud Console)
   - **Scopes:** `https://www.googleapis.com/auth/adwords`
5. Clique sur **"Connect my account"**
6. Autorise l'accès
7. Sauvegarde

#### Étape 3: Lier les Credentials au Workflow

1. Dans le workflow SORA, clique sur le node **"Tool: Google Ads Manager"**
2. ⚠️ **Note:** Les toolCode n'ont pas de section Credentials directe
3. Les credentials seront passés via le code (déjà configuré)

#### Étape 4: Tester

1. Envoie une requête test au webhook SORA (même principe que MILO)
2. Vérifie que `success: true`

---

## 6. Dépannage (Troubleshooting)

### Problème 1: "Error: GOOGLE_API_KEY manquant"

**Solution:**
1. Vérifie que tu as bien ajouté la variable dans n8n (Section 2)
2. Vérifie l'orthographe: `GOOGLE_API_KEY` (tout en majuscules)
3. Redémarre n8n
4. Re-teste

---

### Problème 2: "Error: Google API Error: 403 Forbidden"

**Solution:**
1. Vérifie que tu as activé les APIs dans Google Cloud Console (Section 3.A - Étape 4)
2. Vérifie que ta clé API a les restrictions correctes (Section 3.A - Étape 6)
3. Attends 1-2 minutes (les changements peuvent prendre du temps)

---

### Problème 3: "Error: ElevenLabs API Error: 401 Unauthorized"

**Solution:**
1. Vérifie que ta clé ElevenLabs est correcte (commence par `sk_`)
2. Vérifie que ton compte ElevenLabs est actif
3. Vérifie que tu as des crédits restants

---

### Problème 4: Variables d'Environnement Non Reconnues

**Solution:**
1. Redémarre n8n (OBLIGATOIRE après ajout de variables)
2. Vérifie que tu utilises `$env.NOM_VARIABLE` et non `process.env.NOM_VARIABLE`
3. Vérifie qu'il n'y a pas d'espaces dans le nom de la variable

---

### Problème 5: Workflow Ne Se Déclenche Pas

**Solution:**
1. Clique sur le node **"Webhook Trigger"**
2. Clique sur **"Execute Node"** (flèche verte)
3. Vérifie que l'URL du webhook est correcte
4. Vérifie que tu utilises la bonne méthode HTTP (POST)

---

## ✅ Checklist Finale

Avant de considérer que tout est OK, vérifie cette checklist:

### Variables d'Environnement
- [ ] `GOOGLE_API_KEY` ajoutée dans n8n
- [ ] `ELEVENLABS_API_KEY` ajoutée dans n8n
- [ ] `GOOGLE_DEVELOPER_TOKEN` ajoutée (si applicable)
- [ ] n8n redémarré après ajout des variables

### Workflows
- [ ] MILO workflow importé et sauvegardé
- [ ] SORA workflow importé et sauvegardé
- [ ] Webhooks activés (URLs visibles)

### Tests
- [ ] Test MILO - Nano Banana Pro → `success: true`
- [ ] Test MILO - ElevenLabs → `success: true`
- [ ] Test SORA - Check Integrations → `success: true`

### Sécurité
- [ ] Clés API gardées secrètes (pas partagées publiquement)
- [ ] Restrictions API activées dans Google Cloud Console

---

## 🎉 Félicitations !

Si tu es arrivé jusqu'ici et que tous les tests passent, **c'est gagné !** 🚀

Tes agents MILO et SORA sont maintenant connectés et peuvent utiliser les APIs externes.

**Prochaine étape:** On passe à LUNA (SEO Audit Tool) !

---

**Créé par:** Azzeddine Zazai
**Date:** 2026-02-10
**Version:** 1.0.0 - Noob-Friendly Edition
