# Landing Page Optimizer — Luna Skill

## Déclencheur
- User dit : "optimise cette landing page" ou "audite cette page"
- Tâche de type : "audit landing page"
- URL fournie pour analyse

## Méthodologie

### 1. Screenshot Multi-Device
Utiliser le MCP tool `web-intelligence-server` :
- **Desktop** : 1280x800 (resolution standard)
- **Mobile** : 375x812 (iPhone standard)
- **Tablet** : 768x1024 (iPad standard)

Upload les screenshots sur Cloudinary et inclure les URLs dans le rapport.

### 2. Above-the-Fold Analysis
Analyser la partie visible sans scroll (première impression critique) :

**CTA Visible** :
- ✅ Le bouton CTA principal est-il visible immédiatement ?
- Position : center, above fold, couleur contrastée
- Texte CTA : action-oriented ("Commencer", "Télécharger", "Demander une démo")

**Headline Clair** :
- ✅ La value proposition est-elle claire en <5 secondes ?
- Format : "Verbe d'action + Bénéfice + Pour qui"
- Exemple : "Automatisez votre marketing pour les PME en 10 minutes"

**Value Proposition** :
- ✅ Le visiteur comprend-il immédiatement ce que vous proposez ?
- Sous-headline qui explicite le bénéfice unique

### 3. Trust Signals
Vérifier la présence de signaux de confiance :
- ✅ **SSL Actif** (cadenas HTTPS visible)
- ✅ **Témoignages clients** (avec photo + nom + entreprise)
- ✅ **Logos clients** (ou partenaires reconnus)
- ✅ **Certifications** (labels qualité, sécurité, normes)
- ✅ **Garantie** (satisfait ou remboursé, essai gratuit)
- ✅ **Éléments de réassurance** (support 24/7, +10K clients, etc.)

### 4. Formulaire Audit
Analyser le formulaire de conversion :
- **Nombre de champs** : Max 3-5 champs (nom, email, téléphone optionnel)
- **Friction** : Pas de CAPTCHA visible, pas de champs inutiles (entreprise, poste, etc. sauf B2B)
- **CTA Label** : Spécifique ("Recevoir mon guide gratuit" vs générique "Envoyer")
- **Privacy** : Mention RGPD visible ("Vos données sont protégées")

**Règle d'or** : Chaque champ supplémentaire réduit la conversion de 10-20%.

### 5. Page Speed
Utiliser le MCP tool `web-intelligence-server` :
- **LCP (Largest Contentful Paint)** : < 2.5s (idéal < 1.5s)
- **FID (First Input Delay)** : < 100ms
- **CLS (Cumulative Layout Shift)** : < 0.1

Si LCP > 3s → identifier les éléments bloquants (images lourdes, scripts, fonts).

### 6. Tracking Verification
Vérifier la présence des pixels de tracking :
- ✅ **Meta Pixel** (pour remarketing Meta Ads)
- ✅ **Google Analytics 4** (pour suivi conversions)
- ✅ **Google Tag Manager** (gestionnaire de tags)
- ✅ **Google Ads Conversion Tag** (si campagnes Google actives)

Sans tracking correct = perte de données de conversion.

### 7. Score Global 0-100
Calculer le score selon cette grille :

| Critère | Poids | Points |
|---------|-------|--------|
| CTA visible above fold | 15% | 0 ou 15 |
| Headline claire | 10% | 0 ou 10 |
| Value prop explicite | 10% | 0 ou 10 |
| Trust signals (min 2) | 15% | 0-15 |
| Formulaire optimisé (<5 champs) | 15% | 0-15 |
| Page speed (LCP <2.5s) | 20% | 0-20 |
| Tracking complet | 15% | 0-15 |

**Score final = somme des points**

### 8. Recommandations Priorisées
Classifier les recommandations par impact/effort :

**Impact Élevé / Effort Faible** (Quick Wins) :
- Exemple : "Ajouter un CTA above fold"
- Exemple : "Réduire le formulaire de 7 à 3 champs"

**Impact Élevé / Effort Moyen** :
- Exemple : "Optimiser les images (réduire de 60%)"
- Exemple : "Ajouter 3 témoignages clients avec photo"

**Impact Moyen / Effort Élevé** :
- Exemple : "Refonte complète du design"

