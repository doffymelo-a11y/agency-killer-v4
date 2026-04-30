# Visual Brief Creator — Milo Skill

## Déclencheur
- "crée un visuel"
- "génère une image"
- "produis un créatif"
- Tâche création visuelle (ad creative, social post, banner)

## Contexte

Le brief visuel est la fondation d'un créatif performant. Un brief précis permet de générer des visuels on-brand qui respectent les contraintes techniques des plateformes ET maximisent l'impact visuel.

**Règle d'or**: La composition visuelle doit servir le message, pas l'inverse. Un beau visuel qui ne communique pas la value proposition est inutile.

**Principe fondamental**: Platform-first design. Les règles de composition, zones safe, et formats varient DRASTIQUEMENT entre Meta Feed (carré), Stories (vertical), et Google Display (bannière horizontale).

## Méthodologie Complète

### 1. Lire Brand Context (Inputs)

**Données brand requises**:
- **Couleurs primaires**: HEX codes (ex: #FF5733, #0066CC)
- **Couleurs secondaires**: HEX codes (ex: #F0F0F0, #333333)
- **Ton de voix**: Professionnel, Friendly, Luxe, Playful, Corporate
- **Industrie**: E-commerce, SaaS B2B, Lead gen local, E-learning, Finance
- **Audience cible**: Age, demo, psychographic (ex: Entrepreneurs 25-45 ans, tech-savvy)
- **Logo**: URL du fichier logo (PNG transparent, SVG idéal)
- **Typography**: Police primaire (ex: "Montserrat Bold", "Inter Regular")

**Si données brand manquantes**: Créer task "Définir brand guidelines" → assigner Luna → bloquer création visuelle.

### 2. Choisir Format Plateforme (Dimensions Exactes)

#### Meta Ads Formats

**Feed (carré recommandé)**:
- Dimensions: **1080×1080px** (carré 1:1)
- Alternative paysage: 1200×628px (1.91:1)
- Ratio texte max: **<20%** (Meta rejette si >20%)
- Zone safe: **50px marge intérieure** (éviter texte/éléments clés près des bords)

**Stories + Reels (vertical)**:
- Dimensions: **1080×1920px** (9:16 vertical)
- Zone safe TOP: **250px** (éviter logo/texte sous l'icône profil)
- Zone safe BOTTOM: **310px** (éviter texte au-dessus des boutons "Swipe Up")
- Ratio texte max: **<30%** (Stories plus permissif que Feed)

**Carousel (multiple images)**:
- Dimensions: **1080×1080px** (carré)
- 2-10 images par carousel
- Chaque image doit fonctionner STANDALONE (ne pas dépendre de la suivante pour compréhension)

#### Google Display Formats (Bannières)

**Leaderboard**:
- Dimensions: **728×90px** (paysage ultra-large)
- Zone safe: **20px marge gauche/droite**, 10px haut/bas
- Texte max: **10-15 mots** (espace limité)

**Medium Rectangle**:
- Dimensions: **300×250px** (le plus commun)
- Zone safe: **15px marge** tout autour
- Composition: **Image 60% / Texte 40%**

**Wide Skyscraper**:
- Dimensions: **160×600px** (vertical étroit)
- Zone safe: **10px marge gauche/droite**, 20px haut/bas
- Composition: **Stacked** (logo haut, visuel milieu, CTA bas)

#### LinkedIn Ads Formats

**Single Image (paysage)**:
- Dimensions: **1200×627px** (1.91:1 paysage)
- Zone safe: **60px marge** tout autour (LinkedIn crop agressif)
- Ratio texte max: **<25%**
- Style: **Professionnel**, éviter visuels trop créatifs/playful (audience B2B)

**Carousel**:
- Dimensions: **1080×1080px** (carré)
- 2-10 images
- Style: **Data-driven** (charts, infographies, screenshots produit)

#### YouTube Ads Formats

**In-Stream Thumbnail (si vidéo)**:
- Dimensions: **1280×720px** (16:9 paysage)
- Zone safe: **80px marge** tout autour
- Texte max: **5-7 mots** (lisible en 2 secondes)

**Discovery Thumbnail**:
- Dimensions: **1280×720px** (16:9)
- Style: **Clickbait visuel** (contraste élevé, visage/expression, texte bold)

### 3. Règles de Composition par Plateforme

#### Meta Feed (1080×1080)

**Composition "Hero Product"** (E-commerce):
- **Hero element**: Produit centré, occupe 60-70% de l'image
- **Background**: Uni ou subtil (pas de distraction)
- **Texte**: Max 3 lignes, placé haut OU bas (zone safe)
- **CTA**: Badge coin bas-droit ("Acheter", "Découvrir")

**Composition "Lifestyle"** (Brand awareness):
- **Hero element**: Personne utilisant le produit, rule of thirds (décentré)
- **Background**: Contexte réaliste (bureau, maison, nature)
- **Texte**: Overlay avec fond semi-transparent (lisibilité)
- **Logo**: Coin haut-gauche, discret

**Composition "Text-Heavy"** (Lead gen, webinar):
- **Background**: Dégradé uni (brand colors)
- **Texte**: 70% de l'image, hiérarchie claire (titre 48pt, body 24pt)
- **Visuel secondaire**: Icône/illustration 30%, soutient le message
- **CTA**: Bouton graphique bas de l'image

#### Stories/Reels (1080×1920)

**Composition "Vertical Hero"**:
- **Zone TOP 250px**: Logo + handle (@ du compte)
- **Zone MIDDLE 1420px**: Hero visuel (personne, produit, screenshot)
- **Zone BOTTOM 250px**: Texte CTA ("Swipe Up", "En savoir plus")

**Règle "Thumbstop"**: Première 0.5s doit capturer l'attention
- **Contraste élevé** (couleurs vives vs fond)
- **Mouvement** (si vidéo, action dans les 0.5s)
- **Visage humain** (eye contact, expression forte)

#### Google Display (300×250)

**Composition "Image + Text Block"**:
- **Moitié gauche (150px)**: Visuel (produit, icône, illustration)
- **Moitié droite (150px)**: Texte (headline 3-5 mots, CTA bouton)
- **Background**: Uni (brand color) OU dégradé subtil
- **Border**: 2px solid (contrast color) pour attirer l'œil

#### LinkedIn (1200×627)

**Composition "Professional Screenshot"** (SaaS B2B):
- **Background**: Screenshot produit (dashboard, interface)
- **Overlay**: Fond semi-transparent haut (60% opacity)
- **Texte**: Headline value prop (ex: "Automatisez vos campagnes Google Ads")
- **Logo**: Coin haut-gauche, taille 80×80px

**Composition "Data Visualization"** (Lead gen B2B):
- **Background**: Chart/Graph (bar chart, line graph)
- **Highlight**: Cercle/flèche pointant insight clé
- **Texte**: Stat chiffrée grande taille (ex: "+245% ROI")
- **Source**: Petit texte bas ("Source: Étude interne 2026")

### 4. Styles Photographiques par Industrie

#### E-commerce (Shopify, WooCommerce)

**Style "Product on White"**:
- **Background**: Blanc pur (#FFFFFF)
- **Lighting**: Studio lighting, 3-point setup
- **Shadows**: Soft drop shadow (réalisme)
- **Angle**: 45° angle (montre volume produit)

**Style "Lifestyle Context"**:
- **Background**: Home/outdoor scene (contexte usage)
- **Lighting**: Natural light (golden hour si outdoor)
- **Composition**: Product in use (main tenant le produit, personne utilisant)
- **Mood**: Aspirational (client idéal dans environnement idéal)

#### SaaS B2B

**Style "Clean Interface Screenshot"**:
- **Background**: Screenshot dashboard produit
- **Treatment**: Légère blur background + sharp foreground feature
- **Overlay**: Annotations (flèches, highlights, callouts)
- **Color grading**: Saturation +10% (pop visuel)

**Style "Team Collaboration"**:
- **Background**: Moderne bureau open-space
- **Subject**: 2-3 personnes discutant devant écran
- **Lighting**: Natural window light
- **Mood**: Professionnel mais friendly

#### Lead Gen Local (Plombier, Avocat, Dentiste)

**Style "Trust Portrait"**:
- **Background**: Uni (brand color) OU lieu de travail flou
- **Subject**: Professionnel (plombier en uniform, avocat en suit)
- **Expression**: Sourire confiant, eye contact caméra
- **Lighting**: Flattering portrait lighting (softbox)

**Style "Before/After"**:
- **Composition**: Split screen 50/50 vertical
- **Left**: Problème (tuyau cassé, dent abîmée)
- **Right**: Solution (réparation, dent réparée)
- **Label**: Texte "AVANT" / "APRÈS" overlays

#### E-learning / Formation en ligne

**Style "Instructor Portrait"**:
- **Background**: Bibliothèque/bureau professionnel (flou)
- **Subject**: Instructeur regardant caméra, expression engageante
- **Props**: Livre/tablet visible (crédibilité)
- **Lighting**: Natural + fill light (flattering)

**Style "Screen Recording + Face"**:
- **Composition**: Picture-in-picture (screen 70%, face 30% coin bas-droit)
- **Screen**: Tutorial/demo (action en cours)
- **Face**: Instructor expliquant (engaged expression)

#### Finance / Assurance

**Style "Data Viz + Trust Signal"**:
- **Background**: Subtle financial charts (stock market graphs)
- **Foreground**: Stat chiffrée + logo certification (ex: "Assurance ACPR")
- **Color scheme**: Bleu/vert (trust colors), éviter rouge (perte)
- **Typography**: Serif font (sérieux, établi)

### 5. Génération via Imagen 3.0 (Prompt Engineering)

**Structure prompt optimale**:
```
[STYLE], [SUBJECT], [CONTEXT], [LIGHTING], [COMPOSITION], [MOOD], [TECHNICAL]

Exemple:
"Professional product photography, organic skincare bottle on marble countertop, natural window lighting from left, centered composition with negative space, clean and minimalist mood, high resolution 4K, shallow depth of field f/2.8"
```

**Paramètres Imagen 3.0**:
- **Style**: `photorealistic`, `digital_art`, `minimalist`, `illustration`, `3d_render`
- **Aspect ratio**: `1:1` (Feed), `9:16` (Stories), `16:9` (YouTube)
- **Guidance scale**: `7-10` (contrôle précision vs créativité)
- **Steps**: `30-50` (qualité vs vitesse)

**Negative prompt** (éléments à éviter):
```
"blurry, low quality, distorted, watermark, logo, text, cluttered, busy background, oversaturated"
```

### 6. Brand Safety Check (Validation Pré-Upload)

#### Vérification Couleurs (Brand Consistency)

**Check HEX codes**:
- Extraire couleurs dominantes image générée (ex: #FF5733, #0066CC)
- Comparer avec brand colors (tolérance ±15 HEX)
- Si >30% de l'image utilise couleurs hors-brand → regénérer

#### Vérification Texte Lisible (Mobile-First)

**Test lisibilité**:
- Simuler affichage mobile (375×667px iPhone)
- Texte doit être lisible SANS zoom
- Taille min: **24pt pour body**, **36pt pour headline**
- Contraste min: **4.5:1** (WCAG AA standard)

**Outils**: Contrast Checker (ex: WebAIM)

#### Vérification Ratio Texte (Meta Ads)

**Règle Meta <20% texte**:
- Diviser image en grille 5×5 (25 cellules)
- Compter cellules avec >50% texte
- Ratio = (cellules_texte / 25) × 100%
- Si >20% → Meta peut rejeter ou limiter reach

**Outil**: Meta Text Overlay Tool

---

## Output Format

```json
{
  "visual_brief_id": "vb_20260428_001",
  "platform": "Meta Feed",
  "format": {
    "dimensions": "1080x1080px",
    "aspect_ratio": "1:1",
    "file_type": "JPG",
    "file_size_max": "30MB"
  },
  "composition": {
    "style": "Hero Product",
    "hero_element": "Organic skincare bottle centered",
    "background": "Marble countertop, natural light",
    "text_placement": "Top 200px (brand name + tagline)",
    "logo_placement": "Bottom-right corner, 100x100px",
    "safe_zones": "50px margin all sides"
  },
  "prompt_imagen": {
    "positive": "Professional product photography, organic skincare bottle on white marble countertop, natural window lighting from left, centered composition with negative space top and bottom, clean minimalist mood, soft shadows, high resolution 4K, shallow depth of field f/2.8, product label facing camera",
    "negative": "blurry, low quality, distorted, watermark, cluttered, busy background, oversaturated, multiple products",
    "style": "photorealistic",
    "aspect_ratio": "1:1",
    "guidance_scale": 8,
    "steps": 40
  },
  "brand_safety_check": {
    "colors_match": true,
    "brand_colors_detected": ["#4CAF50", "#FFFFFF", "#E0E0E0"],
    "brand_colors_target": ["#4CAF50", "#FFFFFF"],
    "variance_acceptable": true,
    "text_legible_mobile": true,
    "text_size_min": "36pt",
    "contrast_ratio": "6.2:1",
    "text_ratio_meta": "15%",
    "meta_approval_likely": true
  },
  "generated_url": "https://res.cloudinary.com/hive-os/image/upload/v1714322000/visuals/vb_20260428_001.jpg",
  "variants_generated": 3,
  "selected_variant": 2,
  "approval_required": true
}
```

## Checklist Création Visuelle

Avant de soumettre le visuel final:

- [ ] Format correct pour plateforme cible (dimensions exactes)
- [ ] Zones safe respectées (marges intérieures)
- [ ] Composition adaptée (Hero Product / Lifestyle / Text-Heavy)
- [ ] Style photographique cohérent avec industrie
- [ ] Brand colors présentes (±15 HEX tolérance)
- [ ] Logo visible (si requis, coin haut-gauche ou bas-droit)
- [ ] Texte lisible mobile (min 24pt body, 36pt headline)
- [ ] Contraste texte/background >4.5:1
- [ ] Ratio texte <20% (Meta Feed) ou <30% (Stories)
- [ ] Image haute résolution (min 1080px largeur)
- [ ] File size <30MB (upload limit Meta/LinkedIn)
- [ ] Preview testé sur mobile (375×667px simulator)

## Anti-Patterns à Éviter

❌ **Texte >20% sur Meta Feed** → Ad rejected ou reach limité
❌ **Texte près des bords Stories** → Couvert par UI (profile icon, CTA buttons)
❌ **Image basse résolution** (<800px) → Pixelisée sur grand écran, unprofessional
❌ **Trop d'éléments visuels** → Cluttered, message dilué
❌ **Couleurs hors-brand** → Incohérence visuelle, perte brand recognition
❌ **CTA invisible** → Pas de contraste, trop petit, mauvais placement
❌ **Visage coupé** (crop trop serré) → Unprofessional, éviter surtout LinkedIn B2B
❌ **Stock photo générique** → Manque authenticité, low trust

## Ressources

- Meta Creative Best Practices: https://www.facebook.com/business/ads-guide/image
- Google Display Specs: https://support.google.com/google-ads/answer/1722099
- LinkedIn Ad Specs: https://business.linkedin.com/marketing-solutions/ad-specs
- Contrast Checker (WCAG): https://webaim.org/resources/contrastchecker/
- Meta Text Overlay Tool: https://www.facebook.com/ads/tools/text_overlay
