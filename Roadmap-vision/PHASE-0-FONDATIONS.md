# Phase 0: Fondations Critiques

**Durée estimée:** 5-7 jours
**Priorité:** P0 (Bloquant pour production)
**Objectif:** Sécuriser les bases avant toute collaboration avancée

---

## 🎯 Vue d'Ensemble

Cette phase implémente les **safety nets** critiques pour éviter:
- ❌ Campagnes lancées sans validation budget → Perte financière
- ❌ Tâches exécutées dans le mauvais ordre → Erreurs en cascade
- ❌ Dépassement quotas API → Factures surprises
- ❌ Actions critiques sans approbation humaine → Risques incontrôlés

---

## 📦 Critère #4: State Flags Enforcement

### Problème Actuel
```typescript
// PRD Section 2.8: state_flags existent mais ne sont JAMAIS vérifiés
state_flags: {
  strategy_validated: false,
  budget_approved: false,
  creatives_ready: false,
  tracking_ready: false,
  ads_live: false
}

// Marcus peut lancer campagne même si budget_approved = false
// → €7000 dépensés en 7 jours avant que user s'en aperçoive
```

### Solution

#### 1. Définir règles de validation

**Fichier:** `/agents/mcp_utils/state_validation_rules.js`

```javascript
/**
 * STATE VALIDATION RULES
 * Règles obligatoires pour chaque action critique par agent
 */

export const STATE_VALIDATION_RULES = {
  // ═══════════════════════════════════════════════════════════
  // MARCUS (Trader) - Actions Budget/Campagnes
  // ═══════════════════════════════════════════════════════════
  trader: {
    launch_campaign: {
      required_flags: [
        'strategy_validated',  // Luna doit avoir validé
        'budget_approved',     // User doit avoir approuvé budget
        'creatives_ready',     // Milo doit avoir livré assets
        'tracking_ready'       // Sora doit avoir vérifié pixel
      ],
      required_phase: ['Production', 'Optimization'],
      error_message: "Impossible de lancer campagne: validations manquantes",
      help_text: "Complétez d'abord: Stratégie (Luna) → Budget (Approval) → Assets (Milo) → Tracking (Sora)"
    },

    scale_campaign: {
      required_flags: ['ads_live'],
      minimum_runtime_hours: 48, // Learning phase Meta Ads
      error_message: "Impossible de scaler: campagne trop récente",
      help_text: "Attendez 48h minimum (Meta Learning Phase)"
    },

    kill_campaign: {
      required_flags: ['ads_live'],
      error_message: "Aucune campagne active à arrêter"
    }
  },

  // ═══════════════════════════════════════════════════════════
  // MILO (Creative) - Actions Création
  // ═══════════════════════════════════════════════════════════
  creative: {
    generate_final_creatives: {
      required_flags: ['strategy_validated'],
      required_phase: ['Production'],
      error_message: "Attendez validation stratégie avant génération finale",
      help_text: "Luna doit valider le positionnement et le ton"
    },

    generate_video: {
      required_flags: ['strategy_validated'],
      cost_approval_threshold: 50, // Vidéos coûteuses (VEO-2)
      error_message: "Génération vidéo nécessite validation stratégie + approbation coût"
    }
  },

  // ═══════════════════════════════════════════════════════════
  // SORA (Analyst) - Actions Dashboards
  // ═══════════════════════════════════════════════════════════
  analyst: {
    create_dashboard: {
      required_flags: ['tracking_ready'],
      error_message: "Tracking non configuré: données indisponibles",
      help_text: "Installez d'abord le pixel Meta ou le tag GA4"
    },

    analyze_campaign_performance: {
      required_flags: ['ads_live'],
      minimum_runtime_hours: 24,
      error_message: "Campagne trop récente pour analyse fiable",
      help_text: "Attendez 24h minimum de données"
    }
  },

  // ═══════════════════════════════════════════════════════════
  // LUNA (Strategist) - Actions Stratégie
  // ═══════════════════════════════════════════════════════════
  strategist: {
    finalize_strategy: {
      required_phase: ['Audit', 'Setup'],
      error_message: "Finalisez d'abord l'audit avant la stratégie"
    }
  }
};

/**
 * Vérifie si une action peut être exécutée selon l'état du projet
 */
export async function validateStateBeforeAction(
  agent,
  action,
  projectId,
  supabase
) {
  const rules = STATE_VALIDATION_RULES[agent]?.[action];
  if (!rules) {
    // Pas de règle = action autorisée
    return { valid: true };
  }

  // Charger l'état du projet
  const { data: project } = await supabase
    .from('projects')
    .select('state_flags, current_phase, metadata, created_at')
    .eq('id', projectId)
    .single();

  if (!project) {
    return {
      valid: false,
      error: 'Projet introuvable'
    };
  }

  // ─────────────────────────────────────────────────────────
  // 1. Vérifier flags requis
  // ─────────────────────────────────────────────────────────
  if (rules.required_flags) {
    const missingFlags = rules.required_flags.filter(
      flag => !project.state_flags[flag]
    );

    if (missingFlags.length > 0) {
      return {
        valid: false,
        error: rules.error_message,
        missing_flags: missingFlags,
        resolution: rules.help_text,
        severity: 'blocking'
      };
    }
  }

  // ─────────────────────────────────────────────────────────
  // 2. Vérifier phase requise
  // ─────────────────────────────────────────────────────────
  if (rules.required_phase) {
    if (!rules.required_phase.includes(project.current_phase)) {
      return {
        valid: false,
        error: `Action autorisée seulement en phase: ${rules.required_phase.join(' ou ')}`,
        current_phase: project.current_phase,
        required_phases: rules.required_phase,
        severity: 'blocking'
      };
    }
  }

  // ─────────────────────────────────────────────────────────
  // 3. Vérifier runtime minimum (pour scale, analyze, etc.)
  // ─────────────────────────────────────────────────────────
  if (rules.minimum_runtime_hours) {
    const campaign = project.metadata?.campaign;
    if (!campaign?.launched_at) {
      return {
        valid: false,
        error: "Aucune campagne active trouvée",
        severity: 'blocking'
      };
    }

    const hoursSinceLaunch =
      (Date.now() - new Date(campaign.launched_at).getTime()) / 3600000;

    if (hoursSinceLaunch < rules.minimum_runtime_hours) {
      return {
        valid: false,
        error: rules.error_message,
        hours_remaining: Math.ceil(rules.minimum_runtime_hours - hoursSinceLaunch),
        resolution: rules.help_text,
        severity: 'warning'
      };
    }
  }

  // ✅ Toutes les validations passées
  return { valid: true };
}
```

