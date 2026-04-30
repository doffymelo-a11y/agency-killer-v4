# Multi-Platform Adapter — Milo Skill

## Déclencheur
- "adapte ce contenu pour toutes les plateformes"
- "décline ce créatif pour tous les formats"
- "génère des variantes multi-plateformes"
- Tâche multi-format (ex: lancement campagne cross-platform)

## Contexte

La déclinaison multi-plateforme est l'exercice créatif le plus rentable. À partir d'UN concept gagnant, générer 10-15 variantes optimisées pour chaque plateforme maximise le reach avec un effort créatif minimal.

**Règle d'or**: Un concept ne se copie-colle PAS. Chaque plateforme a ses codes visuels, contraintes techniques, et comportements utilisateurs. Un visuel Meta Feed parfait sera illisible sur Google Display 728×90.

**Principe fondamental**: Master concept → Adaptation contextuelle. Le concept central (value prop, offre, branding) reste identique. Les variations sont techniques (dimensions, zones safe) et psychologiques (ton, longueur texte, placement CTA).

## Méthodologie Complète

### 1. Extraire Master Concept (Inputs)

**Données requises du créatif source**:
- **Value proposition**: 1 phrase (ex: "Réduisez vos coûts Google Ads de 40%")
- **Offre principale**: Promo, discount, lead magnet (ex: "-20%", "Essai gratuit 14j", "eBook gratuit")
- **CTA primaire**: Action souhaitée (ex: "Acheter", "S'inscrire", "Télécharger", "En savoir plus")
- **Éléments visuels clés**: Hero image/product, logo, couleurs brand
- **Ton de voix**: Professionnel, Casual, Urgence, Luxe, Playful

**Si données manquantes**: Analyser le créatif source automatiquement:
- Extraire texte visible via OCR
- Détecter couleurs dominantes (palette HEX)
- Identifier éléments visuels principaux (product, personne, pattern, texte)

### 2. Matrice Plateforme → Format (Spécifications Exactes)

#### Meta Ads Formats

**Meta Feed (carré standard)**:
- **Dimensions**: 1080×1080px (1:1 aspect ratio)
- **Alternatif paysage**: 1200×628px (1.91:1)
- **Zone safe**: 50px marge intérieure tout autour
- **Ratio texte max**: <20% (Meta rejette si >20%)
- **Composition recommandée**: Hero Product (produit centré 60-70%) OU Lifestyle (personne + produit)
- **Texte**: Max 3 lignes, 36-48pt headline, 24pt body
- **CTA placement**: Badge coin bas-droit (100×40px)
- **File format**: JPG (qualité 90%) ou PNG, max 30MB

