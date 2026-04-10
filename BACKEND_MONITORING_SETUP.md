# Backend Monitoring Complet - Setup Papertrail/Better Stack

## TOUS LES COMPOSANTS BACKEND À MONITORER

### 1. Supabase
**Ce qui tourne** :
- PostgreSQL database
- Realtime engine (websockets)
- Edge Functions (Deno)
- Auth service
- Storage service

**Logs disponibles** :
- Database queries (slow queries, errors)
- Edge Function invocations
- Auth attempts (login, signup, errors)
- Realtime connections

**Comment centraliser avec Papertrail**:

#### Option A: Supabase → Papertrail (Direct)
1. Supabase Dashboard → Project Settings → Integrations
2. Add Integration → Logging
3. Provider: Papertrail
4. Enter Papertrail endpoint

#### Option B: Webhook vers Papertrail
```typescript
// Dans chaque Edge Function, ajouter:
await fetch(`https://logs.papertrailapp.com:XXXXX`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    hostname: 'supabase-edge',
    app: 'notify-support-ticket',
    message: `Ticket ${ticketId} processed`,
    severity: 'info'
  })
});
```

---

### 2. n8n Workflows
**Ce qui tourne** :
- PM (Project Manager workflow)
- Orchestrator
- Luna Agent workflow
- Sora Agent workflow
- Marcus Agent workflow
- Milo Agent workflow

**Logs disponibles** :
- Workflow executions (success/fail)
- Node outputs (chaque étape)
- Errors & stack traces
- Execution time

**Comment centraliser avec Papertrail**:

#### Option A: n8n Logging Node
Ajouter dans chaque workflow un node "HTTP Request" qui POST vers Papertrail:

```json
// Node config
{
  "method": "POST",
  "url": "https://logs.papertrailapp.com:XXXXX",
  "body": {
    "hostname": "n8n-workflow",
    "app": "{{$workflow.name}}",
    "message": "Execution {{$execution.id}} - {{$execution.mode}}",
    "data": "{{$json}}"
  }
}
```

#### Option B: n8n → Loki → Papertrail
Si n8n tourne dans Docker:
```yaml
# docker-compose.yml
services:
  n8n:
    logging:
      driver: "syslog"
      options:
        syslog-address: "udp://logs.papertrailapp.com:XXXXX"
        tag: "n8n"
```

---

### 3. MCP Bridge (Express.js)
**Ce qui tourne** :
- HTTP server (port 3456)
- 13 MCP server connections (stdio)
- Request routing
- Error handling

**Logs disponibles** :
- HTTP requests (endpoint, status, latency)
- MCP tool calls
- MCP server crashes
- Connection errors

**Comment centraliser avec Papertrail**:

#### Setup Winston Logger with Papertrail transport

```bash
cd /Users/azzedinezazai/Documents/Agency-Killer-V4/mcp-bridge
npm install winston winston-papertrail
```

```typescript
// src/logger.ts (NOUVEAU)
import winston from 'winston';
import { Papertrail } from 'winston-papertrail';

const papertrailTransport = new Papertrail({
  host: 'logs.papertrailapp.com',
  port: XXXXX, // Ton port Papertrail
  hostname: 'mcp-bridge',
  program: 'mcp-bridge',
});

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    papertrailTransport
  ]
});

// Usage dans le code:
logger.info('MCP call', {
  server: 'seo-audit',
  tool: 'full_seo_audit',
  url: 'https://example.com',
  duration: 1234
});

logger.error('MCP server crashed', {
  server: 'google-ads',
  error: error.message,
  stack: error.stack
});
```

Puis modifier `src/index.ts`:
```typescript
// Remplacer tous les console.log par logger
import { logger } from './logger';

