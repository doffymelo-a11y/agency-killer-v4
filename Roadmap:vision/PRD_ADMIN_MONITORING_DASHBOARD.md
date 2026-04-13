# PRD — Admin Monitoring Dashboard

**Version :** 1.0
**Date :** 2026-04-13
**Destinataire :** Claude Code (Terminal CLI)
**Role :** Ce document est ton guide COMPLET pour implementer l'Admin Monitoring Dashboard. Chaque composant, chaque table, chaque endpoint est specifie ici.

---

## 1. CONTEXTE & OBJECTIF

### 1.1 Le Probleme

The Hive OS est un ERP Marketing Autonome avec 5 agents IA, 14 MCP servers et un backend TypeScript. Le fondateur n'a **AUCUNE visibilite** sur ce qui se passe dans le backend :
- Impossible de voir en temps reel ce que font les agents IA
- Pas de metriques de performance
- Pas de logs centralises (tout est `console.log`, perdu au restart)
- Pas de debug possible quand un probleme arrive
- Pas de visibilite sur la sante des 14 MCP servers

### 1.2 La Solution

Etendre l'AdminDashboardView existant (deja 3 tabs fonctionnels) avec 3 nouveaux tabs de monitoring :
- **Tab 4 : System Health** — Status de tous les services + erreurs recentes
- **Tab 5 : Agent Activity** — Timeline des actions agents + stats + couts
- **Tab 6 : Business Stats** — Metriques business (users, projets, tasks, CSAT)

### 1.3 Ce qui NE change PAS

- Les 3 tabs existants (Users, Tickets, SLA Dashboard) restent IDENTIQUES
- Le design system existant (Premium Light Mode, Tailwind) reste le MEME
- La route `/admin` reste la meme
- Le composant SLADashboard.tsx (447 lignes, complet) n'est PAS touche

---

## 2. ARCHITECTURE EXISTANTE (A LIRE EN PREMIER)

### 2.1 AdminDashboardView actuel

**Fichier :** `/cockpit/src/views/AdminDashboardView.tsx` (494 lignes)

**Tabs existants :**
- Tab "Users" : Liste tous les users avec email, role, stats (depuis `admin_users_stats` view + `get_global_stats()` RPC)
- Tab "Tickets" : Liste tickets support avec filtres status/priority/category (depuis `getAllTickets()`)
- Tab "SLA" : Rend le composant `<SLADashboard />` complet (447L, 2 charts, at-risk tickets)

**Auth :** Verifie le role admin via `user_roles` table. Redirige si pas admin.

**IMPORTANT :** Ce fichier fait 494 lignes. Avec 3 tabs supplementaires, il risque de depasser 400L. Tu devras probablement extraire la logique de chaque tab dans son propre composant (pattern : `<UsersTab />`, `<TicketsTab />`, `<SystemHealthTab />`, etc.).

### 2.2 Infrastructure de monitoring existante

| Composant | Fichier | Ce qu'il fait |
|-----------|---------|--------------|
| **SLADashboard** | `cockpit/src/components/admin/SLADashboard.tsx` (447L) | Stats SLA, graphiques Recharts, tickets at-risk |
| **Support Service** | `cockpit/src/services/support.service.ts` (970L, 63 fonctions) | CRUD tickets, realtime, KB, templates, duplicates, CSAT |
| **API Usage Tracking** | `supabase/migrations/008_api_usage_tracking.sql` | Table `api_usage_tracking` : couts par agent/user, quotas, alertes seuil |
| **Health Backend** | `backend/src/index.ts` (ligne ~72-89) | `GET /health` retourne status Supabase + Claude API + MCP Bridge |
| **Health MCP Bridge** | `mcp-bridge/src/index.ts` (ligne ~43-50) | `GET /health` retourne uptime |
| **Status MCP Bridge** | `mcp-bridge/src/index.ts` (ligne ~71-77) | `GET /api/status` retourne status connexion de chaque MCP server |
| **Servers MCP Bridge** | `mcp-bridge/src/index.ts` (ligne ~55-66) | `GET /api/servers` retourne la liste des 14 servers avec config |
| **Winston Logger** | `mcp-bridge/src/logger.ts` | Logger structure avec niveaux, timestamps, contexte service |
| **Error Middleware** | `backend/src/middleware/error.middleware.ts` | Classes AppError, ValidationError, AuthError, RateLimitError, ExternalServiceError |
| **Project Memory** | Table Supabase `project_memory` | TOUTES les actions de TOUS les agents (action, summary, findings, deliverables, recommendations) |
| **Global Stats RPC** | `get_global_stats()` | total_users, total_projects, total_tasks, active_users_last_7_days |
| **Ticket Stats RPC** | `get_ticket_stats()` | open_count, in_progress_count, resolved_count, high/critical priority counts |
| **CSAT Metrics** | Vue materialisee `ticket_csat_metrics` | CSAT moyen par jour, distribution ratings |
| **Analytics Cache** | `supabase/migrations/20260210_analytics_cache.sql` | Stats de cache avec hit/miss tracking |