#### 2. Middleware PM Brain

**Fichier:** `/agents/CURRENT_pm-mcp/pm-core.workflow.json` (modifier)

Ajouter avant l'appel à l'Orchestrator:

```javascript
// Node "Validate State Before Action"
const validation = await validateStateBeforeAction(
  context.active_agent_id,  // Ex: 'trader'
  context.action,            // Ex: 'launch_campaign'
  context.project_id,
  supabase
);

if (!validation.valid) {
  // BLOQUER l'action
  return [{
    json: {
      success: false,
      blocked: true,
      error: validation.error,
      missing_flags: validation.missing_flags,
      resolution_steps: validation.resolution,
      severity: validation.severity,
      ui_components: [{
        type: 'ERROR',
        data: {
          title: '🚫 Action bloquée',
          message: validation.error,
          severity: validation.severity,
          resolution: {
            title: 'Comment débloquer?',
            steps: validation.resolution?.split(' → ') || [],
            missing_flags: validation.missing_flags?.map(flag => ({
              flag: flag,
              description: flagDescriptions[flag],
              responsible_agent: flagAgentMap[flag]
            }))
          }
        }
      }]
    }
  }];
}

// ✅ Validation OK → Continuer vers Orchestrator
```

#### 3. UI Component (Frontend)

**Fichier:** `/cockpit/src/components/chat/ErrorBlockedAction.tsx` (créer)

