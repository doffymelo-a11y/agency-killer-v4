# Budget Optimizer Weekly — Marcus Skill

## Déclencheur
- **Automatique chaque lundi 9h** (workflow cron)
- User dit : "optimise le budget"
- User dit : "réalloue les budgets"
- Fin de semaine (dimanche soir) avec performances disponibles

## Contexte

L'optimisation budgétaire hebdomadaire est l'exercice le plus rentable qu'un media buyer puisse faire. En réallouant 10-20% du budget des campagnes sous-performantes vers les gagnantes, on peut améliorer le ROAS global de 15-30% sans toucher aux créatifs ou audiences.

**Règle d'or**: Optimiser CHAQUE semaine, sans exception. Les algorithmes Meta/Google évoluent constamment — une campagne gagnante peut devenir perdante en 7 jours (fatigue créative, saturation audience, changement algo).

**Principe fondamental**: Data-driven decisions. Pas de décision basée sur l'intuition ou les préférences personnelles. Les chiffres décident.

## Méthodologie Complète

### 1. Collecter Performances (7 derniers jours)

**Métriques à extraire PAR CAMPAGNE**:

| Métrique | Source | Seuil critique |
|----------|--------|----------------|
| **Spend** | Meta/Google/LinkedIn Ads | >95% budget alloué = OK, <80% = underspend |
| **Revenue** | Pixels conversion / GA4 | Attribution last-click 7 jours |
| **ROAS** | Revenue / Spend | >5.0 = excellent, 3-5 = bon, 1.5-3 = faible, <1.5 = critique |
| **CPA** | Spend / Conversions | Comparer au target CPA du projet |
| **CTR** | Clicks / Impressions | Déclin >15% = fatigue créative |
| **Fréquence** | Impressions / Reach (Meta uniquement) | >3.0 = saturation, >2.5 = warning |
| **Conversions** | Total conversions 7j | Minimum 30 conversions/semaine pour significativité |

**Période d'analyse**: **Exactement 7 jours** (lundi 00h00 → dimanche 23h59)
- Évite les biais de jours de semaine (lundi-vendredi) vs week-end
- Capture les variations hebdomadaires (paie bi-mensuelle, cycles B2B)

**Exemple dataset extrait**:
```
Campagne A (Meta Conv France): $500 spend, $3,000 revenue, ROAS 6.0, CPA $25, CTR 2.4%, Freq 1.8
Campagne B (Google Search Bio): $400 spend, $480 revenue, ROAS 1.2, CPA $80, CTR 3.1%, Freq N/A
Campagne C (LinkedIn B2B SaaS): $300 spend, $1,500 revenue, ROAS 5.0, CPA $50, CTR 1.2%, Freq 1.5
Campagne D (Meta Stories): $200 spend, $800 revenue, ROAS 4.0, CPA $30, CTR 1.8%, Freq 2.9
```

### 2. Matrice de Décision (Règles Strictes)

**Décision basée sur ROAS + Contexte**:

#### SCALE (+15-30% budget)
**Conditions (TOUTES obligatoires)**:
- ✅ ROAS >5.0 (ou >target ROAS projet)
- ✅ CPA stable ou en baisse (variance <15% sur 7j)
- ✅ Fréquence <2.0 (audience pas saturée)
- ✅ CTR stable ou en hausse (variance >-10%)
- ✅ Budget dépensé >95% (pas de underspend)
- ✅ Minimum 50 conversions sur 7j (significativité statistique)

**Action**: Augmenter budget de **+20%** (max +30% si ROAS >7.0)

**Exemple**:
- Campagne A: ROAS 6.0, fréquence 1.8, CTR stable → SCALE +20% ($500 → $600/semaine)

#### HOLD (budget inchangé, optimiser créatifs/audiences)
**Conditions**:
- ROAS entre 3.0 et 5.0 (bon mais pas excellent)
- OU fréquence entre 2.0 et 2.5 (début saturation)
- OU CTR en baisse 10-20% (début fatigue créative)

