# ANALYSE DES CAPACITÉS DES AGENTS - THE HIVE OS V4
**Date:** 2026-02-10
**Version:** 1.0

---

## 📊 ÉTAT ACTUEL DES AGENTS

### ✅ SORA (Analyst) - TERMINÉ
**Status:** Capacités complètes pour tâches TYPE A (Setup)

**MCP Servers disponibles:**
- ✅ GA4 (Google Analytics 4) - via Data Fetcher
- ✅ GSC (Google Search Console) - via Data Fetcher
- 🆕 GTM (Google Tag Manager) - Specs créés
- 🆕 Google Ads - Specs créés
- 🆕 Meta Ads - Specs créés
- 🆕 Looker Studio - Specs créés

**Tâches couvertes (37 tâches de Setup):**
- ✅ Configuration tracking (GA4, GTM, Pixels)
- ✅ Création audiences (Google Ads, Meta Ads)
- ✅ Setup dashboards (Looker Studio)
- ✅ Analyse KPIs et recommendations
- ✅ Guidage utilisateur pour tâches TYPE B (code source)

**System Prompt:**
- ✅ Distinction TYPE A vs TYPE B claire
- ✅ Instructions MCP tools complètes
- ✅ Write-back commands documentés

---

### ✅ MILO (Creative) - TERMINÉ
**Status:** Workflow complet avec MCP servers

**MCP Servers disponibles:**
- ✅ Nano Banana Pro (Gemini 3 Pro) - Images 4K
- ✅ Veo-3 - Vidéos (4s-8s, 1080p, 60fps)
- ✅ ElevenLabs - Voice & Audio (29 langues)

**Tâches couvertes:**
- ✅ Image Generation (4K, 10 styles, prompt enhancement)
- ✅ Video Generation (text-to-video, image-to-video, extensions)
- ✅ Voice Generation (TTS, voice cloning, sound effects)
- ✅ Copywriting (Ads copy, blog posts, scripts)

**System Prompt:**
- ✅ Instructions détaillées pour chaque MCP tool
- ✅ Best practices (prompting, quality settings)
- ✅ Write-back commands pour deliverables
- ✅ Mémoire collective integration

---

## 🔍 LUNA (Strategist) - ANALYSE

### Rôle et Expertise
**Rôle:** Strategist - SEO, Content Strategy, Positioning

**Expertise attendue:**
- SEO Audit (technique + sémantique)
- Keyword Research & Competitor Analysis
- Content Strategy & Planning
- Positioning & Brand Strategy

### Tâches assignées (depuis Genesis Wizard)

#### 1. SEO & Content
| Tâche | Description | MCP Server requis | Status |
|-------|-------------|-------------------|--------|
| Audit SEO Technique & Sémantique | Crawl complet, analyse structure, vitesse, mobile | **SEO Audit Tool** | ❌ Manquant |
| Recherche Opportunités Keywords | Identifier mots-clés longue traîne, analyser volume/difficulté | **Keyword Research Tool** | ❌ Manquant |
| Analyse Concurrence | Analyser stratégies SEO concurrents, backlinks, content gaps | **Competitor Analysis Tool** | ❌ Manquant |
| Brief Contenu pour Milo | Structurer brief SEO (keywords, structure, longueur) | Aucun (output text) | ✅ OK |

#### 2. Strategy & Positioning
| Tâche | Description | MCP Server requis | Status |
|-------|-------------|-------------------|--------|
| Définir Positioning | USP, value proposition, différenciation | Aucun (AI reasoning) | ✅ OK |
| Content Strategy | Planning éditorial, topics, piliers de contenu | Aucun (AI planning) | ✅ OK |
| Validation Stratégie | Valider avec mémoire collective | Aucun (read-only) | ✅ OK |

### MCP Servers à créer pour Luna

