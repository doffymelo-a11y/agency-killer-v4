# 🚀 MIGRATION : n8n → Node.js Backend Custom

**Date de création :** 2026-02-17
**Statut :** 📋 Planifié (à exécuter quand MVP validé + scaling nécessaire)
**Durée estimée :** 2-3 semaines full-time
**Objectif :** Remplacer n8n par un backend Node.js/Express custom pour meilleure scalabilité et maintenabilité

---

## 📊 POURQUOI MIGRER ?

### Avantages du backend Node.js vs n8n

| Critère | n8n (actuel) | Node.js Backend | Gain |
|---------|--------------|-----------------|------|
| **Performance** | ~200-500ms par workflow | ~20-50ms par requête | **10x plus rapide** |
| **Scaling** | 1 processus par workflow | Thread pool + clustering | **100x plus de requêtes/sec** |
| **RAM** | ~500MB (n8n) + ~200MB/workflow actif | ~150MB total | **Divise par 3** |
| **Tests** | Impossible (GUI only) | Tests unitaires + intégration | **Qualité code ++** |
| **CI/CD** | Import/export JSON manuel | Git + GitHub Actions | **Deploy automatique** |
| **Debug** | Clique sur nodes | VS Code debugger + logs structurés | **Debug 10x plus rapide** |
| **Multi-tenancy** | Difficile (pas d'isolation) | Middleware + RLS Supabase | **Sécurité garantie** |
| **Vendor lock-in** | Dépend de n8n | Full control | **Indépendance** |
| **MCP Servers** | Bridge HTTP requis | SDK natif | **Architecture propre** |

---

## 📋 PLAN DE MIGRATION (15 jours)

### Phase 1 : Setup Architecture (Jours 1-2)

#### Jour 1 : Initialisation projet

**Tâches :**
```bash
# 1. Créer le projet
mkdir /backend
cd /backend
npm init -y

# 2. Installer dépendances
npm install express cors dotenv
npm install @supabase/supabase-js
npm install @modelcontextprotocol/sdk
npm install winston pino pino-pretty
npm install zod  # Validation
npm install helmet  # Sécurité

# 3. Dev dependencies
npm install -D typescript @types/node @types/express
npm install -D tsx nodemon
npm install -D vitest @vitest/ui  # Tests
npm install -D eslint prettier
```

**Structure initiale :**
```
/backend/
├── src/
│   ├── index.ts                 # Entry point Express
│   ├── config/
│   │   ├── env.ts               # Variables d'environnement (Zod)
│   │   └── supabase.ts          # Client Supabase
│   ├── middleware/
│   │   ├── errorHandler.ts     # Gestion erreurs globale
│   │   ├── logger.ts            # Winston/Pino logger
│   │   └── validateRequest.ts  # Validation Zod
│   ├── routes/
│   │   └── health.ts            # GET /health
│   ├── types/
│   │   └── index.ts             # Types partagés
│   └── utils/
│       └── logger.ts            # Setup Winston
├── tests/
│   └── health.test.ts           # Premier test
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

**Fichier `tsconfig.json` :**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "types": ["node"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

**Fichier `src/index.ts` (minimal) :**
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env';
import { logger } from './utils/logger';
import healthRoutes from './routes/health';

const app = express();

// Middlewares
app.use(helmet());
app.use(cors({ origin: config.FRONTEND_URL }));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/health', healthRoutes);

// Error handler (doit être en dernier)
app.use(errorHandler);

// Start server
const PORT = config.PORT || 4000;
app.listen(PORT, () => {
  logger.info(`🚀 Backend running on port ${PORT}`);
});
```

**Temps estimé :** 4-6h

---

#### Jour 2 : MCP SDK Integration

**Tâches :**

1. **Créer le service MCP**

**Fichier `src/services/mcp.service.ts` :**
```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { logger } from '../utils/logger';

interface MCPServer {
  name: string;
  path: string;
  client?: Client;
}

class MCPService {
  private servers: Map<string, MCPServer> = new Map();

  async initServer(name: string, scriptPath: string) {
    const transport = new StdioClientTransport({
      command: 'node',
      args: [scriptPath],
    });

    const client = new Client({
      name: `hive-${name}`,
      version: '1.0.0',
    }, {
      capabilities: {},
    });

    await client.connect(transport);

    this.servers.set(name, { name, path: scriptPath, client });
    logger.info(`✅ MCP Server "${name}" initialized`);
  }

  async callTool(serverName: string, toolName: string, args: any) {
    const server = this.servers.get(serverName);
    if (!server?.client) {
      throw new Error(`MCP Server "${serverName}" not initialized`);
    }

    const result = await server.client.callTool({
      name: toolName,
      arguments: args,
    });

    return result;
  }

  async listTools(serverName: string) {
    const server = this.servers.get(serverName);
    if (!server?.client) {
      throw new Error(`MCP Server "${serverName}" not initialized`);
    }

    return await server.client.listTools();
  }
}

export const mcpService = new MCPService();
```

2. **Initialiser tous les MCP servers au démarrage**

**Fichier `src/config/mcp-servers.ts` :**
```typescript
export const MCP_SERVERS = [
  // MILO
  { name: 'nano-banana-pro', path: '/mcp-servers/nano-banana-pro-server/dist/index.js' },
  { name: 'veo3', path: '/mcp-servers/veo3-server/dist/index.js' },
  { name: 'elevenlabs', path: '/mcp-servers/elevenlabs-server/dist/index.js' },

  // SORA
  { name: 'gtm-manager', path: '/agents/CURRENT_analyst-mcp/mcp_sora_tools/gtm-manager.js' },
  { name: 'google-ads-manager', path: '/agents/CURRENT_analyst-mcp/mcp_sora_tools/google-ads-manager.js' },
  { name: 'meta-ads-manager', path: '/agents/CURRENT_analyst-mcp/mcp_sora_tools/meta-ads-manager.js' },
  { name: 'looker-manager', path: '/agents/CURRENT_analyst-mcp/mcp_sora_tools/looker-manager.js' },

  // LUNA
  { name: 'seo-audit', path: '/agents/CURRENT_strategist-mcp/mcp_luna_tools/seo-audit-tool.js' },
  { name: 'keyword-research', path: '/agents/CURRENT_strategist-mcp/mcp_luna_tools/keyword-research-tool.js' },

  // MARCUS
  // À compléter
];
```

**Temps estimé :** 4-6h

---

### Phase 2 : PM Central Brain (Jours 3-5)

#### Objectif
Recréer la logique du workflow `/agents/CURRENT_pm-mcp/pm-core.workflow.json`

**Architecture :**
```
POST /api/pm/execute
  ↓
pm.controller.ts → pm.service.ts → orchestrator.service.ts → agents.service.ts
  ↓                    ↓                     ↓
memory.service.ts   supabase    routing logic
```

**Fichier `src/routes/pm.routes.ts` :**
```typescript
import { Router } from 'express';
import { pmController } from '../controllers/pm.controller';
import { validateRequest } from '../middleware/validateRequest';
import { pmRequestSchema } from '../schemas/pm.schema';

const router = Router();

router.post('/execute', validateRequest(pmRequestSchema), pmController.execute);

export default router;
```

**Fichier `src/schemas/pm.schema.ts` :**
```typescript
import { z } from 'zod';

export const pmRequestSchema = z.object({
  action: z.enum(['genesis', 'task_launch', 'quick_action', 'write_back', 'analytics_fetch']),
  chatInput: z.string().optional(),
  shared_memory: z.object({
    project_id: z.string().uuid(),
    project_name: z.string(),
    project_status: z.string(),
    current_phase: z.string(),
    scope: z.string(),
    state_flags: z.record(z.boolean()),
    metadata: z.record(z.any()),
  }).optional(),
  session_id: z.string(),
  task_context: z.any().optional(),
});

export type PMRequest = z.infer<typeof pmRequestSchema>;
```

**Fichier `src/controllers/pm.controller.ts` :**
```typescript
import { Request, Response, NextFunction } from 'express';
import { pmService } from '../services/pm.service';
import { logger } from '../utils/logger';

class PMController {
  async execute(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();

    try {
      const { action, chatInput, shared_memory, session_id, task_context } = req.body;

      logger.info(`📥 PM Request: action=${action}, project=${shared_memory?.project_id}`);

      const result = await pmService.execute({
        action,
        chatInput,
        shared_memory,
        session_id,
        task_context,
      });

      const duration = Date.now() - startTime;
      logger.info(`✅ PM Response in ${duration}ms`);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const pmController = new PMController();
```

**Fichier `src/services/pm.service.ts` :**
```typescript
import { orchestratorService } from './orchestrator.service';
import { memoryService } from './memory.service';
import { supabase } from '../config/supabase';
import { PMRequest } from '../schemas/pm.schema';

class PMService {
  async execute(request: PMRequest) {
    const { action, chatInput, shared_memory, session_id, task_context } = request;

    // 1. Load project memory
    const memoryContext = await memoryService.loadProjectMemory(
      shared_memory?.project_id || ''
    );

    // 2. Route to orchestrator
    const response = await orchestratorService.route({
      action,
      chatInput,
      memoryContext,
      shared_memory,
      task_context,
    });

    // 3. Write memory contribution
    if (response.memory_contribution) {
      await memoryService.writeMemory(
        shared_memory?.project_id || '',
        task_context?.task_id,
        response.memory_contribution
      );
    }

    // 4. Execute write-back commands
    if (response.write_back_commands) {
      await this.executeWriteBackCommands(response.write_back_commands);
    }

    return {
      success: true,
      agent_response: response.agent_response,
      session_id,
    };
  }

  private async executeWriteBackCommands(commands: any[]) {
    // Logique write-back (UPDATE_TASK_STATUS, SET_DELIVERABLE, etc.)
  }
}

export const pmService = new PMService();
```

**Temps estimé :** 12-16h

---

### Phase 3 : Orchestrator (Jour 6)

**Fichier `src/services/orchestrator.service.ts` :**
```typescript
import { agentsService } from './agents.service';

class OrchestratorService {
  async route(context: any) {
    const { action, chatInput, memoryContext } = context;

    // Déterminer quel agent appeler
    let targetAgent: string;

    if (action === 'genesis') {
      // PM gère lui-même
      return this.handleGenesis(context);
    }

    if (context.task_context?.assignee) {
      targetAgent = context.task_context.assignee;
    } else {
      // Analyser chatInput pour router
      targetAgent = this.detectAgent(chatInput);
    }

    // Appeler l'agent
    return await agentsService.callAgent(targetAgent, context);
  }

  private detectAgent(input: string): string {
    const lower = input.toLowerCase();

    if (lower.includes('image') || lower.includes('visuel') || lower.includes('créatif')) {
      return 'milo';
    }
    if (lower.includes('analytics') || lower.includes('données') || lower.includes('tracking')) {
      return 'sora';
    }
    if (lower.includes('seo') || lower.includes('mots-clés') || lower.includes('stratégie')) {
      return 'luna';
    }
    if (lower.includes('campagne') || lower.includes('ads') || lower.includes('budget')) {
      return 'marcus';
    }

    // Default
    return 'milo';
  }

  private async handleGenesis(context: any) {
    // Logique génération de tâches
  }
}

export const orchestratorService = new OrchestratorService();
```

**Temps estimé :** 6-8h

---

### Phase 4 : Agents Services (Jours 7-10)

#### MILO Agent

**Fichier `src/services/agents/milo.service.ts` :**
```typescript
import { mcpService } from '../mcp.service';
import { openai } from '../../config/openai';

class MiloService {
  async execute(context: any) {
    const { chatInput, memoryContext, shared_memory } = context;

    // 1. Appeler OpenAI/Claude avec tools
    const tools = [
      {
        name: 'generate_image',
        description: 'Generate 4K images using Nano Banana Pro',
        input_schema: {
          type: 'object',
          properties: {
            prompt: { type: 'string' },
            aspect_ratio: { type: 'string', enum: ['1:1', '16:9', '9:16'] },
          },
          required: ['prompt'],
        },
      },
      // ... autres tools
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: `Tu es Milo, le Directeur Créatif. Brand: ${shared_memory.metadata.usp}`,
        },
        {
          role: 'user',
          content: chatInput,
        },
      ],
      tools,
      tool_choice: 'auto',
    });

    // 2. Si tool_calls, appeler MCP servers
    const toolCall = completion.choices[0].message.tool_calls?.[0];

    if (toolCall?.function.name === 'generate_image') {
      const args = JSON.parse(toolCall.function.arguments);

      const result = await mcpService.callTool('nano-banana-pro', 'generate_image', args);

      return {
        success: true,
        agent_response: {
          message: `Image générée : ${result.images[0].url}`,
          agent_used: 'milo',
          ui_components: [{
            type: 'image',
            url: result.images[0].url,
          }],
        },
        memory_contribution: {
          action: 'IMAGE_GENERATED',
          summary: `Image créée avec prompt: ${args.prompt}`,
          deliverables: [{ type: 'image', url: result.images[0].url }],
        },
      };
    }

    return {
      success: true,
      agent_response: {
        message: completion.choices[0].message.content,
        agent_used: 'milo',
      },
    };
  }
}

export const miloService = new MiloService();
```

**Répéter pour :**
- `sora.service.ts`
- `luna.service.ts`
- `marcus.service.ts`

**Temps estimé :** 16-20h (4-5h par agent)

---

### Phase 5 : Memory Service (Jour 11)

**Fichier `src/services/memory.service.ts` :**
```typescript
import { supabase } from '../config/supabase';

class MemoryService {
  async loadProjectMemory(projectId: string) {
    const { data, error } = await supabase
      .from('project_memory')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return this.formatMemoryContext(data);
  }

  async writeMemory(projectId: string, taskId: string | undefined, contribution: any) {
    const { error } = await supabase
      .from('project_memory')
      .insert({
        project_id: projectId,
        task_id: taskId,
        agent_id: contribution.agent_id,
        action: contribution.action,
        summary: contribution.summary,
        key_findings: contribution.key_findings || [],
        deliverables: contribution.deliverables || [],
        recommendations: contribution.recommendations || [],
        context_snapshot: {},
      });

    if (error) throw error;
  }

  private formatMemoryContext(memoryRecords: any[]) {
    return memoryRecords.map(record => ({
      timestamp: record.created_at,
      agent: record.agent_id,
      action: record.action,
      summary: record.summary,
    }));
  }
}

export const memoryService = new MemoryService();
```

**Temps estimé :** 4-6h

---

### Phase 6 : Tests (Jours 12-13)

**Fichier `tests/pm.test.ts` :**
```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/index';

describe('PM Central Brain', () => {
  it('should handle genesis action', async () => {
    const response = await request(app)
      .post('/api/pm/execute')
      .send({
        action: 'genesis',
        chatInput: 'Create a Meta Ads campaign',
        session_id: 'test-session',
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it('should route to MILO for image generation', async () => {
    const response = await request(app)
      .post('/api/pm/execute')
      .send({
        action: 'quick_action',
        chatInput: 'Generate an image of a blue motorcycle',
        session_id: 'test-session',
        shared_memory: {
          project_id: '123e4567-e89b-12d3-a456-426614174000',
          project_name: 'Test Project',
        },
      });

    expect(response.status).toBe(200);
    expect(response.body.agent_response.agent_used).toBe('milo');
  });
});
```

**Commandes tests :**
```bash
npm run test        # Run tests
npm run test:watch  # Watch mode
npm run test:ui     # Vitest UI
```

**Temps estimé :** 8-12h

---

### Phase 7 : Déploiement (Jours 14-15)

#### 1. Setup GitHub Actions

**Fichier `.github/workflows/deploy.yml` :**
```yaml
name: Deploy Backend

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Deploy to VPS
        uses: appleboy/scp-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          source: "dist/*,package.json"
          target: "/var/www/hive-backend"

      - name: Restart PM2
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /var/www/hive-backend
            npm install --production
            pm2 restart hive-backend
```

#### 2. Setup VPS Hostinger

```bash
# SSH dans le VPS
ssh user@srv1234539.hstgr.cloud

# Installer Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installer PM2
sudo npm install -g pm2

# Créer répertoire backend
sudo mkdir -p /var/www/hive-backend
sudo chown $USER:$USER /var/www/hive-backend

# Clone repo
cd /var/www
git clone <repo-url> hive-backend
cd hive-backend

# Install deps
npm install

# Build
npm run build

# Start with PM2
pm2 start dist/index.js --name hive-backend
pm2 save
pm2 startup
```

#### 3. Configure Nginx reverse proxy

```nginx
server {
    listen 80;
    server_name api.the-hive-os.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

**Temps estimé :** 8-10h

---

## 📊 COMPARAISON AVANT/APRÈS

### Architecture Actuelle (n8n)
```
Frontend → PM Webhook (n8n)
            ↓
       PM Workflow (JSON)
            ↓
    Orchestrator Workflow
            ↓
    ┌───┬───┬───┬───┐
    MILO SORA LUNA MARCUS (workflows n8n)
    ↓    ↓    ↓    ↓
  ToolCode inline → Sandbox restrictions
    ↓
  MCP Bridge HTTP → MCP Servers
```

**Problèmes :**
- 6 workflows séparés (PM, Orchestrator, 4 agents)
- Sandbox JavaScript strict
- Pas de tests
- Difficile à débugger
- Lourd en RAM

### Architecture Future (Node.js)
```
Frontend → Express API
            ↓
       PM Controller
            ↓
    Orchestrator Service
            ↓
    ┌───┬───┬───┬───┐
    MILO SORA LUNA MARCUS (services TypeScript)
    ↓    ↓    ↓    ↓
  MCP SDK natif → MCP Servers
```

**Avantages :**
- Code TypeScript testé
- MCP SDK natif (pas de bridge)
- 10x plus rapide
- Debugger VS Code
- CI/CD automatisé

---

## 🔧 OUTILS & STACK

### Backend
- **Runtime :** Node.js 20 LTS
- **Framework :** Express 4.18
- **Language :** TypeScript 5.3
- **Validation :** Zod 3.22
- **Database :** Supabase JS Client 2.39
- **MCP :** @modelcontextprotocol/sdk 0.5
- **AI :** OpenAI SDK 4.28 / Anthropic SDK 0.18
- **Logs :** Winston 3.11 / Pino 8.17
- **Tests :** Vitest 1.2
- **Process Manager :** PM2 5.3

### DevOps
- **CI/CD :** GitHub Actions
- **VPS :** Hostinger (srv1234539.hstgr.cloud)
- **Reverse Proxy :** Nginx
- **SSL :** Let's Encrypt (Certbot)
- **Monitoring :** PM2 + Sentry (optionnel)

---

## 📦 LIVRABLES

À la fin de la migration, tu auras :

1. ✅ **Repo GitHub** `/backend` avec code TypeScript testé
2. ✅ **Backend déployé** sur Hostinger VPS
3. ✅ **API Documentation** (Swagger UI)
4. ✅ **Tests** (>80% coverage)
5. ✅ **CI/CD** automatisé
6. ✅ **Monitoring** (PM2 dashboard)
7. ✅ **Logs structurés** (Winston/Pino)

---

## 🎯 CHECKLIST AVANT MIGRATION

Avant de commencer la migration, assure-toi que :

- [ ] Le MVP n8n fonctionne à 100%
- [ ] Tu as validé le product-market fit
- [ ] Tu as des users actifs (>10)
- [ ] n8n devient un bottleneck (lenteur, crashes)
- [ ] Tu es prêt à investir 2-3 semaines

**⚠️ Ne migre PAS trop tôt !** n8n est parfait pour le MVP.

---

## 📞 SUPPORT POST-MIGRATION

Si besoin d'aide pendant la migration :

1. Relire ce document
2. Checker les logs : `pm2 logs hive-backend`
3. Run tests : `npm test`
4. Debug : Attach VS Code debugger
5. Rollback : `pm2 restart hive-backend --update-env`

---

**Créé par :** Claude (Senior Full-Stack Architect)
**Date :** 2026-02-17
**Version :** 1.0
**Prochaine révision :** Avant de commencer la migration
