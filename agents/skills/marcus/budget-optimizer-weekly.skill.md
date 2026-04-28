# Budget Optimizer Weekly — Marcus Skill

## Déclencheur
- Chaque semaine (automatique)
- User dit : "optimise le budget"

## Méthodologie

### 1. Collecter ROAS/CPA (7 derniers jours)
Par campagne active

### 2. Matrice de Décision
- **ROAS >5.0** → SCALE +20% (max +30%)
- **3.0 < ROAS < 5.0** → HOLD (optimiser créatifs)
- **1.5 < ROAS < 3.0** → OPTIMIZE (tester audiences)
- **ROAS <1.5** → KILL (couper)

### 3. Vérifications
- Spend velocity (on track ?)
- Fatigue créative (fréquence >3 ?)

### 4. Nouvelle Répartition
Soumettre si changement >20%

## Output

```json
{
  "type": "BUDGET_OPTIMIZATION",
  "data": {
    "campaigns": [
      {
        "name": "Meta - Conv - France",
        "roas": 5.8,
        "action": "SCALE",
        "budget_current": 50,
        "budget_new": 60,
        "reason": "ROAS excellent (5.8), scale +20%"
      },
      {
        "name": "Google - Search - Bio",
        "roas": 1.2,
        "action": "KILL",
        "budget_current": 40,
        "budget_new": 0,
        "reason": "ROAS <1.5, couper immédiatement"
      }
    ],
    "total_budget_change": "+10€/jour",
    "projected_roas": 4.2
  }
}
```

## Exemple
**Marcus:** "Optimisation hebdomadaire :

📈 SCALE (+20%) :
- Meta Conv France : ROAS 5.8 → 50€ → 60€/jour

⏸️ HOLD :
- Google Display : ROAS 3.2 → optimiser créatifs

❌ KILL :
- Google Search Bio : ROAS 1.2 → couper

Impact : Budget total +10€/jour, ROAS global 3.8 → 4.2"
