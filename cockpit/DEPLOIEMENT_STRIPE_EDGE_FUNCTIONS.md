# 🚀 Déploiement Stripe Edge Functions - THE HIVE OS V4

**Date :** 2026-02-27
**Statut :** READY TO DEPLOY
**Référence :** PRD V4.4 - Phase 1 : Setup Stripe

---

## 📋 Prérequis

### 1. Compte Stripe configuré
- [x] Compte Stripe créé (mode Test activé)
- [ ] **2 Products créés** :
  - **THE HIVE OS - Pro** (49$/mois)
  - **THE HIVE OS - Enterprise** (299$/mois)
- [ ] **2 Price IDs récupérés** (format: `price_xxxxx`)
- [ ] **Webhook Secret récupéré** (après déploiement)

### 2. Supabase CLI installé
```bash
# Installation Supabase CLI (macOS)
brew install supabase/tap/supabase

# Vérification
supabase --version
```

### 3. Variables d'environnement requises
```env
# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxx          # ⚠️ OBLIGATOIRE
STRIPE_PRICE_ID_PRO=price_xxxxx          # ⚠️ OBLIGATOIRE
STRIPE_PRICE_ID_ENTERPRISE=price_xxxxx   # ⚠️ OBLIGATOIRE
STRIPE_WEBHOOK_SECRET=whsec_xxxxx        # ⚠️ Après déploiement

# Supabase (auto-récupérées)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Application
APP_URL=http://localhost:5173           # Dev: localhost | Prod: ton domaine
```

---

## 🎯 Phase 1 : Configuration Stripe Dashboard

### Étape 1.1 : Créer les Products & Prices

