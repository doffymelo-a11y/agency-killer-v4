# SEO Audit Complete — Luna Skill

## Déclencheur
- User dit : "audite le SEO de [site]"
- Tâche de type : "audit SEO"
- Phase : Audit

## Méthodologie

### 1. Audit Technique
- **Page Speed**: Utiliser le MCP tool `seo-audit-server` pour mesurer Core Web Vitals
  - LCP (Largest Contentful Paint) : doit être < 2.5s
  - FID (First Input Delay) : doit être < 100ms
  - CLS (Cumulative Layout Shift) : doit être < 0.1
- **Mobile-Friendly**: Tester la version mobile (viewport, responsive design)
- **HTTPS**: Vérifier que le site est sécurisé (SSL actif)
- **Indexabilité**: Vérifier robots.txt, sitemap.xml, balises meta robots
- **Structure URL**: URLs propres, pas de paramètres inutiles

### 2. Audit On-Page
- **Meta Titles**: Max 60 caractères, keyword principal en début
- **Meta Descriptions**: Max 160 caractères, call-to-action clair
- **Structure H1-H6**: H1 unique par page, hiérarchie logique
- **Keyword Density**: 1-2% pour le keyword principal (pas de keyword stuffing)
- **Images Alt**: Toutes les images doivent avoir un attribut alt descriptif
- **Liens Internes**: Minimum 3 liens internes par page vers contenu connexe

### 3. Audit Off-Page
- **Profil Backlinks**: Nombre total de backlinks, qualité des domaines référents
- **Domaines Référents**: Domain Authority (DA) des sites qui linkent
- **Ancres**: Variété des textes d'ancre (branded, exact match, generic)
- **Backlinks Toxiques**: Détecter et signaler les liens spammy

### 4. Analyse SERP
- **Position Actuelle**: Top 10 pour les keywords cibles
- **Featured Snippets**: Le site capte-t-il des position zéro ?
- **People Also Ask (PAA)**: Opportunités de contenu basé sur les questions
- **Concurrents Directs**: Qui occupe les 3 premières positions ?

### 5. Schema Markup Validation
- **Structured Data**: Vérifier la présence de schema.org (Organization, Article, Product, etc.)
- **Rich Snippets**: Le site génère-t-il des rich snippets dans Google ?
- **Erreurs Schema**: Utiliser Google Structured Data Testing Tool

### 6. Score Global
Calculer un score SEO 0-100 basé sur :
- Technique : 30%
- On-Page : 30%
- Off-Page : 20%
- SERP : 10%
- Schema : 10%

### 7. Priorisation
Identifier les **Top 5 Quick Wins** (impact élevé, effort faible) :
- Exemple : "Ajouter meta descriptions manquantes (20 pages)"
- Exemple : "Optimiser les images (réduire 2.5MB → 500KB)"
- Exemple : "Corriger les H1 en double (5 pages)"

## Output Attendu

### Format JSON
```json
{
  "type": "PDF_REPORT",
  "data": {
    "site_url": "https://example.com",
    "audit_date": "2026-04-27",
    "score_global": 68,
    "scores_details": {
      "technique": 70,
      "on_page": 65,
      "off_page": 60,
      "serp": 75,
      "schema": 50
    },
    "quick_wins": [
      {
        "priority": 1,
        "title": "Ajouter meta descriptions manquantes",
        "impact": "high",
        "effort": "low",
        "pages_affected": 20,
        "estimated_improvement": "+5 points score"
      },
      {
        "priority": 2,
        "title": "Optimiser la vitesse des images",
        "impact": "high",
        "effort": "medium",
        "gain_speed": "1.2s LCP"
      }
    ],
    "action_plan": {
      "30_jours": [
        "Corriger les quick wins (meta, images, H1)",
        "Créer un sitemap XML complet",
        "Soumettre le sitemap à Google Search Console"
      ],
      "60_jours": [
        "Optimiser la structure interne de liens",
        "Ajouter schema markup sur les pages principales",
        "Commencer la stratégie de contenu (voir content-strategy-builder skill)"
      ],
      "90_jours": [
        "Lancer une campagne de link building",
        "Optimiser les Core Web Vitals",
        "Monitoring mensuel des rankings"
      ]
    }
  }
}
```

## Exemple d'Utilisation

**User Input:**
> "Luna, audite le SEO de https://example-ecommerce.com"

**Luna Response:**
> "J'ai effectué un audit SEO complet de votre site e-commerce. Voici les résultats :
>
> **Score Global : 68/100**
> - ✅ Technique : 70/100 (bon, quelques optimisations d'images nécessaires)
> - ⚠️ On-Page : 65/100 (20 pages sans meta description)
> - ⚠️ Off-Page : 60/100 (profil backlinks à développer)
> - ✅ SERP : 75/100 (bien positionné sur 12/20 keywords cibles)
> - ❌ Schema : 50/100 (structured data Product manquant)
>
> **Top 5 Quick Wins :**
> 1. Ajouter les meta descriptions manquantes (20 pages) → +5 points
> 2. Optimiser les images produits (réduire de 60%) → +1.2s vitesse
> 3. Corriger les H1 en double (5 pages) → améliore crawl
> 4. Ajouter schema Product sur toutes les fiches → rich snippets
> 5. Créer un sitemap XML complet → meilleure indexation
>
> Je recommande de commencer par les quick wins cette semaine, puis de passer à la stratégie de contenu (je peux la créer avec mon skill content-strategy-builder si tu veux).
>
> Veux-tu que je crée des tâches pour Milo pour optimiser les visuels ?"

## Notes Techniques
- Utiliser le MCP tool `seo-audit-server` pour le crawl technique
- Utiliser le MCP tool `web-intelligence-server` pour le scraping SERP
- Stocker les résultats dans `project_memory` pour suivi mensuel
- Si le site a >100 pages, échantillonner les 50 pages les plus importantes (homepage, catégories, top produits)