```typescript
interface ErrorBlockedActionProps {
  error: string;
  missingFlags: string[];
  resolution: string;
  severity: 'blocking' | 'warning';
}

export function ErrorBlockedAction({
  error,
  missingFlags,
  resolution,
  severity
}: ErrorBlockedActionProps) {
  return (
    <div className={cn(
      "rounded-xl border p-6",
      severity === 'blocking'
        ? "bg-red-50 border-red-200"
        : "bg-amber-50 border-amber-200"
    )}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        {severity === 'blocking' ? (
          <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
        ) : (
          <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
        )}
        <div>
          <h3 className="font-semibold text-slate-900">
            {severity === 'blocking' ? 'Action bloquée' : 'Action déconseillée'}
          </h3>
          <p className="text-sm text-slate-600 mt-1">{error}</p>
        </div>
      </div>

      {/* Missing Flags */}
      {missingFlags && missingFlags.length > 0 && (
        <div className="bg-white rounded-lg p-4 mb-4">
          <p className="text-sm font-medium text-slate-700 mb-2">
            Validations manquantes:
          </p>
          <ul className="space-y-2">
            {missingFlags.map(flag => (
              <li key={flag} className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-slate-600">
                  {flagToHumanReadable(flag)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Resolution Steps */}
      {resolution && (
        <div className="bg-white rounded-lg p-4">
          <p className="text-sm font-medium text-slate-700 mb-2">
            ✅ Comment débloquer:
          </p>
          <p className="text-sm text-slate-600 leading-relaxed">
            {resolution}
          </p>
        </div>
      )}
    </div>
  );
}
```

### Critères d'Acceptation

- [ ] Marcus tente `launch_campaign` avec `budget_approved = false` → Bloqué
- [ ] UI affiche message clair: "Impossible de lancer: budget non approuvé"
- [ ] UI affiche résolution: "Demandez approbation budget (Task: Approve Budget)"
- [ ] Sora tente `create_dashboard` avec `tracking_ready = false` → Bloqué
- [ ] Marcus tente `scale_campaign` 12h après launch → Bloqué (min 48h)
- [ ] Logs PM enregistrent blocages pour analytics

---

## 📦 Critère #5: Task Dependencies Enforcement

### Problème Actuel
```typescript
// PRD Section 2.5: depends_on existe mais AUCUNE vérification
{
  id: "task_123",
  title: "Marcus: Launch Campaign",
  depends_on: ["task_milo_visuals", "task_sora_tracking"],
  status: "todo"
}

// User lance Marcus manuellement avant Milo/Sora
// → Marcus échoue: "Aucun asset disponible"
```

### Solution

#### 1. Fonction de vérification dépendances

**Fichier:** `/agents/mcp_utils/task_dependencies.js`