### 2.3 Stack technique

| Couche | Technologie |
|--------|------------|
| Frontend | React 19 + TypeScript 5.9 + Vite 7 |
| UI | Tailwind 4 + Framer Motion |
| Charts | **Recharts** (deja installe et utilise dans SLADashboard) |
| Icons | **Lucide React** |
| State | Zustand 5 |
| BDD | Supabase (PostgreSQL + Realtime) |
| Backend | Express.js TypeScript (port 3457) |
| MCP Bridge | Express.js (port 3456) |

### 2.4 Design System (NE PAS CHANGER)

- **Mode :** Light (fond blanc)
- **Cards :** `bg-white rounded-xl border border-slate-100 p-6 hover:shadow-lg transition-shadow`
- **Glass :** `backdrop-blur-xl bg-white/80`
- **Font :** Inter (Google Fonts)
- **Status badges :** Classes `.status-todo`, `.status-in-progress`, `.status-done`, `.status-blocked`
- **Couleurs agents :**
  - Sora (Analyst) : Cyan `#06B6D4`
  - Luna (Strategist) : Violet `#8B5CF6`
  - Marcus (Trader) : Amber `#F59E0B`
  - Milo (Creative) : Rose `#EC4899`
  - Doffy (Social) : Emerald `#10B981`
  - Felix (Orchestrator) : Amber `#F59E0B`

---

## 3. SPECIFICATIONS — COUCHE DATABASE

### 3.1 Table `system_logs`

**Migration :** `/supabase/migrations/028_system_logs.sql`

