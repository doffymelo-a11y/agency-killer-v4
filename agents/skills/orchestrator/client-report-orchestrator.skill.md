# Client Report Orchestrator — Orchestrator Skill

## Déclencheur
- "génère le rapport client mensuel"
- Fin de période (automatique)

## Méthodologie
1. Collecter données de chaque agent :
   - Sora → Analytics (trafic, conversions, ROI)
   - Marcus → Ad performance (spend, ROAS, CPA)
   - Luna → SEO progress (rankings, backlinks, organic traffic)
   - Doffy → Social media (engagement, reach, followers)
2. Agréger en rapport unifié
3. Générer executive summary (3-5 bullet points)
4. Créer visualisations (charts, graphs)
5. Export PDF brandé

## Output
```json
{
  "report_type": "monthly",
  "period": "2026-04",
  "sections": [
    {
      "agent": "Sora",
      "title": "Analytics Overview",
      "kpis": {
        "sessions": 45000,
        "conversions": 320,
        "revenue": 128000
      }
    },
    {
      "agent": "Marcus",
      "title": "Ads Performance",
      "kpis": {
        "spend": 15000,
        "roas": 8.5,
        "campaigns_active": 12
      }
    },
    {
      "agent": "Luna",
      "title": "SEO Progress",
      "kpis": {
        "keywords_top10": 45,
        "organic_traffic": 12000,
        "backlinks_new": 23
      }
    },
    {
      "agent": "Doffy",
      "title": "Social Media",
      "kpis": {
        "followers_growth": 850,
        "engagement_rate": 4.2,
        "posts_published": 28
      }
    }
  ],
  "executive_summary": [
    "Revenue +42% vs last month (€128K)",
    "ROAS ads 8.5 (target 5.0) — excellent",
    "SEO: 15 nouveaux mots-clés en top 10",
    "Social: engagement rate 4.2% (industry avg 2.8%)"
  ],
  "pdf_url": "https://storage.googleapis.com/.../report-2026-04.pdf"
}
```
