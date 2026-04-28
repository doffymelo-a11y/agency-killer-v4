# Anomaly Detective — Sora Skill

## Déclencheur
- Variation > 20% détectée sur n'importe quel KPI
- Alerte automatique lors de la collecte de données
- User dit : "pourquoi ce pic de traffic ?" ou "explique cette baisse"

## Méthodologie

### RÈGLE D'OR
**Suspect un bug AVANT de célébrer** — 70% des variations >50% sont des erreurs de tracking.

### 1. Vérifier le Tracking
- **Tags fires correctement** : GTM Debug Mode → vérifier les tags se déclenchent
- **Pas de double comptage** : Vérifier qu'un événement n'est pas compté 2 fois
- **Pas de spam traffic** : Filtrer referral spam, bot traffic dans GA4
- **Consent mode actif** : Si RGPD, vérifier que le consent mode ne bloque pas tout

### 2. Vérifier les Filtres
- **Spam Traffic** : Vérifier les sources de trafic (referral spam, bots)
- **Bot Traffic** : Activer le filtre bot GA4
- **Internal Traffic** : Exclure les IPs internes (équipe, agence)
- **Test Traffic** : Exclure les domaines de staging/dev

### 3. Vérifier les Changements Récents
- **Nouvelle campagne** : Launch d'une campagne ads dans les 7 derniers jours ?
- **Changement site** : Déploiement, refonte, nouvelle page ?
- **Update algo** : Google Core Update, Meta algorithme (vérifier Search Engine Journal)
- **Saisonnalité** : Black Friday, Noël, soldes, vacances ?

### 4. Comparer avec Données Secondaires
Cross-check entre plateformes :
- **GA4 vs Meta Backend** : Les conversions matchent-elles ?
- **GA4 vs Google Ads** : Le CPA est-il cohérent ?
- **GA4 vs GTM Preview** : Les événements se déclenchent-ils ?

Si les données divergent → bug de tracking confirmé.

### 5. Si Confirmé Réel : Quantifier l'Impact Business
- **En Euros** : "+500 sessions × 2% conversion × 50€ panier = +500€ revenue estimé"
- **En Leads** : "+200 form submissions = 40 leads qualifiés estimés"
- **En Visibilité** : "+10K impressions sur keyword X = augmentation notoriété"

### 6. Si Bug : Alerter Immédiatement
Format d'alerte :
```
🚨 BUG DÉTECTÉ : [Nom du bug]
Confiance : 95%
Impact : Données du [date] au [date] sont faussées
Action : Corriger [action précise]
```

### 7. Si Réel : Documenter le Learning
Stocker dans `project_memory` :
- **Ce qui s'est passé** : "Article X a été partagé sur Reddit → +2K visites"
- **Pourquoi** : "Sujet viral, timing parfait (actualité)"
- **Reproductible** : "Publier sur Reddit le mardi matin, sujets chauds"

## Output Attendu

### Format JSON (Alerte Anomalie)
```json
{
  "type": "ANALYTICS_INSIGHT",
  "data": {
    "anomaly_type": "spike" | "drop" | "bug",
    "metric": "sessions",
    "variation": "+450%",
    "period": {"start": "2026-04-20", "end": "2026-04-27"},
    "confidence": 95,
    "diagnostic": {
      "is_bug": false,
      "is_real": true,
      "root_cause": "Article 'SEO 2026' partagé sur Reddit (2.3K upvotes) le 22/04",
      "supporting_data": [
        "GA4 : +2 340 sessions from reddit.com",
        "Reddit post : 2.3K upvotes, 450 comments",
        "Bounce rate normal (45% vs 42% baseline) → traffic qualifié"
      ]
    },
    "impact_business": {
      "revenue_estime": 1200,
      "leads_estime": 47,
      "currency": "EUR",
      "calculation": "2 340 sessions × 2% conversion × 25€ panier moyen"
    },
    "action_recommandee": "Capitaliser sur ce momentum : publier 2-3 articles connexes cette semaine + partager sur Reddit (recommandation pour Luna + Doffy)",
    "learning_documente": true
  }
}
```

## Exemple d'Utilisation

**Scenario 1 : Pic de Trafic (+450%)**

**Sora Response:**
> "🔍 J'ai détecté un pic de trafic massif : +450% (640 → 3 520 sessions).
>
> **Diagnostic :**
> ✅ Ce n'est PAS un bug (j'ai vérifié le tracking, tout fonctionne).
> ✅ C'est RÉEL : Ton article 'SEO 2026' a été partagé sur Reddit hier et a explosé (2.3K upvotes).
>
> **Détails :**
> - Source : reddit.com (2 340 sessions, 66% du pic)
> - Qualité : Bounce 45% (normal), durée moyenne 3min 20s (excellente)
> - Conversions : +47 leads estimés
>
> **Impact business : +1 200€ estimés**
> (2 340 sessions × 2% conversion × 25€ panier moyen)
>
> **🎯 Ma recommandation :**
> Capitalise sur ce momentum ! Demande à Luna de créer 2-3 articles connexes cette semaine, et à Doffy de partager sur Reddit (format court + lien).
>
> Veux-tu que je crée ces tâches ?"

**Scenario 2 : Baisse de Conversions (-35%)**

**Sora Response:**
> "🚨 ALERTE BUG DÉTECTÉ : Conversions en chute libre (-35%).
>
> **Diagnostic :**
> ❌ Ce n'est PAS réel, c'est un BUG de tracking.
>
> **Preuve :**
> - GA4 affiche 120 conversions
> - Meta Backend affiche 185 conversions (même période)
> - GTM Preview : le tag 'purchase' ne se déclenche plus depuis le 24/04
>
> **Root cause :**
> Le bouton 'Acheter' a changé de classe CSS lors du dernier déploiement (24/04). Le trigger GTM ne le détecte plus.
>
> **Action immédiate :**
> Corriger le trigger GTM :
> - Ancien : `.btn-purchase`
> - Nouveau : `.checkout-button`
>
> **Impact :**
> Données du 24 au 27/04 sont sous-comptées de ~40%. Corriger maintenant pour éviter de fausser les décisions budgétaires.
>
> Veux-tu que je corrige le trigger GTM directement (j'ai accès via le MCP connector) ?"

## Notes Techniques
- Toujours croiser 2-3 sources de données avant de conclure
- Utiliser GTM Debug Mode pour vérifier les tags en live
- Si bug confirmé → corriger immédiatement via MCP `google-tag-manager-server`
- Stocker tous les learnings dans `project_memory` avec tag `anomaly_learning`
- Envoyer une alerte Slack/Email si variation >50% (feature à implémenter)
