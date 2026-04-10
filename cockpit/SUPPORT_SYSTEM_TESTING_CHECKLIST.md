# Support System - Checklist de Tests Complets

**Version**: Phase 2 & 3 Complete
**Date**: 2026-04-09

---

## 🎯 TESTS FONCTIONNELS - USER FLOW

### 1. Création de Ticket (5 min)

**Prérequis**: Être connecté en tant qu'utilisateur normal

#### Test 1.1: Création basique
- [ ] Naviguer vers http://localhost:5173/support
- [ ] Cliquer sur "Nouveau Ticket"
- [ ] Vérifier que le formulaire s'affiche
- [ ] Remplir:
  - Sujet: "Test - Pixel Meta ne fonctionne pas"
  - Description: "Le pixel de tracking Meta ne se déclenche pas sur ma landing page https://example.com"
  - Catégorie: Bug
- [ ] Cliquer "Créer le ticket"
- [ ] **Résultat attendu**: Toast "Ticket créé avec succès" + redirection vers la liste

#### Test 1.2: Upload fichier
- [ ] Créer un nouveau ticket
- [ ] Cliquer sur la zone de drop de fichier
- [ ] Sélectionner une image (< 10MB)
- [ ] **Résultat attendu**: Fichier apparaît dans la liste avec aperçu
- [ ] Cliquer "Upload"
- [ ] **Résultat attendu**: Progress bar + "Upload réussi"
- [ ] Soumettre le ticket
- [ ] Ouvrir le ticket créé
- [ ] **Résultat attendu**: Image visible dans le premier message

#### Test 1.3: Templates
- [ ] Créer un nouveau ticket
- [ ] Cliquer sur le dropdown "Utiliser un modèle..."
- [ ] **Résultat attendu**: 7 templates apparaissent
- [ ] Sélectionner "Bug Report - Pixel Not Firing"
- [ ] **Résultat attendu**: Sujet et description auto-remplis + catégorie = bug
- [ ] Modifier légèrement le texte
- [ ] Soumettre

#### Test 1.4: Suggestions Knowledge Base
- [ ] Créer un nouveau ticket
- [ ] Dans le champ sujet, taper: "pixel tracking"
- [ ] Attendre 1 seconde (debounce)
- [ ] **Résultat attendu**: Section "Articles qui pourraient vous aider" apparaît avec articles pertinents
- [ ] Cliquer sur un article
- [ ] **Résultat attendu**: S'ouvre dans un nouvel onglet
- [ ] Revenir et continuer la création du ticket

---

### 2. Visualisation de Tickets (3 min)

#### Test 2.1: Liste mes tickets
- [ ] Sur la page Support, vérifier que les tickets créés apparaissent
- [ ] **Résultat attendu**: Derniers tickets en premier (tri par date DESC)
- [ ] Vérifier les badges de priorité (couleurs correctes)
- [ ] Vérifier les badges de statut

#### Test 2.2: Filtres
- [ ] Cliquer sur filtre "Status: Open"
- [ ] **Résultat attendu**: Seuls les tickets open sont visibles
- [ ] Changer pour "All"
- [ ] **Résultat attendu**: Tous les tickets réapparaissent

#### Test 2.3: Recherche
- [ ] Taper dans la barre de recherche: "pixel"
- [ ] **Résultat attendu**: Seuls les tickets contenant "pixel" dans sujet/description

---

### 3. Détail de Ticket (5 min)

