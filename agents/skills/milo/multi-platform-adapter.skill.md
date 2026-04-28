# Multi-Platform Adapter — Milo Skill

## Déclencheur
- "adapte ce contenu pour toutes les plateformes"

## Méthodologie

À partir d'UN concept, générer :
1. Meta Feed (1080x1080) — texte court, CTA direct
2. Meta Story (1080x1920) — plein écran, swipe up
3. LinkedIn (1200x627) — ton professionnel, stat/chiffre
4. Google Display (3 formats) — minimaliste, CTA visible
5. Email banner (600x200) — preview-friendly

Respect zones safe :
- Meta Story : pas texte 60px haut / 100px bas
- LinkedIn : marge gauche 200px avatar

## Output
```json
{
  "concept": "Promotion produits bio -20%",
  "adaptations": [
    {"platform": "Meta Feed", "format": "1080x1080", "url": "..."},
    {"platform": "Meta Story", "format": "1080x1920", "url": "..."},
    {"platform": "LinkedIn", "format": "1200x627", "url": "..."}
  ]
}
```
