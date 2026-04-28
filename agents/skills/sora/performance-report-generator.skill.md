# Performance Report Generator — Sora Skill

## Déclencheur
- User dit : "génère un rapport de performance"
- Fin de semaine / fin de mois (automatique)
- Tâche de type : "rapport analytics"

## Méthodologie

### 1. Collecter Métriques GA4
Utiliser le MCP tool `google-analytics-4-server` :
- **Sessions** : total + variation WoW/MoM
- **Users** : unique users + nouveaux vs recurring
- **Bounce Rate** : % rebond + variation
- **Conversions** : total conversions + variation
- **Revenue** : si e-commerce activé
- **Top Sources** : organic, direct, referral, social, paid
- **Top Pages** : pages les plus visitées
- **Top Landing Pages** : pages d'entrée principales

### 2. Collecter Métriques Ads
Par plateforme (Meta, Google, TikTok, LinkedIn) :
- **Spend** : budget dépensé + variation
- **ROAS** : Return on Ad Spend (revenue / spend)
- **CPA** : Cost Per Acquisition
- **CTR** : Click-Through Rate
- **Impressions** : portée totale
- **Clicks** : clics totaux
- **Conversions** : actions complétées

### 3. Calculer Variations
Pour chaque KPI :
- **WoW (Week over Week)** : variation vs semaine précédente
- **MoM (Month over Month)** : variation vs mois précédent

Format : "+15.3%" (vert) ou "-8.2%" (rouge)

### 4. Identifier Top 3 / Bottom 3

**Top 3 Performances** :
- Exemples : "Google Ads : ROAS 8.5 (+120%)", "Blog article X : +450 sessions"

**Bottom 3 Performances** :
- Exemples : "Meta Ads : ROAS 1.2 (-40%)", "Landing page Y : bounce 85%"

### 5. Générer Insights IA
Pour chaque variation significative (>20%) :
- **Hypothèse** : Pourquoi ça a monté/baissé ?
- **Confirmation** : Données secondaires qui corroborent
- **Action** : Que faire maintenant ?

Exemple :
> "📈 Sessions organiques +45% (2 340 → 3 392)
>
> **Hypothèse** : L'article 'SEO 2026' publié il y a 10 jours commence à ranker (position 3-5 sur 4 keywords).
>
> **Confirmation** : Google Search Console montre +280% impressions sur ces keywords.
>
> **Action** : Créer 2-3 articles connexes pour capitaliser sur ce momentum (recommandation pour Luna)."

### 6. Formuler 3 Recommandations Actionnables

**Format** :
- Agent ciblé (Luna, Marcus, Milo, Doffy)
- Action précise
- Impact estimé (faible, moyen, élevé)
- Effort (faible, moyen, élevé)

Exemple :
1. **Pour Marcus** : Réduire le budget Meta Ads de -30% et réallouer sur Google Ads (ROAS 2x meilleur) → Impact élevé, Effort faible
2. **Pour Luna** : Optimiser la landing page /offre (bounce 85%, trafic élevé mais pas de conversions) → Impact élevé, Effort moyen
3. **Pour Doffy** : Augmenter la fréquence Instagram (3→5 posts/semaine, engagement en hausse) → Impact moyen, Effort faible

### 7. Score de Santé Marketing Global

Calculer un score 0-100 basé sur :
- **Traffic Growth** (20%) : croissance du trafic
- **Conversion Rate** (30%) : taux de conversion vs benchmark
- **ROAS** (30%) : performance ads
- **Engagement** (10%) : social + email
- **SEO Rankings** (10%) : progression positions

**Interprétation** :
- 90-100 : Excellente santé
- 70-89 : Bonne santé, quelques optimisations
- 50-69 : Santé moyenne, actions correctives nécessaires
- <50 : Alerte, intervention urgente

## Output Attendu