```javascript
/**
 * Vérifie que toutes les dépendances d'une tâche sont complétées
 */
export async function checkTaskDependencies(taskId, supabase) {
  // Charger la tâche
  const { data: task } = await supabase
    .from('tasks')
    .select('id, title, depends_on, status')
    .eq('id', taskId)
    .single();

  if (!task) {
    return {
      ready: false,
      error: 'Tâche introuvable'
    };
  }

  // Si pas de dépendances → OK
  if (!task.depends_on || task.depends_on.length === 0) {
    return { ready: true };
  }

  // Charger toutes les tâches dépendantes
  const { data: dependencies } = await supabase
    .from('tasks')
    .select('id, title, status, deliverable_url, completed_at')
    .in('id', task.depends_on);

  // ─────────────────────────────────────────────────────────
  // 1. Vérifier que toutes sont "done"
  // ─────────────────────────────────────────────────────────
  const incomplete = dependencies.filter(d => d.status !== 'done');

  if (incomplete.length > 0) {
    return {
      ready: false,
      blocking_tasks: incomplete.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        url: `/board/${task.project_id}?task=${t.id}`
      })),
      error: `Cette tâche nécessite la complétion de ${incomplete.length} tâche(s) préalable(s)`,
      resolution: `Complétez d'abord: ${incomplete.map(t => t.title).join(', ')}`
    };
  }

  // ─────────────────────────────────────────────────────────
  // 2. Vérifier que les livrables existent
  // ─────────────────────────────────────────────────────────
  const missingDeliverables = dependencies.filter(d => !d.deliverable_url);

  if (missingDeliverables.length > 0) {
    return {
      ready: false,
      error: "Certaines tâches dépendantes n'ont pas de livrable",
      missing_deliverables: missingDeliverables.map(t => t.title),
      resolution: "Assurez-vous que les tâches précédentes ont bien généré des livrables"
    };
  }

  // ✅ Toutes dépendances OK → Charger les outputs
  return {
    ready: true,
    dependencies_output: dependencies.map(d => ({
      task_id: d.id,
      task_title: d.title,
      deliverable_url: d.deliverable_url,
      completed_at: d.completed_at
    }))
  };
}
```

#### 2. Intégration PM Brain

**Modifier:** `/agents/CURRENT_pm-mcp/pm-core.workflow.json`

```javascript
// Node "Check Task Dependencies" (avant Orchestrator)
if (context.task_id) {
  const depsCheck = await checkTaskDependencies(context.task_id, supabase);

  if (!depsCheck.ready) {
    // BLOQUER la tâche
    return [{
      json: {
        success: false,
        blocked: true,
        error: depsCheck.error,
        blocking_tasks: depsCheck.blocking_tasks,
        resolution: depsCheck.resolution,
        ui_components: [{
          type: 'DEPENDENCIES_BLOCKED',
          data: {
            title: '⏸️ Tâche en attente',
            message: depsCheck.error,
            blocking_tasks: depsCheck.blocking_tasks,
            resolution_text: depsCheck.resolution
          }
        }]
      }
    }];
  }

  // ✅ Dépendances OK → Injecter outputs dans contexte
  if (depsCheck.dependencies_output) {
    context.dependencies_deliverables = depsCheck.dependencies_output;
    context.system_instruction += `\n\n## LIVRABLES DES TÂCHES PRÉCÉDENTES\n`;

    for (const dep of depsCheck.dependencies_output) {
      context.system_instruction += `\n- **${dep.task_title}**: ${dep.deliverable_url}`;
    }
  }
}
```

### Critères d'Acceptation

- [ ] Task "Marcus: Launch" `depends_on` "Milo: Visuals"
- [ ] User tente de lancer Marcus avant Milo → Bloqué
- [ ] UI affiche: "En attente: Milo doit terminer 'Génération Visuels'"
- [ ] Lien vers la tâche bloquante cliquable dans UI
- [ ] Une fois Milo terminé → Marcus reçoit URL des visuels dans son context
- [ ] BoardView affiche badge "Bloqué" sur task Marcus

---

## 📦 Critère #7: Cost Tracking & Budget Management

### Problème Actuel
```typescript
// Aucun tracking des coûts API
// User plan "Pro" = 1000 crédits/mois
// Luna: 50 recherches Google (50 crédits)
// Milo: 30 images Imagen (300 crédits)
// Marcus: 10 campagnes (100 crédits API calls)
// Sora: 20 audits (200 crédits)
// Total: 650 crédits... puis 400 de plus le mois suivant
// → Dépassement de 50 crédits → Overage $5
// ❌ User découvre facture surprise
```

### Solution

#### 1. Table tracking

**Migration:** `/cockpit/supabase/migrations/008_api_usage_tracking.sql`

```sql
-- ══════════════════════════════════════════════════════════
-- API USAGE TRACKING - Cost Management
-- ══════════════════════════════════════════════════════════

CREATE TABLE api_usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID, -- Pour multi-tenant (future)
  project_id UUID REFERENCES projects(id),
  agent_id TEXT NOT NULL,

  -- API call details
  service_provider TEXT NOT NULL, -- 'google_vertex_ai' | 'elevenlabs' | 'meta_api' | 'google_ads_api'
  operation TEXT NOT NULL, -- 'generate_image' | 'text_to_speech' | 'search_keywords' | 'create_campaign'

  -- Coût
  cost_usd NUMERIC(10,4) NOT NULL DEFAULT 0,
  cost_credits INT NOT NULL DEFAULT 0, -- Système crédits interne

  -- Metadata
  request_size_bytes INT,
  response_size_bytes INT,
  processing_time_ms INT,
  success BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes pour performance
CREATE INDEX idx_api_usage_user_month ON api_usage_tracking(user_id, DATE_TRUNC('month', created_at));
CREATE INDEX idx_api_usage_project ON api_usage_tracking(project_id);
CREATE INDEX idx_api_usage_agent ON api_usage_tracking(agent_id, created_at DESC);

-- ══════════════════════════════════════════════════════════
-- USER PLANS & QUOTAS
-- ══════════════════════════════════════════════════════════

