# Guide d'Utilisation - Système de Support Tickets

**Version:** 4.4 (Phase 2 & 3 Complete)
**Dernière mise à jour:** 2026-04-07

---

## Table des Matières

1. [Pour les Utilisateurs](#pour-les-utilisateurs)
   - [Créer un Ticket](#créer-un-ticket)
   - [Suivre vos Tickets](#suivre-vos-tickets)
   - [Ajouter des Fichiers](#ajouter-des-fichiers)
   - [Communiquer sur un Ticket](#communiquer-sur-un-ticket)
   - [Marquer un Ticket comme Résolu](#marquer-un-ticket-comme-résolu)
   - [Évaluer le Support](#évaluer-le-support)

2. [Pour les Admins](#pour-les-admins)
   - [Dashboard Admin](#dashboard-admin)
   - [Répondre aux Tickets](#répondre-aux-tickets)
   - [Utiliser les Templates de Réponse](#utiliser-les-templates-de-réponse)
   - [Gérer les Priorités](#gérer-les-priorités)
   - [Notes Internes](#notes-internes)
   - [Détection de Doublons](#détection-de-doublons)
   - [SLA et Métriques](#sla-et-métriques)
   - [Base de Connaissances](#base-de-connaissances)

3. [FAQ](#faq)

---

## Pour les Utilisateurs

### Créer un Ticket

#### Étape 1: Accéder au Support
1. Cliquez sur **"Support"** dans le menu principal
2. Cliquez sur le bouton **"+ Nouveau ticket"**

#### Étape 2: Choisir un Modèle (Optionnel)
- Un menu déroulant "📝 Commencer sans modèle" vous propose des modèles pré-remplis
- **Modèles populaires** : Bug report, Feature request, Question
- Sélectionner un modèle remplit automatiquement le sujet et la description avec un format guidé

#### Étape 3: Renseigner les Informations
1. **Catégorie** : Choisissez parmi :
   - 🐛 Bug - Pour signaler un dysfonctionnement
   - ✨ Feature Request - Pour suggérer une nouvelle fonctionnalité
   - ❓ Question - Pour poser une question
   - 💳 Billing - Pour les questions de facturation
   - 🔌 Integration - Pour l'aide sur les intégrations
   - 📦 Other - Autre

2. **Sujet** : Titre court et descriptif (ex: "Le pixel Facebook ne se charge pas")

3. **Description** : Décrivez le problème en détail
   - Que s'est-il passé ?
   - Quand est-ce arrivé ?
   - Étapes pour reproduire le problème
   - Message d'erreur éventuel

4. **Screenshot** (Optionnel) : Glissez-déposez une capture d'écran

#### Étape 4: Suggestions Intelligentes
Avant de créer le ticket, le système vous propose :
- **Articles de la base de connaissances** qui pourraient résoudre votre problème immédiatement
- **Suggestion IA de catégorie** (si vous cliquez sur "🤖 Suggérer catégorie")

#### Étape 5: Créer
Cliquez sur **"Créer le ticket"**. Vous serez redirigé vers la conversation.

---

### Suivre vos Tickets

#### Vue Liste
Dans **Support**, vous voyez tous vos tickets avec :
- **Numéro** : Format #XXXX (ex: #0042)
- **Statut** :
  - 🟡 Ouvert - En attente de réponse
  - 🔵 En cours - Admin a répondu / est en train de traiter
  - ✅ Résolu - Problème réglé
  - ⚫ Fermé - Ticket archivé
- **Catégorie** et **Priorité**
- **Dernière activité**

#### Filtres Rapides
- **Tous** : Tous vos tickets
- **Ouverts** : Tickets en attente de réponse
- **En cours** : Tickets en traitement
- **Résolus** : Tickets réglés

#### Notifications
Vous recevez un email quand :
- Un admin répond à votre ticket
- Le statut de votre ticket change
- Votre ticket est résolu

> **Note :** Vous pouvez configurer vos préférences email dans **Paramètres > Compte**

---

### Ajouter des Fichiers

Vous pouvez joindre des fichiers à un ticket (jusqu'à 5 fichiers par message) :

#### Types de Fichiers Acceptés
- Images : PNG, JPG, GIF, WebP
- Documents : PDF, DOC, DOCX, TXT
- Logs : LOG, JSON

#### Comment Ajouter
1. Dans la conversation du ticket, cliquez sur **"📎 Joindre des fichiers"**
2. Sélectionnez jusqu'à 5 fichiers (max 10MB par fichier)
3. Attendez que l'upload se termine (barre de progression)
4. Les fichiers apparaissent sous le champ message
5. Ajoutez un message si besoin et envoyez

---

### Communiquer sur un Ticket

#### Envoyer un Message
- Écrivez dans le champ **"Ajouter un message..."**
- Vous pouvez joindre des fichiers
- Cliquez sur **"Envoyer"** ou appuyez sur Ctrl+Enter

#### Messages en Temps Réel
Les messages s'affichent instantanément sans recharger la page grâce au système realtime.

#### Historique Complet
Tous les messages sont sauvegardés et visibles dans l'ordre chronologique.

---

### Marquer un Ticket comme Résolu

Quand votre problème est réglé :
1. Cliquez sur **"✓ Marquer comme résolu"** en bas de la conversation
2. Le statut passe à **Résolu** ✅
3. Une enquête de satisfaction apparaît automatiquement

> **Astuce :** Si le problème persiste après résolution, vous pouvez toujours ajouter un message et le ticket sera rouvert automatiquement.

---

### Évaluer le Support

#### Enquête de Satisfaction (CSAT)
Après la résolution d'un ticket, vous êtes invité à évaluer notre support :

1. **Note sur 5 étoiles** :
   - ⭐ (1) = Très insatisfait
   - ⭐⭐ (2) = Peu satisfait
   - ⭐⭐⭐ (3) = Satisfaisant
   - ⭐⭐⭐⭐ (4) = Très satisfait
   - ⭐⭐⭐⭐⭐ (5) = Excellent !

2. **Tags Positifs** (si note ≥ 4) :
   - Réponse rapide
   - Solution efficace
   - Bonne communication
   - Professionnel
   - Au-delà des attentes

3. **Tags Négatifs** (si note ≤ 3) :
   - Temps d'attente long
   - Solution incomplète
   - Communication confuse
   - Problème non résolu
   - Réponse inadaptée

4. **Commentaire** (optionnel) : Partagez vos remarques

> **Pourquoi c'est important :** Vos retours nous aident à améliorer la qualité du support et identifier les problèmes récurrents.

---

## Pour les Admins

### Dashboard Admin

Accédez au dashboard admin via **Support > Onglet Admin**.

#### Statistiques en Temps Réel
- **Tickets ouverts** : Nombre de tickets en attente
- **En cours** : Tickets assignés/en traitement
- **Résolus aujourd'hui** : Tickets fermés dans les dernières 24h
- **Temps de réponse moyen** : SLA first response
- **Taux de satisfaction** : Score CSAT moyen

#### Filtres Avancés
- **Par statut** : Ouvert, En cours, Résolu, Fermé
- **Par priorité** : Critique, Haute, Moyenne, Basse
- **Par catégorie** : Bug, Feature Request, Question, etc.
- **Non assignés** : Tickets sans admin assigné
- **Mes tickets** : Tickets que vous avez assignés

#### Actions en Masse
Sélectionnez plusieurs tickets et :
- Changer le statut
- Changer la priorité
- S'assigner les tickets

---

### Répondre aux Tickets

#### Vue Conversation
1. Cliquez sur un ticket dans la liste
2. Vous voyez l'historique complet des messages
3. Les messages user sont à gauche (🙋), les messages admin à droite (🤖)

#### Répondre
1. Utilisez le champ **"Ajouter un message..."** en bas
2. **Astuce :** Utilisez les **modèles de réponse** (voir section suivante)
3. Vous pouvez joindre des fichiers (screenshots, docs, etc.)
4. Cliquez sur **"Envoyer"**

#### Changer le Statut
Dans la sidebar droite :
- **Statut** : Cliquez pour changer (Ouvert → En cours → Résolu → Fermé)
- **Priorité** : Ajustez selon l'urgence (Critique → Haute → Moyenne → Basse)
- **Assignation** : Cliquez sur "M'assigner" pour prendre en charge le ticket

---

### Utiliser les Templates de Réponse

#### Qu'est-ce que c'est ?
Les templates de réponse sont des messages pré-formatés pour répondre plus rapidement aux questions courantes.

#### Comment Utiliser
1. Dans la conversation d'un ticket, au-dessus du champ message, vous voyez :
   ```
   💬 Modèles de réponse
   [Sélectionner un modèle de réponse...]
   ```

2. Sélectionnez un modèle dans le menu déroulant
3. Le texte du template s'insère automatiquement dans le champ message
4. **Personnalisez** le message si besoin (ajoutez des détails spécifiques)
5. Envoyez

#### Templates Disponibles
- **Merci pour le signalement - Investigation en cours**
- **Bug corrigé - Déploiement imminent**
- **Besoin d'informations supplémentaires**
- **Fonctionnalité en roadmap**
- **Fonctionnalité déjà disponible**
- **Réponse FAQ**
- **Guide configuration intégration**
- **Informations facturation**
- **Ticket résolu - Confirmation**
- **Redirection vers la documentation**

> **Note :** Les templates sont filtrés par catégorie de ticket. Par exemple, pour un ticket "Bug", vous verrez en priorité les templates liés aux bugs.

---

### Gérer les Priorités

#### Niveaux de Priorité

| Priorité | Icône | Quand l'utiliser | SLA First Response |
|----------|-------|------------------|-------------------|
| **Critique** | 🔴 | Service down, perte de données, bug bloquant | 4h |
| **Haute** | 🟠 | Bug majeur, problème urgent sans workaround | 24h |
| **Moyenne** | 🟡 | Bug mineur, question importante | 48h |
| **Basse** | 🟢 | Suggestion, question non urgente | 72h |

#### Auto-Priorité par Catégorie
Le système attribue automatiquement une priorité selon la catégorie :
- **Bug** → Haute
- **Billing** → Haute
- **Feature Request** → Moyenne
- **Question** → Moyenne
- **Integration** → Moyenne
- **Other** → Basse

Vous pouvez **toujours modifier** la priorité manuellement selon le contexte.

---

### Notes Internes

#### Qu'est-ce que c'est ?
Les notes internes sont des commentaires **visibles uniquement par les admins**. Le user ne les voit jamais.

#### Quand les Utiliser
- Partager des informations techniques avec l'équipe
- Documenter une investigation
- Laisser des instructions pour un collègue
- Noter un contexte important

#### Comment Ajouter une Note
1. En bas de la conversation, section **"🔒 Notes Internes"** (admin uniquement)
2. Écrivez votre note dans le champ
3. Cliquez sur **"Ajouter une note interne"**
4. La note apparaît avec votre nom et l'heure

#### Supprimer une Note
Cliquez sur l'icône **🗑️** à droite de la note.

---

### Détection de Doublons

#### Fonctionnement
Le système utilise l'IA (OpenAI embeddings + pgvector) pour détecter automatiquement les tickets similaires.

#### Vue "Tickets similaires"
En bas de chaque ticket (admin uniquement), une section **"📋 Tickets similaires / Doublons potentiels"** affiche :
- **Score de similarité** : % de ressemblance (ex: 87% similaire)
- **Sujet** et **description** du ticket similaire
- **Statut** et **catégorie**
- **Lien** pour ouvrir le ticket similaire

#### Marquer comme Doublon
1. Dans la liste des tickets similaires, cliquez sur l'icône **📋** (Marquer comme doublon)
2. Confirmez l'action
3. Le ticket actuel est **fermé automatiquement**
4. Une **note interne** est ajoutée avec le lien vers le ticket original
5. Un **message automatique** est envoyé au user

> **Astuce :** Utilisez cette fonction pour rediriger les users vers des tickets déjà traités et éviter de dupliquer le travail.

---

### SLA et Métriques

#### Dashboard SLA
Accédez via **Support > Admin > Onglet SLA**.

#### Métriques Affichées

**1. Temps de Première Réponse Moyen**
- Temps écoulé entre la création du ticket et le premier message admin
- Cible : < 24h (moyenne)
- Affiché en heures

**2. Temps de Résolution Moyen**
- Temps écoulé entre la création et la résolution du ticket
- Cible : < 72h (moyenne)
- Affiché en heures

**3. Breaches SLA (30 jours)**
- Nombre de tickets où le SLA n'a pas été respecté
- Cible : < 10%

**4. Graphique Évolution**
- Courbes temps de réponse / résolution sur 30 jours
- Permet d'identifier les tendances

#### Alerts SLA
Un cron job vérifie toutes les heures :
- Si un ticket **critique** n'a pas de réponse après 4h → alerte email dev
- Si un ticket **haute priorité** n'a pas de réponse après 24h → alerte email dev
- Le champ `sla_breached` du ticket est marqué `TRUE`

---

### Base de Connaissances

#### Qu'est-ce que c'est ?
La base de connaissances (KB) contient des articles de documentation pour aider les users à résoudre leurs problèmes eux-mêmes.

#### Suggestions Automatiques
Quand un user commence à créer un ticket :
- Le système recherche automatiquement dans la KB
- Les articles pertinents s'affichent **avant** la création du ticket
- Si le user trouve la réponse, il peut annuler la création du ticket
- **Résultat :** Réduction du volume de tickets (self-service)

#### Gérer les Articles (Roadmap)
Actuellement, les articles sont en base de données. Une interface admin pour créer/éditer les articles est prévue dans une version future.

---

## FAQ

### Questions Générales

**Q: Combien de temps avant qu'un admin réponde ?**
A: Le SLA de première réponse dépend de la priorité :
- Critique : 4h
- Haute : 24h
- Moyenne : 48h
- Basse : 72h

**Q: Puis-je rouvrir un ticket résolu ?**
A: Oui ! Ajoutez simplement un nouveau message sur le ticket résolu. Le statut repassera automatiquement en "Ouvert".

**Q: Est-ce que je reçois des emails ?**
A: Oui, vous recevez un email quand :
- Un admin répond à votre ticket
- Le statut de votre ticket change
Vous pouvez désactiver ces notifications dans **Paramètres > Compte**.

**Q: Combien de fichiers puis-je joindre ?**
A: Maximum 5 fichiers par message, 10MB par fichier.

**Q: Les tickets sont-ils privés ?**
A: Oui, vous ne voyez que **vos propres tickets**. Les admins voient tous les tickets.

---

### Questions Techniques

**Q: Que se passe-t-il si j'ajoute plusieurs screenshots ?**
A: Depuis Phase 2, vous pouvez joindre jusqu'à 5 fichiers (images, PDFs, logs) par message. Ils s'affichent tous dans la conversation.

**Q: Comment fonctionne la détection de doublons ?**
A: Le système génère un "embedding" (empreinte IA) du ticket via OpenAI. Puis, il recherche dans la base de données les tickets avec des embeddings similaires (cosine similarity > 80%).

**Q: Les notes internes sont-elles vraiment privées ?**
A: Oui, 100%. Elles utilisent les RLS policies Supabase pour garantir que seuls les admins (role `admin` ou `super_admin`) peuvent les voir.

**Q: Comment est calculé le score de satisfaction ?**
A: C'est un score CSAT (Customer Satisfaction) :
- 1-5 étoiles
- CSAT % = (Nombre de notes ≥4) / (Total réponses) × 100
- NPS-like score = (Nombre de notes ≥4 - Nombre de notes ≤2) / Total × 100

---

### Troubleshooting

**Q: Je ne reçois pas les emails de notification**
A: Vérifiez :
1. **Paramètres > Compte** : Les notifications emails sont activées ?
2. **Spam** : Vérifiez votre dossier spam
3. **Adresse email** : Votre email est-il correct dans votre profil ?

**Q: Mon fichier ne s'upload pas**
A: Vérifiez :
- **Taille** : Max 10MB par fichier
- **Format** : Types acceptés seulement (images, PDFs, docs, logs)
- **Connexion** : Vous avez une connexion internet stable ?

**Q: Le statut du ticket ne change pas**
A: Essayez de :
1. Rafraîchir la page (F5)
2. Vérifier que vous avez les droits (admin uniquement peut changer le statut des autres users)

**Q: Les messages ne s'affichent pas en temps réel**
A: Le système utilise Supabase Realtime. Si ça ne fonctionne pas :
1. Vérifiez votre connexion internet
2. Essayez de rafraîchir la page
3. Vérifiez la console browser (F12) pour des erreurs

---

## Raccourcis Clavier

| Action | Raccourci |
|--------|-----------|
| Créer un ticket | `n` (dans la vue liste) |
| Envoyer un message | `Ctrl+Enter` ou `Cmd+Enter` |
| Fermer un modal | `Esc` |

---

## Glossaire

- **SLA** : Service Level Agreement - Engagement de temps de réponse
- **CSAT** : Customer Satisfaction Score - Score de satisfaction client
- **Embedding** : Représentation vectorielle d'un texte pour la recherche de similarité
- **RLS** : Row Level Security - Sécurité au niveau des lignes dans la base de données
- **Realtime** : Mise à jour instantanée sans recharger la page

---

## Besoin d'Aide ?

Si vous avez besoin d'aide pour utiliser le système de support :
1. Créez un ticket avec la catégorie **❓ Question**
2. Sujet : "Aide sur le système de support"
3. Décrivez votre question

Notre équipe vous répondra dans les meilleurs délais !

---

**Dernière mise à jour :** 2026-04-07
**Version du système :** 4.4 (Phase 2 & 3 Complete)
