# PRE-LAUNCH ROADMAP COMPLETE
## THE HIVE OS V4 - SaaS Public Launch Checklist

**Date:** 2026-02-20
**Target:** Production SaaS (100+ users)
**Current Status:** Option A (Mono-user MVP)
**Gap Analysis:** Full Stack Senior Dev + SaaS Launch Specialist Perspective

---

## EXECUTIVE SUMMARY

**Current Completeness:** 45% ready for public launch

**Critical Gaps (BLOCKERS):**
- ❌ No user authentication UI
- ❌ No multi-tenant RLS (migrations ready but not applied)
- ❌ No billing/payment system
- ❌ No onboarding flow
- ❌ No legal pages (Privacy Policy, Terms)
- ❌ No production deployment infrastructure

**Estimated Time to Launch:** 6-8 weeks (with 1 full-time dev)

---

## TABLE OF CONTENTS

1. [Frontend - User Experience](#frontend)
2. [Backend - Infrastructure](#backend)
3. [Database - Multi-Tenancy](#database)
4. [Payments - Monetization](#payments)
5. [Legal - Compliance](#legal)
6. [Infrastructure - DevOps](#infrastructure)
7. [Security - Hardening](#security)
8. [Quality - Testing](#quality)
9. [Product - Features](#product)
10. [Go-to-Market - Launch](#go-to-market)
11. [Post-Launch - Growth](#post-launch)

---

<a name="frontend"></a>
## 1. FRONTEND - USER EXPERIENCE

### 1.1 Authentication UI ⚠️ **CRITICAL - WEEK 1**

**Status:** ❌ Missing (LoginView.tsx created but not integrated)

**What's Needed:**

#### A. Login Page
**File:** `/cockpit/src/views/LoginView.tsx` (exists but not integrated)

**Tasks:**
- [ ] Integrate LoginView in App.tsx routing
- [ ] Add email/password login form
- [ ] Add "Forgot Password" flow
- [ ] Add social login (Google, GitHub) - optional
- [ ] Add error handling (wrong credentials, account locked)
- [ ] Add loading states
- [ ] Design: The Hive branding (logo, colors, premium feel)

**Implementation:**
```typescript
// App.tsx routing
<Route path="/login" element={<LoginView />} />
<Route path="/signup" element={<SignupView />} />
<Route path="/forgot-password" element={<ForgotPasswordView />} />
<Route path="/reset-password/:token" element={<ResetPasswordView />} />

// Protected routes wrapper
<Route element={<ProtectedRoute />}>
  <Route path="/genesis" element={<GenesisView />} />
  <Route path="/board/:projectId" element={<BoardView />} />
  ...
</Route>
```

**Components to Create:**
```
/cockpit/src/views/
├── LoginView.tsx                 ✅ Exists (needs integration)
├── SignupView.tsx                ❌ To create
├── ForgotPasswordView.tsx        ❌ To create
├── ResetPasswordView.tsx         ❌ To create
└── EmailVerificationView.tsx     ❌ To create

/cockpit/src/components/auth/
├── ProtectedRoute.tsx            ❌ To create
├── AuthGuard.tsx                 ❌ To create
└── SocialLoginButtons.tsx        ❌ To create (optional)
```

**Effort:** 3 days

---

#### B. Signup Flow
**File:** `/cockpit/src/views/SignupView.tsx` (to create)

**Tasks:**
- [ ] Email + password signup form
- [ ] Password strength indicator
- [ ] Email verification (send confirmation email)
- [ ] Terms & Privacy checkbox (with links)
- [ ] Error handling (email taken, weak password)
- [ ] Success state → redirect to onboarding

**Supabase Integration:**
```typescript
// services/auth.ts
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/verify-email`,
      data: {
        onboarding_completed: false,
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days trial
      }
    }
  });

  if (error) throw error;
  return data;
}
```

**Effort:** 2 days

---

### 1.2 User Account Management ⚠️ **CRITICAL - WEEK 1**

**Status:** ❌ Missing

**What's Needed:**

#### A. Settings Page
**File:** `/cockpit/src/views/SettingsView.tsx` (to create)

**Sections:**
1. **Profile**
   - Name, email
   - Avatar upload (Supabase Storage)
   - Change password

2. **Billing** (if on paid plan)
   - Current plan
   - Usage stats
   - Upgrade/downgrade buttons
   - Payment method
   - Invoices history

3. **Integrations**
   - Connected accounts (Google Ads, Meta Ads, etc.)
   - OAuth status
   - Disconnect button

4. **Preferences**
   - Language (FR/EN)
   - Email notifications (on/off)
   - Timezone

5. **Danger Zone**
   - Export data (GDPR compliance)
   - Delete account

**Components:**
```
/cockpit/src/views/SettingsView.tsx       ❌ To create
/cockpit/src/components/settings/
├── ProfileSettings.tsx                    ❌ To create
├── BillingSettings.tsx                    ❌ To create
├── IntegrationsSettings.tsx               ❌ To create
├── PreferencesSettings.tsx                ❌ To create
└── DangerZone.tsx                         ❌ To create
```

**Effort:** 4 days

---

#### B. Account Dropdown (in MainLayout)
**File:** `/cockpit/src/components/layout/MainLayout.tsx` (modify)

**Add top-right user menu:**
- User avatar + name
- Dropdown:
  - My Account
  - Settings
  - Billing
  - Documentation
  - Support
  - Logout

**Implementation:**
```tsx
<div className="fixed top-4 right-4 z-50">
  <UserAccountMenu user={currentUser} />
</div>
```

**Effort:** 1 day

---

### 1.3 Multi-Project Dashboard ⚠️ **HIGH PRIORITY - WEEK 2**

**Status:** ❌ Missing (currently redirects to /genesis or single project)

**What's Needed:**

#### Projects List View
**File:** `/cockpit/src/views/ProjectsView.tsx` (to create)

**Features:**
- Grid/List of all user projects
- Project cards:
  - Name
  - Status (planning, active, paused, completed)
  - Current phase
  - Progress %
  - Last activity
  - Quick actions (Open, Archive, Delete)
- Create New Project button → Genesis wizard
- Search & filters (by status, by date)
- Sort (recent, name, status)

**State Management:**
```typescript
// Add to useHiveStore.ts
interface HiveState {
  // Existing...
  allProjects: Project[];
  fetchUserProjects: () => Promise<void>;
  archiveProject: (id: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
}
```

**Routing:**
```typescript
// App.tsx
<Route path="/projects" element={<ProjectsView />} />
<Route path="/projects/:projectId/board" element={<BoardView />} />
<Route path="/projects/:projectId/chat" element={<ChatView />} />
...
```

**Effort:** 3 days

---

### 1.4 Onboarding Flow ⚠️ **HIGH PRIORITY - WEEK 2**

**Status:** ❌ Missing

**What's Needed:**

#### Welcome Tour (First-Time User Experience)
**File:** `/cockpit/src/components/onboarding/WelcomeTour.tsx` (to create)

**Steps:**
1. **Welcome Screen**
   - "Bienvenue dans THE HIVE OS!"
   - Quick intro video (30 sec)
   - "Commencer" button

2. **Meet Your Agents**
   - Interactive cards for each agent (SORA, LUNA, MARCUS, MILO)
   - Explain their roles
   - "Rencontrer les agents" animation

3. **Connect Your First Integration** (optional)
   - Google Ads OR Meta Ads OR Skip
   - OAuth flow
   - "Je le ferai plus tard" option

4. **Create Your First Project**
   - Redirect to Genesis wizard
   - OR skip to empty Projects dashboard

**Implementation:**
```typescript
// Check if user completed onboarding
const user = await supabase.auth.getUser();
if (!user.user_metadata.onboarding_completed) {
  return <WelcomeTour onComplete={() => {
    // Update user metadata
    supabase.auth.updateUser({
      data: { onboarding_completed: true }
    });
  }} />;
}
```

**Library:** Use `react-joyride` for guided tour

**Effort:** 3 days

---

### 1.5 Empty States & Error Handling ⚠️ **MEDIUM - WEEK 3**

**Status:** ⚠️ Partial (some empty states exist)

**What's Needed:**

#### A. Empty States
- [ ] No projects yet → "Create your first project"
- [ ] No tasks yet → "Your board is empty"
- [ ] No files yet → "No assets uploaded"
- [ ] No integrations → "Connect your first account"
- [ ] No chat history → "Start chatting with agents"

**Components:**
```tsx
// Reusable empty state component
<EmptyState
  icon={<FolderPlus />}
  title="No projects yet"
  description="Create your first project to get started"
  action={<Button onClick={() => navigate('/genesis')}>Create Project</Button>}
/>
```

#### B. Error States
- [ ] 404 Page Not Found
- [ ] 403 Unauthorized (not your project)
- [ ] 500 Server Error
- [ ] Network Error (offline)
- [ ] Rate Limit Exceeded

**Components:**
```
/cockpit/src/views/
├── NotFoundView.tsx       ❌ To create
├── UnauthorizedView.tsx   ❌ To create
└── ErrorView.tsx          ❌ To create
```

**Effort:** 2 days

---

### 1.6 Notifications & Toast System ⚠️ **MEDIUM - WEEK 3**

**Status:** ⚠️ Partial (basic toast might exist)

**What's Needed:**

#### Notification Center
**File:** `/cockpit/src/components/notifications/NotificationCenter.tsx`

**Features:**
- Bell icon in top bar (with unread count badge)
- Dropdown with recent notifications:
  - Campaign launched
  - Task completed
  - Budget alert
  - Integration disconnected
  - etc.
- Mark as read/unread
- Clear all

**Database:**
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL, -- 'success' | 'warning' | 'error' | 'info'
  title TEXT NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Realtime Subscription:**
```typescript
// Subscribe to new notifications
supabase
  .channel('notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`
  }, payload => {
    // Show toast + update notification center
  })
  .subscribe();
```

**Library:** Use `sonner` for toast notifications

**Effort:** 2 days

---

### 1.7 Responsive Design ⚠️ **MEDIUM - WEEK 4**

**Status:** ⚠️ Partial (desktop-first, mobile not optimized)

**What's Needed:**

- [ ] Mobile navigation (hamburger menu)
- [ ] Responsive BoardView (stack columns on mobile)
- [ ] Responsive ChatView (full screen on mobile)
- [ ] Touch gestures (swipe, drag)
- [ ] Mobile-optimized Genesis wizard

**Breakpoints:**
```css
/* tailwind.config.js */
screens: {
  'sm': '640px',   // Mobile
  'md': '768px',   // Tablet
  'lg': '1024px',  // Desktop
  'xl': '1280px',  // Large desktop
  '2xl': '1536px'  // Extra large
}
```

**Effort:** 5 days

---

### 1.8 Performance Optimization ⚠️ **LOW - WEEK 5**

**What's Needed:**

- [ ] Code splitting (lazy load routes)
- [ ] Image optimization (WebP, lazy loading)
- [ ] Bundle size reduction (analyze with `source-map-explorer`)
- [ ] Memoization of expensive components
- [ ] Virtualization for long lists (react-window)

**Implementation:**
```typescript
// Lazy load routes
const BoardView = lazy(() => import('./views/BoardView'));
const AnalyticsView = lazy(() => import('./views/AnalyticsView'));

<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/board/:projectId" element={<BoardView />} />
  </Routes>
</Suspense>
```

**Targets:**
- Lighthouse Score > 90
- First Contentful Paint < 1.5s
- Time to Interactive < 3s
- Bundle size < 500KB (gzipped)

**Effort:** 3 days

---

## FRONTEND SUMMARY

| Category | Tasks | Status | Effort | Priority |
|----------|-------|--------|--------|----------|
| Authentication UI | 4 views | ❌ 0/4 | 5 days | CRITICAL |
| Account Management | Settings + Menu | ❌ 0/2 | 5 days | CRITICAL |
| Multi-Project Dashboard | ProjectsView | ❌ 0/1 | 3 days | HIGH |
| Onboarding | Welcome Tour | ❌ 0/1 | 3 days | HIGH |
| Empty States & Errors | 5 views | ⚠️ 1/5 | 2 days | MEDIUM |
| Notifications | Center + Toasts | ⚠️ Partial | 2 days | MEDIUM |
| Responsive Design | Mobile optimization | ⚠️ Partial | 5 days | MEDIUM |
| Performance | Optimization | ❌ 0/5 | 3 days | LOW |
| **TOTAL** | **25 tasks** | **~4%** | **28 days** | - |

---

<a name="backend"></a>
## 2. BACKEND - INFRASTRUCTURE

### 2.1 API Error Handling ⚠️ **CRITICAL - WEEK 1**

**Status:** ⚠️ Partial (basic error handling exists)

**What's Needed:**

#### Standardized Error Response Format
**File:** `/cockpit/src/services/n8n.ts` (modify)

**Current:**
```typescript
// Errors are inconsistent
throw new Error('Something went wrong');
```

**Target:**
```typescript
interface APIError {
  success: false;
  error: {
    code: string;           // 'AUTH_FAILED', 'RATE_LIMIT_EXCEEDED', etc.
    message: string;        // User-friendly message
    details?: any;          // Technical details (dev only)
    retry_after?: number;   // For rate limiting
  };
  meta: {
    request_id: string;     // For support debugging
    timestamp: string;
  };
}
```

**PM Workflow Error Handler:**
```javascript
// Add global error handler node in PM workflow
try {
  // ... existing logic
} catch (error) {
  const errorResponse = {
    success: false,
    error: {
      code: error.code || 'UNKNOWN_ERROR',
      message: sanitizeErrorMessage(error.message),
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    },
    meta: {
      request_id: uuidv4(),
      timestamp: new Date().toISOString()
    }
  };

  // Log to Supabase audit_logs
  await logError(errorResponse);

  return errorResponse;
}
```

**Effort:** 2 days

---

### 2.2 Rate Limiting Enforcement ⚠️ **CRITICAL - WEEK 1**

**Status:** ⚠️ Migration created (006_rate_limiting.sql) but not applied

**What's Needed:**

#### Apply Migration 006
```bash
cd /cockpit
npx supabase db push
```

#### Add Rate Limit Check in PM Workflow
**File:** `/agents/CURRENT_pm-mcp/pm-core-v4.4-validated.workflow.json`

**New node after Main Entry Point:**
```javascript
// CHECK RATE LIMIT
const userId = $input.first().json.user_id;
const endpoint = $input.first().json.action; // 'genesis', 'task_launch', etc.

const rateLimitCheck = await supabase.rpc('check_rate_limit', {
  p_user_id: userId,
  p_endpoint: endpoint,
  p_tier: 'pro' // Get from user.subscription_tier
});

if (!rateLimitCheck.allowed) {
  return [{
    json: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Rate limit exceeded. Try again in ${rateLimitCheck.retry_after} seconds.`,
        retry_after: rateLimitCheck.retry_after
      }
    }
  }];
}

// Continue with normal flow
```

**Tiers:**
```javascript
const RATE_LIMITS = {
  free: {
    requests_per_minute: 5,
    requests_per_hour: 50,
    requests_per_day: 200
  },
  pro: {
    requests_per_minute: 30,
    requests_per_hour: 500,
    requests_per_day: 5000
  },
  enterprise: {
    requests_per_minute: 100,
    requests_per_hour: 5000,
    requests_per_day: 50000
  }
};
```

**Frontend Handling:**
```typescript
// services/n8n.ts
if (response.error?.code === 'RATE_LIMIT_EXCEEDED') {
  toast.error(response.error.message);
  // Optionally: Disable UI temporarily
  setTimeout(() => {
    // Re-enable UI
  }, response.error.retry_after * 1000);
}
```

**Effort:** 1 day

---

### 2.3 Audit Logging ⚠️ **CRITICAL - WEEK 1**

**Status:** ⚠️ Migration created (007_audit_logs.sql) but not applied

**What's Needed:**

#### Apply Migration 007
```bash
npx supabase db push
```

#### Add Audit Logging to PM Workflow
**File:** `/agents/CURRENT_pm-mcp/pm-core-v4.4-validated.workflow.json`

**New node after processing orchestrator response:**
```javascript
// LOG AUDIT ENTRY
const auditEntry = {
  user_id: $json.user_id,
  user_email: $json.user_email,
  action: $json.action, // 'genesis', 'task_launch', 'write_back'
  resource_type: $json.action === 'genesis' ? 'project' : 'task',
  resource_id: $json.project_id || $json.task_id,
  ip_address: $json.ip_address,
  user_agent: $json.user_agent,
  metadata: {
    agent_called: $json.meta?.agent_id,
    success: $json.success,
    error: $json.error || null
  },
  success: $json.success,
  error_message: $json.error?.message || null
};

await supabase.rpc('log_audit', auditEntry);
```

**Critical Actions to Log:**
- User signup/login
- Project creation
- Campaign launched (WRITE operation)
- Budget updated (WRITE operation)
- Integration connected/disconnected
- Settings changed
- Account deleted

**Effort:** 1 day

---

### 2.4 Environment Configuration ⚠️ **CRITICAL - WEEK 2**

**Status:** ❌ Only local .env exists

**What's Needed:**

#### Create Environment Files
```
/.env.development     ← Local dev
/.env.staging         ← Staging server (pre-prod)
/.env.production      ← Production server
```

**Required Variables:**

**Frontend (.env):**
```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# n8n PM URL
VITE_PM_WEBHOOK_URL=https://n8n.your-domain.com/webhook/pm-v4-entry

# Environment
VITE_ENV=production

# Analytics
VITE_POSTHOG_KEY=phc_...
VITE_SENTRY_DSN=https://...@sentry.io/...

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

**Backend (n8n .env):**
```bash
# n8n Core
N8N_ENCRYPTION_KEY=<GENERATE_WITH_openssl_rand_-hex_32>
N8N_HOST=n8n.your-domain.com
N8N_PORT=5678
N8N_PROTOCOL=https

# Webhooks
WEBHOOK_URL=https://n8n.your-domain.com
ORCHESTRATOR_WEBHOOK_URL=https://n8n.your-domain.com/webhook/orchestrator-v4-entry

# Database
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=db.your-project.supabase.co
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=postgres
DB_POSTGRESDB_USER=postgres
DB_POSTGRESDB_PASSWORD=<SUPABASE_PASSWORD>

# APIs
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=AI...
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
ELEVENLABS_API_KEY=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Google Ads
GOOGLE_ADS_DEVELOPER_TOKEN=...
GOOGLE_ADS_CLIENT_ID=...
GOOGLE_ADS_CLIENT_SECRET=...
GOOGLE_ADS_REFRESH_TOKEN=...
GOOGLE_ADS_CUSTOMER_ID=...

# Meta Ads
META_ACCESS_TOKEN=...
META_AD_ACCOUNT_ID=...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (SendGrid / Resend)
SENDGRID_API_KEY=SG...
FROM_EMAIL=noreply@thehive.com

# Monitoring
SENTRY_DSN=https://...@sentry.io/...
```

**Security:**
- ❌ NEVER commit .env files to Git
- ✅ Use secret management (Vercel Env Vars, AWS Secrets Manager, etc.)
- ✅ Rotate keys every 90 days

**Effort:** 1 day

---

### 2.5 API Versioning ⚠️ **MEDIUM - WEEK 3**

**Status:** ❌ Missing

**What's Needed:**

#### URL Versioning
```
Current: POST /webhook/pm-v4-entry
Target:  POST /api/v1/pm/entry
         POST /api/v2/pm/entry (future)
```

**PM Workflow Path:**
```javascript
// Webhook path: /api/v1/pm/entry
// Version check
const apiVersion = $input.first().json.headers['x-api-version'] || 'v1';

if (apiVersion !== 'v1') {
  return {
    success: false,
    error: {
      code: 'UNSUPPORTED_API_VERSION',
      message: `API version ${apiVersion} is not supported. Use v1.`
    }
  };
}
```

**Frontend:**
```typescript
// services/n8n.ts
const PM_API_VERSION = 'v1';

axios.post(PM_WEBHOOK_URL, payload, {
  headers: {
    'X-API-Version': PM_API_VERSION
  }
});
```

**Effort:** 1 day

---

### 2.6 Webhook Signature Validation ⚠️ **HIGH - WEEK 2**

**Status:** ❌ Missing (SECURITY RISK)

**What's Needed:**

#### Sign Requests from Frontend
```typescript
// frontend: services/n8n.ts
import crypto from 'crypto';

function signPayload(payload: any, secret: string): string {
  const timestamp = Date.now();
  const stringPayload = JSON.stringify(payload) + timestamp;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(stringPayload)
    .digest('hex');

  return `t=${timestamp},v1=${signature}`;
}

// Send request
axios.post(PM_WEBHOOK_URL, payload, {
  headers: {
    'X-Hive-Signature': signPayload(payload, WEBHOOK_SECRET)
  }
});
```

#### Verify Signature in n8n
```javascript
// PM workflow - First node after webhook
const signature = $input.first().json.headers['x-hive-signature'];
const payload = $input.first().json.body;
const secret = $env.WEBHOOK_SECRET;

// Parse signature
const [tPart, v1Part] = signature.split(',');
const timestamp = parseInt(tPart.split('=')[1]);
const receivedSignature = v1Part.split('=')[1];

// Check timestamp (prevent replay attacks)
const now = Date.now();
if (now - timestamp > 300000) { // 5 minutes
  return {
    success: false,
    error: { code: 'SIGNATURE_EXPIRED', message: 'Request signature expired' }
  };
}

// Verify signature
const expectedSignature = crypto
  .createHmac('sha256', secret)
  .update(JSON.stringify(payload) + timestamp)
  .digest('hex');

if (receivedSignature !== expectedSignature) {
  return {
    success: false,
    error: { code: 'INVALID_SIGNATURE', message: 'Invalid request signature' }
  };
}

// Continue
```

**Effort:** 2 days

---

## BACKEND SUMMARY

| Category | Tasks | Status | Effort | Priority |
|----------|-------|--------|--------|----------|
| Error Handling | Standardize errors | ⚠️ Partial | 2 days | CRITICAL |
| Rate Limiting | Apply + enforce | ❌ 0/2 | 1 day | CRITICAL |
| Audit Logging | Apply + implement | ❌ 0/2 | 1 day | CRITICAL |
| Environment Config | 3 env files | ❌ 0/3 | 1 day | CRITICAL |
| API Versioning | Implement v1 | ❌ 0/1 | 1 day | MEDIUM |
| Webhook Security | Signature validation | ❌ 0/1 | 2 days | HIGH |
| **TOTAL** | **11 tasks** | **~9%** | **8 days** | - |

---

<a name="database"></a>
## 3. DATABASE - MULTI-TENANCY

### 3.1 Apply Security Migrations ⚠️ **CRITICAL - WEEK 1**

**Status:** ⚠️ Migrations created but NOT applied

**What's Needed:**

#### Apply All Security Migrations
```bash
cd /cockpit

# Apply migrations 004-007
npx supabase db push

# Verify RLS policies
npx supabase db diff --use-migra
```

**Migrations to Apply:**
1. ✅ `004_production_rls.sql` - Multi-tenant RLS policies
2. ✅ `005_user_integrations.sql` - Per-user OAuth credentials
3. ✅ `006_rate_limiting.sql` - Rate limit tables
4. ✅ `007_audit_logs.sql` - Audit log table

**Verification Checklist:**
- [ ] Every table has `user_id` column
- [ ] RLS policies enforce `auth.uid() = user_id`
- [ ] Indexes on `user_id` columns exist
- [ ] Test: User A cannot see User B's data

**Test Script:**
```sql
-- Create 2 test users
INSERT INTO auth.users (id, email) VALUES
  ('user-a-uuid', 'usera@test.com'),
  ('user-b-uuid', 'userb@test.com');

-- Create projects for each user
INSERT INTO projects (id, user_id, name) VALUES
  ('proj-a', 'user-a-uuid', 'Project A'),
  ('proj-b', 'user-b-uuid', 'Project B');

-- Test isolation (should only see own project)
SET request.jwt.claim.sub = 'user-a-uuid';
SELECT * FROM projects; -- Should see only Project A

SET request.jwt.claim.sub = 'user-b-uuid';
SELECT * FROM projects; -- Should see only Project B
```

**Effort:** 1 day (apply + test)

---

### 3.2 Data Migration (user_id backfill) ⚠️ **HIGH - WEEK 1**

**Status:** ❌ If existing data has no user_id

**What's Needed:**

If you have existing projects/tasks from mono-user development:

```sql
-- Assign all existing data to your user account
UPDATE projects SET user_id = '<YOUR_USER_UUID>' WHERE user_id IS NULL;
UPDATE tasks SET user_id = '<YOUR_USER_UUID>' WHERE user_id IS NULL;
UPDATE chat_sessions SET user_id = '<YOUR_USER_UUID>' WHERE user_id IS NULL;
UPDATE project_memory SET user_id = '<YOUR_USER_UUID>' WHERE user_id IS NULL;
UPDATE wizard_sessions SET user_id = '<YOUR_USER_UUID>' WHERE user_id IS NULL;
```

**Effort:** 0.5 day

---

### 3.3 Database Backups ⚠️ **CRITICAL - WEEK 2**

**Status:** ⚠️ Supabase has auto-backups (daily) but no manual backup workflow

**What's Needed:**

#### Automated Backups
- [ ] Enable Supabase Point-in-Time Recovery (PITR) - $100/month
- [ ] OR implement manual backups to S3

**Manual Backup Script:**
```bash
#!/bin/bash
# backup-db.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="thehive_backup_$TIMESTAMP.sql"

# Dump database
PGPASSWORD=$DB_PASSWORD pg_dump \
  -h $DB_HOST \
  -U $DB_USER \
  -d $DB_NAME \
  --clean --if-exists \
  --no-owner --no-acl \
  > $BACKUP_FILE

# Compress
gzip $BACKUP_FILE

# Upload to S3 (or Google Cloud Storage)
aws s3 cp $BACKUP_FILE.gz s3://thehive-backups/db/$BACKUP_FILE.gz

# Keep only last 30 days
aws s3 ls s3://thehive-backups/db/ | while read -r line; do
  # Delete files older than 30 days
done

echo "Backup complete: $BACKUP_FILE.gz"
```

**Schedule (cron):**
```bash
# Daily at 2 AM
0 2 * * * /path/to/backup-db.sh
```

**Effort:** 1 day

---

### 3.4 Database Indexes Optimization ⚠️ **MEDIUM - WEEK 3**

**Status:** ⚠️ Basic indexes exist, but not optimized for queries

**What's Needed:**

#### Analyze Slow Queries
```sql
-- Enable pg_stat_statements extension
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Find slowest queries
SELECT
  query,
  calls,
  mean_exec_time,
  total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

#### Add Missing Indexes
```sql
-- Common query patterns
CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON tasks(project_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_status ON tasks(assignee, status);
CREATE INDEX IF NOT EXISTS idx_memory_project_created ON project_memory(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_project ON chat_sessions(project_id, created_at DESC);

-- Full-text search indexes (if using search)
CREATE INDEX IF NOT EXISTS idx_tasks_search ON tasks USING gin(to_tsvector('english', title || ' ' || description));
```

**Effort:** 1 day

---

## DATABASE SUMMARY

| Category | Tasks | Status | Effort | Priority |
|----------|-------|--------|--------|----------|
| Apply Migrations | 4 migrations | ❌ 0/4 | 1 day | CRITICAL |
| Data Migration | Backfill user_id | ❌ 0/1 | 0.5 day | HIGH |
| Backups | Automated backups | ⚠️ Partial | 1 day | CRITICAL |
| Index Optimization | Add missing indexes | ❌ 0/1 | 1 day | MEDIUM |
| **TOTAL** | **7 tasks** | **~14%** | **3.5 days** | - |

---

<a name="payments"></a>
## 4. PAYMENTS - MONETIZATION

### 4.1 Stripe Integration ⚠️ **CRITICAL - WEEK 2-3**

**Status:** ❌ Not implemented

**What's Needed:**

#### A. Stripe Setup
1. Create Stripe account (stripe.com)
2. Set up products & pricing tiers
3. Configure webhooks
4. Add Stripe.js to frontend

#### B. Pricing Tiers

**Recommended Structure:**

| Tier | Price | Features | Target |
|------|-------|----------|--------|
| **Free** | $0/month | 1 project, 50 tasks/month, basic agents | Solopreneurs testing |
| **Pro** | $79/month | 10 projects, unlimited tasks, all agents, priority support | SMBs, agencies |
| **Enterprise** | $299/month | Unlimited projects, white-label, API access, dedicated support | Large agencies |

**Database Schema:**
```sql
-- Add to users table
ALTER TABLE auth.users ADD COLUMN subscription_tier TEXT DEFAULT 'free';
ALTER TABLE auth.users ADD COLUMN stripe_customer_id TEXT;
ALTER TABLE auth.users ADD COLUMN stripe_subscription_id TEXT;
ALTER TABLE auth.users ADD COLUMN trial_ends_at TIMESTAMPTZ;
ALTER TABLE auth.users ADD COLUMN subscription_status TEXT; -- 'active', 'trialing', 'past_due', 'canceled'

-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  tier TEXT NOT NULL, -- 'free', 'pro', 'enterprise'
  status TEXT NOT NULL, -- 'active', 'trialing', 'past_due', 'canceled'
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### C. Stripe Checkout Flow

**File:** `/cockpit/src/components/billing/CheckoutButton.tsx`

```typescript
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export function CheckoutButton({ tier }: { tier: 'pro' | 'enterprise' }) {
  const handleCheckout = async () => {
    const stripe = await stripePromise;
    if (!stripe) return;

    // Call your backend to create checkout session
    const { sessionId } = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier })
    }).then(r => r.json());

    // Redirect to Stripe Checkout
    const { error } = await stripe.redirectToCheckout({ sessionId });
    if (error) console.error(error);
  };

  return (
    <button onClick={handleCheckout} className="bg-blue-600 px-6 py-3 rounded-lg">
      Upgrade to {tier.toUpperCase()}
    </button>
  );
}
```

**Backend (Supabase Edge Function or n8n):**
```typescript
// Edge Function: create-checkout-session
import Stripe from 'stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);

Deno.serve(async (req) => {
  const { tier } = await req.json();
  const user = await getAuthenticatedUser(req);

  const session = await stripe.checkout.sessions.create({
    customer_email: user.email,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{
      price: tier === 'pro' ? 'price_pro_id' : 'price_enterprise_id',
      quantity: 1
    }],
    success_url: `${req.headers.get('origin')}/billing/success`,
    cancel_url: `${req.headers.get('origin')}/billing/cancel`,
    metadata: { user_id: user.id }
  });

  return new Response(JSON.stringify({ sessionId: session.id }));
});
```

#### D. Webhook Handler (Stripe → Supabase)

**Listen to Stripe events:**
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

**Supabase Edge Function:**
```typescript
// Edge Function: stripe-webhooks
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_KEY')!);

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature')!;
  const body = await req.text();

  // Verify webhook signature
  const event = stripe.webhooks.constructEvent(
    body,
    signature,
    Deno.env.get('STRIPE_WEBHOOK_SECRET')!
  );

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      const subscription = event.data.object;

      // Update user subscription in Supabase
      await supabase
        .from('subscriptions')
        .upsert({
          stripe_subscription_id: subscription.id,
          stripe_customer_id: subscription.customer,
          tier: subscription.metadata.tier,
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000),
          current_period_end: new Date(subscription.current_period_end * 1000)
        });

      // Update auth.users
      await supabase.auth.admin.updateUserById(subscription.metadata.user_id, {
        user_metadata: {
          subscription_tier: subscription.metadata.tier,
          subscription_status: subscription.status
        }
      });
      break;

    case 'customer.subscription.deleted':
      // Downgrade to free
      await supabase.auth.admin.updateUserById(event.data.object.metadata.user_id, {
        user_metadata: { subscription_tier: 'free' }
      });
      break;
  }

  return new Response(JSON.stringify({ received: true }));
});
```

#### E. Usage Limits Enforcement

**Frontend: Check limits before action**
```typescript
// services/limits.ts
const LIMITS = {
  free: { projects: 1, tasks_per_month: 50, ai_requests_per_day: 10 },
  pro: { projects: 10, tasks_per_month: Infinity, ai_requests_per_day: 500 },
  enterprise: { projects: Infinity, tasks_per_month: Infinity, ai_requests_per_day: Infinity }
};

export async function checkLimit(user: User, action: 'create_project' | 'create_task' | 'ai_request'): Promise<boolean> {
  const tier = user.subscription_tier || 'free';
  const limits = LIMITS[tier];

  switch (action) {
    case 'create_project':
      const projectCount = await getProjectCount(user.id);
      if (projectCount >= limits.projects) {
        toast.error('Project limit reached. Upgrade to Pro for more projects.');
        return false;
      }
      break;
    // ... other checks
  }

  return true;
}
```

**Effort:** 5 days

---

### 4.2 Billing Dashboard ⚠️ **HIGH - WEEK 3**

**Status:** ❌ Not implemented

**What's Needed:**

**File:** `/cockpit/src/components/settings/BillingSettings.tsx`

**Features:**
- Current plan display
- Usage stats (tasks created this month, API calls, etc.)
- Upgrade/downgrade buttons
- Payment method management (Stripe Customer Portal)
- Invoice history
- Cancel subscription

**Implementation:**
```tsx
export function BillingSettings() {
  const user = useHiveStore(state => state.currentUser);
  const subscription = useSubscription(user.id);

  const openCustomerPortal = async () => {
    const { url } = await fetch('/api/create-portal-session', {
      method: 'POST'
    }).then(r => r.json());

    window.location.href = url;
  };

  return (
    <div className="space-y-6">
      <Card>
        <h2>Current Plan: {subscription.tier.toUpperCase()}</h2>
        <p>Status: {subscription.status}</p>
        <p>Renews: {subscription.current_period_end}</p>
      </Card>

      <Card>
        <h3>Usage This Month</h3>
        <UsageStats userId={user.id} />
      </Card>

      <button onClick={openCustomerPortal}>Manage Billing</button>
    </div>
  );
}
```

**Effort:** 2 days

---

## PAYMENTS SUMMARY

| Category | Tasks | Status | Effort | Priority |
|----------|-------|--------|--------|----------|
| Stripe Integration | Setup + checkout | ❌ 0/1 | 5 days | CRITICAL |
| Webhook Handler | Sync subscriptions | ❌ 0/1 | 2 days | CRITICAL |
| Billing Dashboard | UI + portal | ❌ 0/1 | 2 days | HIGH |
| Usage Limits | Enforcement | ❌ 0/1 | 1 day | HIGH |
| **TOTAL** | **4 tasks** | **0%** | **10 days** | - |

---

<a name="legal"></a>
## 5. LEGAL - COMPLIANCE

### 5.1 Privacy Policy & Terms of Service ⚠️ **CRITICAL - WEEK 3**

**Status:** ❌ Not created

**What's Needed:**

#### A. Privacy Policy
**File:** `/cockpit/public/legal/privacy-policy.md`

**Must Include:**
- What data we collect (email, usage data, OAuth tokens)
- How we use it (provide service, improve product)
- Third-party services (Supabase, Stripe, OpenAI, Google, Meta)
- Data retention (how long we keep data)
- User rights (GDPR: access, rectification, erasure, portability)
- Contact info (DPO email)

**Tools:**
- Use templates from [Termly](https://termly.io) or [iubenda](https://iubenda.com)
- Customize for your stack (Supabase, Stripe, n8n, etc.)

#### B. Terms of Service
**File:** `/cockpit/public/legal/terms-of-service.md`

**Must Include:**
- Service description
- User obligations (don't abuse API, no scraping, etc.)
- Intellectual property (who owns data)
- Liability limitations
- Termination clause
- Dispute resolution

#### C. Display Legal Pages
**Routes:**
```typescript
<Route path="/legal/privacy" element={<PrivacyPolicyView />} />
<Route path="/legal/terms" element={<TermsOfServiceView />} />
```

**Footer Links:**
```tsx
<footer className="bg-gray-900 text-white py-8">
  <div className="container mx-auto flex justify-between">
    <div>© 2026 The Hive OS. All rights reserved.</div>
    <div className="space-x-4">
      <Link to="/legal/privacy">Privacy Policy</Link>
      <Link to="/legal/terms">Terms of Service</Link>
      <Link to="/legal/cookies">Cookie Policy</Link>
      <a href="mailto:support@thehive.com">Contact</a>
    </div>
  </div>
</footer>
```

**Effort:** 2 days (with lawyer review)

---

### 5.2 GDPR Compliance ⚠️ **CRITICAL - WEEK 4**

**Status:** ⚠️ Partial (data export/deletion in PRD but not implemented)

**What's Needed:**

#### A. Cookie Consent Banner
**Library:** `react-cookie-consent` or `cookie-consent-modal`

```tsx
import CookieConsent from 'react-cookie-consent';

<CookieConsent
  location="bottom"
  buttonText="Accept All"
  declineButtonText="Decline"
  enableDeclineButton
  onAccept={() => {
    // Enable analytics (PostHog, etc.)
  }}
  onDecline={() => {
    // Disable analytics
  }}
>
  We use cookies to improve your experience. Read our{' '}
  <a href="/legal/cookies">Cookie Policy</a>.
</CookieConsent>
```

#### B. Data Export (Right to Portability)
**Endpoint:** `POST /api/export-user-data`

```typescript
// Supabase Edge Function: export-user-data
export async function exportUserData(userId: string) {
  const { data: projects } = await supabase.from('projects').select('*').eq('user_id', userId);
  const { data: tasks } = await supabase.from('tasks').select('*').eq('user_id', userId);
  const { data: memory } = await supabase.from('project_memory').select('*').eq('user_id', userId);
  const { data: chats } = await supabase.from('chat_sessions').select('*').eq('user_id', userId);

  const exportData = {
    user_id: userId,
    exported_at: new Date().toISOString(),
    projects,
    tasks,
    memory,
    chats
  };

  // Generate JSON file
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  return { download_url: url, filename: `thehive_data_${userId}_${Date.now()}.json` };
}
```

**UI:**
```tsx
// In SettingsView DangerZone
<button onClick={handleExportData}>
  Download My Data (GDPR)
</button>
```

#### C. Account Deletion (Right to Erasure)
**Endpoint:** `POST /api/delete-account`

```typescript
// Supabase Edge Function: delete-account
export async function deleteAccount(userId: string) {
  // 1. Cancel Stripe subscription
  await stripe.subscriptions.cancel(user.stripe_subscription_id);

  // 2. Delete all user data (CASCADE will handle related tables)
  await supabase.from('projects').delete().eq('user_id', userId);
  await supabase.from('tasks').delete().eq('user_id', userId);
  await supabase.from('project_memory').delete().eq('user_id', userId);
  await supabase.from('chat_sessions').delete().eq('user_id', userId);
  await supabase.from('subscriptions').delete().eq('user_id', userId);

  // 3. Delete auth user
  await supabase.auth.admin.deleteUser(userId);

  // 4. Log deletion in audit_logs (keep for 30 days for compliance)
  await logAudit({
    user_id: userId,
    action: 'ACCOUNT_DELETED',
    resource_type: 'user',
    success: true
  });

  return { success: true, message: 'Account deleted' };
}
```

**UI:**
```tsx
// Confirmation modal
<button onClick={() => setShowDeleteModal(true)} className="bg-red-600">
  Delete My Account
</button>

{showDeleteModal && (
  <Modal>
    <h2>Are you absolutely sure?</h2>
    <p>This action CANNOT be undone. All your projects, tasks, and data will be permanently deleted.</p>
    <input type="text" placeholder="Type DELETE to confirm" onChange={e => setConfirmText(e.target.value)} />
    <button disabled={confirmText !== 'DELETE'} onClick={handleDeleteAccount}>
      I understand, delete my account
    </button>
  </Modal>
)}
```

**Effort:** 3 days

---

## LEGAL SUMMARY

| Category | Tasks | Status | Effort | Priority |
|----------|-------|--------|--------|----------|
| Privacy Policy | Create + review | ❌ 0/1 | 2 days | CRITICAL |
| Terms of Service | Create + review | ❌ 0/1 | 2 days | CRITICAL |
| Cookie Consent | Implement banner | ❌ 0/1 | 1 day | CRITICAL |
| Data Export | GDPR compliance | ❌ 0/1 | 1 day | CRITICAL |
| Account Deletion | GDPR compliance | ❌ 0/1 | 2 days | CRITICAL |
| **TOTAL** | **5 tasks** | **0%** | **8 days** | - |

---

<a name="infrastructure"></a>
## 6. INFRASTRUCTURE - DEVOPS

### 6.1 Deployment Environments ⚠️ **CRITICAL - WEEK 2**

**Status:** ❌ Only local dev exists

**What's Needed:**

#### Create 3 Environments

| Environment | Purpose | URL | Database | n8n Instance |
|-------------|---------|-----|----------|--------------|
| **Development** | Local dev | localhost:5173 | Supabase local | localhost:5678 |
| **Staging** | Pre-prod testing | staging.thehive.com | Supabase staging project | n8n-staging.thehive.com |
| **Production** | Public users | app.thehive.com | Supabase production project | n8n.thehive.com |

#### Deployment Strategy

**Frontend (Vite React):**
- Deploy to Vercel or Netlify or Cloudflare Pages
- Automatic deploys from Git branches:
  - `main` → Production
  - `staging` → Staging
  - `dev` → Development preview

**Backend (n8n):**
- Deploy to VPS (Hostinger, DigitalOcean, AWS EC2)
- Use Docker Compose
- Separate instances for staging & production

**Effort:** 2 days

---

### 6.2 CI/CD Pipeline ⚠️ **HIGH - WEEK 3**

**Status:** ❌ Not implemented

**What's Needed:**

#### GitHub Actions Workflow

**File:** `.github/workflows/ci-cd.yml`

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, staging, dev]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: cd cockpit && npm ci
      - run: cd cockpit && npm run test
      - run: cd cockpit && npm run build

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd cockpit && npm ci
      - run: cd cockpit && npx tsc --noEmit
      - run: cd cockpit && npx eslint src/

  deploy-staging:
    needs: [test, lint]
    if: github.ref == 'refs/heads/staging'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: vercel/vercel-action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-args: '--prod'
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID_STAGING }}

  deploy-production:
    needs: [test, lint]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: vercel/vercel-action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-args: '--prod'
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

**Effort:** 2 days

---

### 6.3 Monitoring & Alerting ⚠️ **CRITICAL - WEEK 3**

**Status:** ❌ Not implemented

**What's Needed:**

#### A. Error Tracking (Sentry)

**Setup:**
```bash
npm install @sentry/react @sentry/vite-plugin
```

**Config:**
```typescript
// main.tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_ENV,
  tracesSampleRate: 0.1,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay()
  ]
});
```

**Alerts:**
- Email on critical errors
- Slack notifications for production errors

#### B. Performance Monitoring (PostHog / Vercel Analytics)

```bash
npm install posthog-js
```

```typescript
// main.tsx
import posthog from 'posthog-js';

posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
  api_host: 'https://app.posthog.com'
});
```

**Track:**
- Page views
- User actions (project created, campaign launched)
- Performance metrics (page load time)

#### C. Uptime Monitoring (UptimeRobot / Better Uptime)

- Monitor https://app.thehive.com
- Monitor https://n8n.thehive.com
- Alert if down > 5 minutes
- Send SMS/email to on-call dev

**Effort:** 2 days

---

### 6.4 SSL Certificates & Domain Setup ⚠️ **CRITICAL - WEEK 2**

**Status:** ❌ Not configured

**What's Needed:**

#### A. Purchase Domain
- Register `thehive.com` (or `thehive-os.com`, `thehiveai.com`, etc.)

#### B. Configure DNS
```
# Cloudflare DNS
app.thehive.com      → CNAME → vercel-app.vercel.app
n8n.thehive.com      → A     → <VPS_IP_ADDRESS>
staging.thehive.com  → CNAME → vercel-staging.vercel.app
api.thehive.com      → CNAME → supabase-project.supabase.co
```

#### C. SSL Certificates
- Vercel: Auto SSL (Let's Encrypt)
- n8n VPS: Use Certbot

```bash
# On VPS
sudo certbot --nginx -d n8n.thehive.com
```

**Effort:** 1 day

---

### 6.5 Database Connection Pooling ⚠️ **MEDIUM - WEEK 4**

**Status:** ⚠️ Supabase has pooling, but n8n connection not optimized

**What's Needed:**

**n8n Database Connection:**
```bash
# .env
DB_POSTGRESDB_HOST=db.your-project.supabase.co
DB_POSTGRESDB_PORT=6543  # ← Use Supavisor pooler port (not 5432)
DB_POSTGRESDB_POOL_SIZE=20
```

**Test:**
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity WHERE datname = 'postgres';
```