CREATE TABLE user_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE, -- Sera rempli lors multi-tenant

  -- Plan details
  plan_tier TEXT NOT NULL DEFAULT 'free', -- 'free' | 'pro' | 'enterprise'
  monthly_credits INT NOT NULL DEFAULT 100, -- Free: 100, Pro: 1000, Enterprise: 10000

  -- Billing
  current_period_start TIMESTAMPTZ DEFAULT DATE_TRUNC('month', NOW()),
  current_period_end TIMESTAMPTZ DEFAULT (DATE_TRUNC('month', NOW()) + INTERVAL '1 month'),

  -- Status
  status TEXT DEFAULT 'active', -- 'active' | 'suspended' | 'cancelled'

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fonction: Calculer usage actuel
CREATE OR REPLACE FUNCTION get_current_usage(p_user_id UUID DEFAULT NULL)
RETURNS TABLE(
  total_credits_used INT,
  total_cost_usd NUMERIC,
  quota INT,
  remaining_credits INT,
  percentage_used NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(cost_credits)::INT, 0) as total_credits_used,
    COALESCE(SUM(cost_usd), 0) as total_cost_usd,
    COALESCE(
      (SELECT monthly_credits FROM user_plans WHERE user_id = p_user_id LIMIT 1),
      100 -- Default free plan
    ) as quota,
    GREATEST(
      COALESCE(
        (SELECT monthly_credits FROM user_plans WHERE user_id = p_user_id LIMIT 1),
        100
      ) - COALESCE(SUM(cost_credits)::INT, 0),
      0
    ) as remaining_credits,
    CASE
      WHEN (SELECT monthly_credits FROM user_plans WHERE user_id = p_user_id LIMIT 1) > 0
      THEN (COALESCE(SUM(cost_credits), 0) * 100.0 / (SELECT monthly_credits FROM user_plans WHERE user_id = p_user_id LIMIT 1))
      ELSE 0
    END as percentage_used
  FROM api_usage_tracking
  WHERE
    (p_user_id IS NULL OR user_id = p_user_id)
    AND created_at >= DATE_TRUNC('month', NOW());
END;
$$ LANGUAGE plpgsql;
```

#### 2. Middleware cost tracking

**Fichier:** `/agents/mcp_utils/cost_tracking.js`

```javascript
/**
 * COST MAP - Prix par opération
 * Basé sur pricing réels des APIs (Feb 2026)
 */
const COST_MAP = {
  // Google Vertex AI
  'generate_image': { usd: 0.04, credits: 10 },      // Imagen 3.0: $0.04/image
  'generate_video': { usd: 0.12, credits: 30 },      // VEO-2: $0.12/video

  // ElevenLabs
  'text_to_speech': { usd: 0.015, credits: 5 },      // $0.015/1000 chars
  'clone_voice': { usd: 0.30, credits: 75 },         // $0.30/voice

  // Meta Ads API
  'create_campaign': { usd: 0.01, credits: 2 },      // API call gratuit
  'get_campaign_insights': { usd: 0.01, credits: 2 },

  // Google Ads API
  'search_keywords': { usd: 0.02, credits: 5 },      // Via Keyword Planner
  'create_google_campaign': { usd: 0.01, credits: 2 },

  // Google PageSpeed / SEO
  'analyze_page_speed': { usd: 0.01, credits: 3 },
  'seo_audit': { usd: 0.05, credits: 12 },

  // Default
  'default': { usd: 0.01, credits: 1 }
};

/**
 * Track API usage + enforce quota
 */