app.post('/api/:server/call', async (req, res) => {
  logger.info('MCP call received', {
    server: req.params.server,
    tool: req.body.tool
  });

  // ...
});
```

---

### 4. MCP Servers (13 servers stdio)
**Ce qui tourne** :
- seo-audit-server
- google-ads-launcher-server
- meta-ads-launcher-server
- tiktok-ads-launcher-server
- google-analytics-server
- google-tag-manager-server
- cms-connector-server
- project-manager-server
- web-intelligence-server (nouveau)
- ... et 4 autres

**Logs disponibles** :
- Tool executions
- API calls externes (Google Ads API, Meta API, etc.)
- Errors

**Comment centraliser avec Papertrail**:

#### Modifier chaque server pour logger vers Papertrail

Exemple pour `seo-audit-server`:

```bash
cd /Users/azzedinezazai/Documents/Agency-Killer-V4/mcp-servers/seo-audit-server
npm install winston winston-papertrail
```

```typescript
// src/logger.ts
import winston from 'winston';
import { Papertrail } from 'winston-papertrail';

const papertrailTransport = new Papertrail({
  host: 'logs.papertrailapp.com',
  port: XXXXX,
  hostname: 'mcp-server',
  program: 'seo-audit-server',
});

export const logger = winston.createLogger({
  level: 'info',
  transports: [papertrailTransport]
});
```

```typescript
// src/index.ts
import { logger } from './logger';

