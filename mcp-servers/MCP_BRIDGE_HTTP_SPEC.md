# MCP BRIDGE HTTP - THE HIVE OS V4

## 🎯 OBJECTIF

Créer un bridge HTTP qui permet à n8n (et autres clients HTTP) de communiquer avec les MCP servers via des requêtes REST.

## 🏗️ ARCHITECTURE

```
┌─────────┐     HTTP      ┌─────────────┐    stdio    ┌────────────┐
│   n8n   │ ────────────> │ MCP Bridge  │ ──────────> │ MCP Server │
│         │ <──────────── │   (HTTP)    │ <────────── │  (stdio)   │
└─────────┘   JSON        └─────────────┘   MCP Proto └────────────┘
```

### Composants:

1. **MCP Bridge HTTP Server**
   - Express.js server
   - Endpoints REST pour chaque MCP server
   - Gestion des processus MCP servers (spawn/kill)
   - Pool de connexions réutilisables
   - Rate limiting & timeout management

2. **MCP Servers (existants)**
   - stdio transport
   - Inchangés (déjà implémentés)

## 📡 API ENDPOINTS

### 1. Health Check
```
GET /health
Response: { "status": "ok", "servers": [...] }
```

### 2. List Available MCP Servers
```
GET /servers
Response: {
  "servers": [
    { "id": "veo3", "name": "Google Veo-3", "status": "ready" },
    { "id": "elevenlabs", "name": "ElevenLabs", "status": "ready" },
    ...
  ]
}
```

### 3. List Tools for a Server
```
GET /servers/:serverId/tools
Response: {
  "server": "veo3",
  "tools": [
    {
      "name": "generate_video",
      "description": "...",
      "inputSchema": {...}
    }
  ]
}
```

### 4. Execute Tool
```
POST /servers/:serverId/tools/:toolName
Body: {
  "arguments": {
    "prompt": "...",
    "duration_seconds": 4,
    ...
  },
  "credentials": {
    "GOOGLE_CLOUD_PROJECT": "...",
    "GOOGLE_APPLICATION_CREDENTIALS": "..."
  }
}

Response: {
  "success": true,
  "result": {
    "video_url": "https://...",
    "duration": 4.2,
    ...
  }
}
```

### 5. Batch Execute (Multiple Tools)
```
POST /batch
Body: {
  "operations": [
    {
      "server": "veo3",
      "tool": "generate_video",
      "arguments": {...}
    },
    {
      "server": "elevenlabs",
      "tool": "text_to_speech",
      "arguments": {...}
    }
  ],
  "credentials": {...}
}

Response: {
  "success": true,
  "results": [
    { "success": true, "result": {...} },
    { "success": true, "result": {...} }
  ]
}
```

## 🔧 IMPLÉMENTATION

### Structure du projet:

```
mcp-bridge/
├── src/
│   ├── index.ts                 # Entry point
│   ├── server.ts                # Express server
│   ├── mcp-client.ts            # MCP stdio client
│   ├── process-pool.ts          # Gestion des process MCP
│   ├── routes/
│   │   ├── health.ts
│   │   ├── servers.ts
│   │   ├── tools.ts
│   │   └── batch.ts
│   ├── middleware/
│   │   ├── auth.ts              # API key validation
│   │   ├── rate-limit.ts        # Rate limiting
│   │   └── timeout.ts           # Request timeout
│   └── utils/
│       ├── logger.ts
│       └── errors.ts
├── config/
│   └── servers.json             # MCP servers registry
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

### servers.json (Registry):

```json
{
  "servers": {
    "veo3": {
      "name": "Google Veo-3",
      "command": "node",
      "args": ["../veo3-server/dist/index.js"],
      "env_template": {
        "GOOGLE_CLOUD_PROJECT": "required",
        "GOOGLE_APPLICATION_CREDENTIALS": "required",
        "GOOGLE_CLOUD_LOCATION": "optional|us-central1"
      },
      "timeout": 300000,
      "max_concurrent": 5
    },
    "elevenlabs": {
      "name": "ElevenLabs",
      "command": "node",
      "args": ["../elevenlabs-server/dist/index.js"],
      "env_template": {
        "ELEVENLABS_API_KEY": "required"
      },
      "timeout": 60000,
      "max_concurrent": 10
    },
    "nano-banana-pro": {
      "name": "Nano Banana Pro (Imagen 3)",
      "command": "node",
      "args": ["../nano-banana-pro-server/dist/index.js"],
      "env_template": {
        "GOOGLE_CLOUD_PROJECT": "required",
        "GOOGLE_APPLICATION_CREDENTIALS": "required"
      },
      "timeout": 120000,
      "max_concurrent": 5
    },
    "google-ads": {
      "name": "Google Ads Manager",
      "command": "node",
      "args": ["../google-ads-server/dist/index.js"],
      "env_template": {
        "GOOGLE_CLIENT_ID": "required",
        "GOOGLE_CLIENT_SECRET": "required"
      },
      "timeout": 30000,
      "max_concurrent": 20
    },
    "meta-ads": {
      "name": "Meta Ads Manager",
      "command": "node",
      "args": ["../meta-ads-server/dist/index.js"],
      "env_template": {
        "FACEBOOK_APP_ID": "required",
        "FACEBOOK_APP_SECRET": "required"
      },
      "timeout": 30000,
      "max_concurrent": 20
    },
    "gtm": {
      "name": "Google Tag Manager",
      "command": "node",
      "args": ["../gtm-server/dist/index.js"],
      "env_template": {
        "GOOGLE_CLIENT_ID": "required",
        "GOOGLE_CLIENT_SECRET": "required"
      },
      "timeout": 30000,
      "max_concurrent": 10
    },
    "looker": {
      "name": "Looker Studio",
      "command": "node",
      "args": ["../looker-server/dist/index.js"],
      "env_template": {
        "GOOGLE_CLIENT_ID": "required",
        "GOOGLE_CLIENT_SECRET": "required"
      },
      "timeout": 60000,
      "max_concurrent": 10
    },
    "seo-audit": {
      "name": "SEO Audit Tool",
      "command": "node",
      "args": ["../seo-audit-server/dist/index.js"],
      "env_template": {},
      "timeout": 45000,
      "max_concurrent": 5
    },
    "keyword-research": {
      "name": "Keyword Research Tool",
      "command": "node",
      "args": ["../keyword-research-server/dist/index.js"],
      "env_template": {
        "GOOGLE_CLIENT_ID": "required",
        "GOOGLE_CLIENT_SECRET": "required"
      },
      "timeout": 30000,
      "max_concurrent": 10
    }
  }
}
```

## 🔐 SÉCURITÉ

### 1. Authentication
- API Key dans header `X-API-Key`
- Généré aléatoirement au démarrage du bridge
- Stocké dans variable d'environnement `MCP_BRIDGE_API_KEY`

### 2. Rate Limiting
- Par IP: 100 requêtes/minute
- Par API Key: 500 requêtes/minute
- Par MCP server: selon `max_concurrent` config

### 3. Timeout Management
- Request timeout: 5 minutes max
- MCP server timeout: configuré par server
- Graceful shutdown des process

### 4. Credentials Handling
- Credentials passés dans le body de chaque requête
- **JAMAIS** stockés sur le serveur
- Injectés comme env vars au MCP server process
- Process killed après chaque exécution

## 📦 DÉPLOIEMENT SUR HOSTINGER

### Étapes:

1. **Build du bridge:**
   ```bash
   cd mcp-bridge
   npm run build
   ```

2. **Build de tous les MCP servers:**
   ```bash
   cd ../veo3-server && npm run build
   cd ../elevenlabs-server && npm run build
   # etc...
   ```

3. **Upload sur Hostinger:**
   ```bash
   # Via SFTP ou rsync
   rsync -avz mcp-bridge/ user@hostinger:/var/www/mcp-bridge/
   rsync -avz veo3-server/dist/ user@hostinger:/var/www/mcp-servers/veo3-server/dist/
   # etc...
   ```

4. **Install dependencies:**
   ```bash
   ssh user@hostinger
   cd /var/www/mcp-bridge
   npm install --production
   ```

5. **Setup PM2 (Process Manager):**
   ```bash
   npm install -g pm2
   pm2 start dist/index.js --name mcp-bridge
   pm2 save
   pm2 startup
   ```

6. **Nginx reverse proxy:**
   ```nginx
   server {
       listen 80;
       server_name mcp-bridge.yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_read_timeout 600s;
       }
   }
   ```

7. **SSL avec Let's Encrypt:**
   ```bash
   certbot --nginx -d mcp-bridge.yourdomain.com
   ```

## 🧪 TESTS

### Test unitaires (avant déploiement):

```bash
# Test VEO-3 tool
curl -X POST http://localhost:3000/servers/veo3/tools/generate_video \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "arguments": {
      "prompt": "A cat playing piano",
      "duration_seconds": 4
    },
    "credentials": {
      "GOOGLE_CLOUD_PROJECT": "the-hive-os-v4",
      "GOOGLE_APPLICATION_CREDENTIALS": "/path/to/creds.json"
    }
  }'

# Test ElevenLabs tool
curl -X POST http://localhost:3000/servers/elevenlabs/tools/text_to_speech \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "arguments": {
      "text": "Hello from The Hive OS!",
      "voice_id": "21m00Tcm4TlvDq8ikWAM"
    },
    "credentials": {
      "ELEVENLABS_API_KEY": "your-key"
    }
  }'
```

### Test depuis n8n:

```javascript
// Dans un Code Node n8n
const response = await $http.request({
  method: 'POST',
  url: 'https://mcp-bridge.yourdomain.com/servers/veo3/tools/generate_video',
  headers: {
    'X-API-Key': 'your-api-key',
    'Content-Type': 'application/json'
  },
  body: {
    arguments: {
      prompt: $json.video_prompt,
      duration_seconds: 4
    },
    credentials: {
      GOOGLE_CLOUD_PROJECT: 'the-hive-os-v4',
      GOOGLE_APPLICATION_CREDENTIALS: '/var/www/credentials/service-account.json'
    }
  }
});

return [{ json: response }];
```

## 📊 MONITORING

### Logs:
- Winston logger
- Logs stockés dans `/var/www/mcp-bridge/logs/`
- Rotation quotidienne
- Niveau: info, warn, error

### Metrics:
- Requests per minute
- Average response time
- Error rate
- MCP server availability

### Alertes:
- Email si error rate > 5%
- Email si bridge down > 5 minutes

## 🚀 PROCHAINES ÉTAPES

1. **Créer le bridge HTTP** (`/mcp-servers/mcp-bridge/`)
2. **Tester localement** avec chaque MCP server
3. **Déployer sur Hostinger**
4. **Mettre à jour les workflows n8n** pour utiliser le bridge
5. **Tester end-to-end** avec MILO workflow

---

**Priorité:** P0 - CRITIQUE
**Temps estimé:** 4-6 heures
**Dépendances:** Tous les MCP servers doivent être buildés

---

**Créé:** 2026-02-20
**Version:** 1.0.0
