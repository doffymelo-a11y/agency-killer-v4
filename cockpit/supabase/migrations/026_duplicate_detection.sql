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
