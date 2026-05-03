#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Start every Hive OS dev service in its own Terminal.app window
# ═══════════════════════════════════════════════════════════════
#
# USAGE:   bash scripts/start-all-dev.sh
#
# Opens 5 Terminal.app windows running:
#   1. mcp-bridge   (npm run dev)
#   2. backend      (npm run dev)
#   3. cockpit      (frontend, npm run dev)
#   4. backoffice   (admin UI, npm run dev)
#   5. cloudflare tunnel (scripts/start-tunnel.sh)
#
# macOS only (uses osascript). Adjust the project root if you cloned elsewhere.
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

PROJECT_ROOT="${PROJECT_ROOT:-/Users/azzedinezazai/Documents/Agency-Killer-V4}"

if [ ! -d "$PROJECT_ROOT" ]; then
  echo "❌ PROJECT_ROOT not found: $PROJECT_ROOT"
  echo "   Set PROJECT_ROOT env var or edit this script."
  exit 1
fi

echo "Launching dev services from $PROJECT_ROOT ..."

osascript <<EOF
tell application "Terminal"
  activate
  do script "cd '$PROJECT_ROOT/mcp-bridge' && npm run dev"
  do script "cd '$PROJECT_ROOT/backend' && npm run dev"
  do script "cd '$PROJECT_ROOT/cockpit' && npm run dev"
  do script "cd '$PROJECT_ROOT/backoffice' && npm run dev"
  do script "cd '$PROJECT_ROOT' && bash scripts/start-tunnel.sh"
end tell
EOF

echo "✓ All 5 Terminal windows launched."
echo "  Watch the cloudflared window for the public URL, then update the Telegram webhook."
