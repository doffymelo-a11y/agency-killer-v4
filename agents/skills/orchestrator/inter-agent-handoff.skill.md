# Inter-Agent Handoff — Orchestrator Skill

## Déclencheur
- Requête nécessitant plusieurs agents
- Chaînage de tâches (Luna → Marcus → Milo)

## Méthodologie
1. Décomposer requête en sous-tâches
2. Identifier agent owner par tâche :
   - SEO/Content → Luna
   - Analytics/Tracking → Sora
   - Ads/Budget → Marcus
   - Créatifs → Milo
   - Social Media → Doffy
3. Définir ordre d'exécution (dépendances)
4. Passer contexte entre agents via `shared_project_context`
5. Agréger résultats finaux

## Output
```json
{
  "request": "Lancer campagne Meta pour nouveau produit",
  "workflow": [
    {
      "step": 1,
      "agent": "Luna",
      "task": "Créer landing page optimisée SEO",
      "deliverable": "landing_page_url"
    },
    {
      "step": 2,
      "agent": "Milo",
      "task": "Générer 5 visuels Meta Feed",
      "input_from_step": 1,
      "deliverable": "image_urls"
    },
    {
      "step": 3,
      "agent": "Marcus",
      "task": "Lancer campagne Meta Ads",
      "input_from_step": [1, 2],
      "deliverable": "campaign_id"
    },
    {
      "step": 4,
      "agent": "Sora",
      "task": "Setup tracking + dashboard",
      "input_from_step": 3,
      "deliverable": "dashboard_url"
    }
  ],
  "estimated_duration": "45 minutes",
  "human_approval_required": ["step_1", "step_3"]
}
```
