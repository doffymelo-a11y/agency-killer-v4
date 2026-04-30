# PRD — Telegram Ticket Resolution Tunnel

**Version:** 1.0
**Date:** 2026-04-26
**Owner:** Azzedine Zazai (founder, solo)
**Status:** Ready for implementation
**Estimation:** 5-7 jours de dev

---

## 1. Vision

Permettre au founder de gérer **100% du cycle de vie d'un ticket support depuis son téléphone**, sans jamais avoir besoin d'ouvrir son MacBook : être notifié → lire le contexte → déclencher un fix automatique par Claude Code → reviewer → résoudre. L'objectif final est de **réduire le temps "ticket reçu → user notifié de la résolution" de 30 min à 5 min**, en mobilité.

**Devise :** *"Mon meilleur dev est dans mon téléphone."*

---

## 2. Pourquoi maintenant

- Le backoffice web existe mais nécessite un PC + browser ouvert
- Notification email = trop lent + facilement raté
- Polling bash 30 min = batterie drainée + retard
- Le founder est mobile (RDV, café, sport, voyage) → besoin d'un canal push réel temps réel
- Claude Agent SDK rend possible le fix autonome supervisé — c'est l'unlock technique manquant
- Pré-revenue beta : volume actuel = 0-3 tickets/jour, parfait pour tester avant de scaler

---

## 3. User Flow (le tunnel complet)

### Scénario 1 : Bug fix déclenché depuis mobile (le cas star)

1. **User crée ticket** "Luna ne répond plus" depuis app.hive-os.com

   ↓ *(Supabase Realtime trigger)*

2. **Backend Express** → POST Telegram Bot API

   ↓ *(push notification iPhone)*

3. **🔔 Founder reçoit sur Telegram :**
   ```
   ┌─────────────────────────────────────┐
   │ 🚨 CRITICAL — TK-6093               │
   │ doffymelo@gmail.com                 │
   │ "Luna agent crash on /audit"        │
   │                                     │
   │ AI triage: Bug, MCP timeout         │
   │ Likely files: seo-audit-server      │
   │                                     │
   │ [📋 View] [🤖 Fix with Claude]      │
   │ [💬 Reply] [✅ Resolve]              │
   └─────────────────────────────────────┘
   ```

   ↓ *(founder tap "🤖 Fix with Claude")*

4. **Telegram callback** → Backend lance **Claude Agent SDK** :
   - Worktree isolé : `git worktree add /tmp/fix-tk6093 main`
   - Branch auto : `auto-fix/ticket-tk6093`
   - Contexte injecté : ticket + logs + fichiers suspects
   - Permissions : Read + Edit + Bash limité (pas de push, pas de delete)

   ↓

5. **Claude SDK** analyse → identifie fix → applique → tests locaux → commit

   ↓

6. **Backend** : `git push origin auto-fix/ticket-tk6093` → `gh pr create`

   ↓

7. **📲 Founder reçoit sur Telegram :**
   ```
   ┌─────────────────────────────────────┐
   │ ✅ Fix ready — TK-6093              │
   │                                     │
   │ Diff: +12 -3 in 2 files             │
   │ Tests: 47/47 passed                 │
   │ PR: github.com/.../pull/142         │
   │                                     │
   │ Claude reasoning:                   │
   │ "Lighthouse timeout was 30s, MCP    │
   │ retry logic infinite-looped on      │
   │ 504. Increased timeout + added      │
   │ max-retry guard."                   │
   │                                     │
   │ [👀 Review PR] [✅ Merge & Resolve] │
   │ [❌ Reject] [💬 Ask Claude]         │
   └─────────────────────────────────────┘
   ```

   ↓ *(founder review sur GitHub mobile, tap "Merge & Resolve")*

8. **Backend** : merge PR via `gh api` + `UPDATE ticket SET status='resolved'`
   + `INSERT support_message "✅ Fix deployed: see release v1.2.3"`
   + `INSERT internal_note "Auto-fixed by Claude Agent, PR #142 merged"`

   ↓

9. **User reçoit notif** (in-app + email) → teste → confirme

