-- ═══════════════════════════════════════════════════════════════
-- Migration 017 - Support Tickets System
-- Native support system for bug reports and feature requests
-- Created: 2026-03-22
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- ENUM Types
-- ─────────────────────────────────────────────────────────────────

CREATE TYPE ticket_status AS ENUM (
  'open',           -- Nouveau ticket
  'in_progress',    -- Ticket en cours de traitement
  'waiting_user',   -- En attente de réponse utilisateur
  'resolved',       -- Résolu (mais pas fermé)
  'closed'          -- Fermé définitivement
);

CREATE TYPE ticket_priority AS ENUM (
  'low',       -- Basse priorité
  'medium',    -- Priorité moyenne
  'high',      -- Haute priorité
  'critical'   -- Critique (bug bloquant)
);

CREATE TYPE ticket_category AS ENUM (
  'bug',             -- Bug technique
  'feature_request', -- Demande de fonctionnalité
  'question',        -- Question
  'billing',         -- Facturation
  'integration',     -- Problème d'intégration
  'other'            -- Autre
);

CREATE TYPE message_sender_type AS ENUM (
  'user',   -- Message de l'utilisateur
  'admin'   -- Message de l'équipe support
);

-- ─────────────────────────────────────────────────────────────────
-- Table: support_tickets
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,  -- Projet concerné (optionnel)

  -- Ticket info
  subject TEXT NOT NULL CHECK (char_length(subject) >= 5 AND char_length(subject) <= 200),
  description TEXT NOT NULL CHECK (char_length(description) >= 20),
  category ticket_category NOT NULL DEFAULT 'bug',
  priority ticket_priority NOT NULL DEFAULT 'medium',
  status ticket_status NOT NULL DEFAULT 'open',

  -- Context auto-capture (pour debug)
  page_url TEXT,                -- URL où se trouvait l'utilisateur
  user_agent TEXT,              -- Browser/OS
  screenshot_url TEXT,          -- URL Cloudinary si screenshot joint

  -- Assignment
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- Admin assigné

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ
);

-- Indexes pour performances
CREATE INDEX idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX idx_support_tickets_created ON support_tickets(created_at DESC);
CREATE INDEX idx_support_tickets_updated ON support_tickets(updated_at DESC);
CREATE INDEX idx_support_tickets_assigned ON support_tickets(assigned_to) WHERE assigned_to IS NOT NULL;

-- Commentaires pour documentation
COMMENT ON TABLE support_tickets IS 'Support tickets for bug reports and feature requests';
COMMENT ON COLUMN support_tickets.page_url IS 'URL where user was when creating ticket (auto-captured)';
COMMENT ON COLUMN support_tickets.user_agent IS 'Browser/OS info for debugging (auto-captured)';
COMMENT ON COLUMN support_tickets.screenshot_url IS 'Cloudinary URL for screenshot attachment';

-- ─────────────────────────────────────────────────────────────────
-- Table: support_messages
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_type message_sender_type NOT NULL,

  message TEXT NOT NULL CHECK (char_length(message) >= 1),
  attachments JSONB DEFAULT '[]',  -- [{url, filename, type, size}] - pour extensibilité future

  -- Read receipt
  read_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_support_messages_ticket ON support_messages(ticket_id, created_at);
CREATE INDEX idx_support_messages_unread ON support_messages(ticket_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_support_messages_sender ON support_messages(sender_id);

COMMENT ON TABLE support_messages IS 'Conversation messages for support tickets';
COMMENT ON COLUMN support_messages.attachments IS 'Future: array of file attachments [{url, filename, type, size}]';

-- ─────────────────────────────────────────────────────────────────
-- RLS (Row Level Security) - support_tickets
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Users voient seulement leurs propres tickets
CREATE POLICY "Users see own tickets" ON support_tickets
  FOR SELECT USING (auth.uid() = user_id);

-- Users peuvent créer des tickets
CREATE POLICY "Users create tickets" ON support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users peuvent update leurs propres tickets (ex: fermer, marquer résolu)
CREATE POLICY "Users update own tickets" ON support_tickets
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins voient TOUS les tickets
CREATE POLICY "Admins see all tickets" ON support_tickets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

-- Admins peuvent tout modifier (status, priority, assignment, etc.)
CREATE POLICY "Admins update all tickets" ON support_tickets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

-- ─────────────────────────────────────────────────────────────────
-- RLS (Row Level Security) - support_messages
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- Users voient les messages de leurs tickets
CREATE POLICY "Users see own ticket messages" ON support_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE id = support_messages.ticket_id
        AND user_id = auth.uid()
    )
  );

