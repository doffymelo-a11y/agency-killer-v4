# PROMPT POUR CLAUDE - Création du PRD Admin Monitoring Dashboard

**Copie-colle ce prompt exact à Claude dans une nouvelle conversation**

---

Tu es un Product Manager senior avec 10+ ans d'expérience dans le SaaS B2B, spécialisé dans les outils de monitoring et dashboards d'administration.

Je vais te fournir un contexte détaillé sur mon projet (The Hive OS V4 - Agency Killer), et je veux que tu crées un **PRD (Product Requirements Document) complet et professionnel** pour un **Admin Monitoring Dashboard**.

## CONTEXTE

Lis attentivement le fichier `ADMIN_DASHBOARD_CONTEXT_FOR_PRD.md` que je vais te partager ci-dessous.

[COLLER ICI LE CONTENU DU FICHIER ADMIN_DASHBOARD_CONTEXT_FOR_PRD.md]

## TON OBJECTIF

Créer un PRD **extrêmement détaillé et actionnable** pour que mon développeur (Claude Code) puisse implémenter le dashboard en **1 à 2 jours maximum** sans ambiguïté ni blocage.

## STRUCTURE DU PRD ATTENDUE

### 1. Executive Summary (1 page)
- Problème à résoudre (backend invisible)
- Solution proposée (Admin Dashboard)
- Valeur business
- Impact attendu (KPIs)

### 2. Objectives & Success Metrics
- Objectifs primaires (3-5)
- Métriques de succès quantifiables
- Timeline (MVP vs V1.1 vs V2)

### 3. User Personas & Scenarios
- **Persona 1** : Super Admin (fondateur) - Besoins, frustrations, goals
- **Persona 2** : Admin Support - Besoins, frustrations, goals
- **Scenarios d'usage** : Au moins 5 scénarios concrets avec étapes

### 4. Functional Requirements (Très détaillé!)

Pour **chaque feature P0 (MVP)**, fournir :

#### Feature Template:
```markdown
### Feature X: [Nom exact]

**Priority**: P0 / P1 / P2

**User Story**:
En tant que [persona], je veux [action] afin de [bénéfice].

**Acceptance Criteria** (checklist exhaustive):
- [ ] Critère mesurable 1
- [ ] Critère mesurable 2
- [ ] ...

**User Flow** (step-by-step):
1. User arrive sur /admin/dashboard
2. Système charge les données depuis Supabase
3. ...

**UI Mockup** (description textuelle détaillée):
```
┌────────────────────────────────┐
│  Header                        │
├────────────────────────────────┤
│  [Detailed layout description] │
│  Components, spacing, colors   │
└────────────────────────────────┘
```

**Data Requirements**:
- Source: [Table Supabase / API n8n / etc.]
- Fields: [Liste exhaustive des champs]
- Update frequency: [Realtime / 5min / on-demand]
- Aggregation: [Si applicable]

**Technical Specs**:
- Component: `/src/components/admin/[ComponentName].tsx`
- Service functions: `[functionName]` in `[servicefile].ts`
- Database queries: [SQL ou RPC functions]
- Realtime: [Supabase channel config si applicable]

**Edge Cases**:
- Que se passe-t-il si aucune donnée ?
- Que se passe-t-il si erreur API ?
- Que se passe-t-il si trop de données (> 1000 items) ?

**Performance Considerations**:
- Pagination si > X items
- Debounce sur search
- Lazy loading si applicable
- Cache strategy

**Dependencies**:
- Requires: [Autres features/tables]
- Blocks: [Ce qui dépend de cette feature]
```

### 5. Non-Functional Requirements
- **Performance**:
  - Page load < 2s
  - Time to interactive < 3s
  - Chart render < 500ms

- **Security**:
  - RLS policies (détaillées)
  - Input validation
  - Rate limiting

- **Accessibility**:
  - Keyboard navigation
  - ARIA labels
  - Color contrast (WCAG AA)

- **Browser Support**:
  - Chrome 90+
  - Firefox 90+
  - Safari 14+
  - Edge 90+