**⏱️ Temps total founder :** 2-5 min (lecture + 3 taps)
**⏱️ Temps wallclock :** 5-15 min (Claude code time)

---

### Scénario 2 : Question simple (réponse rapide)

1. User crée ticket "Comment changer mon plan ?"

   ↓

2. **🔔 Telegram :**
   ```
   "❓ TK-6094 — Question
    'Comment changer mon plan ?'
    AI category: billing
    Suggested template: 'Change plan instructions'
    [💬 Send template] [✏️ Custom reply]"
   ```

   ↓

3. Tap "Send template" → réponse partie en 5 sec

4. Status auto = `waiting_user`

---

### Scénario 3 : Reply libre depuis mobile

1. Founder reçoit notif Telegram
2. Tap "💬 Reply" → mini-clavier inline
3. Tape la réponse dans Telegram (ou message vocal → transcription Whisper)
4. Send → backend `INSERT support_message sender_type=admin`
5. User notifié

---

## 4. Architecture

```
┌─ User mobile ─┐                         ┌─ Founder mobile ─┐
│ app.hive-os   │                         │ Telegram + GitHub │
└───────┬───────┘                         └────────┬──────────┘
        │ create ticket                            │ inline buttons
        ↓                                          ↓
┌────────────────────┐  Realtime  ┌────────────────────────┐
│ Supabase           │ ─────────→ │ Backend Express        │
│ support_tickets    │            │ /api/superadmin/...    │
└────────────────────┘            │ /api/telegram/webhook  │
                                  └─────────┬──────────────┘
                                            │
              ┌─────────────────────────────┼──────────────────────┐
              ↓                             ↓                      ↓
   ┌─────────────────┐         ┌─────────────────────┐   ┌────────────────┐
   │ Telegram Bot    │         │ Claude Agent SDK    │   │ GitHub API     │
   │ (telegraf)      │         │ subprocess runner   │   │ (gh CLI / Octo)│
   │ - sendMessage   │         │ - worktree isolated │   │ - create PR    │
   │ - inline btns   │         │ - permissions guard │   │ - merge PR     │
   │ - voice→text    │         │ - timeout 10min     │   │ - close issue  │
   └─────────────────┘         └─────────────────────┘   └────────────────┘
```

---

## 5. Components to Build

### 5.1 Telegram Bot Service

**Fichier :** `/backend/src/services/telegram.service.ts`
**Lib :** `telegraf` (mature, TypeScript-first, 8k stars)

**Responsabilités :**
- Envoyer messages formatés aux super_admins (lookup `user_roles WHERE role='super_admin'` → table `super_admin_telegram_chat_ids`)
- Recevoir callbacks (inline button clicks) via webhook
- Gérer les replies textuels et vocaux
- Whisper API pour transcription voice → text si message vocal

**Méthodes clés :**
- `notifyTicketCreated(ticket, triage)`
- `notifyFixReady(ticket, prUrl, diff, reasoning)`
- `notifyFixFailed(ticket, error, logs)`
- `sendTemplate(ticketId, templateId)`
- `handleCallback(callbackData)` // routing : view, fix, reply, resolve, merge, reject

---

### 5.2 Telegram Webhook Endpoint

**Fichier :** `/backend/src/routes/telegram.routes.ts`

**Endpoints :**
- `POST /api/telegram/webhook`
  - Vérification signature `secret_token` Telegram
  - Body : Update object Telegram
  - Route vers `telegram.service.handleUpdate()`

- `POST /api/telegram/link-account`
  - Onboarding : super_admin lie son `chat_id` Telegram à son `user_id`
  - Flow : tape `/start` dans le bot avec un magic link token

---

### 5.3 Claude Agent SDK Runner

**Fichier :** `/backend/src/services/claude-agent.service.ts`
**SDK :** `@anthropic-ai/claude-agent-sdk` (officiel)