-- Users peuvent poster dans leurs tickets
CREATE POLICY "Users post in own tickets" ON support_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE id = support_messages.ticket_id
        AND user_id = auth.uid()
    )
    AND sender_id = auth.uid()
    AND sender_type = 'user'
  );

-- Users peuvent marquer leurs messages comme lus
CREATE POLICY "Users update own messages" ON support_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE id = support_messages.ticket_id
        AND user_id = auth.uid()
    )
  );

-- Admins accès total (voir, poster, modifier)
CREATE POLICY "Admins see all messages" ON support_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins post messages" ON support_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
    AND sender_id = auth.uid()
    AND sender_type = 'admin'
  );

CREATE POLICY "Admins update messages" ON support_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

-- ─────────────────────────────────────────────────────────────────
-- Triggers
-- ─────────────────────────────────────────────────────────────────

-- Trigger 1: Auto-update updated_at quand un message est posté
CREATE OR REPLACE FUNCTION update_ticket_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE support_tickets
  SET updated_at = now()
  WHERE id = NEW.ticket_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ticket_on_message
  AFTER INSERT ON support_messages
  FOR EACH ROW EXECUTE FUNCTION update_ticket_on_message();

COMMENT ON FUNCTION update_ticket_on_message() IS 'Auto-update ticket.updated_at when new message is posted';

-- Trigger 2: Auto-update updated_at sur la table support_tickets elle-même
CREATE OR REPLACE FUNCTION update_support_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_support_tickets_updated_at();

COMMENT ON FUNCTION update_support_tickets_updated_at() IS 'Auto-update support_tickets.updated_at on UPDATE';

-- Trigger 3: Auto-set resolved_at quand status passe à 'resolved'
CREATE OR REPLACE FUNCTION set_resolved_at_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' AND NEW.resolved_at IS NULL THEN
    NEW.resolved_at = now();
  END IF;

  IF NEW.status = 'closed' AND OLD.status != 'closed' AND NEW.closed_at IS NULL THEN
    NEW.closed_at = now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_resolved_closed_timestamps
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION set_resolved_at_on_status_change();

COMMENT ON FUNCTION set_resolved_at_on_status_change() IS 'Auto-set resolved_at and closed_at timestamps';

-- ─────────────────────────────────────────────────────────────────
-- Helper Functions
-- ─────────────────────────────────────────────────────────────────

-- Function: Get unread message count for a user
CREATE OR REPLACE FUNCTION get_user_unread_ticket_messages(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO unread_count
  FROM support_messages sm
  JOIN support_tickets st ON sm.ticket_id = st.id
  WHERE st.user_id = p_user_id
    AND sm.sender_type = 'admin'
    AND sm.read_at IS NULL;

  RETURN unread_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_unread_ticket_messages(UUID) IS 'Count unread admin messages for a user (for badge)';

-- Function: Get ticket stats for admin dashboard
CREATE OR REPLACE FUNCTION get_ticket_stats()
RETURNS TABLE (
  open_count BIGINT,
  in_progress_count BIGINT,
  waiting_user_count BIGINT,
  resolved_count BIGINT,
  closed_count BIGINT,
  total_count BIGINT,
  high_priority_count BIGINT,
  critical_priority_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE status = 'open') AS open_count,
    COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress_count,
    COUNT(*) FILTER (WHERE status = 'waiting_user') AS waiting_user_count,
    COUNT(*) FILTER (WHERE status = 'resolved') AS resolved_count,
    COUNT(*) FILTER (WHERE status = 'closed') AS closed_count,
    COUNT(*) AS total_count,
    COUNT(*) FILTER (WHERE priority = 'high') AS high_priority_count,
    COUNT(*) FILTER (WHERE priority = 'critical') AS critical_priority_count
  FROM support_tickets;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_ticket_stats() IS 'Get ticket statistics for admin dashboard';

-- ─────────────────────────────────────────────────────────────────
-- Initial Data (optional)
-- ─────────────────────────────────────────────────────────────────

-- Aucune donnée initiale nécessaire

-- ═══════════════════════════════════════════════════════════════
-- End of Migration 017
-- ═══════════════════════════════════════════════════════════════