```sql
-- Table de logs centralises pour le monitoring admin
CREATE TABLE IF NOT EXISTS system_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  level TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error', 'debug')),
  source TEXT NOT NULL CHECK (source IN ('backend', 'mcp-bridge', 'agent-executor', 'mcp-server', 'orchestrator', 'auth', 'rate-limit')),
  agent_id TEXT CHECK (agent_id IN ('luna', 'sora', 'marcus', 'milo', 'doffy', 'orchestrator', 'pm', NULL)),
  user_id UUID,
  project_id UUID,
  action TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes pour les requetes admin
CREATE INDEX idx_system_logs_created ON system_logs(created_at DESC);
CREATE INDEX idx_system_logs_level ON system_logs(level) WHERE level IN ('error', 'warn');
CREATE INDEX idx_system_logs_source ON system_logs(source);
CREATE INDEX idx_system_logs_agent ON system_logs(agent_id) WHERE agent_id IS NOT NULL;
CREATE INDEX idx_system_logs_project ON system_logs(project_id) WHERE project_id IS NOT NULL;

-- RLS : seuls les admins peuvent lire les logs
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all logs"
  ON system_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Backend can insert logs"
  ON system_logs FOR INSERT
  WITH CHECK (true);

-- RPC : stats agents agreges
CREATE OR REPLACE FUNCTION get_agent_stats(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  agent_id TEXT,
  total_executions BIGINT,
  successful_executions BIGINT,
  failed_executions BIGINT,
  avg_duration_ms NUMERIC,
  total_cost_credits NUMERIC,
  last_execution_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sl.agent_id,
    COUNT(*) FILTER (WHERE sl.action = 'agent_complete' OR sl.action = 'agent_error') AS total_executions,
    COUNT(*) FILTER (WHERE sl.action = 'agent_complete') AS successful_executions,
    COUNT(*) FILTER (WHERE sl.action = 'agent_error') AS failed_executions,
    AVG((sl.metadata->>'duration_ms')::NUMERIC) FILTER (WHERE sl.action = 'agent_complete') AS avg_duration_ms,
    COALESCE(SUM((sl.metadata->>'credits_used')::NUMERIC) FILTER (WHERE sl.action = 'agent_complete'), 0) AS total_cost_credits,
    MAX(sl.created_at) AS last_execution_at
  FROM system_logs sl
  WHERE sl.agent_id IS NOT NULL
    AND sl.created_at >= NOW() - (days_back || ' days')::INTERVAL
  GROUP BY sl.agent_id
  ORDER BY total_executions DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC : logs recents avec filtres
CREATE OR REPLACE FUNCTION get_recent_logs(
  p_limit INTEGER DEFAULT 50,
  p_level TEXT DEFAULT NULL,
  p_source TEXT DEFAULT NULL,
  p_agent_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  level TEXT,
  source TEXT,
  agent_id TEXT,
  user_id UUID,
  project_id UUID,
  action TEXT,
  message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT sl.id, sl.level, sl.source, sl.agent_id, sl.user_id, sl.project_id, sl.action, sl.message, sl.metadata, sl.created_at
  FROM system_logs sl
  WHERE (p_level IS NULL OR sl.level = p_level)
    AND (p_source IS NULL OR sl.source = p_source)
    AND (p_agent_id IS NULL OR sl.agent_id = p_agent_id)
  ORDER BY sl.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC : compte d'erreurs par periode
CREATE OR REPLACE FUNCTION get_error_count(hours_back INTEGER DEFAULT 1)
RETURNS BIGINT AS $$
  SELECT COUNT(*)
  FROM system_logs
  WHERE level = 'error'
    AND created_at >= NOW() - (hours_back || ' hours')::INTERVAL;
$$ LANGUAGE sql SECURITY DEFINER;

-- RPC : business stats avancees
CREATE OR REPLACE FUNCTION get_business_stats(days_back INTEGER DEFAULT 30)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'users_total', (SELECT COUNT(*) FROM auth.users),
    'users_active_7d', (SELECT COUNT(*) FROM auth.users WHERE last_sign_in_at >= NOW() - INTERVAL '7 days'),
    'users_active_30d', (SELECT COUNT(*) FROM auth.users WHERE last_sign_in_at >= NOW() - INTERVAL '30 days'),
    'projects_total', (SELECT COUNT(*) FROM projects),
    'projects_active', (SELECT COUNT(*) FROM projects WHERE status = 'active'),
    'projects_by_scope', (
      SELECT json_agg(json_build_object('scope', scope, 'count', cnt))
      FROM (SELECT scope, COUNT(*) as cnt FROM projects GROUP BY scope) sub
    ),
    'tasks_total', (SELECT COUNT(*) FROM tasks),
    'tasks_completed', (SELECT COUNT(*) FROM tasks WHERE status = 'done'),
    'tasks_completion_rate', (
      SELECT ROUND(COUNT(*) FILTER (WHERE status = 'done')::NUMERIC / NULLIF(COUNT(*), 0) * 100, 1)
      FROM tasks
    ),
    'tasks_by_agent', (
      SELECT json_agg(json_build_object('agent', assignee, 'total', cnt, 'completed', completed))
      FROM (
        SELECT assignee, COUNT(*) as cnt, COUNT(*) FILTER (WHERE status = 'done') as completed
        FROM tasks GROUP BY assignee
      ) sub
    ),
    'agent_actions_30d', (SELECT COUNT(*) FROM project_memory WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL),
    'avg_csat', (
      SELECT ROUND(AVG(rating)::NUMERIC, 2)
      FROM ticket_satisfaction
      WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Nettoyage automatique des logs > 30 jours
CREATE OR REPLACE FUNCTION cleanup_old_system_logs()
RETURNS void AS $$
  DELETE FROM system_logs WHERE created_at < NOW() - INTERVAL '30 days';
$$ LANGUAGE sql SECURITY DEFINER;
```

---

## 4. SPECIFICATIONS — COUCHE BACKEND

### 4.1 Logging Service

**Fichier a creer :** `/backend/src/services/logging.service.ts`

```typescript
// Service de logging centralise
// Ecrit dans la table system_logs via Supabase
// Utilise par agent-executor, mcp-bridge.service, routes

interface SystemLog {
  level: 'info' | 'warn' | 'error' | 'debug';
  source: 'backend' | 'mcp-bridge' | 'agent-executor' | 'mcp-server' | 'orchestrator' | 'auth' | 'rate-limit';
  agent_id?: string;
  user_id?: string;
  project_id?: string;
  action: string;
  message: string;
  metadata?: Record<string, unknown>; // duration_ms, tool_name, server_name, error_stack, credits_used, etc.
}

export async function logToSystem(log: SystemLog): Promise<void>
// Insert dans system_logs via supabase service role (pas d'auth requise pour l'insert)
// IMPORTANT : cette fonction ne doit JAMAIS throw — les erreurs de logging ne doivent pas crasher le flow principal
// Utiliser try/catch avec console.error en fallback
```

