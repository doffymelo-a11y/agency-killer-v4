# Hashtag Strategist — Doffy Skill

## Déclencheur
- "trouve des hashtags pour ce post"
- "optimise mes hashtags"

## Méthodologie
1. Mix 70/20/10 :
   - 70% niche hashtags (10K-100K posts)
   - 20% large hashtags (100K-1M posts)
   - 10% branded hashtags (custom brand)
2. Vérifier popularité actuelle (tendances)
3. Éviter hashtags bannis/shadowban
4. Max 5 hashtags LinkedIn, 10-15 Instagram, 3-5 TikTok
5. Placer hashtags en caption (pas en commentaire)

## Output
```json
{
  "platform": "Instagram",
  "recommended_hashtags": [
    {"tag": "#MarketingDigital", "size": "large", "posts": 850000},
    {"tag": "#SEOLocal", "size": "niche", "posts": 45000},
    {"tag": "#AgencyKiller", "size": "branded", "posts": 120}
  ],
  "total": 12,
  "placement": "caption",
  "avoid": ["#followforfollow", "#like4like"]
}
```