### 6. Data Model & Database Schema

Pour chaque **nouvelle table** (si nécessaire) :
```sql
CREATE TABLE table_name (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Tous les champs avec types, constraints
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_name ON table (column);

-- RLS Policies
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
CREATE POLICY "..." ON table_name ...;

-- Comments
COMMENT ON TABLE table_name IS '...';
```

Pour chaque **RPC function** :
```sql
CREATE OR REPLACE FUNCTION function_name(params)
RETURNS return_type AS $$
-- Implementation
$$ LANGUAGE plpgsql;
```

### 7. API Specifications

Pour chaque **intégration externe** :

#### n8n API Integration
```typescript
interface N8NClient {
  getExecutions(params: GetExecutionsParams): Promise<Execution[]>;
  getWorkflow(id: string): Promise<Workflow>;
  // ...
}

type GetExecutionsParams = {
  status?: 'running' | 'success' | 'error';
  workflowId?: string;
  limit?: number;
  offset?: number;
};
```

#### MCP Bridge Integration
```typescript
interface MCPBridgeHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  servers: Record<string, ServerStatus>;
  uptime: number;
  lastCheck: string;
}
```

### 8. Component Architecture

**Component Tree**:
```
AdminMonitoringView/
├── TicketQueue/
│   ├── TicketFilters
│   ├── TicketListItem
│   └── TicketPagination
├── SLAMetrics/
│   ├── SLAOverviewCards
│   ├── SLAChart (Recharts)
│   └── SLABreachAlerts
├── SystemHealth/
│   ├── ServiceStatusGrid
│   └── UptimeChart
└── ActivityLog/
    ├── LogFilters
    └── LogEntry
```

**Shared Components** (à créer ou réutiliser):
- `<Card>` - Container avec header/footer
- `<StatCard>` - Card avec une metric + trend
- `<EmptyState>` - Placeholder quand pas de data
- `<LoadingSpinner>` - Loading state
- `<ErrorBoundary>` - Catch errors gracefully

### 9. Implementation Plan

**Phase 1 - MVP (Jour 1)** :
- [ ] Setup AdminMonitoringView route
- [ ] Implement TicketQueue (realtime)
- [ ] Implement SLAMetrics (static charts)
- [ ] Implement SystemHealth (MCP Bridge health check)
- [ ] Basic styling (Tailwind)

**Phase 2 - Polish (Jour 2)** :
- [ ] Add ActivityLog
- [ ] Add filters & sorting
- [ ] Add animations (Framer Motion)
- [ ] Responsive design
- [ ] Error handling
- [ ] Loading states

**Phase 3 - Advanced (Post-MVP)** :
- [ ] n8n Executions viewer
- [ ] Agent Activity timeline
- [ ] Custom alerts
- [ ] Export/Reports

### 10. Testing Strategy

**Unit Tests** (avec Vitest):
```typescript
describe('TicketQueue', () => {
  it('renders empty state when no tickets', () => {});
  it('displays tickets in correct order', () => {});
  it('filters tickets by status', () => {});
  it('updates realtime on new ticket', () => {});
});
```

**Integration Tests**:
- Supabase realtime subscription works
- Data fetching from multiple sources
- Error recovery

**Manual Testing Checklist**:
- [ ] Create ticket → appears in queue instantly
- [ ] SLA breach → red badge appears
- [ ] MCP server down → health status shows degraded
- [ ] ...

### 11. Open Questions & Decisions Needed

Liste toutes les décisions que le développeur devra prendre, avec des recommandations :

1. **Refresh rate des métriques SLA** ?
   - Option A : Realtime (complexe, peut être overkill)
   - Option B : Refresh toutes les 5 min (plus simple)
   - **Recommandation** : Option B pour MVP

2. **Pagination des tickets** ?
   - Option A : Infinite scroll
   - Option B : Pages numérotées
   - **Recommandation** : Option B (plus predictable)

etc.

