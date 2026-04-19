# Roadmap — Super Admin Backoffice Implementation
**Date**: 2026-04-19
**Scope**: Backoffice application pour super_admin (founder only)
**Estimated Duration**: 12 jours ouvrés
**Status**: 🟡 READY TO START

---

## 📋 TABLE OF CONTENTS

1. [Context & Objectives](#context--objectives)
2. [What Already Exists (DO NOT RECREATE)](#what-already-exists-do-not-recreate)
3. [Architecture Overview](#architecture-overview)
4. [Implementation Roadmap](#implementation-roadmap)
5. [Critical Dependencies](#critical-dependencies)
6. [Risk Mitigation](#risk-mitigation)
7. [Testing Strategy](#testing-strategy)
8. [Success Metrics](#success-metrics)

---

## 🎯 CONTEXT & OBJECTIVES

### Current Situation
- ✅ Support system exists with tickets, messages, internal notes
- ✅ User roles (user/admin/super_admin) in place
- ✅ Admin dashboard shows monitoring but mixes tier-2 and tier-3 concerns
- ❌ No dedicated interface for founder to manage ALL tickets
- ❌ No way to generate Claude Code context for bug fixing
- ❌ No audit trail for super admin actions

### Objectives
Build a **dedicated backoffice application** (`backoffice.hive-os.com`) that allows the founder to:

1. **View all tickets** from all users in real-time
2. **Manage tickets**: reply, assign, change status/priority
3. **Generate Claude Code Context** for bug fixing (clipboard ready)
4. **View system logs & metrics** with complete audit trail
5. **Manage users** (view, change roles)

### Key Constraints
- ✅ **SERVICE_ROLE_KEY never in frontend** - backend endpoints only
- ✅ **Separate app** in `/backoffice/` (port 5174 dev, subdomain prod)
- ✅ **Reuse existing code** - don't recreate support services/types
- ✅ **Claude Code Context** = manual clipboard + terminal (no auto GitHub integration)
- ✅ **Audit trail** for all super admin actions

---

## 📦 WHAT ALREADY EXISTS (DO NOT RECREATE)

### Database (Supabase)
✅ **Tables**:
- `support_tickets` (migration 017)
- `support_messages` (migration 017)
- `support_internal_notes` (migration 019)
- `admin_response_templates` (migration 019)
- `user_roles` with enum `user | admin | super_admin` (migration 008)
- `system_logs` (migration 028)

✅ **Functions**:
- `is_admin(uuid)` - checks if user is admin/super_admin (migration 014)
- `get_agent_stats()` (migration 029)
- `get_recent_logs()` (migration 029)
- `get_business_stats()` (migration 029)

### Backend (Express.js)
✅ **Middleware**:
- `/backend/src/middleware/auth.middleware.ts` - JWT verification
- `/backend/src/middleware/admin.middleware.ts` - requireAdmin
- `/backend/src/middleware/rate-limit.middleware.ts` - in-memory 30/min

✅ **Routes**:
- `/backend/src/routes/admin.routes.ts` - admin endpoints (health, stats, logs)

✅ **Services**:
- `/backend/src/services/supabase.service.ts` - Supabase client
- `/backend/src/services/logging.service.ts` - structured logging

### Frontend (Cockpit)
✅ **Services**:
- `/cockpit/src/services/support.service.ts` - ticket CRUD (TO REUSE)
- `/cockpit/src/lib/supabase.ts` - Supabase client (TO COPY)

✅ **Types**:
- `/cockpit/src/types/support.types.ts` - SupportTicket, SupportMessage, etc. (TO IMPORT)
- `/cockpit/src/types/admin.types.ts` - Admin dashboard types (TO IMPORT)

✅ **Components** (patterns to copy):
- `/cockpit/src/views/SupportTicketDetailView.tsx` - message thread UI
- `/cockpit/src/components/support/*` - file uploader, help button, etc.

### User Setup
✅ **Founder already super_admin**:
- `doffymelo@gmail.com` auto-promoted to `super_admin` on signup

---

## 🏗️ ARCHITECTURE OVERVIEW

### Three-Tier Access Model

```
┌─────────────────────────────────────────────────────────┐
│ TIER 1: USERS                                           │
│ - View/create their own tickets                         │
│ - Add messages to tickets                               │
│ - View simplified ticket status                         │
│ App: /cockpit (port 5173)                               │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ TIER 2: ADMINS (future: agency employees)              │
│ - View tickets scoped to their organization             │
│ - Monitor projects within organization                  │
│ - Access admin dashboard (health, metrics)              │
│ App: /cockpit/admin (port 5173)                         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ TIER 3: SUPER_ADMIN (founder only)                     │
│ - View ALL tickets from ALL users                       │
│ - Manage all tickets (status, priority, assign)         │
│ - Generate Claude Code Context                          │
│ - View all system logs & metrics                        │
│ - Manage user roles                                     │
│ - Complete audit trail                                  │
│ App: /backoffice (port 5174) → backoffice.hive-os.com  │
└─────────────────────────────────────────────────────────┘
```

### Security Architecture

```
┌──────────────────────────────────────────────────────────┐
│ BACKOFFICE FRONTEND (/backoffice/)                      │
│ - Uses SUPABASE_ANON_KEY only                           │
│ - JWT token from Supabase Auth                          │
│ - Bearer token in all API calls                         │
│ - NO SERVICE_ROLE_KEY in code/env                       │
└──────────────────────────────────────────────────────────┘
                          ↓ JWT Bearer
┌──────────────────────────────────────────────────────────┐
│ BACKEND EXPRESS (/api/superadmin/*)                     │
│ - Middleware: authenticateUser → requireSuperAdmin      │
│ - Rate limit: 60 req/min (stricter than admin)          │
│ - Auto-log all actions to super_admin_access_logs       │
│ - Uses SERVICE_ROLE_KEY for RLS bypass (server-side)    │
└──────────────────────────────────────────────────────────┘
                          ↓ SERVICE_ROLE
┌──────────────────────────────────────────────────────────┐
│ SUPABASE DATABASE                                        │
│ - RLS policies enforced                                 │
│ - super_admin_access_logs (audit trail)                 │
│ - support_tickets (all users)                           │
│ - system_logs (all agents)                              │
└──────────────────────────────────────────────────────────┘
```

---

## 🗺️ IMPLEMENTATION ROADMAP

### PHASE 1: Database Foundation (Jour 1)
**Goal**: Add audit trail table + RLS policies

#### 1.1 Create Migration 030
**File**: `/cockpit/supabase/migrations/030_super_admin_backoffice.sql`

**Tasks**:
- [x] Create `super_admin_access_logs` table
  - Columns: id, super_admin_id, super_admin_email, action, resource_type, resource_id, ip_address, user_agent, metadata (JSONB), created_at
  - Indexes: (super_admin_id, created_at), (action, created_at), (resource_type, resource_id)

- [x] RLS policies for `super_admin_access_logs`
  - SELECT: only super_admin can read
  - INSERT: via service_role only (backend)
  - NO UPDATE/DELETE (append-only log)

- [x] Create RPC `log_super_admin_action()`
  - Parameters: action, resource_type, resource_id, ip, user_agent, metadata
  - SECURITY DEFINER with search_path fix
  - Validates auth.uid() is super_admin
  - Inserts + returns log id

**Validation**:
```sql
-- Test RPC as super_admin
SELECT log_super_admin_action(
  'view_ticket', 'ticket', 'abc-123',
  '127.0.0.1'::inet, 'Chrome/127', '{}'::jsonb
);
-- → returns UUID

-- Test as regular user (should fail)
-- → RAISE EXCEPTION 'Access denied'

-- Verify RLS
SELECT * FROM super_admin_access_logs;
-- super_admin → rows returned
-- user → empty (403 via RLS)
```

**Estimated Time**: 3 hours

---

### PHASE 2: Backend Middleware (Jour 2)
**Goal**: Secure super admin endpoint protection

#### 2.1 Super Admin Middleware
**File**: `/backend/src/middleware/super-admin.middleware.ts`

**Tasks**:
- [x] Create `requireSuperAdmin` middleware
  - Check `user_roles.role = 'super_admin'` (NOT just 'admin')
  - 403 if not super_admin
  - Pass user info to req.superAdmin

- [x] Create `logSuperAdminAction` helper
  - Wrapper around RPC `log_super_admin_action()`
  - Extracts ip from `req.ip` or `req.headers['x-forwarded-for']`
  - Extracts user_agent from `req.headers['user-agent']`
  - Auto-called in every superadmin route handler

- [x] Create super admin rate limiter
  - 60 req/min (vs 30 for regular admin)
  - In-memory store (same pattern as admin)
  - Per super_admin_id

**Example Usage**:
```typescript
// /backend/src/routes/superadmin.routes.ts
router.use(authenticateUser);  // JWT check
router.use(requireSuperAdmin); // Role check
router.use(superAdminRateLimit); // 60/min

router.get('/tickets', async (req, res) => {
  // Auto-log action
  await logSuperAdminAction(req, 'list_tickets', 'ticket', null, {});

  // Handler logic...
});
```

**Validation**:
```bash
# Test with admin JWT (not super_admin)
curl -H "Authorization: Bearer $ADMIN_JWT" \
  http://localhost:3457/api/superadmin/tickets
# → 403 Forbidden

# Test with super_admin JWT
curl -H "Authorization: Bearer $SA_JWT" \
  http://localhost:3457/api/superadmin/tickets
# → 200 OK (once route implemented)

# Verify log created
SELECT * FROM super_admin_access_logs ORDER BY created_at DESC LIMIT 1;
# → action='list_tickets', resource_type='ticket'
```

**Estimated Time**: 4 hours

---

### PHASE 3: Backend Ticket Endpoints (Jours 3-4)
**Goal**: CRUD operations for all tickets

#### 3.1 Tickets Routes
**File**: `/backend/src/routes/superadmin.routes.ts`

**Endpoints to implement**:

| Method | Endpoint | Description | Estimated Time |
|--------|----------|-------------|----------------|
| GET | `/api/superadmin/tickets` | List all tickets (paginated, filtered) | 2h |
| GET | `/api/superadmin/tickets/stats` | Counts by status/priority, SLA metrics | 1h |
| GET | `/api/superadmin/tickets/:id` | Full ticket details + user info | 1.5h |
| PATCH | `/api/superadmin/tickets/:id` | Update status/priority/assigned_to | 1.5h |
| POST | `/api/superadmin/tickets/:id/reply` | Add admin message | 1h |
| POST | `/api/superadmin/tickets/:id/internal-notes` | Add internal note | 1h |

**GET /api/superadmin/tickets** - List & Filter
```typescript
interface TicketsQueryParams {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  assigned_to?: string;
  user_email?: string;
  search?: string;        // search in subject/description
  from?: string;          // created_at >= from
  to?: string;            // created_at <= to
  limit?: number;         // default 50, max 100
  offset?: number;        // pagination
  sort?: 'created_at' | 'updated_at' | 'priority';
  order?: 'asc' | 'desc'; // default desc
}

// Response
interface TicketsListResponse {
  tickets: SupportTicket[];
  total: number;
  page: number;
  limit: number;
}
```

**GET /api/superadmin/tickets/:id** - Full Details
```typescript
interface TicketDetailResponse {
  ticket: SupportTicket;
  user: {
    id: string;
    email: string;
    created_at: string;
    last_sign_in_at: string;
    // plan info from billing (if exists)
  };
  messages: SupportMessage[];
  internal_notes: InternalNote[];
  related_logs?: SystemLog[];  // last 24h for this user
}
```

**PATCH /api/superadmin/tickets/:id** - Update
```typescript
interface UpdateTicketBody {
  status?: TicketStatus;
  priority?: TicketPriority;
  assigned_to?: string | null;
}

// Auto-log diff to audit trail
// metadata: { old_status: 'open', new_status: 'in_progress' }
```

**Validation**:
- Zod schema for all request bodies
- `createSafeErrorResponse()` for errors
- Auto-log each action via `logSuperAdminAction()`

**Estimated Time**: 8 hours (Jour 3)

---

#### 3.2 Users & Logs Endpoints (Jour 4)
**File**: `/backend/src/routes/superadmin.routes.ts` (continued)

| Method | Endpoint | Description | Estimated Time |
|--------|----------|-------------|----------------|
| GET | `/api/superadmin/users` | List users with filters | 1.5h |
| GET | `/api/superadmin/users/:id` | User profile + stats | 1.5h |
| PATCH | `/api/superadmin/users/:id/role` | Change user role | 1h |
| GET | `/api/superadmin/logs` | System logs (proxy to RPC) | 1h |
| GET | `/api/superadmin/metrics/global` | Global metrics (MRR, users, CSAT) | 1.5h |
| GET | `/api/superadmin/audit-logs` | Super admin access logs | 1h |

**GET /api/superadmin/users/:id** - User Profile
```typescript
interface UserProfileResponse {
  user: {
    id: string;
    email: string;
    role: 'user' | 'admin' | 'super_admin';
    created_at: string;
    last_sign_in_at: string;
  };
  stats: {
    total_tickets: number;
    open_tickets: number;
    total_projects: number;
    total_agent_calls: number;
    total_cost_usd: number;  // sum of agent costs
  };
  recent_activity: {
    last_project_id: string;
    last_session: string;
  };
}
```

**PATCH /api/superadmin/users/:id/role** - Change Role
```typescript
interface ChangeRoleBody {
  role: 'user' | 'admin';  // Cannot downgrade super_admin via API
}

// Prevents lock-out: cannot change own role
// Audit log: metadata = { old_role: 'user', new_role: 'admin' }
```

**Estimated Time**: 8 hours (Jour 4)

---

### PHASE 4: Claude Code Context Generator (Jour 4 afternoon)
**Goal**: Generate markdown context for bug fixing

#### 4.1 Feature Files Mapping
**File**: `/backend/src/config/feature-files-map.ts`

```typescript
export const FEATURE_FILES_MAP: Record<string, string[]> = {
  luna: [
    '/backend/src/agents/luna.agent.ts',
    '/backend/src/config/agents.config.ts',
    '/mcp-servers/seo-audit-server/src/index.ts',
    '/mcp-servers/keyword-research-server/src/index.ts',
  ],
  sora: [
    '/backend/src/agents/sora.agent.ts',
    '/mcp-servers/google-ads/src/index.ts',
    '/mcp-servers/meta-ads/src/index.ts',
  ],
  marcus: [
    '/backend/src/agents/marcus.agent.ts',
    '/mcp-servers/google-ads-launcher/src/index.ts',
    '/mcp-servers/budget-optimizer/src/index.ts',
  ],
  milo: [
    '/backend/src/agents/milo.agent.ts',
    '/mcp-servers/elevenlabs/src/index.ts',
    '/mcp-servers/nano-banana-pro/src/index.ts',
  ],
  doffy: [
    '/backend/src/agents/doffy.agent.ts',
    '/mcp-servers/social-media/src/index.ts',
  ],
  'mcp-bridge': [
    '/mcp-bridge/src/index.ts',
    '/mcp-bridge/src/mcpClient.ts',
  ],
  orchestrator: [
    '/backend/src/agents/orchestrator.ts',
  ],
  support: [
    '/cockpit/src/views/SupportView.tsx',
    '/cockpit/src/views/SupportTicketDetailView.tsx',
    '/backend/src/routes/admin.routes.ts',
  ],
};
```

#### 4.2 Context Generator Service
**File**: `/backend/src/services/claude-context-generator.service.ts`

**Function**: `generateClaudeCodeContext(ticketId: string): Promise<string>`

**Steps**:
1. Fetch ticket + user + messages + internal notes
2. Fetch recent system logs (user_id, last 2h, level >= warn)
3. Extract mentioned features from description (parse keywords)
4. Map features → files via `FEATURE_FILES_MAP`
5. Get recent commits: `git log -3 --format='%h %s'` (exec, catch errors)
6. Build markdown template

**Template**:
```markdown
# Bug Report - Ticket TK-{number}

**User**: {email} (plan: {plan}, signed up: {signup_date})
**Category**: {category} | **Priority**: {priority} | **Created**: {created_at}

## Description
{description}

## User's Last Actions
- Page: {page_url}
- Browser: {user_agent}

## Screenshot
{screenshot_url || 'None'}

## Relevant Logs (last 2h, level: error|warn)
{logs.map(log => `[${log.timestamp}] [${log.source}] ${log.level}: ${log.message}`).join('\n')}

## Likely Files (heuristic)
{suggested_files.map(f => `- ${f}`).join('\n')}

## Recent Commits (HEAD~3)
{commits.map(c => `- ${c.hash} ${c.message}`).join('\n')}

## Conversation
{messages.map(m => `[${m.sender_type} ${m.created_at}] ${m.message}`).join('\n\n')}

## Internal Notes
{internal_notes.map(n => `[${n.author_email} ${n.created_at}] ${n.note}`).join('\n\n')}
```

**Endpoint**: `POST /api/superadmin/tickets/:id/claude-context`

```typescript
router.post('/tickets/:id/claude-context', async (req, res) => {
  const { id } = req.params;

  await logSuperAdminAction(req, 'generate_claude_context', 'ticket', id, {});

  const markdown = await generateClaudeCodeContext(id);

  res.json({
    success: true,
    markdown,
    // Frontend will copy to clipboard
  });
});
```

**Estimated Time**: 4 hours

---

### PHASE 5: Backoffice Frontend Setup (Jour 5)
**Goal**: Initialize backoffice app structure

#### 5.1 Project Scaffolding
**Directory**: `/backoffice/`

**Tasks**:
- [x] `npm create vite@latest backoffice -- --template react-ts`
- [x] Install dependencies:
  ```bash
  npm install @supabase/supabase-js zustand react-router-dom
  npm install -D tailwindcss postcss autoprefixer
  npm install lucide-react framer-motion
  npm install react-virtuoso  # for virtualized tables
  ```
- [x] Copy tailwind config from `/cockpit/tailwind.config.js`
- [x] Setup vite.config.ts (port 5174, alias "@")
- [x] Create `.env.example`:
  ```env
  VITE_SUPABASE_URL=https://hwiyvpfaolmasqchqwsa.supabase.co
  VITE_SUPABASE_ANON_KEY=...
  VITE_BACKEND_API_URL=http://localhost:3457
  ```

#### 5.2 Core Infrastructure
**Files to create**:

1. `/backoffice/src/lib/supabase.ts` (copy from cockpit)
2. `/backoffice/src/lib/api.ts` (fetch wrapper with JWT)
   ```typescript
   export async function apiCall<T>(
     endpoint: string,
     options?: RequestInit
   ): Promise<T> {
     const { data: { session } } = await supabase.auth.getSession();

     const response = await fetch(
       `${import.meta.env.VITE_BACKEND_API_URL}${endpoint}`,
       {
         ...options,
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${session?.access_token}`,
           ...options?.headers,
         },
       }
     );

     if (!response.ok) {
       throw new Error(`API Error: ${response.statusText}`);
     }

     return response.json();
   }
   ```

3. `/backoffice/src/types/index.ts` (import from cockpit)
   ```typescript
   export * from '../../../cockpit/src/types/support.types';
   export * from '../../../cockpit/src/types/admin.types';
   ```

4. `/backoffice/src/store/useBackofficeStore.ts` (Zustand)
   ```typescript
   interface BackofficeState {
     user: User | null;
     selectedTicket: SupportTicket | null;
     filters: TicketFilters;
     setUser: (user: User | null) => void;
     setSelectedTicket: (ticket: SupportTicket | null) => void;
     setFilters: (filters: TicketFilters) => void;
   }
   ```

**Estimated Time**: 4 hours

---

### PHASE 6: Auth & Protected Routes (Jour 5 afternoon)
**Goal**: Login + super_admin verification

#### 6.1 Login View
**File**: `/backoffice/src/views/LoginView.tsx`

**Features**:
- Email + password form (Supabase Auth)
- Same auth provider as cockpit
- After login → check role via `user_roles` table
- If not super_admin → logout + toast "Access denied"
- Redirect to `/dashboard` if super_admin

#### 6.2 Protected Route
**File**: `/backoffice/src/components/auth/ProtectedSuperAdminRoute.tsx`

```typescript
export default function ProtectedSuperAdminRoute() {
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkSuperAdmin();
  }, []);

  async function checkSuperAdmin() {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      navigate('/login');
      return;
    }

    // Check role
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .single();

    if (data?.role !== 'super_admin') {
      await supabase.auth.signOut();
      navigate('/login');
      toast.error('Access denied - Super admin only');
      return;
    }

    setIsSuperAdmin(true);
    setLoading(false);
  }

  if (loading) return <LoadingScreen />;

  return isSuperAdmin ? <Outlet /> : null;
}
```

#### 6.3 App Router
**File**: `/backoffice/src/App.tsx`

```tsx
<Routes>
  <Route path="/login" element={<LoginView />} />

  <Route element={<ProtectedSuperAdminRoute />}>
    <Route path="/" element={<DashboardView />} />
    <Route path="/tickets" element={<TicketsView />} />
    <Route path="/users" element={<UsersView />} />
    <Route path="/logs" element={<LogsView />} />
    <Route path="/metrics" element={<MetricsView />} />
    <Route path="/audit" element={<AuditLogView />} />
  </Route>
</Routes>
```

**Estimated Time**: 3 hours

---

### PHASE 7: Services Layer (Jour 6 morning)
**Goal**: API service wrappers

**Files to create**:

1. `/backoffice/src/services/tickets.service.ts`
   ```typescript
   export async function getTickets(params: TicketsQueryParams) {
     return apiCall<TicketsListResponse>('/api/superadmin/tickets', {
       method: 'GET',
       // params as query string
     });
   }

   export async function getTicketDetail(id: string) {
     return apiCall<TicketDetailResponse>(`/api/superadmin/tickets/${id}`);
   }

   export async function updateTicket(id: string, data: UpdateTicketBody) {
     return apiCall(`/api/superadmin/tickets/${id}`, {
       method: 'PATCH',
       body: JSON.stringify(data),
     });
   }

   export async function replyToTicket(id: string, message: string) {
     return apiCall(`/api/superadmin/tickets/${id}/reply`, {
       method: 'POST',
       body: JSON.stringify({ message }),
     });
   }

   export async function generateClaudeContext(id: string) {
     return apiCall<{ markdown: string }>(`/api/superadmin/tickets/${id}/claude-context`, {
       method: 'POST',
     });
   }
   ```

2. `/backoffice/src/services/users.service.ts`
3. `/backoffice/src/services/logs.service.ts`
4. `/backoffice/src/services/metrics.service.ts`
5. `/backoffice/src/services/audit.service.ts`

**Estimated Time**: 3 hours

---

### PHASE 8: Layout & UI Components (Jour 6 afternoon)
**Goal**: Reusable UI components

#### 8.1 Layout
**File**: `/backoffice/src/components/Layout.tsx`

```tsx
<div className="min-h-screen bg-slate-50 flex">
  {/* Sidebar */}
  <aside className="w-64 bg-slate-900 text-white">
    <div className="p-4">
      <h1 className="text-xl font-bold">Hive OS Admin</h1>
    </div>
    <nav>
      <NavLink to="/">Dashboard</NavLink>
      <NavLink to="/tickets">Tickets</NavLink>
      <NavLink to="/users">Users</NavLink>
      <NavLink to="/logs">Logs</NavLink>
      <NavLink to="/metrics">Metrics</NavLink>
      <NavLink to="/audit">Audit Trail</NavLink>
    </nav>
  </aside>

  {/* Main content */}
  <main className="flex-1">
    <Topbar />
    <div className="p-6">
      <Outlet />
    </div>
  </main>
</div>
```

#### 8.2 UI Components (copy from cockpit, adapt)
- Button
- Input
- Select
- Badge
- Modal
- Toast notifications

**Estimated Time**: 4 hours

---

### PHASE 9: Tickets View - Core Feature (Jours 7-8)
**Goal**: Main interface for ticket management

#### 9.1 Tickets Table
**File**: `/backoffice/src/components/tickets/TicketsTable.tsx`

**Features**:
- Virtualized list (react-virtuoso) if >100 tickets
- Columns: ID, User, Subject, Status, Priority, Category, Created, Last Update
- Click row → opens detail panel
- Sort by any column
- Pagination (50 per page)

**Libraries**:
```bash
npm install react-virtuoso
```

#### 9.2 Filters Panel
**File**: `/backoffice/src/components/tickets/TicketFilters.tsx`

**Filters**:
- Status (multi-select)
- Priority (multi-select)
- Category (multi-select)
- Date range (from/to)
- Search (subject/description)
- User email

#### 9.3 Detail Panel
**File**: `/backoffice/src/components/tickets/TicketDetailPanel.tsx`

**Layout**: Slide-over panel (right side, 50% width)

**Sections**:
1. **Header**:
   - User email + plan badge
   - Ticket number + category emoji
   - Status/Priority dropdowns (editable)
   - Close button

2. **Conversation Thread**:
   - User messages (left, gray)
   - Admin messages (right, cyan)
   - Timestamps
   - File attachments display

3. **Internal Notes** (red panel):
   - List of notes
   - Add note form
   - Delete button per note

4. **Reply Box**:
   - Textarea
   - File uploader
   - Template selector (if exists)
   - Send button

5. **Actions**:
   - "Generate Claude Code Context" button
   - Assign to dropdown
   - Related logs link

**Estimated Time**: 10 hours (Jour 7)

---

#### 9.4 Claude Context Button
**File**: `/backoffice/src/components/tickets/ClaudeContextButton.tsx`

```tsx
export default function ClaudeContextButton({ ticketId }: { ticketId: string }) {
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const { markdown } = await generateClaudeContext(ticketId);

      // Copy to clipboard
      await navigator.clipboard.writeText(markdown);

      toast.success('Context copied to clipboard! Paste in your terminal.');
    } catch (error) {
      console.error('Failed to generate context:', error);

      // Fallback: download as .md file
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bug-report-${ticketId}.md`;
      a.click();

      toast.error('Clipboard failed, downloaded as .md file');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <button
      onClick={handleGenerate}
      disabled={generating}
      className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center justify-center gap-2"
    >
      {generating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Code className="w-4 h-4" />
          Generate Claude Code Context
        </>
      )}
    </button>
  );
}
```

**Estimated Time**: 2 hours (Jour 8 morning)

---

#### 9.5 Realtime Subscriptions
**File**: `/backoffice/src/hooks/useRealtimeTickets.ts`

**First Realtime usage in the project - needs careful setup**

```typescript
export function useRealtimeTickets() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  useEffect(() => {
    // Subscribe to all ticket changes
    const channel = supabase
      .channel('superadmin-tickets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_tickets',
        },
        (payload) => {
          console.log('[Realtime] Ticket change:', payload);

          if (payload.eventType === 'INSERT') {
            setTickets(prev => [payload.new as SupportTicket, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setTickets(prev => prev.map(t =>
              t.id === payload.new.id ? payload.new as SupportTicket : t
            ));
          } else if (payload.eventType === 'DELETE') {
            setTickets(prev => prev.filter(t => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return tickets;
}
```

**Important**: Realtime needs RLS policies to match. Verify that `support_tickets` SELECT policy allows super_admin to see all tickets.

**Estimated Time**: 3 hours (includes Realtime debugging)

---

### PHASE 10: Other Views (Jours 8-9)
**Goal**: Users, Logs, Metrics views

#### 10.1 Users View
**File**: `/backoffice/src/views/UsersView.tsx`

**Features**:
- Table: Email, Role, Signup Date, Last Login, Tickets Count, Projects Count
- Filters: Role, Signup date range, Search email
- Click row → user detail modal
- Change role dropdown

**Estimated Time**: 4 hours

#### 10.2 Logs View
**File**: `/backoffice/src/views/LogsView.tsx`

**Features**:
- Table: Timestamp, Level, Source, Message, User, Project
- Filters: Level, Source (agent/mcp/backend), User, Date range
- Color coding: error=red, warn=yellow, info=blue
- Virtualized if >1000 rows

**Estimated Time**: 3 hours

#### 10.3 Metrics Dashboard
**File**: `/backoffice/src/views/MetricsView.tsx`

**Cards**:
- Total Users (7d/30d growth)
- Active Users (7d/30d)
- Total Tickets (by status pie chart)
- Avg Response Time
- CSAT Score (if survey data exists)
- MRR (if Stripe integrated, else placeholder)

**Estimated Time**: 4 hours

#### 10.4 Audit Log View
**File**: `/backoffice/src/views/AuditLogView.tsx`

**Features**:
- Table: Timestamp, Action, Resource, IP, User Agent
- Filters: Action type, Date range
- Self-auditing: shows founder's own actions
- Export to CSV button

**Estimated Time**: 3 hours

---

### PHASE 11: Cockpit Integration (Jour 10)
**Goal**: Clean up admin dashboard, add backoffice link

#### 11.1 Update Admin Dashboard
**File**: `/cockpit/src/views/AdminDashboardView.tsx`

**Changes**:
- ❌ Remove "Tickets" tab (global view → backoffice only)
- ❌ Remove "Users" tab (global view → backoffice only)
- ✅ Keep: System Health, Agent Activity, Business Stats (tier-2 scoped)
- ✅ Add banner at top if role = super_admin:
  ```tsx
  {isSuperAdmin && (
    <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-between">
      <div>
        <h3 className="font-semibold text-purple-900">Super Admin Access</h3>
        <p className="text-sm text-purple-700">
          Manage all tickets and view system metrics
        </p>
      </div>
      <a
        href="http://localhost:5174"  // dev, or backoffice.hive-os.com prod
        target="_blank"
        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center gap-2"
      >
        <ExternalLink className="w-4 h-4" />
        Open Backoffice
      </a>
    </div>
  )}
  ```

**Rationale**:
- Tier-2 admins (future agency employees) will only see org-scoped data
- Global ticket management is super_admin concern → belongs in backoffice
- Avoid logic duplication between cockpit admin dashboard and backoffice

**Estimated Time**: 2 hours

---

### PHASE 12: Testing & Validation (Jours 11-12)
**Goal**: End-to-end validation

#### 12.1 Manual Testing Checklist

**Auth Flow**:
- [ ] Login with `doffymelo@gmail.com` → dashboard loads
- [ ] Login with regular user → access denied + logout
- [ ] Login with tier-2 admin → access denied
- [ ] Logout → redirects to login

**Tickets Management**:
- [ ] Create ticket from cockpit (/support) → appears in backoffice realtime
- [ ] Filter tickets by status → correct results
- [ ] Search tickets by keyword → works
- [ ] Click ticket → detail panel opens
- [ ] Update status → saves + audit log created
- [ ] Update priority → saves + audit log
- [ ] Reply to ticket → message appears in cockpit user view
- [ ] Add internal note → visible in backoffice only (not user)
- [ ] Generate Claude Code Context → markdown copied to clipboard
- [ ] Paste context in terminal → readable and complete

**Users Management**:
- [ ] View users list → all users shown
- [ ] Filter by role → correct subset
- [ ] Change user role user→admin → saves + audit log
- [ ] View user detail → stats correct

**Logs & Metrics**:
- [ ] Logs view shows recent errors
- [ ] Filter logs by level → works
- [ ] Metrics dashboard shows current stats
- [ ] Audit log shows all super admin actions

**Realtime**:
- [ ] Open 2 browser tabs (both backoffice)
- [ ] Update ticket in tab 1 → tab 2 updates in <1s
- [ ] Create ticket from cockpit → both backoffice tabs update

#### 12.2 API Testing

```bash
# Non-super_admin rejected
curl -H "Authorization: Bearer $USER_JWT" \
  http://localhost:3457/api/superadmin/tickets
# Expected: 403 Forbidden

# Super admin access
curl -H "Authorization: Bearer $SA_JWT" \
  http://localhost:3457/api/superadmin/tickets?limit=10
# Expected: 200 OK, list of tickets

# Rate limit
for i in {1..70}; do
  curl -H "Authorization: Bearer $SA_JWT" \
    http://localhost:3457/api/superadmin/tickets/stats
done
# Expected: 429 Too Many Requests after 60 requests

# Audit log created
curl -H "Authorization: Bearer $SA_JWT" \
  http://localhost:3457/api/superadmin/audit-logs?limit=5
# Expected: recent actions logged
```

#### 12.3 Security Validation

**Frontend**:
```bash
# No SERVICE_ROLE_KEY in code
grep -r "SERVICE_ROLE" /backoffice/src
# Expected: 0 results

# No SERVICE_ROLE_KEY in bundle
cd /backoffice && npm run build
grep -r "service_role" dist/
# Expected: 0 results
```

**Backend**:
```bash
# All superadmin routes protected
grep -A 5 "router\." /backend/src/routes/superadmin.routes.ts | grep -c "requireSuperAdmin"
# Expected: count = number of routes

# Every route logs action
grep -c "logSuperAdminAction" /backend/src/routes/superadmin.routes.ts
# Expected: count >= number of routes
```

**Database**:
```sql
-- Verify RLS on super_admin_access_logs
SET ROLE authenticated;
SET request.jwt.claims.sub = '<regular_user_id>';
SELECT * FROM super_admin_access_logs;
-- Expected: empty (RLS blocks)

SET request.jwt.claims.sub = '<super_admin_id>';
SELECT * FROM super_admin_access_logs;
-- Expected: rows returned
```

#### 12.4 Performance Testing

```bash
# 100 tickets load time
time curl "http://localhost:3457/api/superadmin/tickets?limit=100"
# Target: < 500ms

# Realtime propagation
# Terminal 1: watch super_admin_access_logs
# Terminal 2: create ticket
# Measure time between creation and realtime update
# Target: < 1 second
```

#### 12.5 TypeScript Compilation

```bash
# Backoffice
cd /backoffice && npx tsc --noEmit
# Expected: 0 errors

# Backend
cd /backend && npx tsc --noEmit
# Expected: 0 errors
```

**Estimated Time**: 12 hours (split over 2 days)

---

## 🔗 CRITICAL DEPENDENCIES

### Sequential Dependencies (Must follow order)

```
Phase 1 (Database)
    ↓
Phase 2 (Backend Middleware)
    ↓
Phase 3 (Backend Endpoints - Tickets)
    ↓
Phase 4 (Backend Endpoints - Users/Logs) + Claude Context Generator
    ↓
Phase 5 (Frontend Setup)
    ↓
Phase 6 (Auth & Routes)
    ↓
Phase 7 (Services Layer)
    ↓
Phase 8 (Layout & UI)
    ↓
Phase 9 (Tickets View - Main Feature)
    ↓
Phase 10 (Other Views)
    ↓
Phase 11 (Cockpit Integration)
    ↓
Phase 12 (Testing)
```

### Parallel Work Possible

Once Phase 5 (Frontend Setup) is done, **Phase 9-10** (frontend views) can be built in parallel while waiting for backend endpoints to be tested.

**Risk**: If backend API changes, frontend needs updates. Mitigate by:
- Freeze API contracts early (Zod schemas)
- Use TypeScript interfaces shared between frontend/backend
- Test endpoints thoroughly in Phase 3-4 before starting Phase 9

---

## 🛡️ RISK MITIGATION

### Risk 1: Realtime Supabase - First Usage
**Probability**: Medium
**Impact**: High (core feature)

**Mitigation**:
- Allocate 3h for Realtime setup + debugging (Phase 9.5)
- Verify RLS policies match Realtime subscriptions
- Test with multiple browser tabs
- Fallback: manual refresh button if Realtime fails

**Contingency**: If Realtime doesn't work in MVP, add "Refresh" button and defer Realtime to v1.1

---

### Risk 2: Type Duplication (cockpit ↔ backoffice)
**Probability**: Low
**Impact**: Medium (maintenance burden)

**Mitigation**:
- Use relative imports: `../../../cockpit/src/types/support.types.ts`
- Alternative (better long-term): extract to `/shared/types/` package
- Document import paths clearly

**Contingency**: If relative imports break in build, copy types temporarily and refactor later

---

### Risk 3: Clipboard API HTTPS Requirement
**Probability**: Medium (prod deployment)
**Impact**: Low (UX degradation)

**Mitigation**:
- Dev: `localhost` is treated as secure context (Clipboard works)
- Prod: `backoffice.hive-os.com` must use HTTPS (already planned)
- Fallback: Download .md file if clipboard fails

**Code**:
```typescript
try {
  await navigator.clipboard.writeText(markdown);
  toast.success('Copied to clipboard');
} catch (error) {
  // Download fallback
  downloadAsFile(markdown, 'bug-report.md');
  toast.info('Downloaded as .md file');
}
```

---

### Risk 4: Bundle Size Duplication (React/Tailwind in 2 apps)
**Probability**: High
**Impact**: Low (acceptable for MVP)

**Analysis**:
- Cockpit bundle: ~800KB (React 19 + Tailwind + deps)
- Backoffice bundle: ~800KB (same deps)
- Total: 1.6MB for founder (acceptable, only 1 user)

**Mitigation**: None needed for MVP. Future: monorepo + shared dependencies if needed.

---

### Risk 5: Git Log Execution (Backend)
**Probability**: Low
**Impact**: Medium (context incomplete)

**Mitigation**:
- Use `child_process.exec` with timeout (5s max)
- Catch errors gracefully (if git not available, skip commits section)
- Never expose stderr to frontend (security)

**Code**:
```typescript
try {
  const { stdout } = await execPromise('git log -3 --format="%h %s"', { timeout: 5000 });
  commits = stdout.trim().split('\n');
} catch (error) {
  console.error('Git log failed:', error);
  commits = ['Git log unavailable'];
}
```

---

## ✅ TESTING STRATEGY

### Unit Tests (Optional for MVP, recommended for v1.1)
- Backend: Jest tests for middleware (requireSuperAdmin)
- Backend: Test Claude Context Generator with mock data
- Frontend: React Testing Library for key components

### Integration Tests
- API endpoints: Postman collection
- Auth flow: Playwright E2E
- Realtime: Manual testing with 2 browser tabs

### Security Tests
- **Automated**:
  ```bash
  # No SERVICE_ROLE in frontend bundle
  npm run build && grep -r "service_role" dist/

  # RLS policies block unauthorized access
  # (SQL test script in migration 030)
  ```

- **Manual**:
  - Try accessing /api/superadmin/* with regular user token
  - Try accessing backoffice with tier-2 admin
  - Verify audit logs created for all actions

### Performance Tests
- Load test: 100 concurrent requests to /api/superadmin/tickets
- UI test: 1000 tickets in table (virtualization)
- Realtime test: Latency <1s for updates

---

## 📊 SUCCESS METRICS

### Functional Metrics
- [x] Founder can view all tickets from all users
- [x] Founder can reply to tickets (visible to users)
- [x] Founder can change ticket status/priority
- [x] Founder can add internal notes (invisible to users)
- [x] Claude Code Context generated successfully
- [x] Context is copyable to clipboard
- [x] Pasted context is readable in terminal

### Security Metrics
- [x] No SERVICE_ROLE_KEY in frontend code/bundle
- [x] Non-super_admin users cannot access backoffice
- [x] All super admin actions logged to audit trail
- [x] RLS policies enforce access control

### Performance Metrics
- [x] Tickets list loads in <500ms (100 tickets)
- [x] Realtime updates propagate in <1s
- [x] UI responsive (60fps) with 1000 tickets

### UX Metrics
- [x] Founder can find any ticket in <30s (search/filters)
- [x] Founder can generate context and paste in terminal in <1min
- [x] Zero crashes/errors in normal usage (1 week test)

---

## 📁 FILES SUMMARY

### To Create (New Files)

**Database**:
- `/cockpit/supabase/migrations/030_super_admin_backoffice.sql`

**Backend** (~8 files):
- `/backend/src/middleware/super-admin.middleware.ts`
- `/backend/src/routes/superadmin.routes.ts`
- `/backend/src/services/claude-context-generator.service.ts`
- `/backend/src/config/feature-files-map.ts`

**Backoffice** (~30 files):
- `/backoffice/package.json`
- `/backoffice/vite.config.ts`
- `/backoffice/tailwind.config.js`
- `/backoffice/src/main.tsx`
- `/backoffice/src/App.tsx`
- `/backoffice/src/lib/supabase.ts`
- `/backoffice/src/lib/api.ts`
- `/backoffice/src/store/useBackofficeStore.ts`
- `/backoffice/src/types/index.ts`
- `/backoffice/src/services/tickets.service.ts`
- `/backoffice/src/services/users.service.ts`
- `/backoffice/src/services/logs.service.ts`
- `/backoffice/src/services/metrics.service.ts`
- `/backoffice/src/services/audit.service.ts`
- `/backoffice/src/components/Layout.tsx`
- `/backoffice/src/components/auth/ProtectedSuperAdminRoute.tsx`
- `/backoffice/src/components/tickets/TicketsTable.tsx`
- `/backoffice/src/components/tickets/TicketFilters.tsx`
- `/backoffice/src/components/tickets/TicketDetailPanel.tsx`
- `/backoffice/src/components/tickets/TicketReplyBox.tsx`
- `/backoffice/src/components/tickets/InternalNotesList.tsx`
- `/backoffice/src/components/tickets/ClaudeContextButton.tsx`
- `/backoffice/src/components/users/UsersTable.tsx`
- `/backoffice/src/components/logs/LogsViewer.tsx`
- `/backoffice/src/components/metrics/MetricsCards.tsx`
- `/backoffice/src/components/ui/Button.tsx`
- `/backoffice/src/components/ui/Input.tsx`
- `/backoffice/src/components/ui/Select.tsx`
- `/backoffice/src/components/ui/Badge.tsx`
- `/backoffice/src/components/ui/Modal.tsx`
- `/backoffice/src/views/LoginView.tsx`
- `/backoffice/src/views/DashboardView.tsx`
- `/backoffice/src/views/TicketsView.tsx`
- `/backoffice/src/views/UsersView.tsx`
- `/backoffice/src/views/LogsView.tsx`
- `/backoffice/src/views/MetricsView.tsx`
- `/backoffice/src/views/AuditLogView.tsx`
- `/backoffice/src/hooks/useRealtimeTickets.ts`

### To Modify (Existing Files)

**Backend**:
- `/backend/src/index.ts` - Register superadmin.routes

**Cockpit**:
- `/cockpit/src/views/AdminDashboardView.tsx` - Remove global tickets/users tabs, add backoffice link

---

## 🎯 NEXT STEPS

### Immediate Actions (Before Starting Implementation)

1. **Review PRD with founder** - Confirm all requirements understood
2. **Validate architecture** - Ensure SERVICE_ROLE pattern approved
3. **Setup dev environment**:
   ```bash
   cd /backoffice
   npm create vite@latest . -- --template react-ts
   npm install
   ```
4. **Create feature branch**:
   ```bash
   git checkout -b feature/super-admin-backoffice
   ```

### Implementation Order (Start → Finish)

```
Day 1:  Phase 1 (Database)
Day 2:  Phase 2 (Middleware)
Day 3:  Phase 3 (Tickets Endpoints)
Day 4:  Phase 4 (Users/Logs/Context Generator)
Day 5:  Phase 5-6 (Frontend Setup + Auth)
Day 6:  Phase 7-8 (Services + Layout)
Day 7:  Phase 9.1-9.3 (Tickets Table + Filters + Detail)
Day 8:  Phase 9.4-9.5 (Claude Context + Realtime)
Day 9:  Phase 10 (Other Views)
Day 10: Phase 11 (Cockpit Integration)
Day 11: Phase 12.1-12.3 (Testing - Manual + API + Security)
Day 12: Phase 12.4-12.5 (Testing - Performance + TS)
```

### Definition of Done (Each Phase)

- [ ] Code written + committed
- [ ] TypeScript compiles (0 errors)
- [ ] Manual testing passed
- [ ] Documentation updated (inline comments)
- [ ] No console errors in browser/terminal

---

## 📝 NOTES & DECISIONS

### Why Separate App Instead of Cockpit Route?
- **Security**: Reduce attack surface by physical separation
- **Performance**: Backoffice bundle independent from user app
- **Maintenance**: Clear separation of tier-2 vs tier-3 concerns
- **Scalability**: Can move to separate server/domain easily

### Why Manual Clipboard Instead of Auto GitHub PR?
- **MVP Speed**: Clipboard = 2h, GitHub integration = 2 days
- **Flexibility**: Founder can edit context before using
- **Simplicity**: No GitHub tokens to manage
- **Upgrade Path**: Can add GitHub API in Phase 2 if needed

### Why In-Memory Rate Limit (Not Redis)?
- **Consistency**: Same pattern as existing admin rate limit
- **Simplicity**: No new infrastructure dependency
- **Scale**: Single founder = max 60 req/min, in-memory sufficient
- **Upgrade Path**: Switch to Redis when multi-admin needed

### Why Not Multi-Tenant Yet?
- **Current State**: 0 clients, solo founder
- **Complexity**: Organization scoping adds 2-3 days
- **Upgrade Path**: Add `organization_id` to tickets when needed
- **Priority**: Get backoffice working first, scale later

---

**Status**: 🟢 READY TO IMPLEMENT
**Estimated Total Time**: 12 days (96 hours)
**Confidence Level**: High (90%)

**Blockers**: None
**Dependencies**: All existing code in place

**Let's build! 🚀**
