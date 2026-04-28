# Content Strategy Builder — Luna Skill

## Déclencheur
- User dit : "crée une stratégie de contenu"
- Tâche de type : "stratégie éditoriale"
- Phase : Production SEO

## Méthodologie

### 1. Analyser les Keywords Validés
Utiliser le MCP tool `seo-audit-server` pour :
- **Search Volume**: Filtrer les keywords avec volume > 100/mois
- **Keyword Difficulty**: Filtrer KD < 40 (faisable)
- **Search Intent**: Classifier en informational, commercial, transactional, navigational
- **Trend**: Vérifier la tendance (en hausse, stable, en baisse)

### 2. Mapper les Keywords au Funnel
Classifier chaque keyword selon l'étape du parcours client :

- **TOFU (Top of Funnel)** — Awareness
  - Keywords "comment...", "qu'est-ce que...", "pourquoi..."
  - Exemple : "comment améliorer son SEO"
  - Format : articles de blog, guides débutants

- **MOFU (Middle of Funnel)** — Consideration
  - Keywords "meilleur...", "comparatif...", "avis..."
  - Exemple : "meilleur outil SEO 2026"
  - Format : comparatifs, études de cas, templates

- **BOFU (Bottom of Funnel)** — Decision
  - Keywords "[marque] vs...", "acheter...", "prix..."
  - Exemple : "prix audit SEO agence"
  - Format : landing pages, démos, offres

### 3. Identifier les Content Gaps
Comparer le contenu existant du client vs les concurrents :
- Quels sujets les concurrents couvrent que le client n'a pas ?
- Quels keywords les concurrents rankent et pas le client ?
- Quelles questions (PAA) ne sont pas adressées ?

### 4. Générer un Calendrier Éditorial 12 Semaines
Pour chaque article planifié :
- **Semaine** : numéro (1-12)
- **Titre de l'article** : accrocheur, max 60 caractères
- **Keyword principal** : 1 keyword cible
- **Keywords secondaires** : 2-4 keywords connexes
- **Intent** : informational, commercial, transactional
- **Longueur cible** : 800, 1500, 2500, ou 4000 mots selon compétitivité
- **Structure H2/H3** : plan détaillé
- **CTA** : call-to-action de fin d'article

Cadence recommandée :
- Client avec budget élevé : 3 articles/semaine
- Client standard : 2 articles/semaine
- Client starter : 1 article/semaine

### 5. Prioriser par Impact SEO Estimé
Formule de scoring :
```
Impact Score = (Search Volume × 0.6) + ((100 - Keyword Difficulty) × 0.4)
```

Trier les articles par score décroissant et planifier les plus impactants en premier.

### 6. Créer les Briefs Article
Pour chaque article, générer un brief structuré :
- Titre provisoire
- Keyword principal + secondaires
- Angle unique (ce qui différencie de la concurrence)
- Points clés à couvrir (liste de H2)
- Ton/style (selon metadata.brand_tone)
- Longueur cible
- Sources/références suggérées
- CTA recommandé

## Output Attendu

### Format JSON
```json
{
  "type": "CONTENT_CALENDAR",
  "data": {
    "project_id": "uuid",
    "period": "12 semaines",
    "cadence": "2 articles/semaine",
    "total_articles": 24,
    "articles": [
      {
        "week": 1,
        "title": "Comment améliorer son SEO en 2026 : 10 stratégies qui fonctionnent",
        "keyword_principal": "améliorer son seo",
        "keywords_secondaires": ["stratégies seo 2026", "optimisation seo", "référencement naturel"],
        "intent": "informational",
        "funnel_stage": "TOFU",
        "longueur_cible": 2500,
        "structure": [
          "Introduction : Pourquoi le SEO évolue",
          "1. Optimiser pour Core Web Vitals",
          "2. Créer du contenu E-E-A-T",
          "3. Exploiter les featured snippets",
          "...",
          "Conclusion + CTA"
        ],
        "cta": "Téléchargez notre checklist SEO gratuite",
        "impact_score": 450,
        "estimated_traffic_monthly": 300
      },
      {
        "week": 2,
        "title": "Meta Titles SEO : Le guide complet pour 2026",
        "keyword_principal": "meta title seo",
        "keywords_secondaires": ["optimiser meta title", "balise title", "title tag"],
        "intent": "informational",
        "funnel_stage": "TOFU",
        "longueur_cible": 1500,
        "structure": [
          "Qu'est-ce qu'un meta title ?",
          "Pourquoi c'est important pour le SEO",
          "Les 7 règles d'or",
          "Exemples avant/après",
          "Outils pour tester vos titles"
        ],
        "cta": "Auditez vos meta titles avec notre outil",
        "impact_score": 380,
        "estimated_traffic_monthly": 220
      }
    ],
    "briefs_pour_milo": [
      {
        "task_title": "Créer les visuels pour l'article 'Comment améliorer son SEO'",
        "task_description": "3 visuels requis : image hero (1200x628), infographie des 10 stratégies, screenshot exemple Core Web Vitals",
        "task_assignee": "milo",
        "task_phase": "Production",
        "estimated_hours": 2
      }
    ]
  }
}
```

## Exemple d'Utilisation

**User Input:**
> "Luna, crée une stratégie de contenu SEO pour mon site e-commerce de produits bio"

**Luna Response:**
> "J'ai analysé vos keywords et créé une stratégie de contenu sur 12 semaines.
>
> **Objectif : Générer 2 500 visiteurs/mois via le SEO organique**
>
> **Cadence : 2 articles/semaine (24 articles au total)**
>
> **Top 3 articles prioritaires :**
> 1. **Semaine 1** : 'Produits bio vs conventionnels : le guide complet 2026'
>    - Keyword : "produits bio avantages" (volume 2 400/mois, KD 28)
>    - Trafic estimé : 300 visites/mois
>    - Longueur : 2 500 mots
>
> 2. **Semaine 2** : 'Comment choisir ses cosmétiques bio : 10 critères essentiels'
>    - Keyword : "choisir cosmétiques bio" (volume 1 800/mois, KD 32)
>    - Trafic estimé : 220 visites/mois
>    - Longueur : 1 800 mots
>
> 3. **Semaine 3** : 'Labels bio en France : lequel choisir en 2026 ?'
>    - Keyword : "labels bio france" (volume 1 200/mois, KD 25)
>    - Trafic estimé : 180 visites/mois
>    - Longueur : 1 500 mots
>
> **Répartition Funnel :**
> - TOFU (awareness) : 60% des articles
> - MOFU (consideration) : 30% des articles
> - BOFU (decision) : 10% des articles
>
> J'ai créé 5 tâches pour Milo pour les visuels des 5 premiers articles. Veux-tu que je génère le brief détaillé du premier article pour commencer ?"

## Notes Techniques
- Utiliser le MCP tool `seo-audit-server` pour l'analyse de keywords
- Utiliser le MCP tool `web-intelligence-server` pour l'analyse concurrentielle
- Stocker le calendrier dans `project_memory` pour référence
- Créer automatiquement des tâches pour Milo via write-back command CREATE_TASK
- Suggérer un CMS connector (WordPress, Shopify) si le client n'en a pas configuré
