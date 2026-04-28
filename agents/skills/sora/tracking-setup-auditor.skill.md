# Tracking Setup Auditor — Sora Skill

## Déclencheur
- User dit : "vérifie le tracking de [site]"
- Tâche de type : "audit tracking" ou "setup analytics"
- Phase : Setup

## Méthodologie

### 1. Ad Verification (Pixels Tracking)
Utiliser MCP tool `web-intelligence-server/ad_verification` :
- ✅ **Meta Pixel** : Detecté (ID visible)
- ✅ **Google Analytics 4** : Detecté (Measurement ID visible)
- ✅ **Google Tag Manager** : Detecté (Container ID visible)
- ✅ **Google Ads Conversion Tag** : Detecté ou absent
- ✅ **TikTok Pixel** : Detecté ou absent
- ✅ **LinkedIn Insight Tag** : Detecté ou absent

### 2. Vérifier les Événements Clés
Pour chaque pixel détecté, vérifier les événements standards :

**Meta Pixel** :
- `PageView` (automatique)
- `ViewContent` (pages produit)
- `AddToCart` (ajout panier)
- `InitiateCheckout` (début checkout)
- `Purchase` (achat confirmé)

**Google Analytics 4** :
- `page_view` (automatique)
- `add_to_cart`
- `begin_checkout`
- `purchase`
- `generate_lead` (formulaires)
- `sign_up` (inscriptions)

**Google Ads** :
- Conversion tag sur page de confirmation
- Valeur de conversion dynamique (si e-commerce)

### 3. Vérifier les Paramètres UTM
Analyser les campagnes actives :
- **utm_source** : source du trafic (google, facebook, newsletter)
- **utm_medium** : medium (cpc, email, social)
- **utm_campaign** : nom de campagne
- **utm_content** : variante de créatif (optionnel)
- **utm_term** : keyword (optionnel)

Vérifier la cohérence : pas de "utm_source=Google" pour Meta Ads.

### 4. Vérifier le Consent Mode (RGPD)
- ✅ **Cookie banner** : visible et fonctionnel
- ✅ **Consent mode V2** : implémenté pour GA4/Meta
- ✅ **Mode sans consentement** : tracking anonymisé actif
- ✅ **Politique de confidentialité** : lien visible

**Erreur fréquente** : Tag Manager bloqué entièrement si pas de consentement → implémenter Consent Mode.

### 5. Cross-Check : Conversions GA4 vs Meta
Comparer les conversions sur les 7 derniers jours :
- GA4 : X conversions
- Meta Backend : Y conversions

**Écart acceptable** : ±10-15% (attribution différente)
**Écart inquiétant** : >25% → bug de tracking probable

### 6. Score Tracking 0-100
Calculer le score :
- Meta Pixel détecté : 20 points
- GA4 détecté : 20 points
- GTM détecté : 15 points
- Événements clés configurés (min 3) : 25 points
- UTM parameters corrects : 10 points
- Consent Mode implémenté : 10 points

**Interprétation** :
- 90-100 : Tracking excellent
- 70-89 : Tracking bon, quelques ajustements
- 50-69 : Tracking moyen, corrections nécessaires
- <50 : Tracking défaillant, setup urgent

### 7. Checklist de Corrections
Liste des tags manquants ou mal configurés :
- Exemple : "❌ Meta Pixel : événement 'Purchase' manquant"
- Exemple : "❌ GA4 : événement 'generate_lead' mal configuré (pas de valeur)"
- Exemple : "⚠️ Consent Mode : non implémenté (risque RGPD)"

## Output Attendu

