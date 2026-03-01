# 🔐 README - Configuration des Credentials

**Choisis ton guide selon ton niveau:**

---

## ⚡ Tu veux démarrer VITE ? (5 minutes)

**Fichier:** `QUICKSTART_5MIN.md`

**Pour qui:** Débutants qui veulent aller à l'essentiel

**Ce que tu vas faire:**
1. Obtenir 2 clés API (Google + ElevenLabs)
2. Les coller dans n8n
3. Tester

👉 **[OUVRE QUICKSTART_5MIN.md](./QUICKSTART_5MIN.md)**

---

## 📖 Tu veux un guide COMPLET avec explications ? (45 minutes)

**Fichier:** `GUIDE_COMPLET_CONFIGURATION_CREDENTIALS.md`

**Pour qui:** Débutants qui veulent tout comprendre

**Ce que tu vas apprendre:**
- Pourquoi on a besoin de clés API
- Comment obtenir chaque clé (avec screenshots)
- 2 méthodes de configuration (Interface ou .env)
- Comment tester chaque agent
- Troubleshooting complet

👉 **[OUVRE GUIDE_COMPLET_CONFIGURATION_CREDENTIALS.md](./GUIDE_COMPLET_CONFIGURATION_CREDENTIALS.md)**

---

## 📝 Tu veux juste un template .env ?

**Fichier:** `.env.example`

**Pour qui:** Utilisateurs avancés qui savent ce qu'ils font

**Ce que tu dois faire:**
1. Copie `.env.example` en `.env`
2. Remplace les valeurs par tes vraies clés
3. Redémarre n8n

👉 **[OUVRE .env.example](./.env.example)**

---

## 📊 Tu veux savoir CE QUI A ÉTÉ FAIT dans cette session ?

**Fichier:** `IMPLEMENTATION_SUMMARY_2026-02-10.md`

**Pour qui:** Tous

**Contenu:**
- Workflow MILO V4 refactoré (toolCode au lieu de toolWorkflow)
- 4 MCP Servers SORA implémentés (GTM, Google Ads, Meta Ads, Looker)
- 28 fonctions API documentées
- Prochaines étapes (LUNA, MARCUS)

👉 **[OUVRE IMPLEMENTATION_SUMMARY_2026-02-10.md](./IMPLEMENTATION_SUMMARY_2026-02-10.md)**

---

## 🆘 Besoin d'Aide ?

### Problème: "Les variables ne se chargent pas"

**Solution:** Redémarre n8n après avoir ajouté les variables

```bash
# Docker
docker-compose restart n8n

# npm
# Ctrl+C puis: n8n start

# systemd
sudo systemctl restart n8n
```

---

### Problème: "Error: GOOGLE_API_KEY manquant"

**Solution:** Vérifie l'orthographe (TOUT en majuscules)

❌ **Incorrect:** `google_api_key`, `Google_Api_Key`
✅ **Correct:** `GOOGLE_API_KEY`

---

### Problème: "Error: 403 Forbidden (Google)"

**Solution:** Active les APIs dans Google Cloud Console

1. Va sur: https://console.cloud.google.com/apis/library
2. Cherche "Generative Language API"
3. Clique sur "Activer"
4. Attends 1-2 minutes

---

### Problème: "Error: 401 Unauthorized (ElevenLabs)"

**Solution:** Vérifie ta clé et tes crédits

1. Va sur: https://elevenlabs.io/
2. Profile Settings > API Key
3. Vérifie que ta clé commence par `sk_`
4. Vérifie que tu as des crédits restants

---

## 📁 Fichiers Importants

```
/agents/CURRENT_milo-creative/
  └─ milo-creative-v4-with-toolcode.workflow.json  ← Workflow MILO (prêt)

/agents/CURRENT_analyst-mcp/
  └─ analyst-core-v4.5-with-tools.workflow.json    ← Workflow SORA (prêt)

/agents/CURRENT_analyst-mcp/mcp_servers/
  ├─ gtm-manager.js                                ← GTM MCP Server
  ├─ google-ads-manager.js                         ← Google Ads MCP Server
  ├─ meta-ads-manager.js                           ← Meta Ads MCP Server
  ├─ looker-manager.js                             ← Looker MCP Server
  └─ README.md                                     ← Doc MCP Servers

.env.example                                        ← Template variables
QUICKSTART_5MIN.md                                  ← Guide rapide
GUIDE_COMPLET_CONFIGURATION_CREDENTIALS.md          ← Guide détaillé
IMPLEMENTATION_SUMMARY_2026-02-10.md                ← Récap session
```

---

## ✅ Checklist de Vérification

Avant de dire "c'est bon", vérifie:

- [ ] Variables ajoutées dans n8n (Settings > Variables)
- [ ] n8n redémarré
- [ ] Workflows MILO & SORA importés
- [ ] Test MILO → `success: true`
- [ ] Test SORA → `success: true`

---

**Tu es prêt ! 🚀**

**Commence par:** `QUICKSTART_5MIN.md` si tu es pressé, ou `GUIDE_COMPLET_CONFIGURATION_CREDENTIALS.md` si tu veux tout comprendre.

---

**Créé par:** Azzeddine Zazai
**Date:** 2026-02-10
**Version:** 1.0.0
