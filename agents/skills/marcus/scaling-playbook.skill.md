# Scaling Playbook — Marcus Skill

## Déclencheur
- "scale la campagne"
- "augmente le budget"
- Campagne avec **ROAS >5.0** pendant **7+ jours consécutifs**
- CPA **stable ou en baisse** (variation <10%)
- Fréquence < 2.0 (audience pas saturée)

## Contexte

Le scaling est l'art de maximiser les revenus tout en maintenant un ROAS/CPA rentable. C'est le moment le plus critique d'une campagne publicitaire — mal exécuté, il peut détruire les performances en quelques heures.

**Règle d'or**: Scale progressivement et monitore EN TEMPS RÉEL. Les algorithmes des plateformes (Meta CBO, Google Smart Bidding) sont sensibles aux changements brutaux de budget — un +100% en 1 jour peut causer un reset complet de l'apprentissage.

**Principe fondamental**: Scaling horizontal AVANT scaling vertical. Toujours privilégier l'ajout de nouvelles audiences/placements/créatifs avant d'augmenter le budget sur une audience existante (risque de saturation).

## Méthodologie Complète

### 1. Vérifier la Stabilité (Pré-requis OBLIGATOIRES)

**Ne JAMAIS scaler si ces conditions ne sont PAS remplies:**

