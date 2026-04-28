# CMS Content Publisher — Luna Skill

## Déclencheur
- User dit : "publie cet article sur WordPress" ou "publie sur le blog"
- Tâche de type : "publication contenu"
- Write-back command `PUBLISH_CONTENT`

## Méthodologie

### 1. Vérifier Connexion CMS
Vérifier dans `user_integrations` si le CMS est connecté :
- **WordPress** : via MCP tool `wordpress-connector-server`
- **Shopify** : via MCP tool `shopify-connector-server`
- **Webflow** : via MCP tool `webflow-connector-server`

Si non connecté → demander à l'utilisateur de connecter le CMS avant de continuer.

### 2. Optimiser le Contenu pour SEO

**Meta Title** :
- Max 60 caractères
- Inclure le keyword principal
- Format suggéré : "[Keyword] : [Bénéfice] | [Marque]"
- Exemple : "SEO 2026 : 10 Stratégies qui Fonctionnent | MonSite"

**Meta Description** :
- Max 160 caractères
- Inclure keyword principal + CTA
- Format suggéré : "[Value prop]. [Bénéfice]. [CTA]"
- Exemple : "Découvrez les stratégies SEO qui génèrent du trafic en 2026. Guide complet + checklist gratuite. Lire maintenant →"

**Alt Text Images** :
- Toutes les images doivent avoir un attribut alt descriptif
- Inclure keywords naturellement si pertinent
- Format : "Description concrète de l'image + contexte"
- Exemple : "Graphique montrant l'évolution du trafic SEO sur 12 mois"

### 3. Vérifier Format
**Structure Headings** :
- 1 seul H1 (= titre de l'article)
- H2 pour les sections principales
- H3 pour les sous-sections
- Pas de saut de niveau (pas de H2 → H4 direct)

**Paragraphes Courts** :
- Max 3-4 lignes par paragraphe (lisibilité mobile)
- Ajouter des line breaks entre paragraphes

**Liens Internes** :
- Minimum 3 liens internes vers d'autres articles du site
- Texte d'ancre descriptif (pas "cliquez ici")
- Exemple : "Découvrez notre [guide complet du SEO technique](#)"

**Call-to-Action** :
- 1 CTA en fin d'article (lead magnet, newsletter, produit)
- Format bouton ou encadré visuel
- Tracking lien (UTM parameters si besoin)

### 4. Créer en Mode Brouillon
**JAMAIS publier directement** sans validation utilisateur :
- Status : `draft` (brouillon)
- Catégorie : assigner à la catégorie appropriée
- Tags : ajouter 3-5 tags pertinents
- Featured Image : vérifier présence (1200x628 recommandé)
- Author : assigner l'auteur correct

### 5. Soumettre pour Approbation
Créer une `approval_request` dans Supabase :
- Type : `content_publication`
- Contenu : lien vers le brouillon
- Metadata : meta title, meta description, featured image URL
- État : `pending`

Notifier l'utilisateur :
> "✅ Article créé en brouillon sur WordPress : [lien]
>
> **Checklist SEO validée** :
> - Meta title (58 caractères)
> - Meta description (155 caractères)
> - 12 images avec alt text
> - 5 liens internes
> - Structure H2/H3 optimisée
>
> Révise et approuve pour publication."

### 6. Une Fois Approuvé : Publier
Quand l'utilisateur approve la `approval_request` :
- Passer le status de `draft` à `publish`
- Scheduler la publication si date/heure spécifiée
- Déclencher la soumission à Google Search Console (si connecté)

### 7. Vérifier Indexation
24h après publication :
- Vérifier que l'article est indexé (Google Search Console)
- Vérifier qu'il est crawlable (robots.txt, noindex)
- Ajouter l'URL au sitemap XML

## Output Attendu

### Format JSON (Approval Request)
```json
{
  "type": "APPROVAL_REQUEST",
  "data": {
    "approval_type": "content_publication",
    "title": "Publication de l'article : Comment améliorer son SEO en 2026",
    "description": "Article créé en brouillon sur WordPress. SEO optimisé, prêt pour validation.",
    "draft_url": "https://monsite.com/wp-admin/post.php?post=1234&action=edit",
    "preview_url": "https://monsite.com/?p=1234&preview=true",
    "metadata": {
      "cms": "wordpress",
      "post_id": 1234,
      "meta_title": "SEO 2026 : 10 Stratégies qui Fonctionnent | MonSite",
      "meta_description": "Découvrez les stratégies SEO qui génèrent du trafic en 2026. Guide complet + checklist. Lire →",
      "featured_image": "https://monsite.com/wp-content/uploads/2026/04/seo-strategies.jpg",
      "category": "SEO",
      "tags": ["SEO", "Marketing Digital", "Stratégies 2026", "Trafic Organique"],
      "word_count": 2450,
      "images_count": 12,
      "internal_links": 5
    },
    "seo_checklist": [
      {"item": "Meta title < 60 chars", "status": "✅", "value": "58 caractères"},
      {"item": "Meta description < 160 chars", "status": "✅", "value": "155 caractères"},
      {"item": "Alt text sur toutes les images", "status": "✅", "value": "12/12 images"},
      {"item": "Liens internes (min 3)", "status": "✅", "value": "5 liens"},
      {"item": "Structure H2/H3", "status": "✅", "value": "1 H1, 8 H2, 12 H3"},
      {"item": "Featured image 1200x628", "status": "✅", "value": "1200x630"}
    ],
    "actions": [
      {
        "label": "✅ Approuver et Publier",
        "type": "approve",
        "callback": "publish_content"
      },
      {
        "label": "✏️ Demander Modifications",
        "type": "request_changes",
        "callback": "request_content_changes"
      },
      {
        "label": "❌ Rejeter",
        "type": "reject",
        "callback": "reject_content"
      }
    ]
  }
}
```

## Exemple d'Utilisation

**User Input:**
> "Luna, publie l'article 'Comment améliorer son SEO' sur WordPress"

**Luna Response:**
> "J'ai créé l'article en brouillon sur WordPress et optimisé pour le SEO.
>
> **✅ Checklist SEO Validée :**
> - Meta title : 'SEO 2026 : 10 Stratégies qui Fonctionnent | MonSite' (58 chars)
> - Meta description : 'Découvrez les stratégies SEO qui génèrent du trafic...' (155 chars)
> - 12 images avec alt text descriptif
> - 5 liens internes vers tes autres articles
> - Structure H1/H2/H3 optimale
> - Featured image 1200x630px
>
> **📝 Prévisualisation :**
> [Lien vers le brouillon WordPress]
>
> **Prochaine étape :**
> Révise le contenu et appuie sur 'Approuver et Publier' quand c'est bon. Une fois publié, je soumettrai automatiquement l'URL à Google Search Console pour indexation rapide."

## Notes Techniques
- Utiliser le MCP connector approprié (`wordpress-connector-server`, `shopify-connector-server`, etc.)
- Si le CMS n'est pas supporté → proposer d'exporter en HTML ou Markdown
- Toujours créer en brouillon, JAMAIS publier directement sans approbation
- Après publication, enregistrer l'URL dans `project_memory` pour référence future
- Si Google Search Console connecté → soumettre l'URL via `submit_url_for_indexing`
- Tracker la publication comme un événement dans `usage_tracking` (content_published)
