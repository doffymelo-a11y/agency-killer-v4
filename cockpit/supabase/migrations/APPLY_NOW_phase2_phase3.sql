-- ═══════════════════════════════════════════════════════════════
-- Support Ticket System - Phase 2: Email Notifications
-- Migration 018
-- ═══════════════════════════════════════════════════════════════

-- Table pour tracker les emails envoyés
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  email_type TEXT NOT NULL CHECK (email_type IN ('ticket_created', 'message_received', 'status_changed', 'ticket_resolved', 'sla_breach_alert')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes pour performance
CREATE INDEX idx_email_logs_ticket ON email_logs(ticket_id);
CREATE INDEX idx_email_logs_user ON email_logs(user_id);
CREATE INDEX idx_email_logs_status ON email_logs(status) WHERE status = 'pending';
CREATE INDEX idx_email_logs_created ON email_logs(created_at DESC);

-- Table pour préférences email utilisateur
CREATE TABLE IF NOT EXISTS user_email_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  notify_on_message BOOLEAN DEFAULT TRUE,
  notify_on_status_change BOOLEAN DEFAULT TRUE,
  notify_on_assignment BOOLEAN DEFAULT TRUE,
  notify_on_resolution BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS pour email_logs (admins only)
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view email logs"
ON email_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- RLS pour user_email_preferences (users can manage their own)
ALTER TABLE user_email_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own email preferences"
ON user_email_preferences FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own email preferences"
ON user_email_preferences FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own email preferences"
ON user_email_preferences FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Function pour créer une entrée email_log après message admin
CREATE OR REPLACE FUNCTION queue_email_notification_on_admin_message()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_preferences RECORD;
BEGIN
  -- Seulement si le message vient d'un admin
  IF NEW.sender_type = 'admin' THEN
    -- Récupérer user_id et email du ticket
    SELECT user_id INTO v_user_id
    FROM support_tickets
    WHERE id = NEW.ticket_id;

    -- Récupérer l'email de l'utilisateur
    SELECT email INTO v_user_email
    FROM auth.users
    WHERE id = v_user_id;

    -- Vérifier les préférences email
    SELECT * INTO v_preferences
    FROM user_email_preferences
    WHERE user_id = v_user_id;

    -- Si pas de préférences, utiliser les defaults (notify_on_message = TRUE)
    IF v_preferences IS NULL OR v_preferences.notify_on_message = TRUE THEN
      -- Créer une entrée dans email_logs
      INSERT INTO email_logs (ticket_id, user_id, recipient_email, email_type, status)
      VALUES (NEW.ticket_id, v_user_id, v_user_email, 'message_received', 'pending');
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger après insertion de message
CREATE TRIGGER after_admin_message_queue_email
AFTER INSERT ON support_messages
FOR EACH ROW
EXECUTE FUNCTION queue_email_notification_on_admin_message();

-- Function pour créer une entrée email_log après changement de statut
CREATE OR REPLACE FUNCTION queue_email_notification_on_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_user_email TEXT;
  v_preferences RECORD;
BEGIN
  -- Seulement si le statut a changé
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Récupérer l'email de l'utilisateur
    SELECT email INTO v_user_email
    FROM auth.users
    WHERE id = NEW.user_id;

    -- Vérifier les préférences email
    SELECT * INTO v_preferences
    FROM user_email_preferences
    WHERE user_id = NEW.user_id;

    -- Si pas de préférences, utiliser les defaults (notify_on_status_change = TRUE)
    IF v_preferences IS NULL OR v_preferences.notify_on_status_change = TRUE THEN
      -- Créer une entrée dans email_logs
      IF NEW.status = 'resolved' THEN
        INSERT INTO email_logs (ticket_id, user_id, recipient_email, email_type, status)
        VALUES (NEW.id, NEW.user_id, v_user_email, 'ticket_resolved', 'pending');
      ELSE
        INSERT INTO email_logs (ticket_id, user_id, recipient_email, email_type, status)
        VALUES (NEW.id, NEW.user_id, v_user_email, 'status_changed', 'pending');
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger après update de ticket
CREATE TRIGGER after_ticket_status_change_queue_email
AFTER UPDATE ON support_tickets
FOR EACH ROW
EXECUTE FUNCTION queue_email_notification_on_status_change();

-- Function helper pour formater le numéro de ticket (pour emails)
CREATE OR REPLACE FUNCTION format_ticket_number_for_email(ticket_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_created_at TIMESTAMPTZ;
  v_sequence INTEGER;
BEGIN
  SELECT created_at INTO v_created_at
  FROM support_tickets
  WHERE id = ticket_id;

  SELECT COUNT(*) + 1 INTO v_sequence
  FROM support_tickets
  WHERE created_at < v_created_at;

  RETURN 'TK-' || TO_CHAR(v_created_at, 'YYYYMMDD') || '-' || LPAD(v_sequence::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Commentaires pour documentation
COMMENT ON TABLE email_logs IS 'Tracking de tous les emails envoyés par le système de support';
COMMENT ON TABLE user_email_preferences IS 'Préférences de notification email par utilisateur';
COMMENT ON COLUMN email_logs.email_type IS 'Type: ticket_created, message_received, status_changed, ticket_resolved, sla_breach_alert';
COMMENT ON COLUMN email_logs.status IS 'Status: pending (dans la queue), sent (envoyé), failed (erreur)';
COMMENT ON FUNCTION queue_email_notification_on_admin_message() IS 'Trigger function: créer email_log quand admin répond';
COMMENT ON FUNCTION queue_email_notification_on_status_change() IS 'Trigger function: créer email_log quand statut change';
COMMENT ON FUNCTION format_ticket_number_for_email(UUID) IS 'Helper: formater numéro de ticket pour affichage dans email';
-- ═══════════════════════════════════════════════════════════════
-- Support Ticket System - Phase 2: Internal Admin Notes
-- Migration 019
-- ═══════════════════════════════════════════════════════════════

-- Table pour les notes internes (admin uniquement)
CREATE TABLE IF NOT EXISTS support_internal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  note TEXT NOT NULL CHECK (LENGTH(note) >= 1 AND LENGTH(note) <= 5000),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes pour performance
CREATE INDEX idx_internal_notes_ticket ON support_internal_notes(ticket_id);
CREATE INDEX idx_internal_notes_author ON support_internal_notes(author_id);
CREATE INDEX idx_internal_notes_created ON support_internal_notes(created_at DESC);

-- Trigger pour auto-update updated_at
CREATE OR REPLACE FUNCTION update_internal_note_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_internal_note_updated_at
BEFORE UPDATE ON support_internal_notes
FOR EACH ROW
EXECUTE FUNCTION update_internal_note_updated_at();

-- RLS: Only admins can see/create internal notes
ALTER TABLE support_internal_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view internal notes"
ON support_internal_notes FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admins can create internal notes"
ON support_internal_notes FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
  AND author_id = auth.uid()
);

CREATE POLICY "Admins can update their own internal notes"
ON support_internal_notes FOR UPDATE
TO authenticated
USING (
  author_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admins can delete their own internal notes"
ON support_internal_notes FOR DELETE
TO authenticated
USING (
  author_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Function helper pour obtenir toutes les notes d'un ticket (avec auteur)
CREATE OR REPLACE FUNCTION get_ticket_internal_notes(p_ticket_id UUID)
RETURNS TABLE(
  id UUID,
  ticket_id UUID,
  author_id UUID,
  author_email TEXT,
  note TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sin.id,
    sin.ticket_id,
    sin.author_id,
    au.email AS author_email,
    sin.note,
    sin.created_at,
    sin.updated_at
  FROM support_internal_notes sin
  LEFT JOIN auth.users au ON sin.author_id = au.id
  WHERE sin.ticket_id = p_ticket_id
  ORDER BY sin.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires pour documentation
COMMENT ON TABLE support_internal_notes IS 'Notes privées entre admins sur les tickets (invisibles pour les utilisateurs)';
COMMENT ON COLUMN support_internal_notes.ticket_id IS 'ID du ticket concerné';
COMMENT ON COLUMN support_internal_notes.author_id IS 'Admin qui a écrit la note';
COMMENT ON COLUMN support_internal_notes.note IS 'Contenu de la note (max 5000 caractères)';
COMMENT ON FUNCTION get_ticket_internal_notes(UUID) IS 'Helper: récupérer toutes les notes internes d''un ticket avec les emails des auteurs';
-- ═══════════════════════════════════════════════════════════════
-- Support Ticket System - Phase 2: SLA Tracking & Alerts
-- Migration 020
-- ═══════════════════════════════════════════════════════════════

-- Add SLA tracking columns to support_tickets
ALTER TABLE support_tickets
ADD COLUMN IF NOT EXISTS first_response_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sla_breached BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sla_breach_reason TEXT;

-- Indexes for SLA queries
CREATE INDEX IF NOT EXISTS idx_tickets_first_response ON support_tickets(first_response_at);
CREATE INDEX IF NOT EXISTS idx_tickets_sla_breached ON support_tickets(sla_breached) WHERE sla_breached = TRUE;
CREATE INDEX IF NOT EXISTS idx_tickets_priority_status ON support_tickets(priority, status);

-- ─────────────────────────────────────────────────────────────────
-- Function: Calculate SLA metrics for a ticket
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION calculate_ticket_sla(p_ticket_id UUID)
RETURNS TABLE(
  first_response_time_hours NUMERIC,
  resolution_time_hours NUMERIC,
  sla_status TEXT,
  target_hours INTEGER
) AS $$
DECLARE
  v_created_at TIMESTAMPTZ;
  v_first_response_at TIMESTAMPTZ;
  v_resolved_at TIMESTAMPTZ;
  v_priority TEXT;
  v_target_hours INTEGER;
BEGIN
  -- Get ticket data
  SELECT
    st.created_at,
    st.first_response_at,
    st.resolved_at,
    st.priority
  INTO
    v_created_at,
    v_first_response_at,
    v_resolved_at,
    v_priority
  FROM support_tickets st
  WHERE st.id = p_ticket_id;

  -- Determine SLA target based on priority
  v_target_hours := CASE v_priority
    WHEN 'critical' THEN 4   -- 4 heures pour critique
    WHEN 'high' THEN 24      -- 24 heures pour haute
    WHEN 'medium' THEN 48    -- 48 heures pour moyenne
    ELSE 72                  -- 72 heures pour basse
  END;

  -- Calculate metrics and determine status
  RETURN QUERY
  SELECT
    -- First response time (in hours)
    EXTRACT(EPOCH FROM (COALESCE(v_first_response_at, NOW()) - v_created_at))::NUMERIC / 3600 AS first_response_time_hours,

    -- Resolution time (in hours)
    EXTRACT(EPOCH FROM (COALESCE(v_resolved_at, NOW()) - v_created_at))::NUMERIC / 3600 AS resolution_time_hours,

    -- SLA status
    CASE
      -- No response yet and overdue
      WHEN v_first_response_at IS NULL
        AND EXTRACT(EPOCH FROM (NOW() - v_created_at))/3600 > v_target_hours
        THEN 'BREACHED'

      -- Response was late
      WHEN v_first_response_at IS NOT NULL
        AND EXTRACT(EPOCH FROM (v_first_response_at - v_created_at))/3600 > v_target_hours
        THEN 'BREACHED_LATE'

      -- Not resolved yet but within SLA
      WHEN v_resolved_at IS NULL
        AND EXTRACT(EPOCH FROM (NOW() - v_created_at))/3600 <= v_target_hours
        THEN 'IN_PROGRESS'

      -- Resolved and met SLA
      ELSE 'MET'
    END AS sla_status,

    -- Target hours for this priority
    v_target_hours AS target_hours;
END;
$$ LANGUAGE plpgsql STABLE;

-- ─────────────────────────────────────────────────────────────────
-- Materialized View: SLA Dashboard Metrics
-- ─────────────────────────────────────────────────────────────────

CREATE MATERIALIZED VIEW IF NOT EXISTS ticket_sla_dashboard AS
SELECT
  DATE(created_at) as date,
  priority,
  category,
  COUNT(*) as total_tickets,
  COUNT(CASE WHEN status IN ('resolved', 'closed') THEN 1 END) as resolved_tickets,

  -- Average first response time (in hours)
  AVG(
    EXTRACT(EPOCH FROM (first_response_at - created_at))::NUMERIC / 3600
  ) FILTER (WHERE first_response_at IS NOT NULL) as avg_first_response_hours,

  -- Average resolution time (in hours)
  AVG(
    EXTRACT(EPOCH FROM (resolved_at - created_at))::NUMERIC / 3600
  ) FILTER (WHERE resolved_at IS NOT NULL) as avg_resolution_hours,

  -- SLA breaches count
  COUNT(CASE WHEN sla_breached = TRUE THEN 1 END) as sla_breaches,

  -- Percentage met SLA
  ROUND(
    100.0 * COUNT(CASE WHEN sla_breached = FALSE AND status IN ('resolved', 'closed') THEN 1 END)
    / NULLIF(COUNT(CASE WHEN status IN ('resolved', 'closed') THEN 1 END), 0),
    2
  ) as sla_met_percentage
FROM support_tickets
GROUP BY DATE(created_at), priority, category
ORDER BY date DESC;

-- Index on materialized view
CREATE INDEX IF NOT EXISTS idx_sla_dashboard_date ON ticket_sla_dashboard(date DESC);

-- ─────────────────────────────────────────────────────────────────
-- Function: Refresh SLA Dashboard (call daily via cron)
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION refresh_sla_dashboard()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW ticket_sla_dashboard;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────
-- Trigger: Update first_response_at when admin sends first message
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_first_response_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Only for admin messages
  IF NEW.sender_type = 'admin' THEN
    -- Update ticket's first_response_at if not already set
    UPDATE support_tickets
    SET first_response_at = NEW.created_at
    WHERE id = NEW.ticket_id
    AND first_response_at IS NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_first_response_at ON support_messages;

CREATE TRIGGER trigger_set_first_response_at
AFTER INSERT ON support_messages
FOR EACH ROW
EXECUTE FUNCTION set_first_response_at();

-- ─────────────────────────────────────────────────────────────────
-- Function: Find tickets at risk of SLA breach
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_tickets_at_risk()
RETURNS TABLE(
  ticket_id UUID,
  subject TEXT,
  priority TEXT,
  created_at TIMESTAMPTZ,
  hours_since_creation NUMERIC,
  target_hours INTEGER,
  hours_remaining NUMERIC,
  user_email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    st.id AS ticket_id,
    st.subject,
    st.priority::TEXT,
    st.created_at,
    EXTRACT(EPOCH FROM (NOW() - st.created_at))::NUMERIC / 3600 AS hours_since_creation,
    CASE st.priority
      WHEN 'critical' THEN 4
      WHEN 'high' THEN 24
      WHEN 'medium' THEN 48
      ELSE 72
    END AS target_hours,
    (CASE st.priority
      WHEN 'critical' THEN 4
      WHEN 'high' THEN 24
      WHEN 'medium' THEN 48
      ELSE 72
    END - EXTRACT(EPOCH FROM (NOW() - st.created_at))::NUMERIC / 3600) AS hours_remaining,
    au.email AS user_email
  FROM support_tickets st
  LEFT JOIN auth.users au ON st.user_id = au.id
  WHERE st.status IN ('open', 'in_progress')
  AND st.first_response_at IS NULL
  AND st.sla_breached = FALSE
  ORDER BY hours_remaining ASC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────
-- Function: Get SLA summary statistics
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_sla_summary(days_back INTEGER DEFAULT 30)
RETURNS TABLE(
  total_tickets BIGINT,
  total_resolved BIGINT,
  avg_first_response_hours NUMERIC,
  avg_resolution_hours NUMERIC,
  sla_breaches BIGINT,
  sla_met_percentage NUMERIC,
  critical_breaches BIGINT,
  high_breaches BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) AS total_tickets,
    COUNT(CASE WHEN status IN ('resolved', 'closed') THEN 1 END) AS total_resolved,

    AVG(
      EXTRACT(EPOCH FROM (first_response_at - created_at))::NUMERIC / 3600
    ) FILTER (WHERE first_response_at IS NOT NULL) AS avg_first_response_hours,

    AVG(
      EXTRACT(EPOCH FROM (resolved_at - created_at))::NUMERIC / 3600
    ) FILTER (WHERE resolved_at IS NOT NULL) AS avg_resolution_hours,

    COUNT(CASE WHEN sla_breached = TRUE THEN 1 END) AS sla_breaches,

    ROUND(
      100.0 * COUNT(CASE WHEN sla_breached = FALSE AND status IN ('resolved', 'closed') THEN 1 END)
      / NULLIF(COUNT(CASE WHEN status IN ('resolved', 'closed') THEN 1 END), 0),
      2
    ) AS sla_met_percentage,

    COUNT(CASE WHEN sla_breached = TRUE AND priority = 'critical' THEN 1 END) AS critical_breaches,
    COUNT(CASE WHEN sla_breached = TRUE AND priority = 'high' THEN 1 END) AS high_breaches
  FROM support_tickets
  WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────
-- Comments for documentation
-- ─────────────────────────────────────────────────────────────────

COMMENT ON COLUMN support_tickets.first_response_at IS 'Timestamp du premier message admin (pour calcul SLA)';
COMMENT ON COLUMN support_tickets.sla_breached IS 'TRUE si le ticket a dépassé le SLA cible';
COMMENT ON COLUMN support_tickets.sla_breach_reason IS 'Raison du dépassement SLA';

COMMENT ON FUNCTION calculate_ticket_sla(UUID) IS 'Calcule les métriques SLA pour un ticket donné';
COMMENT ON FUNCTION get_tickets_at_risk() IS 'Retourne les tickets à risque de dépassement SLA';
COMMENT ON FUNCTION get_sla_summary(INTEGER) IS 'Retourne un résumé des statistiques SLA sur N jours';
COMMENT ON FUNCTION refresh_sla_dashboard() IS 'Rafraîchit la vue matérialisée du dashboard SLA';

COMMENT ON MATERIALIZED VIEW ticket_sla_dashboard IS 'Vue matérialisée des métriques SLA par jour/priorité/catégorie';
-- ═══════════════════════════════════════════════════════════════
-- Support Ticket System - Phase 2: AI Auto-categorization
-- Migration 021
-- ═══════════════════════════════════════════════════════════════

-- Add AI categorization columns to support_tickets
ALTER TABLE support_tickets
ADD COLUMN IF NOT EXISTS ai_suggested_category ticket_category,
ADD COLUMN IF NOT EXISTS ai_suggested_priority ticket_priority,
ADD COLUMN IF NOT EXISTS ai_confidence NUMERIC(3,2) CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
ADD COLUMN IF NOT EXISTS ai_reasoning TEXT,
ADD COLUMN IF NOT EXISTS sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative', 'frustrated', 'urgent')),
ADD COLUMN IF NOT EXISTS urgency_score SMALLINT CHECK (urgency_score >= 1 AND urgency_score <= 10),
ADD COLUMN IF NOT EXISTS ai_analyzed_at TIMESTAMPTZ;

-- Indexes for AI queries
CREATE INDEX IF NOT EXISTS idx_tickets_ai_confidence ON support_tickets(ai_confidence DESC) WHERE ai_confidence IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tickets_sentiment ON support_tickets(sentiment) WHERE sentiment IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tickets_urgency_score ON support_tickets(urgency_score DESC) WHERE urgency_score IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────
-- Function: Get tickets needing AI categorization
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_tickets_needing_ai_categorization(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
  id UUID,
  subject TEXT,
  description TEXT,
  category ticket_category,
  priority ticket_priority,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    st.id,
    st.subject,
    st.description,
    st.category,
    st.priority,
    st.created_at
  FROM support_tickets st
  WHERE st.ai_analyzed_at IS NULL
  AND st.created_at >= NOW() - INTERVAL '7 days'
  ORDER BY st.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────
-- Function: Update ticket with AI analysis
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_ticket_ai_analysis(
  p_ticket_id UUID,
  p_suggested_category ticket_category,
  p_suggested_priority ticket_priority,
  p_confidence NUMERIC,
  p_reasoning TEXT,
  p_sentiment TEXT,
  p_urgency_score INTEGER
)
RETURNS void AS $$
BEGIN
  UPDATE support_tickets
  SET
    ai_suggested_category = p_suggested_category,
    ai_suggested_priority = p_suggested_priority,
    ai_confidence = p_confidence,
    ai_reasoning = p_reasoning,
    sentiment = p_sentiment,
    urgency_score = p_urgency_score,
    ai_analyzed_at = NOW()
  WHERE id = p_ticket_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────
-- Function: Apply AI suggestions to ticket
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION apply_ai_suggestions(p_ticket_id UUID)
RETURNS void AS $$
BEGIN
  -- Apply AI suggestions if confidence is high enough (>= 0.75)
  UPDATE support_tickets
  SET
    category = ai_suggested_category,
    priority = ai_suggested_priority
  WHERE id = p_ticket_id
  AND ai_confidence >= 0.75
  AND ai_suggested_category IS NOT NULL
  AND ai_suggested_priority IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────
-- Function: Get AI categorization stats
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_ai_categorization_stats(days_back INTEGER DEFAULT 30)
RETURNS TABLE(
  total_analyzed BIGINT,
  avg_confidence NUMERIC,
  high_confidence_count BIGINT,
  low_confidence_count BIGINT,
  category_accuracy NUMERIC,
  priority_accuracy NUMERIC,
  sentiment_distribution JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Total tickets analyzed
    COUNT(*) FILTER (WHERE ai_analyzed_at IS NOT NULL) AS total_analyzed,

    -- Average confidence
    AVG(ai_confidence) FILTER (WHERE ai_analyzed_at IS NOT NULL) AS avg_confidence,

    -- High confidence (>= 0.8)
    COUNT(*) FILTER (WHERE ai_confidence >= 0.8) AS high_confidence_count,

    -- Low confidence (< 0.6)
    COUNT(*) FILTER (WHERE ai_confidence < 0.6 AND ai_confidence IS NOT NULL) AS low_confidence_count,

    -- Category accuracy (how often AI suggestion was kept)
    ROUND(
      100.0 * COUNT(*) FILTER (WHERE category = ai_suggested_category)
      / NULLIF(COUNT(*) FILTER (WHERE ai_suggested_category IS NOT NULL), 0),
      2
    ) AS category_accuracy,

    -- Priority accuracy
    ROUND(
      100.0 * COUNT(*) FILTER (WHERE priority = ai_suggested_priority)
      / NULLIF(COUNT(*) FILTER (WHERE ai_suggested_priority IS NOT NULL), 0),
      2
    ) AS priority_accuracy,

    -- Sentiment distribution
    jsonb_build_object(
      'positive', COUNT(*) FILTER (WHERE sentiment = 'positive'),
      'neutral', COUNT(*) FILTER (WHERE sentiment = 'neutral'),
      'negative', COUNT(*) FILTER (WHERE sentiment = 'negative'),
      'frustrated', COUNT(*) FILTER (WHERE sentiment = 'frustrated'),
      'urgent', COUNT(*) FILTER (WHERE sentiment = 'urgent')
    ) AS sentiment_distribution
  FROM support_tickets
  WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────
-- Function: Get tickets by sentiment
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_tickets_by_sentiment(
  p_sentiment TEXT,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE(
  id UUID,
  subject TEXT,
  priority ticket_priority,
  status ticket_status,
  urgency_score SMALLINT,
  created_at TIMESTAMPTZ,
  user_email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    st.id,
    st.subject,
    st.priority,
    st.status,
    st.urgency_score,
    st.created_at,
    au.email AS user_email
  FROM support_tickets st
  LEFT JOIN auth.users au ON st.user_id = au.id
  WHERE st.sentiment = p_sentiment
  AND st.status NOT IN ('closed')
  ORDER BY st.urgency_score DESC NULLS LAST, st.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────
-- Trigger: Auto-queue AI analysis for new tickets
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION queue_ai_analysis_on_ticket_create()
RETURNS TRIGGER AS $$
BEGIN
  -- You can optionally trigger the Edge Function here via pg_net
  -- For now, the Edge Function will poll for unanalyzed tickets
  -- or be called explicitly from the frontend

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_queue_ai_analysis ON support_tickets;

CREATE TRIGGER trigger_queue_ai_analysis
AFTER INSERT ON support_tickets
FOR EACH ROW
EXECUTE FUNCTION queue_ai_analysis_on_ticket_create();

-- ─────────────────────────────────────────────────────────────────
-- Comments for documentation
-- ─────────────────────────────────────────────────────────────────

COMMENT ON COLUMN support_tickets.ai_suggested_category IS 'Catégorie suggérée par l''IA';
COMMENT ON COLUMN support_tickets.ai_suggested_priority IS 'Priorité suggérée par l''IA';
COMMENT ON COLUMN support_tickets.ai_confidence IS 'Niveau de confiance de l''IA (0.00 à 1.00)';
COMMENT ON COLUMN support_tickets.ai_reasoning IS 'Explication de la suggestion IA';
COMMENT ON COLUMN support_tickets.sentiment IS 'Sentiment détecté dans le ticket';
COMMENT ON COLUMN support_tickets.urgency_score IS 'Score d''urgence (1-10, 10 = très urgent)';
COMMENT ON COLUMN support_tickets.ai_analyzed_at IS 'Timestamp de l''analyse IA';

COMMENT ON FUNCTION get_tickets_needing_ai_categorization(INTEGER) IS 'Retourne les tickets qui n''ont pas encore été analysés par l''IA';
COMMENT ON FUNCTION update_ticket_ai_analysis(UUID, ticket_category, ticket_priority, NUMERIC, TEXT, TEXT, INTEGER) IS 'Met à jour un ticket avec les résultats de l''analyse IA';
COMMENT ON FUNCTION apply_ai_suggestions(UUID) IS 'Applique les suggestions IA si la confiance est élevée (>= 0.75)';
COMMENT ON FUNCTION get_ai_categorization_stats(INTEGER) IS 'Retourne les statistiques d''exactitude de la catégorisation IA';
COMMENT ON FUNCTION get_tickets_by_sentiment(TEXT, INTEGER) IS 'Retourne les tickets filtrés par sentiment';
-- ═══════════════════════════════════════════════════════════════
-- Support Ticket System - Phase 3: Knowledge Base Integration
-- Migration 022
-- ═══════════════════════════════════════════════════════════════

-- Table pour les articles de la base de connaissances
CREATE TABLE IF NOT EXISTS kb_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Article content
  title TEXT NOT NULL CHECK (LENGTH(title) >= 5 AND LENGTH(title) <= 200),
  slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9-]+$'),
  content TEXT NOT NULL CHECK (LENGTH(content) >= 50),
  excerpt TEXT CHECK (LENGTH(excerpt) <= 500),

  -- Categorization
  category TEXT NOT NULL CHECK (category IN ('getting-started', 'features', 'integrations', 'billing', 'troubleshooting', 'api', 'other')),
  tags TEXT[] DEFAULT '{}',

  -- Related support categories
  related_ticket_categories TEXT[] DEFAULT '{}',

  -- Metrics
  view_count INTEGER DEFAULT 0 CHECK (view_count >= 0),
  helpful_count INTEGER DEFAULT 0 CHECK (helpful_count >= 0),
  not_helpful_count INTEGER DEFAULT 0 CHECK (not_helpful_count >= 0),

  -- Publishing
  published BOOLEAN DEFAULT FALSE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_kb_articles_category ON kb_articles(category);
CREATE INDEX IF NOT EXISTS idx_kb_articles_tags ON kb_articles USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_kb_articles_published ON kb_articles(published, published_at DESC) WHERE published = TRUE;
CREATE INDEX IF NOT EXISTS idx_kb_articles_slug ON kb_articles(slug);
CREATE INDEX IF NOT EXISTS idx_kb_articles_helpful ON kb_articles((helpful_count - not_helpful_count) DESC);

-- Full-text search vector (French language support)
ALTER TABLE kb_articles
ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('french', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('french', coalesce(excerpt, '')), 'B') ||
    setweight(to_tsvector('french', coalesce(content, '')), 'C')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_kb_articles_search ON kb_articles USING GIN(search_vector);

-- Trigger pour auto-update updated_at
CREATE OR REPLACE FUNCTION update_kb_article_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_kb_article_updated_at ON kb_articles;

CREATE TRIGGER trigger_update_kb_article_updated_at
BEFORE UPDATE ON kb_articles
FOR EACH ROW
EXECUTE FUNCTION update_kb_article_updated_at();

-- ─────────────────────────────────────────────────────────────────
-- Function: Search articles (full-text search)
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION search_kb_articles(
  search_query TEXT,
  limit_count INTEGER DEFAULT 5,
  category_filter TEXT DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  slug TEXT,
  excerpt TEXT,
  category TEXT,
  tags TEXT[],
  view_count INTEGER,
  helpful_score INTEGER,
  relevance REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.title,
    a.slug,
    COALESCE(a.excerpt, LEFT(a.content, 200) || '...') as excerpt,
    a.category,
    a.tags,
    a.view_count,
    (a.helpful_count - a.not_helpful_count) as helpful_score,
    ts_rank(a.search_vector, websearch_to_tsquery('french', search_query)) as relevance
  FROM kb_articles a
  WHERE a.published = TRUE
  AND a.search_vector @@ websearch_to_tsquery('french', search_query)
  AND (category_filter IS NULL OR a.category = category_filter)
  ORDER BY
    relevance DESC,
    helpful_score DESC,
    view_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- ─────────────────────────────────────────────────────────────────
-- Function: Get popular articles
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_popular_kb_articles(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
  id UUID,
  title TEXT,
  slug TEXT,
  excerpt TEXT,
  category TEXT,
  view_count INTEGER,
  helpful_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.title,
    a.slug,
    COALESCE(a.excerpt, LEFT(a.content, 200) || '...') as excerpt,
    a.category,
    a.view_count,
    (a.helpful_count - a.not_helpful_count) as helpful_score
  FROM kb_articles a
  WHERE a.published = TRUE
  ORDER BY
    a.view_count DESC,
    helpful_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- ─────────────────────────────────────────────────────────────────
-- Function: Get articles by category
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_kb_articles_by_category(
  p_category TEXT,
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  slug TEXT,
  excerpt TEXT,
  tags TEXT[],
  view_count INTEGER,
  published_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.title,
    a.slug,
    COALESCE(a.excerpt, LEFT(a.content, 200) || '...') as excerpt,
    a.tags,
    a.view_count,
    a.published_at
  FROM kb_articles a
  WHERE a.published = TRUE
  AND a.category = p_category
  ORDER BY a.published_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- ─────────────────────────────────────────────────────────────────
-- Function: Increment article view count
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION increment_article_view(p_article_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE kb_articles
  SET view_count = view_count + 1
  WHERE id = p_article_id;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────────
-- Function: Mark article as helpful/not helpful
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION mark_article_helpful(
  p_article_id UUID,
  p_is_helpful BOOLEAN
)
RETURNS void AS $$
BEGIN
  IF p_is_helpful THEN
    UPDATE kb_articles
    SET helpful_count = helpful_count + 1
    WHERE id = p_article_id;
  ELSE
    UPDATE kb_articles
    SET not_helpful_count = not_helpful_count + 1
    WHERE id = p_article_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────────
-- Function: Get KB stats
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_kb_stats()
RETURNS TABLE(
  total_articles BIGINT,
  published_articles BIGINT,
  total_views BIGINT,
  avg_helpful_score NUMERIC,
  categories_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_articles,
    COUNT(*) FILTER (WHERE published = TRUE) as published_articles,
    SUM(view_count) as total_views,
    AVG(helpful_count - not_helpful_count) as avg_helpful_score,
    COUNT(DISTINCT category) as categories_count
  FROM kb_articles;
END;
$$ LANGUAGE plpgsql STABLE;

-- ─────────────────────────────────────────────────────────────────
-- RLS Policies
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE kb_articles ENABLE ROW LEVEL SECURITY;

-- Everyone can view published articles (no auth required)
CREATE POLICY "Anyone can view published articles"
ON kb_articles FOR SELECT
USING (published = TRUE);

-- Only admins can create/update/delete articles
CREATE POLICY "Admins can manage articles"
ON kb_articles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- ─────────────────────────────────────────────────────────────────
-- Seed Data - Common Support Articles
-- ─────────────────────────────────────────────────────────────────

INSERT INTO kb_articles (title, slug, content, excerpt, category, tags, related_ticket_categories, published, published_at) VALUES

-- Getting Started
('Comment créer mon premier projet', 'comment-creer-premier-projet',
'Pour créer votre premier projet dans Hive OS:\n\n1. Connectez-vous à votre compte\n2. Cliquez sur "+ Nouveau Projet" dans le dashboard\n3. Remplissez les informations de base (nom, description)\n4. Sélectionnez vos agents IA (Luna, Sora, Marcus, Milo)\n5. Cliquez sur "Créer le projet"\n\nVotre projet est maintenant créé et vous pouvez commencer à interagir avec vos agents IA!',
'Guide pas-à-pas pour créer votre premier projet dans Hive OS et démarrer avec les agents IA.',
'getting-started',
ARRAY['projet', 'démarrage', 'création'],
ARRAY['question'],
TRUE,
NOW()),

-- Features
('Comprendre les rôles des agents IA', 'roles-agents-ia',
'Hive OS propose 4 agents IA spécialisés:\n\n**Luna (SEO & Content)**: Expert en référencement naturel, recherche de mots-clés, optimisation de contenu, audit SEO.\n\n**Sora (Analytics & Tracking)**: Analyse Google Analytics 4, suivi des conversions, détection de problèmes de tracking, configuration GTM.\n\n**Marcus (Ads & Campaigns)**: Création et gestion de campagnes publicitaires (Google Ads, Meta Ads, LinkedIn), optimisation du budget.\n\n**Milo (Creative & Media)**: Génération d''images, vidéos, audio, création de visuels pour vos campagnes marketing.\n\nChaque agent peut être interrogé via le chat en mentionnant leur nom.',
'Découvrez les 4 agents IA spécialisés de Hive OS et leurs domaines d''expertise.',
'features',
ARRAY['agents', 'ia', 'luna', 'sora', 'marcus', 'milo'],
ARRAY['question'],
TRUE,
NOW()),

-- Integrations
('Configurer le tracking Google Analytics 4', 'configurer-ga4-tracking',
'Pour configurer le tracking GA4 avec Hive OS:\n\n1. Assurez-vous d''avoir un compte Google Analytics 4\n2. Récupérez votre ID de mesure (G-XXXXXXXXXX)\n3. Dans Hive OS, allez dans les paramètres du projet\n4. Section "Intégrations", ajoutez votre ID GA4\n5. Demandez à Sora de vérifier que le tracking fonctionne\n\nSora peut détecter automatiquement les erreurs de configuration et vous suggérer des corrections.',
'Guide pour connecter Google Analytics 4 à votre projet Hive OS.',
'integrations',
ARRAY['ga4', 'analytics', 'tracking', 'google'],
ARRAY['integration', 'question'],
TRUE,
NOW()),

('Installer le pixel Meta (Facebook) sur mon site', 'installer-pixel-meta-facebook',
'Pour installer le pixel Meta:\n\n1. Créez un pixel dans Facebook Business Manager\n2. Copiez l''ID du pixel\n3. Ajoutez le code fourni dans le <head> de votre site\n4. Utilisez Sora pour vérifier que le pixel fire correctement\n\nSi vous rencontrez des problèmes, Marcus peut vous aider à diagnostiquer les erreurs de tracking.',
'Instructions pour installer et vérifier le pixel de tracking Meta (Facebook).',
'integrations',
ARRAY['meta', 'facebook', 'pixel', 'tracking'],
ARRAY['integration', 'bug'],
TRUE,
NOW()),

-- Troubleshooting
('Le pixel de tracking ne fonctionne pas', 'pixel-tracking-ne-fonctionne-pas',
'Si votre pixel de tracking ne fonctionne pas:\n\n1. Vérifiez que le code est bien dans le <head> de toutes les pages\n2. Utilisez l''extension "Meta Pixel Helper" ou "Tag Assistant" de Google\n3. Demandez à Sora d''auditer votre configuration\n4. Vérifiez que vous n''avez pas de bloqueurs de publicité actifs\n5. Testez en navigation privée\n\nSi le problème persiste, créez un ticket de support avec les détails de votre configuration.',
'Solutions aux problèmes courants de pixels de tracking qui ne fonctionnent pas.',
'troubleshooting',
ARRAY['pixel', 'tracking', 'bug', 'erreur'],
ARRAY['bug', 'integration'],
TRUE,
NOW()),

('L''agent ne répond plus', 'agent-ne-repond-plus',
'Si un agent IA ne répond plus:\n\n1. Rafraîchissez la page (F5)\n2. Vérifiez votre connexion internet\n3. Essayez de reformuler votre question\n4. Si l''erreur persiste, consultez la console du navigateur (F12)\n5. Créez un ticket de support avec le message d''erreur\n\nLa plupart des problèmes sont résolus par un simple rafraîchissement.',
'Que faire si un agent IA ne répond plus à vos messages.',
'troubleshooting',
ARRAY['agent', 'erreur', 'bug', 'blocage'],
ARRAY['bug'],
TRUE,
NOW()),

-- Billing
('Comprendre ma facturation', 'comprendre-facturation',
'Votre facturation Hive OS est basée sur:\n\n**Plan Free**: 10 requêtes/mois, 1 projet\n**Plan Pro**: 500 requêtes/mois, projets illimités, support prioritaire\n**Plan Enterprise**: Requêtes illimitées, SLA garanti, support dédié\n\nVous pouvez consulter votre consommation dans "Paramètres > Facturation". Les requêtes incluent chaque interaction avec un agent IA.',
'Explication du système de facturation et des différents plans tarifaires.',
'billing',
ARRAY['facturation', 'prix', 'plan', 'abonnement'],
ARRAY['billing', 'question'],
TRUE,
NOW());

-- ─────────────────────────────────────────────────────────────────
-- Comments for documentation
-- ─────────────────────────────────────────────────────────────────

COMMENT ON TABLE kb_articles IS 'Base de connaissances - articles d''aide et documentation';
COMMENT ON COLUMN kb_articles.search_vector IS 'Vecteur de recherche full-text (français)';
COMMENT ON COLUMN kb_articles.related_ticket_categories IS 'Catégories de tickets liées (pour suggestions automatiques)';
COMMENT ON COLUMN kb_articles.helpful_count IS 'Nombre de votes "utile"';
COMMENT ON COLUMN kb_articles.not_helpful_count IS 'Nombre de votes "pas utile"';

COMMENT ON FUNCTION search_kb_articles(TEXT, INTEGER, TEXT) IS 'Recherche full-text dans les articles publiés';
COMMENT ON FUNCTION get_popular_kb_articles(INTEGER) IS 'Retourne les articles les plus consultés';
COMMENT ON FUNCTION increment_article_view(UUID) IS 'Incrémente le compteur de vues d''un article';
COMMENT ON FUNCTION mark_article_helpful(UUID, BOOLEAN) IS 'Enregistre un vote utile/pas utile';
-- ═══════════════════════════════════════════════════════════════
-- Support Ticket System - Phase 3: Ticket Templates
-- Migration 023
-- ═══════════════════════════════════════════════════════════════

-- Table pour les templates de tickets
CREATE TABLE IF NOT EXISTS ticket_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template info
  name TEXT NOT NULL CHECK (LENGTH(name) >= 3 AND LENGTH(name) <= 100),
  description TEXT CHECK (LENGTH(description) <= 500),

  -- Template content
  category ticket_category NOT NULL,
  subject_template TEXT NOT NULL,
  description_template TEXT NOT NULL,

  -- Visibility
  is_public BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,

  -- Metrics
  usage_count INTEGER DEFAULT 0 CHECK (usage_count >= 0),

  -- Author
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_templates_public ON ticket_templates(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_templates_featured ON ticket_templates(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_templates_category ON ticket_templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_usage ON ticket_templates(usage_count DESC);

-- Trigger pour auto-update updated_at
CREATE OR REPLACE FUNCTION update_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_template_updated_at ON ticket_templates;

CREATE TRIGGER trigger_update_template_updated_at
BEFORE UPDATE ON ticket_templates
FOR EACH ROW
EXECUTE FUNCTION update_template_updated_at();

-- ─────────────────────────────────────────────────────────────────
-- Function: Get public templates
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_public_templates(category_filter ticket_category DEFAULT NULL)
RETURNS TABLE(
  id UUID,
  name TEXT,
  description TEXT,
  category ticket_category,
  subject_template TEXT,
  description_template TEXT,
  is_featured BOOLEAN,
  usage_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.name,
    t.description,
    t.category,
    t.subject_template,
    t.description_template,
    t.is_featured,
    t.usage_count
  FROM ticket_templates t
  WHERE t.is_public = TRUE
  AND (category_filter IS NULL OR t.category = category_filter)
  ORDER BY
    t.is_featured DESC,
    t.usage_count DESC,
    t.name ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ─────────────────────────────────────────────────────────────────
-- Function: Increment template usage
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION increment_template_usage(p_template_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE ticket_templates
  SET usage_count = usage_count + 1
  WHERE id = p_template_id;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────────
-- RLS Policies
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE ticket_templates ENABLE ROW LEVEL SECURITY;

-- Everyone can view public templates (even non-authenticated)
CREATE POLICY "Anyone can view public templates"
ON ticket_templates FOR SELECT
USING (is_public = TRUE);

-- Only admins can create/update/delete templates
CREATE POLICY "Admins can manage templates"
ON ticket_templates FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- ─────────────────────────────────────────────────────────────────
-- Seed Data - Common Ticket Templates
-- ─────────────────────────────────────────────────────────────────

INSERT INTO ticket_templates (name, description, category, subject_template, description_template, is_public, is_featured) VALUES

-- Bug Templates
('Bug - Pixel de tracking ne fonctionne pas',
'Template pour signaler un pixel de tracking non fonctionnel',
'bug',
'Le pixel [Meta/Google/TikTok/LinkedIn] ne fonctionne pas sur mon site',
'**URL de la page concernée:**
[Insérez l''URL ici]

**Pixel concerné:**
[ ] Meta Pixel (Facebook)
[ ] Google Analytics 4
[ ] Google Ads
[ ] TikTok Pixel
[ ] LinkedIn Insight Tag

**Message d''erreur (si visible):**
[Collez le message d''erreur ou une capture d''écran]

**Étapes pour reproduire le problème:**
1.
2.
3.

**Comportement attendu:**
[Décrivez ce qui devrait se passer normalement]

**Informations supplémentaires:**
- Navigateur utilisé: [Chrome/Firefox/Safari/Edge]
- A-t-il déjà fonctionné avant? [Oui/Non]
- Date du dernier changement sur le site: [Date]',
TRUE,
TRUE),

('Bug - Agent IA ne répond plus',
'Template pour signaler qu''un agent IA ne répond pas',
'bug',
'L''agent [Luna/Sora/Marcus/Milo] ne répond plus',
'**Agent concerné:**
[ ] Luna (SEO & Content)
[ ] Sora (Analytics & Tracking)
[ ] Marcus (Ads & Campaigns)
[ ] Milo (Creative & Media)

**Contexte:**
Projet: [Nom du projet]
Dernière question posée: [Votre dernière question]

**Comportement observé:**
[ ] L''agent ne répond pas du tout
[ ] L''agent affiche une erreur
[ ] L''agent tourne en boucle
[ ] Autre: [Précisez]

**Message d''erreur (si affiché):**
[Collez le message d''erreur ici]

**Étapes pour reproduire:**
1.
2.
3.

**Informations supplémentaires:**
- Ce problème a commencé: [Aujourd''hui / Depuis X jours]
- Rafraîchir la page a-t-il aidé? [Oui/Non]',
TRUE,
TRUE),

-- Feature Request Templates
('Feature Request - Nouvelle intégration',
'Template pour demander l''intégration d''une nouvelle plateforme',
'feature_request',
'Demande d''intégration avec [Nom de la plateforme]',
'**Plateforme souhaitée:**
[Ex: Shopify, WooCommerce, HubSpot, Mailchimp, etc.]

**Cas d''usage:**
[Décrivez comment cette intégration améliorerait votre workflow]

**Fonctionnalités attendues:**
- [ ] Synchronisation des données
- [ ] Tracking automatique
- [ ] Création de campagnes
- [ ] Reporting intégré
- [ ] Autre: [Précisez]

**Données à synchroniser:**
[Ex: commandes, clients, produits, événements, etc.]

**Fréquence d''utilisation:**
[ ] Quotidienne
[ ] Hebdomadaire
[ ] Mensuelle
[ ] Occasionnelle

**Urgence:**
[ ] Critique (bloquant)
[ ] Haute (amélioration majeure)
[ ] Moyenne (nice to have)
[ ] Basse (suggestion)',
TRUE,
TRUE),

('Feature Request - Amélioration agent',
'Template pour suggérer une amélioration d''un agent IA',
'feature_request',
'Suggestion d''amélioration pour l''agent [Luna/Sora/Marcus/Milo]',
'**Agent concerné:**
[ ] Luna (SEO & Content)
[ ] Sora (Analytics & Tracking)
[ ] Marcus (Ads & Campaigns)
[ ] Milo (Creative & Media)

**Amélioration suggérée:**
[Décrivez la fonctionnalité souhaitée en détail]

**Problème actuel:**
[Qu''est-ce qui est difficile/impossible à faire aujourd''hui?]

**Solution proposée:**
[Comment cette amélioration résoudrait le problème?]

**Exemples d''utilisation:**
1.
2.
3.

**Impact:**
Cette amélioration me permettrait de: [Décrire les bénéfices]',
TRUE,
FALSE),

-- Question Templates
('Question - Comment faire pour...',
'Template pour poser une question sur l''utilisation',
'question',
'Comment faire pour [action souhaitée]?',
'**Ce que j''essaie de faire:**
[Décrivez votre objectif]

**Ce que j''ai déjà essayé:**
1.
2.
3.

**Où je bloque:**
[Décrivez précisément où vous êtes bloqué]

**Captures d''écran (si applicable):**
[Ajoutez des captures d''écran pour illustrer]

**Contexte:**
- Projet: [Nom du projet]
- Agent utilisé: [Luna/Sora/Marcus/Milo]
- Documentation consultée: [Oui/Non - Si oui, laquelle?]',
TRUE,
FALSE),

-- Billing Templates
('Billing - Question sur ma facturation',
'Template pour les questions de facturation',
'billing',
'Question concernant ma facturation',
'**Type de question:**
[ ] Demande de facture
[ ] Question sur mon abonnement
[ ] Changement de plan
[ ] Problème de paiement
[ ] Remboursement
[ ] Autre: [Précisez]

**Détails:**
[Décrivez votre question ou demande]

**Informations complémentaires:**
- Plan actuel: [Free/Pro/Enterprise]
- Période concernée: [Mois/Année]
- Email de facturation: [Votre email]

**Documents joints (si applicable):**
[Ajoutez facture, reçu, etc.]',
TRUE,
FALSE),

-- Integration Templates
('Integration - Problème WordPress',
'Template pour les problèmes d''intégration WordPress',
'integration',
'Problème d''intégration avec mon site WordPress',
'**Type de problème:**
[ ] Installation du plugin
[ ] Configuration du tracking
[ ] Synchronisation des données
[ ] Erreur lors de la connexion
[ ] Autre: [Précisez]

**Informations WordPress:**
- Version WordPress: [Ex: 6.4.2]
- Thème utilisé: [Nom du thème]
- Plugins actifs: [Liste des principaux plugins]
- URL du site: [URL]

**Message d''erreur (si affiché):**
[Collez le message d''erreur complet]

**Étapes effectuées:**
1.
2.
3.

**Logs (si disponibles):**
[Collez les logs d''erreur WordPress]',
TRUE,
FALSE);

-- ─────────────────────────────────────────────────────────────────
-- Comments for documentation
-- ─────────────────────────────────────────────────────────────────

COMMENT ON TABLE ticket_templates IS 'Templates pré-remplis pour accélérer la création de tickets';
COMMENT ON COLUMN ticket_templates.subject_template IS 'Template du sujet (peut contenir des placeholders)';
COMMENT ON COLUMN ticket_templates.description_template IS 'Template de la description (markdown supporté)';
COMMENT ON COLUMN ticket_templates.is_featured IS 'Afficher en priorité dans la liste';
COMMENT ON COLUMN ticket_templates.usage_count IS 'Nombre de fois que ce template a été utilisé';

COMMENT ON FUNCTION get_public_templates(ticket_category) IS 'Retourne les templates publics, optionnellement filtrés par catégorie';
COMMENT ON FUNCTION increment_template_usage(UUID) IS 'Incrémente le compteur d''utilisation d''un template';
-- ═══════════════════════════════════════════════════════════════
-- Support Ticket System - Phase 3: Satisfaction Surveys (CSAT)
-- Migration 024
-- ═══════════════════════════════════════════════════════════════

-- Table pour les enquêtes de satisfaction
CREATE TABLE IF NOT EXISTS ticket_satisfaction (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relation avec le ticket (1-to-1)
  ticket_id UUID UNIQUE NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Rating & Feedback
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT CHECK (LENGTH(feedback) <= 2000),

  -- Tags (what went well / what could be better)
  positive_tags TEXT[] DEFAULT '{}',
  negative_tags TEXT[] DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_satisfaction_ticket ON ticket_satisfaction(ticket_id);
CREATE INDEX IF NOT EXISTS idx_satisfaction_user ON ticket_satisfaction(user_id);
CREATE INDEX IF NOT EXISTS idx_satisfaction_rating ON ticket_satisfaction(rating);
CREATE INDEX IF NOT EXISTS idx_satisfaction_created ON ticket_satisfaction(created_at DESC);

-- Trigger pour auto-update updated_at
CREATE OR REPLACE FUNCTION update_satisfaction_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_satisfaction_updated_at ON ticket_satisfaction;

CREATE TRIGGER trigger_update_satisfaction_updated_at
BEFORE UPDATE ON ticket_satisfaction
FOR EACH ROW
EXECUTE FUNCTION update_satisfaction_updated_at();

-- ─────────────────────────────────────────────────────────────────
-- Materialized View: CSAT Metrics
-- ─────────────────────────────────────────────────────────────────

CREATE MATERIALIZED VIEW IF NOT EXISTS ticket_csat_metrics AS
SELECT
  DATE(ts.created_at) as date,
  COUNT(*) as total_responses,
  AVG(ts.rating) as avg_rating,

  -- Count by rating
  COUNT(CASE WHEN ts.rating = 5 THEN 1 END) as rating_5_count,
  COUNT(CASE WHEN ts.rating = 4 THEN 1 END) as rating_4_count,
  COUNT(CASE WHEN ts.rating = 3 THEN 1 END) as rating_3_count,
  COUNT(CASE WHEN ts.rating = 2 THEN 1 END) as rating_2_count,
  COUNT(CASE WHEN ts.rating = 1 THEN 1 END) as rating_1_count,

  -- Satisfaction metrics
  COUNT(CASE WHEN ts.rating >= 4 THEN 1 END) as satisfied_count,
  COUNT(CASE WHEN ts.rating <= 2 THEN 1 END) as unsatisfied_count,

  -- CSAT Score (% satisfied)
  ROUND(100.0 * COUNT(CASE WHEN ts.rating >= 4 THEN 1 END) / NULLIF(COUNT(*), 0), 2) as csat_percentage,

  -- NPS-like score (-100 to 100)
  ROUND(
    100.0 * (
      COUNT(CASE WHEN ts.rating >= 4 THEN 1 END) -
      COUNT(CASE WHEN ts.rating <= 2 THEN 1 END)
    ) / NULLIF(COUNT(*), 0),
    2
  ) as nps_score

FROM ticket_satisfaction ts
GROUP BY DATE(ts.created_at)
ORDER BY date DESC;

CREATE INDEX IF NOT EXISTS idx_csat_metrics_date ON ticket_csat_metrics(date DESC);

-- ─────────────────────────────────────────────────────────────────
-- Function: Get CSAT summary
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_csat_summary(days_back INTEGER DEFAULT 30)
RETURNS TABLE(
  total_responses BIGINT,
  avg_rating NUMERIC,
  csat_percentage NUMERIC,
  nps_score NUMERIC,
  rating_5_count BIGINT,
  rating_4_count BIGINT,
  rating_3_count BIGINT,
  rating_2_count BIGINT,
  rating_1_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_responses,
    ROUND(AVG(ts.rating)::NUMERIC, 2) as avg_rating,
    ROUND(100.0 * COUNT(CASE WHEN ts.rating >= 4 THEN 1 END) / NULLIF(COUNT(*), 0), 2) as csat_percentage,
    ROUND(
      100.0 * (
        COUNT(CASE WHEN ts.rating >= 4 THEN 1 END) -
        COUNT(CASE WHEN ts.rating <= 2 THEN 1 END)
      ) / NULLIF(COUNT(*), 0),
      2
    ) as nps_score,
    COUNT(CASE WHEN ts.rating = 5 THEN 1 END) as rating_5_count,
    COUNT(CASE WHEN ts.rating = 4 THEN 1 END) as rating_4_count,
    COUNT(CASE WHEN ts.rating = 3 THEN 1 END) as rating_3_count,
    COUNT(CASE WHEN ts.rating = 2 THEN 1 END) as rating_2_count,
    COUNT(CASE WHEN ts.rating = 1 THEN 1 END) as rating_1_count
  FROM ticket_satisfaction ts
  WHERE ts.created_at >= NOW() - (days_back || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────
-- Function: Check if ticket has survey
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION ticket_has_survey(p_ticket_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM ticket_satisfaction
    WHERE ticket_id = p_ticket_id
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ─────────────────────────────────────────────────────────────────
-- Function: Get satisfaction for ticket
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_ticket_satisfaction(p_ticket_id UUID)
RETURNS TABLE(
  id UUID,
  rating SMALLINT,
  feedback TEXT,
  positive_tags TEXT[],
  negative_tags TEXT[],
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ts.id,
    ts.rating,
    ts.feedback,
    ts.positive_tags,
    ts.negative_tags,
    ts.created_at
  FROM ticket_satisfaction ts
  WHERE ts.ticket_id = p_ticket_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- ─────────────────────────────────────────────────────────────────
-- Function: Get low-rated tickets (for improvement)
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_low_rated_tickets(
  days_back INTEGER DEFAULT 30,
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE(
  ticket_id UUID,
  subject TEXT,
  rating SMALLINT,
  feedback TEXT,
  resolved_at TIMESTAMPTZ,
  user_email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    st.id as ticket_id,
    st.subject,
    ts.rating,
    ts.feedback,
    st.resolved_at,
    au.email as user_email
  FROM ticket_satisfaction ts
  JOIN support_tickets st ON ts.ticket_id = st.id
  LEFT JOIN auth.users au ON ts.user_id = au.id
  WHERE ts.rating <= 2
  AND ts.created_at >= NOW() - (days_back || ' days')::INTERVAL
  ORDER BY ts.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────
-- Function: Refresh CSAT metrics
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION refresh_csat_metrics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW ticket_csat_metrics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────
-- RLS Policies
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE ticket_satisfaction ENABLE ROW LEVEL SECURITY;

-- Users can view their own satisfaction responses
CREATE POLICY "Users can view their own satisfaction"
ON ticket_satisfaction FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can create satisfaction for their own tickets (once)
CREATE POLICY "Users can create satisfaction for own tickets"
ON ticket_satisfaction FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM support_tickets
    WHERE id = ticket_id
    AND user_id = auth.uid()
    AND status IN ('resolved', 'closed')
  )
);

-- Users can update their own satisfaction (within 24h)
CREATE POLICY "Users can update their own satisfaction"
ON ticket_satisfaction FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  AND created_at >= NOW() - INTERVAL '24 hours'
);

-- Admins can view all satisfaction
CREATE POLICY "Admins can view all satisfaction"
ON ticket_satisfaction FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- ─────────────────────────────────────────────────────────────────
-- Comments for documentation
-- ─────────────────────────────────────────────────────────────────

COMMENT ON TABLE ticket_satisfaction IS 'Enquêtes de satisfaction (CSAT) post-résolution de tickets';
COMMENT ON COLUMN ticket_satisfaction.rating IS 'Note de 1 (très insatisfait) à 5 (très satisfait)';
COMMENT ON COLUMN ticket_satisfaction.positive_tags IS 'Tags positifs (ex: réponse rapide, solution efficace)';
COMMENT ON COLUMN ticket_satisfaction.negative_tags IS 'Tags négatifs (ex: temps d''attente, solution incomplète)';

COMMENT ON MATERIALIZED VIEW ticket_csat_metrics IS 'Métriques CSAT agrégées par jour';
COMMENT ON FUNCTION get_csat_summary(INTEGER) IS 'Résumé CSAT sur N jours';
COMMENT ON FUNCTION get_low_rated_tickets(INTEGER, INTEGER) IS 'Tickets mal notés pour analyse';
COMMENT ON FUNCTION refresh_csat_metrics() IS 'Rafraîchit la vue matérialisée CSAT';
-- ═══════════════════════════════════════════════════════════════
-- Support Ticket System - Phase 3: Admin Response Templates
-- Migration 025
-- ═══════════════════════════════════════════════════════════════

-- Table pour les templates de réponses (admin uniquement)
CREATE TABLE IF NOT EXISTS admin_response_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template info
  title TEXT NOT NULL CHECK (LENGTH(title) >= 3 AND LENGTH(title) <= 100),
  body TEXT NOT NULL CHECK (LENGTH(body) >= 10),

  -- Categorization
  category ticket_category, -- Optionnel: pour filtrer par type de ticket
  language TEXT DEFAULT 'fr' CHECK (language IN ('fr', 'en')),

  -- Metadata
  is_shared BOOLEAN DEFAULT TRUE, -- Visible par tous les admins
  usage_count INTEGER DEFAULT 0 CHECK (usage_count >= 0),

  -- Author
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_response_templates_category ON admin_response_templates(category);
CREATE INDEX IF NOT EXISTS idx_response_templates_shared ON admin_response_templates(is_shared) WHERE is_shared = TRUE;
CREATE INDEX IF NOT EXISTS idx_response_templates_usage ON admin_response_templates(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_response_templates_created_by ON admin_response_templates(created_by);

-- Trigger pour auto-update updated_at
CREATE OR REPLACE FUNCTION update_response_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_response_template_updated_at ON admin_response_templates;

CREATE TRIGGER trigger_update_response_template_updated_at
BEFORE UPDATE ON admin_response_templates
FOR EACH ROW
EXECUTE FUNCTION update_response_template_updated_at();

-- ─────────────────────────────────────────────────────────────────
-- Function: Get response templates (admin only)
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_response_templates(
  category_filter ticket_category DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  body TEXT,
  category ticket_category,
  is_shared BOOLEAN,
  usage_count INTEGER,
  created_by UUID
) AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();

  RETURN QUERY
  SELECT
    t.id,
    t.title,
    t.body,
    t.category,
    t.is_shared,
    t.usage_count,
    t.created_by
  FROM admin_response_templates t
  WHERE (
    -- Shared templates visible to all admins
    t.is_shared = TRUE
    -- Or templates created by current user
    OR t.created_by = v_user_id
  )
  AND (category_filter IS NULL OR t.category = category_filter)
  ORDER BY
    t.usage_count DESC,
    t.title ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────
-- Function: Increment template usage
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION increment_response_template_usage(p_template_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE admin_response_templates
  SET usage_count = usage_count + 1
  WHERE id = p_template_id;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────────
-- RLS Policies
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE admin_response_templates ENABLE ROW LEVEL SECURITY;

-- Only admins can view templates
CREATE POLICY "Admins can view response templates"
ON admin_response_templates FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Only admins can create templates
CREATE POLICY "Admins can create response templates"
ON admin_response_templates FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
  AND created_by = auth.uid()
);

-- Admins can update their own templates or shared templates
CREATE POLICY "Admins can update response templates"
ON admin_response_templates FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
  AND (created_by = auth.uid() OR is_shared = TRUE)
);

-- Admins can only delete their own templates
CREATE POLICY "Admins can delete own response templates"
ON admin_response_templates FOR DELETE
TO authenticated
USING (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- ─────────────────────────────────────────────────────────────────
-- Seed Data - Common Response Templates
-- ─────────────────────────────────────────────────────────────────

INSERT INTO admin_response_templates (title, body, category, is_shared) VALUES

-- Bug responses
('Merci pour le signalement - Investigation en cours',
'Bonjour,

Merci d''avoir signalé ce problème. Notre équipe technique est actuellement en train d''investiguer.

Je vous tiendrai informé de l''avancement dès que nous aurons identifié la cause.

Cordialement,
L''équipe support Hive OS',
'bug',
TRUE),

('Bug corrigé - Déploiement imminent',
'Bonjour,

Bonne nouvelle! Le bug que vous avez signalé a été corrigé et sera déployé dans la prochaine mise à jour (prévu sous 24-48h).

Vous recevrez une notification dès que le correctif sera en ligne.

Merci de votre patience!

Cordialement,
L''équipe support Hive OS',
'bug',
TRUE),

('Besoin d''informations supplémentaires',
'Bonjour,

Pour mieux vous aider à résoudre ce problème, pourriez-vous nous fournir les informations suivantes:

- [Information 1]
- [Information 2]
- [Information 3]

Merci de votre collaboration!

Cordialement,
L''équipe support Hive OS',
'bug',
TRUE),

-- Feature request responses
('Fonctionnalité en roadmap',
'Bonjour,

Merci pour cette excellente suggestion! Cette fonctionnalité est actuellement dans notre roadmap produit.

Nous vous notifierons par email dès qu''elle sera disponible.

N''hésitez pas à nous partager d''autres idées!

Cordialement,
L''équipe support Hive OS',
'feature_request',
TRUE),

('Fonctionnalité déjà disponible',
'Bonjour,

Bonne nouvelle! Cette fonctionnalité est déjà disponible dans Hive OS.

Voici comment l''utiliser:
[Instructions ici]

Documentation: [Lien vers la doc]

N''hésitez pas si vous avez besoin d''aide!

Cordialement,
L''équipe support Hive OS',
'feature_request',
TRUE),

-- Question responses
('Réponse FAQ',
'Bonjour,

Merci pour votre question!

[Réponse ici]

Pour plus d''informations, consultez notre documentation:
[Lien vers la doc]

N''hésitez pas si vous avez d''autres questions!

Cordialement,
L''équipe support Hive OS',
'question',
TRUE),

-- Integration responses
('Guide configuration intégration',
'Bonjour,

Voici les étapes pour configurer cette intégration:

1. [Étape 1]
2. [Étape 2]
3. [Étape 3]

Si vous rencontrez des difficultés, n''hésitez pas à nous partager:
- Votre configuration actuelle
- Les messages d''erreur éventuels
- Des captures d''écran

Cordialement,
L''équipe support Hive OS',
'integration',
TRUE),

-- Billing responses
('Informations facturation',
'Bonjour,

Voici les informations concernant votre facturation:

[Informations ici]

Vous pouvez consulter toutes vos factures dans: Paramètres > Facturation

N''hésitez pas si vous avez d''autres questions!

Cordialement,
L''équipe support Hive OS',
'billing',
TRUE),

-- General templates
('Ticket résolu - Confirmation',
'Bonjour,

Je viens de marquer votre ticket comme résolu.

Si le problème persiste ou si vous avez d''autres questions, n''hésitez pas à rouvrir ce ticket ou à en créer un nouveau.

Merci de votre confiance!

Cordialement,
L''équipe support Hive OS',
NULL,
TRUE),

('Redirection vers la documentation',
'Bonjour,

Merci pour votre message!

Vous trouverez la réponse à votre question dans notre documentation:
[Lien vers la doc]

Si après lecture vous avez encore des questions, n''hésitez pas à revenir vers nous!

Cordialement,
L''équipe support Hive OS',
NULL,
TRUE);

-- ─────────────────────────────────────────────────────────────────
-- Comments for documentation
-- ─────────────────────────────────────────────────────────────────

COMMENT ON TABLE admin_response_templates IS 'Templates de réponses pré-formatées pour les admins';
COMMENT ON COLUMN admin_response_templates.is_shared IS 'Visible par tous les admins (sinon uniquement par le créateur)';
COMMENT ON COLUMN admin_response_templates.usage_count IS 'Nombre de fois que ce template a été utilisé';

COMMENT ON FUNCTION get_response_templates(ticket_category) IS 'Retourne les templates accessibles à l''admin courant';
COMMENT ON FUNCTION increment_response_template_usage(UUID) IS 'Incrémente le compteur d''utilisation d''un template';
-- ═══════════════════════════════════════════════════════════════
-- Support Ticket System - Phase 3: Duplicate Detection (Vector Search)
-- Migration 026
-- ═══════════════════════════════════════════════════════════════

-- Install pgvector extension for similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to support_tickets
ALTER TABLE support_tickets
ADD COLUMN IF NOT EXISTS embedding vector(1536), -- OpenAI text-embedding-ada-002 dimension
ADD COLUMN IF NOT EXISTS embedding_generated_at TIMESTAMPTZ;

-- Create index for fast similarity search
-- Using ivfflat for approximate nearest neighbor search
CREATE INDEX IF NOT EXISTS idx_tickets_embedding_cosine ON support_tickets
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100); -- Adjust lists based on dataset size (sqrt of total rows)

-- ─────────────────────────────────────────────────────────────────
-- Function: Find similar tickets by embedding
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION find_similar_tickets(
  ticket_embedding vector(1536),
  current_ticket_id UUID DEFAULT NULL,
  similarity_threshold FLOAT DEFAULT 0.80,
  limit_count INTEGER DEFAULT 5
)
RETURNS TABLE(
  id UUID,
  ticket_number TEXT,
  subject TEXT,
  description TEXT,
  category ticket_category,
  status ticket_status,
  priority ticket_priority,
  created_at TIMESTAMPTZ,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    st.id,
    format_ticket_number(st.id) as ticket_number,
    st.subject,
    st.description,
    st.category,
    st.status,
    st.priority,
    st.created_at,
    -- Calculate cosine similarity (1 - cosine distance)
    (1 - (st.embedding <=> ticket_embedding))::FLOAT as similarity
  FROM support_tickets st
  WHERE st.embedding IS NOT NULL
    -- Exclude current ticket
    AND (current_ticket_id IS NULL OR st.id != current_ticket_id)
    -- Only include tickets above similarity threshold
    AND (1 - (st.embedding <=> ticket_embedding)) > similarity_threshold
  ORDER BY st.embedding <=> ticket_embedding ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────
-- Function: Find duplicates for a ticket by ID
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION find_ticket_duplicates(
  p_ticket_id UUID,
  similarity_threshold FLOAT DEFAULT 0.80,
  limit_count INTEGER DEFAULT 5
)
RETURNS TABLE(
  id UUID,
  ticket_number TEXT,
  subject TEXT,
  description TEXT,
  category ticket_category,
  status ticket_status,
  priority ticket_priority,
  created_at TIMESTAMPTZ,
  similarity FLOAT
) AS $$
DECLARE
  v_embedding vector(1536);
BEGIN
  -- Get the embedding of the current ticket
  SELECT embedding INTO v_embedding
  FROM support_tickets
  WHERE id = p_ticket_id;

  -- If no embedding, return empty
  IF v_embedding IS NULL THEN
    RETURN;
  END IF;

  -- Find similar tickets
  RETURN QUERY
  SELECT * FROM find_similar_tickets(
    v_embedding,
    p_ticket_id,
    similarity_threshold,
    limit_count
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────
-- Function: Mark ticket as duplicate
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION mark_ticket_as_duplicate(
  p_ticket_id UUID,
  p_original_ticket_id UUID
)
RETURNS void AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();

  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = v_user_id
    AND role IN ('admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can mark tickets as duplicates';
  END IF;

  -- Update ticket status to closed
  UPDATE support_tickets
  SET
    status = 'closed',
    resolved_at = NOW()
  WHERE id = p_ticket_id;

  -- Add internal note
  INSERT INTO support_internal_notes (ticket_id, author_id, note)
  VALUES (
    p_ticket_id,
    v_user_id,
    format('Marqué comme doublon de #%s', format_ticket_number(p_original_ticket_id))
  );

  -- Add message to ticket
  INSERT INTO support_messages (ticket_id, message, sender_type)
  VALUES (
    p_ticket_id,
    format('Ce ticket a été marqué comme doublon de #%s et a été fermé.', format_ticket_number(p_original_ticket_id)),
    'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────
-- Function: Get tickets pending embedding generation
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_tickets_pending_embedding(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
  id UUID,
  subject TEXT,
  description TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    st.id,
    st.subject,
    st.description,
    st.created_at
  FROM support_tickets st
  WHERE st.embedding IS NULL
  ORDER BY st.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────
-- View: Duplicate Detection Stats
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW duplicate_detection_stats AS
SELECT
  COUNT(*) as total_tickets,
  COUNT(embedding) as tickets_with_embedding,
  COUNT(*) - COUNT(embedding) as tickets_pending_embedding,
  ROUND(100.0 * COUNT(embedding) / NULLIF(COUNT(*), 0), 2) as embedding_coverage_percentage,
  MAX(embedding_generated_at) as last_embedding_generated_at
FROM support_tickets;

-- ─────────────────────────────────────────────────────────────────
-- Comments for documentation
-- ─────────────────────────────────────────────────────────────────

COMMENT ON COLUMN support_tickets.embedding IS 'Vector embedding (OpenAI ada-002) pour la détection de doublons';
COMMENT ON COLUMN support_tickets.embedding_generated_at IS 'Date de génération de l''embedding';

COMMENT ON FUNCTION find_similar_tickets(vector, UUID, FLOAT, INTEGER) IS 'Trouve les tickets similaires par embedding';
COMMENT ON FUNCTION find_ticket_duplicates(UUID, FLOAT, INTEGER) IS 'Trouve les doublons potentiels d''un ticket';
COMMENT ON FUNCTION mark_ticket_as_duplicate(UUID, UUID) IS 'Marque un ticket comme doublon (admin uniquement)';
COMMENT ON FUNCTION get_tickets_pending_embedding(INTEGER) IS 'Retourne les tickets sans embedding';

COMMENT ON VIEW duplicate_detection_stats IS 'Statistiques de couverture des embeddings pour la détection de doublons';