**Action**: Budget inchangé, MAIS:
1. Demander à Milo de créer 2-3 nouveaux créatifs (refresh)
2. OU tester une nouvelle audience lookalike/similaire
3. OU ajuster placements (ex: ajouter Reels si Feed saturé)

**Exemple**:
- Campagne D: ROAS 4.0, fréquence 2.9 → HOLD + refresh créatifs (fatigue détectée)

#### OPTIMIZE (réduire budget -20-30%, tester changements)
**Conditions**:
- ROAS entre 1.5 et 3.0 (sous-performant mais récupérable)
- ET/OU fréquence >2.5 (saturation audience)
- ET/OU CTR en baisse >20% (fatigue créative sévère)
- ET/OU CPA >150% du target

**Action**: Réduire budget de **-30%** ET changer 1 variable:
1. Nouvelle audience (LAL différent %)
2. Nouveaux créatifs (Milo)
3. Nouveau placement (Feed → Stories)
4. Nouvelle stratégie enchères (CPA target → ROAS target)

**Exemple**:
- Campagne hypothétique: ROAS 2.5, fréquence 3.2, CTR -25% → OPTIMIZE -30% + nouveaux créatifs

#### KILL (couper budget à 0%, arrêter la campagne)
**Conditions (1 seule suffit)**:
- ❌ ROAS <1.5 pendant 7+ jours consécutifs
- ❌ CPA >200% du target
- ❌ Underspend chronique (<70% budget dépensé = algo n'arrive pas à dépenser)
- ❌ Fréquence >4.0 (saturation extrême, aucune nouvelle personne atteinte)
- ❌ Taux de rejet ads >20% (Meta/Google rejettent les ads)

**Action**: **Couper immédiatement** (budget à $0)

**Raison**: Récupérer une campagne ROAS <1.5 nécessite un pivot complet (nouvelle audience + nouveaux créatifs + nouvelle stratégie) — plus efficace de créer une NOUVELLE campagne from scratch.

**Exemple**:
- Campagne B: ROAS 1.2, CPA $80 (target $30) → KILL immédiatement

### 3. Vérifications Complémentaires

#### A. Spend Velocity (Budget Pace)

**Objectif**: Vérifier que le budget mensuel sera dépensé entièrement (ni underspend ni overspend).

**Formule**:
```
Spend_pace = (Spend_actuel / Jours_écoulés) × Jours_total_mois
Budget_restant = Budget_mensuel - Spend_actuel
Jours_restants = Jours_total_mois - Jours_écoulés

On_track = (Budget_restant / Jours_restants) ≈ Spend_quotidien_actuel
```

**Exemple** (15ème jour du mois):
- Budget mensuel: $3,000
- Spend actuel (J1-J15): $1,200
- Spend quotidien actuel: $1,200 / 15 = $80/jour
- Projection fin de mois: $80 × 30 = $2,400 (sous-dépense de $600)

**Action**: Augmenter budgets des campagnes performantes de +25% pour atteindre $100/jour et finir le mois à $3,000.

**Seuils d'alerte**:
- Projection <85% du budget mensuel → sous-dépense, augmenter budgets
- Projection >115% du budget mensuel → sur-dépense, réduire budgets ou arrêter campagnes faibles

#### B. Fatigue Créative (Fréquence + CTR Decay)

**Indicateurs de fatigue**:

| Indicateur | Seuil warning | Seuil critique | Action |
|------------|---------------|----------------|--------|
| **Fréquence** (Meta) | >2.0 | >2.5 | Refresh créatifs |
| **CTR decay** | -15% vs semaine précédente | -25% | Refresh créatifs urgent |
| **Engagement rate decay** | -20% | -30% | Refresh créatifs + audience |
| **CPA inflation** | +20% | +40% | Pause campagne, diagnostic complet |

**Action automatique**:
- Si 2+ indicateurs en zone warning → Créer task "Refresh créatifs" pour Milo
- Si 1+ indicateur en zone critique → Pause campagne immédiatement + task urgente

#### C. Saturation Audience (Fréquence + Reach Plateau)

**Formule détection saturation** (Meta uniquement):
```
Reach_growth = (Reach_semaine_actuelle - Reach_semaine_précédente) / Reach_semaine_précédente
Saturation = (Fréquence >2.5) ET (Reach_growth <5%)
```

**Exemple**:
- Semaine 1: Reach 50,000, Frequency 1.5
- Semaine 2: Reach 52,000 (+4%), Frequency 2.8
→ Saturation détectée (reach growth faible + fréquence élevée)

**Action**: Élargir audience (LAL 1% → LAL 1-2%) OU tester nouvelle audience géographique

### 4. Calculer Nouvelle Répartition Budgétaire

**Règle de réallocation**:
1. Calculer le budget total libéré par les campagnes KILL + OPTIMIZE
2. Réallouer 100% de ce budget vers les campagnes SCALE
3. Les campagnes HOLD gardent leur budget actuel

**Exemple calcul**:

**Budget actuel**:
- Campagne A (SCALE): $500/semaine
- Campagne B (KILL): $400/semaine
- Campagne C (HOLD): $300/semaine
- Campagne D (OPTIMIZE -30%): $200/semaine → $140/semaine
- **Total**: $1,400/semaine

**Budget libéré**:
- Campagne B coupée: +$400
- Campagne D réduite: +$60
- **Total libéré**: $460

**Nouvelle répartition**:
- Campagne A (SCALE +20% de base + réallocation): $500 × 1.20 + $460 = $1,060/semaine
- Campagne B (KILL): $0
- Campagne C (HOLD): $300/semaine (inchangé)
- Campagne D (OPTIMIZE -30%): $140/semaine
- **Total nouveau**: $1,500/semaine (+$100 vs avant, car on scale A)

**ROAS projeté**:
```
ROAS_blended = (Revenue_A + Revenue_C + Revenue_D) / (Spend_A + Spend_C + Spend_D)
Revenue_A_nouveau = $1,060 × 6.0 = $6,360
Revenue_C = $300 × 5.0 = $1,500
Revenue_D_nouveau = $140 × 2.5 = $350
ROAS_blended = ($6,360 + $1,500 + $350) / ($1,060 + $300 + $140) = 8,210 / 1,500 = 5.47
```

**Amélioration**: ROAS global passe de ~3.5 à 5.47 (+56%!)

### 5. Soumettre Approval (si changement >20%)

**Seuil de changement significatif**: Si budget total varie >20% OU si >2 campagnes changent d'action.

**Approval request format**:
- Résumé exécutif (1-2 phrases)
- Table comparative avant/après
- Impact ROAS projeté
- Actions à prendre (refresh créatifs, nouvelles audiences)

**Validation utilisateur obligatoire** si:
- Budget total augmente >30%
- 1+ campagne avec spend >$1,000/semaine est killée
- ROAS projeté baisse (rare, mais possible si data incomplète)

## Output Format

```json
{
  "type": "BUDGET_OPTIMIZATION_WEEKLY",
  "week": "2026-W18 (28 avril - 4 mai)",
  "total_budget_current": "$1,400/semaine",
  "total_budget_new": "$1,500/semaine",
  "budget_change": "+$100/semaine (+7%)",
  "campaigns": [
    {
      "name": "Meta Conv France",
      "platform": "meta",
      "action": "SCALE",
      "roas_7d": 6.0,
      "cpa_7d": "$25",
      "frequency": 1.8,
      "ctr_change": "+2%",
      "budget_current": "$500/semaine",
      "budget_new": "$1,060/semaine",
      "budget_change": "+$560 (+112%)",
      "reason": "ROAS excellent (6.0), no saturation (freq 1.8), CTR stable"
    },
    {
      "name": "Google Search Bio",
      "platform": "google",
      "action": "KILL",
      "roas_7d": 1.2,
      "cpa_7d": "$80",
      "ctr_change": "-5%",
      "budget_current": "$400/semaine",
      "budget_new": "$0",
      "budget_change": "-$400 (-100%)",
      "reason": "ROAS <1.5 (critique), CPA 267% au-dessus target ($30)"
    },
    {
      "name": "LinkedIn B2B SaaS",
      "platform": "linkedin",
      "action": "HOLD",
      "roas_7d": 5.0,
      "cpa_7d": "$50",
      "frequency": 1.5,
      "ctr_change": "-8%",
      "budget_current": "$300/semaine",
      "budget_new": "$300/semaine",
      "budget_change": "$0",
      "reason": "ROAS bon (5.0) mais CTR decay -8% → refresh créatifs recommandé"
    },
    {
      "name": "Meta Stories",
      "platform": "meta",
      "action": "OPTIMIZE",
      "roas_7d": 4.0,
      "cpa_7d": "$30",
      "frequency": 2.9,
      "ctr_change": "-18%",
      "budget_current": "$200/semaine",
      "budget_new": "$140/semaine",
      "budget_change": "-$60 (-30%)",
      "reason": "Fréquence 2.9 (saturation), CTR decay -18% (fatigue créative)"
    }
  ],
  "roas_blended_current": 3.5,
  "roas_blended_projected": 5.47,
  "roas_improvement": "+56%",
  "spend_velocity": {
    "monthly_budget": "$6,000",
    "spend_to_date": "$2,800 (15 jours)",
    "projection": "$5,600",
    "status": "underspend",
    "action_needed": "Increase budgets +$400 to reach $6,000"
  },
  "tasks_created": [
    {
      "type": "creative_refresh",
      "campaign": "LinkedIn B2B SaaS",
      "assigned_to": "Milo",
      "priority": "medium",
      "reason": "CTR decay -8%"
    },
    {
      "type": "creative_refresh",
      "campaign": "Meta Stories",
      "assigned_to": "Milo",
      "priority": "high",
      "reason": "Frequency 2.9 + CTR decay -18% (fatigue critique)"
    }
  ],
  "approval_required": true,
  "approval_reason": "Budget total change >20% AND 1 campaign killed (Google Search Bio)"
}
```

## Checklist Optimisation Hebdomadaire

Avant de soumettre l'optimisation:

- [ ] Données collectées sur exactement 7 jours (lundi-dimanche)
- [ ] Toutes les campagnes actives analysées (aucune oubliée)
- [ ] Matrice de décision appliquée rigoureusement (SCALE/HOLD/OPTIMIZE/KILL)
- [ ] Spend velocity vérifiée (on track pour finir le mois?)
- [ ] Fatigue créative détectée (fréquence >2.5 OU CTR decay >15%)
- [ ] Nouvelle répartition calculée (budget libéré réalloué)
- [ ] ROAS projeté calculé (amélioration attendue)
- [ ] Tasks créées pour Milo si refresh créatifs nécessaire
- [ ] Approval request si changement >20%

## Anti-Patterns à Éviter

❌ **Optimiser trop fréquemment** (tous les jours) → micro-management, algorithmes n'ont pas le temps d'apprendre
❌ **Ne jamais optimiser** (1x/mois ou moins) → opportunités manquées, budget gaspillé
❌ **Baser décisions sur 2-3 jours de data** → variance trop élevée, faux signaux
❌ **Garder campagnes ROAS <1.5 par attachement émotionnel** → perte d'argent
❌ **Scaler sans vérifier fréquence/saturation** → CPA spike imminent
❌ **Ignorer spend velocity** → finir le mois avec $1,000 non dépensés (opportunité manquée)
❌ **Ne pas créer de tasks refresh créatifs** → fatigue créative empire, ROAS baisse

## Ressources

- Meta Budget Optimization: https://www.facebook.com/business/help/1757781947846347
- Google Performance Planner: https://support.google.com/google-ads/answer/3022575