#### 1. SEO Audit Tool (High Priority)
**Fonctions nécessaires:**
```typescript
interface SEOAuditTool {
  // Technical SEO
  crawl_site(url: string, max_pages?: number): CrawlReport;
  check_page_speed(url: string): PageSpeedScore;
  check_mobile_friendly(url: string): MobileFriendlyReport;
  check_core_web_vitals(url: string): CoreWebVitalsReport;

  // On-page SEO
  analyze_meta_tags(url: string): MetaTagsAnalysis;
  check_structured_data(url: string): StructuredDataReport;
  analyze_headings(url: string): HeadingsStructure;

  // Content SEO
  analyze_content_quality(url: string): ContentQualityScore;
  check_keyword_density(url: string, keywords: string[]): KeywordDensity;
}
```

**APIs à utiliser:**
- PageSpeed Insights API (Google)
- Mobile-Friendly Test API (Google)
- Structured Data Testing Tool API
- Screaming Frog API (si disponible) ou custom crawler

**Priorité:** 🔥 HIGH - Bloque audits SEO

---

#### 2. Keyword Research Tool (High Priority)
**Fonctions nécessaires:**
```typescript
interface KeywordResearchTool {
  // Keyword Discovery
  suggest_keywords(seed: string, language: string, country: string): KeywordSuggestions[];
  get_keyword_metrics(keywords: string[]): KeywordMetrics[];
  find_questions(topic: string): QuestionKeywords[];
  find_long_tail(seed: string): LongTailKeywords[];

  // Competitive Analysis
  get_competitor_keywords(domain: string): CompetitorKeywords[];
  find_keyword_gaps(our_domain: string, competitor_domains: string[]): KeywordGaps[];

  // Opportunity Scoring
  calculate_keyword_difficulty(keyword: string): DifficultyScore;
  estimate_traffic_potential(keyword: string): TrafficEstimate;
}
```

**APIs à utiliser:**
- Google Keyword Planner API (via Google Ads API)
- Semrush API (si budget disponible)
- Ahrefs API (si budget disponible)
- **Alternative gratuite:** Google Suggest API + Google Trends API + custom scoring

**Priorité:** 🔥 HIGH - Bloque recherche mots-clés

---

#### 3. Competitor Analysis Tool (Medium Priority)
**Fonctions nécessaires:**
```typescript
interface CompetitorAnalysisTool {
  // Traffic Analysis
  get_traffic_overview(domain: string): TrafficOverview;
  get_traffic_sources(domain: string): TrafficSources;
  compare_traffic(domains: string[]): TrafficComparison;

  // Content Analysis
  get_top_pages(domain: string): TopPages[];
  analyze_content_gaps(our_domain: string, competitor: string): ContentGaps[];

  // Backlink Analysis
  get_backlink_profile(domain: string): BacklinkProfile;
  find_link_opportunities(domain: string): LinkOpportunities[];

  // Keyword Overlap
  get_keyword_overlap(domain1: string, domain2: string): KeywordOverlap;
}
```

**APIs à utiliser:**
- SimilarWeb API (traffic estimates)
- Ahrefs API (backlinks, content)
- **Alternative:** Scraping + Google Search API + custom heuristics

**Priorité:** 📊 MEDIUM - Utile mais pas bloquant

---

#### 4. Content Optimization Tool (Low Priority)
**Fonctions nécessaires:**
```typescript
interface ContentOptimizationTool {
  // Content Scoring
  score_content(content: string, target_keyword: string): ContentScore;
  suggest_improvements(content: string, target_keyword: string): Suggestions[];

  // Readability
  check_readability(content: string): ReadabilityScore;
  check_grammar(content: string): GrammarIssues[];
}
```

**APIs à utiliser:**
- Surfer SEO API (si budget)
- Clearscope API (si budget)
- **Alternative:** Custom NLP scoring + Hemingway API

**Priorité:** 🔽 LOW - Nice to have

---

### Workflow Luna (Proposition)

```
[Webhook: When Called by PM]
  ↓
[Extract Context + Memory]
  ↓
[Luna Brain (Agent)] ←── [Tool: SEO Audit]
                     ←── [Tool: Keyword Research]
                     ←── [Tool: Competitor Analysis]
  ↓
[Parse Response & Commands]
  ↓
[Execute Write-Backs]
  ↓
[Return to PM]
```

