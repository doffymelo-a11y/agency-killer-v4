# 📊 GUIDE MIGRATION SUPABASE - PAS À PAS

## 🎯 Objectif

Créer une table dans Supabase pour stocker les intégrations OAuth de manière sécurisée.

---

## 🔧 ÉTAPES DÉTAILLÉES

### Étape 1 : Ouvre Supabase Dashboard

1. Va sur https://supabase.com/dashboard
2. Connecte-toi avec ton compte
3. Sélectionne ton projet "The Hive" (ou celui que tu utilises)

### Étape 2 : Ouvre le SQL Editor

1. Dans le menu de gauche, clique sur **SQL Editor** (icône ⚡)
2. Clique sur **New query** (bouton vert en haut à droite)

### Étape 3 : Copie le code SQL

1. Ouvre le fichier `/cockpit/supabase/migrations/003_user_integrations.sql` sur ton ordinateur
2. **COPIE TOUT LE CONTENU** du fichier

### Étape 4 : ⚠️ IMPORTANT - Modifie UNE LIGNE

Dans le code SQL que tu viens de copier, cherche cette ligne (vers la ligne 15) :

```sql
credentials JSONB NOT NULL DEFAULT '{}',
```

**REMPLACE-LA** par :

```sql
credentials TEXT NOT NULL,
```

**Pourquoi ?**
Parce que nous stockons les credentials **CHIFFRÉES** sous forme de texte (AES-256-GCM), pas en JSON.

### Étape 5 : Colle et Execute

1. **COLLE** le code SQL modifié dans l'éditeur SQL de Supabase
2. Clique sur le bouton **Run** (ou **Exécuter**) en bas à droite
3. Tu devrais voir un message de succès ✅

### Étape 6 : Vérifie que ça a marché

1. Dans le menu de gauche, clique sur **Table Editor**
2. Tu devrais voir une nouvelle table appelée **user_integrations**
3. Si tu cliques dessus, tu verras les colonnes :
   - `id` (uuid)
   - `project_id` (uuid)
   - `user_id` (uuid)
   - `integration_type` (text)
   - `credentials` (text) ← doit être TEXT pas JSONB
   - `status` (text)
   - `created_at` (timestamp)
   - etc.

---

## ✅ C'EST TOUT !

Si tu vois la table `user_integrations` dans ton Table Editor, c'est bon ! ✅

---

## ❌ Si ça ne marche pas

**Erreur possible** : "relation already exists"
- **Solution** : La table existe déjà, c'est bon ! Passe à l'étape suivante.

**Erreur possible** : "permission denied"
- **Solution** : Assure-toi d'être connecté avec le bon compte Supabase

**Erreur possible** : "syntax error"
- **Solution** : Vérifie que tu as bien changé `JSONB` en `TEXT` pour la colonne `credentials`

---

## 🚀 Prochaine étape

Une fois la migration faite, tu pourras :
1. Tester la connexion OAuth Meta
2. Tester la connexion OAuth Google
3. Voir tes intégrations connectées dans la page Intégrations

---

**BESOIN D'AIDE ?** Dis-moi où tu bloques et je t'aide !
