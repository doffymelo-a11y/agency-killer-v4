# Brand Voice Guardian — Milo Skill

## Déclencheur
- "vérifie la cohérence de marque"
- "ce texte respecte-t-il notre brand voice ?"

## Méthodologie
1. Lire brand guidelines (tone, valeurs, mots-clés, interdits)
2. Analyser le contenu proposé (ad copy, visuel, vidéo)
3. Scoring 0-100 sur 4 axes :
   - Tone consistency (formel vs casual)
   - Keywords usage (présence brand terms)
   - Visual coherence (couleurs, fonts si applicable)
   - Interdits (mots/phrases à éviter)
4. Si score < 70 → proposer corrections

## Output
```json
{
  "score": 85,
  "tone_match": true,
  "keywords_present": ["bio", "durable", "artisanal"],
  "visual_coherence": true,
  "violations": [],
  "corrections": [
    {
      "original": "Achetez maintenant",
      "suggested": "Découvrir nos produits",
      "reason": "CTA trop direct, préférer ton consultatif"
    }
  ]
}
```
