# Phase 2.8 - Guide de Test Frontend Live

**Date:** 2026-03-01
**Objectif:** Valider l'intégration complète Frontend React → Backend TypeScript V5

---

## 🎯 Services Actifs

Avant de commencer, vérifie que tous les services sont up :

```bash
# Backend TypeScript V5
curl http://localhost:3457/health
# ✅ Devrait retourner: {"status":"healthy"...}

# MCP Bridge
curl http://localhost:3456/health
# ✅ Devrait retourner: {"status":"ok"...}

# Frontend React
# ✅ Accessible sur: http://localhost:5173
```

**Status actuel:** ✅ Tous les services sont opérationnels

---

## 📋 Tests à Effectuer

### Test 1: Création de Projet (Genesis)

**Objectif:** Vérifier que le frontend peut créer un projet via le backend V5

**Étapes:**
1. Ouvre http://localhost:5173 dans ton navigateur
2. Si tu vois la page Genesis (création de projet), remplis le formulaire :
   - **Nom du projet:** "Test Backend V5"
   - **Scope:** SEO Campaign
   - **Industry:** E-commerce
   - **Website:** https://example.com
3. Clique sur "Créer le projet"

**Résultat attendu:**
- ✅ Le projet se crée sans erreur
- ✅ Redirection vers le Board (tableau de bord)
- ✅ Tâches générées automatiquement visibles dans le tableau

**Si erreur:**
- Ouvre la console navigateur (F12) et copie l'erreur
- Vérifie les logs backend : `tail -f /tmp/backend-v5.log`

---

### Test 2: Chat Live avec Luna (SEO)

**Objectif:** Tester l'intégration complète Frontend → Backend → Orchestrator → Luna → Claude API

**Étapes:**
1. Depuis le Board, clique sur l'avatar de **Luna** (l'agent violet) dans la TeamDock (sidebar gauche)
2. Entre ce message dans le chat :
   ```
   Donne-moi 3 recommandations SEO rapides pour améliorer mon site e-commerce
   ```
3. Appuie sur Entrée

**Résultat attendu:**
- ✅ Message envoyé visible dans le chat
- ✅ Indicateur "thinking..." s'affiche
- ✅ Réponse de Luna apparaît en 3-5 secondes
- ✅ Réponse contient 3 recommandations concrètes :
  - Optimisation fiches produits
  - Vitesse mobile
  - Schema markup
- ✅ Réponse utilise le contexte (e-commerce)

**Points de contrôle:**
- [ ] La réponse arrive en < 10 secondes
- [ ] Luna répond DIRECTEMENT à la question (pas de détour)
- [ ] Le contexte projet est utilisé intelligemment
- [ ] Aucune erreur dans la console

---

### Test 3: UI Components Rendering

**Objectif:** Vérifier que les UI components complexes s'affichent correctement

**Étapes:**
1. Dans le chat avec Luna, demande :
   ```
   Fais un audit technique SEO de https://example.com
   ```

**Résultat attendu:**
- ✅ Un UI component s'affiche (tableau, card, ou rapport)
- ✅ Le component est bien formaté et lisible
- ✅ Les données sont structurées (pas de JSON brut)

**Note:** Si Luna ne peut pas faire l'audit (MCP server non disponible), elle doit le dire clairement et proposer une alternative.

---

### Test 4: Switch d'Agent (Sora - Analytics)

**Objectif:** Tester le routing orchestrateur + switch d'agent

**Étapes:**
1. Dans le chat, clique sur l'avatar de **Sora** (l'agent bleu data analyst)
2. Entre ce message :
   ```
   Explique-moi comment calculer le ROAS et quels sont les bons benchmarks
   ```

**Résultat attendu:**
- ✅ L'avatar change pour Sora dans le chat
- ✅ Réponse de Sora (pas Luna)
- ✅ Réponse contient :
  - Formule ROAS
  - Benchmarks par canal (Google Ads, Meta Ads)
  - Framework décisionnel (SCALE/OPTIMIZE/CUT)
- ✅ Ton data-driven, métriques précises

---

### Test 5: Marcus (Ads Trading)

**Objectif:** Valider l'agent expert en campagnes

**Étapes:**
1. Clique sur l'avatar de **Marcus** (l'agent rouge trader)
2. Entre :
   ```
   Quels sont les 3 critères pour scaler une campagne Meta Ads ?
   ```

**Résultat attendu:**
- ✅ Réponse Marcus avec 3 critères :
  - Learning Phase (+20% max)
  - ROAS > 5.0
  - 50+ conversions/semaine
- ✅ Ton expert, seuils précis

---

### Test 6: Milo (Creative)

**Objectif:** Valider l'agent créatif

**Étapes:**
1. Clique sur l'avatar de **Milo** (l'agent jaune créatif)
2. Entre :
   ```
   Donne-moi 3 conseils pour créer des visuels Meta Ads qui convertissent
   ```

**Résultat attendu:**
- ✅ Réponse Milo avec 3 conseils créatifs :
  - Hook en 3 secondes
  - Mobile-first
  - Produit en action
- ✅ Ton créatif, conseils actionnables

---

### Test 7: Memory Write-Back (Avancé)

**Objectif:** Vérifier que les agents écrivent dans la mémoire collective

