#!/bin/bash

# Test Luna Agent - Phase 2.3
# Simple curl test to verify orchestrator → agent-executor → Luna agent

echo "🧪 Testing Luna Agent..."
echo ""

# Test payload
PAYLOAD='{
  "project_id": "test-project-001",
  "session_id": "test-session-' $(date +%s) '",
  "chatInput": "Analyse SEO de google.com et donne-moi des recommandations",
  "activeAgentId": "luna",
  "chat_mode": "TASK",
  "action": "AGENT_CHAT"
}'

echo "📤 Sending request to /api/chat..."
echo "Request: $PAYLOAD"
echo ""

# Make request (will fail if auth middleware is enabled without proper token)
curl -X POST http://localhost:3457/api/chat \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  -v

echo ""
echo "✅ Test completed"