**Responsabilités :**
- Créer un worktree git isolé : `git worktree add /tmp/agent-{ticketId} -b auto-fix/ticket-{ticketId}`
- Lancer Claude Agent SDK avec :
  - `cwd` = worktree path
  - `permissionMode` = `acceptEdits` (pas `bypassPermissions`)
  - `allowedTools` = `[Read, Edit, Write, Glob, Grep, Bash(npm test:*), Bash(npm run lint:*)]`
  - `disallowedTools` = `[Bash(git push:*), Bash(rm:*), Bash(curl:*), WebFetch]`
  - Timeout : 10 min hard
  - System prompt : injecté avec contexte ticket complet
- Capturer le diff final (`git diff main...HEAD`)
- Capturer le reasoning (extraire du transcript)
- Exécuter tests : `npm test` + `tsc --noEmit` → bloque le push si fail
- Push branch + créer PR via `gh pr create`
- Cleanup worktree après PR créée

**Sécurité critique :**
- Variable d'env `ANTHROPIC_API_KEY` dédiée à ce subprocess
- Aucun accès aux secrets de prod (`.env.production` exclu du worktree)
- Limite 1 session Claude Agent simultanée par défaut (queue)
- Coût max par session : 5$ (kill au-delà via callback monitoring)

---

### 5.4 GitHub Integration

**Fichier :** `/backend/src/services/github.service.ts`
**Lib :** `@octokit/rest` ou shell `gh`

**Méthodes :**
- `createBranch(name)`
- `pushBranch(name)`
- `createPR(branch, title, body, ticketId)` // body inclut "Closes ticket #TK-XXX"
- `mergePR(prNumber)`
- `closePR(prNumber, reason)`

---

### 5.5 AI Triage Service (rappel — composant prerequis)

**Fichier :** `/backend/src/services/ai-triage.service.ts`

**Trigger Postgres** (ou Edge Function) sur `INSERT support_tickets` →
- Claude API : classify + duplicate check
- `UPDATE ticket` avec `category`, `priority`, `similar_tickets`
- Génère "likely files" via heuristique sur la description
- Retourne le contexte complet utilisé pour la notif Telegram

---

### 5.6 DB Schema additions

**Migration :** `/cockpit/supabase/migrations/034_telegram_integration.sql`

```sql
CREATE TABLE super_admin_telegram_chat_ids (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  chat_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  linked_at TIMESTAMPTZ DEFAULT NOW(),
  notif_preferences JSONB DEFAULT '{"critical": true, "high": true, "medium": false, "low": false}'
);

CREATE TABLE claude_agent_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES support_tickets(id),
  triggered_by UUID REFERENCES auth.users(id),
  status TEXT, -- 'running', 'success', 'failed', 'rejected', 'merged'
  branch_name TEXT,
  pr_url TEXT,
  pr_number INT,
  diff_stats JSONB, -- {added, removed, files_changed}
  reasoning TEXT,
  cost_usd NUMERIC(10,4),
  duration_seconds INT,
  error TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_agent_sessions_ticket ON claude_agent_sessions(ticket_id);
CREATE INDEX idx_agent_sessions_status ON claude_agent_sessions(status, started_at DESC);
```

---

## 6. Sécurité (critique — ne pas zapper)

### Telegram
- Webhook `secret_token` vérifié à chaque request (header `X-Telegram-Bot-Api-Secret-Token`)
- Whitelist des `chat_id` autorisés (table `super_admin_telegram_chat_ids` uniquement)
- Bot token dans Vault (jamais commit)
- Rate limit : 30 callbacks/min par chat_id

### Claude Agent SDK
- Subprocess isolé dans worktree git temporaire (jamais dans le repo principal)
- Permissions strictes : pas de `Bash(*)` wildcard, whitelist explicite
- Pas de push automatique sans tests passants
- Pas de merge auto : toujours review humaine via tap "Merge & Resolve"
- Audit log complet dans `claude_agent_sessions` + `super_admin_access_logs`
- Cost cap par session (5$ max, kill au-delà)
- Timeout 10 min wallclock max
- Variables d'env scopées : `ANTHROPIC_API_KEY` dédiée, pas accès `SUPABASE_SERVICE_ROLE`

### GitHub
- Token GitHub avec scope minimal : `repo` (private repo) + `workflow` si besoin
- Branche protégée `main` : merge uniquement via PR + status checks passants
- Branches `auto-fix/*` : auto-supprimées après merge

