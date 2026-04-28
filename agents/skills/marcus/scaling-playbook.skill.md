# Scaling Playbook — Marcus Skill

## Déclencheur
- Campagne avec ROAS >5.0 pendant 7+ jours

## Méthodologie
1. Vérifier stabilité (ROAS constant ?)
2. Scale horizontal d'abord (nouvelles audiences, placements)
3. Scale vertical ensuite (+20% budget/jour max, jamais +50%)
4. Monitorer fréquence (si >2.5 = saturation)
5. Préparer créatifs de relève (Milo)
6. Seuil alerte : CPA +15% → revenir au budget précédent

## Output
```json
{
  "campaign": "Meta Conv France",
  "current_budget": 50,
  "scaling_plan": [
    {"week": 1, "action": "Scale horizontal - audience lookalike 1%", "budget": 60},
    {"week": 2, "action": "Scale vertical +20%", "budget": 72},
    {"week": 3, "action": "Nouveaux placements (Stories + Reels)", "budget": 85}
  ],
  "alert_threshold": "CPA >23€ (baseline 20€)",
  "creatives_needed": 3
}
```
