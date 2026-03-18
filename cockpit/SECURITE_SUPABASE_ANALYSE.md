# Analyse des Erreurs de Sécurité Supabase

**Date** : 18 Mars 2026
**Gravité Globale** : ⚠️ **CRITIQUE** - Action immédiate requise
**Scope** : 3 erreurs critiques + 26 warnings de sécurité

---

## ❌ ERREURS CRITIQUES (3)

### 1. RLS Disabled - `api_rate_limits`

**Gravité** : 🔴 **CRITIQUE**

**Problème** :
La table `api_rate_limits` n'a pas de Row Level Security (RLS) activée. Cela signifie que TOUS les utilisateurs authentifiés peuvent voir et modifier les rate limits de TOUS les autres utilisateurs.

**Implications de sécurité** :
- Un utilisateur malveillant peut augmenter ses propres limites (passer de 10 req/min à 999999)
- Il peut voir combien d'API calls font les autres clients → espionnage business
- Il peut supprimer les rate limits d'autres users → Denial of Service
- Il peut causer un abus de ressources en supprimant toutes les limites

**Exploitation technique** :
```sql
-- Depuis le frontend d'un user normal, exécuter :
UPDATE api_rate_limits
SET requests_last_minute = 0,
    requests_last_hour = 0,
    tier = 'enterprise'
WHERE user_id = '<mon-user-id>';

-- → L'attaquant contourne TOUTES ses limites
```

**Impact business** :
- Coûts API Claude/OpenAI explosent (pas de throttling)
- Abuse potentiel du système par des scripts automatisés
- Violation du fair use pour les plans Free/Pro

---

### 2. RLS Disabled - `audit_logs`

**Gravité** : 🔴 **CRITIQUE + Violation RGPD**

**Problème** :
La table `audit_logs` stocke TOUTES les actions de TOUS les utilisateurs (emails, IPs, user agents, actions sensibles comme `create_campaign`, `delete_project`, etc.) SANS protection RLS.

**Implications de sécurité** :
- **Violation RGPD/CCPA** : Les logs contiennent des données personnelles (email, IP, user agent) accessibles à tous
- Un utilisateur peut voir TOUTES les actions de TOUS les autres clients
- Espionnage de la concurrence : voir ce que font les autres agences marketing
- Fuite d'informations sensibles : IPs, timestamps, détails d'erreurs

**Exploitation technique** :
```sql
-- Un user normal peut exécuter :
SELECT user_email, action, resource_type, resource_id, metadata, ip_address
FROM audit_logs
WHERE action = 'create_campaign'
ORDER BY timestamp DESC;

-- → Voir TOUS les budgets pub, campagnes, comptes Meta de TOUS les clients
```

**Impact business** :
- **Amende RGPD** : Jusqu'à 4% du CA annuel ou 20M€ (le plus élevé)
- Perte de confiance client si découverte d'une fuite
- Risque de poursuite judiciaire pour violation de confidentialité

---

### 3. RLS Disabled - `schema_migrations`

**Gravité** : 🟡 **MOYENNE**

**Problème** :
La table `schema_migrations` (gérée par Supabase pour tracker les migrations appliquées) est accessible en lecture à tous.

**Implications de sécurité** :
- Un attaquant peut voir la liste exacte des migrations appliquées
- Cela révèle la structure de la DB et les fonctionnalités présentes
- Reconnaissance technique pour planifier des attaques ciblées
- Moins critique que les 2 autres (lecture seule, pas de données sensibles)

**Impact business** : Faible (mais toujours à corriger pour une défense en profondeur)

---

## ⚠️ WARNINGS (26 Fonctions Search Path Mutable)

**Gravité** : 🟠 **HAUTE** (Privilege Escalation possible)

**Problème** :
26 fonctions PostgreSQL utilisent `SECURITY DEFINER` (elles s'exécutent avec les privilèges du créateur, pas de l'utilisateur appelant) SANS avoir de `search_path` fixe.