export async function trackAPIUsage(
  operation,
  provider,
  metadata = {},
  supabase,
  userId = null
) {
  const cost = COST_MAP[operation] || COST_MAP.default;

  // ─────────────────────────────────────────────────────────
  // 1. Vérifier quota AVANT appel API
  // ─────────────────────────────────────────────────────────
  const { data: usage } = await supabase
    .rpc('get_current_usage', { p_user_id: userId });

  const currentUsage = usage[0];

  if (currentUsage.remaining_credits < cost.credits) {
    // QUOTA DÉPASSÉ
    return {
      allowed: false,
      error: `Quota mensuel atteint (${currentUsage.total_credits_used}/${currentUsage.quota} crédits)`,
      current_usage: currentUsage.total_credits_used,
      quota: currentUsage.quota,
      overage_cost_usd: ((currentUsage.total_credits_used + cost.credits - currentUsage.quota) * 0.001),
      upgrade_url: '/settings/billing/upgrade'
    };
  }

  // ─────────────────────────────────────────────────────────
  // 2. Logger l'usage (sera commité après succès de l'API)
  // ─────────────────────────────────────────────────────────
  await supabase.from('api_usage_tracking').insert({
    user_id: userId,
    project_id: metadata.project_id,
    agent_id: metadata.agent_id,
    service_provider: provider,
    operation: operation,
    cost_usd: cost.usd,
    cost_credits: cost.credits,
    request_size_bytes: metadata.request_size_bytes,
    response_size_bytes: metadata.response_size_bytes,
    processing_time_ms: metadata.processing_time_ms,
    success: true
  });

  // ─────────────────────────────────────────────────────────
  // 3. Alert si proche du quota (>80%)
  // ─────────────────────────────────────────────────────────
  const newUsage = currentUsage.total_credits_used + cost.credits;
  const newPercentage = (newUsage * 100) / currentUsage.quota;

  const warnings = [];
  if (newPercentage >= 90) {
    warnings.push({
      level: 'critical',
      message: `⚠️ 90% du quota atteint (${newUsage}/${currentUsage.quota})`
    });
  } else if (newPercentage >= 80) {
    warnings.push({
      level: 'warning',
      message: `📊 80% du quota atteint (${newUsage}/${currentUsage.quota})`
    });
  }

  return {
    allowed: true,
    cost: cost,
    remaining_credits: currentUsage.remaining_credits - cost.credits,
    percentage_used: newPercentage,
    warnings: warnings
  };
}
```

#### 3. Intégration dans MCP calls

**Modifier:** Tous les MCP servers (nano-banana-pro, veo3, elevenlabs)

```javascript
// AVANT chaque appel API coûteux
const costCheck = await trackAPIUsage(
  'generate_image',
  'google_vertex_ai',
  {
    project_id: projectId,
    agent_id: 'creative',
    request_size_bytes: JSON.stringify(payload).length
  },
  supabase,
  userId
);

if (!costCheck.allowed) {
  return {
    success: false,
    error: costCheck.error,
    quota_exceeded: true,
    current_usage: costCheck.current_usage,
    quota: costCheck.quota,
    overage_cost: costCheck.overage_cost_usd,
    ui_components: [{
      type: 'QUOTA_EXCEEDED',
      data: {
        title: '📊 Quota mensuel atteint',
        message: costCheck.error,
        current_usage: costCheck.current_usage,
        quota: costCheck.quota,
        reset_date: endOfMonth(),
        actions: [
          { label: 'Upgrader mon plan', url: '/settings/billing/upgrade' },
          { label: 'Voir mon usage', url: '/settings/usage' }
        ]
      }
    }]
  };
}

// ✅ Quota OK → Exécuter l'API
const result = await callVertexAI(...);

// Logger warnings si proches du quota
if (costCheck.warnings.length > 0) {
  console.warn('Cost warnings:', costCheck.warnings);
}
```

### Critères d'Acceptation

- [ ] Milo génère 100 images → 1000 crédits consommés
- [ ] User atteint 900/1000 crédits → Alert "90% quota"
- [ ] User tente génération à 1001/1000 → Bloqué avec message upgrade
- [ ] Dashboard `/settings/usage` affiche breakdown par agent
- [ ] UI affiche "Crédits restants: 234/1000" dans header

---

## 📦 Critère #10: Approval Workflow

### Problème Actuel
```typescript
// Marcus veut lancer campagne €5000/jour
// ❌ Aucune demande d'approbation
// ❌ Campagne lancée immédiatement
// ❌ User découvre 2 jours plus tard → €10,000 dépensés
```

### Solution

#### 1. Table approvals

**Migration:** `/cockpit/supabase/migrations/009_approval_requests.sql`

```sql
CREATE TABLE approval_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  project_id UUID REFERENCES projects(id),
  agent_id TEXT NOT NULL,

  -- Request details
  action_type TEXT NOT NULL, -- 'create_campaign' | 'scale_campaign' | 'update_budget'
  action_payload JSONB NOT NULL,
  reason TEXT,
  risk_level TEXT NOT NULL, -- 'low' | 'medium' | 'high' | 'critical'
  estimated_cost_usd NUMERIC(10,2),
  estimated_cost_7days NUMERIC(10,2),

  -- État
  status TEXT DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected' | 'expired'
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_approval_status ON approval_requests(status, created_at DESC);
CREATE INDEX idx_approval_user ON approval_requests(user_id, status);
```

#### 2. Règles d'approbation

**Fichier:** `/agents/mcp_utils/approval_rules.js`

```javascript
export const APPROVAL_RULES = {
  create_campaign: {
    requires_approval_if: (payload) => {
      return payload.daily_budget > 500; // Budget > €500/jour
    },
    risk_level: 'high',
    expiry_hours: 24,
    reason_template: (payload) =>
      `Lancement campagne ${payload.platform} avec budget €${payload.daily_budget}/jour`
  },

  scale_campaign: {
    requires_approval_if: (payload) => {
      return payload.scale_factor > 2; // Scale > 2x
    },
    risk_level: 'medium',
    expiry_hours: 12,
    reason_template: (payload) =>
      `Scaling campagne ${payload.campaign_id} par ${payload.scale_factor}x`
  },

  update_budget: {
    requires_approval_if: (payload) => {
      const increase = ((payload.new_budget - payload.old_budget) / payload.old_budget) * 100;
      return increase > 50; // Augmentation > 50%
    },
    risk_level: 'medium',
    expiry_hours: 24
  }
};
```

#### 3. UI Component

**Fichier:** `/cockpit/src/components/chat/ApprovalRequest.tsx`

```typescript
interface ApprovalRequestProps {
  approvalId: string;
  actionSummary: string;
  estimatedCost7days: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  details: any;
}