✅ **ROAS > 5.0** (ou CPA < target) pendant **minimum 7 jours consécutifs**
- Évite les faux signaux (1-2 bons jours suivis d'un crash)
- 7 jours = capture week-end + jours de semaine

✅ **CPA variance < 10%**
- Calculer l'écart-type du CPA sur 7 jours
- Si écart-type / moyenne > 0.10 → attendre stabilisation

✅ **Fréquence < 2.0**
- Fréquence = impressions / reach
- Si >2.0 → audience saturée, scaling vertical impossible
- Si >3.0 → remplacer l'audience ou les créatifs AVANT de scaler

✅ **CTR stable ou en hausse** (variation >-10% acceptable)
- CTR decay = signal de saturation créative
- Si CTR baisse >15% → refresh créatifs AVANT de scaler

✅ **Budget dépensé à 95-100%** (pas de underspend)
- Si la campagne ne dépense pas tout son budget actuel → problème de ciblage ou d'enchère
- Résoudre AVANT de scaler

**Indicateurs de RED FLAG** (ne PAS scaler):
- ❌ ROAS fluctue entre 3.0 et 8.0 (instable)
- ❌ CPA augmente >15% sur 3 jours consécutifs
- ❌ Fréquence >2.5
- ❌ CTR en baisse >20% sur 7 jours
- ❌ Taux d'approbation des ads <95% (ads rejetées)

### 2. Scaling Horizontal (Étape 1 — TOUJOURS en premier)

**Définition**: Ajouter de nouvelles audiences, placements ou créatifs SANS augmenter le budget par dollar dépensé.

**Avantages**:
- Évite la saturation d'audience (frequency cap)
- Maintient l'efficacité de l'algorithme (nouveaux signaux)
- Réduit le risque de CPA spike

**Tactiques de scaling horizontal**:

#### A. Expansion d'Audience

**1. Lookalike Audiences (Meta/TikTok)**
- Passer de LAL 1% à LAL 1-2% → +100% de reach
- Passer de LAL 1-2% à LAL 1-3% → +50% de reach supplémentaire
- Budget additionnel: même budget que l'audience source (ex: LAL 1% à $100/j → LAL 2-3% à $100/j également)

**2. Audiences similaires géographiques**
- Si France performante → ajouter Belgique, Suisse, Canada (francophones)
- Si US performante → ajouter Canada, UK, Australie (anglophones)
- Budget par pays: 50% du budget du pays source (ex: US $200/j → UK $100/j)

**3. Élargissement d'intérêts (Meta)**
- Si audience "Marketing" performante → ajouter "Digital Marketing", "Growth Hacking", "SEO"
- Créer de nouvelles ad sets avec audiences orthogonales (pas de chevauchement >20%)

**4. Conquest audiences (Google)**
- Si vos Brand Keywords performent → ajouter Competitors Keywords
- Budget: 30-40% du budget Brand (competitor CPCs plus élevés)

#### B. Expansion de Placements

**Meta Ads**:
- Si Feed seul performe → ajouter Stories + Reels
- Si Stories performe → ajouter Messenger + Audience Network
- Budget par placement: 40-60% du budget Feed (Reels + Stories généralement moins chers)

**Google Ads**:
- Si Search performe → ajouter Display Remarketing
- Si Display performe → ajouter YouTube In-Stream
- Budget: Search budget × 0.3 pour Display, × 0.5 pour YouTube

**LinkedIn Ads**:
- Si Sponsored Content performe → ajouter Message Ads
- Si Feed performe → ajouter Conversation Ads
- Budget: Feed budget × 0.4 pour Message Ads (CPC plus élevé mais CVR meilleur)

#### C. Expansion Créative

**Nombre de créatifs minimum par ad set** (pour éviter la fatigue):
- Meta: **3-5 créatifs** actifs simultanément
- Google Display: **6-8 créatifs** (formats multiples)
- LinkedIn: **2-3 créatifs** (audience B2B plus petite)

**Stratégie de rotation**:
1. Lancer 3 nouveaux créatifs en parallèle des 2 actuels performants
2. Après 7 jours, désactiver les 2 moins performants
3. Répéter le cycle toutes les 2-3 semaines (avant saturation)

**Demander à Milo**:
- Variantes du gagnant actuel (même concept, nouvelle exécution)
- Nouveau hook ou angle (ex: "Économisez du temps" → "Augmentez votre ROI")
- Nouveau format (ex: image statique → vidéo courte)

### 3. Scaling Vertical (Étape 2 — APRÈS horizontal)

**Définition**: Augmenter le budget d'une campagne/ad set existante.

**Règle de scaling vertical**: **+20% maximum par jour**, jamais +50%.

**Pourquoi +20% max?**
- Les algorithmes (Meta CBO, Google Smart Bidding) utilisent 7 jours d'historique pour optimiser
- Un changement >20% peut causer un "reset" partiel de l'apprentissage → spike de CPA pendant 24-48h
- Meta recommande officiellement +10-20% max par jour

**Calcul du plan de scaling**:

**Exemple**: Budget actuel $50/jour, ROAS 6.0, objectif $200/jour

| Jour | Budget | Variation | ROAS attendu |
|------|--------|-----------|--------------|
| J0 | $50 | - | 6.0 (baseline) |
| J1 | $60 | +20% | 5.8-6.2 (monitoring) |
| J2 | $72 | +20% | 5.6-6.0 |
| J3 | $86 | +20% | 5.4-5.8 |
| J4 | $103 | +20% | 5.2-5.6 |
| J5 | $124 | +20% | 5.0-5.4 |
| J6 | $149 | +20% | 4.8-5.2 |
| J7 | $179 | +20% | 4.6-5.0 |
| J8 | $200 | +12% | 4.5-5.0 ✅ |

**Durée totale**: 8 jours pour passer de $50 à $200/jour (4x budget)

**Monitoring quotidien OBLIGATOIRE**:
- Vérifier le ROAS/CPA CHAQUE MATIN à 9h
- Si CPA augmente >15% vs baseline → **PAUSE le scaling immédiatement** et revenir au budget de J-1
- Si CPA stable → continuer le plan

**Seuils d'alerte** (stop scaling, revenir au budget précédent):
- CPA +15% vs baseline
- ROAS -20% vs baseline
- Fréquence >2.5
- CTR -25% vs baseline
- Underspend >20% (algorithme saturé)

### 4. Cas de Figure Spécifiques

#### Cas A: Scaling après Learning Phase (Meta Ads)

**Contexte**: Campagne Meta sort de Learning Phase (50+ conversions en 7 jours), performances stables.

**Stratégie**:
1. **Ne PAS modifier le budget pendant 3 jours** après la sortie de Learning Phase (consolider l'apprentissage)
2. Scaling horizontal d'abord: dupliquer l'ad set gagnant avec une nouvelle audience LAL 2-3%
3. Après 7 jours, si la nouvelle ad set performe, scaler verticalement les 2 ad sets à +15%/jour
4. Éviter de modifier l'ad set source (celui qui vient de sortir de Learning Phase) — Meta pénalise les modifications

**Budget minimum**: $200/jour pour maintenir 50+ conversions/semaine (éviter de retomber en Learning)

#### Cas B: Scaling avec Nouveau Créatif

**Contexte**: Les créatifs actuels commencent à fatiguer (CTR -20%, fréquence 3.0+), Milo a produit de nouveaux créatifs.

**Stratégie**:
1. Créer une NOUVELLE ad set avec les nouveaux créatifs (ne PAS remplacer dans l'ad set actuel → reset algorithme)
2. Budget de la nouvelle ad set: 50% du budget de l'ad set actuelle
3. Laisser tourner les 2 ad sets en parallèle pendant 7 jours
4. Après 7 jours:
   - Si nouvelle ad set performe mieux → scaler à 100%, réduire ancienne à 0%
   - Si ancienne ad set still performe → garder les 2 actives (diversification créative)

**Fréquence de refresh créatif**:
- B2C e-commerce: **toutes les 2-3 semaines** (fatigue rapide)
- B2B SaaS: **toutes les 4-6 semaines** (cycle plus long)
- Lead gen local: **toutes les 3-4 semaines**

#### Cas C: Scaling Géographique

**Contexte**: Campagne France performante (ROAS 6.0, $300/jour), objectif expand Belgique + Suisse.

**Stratégie**:
1. Créer des campagnes SÉPARÉES par pays (pas de multi-country dans 1 campagne — différences de langue, CPC, audiences)
2. Budget par nouveau pays:
   - Belgique: 30-40% du budget France (population 6x plus petite)
   - Suisse: 20-30% du budget France (population 8x plus petite, CPC +50% plus cher)
3. Adapter les créatifs:
   - Belgique: français ET néerlandais (50% de la pop parle néerlandais)
   - Suisse: français + allemand (60% allemand, 40% français)
4. Attendre 14 jours de stabilité avant de scaler verticalement

**Budget minimum par pays**: $50/jour (sinon pas assez de volume pour l'algorithme)

### 5. Monitoring Post-Scale (7 jours)

**KPIs à monitorer quotidiennement**:

| KPI | Seuil GREEN | Seuil ORANGE | Seuil RED |
|-----|-------------|--------------|-----------|
| **CPA vs baseline** | -10% à +5% | +5% à +15% | >+15% |
| **ROAS vs baseline** | -5% à +10% | -10% à -5% | <-10% |
| **Fréquence** | <2.0 | 2.0-2.5 | >2.5 |
| **CTR vs baseline** | -5% à +20% | -10% à -5% | <-10% |
| **Underspend %** | 0-5% | 5-15% | >15% |

**Actions selon couleur**:
- 🟢 GREEN: Continuer le scaling plan
- 🟠 ORANGE: Pause scaling, monitorer 48h
- 🔴 RED: Rollback au budget précédent, analyser la cause

**Causes fréquentes de scaling fail**:
1. **Saturation d'audience**: Fréquence >2.5 → ajouter nouvelles audiences
2. **Fatigue créative**: CTR decay >15% → refresh créatifs
3. **Changement algorithme**: CPA spike soudain → attendre 48-72h (Meta/Google ajustent souvent)
4. **Saisonnalité**: CPA spike pendant Black Friday, Noël → normal, ne pas paniquer
5. **Budget cap plateforme**: Meta limite certaines campagnes à $X/jour si nouvel ad account → contacter support

### 6. Préparer les Créatifs de Relève

**Anticipation obligatoire**: Toujours avoir 3-5 créatifs "en réserve" AVANT de scaler.

**Workflow avec Milo**:
1. Identifier le créatif gagnant actuel (meilleur CTR + CVR)
2. Demander à Milo de créer 3 variantes:
   - Variante 1: Même concept, nouvelle exécution (ex: autre photo, même headline)
   - Variante 2: Nouveau hook (ex: "Gagnez du temps" → "Augmentez votre ROI")
   - Variante 3: Nouveau format (ex: image → vidéo 15s)
3. Tester les 3 variantes avec $50/variante pendant 7 jours
4. Le gagnant devient la nouvelle baseline, répéter le cycle

**Fréquence de production**:
- Si budget <$500/jour: 3 nouveaux créatifs toutes les 3 semaines
- Si budget $500-2,000/jour: 5 nouveaux créatifs toutes les 2 semaines
- Si budget >$2,000/jour: 10 nouveaux créatifs par semaine (volume élevé = fatigue rapide)

## Output Format

```json
{
  "campaign_name": "Meta Conv France — Homepage CTA",
  "current_status": {
    "budget_daily": "$50",
    "roas_7d": 6.2,
    "cpa_7d": "$18.50",
    "frequency_7d": 1.8,
    "ctr_7d": "2.4%"
  },
  "scaling_recommendation": "APPROVED",
  "scaling_type": "Horizontal + Vertical",
  "scaling_plan": [
    {
      "week": 1,
      "action": "Horizontal - Duplicate ad set with LAL 2-3% audience",
      "budget": "$100 ($50 existing + $50 new ad set)",
      "expected_roas": "5.8-6.4"
    },
    {
      "week": 2,
      "action": "Vertical - Scale both ad sets +20%/day for 5 days",
      "budget": "$145 ($72.50 per ad set)",
      "expected_roas": "5.6-6.0"
    },
    {
      "week": 3,
      "action": "Horizontal - Add Stories + Reels placements",
      "budget": "$180 ($90 Feed + $90 Stories/Reels)",
      "expected_roas": "5.4-5.8"
    },
    {
      "week": 4,
      "action": "Vertical - Final scale to $200/day",
      "budget": "$200",
      "expected_roas": "5.2-5.6"
    }
  ],
  "monitoring_kpis": {
    "cpa_threshold_red": "$21.30 (+15% vs baseline $18.50)",
    "roas_threshold_red": "4.96 (-20% vs baseline 6.2)",
    "frequency_threshold_red": 2.5,
    "ctr_threshold_red": "1.8% (-25% vs baseline 2.4%)"
  },
  "creatives_needed": {
    "week_1": "3 new creatives (same concept, new execution)",
    "week_3": "5 new creatives for Stories/Reels (vertical format 9:16)"
  },
  "rollback_plan": "If CPA >$21.30 or ROAS <4.96 for 2 consecutive days, revert to previous day's budget immediately",
  "estimated_timeline": "28 days to reach $200/day from $50/day (4x scale)"
}
```

## Checklist Pré-Scale

Avant de lancer un scaling plan, vérifier:

- [ ] ROAS >5.0 (ou CPA <target) pendant 7+ jours consécutifs
- [ ] CPA variance <10% (stable)
- [ ] Fréquence <2.0 (audience pas saturée)
- [ ] CTR stable ou en hausse (variation >-10% acceptable)
- [ ] Budget dépensé à 95-100% (pas de underspend)
- [ ] 3-5 créatifs de relève prêts (produits par Milo)
- [ ] Plan de scaling défini (horizontal AVANT vertical)
- [ ] Seuils d'alerte calculés (CPA +15%, ROAS -20%)
- [ ] Monitoring quotidien configuré (check daily à 9h)
- [ ] Rollback plan documenté

## Anti-Patterns à Éviter

❌ **Scaler trop vite** (+50% ou +100% budget en 1 jour) → reset algorithme, CPA spike
❌ **Scaler verticalement avant horizontalement** → saturation audience, fréquence >3.0
❌ **Scaler sans monitoring** → CPA peut doubler en 24h sans réaction
❌ **Scaler pendant Learning Phase** (Meta) → rallonge la Learning Phase
❌ **Modifier les ad sets performants** → reset algorithme, perte de performances
❌ **Scaler sans créatifs de relève** → fatigue créative après 2-3 semaines
❌ **Scaler pendant événements** (Black Friday, Noël) → biais saisonnier, résultats non représentatifs
❌ **Ignorer les seuils d'alerte** → continuer à scaler alors que CPA +20% → perte de rentabilité

## Ressources

- Meta Scaling Best Practices: https://www.facebook.com/business/help/1746615052268668
- Google Smart Bidding Guide: https://support.google.com/google-ads/answer/7065882
- LinkedIn Campaign Scaling: https://business.linkedin.com/marketing-solutions/ad-scaling
