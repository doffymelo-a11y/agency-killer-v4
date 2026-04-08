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
