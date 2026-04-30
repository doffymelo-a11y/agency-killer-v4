# Cross-Platform Budget Allocator — Marcus Skill

## Déclencheur
- "répartis le budget entre plateformes"
- "optimise l'allocation budgétaire"
- "quel budget par canal?"
- Planning mensuel ou trimestriel
- Nouveau client sans historique (allocation initiale)

## Contexte

L'allocation budgétaire cross-platform est LA décision stratégique la plus impactante pour le ROI global. Une mauvaise répartition peut entraîner des dizaines de milliers d'euros gaspillés sur des canaux saturés ou sous-performants.

**Principe fondamental**: Allouer le budget selon le **ROAS marginal** de chaque plateforme, pas le ROAS absolu.

**ROAS marginal**: Le retour sur investissement d'1€ additionnel investi. Un canal avec ROAS 8.0 peut avoir un ROAS marginal de 2.0 si saturé, tandis qu'un canal avec ROAS 4.0 peut avoir un ROAS marginal de 6.0 si sous-utilisé.

**Règle d'or**: Allouer le budget aux canaux avec le ROAS marginal le plus élevé, jusqu'à atteindre le point de saturation, puis passer au canal suivant.

## Méthodologie Complète

### 1. Collecter les Performances Historiques (30 jours minimum)

**Données à extraire par plateforme**:

| Plateforme | Métriques essentielles | Source |
|------------|----------------------|--------|
| **Meta Ads** | Spend, Revenue, ROAS, CPA, CTR, Frequency | MCP tool: facebook_ads_get_insights |
| **Google Ads** | Spend, Revenue, ROAS, CPA, CTR, Conv Rate | MCP tool: google_ads_get_performance |
| **LinkedIn Ads** | Spend, Revenue, ROAS, CPA, CTR (B2B) | MCP tool: linkedin_ads_get_stats |
| **TikTok Ads** | Spend, Revenue, ROAS, CPA, CTR | MCP tool: tiktok_ads_get_data |
| **Twitter/X Ads** | Spend, Revenue, ROAS, CPA, Engagement | API Twitter Ads |

**Calculer le ROAS par plateforme**:
```
ROAS = Revenue / Spend
```

**Exemple dataset**:
- Meta Ads: $10,000 spend → $42,000 revenue → ROAS 4.2
- Google Ads: $8,000 spend → $52,000 revenue → ROAS 6.5
- LinkedIn Ads: $3,000 spend → $21,000 revenue → ROAS 7.0
- TikTok Ads: $2,000 spend → $6,000 revenue → ROAS 3.0

### 2. Calculer le ROAS Marginal par Plateforme

**Méthode d'estimation**:

1. **Si historique multi-budgets disponible**: Comparer ROAS à différents niveaux de budget
   - Ex: Google Ads à $5K/mois → ROAS 7.2, à $10K/mois → ROAS 6.0 → ROAS marginal ≈ 4.8

2. **Si pas d'historique multi-budgets**: Utiliser des indicateurs proxy
   - **Fréquence** (Meta): Si >2.5 → ROAS marginal faible (audience saturée)
   - **Impression Share** (Google): Si >80% → ROAS marginal faible (budget cap atteint)
   - **CTR decay** (tous): Si CTR en baisse >15% sur 30j → ROAS marginal faible (fatigue créative)

**Formule simplifiée ROAS marginal**:
```
ROAS_marginal = ROAS_actuel × (1 - saturation_score)

Avec saturation_score:
- Fréquence <2.0 → 0% saturation
- Fréquence 2.0-2.5 → 20% saturation
- Fréquence 2.5-3.0 → 40% saturation
- Fréquence >3.0 → 60%+ saturation
```

**Exemple calcul**:
- Meta Ads: ROAS 4.2, fréquence 2.8 → saturation 40% → ROAS marginal = 4.2 × 0.6 = **2.52**
- Google Ads: ROAS 6.5, impression share 45% → saturation 10% → ROAS marginal = 6.5 × 0.9 = **5.85**
- LinkedIn Ads: ROAS 7.0, fréquence 1.5 → saturation 0% → ROAS marginal = 7.0 × 1.0 = **7.00**
- TikTok Ads: ROAS 3.0, fréquence 1.2 → saturation 0% → ROAS marginal = 3.0 × 1.0 = **3.00**

**Ranking par ROAS marginal**:
1. LinkedIn → 7.00
2. Google Ads → 5.85
3. TikTok → 3.00
4. Meta Ads → 2.52

### 3. Allouer le Budget selon ROAS Marginal + Contraintes

**Règle d'allocation progressive**:

1. Allouer TOUT le budget au canal #1 (ROAS marginal max) jusqu'à atteindre son plafond de saturation
2. Le surplus va au canal #2, jusqu'à son plafond
3. Etc.

**Plafonds de saturation estimés** (à ajuster selon l'industrie):

| Plateforme | Plafond low saturation | Plafond medium saturation |
|------------|----------------------|---------------------------|
| **Meta Ads** | Fréquence <2.0 | Fréquence <2.5 |
| **Google Ads** | Impression Share <60% | Impression Share <80% |
| **LinkedIn Ads** | Spend <$5K/mois (audience B2B petite) | <$15K/mois |
| **TikTok Ads** | Fréquence <2.0 | Fréquence <3.0 |

**Exemple allocation progressive** (budget total $20K/mois):

1. **LinkedIn** (ROAS marginal 7.00):
   - Allouer jusqu'au plafond B2B → $5,000 max
   - Remaining: $15,000

2. **Google Ads** (ROAS marginal 5.85):
   - Allouer jusqu'à impression share 70% → estimation $12,000
   - Remaining: $3,000

3. **TikTok** (ROAS marginal 3.00):
   - Allouer le reste → $3,000

4. **Meta Ads** (ROAS marginal 2.52):
   - Budget épuisé, $0 alloué

**Allocation finale**:
- LinkedIn: $5,000 (25%)
- Google Ads: $12,000 (60%)
- TikTok: $3,000 (15%)
- Meta Ads: $0 (0%) → désactiver temporairement, refresh créatifs ou audiences

### 4. Règle 70/20/10 (Alternative Simplifiée)

**Si pas assez de données pour ROAS marginal**, utiliser la règle empirique 70/20/10:

- **70% du budget** → canal le plus performant (ROAS le plus élevé)
- **20% du budget** → second canal
- **10% du budget** → test nouveau canal ou canal exploratoire

**Quand utiliser 70/20/10?**
- Nouveau client sans historique >30 jours
- Campagnes saisonnières courtes (<2 mois)
- Budget total <$2,000/mois (trop faible pour optimisation fine)

**Exemple 70/20/10** (budget $5,000/mois):
- Google Ads (ROAS 6.5): $3,500 (70%)
- Meta Ads (ROAS 4.2): $1,000 (20%)
- TikTok Ads (nouveau): $500 (10%)

### 5. Ajustements par Industrie

#### E-commerce (Shopify, WooCommerce)

**Allocation type**:
- **Meta Ads**: 40-50% (catalogue produit, retargeting dynamique)
- **Google Shopping**: 30-40% (intent élevé)
- **Google Search**: 10-15% (branded keywords)
- **TikTok Ads**: 5-10% (testing, Gen Z audience)

**Raison**: E-commerce performe mieux sur Meta (visual, impulse buying) et Google Shopping (intent élevé)

**Minimums recommandés**:
- Meta Ads: $1,000/mois minimum (catalogue dynamique nécessite volume)
- Google Shopping: $500/mois minimum
- TikTok: $300/mois (testing)

**Saisonnalité forte**: +50-100% budget en Q4 (Black Friday, Noël), +30% en janvier (résolutions)

#### SaaS B2B

**Allocation type**:
- **LinkedIn Ads**: 40-50% (audience B2B, decision-makers)
- **Google Search**: 30-40% (intent élevé, brand + competitors keywords)
- **Meta Ads**: 10-15% (remarketing uniquement)
- **YouTube Ads**: 5-10% (thought leadership, demo videos)

**Raison**: SaaS B2B performe mieux sur LinkedIn (ciblage précis job titles) et Google Search (intent)

**Minimums recommandés**:
- LinkedIn Ads: $2,000/mois minimum (CPC élevé $5-15, CPL $50-200)
- Google Search: $1,500/mois minimum
- Meta Ads: $500/mois (remarketing uniquement)

**Saisonnalité faible**: Éviter décembre (budgets gelés), privilégier janvier-mars + septembre-novembre (nouveaux budgets fiscaux)

#### Lead Gen Local (plombier, avocat, dentiste)

**Allocation type**:
- **Google Search**: 60-70% (intent ultra-élevé, "plombier Paris 15" = lead chaud)
- **Google Maps**: 20-25% (local pack, mobile)
- **Meta Ads**: 10-15% (brand awareness géo-ciblée)

**Raison**: Local = intent-based, Google domine

**Minimums recommandés**:
- Google Search: $500/mois minimum (CPCs élevés en local)
- Google Maps: $200/mois minimum
- Meta Ads: $300/mois

**Saisonnalité forte par secteur**:
- Plomberie: pics hiver (chauffage) + été (climatisation)
- Avocat divorce: pic janvier (résolutions) + septembre (rentrée)
- Dentiste: pic septembre (rentrée) + janvier

#### E-learning / Formation en ligne

**Allocation type**:
- **YouTube Ads**: 35-45% (vidéo démo cours, long-form content)
- **Google Search**: 30-35% (requêtes "formation X", "apprendre Y")
- **Meta Ads**: 20-25% (retargeting, lookalike students)
- **LinkedIn Ads**: 5-10% (formations pro B2B uniquement)

**Raison**: E-learning performe sur YouTube (trust, demonstration) et Google Search (intent)

**Minimums recommandés**:
- YouTube Ads: $800/mois minimum
- Google Search: $600/mois minimum
- Meta Ads: $400/mois

**Saisonnalité forte**: Pics janvier (résolutions) + septembre (rentrée)

### 6. Ajustements Saisonniers

**Calendrier marketing annuel**:

| Période | Coefficient budget | Secteurs impactés | Raison |
|---------|-------------------|-------------------|--------|
| **Janvier** | +30% | SaaS, E-learning, Fitness, Finance | Résolutions, nouveaux budgets |
| **Février-Mars** | Baseline | Tous | Normal |
| **Avril-Mai** | Baseline | Tous | Normal |
| **Juin** | -10% | B2B | Vacances d'été approchent |
| **Juillet-Août** | -20% | B2B, Education | Vacances d'été |
| **Septembre** | +25% | Education, SaaS, Local services | Rentrée, nouveaux budgets Q4 |
| **Octobre** | +15% | E-commerce | Pré Black Friday |
| **Novembre** | +100% | E-commerce | Black Friday, Cyber Monday |
| **Décembre** | +50% puis -50% | E-commerce (pic début décembre), -50% B2B (budgets gelés) | Fêtes puis fermetures |

**Exemple ajustement saisonnier** (SaaS B2B, budget baseline $10K/mois):
- Janvier: $13,000 (+30%)
- Juillet-Août: $8,000 (-20%)
- Septembre: $12,500 (+25%)
- Décembre: $5,000 (-50%, budgets gelés)

**Événements ponctuels** (pics +50-200% budget):
- Black Friday / Cyber Monday (dernier weekend novembre)
- Prime Day Amazon (mi-juillet)
- Soldes (janvier + juillet en France)
- Saint-Valentin (février, e-commerce cadeaux)
- Noël (tout décembre, e-commerce)

### 7. Vérifier les Minimums Techniques par Plateforme

**Budgets MINIMUM absolus** (en-dessous = algorithme inefficace):

| Plateforme | Budget minimum/jour | Budget minimum/mois | Raison |
|------------|---------------------|---------------------|--------|
| **Meta Ads** | $5-10/jour | $150-300/mois | CBO nécessite volume pour optimiser |
| **Google Ads Search** | $10-15/jour | $300-450/mois | CPC élevés (moyenne $2-5) |
| **Google Ads Display** | $5-8/jour | $150-240/mois | CPM bas, volume nécessaire |
| **LinkedIn Ads** | $10-15/jour | $300-450/mois | CPC très élevés ($5-15), CPL $50-200 |
| **TikTok Ads** | $20/jour (minimum plateforme) | $600/mois | Minimum imposé par TikTok |
| **Twitter/X Ads** | $5-10/jour | $150-300/mois | Audience limitée |
| **YouTube Ads** | $10-15/jour | $300-450/mois | CPV $0.10-0.30, volume nécessaire |

**Règle**: Si budget total <$1,500/mois, concentrer sur 1-2 plateformes MAX. Ne PAS diluer sur 4-5 plateformes.

**Exemple mauvaise allocation** (budget $1,000/mois, 4 plateformes):
- Meta: $250 (trop faible, pas d'optimisation)
- Google: $250 (trop faible)
- LinkedIn: $250 (trop faible pour B2B)
- TikTok: $250 (trop faible)
→ Aucune plateforme n'atteint la masse critique, ROAS global faible

**Bonne allocation** (budget $1,000/mois, 2 plateformes):
- Google Ads: $700 (masse critique atteinte)
- Meta Ads: $300 (masse critique atteinte)
→ ROAS global optimisé

### 8. Rebalancing Mensuel (Révision Obligatoire)

**Fréquence de révision**:
- Budget <$5K/mois: **révision toutes les 4 semaines**
- Budget $5-20K/mois: **révision toutes les 2 semaines**
- Budget >$20K/mois: **révision hebdomadaire**

**Processus de rebalancing**:
1. Extraire performances des 30 derniers jours (ROAS, CPA, Spend par plateforme)
2. Re-calculer ROAS marginal (saturation scores actualisés)
3. Identifier plateformes sur-performantes (ROAS marginal >target) → augmenter budget
4. Identifier plateformes sous-performantes (ROAS marginal <target) → réduire budget
5. Appliquer changements progressivement (+/-20% max par semaine)

**Seuils de rebalancing**:
- Si ROAS plateforme varie >30% vs mois précédent → rebalancing immédiat
- Si nouveau canal atteint ROAS >150% du canal principal → rebalancing immédiat
- Si saturation détectée (fréquence >2.5, impression share >80%) → rebalancing immédiat

## Output Format

```json
{
  "budget_total_monthly": "$20,000",
  "allocation_strategy": "ROAS Marginal + Industry Best Practices",
  "industry": "SaaS B2B",
  "seasonal_adjustment": "September +25% (rentrée, nouveaux budgets Q4)",
  "allocation": [
    {
      "platform": "LinkedIn Ads",
      "budget_monthly": "$8,000",
      "budget_daily": "$267",
      "percent": "40%",
      "roas_current": 7.0,
      "roas_marginal": 7.0,
      "saturation_score": "0% (fréquence 1.5)",
      "reason": "Highest ROAS marginal, B2B decision-makers, no saturation"
    },
    {
      "platform": "Google Search",
      "budget_monthly": "$7,000",
      "budget_daily": "$233",
      "percent": "35%",
      "roas_current": 6.5,
      "roas_marginal": 5.85,
      "saturation_score": "10% (impression share 45%)",
      "reason": "Second highest ROAS marginal, high intent keywords"
    },
    {
      "platform": "Meta Ads (Remarketing)",
      "budget_monthly": "$3,000",
      "budget_daily": "$100",
      "percent": "15%",
      "roas_current": 4.2,
      "roas_marginal": 2.52,
      "saturation_score": "40% (fréquence 2.8)",
      "reason": "Remarketing only, audience saturée, creative refresh needed"
    },
    {
      "platform": "YouTube Ads",
      "budget_monthly": "$2,000",
      "budget_daily": "$67",
      "percent": "10%",
      "roas_current": "N/A (nouveau canal)",
      "roas_marginal": "N/A (testing)",
      "saturation_score": "0%",
      "reason": "Test thought leadership videos + product demos"
    }
  ],
  "projected_roas_blended": 6.2,
  "minimum_checks": {
    "linkedin_minimum_met": true,
    "google_minimum_met": true,
    "meta_minimum_met": true,
    "youtube_minimum_met": true
  },
  "rebalancing_schedule": "Every 2 weeks (budget $20K range)",
  "alerts": [
    "Meta Ads: Fréquence 2.8 → saturation détectée → refresh créatifs (demander Milo)",
    "YouTube Ads: Nouveau canal → monitorer ROAS après 30 jours, ajuster si <4.0"
  ],
  "next_review_date": "2026-05-15"
}
```

## Checklist Allocation

Avant de valider une allocation budgétaire:

- [ ] Performances collectées sur 30+ jours minimum
- [ ] ROAS marginal calculé pour chaque plateforme (ou proxy saturation)
- [ ] Minimums techniques respectés ($150-600/mois selon plateforme)
- [ ] Ajustements industrie appliqués (e-commerce, SaaS, local, e-learning)
- [ ] Ajustements saisonniers appliqués (Q4, rentrée, été)
- [ ] Budget total >$1,500/mois OU limité à 1-2 plateformes si <$1,500
- [ ] Plan de rebalancing défini (fréquence révision)
- [ ] Plateformes saturées identifiées (fréquence >2.5, refresh créatifs planifié)

## Anti-Patterns à Éviter

❌ **Diluer budget sur 5 plateformes avec <$2K/mois** → aucune n'atteint masse critique
❌ **Allouer selon ROAS absolu, ignorer saturation** → sur-investir canaux saturés
❌ **Ne jamais rebalancer** → rester figé sur allocation initiale pendant 6 mois
❌ **Ignorer minimums techniques** → $100/mois sur LinkedIn Ads (CPC $10) = 10 clics/mois, inutile
❌ **Ne pas ajuster selon saisonnalité** → même budget août et novembre (e-commerce)
❌ **Couper budget plateforme à 0% brutalement** → perdre l'apprentissage algorithme
❌ **Allouer 50/50 sans raison** → arbitraire, pas data-driven

## Ressources

- Meta Budget Allocation Guide: https://www.facebook.com/business/help/1757781947846347
- Google Ads Budget Recommendations: https://support.google.com/google-ads/answer/2375454
- LinkedIn Ads Budgeting Best Practices: https://business.linkedin.com/marketing-solutions/ad-budget
- Seasonal Marketing Calendar: https://www.wordstream.com/blog/ws/2021/12/07/marketing-calendar
