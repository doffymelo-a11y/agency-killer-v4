# Campaign Launch Checklist — Marcus Skill

## Déclencheur
- User dit : "lance une campagne"
- User dit : "crée une campagne"
- Tâche de type : "création campagne"
- Phase projet : LAUNCH (après STRATEGY validée)

## Contexte

Le lancement de campagne est le moment de vérité. Une checklist rigoureuse évite 90% des erreurs coûteuses: budget mal configuré, tracking absent, créatifs manquants, audience trop large, etc.

**Règle d'or**: Ne JAMAIS lancer une campagne tant que TOUS les éléments de la checklist ne sont pas validés. Un lancement précipité peut gaspiller des milliers d'euros en quelques heures.

**Principe fondamental**: Human-in-the-loop. Marcus PROPOSE la configuration, l'utilisateur APPROUVE avant activation.

## Méthodologie Complète

### 1. PRE-FLIGHT CHECK (Validation Dépendances)

**Blocage strict**: Ne PAS passer à l'étape suivante tant que ces 4 conditions ne sont PAS remplies:

#### ✅ Stratégie Validée (Luna)
**Vérifier**: Flag `strategy_validated = true` dans project state

**Contient**:
- Objectif campagne (conversions, leads, traffic, awareness)
- Audience cible (geo, demo, comportements)
- Message clé / value proposition
- Budget recommandé par plateforme
- KPIs cibles (ROAS, CPA, CTR)

**Si manquant**: Créer task "Définir stratégie campagne" → assigner Luna → bloquer lancement

#### ✅ Créatifs Prêts (Milo)
**Vérifier**: Flag `creatives_ready = true` OU minimum 3 fichiers dans project_files avec type=ad_creative

**Formats requis** (selon plateforme):
- **Meta**: Images 1080×1080 (Feed), 1080×1920 (Stories), vidéos 9:16 (Reels)
- **Google Display**: 300×250, 728×90, 160×600
- **LinkedIn**: Images 1200×627, vidéos 16:9
- **YouTube**: Vidéos 16:9, durée 15s/30s/60s

**Si manquant**: Créer task "Produire créatifs campagne [plateforme]" → assigner Milo → bloquer lancement

#### ✅ Tracking Vérifié (Sora)
**Vérifier**: Flag `tracking_ready = true` OU confirmation tracking test OK

**Tracking requis**:
- **Meta Pixel** installé + événement Purchase/Lead testé
- **Google Ads conversion tracking** installé + événement testé
- **GA4** configuré + événements custom
- **UTM parameters** définis (utm_source, utm_medium, utm_campaign)

**Test obligatoire**: Sora doit confirmer qu'au moins 1 conversion test a été détectée.

**Si manquant**: Créer task "Configurer tracking [plateforme]" → assigner Sora → bloquer lancement

#### ✅ Budget Approuvé (Utilisateur)
**Vérifier**: Approval request envoyée + réponse utilisateur = approved

**Détails approval**:
- Budget quotidien proposé
- Budget total campagne (30j/60j/90j)
- Estimation ROI (ROAS projeté)
- Estimation résultats (conversions, leads, traffic)

**Si manquant**: Créer approval request → attendre confirmation utilisateur

---

### 2. Configuration Campagne (Paramètres Détaillés)

#### A. Objectif Campagne

**Meta Ads objectifs**:
- **Conversions** (achat, lead, inscription) → Pour e-commerce, SaaS, lead gen
- **Traffic** (visites site) → Pour blog, contenu
- **Awareness** (impressions, reach) → Pour brand awareness
- **Engagement** (likes, comments, shares) → Pour social proof

**Google Ads objectifs**:
- **Search - Conversions** (keywords intent élevé) → Pour SaaS, services, e-commerce
- **Display - Awareness** (bannières display) → Pour brand awareness
- **Shopping - Sales** (catalogue produit) → Pour e-commerce
- **YouTube - Views** (vidéo ads) → Pour thought leadership

**LinkedIn Ads objectifs**:
- **Lead Generation** (formulaire natif) → Pour B2B lead gen
- **Website Conversions** (redirect landing page) → Pour SaaS B2B
- **Awareness** (sponsored content) → Pour brand B2B

#### B. Budget (Configuration Détaillée)

**Budget quotidien** vs **Budget total**:
- **Meta/Google**: Budget quotidien (ex: 50€/jour, total automatique sur durée)
- **LinkedIn**: Budget total campagne (ex: 1,500€ sur 30j = 50€/jour moyen)

**Formule calcul budget quotidien**:
```
Budget_quotidien = CPA_target × Conversions_visées_par_jour

Exemple:
- CPA target: 30€
- Conversions visées: 5/jour
- Budget quotidien: 30€ × 5 = 150€/jour
```