### Format JSON
```json
{
  "type": "PDF_REPORT",
  "data": {
    "period": {"start": "2026-04-01", "end": "2026-04-27"},
    "score_global": 78,
    "resume_executif": "Mois solide avec +32% de trafic organique grâce aux efforts SEO. Google Ads performe bien (ROAS 5.2) mais Meta Ads sous-performe (ROAS 1.8). Recommandation : réallouer 30% du budget Meta vers Google.",
    "kpis": {
      "traffic": {"value": 12450, "variation_mom": 24.5, "trend": "up"},
      "conversions": {"value": 187, "variation_mom": 18.2, "trend": "up"},
      "revenue": {"value": 28450, "variation_mom": 15.8, "trend": "up", "currency": "EUR"},
      "bounce_rate": {"value": 42.3, "variation_mom": -5.2, "trend": "down"}
    },
    "ads_performance": {
      "google_ads": {"spend": 3200, "roas": 5.2, "cpa": 18.5, "trend": "up"},
      "meta_ads": {"spend": 4100, "roas": 1.8, "cpa": 35.2, "trend": "down"}
    },
    "top_performances": [
      {"metric": "Organic Traffic", "value": "+32% (3 240 sessions)", "reason": "Articles SEO rankent bien"},
      {"metric": "Google Ads ROAS", "value": "5.2 (+15%)", "reason": "Nouvelles audiences performent"},
      {"metric": "Instagram Engagement", "value": "+28%", "reason": "Contenu vidéo cartonne"}
    ],
    "bottom_performances": [
      {"metric": "Meta Ads ROAS", "value": "1.8 (-22%)", "reason": "Fatigue créative détectée"},
      {"metric": "Landing /offre Bounce", "value": "85%", "reason": "Page lente (LCP 4.2s)"},
      {"metric": "Email Open Rate", "value": "-12%", "reason": "Sujet lines peu engageants"}
    ],
    "insights": [
      {
        "title": "SEO momentum à capitaliser",
        "description": "Les 3 articles publiés ce mois rankent en top 5. Opportunité de créer du contenu connexe.",
        "action": "Demander à Luna de créer 3 articles complémentaires ce mois",
        "impact": "Estimé +500 sessions/mois supplémentaires"
      }
    ],
    "recommandations": [
      {
        "agent": "marcus",
        "action": "Réallouer -30% budget Meta → +30% Google Ads",
        "impact": "high",
        "effort": "low",
        "gain_estime": "ROAS global 3.2 → 4.1"
      },
      {
        "agent": "luna",
        "action": "Optimiser landing page /offre (réduire bounce 85% → 55%)",
        "impact": "high",
        "effort": "medium",
        "gain_estime": "+40 conversions/mois"
      },
      {
        "agent": "milo",
        "action": "Créer 5 nouveaux créatifs Meta (fatigue détectée)",
        "impact": "medium",
        "effort": "medium",
        "gain_estime": "ROAS Meta 1.8 → 2.8"
      }
    ]
  }
}
```

## Exemple d'Utilisation

**User Input:**
> "Sora, génère le rapport de performance du mois"

**Sora Response:**
> "Voici le rapport de performance d'avril 2026 :
>
> **🎯 Score de Santé Marketing : 78/100** (Bonne santé)
>
> **Résumé :**
> Mois solide avec une forte croissance organique (+32%) grâce aux efforts SEO. Google Ads performe excellemment (ROAS 5.2) mais Meta Ads sous-performe (ROAS 1.8). Recommandation principale : réallouer 30% du budget.
>
> **📈 Top 3 Performances :**
> 1. Trafic organique : +32% (articles SEO en position 3-5)
> 2. Google Ads ROAS : 5.2 (+15% vs mois dernier)
> 3. Engagement Instagram : +28% (contenu vidéo cartonne)
>
> **📉 Points d'Attention :**
> 1. Meta Ads ROAS : 1.8 (-22%, fatigue créative)
> 2. Landing /offre : bounce 85% (page lente, LCP 4.2s)
> 3. Email open rate : -12% (sujets peu engageants)
>
> **💡 Mes 3 Recommandations :**
> 1. **Pour Marcus** : Réallouer 30% du budget Meta vers Google (ROAS 2x meilleur) → Gain : ROAS global 3.2 → 4.1
> 2. **Pour Luna** : Optimiser la landing /offre (vitesse + CTA) → Gain : +40 conversions/mois
> 3. **Pour Milo** : Créer 5 nouveaux créatifs Meta (fatigue détectée) → Gain : ROAS Meta 1.8 → 2.8
>
> Veux-tu que je crée ces tâches pour Luna, Marcus et Milo ?"

## Notes Techniques
- Utiliser `google-analytics-4-server` pour GA4
- Utiliser `meta-ads-server` pour Meta Ads
- Utiliser `google-ads-server` pour Google Ads
- Si une plateforme n'est pas connectée → mentionner "Données non disponibles (plateforme non connectée)"
- Stocker le rapport dans `project_memory` pour comparaison mois suivant
- Créer des tâches inter-agent via write-back commands si recommandations actionnables
