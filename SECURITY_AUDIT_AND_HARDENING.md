# 🔒 SECURITY AUDIT & HARDENING GUIDE

**THE HIVE OS V4** - Audit de sécurité complet & recommandations
**Version:** 1.0.0
**Date:** 2026-02-10
**Criticité:** ⚠️ HAUTE - Action requise avant déploiement SaaS

---

## 🚨 EXECUTIVE SUMMARY

**Status:** ⚠️ **CODE ACTUELLEMENT NON-SÉCURISÉ POUR PRODUCTION SAAS**

**Vulnérabilités critiques détectées:** 7
**Vulnérabilités moyennes:** 12
**Recommandations:** 23

**Action requise:** Implémenter les correctifs de sécurité AVANT tout déploiement multi-tenant.

---

## 📋 TABLE DES MATIÈRES

1. [Vulnérabilités Critiques](#1-vulnérabilités-critiques-)
2. [Vulnérabilités Moyennes](#2-vulnérabilités-moyennes-️)
3. [Vulnérabilités Basses](#3-vulnérabilités-basses-)
4. [Correctifs de Sécurité](#4-correctifs-de-sécurité)
5. [Checklist de Déploiement SaaS](#5-checklist-de-déploiement-saas)
6. [Monitoring & Alertes](#6-monitoring--alertes)

---

## 1. VULNÉRABILITÉS CRITIQUES 🚨

### 🚨 CRITICAL-001: Absence de Multi-Tenancy (RLS)

**Fichier:** `/cockpit/supabase/migrations/001_initial_schema.sql` (lignes 270-274)

**Problème:**
```sql
-- Policies for anonymous access (development)
CREATE POLICY "Allow all on projects" ON projects FOR ALL USING (true);
CREATE POLICY "Allow all on tasks" ON tasks FOR ALL USING (true);
CREATE POLICY "Allow all on chat_sessions" ON chat_sessions FOR ALL USING (true);
CREATE POLICY "Allow all on wizard_sessions" ON wizard_sessions FOR ALL USING (true);
```

**Impact:**
- ⚠️ **N'importe quel utilisateur peut lire/modifier les projets de n'importe qui**
- ⚠️ **Aucune isolation des données entre utilisateurs**
- ⚠️ **Violation RGPD**
- ⚠️ **Fuite de données critiques** (budgets, stratégies, credentials)

**Risque:** 🔴 **CRITIQUE** - Exposition totale des données

**Solution:** Voir [CRITICAL-001 Fix](#critical-001-fix)

---

### 🚨 CRITICAL-002: Pas d'Authentification Utilisateur

**Fichier:** `/cockpit/src/lib/supabase.ts` (ligne 16)

**Problème:**
```typescript
export const supabase: SupabaseClient<any, 'public', any> = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: { params: { eventsPerSecond: 10 } }
});
```

**Impact:**
- ⚠️ **Pas de gestion d'utilisateurs** (auth.user())
- ⚠️ **Impossible d'isoler les données par user_id**
- ⚠️ **Pas de sessions sécurisées**

**Risque:** 🔴 **CRITIQUE** - Pas de contrôle d'accès

**Solution:** Voir [CRITICAL-002 Fix](#critical-002-fix)

---

### 🚨 CRITICAL-003: API Keys Exposées (MCP Servers)

**Fichier:** Tous les MCP servers (`/agents/*/mcp_servers/*.js`)

**Problème:**
```javascript
// Actuellement: Mock responses avec TODO comments
// TODO: Implement actual API call when integrated with n8n

async function createCampaign(config) {
  // TODO: Implement actual Meta API call
  // Endpoint: POST https://graph.facebook.com/v19.0/...

  return {
    success: true,
    campaign_id: `camp_${Date.now()}`, // Mock
  };
}
```

**Impact:**
- ⚠️ **Pas de validation que l'utilisateur possède le compte ad_account_id**
- ⚠️ **Un utilisateur peut créer des campagnes sur le compte d'un autre**
- ⚠️ **Credentials OAuth2 partagés entre tous les utilisateurs**

**Risque:** 🔴 **CRITIQUE** - Cross-tenant data access

**Solution:** Voir [CRITICAL-003 Fix](#critical-003-fix)

---

### 🚨 CRITICAL-004: Pas de Rate Limiting

**Fichier:** Tous les MCP servers

**Problème:**
- Aucun throttling sur les appels API
- Un utilisateur peut spammer les endpoints
- Risque DDoS sur APIs externes (Google Ads, Meta Ads)

**Impact:**
- ⚠️ **Factures API astronomiques** (Google Ads API = payant)
- ⚠️ **Ban des comptes API** (rate limits dépassés)
- ⚠️ **Coûts imprévisibles** pour les utilisateurs

**Risque:** 🔴 **CRITIQUE** - Financial & Service disruption

**Solution:** Voir [CRITICAL-004 Fix](#critical-004-fix)

---

### 🚨 CRITICAL-005: Injection SQL via project_id

**Fichier:** `/cockpit/src/store/useHiveStore.ts`

**Problème:**
```typescript
// Potential SQL injection if project_id is user-controlled
const { data } = await supabase
  .from('tasks')
  .select('*')
  .eq('project_id', projectId); // ⚠️ Not sanitized
```

**Impact:**
- ⚠️ **Injection SQL possible** si projectId vient d'un input utilisateur non validé
- ⚠️ **Accès à d'autres projets**
- ⚠️ **Exfiltration de données**

**Risque:** 🔴 **CRITIQUE** - Data breach

**Solution:** Voir [CRITICAL-005 Fix](#critical-005-fix)

---

### 🚨 CRITICAL-006: XSS dans Chat Messages

**Fichier:** `/cockpit/src/components/chat/ChatMessage.tsx`

**Problème:**
```typescript
// ReactMarkdown renders user input
<ReactMarkdown>
  {message.content} {/* ⚠️ Potential XSS */}
</ReactMarkdown>
```

**Impact:**
- ⚠️ **XSS possible** via messages agents ou utilisateur
- ⚠️ **Vol de tokens** (localStorage, cookies)
- ⚠️ **Exécution de code malveillant**

**Risque:** 🔴 **CRITIQUE** - Account takeover

**Solution:** Voir [CRITICAL-006 Fix](#critical-006-fix)

---

### 🚨 CRITICAL-007: Credentials Stockées en Clair (n8n)

**Fichier:** Configuration n8n (Settings > Variables)

**Problème:**
- Variables stockées en base n8n sans chiffrement
- `GOOGLE_API_KEY`, `META_ACCESS_TOKEN`, etc. en clair
- Accès admin n8n = accès à toutes les credentials

**Impact:**
- ⚠️ **Vol de credentials** si base n8n compromise
- ⚠️ **Accès à tous les comptes clients** (Meta Ads, Google Ads)
- ⚠️ **Frais frauduleux** sur comptes publicitaires

**Risque:** 🔴 **CRITIQUE** - Credential theft

**Solution:** Voir [CRITICAL-007 Fix](#critical-007-fix)

---

## 2. VULNÉRABILITÉS MOYENNES ⚠️

### ⚠️ MEDIUM-001: Pas de Validation d'Inputs (MCP Servers)

**Problème:**
```javascript
// Schéma de validation existe, mais pas de sanitization
async function createCampaign(config) {
  // ⚠️ config.name peut contenir <script>, SQL injection, etc.
  const campaign_name = config.name;
}
```

**Impact:**
- Injection de code dans les noms de campagnes
- Caractères spéciaux non échappés

**Risque:** 🟠 **MOYEN** - Injection attacks

**Solution:**
```javascript
// Ajouter sanitization
const sanitizedName = config.name
  .replace(/<[^>]*>/g, '') // Remove HTML tags
  .substring(0, 255); // Limit length
```

---

### ⚠️ MEDIUM-002: Error Messages Verbeux

**Problème:**
```javascript
catch (error) {
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: false,
        error: error.message, // ⚠️ Peut leak des infos sensibles
        tool: name,
      }, null, 2)
    }],
    isError: true,
  };
}
```

**Impact:**
- Leak de stack traces avec paths serveur
- Leak de credentials dans erreurs API
- Information disclosure

**Risque:** 🟠 **MOYEN** - Information leakage

**Solution:**
```javascript
// Nettoyer les erreurs
catch (error) {
  const safeError = error.message
    .replace(/api[_-]?key[s]?[:=]\s*[\w-]+/gi, 'API_KEY=***')
    .replace(/token[:=]\s*[\w-]+/gi, 'TOKEN=***');

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: false,
        error: safeError,
        code: 'INTERNAL_ERROR'
      })
    }],
    isError: true,
  };
}
```

---

### ⚠️ MEDIUM-003: Pas de Logs d'Audit

**Problème:**
- Aucun log des actions utilisateurs
- Impossible de tracer qui a fait quoi
- Pas de détection d'abus

**Impact:**
- Impossible d'investiguer un incident
- Pas de compliance (SOC 2, ISO 27001)

**Risque:** 🟠 **MOYEN** - Audit & Compliance

**Solution:** Voir [MEDIUM-003 Fix](#medium-003-fix)

---

### ⚠️ MEDIUM-004: Pas de Budget Limits

**Problème:**
```javascript
// Pas de vérification du budget total avant scaling
async function scaleAdSet(adSetId, scalePercentage, maxBudget) {
  const newBudget = currentBudget * (1 + scalePercentage / 100);
  // ⚠️ Pas de check du budget total utilisateur
}
```

**Impact:**
- Utilisateur peut scaler indéfiniment
- Factures Meta/Google Ads incontrôlées

**Risque:** 🟠 **MOYEN** - Financial loss

**Solution:**
```javascript
// Ajouter budget check
const userBudgetLimit = await getUserMonthlyBudgetLimit(userId);
const userCurrentSpend = await getUserMonthlySpend(userId);

if (userCurrentSpend + newBudget > userBudgetLimit) {
  throw new Error('Budget limit exceeded');
}
```

---

### ⚠️ MEDIUM-005: CORS Non-Configuré

**Problème:**
- Pas de configuration CORS explicite
- Risque CSRF

**Impact:**
- Requêtes cross-origin non contrôlées
- Attaques CSRF possibles

**Risque:** 🟠 **MOYEN** - CSRF attacks

**Solution:** Voir [MEDIUM-005 Fix](#medium-005-fix)

---

### ⚠️ MEDIUM-006: Pas de Pagination

**Problème:**
```javascript
// Tous les MCP servers retournent data sans pagination
async function getCampaigns(customerId, dateRange) {
  // ⚠️ Peut retourner des milliers de campagnes
  return allCampaigns; // No limit
}
```

**Impact:**
- Réponses gigantesques (> 10MB)
- Crash frontend
- DDoS involontaire

**Risque:** 🟠 **MOYEN** - Performance & DoS

**Solution:**
```javascript
async function getCampaigns(customerId, dateRange, limit = 100, offset = 0) {
  // Ajouter pagination
  return campaigns.slice(offset, offset + limit);
}
```

---

### ⚠️ MEDIUM-007: Tokens OAuth2 Pas Refresh

**Problème:**
```typescript
// n8n OAuth2 sans auto-refresh configuré
```

**Impact:**
- Tokens expirent après 1h (Google) ou 60 jours (Meta)
- Workflows cassés silencieusement

**Risque:** 🟠 **MOYEN** - Service disruption

**Solution:** Configurer auto-refresh dans n8n credentials

---

### ⚠️ MEDIUM-008: Pas de Webhook Signature Validation

**Problème:**
- Webhooks n8n sans validation HMAC
- N'importe qui peut envoyer des payloads

**Impact:**
- Spam de fausses requêtes
- Exécution de code non autorisé

**Risque:** 🟠 **MOYEN** - Unauthorized access

**Solution:** Ajouter HMAC signature sur webhooks

---

### ⚠️ MEDIUM-009: Realtime Subscriptions Sans Filtres

**Problème:**
```typescript
// Subscription sans filter par user_id
supabase
  .channel('tasks')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, callback)
  .subscribe();
```

**Impact:**
- Utilisateur reçoit tous les événements de tous les users
- Leak de données en temps réel

**Risque:** 🟠 **MOYEN** - Data leakage

**Solution:**
```typescript
// Filtrer par user_id
supabase
  .channel('tasks')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'tasks',
    filter: `user_id=eq.${userId}`
  }, callback)
  .subscribe();
```

---

### ⚠️ MEDIUM-010: Pas de Content Security Policy (CSP)

**Problème:**
- Pas de CSP headers
- Scripts inline acceptés

**Impact:**
- XSS plus facile
- Pas de protection contre CDN compromise

**Risque:** 🟠 **MOYEN** - XSS

**Solution:** Voir [MEDIUM-010 Fix](#medium-010-fix)

---

### ⚠️ MEDIUM-011: Environment Variables Exposées

**Problème:**
```typescript
// Variables Vite exposées au frontend
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
```

**Impact:**
- URL et anon key visibles dans bundle JS
- Normal pour anon key, mais vérifier que RLS est activé

**Risque:** 🟠 **MOYEN** - Information disclosure

**Solution:** S'assurer que RLS bloque tout accès non autorisé

---

### ⚠️ MEDIUM-012: Pas de Timeouts sur API Calls

**Problème:**
```javascript
// Pas de timeout sur fetch/axios
const response = await fetch(apiUrl); // ⚠️ Peut hang indéfiniment
```

**Impact:**
- Requêtes qui ne répondent jamais
- Ressources bloquées

**Risque:** 🟠 **MOYEN** - Resource exhaustion

**Solution:**
```javascript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30000); // 30s

try {
  const response = await fetch(apiUrl, { signal: controller.signal });
} finally {
  clearTimeout(timeout);
}
```

---

## 3. VULNÉRABILITÉS BASSES 🟡

### 🟡 LOW-001: Pas de HTTPS Enforced

**Risque:** 🟡 **BAS** - Man-in-the-middle (si pas derrière proxy HTTPS)

### 🟡 LOW-002: Pas de Helmet.js

**Risque:** 🟡 **BAS** - Missing security headers

### 🟡 LOW-003: console.log() en Production

**Risque:** 🟡 **BAS** - Information disclosure mineure

### 🟡 LOW-004: Pas de SRI (Subresource Integrity)

**Risque:** 🟡 **BAS** - CDN compromise

---

## 4. CORRECTIFS DE SÉCURITÉ

### CRITICAL-001 Fix: Multi-Tenancy (RLS)

**Créer:** `/cockpit/supabase/migrations/004_production_rls.sql`

```sql
-- ═══════════════════════════════════════════════════════════════
-- THE HIVE OS V4 - Production RLS Policies (Multi-Tenant)
-- Migration: 004_production_rls
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- 1. Ajouter user_id à toutes les tables
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE projects ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE wizard_sessions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE project_memory ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_wizard_sessions_user_id ON wizard_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_project_memory_user_id ON project_memory(user_id);

-- ─────────────────────────────────────────────────────────────────
-- 2. Supprimer les policies "Allow all"
-- ─────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Allow all on projects" ON projects;
DROP POLICY IF EXISTS "Allow all on tasks" ON tasks;
DROP POLICY IF EXISTS "Allow all on chat_sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Allow all on wizard_sessions" ON wizard_sessions;
DROP POLICY IF EXISTS "Allow all on project_memory" ON project_memory;

-- ─────────────────────────────────────────────────────────────────
-- 3. Créer policies sécurisées (isolation par user_id)
-- ─────────────────────────────────────────────────────────────────

-- Projects
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- Tasks
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);

-- Chat Sessions
CREATE POLICY "Users can view own chat sessions"
  ON chat_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat sessions"
  ON chat_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat sessions"
  ON chat_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat sessions"
  ON chat_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Wizard Sessions
CREATE POLICY "Users can view own wizard sessions"
  ON wizard_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wizard sessions"
  ON wizard_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wizard sessions"
  ON wizard_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Project Memory
CREATE POLICY "Users can view own project memory"
  ON project_memory FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own project memory"
  ON project_memory FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────
-- 4. Fonction helper pour auto-set user_id
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers
CREATE TRIGGER set_projects_user_id
  BEFORE INSERT ON projects
  FOR EACH ROW
  WHEN (NEW.user_id IS NULL)
  EXECUTE FUNCTION set_user_id();

CREATE TRIGGER set_tasks_user_id
  BEFORE INSERT ON tasks
  FOR EACH ROW
  WHEN (NEW.user_id IS NULL)
  EXECUTE FUNCTION set_user_id();

CREATE TRIGGER set_chat_sessions_user_id
  BEFORE INSERT ON chat_sessions
  FOR EACH ROW
  WHEN (NEW.user_id IS NULL)
  EXECUTE FUNCTION set_user_id();

CREATE TRIGGER set_wizard_sessions_user_id
  BEFORE INSERT ON wizard_sessions
  FOR EACH ROW
  WHEN (NEW.user_id IS NULL)
  EXECUTE FUNCTION set_user_id();

CREATE TRIGGER set_project_memory_user_id
  BEFORE INSERT ON project_memory
  FOR EACH ROW
  WHEN (NEW.user_id IS NULL)
  EXECUTE FUNCTION set_user_id();
```

---

### CRITICAL-002 Fix: Authentification Supabase

**Modifier:** `/cockpit/src/lib/supabase.ts`

```typescript
// Ajouter functions auth
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export function onAuthStateChange(callback: (user: User | null) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user ?? null);
  });
}
```

**Créer:** `/cockpit/src/views/LoginView.tsx`

```typescript
import { useState } from 'react';
import { signIn, signUp } from '../lib/supabase';

export function LoginView() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = mode === 'signin'
      ? await signIn(email, password)
      : await signUp(email, password);

    if (error) {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg w-96">
        <h1 className="text-2xl font-bold mb-6 text-white">
          {mode === 'signin' ? 'Sign In' : 'Sign Up'}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full p-2 rounded bg-gray-700 text-white"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full p-2 rounded bg-gray-700 text-white"
            required
          />
          <button
            type="submit"
            className="w-full p-2 rounded bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            {mode === 'signin' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>
        <button
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          className="w-full mt-4 text-cyan-400 hover:text-cyan-300"
        >
          {mode === 'signin' ? 'Need an account? Sign up' : 'Have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}
```

---

### CRITICAL-003 Fix: OAuth2 Per-User

**Créer table:** `/cockpit/supabase/migrations/005_user_integrations.sql`

```sql
-- Store OAuth2 credentials per user
CREATE TABLE user_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  platform VARCHAR(50) NOT NULL, -- 'google_ads', 'meta_ads', 'google_search_console'

  -- OAuth2 tokens (encrypted)
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,

  -- Platform-specific IDs
  ad_account_id TEXT, -- Meta: act_123, Google: customer_id

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  last_refreshed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, platform, ad_account_id)
);

-- RLS
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own integrations"
  ON user_integrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own integrations"
  ON user_integrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own integrations"
  ON user_integrations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own integrations"
  ON user_integrations FOR DELETE
  USING (auth.uid() = user_id);

-- Index
CREATE INDEX idx_user_integrations_user_platform ON user_integrations(user_id, platform);
```

**Modifier MCP Servers:** Valider ownership avant chaque call

```javascript
// Example: meta-campaign-launcher.js
async function createCampaign(config) {
  const userId = getCurrentUserId(); // From n8n context

  // ✅ Verify user owns this ad account
  const ownership = await verifyAdAccountOwnership(userId, config.ad_account_id);
  if (!ownership) {
    throw new Error('Unauthorized: You do not own this ad account');
  }

  // ✅ Get user's OAuth token (not shared)
  const userToken = await getUserToken(userId, 'meta_ads', config.ad_account_id);

  // ✅ Make API call with user's token
  const response = await fetch(`https://graph.facebook.com/v19.0/${config.ad_account_id}/campaigns`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: config.name,
      objective: config.objective,
      // ...
    }),
  });

  return await response.json();
}
```

---

### CRITICAL-004 Fix: Rate Limiting

**Option A: n8n Built-in Rate Limiting**

Dans chaque workflow n8n, ajouter node "Rate Limit":
- 100 requests/minute per user
- 1000 requests/hour per user

**Option B: Custom Rate Limiting (Recommandé pour SaaS)**

**Créer table:** `/cockpit/supabase/migrations/006_rate_limiting.sql`

```sql
CREATE TABLE api_rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  endpoint VARCHAR(100) NOT NULL, -- 'create_campaign', 'scale_ad_set', etc.

  -- Sliding window counters
  requests_last_minute INT DEFAULT 0,
  requests_last_hour INT DEFAULT 0,
  requests_last_day INT DEFAULT 0,

  last_request_at TIMESTAMPTZ DEFAULT NOW(),

  -- Rate limit tiers (by subscription)
  tier VARCHAR(20) DEFAULT 'free', -- 'free', 'pro', 'enterprise'

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, endpoint)
);

-- Function to check rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_endpoint VARCHAR,
  p_tier VARCHAR DEFAULT 'free'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_limits RECORD;
  v_minute_limit INT;
  v_hour_limit INT;
  v_day_limit INT;
BEGIN
  -- Define limits by tier
  IF p_tier = 'free' THEN
    v_minute_limit := 10;
    v_hour_limit := 100;
    v_day_limit := 500;
  ELSIF p_tier = 'pro' THEN
    v_minute_limit := 60;
    v_hour_limit := 1000;
    v_day_limit := 10000;
  ELSE -- enterprise
    v_minute_limit := 300;
    v_hour_limit := 10000;
    v_day_limit := 100000;
  END IF;

  -- Get current limits
  SELECT * INTO v_limits
  FROM api_rate_limits
  WHERE user_id = p_user_id AND endpoint = p_endpoint;

  -- Check if exceeded
  IF v_limits.requests_last_minute >= v_minute_limit THEN
    RETURN FALSE;
  END IF;

  IF v_limits.requests_last_hour >= v_hour_limit THEN
    RETURN FALSE;
  END IF;

  IF v_limits.requests_last_day >= v_day_limit THEN
    RETURN FALSE;
  END IF;

  -- Increment counters
  INSERT INTO api_rate_limits (user_id, endpoint, tier, requests_last_minute, requests_last_hour, requests_last_day)
  VALUES (p_user_id, p_endpoint, p_tier, 1, 1, 1)
  ON CONFLICT (user_id, endpoint)
  DO UPDATE SET
    requests_last_minute = api_rate_limits.requests_last_minute + 1,
    requests_last_hour = api_rate_limits.requests_last_hour + 1,
    requests_last_day = api_rate_limits.requests_last_day + 1,
    last_request_at = NOW();

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

**Modifier MCP Servers:**

```javascript
async function createCampaign(config) {
  const userId = getCurrentUserId();

  // ✅ Check rate limit BEFORE executing
  const allowed = await checkRateLimit(userId, 'create_campaign');
  if (!allowed) {
    throw new Error('Rate limit exceeded. Upgrade your plan or wait.');
  }

  // Execute...
}
```

---

### CRITICAL-005 Fix: SQL Injection Protection

**Supabase protège déjà contre SQL injection** via prepared statements, MAIS:

**Vérifier:** Que tous les queries utilisent `.eq()`, `.in()`, etc. (paramétrisés)

❌ **JAMAIS:**
```typescript
// ⚠️ DANGEREUX - N'utilise JAMAIS ça
const query = `SELECT * FROM projects WHERE id = '${projectId}'`;
```

✅ **TOUJOURS:**
```typescript
// ✅ Sécurisé - Utilise parameterized queries
const { data } = await supabase
  .from('projects')
  .select('*')
  .eq('id', projectId);
```

---

### CRITICAL-006 Fix: XSS Protection

**Modifier:** `/cockpit/src/components/chat/ChatMessage.tsx`

```typescript
import ReactMarkdown from 'react-markdown';
import DOMPurify from 'dompurify';

export function ChatMessage({ message }: { message: Message }) {
  // ✅ Sanitize avant render
  const sanitizedContent = DOMPurify.sanitize(message.content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'code', 'pre', 'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3'],
    ALLOWED_ATTR: ['href', 'title', 'class'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick'],
  });

  return (
    <div className="message">
      <ReactMarkdown>{sanitizedContent}</ReactMarkdown>
    </div>
  );
}
```

**Installer:**
```bash
npm install dompurify @types/dompurify
```

---

### CRITICAL-007 Fix: Credentials Encryption (n8n)

**n8n CHIFFRE déjà les credentials** en base, MAIS:

**Vérifier:**
1. `N8N_ENCRYPTION_KEY` est définie et sécurisée (32+ chars random)
2. N'est JAMAIS committée dans Git
3. Est stockée en secret manager (AWS Secrets, HashiCorp Vault, etc.)

**Production setup:**
```bash
# .env (NEVER commit this)
N8N_ENCRYPTION_KEY=$(openssl rand -hex 32)
```

**Séparer credentials par utilisateur:**
- Ne pas utiliser de credentials globales
- Chaque user connecte ses propres comptes OAuth2
- Stocker dans `user_integrations` table (voir CRITICAL-003 Fix)

---

### MEDIUM-003 Fix: Audit Logs

**Créer table:** `/cockpit/supabase/migrations/007_audit_logs.sql`

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Who
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,

  -- What
  action VARCHAR(100) NOT NULL, -- 'create_campaign', 'scale_ad_set', 'delete_project', etc.
  resource_type VARCHAR(50), -- 'campaign', 'project', 'task', etc.
  resource_id TEXT,

  -- Details
  metadata JSONB, -- Full context (campaign_id, budget_change, etc.)

  -- When
  timestamp TIMESTAMPTZ DEFAULT NOW(),

  -- Where
  ip_address INET,
  user_agent TEXT,

  -- Result
  success BOOLEAN,
  error_message TEXT
);

-- Index for queries
CREATE INDEX idx_audit_logs_user_timestamp ON audit_logs(user_id, timestamp DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- Function to log action
CREATE OR REPLACE FUNCTION log_audit(
  p_user_id UUID,
  p_action VARCHAR,
  p_resource_type VARCHAR,
  p_resource_id TEXT,
  p_metadata JSONB,
  p_success BOOLEAN,
  p_error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    user_email,
    action,
    resource_type,
    resource_id,
    metadata,
    success,
    error_message
  )
  SELECT
    p_user_id,
    (SELECT email FROM auth.users WHERE id = p_user_id),
    p_action,
    p_resource_type,
    p_resource_id,
    p_metadata,
    p_success,
    p_error_message;
END;
$$ LANGUAGE plpgsql;
```

**Usage dans MCP Servers:**

```javascript
async function createCampaign(config) {
  const userId = getCurrentUserId();

  try {
    // Execute action
    const result = await metaAPI.createCampaign(...);

    // ✅ Log success
    await logAudit(
      userId,
      'create_campaign',
      'campaign',
      result.campaign_id,
      { ad_account_id: config.ad_account_id, budget: config.daily_budget },
      true
    );

    return result;
  } catch (error) {
    // ✅ Log error
    await logAudit(
      userId,
      'create_campaign',
      'campaign',
      null,
      { ad_account_id: config.ad_account_id },
      false,
      error.message
    );

    throw error;
  }
}
```

---

### MEDIUM-005 Fix: CORS Configuration

**Backend (n8n):**

Dans n8n Settings > Security:
```yaml
CORS_ENABLED: true
ALLOWED_ORIGINS: https://your-domain.com,https://app.your-domain.com
```

**Frontend (Vite):**

`vite.config.ts`:
```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://n8n.your-domain.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
```

---

### MEDIUM-010 Fix: Content Security Policy

**Ajouter dans `index.html`:**

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: https:;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://your-supabase.supabase.co https://n8n.your-domain.com;
  frame-src 'none';
  object-src 'none';
">
```

---

## 5. CHECKLIST DE DÉPLOIEMENT SAAS

### Phase 1: Sécurité de Base (OBLIGATOIRE)

- [ ] ✅ Migration 004: RLS multi-tenant appliquée
- [ ] ✅ Migration 005: `user_integrations` créée
- [ ] ✅ Migration 006: Rate limiting implémenté
- [ ] ✅ Migration 007: Audit logs activés
- [ ] ✅ Authentification Supabase activée
- [ ] ✅ LoginView créée
- [ ] ✅ DOMPurify installé et configuré
- [ ] ✅ N8N_ENCRYPTION_KEY générée et sécurisée
- [ ] ✅ CORS configuré
- [ ] ✅ CSP headers ajoutés

### Phase 2: Validation & Tests (OBLIGATOIRE)

- [ ] ✅ Tester multi-tenancy: User A ne voit pas projets User B
- [ ] ✅ Tester rate limiting: Spam détecté et bloqué
- [ ] ✅ Tester XSS: Injection `<script>alert('xss')</script>` bloquée
- [ ] ✅ Tester OAuth2 isolation: User A ne peut pas utiliser compte Meta de User B
- [ ] ✅ Penetration testing (Burp Suite, OWASP ZAP)
- [ ] ✅ Code review sécurité (par un dev senior)

### Phase 3: Monitoring (RECOMMANDÉ)

- [ ] ⚠️ Sentry configuré (error tracking)
- [ ] ⚠️ Datadog/New Relic (APM)
- [ ] ⚠️ Alertes sur rate limit violations
- [ ] ⚠️ Alertes sur failed logins (brute force detection)
- [ ] ⚠️ Alertes sur budget API dépassés

### Phase 4: Compliance (RGPD)

- [ ] ⚠️ Privacy Policy rédigée
- [ ] ⚠️ Terms of Service rédigés
- [ ] ⚠️ Cookie consent banner
- [ ] ⚠️ Data export feature (GDPR right to data portability)
- [ ] ⚠️ Account deletion feature (GDPR right to erasure)
- [ ] ⚠️ DPA (Data Processing Agreement) si clients EU

### Phase 5: Infrastructure (PRODUCTION)

- [ ] ⚠️ HTTPS obligatoire (Let's Encrypt)
- [ ] ⚠️ Firewall configuré (UFW, AWS Security Groups)
- [ ] ⚠️ Backups automatiques BDD (daily)
- [ ] ⚠️ Disaster recovery plan
- [ ] ⚠️ CDN configuré (Cloudflare, AWS CloudFront)
- [ ] ⚠️ DDoS protection (Cloudflare, AWS Shield)

---

## 6. MONITORING & ALERTES

### Métriques à Surveiller

**Sécurité:**
- Failed login attempts (> 5/min from same IP = brute force)
- Rate limit violations (> 10/hour per user)
- Unauthorized access attempts (403/401 errors)
- Suspicious SQL queries (if logged)

**Performance:**
- API response time (> 5s = problème)
- Database query time (> 2s = problème)
- MCP server errors (> 5% error rate)

**Business:**
- API costs (Google Ads, Meta Ads, ElevenLabs)
- User churn (deletions)
- Budget overruns (users exceeding limits)

### Alertes Critiques

**Envoyer alerte Slack/Email si:**
- Rate limit violation > 100/hour (possible attack)
- Failed login > 50/hour from single IP (brute force)
- Database slow queries > 10s (performance issue)
- MCP server error rate > 10% (integration broken)
- Monthly API cost > $10,000 (budget exceeded)

---

## 📊 RÉSUMÉ

**Vulnérabilités totales:** 23
- 🚨 Critiques: 7
- ⚠️ Moyennes: 12
- 🟡 Basses: 4

**Effort de correction:**
- Migrations SQL: 4 fichiers (~500 lignes)
- Code frontend: 3 fichiers modifiés
- MCP servers: Tous (validation ajoutée)
- Configuration n8n: 2h
- Tests: 1 journée

**Temps total estimé:** 3-5 jours de dev

---

## 🚀 PROCHAINES ÉTAPES

### Immédiat (AVANT tout déploiement)

1. **Appliquer CRITICAL-001 à CRITICAL-007** (migrations + code)
2. **Tester multi-tenancy** (créer 2 users, vérifier isolation)
3. **Activer Supabase Auth** (email/password)
4. **Review code** avec checklist sécurité

### Court terme (Semaine 1-2)

1. **Appliquer MEDIUM-001 à MEDIUM-012**
2. **Configurer monitoring** (Sentry minimum)
3. **Penetration testing** (OWASP ZAP)

### Moyen terme (Mois 1)

1. **SOC 2 / ISO 27001** preparation
2. **Bug bounty program** (HackerOne)
3. **Security audit** par firme externe

---

**Créé par:** Claude Code (Audit automatique)
**Date:** 2026-02-10
**Status:** ⚠️ **ACTION REQUISE**

**🔒 NE PAS DÉPLOYER EN PRODUCTION SANS APPLIQUER LES CORRECTIFS CRITIQUES**
