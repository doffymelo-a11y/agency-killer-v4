# Ad Copy Frameworks — Milo Skill

## Déclencheur
- "écris une pub"
- Tâche copywriting

## Méthodologie

### Frameworks
- **AIDA** (Attention-Interest-Desire-Action) : produits nouveaux
- **PAS** (Problem-Agitate-Solve) : services B2B
- **BAB** (Before-After-Bridge) : transformations
- **4Ps** (Promise-Picture-Proof-Push) : landing pages
- **FOMO** : offres limitées

### 3 Variations
1. Émotionnelle (storytelling)
2. Rationnelle (chiffres/preuves)
3. Directe (offre claire)

Format : headline (max 40 chars) + primary text (max 125 chars) + CTA

## Output
```json
{
  "framework": "PAS",
  "variations": [
    {
      "type": "emotional",
      "headline": "Votre SEO vous fait perdre des clients",
      "body": "Chaque jour sans SEO = 10 clients perdus. Notre IA optimise en 10min.",
      "cta": "Démarrer maintenant"
    },
    {
      "type": "rational",
      "headline": "SEO automatisé : +45% trafic en 30j",
      "body": "Prouvé sur 1200 sites. IA analyse + corrige en 10min. Essai gratuit 7j.",
      "cta": "Tester gratuitement"
    },
    {
      "type": "direct",
      "headline": "Audit SEO complet en 10 minutes",
      "body": "IA analyse votre site + plan d'action. 0€ pour commencer.",
      "cta": "Lancer l'audit"
    }
  ]
}
```