### 12. Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| n8n API slow (> 5s) | Medium | High | Cache responses, show loading state |
| Supabase realtime lag | Low | Medium | Fallback to polling if disconnect |
| Too many tickets crash page | Medium | High | Pagination + virtualization |

### 13. Appendices

**Appendix A** : Glossary (termes techniques)
**Appendix B** : Database schema complet
**Appendix C** : API contracts
**Appendix D** : Design system tokens (colors, spacing, typography)

---

## STYLE D'ÉCRITURE ATTENDU

- **Précis et non-ambigu** : Chaque requirement doit être testable/vérifiable
- **Orienté développeur** : Inclure des code snippets, SQL, TypeScript types
- **Visuel** : Utiliser des diagrammes ASCII, mockups textuels
- **Actionnable** : Le dev doit pouvoir commencer à coder immédiatement après lecture
- **Exhaustif mais concis** : Détaillé sans être verbeux

## CE QUI RENDRA TON PRD EXCEPTIONNEL

1. **Wireframes textuels détaillés** pour chaque écran
2. **Data flow diagrams** (même en ASCII art)
3. **Error scenarios** anticipés
4. **Performance budgets** précis
5. **Accessibility checklist** par component
6. **Code snippets** pour les parties complexes
7. **SQL queries** exactes pour fetching data
8. **TypeScript interfaces** complètes

## EXEMPLE DE QUALITÉ ATTENDUE

Au lieu de :
> "Afficher une liste de tickets"

Écris :
> **Feature: Real-time Ticket Queue**
>
> Display a paginated, filterable, real-time updating list of support tickets with SLA status indicators.
>
> **UI Layout**:
> ```
> ┌─ Ticket Queue ──────────────────────────────────────┐
> │ [Search...] [Status▼] [Priority▼] [Category▼]      │
> ├─────────────────────────────────────────────────────┤
> │ 🔴 #001 | Pixel bug        | HIGH  | 2min ago  [→] │
> │ 🟡 #002 | Feature request  | MED   | 1h ago    [→] │
> │ 🟢 #003 | Question         | LOW   | 3h ago    [→] │
> │                                         [Page 1/5]  │
> └─────────────────────────────────────────────────────┘
> ```
>
> **Data Source**:
> ```sql
> SELECT
>   st.id,
>   st.ticket_number,
>   st.subject,
>   st.priority,
>   st.status,
>   st.created_at,
>   st.sla_breached,
>   u.email AS user_email
> FROM support_tickets st
> LEFT JOIN auth.users u ON st.user_id = u.id
> WHERE st.status IN ('open', 'in_progress')
> ORDER BY
>   CASE st.priority
>     WHEN 'critical' THEN 1
>     WHEN 'high' THEN 2
>     WHEN 'medium' THEN 3
>     ELSE 4
>   END,
>   st.created_at DESC
> LIMIT 20 OFFSET $1;
> ```
>
> **Realtime Config**:
> ```typescript
> const channel = supabase
>   .channel('ticket-queue')
>   .on('postgres_changes', {
>     event: '*',
>     schema: 'public',
>     table: 'support_tickets',
>     filter: `status=in.(open,in_progress)`
>   }, (payload) => {
>     if (payload.eventType === 'INSERT') {
>       prependTicket(payload.new);
>     } else if (payload.eventType === 'UPDATE') {
>       updateTicket(payload.new);
>     }
>   })
>   .subscribe();
> ```

---

## LIVRABLES

À la fin, je veux :

1. **Un document Markdown complet** (minimum 30 pages, maximum 50 pages)
2. **Prêt à être transformé en code** sans clarifications supplémentaires
3. **Tous les edge cases couverts**
4. **Toutes les décisions techniques justifiées**

## COMMENCE MAINTENANT

Crée le PRD en suivant exactement la structure ci-dessus. Commence par l'Executive Summary et va jusqu'aux Appendices.

Si tu as des questions pour clarifier, pose-les AVANT de commencer le PRD. Sinon, fais des assumptions raisonnables et documente-les.

GO! 🚀