**System Prompt Luna (Draft):**
```markdown
# Luna - Strategic Analyst

## Your Identity
You are **Luna**, the strategic brain of The Hive OS. You specialize in SEO strategy, keyword research, competitive analysis, and content planning.

## Core Capabilities

You have access to 3 powerful research tools:

### 1. SEO Audit Tool
Run comprehensive technical and on-page SEO audits:
- Technical health (crawl, speed, mobile-friendly, Core Web Vitals)
- On-page optimization (meta tags, headings, structured data)
- Content quality analysis

### 2. Keyword Research Tool
Discover high-opportunity keywords:
- Keyword suggestions and metrics (volume, difficulty, CPC)
- Long-tail keyword discovery
- Question keywords for FAQ content
- Competitive keyword gap analysis

### 3. Competitor Analysis Tool
Analyze competitor strategies:
- Traffic overview and sources
- Top performing pages
- Content gap analysis
- Backlink profile and opportunities

## Workflow

### Step 1: Understand Context
1. Read task description and user inputs
2. Check project_memory for previous strategic decisions
3. Identify the type of analysis needed (SEO audit, keyword research, competitor analysis)

### Step 2: Conduct Research
**For SEO Audits:**
1. Run technical crawl via `seo_audit.crawl_site()`
2. Check PageSpeed via `seo_audit.check_page_speed()`
3. Analyze on-page elements
4. Compile findings with prioritized recommendations

**For Keyword Research:**
1. Start with seed keywords from user
2. Expand via `keyword_research.suggest_keywords()`
3. Get metrics for all keywords
4. Find long-tail opportunities
5. Score by difficulty vs potential

**For Competitor Analysis:**
1. Identify 3-5 main competitors
2. Analyze traffic patterns
3. Identify content gaps
4. Find backlink opportunities
5. Compile strategic recommendations

### Step 3: Strategic Recommendations
1. Prioritize findings (quick wins vs long-term)
2. Provide actionable recommendations
3. Brief Milo if content creation needed
4. Set expectations on timeline and effort

### Step 4: Write Back
Use MEMORY_WRITE to document:
- Strategic decisions made
- Keywords validated for targeting
- Competitor insights
- Recommendations for next agents (Milo, Marcus)

## Write-Back Commands

**MEMORY_WRITE** - Document strategy
```
COMMAND: MEMORY_WRITE
REASON: Document validated SEO strategy
PAYLOAD: {
  "action": "STRATEGY_VALIDATED",
  "summary": "SEO audit completed. 47 keyword opportunities identified.",
  "key_findings": [
    "Current position moyenne: 34",
    "Top keyword: 'logiciel marketing'",
    "Main competitors: HubSpot, Semrush, Ahrefs"
  ],
  "recommendations": [
    "Target long-tail keywords first",
    "Avoid overly generic terms",
    "Recommended tone: Expert & Accessible"
  ]
}
```

## Best Practices
- Always validate findings with data
- Prioritize quick wins for early momentum
- Set realistic expectations
- Document decisions for team
- Brief Milo clearly for content execution
```

---

## ⚡ MARCUS (Trader/Execution Manager) - ANALYSE

### Rôle et Expertise
**Rôle:** Paid Ads Manager - Campaign Setup, Budget Optimization, Trading Decisions

**Expertise attendue:**
- Meta Ads Campaign Setup & Optimization
- Google Ads Campaign Setup & Optimization
- Budget Allocation (CBO, Manual Bidding)
- Scaling & Cutting Decisions
- Performance Analysis

### Tâches assignées (depuis Genesis Wizard)

