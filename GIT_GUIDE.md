# 📚 Guide Git - THE HIVE OS V4

**Repository GitHub :** https://github.com/doffymelo-a11y/agency-killer-v4

---

## 🔐 Configuration du Token (Une Seule Fois)

Pour éviter de retaper ton token à chaque push, configure le credential helper :

```bash
# Aller dans le projet
cd /Users/azzedinezazai/Documents/Agency-Killer-V4

# Stocker le token dans git credential helper (macOS Keychain)
git config credential.helper osxkeychain

# Lors du prochain push, Git te demandera :
# Username: doffymelo-a11y
# Password: [TON_TOKEN_GITHUB]  # Commence par ghp_

# Le token sera stocké dans le Keychain et réutilisé automatiquement
```

---

## ✅ Workflow Git Standard

### 1. Faire des Modifications

Modifie tes fichiers dans le projet (code, docs, etc.)

### 2. Vérifier le Statut

```bash
git status
```

**Résultat :** Liste des fichiers modifiés/ajoutés/supprimés

### 3. Ajouter les Fichiers

```bash
# Ajouter TOUS les fichiers modifiés
git add .

# OU ajouter des fichiers spécifiques
git add cockpit/src/services/approvals.ts
git add cockpit/N8N_APPROVAL_INTEGRATION_GUIDE.md
```

### 4. Créer un Commit

```bash
git commit -m "✨ Add new feature: approval system integration

- Integrate approval requests in SORA workflow
- Update system prompts for all agents
- Add approval UI components
- Test end-to-end flow"
```

**Convention de messages :**
- `✨` Nouvelle feature
- `🐛` Bug fix
- `📝` Documentation
- `🔧` Configuration
- `♻️` Refactoring
- `🚀` Performance
- `🛡️` Security
- `🧪` Tests

### 5. Pousser sur GitHub

```bash
git push origin main
```

**Si c'est la première fois après reboot :**
```bash
# Git te demandera :
Username for 'https://github.com': doffymelo-a11y
Password for 'https://doffymelo-a11y@github.com': [TON_TOKEN_GITHUB]

# Le token sera stocké dans Keychain pour les prochaines fois
```

---

## 🔄 Workflow Complet Exemple

```bash
# 1. Faire des modifications (éditer des fichiers)

# 2. Vérifier ce qui a changé
git status

# 3. Ajouter les changements
git add .

# 4. Commit avec message descriptif
git commit -m "🛡️ Secure approval system

- Add RLS policies for approval_requests table
- Implement rate limiting on approval creation
- Add audit logging for all approval actions"

# 5. Pousser sur GitHub
git push origin main
```

---

## 📋 Commandes Git Utiles

### Voir l'Historique des Commits

```bash
# Liste des 10 derniers commits
git log --oneline -10

# Historique détaillé
git log --graph --all --decorate
```

### Voir les Changements

```bash
# Changements non stagés
git diff

# Changements stagés (après git add)
git diff --staged
```

### Annuler des Changements

```bash
# Annuler les modifications d'un fichier (avant git add)
git checkout -- filename.ts

# Retirer un fichier de staging (après git add)
git reset HEAD filename.ts

# Annuler le dernier commit (garde les modifications)
git reset --soft HEAD~1
```

### Branches

```bash
# Lister les branches
git branch

# Créer une nouvelle branche
git branch feature/new-feature

# Changer de branche
git checkout feature/new-feature

# Créer et changer en une commande
git checkout -b feature/new-feature

# Fusionner une branche dans main
git checkout main
git merge feature/new-feature

# Supprimer une branche
git branch -d feature/new-feature
```

### Synchroniser avec GitHub

```bash
# Récupérer les changements du repo distant
git pull origin main

# Voir les remotes configurés
git remote -v
```

---

## 🚨 Sécurité - Ce qu'il NE FAUT JAMAIS Faire

### ❌ JAMAIS committer ces fichiers :

- ❌ `.env` (secrets, API keys)
- ❌ `Credentials/` (fichiers de credentials)
- ❌ `node_modules/` (dépendances)
- ❌ `*.secret`, `*.key`, `*.pem`

**Le `.gitignore` est déjà configuré pour exclure ces fichiers** ✅

### ❌ JAMAIS exposer ton token GitHub

- ❌ Ne JAMAIS commit le token dans du code
- ❌ Ne JAMAIS partager le token publiquement
- ✅ Utiliser git credential helper (Keychain)

---

## 🔧 Configuration Git Globale (Optionnel)

```bash
# Configurer ton nom (apparaît dans les commits)
git config --global user.name "Azzedine Zazai"

# Configurer ton email
git config --global user.email "ton-email@example.com"

# Couleurs dans le terminal
git config --global color.ui auto

# Éditeur par défaut (VSCode)
git config --global core.editor "code --wait"
```

---

## 📊 Vérifier l'État du Repo

```bash
# Commits en avance/retard par rapport à GitHub
git status

# Dernier commit
git log -1

# Fichiers trackés par git
git ls-files

# Taille du repo
du -sh .git
```

---

## 🆘 En Cas de Problème

### Problème 1 : Push refusé (conflit)

```bash
# Récupérer les changements distants d'abord
git pull origin main

# Résoudre les conflits si nécessaire
# Puis push
git push origin main
```

### Problème 2 : Mot de passe demandé à chaque fois

```bash
# Activer credential helper
git config credential.helper osxkeychain

# Puis faire un push pour stocker le token
git push origin main
# Entrer username + token → Stocké dans Keychain
```

### Problème 3 : Fichier accidentellement committé

```bash
# Retirer du dernier commit (garde le fichier localement)
git reset --soft HEAD~1
git reset HEAD filename.env

# Ajouter le fichier au .gitignore
echo "filename.env" >> .gitignore

# Re-commit sans le fichier
git add .
git commit -m "Fix: remove sensitive file"
git push origin main --force
```

---

## 📖 Ressources

- **GitHub Repo :** https://github.com/doffymelo-a11y/agency-killer-v4
- **Git Documentation :** https://git-scm.com/doc
- **GitHub Guides :** https://guides.github.com

---

## ✅ Checklist Premier Setup (Déjà Fait)

- [x] Repository initialisé (`git init`)
- [x] `.gitignore` créé
- [x] Commit initial fait
- [x] Repo GitHub créé
- [x] Code poussé sur GitHub
- [x] README.md ajouté
- [ ] **Configure credential helper** (voir ci-dessus)

---

**Dernière mise à jour :** 2026-03-01
**Repository :** https://github.com/doffymelo-a11y/agency-killer-v4
