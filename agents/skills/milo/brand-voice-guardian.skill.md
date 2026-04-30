# Brand Voice Guardian — Milo Skill

## Déclencheur
- "vérifie la cohérence de marque"
- "ce texte respecte-t-il notre brand voice ?"
- "audit brand compliance"
- Validation pré-publication (ad, post social, email)

## Contexte

La cohérence de marque est LE facteur différenciant dans un marché saturé. Apple, Nike, Coca-Cola sont reconnus en 2 secondes car leur voix est cohérente depuis 20+ ans. Une marque incohérente perd 40% de mémorisation et 25% de trust.

**Règle d'or**: La brand voice n'est PAS "comment on écrit", c'est "comment le client nous perçoit". Un texte grammaticalement parfait peut violer la brand voice s'il ne reflète pas les valeurs/ton de la marque.

**Principe fondamental**: Gardien, pas créateur. Ce skill VALIDE la cohérence, il ne crée PAS le contenu. Son rôle = QA brand compliance avant publication.

## Méthodologie Complète

### 1. Extraire Brand Guidelines (Inputs)

**Données brand requises**:

#### Tone of Voice (Ton de communication)

**4 axes Mailchimp** (standard industrie):
- **Formal ↔ Casual**: "Nous vous remercions" (formal) vs "Merci !" (casual)
- **Respectful ↔ Irreverent**: "Notre produit premium" (respectful) vs "Le truc qui déchire" (irreverent)
- **Enthusiastic ↔ Matter-of-fact**: "Vous allez ADORER cette fonctionnalité !" (enthusiastic) vs "Cette fonctionnalité permet X" (matter-of-fact)
- **Serious ↔ Funny**: "La sécurité de vos données est notre priorité" (serious) vs "On protège vos données comme un dragon son trésor" (funny)

**Scoring par axe**: 0-100 (0 = premier pôle, 100 = second pôle, 50 = neutre)

**Exemples**:
- **Apple**: Formal 30, Respectful 40, Matter-of-fact 60, Serious 70 → "Think different" (casual mais sérieux)
- **Mailchimp**: Casual 70, Irreverent 60, Enthusiastic 75, Funny 65 → "Send better email" (friendly et fun)
- **IBM**: Formal 80, Respectful 90, Matter-of-fact 80, Serious 85 → "Let's create" (corporate sérieux)
- **Innocent (smoothies)**: Casual 90, Irreverent 70, Enthusiastic 80, Funny 85 → "Hello, we're Innocent" (ultra casual fun)

#### Brand Keywords (Mots-clés de marque)

**3 catégories**:
1. **Core values** (valeurs fondamentales): Ex: "durable", "artisanal", "innovation", "simplicité"
2. **Product attributes** (attributs produit): Ex: "bio", "local", "rapide", "sécurisé"
3. **Differentiators** (différenciateurs): Ex: "made in France", "0 sucre ajouté", "IA-powered"

**Fréquence recommandée**: 1-2 keywords par 100 mots de copy

**Exemples**:
- **Patagonia**: Core = "sustainability", "activism", "quality" | Product = "recycled", "durable", "ethical" | Diff = "1% for the Planet"
- **Tesla**: Core = "innovation", "performance", "sustainability" | Product = "electric", "autopilot", "range" | Diff = "0-60 mph in 2s"
- **Airbnb**: Core = "belonging", "community", "trust" | Product = "unique", "local", "verified" | Diff = "Live anywhere"

#### Forbidden Words/Phrases (Mots interdits)

**Pourquoi des interdits**:
- Ton générique ("solutions", "leader du marché", "best-in-class") → perte de personnalité
- Jargon incompréhensible ("synergize", "leverage", "disruptive") → confusion client
- Langage concurrent ("like X but better") → positionnement faible
- Mots sensibles (religion, politique, sexe) → risque backlash

**Exemples**:
- **Patagonia**: Interdit "cheap", "fast fashion", "trendy" (contraire aux valeurs durabilité)
- **Apple**: Interdit "compatible", "customizable", "budget-friendly" (contraire au positionnement premium/simple)
- **Oatly**: Interdit "normal", "traditional", "classic" (marque positionnée sur disruption)

#### Visual Brand Elements (Éléments visuels)