### 4.2 Integration dans agent-executor.ts

**Fichier a modifier :** `/backend/src/agents/agent-executor.ts`

Ajouter le logging a chaque etape cle :

```typescript
// 1. Au debut de l'execution agent
await logToSystem({
  level: 'info',
  source: 'agent-executor',
  agent_id: context.agentId,
  user_id: context.userId,
  project_id: context.projectId,
  action: 'agent_start',
  message: `Agent ${context.agentId} started for project ${context.projectId}`,
  metadata: { task_id: context.taskId, chat_mode: context.chatMode }
});

// 2. A chaque appel MCP tool
await logToSystem({
  level: 'info',
  source: 'agent-executor',
  agent_id: context.agentId,
  action: 'mcp_tool_call',
  message: `Calling ${toolName} on ${serverName}`,
  metadata: { tool_name: toolName, server_name: serverName }
});

// 3. A la fin (succes)
await logToSystem({
  level: 'info',
  source: 'agent-executor',
  agent_id: context.agentId,
  action: 'agent_complete',
  message: `Agent ${context.agentId} completed in ${durationMs}ms`,
  metadata: { duration_ms: durationMs, tokens_used: tokensUsed, credits_used: creditsUsed }
});

// 4. En cas d'erreur
await logToSystem({
  level: 'error',
  source: 'agent-executor',
  agent_id: context.agentId,
  action: 'agent_error',
  message: `Agent ${context.agentId} failed: ${error.message}`,
  metadata: { error_stack: error.stack, duration_ms: durationMs }
});
```

### 4.3 Integration dans mcp-bridge.service.ts

**Fichier a modifier :** `/backend/src/services/mcp-bridge.service.ts`

Ajouter le logging pour chaque appel au MCP Bridge :

```typescript
// Avant l'appel
const startTime = Date.now();

// Apres l'appel (succes)
await logToSystem({
  level: 'info',
  source: 'mcp-bridge',
  action: 'mcp_call_complete',
  message: `MCP call ${serverName}.${toolName} completed`,
  metadata: { server_name: serverName, tool_name: toolName, duration_ms: Date.now() - startTime }
});

// En cas d'erreur
await logToSystem({
  level: 'error',
  source: 'mcp-bridge',
  action: 'mcp_call_error',
  message: `MCP call ${serverName}.${toolName} failed: ${error.message}`,
  metadata: { server_name: serverName, tool_name: toolName, error_message: error.message }
});
```

### 4.4 Routes Admin

**Fichier a creer :** `/backend/src/routes/admin.routes.ts`

```typescript
// TOUTES les routes admin DOIVENT avoir authMiddleware + verif role admin
// Pattern : authMiddleware → checkAdminRole → handler

// GET /api/admin/health
// Agregge les health checks de tous les services
// Appelle : backend /health + MCP Bridge /health + /api/status
// Retourne : { backend: { status, uptime }, mcpBridge: { status, uptime, servers: { name: status }[] }, supabase: { status }, claude: { status } }

// GET /api/admin/logs
// Query params : limit (default 50), level (info|warn|error), source, agent_id
// Appelle : get_recent_logs() RPC
// Retourne : SystemLog[]

// GET /api/admin/agent-stats
// Query params : days (default 30)
// Appelle : get_agent_stats() RPC
// Retourne : AgentStats[]

// GET /api/admin/business-stats
// Query params : days (default 30)
// Appelle : get_business_stats() RPC
// Retourne : BusinessStats

// GET /api/admin/error-count
// Query params : hours (default 1)
// Appelle : get_error_count() RPC
// Retourne : { count: number }

// GET /api/admin/agent-activity
// Query params : limit (default 50), agent_id
// Lit depuis project_memory (SELECT * FROM project_memory ORDER BY created_at DESC LIMIT ?)
// Retourne : ProjectMemoryEntry[]
```

**Monter les routes dans index.ts :** Ajouter `app.use('/api/admin', adminRoutes);`

### 4.5 Middleware admin role check

**Ajouter dans :** `/backend/src/middleware/auth.middleware.ts` ou creer un nouveau fichier

```typescript
// checkAdminRole middleware
// Verifie que l'utilisateur authentifie a le role admin ou super_admin
// Si pas admin : retourne 403 Forbidden
// Utilise la table user_roles
export async function checkAdminRole(req, res, next) {
  const userId = req.user?.id;
  const { data } = await supabase.from('user_roles').select('role').eq('user_id', userId).single();
  if (!data || !['admin', 'super_admin'].includes(data.role)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
```

