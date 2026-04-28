# Competitor Deep Dive — Luna Skill

## Déclencheur
- User dit : "analyse le concurrent [X]"
- Tâche de type : "analyse concurrentielle"
- Phase : Audit

## Méthodologie

### 1. Web Scraping du Site
Utiliser le MCP tool `web-intelligence-server` :
- **Tech Stack** : CMS (WordPress, Shopify, Webflow), frameworks JS, CDN
- **Meta SEO** : Title, description, Open Graph, Twitter Cards
- **Tracking Pixels** : Meta Pixel, GA4, GTM, Google Ads, TikTok, LinkedIn
- **Social Links** : Facebook, Instagram, LinkedIn, Twitter, YouTube

### 2. Analyse SEO
Utiliser le MCP tool `seo-audit-server` :
- **Domain Authority (DA)** : Score Moz/Ahrefs
- **Keywords Ranking** : Top 20 keywords sur lesquels le concurrent rank
- **Top Pages** : Pages générant le plus de trafic estimé
- **Backlinks Profile** : Nombre total, domaines référents, qualité

### 3. Analyse Contenu
- **Fréquence Publication** : Articles/mois, régularité
- **Formats** : Blog posts, guides, études de cas, vidéos, podcasts
- **Ton** : Formel/informel, expert/accessible, corporate/friendly
- **Sujets Principaux** : Piliers de contenu, thématiques récurrentes
- **Longueur Moyenne** : Articles courts (<1000 mots) ou longs (>2000 mots)

### 4. Analyse Social Media
- **Présence** : Plateformes actives (LinkedIn, Instagram, TikTok, etc.)
- **Engagement Rate** : Likes, commentaires, shares par post
- **Fréquence** : Posts/semaine par plateforme
- **Type de Contenu** : Éducatif, promotional, behind-the-scenes, UGC

### 5. Analyse Ads (si visible)
- **Meta Ad Library** : Annonces actives sur Facebook/Instagram
- **Google Ads Transparency Center** : Annonces Search/Display
- **Formats** : Image, video, carousel, stories
- **Messaging** : Promesses, offres, ton, CTA