async function handleFullSEOAudit(url: string) {
  logger.info('Starting SEO audit', { url });

  try {
    const result = await performAudit(url);
    logger.info('SEO audit completed', {
      url,
      score: result.score,
      duration: result.duration
    });
    return result;
  } catch (error) {
    logger.error('SEO audit failed', {
      url,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}
```

**Répéter pour les 13 servers** (ou créer un package shared `@hive/logger`).

---

### 5. Frontend (React Cockpit)
**Ce qui tourne** :
- React app (client-side)
- API calls vers Supabase
- API calls vers n8n
- Realtime subscriptions

**Logs disponibles** :
- JavaScript errors
- API failures
- User actions
- Performance metrics

**Comment centraliser avec Papertrail + Sentry**:

#### Setup Sentry (meilleur pour frontend)

```bash
cd /Users/azzedinezazai/Documents/Agency-Killer-V4/cockpit
npm install @sentry/react
```

```typescript
// src/main.tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

// Wrapper l'app
Sentry.wrap(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
```

**Avantages Sentry** :
- Capture errors automatiquement
- Session replay (voir ce que l'user faisait)
- User context (email, ID)
- Breadcrumbs (actions avant l'erreur)
- Source maps (stack traces lisibles)

**Alternative Papertrail pour frontend**:
```typescript
// src/lib/logger.ts
export async function logToBackend(level: string, message: string, data?: any) {
  // Envoyer via une Edge Function qui forward à Papertrail
  await fetch('https://your-project.supabase.co/functions/v1/log-frontend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ level, message, data })
  });
}

// Usage:
logToBackend('error', 'Failed to create ticket', {
  error: error.message,
  user: user.id
});
```

---

## ARCHITECTURE DE MONITORING COMPLÈTE

```
┌─────────────────────────────────────────────────────┐
│                   PAPERTRAIL                        │
│            (Logs centralisés)                       │
│                                                     │
│  - Search: "error" last 1 hour                      │
│  - Alerts: email if "critical" appears              │
│  - Dashboards: requests/sec, errors/min             │
└─────────────────────────────────────────────────────┘
         ↑         ↑         ↑         ↑         ↑
         │         │         │         │         │
    ┌────┴───┬────┴───┬────┴────┬────┴────┬────┴────┐
    │        │        │         │         │         │
Supabase   n8n    MCP     13 MCP   Frontend
 Edge              Bridge   Servers  (Sentry)
Functions
```

---

## SETUP COMPLET - ÉTAPE PAR ÉTAPE

### Étape 1: Créer compte Papertrail (5 min)

1. Aller sur https://papertrailapp.com
2. Sign up (plan gratuit: 50MB/mois, 48h retention)
3. Créer un "Destination" → Noter le host + port (ex: logs7.papertrailapp.com:12345)

**Alternative Better Stack** (recommandé):
- https://betterstack.com/logs
- Plan gratuit: 1GB/mois, 3 jours retention
- Plus moderne, meilleure UI

### Étape 2: Configurer Supabase (10 min)

Option simple:
1. Dashboard → Project Settings → Integrations
2. (Si Papertrail n'est pas listé, utiliser webhooks dans Edge Functions)

### Étape 3: Configurer MCP Bridge (15 min)

```bash
cd mcp-bridge
npm install winston winston-papertrail
```

Créer `src/logger.ts` (voir code ci-dessus)

Remplacer tous les `console.log` par `logger.info`

### Étape 4: Configurer les 13 MCP Servers (30 min)

**Option A: Individuel** (si tu veux des logs précis par server)
- Ajouter winston + papertrail dans chaque server
- Modifier les logs

**Option B: Via MCP Bridge** (plus simple)
- Le Bridge log déjà les calls MCP
- Pas besoin de modifier les servers

**Recommandation**: Option B pour commencer

### Étape 5: Configurer n8n (10 min)

Ajouter dans chaque workflow un node "Papertrail Log":

```json
{
  "name": "Log to Papertrail",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "url": "https://logs.papertrailapp.com:XXXXX",
    "method": "POST",
    "bodyParameters": {
      "parameters": [
        {
          "name": "message",
          "value": "={{$workflow.name}} - {{$execution.mode}}"
        }
      ]
    }
  }
}
```

### Étape 6: Configurer Frontend avec Sentry (10 min)

```bash
cd cockpit
npm install @sentry/react
```

Modifier `src/main.tsx` (voir code ci-dessus)

### Étape 7: Tester (5 min)

1. Créer un ticket dans l'UI
2. Aller dans Papertrail
3. Chercher "ticket"
4. Tu devrais voir les logs de:
   - Supabase (INSERT dans support_tickets)
   - Edge Function (si déployée)
   - n8n (si workflow actif)
   - MCP Bridge (si call API)

---

## DASHBOARDS & ALERTES

### Dashboard Papertrail

Créer des "Saved Searches":

1. **Errors** : `severity:error OR level:error`
2. **Support Tickets** : `support_tickets`
3. **MCP Calls** : `mcp-bridge`
4. **Slow Queries** : `duration:>1000`

### Alertes

Créer des "Alerts":

1. **Critical Errors** :
   - Search: `level:critical OR severity:critical`
   - Frequency: As it happens
   - Notify: Email + Slack

2. **SLA Breach** :
   - Search: `sla_breached:true`
   - Frequency: As it happens
   - Notify: Email

3. **MCP Server Down** :
   - Search: `mcp-server AND status:down`
   - Frequency: As it happens
   - Notify: Slack (urgent)

---

## COÛT ESTIMÉ

### Papertrail
- **Free**: 50MB/mois, 48h retention
- **Hobby**: $7/mois, 1GB/mois, 7 jours
- **Professional**: $19/mois, 5GB/mois, 30 jours

### Better Stack (Alternative)
- **Free**: 1GB/mois, 3 jours retention
- **Startup**: $25/mois, 10GB/mois, 30 jours
- **Business**: $99/mois, 50GB/mois, 90 jours

### Sentry (Frontend)
- **Free**: 5K errors/mois
- **Team**: $26/mois, 50K errors/mois
- **Business**: $80/mois, 100K errors/mois

**Recommandation pour démarrer**:
- Better Stack Free (1GB/mois) + Sentry Free (5K errors/mois)
- **Coût total**: $0 pour commencer

---

## ALTERNATIVE: ADMIN DASHBOARD CUSTOM (sans Papertrail)

Au lieu de payer un service externe, tu peux :

1. **Stocker les logs dans Supabase** :
```sql
CREATE TABLE system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL, -- 'supabase', 'n8n', 'mcp-bridge', etc.
  level TEXT NOT NULL, -- 'info', 'warn', 'error', 'critical'
  message TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_logs_source_level ON system_logs(source, level);
CREATE INDEX idx_logs_created ON system_logs(created_at DESC);
```

2. **Afficher dans l'Admin Dashboard** :
Component `<ActivityLog>` qui fetch depuis `system_logs`

3. **Avantages** :
- Gratuit (stockage Supabase)
- Intégré dans l'app
- Pas de dépendance externe

4. **Inconvénients** :
- Pas d'alerting sophistiqué
- Pas de recherche puissante comme Papertrail
- Tu dois construire l'UI

**Ma recommandation finale**:
- **Court terme** : Admin Dashboard custom avec table `system_logs`
- **Long terme** : Better Stack quand tu scale (> 100 users)

---

**FIN DU GUIDE**