#### 1. Meta Ads
| Tâche | Description | MCP Server requis | Status |
|-------|-------------|-------------------|--------|
| Structuration Campagne CBO | Setup CBO campaign, budget allocation, ad sets | **Meta Ads Manager** | 🆕 Specs créés |
| Paramétrage Lead Gen | Setup lead forms, custom questions, CRM integration | **Meta Ads Manager** | 🆕 Specs créés |
| Analyse Performance | Monitor KPIs, Learning Phase, identify winners/losers | **Meta Ads Manager** | 🆕 Specs créés |
| Scaling Decisions | Augmenter budget sur ad sets performants | **Budget Optimizer** | ❌ Manquant |
| Cutting Decisions | Pauser ad sets sous-performants | **Budget Optimizer** | ❌ Manquant |

#### 2. Google Ads
| Tâche | Description | MCP Server requis | Status |
|-------|-------------|-------------------|--------|
| Setup Campagne Search | Create campaigns, ad groups, RSA ads | **Google Ads Manager** | 🆕 Specs créés |
| Stratégie d'Enchères | Configure Smart Bidding, Target CPA/ROAS | **Google Ads Manager** | 🆕 Specs créés |
| Analyse Termes de Recherche | Identify negative keywords, search term gaps | **Google Ads Manager** | 🆕 Specs créés |
| Analyse Quality Score | Identify low QS keywords, optimization opportunities | **Google Ads Manager** | 🆕 Specs créés |

### MCP Servers à créer pour Marcus

#### 1. Meta Ads Manager Tool (High Priority)
**Status:** Specs créés dans SORA_TASKS_CATEGORIZATION.md - **Besoin implémentation**

**Fonctions nécessaires:**
```typescript
interface MetaAdsManager {
  // Campaign Management
  list_campaigns(account_id: string): Campaign[];
  create_campaign(account_id: string, params: CampaignParams): Campaign;
  update_campaign(campaign_id: string, updates: CampaignUpdate): Campaign;
  pause_campaign(campaign_id: string): boolean;

  // Ad Set Management
  list_ad_sets(campaign_id: string): AdSet[];
  create_ad_set(campaign_id: string, params: AdSetParams): AdSet;
  update_ad_set(ad_set_id: string, updates: AdSetUpdate): AdSet;
  check_learning_phase(ad_set_id: string): LearningPhaseStatus;

  // Performance Analysis
  get_insights(object_id: string, metrics: string[], date_range: DateRange): Insights;
  get_breakdown(campaign_id: string, breakdown_by: string): BreakdownReport;

  // Audience Management
  create_audience(account_id: string, params: AudienceParams): Audience;
  check_audience_overlap(audience_ids: string[]): OverlapReport;
}
```

**API:** Facebook Marketing API (Graph API)

**Priorité:** 🔥 HIGH - Bloque setup Meta Ads

---

#### 2. Google Ads Manager Tool (High Priority)
**Status:** Specs créés dans SORA_TASKS_CATEGORIZATION.md - **Besoin implémentation**

**Fonctions nécessaires:**
```typescript
interface GoogleAdsManager {
  // Campaign Management
  list_campaigns(account_id: string): Campaign[];
  create_campaign(account_id: string, params: CampaignParams): Campaign;
  update_campaign(campaign_id: string, updates: CampaignUpdate): Campaign;

  // Ad Group & Ads
  create_ad_group(campaign_id: string, params: AdGroupParams): AdGroup;
  create_rsa(ad_group_id: string, headlines: string[], descriptions: string[]): Ad;

  // Performance & Optimization
  get_search_terms(campaign_id: string, date_range: DateRange): SearchTerms[];
  get_quality_score(ad_group_id: string): QualityScoreReport[];
  add_negative_keywords(campaign_id: string, keywords: string[]): boolean;

  // Conversion Tracking
  list_conversions(account_id: string): Conversion[];
  create_conversion(account_id: string, params: ConversionParams): Conversion;

  // Audience Management
  create_audience(account_id: string, params: AudienceParams): Audience;
}
```

**API:** Google Ads API

**Priorité:** 🔥 HIGH - Bloque setup Google Ads

---

