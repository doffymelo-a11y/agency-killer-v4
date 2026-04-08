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