### 6. Matrice SWOT Simplifiée
**Forces** (ce qu'ils font bien) :
- Exemples : "SEO très fort sur les keywords TOFU", "Design moderne et mobile-first"

**Faiblesses** (opportunités pour le client) :
- Exemples : "Pas de contenu vidéo", "Engagement social faible", "Site lent (4s LCP)"

**Opportunités** (gaps à exploiter) :
- Exemples : "Ils ne rankent pas sur [keyword X]", "Pas de présence sur TikTok"

**Recommandations Actionnables** :
- **Pour Luna** : "Créer une série de vidéos éducatives (gap identifié)"
- **Pour Marcus** : "Tester des annonces carousel (format qu'ils n'utilisent pas)"
- **Pour Milo** : "Adopter un ton plus accessible (vs leur ton corporate)"

## Output Attendu

### Format JSON
```json
{
  "type": "COMPETITOR_REPORT",
  "data": {
    "competitor_name": "Example Bio Shop",
    "competitor_url": "https://example-bio.com",
    "analyzed_date": "2026-04-27",
    "tech_stack": {
      "cms": "Shopify",
      "frameworks": ["React", "Tailwind CSS"],
      "cdn": "Cloudflare",
      "analytics": ["Google Analytics 4", "Meta Pixel"],
      "advertising": ["Google Ads", "Meta Ads"]
    },
    "seo": {
      "domain_authority": 45,
      "keywords_ranking_top10": 127,
      "top_keywords": [
        {"keyword": "produits bio en ligne", "position": 3, "volume": 2400},
        {"keyword": "cosmétiques bio", "position": 5, "volume": 1800}
      ],
      "backlinks_total": 3450,
      "referring_domains": 287
    },
    "content": {
      "frequency": "3 articles/mois",
      "formats": ["blog", "guide PDF", "video YouTube"],
      "tone": "Expert accessible",
      "average_length": 1800,
      "piliers": ["Nutrition bio", "Cosmétiques naturels", "Zero waste"]
    },
    "social": {
      "platforms": {
        "instagram": {"followers": 12400, "engagement_rate": 3.2, "posts_per_week": 5},
        "facebook": {"followers": 8900, "engagement_rate": 1.8, "posts_per_week": 3},
        "tiktok": null
      }
    },
    "ads_active": {
      "meta": 12,
      "google": 5,
      "top_messages": [
        "-20% sur votre première commande",
        "Livraison gratuite dès 50€",
        "100% bio certifié"
      ]
    },
    "swot": {
      "forces": [
        "SEO très développé (DA 45, 127 keywords top 10)",
        "Présence social forte sur Instagram (12K followers, 3.2% engagement)",
        "Contenu éducatif de qualité (guides PDF bien rankés)"
      ],
      "faiblesses": [
        "Pas de présence sur TikTok (opportunité manquée pour audience jeune)",
        "Faible engagement Facebook (1.8% vs benchmark 2.5%)",
        "Site lent (LCP 3.8s, pénalisant pour SEO mobile)"
      ],
      "opportunites": [
        "Ils ne rankent pas sur 'recettes bio faciles' (volume 3200/mois)",
        "Pas de contenu vidéo sur YouTube (canal sous-exploité)",
        "Peu d'annonces Google Display (focus sur Search uniquement)"
      ]
    },
    "recommandations": [
      {
        "agent": "luna",
        "action": "Créer une série 'Recettes bio faciles' (blog + vidéo YouTube) pour capter le volume 3200/mois que le concurrent ignore"
      },
      {
        "agent": "marcus",
        "action": "Lancer des campagnes Google Display avec visuels forts (concurrent absent sur ce canal)"
      },
      {
        "agent": "doffy",
        "action": "Développer TikTok avec contenu éducatif court-format (concurrent absent, audience jeune engagée)"
      }
    ]
  }
}
```

## Exemple d'Utilisation

**User Input:**
> "Luna, analyse mon concurrent principal : bio-market.fr"

**Luna Response:**
> "J'ai effectué une analyse approfondie de bio-market.fr. Voici les points clés :
>
> **📊 Vue d'ensemble :**
> - Site : Shopify + React, DA 45, tracking complet
> - SEO : 127 keywords en top 10 (très fort)
> - Social : Instagram performant (12K, 3.2% engagement)
> - Ads : 12 annonces Meta actives, 5 Google Ads
>
> **✅ Leurs forces :**
> 1. SEO mature (DA 45, contenu éducatif bien positionné)
> 2. Instagram engageant (3.2% vs benchmark 2.1%)
> 3. Guides PDF téléchargeables (génèrent des leads)
>
> **❌ Leurs faiblesses (= nos opportunités) :**
> 1. **Absent de TikTok** (audience jeune 18-30 ans non touchée)
> 2. **Pas de vidéo YouTube** (0 vidéos vs fort potentiel éducatif)
> 3. **Site lent** (LCP 3.8s, pénalise le SEO mobile)
>
> **🎯 Mes 3 recommandations :**
> 1. **Pour toi (stratégie contenu)** : Créer une série 'Recettes bio en 5 min' (keyword gap détecté, 3200 vol/mois, KD 22)
> 2. **Pour Marcus** : Lancer Google Display (ils sont absents, audience chaude capturable)
> 3. **Pour Doffy** : Attaquer TikTok avec du contenu éducatif court (leur angle mort total)
>
> Veux-tu que je crée la stratégie contenu 'Recettes bio' tout de suite ?"

## Notes Techniques
- Utiliser `web-intelligence-server` pour le scraping complet
- Utiliser `seo-audit-server` pour les métriques SEO
- Si Meta Ad Library ou Google Transparency ne donnent rien → mentionner "Pas d'ads visibles actuellement"
- Stocker l'analyse dans `project_memory` pour comparaison future (analyser le même concurrent tous les 3 mois)
- Créer des recommandations inter-agent via write-back commands (tâches pour Marcus, Milo, Doffy)
