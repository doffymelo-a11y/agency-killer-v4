---
name: seo-keyword-research
agent: luna
category: audit
genesisTask: "🔑 Keyword Research"
triggerPrompts:
  - "Fais une keyword research pour [domaine/site]"
  - "Quels sont les mots-cles a cibler en SEO pour [secteur] ?"
  - "Trouve-moi 50 keywords avec volume et difficulte pour mon site"
shortDescription: "Recherche de mots-cles SEO avec volume, difficulte, intent et clustering thematique"
estimatedMinutes: 15
tools:
  - seo-audit-server
  - web-intelligence-server
bestInClassTools:
  - Ahrefs Keywords Explorer
  - SurferSEO
psychologicalAngles:
  - Search intent matching
  - Topical authority
---

# Keyword Research SEO — Luna Skill

## Declencheur

- Tache Genesis : `🔑 Keyword Research` (scope SEO).
- Phrase utilisateur : "fais une keyword research", "quels mots-cles cibler en SEO", "trouve-moi des keywords pour [secteur]".
- Phase projet : Audit (avant Production de contenu) ou Optimization (refresh trimestriel).
- Pre-requis souhaite : URL site + secteur + langue/geo. Si manquant : avancer sur hypotheses explicites tirees du `genesis_context` (industry / target_audience / business_goal).

## Methodologie

### 1. Definition du perimetre

Avant de chercher, cadrer 6 dimensions — non-negociable pour livrer une V1 utile :
- **Site cible** (URL principale + sous-domaines a inclure / exclure).
- **Langue** : `fr-FR` par defaut, sinon herite du `target_audience` Genesis.
- **Geo** : France entiere, regions, ou international (impacte le volume Ahrefs/GKP).
- **Type de cible** : B2B (volumes faibles, intent fort), B2C generaliste (volumes eleves, intent variable), B2C niche (volumes moyens, conversion elevee).
- **Phase d'achat dominante** : awareness, consideration, decision (oriente le mix intent).
- **Maturite SEO** : nouveau site (vise des KD < 30), site etabli (peut viser KD 40-60), site autoritaire (KD 60+ accessible).

Sortie de cette etape : un brief de 5 lignes max qui ancre toutes les decisions des etapes suivantes.

### 2. Seed keywords (10-20)

Construire la liste de seeds de 3 sources :
1. **Brainstorm produit/service** : noms de produits, services, problemes resolus, jargon metier. Si Genesis a renseigne `offer_hook` et `pain_point`, ils sont des seeds directs.
2. **Concurrents** : top 3-5 concurrents (depuis `competitors_list` Genesis) → extraction des keywords pour lesquels ils rankent dans le top 10 (Ahrefs Site Explorer "Top Pages" + "Organic Keywords").
3. **GSC client** (si connecte via integration) : queries actuelles avec impressions > 0 sur 90 derniers jours, meme si position > 20 — signal d'opportunite.

Cible : 15 seeds couvrant les 3 niveaux d'intent (informational, commercial, transactional). Trop peu de seeds = arbre de recherche pauvre. Trop de seeds = bruit.

### 3. Expansion via outils

- **PRIMARY : Ahrefs Keywords Explorer** — entrer chaque seed, recolter les onglets "Matching terms", "Related terms", "Search suggestions", "Questions". Volume + KD + intent + clicks (souvent < volume = signal de SERP feature qui mange le trafic).
- **FALLBACK gratuit : Google Keyword Planner** — moins precis sur les volumes (buckets) mais utile pour valider la presence sur le marche francais.
- **Questions / long-tail : Answer The Public, AlsoAsked, People Also Ask manuel** — capture les variations conversationnelles qui matchent l'intent informational.
- **MCP `seo-audit-server`** : pour recuperer le contexte SERP en live (concurrents reels positionnes maintenant).

Cible : 200-300 keywords brut au sortir de l'expansion.

### 4. Filtrage qualite

Enlever 60-70 % des keywords brut via 3 filtres :

| Filtre | Seuil B2B niche | Seuil B2C generaliste | Seuil e-commerce |
|---|---|---|---|
| Volume mensuel min. | 30 | 200 | 100 |
| KD max (blog/contenu) | 35 | 50 | 50 |
| KD max (page produit/landing) | 60 | 70 | 60 |
| Pertinence business | obligatoire | obligatoire | obligatoire |