#### 3. Budget Optimizer Tool (Medium Priority)
**Fonctions nécessaires:**
```typescript
interface BudgetOptimizer {
  // Analysis
  analyze_performance(campaigns: Campaign[], metrics: string[]): PerformanceAnalysis;
  identify_scaling_opportunities(campaigns: Campaign[], target_roas: number): ScalingOpportunities[];
  identify_cutting_candidates(campaigns: Campaign[], min_roas: number): CuttingCandidates[];

  // Recommendations
  suggest_budget_reallocation(current_budgets: Budget[], performance: PerformanceData): BudgetRecommendations;
  calculate_optimal_bid(ad_set: AdSet, target_cpa: number): BidRecommendation;

  // Execution (via Meta/Google Ads APIs)
  scale_budget(campaign_id: string, increase_by: number): boolean;
  cut_budget(campaign_id: string, decrease_by: number): boolean;
  pause_underperformers(campaigns: Campaign[], threshold: number): boolean;
}
```

**Logique:** Custom algorithm combining Meta Ads + Google Ads insights

**Priorité:** 📊 MEDIUM - Automatise décisions, mais Marcus peut le faire manuellement

---

### Workflow Marcus (Proposition)

```
[Webhook: When Called by PM]
  ↓
[Extract Context + Memory]
  ↓
[Marcus Brain (Agent)] ←── [Tool: Meta Ads Manager]
                       ←── [Tool: Google Ads Manager]
                       ←── [Tool: Budget Optimizer]
  ↓
[Parse Response & Commands]
  ↓
[Execute Write-Backs]
  ↓
[Return to PM]
```

**System Prompt Marcus (Draft):**
```markdown
# Marcus - Execution Manager

## Your Identity
You are **Marcus**, the performance-driven trader of The Hive OS. You specialize in paid advertising campaign management, budget optimization, and data-driven trading decisions.

## Core Capabilities

You have access to 3 powerful advertising tools:

### 1. Meta Ads Manager
Manage Facebook & Instagram advertising:
- Create and configure CBO campaigns
- Setup ad sets with precise targeting
- Monitor Learning Phase status
- Analyze performance metrics (CTR, CPC, CPA, ROAS)
- Make scaling/cutting decisions

### 2. Google Ads Manager
Manage Google Search & Display advertising:
- Create Search campaigns with RSA ads
- Configure Smart Bidding strategies (Target CPA, Target ROAS)
- Analyze search terms and Quality Score
- Add negative keywords
- Create remarketing audiences

### 3. Budget Optimizer
Make data-driven budget decisions:
- Identify scaling opportunities (high ROAS, stable performance)
- Identify cutting candidates (low ROAS, Learning Limited)
- Suggest budget reallocation
- Calculate optimal bids

## Workflow

### Step 1: Understand Context
1. Read task and campaign objectives (ROAS target, CPA target, budget)
2. Check project_memory for Luna's audience insights and Milo's creatives
3. Identify platform (Meta Ads or Google Ads)

### Step 2: Campaign Setup
**For Meta Ads:**
1. Create campaign with CBO enabled
2. Setup ad sets with targeting (location, age, interests)
3. Configure budget and bidding strategy
4. Link creatives from Milo
5. Verify Pixel tracking (check with Sora if needed)

**For Google Ads:**
1. Create Search campaign
2. Setup ad groups by keyword theme
3. Create RSA ads with Milo's copy
4. Configure Smart Bidding (Target CPA or Target ROAS)
5. Add negative keywords from analysis

### Step 3: Performance Monitoring
1. Check Learning Phase status (Meta) or Learning period (Google)
2. Analyze key metrics: CTR, CPC, CPA, ROAS, Conversion Rate
3. Identify winners and losers at ad set/ad group level
4. Look for anomalies or opportunities

### Step 4: Trading Decisions
**Scaling:**
- Ad set with ROAS > target + stable for 3+ days → Scale +20-50%
- Campaign exiting Learning Phase successfully → Scale +20%

**Cutting:**
- Ad set with ROAS < 50% of target for 7+ days → Pause
- Learning Limited status for 14+ days → Pause
- Ad set spending > 2x CPA without conversion → Pause

**Optimizing:**
- Reallocate budget from low ROAS to high ROAS ad sets
- Duplicate winning ad sets with fresh audience
- Add negative keywords based on search terms

### Step 5: Write Back
Use MEMORY_WRITE to document:
- Campaign structure created
- Budget allocation decisions
- Scaling/cutting actions taken
- Key performance insights
- Recommendations for optimization

## Write-Back Commands

**MEMORY_WRITE** - Document campaign setup
```
COMMAND: MEMORY_WRITE
REASON: Document Meta Ads campaign setup
PAYLOAD: {
  "action": "CAMPAIGN_LAUNCHED",
  "summary": "CBO campaign launched with 3 ad sets (Interests, Lookalike, Retargeting)",
  "key_findings": [
    "Total budget: 150€/day",
    "Target ROAS: 4.0",
    "Creatives: 3 variations from Milo"
  ],
  "recommendations": [
    "Monitor Learning Phase closely in first 48h",
    "Scale winning ad sets after 5 days stable performance",
    "Test additional audiences if ROAS > 5.0"
  ]
}
```

**UPDATE_CAMPAIGN** - Modify campaign via API
```
COMMAND: UPDATE_CAMPAIGN
REASON: Scale winning ad set
PAYLOAD: {
  "platform": "meta_ads",
  "campaign_id": "...",
  "ad_set_id": "...",
  "action": "scale",
  "budget_increase": 50,
  "reason": "ROAS 6.2 (target: 4.0), stable for 4 days"
}
```

## Best Practices
- Always verify tracking before launch
- Respect Learning Phase (don't edit during)
- Scale gradually (+20-50% max per change)
- Document all decisions
- Use data, not gut feeling
- Coordinate with Milo for creative refreshes
```

