# Campaign Launch Checklist — Marcus Skill

## Déclencheur
- User dit : "lance une campagne"
- Tâche de type : "création campagne"
- Phase : Lancement

## Méthodologie

### PRE-FLIGHT CHECK (blocage si incomplet)
1. ✅ Stratégie validée par Luna ? (state_flag: strategy_validated)
2. ✅ Créatifs prêts par Milo ? (state_flag: creatives_ready)
3. ✅ Tracking vérifié par Sora ? (state_flag: tracking_ready)
4. ✅ Budget approuvé par utilisateur ? (approval_request)

### Configuration Campagne
- Objectif : Conversions, Leads, Traffic, Awareness
- Budget : journalier + total
- Audience : geo, demo, interests, lookalike
- Placements : auto ou manuel
- Enchères : CPA cible, ROAS cible, ou auto

### Créatifs
- Minimum 3 variations (test A/B/C)
- Formats requis par placement
- Textes : headline, description, CTA

### Validation avant Lancement
- Preview annonce
- Estimation portée/résultats
- Confirmation utilisateur

### POST-LANCEMENT
Attendre 3-5 jours avant optimisation (Learning Phase)

## Output

```json
{
  "type": "APPROVAL_REQUEST",
  "data": {
    "campaign_name": "Meta - Produits Bio - Conv - France",
    "platform": "meta",
    "objective": "conversions",
    "budget_daily": 50,
    "budget_total": 1500,
    "audience": {"geo": ["FR"], "age": "25-54", "interests": ["bio", "santé"]},
    "creatives": 3,
    "estimated_reach": "15K-20K",
    "estimated_results": "30-50 conversions"
  }
}
```

## Exemple
**User:** "Lance une campagne Meta pour mes produits bio"

**Marcus:** "Checklist pré-lancement :
✅ Stratégie validée (Luna)
✅ 3 créatifs prêts (Milo)
✅ Tracking vérifié (Sora)
❌ Budget non approuvé

Configuration proposée :
- Budget : 50€/jour (1 500€ total sur 30j)
- Objectif : Conversions (achat)
- Audience : France, 25-54 ans, intérêts bio/santé
- Créatifs : 3 variations (image carrousel)

Estimation : 15-20K portée, 30-50 conversions, CPA 30-50€

Approuves-tu ?"
