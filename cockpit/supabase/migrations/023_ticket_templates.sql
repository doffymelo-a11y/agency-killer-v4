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
