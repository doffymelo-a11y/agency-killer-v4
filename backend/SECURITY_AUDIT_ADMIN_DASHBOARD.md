# Security Audit - Admin Monitoring Dashboard
**Date**: 2026-04-18
**Auditor**: Claude Opus 4.5
**Scope**: Admin Dashboard (Sprints 2-5)

---

## 🔴 CRITICAL ISSUES

### 1. Information Disclosure in Error Responses
**File**: `backend/src/routes/admin.routes.ts`
**Lines**: 77-85, 168, 204, 247, 283
**Severity**: HIGH

**Problem**: Error details are exposed in API responses, potentially leaking:
- Stack traces
- File paths
- Database errors
- Internal configuration

**Current Code**:
```typescript
error: {
  message: 'Authorization error',
  code: 'ADMIN_AUTH_ERROR',
  details: error.message, // ❌ LEAKS INTERNAL ERRORS
}
```

**Impact**:
- Attackers can fingerprint the system
- Discover internal paths and structure
- Exploit specific vulnerabilities in dependencies

**Fix**: Remove `details` field in production, log errors server-side only.

---

### 2. Sensitive Data in System Logs
**File**: `supabase/migrations/028_system_logs.sql`
**Lines**: 8-19
**Severity**: MEDIUM

**Problem**: `metadata JSONB` can contain sensitive data:
- API keys
- Passwords
- Tokens
- PII (emails, names)
- Stack traces with secrets

**Current**: No sanitization before log insertion

**Impact**: If logs are compromised, all secrets are exposed.

**Fix**: Sanitize metadata before logging, redact sensitive fields.

---

## 🟡 HIGH PRIORITY ISSUES

### 3. Missing Rate Limiting on Admin Endpoints
**File**: `backend/src/routes/admin.routes.ts`
**Lines**: All endpoints
**Severity**: MEDIUM

**Problem**: No rate limiting specific to admin endpoints.
- `/api/admin/logs/recent` can be spammed
- `/api/admin/stats/*` can be abused for DoS

**Impact**:
- Resource exhaustion
- Database overload
- Increased costs

**Fix**: Add admin-specific rate limiting (stricter than regular API).

---

### 4. SECURITY DEFINER Functions Without Auth Check
**File**: `supabase/migrations/028_system_logs.sql`
**Lines**: 76, 107, 116, 157
**Severity**: MEDIUM

**Problem**: RPC functions use `SECURITY DEFINER` but don't check if caller is admin.
```sql
$$ LANGUAGE plpgsql SECURITY DEFINER; -- ❌ NO AUTH CHECK IN FUNCTION
```

**Current Protection**:
- ✅ RLS policies on system_logs prevent SELECT
- ✅ Backend middleware checks admin role
- ⚠️ BUT if RPC is called directly via Supabase client, no check

**Impact**: If an attacker bypasses backend and calls RPC directly, they could access logs.

**Fix**: Add admin role check inside SECURITY DEFINER functions.

---

### 5. Health Endpoint Information Disclosure
**File**: `backend/src/routes/admin.routes.ts`
**Lines**: 93-143
**Severity**: LOW

**Problem**: `/api/admin/health` exposes:
- Exact server uptime
- Service configuration status
- Response times

**Impact**: Helps attackers:
- Plan attacks during high load
- Identify misconfigured services
- Time attacks after deploys

**Fix**: Limit information to generic "healthy/unhealthy" status.

---

## 🟢 LOW PRIORITY / BEST PRACTICES

### 6. No Input Validation on Query Parameters
**File**: `backend/src/routes/admin.routes.ts`
**Lines**: 154, 190, 226, 268
**Severity**: LOW

**Problem**: Query parameters are not validated:
```typescript
const limit = parseInt(req.query.limit as string) || 50; // ❌ NO VALIDATION
```

**Impact**:
- Could pass NaN, negative numbers, or huge limits
- Could cause performance issues

**Fix**: Add Zod schema validation for all query params.

---

### 7. Console Logs in Production
**File**: `backend/src/routes/admin.routes.ts`
**Lines**: 162, 198, 239, 275
**Severity**: LOW

**Problem**: `console.error()` logs sensitive errors to stdout.

**Impact**: Logs may be collected by external services and expose data.

**Fix**: Use structured logger (Winston) with redaction.

---

### 8. No CSRF Protection on State-Changing Operations
**File**: All backend routes
**Severity**: LOW (future concern)

**Problem**: No CSRF tokens on POST/PUT/DELETE operations.

**Current**: Only GET operations in admin dashboard (safe).

**Future Risk**: If we add POST/PUT/DELETE admin endpoints, CSRF attacks possible.

**Fix**: Add CSRF middleware when adding mutations.

---

## ✅ SECURITY FEATURES ALREADY IMPLEMENTED

1. ✅ **RLS Policies**: system_logs has proper RLS (admin-only read)
2. ✅ **Auth Middleware**: All admin routes require authentication
3. ✅ **Role Checking**: `requireAdmin` middleware verifies admin role
4. ✅ **Supabase Service Role**: Backend uses service role, not anon key
5. ✅ **HTTPS**: Supabase endpoints use HTTPS
6. ✅ **React XSS Protection**: React escapes by default, no dangerouslySetInnerHTML
7. ✅ **Input Constraints**: SQL CHECK constraints on system_logs enum fields
8. ✅ **Realtime Subscription Filter**: Only level='error' subscribed, not all logs

---

## 📋 REMEDIATION CHECKLIST

### Immediate (Critical)
- [ ] Remove error.message from all API responses in production
- [ ] Add metadata sanitization in logging service
- [ ] Add admin role check inside SECURITY DEFINER functions

### High Priority
- [ ] Implement admin-specific rate limiting
- [ ] Reduce information in /health endpoint
- [ ] Add structured logger with redaction

### Medium Priority
- [ ] Add Zod validation for all query parameters
- [ ] Add monitoring/alerting for unusual admin activity
- [ ] Add audit log for admin actions (who accessed what when)

### Low Priority / Future
- [ ] Add CSRF protection (when adding mutations)
- [ ] Add IP whitelist for admin access
- [ ] Add MFA requirement for admin accounts

---

## 🎯 SECURITY BEST PRACTICES FOR LONG-TERM

1. **Principle of Least Privilege**: Only expose what's necessary
2. **Defense in Depth**: Multiple layers (RLS + middleware + validation)
3. **Fail Securely**: Default deny, explicit allow
4. **Audit Everything**: Log all admin actions with timestamps
5. **Regular Updates**: Keep dependencies updated
6. **Penetration Testing**: Regular security audits
7. **Incident Response Plan**: Document how to respond to breaches

---

## 📊 RISK MATRIX

| Issue | Likelihood | Impact | Priority |
|-------|-----------|--------|----------|
| Error disclosure | High | High | CRITICAL |
| Sensitive data in logs | Medium | High | CRITICAL |
| No rate limiting | Medium | Medium | HIGH |
| SECURITY DEFINER bypass | Low | High | HIGH |
| Health info disclosure | Medium | Low | MEDIUM |
| No input validation | Low | Low | LOW |

---

**Conclusion**: The admin dashboard has solid foundational security (RLS, auth, role checks), but needs hardening in error handling, rate limiting, and sensitive data management before production use with real customer data.
