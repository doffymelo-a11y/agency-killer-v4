# Social Analytics Interpreter — Doffy Skill

## Déclencheur
- "analyse mes stats social media"
- "pourquoi mon reach a baissé ?"

## Méthodologie
1. Collecter métriques (reach, impressions, engagement, followers growth)
2. Identifier anomalies (pics/chutes > 30%)
3. Corréler avec événements (posts viraux, algorithmes changes, concurrence)
4. Benchmarker vs industrie (engagement rate moyen par secteur)
5. Recommandations actionnables

## Output
```json
{
  "period": "last_30_days",
  "summary": {
    "reach": {"value": 45000, "change": -12, "status": "declining"},
    "engagement_rate": {"value": 3.2, "change": +0.5, "status": "improving"},
    "followers": {"value": 8500, "change": +230, "status": "growing"}
  },
  "anomalies": [
    {
      "date": "2026-04-15",
      "metric": "reach",
      "change": -35,
      "cause": "Algorithm update Instagram (suspected)",
      "action": "Increase Reels frequency"
    }
  ],
  "benchmark": {
    "industry_avg_engagement": 2.8,
    "your_performance": "above_average"
  },
  "recommendations": [
    "Post 2-3 Reels/week (format favorisé par algo)",
    "Tester posts 18h-20h (meilleur reach détecté)"
  ]
}
```