### Format JSON
```json
{
  "type": "PIXEL_VERIFICATION",
  "data": {
    "site_url": "https://example.com",
    "audited_date": "2026-04-27",
    "score_global": 75,
    "pixels_detected": {
      "meta_pixel": {"detected": true, "id": "123456789", "events": ["PageView", "ViewContent", "AddToCart", "Purchase"]},
      "google_analytics_4": {"detected": true, "id": "G-XXXXXXXXX", "events": ["page_view", "add_to_cart", "purchase"]},
      "google_tag_manager": {"detected": true, "id": "GTM-XXXXXX"},
      "google_ads": {"detected": true, "conversion_id": "AW-123456789"},
      "tiktok_pixel": {"detected": false},
      "linkedin_insight": {"detected": false}
    },
    "events_verification": {
      "meta_pixel": [
        {"event": "PageView", "status": "✅", "note": "Fonctionne correctement"},
        {"event": "Purchase", "status": "❌", "note": "Événement manquant - à configurer"}
      ],
      "ga4": [
        {"event": "page_view", "status": "✅", "note": "Automatique, fonctionne"},
        {"event": "purchase", "status": "⚠️", "note": "Événement présent mais valeur pas dynamique"}
      ]
    },
    "utm_parameters": {
      "status": "⚠️",
      "note": "UTM corrects sur Google Ads, mais utm_source incohérent sur Meta Ads (trouvé 'google' au lieu de 'facebook')"
    },
    "consent_mode": {
      "status": "❌",
      "note": "Consent Mode V2 non implémenté - risque RGPD et perte de données"
    },
    "cross_check_conversions": {
      "ga4": 187,
      "meta_backend": 215,
      "ecart_percent": 15,
      "status": "✅",
      "note": "Écart acceptable (15%) - attribution différente"
    },
    "corrections_checklist": [
      {"priority": 1, "issue": "Implémenter Consent Mode V2 (obligation RGPD 2024)", "effort": "medium"},
      {"priority": 2, "issue": "Ajouter événement 'Purchase' sur Meta Pixel", "effort": "low"},
      {"priority": 3, "issue": "Corriger les UTM Meta Ads (utm_source=facebook)", "effort": "low"},
      {"priority": 4, "issue": "Ajouter valeur dynamique sur événement GA4 'purchase'", "effort": "low"}
    ]
  }
}
```

## Exemple d'Utilisation

**User Input:**
> "Sora, vérifie le tracking de mon site e-commerce"

**Sora Response:**
> "J'ai audité le tracking de ton site. Voici les résultats :
>
> **Score Tracking : 75/100** (Bon, mais améliorable)
>
> **✅ Tags Détectés :**
> - Meta Pixel (ID: 123456789) ✅
> - Google Analytics 4 (G-XXXXXXXXX) ✅
> - Google Tag Manager (GTM-XXXXXX) ✅
> - Google Ads Conversion ✅
>
> **⚠️ Points d'Attention :**
> 1. **Consent Mode V2 non implémenté** (obligation RGPD depuis mars 2024)
>    → Sans ça, tu perds des données et risques une amende
>
> 2. **Événement 'Purchase' manquant sur Meta Pixel**
>    → Meta ne track pas tes ventes → impossible d'optimiser les campagnes
>
> 3. **UTM incorrects sur Meta Ads**
>    → Trouvé utm_source=google au lieu de facebook → données faussées dans GA4
>
> 4. **Valeur dynamique manquante sur GA4 'purchase'**
>    → GA4 ne sait pas le montant des commandes → impossible de calculer le ROAS exact
>
> **🎯 Mes Recommandations (par priorité) :**
> 1. **Urgent** : Implémenter Consent Mode V2 (effort moyen, impact RGPD)
> 2. **Important** : Ajouter événement 'Purchase' Meta Pixel (effort faible, impact élevé sur campagnes)
> 3. **Important** : Corriger les UTM Meta Ads (effort faible, impact moyen)
> 4. **Moyen** : Ajouter valeur dynamique GA4 (effort faible, impact moyen)
>
> Veux-tu que je configure tout ça via GTM ? (J'ai accès via le MCP connector)"

## Notes Techniques
- Utiliser `web-intelligence-server/ad_verification` pour la détection pixels
- Si GTM connecté → utiliser `google-tag-manager-server` pour corriger directement
- Si un pixel manque → proposer de l'installer via GTM
- Recommander d'utiliser GTM pour TOUS les tags (pas de hard-code dans le HTML)
- Documenter le setup dans `project_memory` pour référence future