**Minimums par plateforme**:
- Meta Ads: 5€/jour minimum (CBO), 10€/jour recommandé
- Google Ads Search: 10€/jour minimum, 20€/jour recommandé
- Google Ads Display: 5€/jour minimum
- LinkedIn Ads: 10€/jour minimum, 30€/jour recommandé (CPC élevés)
- TikTok Ads: 20€/jour minimum (imposé plateforme)

**Budget total campagne**:
```
Budget_total = Budget_quotidien × Durée_jours

Exemple:
- Budget quotidien: 50€/jour
- Durée: 30 jours
- Budget total: 50€ × 30 = 1,500€
```

#### C. Audience (Ciblage Précis)

**Géographie**:
- **Pays**: France, Belgique, Suisse, Canada (francophones)
- **Ville/Région**: Paris, Île-de-France (local business)
- **Rayon**: 10km autour de [adresse] (très local, ex: restaurant)

**Démographie**:
- **Âge**: 25-54 ans (adultes actifs)
- **Genre**: Tous, Hommes, Femmes
- **Langue**: Français
- **Situation familiale**: Célibataire, En couple, Marié, Parents (Meta uniquement)

**Comportements** (Meta):
- **Acheteurs en ligne** (90 derniers jours)
- **Voyageurs fréquents**
- **Early adopters** (technologie)
- **Entrepreneurs**

**Intérêts** (Meta/Google):
- **Marketing digital** (broad)
- **SEO**, **Google Ads**, **Meta Ads** (specific)
- **SaaS**, **B2B**, **E-commerce**

**Job Titles** (LinkedIn uniquement):
- **CMO**, **Marketing Director**, **Growth Manager**
- **Founder**, **CEO** (si targeting C-level)

**Audience personnalisée**:
- **Custom Audience** (liste emails uploadée)
- **Website Visitors** (pixel retargeting - 30/60/90 jours)
- **Lookalike Audience** 1% (Meta/TikTok)

**Taille audience recommandée**:
- Meta: 500K-2M (optimal), <100K (trop petite), >5M (trop large)
- Google Search: N/A (keywords-based)
- LinkedIn: 50K-500K (B2B audience plus petite)

#### D. Placements (Auto vs Manuel)

**Meta Ads placements**:
- **Automatic** (recommandé pour débuter) → Meta optimise Feed/Stories/Reels/Messenger
- **Manuel**: Sélectionner Feed seul, ou Stories seul, ou Reels seul (si test créatif spécifique)

**Google Ads placements**:
- **Search**: Keywords uniquement (pas de choix placement)
- **Display**: Automatic (GDN network) ou Manuel (sites spécifiques)
- **YouTube**: In-stream (pré-roll), Discovery (suggestions)

**LinkedIn Ads placements**:
- **Feed** (desktop + mobile) - recommandé
- **Sidebar** (desktop uniquement) - CPC plus bas, CTR plus faible
- **Message Ads** (InMail sponsorisé) - CPC élevé, engagement fort

#### E. Enchères (Stratégie)

**Meta Ads bid strategies**:
- **Lowest Cost** (auto-bid, recommandé) → Meta optimise pour CPA le plus bas
- **Cost Cap** (cap CPA à X€) → Limite CPA max mais peut limiter volume
- **Bid Cap** (cap bid à X€) → Contrôle enchère max, avancé

**Google Ads bid strategies**:
- **Maximize Conversions** (auto-bid, recommandé) → Google optimise conversions
- **Target CPA** (CPA cible X€) → Google optimise pour atteindre ce CPA
- **Target ROAS** (ROAS cible 5.0) → Google optimise pour ROAS
- **Manual CPC** (enchère manuelle) → Contrôle total, avancé

**LinkedIn Ads bid strategies**:
- **Maximum Delivery** (auto-bid) → LinkedIn optimise volume
- **Cost Cap** (CPM/CPC cap) → Contrôle coût

**Recommandation débutant**: Toujours commencer par auto-bid (Lowest Cost / Maximize Conversions). Passer à bid cap SEULEMENT après 30+ jours de data.

---

### 3. Créatifs (Validation Format + Contenu)

#### Minimum de Variantes (A/B Testing)

**Règle**: Toujours lancer avec **minimum 3 variantes créatives** pour tester.

**Variantes recommandées**:
- **Variante A**: Headline focus bénéfice ("Économisez 4h/semaine")
- **Variante B**: Headline focus feature ("Interface intuitive + IA")
- **Variante C**: Headline focus urgence ("Offre limitée - 30% de réduction")

#### Formats Requis par Placement

