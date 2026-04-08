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