1. Va sur [Stripe Dashboard > Products](https://dashboard.stripe.com/test/products)

2. **Créer Product "THE HIVE OS - Pro"** :
   ```
   Name: THE HIVE OS - Pro
   Description: 10 projets, 500 tâches/mois, support email
   Pricing: Recurring
   Price: $49.00 USD / month
   Billing period: Monthly
   ```
   ➡️ **Copie le Price ID** (format: `price_1Abc123...`)

3. **Créer Product "THE HIVE OS - Enterprise"** :
   ```
   Name: THE HIVE OS - Enterprise
   Description: Projets illimités, tâches illimitées, support prioritaire
   Pricing: Recurring
   Price: $299.00 USD / month
   Billing period: Monthly
   ```
   ➡️ **Copie le Price ID** (format: `price_1Def456...`)

### Étape 1.2 : Activer le Customer Portal

1. Va sur [Stripe Dashboard > Settings > Customer Portal](https://dashboard.stripe.com/test/settings/billing/portal)

2. **Active les fonctionnalités** :
   - ✅ Cancel subscriptions
   - ✅ Update payment method
   - ✅ View invoices
   - ✅ Update billing information

3. **Configure les URLs** :
   ```
   Business name: THE HIVE OS
   Business website: [ton domaine ou localhost:5173 pour test]
   Privacy policy: [ton domaine]/privacy
   Terms of service: [ton domaine]/terms
   ```

4. **Save changes**

---

## 🔧 Phase 2 : Déploiement des Edge Functions

### Étape 2.1 : Login Supabase CLI

```bash
# Login (ouvre le browser pour auth)
supabase login

# Lier au projet THE HIVE OS V4
cd /Users/azzedinezazai/Documents/Agency-Killer-V4/cockpit
supabase link --project-ref <TON_PROJECT_REF>

# Récupérer ton PROJECT_REF:
# Va sur https://supabase.com/dashboard/project/<PROJECT_REF>/settings/general
# Copie le "Reference ID"
```

### Étape 2.2 : Configurer les Secrets

```bash
# ⚠️ REMPLACE LES VALEURS PAR TES VRAIES CLÉS STRIPE

# 1. Stripe Secret Key (Dashboard > Developers > API Keys)
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx

# 2. Price IDs (créés à l'étape 1.1)
supabase secrets set STRIPE_PRICE_ID_PRO=price_1Abc123xxxxx
supabase secrets set STRIPE_PRICE_ID_ENTERPRISE=price_1Def456xxxxx

# 3. App URL (localhost pour test, ton domaine en prod)
supabase secrets set APP_URL=http://localhost:5173

# Vérifier les secrets
supabase secrets list
```

**⚠️ IMPORTANT :** `STRIPE_WEBHOOK_SECRET` sera configuré après l'étape 2.4 !

### Étape 2.3 : Déployer les 3 Functions

```bash
# Déployer toutes les functions en une commande
supabase functions deploy stripe-checkout
supabase functions deploy stripe-portal
supabase functions deploy stripe-webhook

# Vérifier le déploiement
supabase functions list
```

**Résultat attendu :**
```
┌─────────────────┬────────┬─────────────────────────────────────────────┐
│ NAME            │ STATUS │ URL                                         │
├─────────────────┼────────┼─────────────────────────────────────────────┤
│ stripe-checkout │ ACTIVE │ https://<PROJECT_REF>.supabase.co/functions/│
│ stripe-portal   │ ACTIVE │ v1/stripe-checkout                          │
│ stripe-webhook  │ ACTIVE │                                             │
└─────────────────┴────────┴─────────────────────────────────────────────┘
```

### Étape 2.4 : Configurer le Webhook Stripe

1. **Copie l'URL du webhook** :
   ```
   https://<TON_PROJECT_REF>.supabase.co/functions/v1/stripe-webhook
   ```

2. **Va sur Stripe Dashboard > [Webhooks](https://dashboard.stripe.com/test/webhooks)**

3. **Clique "Add endpoint"** :
   ```
   Endpoint URL: https://<PROJECT_REF>.supabase.co/functions/v1/stripe-webhook
   Description: THE HIVE OS V4 - Subscription Sync
   ```

4. **Sélectionne les événements** :
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`

5. **Add endpoint**

6. **Copie le "Signing secret"** (format: `whsec_xxxxx`)

7. **Configure le secret dans Supabase** :
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

   # Redéployer stripe-webhook pour prendre en compte le secret
   supabase functions deploy stripe-webhook
   ```

---

## 🧪 Phase 3 : Tests End-to-End

### Test 1 : Stripe Checkout Function

```bash
# Récupère ton ANON_KEY
# Dashboard Supabase > Settings > API > anon public

curl -X POST \
  'https://<PROJECT_REF>.supabase.co/functions/v1/stripe-checkout' \
  -H 'Authorization: Bearer <TON_ANON_KEY>' \
  -H 'Content-Type: application/json' \
  -d '{
    "plan": "pro",
    "user_id": "00000000-0000-0000-0000-000000000000",
    "user_email": "test@example.com"
  }'
```

**Résultat attendu :**
```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_test_xxxxx"
}
```

➡️ **Ouvre l'URL dans un browser** et teste le paiement avec :
```
Card: 4242 4242 4242 4242
Date: 12/34
CVC: 123
ZIP: 12345
```

### Test 2 : Webhook Stripe

1. **Va sur Stripe Dashboard > Webhooks > [Ton endpoint]**

2. **Clique "Send test webhook"**

3. **Choisis `checkout.session.completed`**

4. **Vérifie les logs Supabase** :
   ```bash
   supabase functions logs stripe-webhook --tail
   ```

**Résultat attendu :**
```
[Stripe Webhook] Event: checkout.session.completed
[Webhook] ✅ Subscription created for user xxxxx
```

5. **Vérifie la table `subscriptions`** :
   ```sql
   SELECT * FROM subscriptions ORDER BY created_at DESC LIMIT 1;
   ```

### Test 3 : Customer Portal Function

```bash
# ⚠️ REMPLACE <USER_ID> par un user_id réel qui a une subscription

curl -X POST \
  'https://<PROJECT_REF>.supabase.co/functions/v1/stripe-portal' \
  -H 'Authorization: Bearer <TON_ANON_KEY>' \
  -H 'Content-Type: application/json' \
  -d '{
    "user_id": "<USER_ID_AVEC_SUBSCRIPTION>"
  }'
```

**Résultat attendu :**
```json
{
  "url": "https://billing.stripe.com/p/session/xxxxx"
}
```

### Test 4 : Flow complet depuis le Frontend

1. **Lance l'app locale** :
   ```bash
   cd /Users/azzedinezazai/Documents/Agency-Killer-V4/cockpit
   npm run dev
   ```

2. **Connecte-toi avec un compte test**

3. **Va sur `/billing`**

4. **Clique "Upgrade to Pro"**

5. **Vérifie que le checkout s'ouvre**

6. **Complète le paiement (carte test 4242...)**

7. **Vérifie que tu reviens sur `/billing?success=true`**

8. **Vérifie que le plan est mis à jour dans l'UI**

---

## 📊 Vérifications de Sécurité

### ✅ Checklist de sécurité

- [ ] **Secrets JAMAIS dans le code frontend** (✅ dans Edge Functions uniquement)
- [ ] **CORS configuré correctement** (✅ `Access-Control-Allow-Origin: *` pour test, restreindre en prod)
- [ ] **Webhook signature vérifiée** (✅ `stripe.webhooks.constructEventAsync`)
- [ ] **RLS activé sur `subscriptions`** (✅ vérifier avec `SELECT * FROM pg_policies`)
- [ ] **Service Role Key utilisée dans webhook** (✅ bypass RLS pour les updates Stripe)
- [ ] **User auth vérifiée dans checkout/portal** (✅ Authorization header requis)

### Vérifier RLS sur subscriptions

```sql
-- Doit retourner 2 policies minimum
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename = 'subscriptions';
```

---

## 🐛 Troubleshooting

### Erreur : "Missing STRIPE_SECRET_KEY"

**Cause :** Secret pas configuré dans Supabase

**Solution :**
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxxxx
supabase functions deploy stripe-webhook
```

### Erreur : "Invalid signature" (webhook)

**Cause :** `STRIPE_WEBHOOK_SECRET` incorrect ou non configuré

**Solution :**
1. Récupère le signing secret depuis Stripe Dashboard > Webhooks
2. Configure-le :
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   supabase functions deploy stripe-webhook
   ```

### Webhook ne se déclenche pas

**Cause :** Endpoint pas configuré dans Stripe ou URL incorrecte

**Solution :**
1. Vérifie l'URL du webhook :
   ```
   https://<PROJECT_REF>.supabase.co/functions/v1/stripe-webhook
   ```
2. Teste manuellement depuis Stripe Dashboard > Webhooks > Send test webhook

### Erreur : "No Stripe customer found"

**Cause :** L'utilisateur n'a pas encore fait de checkout

**Solution :**
- L'utilisateur doit d'abord passer par le checkout
- Ou créer manuellement une entrée dans `subscriptions` pour test

### Logs des Edge Functions

```bash
# Logs en temps réel
supabase functions logs stripe-webhook --tail
supabase functions logs stripe-checkout --tail
supabase functions logs stripe-portal --tail

# Logs des dernières 24h
supabase functions logs stripe-webhook --since 24h
```

---

## 🎯 Migration Mode Test → Production

### Quand tu passes en PRODUCTION :

1. **Stripe Dashboard** :
   - Bascule de "Test mode" à "Live mode" (toggle en haut à droite)
   - Recrée les 2 Products (Pro & Enterprise) en mode LIVE
   - Recrée le Webhook endpoint avec l'URL PRODUCTION

2. **Supabase Secrets** :
   ```bash
   # ⚠️ UTILISE LES CLÉS LIVE (sk_live_xxxxx, whsec_live_xxxxx)
   supabase secrets set STRIPE_SECRET_KEY=sk_live_xxxxx
   supabase secrets set STRIPE_PRICE_ID_PRO=price_live_xxxxx
   supabase secrets set STRIPE_PRICE_ID_ENTERPRISE=price_live_xxxxx
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_live_xxxxx
   supabase secrets set APP_URL=https://ton-domaine.com

   # Redéployer
   supabase functions deploy stripe-checkout
   supabase functions deploy stripe-portal
   supabase functions deploy stripe-webhook
   ```

3. **Frontend (cockpit/.env.production)** :
   ```env
   VITE_SUPABASE_URL=https://<PROJECT_REF>.supabase.co
   VITE_SUPABASE_ANON_KEY=<ANON_KEY>
   # ⚠️ PAS DE CLÉS STRIPE DANS LE FRONTEND !
   ```

4. **Customer Portal URLs** :
   - Update dans Stripe Dashboard > Settings > Customer Portal
   - Privacy: `https://ton-domaine.com/privacy`
   - Terms: `https://ton-domaine.com/terms`

---

## 📈 État du Déploiement (Tracking)

| Étape | Statut | Notes |
|-------|--------|-------|
| Supabase CLI installé | ⏳ À faire | `brew install supabase/tap/supabase` |
| Stripe Products créés | ⏳ À faire | 2 products (Pro, Enterprise) |
| Price IDs récupérés | ⏳ À faire | Copier depuis Stripe Dashboard |
| Secrets configurés | ⏳ À faire | `supabase secrets set ...` |
| Functions déployées | ⏳ À faire | `supabase functions deploy ...` |
| Webhook configuré | ⏳ À faire | Stripe Dashboard > Webhooks |
| Tests checkout | ⏳ À faire | Carte test 4242... |
| Tests webhook | ⏳ À faire | Send test webhook |
| Tests portal | ⏳ À faire | User avec subscription |
| Flow complet validé | ⏳ À faire | `/billing` → checkout → success |

---

## ✅ Validation Finale

**Déploiement réussi si :** ✅

1. ✅ 3 Edge Functions déployées et ACTIVE
2. ✅ Webhook Stripe configuré avec 5 événements
3. ✅ Test checkout fonctionne (URL retournée)
4. ✅ Paiement test complété avec succès
5. ✅ Webhook reçu et traité (logs OK)
6. ✅ Subscription créée dans Supabase (table `subscriptions`)
7. ✅ Plan affiché correctement dans `/billing`
8. ✅ Customer Portal accessible

---

## 🚀 Prochaines Étapes (Roadmap)

### Phase 2 : Testing & Polish
- [ ] Tests Playwright end-to-end (flows paiement)
- [ ] Monitoring Sentry (erreurs Edge Functions)
- [ ] Analytics Posthog (conversions billing)

### Phase 3 : Production
- [ ] Migration mode Test → Live
- [ ] Build optimisé (`npm run build`)
- [ ] Deploy Vercel/Netlify
- [ ] DNS + SSL configurés
- [ ] Webhook production testé

### Phase 4 : Scale
- [ ] Métriques billing (MRR, churn)
- [ ] Emails transactionnels (Resend)
- [ ] Coupons/Promotions (Stripe Coupons)
- [ ] Trials 14 jours (Stripe trial_period_days)

---

**Dernière mise à jour :** 2026-02-27
**Responsable :** Claude Code (Terminal CLI)
**Référence :** PRD_THE_HIVE_OS_V4.4.md - Phase 1: Setup Stripe
**Status :** ✅ READY TO DEPLOY