**Meta Story (vertical full-screen)**:
- **Dimensions**: 1080×1920px (9:16 aspect ratio)
- **Zone safe TOP**: 250px (éviter logo/texte sous l'icône profil)
- **Zone safe BOTTOM**: 310px (éviter texte au-dessus du bouton "Swipe Up")
- **Zone safe SIDES**: 60px gauche/droite (crop mobile)
- **Zone utilisable**: 960×1360px (centre)
- **Ratio texte max**: <30% (Stories plus permissif que Feed)
- **Composition recommandée**: Vertical Hero (visuel plein écran + texte overlay zone middle)
- **Texte**: Max 2 lignes headline (zone middle), CTA zone bottom (250px du bas)
- **Animation**: Vidéo 15s max, hook dans les 2 premières secondes
- **File format**: JPG/PNG (image) ou MP4 (vidéo), max 30MB

**Meta Reel (vertical vidéo)**:
- **Dimensions**: 1080×1920px (9:16 aspect ratio) — IDENTIQUE à Story
- **Zone safe**: Identique à Story (TOP 250px, BOTTOM 310px)
- **Durée**: 15-90 secondes (optimum 30-45s)
- **Différence vs Story**: Reel privilégie la découverte (feed Explore) vs Story (audience existante)
- **Composition recommandée**: Hook visuel fort dans les 3 premières secondes (mouvement, texte overlay, visage)
- **Texte overlay**: Max 5-7 mots par frame, taille 60-80pt (lisibilité mobile)
- **Captions**: Obligatoires (80% des Reels regardés sans son)
- **File format**: MP4 H.264, 30fps, max 4GB

**Meta Carousel (multiple images)**:
- **Dimensions par carte**: 1080×1080px (carré, identique à Feed)
- **Nombre de cartes**: 2-10 images
- **Zone safe**: 50px marge par carte
- **Règle d'or**: Chaque carte doit fonctionner STANDALONE (ne pas dépendre de la suivante pour compréhension)
- **Usage optimal**: Storytelling séquentiel (Avant → Après), features produit (1 feature par carte), tutoriels (étapes numérotées)
- **Texte**: Max 2 lignes par carte (espace limité)
- **File format**: JPG/PNG, max 30MB total

#### LinkedIn Ads Formats

**LinkedIn Single Image (paysage standard)**:
- **Dimensions**: 1200×627px (1.91:1 aspect ratio)
- **Zone safe**: 60px marge tout autour (LinkedIn crop agressif sur mobile)
- **Ratio texte max**: <25%
- **Composition recommandée**: Professional Screenshot (dashboard produit) OU Data Visualization (chart/graph)
- **Texte**: Max 150 caractères headline (LinkedIn truncate après)
- **Ton**: Professionnel B2B, éviter visuels trop créatifs/playful
- **Logo**: Obligatoire coin haut-gauche (80×80px)
- **CTA**: Bouton LinkedIn native ("Learn More", "Download", "Sign Up")
- **File format**: JPG/PNG, max 5MB

**LinkedIn Carousel**:
- **Dimensions par carte**: 1080×1080px (carré)
- **Nombre de cartes**: 2-10
- **Zone safe**: 60px marge par carte (crop LinkedIn agressif)
- **Composition recommandée**: Data-driven (charts, infographies, screenshots produit avec annotations)
- **Usage optimal**: Case studies (1 slide problème, 1 slide solution, 1 slide résultats), Product features (1 feature par slide)
- **File format**: JPG/PNG, max 10MB total

**LinkedIn Article (sponsored content)**:
- **Dimensions image hero**: 1200×627px (identique à Single Image)
- **Texte**: 150-300 mots (LinkedIn preview montre 2 premières lignes)
- **Composition**: Image hero professionnelle + texte structuré avec bullets
- **CTA**: Call-to-action natif LinkedIn

#### Google Display Formats (Bannières)

**Google Display - Leaderboard**:
- **Dimensions**: 728×90px (paysage ultra-large, ratio 8.09:1)
- **Zone safe**: 20px marge gauche/droite, 10px haut/bas
- **Composition recommandée**: Image + Text Block (moitié gauche 350px = visuel, moitié droite 350px = texte + CTA)
- **Texte**: Max 10-15 mots (espace limité vertical)
- **Headline**: 18-24pt max (lisibilité)
- **CTA**: Bouton 120×40px max, coin droit
- **Border**: 1-2px solid (contrast color) pour attirer l'œil
- **File format**: JPG/PNG/GIF, max 150KB (Google limite strict)

**Google Display - Medium Rectangle**:
- **Dimensions**: 300×250px (le format le plus commun, ratio 1.2:1)
- **Zone safe**: 15px marge tout autour
- **Composition recommandée**: Image 60% / Texte 40% (vertical split OU top/bottom split)
- **Texte**: Max 20-30 mots (plus d'espace que Leaderboard)
- **Headline**: 24-32pt
- **CTA**: Bouton 140×40px, placement bas-centre
- **Background**: Uni ou dégradé subtil (éviter images complexes sur petit format)
- **File format**: JPG/PNG/GIF, max 150KB

**Google Display - Wide Skyscraper**:
- **Dimensions**: 160×600px (vertical étroit, ratio 0.27:1)
- **Zone safe**: 10px marge gauche/droite, 20px haut/bas
- **Composition recommandée**: Stacked (logo haut 160×80px, visuel milieu 160×300px, texte+CTA bas 160×200px)
- **Texte**: Max 30 mots (disposition verticale permet plus de texte)
- **Headline**: 18-24pt (largeur limitée)
- **CTA**: Bouton full-width 140×40px, placement bas
- **Usage optimal**: Sidebar desktop, articles de blog, sites d'actualité
- **File format**: JPG/PNG/GIF, max 150KB

**Google Display - Mobile Banner**:
- **Dimensions**: 320×50px (ultra-compact, ratio 6.4:1)
- **Zone safe**: 10px marge gauche/droite, 5px haut/bas
- **Composition recommandée**: Logo gauche (50×40px) + Texte centre (180px) + CTA droite (70×40px)
- **Texte**: Max 5-7 mots (espace ultra-limité)
- **Headline**: 14-16pt max
- **CTA**: Texte "Download" ou icône (flèche, download icon)
- **File format**: JPG/PNG, max 150KB

#### YouTube Ads Formats

**YouTube Pre-Roll Thumbnail** (si vidéo):
- **Dimensions**: 1280×720px (16:9 aspect ratio, paysage HD)
- **Zone safe**: 80px marge tout autour (UI YouTube overlay)
- **Composition recommandée**: Visage humain (expression forte, eye contact) + Texte overlay (5-7 mots max)
- **Texte**: Lisible en 2 secondes (taille min 48pt)
- **Contraste**: Élevé (thumbnail compétitionne avec 20+ autres vidéos)
- **File format**: JPG, max 2MB

**YouTube Discovery Thumbnail**:
- **Dimensions**: 1280×720px (16:9)
- **Composition recommandée**: Clickbait visuel (contraste élevé, texte bold, visage/expression, flèche/cercle pointant élément clé)
- **Texte overlay**: Max 5-7 mots, taille 60-80pt, couleur contrastante
- **Règle d'or**: Thumbnail doit communiquer la value prop SANS lire le titre vidéo
- **File format**: JPG, max 2MB

**YouTube Shorts Thumbnail**:
- **Dimensions**: 1080×1920px (9:16 vertical, identique à Meta Story/Reel)
- **Zone safe**: TOP 250px, BOTTOM 310px (identique à Meta)
- **Composition**: Identique à Meta Reel (hook visuel fort, texte overlay zone middle)
- **File format**: JPG, max 2MB

#### Email Formats

**Email Header Banner**:
- **Dimensions**: 600×200px (ratio 3:1, standard email desktop)
- **Zone safe**: 30px marge tout autour (certains clients email crop)
- **Composition recommandée**: Logo gauche (150×140px) + Headline centre (300px) + CTA droite (120×60px)
- **Texte**: Max 10-15 mots (email preview)
- **File format**: JPG/PNG, max 200KB (éviter GIF animés, bloqués par certains clients)
- **Alt text**: Obligatoire (images bloquées par défaut dans Gmail/Outlook)

**Email Mobile Banner**:
- **Dimensions**: 600×400px (ratio 3:2, optimisé mobile)
- **Zone safe**: 40px marge tout autour
- **Composition**: Vertical stack (logo haut, visuel middle, CTA bas)
- **Texte**: Max 20 mots, taille 24pt min (lisibilité mobile)
- **File format**: JPG/PNG, max 200KB

### 3. Adaptation Contextuelle par Plateforme

#### Meta Feed → Story (Adaptation Verticale)

**Changements techniques**:
- Rotation 1080×1080 → 1080×1920 (rajouter 840px haut+bas)
- Hero element repositionné au centre vertical (zone middle 960×1360)
- Texte déplacé de bas (Feed) → zone safe middle (Story)

**Changements psychologiques**:
- Feed = scroll passif → Story = engagement actif (swipe, tap, DM)
- Texte Feed (3 lignes) → Story (2 lignes max, plus gros 48pt)
- CTA Feed ("Acheter") → Story ("Swipe Up", "DM pour offre")

**Exemple**:
- Feed: Produit centré + texte bas "Découvrez notre gamme bio -20%"
- Story: Même produit full-screen + texte overlay middle "BIO -20%" + sticker "Swipe Up" bottom

#### LinkedIn Feed → Meta Feed (Adaptation Ton)

**Changements techniques**:
- Dimensions 1200×627 (paysage) → 1080×1080 (carré) — recrop ou regenerate
- Zone safe 60px → 50px

**Changements psychologiques**:
- LinkedIn = professionnel B2B → Meta = casual B2C/B2B
- Ton LinkedIn ("Optimisez votre ROI marketing") → Meta ("Doublez vos ventes en 30 jours")
- Visuel LinkedIn (screenshot dashboard, chart) → Meta (lifestyle, produit)

**Exemple**:
- LinkedIn: Screenshot dashboard SaaS + stat "+245% ROI en 6 mois"
- Meta: Personne souriante devant laptop + "Doublez vos ventes avec notre outil"

#### Google Display 300×250 → 728×90 (Adaptation Spatiale)

**Changements techniques**:
- Ratio 1.2:1 (quasi-carré) → 8.09:1 (ultra-large)
- Composition vertical split (top/bottom) → horizontal split (left/right)
- Texte 20-30 mots → 10-15 mots (espace vertical limité)

**Changements psychologiques**:
- 300×250 = plus d'espace → message complet possible
- 728×90 = minimaliste → message ultra-concis (5 mots max)

**Exemple**:
- 300×250: Image produit top 50% + headline "Réduisez vos coûts Google Ads de 40%" + CTA "Essai gratuit"
- 728×90: Logo gauche (90×70px) + "Google Ads -40%" centre + CTA "Essai gratuit" droite

#### YouTube Thumbnail → Meta Reel (Adaptation Contenu)

**Changements techniques**:
- Dimensions 1280×720 (paysage) → 1080×1920 (vertical) — rotation + recrop
- Thumbnail statique → Reel vidéo 30s

**Changements psychologiques**:
- Thumbnail = attirer le clic → Reel = retenir l'attention 30s
- Thumbnail texte overlay 5-7 mots → Reel captions complètes (80% watch sans son)
- Thumbnail visage + expression → Reel hook vidéo (mouvement, action dans 3s)

**Exemple**:
- Thumbnail: Visage choqué + texte "Comment j'ai doublé mon trafic en 7 jours"
- Reel: Vidéo 30s (intro hook 3s identique au thumbnail, puis reveal méthodologie, CTA fin)

### 4. Génération Batch (Automatisation)

**Ordre de génération optimal** (du master concept vers les variantes):

1. **Générer Master Concept** (Meta Feed 1080×1080) — le format le plus polyvalent
2. **Variantes Meta**:
   - Story 1080×1920 (crop vertical du Feed + ajustements zones safe)
   - Reel (si vidéo demandée, sinon skip)
   - Carousel (découper le concept en 3-5 cartes si storytelling séquentiel)

3. **Variantes LinkedIn**:
   - Single Image 1200×627 (adapter ton professionnel + screenshot/chart si SaaS/B2B)
   - Carousel (si case study ou multi-features)

4. **Variantes Google Display**:
   - Medium Rectangle 300×250 (le plus commun)
   - Leaderboard 728×90 (version minimaliste)
   - Wide Skyscraper 160×600 (version verticale)

5. **Variantes YouTube** (si contenu vidéo):
   - Pre-Roll Thumbnail 1280×720
   - Discovery Thumbnail (variante clickbait du Pre-Roll)
   - Shorts Thumbnail 1080×1920 (identique à Meta Story)

6. **Variantes Email**:
   - Header Banner 600×200 (logo + headline + CTA)
   - Mobile Banner 600×400 (version verticale)

**Total généré**: 10-15 variantes à partir d'UN concept

### 5. Checklist Adaptation

Avant de livrer les variantes:

- [ ] Dimensions exactes respectées (vérifier largeur × hauteur)
- [ ] Zones safe respectées (texte/logo jamais dans zones coupées)
- [ ] Ratio texte <20% (Meta Feed) ou <25% (LinkedIn) ou <30% (Stories)
- [ ] Texte lisible sur mobile (min 24pt body, 36pt headline)
- [ ] CTA visible (contraste >4.5:1, taille min 40px hauteur)
- [ ] Brand colors cohérentes sur toutes variantes
- [ ] Logo présent sur toutes variantes (sauf Stories/Reels si créatif full-screen)
- [ ] File size <150KB (Google Display) ou <30MB (Meta) ou <5MB (LinkedIn)
- [ ] File format correct (JPG/PNG pour static, MP4 pour vidéo)
- [ ] Ton adapté à la plateforme (pro LinkedIn, casual Meta, minimaliste Google)
- [ ] Preview mobile testé (375×667px simulator)

---

## Output Format

```json
{
  "master_concept": {
    "value_prop": "Réduisez vos coûts Google Ads de 40%",
    "offer": "Essai gratuit 14 jours",
    "cta": "Démarrer l'essai",
    "tone": "Professionnel, Urgent",
    "hero_visual": "Screenshot dashboard SaaS",
    "brand_colors": ["#0066CC", "#FFFFFF", "#F0F0F0"]
  },
  "adaptations": [
    {
      "platform": "Meta Feed",
      "format": "1080x1080",
      "composition": "Hero Product",
      "text_overlay": "Google Ads -40% | Essai gratuit 14j",
      "safe_zones": "50px all sides",
      "text_ratio": "18%",
      "cta_placement": "Bottom-right badge",
      "file_size_kb": 450,
      "url": "https://res.cloudinary.com/.../meta-feed.jpg"
    },
    {
      "platform": "Meta Story",
      "format": "1080x1920",
      "composition": "Vertical Hero",
      "text_overlay": "Google Ads -40%",
      "safe_zones": "TOP 250px, BOTTOM 310px, SIDES 60px",
      "text_ratio": "12%",
      "cta_placement": "Bottom zone (swipe up sticker)",
      "file_size_kb": 680,
      "url": "https://res.cloudinary.com/.../meta-story.jpg"
    },
    {
      "platform": "LinkedIn Single Image",
      "format": "1200x627",
      "composition": "Professional Screenshot",
      "text_overlay": "Optimisez votre ROI Google Ads (+40%)",
      "safe_zones": "60px all sides",
      "text_ratio": "22%",
      "cta_placement": "LinkedIn native button",
      "file_size_kb": 320,
      "url": "https://res.cloudinary.com/.../linkedin-feed.jpg"
    },
    {
      "platform": "Google Display - Medium Rectangle",
      "format": "300x250",
      "composition": "Image + Text Block (60/40 split)",
      "text_overlay": "Google Ads -40% | Essai 14j",
      "safe_zones": "15px all sides",
      "cta_placement": "Bottom-center button",
      "file_size_kb": 85,
      "url": "https://res.cloudinary.com/.../google-300x250.jpg"
    },
    {
      "platform": "Google Display - Leaderboard",
      "format": "728x90",
      "composition": "Horizontal split (logo left, text center, CTA right)",
      "text_overlay": "Google Ads -40%",
      "safe_zones": "20px left/right, 10px top/bottom",
      "cta_placement": "Right 120x40px button",
      "file_size_kb": 65,
      "url": "https://res.cloudinary.com/.../google-728x90.jpg"
    },
    {
      "platform": "Google Display - Wide Skyscraper",
      "format": "160x600",
      "composition": "Stacked (logo top, visual middle, CTA bottom)",
      "text_overlay": "Google Ads -40% | Essai gratuit",
      "safe_zones": "10px left/right, 20px top/bottom",
      "cta_placement": "Bottom full-width button",
      "file_size_kb": 95,
      "url": "https://res.cloudinary.com/.../google-160x600.jpg"
    },
    {
      "platform": "YouTube Pre-Roll Thumbnail",
      "format": "1280x720",
      "composition": "Face + Text Overlay",
      "text_overlay": "Google Ads -40% en 7 jours",
      "safe_zones": "80px all sides",
      "cta_placement": "N/A (YouTube button overlay)",
      "file_size_kb": 280,
      "url": "https://res.cloudinary.com/.../youtube-preroll.jpg"
    },
    {
      "platform": "Email Header Banner",
      "format": "600x200",
      "composition": "Logo left, Headline center, CTA right",
      "text_overlay": "Réduisez vos coûts Ads de 40%",
      "safe_zones": "30px all sides",
      "cta_placement": "Right 120x60px button",
      "file_size_kb": 120,
      "alt_text": "Dashboard SaaS Google Ads - Essai gratuit 14 jours",
      "url": "https://res.cloudinary.com/.../email-600x200.jpg"
    }
  ],
  "total_variants": 8,
  "generation_time_seconds": 45,
  "approval_required": true
}
```

## Anti-Patterns à Éviter

❌ **Copier-coller le même visuel sur toutes plateformes** → Crop incorrect, texte illisible, zones safe violées
❌ **Ne pas adapter le ton** → Message LinkedIn casual = unprofessional, message Meta trop corporate = low engagement
❌ **Générer tous les formats d'un coup sans valider le master** → Si le master concept est mauvais, toutes les variantes sont mauvaises
❌ **Ignorer les file size limits** → Google rejette >150KB, upload échoue
❌ **Texte trop long sur petits formats** → Leaderboard 728×90 avec 30 mots = illisible
❌ **Zones safe non respectées** → Texte coupé par UI (Story, YouTube), mauvais crop (LinkedIn mobile)
❌ **Pas de CTA visible** → Variante inutile (pas d'action possible)
❌ **Brand colors incohérentes** → Perte de brand recognition entre variantes

## Ressources

- Meta Creative Specs: https://www.facebook.com/business/ads-guide
- LinkedIn Ad Specs: https://business.linkedin.com/marketing-solutions/ad-specs
- Google Display Specs: https://support.google.com/google-ads/answer/1722096
- YouTube Thumbnail Best Practices: https://support.google.com/youtube/answer/72431
