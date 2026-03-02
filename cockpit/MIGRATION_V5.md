# Migration Guide - Frontend V4 → V5

## Overview

This document guides the migration from n8n webhooks (V4) to the TypeScript backend (V5).

## What Changed

### V4 Architecture (n8n)
```
Frontend → n8n PM Webhook → n8n Workflows (JSON) → Agents
```

### V5 Architecture (TypeScript)
```
Frontend → TypeScript Backend API → Agent Executor → Agents
```

## Migration Steps

### Phase 1: Dual Service Support (Current)

Both services are available:
- **n8n.ts** (legacy): PM webhook URL
- **api.ts** (new): TypeScript backend `/api/chat`

The frontend can use either service during migration.

### Phase 2: Switch to TypeScript Backend

Update your chat component to use the new API service:

**Before (n8n.ts):**
```typescript
import { sendMessageToOrchestrator, parseOrchestratorResponse } from '@/services/n8n';

const response = await sendMessageToOrchestrator(
  message,
  sessionId,
  projectMetadata,
  projectName,
  imageBase64,
  activeAgentId,
  sharedContext,
  taskContext,
  chatMode
);

const parsed = parseOrchestratorResponse(response);
```

**After (api.ts):**
```typescript
import { sendChatMessage, parseChatResponse } from '@/services/api';

const response = await sendChatMessage(
  message,
  sessionId,
  projectId,
  activeAgentId,
  chatMode,
  imageBase64
);

const parsed = parseChatResponse(response);
```

### Key Differences

| Aspect | n8n.ts | api.ts |
|--------|--------|--------|
| **URL** | PM_WEBHOOK_URL | VITE_BACKEND_API_URL/api/chat |
| **Payload** | PM action-based routing | Direct chat request |
| **Auth** | None | Supabase Auth (coming) |
| **Response** | N8NResponse (flexible) | ChatResponse (typed) |
| **Agents** | n8n workflows | TypeScript functions |

### Environment Variables

Add to `.env`:
```bash
VITE_BACKEND_API_URL=http://localhost:3457
VITE_DEBUG_API=true  # Enable debug logging in dev
```

### Response Format

**V4 (n8n):**
```json
{
  "chat_message": "...",
  "agent_used": "luna",
  "ui_components": [...],
  "write_back": [...]
}
```

**V5 (TypeScript):**
```json
{
  "success": true,
  "agent": "luna",
  "message": "...",
  "ui_components": [...],
  "write_back_commands": [...],
  "memory_contribution": {...},
  "session_id": "..."
}
```

The `parseChatResponse()` function normalizes these for compatibility.

### Health Check

Test backend connection:
```typescript
import { checkBackendHealth, getBackendUrl } from '@/services/api';

const isHealthy = await checkBackendHealth();
console.log('Backend URL:', getBackendUrl());
console.log('Backend healthy:', isHealthy);
```

### Rollback Plan

If issues occur, simply switch back to `n8n.ts`:
1. Revert imports from `api.ts` to `n8n.ts`
2. Restart frontend dev server
3. n8n webhooks continue to work

## Testing

### 1. Start Backend
```bash
cd backend
npm run dev
```

Backend should be running on http://localhost:3457

### 2. Test Health Endpoint
```bash
curl http://localhost:3457/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-03-01T...",
  "services": {
    "supabase": "✓",
    "claude_api": "✓",
    "mcp_bridge": "✓"
  }
}
```

### 3. Test Chat Endpoint
```bash
curl -X POST http://localhost:3457/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "test-project",
    "session_id": "test-session",
    "chatInput": "Bonjour Luna, peux-tu analyser google.com?",
    "activeAgentId": "luna",
    "chat_mode": "CHAT",
    "action": "AGENT_CHAT"
  }'
```

Expected: JSON response with message from Luna agent.

## Next Steps

Once Phase 2.4 is complete:
- Phase 2.5: End-to-end tests with real Claude API
- Phase 2.6: Cut over completely (disable n8n)
- Phase 3.0: Frontend cleanup (remove n8n.ts)

## Troubleshooting

### "Network Error" or "ECONNABORTED"
- Check backend is running: `npm run dev` in `/backend`
- Verify `VITE_BACKEND_API_URL` in `.env`
- Check backend logs for errors

### "404 Not Found"
- Backend may not be started
- Check endpoint path matches: `/api/chat`

### "401/403 Auth Error"
- Auth middleware enabled but no token provided
- For now, auth middleware should be commented out in `chat.routes.ts`

### TypeScript Errors
- Run `npm run build` in `/backend` to check for compilation errors
- Verify all imports are correct

## Status

- ✅ Phase 2.1: API Gateway created
- ✅ Phase 2.2: Orchestrator implemented
- ✅ Phase 2.3: All 4 agents migrated
- ✅ Phase 2.4: Frontend API service created
- 🔄 Phase 2.5: End-to-end testing (in progress)
- ⏳ Phase 2.6: n8n cutover
