# 🔮 LUNA (Strategist) - MCP Servers Documentation

**Agent:** LUNA - The Strategist
**Role:** SEO Strategy, Keyword Research, Content Strategy, Competitor Analysis
**Version:** 1.0.0
**Created:** 2026-02-10

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [MCP Servers](#mcp-servers)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [API Functions](#api-functions)
6. [Usage Examples](#usage-examples)
7. [Credentials Required](#credentials-required)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

LUNA is THE HIVE OS V4's **Strategist Agent**, responsible for:

- **SEO Strategy** - Technical and semantic audits
- **Keyword Research** - Finding opportunities and content ideas
- **Content Strategy** - What to create and why
- **Competitor Analysis** - Understanding the competitive landscape
- **Positioning** - Defining unique value propositions

To accomplish these tasks, LUNA has access to **2 MCP Servers**:

1. **SEO Audit Tool** - Technical & semantic SEO auditing
2. **Keyword Research Tool** - Keyword discovery & analysis

---

## 🛠️ MCP Servers

### 1. SEO Audit Tool (`seo-audit-tool.js`)

**Purpose:** Comprehensive SEO auditing for websites

**Capabilities:**
- Technical SEO audit (speed, mobile, HTTPS, indexability)
- Semantic content analysis (keywords, headings, meta tags)
- Competitor website analysis
- Site health checks (broken links, 404s, redirects)
- Google PageSpeed Insights integration
- Schema markup validation
- Google Search Console crawl errors

**APIs Used:**
- Google PageSpeed Insights API v5
- Google Search Console API v1
- Custom crawling logic (Cheerio + Axios)

**Total Functions:** 7

---

### 2. Keyword Research Tool (`keyword-research-tool.js`)

**Purpose:** Keyword discovery and content strategy

**Capabilities:**
- Keyword suggestions from seed keywords
- Search volume data (Google Keyword Planner)
- Keyword difficulty analysis
- SERP (Search Engine Results Page) analysis
- Related questions ("People Also Ask")
- Trending keywords discovery (Google Trends)
- Keyword gap analysis (vs competitors)

**APIs Used:**
- Google Keyword Planner API (via Google Ads API)
- Google Trends API
- Custom SERP scraping

**Total Functions:** 7

---

## 📦 Installation

### Prerequisites

```bash
# Node.js 18+ required
node --version

# Install MCP SDK
npm install @modelcontextprotocol/sdk
```

### Setup

```bash
# Navigate to LUNA's MCP servers directory
cd /agents/CURRENT_strategist-mcp/mcp_servers/

# Make scripts executable
chmod +x seo-audit-tool.js
chmod +x keyword-research-tool.js

# Test the servers
node seo-audit-tool.js
node keyword-research-tool.js
```

---

## ⚙️ Configuration

### n8n Integration

Add these MCP servers to your n8n workflow:

**1. Import LUNA Workflow:**
```
/agents/CURRENT_strategist-mcp/strategist-core.workflow.json
```

**2. Configure MCP Server Nodes:**

In each **"Tool: [Function Name]"** node, set:

```javascript
// Example: Tool: Technical SEO Audit
{
  "tool_name": "technical_seo_audit",
  "mcp_server_path": "/path/to/seo-audit-tool.js",
  "arguments": {
    "url": "{{ $json.url }}",
    "include_pagespeed": true
  }
}
```

**3. Environment Variables:**

Set these in n8n (Settings > Variables):

```bash
GOOGLE_API_KEY=AIzaSy...           # For PageSpeed Insights
GOOGLE_DEVELOPER_TOKEN=...         # For Keyword Planner (optional)
```

---

## 📖 API Functions

### SEO Audit Tool (7 Functions)

#### 1. `technical_seo_audit`

**Description:** Perform comprehensive technical SEO audit

**Parameters:**
```json
{
  "url": "https://example.com",
  "include_pagespeed": true
}
```

**Returns:**
- HTTPS status
- Mobile-friendliness
- Indexability (robots.txt, sitemap)
- Site speed (PageSpeed)
- Canonical tags
- Structured data
- Overall score

---

#### 2. `semantic_audit`

**Description:** Analyze on-page SEO and content quality

**Parameters:**
```json
{
  "url": "https://example.com/page",
  "target_keywords": ["keyword1", "keyword2"]
}
```

**Returns:**
- Meta tags analysis (title, description)
- Headings structure (H1, H2, H3)
- Keyword density
- Content quality metrics
- Internal/external links
- Image alt text coverage

---

#### 3. `competitor_analysis`

**Description:** Analyze competitor websites and strategies

**Parameters:**
```json
{
  "your_domain": "example.com",
  "competitor_domains": ["competitor1.com", "competitor2.com"]
}
```

**Returns:**
- Estimated traffic
- Domain authority
- Backlinks count
- Top keywords they rank for
- Content strategy insights
- Keyword gap opportunities

---

#### 4. `site_health_check`

**Description:** Crawl website to find issues

**Parameters:**
```json
{
  "url": "https://example.com",
  "max_pages": 50
}
```

**Returns:**
- Broken links (404s)
- Redirect chains
- 5xx server errors
- Slow loading pages
- Sitemap coverage
- robots.txt validation

---

#### 5. `pagespeed_insights`

**Description:** Get Google PageSpeed scores

**Parameters:**
```json
{
  "url": "https://example.com",
  "strategy": "both"
}
```

**Returns:**
- Performance score (mobile + desktop)
- Accessibility score
- Best practices score
- SEO score
- Core Web Vitals (FCP, LCP, TBT, CLS)
- Optimization opportunities

---

#### 6. `schema_markup_check`

**Description:** Verify structured data

**Parameters:**
```json
{
  "url": "https://example.com"
}
```

**Returns:**
- JSON-LD schemas found
- Microdata/RDFa detection
- Schema types (Organization, WebPage, etc.)
- Validation errors
- Recommendations

---

#### 7. `gsc_crawl_errors`

**Description:** Get Google Search Console errors

**Parameters:**
```json
{
  "site_url": "https://example.com",
  "error_type": "all"
}
```

**Returns:**
- Server errors (5xx)
- Not found errors (404)
- Soft 404s
- Coverage stats
- Index status
- Recommendations

---

### Keyword Research Tool (7 Functions)

#### 1. `keyword_suggestions`

**Description:** Get keyword ideas from seed keyword

**Parameters:**
```json
{
  "seed_keyword": "digital marketing",
  "language": "fr",
  "country": "FR",
  "limit": 50
}
```

**Returns:**
- Related keywords
- Search volume
- Competition level
- CPC data
- Trend (rising/stable)
- Long-tail variations

---

#### 2. `search_volume`

**Description:** Get search volume and CPC data

**Parameters:**
```json
{
  "keywords": ["keyword1", "keyword2"],
  "location": "France"
}
```

**Returns:**
- Avg monthly searches
- Competition level (LOW/MEDIUM/HIGH)
- Bid range (low/high)
- Monthly trend (last 5 months)

---

#### 3. `keyword_difficulty`

**Description:** Analyze ranking difficulty

**Parameters:**
```json
{
  "keyword": "seo optimization"
}
```

**Returns:**
- Difficulty score (0-100)
- Difficulty level (easy/medium/hard)
- SERP features present
- Avg domain authority
- Avg backlinks required
- Recommendations

---

#### 4. `serp_analysis`

**Description:** Analyze search results page

**Parameters:**
```json
{
  "keyword": "best seo tools",
  "country": "FR",
  "top_n": 10
}
```

**Returns:**
- Top 10 ranking pages
- Domain/page authority
- Backlinks count
- Content type
- Word count
- SERP features (featured snippet, PAA, etc.)

---

#### 5. `related_questions`

**Description:** Get "People Also Ask" questions

**Parameters:**
```json
{
  "keyword": "content marketing",
  "language": "fr"
}
```

**Returns:**
- People Also Ask questions
- Related searches
- Search intent breakdown
- Content ideas based on questions

---

#### 6. `trending_keywords`

**Description:** Discover trending keywords (Google Trends)

**Parameters:**
```json
{
  "topic": "e-commerce",
  "region": "FR",
  "timeframe": "past_30_days"
}
```

**Returns:**
- Trending keywords with growth %
- Rising topics
- Seasonal trends
- Category (hot/rising/evergreen)

---

#### 7. `gap_analysis`

**Description:** Find keyword opportunities vs competitors

**Parameters:**
```json
{
  "your_domain": "example.com",
  "competitor_domains": ["competitor1.com", "competitor2.com"],
  "min_search_volume": 100
}
```

**Returns:**
- Keywords competitors rank for (but you don't)
- Priority level (high/medium/low)
- Estimated traffic potential
- Difficulty assessment
- Action plan (quick wins, medium-term, long-term)

---

## 💡 Usage Examples

### Example 1: Full SEO Audit Flow

```javascript
// Step 1: Technical Audit
const technicalAudit = await luna.technical_seo_audit({
  url: "https://example.com",
  include_pagespeed: true
});

// Step 2: Semantic Audit (Homepage)
const semanticAudit = await luna.semantic_audit({
  url: "https://example.com",
  target_keywords: ["marketing automation", "email marketing"]
});

// Step 3: Competitor Analysis
const competitorAnalysis = await luna.competitor_analysis({
  your_domain: "example.com",
  competitor_domains: ["competitor1.com", "competitor2.com"]
});

// Step 4: Site Health Check
const healthCheck = await luna.site_health_check({
  url: "https://example.com",
  max_pages: 50
});
```

---

### Example 2: Keyword Research Strategy

```javascript
// Step 1: Get keyword suggestions
const suggestions = await luna.keyword_suggestions({
  seed_keyword: "marketing automation",
  language: "fr",
  country: "FR",
  limit: 50
});

// Step 2: Analyze difficulty
const difficulty = await luna.keyword_difficulty({
  keyword: "marketing automation"
});

// Step 3: Get search volume
const volume = await luna.search_volume({
  keywords: suggestions.suggestions.map(s => s.keyword).slice(0, 10),
  location: "France"
});

// Step 4: Gap analysis
const gaps = await luna.gap_analysis({
  your_domain: "example.com",
  competitor_domains: ["competitor1.com"],
  min_search_volume: 500
});

// Step 5: Get content ideas
const questions = await luna.related_questions({
  keyword: "marketing automation",
  language: "fr"
});
```

---

## 🔑 Credentials Required

### Required (Minimum Setup)

| Credential | Where to Get | Used By |
|-----------|-------------|---------|
| `GOOGLE_API_KEY` | [Google Cloud Console](https://console.cloud.google.com/) | PageSpeed Insights |

### Optional (Enhanced Features)

| Credential | Where to Get | Used By |
|-----------|-------------|---------|
| `GOOGLE_DEVELOPER_TOKEN` | [Google Ads API Center](https://ads.google.com/) | Keyword Planner (search volume) |
| Google Search Console OAuth2 | n8n Credentials | GSC crawl errors |

### How to Configure

See the detailed guides:

- **Quick Setup (5 min):** `/QUICKSTART_5MIN.md`
- **Complete Guide:** `/GUIDE_COMPLET_CONFIGURATION_CREDENTIALS.md`
- **Template:** `/.env.example`

---

## 🐛 Troubleshooting

### Issue: "GOOGLE_API_KEY missing"

**Solution:**
1. Add `GOOGLE_API_KEY` in n8n (Settings > Variables)
2. Restart n8n
3. Re-test

---

### Issue: "403 Forbidden (PageSpeed API)"

**Solution:**
1. Enable PageSpeed Insights API in Google Cloud Console
2. Go to: https://console.cloud.google.com/apis/library
3. Search "PageSpeed Insights API"
4. Click "Enable"
5. Wait 1-2 minutes

---

### Issue: "Keyword Planner returns no data"

**Solution:**
1. Verify you have a Google Ads account with active campaigns
2. Get Developer Token: https://ads.google.com/ > Tools > API Center
3. Add `GOOGLE_DEVELOPER_TOKEN` to n8n variables
4. Restart n8n

---

### Issue: "MCP Server not responding"

**Solution:**
```bash
# Check if server starts correctly
node seo-audit-tool.js

# Check permissions
chmod +x seo-audit-tool.js

# Check Node.js version (18+ required)
node --version
```

---

## 📊 Function Summary

| MCP Server | Total Functions | Category |
|-----------|----------------|----------|
| SEO Audit Tool | 7 | Technical & Semantic SEO |
| Keyword Research Tool | 7 | Keyword Discovery & Strategy |
| **TOTAL** | **14** | **SEO Strategy** |

---

## 🚀 Next Steps

1. **Configure Credentials** - Follow `QUICKSTART_5MIN.md`
2. **Import Workflow** - Load `strategist-core.workflow.json` in n8n
3. **Test Functions** - Run a test audit on your website
4. **Integrate with PM** - Let PM Agent generate SEO tasks automatically

---

## 📚 Related Documentation

- **MILO (Creative):** `/agents/CURRENT_milo-creative/milo-creative-v4-with-toolcode.workflow.json`
- **SORA (Analyst):** `/agents/CURRENT_analyst-mcp/mcp_servers/README.md`
- **MARCUS (Trader):** `/agents/CURRENT_trader-mcp/` (Coming Soon)
- **Main Manifesto:** `/THE_HIVE_OS_V4_MANIFESTO.md`

---

**Created by:** Azzeddine Zazai
**Date:** 2026-02-10
**Version:** 1.0.0
**Agent:** LUNA (Strategist)
**Status:** ✅ Ready for Production
