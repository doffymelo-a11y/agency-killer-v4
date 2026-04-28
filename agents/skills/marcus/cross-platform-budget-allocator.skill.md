# Cross-Platform Budget Allocator — Marcus Skill

## Déclencheur
- "répartis le budget entre plateformes"
- Planning mensuel

## Méthodologie
1. Collecter performances (Meta, Google, TikTok, LinkedIn)
2. Calculer ROAS marginal par plateforme
3. Règle 70/20/10 :
   - 70% canal le plus performant
   - 20% second canal
   - 10% test nouveau canal
4. Ajuster selon saisonnalité
5. Vérifier minimums (Meta 5€/j, Google 10€/j)

## Output
```json
{
  "total_budget": 5000,
  "allocation": [
    {"platform": "Google Ads", "percent": 70, "amount": 3500, "reason": "Meilleur ROAS (5.2)"},
    {"platform": "Meta Ads", "percent": 20, "amount": 1000, "reason": "Second performeur (ROAS 3.1)"},
    {"platform": "TikTok Ads", "percent": 10, "amount": 500, "reason": "Test nouveau canal"}
  ],
  "projected_roas": 4.8
}
```
