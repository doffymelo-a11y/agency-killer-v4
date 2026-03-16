# ⚠️  MIGRATIONS URGENTES À APPLIQUER

**Date**: 2026-03-16
**Priorité**: CRITIQUE
**Durée estimée**: 3 minutes

---

## Problèmes Corrigés

### ✅ Problème 1: Création projet social_media échouait (scope)
- **Erreur**: `Supabase error: invalid input value for enum project_scope: "social_media"`
- **Cause**: L'enum PostgreSQL ne contenait pas la valeur 'social_media'
- **Solution**: Migration 011 ajoute cette valeur
- **Status**: ✅ APPLIQUÉE

### ✅ Problème 2: ProjectsView vide (aucun projet affiché)
- **Cause**: La colonne 'archived' n'existait pas
- **Solution**: Migration 012 ajoute cette colonne
- **Status**: ✅ APPLIQUÉE

### ⚠️ Problème 3: Création projet social_media échoue (agent doffy)
- **Erreur**: `Supabase error: invalid input value for enum agent_role: "doffy"`
- **Cause**: L'enum PostgreSQL ne contenait pas l'agent 'doffy'
- **Solution**: Migration 013 ajoute cet agent
- **Status**: ⏳ À APPLIQUER MAINTENANT

---

## Instructions d'Application

### Étape 1: Ouvrir Supabase Dashboard

1. Aller sur: https://supabase.com/dashboard/project/hwiyvpfaolmasqchqwsa/sql/new
2. Se connecter si nécessaire

### Étape 2: Appliquer Migration 011 (social_media scope)

1. Cliquer sur "New Query" dans le SQL Editor
2. Copier **TOUT** le contenu de `cockpit/supabase/migrations/011_add_social_media_scope.sql`
3. Coller dans l'éditeur SQL
4. Cliquer sur **"Run"** (bouton vert en bas à droite)
5. Vérifier qu'il n'y a pas d'erreur

**Contenu de la migration 011:**

```sql
-- ============================================
-- Migration 011: Add social_media to project_scope enum
-- ============================================
-- Date: 2026-03-16
-- Description: Add 'social_media' value to project_scope enum for Doffy agent

-- Add social_media to project_scope enum
ALTER TYPE project_scope ADD VALUE IF NOT EXISTS 'social_media';

-- Verify the change
COMMENT ON TYPE project_scope IS 'Project scopes: meta_ads, sem, seo, analytics, social_media, full_scale';
```

### Étape 3: Appliquer Migration 012 (archived column)

1. Cliquer sur "New Query" dans le SQL Editor
2. Copier **TOUT** le contenu de `cockpit/supabase/migrations/012_add_archived_column.sql`
3. Coller dans l'éditeur SQL
4. Cliquer sur **"Run"**
5. Vérifier qu'il n'y a pas d'erreur

**Contenu de la migration 012:**

```sql
-- ============================================
-- Migration 012: Add archived column to projects table
-- ============================================
-- Date: 2026-03-16
-- Description: Add archived column for archive/delete functionality

-- Add archived column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_projects_archived ON projects(archived);

-- Verify the change
COMMENT ON COLUMN projects.archived IS 'Flag to mark projects as archived (soft delete)';
```

### Étape 4: Appliquer Migration 013 (doffy agent) ⚠️ CRITIQUE

1. Cliquer sur "New Query" dans le SQL Editor
2. Copier **TOUT** le contenu de `cockpit/supabase/migrations/013_add_doffy_agent.sql`
3. Coller dans l'éditeur SQL
4. Cliquer sur **"Run"**
5. Vérifier qu'il n'y a pas d'erreur

**Contenu de la migration 013:**

```sql
-- ============================================
-- Migration 013: Add doffy to agent_role enum
-- ============================================
-- Date: 2026-03-16
-- Description: Add 'doffy' agent for social media campaigns

-- Add doffy to agent_role enum
ALTER TYPE agent_role ADD VALUE IF NOT EXISTS 'doffy';

-- Verify the change
COMMENT ON TYPE agent_role IS 'Agent roles: sora, luna, marcus, milo, doffy, orchestrator';
```

---

## Vérification

Après avoir appliqué les migrations, vérifier que :

1. ✅ Les projets social_media peuvent être créés sans erreur
2. ✅ La page ProjectsView affiche tous les projets
3. ✅ Les boutons Archive/Delete fonctionnent

---

## En Cas de Problème

Si une migration échoue :

1. Vérifier les erreurs dans la console Supabase
2. S'assurer que l'enum/colonne n'existe pas déjà
3. Contacter le support si nécessaire

---

**Note**: Ces migrations utilisent `IF NOT EXISTS` donc elles peuvent être exécutées plusieurs fois sans erreur.
