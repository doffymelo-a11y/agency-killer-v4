# ⚡ QUICKSTART - Configuration en 5 Minutes

**Ce guide est pour toi si:** Tu veux démarrer VITE sans lire 50 pages de doc.

**Durée:** 5-10 minutes max

---

## 🎯 Ce qu'on va faire

1. Obtenir 2 clés API (Google + ElevenLabs)
2. Les coller dans n8n
3. Redémarrer n8n
4. Tester que ça marche

**C'est parti ! 🚀**

---

## Étape 1: Obtenir les Clés API (3 min)

### A) Google API Key

1. **Va sur:** https://console.cloud.google.com/apis/credentials
2. **Connecte-toi** avec ton compte Google
3. **Clique sur:** "+ Créer des identifiants" → "Clé API"
4. **Copie la clé** (commence par `AIzaSy...`)
5. **Garde-la** dans un bloc-notes temporairement

**✅ Done!** Tu as ta `GOOGLE_API_KEY`

---

### B) ElevenLabs API Key

1. **Va sur:** https://elevenlabs.io/
2. **Crée un compte** (gratuit ou payant)
3. **Connecte-toi**
4. **Clique sur** ton avatar → "Profile Settings"
5. **Copie** l'API Key (commence par `sk_...`)
6. **Garde-la** dans le bloc-notes

**✅ Done!** Tu as ta `ELEVENLABS_API_KEY`

---

## Étape 2: Coller les Clés dans n8n (1 min)

### Ouvre n8n dans ton navigateur

URL: `http://localhost:5678` (ou ton URL n8n)

### Va dans Settings > Variables

1. **Clique** sur ton avatar (en haut à droite)
2. **Clique** sur "Settings"
3. **Clique** sur "Variables" (menu gauche)

### Ajoute 2 Variables

**Variable 1:**
- **Nom:** `GOOGLE_API_KEY`
- **Valeur:** Colle la clé Google (`AIzaSy...`)
- **Clique** sur "Save"

**Variable 2:**
- **Nom:** `ELEVENLABS_API_KEY`
- **Valeur:** Colle la clé ElevenLabs (`sk_...`)
- **Clique** sur "Save"

**✅ Done!** Les clés sont dans n8n

---

## Étape 3: Redémarrer n8n (30 sec)

**⚠️ IMPORTANT:** n8n doit redémarrer pour charger les variables.

### Si tu utilises Docker:

```bash
docker-compose restart n8n
```

### Si tu utilises npm:

```bash
# Arrête n8n (Ctrl+C)
# Puis relance:
n8n start
```

### Si tu utilises systemd:

```bash
sudo systemctl restart n8n
```

**Attends 10-15 secondes** que n8n redémarre.

**✅ Done!** n8n a chargé les clés

---

## Étape 4: Importer le Workflow MILO (1 min)

### Dans n8n:

1. **Clique** sur "Workflows" (menu gauche)
2. **Clique** sur "Import from File"
3. **Sélectionne:** `/agents/CURRENT_milo-creative/milo-creative-v4-with-toolcode.workflow.json`
4. **Clique** sur "Import"
5. **Clique** sur "Save" (en haut à droite)

**✅ Done!** MILO est prêt

---

## Étape 5: Tester que Tout Marche (30 sec)

### Test Simple:

1. **Dans le workflow MILO**, clique sur le node **"Tool: Nano Banana Pro"**
2. **Scroll** jusqu'à voir le code JavaScript
3. **Cherche** cette ligne:
   ```javascript
   const GOOGLE_API_KEY = $env.GOOGLE_API_KEY;
   ```
4. **C'est bon !** Le workflow utilise bien ta clé

### Test Avancé (Optionnel):

Si tu veux vraiment générer une image:

1. **Clique** sur le node "Webhook Trigger"
2. **Copie l'URL** du webhook (en bas)
3. **Ouvre un terminal** et tape:

```bash
curl -X POST https://ton-n8n.com/webhook-test/milo-creative \
  -H "Content-Type: application/json" \
  -d '{"message": "Génère une image de smartphone"}'
```

4. **Va dans "Executions"** (menu gauche)
5. **Vérifie** que c'est vert ✅

---

## 🎉 FÉLICITATIONS !

**Tu es prêt à utiliser MILO !**

**Prochaines étapes:**
- **Pour SORA:** Ajoute `GOOGLE_DEVELOPER_TOKEN` (si tu as Google Ads)
- **Pour les détails:** Lis `GUIDE_COMPLET_CONFIGURATION_CREDENTIALS.md`

---

## ❌ Problèmes Courants

### "Error: GOOGLE_API_KEY manquant"

**Solution:**
1. Vérifie que tu as bien ajouté la variable (nom EXACTEMENT `GOOGLE_API_KEY`)
2. Redémarre n8n
3. Re-teste

---

### "Error: 403 Forbidden"

**Solution:**
1. Active les APIs dans Google Cloud Console:
   - Va sur: https://console.cloud.google.com/apis/library
   - Cherche "Generative Language API"
   - Clique sur "Activer"
2. Attends 1-2 minutes
3. Re-teste

---

### "Error: 401 Unauthorized"

**Solution:**
1. Vérifie que ta clé ElevenLabs est correcte
2. Vérifie que ton compte ElevenLabs a des crédits
3. Re-teste

---

## 📚 Ressources

| Document | Pour Quoi Faire |
|----------|-----------------|
| `QUICKSTART_5MIN.md` | ⚡ Démarrage rapide (ce fichier) |
| `GUIDE_COMPLET_CONFIGURATION_CREDENTIALS.md` | 📖 Guide détaillé avec screenshots |
| `.env.example` | 📝 Template des variables d'environnement |
| `IMPLEMENTATION_SUMMARY_2026-02-10.md` | 📊 Récap de tout ce qui a été fait |

---

**Créé par:** Azzeddine Zazai
**Date:** 2026-02-10
**Version:** 1.0.0 - Quickstart Edition