**Si le contenu inclut des visuels**:
- **Couleurs primaires**: HEX codes (ex: #FF5733, #0066CC)
- **Couleurs secondaires**: HEX codes (ex: #F0F0F0, #333333)
- **Typographies**: Police primaire (ex: "Helvetica Neue", "Montserrat Bold")
- **Logo usage**: Taille min, marges, backgrounds interdits
- **Imagery style**: Photographie réaliste vs illustrations, palette couleurs warm vs cool

**Sources brand guidelines**:
- Document PDF brand book (uploader dans project_files)
- URL public (ex: https://brand.example.com/guidelines)
- Extractio

n manuelle depuis site web existant

### 2. Analyser le Contenu Proposé

#### Extraction texte

**Si contenu visuel** (image, vidéo):
- OCR (Optical Character Recognition) pour extraire texte overlay
- Analyse couleurs dominantes (palette HEX)
- Détection fonts (si possible via vision model)

**Si contenu texte pur** (ad copy, email, post):
- Texte brut direct

#### Tokenization & Parsing

**Décomposer le texte**:
- Headline (titre principal)
- Primary text (corps du texte)
- CTA (call-to-action)
- Disclaimer (si présent)

**Métriques extraites**:
- Nombre de mots total
- Nombre de phrases
- Longueur moyenne phrase (mots/phrase)
- Ponctuation exclamative (!) count (indicateur enthousiasme)
- CAPS count (indicateur urgence/excitation)

### 3. Scoring Brand Compliance (0-100)

#### Axe 1: Tone Consistency (30% du score total)

**Méthode**: Analyse LLM du texte sur les 4 axes Mailchimp → scoring 0-100 par axe → comparaison avec brand guidelines target

**Formule**:
```
Tone_score = 100 - (moyenne des écarts absolus sur 4 axes)

Exemple:
Brand target: Formal 30, Respectful 40, Matter-of-fact 60, Serious 70
Texte analysé: Formal 25, Respectful 50, Matter-of-fact 55, Serious 75

Écarts: |30-25| + |40-50| + |60-55| + |70-75| = 5 + 10 + 5 + 5 = 25
Moyenne écarts: 25 / 4 = 6.25
Tone_score = 100 - 6.25 = 93.75 → 94/100
```

**Seuils**:
- 90-100: Parfaite cohérence (vert)
- 70-89: Cohérence acceptable (jaune, suggestions mineures)
- <70: Incohérence (rouge, corrections majeures requises)

#### Axe 2: Keywords Usage (25% du score total)

**Méthode**: Compter présence de brand keywords (core values + product attributes + differentiators)

**Formule**:
```
Keywords_score = (Keywords_found / Keywords_expected) × 100

Exemple:
Brand keywords: "durable", "artisanal", "bio", "local", "made in France"
Texte: "Nos produits artisanaux et bio, fabriqués localement en France" → 4 keywords présents

Keywords_expected = 2 (recommandation: 1-2 keywords par 100 mots, texte 100 mots)
Keywords_found = 4
Keywords_score = (4 / 2) × 100 = 200 → cap à 100

Si 0 keywords: score = 0
Si 1 keyword: score = 50
Si 2+ keywords: score = 100
```

**Overuse penalty**: Si >5 keywords dans un texte <200 mots → pénalité -20 points (keyword stuffing)

#### Axe 3: Visual Coherence (20% du score total, si applicable)

**Méthode**: Extraction couleurs dominantes + comparaison avec brand palette

**Formule**:
```
Visual_score = (Brand_colors_present / Brand_colors_total) × 100

Exemple:
Brand colors: #FF5733 (rouge), #0066CC (bleu), #F0F0F0 (gris clair)
Image analysée: couleurs dominantes = #FF5733 (35%), #0066CC (25%), #FFFFFF (40%)

Brand_colors_present = 2 (rouge et bleu détectés)
Brand_colors_total = 3
Visual_score = (2 / 3) × 100 = 66.6 → 67/100
```

**Si pas de visuel**: score = N/A, redistribuer le poids (30% → Tone, 25% → Keywords, 25% → Interdits)

#### Axe 4: Forbidden Words Violations (25% du score total)

**Méthode**: Recherche exacte + synonymes des mots interdits

**Formule**:
```
Violations_score = 100 - (Violations_count × 20)

Exemple:
Texte: "Notre solution leader du marché offre des synergies best-in-class"
Mots interdits: "solution", "leader du marché", "synergies", "best-in-class"
Violations_count = 4

Violations_score = 100 - (4 × 20) = 100 - 80 = 20/100 (ROUGE)
```

**Pénalité progressive**:
- 0 violations: 100
- 1 violation: 80
- 2 violations: 60
- 3 violations: 40
- 4 violations: 20
- 5+ violations: 0

#### Score Global

**Formule pondérée**:
```
Global_score = (Tone × 0.30) + (Keywords × 0.25) + (Visual × 0.20) + (Violations × 0.25)

Exemple:
Tone = 94/100
Keywords = 100/100
Visual = 67/100
Violations = 20/100

Global = (94 × 0.30) + (100 × 0.25) + (67 × 0.20) + (20 × 0.25)
Global = 28.2 + 25 + 13.4 + 5 = 71.6 → 72/100 (JAUNE)
```

**Seuils décision**:
- **90-100 (VERT)**: Approuvé, publication sans modification
- **70-89 (JAUNE)**: Approuvé avec suggestions, corrections mineures recommandées
- **<70 (ROUGE)**: Rejeté, corrections majeures obligatoires

### 4. Générer Corrections (si score < 90)

#### Correction Tone

**Pattern**: Identifier les phrases qui dévient du ton cible → proposer réécriture

**Exemple**:
```
Brand target: Casual 70, Funny 65
Texte original: "Nous vous remercions de votre confiance en notre expertise"
Analyse: Formal 80, Serious 85 → écart de 50 points vs target

Correction suggérée: "Merci de nous faire confiance !"
Nouveau score: Casual 75, Funny 60 → écart de 10 points (amélioration)
```

#### Correction Keywords

**Pattern**: Injecter 1-2 brand keywords manquants

**Exemple**:
```
Texte original: "Nos produits sont de haute qualité"
Keywords brand: "artisanal", "bio", "local"
Keywords_found: 0

Correction suggérée: "Nos produits artisanaux bio sont de haute qualité"
Keywords_found après: 2 (artisanal, bio)
```

#### Correction Violations

**Pattern**: Remplacer mots interdits par synonymes alignés brand voice

**Exemple**:
```
Texte original: "Notre solution leader du marché"
Violations: "solution" (générique), "leader du marché" (jargon)

Correction suggérée: "Notre outil de marketing automation" (spécifique, concret)
Violations après: 0
```

#### Correction Visual

**Pattern**: Si couleurs hors-brand détectées, suggérer palette brand

**Exemple**:
```
Image analysée: couleurs dominantes = #FF0000 (rouge vif, 40%), #00FF00 (vert vif, 30%)
Brand colors: #FF5733 (rouge brique), #0066CC (bleu), #F0F0F0 (gris)

Correction suggérée: "Remplacer #FF0000 par #FF5733 (brand rouge), ajouter #0066CC (brand bleu) pour cohérence"
Visual_score avant: 0/100
Visual_score après: 100/100
```

---

## Output Format

```json
{
  "audit_id": "ba_20260428_001",
  "content_type": "Meta Feed Ad",
  "content_analyzed": {
    "headline": "Votre SEO vous fait perdre des clients",
    "primary_text": "Chaque jour sans SEO = 10 clients perdus. Notre IA optimise en 10min.",
    "cta": "Démarrer maintenant",
    "visual_url": "https://res.cloudinary.com/.../ad-visual.jpg"
  },
  "brand_guidelines_used": {
    "tone_target": {
      "formal_casual": 30,
      "respectful_irreverent": 40,
      "enthusiastic_matter_of_fact": 60,
      "serious_funny": 70
    },
    "keywords_required": ["SEO", "automatisé", "IA", "rapide", "gratuit"],
    "forbidden_words": ["solution", "leader", "synergies", "best-in-class"],
    "brand_colors": ["#FF5733", "#0066CC", "#F0F0F0"]
  },
  "scores": {
    "global_score": 72,
    "status": "YELLOW",
    "breakdown": {
      "tone_consistency": {
        "score": 94,
        "weight": 0.30,
        "contribution": 28.2,
        "detected_tone": {
          "formal_casual": 25,
          "respectful_irreverent": 50,
          "enthusiastic_matter_of_fact": 55,
          "serious_funny": 75
        },
        "deviations": {
          "formal_casual": 5,
          "respectful_irreverent": 10,
          "enthusiastic_matter_of_fact": 5,
          "serious_funny": 5,
          "average_deviation": 6.25
        }
      },
      "keywords_usage": {
        "score": 100,
        "weight": 0.25,
        "contribution": 25,
        "keywords_found": ["SEO", "IA"],
        "keywords_expected": 2,
        "keywords_missing": ["automatisé", "rapide", "gratuit"]
      },
      "visual_coherence": {
        "score": 67,
        "weight": 0.20,
        "contribution": 13.4,
        "colors_detected": ["#FF5733", "#0066CC", "#FFFFFF"],
        "brand_colors_present": 2,
        "brand_colors_total": 3,
        "colors_off_brand": ["#FFFFFF"]
      },
      "violations": {
        "score": 20,
        "weight": 0.25,
        "contribution": 5,
        "violations_count": 4,
        "violations_list": [
          {
            "word": "solution",
            "position": "ligne 2",
            "reason": "Mot générique interdit, préférer 'outil' ou nom produit spécifique"
          }
        ]
      }
    }
  },
  "corrections": [
    {
      "type": "tone",
      "severity": "minor",
      "original": "Nous vous remercions de votre confiance",
      "suggested": "Merci de nous faire confiance !",
      "reason": "Ton trop formel (80) vs target casual (30), écart de 50 points"
    },
    {
      "type": "keywords",
      "severity": "minor",
      "original": "Nos produits sont de haute qualité",
      "suggested": "Nos produits artisanaux bio sont de haute qualité",
      "reason": "Ajouter keywords 'artisanal' et 'bio' (0 keywords détectés, 2 recommandés)"
    },
    {
      "type": "violation",
      "severity": "major",
      "original": "Notre solution leader du marché",
      "suggested": "Notre outil de marketing automation",
      "reason": "Violations: 'solution' (générique), 'leader du marché' (jargon)"
    },
    {
      "type": "visual",
      "severity": "minor",
      "original_colors": ["#FF0000", "#00FF00"],
      "suggested_colors": ["#FF5733", "#0066CC"],
      "reason": "Couleurs hors brand palette, remplacer par brand colors"
    }
  ],
  "approval_status": "APPROVED_WITH_SUGGESTIONS",
  "reviewer_notes": "Score global 72/100 (JAUNE). Corrections mineures recommandées pour améliorer cohérence tone et visual. Violations mots interdits à corriger avant publication."
}
```

## Checklist Brand Compliance

Avant d'approuver le contenu:

- [ ] Score global ≥70 (minimum acceptable)
- [ ] Tone consistency ≥70 sur les 4 axes Mailchimp
- [ ] Au moins 1 brand keyword présent (core value OU product attribute OU differentiator)
- [ ] 0 forbidden words détectés (violations bloquantes)
- [ ] Couleurs brand présentes (si visuel applicable)
- [ ] Typographie cohérente avec brand (si visuel texte)
- [ ] Logo présent et conforme guidelines (taille min, marges)
- [ ] CTA aligné avec brand voice (ex: pas "Acheter" si brand consultatif)
- [ ] Aucun langage concurrent ("like X but better")
- [ ] Aucun mot sensible (religion, politique, sexe)

## Anti-Patterns à Éviter

❌ **Approuver score <70** → Incohérence brand, perte recognition
❌ **Ignorer violations mots interdits** → Positionnement dilué
❌ **Ne pas vérifier visuels** → Couleurs hors-brand passent inaperçues
❌ **Keyword stuffing** (>5 keywords dans 100 mots) → Unnatural, spam
❌ **Corriger sans expliquer** → L'utilisateur ne comprend pas pourquoi
❌ **Scoring subjectif** → Utiliser formules mathématiques, pas "gut feeling"
❌ **Oublier le contexte plateforme** → Un ton casual LinkedIn = unprofessional, un ton formal TikTok = ennuyeux

## Ressources

- Mailchimp Voice & Tone Guide: https://styleguide.mailchimp.com/voice-and-tone/
- Nielsen Norman Group Brand Voice: https://www.nngroup.com/articles/tone-of-voice-dimensions/
- Apple Brand Guidelines (public): https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html
