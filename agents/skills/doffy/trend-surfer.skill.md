# Trend Surfer — Doffy Skill

## Déclencheur
- "quelles sont les tendances du moment ?"
- "trouve un trend pour ce produit"

## Méthodologie
1. Monitorer trending topics (Twitter Trends, TikTok Discover, Google Trends)
2. Filtrer par pertinence industrie/marque
3. Analyser durée de vie trend (flash 24h vs durable 1 mois)
4. Créer angle brand-safe (éviter controverses)
5. Timing : surfer le trend avant saturation (fenêtre 24-72h)

## Output
```json
{
  "trends": [
    {
      "name": "#AISaaSRevolution",
      "platform": "LinkedIn",
      "volume": "high",
      "relevance": 9,
      "lifespan": "1-2 weeks",
      "angle": "Comment notre IA marketing aide les PME",
      "risk": "low",
      "timing": "post_within_48h"
    },
    {
      "name": "Duet dance trend",
      "platform": "TikTok",
      "volume": "viral",
      "relevance": 3,
      "lifespan": "3-5 days",
      "angle": "Skip — trop éloigné brand",
      "risk": "medium",
      "timing": "n/a"
    }
  ],
  "recommended": "#AISaaSRevolution",
  "content_idea": "Carrousel LinkedIn : 5 façons dont l'IA transforme le marketing en 2026"
}
```