---

## 📋 RÉSUMÉ DES ACTIONS REQUISES

### Immédiat (Cette semaine)
1. **✅ MILO** - Workflow complet créé avec MCP servers
2. **🔥 SORA** - Implémenter MCP servers dont specs existent:
   - GTM Manager Tool
   - Google Ads Manager Tool
   - Meta Ads Manager Tool
   - Looker Studio Tool

### Court terme (Semaine 2)
3. **🔍 LUNA** - Créer MCP servers SEO:
   - SEO Audit Tool (HIGH PRIORITY)
   - Keyword Research Tool (HIGH PRIORITY)
   - Competitor Analysis Tool (MEDIUM)

4. **⚡ MARCUS** - Utiliser MCP servers de Sora + créer:
   - Budget Optimizer Tool (MEDIUM - peut être fait manuellement en attendant)

### Moyen terme (Semaine 3-4)
5. **Tous les agents** - Tester end-to-end avec tâches réelles
6. **PM & Orchestrator** - Améliorer routing et injection mémoire collective
7. **Documentation** - Guides d'utilisation et troubleshooting

---

## 🎯 PRIORITÉS PAR IMPACT

| Priorité | Agent | Action | Impact | Effort |
|----------|-------|--------|--------|--------|
| 🔥 1 | SORA | Implémenter GTM + Meta + Google Ads MCP | Débloque 30+ tâches setup | 8-12h |
| 🔥 2 | LUNA | Créer SEO Audit Tool | Débloque audits SEO | 6-8h |
| 🔥 3 | LUNA | Créer Keyword Research Tool | Débloque recherche KW | 6-8h |
| 📊 4 | MARCUS | Tester avec MCP Sora (Meta/Google Ads) | Débloque campaign setup | 2-3h |
| 📊 5 | LUNA | Créer Competitor Analysis Tool | Améliore quality insights | 4-6h |
| 🔽 6 | MARCUS | Créer Budget Optimizer | Automatise décisions | 8-10h |

---

**Total Effort Estimé:** 34-47 heures
**Agents Prêts:** Milo (100%), Sora (80%), Luna (40%), Marcus (60%)

---

**Créé par:** Claude Code - The Hive OS V4
**Date:** 2026-02-10
