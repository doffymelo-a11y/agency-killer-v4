// ═══════════════════════════════════════════════════════════════
// Content Sanitizer
// Nettoie le contenu HTML avant injection dans le CMS
// Évite XSS, injection de scripts, contenu malveillant
// ═══════════════════════════════════════════════════════════════

import sanitizeHtml from 'sanitize-html';

/**
 * Options de sanitization par défaut
 * Autorise les balises courantes pour du contenu marketing
 */
const DEFAULT_ALLOWED_TAGS = [
  // Structure
  'p',
  'br',
  'div',
  'span',
  'section',
  'article',
  'header',
  'footer',
  'main',
  'aside',

  // Titres
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',

  // Texte
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'mark',
  'small',
  'sub',
  'sup',
  'code',
  'pre',
  'blockquote',

  // Listes
  'ul',
  'ol',
  'li',
  'dl',
  'dt',
  'dd',

  // Liens et médias
  'a',
  'img',
  'figure',
  'figcaption',
  'picture',
  'video',
  'audio',
  'source',
  'iframe', // Pour embeds YouTube, etc.

  // Tableaux
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'caption',

  // Formulaires (pour landing pages)
  'form',
  'input',
  'textarea',
  'button',
  'select',
  'option',
  'label',
  'fieldset',
  'legend',
];

const DEFAULT_ALLOWED_ATTRIBUTES = {
  '*': ['class', 'id', 'style'], // Attributs universels
  a: ['href', 'target', 'rel', 'title'],
  img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
  iframe: ['src', 'width', 'height', 'frameborder', 'allowfullscreen'],
  video: ['src', 'controls', 'width', 'height', 'poster'],
  audio: ['src', 'controls'],
  source: ['src', 'type'],
  input: ['type', 'name', 'value', 'placeholder', 'required'],
  textarea: ['name', 'rows', 'cols', 'placeholder', 'required'],
  button: ['type', 'name'],
  select: ['name', 'required'],
  option: ['value', 'selected'],
  form: ['action', 'method'],
};

/**
 * Sanitize HTML content
 * Supprime les scripts, styles inline malveillants, etc.
 */
export function sanitizeHTML(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: DEFAULT_ALLOWED_TAGS,
    allowedAttributes: DEFAULT_ALLOWED_ATTRIBUTES,
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: {
      img: ['http', 'https', 'data'], // data: pour base64 images
      video: ['http', 'https'],
      audio: ['http', 'https'],
    },
    // Transformer les liens pour ajouter rel="noopener" si target="_blank"
    transformTags: {
      a: (tagName, attribs) => {
        if (attribs.target === '_blank' && !attribs.rel) {
          return {
            tagName,
            attribs: { ...attribs, rel: 'noopener noreferrer' },
          };
        }
        return { tagName, attribs };
      },
    },
  });
}

/**
 * Sanitize plain text (supprime tout HTML)
 */
export function sanitizePlainText(text: string): string {
  return sanitizeHtml(text, {
    allowedTags: [],
    allowedAttributes: {},
  });
}

/**
 * Sanitize URL (vérifie qu'elle est valide et sécurisée)
 */
export function sanitizeURL(url: string): string {
  try {
    const parsed = new URL(url);

    // Autoriser uniquement http/https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid protocol');
    }

    return parsed.toString();
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }
}

/**
 * Tronque le contenu à une longueur max (évite les payloads énormes)
 */
export function truncateContent(
  content: string,
  maxLength: number = 50000
): string {
  if (content.length <= maxLength) {
    return content;
  }

  return content.substring(0, maxLength) + '... [TRUNCATED]';
}

/**
 * Sanitize SEO meta fields (titre, description, etc.)
 * Plus strict que le HTML content
 */
export function sanitizeSEOMeta(meta: {
  title?: string;
  description?: string;
  canonical_url?: string;
  focus_keyword?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  twitter_title?: string;
  twitter_description?: string;
  twitter_image?: string;
  robots?: string;
}): typeof meta {
  const sanitized: typeof meta = {};

  // Texte brut pour titres et descriptions
  if (meta.title) sanitized.title = sanitizePlainText(meta.title);
  if (meta.description)
    sanitized.description = sanitizePlainText(meta.description);
  if (meta.og_title) sanitized.og_title = sanitizePlainText(meta.og_title);
  if (meta.og_description)
    sanitized.og_description = sanitizePlainText(meta.og_description);
  if (meta.twitter_title)
    sanitized.twitter_title = sanitizePlainText(meta.twitter_title);
  if (meta.twitter_description)
    sanitized.twitter_description = sanitizePlainText(meta.twitter_description);
  if (meta.focus_keyword)
    sanitized.focus_keyword = sanitizePlainText(meta.focus_keyword);

  // URLs
  if (meta.canonical_url) {
    try {
      sanitized.canonical_url = sanitizeURL(meta.canonical_url);
    } catch {
      // URL invalide, on skip
    }
  }
  if (meta.og_image) {
    try {
      sanitized.og_image = sanitizeURL(meta.og_image);
    } catch {
      // URL invalide, on skip
    }
  }
  if (meta.twitter_image) {
    try {
      sanitized.twitter_image = sanitizeURL(meta.twitter_image);
    } catch {
      // URL invalide, on skip
    }
  }

  // Robots (valider le format)
  if (meta.robots) {
    const validRobots = ['index', 'noindex', 'follow', 'nofollow'];
    const robotsParts = meta.robots.split(',').map((r) => r.trim());
    const validParts = robotsParts.filter((r) => validRobots.includes(r));
    if (validParts.length > 0) {
      sanitized.robots = validParts.join(',');
    }
  }

  return sanitized;
}

/**
 * Sanitize filename (évite les path traversal, caractères spéciaux)
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Remplacer caractères spéciaux
    .replace(/\.{2,}/g, '_') // Éviter path traversal (..)
    .substring(0, 255); // Limiter longueur
}