## Output Attendu

### Format JSON
```json
{
  "type": "LANDING_PAGE_AUDIT",
  "data": {
    "url": "https://example.com/landing-page",
    "audited_date": "2026-04-27",
    "score_global": 65,
    "screenshots": {
      "desktop": "https://res.cloudinary.com/.../desktop.png",
      "mobile": "https://res.cloudinary.com/.../mobile.png",
      "tablet": "https://res.cloudinary.com/.../tablet.png"
    },
    "checklist": {
      "cta_above_fold": {"pass": true, "message": "CTA 'Commencer' visible, couleur orange contrastée"},
      "headline_claire": {"pass": true, "message": "Headline: 'Automatisez votre SEO en 10 minutes'"},
      "value_prop": {"pass": false, "message": "Sous-headline manquante, bénéfice pas explicite"},
      "trust_signals": {"pass": true, "signals": ["Témoignages (3)", "Logos clients (8)", "SSL actif"]},
      "formulaire": {"pass": false, "champs": 7, "message": "7 champs = trop de friction (max recommandé: 3-5)"},
      "page_speed": {"pass": false, "lcp": 3.8, "message": "LCP 3.8s (seuil: 2.5s) - images lourdes détectées"},
      "tracking": {"pass": true, "pixels": ["Meta Pixel", "GA4", "GTM"]}
    },
    "recommandations": [
      {
        "priority": 1,
        "title": "Réduire le formulaire de 7 à 3 champs",
        "impact": "high",
        "effort": "low",
        "gain_estime": "+25% conversions",
        "action": "Garder uniquement: Nom, Email, Message. Supprimer: Entreprise, Poste, Téléphone, Site web"
      },
      {
        "priority": 2,
        "title": "Optimiser les images pour améliorer LCP",
        "impact": "high",
        "effort": "medium",
        "gain_estime": "LCP 3.8s → 1.8s",
        "action": "Compresser les 5 images hero (actuellement 2.5MB → cible 400KB). Utiliser WebP."
      },
      {
        "priority": 3,
        "title": "Ajouter une sous-headline explicite",
        "impact": "medium",
        "effort": "low",
        "gain_estime": "+10% clarté",
        "action": "Sous-headline suggestion: 'Notre IA analyse votre site et génère un plan SEO en 60 secondes'"
      }
    ]
  }
}
```

## Exemple d'Utilisation

**User Input:**
> "Luna, audite ma landing page : https://monsite.com/offre-speciale"

**Luna Response:**
> "J'ai audité votre landing page. Voici les résultats :
>
> **Score Global : 65/100**
> - ✅ CTA visible above fold (bouton orange 'Commencer')
> - ✅ Tracking complet (Meta Pixel + GA4 + GTM)
> - ✅ Trust signals présents (3 témoignages + 8 logos clients)
> - ⚠️ Formulaire trop long (7 champs au lieu de 3-5 max)
> - ❌ Page lente (LCP 3.8s vs seuil 2.5s)
> - ❌ Sous-headline manquante (value prop pas assez explicite)
>
> **Top 3 Recommandations Prioritaires :**
>
> 1. **Réduire le formulaire** (impact élevé, effort faible)
>    → Passer de 7 à 3 champs (Nom, Email, Message)
>    → Gain estimé : +25% de conversions
>
> 2. **Optimiser les images** (impact élevé, effort moyen)
>    → Compresser les 5 images hero (2.5MB → 400KB en WebP)
>    → Gain vitesse : LCP 3.8s → 1.8s
>
> 3. **Ajouter une sous-headline** (impact moyen, effort faible)
>    → Suggestion : 'Notre IA analyse votre site et génère un plan SEO en 60 secondes'
>    → Gain : +10% clarté de la value proposition
>
> Je recommande de commencer par les 2 premières actions cette semaine. Veux-tu que je crée une tâche pour Milo pour optimiser les images ?"

## Notes Techniques
- Utiliser `web-intelligence-server` pour screenshots + audit vitesse
- Utiliser `web-intelligence-server/ad_verification` pour vérifier les pixels
- Si la page a un formulaire Typeform/Google Forms externe → mentionner que l'audit ne couvre que la landing elle-même
- Recommander un A/B test (via Google Optimize ou VWO) pour les changements >20% impact
