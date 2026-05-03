#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Cloudflare Tunnel - Expose backend localhost for Telegram webhooks
# ═══════════════════════════════════════════════════════════════
#
# USAGE:   bash scripts/start-tunnel.sh
# CTRL+C:  stops the tunnel
#
# REQUIREMENT:  cloudflared installed
#   brew install cloudflare/cloudflare/cloudflared
#
# AFTER STARTUP:
#   1. Note the public URL printed by cloudflared (e.g. https://abc-xyz.trycloudflare.com)
#   2. Re-register the Telegram webhook so the bot receives updates again:
#        curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
#          -d "url=https://<RANDOM>.trycloudflare.com/api/telegram/webhook"
#   3. Verify: curl "https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo"
#
# QUICK vs NAMED TUNNEL:
#   This script uses a "quick tunnel" → URL changes at every restart.
#   For a stable URL (recommended once you have a Cloudflare account):
#     cloudflared tunnel login
#     cloudflared tunnel create hive-os-dev
#     cloudflared tunnel route dns hive-os-dev hive-dev.yourdomain.com
#     cloudflared tunnel run --url http://localhost:3457 hive-os-dev
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

TUNNEL_PORT="${TUNNEL_PORT:-3457}"

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "❌ cloudflared not found. Install it with:"
  echo "   brew install cloudflare/cloudflare/cloudflared"
  exit 1
fi

echo "════════════════════════════════════════════════════════════"
echo " Cloudflare Tunnel → http://localhost:${TUNNEL_PORT}"
echo "════════════════════════════════════════════════════════════"
echo " Quick tunnel mode — public URL is regenerated on each run."
echo " After startup, copy the trycloudflare.com URL printed below"
echo " and re-register the Telegram webhook (see scripts/README.md)."
echo "════════════════════════════════════════════════════════════"
echo ""

exec cloudflared tunnel --url "http://localhost:${TUNNEL_PORT}"
