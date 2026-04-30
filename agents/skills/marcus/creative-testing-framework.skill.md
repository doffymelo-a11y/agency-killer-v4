# Creative Testing Framework — Marcus Skill

## Déclencheur
- "teste des créatifs"
- "A/B test"
- "compare les variantes"
- Campagne en phase OPTIMIZE
- CPA stagnant ou CTR/CVR en baisse

## Contexte
Le testing créatif est LA méthode scientifique pour améliorer les performances publicitaires. Un framework rigoureux permet d'identifier les éléments qui font vraiment la différence, d'éviter les faux positifs statistiques, et d'archiver les learnings pour le futur.

**Règle d'or**: Tester 1 seule variable à la fois. Un test multi-varié (headline + visual + CTA en même temps) est impossible à interpréter — impossible de savoir QUEL élément a causé la différence.

## Méthodologie Complète

### 1. Définir l'Hypothèse (AVANT de lancer le test)

**Formulation rigoureuse**: "Si je change [ÉLÉMENT], alors [MÉTRIQUE] va [AUGMENTER/DIMINUER] de [X%] parce que [RAISON]."

**Exemples d'hypothèses valides**:
- "Si je change le headline de 'Économisez du temps' à 'Économisez 4h/semaine', alors le CTR va augmenter de +15% parce que les chiffres concrets sont plus crédibles"
- "Si je remplace l'image lifestyle par un screenshot produit, alors le CVR va augmenter de +20% parce que l'audience veut voir l'interface"
- "Si je change le CTA de 'En savoir plus' à 'Démarrer l'essai gratuit', alors le taux de conversion va augmenter de +25% parce que c'est plus actionnable"

**Éléments testables** (ordre de priorité):
1. **Headline** (impact CTR: +10% à +40%) — L'élément le plus impactant
2. **Visual** (impact CTR: +15% à +50%) — Image vs vidéo, style, composition
3. **CTA** (impact CVR: +10% à +30%) — Wording, couleur, placement
4. **Audience** (impact CPA: +20% à +60%) — Segment démographique, intérêt, comportement
5. **Placement** (impact CPA: +15% à +40%) — Feed vs Story vs Reel vs Sidebar
6. **Ad copy body** (impact CVR: +5% à +15%) — Bénéfices vs features, longueur

### 2. Créer les Variantes

**Nombre de variantes optimal**:
- **A/B simple**: 2 variantes (contrôle vs challenger) — recommandé pour commencer
- **A/B/C**: 3 variantes (contrôle vs 2 challengers) — si budget >$500/jour
- **A/B/n**: 4-5 variantes — uniquement si budget >$2,000/jour (sinon dilution du trafic)

**Bonnes pratiques**:
- **Variant A** (contrôle): la créa actuelle qui tourne
- **Variant B** (challenger): 1 SEUL changement par rapport au contrôle
- **Variant C** (challenger 2): 1 autre changement, orthogonal à B

**Collaboration avec Milo**:
- Demander à Milo de produire les variantes visuelles
- Spécifier EXACTEMENT ce qui doit changer ("même composition, juste changer le headline de X à Y")
- Fournir le brief: plateforme, format, specs techniques, l'hypothèse

**Anti-patterns à éviter**:
- Changer 3 éléments à la fois → impossible d'interpréter le gagnant
- Tester des variantes trop similaires (headline "Économisez du temps" vs "Gagnez du temps") → différence non significative
- Oublier de tracker quelle variante est le contrôle → confusion lors de l'analyse

### 3. Structure du Test

**Budget minimum par variante**:
- Meta/Google: **$50-100/variante** minimum
- LinkedIn: **$150-200/variante** minimum (CPC plus cher)
- TikTok: **$30-50/variante** minimum (CPC plus bas)

**Taille échantillon statistique**:

Formule simplifiée pour calculer le nombre d'impressions nécessaires:
```
Impressions_requises = (2 * (Z-score)^2 * CTR * (1 - CTR)) / (MDE)^2

Avec:
- Z-score = 1.96 (confidence 95%)
- CTR = taux de clic actuel (baseline)
- MDE = Minimum Detectable Effect (différence minimale à détecter, ex: 0.10 pour +10%)
```

