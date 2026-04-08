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