#### Test 3.1: Thread de messages
- [ ] Cliquer sur un ticket
- [ ] **Résultat attendu**: Page de détail avec:
  - Header (ticket #, sujet, status, priority)
  - Premier message (description du ticket)
  - Zone de réponse en bas

#### Test 3.2: Envoi de message
- [ ] Taper un message: "Voici plus d'informations..."
- [ ] Cliquer "Envoyer"
- [ ] **Résultat attendu**: Message apparaît instantanément dans le thread
- [ ] Rafraîchir la page
- [ ] **Résultat attendu**: Message toujours présent

#### Test 3.3: Help Button
- [ ] Cliquer sur le bouton "?" (bottom right)
- [ ] **Résultat attendu**: Modal s'ouvre avec guide utilisateur
- [ ] Lire les sections "Pour les Utilisateurs"
- [ ] Fermer le modal (click outside ou X)

---

### 4. Satisfaction Survey (User) (2 min)

**Prérequis**: Avoir un ticket résolu (demander à un admin de le résoudre)

- [ ] Ouvrir un ticket avec status "resolved"
- [ ] **Résultat attendu**: Section "Comment évaluez-vous notre support?" visible
- [ ] Cliquer sur 5 étoiles
- [ ] Taper un commentaire: "Excellent support, merci!"
- [ ] Cliquer "Envoyer"
- [ ] **Résultat attendu**: Message "Merci pour votre retour!" + survey disparaît
- [ ] Rafraîchir la page
- [ ] **Résultat attendu**: Survey ne réapparaît pas (one-time)

---

## 👨‍💼 TESTS ADMIN - FONCTIONNALITÉS AVANCÉES

### 5. Admin Dashboard (3 min)

**Prérequis**: Être connecté en tant qu'admin

#### Test 5.1: Accès admin
- [ ] Se connecter avec un compte admin
- [ ] Naviguer vers /admin (ou onglet Admin dans la sidebar)
- [ ] **Résultat attendu**: Dashboard admin visible

#### Test 5.2: SLA Dashboard
- [ ] Chercher la section "SLA Dashboard" ou "Métriques Support"
- [ ] **Résultat attendu**: Graphiques affichés:
  - Avg First Response Time
  - Avg Resolution Time
  - SLA Breach Count
- [ ] Vérifier que les chiffres correspondent aux tickets créés

---

### 6. Internal Notes (Admin only) (3 min)

#### Test 6.1: Créer note interne
- [ ] Ouvrir un ticket en tant qu'admin
- [ ] **Résultat attendu**: Section "Notes Internes" (fond rouge) visible
- [ ] Taper une note: "Attention: ce user a déjà eu ce problème"
- [ ] Cliquer "Ajouter"
- [ ] **Résultat attendu**: Note apparaît avec nom de l'admin + timestamp
- [ ] Se déconnecter et se reconnecter en tant qu'user normal
- [ ] Ouvrir le même ticket
- [ ] **Résultat attendu**: Section "Notes Internes" N'EST PAS visible

#### Test 6.2: Modifier note
- [ ] Reconnecter en admin
- [ ] Ouvrir le ticket avec la note
- [ ] (Si UI de modification existe) Modifier la note
- [ ] **Résultat attendu**: Note mise à jour

---

### 7. Response Templates (Admin) (3 min)

#### Test 7.1: Utiliser template
- [ ] Ouvrir un ticket en admin
- [ ] Chercher le dropdown "Insérer un modèle..." au-dessus de la zone de texte
- [ ] **Résultat attendu**: 10 templates disponibles
- [ ] Sélectionner "Merci pour le signalement"
- [ ] **Résultat attendu**: Texte du template inséré dans la textarea
- [ ] Personnaliser légèrement
- [ ] Envoyer

#### Test 7.2: Filtrage par catégorie
- [ ] Ouvrir un ticket de catégorie "bug"
- [ ] Ouvrir le dropdown templates
- [ ] **Résultat attendu**: Les templates liés à "bug" apparaissent en premier

---

### 8. Duplicate Detection (Admin) (5 min)

**Prérequis**: Avoir créé 2-3 tickets similaires (même sujet/description)

#### Test 8.1: Voir tickets similaires
- [ ] Ouvrir un ticket en admin
- [ ] Chercher la section "Tickets similaires détectés"
- [ ] **Résultat attendu**: Si embedding généré, liste de tickets similaires avec % de similarité
- [ ] (Si rien n'apparaît, c'est normal : besoin de deployer Edge Function embedding)

#### Test 8.2: Marquer comme doublon
- [ ] Si tickets similaires apparaissent:
- [ ] Cliquer "Marquer comme doublon" sur un ticket
- [ ] **Résultat attendu**: Ticket marqué comme doublon + status = closed
- [ ] Message automatique ajouté au thread

---

## 🗄️ TESTS DATABASE - INTÉGRITÉ DES DONNÉES

### 9. Vérification Supabase (10 min)

#### Test 9.1: Tables
- [ ] Ouvrir Supabase Dashboard: https://supabase.com/dashboard
- [ ] Naviguer vers Table Editor
- [ ] Vérifier tables:
  - [ ] `support_tickets` - contient les tickets créés
  - [ ] `support_messages` - contient les messages
  - [ ] `support_internal_notes` - contient les notes admin
  - [ ] `ticket_satisfaction` - contient les surveys
  - [ ] `kb_articles` - contient 7 articles
  - [ ] `ticket_templates` - contient 7 templates
  - [ ] `admin_response_templates` - contient 10 templates

#### Test 9.2: Données ticket
- [ ] Ouvrir table `support_tickets`
- [ ] Trouver un ticket créé pendant les tests
- [ ] Vérifier les champs:
  - [ ] `ticket_number` - Format: TICKET-XXX
  - [ ] `priority` - Calculée selon category
  - [ ] `status` - Default: open
  - [ ] `created_at` - Timestamp correct
  - [ ] `first_response_at` - NULL si pas de réponse admin encore

#### Test 9.3: SLA Tracking
- [ ] Si un admin a répondu à un ticket:
- [ ] Vérifier que `first_response_at` est set
- [ ] Exécuter dans SQL Editor:
```sql
SELECT * FROM calculate_ticket_sla('TICKET_ID_HERE');
```
- [ ] **Résultat attendu**: Retourne first_response_time_hours, resolution_time_hours, sla_status

#### Test 9.4: Vues matérialisées
- [ ] SQL Editor:
```sql
SELECT * FROM ticket_sla_dashboard LIMIT 10;
```
- [ ] **Résultat attendu**: Données agrégées par date

```sql
SELECT * FROM ticket_csat_metrics LIMIT 10;
```
- [ ] **Résultat attendu**: Scores CSAT agrégés

---

## 🔧 TESTS EDGE FUNCTIONS (si déployées)

### 10. Email Notifications (5 min)

**Prérequis**: Edge Function déployée + SendGrid configuré

#### Test 10.1: Email sur réponse admin
- [ ] En tant qu'admin, répondre à un ticket
- [ ] **Résultat attendu**: Email envoyé à l'utilisateur (vérifier inbox)
- [ ] Vérifier table `email_logs`:
```sql
SELECT * FROM email_logs ORDER BY created_at DESC LIMIT 5;
```
- [ ] **Résultat attendu**: Entrée avec status = 'sent'

### 11. AI Categorization (5 min)

**Prérequis**: Edge Function déployée + Anthropic API key

- [ ] Créer un ticket avec un sujet clair (ex: "Mon pixel Facebook ne fonctionne pas")
- [ ] Vérifier table `support_tickets`:
```sql
SELECT
  id,
  subject,
  category,
  ai_suggested_category,
  ai_confidence,
  sentiment
FROM support_tickets
WHERE id = 'TICKET_ID';
```
- [ ] **Résultat attendu**:
  - `ai_suggested_category` rempli (ex: 'bug')
  - `ai_confidence` > 0.7
  - `sentiment` = 'negative' (car bug)

### 12. Duplicate Detection Embedding (5 min)

**Prérequis**: Edge Function déployée + OpenAI API key

- [ ] Créer 2 tickets très similaires (même texte)
- [ ] Attendre 10 secondes
- [ ] Vérifier table `support_tickets`:
```sql
SELECT
  id,
  subject,
  embedding IS NOT NULL as has_embedding
FROM support_tickets
WHERE id IN ('TICKET_1', 'TICKET_2');
```
- [ ] **Résultat attendu**: `has_embedding` = true

- [ ] Tester similarité:
```sql
SELECT * FROM find_ticket_duplicates('TICKET_1', 0.8, 5);
```
- [ ] **Résultat attendu**: TICKET_2 apparaît avec similarity > 0.8

---

## ⚡ TESTS PERFORMANCE

### 13. Temps de Chargement (5 min)

#### Test 13.1: Page Support
- [ ] Ouvrir DevTools (F12) → Network tab
- [ ] Naviguer vers /support
- [ ] **Résultat attendu**: Page charge en < 2 secondes
- [ ] Vérifier requêtes:
  - [ ] `GET support_tickets` - < 500ms
  - [ ] `GET kb_articles` (si search) - < 200ms

#### Test 13.2: Realtime
- [ ] Ouvrir /support dans 2 onglets (ou 2 navigateurs)
- [ ] Dans onglet 1: créer un ticket
- [ ] Dans onglet 2: **Résultat attendu**: Nouveau ticket apparaît automatiquement (< 2 secondes)

#### Test 13.3: Upload fichier
- [ ] Upload un fichier de 5MB
- [ ] **Résultat attendu**: Upload complété en < 10 secondes
- [ ] Vérifier que le fichier est sur Cloudinary

---

## 🔒 TESTS SÉCURITÉ - RLS

### 14. Row Level Security (10 min)

#### Test 14.1: User ne voit que ses tickets
- [ ] Créer 2 comptes user (user1@test.com, user2@test.com)
- [ ] Avec user1: créer un ticket
- [ ] Avec user2: aller sur /support
- [ ] **Résultat attendu**: user2 NE VOIT PAS le ticket de user1

#### Test 14.2: Admin voit tous les tickets
- [ ] Se connecter en admin
- [ ] Aller sur /support ou /admin
- [ ] **Résultat attendu**: Tous les tickets visibles (user1 + user2)

#### Test 14.3: Notes internes invisibles aux users
- [ ] Admin: créer une note interne sur un ticket
- [ ] Se déconnecter et reconnecter en user (propriétaire du ticket)
- [ ] Ouvrir le ticket
- [ ] **Résultat attendu**: Section "Notes Internes" n'apparaît PAS

#### Test 14.4: Templates response invisibles aux users
- [ ] Se connecter en user
- [ ] Ouvrir un ticket
- [ ] **Résultat attendu**: Dropdown "Insérer un modèle" n'apparaît PAS

---

## 📊 TESTS ANALYTICS & MÉTRIQUES

### 15. SLA Metrics (5 min)

**Créer des données de test**:
```sql
-- Créer un ticket et simuler une réponse admin rapide
INSERT INTO support_messages (ticket_id, message, sender_type, created_at)
VALUES (
  'TICKET_ID',
  'Réponse rapide',
  'admin',
  NOW() - interval '30 minutes'
);
```

- [ ] Vérifier que `first_response_at` est set
- [ ] Calculer SLA:
```sql
SELECT * FROM calculate_ticket_sla('TICKET_ID');
```
- [ ] **Résultat attendu**: first_response_time_hours < 1 (30min)

### 16. CSAT Metrics (3 min)

- [ ] Créer 3-4 surveys avec ratings variés (1 à 5 étoiles)
- [ ] Exécuter:
```sql
SELECT * FROM get_csat_summary(30);
```
- [ ] **Résultat attendu**: avg_rating calculé correctement

---

## 🐛 TESTS ERROR HANDLING

### 17. Gestion d'Erreurs (10 min)

#### Test 17.1: Validation formulaire
- [ ] Créer un ticket SANS remplir le sujet
- [ ] Cliquer "Créer"
- [ ] **Résultat attendu**: Erreur "Le sujet est requis"

#### Test 17.2: Upload fichier trop gros
- [ ] Essayer d'upload un fichier > 10MB
- [ ] **Résultat attendu**: Erreur "Fichier trop volumineux (max 10MB)"

#### Test 17.3: Type fichier non supporté
- [ ] Essayer d'upload un .exe
- [ ] **Résultat attendu**: Erreur "Type de fichier non supporté"

#### Test 17.4: Network offline
- [ ] DevTools → Network → Offline
- [ ] Essayer de créer un ticket
- [ ] **Résultat attendu**: Erreur "Problème de connexion"
- [ ] Réactiver network
- [ ] Retry → devrait marcher

#### Test 17.5: Supabase down (simulation)
- [ ] (Test manuel difficile - simuler via interceptor)
- [ ] Vérifier que l'app ne crash pas
- [ ] **Résultat attendu**: Message d'erreur graceful

---

## ✅ CHECKLIST FINALE

### Avant de déployer en production:

- [ ] Tous les tests fonctionnels User passent
- [ ] Tous les tests fonctionnels Admin passent
- [ ] Tous les tests database passent
- [ ] RLS fonctionne correctement
- [ ] Performance acceptable (< 2s load)
- [ ] Pas d'erreurs console dans DevTools
- [ ] Responsive design vérifié (desktop + mobile)
- [ ] Edge Functions déployées (optionnel pour MVP)
- [ ] Documentation à jour
- [ ] Guide utilisateur accessible

### Nice to have (post-MVP):
- [ ] Email notifications fonctionnelles
- [ ] AI categorization active
- [ ] Duplicate detection avec embeddings
- [ ] Alertes Slack/Email sur SLA breach
- [ ] Monitoring Papertrail/Better Stack

---

## 📝 RAPPORT DE BUGS

Si tu trouves des bugs pendant les tests, noter ici:

| Test # | Description | Severity | Status |
|--------|-------------|----------|--------|
| 1.2 | Upload image ne marche pas | High | Open |
| ... | ... | ... | ... |

---

**FIN DE LA CHECKLIST**

Temps total estimé: **1h30 - 2h** pour tous les tests manuels.