export function ApprovalRequest({
  approvalId,
  actionSummary,
  estimatedCost7days,
  riskLevel
}: ApprovalRequestProps) {
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    await handleApprovalDecision(approvalId, 'approve');
    // Relancer l'action après approbation
  };

  const handleReject = async () => {
    const reason = prompt('Raison du refus (optionnel):');
    await handleApprovalDecision(approvalId, 'reject', reason);
  };

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900">
            ✋ Approbation requise
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            {actionSummary}
          </p>
        </div>
        <Badge variant={riskLevel === 'high' ? 'destructive' : 'warning'}>
          Risque {riskLevel}
        </Badge>
      </div>

      {/* Cost Estimate */}
      <div className="bg-white rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">Coût estimé (7 jours)</span>
          <span className="text-lg font-semibold text-slate-900">
            €{estimatedCost7days.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={handleApprove}
          disabled={loading}
          className="flex-1"
        >
          <Check className="w-4 h-4 mr-2" />
          Approuver
        </Button>
        <Button
          onClick={handleReject}
          disabled={loading}
          variant="secondary"
          className="flex-1"
        >
          <X className="w-4 h-4 mr-2" />
          Refuser
        </Button>
      </div>
    </div>
  );
}
```

### Critères d'Acceptation

- [ ] Marcus tente lancement campagne €600/jour → Demande approbation
- [ ] UI affiche composant ApprovalRequest avec coût €4200/7j
- [ ] User clique "Approuver" → Campagne lancée
- [ ] User clique "Refuser" → Action annulée + raison enregistrée
- [ ] Approbation expire après 24h → Status "expired"

---

## 📋 Checklist Phase 0

### Jour 1-2: State Flags + Dependencies
- [ ] Créer `/agents/mcp_utils/state_validation_rules.js`
- [ ] Créer `/agents/mcp_utils/task_dependencies.js`
- [ ] Modifier PM Brain workflow (nodes validation)
- [ ] Créer UI components (ErrorBlockedAction, DependenciesBlocked)
- [ ] Tests: Bloquer Marcus si budget_approved = false

### Jour 3-4: Cost Tracking
- [ ] Migration SQL `008_api_usage_tracking.sql`
- [ ] Créer `/agents/mcp_utils/cost_tracking.js`
- [ ] Intégrer dans nano-banana-pro, veo3, elevenlabs
- [ ] Créer dashboard `/settings/usage` (Frontend)
- [ ] Tests: Bloquer génération si quota dépassé

### Jour 5-7: Approval Workflow
- [ ] Migration SQL `009_approval_requests.sql`
- [ ] Créer `/agents/mcp_utils/approval_rules.js`
- [ ] Créer UI component ApprovalRequest
- [ ] Intégrer dans workflow Marcus (trader)
- [ ] Tests: Demande approbation si budget > €500/jour

### Validation Finale
- [ ] Tests end-to-end complets
- [ ] Documentation usage agents
- [ ] Review code sécurité
- [ ] Démo Product Owner

---

**Status:** 🟢 Prêt pour implémentation
**Next:** Commencer Jour 1 - State Flags Enforcement
