# KPI Dashboard Builder — Sora Skill

## Déclencheur
- User dit : "crée un dashboard" ou "configure les KPIs"
- Première connexion analytics
- Phase : Setup

## Méthodologie

### 1. Identifier KPIs Pertinents Selon Scope
**E-Commerce** :
- Revenue, ROAS, AOV (Average Order Value), Conversion Rate, Cart Abandonment Rate

**Lead Generation** :
- Leads, MQL, SQL, Cost Per Lead, Lead-to-Customer Rate

**SaaS** :
- Sign-ups, Free Trial → Paid, MRR, Churn Rate, LTV

### 2. Configurer Sources de Données
- GA4 (traffic, conversions, revenue)
- Meta Ads (spend, ROAS, CPA)
- Google Ads (spend, ROAS, CPA)
- Google Search Console (impressions, clicks, CTR)

### 3. Définir Périodes de Comparaison
- WoW (Week over Week)
- MoM (Month over Month)
- YoY (Year over Year)

### 4. Créer les Visualisations
**KPI Cards** : Valeur actuelle + variation + trend icon
**Line Charts** : Évolution temporelle (sessions, revenue, conversions)
**Bar Charts** : Comparaison par canal ou par campagne

### 5. Ajouter Benchmarks Industrie
Exemples :
- E-commerce : Conversion rate moyenne 2-3%
- Lead gen B2B : Cost per Lead 50-150€
- SaaS : Free-to-Paid 10-25%

### 6. Configurer Alertes Automatiques
Seuils d'anomalie :
- Variation >30% → alerte automatique
- ROAS <2 → alerte budget
- Conversion rate <1% → alerte funnel

## Output Attendu

### Format JSON
```json
{
  "type": "ANALYTICS_DASHBOARD",
  "data": {
    "scope": "e-commerce",
    "date_range": {"start": "2026-04-01", "end": "2026-04-27", "comparison": "previous_period"},
    "kpis": [
      {
        "id": "revenue",
        "label": "Revenue",
        "value": 28450,
        "previous_value": 24600,
        "trend": 15.6,
        "trend_direction": "up",
        "format": "currency",
        "currency": "EUR"
      },
      {
        "id": "roas",
        "label": "ROAS",
        "value": 3.9,
        "previous_value": 3.2,
        "trend": 21.9,
        "trend_direction": "up",
        "format": "number",
        "benchmark": 4.0
      }
    ],
    "charts": [
      {
        "id": "revenue_evolution",
        "type": "line",
        "title": "Évolution du Revenue",
        "data": [
          {"date": "2026-04-01", "revenue": 850},
          {"date": "2026-04-02", "revenue": 920}
        ],
        "xKey": "date",
        "yKeys": ["revenue"],
        "colors": ["#10B981"]
      }
    ],
    "insights": [
      {
        "type": "success",
        "message": "Revenue en hausse de 15.6% ce mois",
        "agent": "sora"
      }
    ],
    "last_updated": "2026-04-27T14:30:00Z"
  }
}
```

## Notes Techniques
- Dashboard rafraîchi toutes les heures
- Stocker config dans `project_memory`
- Utiliser MCP tools pour collecter données en temps réel