**Meta Ads**:
- **Feed**: Image 1080×1080 (carré) OU 1200×628 (paysage)
- **Stories**: Image/Vidéo 1080×1920 (9:16 vertical)
- **Reels**: Vidéo 1080×1920 (9:16 vertical), durée 15-60s
- **Carousel**: 2-10 images 1080×1080

**Google Display**:
- **Banner**: 728×90 (leaderboard), 300×250 (rectangle), 160×600 (skyscraper)
- **Responsive**: Upload 5 images + 5 headlines + 5 descriptions → Google auto-combine

**LinkedIn**:
- **Single Image**: 1200×627 (paysage)
- **Carousel**: 1080×1080 (carré), 2-10 images
- **Video**: 1920×1080 (16:9), durée 15-30s

**YouTube**:
- **In-Stream Skippable**: 16:9, durée recommandée 15-30s (skippable après 5s)
- **In-Stream Non-Skippable**: 16:9, durée MAX 15s
- **Discovery**: Thumbnail 1280×720

#### Textes (Headline + Description + CTA)

**Meta Ads textes**:
- **Headline**: 40 caractères max (visible sur mobile)
- **Primary Text**: 125 caractères max (avant "voir plus")
- **Description**: 30 caractères max
- **CTA**: "En savoir plus", "S'inscrire", "Acheter maintenant", "Télécharger"

**Google Ads textes**:
- **Search Headline 1**: 30 caractères max
- **Search Headline 2**: 30 caractères max
- **Search Description**: 90 caractères max
- **Display Headline**: 30 caractères max
- **Display Description**: 90 caractères max

**LinkedIn Ads textes**:
- **Headline**: 70 caractères max
- **Intro Text**: 150 caractères max (avant "voir plus")
- **CTA**: "En savoir plus", "S'inscrire", "Télécharger le guide"

---

### 4. Validation Pré-Lancement

#### Preview Annonce

**Meta Ads**: Utiliser "Preview" dans Ads Manager pour voir rendu Feed/Stories/Reels

**Google Ads**: Utiliser "Ad Preview" pour voir rendu Search/Display

**LinkedIn Ads**: Preview automatique dans Campaign Manager

**Vérifier**:
- Textes non tronqués
- Images haute résolution (pas pixelisées)
- CTA visible et clair
- Landing page URL correcte
- UTM parameters présents

#### Estimation Portée/Résultats

**Meta Ads estimation**:
- Reach estimé: 10K-15K personnes (selon audience size)
- Résultats estimés: 20-30 conversions (selon CPA target)

**Google Ads estimation**:
- Impressions estimées: 50K-100K (selon keywords volume)
- Clics estimés: 500-1,000 (selon CTR moyen 1%)
- Conversions estimées: 25-50 (selon CVR moyen 5%)

**Formule manuelle estimation**:
```
Budget = 1,500€
CPA target = 30€
Conversions estimées = Budget / CPA = 1,500€ / 30€ = 50 conversions
```

#### Confirmation Utilisateur (Approval Final)

**Format approval request**:
```
Campagne prête à lancer : [NOM CAMPAGNE]

Plateforme: Meta Ads
Objectif: Conversions (achat)
Budget: 50€/jour (1,500€ total sur 30j)
Audience: France, 25-54 ans, intérêts marketing digital
Créatifs: 3 variantes (images carrousel + Stories vidéo)

Estimation:
- Reach: 12K-18K personnes
- Conversions: 40-60 achats
- CPA projeté: 25-38€ (target 30€)
- ROAS projeté: 4.5-6.0

Tracking: ✅ Meta Pixel vérifié
Stratégie: ✅ Validée par Luna
Créatifs: ✅ Prêts (Milo)

Approuves-tu le lancement?
[Oui, lancer] [Non, modifier] [Reporter]
```

---

### 5. POST-LANCEMENT (Monitoring Obligatoire)

#### Learning Phase (Ne PAS Toucher 3-7 Jours)

**Meta Ads Learning Phase**:
- Durée: Jusqu'à 50 conversions (généralement 7-14 jours)
- **Ne PAS modifier**: Budget, audience, créatifs, enchères
- Si modification → retour en Learning Phase (reset algorithme)

**Google Ads Learning Phase**:
- Durée: 7-14 jours pour Smart Bidding
- **Ne PAS modifier**: Stratégie enchères, budgets

**Monitoring Learning Phase**:
- Vérifier CPA quotidien (variance normale 20-40%)
- Vérifier spend (doit dépenser 80-100% du budget quotidien)
- Si underspend >20% → audience trop petite OU enchères trop basses

#### KPIs à Surveiller (Jours 1-7)

**Jour 1-3** (early signals):
- **CTR**: >1.0% (Meta), >2.0% (Google Search), >0.5% (LinkedIn)
- **CPC**: <5€ (Meta), <2€ (Google Search), <8€ (LinkedIn)
- **Spend**: 80-100% du budget quotidien

