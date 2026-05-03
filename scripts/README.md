# scripts/

Dev-environment helpers for The Hive OS V4/V5.

| Script | What it does |
|--------|--------------|
| `start-tunnel.sh`  | Starts a Cloudflare quick tunnel exposing `localhost:3457` (the backend) so Telegram webhooks reach your laptop. |
| `start-all-dev.sh` | Opens 5 Terminal.app windows running mcp-bridge, backend, cockpit, backoffice, and the tunnel — one command to spin the whole stack. |

---

## 1. One-time setup

### Install cloudflared

```bash
brew install cloudflare/cloudflare/cloudflared
cloudflared --version
```

### Make scripts executable

```bash
chmod +x scripts/start-tunnel.sh scripts/start-all-dev.sh
```

---

## 2. Day-to-day use

### Start everything (recommended)

```bash
bash scripts/start-all-dev.sh
```

→ Five Terminal windows pop up. Watch the **cloudflared** window for a line like:

```
Your quick Tunnel has been created! Visit it at:
https://something-random-words.trycloudflare.com
```

Copy that URL, then re-point the Telegram bot at it:

```bash
BOT_TOKEN="<your-telegram-bot-token>"
TUNNEL_URL="https://something-random-words.trycloudflare.com"

curl -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
  -d "url=${TUNNEL_URL}/api/telegram/webhook"

# verify
curl "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo"
```

### Just the tunnel

```bash
bash scripts/start-tunnel.sh
# CTRL+C to stop
```

Override the port if the backend listens elsewhere:

```bash
TUNNEL_PORT=4000 bash scripts/start-tunnel.sh
```

---

## 3. Why this exists

Quick tunnels rotate their public URL on every restart, so the Telegram webhook
must be re-registered each time. Previously the tunnel was being launched ad-hoc
inside Claude Code as a background task — when Claude Code exited, the tunnel
process died with it and Telegram silently stopped delivering messages. These
scripts move tunnel ownership outside the Claude Code session so it survives
between coding sessions.

For a **stable** URL (no need to re-register the webhook every restart),
upgrade to a named tunnel — the comment block at the top of
`start-tunnel.sh` shows the exact commands.

---

## 4. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `cloudflared not found` | Not installed | `brew install cloudflare/cloudflare/cloudflared` |
| Telegram bot stops responding after laptop reboot | Tunnel URL changed | Re-run `setWebhook` with the new URL |
| `Address already in use` on port 3457 | Backend already running, or another tunnel still alive | `lsof -i :3457` then `kill <pid>` |
| `osascript` errors in `start-all-dev.sh` | Not on macOS, or Terminal.app permissions denied | Run each `npm run dev` command manually in your shell |