---

## 5. SPECIFICATIONS — COUCHE FRONTEND

### 5.1 Service Admin

**Fichier a creer :** `/cockpit/src/services/admin.service.ts`

```typescript
// Fonctions API pour le dashboard admin
// Base URL : VITE_BACKEND_API_URL (port 3457)

export async function getSystemHealth(): Promise<SystemHealth>
// GET /api/admin/health
// Retourne : status de chaque service + MCP servers

export async function getRecentLogs(filters?: LogFilters): Promise<SystemLog[]>
// GET /api/admin/logs?limit=50&level=error

export async function getAgentStats(days?: number): Promise<AgentStats[]>
// GET /api/admin/agent-stats?days=30

export async function getBusinessStats(days?: number): Promise<BusinessStats>
// GET /api/admin/business-stats?days=30

export async function getErrorCount(hours?: number): Promise<number>
// GET /api/admin/error-count?hours=1

export async function getAgentActivity(limit?: number, agentId?: string): Promise<ProjectMemoryEntry[]>
// GET /api/admin/agent-activity?limit=50

// Realtime : subscribe aux nouveaux logs d'erreur
export function subscribeToErrors(callback: (log: SystemLog) => void): RealtimeChannel
// supabase.channel('admin-errors').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_logs', filter: 'level=eq.error' }, callback)
```

### 5.2 Types Admin

**Ajouter dans :** `/cockpit/src/types/index.ts` (ou creer `admin.types.ts`)

```typescript
interface SystemHealth {
  backend: { status: 'healthy' | 'degraded' | 'down'; uptime: number; version: string };
  mcpBridge: { status: 'healthy' | 'degraded' | 'down'; uptime: number; servers: MCPServerStatus[] };
  supabase: { status: 'healthy' | 'degraded' | 'down' };
  claude: { status: 'healthy' | 'degraded' | 'down' };
}

interface MCPServerStatus {
  name: string;
  status: 'active' | 'inactive' | 'error';
  toolCount?: number;
}

interface SystemLog {
  id: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  source: string;
  agent_id?: string;
  user_id?: string;
  project_id?: string;
  action: string;
  message: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface AgentStats {
  agent_id: string;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  avg_duration_ms: number;
  total_cost_credits: number;
  last_execution_at: string;
}

interface BusinessStats {
  users_total: number;
  users_active_7d: number;
  users_active_30d: number;
  projects_total: number;
  projects_active: number;
  projects_by_scope: { scope: string; count: number }[];
  tasks_total: number;
  tasks_completed: number;
  tasks_completion_rate: number;
  tasks_by_agent: { agent: string; total: number; completed: number }[];
  agent_actions_30d: number;
  avg_csat: number | null;
}
```

### 5.3 Composants Admin — Tab System Health

**Creer dans :** `/cockpit/src/components/admin/`

#### `SystemHealthTab.tsx` (< 200 lignes)
- Conteneur principal du tab
- Charge les donnees via `getSystemHealth()` + `getRecentLogs({ level: 'error', limit: 20 })`
- Polling toutes les 30 secondes pour le health check
- Subscription Realtime pour les nouvelles erreurs
- Rend : `<ServiceHealthGrid />` + `<MCPServerGrid />` + `<RecentErrorsTable />`

#### `ServiceHealthGrid.tsx` (< 150 lignes)
- 4 cards en grille (2 colonnes) : Backend, MCP Bridge, Supabase, Claude API
- Chaque card :
  - Icone service (Server, Network, Database, Brain)
  - Nom du service
  - Indicateur status : cercle vert (`bg-emerald-500`) / jaune (`bg-amber-500`) / rouge (`bg-red-500`)
  - Label : "Healthy" / "Degraded" / "Down"
  - Uptime formatee (ex: "23h 45min")
- Design : `bg-white rounded-xl border border-slate-100 p-4`

#### `MCPServerGrid.tsx` (< 200 lignes)
- Grille des 14 MCP servers (7x2 ou responsive)
- Chaque server :
  - Nom du server (sans le suffixe -server)
  - Indicateur vert/rouge
  - Nombre d'outils disponibles
  - Agent principal qui l'utilise (badge couleur agent)
- Mapping hardcode agent -> servers :
  ```typescript
  const SERVER_AGENTS: Record<string, string> = {
    'web-intelligence': 'ALL',
    'cms-connector': 'luna',
    'seo-audit': 'luna',
    'keyword-research': 'luna',
    'google-ads': 'sora',
    'meta-ads': 'sora',
    'google-ads-launcher': 'marcus',
    'budget-optimizer': 'marcus',
    'gtm': 'sora',
    'looker': 'sora',
    'elevenlabs': 'milo',
    'nano-banana-pro': 'milo',
    'veo3': 'milo',
    'social-media': 'doffy'
  };
  ```