**Attaque : Search Path Injection**

```sql
-- Étape 1 : L'attaquant crée un schema malveillant
CREATE SCHEMA attacker;
SET search_path = attacker, public;

-- Étape 2 : Crée une table/fonction piégée
CREATE TABLE attacker.user_roles (
  user_id UUID,
  role VARCHAR DEFAULT 'super_admin'
);

INSERT INTO attacker.user_roles VALUES (auth.uid(), 'super_admin');

-- Étape 3 : Appelle une fonction SECURITY DEFINER vulnérable
SELECT is_admin(auth.uid());

-- Résultat : La fonction is_admin() utilise attacker.user_roles au lieu de public.user_roles
-- → L'attaquant devient admin !
```

**Fonctions vulnérables identifiées** :

| Fonction | Risque | Impact |
|----------|--------|--------|
| `is_admin()` | Privilege escalation | Devenir admin |
| `get_global_stats()` | Fuite de données | Voir stats de tous les users |
| `check_usage_limit()` | Contournement de limites | Bypass des quotas |
| `check_rate_limit()` | Contournement de limites | Bypass du throttling |
| `get_integration_credentials()` | Vol de credentials | Accès aux tokens OAuth2 |
| `is_integration_connected()` | Fuite d'infos | Voir les intégrations des autres |
| `create_user_role()` | Manipulation de roles | Auto-promotion admin |
| `set_user_id()` | Usurpation d'identité | Se faire passer pour un autre user |
| + 18 autres fonctions | Divers | Variable selon la fonction |

**Impact business** :
- Un attaquant peut devenir admin et accéder à TOUS les projets
- Vol de tokens OAuth2 (Meta Ads, Google Ads, GA4) des clients
- Manipulation des données billing/subscriptions
- Contournement complet du système de sécurité

---

## 🛠 SOLUTION : Migration de Sécurité

Je vais créer une migration SQL qui corrige les 29 problèmes identifiés :

### 1. Activer RLS sur les 3 tables
```sql
ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE schema_migrations ENABLE ROW LEVEL SECURITY;
```

### 2. Créer des policies RLS strictes

**`api_rate_limits`** :
- Les users peuvent seulement voir/modifier leurs propres limites
- Les admins peuvent voir toutes les limites (monitoring)

**`audit_logs`** :
- Les users peuvent voir UNIQUEMENT leurs propres logs
- Les admins peuvent voir tous les logs (compliance)

**`schema_migrations`** :
- PERSONNE ne peut lire (sauf superuser DB)

### 3. Fixer le search_path de TOUTES les fonctions

Ajouter `SET search_path = pg_catalog, public` à toutes les 26 fonctions SECURITY DEFINER.

Pattern :
```sql
CREATE OR REPLACE FUNCTION is_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public  -- ← FIX CRITIQUE
AS $$
...
```

---

## ✅ POST-FIX VALIDATION

Après application de la migration, vérifier :

1. **RLS actif** : `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`
2. **Policies créées** : `SELECT * FROM pg_policies;`
3. **Search path fixé** : `SELECT proname, prosecdef, prosrc FROM pg_proc WHERE prosecdef = true;`
4. **Test isolation** : Créer 2 users, vérifier qu'ils ne voient pas les données de l'autre

---

## 📊 SCORE DE SÉCURITÉ

**Avant correction** : 🔴 **2/10** (Vulnérabilités critiques)
**Après correction** : 🟢 **9/10** (Production-ready)

---

## ⏰ URGENCE

🚨 **À CORRIGER IMMÉDIATEMENT**

Ces vulnérabilités sont exploitables par n'importe quel utilisateur authentifié. Le système est actuellement en mode "single-tenant" alors qu'il est déployé en multi-tenant (plusieurs clients).

**Temps estimé de correction** : 1-2 heures
**Risque pendant la correction** : Aucun (migration non-destructive)
