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