#### `RecentErrorsTable.tsx` (< 200 lignes)
- Table des 20 dernieres erreurs depuis `system_logs`
- Colonnes : Timestamp (relative), Source (badge couleur), Agent (badge couleur agent), Message (tronque 80 chars), Action
- Click sur une ligne → expande pour voir le message complet + metadata
- Si aucune erreur : message "Aucune erreur recente" avec icone CheckCircle verte
- Badge "LIVE" avec animation pulse si la subscription realtime est active

### 5.4 Composants Admin — Tab Agent Activity

#### `AgentActivityTab.tsx` (< 200 lignes)
- Conteneur du tab
- Charge : `getAgentStats()` + `getAgentActivity(50)` + donnees `api_usage_tracking`
- Filtre par agent (dropdown avec tous les agents)
- Rend : `<AgentStatsCards />` + `<AgentActivityTimeline />` + `<AgentCostChart />`

#### `AgentStatsCards.tsx` (< 200 lignes)
- 5 cards (1 par agent principal : Luna, Sora, Marcus, Milo, Doffy)
- Chaque card :
  - Avatar/icone agent avec couleur de fond
  - Nom + role
  - Stats : executions totales, taux succes (%), temps moyen (ms → s), cout total (credits)
  - Barre de progression pour le taux de succes (vert si > 90%, jaune si > 70%, rouge sinon)
  - Derniere execution (relative time)
- Si l'agent n'a aucune execution : card grisee avec "Aucune activite"

#### `AgentActivityTimeline.tsx` (< 250 lignes)
- Timeline verticale des 50 dernieres actions agents
- Source : `project_memory` table (via `getAgentActivity()`)
- Chaque entree :
  - Cercle couleur agent sur la ligne verticale
  - Timestamp relatif
  - Agent name (badge couleur)
  - Action type (badge : TASK_COMPLETED, STRATEGY_VALIDATED, etc.)
  - Summary (texte)
  - Si deliverables : petit lien "voir le livrable"
  - Si recommendations : tooltip avec le contenu
- Filtre par agent
- Scroll infini ou pagination "Load more"

#### `AgentCostChart.tsx` (< 200 lignes)
- Graphique Recharts AreaChart empile (stacked area)
- Axe X : 30 derniers jours
- Axe Y : Credits utilises
- 5 areas empilees (1 par agent, couleur agent)
- Tooltip au hover : date + credits par agent
- Legende avec nom des agents
- Source : `api_usage_tracking` table ou `system_logs` metadata.credits_used
- Si pas de donnees : graphique vide avec message

### 5.5 Composants Admin — Tab Business Stats

#### `BusinessStatsTab.tsx` (< 200 lignes)
- Conteneur du tab
- Charge : `getBusinessStats(30)` + `get_global_stats()` (RPC existant)
- Selecteur periode : 7j, 30j, 90j
- Rend : `<TopMetricsGrid />` + `<ProjectBreakdownChart />` + `<TasksByAgentChart />` + `<CSATTrendChart />`

#### `TopMetricsGrid.tsx` (< 150 lignes)
- 6 cards KPI en grille (3 colonnes desktop, 2 mobile)
- Chaque card :
  - Icone + label
  - Valeur principale (grande)
  - Variation vs periode precedente (fleche up/down + %)
- KPIs :
  1. Users actifs (7j) — icone Users
  2. Projets actifs — icone FolderOpen
  3. Taches completees — icone CheckSquare
  4. Taux completion — icone TrendingUp
  5. Actions agents (30j) — icone Zap
  6. CSAT moyen — icone Star
- Design : meme pattern que SLADashboard (reference)

#### `ProjectBreakdownChart.tsx` (< 150 lignes)
- PieChart Recharts
- Sections : meta_ads, sem, seo, analytics, social_media, full_scale
- Couleurs distinctes par scope
- Legende avec count
- Centre : total projets

#### `TasksByAgentChart.tsx` (< 150 lignes)
- BarChart Recharts horizontal
- 5 barres (1 par agent)
- Chaque barre divisee : completed (couleur pleine) vs remaining (couleur pale)
- Label : nom agent + pourcentage completion
- Couleurs : couleurs des agents