**Étapes:**
1. Demande à Luna une analyse complète (ex: "Analyse SEO de mon site")
2. Une fois la réponse reçue, switch vers Sora
3. Demande à Sora :
   ```
   Qu'est-ce que Luna a trouvé sur mon site ?
   ```

**Résultat attendu:**
- ✅ Sora mentionne les findings de Luna (si memory write-back fonctionne)
- ✅ OU Sora dit qu'elle n'a pas accès aux analyses de Luna (si memory pas encore implémenté)

**Note:** Le memory write-back est un feature avancé, son absence n'est pas bloquante pour la Phase 2.8.

---

### Test 8: Performance & Stabilité

**Objectif:** Vérifier la robustesse du système

**Étapes:**
1. Envoie 3-5 messages consécutifs à différents agents
2. Switch rapidement entre agents
3. Envoie un message très long (> 500 mots)

**Résultat attendu:**
- ✅ Aucune erreur
- ✅ Temps de réponse stable (3-10s par message)
- ✅ UI reste responsive
- ✅ Pas de freeze ou crash

---

## 🔍 Points de Contrôle Critiques

### ✅ Architecture Complète Fonctionnelle

- [ ] Frontend communique avec Backend V5 (pas n8n)
- [ ] Tous les 4 agents répondent correctement
- [ ] Temps de réponse acceptable (< 10s)
- [ ] Aucune erreur 500/400 dans la console
- [ ] UI components s'affichent correctement
- [ ] Switch d'agent fonctionne
- [ ] Contexte projet utilisé intelligemment

### ✅ Règle de Priorité Respectée

- [ ] Tous les agents répondent DIRECTEMENT aux questions
- [ ] Pas de détour ou suggestions non sollicitées
- [ ] Le contexte enrichit la réponse (ne la détourne pas)

---

## 🐛 Troubleshooting

### Erreur: "Network Error" ou "Backend non accessible"

**Solution:**
```bash
# Vérifier que le backend tourne
curl http://localhost:3457/health

# Si erreur, redémarrer le backend
cd /Users/azzedinezazai/Documents/Agency-Killer-V4/backend
npm run dev
```

### Erreur: "Invalid shared_memory" ou "Validation Error"

**Cause:** Le frontend envoie un format incompatible avec le backend

**Solution:**
- Vérifier `/cockpit/src/services/api.ts`
- S'assurer que `transformSharedMemory()` est appelé
- Logs backend : `tail -f /tmp/backend-v5.log`

### Réponses lentes (> 20 secondes)

**Causes possibles:**
1. MCP servers offline
2. Claude API timeout
3. Network issues

**Diagnostic:**
```bash
# Vérifier MCP Bridge
curl http://localhost:3456/health

# Vérifier logs backend
tail -f /tmp/backend-v5.log | grep ERROR
```

### UI Components ne s'affichent pas

**Solution:**
- Ouvrir console navigateur (F12)
- Vérifier erreurs React
- Vérifier que `UIComponentRenderer.tsx` gère tous les types

---

## 📊 Critères de Validation Phase 2.8

Pour valider la Phase 2.8, **TOUS** ces critères doivent être remplis :

### Critères Essentiels (Bloquants)

- [ ] ✅ **Test 1 réussi** - Création projet fonctionne
- [ ] ✅ **Test 2 réussi** - Luna répond correctement
- [ ] ✅ **Test 4 réussi** - Sora répond correctement
- [ ] ✅ **Test 5 réussi** - Marcus répond correctement
- [ ] ✅ **Test 6 réussi** - Milo répond correctement
- [ ] ✅ **Temps réponse < 10s** pour tous les agents
- [ ] ✅ **Aucune erreur critique** dans console/logs
- [ ] ✅ **Règle priorité respectée** par tous les agents

### Critères Avancés (Nice-to-have)

- [ ] 🎯 **Test 3 réussi** - UI components s'affichent
- [ ] 🎯 **Test 7 réussi** - Memory write-back fonctionne
- [ ] 🎯 **Test 8 réussi** - Performance stable sous charge

---

## ✅ Validation Finale

Une fois tous les tests effectués, remplis ce checklist :

```
PHASE 2.8 - VALIDATION FINALE

Services:
[ ] Backend V5 healthy
[ ] MCP Bridge healthy
[ ] Frontend accessible

Agents:
[ ] Luna opérationnel
[ ] Sora opérationnel
[ ] Marcus opérationnel
[ ] Milo opérationnel

Performance:
[ ] Temps réponse < 10s
[ ] UI responsive
[ ] Aucun crash

Qualité:
[ ] Réponses expert-level
[ ] Contexte utilisé intelligemment
[ ] Règle priorité respectée

Architecture:
[ ] Frontend → Backend V5 (NOT n8n)
[ ] Orchestrator routing OK
[ ] Claude API intégré

STATUT GLOBAL: [ ] ✅ PRODUCTION READY
```

---

## 🚀 Prochaines Étapes (Après Validation)

Si tous les tests passent :

1. ✅ **Cutover n8n** - Désactiver n8n définitivement
2. ✅ **Documentation** - Mettre à jour PROGRESS_V5_IMPLEMENTATION.md
3. ✅ **Commit final** - Push vers GitHub
4. ✅ **Déploiement** - Préparer production

**Le système sera alors 100% opérationnel sur Backend TypeScript V5 ! 🎉**

---

**Guide créé par:** Claude Code
**Session:** Phase 2.8 - Frontend Live Testing
