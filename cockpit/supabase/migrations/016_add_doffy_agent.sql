-- ═══════════════════════════════════════════════════════════════
-- Migration 016 : Ajouter l'agent Doffy aux approval_requests
-- Doffy = Agent CMS Writer spécialisé WordPress/Shopify/Webflow
-- ═══════════════════════════════════════════════════════════════

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. Modifier le constraint agent_id pour inclure 'doffy'
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Supprimer l'ancien constraint
ALTER TABLE public.approval_requests
  DROP CONSTRAINT IF EXISTS approval_requests_agent_id_check;

-- Ajouter le nouveau constraint avec Doffy
ALTER TABLE public.approval_requests
  ADD CONSTRAINT approval_requests_agent_id_check
  CHECK (agent_id IN ('sora', 'marcus', 'luna', 'milo', 'doffy'));

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2. Mise à jour du commentaire
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COMMENT ON COLUMN public.approval_requests.agent_id IS 'Which AI agent is requesting approval (sora, marcus, luna, milo, doffy)';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3. Commentaire sur l'agent Doffy
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Doffy = CMS Writer Agent
-- Spécialisation: Écriture de contenu WordPress/Shopify/Webflow
-- Outils: 16 outils cms-connector MCP (read/write CMS)
-- Workflow approval: Requiert approval pour toute modification de contenu publié