### Audit
- Chaque action Telegram → entrée dans `super_admin_access_logs`
- Chaque session Claude Agent → entrée dans `claude_agent_sessions` + log avec cost
- Notification Telegram si cost > 1$ pour transparence

---

## 7. Phasing (5-7 jours)

### Phase 1 — Telegram bot baseline (Jour 1-2)

- [ ] Setup bot via @BotFather, env var `TELEGRAM_BOT_TOKEN`
- [ ] Migration 034 + table `super_admin_telegram_chat_ids`
- [ ] Service `telegram.service.ts` avec `notifyTicketCreated` basique
- [ ] Endpoint webhook + signature verification
- [ ] Flow `/start` pour linker un account super_admin
- [ ] Trigger Realtime sur `support_tickets` INSERT → notif

**Test :** créer un ticket depuis l'app → notif Telegram en < 3s.

---

### Phase 2 — Inline actions (Jour 3)

- [ ] Boutons View, Reply, Resolve, Send template
- [ ] Endpoint callback handler
- [ ] Reply textuel : message dans le chat → `INSERT support_message`
- [ ] Templates : récupère depuis `admin_response_templates`

**Test :** résoudre 1 ticket complet sans toucher au PC.

---

### Phase 3 — AI Triage (Jour 4)

- [ ] Service `ai-triage.service.ts`
- [ ] Trigger Edge Function ou trigger Postgres → call Claude API
- [ ] Update ticket + enrichir notif Telegram avec triage info

**Test :** ticket créé → notif arrive avec catégorie/priorité auto + 3 fichiers suspects.

---

### Phase 4 — Claude Agent SDK runner (Jour 5-6)

- [ ] Service `claude-agent.service.ts` + worktree management
- [ ] Endpoint `POST /api/superadmin/tickets/:id/auto-fix`
- [ ] Bouton Telegram "🤖 Fix with Claude"
- [ ] GitHub integration : push + PR create
- [ ] Notif retour Telegram avec PR + diff + reasoning

**Test :** ticket bug simple → fix généré → PR ouverte → review.

---

### Phase 5 — Merge flow + voice (Jour 7)

- [ ] Bouton "✅ Merge & Resolve" → merge PR + close ticket auto
- [ ] Bouton "❌ Reject" → close PR + delete branch + ticket reste open
- [ ] Bouton "💬 Ask Claude" → relance session SDK avec follow-up question
- [ ] Voice messages : Whisper API → transcription → traité comme texte

**Test :** workflow complet end-to-end depuis mobile en mobilité (test depuis un café).

---

## 8. Tech Stack

| Composant | Choix | Raison |
|-----------|-------|--------|
| Telegram lib | `telegraf` v4 | Mature, TypeScript natif, inline keyboards faciles |
| Claude Agent | `@anthropic-ai/claude-agent-sdk` | Officiel, gestion permissions clean, pas de wrapper bricolé |
| GitHub | `@octokit/rest` ou `gh` CLI subprocess | Octokit pour API, gh pour scripts complexes |
| Voice | `openai` Whisper API | Standard, pas cher (0.006$/min), précis multi-langue |
| Worktree | `simple-git` ou `child_process` | git worktree natif, pas de wrapper inutile |
| Queue (futur) | BullMQ + Redis | Si > 1 session Claude simultanée nécessaire |

---

## 9. Verification

### 9.1 Tests fonctionnels

- [ ] Création ticket app → notif Telegram < 3s
- [ ] Tap "Reply" → tape message → user reçoit en < 5s
- [ ] Tap "Send template" → template envoyé sans édition
- [ ] Tap "🤖 Fix with Claude" sur bug simple → PR créée < 5 min
- [ ] Tap "Merge & Resolve" → PR mergée + ticket resolved + user notifié
- [ ] Voice message en français → transcription correcte → reply envoyé

### 9.2 Tests sécurité

- [ ] Webhook sans secret token → 401
- [ ] chat_id non whitelisté tape /start → refus
- [ ] Claude Agent tente `Bash(rm -rf)` → bloqué par allowedTools
- [ ] Claude Agent tente `git push` direct → bloqué (push seulement via service)
- [ ] Cost session > 5$ → kill + notif Telegram