Le filtre "pertinence business" est qualitatif : eliminer les keywords a fort volume mais sans lien avec l'offre (ex : "definition CRM" pour un editeur CRM = volume eleve mais intent informational pur, conversion proche de zero — garder seulement si strategie content marketing top-of-funnel assumee).

### 5. Classification par intent

Tagger chaque keyword survivant avec un intent (Google standard) :
- **Informational** : "comment faire X", "qu'est-ce que Y", "guide Z" → cible : article de blog ou ressource gratuite.
- **Navigational** : "marque + produit", "[marque] connexion" → cible : page marque ou redirect.
- **Commercial investigation** : "meilleur X", "X vs Y", "avis Z", "comparatif" → cible : landing comparative ou page categorie.
- **Transactional** : "acheter X", "prix Y", "abonnement Z", "demo gratuite" → cible : page produit ou tunnel de vente.

C'est l'etape la plus mal faite par les agences : un keyword "logiciel CRM" = commercial investigation, **PAS** informational. Mismatch intent ↔ type de page = position 8-15 plafond.

### 6. Clustering thematique

Grouper les keywords semantiquement proches : 1 cluster = 1 page cible. Methode :
1. Sort par volume desc.
2. Pour chaque keyword head, regrouper toutes les variantes long-tail qui partagent le meme intent + meme contexte semantique.
3. Verifier dans Google : si les top 10 sont identiques sur 2 keywords → meme cluster. Si differents → 2 pages distinctes.

Exemple concret pour un editeur SaaS CRM :
- **Cluster 1 (commercial)** : "logiciel crm pme" / "meilleur crm pme" / "crm pour petites entreprises" → 1 landing comparative.
- **Cluster 2 (transactional)** : "logiciel crm prix" / "tarif crm" / "abonnement crm pme" → 1 page tarifs.
- **Cluster 3 (informational top-funnel)** : "qu'est-ce qu'un crm" / "comment choisir un crm" / "guide crm pme" → 3 articles blog interlies.

