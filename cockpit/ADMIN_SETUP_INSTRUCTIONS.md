# 🔐 ADMIN SYSTEM SETUP - THE HIVE OS V4

## ✅ CE QUI A ÉTÉ CRÉÉ

### 1. Account Settings ✅
- Page de paramètres utilisateur: `/account`
- Change password
- View profile info
- Delete account (danger zone)

**Fichier:** `src/views/AccountSettingsView.tsx`

---

### 2. Admin Role System ✅
- Table `user_roles` avec 3 rôles: `user`, `admin`, `super_admin`
- Fonction `is_admin(user_id)` pour vérifier les permissions
- Fonction `get_global_stats()` pour stats système
- Vue `admin_users_stats` avec tous les users + stats

**Fichier:** `supabase/migrations/008_admin_roles.sql`

---

### 3. Admin Dashboard ✅
- Page admin: `/admin`
- Stats globales (total users, projects, tasks)
- Liste de tous les users avec leurs stats
- Recherche par email
- Badges de rôle (user/admin/super_admin)

**Fichier:** `src/views/AdminDashboardView.tsx`

---

### 4. UI Updates ✅
- Bouton "Admin" (rouge) dans `/projects` si user est admin
- Bouton "Settings" dans `/projects`
- Routes protégées pour `/admin` et `/account`

---

## 🚀 ÉTAPES À SUIVRE

### ÉTAPE 1: Appliquer la migration 008 (Admin Roles)

1. Ouvrez: https://supabase.com/dashboard/project/hwiyvpfaolmasqchqwsa/sql/new

2. Copiez-collez **TOUT** le contenu du fichier:
   `/cockpit/supabase/migrations/008_admin_roles.sql`

3. Cliquez "Run"

4. **Vérifiez que c'est OK:**
   - Table `user_roles` créée
   - Fonctions `is_admin`, `get_global_stats`, `create_user_role` créées
   - Vue `admin_users_stats` créée

---

### ÉTAPE 2: Vous donner le rôle super_admin

**Option A: Via Supabase SQL Editor (RECOMMANDÉ)**

1. Allez sur: https://supabase.com/dashboard/project/hwiyvpfaolmasqchqwsa/sql/new

2. **Récupérez votre user_id:**
   ```sql
   SELECT id, email FROM auth.users WHERE email = 'VOTRE_EMAIL@example.com';
   ```

3. **Copiez l'ID, puis exécutez:**
   ```sql
   UPDATE user_roles
   SET role = 'super_admin'
   WHERE user_id = 'VOTRE_USER_ID_ICI';
   ```

4. **Vérifiez:**
   ```sql
   SELECT u.email, ur.role
   FROM auth.users u
   LEFT JOIN user_roles ur ON u.id = ur.user_id
   WHERE u.email = 'VOTRE_EMAIL@example.com';
   ```

**Option B: Via Supabase Table Editor**

1. Allez sur: https://supabase.com/dashboard/project/hwiyvpfaolmasqchqwsa/editor

2. Table: `user_roles`

3. Trouvez votre ligne (votre user_id)

4. Double-cliquez sur la colonne `role`

5. Changez en `super_admin`

6. Sauvegardez

---

### ÉTAPE 3: Tester l'Admin Dashboard

1. Rechargez l'app: http://localhost:5173

2. Allez sur `/projects`

3. **Vous devriez voir:**
   - Bouton rouge "Admin" en haut à droite
   - Bouton "Settings"

4. Cliquez sur "Admin"

5. **Vous devriez voir:**
   - Stats globales (Total Users, Projects, Tasks)
   - Liste de tous les users
   - Vos stats personnelles dans la table

---

## 🎯 FONCTIONNALITÉS ADMIN

### Super Admin peut:
- ✅ Voir tous les users
- ✅ Voir stats globales
- ✅ Voir tous les projets (via RLS bypass)
- ✅ Changer les rôles des autres users
- ✅ Accéder au dashboard admin

### Admin peut:
- ✅ Voir tous les users (lecture seule)
- ✅ Voir stats globales
- ✅ Accéder au dashboard admin
- ❌ Changer les rôles (seul super_admin peut)

### User (normal):
- ❌ Pas d'accès au dashboard admin
- ✅ Accès seulement à ses propres projets

---

## 📊 ROLES HIÉRARCHIE

```
super_admin  →  Contrôle total (vous)
     ↓
   admin     →  Voir tout, modifier limité
     ↓
   user      →  Utilisateurs normaux (multi-tenant)
```

---

## 🔍 REQUÊTES UTILES

### Lister tous les users avec leurs rôles:
```sql
SELECT
  u.email,
  ur.role,
  u.created_at
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
ORDER BY u.created_at DESC;
```

### Voir les stats globales:
```sql
SELECT get_global_stats();
```

### Promouvoir un user en admin:
```sql
UPDATE user_roles
SET role = 'admin'
WHERE user_id = 'user-id-here';
```

### Rétrograder un admin en user:
```sql
UPDATE user_roles
SET role = 'user'
WHERE user_id = 'user-id-here';
```

---

## ⚠️ IMPORTANT

### Sécurité RLS

Les policies actuelles permettent:
- Users: voir seulement leurs données
- Admins: voir toutes les données (via `is_admin()`)

### Trigger Auto-Role

Quand un nouveau user s'inscrit:
- Automatiquement créé dans `user_roles` avec `role = 'user'`
- Vous devez manuellement promouvoir en `admin` ou `super_admin`

### Premier Super Admin

Vous **devez** vous donner le rôle `super_admin` manuellement (ÉTAPE 2 ci-dessus).
Après, vous pourrez promouvoir d'autres admins via le dashboard (feature à venir).

---

## 🚀 PROCHAINES ÉTAPES

Une fois l'admin setup terminé, nous allons continuer avec:
1. ✅ Account Settings + Admin Dashboard (FAIT)
2. ⏭️ Email verification handling
3. ⏭️ Better error messages
4. ⏭️ Responsive design
5. ⏭️ Stripe integration (payments)
6. ⏭️ Legal pages (Privacy, Terms)
7. ⏭️ Deploy staging

---

**Questions? Testez d'abord, puis dites-moi ce qui fonctionne ou pas!**