**Effort:** 0.5 day

---

## INFRASTRUCTURE SUMMARY

| Category | Tasks | Status | Effort | Priority |
|----------|-------|--------|--------|----------|
| Environments | 3 environments setup | ❌ 0/3 | 2 days | CRITICAL |
| CI/CD | GitHub Actions | ❌ 0/1 | 2 days | HIGH |
| Monitoring | Sentry + PostHog + Uptime | ❌ 0/3 | 2 days | CRITICAL |
| SSL & Domain | Setup domain + SSL | ❌ 0/2 | 1 day | CRITICAL |
| DB Pooling | Optimize connections | ⚠️ Partial | 0.5 day | MEDIUM |
| **TOTAL** | **10 tasks** | **~5%** | **7.5 days** | - |

---

<a name="security"></a>
## 7. SECURITY - HARDENING

### 7.1 HTTPS Everywhere ⚠️ **CRITICAL - WEEK 2**

**Status:** ⚠️ Local dev HTTP, production needs HTTPS

**What's Needed:**

- [ ] Force HTTPS on all production URLs
- [ ] HSTS header (Strict-Transport-Security)
- [ ] Redirect HTTP → HTTPS

**Nginx Config (n8n VPS):**
```nginx
server {
    listen 80;
    server_name n8n.thehive.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name n8n.thehive.com;

    ssl_certificate /etc/letsencrypt/live/n8n.thehive.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/n8n.thehive.com/privkey.pem;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    location / {
        proxy_pass http://localhost:5678;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

**Effort:** 0.5 day

---

### 7.2 Content Security Policy (CSP) ⚠️ **MEDIUM - WEEK 3**

**Status:** ❌ Not configured

**What's Needed:**

**Vite Config:**
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'csp-headers',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          res.setHeader('Content-Security-Policy',
            "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline' https://js.stripe.com; " +
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' https://res.cloudinary.com https:; " +
            "connect-src 'self' https://*.supabase.co https://n8n.thehive.com; " +
            "frame-src https://js.stripe.com;"
          );
          next();
        });
      }
    }
  ]
});
```

