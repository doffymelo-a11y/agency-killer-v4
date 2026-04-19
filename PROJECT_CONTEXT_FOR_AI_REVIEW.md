# The Hive OS - Complete Project Context for AI Review
**Date**: 2026-04-18
**Purpose**: Comprehensive context for external AI review and feedback
**Project**: Production-Ready AI-Powered Marketing Automation SaaS

---

## 📋 TABLE OF CONTENTS

1. [Project Overview](#project-overview)
2. [Business Context](#business-context)
3. [Technical Architecture](#technical-architecture)
4. [Current System Status](#current-system-status)
5. [Support System Challenge](#support-system-challenge)
6. [Proposed Architecture](#proposed-architecture)
7. [Technical Stack](#technical-stack)
8. [Security & Compliance](#security--compliance)
9. [Questions for Review](#questions-for-review)

---

## 🎯 PROJECT OVERVIEW

### What is The Hive OS?

**The Hive OS** is an **AI-Powered Marketing Automation Platform** that acts as a complete digital marketing agency run by AI agents. It's designed to replace expensive marketing agencies with autonomous AI agents specialized in different marketing domains.

**Tagline**: "Your Complete AI Marketing Agency"

### Core Value Proposition

Instead of hiring:
- SEO specialist ($3-5k/month)
- Ads manager ($4-6k/month)
- Content creator ($2-4k/month)
- Analytics expert ($3-5k/month)

**Total**: $12-20k/month for a full marketing team

**Users get**: 4 specialized AI agents for **$97-297/month**

### The 4 AI Agents

1. **Luna** (SEO & Content Strategist)
   - Color: Purple (#8B5CF6)
   - Expertise: SEO audits, keyword research, content strategy, CMS integration
   - MCP Servers: seo-audit, keyword-research, cms-connector

2. **Sora** (Analytics & Tracking Specialist)
   - Color: Cyan (#06B6D4)
   - Expertise: GA4 analytics, GTM setup, ad tracking (Meta, Google), data analysis
   - MCP Servers: google-ads, meta-ads, gtm, looker

3. **Marcus** (Ads & Campaigns Manager)
   - Color: Amber (#F59E0B)
   - Expertise: Campaign creation, budget optimization, A/B testing, ROI tracking
   - MCP Servers: google-ads-launcher, budget-optimizer, meta-ads-launcher

4. **Milo** (Creative & Media Producer)
   - Color: Rose (#EC4899)
   - Expertise: Image generation, video creation, audio production, brand assets
   - MCP Servers: elevenlabs, nano-banana-pro (images), veo3 (videos)

### How It Works

```
User creates a project (e.g., "Launch new product X")
          ↓
PM (Project Manager AI) analyzes and creates tasks
          ↓
Tasks auto-assigned to appropriate agents (Luna, Sora, Marcus, Milo)
          ↓
Agents execute via MCP tools (14 specialized servers)
          ↓
Deliverables stored in project memory
          ↓
User reviews and validates via chat interface
```

**Key Innovation**: Agents have **collective memory** (project_memory table). What Luna discovers about SEO, Sora can use for analytics strategy.

---

## 💼 BUSINESS CONTEXT

### Target Market

**Primary**: Solo entrepreneurs, small agencies (1-10 people), marketing consultants
**Secondary**: SMBs with limited marketing budget
**Tertiary**: Large companies testing AI-first workflows

### Current Stage

- **Development**: 95% complete
- **Beta Testing**: Not started
- **Users**: 0 (pre-launch)
- **Revenue**: $0 (not launched)

### Monetization Strategy

**Freemium Model**:
- **Free**: 10 tasks/month, basic features
- **Pro** ($97/month): Unlimited tasks, all agents, priority support
- **Agency** ($297/month): Multi-user, white-label, API access

### Competitive Advantage

| Competitor | Limitation | Hive OS Advantage |
|------------|-----------|-------------------|
| ChatGPT/Claude | No tool integration, manual work | 14 MCP servers with real integrations |
| Jasper AI | Content only | Full marketing stack (SEO + Ads + Content + Analytics) |
| HubSpot | Expensive ($800+/mo), no AI execution | 10x cheaper, fully autonomous |
| Traditional Agency | $12k+/month, slow | $97-297/month, instant |

---

## 🏗️ TECHNICAL ARCHITECTURE

### Stack Overview

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND                             │
│  React 19 + TypeScript 5.9 + Vite 7 + Tailwind 4       │
│  (Port 5173 - Cockpit)                                  │
└─────────────────────────────────────────────────────────┘
                          ↓ HTTP
┌─────────────────────────────────────────────────────────┐
│                  BACKEND API                             │
│  Express.js + TypeScript (Port 3457)                    │
│  - Auth (Supabase JWT)                                  │
│  - Rate limiting (30 req/min admins, 100 req/min users) │
│  - Agent orchestration                                   │
│  - Logging service (system_logs table)                  │
└─────────────────────────────────────────────────────────┘
         ↓                                      ↓
┌─────────────────────────┐    ┌──────────────────────────┐
│   MCP BRIDGE            │    │   SUPABASE               │
│   Express.js (3456)     │    │   PostgreSQL + Auth      │
│   - 14 MCP servers      │    │   + Realtime + Storage   │
│   - stdio connections   │    └──────────────────────────┘
└─────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│              14 MCP SERVERS (TypeScript)                 │
│                                                          │
│  SEO & Content:                                          │
│  - seo-audit-server (Lighthouse, meta tags, structured) │
│  - keyword-research-server (SEMrush-like analysis)      │
│  - cms-connector-server (WordPress, Webflow, Shopify)   │
│                                                          │
│  Analytics & Tracking:                                   │
│  - google-ads-server (Google Ads API read)              │
│  - meta-ads-server (Meta Marketing API read)            │
│  - gtm-server (GTM container management)                │
│  - looker-server (Data visualization)                   │
│                                                          │
│  Campaign Management:                                    │
│  - google-ads-launcher-server (Campaign creation)       │
│  - budget-optimizer-server (Budget allocation AI)       │
│  - meta-ads-launcher-server (Meta campaign creation)    │
│                                                          │
│  Creative Production:                                    │
│  - elevenlabs-server (Text-to-speech)                   │
│  - nano-banana-pro-server (Image generation)            │
│  - veo3-server (Video generation)                       │
│                                                          │
│  Future (not yet implemented):                           │
│  - web-intelligence-server (Planned - web scraping)     │
│  - social-media-server (Planned - LinkedIn, Twitter)    │
└─────────────────────────────────────────────────────────┘
```

### Database Schema (Key Tables)

```sql
-- Users & Auth (Supabase Auth + custom tables)
auth.users                      -- Supabase managed
user_roles                      -- role: 'user' | 'admin' | 'super_admin'
user_profiles                   -- Extended user info

-- Projects & Tasks
projects                        -- User projects (SEO campaign, product launch, etc.)
tasks                           -- Granular tasks assigned to agents
  - status: 'todo' | 'in_progress' | 'done' | 'blocked'
  - assignee: 'luna' | 'sora' | 'marcus' | 'milo' | 'pm'
  - priority: 'low' | 'medium' | 'high' | 'critical'

-- Agent Memory (CRITICAL - Collective Intelligence)
project_memory                  -- All agent actions, findings, recommendations
  - agent_id: 'luna' | 'sora' | 'marcus' | 'milo' | 'orchestrator' | 'pm'
  - action: 'task_completed' | 'insight_discovered' | 'recommendation_made'
  - summary: TEXT (what was done)
  - findings: JSONB (structured data discovered)
  - deliverables: JSONB (URLs, files, reports)
  - recommendations: JSONB (next steps for other agents)

-- Support System
support_tickets                 -- User bug reports, feature requests
  - status: 'open' | 'in_progress' | 'resolved' | 'closed'
  - priority: 'low' | 'medium' | 'high' | 'critical'
  - category: 'bug' | 'feature_request' | 'question' | 'billing' | 'integration' | 'other'
support_messages                -- Conversation thread (user ↔ admin)
  - sender_type: 'user' | 'admin'
  - attachments: JSONB (screenshots, logs)

-- Admin Monitoring (NEW - just implemented)
system_logs                     -- Centralized logging for monitoring
  - level: 'info' | 'warn' | 'error' | 'debug'
  - source: 'backend' | 'mcp-bridge' | 'agent-executor' | 'mcp-server'
  - agent_id: optional agent who triggered the log
  - action: 'agent_start' | 'agent_complete' | 'mcp_tool_call' | etc.
  - metadata: JSONB (duration_ms, credits_used, error_stack, etc.)

-- Business Metrics
api_usage_tracking              -- Track costs per agent/user
ticket_satisfaction             -- CSAT scores for support
```

### RLS (Row Level Security) Policies

**Philosophy**: Defense-in-depth. Even if backend is compromised, DB is protected.

```sql
-- Users see ONLY their data
CREATE POLICY "Users see own projects"
ON projects FOR SELECT
USING (user_id = auth.uid());

-- Admins see their organization's data
CREATE POLICY "Admins see org data"
ON projects FOR SELECT
USING (
  user_id IN (
    SELECT user_id FROM organization_members
    WHERE org_id = (
      SELECT org_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  )
);

-- Super admins bypass RLS (via service role key in backoffice)
-- No policy needed - uses SUPABASE_SERVICE_ROLE_KEY
```

### Authentication Flow

```
1. User signs up → Supabase Auth creates entry in auth.users
2. Trigger creates user_profile + assigns default role 'user'
3. User logs in → Supabase returns JWT
4. Frontend stores JWT in localStorage
5. Every API call: Authorization: Bearer <JWT>
6. Backend middleware validates JWT with Supabase
7. Backend checks user_roles for permissions
```

### MCP (Model Context Protocol)

**What is MCP?**
MCP is Anthropic's protocol for connecting AI models to external tools/data sources.

**How we use it:**
1. Each specialized server (SEO, Ads, Analytics) exposes tools via MCP
2. MCP Bridge acts as a gateway between backend and servers
3. Agents (Luna, Sora, etc.) can call tools via Claude's tool use

**Example Flow:**
```
User: "Luna, audit my website example.com"
          ↓
Backend sends to Claude with available tools:
{
  "tools": [
    {
      "name": "seo_audit_server__full_audit",
      "description": "Run complete SEO audit",
      "input_schema": { "url": "string" }
    }
  ]
}
          ↓
Claude responds with tool call:
{
  "tool_use": {
    "name": "seo_audit_server__full_audit",
    "input": { "url": "https://example.com" }
  }
}
          ↓
Backend calls MCP Bridge:
POST http://localhost:3456/api/mcp/call
{
  "server": "seo-audit",
  "tool": "full_audit",
  "arguments": { "url": "https://example.com" }
}
          ↓
MCP Bridge forwards to seo-audit-server via stdio
          ↓
Server runs Lighthouse, analyzes meta tags, checks structured data
          ↓
Returns results to Bridge → Backend → Claude
          ↓
Claude formats analysis for user:
"Your site scores 78/100 on SEO. Issues found:
- Missing meta description on 3 pages
- Slow load time (3.2s)
- No alt text on 12 images
Recommendations: ..."
```

---

## 📊 CURRENT SYSTEM STATUS

### What's Working ✅

**Core Platform**:
- ✅ 4 AI agents (Luna, Sora, Marcus, Milo) functional
- ✅ 11/14 MCP servers operational (3 inactive: elevenlabs, veo3, nano-banana-pro)
- ✅ Project & task management complete
- ✅ Collective memory system working
- ✅ Chat interface with agents (React UI)
- ✅ Auth & user management (Supabase)
- ✅ RLS policies enforced

**Admin Dashboard** (Just completed):
- ✅ System Health monitoring (backend, MCP bridge, Supabase, Claude API)
- ✅ Real-time MCP server status (dynamic, not hardcoded)
- ✅ Agent activity tracking (stats, timeline, cost charts)
- ✅ Business metrics (users, projects, tasks, CSAT)
- ✅ Error logs with realtime subscription
- ✅ Admin role verification (admin + super_admin)
- ✅ Rate limiting (30 req/min for admins)
- ✅ Security hardening:
  - Error sanitization (no stack traces in production)
  - Metadata sanitization in logs (redacts secrets)
  - SECURITY DEFINER functions with admin checks
  - Defense-in-depth architecture (7 layers)

**Support System** (Partially working):
- ✅ Users can create tickets
- ✅ Ticket categories (bug, feature, question, billing, etc.)
- ✅ Priority auto-calculation
- ✅ File attachments (via Cloudinary)
- ⚠️ UI confusion (users see admin controls - BUG)
- ❌ No admin interface to manage tickets
- ❌ No workflow for resolving tickets

### What's NOT Working ❌

1. **Support System UX** (CRITICAL ISSUE - focus of this document):
   - Users see admin controls (change status, assign, priority dropdowns)
   - No separation between user view and admin view
   - Founder has no interface to manage incoming tickets
   - No way to respond to tickets efficiently
   - No integration with Claude Code for bug fixing

2. **MCP Servers** (3 inactive):
   - elevenlabs-server (audio generation)
   - veo3-server (video generation)
   - nano-banana-pro-server (image generation)
   - **Cause**: API keys not configured or services down

3. **Production Deployment**:
   - Currently running localhost only
   - No CI/CD pipeline
   - No production environment variables
   - No monitoring/alerting (Sentry, Datadog)

4. **Business Features**:
   - No payment integration (Stripe)
   - No usage quotas enforcement (free vs pro)
   - No email notifications (ticket responses, task completions)
   - No onboarding flow for new users

---

## 🚨 SUPPORT SYSTEM CHALLENGE (PRIMARY FOCUS)

### The Problem

**Current State**:
When a user creates a support ticket, they see:
- ❌ Dropdown to change status (Open → In Progress → Resolved)
- ❌ Dropdown to change priority (Low → High → Critical)
- ❌ Button "Assign to me"
- ❌ Admin response templates

**Result**: User thinks they must resolve their own ticket. Completely broken UX.

**Founder's Perspective**:
When I (the founder) want to manage tickets:
- ❌ No centralized view of all tickets
- ❌ No interface to filter/sort/assign tickets
- ❌ No way to respond to users efficiently
- ❌ No integration with Claude Code to actually fix bugs

**Root Cause**:
The current SupportTicketDetailView.tsx doesn't differentiate between user and admin roles. It shows admin controls to everyone.

### Why This Matters

This is a **production blocker**. Without a working support system:
- Users can't report bugs effectively
- Founder can't manage and resolve issues
- No feedback loop for product improvement
- Can't scale to multiple users (no triage system)

**Business Impact**:
- Can't launch to beta testers (no way to handle feedback)
- Can't charge money (no professional support system)
- Can't build trust (users see broken UI)

---

## 🎯 PROPOSED ARCHITECTURE

### Key Insight: 3 Distinct Roles

After analysis, we identified that the original 2-tier model (user/admin) is insufficient.

**Correct Model: 3 Tiers**

#### Tier 1: USER (Customer)
- **Uses**: Main app (agents, projects, tasks)
- **Support**: Can create and track their own tickets
- **Cannot**: See other users' tickets, change ticket metadata, access admin dashboard

#### Tier 2: ADMIN (Premium Customer or Team Lead)
- **Uses**: Main app + Admin Dashboard
- **Support**: Can create and track their own tickets
- **Dashboard**: Monitoring of their own usage (agents, costs, performance)
- **Cannot**: See other organizations' data, manage global tickets, access backoffice

**Use Case**: An agency with 5 employees. The agency owner is "admin" and can monitor the team's usage, but stays in their organization's scope.

#### Tier 3: SUPER ADMIN (Founder / DevOps)
- **Uses**: Separate Backoffice application (external to main app)
- **Support**: Sees ALL tickets from ALL users globally
- **Capabilities**:
  - Triage and assign tickets
  - Respond to users via built-in interface
  - View system logs across all users
  - Access database (read-only exports)
  - Generate "Claude Code Context" for bug fixing
  - Manage deployments and security
  - View business metrics (MRR, churn, active users)

**Use Case**: Founder monitors all incoming tickets, identifies critical bugs, copies context to Claude Code terminal, fixes the bug, responds to user with solution.

### Proposed Architecture: 2 Separate Applications

#### A. Main Application (app.hive-os.com)
**Existing**: Cockpit (React frontend on port 5173)
**Users**: All tiers (user, admin, super_admin can log in)

**Features by Role**:

**User Features**:
- Dashboard (projects, agents, tasks)
- Chat with agents
- Support page (`/support`) - List of THEIR tickets
- Support detail (`/support/:id`) - Simplified view:
  - ✅ Read-only status badge (not editable dropdown)
  - ✅ Conversation thread
  - ✅ Reply box (add message)
  - ✅ Upload attachments
  - ❌ NO admin controls

**Admin Features** (in addition to user features):
- Admin Dashboard (`/admin`):
  - System Health tab (backend, MCP bridge, servers status)
  - Agent Activity tab (stats, timeline, costs)
  - Business Stats tab (their organization's metrics)
  - Users tab (if multi-user organization)
  - Tickets tab (tickets from their organization only)

#### B. Backoffice Application (backoffice.hive-os.com)
**NEW**: Separate React app (port 5174)
**Users**: super_admin ONLY (whitelist by email)

**Features**:
- **Login**: 2FA required (TOTP)
- **Dashboard**: Global overview (all users, all tickets, system health)
- **Tickets View**:
  - Table of ALL tickets from ALL users
  - Filters: status, priority, category, user, date range
  - Stats: urgent count, avg response time, SLA breaches
  - Click ticket → Detail view with super admin controls:
    - Edit status, priority, assignment
    - Internal notes (NOT visible to user)
    - Response templates
    - **"Generate Claude Code Context" button** (copies formatted context)
    - Reply to user (sends email + updates ticket)
- **Logs View**: System logs across all users (tail -f like interface)
- **Security View**: Detected vulnerabilities, security alerts
- **Users View**: All users in the platform (manage roles, suspend, etc.)
- **Database View**: Safe read-only interface for exports and queries
- **Metrics View**: Business metrics (MRR, active users, churn, usage by feature)

### Workflow: Bug Reported → Fixed → Resolved

```
1. USER (app.hive-os.com/support):
   - Creates ticket: "Luna agent not responding"
   - Uploads screenshot of error
   - Submits
          ↓
   INSERT INTO support_tickets
   Email sent to: super_admin@hive-os.com

2. SUPER ADMIN (backoffice.hive-os.com/tickets):
   - Sees new ticket in dashboard (real-time notification)
   - Opens ticket detail
   - Clicks "Generate Claude Code Context"
          ↓
   Context copied to clipboard:
   ```
   # Bug Report - Ticket TK-6093
   User: doffymelo@gmail.com
   Category: Bug
   Priority: Critical

   Description:
   Luna agent not responding when asked to audit website.

   Screenshot: [URL]

   User's last question: "Luna, analyze example.com"

   System logs:
   [2026-04-18 19:25:05] [mcp-bridge] seo-audit
   ERROR: Timeout after 30s

   Expected: Claude Code to diagnose and fix
   ```

3. SUPER ADMIN opens terminal:
   ```bash
   $ claude

   You: [Pastes context from backoffice]

   Claude Code:
   - Analyzes the error
   - Checks seo-audit-server code
   - Identifies issue: Lighthouse timeout too short
   - Fixes: Increases timeout from 30s to 60s
   - Tests locally
   - Commits + Pushes fix
   - Provides response for user
   ```

4. SUPER ADMIN (backoffice.hive-os.com/tickets/TK-6093):
   - Pastes Claude Code's response
   - Clicks "Send & Resolve"
          ↓
   UPDATE support_tickets SET status = 'resolved'
   INSERT INTO support_messages (message = "...")
   Email sent to: doffymelo@gmail.com

5. USER receives email:
   "Your ticket TK-6093 has been resolved.
   The Luna timeout issue has been fixed. Please try again."
          ↓
   User tests, confirms working
   Clicks "Confirm Resolved" in app
          ↓
   UPDATE support_tickets SET status = 'closed'
```

### Security Model

**Main App (app.hive-os.com)**:
- Uses `SUPABASE_ANON_KEY` (limited permissions)
- RLS policies enforce data isolation
- Users can ONLY see their own data
- Admins can ONLY see their organization's data

**Backoffice (backoffice.hive-os.com)**:
- Uses `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS)
- 2FA authentication required
- Email whitelist (`super_admin_whitelist` table)
- Every action logged (`super_admin_access_logs` table)
- IP-based rate limiting
- Separate domain (isolation from production)

### Database Changes Required

```sql
-- Super admin tables (NEW)
CREATE TABLE super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  email TEXT NOT NULL UNIQUE,
  totp_secret TEXT, -- For 2FA
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE super_admin_whitelist (
  email TEXT PRIMARY KEY,
  added_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO super_admin_whitelist (email) VALUES
('doffymelo@gmail.com'); -- Founder

CREATE TABLE super_admin_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  super_admin_id UUID REFERENCES super_admins(id),
  action TEXT NOT NULL, -- 'login', 'view_ticket', 'update_ticket', etc.
  resource_type TEXT, -- 'ticket', 'user', 'logs'
  resource_id TEXT,
  ip INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support tickets - Add assigned_to (if not exists)
ALTER TABLE support_tickets
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES super_admins(id);

-- Internal notes (admin-only, not visible to users)
CREATE TABLE support_internal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
  super_admin_id UUID REFERENCES super_admins(id),
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🛠️ TECHNICAL STACK

### Frontend
- **Framework**: React 19.0.0
- **Build Tool**: Vite 7.0.2
- **Language**: TypeScript 5.9.2
- **Styling**: Tailwind CSS 4.0.13
- **UI Components**: Custom (no UI library like MUI or Shadcn)
- **Icons**: Lucide React
- **Charts**: Recharts (for admin dashboard)
- **State**: Zustand 5.0.2
- **HTTP**: Fetch API (native)

### Backend
- **Runtime**: Node.js 22.12.0
- **Framework**: Express.js
- **Language**: TypeScript 5.9.2
- **API Style**: REST (no GraphQL)

### Database
- **Primary**: Supabase (PostgreSQL 15)
- **Auth**: Supabase Auth (JWT-based)
- **Realtime**: Supabase Realtime (postgres_changes)
- **Storage**: Cloudinary (images, files)
- **Security**: Row Level Security (RLS) policies

### AI & MCP
- **LLM**: Claude Opus 4.5 (Anthropic API)
- **Protocol**: Model Context Protocol (MCP)
- **MCP Servers**: 14 custom TypeScript servers
- **MCP Bridge**: Express.js gateway (port 3456)

### DevOps (Current - Localhost)
- **Development**: localhost (React on 5173, Backend on 3457, MCP Bridge on 3456)
- **Version Control**: Git + GitHub
- **Deployment**: Not yet configured
- **Monitoring**: Console logs only (no Sentry/Datadog yet)
- **CI/CD**: None (manual testing)

### DevOps (Planned - Production)
- **Hosting**: Vercel (frontend), Railway or Fly.io (backend)
- **Database**: Supabase Cloud (production tier)
- **Monitoring**: Sentry (errors), Datadog (metrics)
- **CI/CD**: GitHub Actions
- **Domains**:
  - app.hive-os.com (main application)
  - backoffice.hive-os.com (super admin backoffice)
  - api.hive-os.com (backend API)

---

## 🔐 SECURITY & COMPLIANCE

### Current Security Measures

**Authentication**:
- ✅ Supabase Auth with JWT
- ✅ Password requirements enforced
- ✅ Email verification required
- ❌ No 2FA yet (planned for super admins)

**Authorization**:
- ✅ RLS policies on all tables
- ✅ Role-based access (user_roles table)
- ✅ Admin middleware checks on protected routes
- ✅ Service role key NEVER exposed to frontend

**Data Protection**:
- ✅ Secrets in .env files (not in code)
- ✅ API keys encrypted at rest (Supabase)
- ✅ HTTPS enforced (Supabase)
- ✅ CORS configured (whitelist domains)

**Logging & Monitoring**:
- ✅ System logs table (centralized logging)
- ✅ Sensitive metadata sanitized (passwords, tokens redacted)
- ✅ Error responses sanitized (no stack traces in production)
- ✅ Admin access logs (who did what when)

**Recent Security Audit** (2026-04-18):
- Identified 8 issues (2 critical, 2 high, 4 medium/low)
- **All critical issues fixed**:
  1. ✅ Error disclosure prevented
  2. ✅ Metadata sanitization implemented
  3. ✅ Admin rate limiting added (30/min)
  4. ✅ SECURITY DEFINER functions hardened
  5. ✅ Health endpoint info disclosure reduced

**Remaining Items** (Low Priority):
- ⚠️ Input validation with Zod (currently basic)
- ⚠️ CSRF protection (future, for mutations)
- ⚠️ Rate limiting for public endpoints
- ⚠️ SQL injection audit (using parameterized queries, but not formally audited)

### Compliance Considerations

**GDPR** (EU users):
- ⚠️ Privacy policy: Not yet written
- ⚠️ Cookie consent: Not yet implemented
- ✅ User data export: Possible via Supabase
- ✅ User data deletion: CASCADE deletes configured
- ⚠️ Data processing agreements: Not yet prepared

**SOC 2** (Enterprise customers):
- ❌ Not yet pursued (requires dedicated effort)
- Planned for Series A fundraising

**PCI DSS** (Payment cards):
- ✅ Using Stripe (PCI compliant)
- ✅ No credit card data stored in our DB

---

## ❓ QUESTIONS FOR REVIEW

### 1. Architecture & Scalability

**Q1.1**: Is the proposed 3-tier architecture (user/admin/super_admin) the right approach for a SaaS product?

**Q1.2**: Should the Backoffice be a completely separate React application, or could it be a protected route within the main app with stricter guards?

**Q1.3**: Is using Supabase SERVICE_ROLE_KEY in the backoffice frontend safe, or should we proxy all backoffice operations through a separate backend API?

**Q1.4**: The current architecture uses a single PostgreSQL database for all tenants. Is this sufficient, or should we consider a multi-database approach for larger clients?

### 2. Support System Workflow

**Q2.1**: The proposed workflow relies on the founder manually copying context to Claude Code in terminal. Is there a better way to automate this?

**Q2.2**: Should we implement an AI-powered ticket triage system (auto-categorize, auto-prioritize, suggest solutions)?

**Q2.3**: For scaling, should we plan for multiple super admins (support team), or is one founder sufficient for MVP?

**Q2.4**: Should users be able to re-open resolved tickets, or must they create new tickets?

### 3. Security & Compliance

**Q3.1**: The backoffice uses SERVICE_ROLE_KEY in the frontend. What additional security measures should we implement to protect this?

**Q3.2**: For GDPR compliance, what's the minimum viable privacy policy for launch?

**Q3.3**: Should we implement end-to-end encryption for support ticket attachments (screenshots, logs may contain sensitive data)?

**Q3.4**: Is the current audit logging (`super_admin_access_logs`) sufficient, or should we track more granular actions?

### 4. User Experience

**Q4.1**: The main app mixes "using the product" (agents, projects) with "getting support" (tickets). Should support be a completely separate subdomain (support.hive-os.com)?

**Q4.2**: Should we implement a knowledge base / help center to reduce ticket volume (self-service)?

**Q4.3**: For the simplified user ticket view, what actions should users be able to take? Currently proposed:
   - Reply to ticket
   - Upload attachments
   - Mark as resolved (if admin already marked it resolved)

   Should they also be able to:
   - Close ticket (never want to reopen)?
   - Rate the support response (CSAT)?
   - Escalate (mark as urgent)?

**Q4.4**: Should admins (tier 2) see a "Tickets" tab in their dashboard for their organization's tickets? Or is support only centralized at super_admin level?

### 5. Technical Implementation

**Q5.1**: The backoffice will be on a separate port (5174) in dev. For production, should it be:
   - Subdomain: backoffice.hive-os.com
   - Separate domain: hive-backoffice.com
   - Protected route: app.hive-os.com/backoffice (with strict auth)

**Q5.2**: Should the backoffice share code with the main app (monorepo with shared components), or be completely independent?

**Q5.3**: For the "Generate Claude Code Context" feature, should we:
   - Just copy to clipboard (manual paste into terminal)
   - Auto-send to a Claude Code API (if available)
   - Create a webhook to trigger Claude Code remotely

**Q5.4**: Should we implement real-time notifications in the backoffice (Supabase Realtime subscription for new tickets)?

### 6. Business & Product

**Q6.1**: Is building a custom backoffice worth the effort, or should we use an existing tool like Zendesk, Intercom, or Helpscout for support?

**Q6.2**: The current design assumes the founder fixes all bugs personally. How should we handle:
   - Feature requests (vs bugs)?
   - Questions (vs bugs)?
   - Billing issues (vs technical issues)?

**Q6.3**: Should we implement SLA (Service Level Agreement) tracking? E.g., "Critical bugs responded within 4 hours, resolved within 24 hours"?

**Q6.4**: The support system is designed for B2C (individual users). If we pivot to B2B (agencies with teams), should each organization have its own support portal?

### 7. AI & Automation

**Q7.1**: Should we use Claude to auto-generate responses to common tickets (e.g., "How do I reset my password?")?

**Q7.2**: Could we implement an AI agent (separate from Luna/Sora/Marcus/Milo) dedicated to support, trained on our codebase, that attempts to resolve tickets automatically before escalating to super_admin?

**Q7.3**: For bug diagnosis, should we automatically attach:
   - Recent system_logs for that user
   - Recent project_memory entries
   - Browser console errors (if we implement frontend error tracking)

**Q7.4**: Should the "Claude Code Context" generation be smarter? E.g., automatically identify:
   - Related code files (based on error stack trace)
   - Recent commits that might have introduced the bug
   - Similar resolved tickets (duplicate detection)

### 8. Missing Pieces

**Q8.1**: We don't have email notifications yet. Should ticket responses:
   - Send email to user immediately?
   - Batch into daily digest?
   - Only notify if user has email notifications enabled?

**Q8.2**: Should we implement in-app notifications (bell icon in topbar) for ticket updates?

**Q8.3**: The current support system has no concept of "canned responses" or "macros" for common replies. Should we add this?

**Q8.4**: Should we track support metrics?
   - First response time
   - Resolution time
   - CSAT (Customer Satisfaction Score)
   - Ticket volume trends

---

## 📝 SUMMARY FOR AI REVIEWER

**What we're building**:
A production-ready AI marketing automation SaaS with 4 specialized AI agents (Luna, Sora, Marcus, Milo) that replace traditional marketing agencies at 1/10th the cost.

**Current state**:
95% complete, but the support system UX is broken. Users see admin controls, and the founder has no interface to manage tickets.

**Proposed solution**:
- Separate the UI into user view (simplified) and super_admin view (backoffice app)
- Build a new backoffice application for the founder to manage all tickets globally
- Implement a workflow where founder can generate context and paste into Claude Code for bug fixes
- Add proper role separation: user → admin → super_admin

**What we need from you**:
1. **Architecture validation**: Is the 3-tier model with separate backoffice app the right approach?
2. **Security review**: Are we exposing too much risk by using SERVICE_ROLE_KEY in backoffice frontend?
3. **UX feedback**: Is the simplified user ticket view sufficient, or are we removing too much control?
4. **Scalability concerns**: Will this architecture scale to 1000+ users with 100+ tickets/day?
5. **Alternative approaches**: Are we overengineering? Is there a simpler way to achieve the same goal?
6. **Best practices**: What are we missing from a production support system perspective?
7. **Automation opportunities**: Where can we use AI to reduce manual work in the support workflow?
8. **Business considerations**: Should we use an off-the-shelf solution (Zendesk, Intercom) instead of building custom?

**Key constraints**:
- Solo founder (no team yet)
- Pre-revenue (can't afford expensive tools like Intercom Pro)
- Need to launch to beta testers ASAP (support system is blocking launch)
- Must maintain long-term vision (no quick hacks, no "bricolages")

**Please provide**:
- Critical feedback on the architecture
- Suggestions for improvement
- Risks we haven't considered
- Simpler alternatives if we're overcomplicating
- Prioritization advice (what to build first)

Thank you for reviewing! 🙏
