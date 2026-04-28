# Attribution Analyst — Sora Skill

## Déclencheur
- User dit : "quel canal performe le mieux ?" ou "comment répartir le budget ?"
- Tâche de type : "analyse attribution"
- Avant optimisation budget

## Méthodologie

### 1. Collecter Conversions par Canal (Last-Click)
Depuis GA4, conversions last-click par source/medium :
- google / cpc (Google Ads)
- facebook / cpc (Meta Ads)
- (direct) / (none)
- google / organic (SEO)
- newsletter / email

### 2. Analyser les Chemins de Conversion
Utiliser GA4 Attribution Paths :
- **First-Click** : canal qui initie le parcours
- **Last-Click** : canal qui convertit
- **Assisted** : canaux intermédiaires

Exemple de parcours :
```
Google Organic → Meta Ads → Email → Direct → CONVERSION
```
- First-Click : Google Organic
- Assisted : Meta Ads, Email
- Last-Click : Direct

### 3. Identifier les Canaux Assistants
Calculer le ratio `Assisted / Last-Click` :
- **Ratio > 2** : Canal très assistant (initie mais ne convertit pas)
- **Ratio 0.5-2** : Canal équilibré
- **Ratio < 0.5** : Canal de conversion directe

Exemple :
- SEO : 45 assisted, 12 last-click → Ratio 3.75 (très assistant)
- Meta Ads : 18 assisted, 32 last-click → Ratio 0.56 (convertisseur)

### 4. Calculer le CPA Réel par Canal
CPA traditionnel (last-click only) :
```
CPA Last-Click = Spend / Conversions Last-Click
```

CPA ajusté (incluant assisted) :
```
CPA Réel = Spend / (Conversions Last-Click + (Assisted × 0.5))
```

Exemple :
- Meta Ads : 3 200€ spend, 32 last-click, 18 assisted
- CPA Last-Click : 100€
- CPA Réel : 3 200 / (32 + 9) = 78€ (meilleur !)

### 5. Recommander Répartition Budget
Basé sur le CPA Réel et le rôle dans le funnel :

**Règle d'allocation** :
- Canaux convertisseurs (ratio <1) : 60-70% du budget
- Canaux équilibrés (ratio 1-2) : 20-30% du budget
- Canaux assistants purs (ratio >2) : 10-20% du budget

**Important** : Ne jamais couper un canal assistant fort (SEO, display awareness) même si CPA last-click élevé.

### 6. Flaguer les Canaux Sous-Investis
Si un canal a :
- Fort ratio assisted/last-click (>2)
- Budget faible (<10% total)
- Croissance du trafic

→ Opportunité d'augmenter le budget.

## Output Attendu

### Format JSON
```json
{
  "type": "ATTRIBUTION_ANALYSIS",
  "data": {
    "period": {"start": "2026-04-01", "end": "2026-04-27"},
    "total_conversions": 187,
    "total_spend": 7300,
    "channels": [
      {
        "channel": "Meta Ads",
        "conversions_last_click": 32,
        "conversions_assisted": 18,
        "ratio_assisted": 0.56,
        "spend": 4100,
        "cpa_last_click": 128,
        "cpa_reel": 102,
        "role": "convertisseur",
        "budget_actuel_percent": 56,
        "budget_recommande_percent": 50
      },
      {
        "channel": "Google Ads",
        "conversions_last_click": 45,
        "conversions_assisted": 22,
        "ratio_assisted": 0.49,
        "spend": 3200,
        "cpa_last_click": 71,
        "cpa_reel": 57,
        "role": "convertisseur",
        "budget_actuel_percent": 44,
        "budget_recommande_percent": 60
      },
      {
        "channel": "SEO (google / organic)",
        "conversions_last_click": 12,
        "conversions_assisted": 45,
        "ratio_assisted": 3.75,
        "spend": 0,
        "cpa_last_click": 0,
        "cpa_reel": 0,
        "role": "assistant",
        "budget_actuel_percent": 0,
        "budget_recommande_percent": "Maintenir efforts contenu"
      }
    ],
    "recommandations": [
      {
        "action": "Augmenter budget Google Ads de +20% (4 100€ → 4 920€)",
        "reason": "Meilleur CPA réel (57€ vs 102€ Meta) et fort taux de conversion last-click",
        "impact": "Estimé +15 conversions/mois supplémentaires"
      },
      {
        "action": "Réduire budget Meta Ads de -10% (3 200€ → 2 880€)",
        "reason": "CPA réel élevé, ratio assisted faible → canal moins efficace actuellement",
        "impact": "Libère 320€ pour Google Ads"
      },
      {
        "action": "Maintenir efforts SEO",
        "reason": "SEO est un canal assistant majeur (45 assists vs 12 last-click, ratio 3.75) → ne PAS couper",
        "impact": "Sans SEO, perte estimée de 20% conversions totales"
      }
    ]
  }
}
```

## Exemple d'Utilisation

**User Input:**
> "Sora, quel canal performe le mieux ? Comment répartir mon budget ?"

**Sora Response:**
> "J'ai analysé l'attribution multi-canal sur les 30 derniers jours. Voici les insights :
>
> **📊 Performance par Canal :**
>
> 1. **Google Ads** (Meilleur performeur)
>    - 45 conversions last-click + 22 assisted
>    - CPA réel : 57€ (vs 71€ last-click seul)
>    - Rôle : Convertisseur direct
>    - Budget actuel : 44% (3 200€)
>
> 2. **Meta Ads** (Performeur moyen)
>    - 32 conversions last-click + 18 assisted
>    - CPA réel : 102€ (vs 128€ last-click seul)
>    - Rôle : Convertisseur
>    - Budget actuel : 56% (4 100€)
>
> 3. **SEO** (Assistant majeur - GRATUIT)
>    - 12 conversions last-click + 45 assisted (ratio 3.75!)
>    - CPA : 0€ (trafic organique)
>    - Rôle : Initiateur de parcours
>    - Budget : 0€ (effort contenu uniquement)
>
> **💡 Mon Analyse :**
> Google Ads a un CPA réel 44% meilleur que Meta (57€ vs 102€). SEO est un canal assistant puissant (45 assists) qu'il ne faut SURTOUT PAS négliger.
>
> **🎯 Ma Recommandation de Réallocation :**
> - **Google Ads** : 44% → 60% (+20% budget, soit +820€/mois)
> - **Meta Ads** : 56% → 40% (-10% budget, soit -320€/mois)
> - **SEO** : Maintenir les efforts contenu (vital pour l'assistance)
>
> **Impact estimé :**
> - +15 conversions/mois supplémentaires
> - CPA global : 68€ → 58€ (-15%)
>
> Veux-tu que je crée une tâche pour Marcus pour ajuster les budgets ?"

## Notes Techniques
- Utiliser GA4 Attribution Paths (accessible via API GA4)
- Si GA4 Attribution pas configuré → utiliser Data-Driven Attribution par défaut
- Toujours inclure les canaux gratuits (SEO, direct, referral) dans l'analyse
- Ne jamais recommander de couper un canal assistant fort (ratio >2)
- Recommander une analyse attribution tous les 30 jours