**Exemple concret**:
- CTR baseline = 2% = 0.02
- MDE = 10% = 0.10 (on veut détecter une différence de 10%)
- Z-score = 1.96
- Impressions_requises = (2 * 1.96^2 * 0.02 * 0.98) / 0.10^2 = **1,536 impressions** par variante

**Durée minimum**:
- **7 jours minimum** — pour capturer les variations jour de semaine vs weekend
- **14 jours idéal** — pour capturer les variations hebdomadaires (paie bi-mensuelle, cycle d'achat B2B)
- **28 jours pour B2B long cycle** — cycle de décision B2B peut être 3-4 semaines

**Exceptions**:
- Si trafic TRÈS élevé (>10,000 impressions/jour/variante) → 3-5 jours suffisent
- Si événement saisonnier (Black Friday, Noël) → 2-3 jours max (ne pas déborder sur l'événement)

**Budget égal obligatoire**:
- Split 50/50 pour A/B
- Split 33/33/33 pour A/B/C
- Si la plateforme ne permet pas le split exact (Meta CBO), créer des campagnes séparées avec même budget

### 4. Analyser les Résultats

**Métriques à comparer** (ordre de priorité):
1. **CPA** (coût par acquisition) — la métrique ultime pour ROI
2. **CVR** (conversion rate) — qualité du trafic
3. **CTR** (click-through rate) — attractivité de la créa
4. **CPM** (cost per mille) — efficacité de l'enchère
5. **Engagement rate** (pour brand awareness)

**Critères de significativité statistique**:

Un gagnant n'est déclaré **QUE SI**:
- **Différence > 10%** sur la métrique principale (CPA ou CVR)
- **P-value < 0.05** (95% de confiance que la différence n'est pas due au hasard)
- **Minimum atteint**: 1,000 impressions ET 30 clics ET 10 conversions par variante

**Outils de calcul**:
- Google Analytics Experiment Calculator
- Optimizely Stats Engine
- Formule manuelle (t-test pour proportions)

**Décisions possibles**:

| Scénario | Décision |
|----------|----------|
| Variant B gagne avec +15% CVR, p<0.05 | ✅ **Implémenter Variant B**, archiver learning |
| Variant B gagne avec +8% CVR, p<0.05 | ⚠️ **Prolonger le test** 7 jours (différence faible) |
| Variant B gagne avec +20% CVR, p=0.12 | ⚠️ **Prolonger le test** (pas significatif) |
| Aucune différence >5% après 14j | ❌ **Arrêter le test**, garder contrôle, tester autre chose |
| Variant B perd (-15% CVR) | ❌ **Arrêter Variant B**, analyser pourquoi (archiver) |

**Edge cases**:

**Cas 1: Trafic insuffisant après 14 jours**
- Si <500 impressions/variante → le budget est trop faible OU l'audience est trop petite
- Action: Élargir l'audience OU augmenter le budget OU choisir une plateforme avec plus de volume

**Cas 2: Résultats contradictoires** (Variant B gagne en CTR mais perd en CVR)
- Analyser la qualité du trafic: CTR élevé + CVR bas = mauvais ciblage OU promesse publicitaire non tenue sur la landing page
- Action: Vérifier la cohérence message publicitaire <> landing page

**Cas 3: Saisonnalité**
- Si le test chevauche un événement (lancement produit, promo flash, jour férié) → résultats biaisés
- Action: Relancer le test en période normale OU segmenter l'analyse (avant/pendant/après événement)

### 5. Implémenter le Gagnant & Archiver Learnings

**Implémentation**:
1. Arrêter toutes les variantes perdantes
2. Scaler le gagnant à 100% du budget
3. Créer une nouvelle ad set/campagne avec la créa gagnante SI besoin de refresh (Meta penalise les ads qui tournent >30j)

**Archivage dans project_memory**:
```json
{
  "memory_type": "creative_testing_learning",
  "test_date": "2026-04-28",
  "test_name": "Headline A/B Test — Homepage CTA",
  "element_tested": "headline",
  "variants": {
    "control": "Économisez du temps sur vos tâches",
    "challenger": "Économisez 4h/semaine sur vos tâches"
  },
  "results": {
    "winner": "challenger",
    "improvement": {
      "CTR": "+23%",
      "CVR": "+15%",
      "CPA": "-18%"
    },
    "statistical_significance": "p=0.023 (95% confidence)"
  },
  "learning": "Headlines avec chiffres concrets (4h/semaine) performent +23% mieux que les promesses vagues (gagner du temps). Principe applicable à tous les créatifs B2B SaaS.",
  "recommendation": "Systématiquement quantifier les bénéfices (heures, €, %) dans les headlines futurs"
}
```

**Documentation recommandée**:
- Screenshot des résultats (Meta Ads Manager, Google Ads)
- Export CSV des métriques
- Analyse écrite (1-2 paragraphes sur le "pourquoi" de la victoire)

## Output Format

```json
{
  "test_name": "Headline A/B Test — Homepage CTA",
  "element_tested": "headline",
  "hypothesis": "Headlines avec chiffres concrets augmentent le CTR de +15%",
  "variants": [
    {
      "id": "A",
      "type": "control",
      "description": "Économisez du temps sur vos tâches"
    },
    {
      "id": "B",
      "type": "challenger",
      "description": "Économisez 4h/semaine sur vos tâches"
    }
  ],
  "test_config": {
    "budget_per_variant": "$100",
    "duration": "14 jours",
    "min_impressions": 1500,
    "min_clicks": 30,
    "min_conversions": 10
  },
  "results": {
    "winner": "Variant B",
    "metrics": {
      "impressions": {"A": 2341, "B": 2298},
      "clicks": {"A": 47, "B": 58},
      "conversions": {"A": 12, "B": 18},
      "CTR": {"A": "2.0%", "B": "2.5%", "delta": "+23%"},
      "CVR": {"A": "25.5%", "B": "31.0%", "delta": "+15%"},
      "CPA": {"A": "$42.30", "B": "$35.20", "delta": "-18%"}
    },
    "statistical_significance": "p=0.023",
    "confidence": "95%"
  },
  "learning": "Headlines avec chiffres concrets performent +23% mieux en CTR. Applicable à tous les créatifs B2B SaaS.",
  "recommendation": "Implémenter Variant B sur toutes les campagnes Homepage CTA. Tester le même principe sur campagnes Feature Ads.",
  "next_test": "Tester le même headline avec visual screenshot vs lifestyle"
}
```

## Checklist Pré-Lancement

Avant de lancer un test créatif, vérifier:

- [ ] Hypothèse formulée clairement (Si...alors...parce que)
- [ ] 1 SEULE variable testée (pas de multi-varié)
- [ ] Budget minimum atteint ($50-200/variante selon plateforme)
- [ ] Durée minimum 7 jours (14 jours idéal)
- [ ] Split budget égal entre variantes (50/50 ou 33/33/33)
- [ ] Tracking configuré (conversion events, UTM parameters)
- [ ] Variantes créées par Milo (si visual/vidéo)
- [ ] Baseline metrics connues (CTR/CVR/CPA actuel)
- [ ] Critères de succès définis (ex: +10% CVR minimum)

## Anti-Patterns à Éviter

❌ **Arrêter un test après 2 jours** → pas assez de données, risque de faux positif
❌ **Tester 5 variantes avec $200 budget total** → $40/variante, trop faible
❌ **Changer headline + visual + CTA en même temps** → impossible d'interpréter
❌ **Déclarer un gagnant avec <30 conversions** → pas de signification statistique
❌ **Ne pas archiver les learnings** → répéter les mêmes erreurs
❌ **Tester pendant Black Friday** → saisonnalité biaise les résultats
❌ **Comparer des audiences différentes** → ce n'est pas un test créatif, c'est un test audience

## Ressources

- Meta A/B Test Best Practices: https://www.facebook.com/business/help/1738164643098669
- Google Ads Drafts & Experiments: https://support.google.com/google-ads/answer/6318732
- Statistical Significance Calculator: https://neilpatel.com/ab-testing-calculator/
- Sample Size Calculator: https://www.optimizely.com/sample-size-calculator/