Cible : 8-15 clusters prioritaires (au-dela on dilue l'effort).

### 7. Priorisation impact x effort

Score par keyword :

```
priority_score = (volume * intent_weight) / max(KD, 5)
```

Avec `intent_weight` :
- transactional : 3.0
- commercial : 2.0
- informational top-funnel : 1.0
- navigational : 0.3 (deja capte naturellement)

Exemple : `"crm pme prix"` (vol 480, KD 32, intent transactional) = (480 × 3) / 32 = **45 pts** → P1.
`"qu'est-ce qu'un crm"` (vol 2900, KD 18, informational) = (2900 × 1) / 18 = **161 pts** → P2 (volume tres eleve compense intent faible).

Trier le scoring par cluster, garder les 3 keywords head + 5-10 long-tail par cluster prioritaire.

### 8. Identification gap concurrentiel

Outil : **Ahrefs Content Gap** (multi-comparaison : client + 3 concurrents). Sortie attendue : keywords ou ≥ 2 concurrents rankent top 10 ET le client n'est pas dans le top 100.

Flagger separement :
- **Quick wins gap** : KD < 35 + volume > 200 + ≥ 3 concurrents top 10 → opportunites a attaquer dans les 30 jours.
- **Strategic gaps** : KD 35-60 + volume > 500 → planifier un cluster de contenu sur 3-6 mois.
- **Out-of-reach** : KD > 60 → noter pour roadmap netlinking long terme, ne pas attaquer en V1.

Si MCP `web-intelligence-server` disponible : screenshot des SERP top 3 pour les 5 quick wins → preuve visuelle dans le rapport pour le client.

### 9. Recommandations contenu

Pour chaque cluster prioritaire (top 5), produire :
- **Type de page** : landing comparative / page produit / article blog / ressource gratuite (ebook, calculateur).
- **Brief court** (2-3 phrases) : H1 propose, angle editorial, CTA cible.
- **KPI cible 90 jours** : position moyenne (ex : "top 5 sur le head keyword"), impressions GSC (`+200%`), conversions assistees (basee sur taux de conversion historique de la categorie).

Eviter de promettre des positions absolues "position 1 sur [head keyword] dans 30 jours" — c'est commercialement seduisant mais SEO-naivement faux. Preferer fourchettes realistes.

### 10. Plan de mesure

- **Outils** : Google Search Console (impressions, CTR, position) + Ahrefs Rank Tracker (positions hebdomadaires sur les keywords prioritaires) + GA4 (conversions assistees par landing page).
- **Frequence** : check mensuel sur les KPI cles, review trimestrielle complete (refresh keyword research si > 6 mois).
- **KPI critiques** : impressions GSC du cluster (signal de visibilite), CTR moyen (signal de qualite snippet), position moyenne (signal de progression), conversions assistees (signal de business impact).
- **Trigger d'alerte** : si position moyenne d'un cluster prioritaire chute de > 5 places sur 4 semaines → re-audit immediat (algo update, perte de backlinks, contenu concurrent supplante).

## Output Format

```json
{
  "type": "KEYWORD_RESEARCH_REPORT",
  "data": {
    "site_url": "https://example.com",
    "research_date": "YYYY-MM-DD",
    "language": "fr",
    "geo": "FR",
    "scope": {
      "audience": "B2B niche",
      "buying_phase": "consideration + decision",
      "site_maturity": "etabli"
    },
    "total_keywords_analyzed": 250,
    "filtered_relevant": 80,
    "clusters": [
      {
        "cluster_name": "Logiciel CRM PME",
        "intent": "commercial",
        "head_keyword": "logiciel crm pme",
        "keywords": [
          {"kw": "logiciel crm pme", "volume": 1200, "kd": 35, "intent": "commercial", "priority_score": 8.4},
          {"kw": "meilleur crm pme", "volume": 480, "kd": 28, "intent": "commercial", "priority_score": 6.9},
          {"kw": "crm pour petites entreprises", "volume": 320, "kd": 22, "intent": "commercial", "priority_score": 5.8}
        ],
        "recommended_page_type": "landing_comparative",
        "brief": "H1 'Le meilleur CRM pour PME en 2026' — angle benchmark vs 3 concurrents + tableau comparatif",
        "kpi_3m": {"position_moyenne_cible": "top 8", "impressions_gain": "+250%", "conversions_assistees": 12}
      }
    ],
    "competitor_gaps": [
      {
        "keyword": "crm gratuit pme",
        "volume": 590,
        "kd": 24,
        "competitor_ranking": "competitor-a.com #2, competitor-b.com #4, competitor-c.com #7",
        "client_ranking": "not in top 100",
        "estimated_value": "high",
        "category": "quick_win"
      }
    ],
    "next_steps": [
      "Lancer cluster 1 (Logiciel CRM PME) cette semaine — brief Milo",
      "Capter 3 quick wins gap competitor sous 30 jours",
      "Setup Ahrefs Rank Tracker sur les 25 keywords prioritaires"
    ]
  }
}
```

## Cross-agent handoff

- **Vers Milo** : si gaps concurrentiels prioritaires identifies → `milo/seo-content-density-optimizer` (a venir) pour generer les briefs articles. Si type `landing_comparative` retenu → `milo/visual-brief-creator` pour les visuels comparatifs.
- **Vers Marcus** : si keywords commerciaux a fort volume detectes ET budget Ads disponible → suggerer une campagne SEM ciblee sur les head keywords pour capter le trafic immediat pendant que le SEO se construit (synergie SEO + SEM, 6-12 mois).
- **Vers Sora** : si `tracking_events` Genesis ne contient pas d'evenement "page vue blog" / "engagement contenu" → trigger `sora/tracking-setup-auditor` pour mesurer correctement le ROI du contenu.

## UX Discoverability

- triggerPrompts visibles dans Chat suggestions: oui (post-V4)
- Quick Action button visible: oui (post-V4)
- Recommande pour scope: seo, full_scale

## Notes Techniques

- **MCP tools utilises** : `seo-audit-server` (audit + SERP context), `web-intelligence-server` (screenshot SERP, scraping concurrents).
- **Ahrefs API** : non integree actuellement. Mentionner Ahrefs comme outil best-in-class dans la reponse, et s'appuyer sur la connaissance domaine Luna + GSC client + manual research si l'integration est absente.
- **Stockage** : resultats persistes dans `project_memory` table `keyword_research_reports` (a creer au moment du premier run si absente). Permet le diff trimestriel.
- **Volume seuil dynamique** : si la reponse `industry` Genesis contient "B2B" ou un secteur niche connu (legal, medical, industrial), abaisser le seuil de volume minimum de 50 % par rapport au tableau filtrage.
- **Edge case site neuf** : si DR Ahrefs < 10, ignorer les keywords KD > 30 meme prioritaires — ils ne ranquerront pas avant 12-18 mois. Privilegier long-tail KD < 15 pour gagner du trafic rapidement.
