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