### 9.3 Tests UX mobile

- [ ] Tester depuis un iPhone réel en 4G (pas wifi)
- [ ] Tester en mode avion → message resté en pending → envoyé au retour
- [ ] Tester avec écran verrouillé → notif visible
- [ ] Tester pendant un appel → notif silencieuse arrive bien

---

## 10. Métriques de succès

| KPI | Baseline actuelle | Objectif M+1 |
|-----|------------------|--------------|
| Time to first response | 2-6h | < 15 min |
| Time to resolution (bug simple) | 1-3 jours | < 1h |
| % tickets résolus depuis mobile | 0% | > 60% |
| Cost moyen par fix Claude Agent | N/A | < 0.50$ |
| Founder satisfaction (1-10) | 4 (pénible) | 9 |

---

## 11. Open questions / risques

- **Concurrent Claude Agent sessions** : si 3 critical en même temps ? → MVP queue de 1, BullMQ plus tard
- **Coût Claude Agent runaway** : prévoir hard cap mensuel (50$) avec kill switch
- **Faux positifs auto-fix** : prévoir bouton "Revert" qui `git revert` le merge
- **Telegram down** : fallback email pour critical uniquement
- **Latence Claude Agent** : 5-15 min peut sembler long → afficher progress dans Telegram (typing indicator + checkpoints)
- **Tests insuffisants dans le repo** : si pas de tests, Claude Agent ne peut pas valider → ajouter coverage minimum sur fichiers critiques en parallèle

---

## 12. Pas dans le scope (V2+)

- Multi-langue notifications (EN seulement pour MVP, FR pour founder)
- Slack/Discord en plus de Telegram
- Apple Watch complications
- Auto-merge sans review (jamais probablement)
- Claude Agent qui répond directement au user sans validation
- Multi super_admin avec assignment intelligent

---

## 13. Déploiement Production

### ⚠️ Critique : Localtunnel n'est PAS une solution production

**En développement local :** localtunnel (`npx localtunnel --port 3457`) fonctionne pour tester rapidement mais :
- URL change à chaque redémarrage
- Connexion instable (déconnexions fréquentes)
- Latence élevée (tunnel via serveur tiers)
- Pas de garantie SLA
- **INCOMPATIBLE avec un outil live**

### Solutions Production Recommandées

#### Option 1 : Railway (recommandé, gratuit)
```bash
npm i -g @railway/cli
railway login
railway init
railway up
```
✅ URL fixe permanente (ex: `hive-backend.railway.app`)
✅ Gratuit jusqu'à 5$/mois usage
✅ Déploiement automatique sur git push
✅ Environment variables UI
✅ Logs centralisés

**Configuration Telegram webhook (une seule fois) :**
```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://hive-backend.railway.app/api/telegram/webhook" \
  -d "secret_token=hive_os_secure_token_2026"
```

#### Option 2 : Render.com (similaire à Railway)
✅ Gratuit (avec sleep après 15min d'inactivité)
✅ URL fixe
✅ Auto-deploy depuis GitHub

#### Option 3 : VPS traditionnel (Hetzner, DigitalOcean)
- Setup nginx reverse proxy
- PM2 pour process management
- Coût : 5-10€/mois
- Plus de contrôle mais plus de maintenance

#### Option 4 : ngrok payant ($8/mois)
- URL fixe avec version Pro
- Simple pour dev/staging mais cher pour production

### Workflow de déploiement

**En développement :**
- Utiliser localtunnel/ngrok pour tests rapides
- Accepter les redémarrages et mises à jour webhook

**En production :**
- Déployer sur Railway/Render
- Configurer webhook Telegram **une seule fois**
- Le backend tourne 24/7 sans intervention

---

**Note importante pour la Phase 4 :**
Pour la Phase 4 (Claude Agent SDK runner), le system prompt complet, le user message template, la config SDK, le parsing du report, et le format PR body sont déjà préparés. Ils seront fournis au moment d'attaquer la Phase 4 — ne pas les inventer, ne pas les recoder. Pour l'instant, **focus sur les Phases 1, 2 et 3**.
