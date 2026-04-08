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
