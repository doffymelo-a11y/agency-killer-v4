# Visual Brief Creator — Milo Skill

## Déclencheur
- "crée un visuel"
- Tâche création visuelle

## Méthodologie
1. Lire brand context (couleurs, ton, industrie, cible)
2. Choisir format plateforme :
   - Meta Feed : 1080x1080 ou 1200x628
   - Meta Story/Reel : 1080x1920
   - LinkedIn : 1200x627
   - Google Display : 300x250, 728x90, 160x600
3. Concept visuel : hero element, texte embedded, couleur fond
4. Générer via Imagen 3.0 : style (photorealistic, digital_art, minimalist), composition, mood
5. Brand safety : couleurs cohérentes, texte lisible mobile, ratio texte <20%

## Output
```json
{
  "format": "1080x1080",
  "platform": "Meta Feed",
  "concept": "Produit bio sur fond nature",
  "prompt": "Professional product photo, organic cosmetics on wooden table, natural lighting, minimalist style, green and white colors",
  "image_url": "https://res.cloudinary.com/.../generated.jpg",
  "brand_safety_check": {"colors": true, "text_legible": true, "text_ratio": 15}
}
```