#### `CSATTrendChart.tsx` (< 150 lignes)
- LineChart Recharts
- Axe X : 30 derniers jours
- Axe Y : score CSAT moyen (1-5)
- Ligne avec points
- Zone de reference : 4.0+ = vert, 3.0-4.0 = jaune, < 3.0 = rouge
- Source : vue materialisee `ticket_csat_metrics` (existe)

### 5.6 Modification AdminDashboardView.tsx

**Fichier a modifier :** `/cockpit/src/views/AdminDashboardView.tsx`

**Changements :**
1. Extraire chaque tab existant en composant separe si necessaire pour rester < 400L
2. Ajouter 3 nouveaux tabs : "System Health", "Agent Activity", "Business Stats"
3. Lazy loading des tabs (charger les donnees uniquement quand le tab est actif)
4. Badge de notification sur "System Health" avec le nombre d'erreurs recentes

**Structure tabs finale :**
```
Users | Tickets | SLA | System Health [3] | Agent Activity | Business Stats
```
Le `[3]` = badge compteur d'erreurs recentes (depuis `getErrorCount()`)

---

## 6. PLAN D'IMPLEMENTATION

### Sprint 1 (3 jours) — Fondations Backend

| # | Tache | Fichier | Critere d'acceptation |
|---|-------|---------|----------------------|
| 1.1 | Creer migration system_logs | `supabase/migrations/028_system_logs.sql` | Table + indexes + RLS + 4 RPC functions |
| 1.2 | Creer logging.service.ts | `backend/src/services/logging.service.ts` | logToSystem() fonctionne, ne throw jamais |
| 1.3 | Ajouter logging dans agent-executor | `backend/src/agents/agent-executor.ts` | Logs agent_start, agent_complete, agent_error |
| 1.4 | Ajouter logging dans mcp-bridge.service | `backend/src/services/mcp-bridge.service.ts` | Logs mcp_call_complete, mcp_call_error |
| 1.5 | Creer admin.routes.ts | `backend/src/routes/admin.routes.ts` | 6 endpoints, auth + admin role check |
| 1.6 | Monter routes dans index.ts | `backend/src/index.ts` | /api/admin/* accessible |

**Verification Sprint 1 :**
```bash
cd backend && npx tsc --noEmit
curl http://localhost:3457/api/admin/health  # retourne status de tous les services
curl http://localhost:3457/api/admin/logs     # retourne [] (pas encore de logs)
```

### Sprint 2 (3 jours) — Tab System Health

| # | Tache | Fichier |
|---|-------|---------|
| 2.1 | Creer types admin | `cockpit/src/types/index.ts` ou `admin.types.ts` |
| 2.2 | Creer admin.service.ts | `cockpit/src/services/admin.service.ts` |
| 2.3 | Creer ServiceHealthGrid | `cockpit/src/components/admin/ServiceHealthGrid.tsx` |
| 2.4 | Creer MCPServerGrid | `cockpit/src/components/admin/MCPServerGrid.tsx` |
| 2.5 | Creer RecentErrorsTable | `cockpit/src/components/admin/RecentErrorsTable.tsx` |
| 2.6 | Creer SystemHealthTab | `cockpit/src/components/admin/SystemHealthTab.tsx` |
| 2.7 | Integrer Tab 4 dans AdminDashboardView | `cockpit/src/views/AdminDashboardView.tsx` |

**Verification Sprint 2 :**
```bash
cd cockpit && npx tsc --noEmit && npm run build
# Ouvrir /admin → Tab System Health → 4 cards services + 14 MCP servers + table erreurs
```

### Sprint 3 (3 jours) — Tab Agent Activity

| # | Tache | Fichier |
|---|-------|---------|
| 3.1 | Creer AgentStatsCards | `cockpit/src/components/admin/AgentStatsCards.tsx` |
| 3.2 | Creer AgentActivityTimeline | `cockpit/src/components/admin/AgentActivityTimeline.tsx` |
| 3.3 | Creer AgentCostChart | `cockpit/src/components/admin/AgentCostChart.tsx` |
| 3.4 | Creer AgentActivityTab | `cockpit/src/components/admin/AgentActivityTab.tsx` |
| 3.5 | Integrer Tab 5 dans AdminDashboardView | `cockpit/src/views/AdminDashboardView.tsx` |

**Verification Sprint 3 :**
```bash
cd cockpit && npx tsc --noEmit && npm run build
# Ouvrir /admin → Tab Agent Activity → 5 cards agents + timeline + graphique couts
```

### Sprint 4 (2 jours) — Tab Business Stats

| # | Tache | Fichier |
|---|-------|---------|
| 4.1 | Creer TopMetricsGrid | `cockpit/src/components/admin/TopMetricsGrid.tsx` |
| 4.2 | Creer ProjectBreakdownChart | `cockpit/src/components/admin/ProjectBreakdownChart.tsx` |
| 4.3 | Creer TasksByAgentChart | `cockpit/src/components/admin/TasksByAgentChart.tsx` |
| 4.4 | Creer CSATTrendChart | `cockpit/src/components/admin/CSATTrendChart.tsx` |
| 4.5 | Creer BusinessStatsTab | `cockpit/src/components/admin/BusinessStatsTab.tsx` |
| 4.6 | Remplacer stub "Stats" par Tab 6 dans AdminDashboardView | `cockpit/src/views/AdminDashboardView.tsx` |

**Verification Sprint 4 :**
```bash
cd cockpit && npx tsc --noEmit && npm run build
# Ouvrir /admin → Tab Business Stats → 6 KPIs + pie chart + bar chart + CSAT line
```

### Sprint 5 (1 jour) — Polish

| # | Tache |
|---|-------|
| 5.1 | Badge erreurs dans TopBar pour admins (nombre d'erreurs non lues) |
| 5.2 | Subscription Realtime sur system_logs WHERE level = 'error' |
| 5.3 | Responsive : verifier que tous les tabs rendent correctement sur iPad (768px) |
| 5.4 | Loading skeletons sur chaque tab (pattern existant dans SLADashboard) |
| 5.5 | Empty states quand pas de donnees |

---

## 7. REGLES IMPERATIVES

1. **Design system :** Utiliser le MEME light mode que le cockpit. PAS de dark mode.
2. **Fichiers < 400 lignes :** Si AdminDashboardView depasse, extraire les tabs existants en composants.
3. **TypeScript strict :** `npx tsc --noEmit` doit passer. Pas de `any`.
4. **Recharts :** Utiliser Recharts (deja installe). PAS d'autre librairie de charts.
5. **Lucide React :** Pour toutes les icones. PAS d'autre librairie d'icones.
6. **Auth :** Toutes les routes admin DOIVENT avoir authMiddleware + checkAdminRole.
7. **Logging ne crash pas :** `logToSystem()` ne doit JAMAIS throw. Try/catch avec console.error en fallback.
8. **RLS :** La table system_logs a du RLS admin-only. Verifier que ca fonctionne.
9. **Performance :** Health check polling = 30s max. Pas de polling plus frequent.
10. **Pas de `console.log` en production :** Utiliser `logToSystem()` a la place.

---

## 8. FICHIERS REFERENCE (LECTURE SEULE — NE PAS MODIFIER)

| Fichier | Pourquoi le lire |
|---------|-----------------|
| `cockpit/src/components/admin/SLADashboard.tsx` | Pattern EXACT d'un composant admin avec Recharts. Copier le style des charts, des cards, des loading states |
| `cockpit/src/services/support.service.ts` | Pattern de service avec appels RPC Supabase |
| `supabase/migrations/008_api_usage_tracking.sql` | Schema tracking couts — a reutiliser pour les stats agents |
| `mcp-bridge/src/logger.ts` | Pattern Winston logger — reference pour le format de logs |
| `backend/src/middleware/error.middleware.ts` | Classes d'erreur existantes — utiliser les memes dans logging |
| `mcp-bridge/src/index.ts` | Endpoints health + status existants — appeler depuis admin routes |

---

## 9. VERIFICATION FINALE

```bash
# Backend compile
cd backend && npx tsc --noEmit

# Frontend compile et build
cd cockpit && npx tsc --noEmit && npm run build

# Health endpoint repond
curl http://localhost:3457/api/admin/health

# Logs endpoint retourne des donnees
curl -H "Authorization: Bearer TOKEN" http://localhost:3457/api/admin/logs?limit=10

# Agent stats
curl -H "Authorization: Bearer TOKEN" http://localhost:3457/api/admin/agent-stats

# Business stats
curl -H "Authorization: Bearer TOKEN" http://localhost:3457/api/admin/business-stats

# Admin dashboard :
# - 6 tabs visibles et fonctionnels
# - System Health : 4 cards services + 14 MCP servers + table erreurs
# - Agent Activity : 5 cards agents + timeline + graphique couts
# - Business Stats : 6 KPIs + pie chart + bar chart + CSAT line
# - Tous les tabs chargent en < 2 secondes
# - Responsive sur iPad (768px)
# - Aucune erreur console
# - Auth bloque les non-admins (retourne 403)
```