**Jour 4-7** (premières conversions):
- **Conversions**: Minimum 10-15 conversions (sinon budget trop faible)
- **CPA**: <150% du target (normal en Learning Phase)
- **ROAS**: >2.0 (early signal positif)

**Alertes RED FLAG** (nécessitent intervention immédiate):
- ❌ CPA >300% du target après 7 jours
- ❌ Underspend chronique <50% (3 jours consécutifs)
- ❌ CTR <0.5% (créatifs ne fonctionnent pas)
- ❌ Aucune conversion après 7 jours ET budget >500€ dépensé

---

## Output Format

```json
{
  "type": "CAMPAIGN_LAUNCH_APPROVAL_REQUEST",
  "campaign_name": "Meta Conv - Produits Bio - France",
  "platform": "meta",
  "status": "ready_to_launch",
  "pre_flight_check": {
    "strategy_validated": true,
    "creatives_ready": true,
    "tracking_verified": true,
    "budget_approved": false
  },
  "configuration": {
    "objective": "conversions",
    "conversion_event": "purchase",
    "budget_daily": "50€",
    "budget_total": "1,500€ (30 jours)",
    "audience": {
      "geo": ["France"],
      "age": "25-54",
      "interests": ["bio", "santé", "nutrition"],
      "size": "850K personnes"
    },
    "placements": "Automatic (Feed + Stories + Reels)",
    "bidding": "Lowest Cost (auto-bid)"
  },
  "creatives": {
    "count": 3,
    "formats": ["Image 1080x1080 (Feed)", "Vidéo 1080x1920 (Stories)", "Carousel 3 images"],
    "variants": ["Headline bénéfice", "Headline feature", "Headline urgence"]
  },
  "tracking": {
    "meta_pixel": "installed",
    "conversion_event": "Purchase",
    "test_conversion_detected": true,
    "utm_parameters": "utm_source=meta&utm_medium=cpc&utm_campaign=bio-france-conv"
  },
  "estimation": {
    "reach": "12,000-18,000 personnes",
    "impressions": "80,000-120,000",
    "clicks": "800-1,200",
    "conversions": "40-60",
    "cpa_projected": "25-38€",
    "roas_projected": "4.5-6.0"
  },
  "approval": {
    "required": true,
    "message": "Campagne prête à lancer. Budget 50€/jour, estimation 40-60 conversions, CPA 25-38€. Approuves-tu?",
    "options": ["Oui, lancer", "Non, modifier budget", "Reporter au [date]"]
  }
}
```

## Checklist Lancement Final

Avant d'activer la campagne:

- [ ] ✅ Stratégie validée par Luna
- [ ] ✅ Créatifs prêts (minimum 3 variantes) par Milo
- [ ] ✅ Tracking vérifié (1 conversion test détectée) par Sora
- [ ] ✅ Budget approuvé par utilisateur
- [ ] Objectif campagne configuré (conversions/leads/traffic)
- [ ] Budget quotidien/total configuré (respect minimums plateforme)
- [ ] Audience ciblée (geo + demo + intérêts/job titles)
- [ ] Placements sélectionnés (auto recommandé)
- [ ] Stratégie enchères configurée (auto-bid recommandé)
- [ ] Créatifs uploadés (formats corrects par placement)
- [ ] Textes rédigés (headline + description + CTA)
- [ ] Preview annonce validée (pas de troncature)
- [ ] Landing page URL vérifiée (+ UTM parameters)
- [ ] Estimation résultats calculée (conversions, CPA, ROAS)
- [ ] Approval utilisateur reçue

## Anti-Patterns à Éviter

❌ **Lancer sans tracking** → impossible de mesurer ROI, budget gaspillé
❌ **Lancer avec 1 seul créatif** → pas de test A/B, optimisation impossible
❌ **Budget trop faible** (<10€/jour Meta, <20€/jour Google) → algorithme n'apprend pas
❌ **Audience trop large** (>5M Meta) → dilution, CPA élevé
❌ **Audience trop petite** (<100K Meta) → underspend, saturation rapide
❌ **Modifier pendant Learning Phase** → reset algorithme, perte de performances
❌ **Pas de preview annonce** → textes tronqués, images pixelisées découverts après lancement
❌ **Lancer sans approval utilisateur** → budget dépensé sans validation, risque juridique

## Ressources

- Meta Ads Campaign Setup: https://www.facebook.com/business/help/1710077379203657
- Google Ads Campaign Creation: https://support.google.com/google-ads/answer/6324971
- LinkedIn Ads Campaign Manager: https://business.linkedin.com/marketing-solutions/ads