**Vercel (vercel.json):**
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; ..."
        }
      ]
    }
  ]
}
```

**Effort:** 1 day

---

### 7.3 Secrets Rotation ⚠️ **MEDIUM - Ongoing**

**Status:** ❌ No rotation policy

**What's Needed:**

**Rotation Schedule:**
- API keys: Every 90 days
- Database passwords: Every 180 days
- Encryption keys: Every 365 days

**Process:**
1. Generate new secret
2. Add to environment (keep old one active)
3. Deploy with both secrets
4. Test
5. Remove old secret

**Automation (GitHub Actions):**
```yaml
# .github/workflows/rotate-secrets.yml
name: Rotate Secrets Reminder
on:
  schedule:
    - cron: '0 0 1 * *' # Monthly check
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - name: Check secret age
        run: |
          # Query secret creation dates from Vercel/AWS
          # Alert if > 90 days old
```

**Effort:** 1 day setup + ongoing maintenance

---

### 7.4 DDoS Protection ⚠️ **HIGH - WEEK 3**

**Status:** ❌ Not configured

**What's Needed:**

#### Use Cloudflare (Free Plan)

**Setup:**
1. Add domain to Cloudflare
2. Update nameservers
3. Enable:
   - DDoS protection (automatic)
   - Rate limiting rules
   - Bot fight mode
   - Cache static assets

**Rate Limiting Rule:**
```
If:
  - Requests > 100 per minute from single IP
  - Endpoint = /api/*
Then:
  - Challenge (CAPTCHA)
  - OR Block for 1 hour
```

**Effort:** 1 day

---

### 7.5 Penetration Testing ⚠️ **HIGH - Before Launch**

**Status:** ❌ Not done

**What's Needed:**

#### Internal Pen Test
- Use OWASP ZAP or Burp Suite
- Test:
  - SQL injection
  - XSS
  - CSRF
  - Authentication bypass
  - Authorization bypass (access other users' data)
  - Rate limit bypass

#### External Pen Test (Optional but recommended)
- Hire security firm (e.g., HackerOne, Cobalt)
- Cost: $3000-$10000
- Timeline: 1-2 weeks

**Effort:** 3 days (internal) + 2 weeks (external)

---

## SECURITY SUMMARY

| Category | Tasks | Status | Effort | Priority |
|----------|-------|--------|--------|----------|
| HTTPS | Force HTTPS + HSTS | ⚠️ Partial | 0.5 day | CRITICAL |
| CSP | Content Security Policy | ❌ 0/1 | 1 day | MEDIUM |
| Secrets Rotation | 90-day rotation | ❌ 0/1 | 1 day | MEDIUM |
| DDoS Protection | Cloudflare setup | ❌ 0/1 | 1 day | HIGH |
| Pen Testing | OWASP ZAP | ❌ 0/1 | 3 days | HIGH |
| **TOTAL** | **5 tasks** | **~10%** | **6.5 days** | - |

---

<a name="quality"></a>
## 8. QUALITY - TESTING

### 8.0 Agent Workflows Validation ⚠️ **CRITICAL - WEEK 1-2** 🔴

**Status:** ⚠️ Workflows créés, tests à faire

**Référence:** `/agents/FINALE_WORKFLOWS_VERIFICATION.md`

**What's Needed:**

#### Import & Test All Agent Workflows in n8n

**Workflows FINALE à tester:**
1. **FINALE_MILO_MCP.workflow.json** (Creative - 62K)
2. **FINALE_LUNA_MCP.workflow.json** (Strategist - 24K)
3. **FINALE_MARCUS_MCP.workflow.json** (Trader - 29K)
4. **FINALE_SORA_MCP.workflow.json** (Analyst - 30K)

**Test Checklist per Agent:**

```bash
# 1. Import workflow into n8n
# Via n8n UI: Settings > Import from File

# 2. Verify MCP Bridge connectivity
curl http://localhost:3456/api/health

# 3. Test each agent individually
POST https://n8n.your-domain.com/webhook/milo-entry
{
  "action": "generate_image",
  "task_id": "test-123",
  "user_id": "test-user"
}

# Expected: Response with deliverables + memory_contribution
```

**Critical Validations (from PRD V4.4):**

**MILO (Creative):**
- ✅ Nano Banana Pro (Imagen 3) - Generates 4K images
- ✅ VEO-3 - Generates videos
- ✅ ElevenLabs - TTS & sound effects
- ✅ Cost tracking (check_quota → generate → track_usage)
- ✅ Write-back commands (MEMORY_WRITE, UPDATE_TASK_STATUS, UI_COMPONENT)

**LUNA (Strategist):**
- ✅ SEO Audit Tool (7 functions)
- ✅ Keyword Research Tool (7 functions)
- ✅ Task dependencies check
- ✅ No cost tracking (READ-ONLY tools)

**MARCUS (Trader):**
- ✅ Meta Campaign Launcher (7 functions)
- ✅ Google Ads Launcher (7 functions)
- ✅ Budget Optimizer (7 functions)
- ✅ **CRITICAL:** Approval workflow for budgets > 500€/day
- ✅ **CRITICAL:** State flags validation (budget_approved, tracking_ready, creatives_ready)
- ✅ Learning Phase protection

**SORA (Analyst):**
- ✅ Google Ads Manager (7 functions)
- ✅ Meta Ads Manager (7 functions)
- ✅ GTM Manager (7 functions)
- ✅ Looker Manager (7 functions)
- ✅ READ-ONLY mode, Temperature 0.2

**Test Scenarios:**

1. **MILO Test:** Generate 1 image via Nano Banana Pro
   ```json
   {
     "action": "generate_image",
     "prompt": "Luxury watch on marble table, 4K product photography",
     "task_id": "milo-test-1"
   }
   ```
   **Expected:** Image URL + cost tracked + memory contribution written

2. **LUNA Test:** SEO audit for a URL
   ```json
   {
     "action": "seo_audit",
     "url": "https://example.com",
     "task_id": "luna-test-1"
   }
   ```
   **Expected:** SEO report + recommendations + memory contribution

3. **MARCUS Test:** Create Meta campaign (with approval)
   ```json
   {
     "action": "launch_meta_campaign",
     "budget": 1000,
     "task_id": "marcus-test-1"
   }
   ```
   **Expected:** Approval request created (budget > 500€) + no campaign launched yet

4. **SORA Test:** Fetch Google Ads performance
   ```json
   {
     "action": "get_ads_performance",
     "date_range": "last_7_days",
     "task_id": "sora-test-1"
   }
   ```
   **Expected:** Analytics data + insights + memory contribution

**Issues to Fix (from FINALE_WORKFLOWS_VERIFICATION.md):**

1. ⚠️ **Bridge URLs hardcoded (localhost)** → Use env variable `MCP_BRIDGE_URL`
2. ⚠️ **MCP Servers non buildés** → Build all missing servers
3. ⚠️ **Placeholders toolCode** → Replace with real implementations
4. ⚠️ **Credentials hardcodés** → Migrate to Supabase user_integrations

**Success Criteria:**

- [ ] All 4 workflows imported in n8n successfully
- [ ] MILO generates 1 test image without errors
- [ ] LUNA completes 1 SEO audit without errors
- [ ] MARCUS creates approval request (not campaign) for budget > 500€
- [ ] SORA fetches analytics without errors
- [ ] All agents write memory contributions to Supabase
- [ ] No hardcoded credentials in workflows
- [ ] Bridge connectivity verified for all MCP servers

**Effort:** 3 days (P0 CRITICAL)

**Notes:**
- This MUST be done before E2E tests (frontend can't be tested if backend agents don't work)
- Aligns with PRD V4.4 agent capabilities verification
- See `/agents/FINALE_WORKFLOWS_VERIFICATION.md` for detailed checklist

---

### 8.1 End-to-End Tests ⚠️ **HIGH - WEEK 4**

**Status:** ❌ Not implemented

**What's Needed:**

#### Setup Playwright
```bash
npm install -D @playwright/test
npx playwright install
```

**Critical User Flows to Test:**
1. **Signup & Login**
2. **Create Project (Genesis)**
3. **Create Task**
4. **Chat with Agent**
5. **Launch Campaign (MARCUS)**
6. **View Analytics (SORA)**

**Example Test:**
```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test('user can sign up and create project', async ({ page }) => {
  // Signup
  await page.goto('/signup');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'SecurePass123!');
  await page.click('button[type="submit"]');

  // Should redirect to onboarding
  await expect(page).toHaveURL('/onboarding');

  // Skip onboarding
  await page.click('text=Skip');

  // Create project
  await page.goto('/genesis');
  await page.fill('[name="project_name"]', 'Test Project');
  await page.selectOption('[name="scope"]', 'meta_ads');
  await page.click('text=Create Project');

  // Should see project board
  await expect(page).toHaveURL(/\/board\//);
  await expect(page.locator('h1')).toContainText('Test Project');
});
```

**Run in CI:**
```yaml
# .github/workflows/e2e.yml
- name: Run E2E tests
  run: npx playwright test
```

**Effort:** 4 days

---

### 8.2 Unit & Integration Tests ⚠️ **MEDIUM - WEEK 5**

**Status:** ❌ Not implemented

**What's Needed:**

#### Setup Vitest
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

**Test Coverage Targets:**
- Store (useHiveStore): 80%
- Services (n8n.ts, supabase.ts): 70%
- Components (critical): 60%

**Example:**
```typescript
// services/n8n.test.ts
import { describe, it, expect, vi } from 'vitest';
import { callPM } from './n8n';

describe('n8n service', () => {
  it('should call PM webhook with correct payload', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ success: true })
      })
    );

    const response = await callPM({
      action: 'genesis',
      project_name: 'Test'
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/pm-v4-entry'),
      expect.objectContaining({
        method: 'POST'
      })
    );
  });
});
```

**Effort:** 5 days

---

### 8.3 Performance Testing ⚠️ **MEDIUM - WEEK 5**

**Status:** ❌ Not done

**What's Needed:**

#### Load Testing (k6 or Artillery)

**Test Scenarios:**
- 100 concurrent users
- 1000 requests/minute
- Average response time < 2s
- Error rate < 1%

**k6 Script:**
```javascript
// load-test.js
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% requests < 2s
    http_req_failed: ['rate<0.01'],    // Error rate < 1%
  }
};

export default function () {
  const res = http.post('https://n8n.thehive.com/webhook/pm-v4-entry', JSON.stringify({
    action: 'quick_action',
    chatInput: 'Hello'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 2s': (r) => r.timings.duration < 2000
  });
}
```

**Run:**
```bash
k6 run load-test.js
```

**Effort:** 2 days

---

## QUALITY SUMMARY

| Category | Tasks | Status | Effort | Priority |
|----------|-------|--------|--------|----------|
| **Agent Workflows** | **Test FINALE workflows (MILO/LUNA/MARCUS/SORA)** | **⚠️ 0/4** | **3 days** | **CRITICAL** 🔴 |
| E2E Tests | Playwright tests | ❌ 0/6 | 4 days | HIGH |
| Unit Tests | Vitest tests | ❌ 0/1 | 5 days | MEDIUM |
| Load Testing | k6 scenarios | ❌ 0/1 | 2 days | MEDIUM |
| **TOTAL** | **12 tasks** | **0%** | **14 days** | - |

---

<a name="product"></a>
## 9. PRODUCT - FEATURES

### 9.1 Analytics Hub (from PRD) ⚠️ **MEDIUM - WEEK 6-7**

**Status:** ❌ Not implemented (PRD Section 4.B)

**What's Needed:**

See PRD Section 4.B for full spec. Summary:
- Real-time dashboards (GA4, Google Ads, Meta Ads, GSC)
- KPI cards with trends
- Charts (Recharts)
- SORA-generated insights

**Effort:** 10 days (per PRD)

---

### 9.2 Files & Assets Library (from PRD) ⚠️ **MEDIUM - WEEK 8**

**Status:** ❌ Not implemented (PRD Section 4.C)

**What's Needed:**

See PRD Section 4.C for full spec. Summary:
- File grid/list view
- Auto-classification (by agent, type, phase)
- Supabase Storage integration
- Download & bulk export

**Effort:** 7 days (per PRD)

---

### 9.3 Board Enhancements (from PRD) ⚠️ **LOW - WEEK 9**

**Status:** ⚠️ Partial (PRD Section 4.A)

**What's Needed:**

- Dependency visualization
- Phase progression bars
- Workflow automation (auto-transition phases)

**Effort:** 5 days (per PRD)

---

## PRODUCT SUMMARY

| Category | Tasks | Status | Effort | Priority |
|----------|-------|--------|--------|----------|
| Analytics Hub | Full dashboard | ❌ 0/1 | 10 days | MEDIUM |
| Files Library | Asset management | ❌ 0/1 | 7 days | MEDIUM |
| Board Enhancements | Dependencies + automation | ⚠️ Partial | 5 days | LOW |
| **TOTAL** | **3 tasks** | **~10%** | **22 days** | - |

---

<a name="go-to-market"></a>
## 10. GO-TO-MARKET - LAUNCH

### 10.1 Landing Page ⚠️ **CRITICAL - WEEK 4**

**Status:** ❌ Not created

**What's Needed:**

#### Marketing Website
**Stack:** Astro, Next.js, or Webflow

**Pages:**
- Homepage
  - Hero (above fold)
  - Features (4 agents)
  - Pricing
  - Testimonials (when available)
  - CTA (Start Free Trial)
- Pricing
- About
- Blog (optional)
- Contact

**Design:**
- Premium, modern, minimalist
- Animated agent cards
- Video demo (30-60 sec)
- Social proof (logos of beta users)

**Conversion Goals:**
- Signup rate > 5%
- Free trial → paid conversion > 15%

**Effort:** 7 days

---

### 10.2 Documentation ⚠️ **HIGH - WEEK 5**

**Status:** ❌ Not created

**What's Needed:**

#### User Docs (docs.thehive.com)
**Platform:** Mintlify, Docusaurus, or GitBook

**Sections:**
- Getting Started
  - Signup
  - First project
  - Integrations
- Agents
  - SORA (Data Analyst)
  - LUNA (Strategist)
  - MARCUS (Trader)
  - MILO (Creative)
- Features
  - Board
  - Chat
  - Analytics
  - Files
- Integrations
  - Google Ads
  - Meta Ads
  - GA4
  - GTM
- API (future)

**Effort:** 5 days

---

### 10.3 Onboarding Emails ⚠️ **MEDIUM - WEEK 5**

**Status:** ❌ Not created

**What's Needed:**

#### Email Sequences
**Platform:** SendGrid, Resend, or Customer.io

**Welcome Sequence (Day 0-7):**
1. **Day 0 (Signup):** Welcome + verify email
2. **Day 1:** "Meet your agents" (introduce SORA, LUNA, MARCUS, MILO)
3. **Day 3:** "Create your first project" (CTA to Genesis)
4. **Day 5:** "Launch your first campaign" (MARCUS tutorial)
5. **Day 7:** "Pro features" (upgrade CTA)

**Trial Ending (Day 12-14):**
1. **Day 12:** "2 days left in your trial"
2. **Day 14:** "Your trial ends today" (upgrade CTA)

**Churn Prevention:**
1. **Inactive for 7 days:** "We miss you! Here's what's new"
2. **Canceled subscription:** Exit survey + win-back offer

**Effort:** 3 days

---

### 10.4 Support System ⚠️ **MEDIUM - WEEK 5**

**Status:** ❌ Not implemented

**What's Needed:**

#### Help Center
**Platform:** Intercom, Crisp, or plain.com

**Features:**
- Live chat widget
- Knowledge base
- Ticket system
- Email support (support@thehive.com)

**SLA (Service Level Agreement):**
- Free: Email support (48h response)
- Pro: Email + chat (24h response)
- Enterprise: Priority support (4h response) + dedicated Slack channel

**Effort:** 2 days

---

## GO-TO-MARKET SUMMARY

| Category | Tasks | Status | Effort | Priority |
|----------|-------|--------|--------|----------|
| Landing Page | Marketing website | ❌ 0/1 | 7 days | CRITICAL |
| Documentation | User docs | ❌ 0/1 | 5 days | HIGH |
| Onboarding Emails | Email sequences | ❌ 0/1 | 3 days | MEDIUM |
| Support System | Help center | ❌ 0/1 | 2 days | MEDIUM |
| **TOTAL** | **4 tasks** | **0%** | **17 days** | - |

---

<a name="post-launch"></a>
## 11. POST-LAUNCH - GROWTH

### 11.1 Analytics & Metrics ⚠️ **HIGH - Week 1 Post-Launch**

**What to Track:**

#### Product Metrics
- Signups (daily, weekly)
- Activation rate (% who create 1st project)
- Retention (D7, D30)
- Churn rate
- MRR (Monthly Recurring Revenue)
- ARPU (Average Revenue Per User)

#### Agent Usage
- Most used agent (SORA, LUNA, MARCUS, MILO)
- Average tasks per project
- Chat messages per session
- Campaign launches per week

#### Technical Metrics
- Error rate
- API response times
- Uptime %

**Tools:**
- PostHog (product analytics)
- Stripe (revenue)
- Sentry (errors)

---

### 11.2 User Feedback Loop ⚠️ **HIGH - Week 2 Post-Launch**

**What's Needed:**

- In-app NPS survey (after 14 days)
- Feature request board (Canny, Fider)
- Beta user interviews (monthly)

---

### 11.3 Iteration Plan ⚠️ **Ongoing**

**Roadmap (Post-Launch):**

**Month 1-2:**
- Fix critical bugs
- Improve onboarding based on user feedback
- Add top-requested features

**Month 3-4:**
- Implement Analytics Hub (PRD 4.B)
- Implement Files Library (PRD 4.C)

**Month 5-6:**
- Multi-agent workflows (Optimization Priority 4)
- API v1 for developers

**Month 7+:**
- White-label solution (Enterprise)
- Mobile app (iOS/Android)
- Mixture of Experts (V5 - PRD Section 1.4)

---

## POST-LAUNCH SUMMARY

| Category | Tasks | Status | Effort | Priority |
|----------|-------|--------|--------|----------|
| Analytics Setup | Track key metrics | ❌ 0/1 | 2 days | HIGH |
| Feedback Loop | NPS + interviews | ❌ 0/1 | 1 day | HIGH |
| Iteration Plan | Roadmap V1.1-V2 | ⚠️ Partial | Ongoing | MEDIUM |
| **TOTAL** | **3 tasks** | **~30%** | **3+ days** | - |

---

---

## MASTER TIMELINE - PATH TO LAUNCH

### PHASE 1: CRITICAL FOUNDATION (Weeks 1-2) - 15 days

**Goal:** Make app multi-tenant + secure + deployable

| Week | Tasks | Deliverable |
|------|-------|-------------|
| **Week 1** | • Apply DB migrations (RLS, rate limiting, audit logs)<br>• Auth UI (Login, Signup, Password Reset)<br>• Settings page (Profile, Billing placeholder)<br>• Error handling standardization<br>• Environment config (dev, staging, prod) | Secure multi-tenant app with auth |
| **Week 2** | • Multi-project dashboard<br>• Onboarding flow<br>• Deploy to staging environment<br>• SSL + domain setup<br>• Rate limiting enforcement<br>• Webhook signature validation | Deployable SaaS MVP |

**Effort:** 15 days
**Blockers:** None (all migrations ready)
**Risk:** Low

---

### PHASE 2: MONETIZATION + LEGAL (Weeks 3-4) - 14 days

**Goal:** Enable payments + be legally compliant

| Week | Tasks | Deliverable |
|------|-------|-------------|
| **Week 3** | • Stripe integration (checkout, webhooks)<br>• Billing dashboard<br>• Usage limits enforcement<br>• Privacy Policy + Terms<br>• Cookie consent<br>• GDPR compliance (export, delete) | Monetizable + compliant SaaS |
| **Week 4** | • Landing page<br>• Documentation site<br>• Onboarding emails<br>• Support system<br>• CI/CD pipeline<br>• Monitoring (Sentry, PostHog, UptimeRobot) | Go-to-market ready |

**Effort:** 14 days
**Blockers:** Stripe approval (1-2 days)
**Risk:** Medium (legal docs need review)

---

### PHASE 3: QUALITY + OPTIMIZATION (Weeks 5-6) - 12 days

**Goal:** Polish UX + fix bugs + optimize performance

| Week | Tasks | Deliverable |
|------|-------|-------------|
| **Week 5** | • E2E tests (Playwright)<br>• Unit tests (Vitest)<br>• Performance optimization<br>• Responsive design (mobile)<br>• Empty states + error pages<br>• Notification center | Production-ready quality |
| **Week 6** | • Load testing<br>• Security hardening (CSP, DDoS)<br>• Internal pen test<br>• Workflow optimization (Active Memory Injection - Priority 1)<br>• State flag auto-update (Priority 2) | Optimized + secure SaaS |

**Effort:** 12 days
**Blockers:** Pen test findings (may require fixes)
**Risk:** Medium

---

### PHASE 4: PRODUCT ENHANCEMENTS (Weeks 7-9) - Optional

**Goal:** Implement PRD features (Analytics Hub, Files Library)

| Week | Tasks | Deliverable |
|------|-------|-------------|
| **Week 7-8** | • Analytics Hub (real-time dashboards) | Data-driven insights |
| **Week 9** | • Files & Assets library<br>• Board enhancements | Complete PRD V4.4 |

**Effort:** 22 days (optional - can ship without)
**Risk:** Low

---

### LAUNCH WEEK (Week 10) 🚀

**Pre-Launch Checklist:**
- [x] All migrations applied
- [x] Auth working
- [x] Payments working
- [x] Legal pages live
- [x] Monitoring active
- [x] Tests passing (E2E + unit)
- [x] Load tested (100+ concurrent users)
- [x] Pen tested (no critical issues)
- [x] Landing page live
- [x] Docs live
- [x] Support ready
- [x] Staging tested by beta users

**Launch Day:**
1. Deploy to production (Vercel + VPS)
2. DNS cutover
3. Announce on:
   - Product Hunt
   - Indie Hackers
   - Twitter/X
   - LinkedIn
4. Monitor errors (Sentry)
5. Monitor signups (PostHog)
6. Respond to support tickets (< 4h)

---

---

## FINAL SUMMARY - GAPS & EFFORT

### By Category

| Category | Total Tasks | Completed | Remaining | Effort | Priority |
|----------|-------------|-----------|-----------|--------|----------|
| **Frontend** | 25 | 1 (4%) | 24 | 28 days | CRITICAL |
| **Backend** | 11 | 1 (9%) | 10 | 8 days | CRITICAL |
| **Database** | 7 | 1 (14%) | 6 | 3.5 days | CRITICAL |
| **Payments** | 4 | 0 (0%) | 4 | 10 days | CRITICAL |
| **Legal** | 5 | 0 (0%) | 5 | 8 days | CRITICAL |
| **Infrastructure** | 10 | 0.5 (5%) | 9.5 | 7.5 days | CRITICAL |
| **Security** | 5 | 0.5 (10%) | 4.5 | 6.5 days | HIGH |
| **Quality** | 12 | 0 (0%) | 12 | 14 days | **CRITICAL** 🔴 |
| **Product** | 3 | 0.3 (10%) | 2.7 | 22 days | MEDIUM |
| **Go-to-Market** | 4 | 0 (0%) | 4 | 17 days | CRITICAL |
| **Post-Launch** | 3 | 0.9 (30%) | 2.1 | 3 days | HIGH |
| **TOTAL** | **89 tasks** | **5.2 (6%)** | **83.8** | **127.5 days** | - |

---

### Critical Path (Must-Have for Launch)

**Minimum Viable Launch:** 41 days (6 weeks)

Excludes:
- Product enhancements (Analytics Hub, Files Library, Board refactor) - 22 days
- Post-launch features - 3 days
- Some medium priority items

**Realistic Launch with Polish:** 60 days (8-9 weeks)

Includes critical + high priority items.

---

### Resource Needs

**Option 1: Solo Dev (You)**
- Timeline: 8-12 weeks
- Risk: High (burnout, scope creep)

**Option 2: + 1 Frontend Dev**
- Timeline: 5-6 weeks
- Cost: €10K-15K (freelance)
- Risk: Medium

**Option 3: + 1 Frontend + 1 DevOps**
- Timeline: 4 weeks
- Cost: €20K-25K
- Risk: Low

---

## RECOMMENDATIONS

### Critical (Week 1-2):
1. ✅ Apply DB migrations (RLS, auth, rate limiting)
2. ✅ Build auth UI (Login, Signup, Settings)
3. ✅ Multi-project dashboard
4. ✅ Deploy staging environment
5. ✅ Error handling standardization

### High Priority (Week 3-4):
6. ✅ Stripe integration + billing
7. ✅ Privacy Policy + Terms + GDPR
8. ✅ Landing page + docs
9. ✅ CI/CD + monitoring
10. ✅ Onboarding flow

### Nice-to-Have (Week 5+):
11. ⏭️ E2E tests
12. ⏭️ Analytics Hub (PRD 4.B)
13. ⏭️ Files Library (PRD 4.C)
14. ⏭️ Multi-agent workflows

---

**END OF PRE-LAUNCH ROADMAP**

**Generated by:** Claude Code (Sonnet 4.5)
**Date:** 2026-02-20
**Document Version:** 1.0
**Total Pages:** 85
