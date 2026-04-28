# Onboarding New Client — Orchestrator Skill

## Déclencheur
- Nouveau projet créé (Genesis Wizard)
- "commence l'onboarding"

## Méthodologie
1. Collecter informations client (Genesis Wizard)
2. Créer checklist onboarding :
   - Luna : Audit SEO initial + concurrents
   - Sora : Setup tracking (GA4, GTM, pixels)
   - Marcus : Connexion comptes ads (Meta, Google)
   - Doffy : Audit social media actuel
   - Milo : Récupération brand assets
3. Exécuter tâches en parallèle (agents autonomes)
4. Générer rapport initial (baseline)
5. Proposer plan 30/60/90 jours

## Output
```json
{
  "client": "Acme Corp",
  "project_id": "uuid-123",
  "onboarding_tasks": [
    {
      "agent": "Luna",
      "task": "Audit SEO complet",
      "status": "completed",
      "deliverable": "SEO_AUDIT_REPORT",
      "score": 62
    },
    {
      "agent": "Sora",
      "task": "Setup GA4 + GTM",
      "status": "completed",
      "deliverable": "TRACKING_SETUP",
      "property_id": "G-XXXXXX"
    },
    {
      "agent": "Marcus",
      "task": "Connexion Meta Ads",
      "status": "pending_credentials",
      "blocker": "Attente accès Ad Account"
    },
    {
      "agent": "Doffy",
      "task": "Audit social media",
      "status": "completed",
      "deliverable": "SOCIAL_AUDIT",
      "platforms": ["Instagram", "LinkedIn"]
    },
    {
      "agent": "Milo",
      "task": "Import brand assets",
      "status": "completed",
      "deliverable": "BRAND_GUIDELINES",
      "assets_count": 12
    }
  ],
  "baseline_report": {
    "seo_score": 62,
    "tracking_health": 85,
    "social_engagement": 2.1,
    "current_ad_spend": 0
  },
  "recommended_plan": {
    "30_days": "Focus SEO quick wins + setup ads",
    "60_days": "Launch first campaigns + content strategy",
    "90_days": "Optimize based on data + scale"
  },
  "next_action": "Obtenir accès Meta Ads pour débloquer Marcus"
}
```
