# 🚀 Guide de Configuration Stripe - THE HIVE OS V4

Ce guide vous explique étape par étape comment configurer Stripe pour votre application SaaS.

---

## 📋 Vue d'ensemble

L'intégration Stripe comprend :
- **Checkout** : Processus de paiement sécurisé
- **Customer Portal** : Gestion de l'abonnement par l'utilisateur
- **Webhooks** : Synchronisation automatique Stripe ↔ Supabase
- **Usage Tracking** : Suivi de la consommation et limites

---

## 1️⃣ Créer votre compte Stripe

### Étape 1 : Inscription
1. Allez sur [stripe.com](https://stripe.com)
2. Cliquez sur "Sign up"
3. Remplissez vos informations

### Étape 2 : Mode Test
- Par défaut, vous êtes en **mode test**
- Utilisez les clés de test pour le développement
- Vous passerez en production après avoir tout testé

---

## 2️⃣ Récupérer vos clés API

### Dashboard Stripe → Developers → API keys

Vous aurez besoin de **3 clés** :

#### A) Clés publiques et secrètes
- **Publishable key** (commence par `pk_test_...`)
  - ✅ Peut être exposée côté client
  - À ajouter dans `.env` : `VITE_STRIPE_PUBLIC_KEY=pk_test_...`

- **Secret key** (commence par `sk_test_...`)
  - ⚠️ **NE JAMAIS** exposer côté client
  - À ajouter dans Supabase Edge Functions Secrets (voir étape 5)

#### B) Webhook Secret (à récupérer plus tard - étape 4)

---

## 3️⃣ Créer vos produits et prix

### Dashboard Stripe → Products → Add product

Créez **2 produits** :

#### Produit 1 : The Hive Pro
- **Name**: The Hive Pro
- **Description**: Plan professionnel avec 10 projets et agents illimités
- **Pricing**:
  - Price: €79.00
  - Billing period: Monthly
  - Type: Recurring
- **Metadata** (optionnel) :
  - `plan`: `pro`
- Cliquez sur "Save product"
- ✅ **Copiez le Price ID** (commence par `price_...`)

#### Produit 2 : The Hive Enterprise
- **Name**: The Hive Enterprise
- **Description**: Plan entreprise avec projets illimités, API, white-label
- **Pricing**:
  - Price: €299.00
  - Billing period: Monthly
  - Type: Recurring
- **Metadata** (optionnel) :
  - `plan`: `enterprise`
- Cliquez sur "Save product"
- ✅ **Copiez le Price ID** (commence par `price_...`)

### Ajouter les Price IDs dans .env
```bash
STRIPE_PRICE_ID_PRO=price_1234abcd...
STRIPE_PRICE_ID_ENTERPRISE=price_5678efgh...
```

---

## 4️⃣ Configurer le Webhook

### Dashboard Stripe → Developers → Webhooks → Add endpoint

#### A) URL du webhook
Votre URL sera :
```
https://[YOUR-PROJECT-REF].supabase.co/functions/v1/stripe-webhook
```

Exemple :
```
https://abcdefghijklmnop.supabase.co/functions/v1/stripe-webhook
```

#### B) Sélectionner les événements
Cochez les événements suivants :
- ✅ `checkout.session.completed`
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`

#### C) Récupérer le Webhook Secret
- Une fois créé, cliquez sur le webhook
- Section "Signing secret"
- Cliquez sur "Reveal" pour voir le secret
- ✅ **Copiez le Webhook Secret** (commence par `whsec_...`)

---

## 5️⃣ Déployer les Edge Functions Supabase

### A) Installer Supabase CLI

```bash
# macOS/Linux
brew install supabase/tap/supabase

# Windows
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### B) Login Supabase

```bash
cd /Users/azzedinezazai/Documents/Agency-Killer-V4/cockpit
supabase login
```

### C) Lier votre projet

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

Trouvez votre `PROJECT_REF` dans :
- Supabase Dashboard → Settings → General → Reference ID

### D) Configurer les secrets

```bash
# Stripe Secret Key
supabase secrets set STRIPE_SECRET_KEY=sk_test_...

# Stripe Webhook Secret
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs
supabase secrets set STRIPE_PRICE_ID_PRO=price_...
supabase secrets set STRIPE_PRICE_ID_ENTERPRISE=price_...

# App URL
supabase secrets set APP_URL=http://localhost:5173

# Supabase URLs (pour les webhooks)
supabase secrets set SUPABASE_URL=https://YOUR-PROJECT.supabase.co
supabase secrets set SUPABASE_ANON_KEY=your-anon-key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### E) Déployer les fonctions

```bash
# Déployer stripe-checkout
supabase functions deploy stripe-checkout

# Déployer stripe-portal
supabase functions deploy stripe-portal

# Déployer stripe-webhook
supabase functions deploy stripe-webhook
```

### F) Vérifier le déploiement

```bash
supabase functions list
```

Vous devriez voir :
```
┌──────────────────┬──────────┬─────────────────────┐
│ NAME             │ STATUS   │ UPDATED AT          │
├──────────────────┼──────────┼─────────────────────┤
│ stripe-checkout  │ ACTIVE   │ 2024-XX-XX XX:XX:XX │
│ stripe-portal    │ ACTIVE   │ 2024-XX-XX XX:XX:XX │
│ stripe-webhook   │ ACTIVE   │ 2024-XX-XX XX:XX:XX │
└──────────────────┴──────────┴─────────────────────┘
```

---

## 6️⃣ Tester l'intégration

### A) Cartes de test Stripe

Utilisez ces numéros de carte en mode test :

| Scénario | Numéro de carte | CVV | Date |
|----------|----------------|-----|------|
| ✅ Succès | 4242 4242 4242 4242 | 123 | Future |
| ❌ Échec | 4000 0000 0000 0002 | 123 | Future |
| ⏱️ 3D Secure | 4000 0027 6000 3184 | 123 | Future |

### B) Test complet

1. **Créer un compte** dans votre app
2. **Aller sur** `/billing`
3. **Cliquer** sur "Upgrade" pour Pro
4. **Utiliser** la carte de test : `4242 4242 4242 4242`
5. **Vérifier** :
   - Page de succès : `/billing?success=true`
   - Dashboard Stripe : paiement visible
   - Supabase DB : `subscriptions` table mise à jour

### C) Tester le webhook

```bash
# Installer Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Tester le webhook localement
stripe listen --forward-to https://YOUR-PROJECT.supabase.co/functions/v1/stripe-webhook

# Dans un autre terminal, déclencher un événement
stripe trigger checkout.session.completed
```

---

## 7️⃣ Passer en production

### A) Activer les paiements

1. Dashboard Stripe → "Activate payments"
2. Remplir les informations de votre entreprise
3. Vérifier votre identité

### B) Basculer les clés

```bash
# Mettre à jour .env avec les clés LIVE
VITE_STRIPE_PUBLIC_KEY=pk_live_...

# Mettre à jour les secrets Supabase avec les clés LIVE
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_... # Nouveau webhook en mode live

# Mettre à jour APP_URL
supabase secrets set APP_URL=https://your-domain.com
```

### C) Créer un nouveau webhook en mode LIVE

- Dashboard Stripe → Developers → Webhooks
- Basculer sur "Live mode" (en haut à droite)
- Ajouter un endpoint avec la même URL
- Copier le nouveau Webhook Secret (mode live)
- Le mettre dans les secrets Supabase

---

## 8️⃣ Résolution de problèmes

### Erreur: "No such price"
- ✅ Vérifiez que les Price IDs sont corrects
- ✅ Assurez-vous d'utiliser les bons IDs (test vs live)

### Erreur: "Webhook signature verification failed"
- ✅ Vérifiez que `STRIPE_WEBHOOK_SECRET` est correct
- ✅ Assurez-vous que l'URL du webhook est correcte

### Le webhook ne se déclenche pas
- ✅ Vérifiez les logs : Dashboard Stripe → Developers → Webhooks → Votre webhook → "Attempted events"
- ✅ Vérifiez les logs Supabase : Dashboard → Edge Functions → stripe-webhook

### "Failed to create checkout session"
- ✅ Vérifiez les logs de l'Edge Function : `supabase functions logs stripe-checkout`
- ✅ Vérifiez que tous les secrets sont définis

---

## 📚 Ressources

- [Documentation Stripe](https://stripe.com/docs)
- [Documentation Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Stripe Webhooks Best Practices](https://stripe.com/docs/webhooks/best-practices)

---

## ✅ Checklist finale

Avant de lancer en production :

- [ ] Compte Stripe créé et activé
- [ ] Produits Pro et Enterprise créés
- [ ] Price IDs copiés et ajoutés dans secrets
- [ ] Clés API (public + secret) récupérées
- [ ] Webhook configuré avec tous les événements
- [ ] Edge Functions déployées
- [ ] Tous les secrets configurés dans Supabase
- [ ] Tests effectués avec cartes de test
- [ ] Webhook testé avec Stripe CLI
- [ ] Mode production activé dans Stripe
- [ ] Clés LIVE mises à jour
- [ ] Nouveau webhook LIVE créé

---

## 🎉 Félicitations !

Votre système de paiement Stripe est maintenant configuré et prêt à l'emploi !

Pour toute question, consultez la [documentation Stripe](https://stripe.com/docs) ou créez une issue sur GitHub.
