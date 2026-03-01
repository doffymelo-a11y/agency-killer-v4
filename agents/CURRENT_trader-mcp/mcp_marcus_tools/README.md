# 💰 MARCUS (Trader) - MCP Servers Documentation

**Agent:** MARCUS - The Trader
**Role:** Paid Ads Launch, Budget Management, Campaign Optimization, Scaling Decisions
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

MARCUS is THE HIVE OS V4's **Trader Agent**, responsible for:

- **Campaign Launch** - Creating and launching Meta Ads & Google Ads campaigns
- **Budget Management** - Optimizing budget allocation across campaigns
- **Scaling Decisions** - Scaling winners, cutting losers
- **Performance Optimization** - ROAS/CPA optimization
- **Learning Phase Protection** - Avoiding budget changes that reset Learning Phase

To accomplish these tasks, MARCUS has access to **3 MCP Servers** (WRITE mode) + **SORA's 4 MCP Servers** (READ mode):

### MARCUS's MCP Servers (WRITE):

1. **Meta Campaign Launcher** - Create & launch Meta Ads campaigns
2. **Google Ads Launcher** - Create & launch Google Ads campaigns
3. **Budget Optimizer** - Intelligent budget optimization

### SORA's MCP Servers (READ - shared with MARCUS):

1. **Google Ads Manager** (READ-ONLY) - Analysis & reporting
2. **Meta Ads Manager** (READ-ONLY) - Analysis & Learning Phase monitoring
3. **GTM Manager** (READ-ONLY) - Conversion tracking setup
4. **Looker Manager** (READ-ONLY) - Dashboard creation

---

## 🛠️ MCP Servers

### 1. Meta Campaign Launcher (`meta-campaign-launcher.js`)

**Purpose:** Launch and manage Meta Ads campaigns

**Capabilities:**
- Create campaigns (Sales, Leads, Engagement, Traffic, Awareness)
- Create ad sets with detailed targeting
- Create ads (image, video, carousel)
- Update campaign/ad set status (ACTIVE, PAUSED, ARCHIVED)
- Update budgets
- Scale winning ad sets intelligently
- Kill underperforming ads

**APIs Used:**
- Meta Marketing API v19.0

**Total Functions:** 7

---

### 2. Google Ads Launcher (`google-ads-launcher.js`)

**Purpose:** Launch and manage Google Ads campaigns

**Capabilities:**
- Create Search campaigns (TARGET_CPA, TARGET_ROAS, MAX_CONVERSIONS, MANUAL_CPC)
- Create ad groups
- Add keywords (EXACT, PHRASE, BROAD)
- Create Responsive Search Ads (RSAs)
- Add negative keywords
- Update campaign budgets
- Update campaign status (ENABLED, PAUSED, REMOVED)

**APIs Used:**
- Google Ads API v15

**Total Functions:** 7

---

### 3. Budget Optimizer (`budget-optimizer.js`)

**Purpose:** Intelligent budget optimization across platforms

**Capabilities:**
- Analyze campaign performance (scoring & grading)
- Recommend budget reallocation
- Identify winners and losers
- Calculate optimal budget distribution
- Learning Phase protection checks
- Multi-platform budget balancing (Meta, Google Ads, TikTok, LinkedIn)
- Confidence interval checks (statistical significance)

**Algorithms:**
- Performance scoring (ROAS, CPA, CTR, Quality Score)
- Budget allocation based on ROI
- Learning Phase detection and protection
- Statistical confidence intervals

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
# Navigate to MARCUS's MCP servers directory
cd /agents/CURRENT_trader-mcp/mcp_servers/

# Make scripts executable
chmod +x meta-campaign-launcher.js
chmod +x google-ads-launcher.js
chmod +x budget-optimizer.js

# Test the servers
node meta-campaign-launcher.js
node google-ads-launcher.js
node budget-optimizer.js
```

---

## ⚙️ Configuration

### n8n Integration

Add these MCP servers to your n8n workflow:

**1. Import MARCUS Workflow:**
```
/agents/CURRENT_trader-mcp/trader-core.workflow.json
```

**2. Configure MCP Server Nodes:**

In each **"Tool: [Function Name]"** node, set:

```javascript
// Example: Tool: Create Meta Campaign
{
  "tool_name": "create_campaign",
  "mcp_server_path": "/path/to/meta-campaign-launcher.js",
  "arguments": {
    "ad_account_id": "act_{{ $json.ad_account_id }}",
    "name": "{{ $json.campaign_name }}",
    "objective": "OUTCOME_SALES",
    "daily_budget": 5000000 // 50€ in cents
  }
}
```

**3. Environment Variables:**

Set these in n8n (Settings > Variables):

```bash
META_ACCESS_TOKEN=EAAxxxxx           # For Meta Ads API
GOOGLE_DEVELOPER_TOKEN=xxxxx         # For Google Ads API
```

**4. Shared Access to SORA's MCP Servers:**

MARCUS can read data from SORA's MCP servers:
- `/agents/CURRENT_analyst-mcp/mcp_servers/google-ads-manager.js` (READ)
- `/agents/CURRENT_analyst-mcp/mcp_servers/meta-ads-manager.js` (READ)

---

## 📖 API Functions

### Meta Campaign Launcher (7 Functions)

#### 1. `create_campaign`

**Description:** Create a new Meta Ads campaign

**Parameters:**
```json
{
  "ad_account_id": "act_123456789",
  "name": "Summer Sale 2026",
  "objective": "OUTCOME_SALES",
  "special_ad_categories": [],
  "status": "PAUSED",
  "daily_budget": 10000000,
  "bid_strategy": "LOWEST_COST_WITHOUT_CAP"
}
```

**Returns:**
- Campaign ID
- Configuration details
- Next steps

---

#### 2. `create_ad_set`

**Description:** Create an ad set with targeting

**Parameters:**
```json
{
  "campaign_id": "camp_123",
  "name": "France - 25-45 - Interests: Shopping",
  "optimization_goal": "OFFSITE_CONVERSIONS",
  "billing_event": "IMPRESSIONS",
  "daily_budget": 5000000,
  "targeting": {
    "geo_locations": {
      "countries": ["FR"]
    },
    "age_min": 25,
    "age_max": 45,
    "genders": [0],
    "interests": [{"id": "6003139266461"}]
  },
  "status": "PAUSED"
}
```

**Returns:**
- Ad set ID
- Targeting details
- Learning Phase status

---

#### 3. `create_ad`

**Description:** Create an ad with creative

**Parameters:**
```json
{
  "ad_set_id": "adset_123",
  "name": "Image Ad - Summer Sale",
  "creative": {
    "name": "Creative 1",
    "object_story_spec": {
      "page_id": "123456789",
      "link_data": {
        "image_hash": "abc123",
        "link": "https://example.com",
        "message": "Save 50% this summer!",
        "name": "Summer Sale",
        "description": "Shop now",
        "call_to_action": {
          "type": "SHOP_NOW"
        }
      }
    }
  },
  "status": "PAUSED"
}
```

**Returns:**
- Ad ID
- Preview URL
- Next steps

---

#### 4. `update_campaign_status`

**Description:** Activate, pause, or archive a campaign

**Parameters:**
```json
{
  "campaign_id": "camp_123",
  "status": "ACTIVE"
}
```

---

#### 5. `update_ad_set_budget`

**Description:** Update ad set daily budget

**Parameters:**
```json
{
  "ad_set_id": "adset_123",
  "daily_budget": 8000000,
  "bid_amount": 250000
}
```

---

#### 6. `scale_ad_set`

**Description:** Increase budget on winning ad set (with Learning Phase protection)

**Parameters:**
```json
{
  "ad_set_id": "adset_123",
  "scale_percentage": 20,
  "max_budget": 20000000
}
```

**Returns:**
- Old vs new budget
- Learning Phase risk assessment
- Recommendations

---

#### 7. `kill_underperforming_ad`

**Description:** Pause an underperforming ad or ad set

**Parameters:**
```json
{
  "object_id": "ad_123",
  "object_type": "ad",
  "reason": "High CPA, low ROAS"
}
```

---

### Google Ads Launcher (7 Functions)

#### 1. `create_search_campaign`

**Description:** Create a Google Search campaign

**Parameters:**
```json
{
  "customer_id": "1234567890",
  "name": "Brand Search - FR",
  "daily_budget_micros": 50000000,
  "bidding_strategy": "TARGET_ROAS",
  "target_roas": 4.0,
  "geo_target_constants": ["1006"],
  "language_constants": ["1002"],
  "status": "PAUSED"
}
```

---

#### 2. `create_ad_group`

**Description:** Create an ad group

**Parameters:**
```json
{
  "customer_id": "1234567890",
  "campaign_id": "customers/1234567890/campaigns/123",
  "name": "Brand Keywords",
  "cpc_bid_micros": 1000000,
  "status": "ENABLED"
}
```

---

#### 3. `add_keywords`

**Description:** Add keywords to ad group

**Parameters:**
```json
{
  "customer_id": "1234567890",
  "ad_group_id": "customers/1234567890/adGroups/456",
  "keywords": [
    {
      "text": "marketing automation",
      "match_type": "EXACT",
      "cpc_bid_micros": 1500000
    },
    {
      "text": "email marketing tool",
      "match_type": "PHRASE",
      "cpc_bid_micros": 1200000
    }
  ]
}
```

---

#### 4. `create_rsa`

**Description:** Create a Responsive Search Ad

**Parameters:**
```json
{
  "customer_id": "1234567890",
  "ad_group_id": "customers/1234567890/adGroups/456",
  "headlines": [
    "Best Marketing Tool",
    "Automate Your Marketing",
    "Save Time & Money",
    "Free Trial Available"
  ],
  "descriptions": [
    "Start your free 14-day trial today",
    "No credit card required"
  ],
  "final_urls": ["https://example.com"],
  "path1": "marketing",
  "path2": "automation"
}
```

---

#### 5. `add_negative_keywords`

**Description:** Add negative keywords

**Parameters:**
```json
{
  "customer_id": "1234567890",
  "level": "CAMPAIGN",
  "campaign_id": "customers/1234567890/campaigns/123",
  "negative_keywords": [
    {
      "text": "free",
      "match_type": "BROAD"
    },
    {
      "text": "cheap",
      "match_type": "BROAD"
    }
  ]
}
```

---

#### 6. `update_campaign_budget`

**Description:** Update campaign daily budget

**Parameters:**
```json
{
  "customer_id": "1234567890",
  "campaign_id": "customers/1234567890/campaigns/123",
  "daily_budget_micros": 75000000
}
```

---

#### 7. `update_campaign_status`

**Description:** Enable, pause, or remove a campaign

**Parameters:**
```json
{
  "customer_id": "1234567890",
  "campaign_id": "customers/1234567890/campaigns/123",
  "status": "ENABLED"
}
```

---

### Budget Optimizer (7 Functions)

#### 1. `analyze_campaign_performance`

**Description:** Analyze and score campaign performance

**Parameters:**
```json
{
  "campaigns": [
    {
      "id": "camp_1",
      "name": "Campaign A",
      "platform": "meta",
      "spend": 1000,
      "revenue": 4500,
      "conversions": 45,
      "clicks": 1200,
      "impressions": 50000,
      "daily_budget": 50
    }
  ],
  "optimization_goal": "ROAS",
  "target_roas": 4.0
}
```

**Returns:**
- Performance scores (0-100)
- Grades (A, B, C, D)
- Status (WINNING, TESTING, LOSING)
- Summary statistics

---

#### 2. `recommend_budget_reallocation`

**Description:** Calculate optimal budget distribution

**Parameters:**
```json
{
  "campaigns": [
    {
      "id": "camp_1",
      "name": "Campaign A",
      "current_budget": 50,
      "roas": 5.2,
      "cpa": 22,
      "learning_phase": "GRADUATED"
    }
  ],
  "total_budget": 200,
  "min_budget_per_campaign": 10,
  "protect_learning_phase": true
}
```

**Returns:**
- Budget recommendations per campaign
- Action (INCREASE, DECREASE, KEEP)
- Change percentages
- Reasoning

---

#### 3. `identify_winners_losers`

**Description:** Classify campaigns as winners, losers, or testing

**Parameters:**
```json
{
  "items": [
    {
      "id": "camp_1",
      "name": "Campaign A",
      "type": "campaign",
      "roas": 5.5,
      "cpa": 18,
      "spend": 500,
      "conversions": 28,
      "days_active": 7
    }
  ],
  "target_roas": 4.0,
  "target_cpa": 25,
  "min_spend_threshold": 100,
  "min_days_active": 3
}
```

**Returns:**
- Classification (WINNER, TESTING, LOSER)
- Confidence (HIGH, MEDIUM, LOW)
- Action (SCALE, MONITOR, PAUSE)
- Reasoning

---

#### 4. `calculate_optimal_distribution`

**Description:** Calculate mathematically optimal budget distribution

**Parameters:**
```json
{
  "campaigns": [
    {
      "id": "camp_1",
      "name": "Campaign A",
      "performance_score": 85,
      "current_budget": 50,
      "max_budget": 200,
      "min_budget": 10
    }
  ],
  "total_budget": 500,
  "algorithm": "proportional"
}
```

**Algorithms:**
- `proportional` - Budget proportional to performance score
- `winner_takes_all` - Top 3 get 80% of budget
- `balanced` - Balanced distribution with minimum thresholds

---

#### 5. `learning_phase_protection`

**Description:** Check if budget change will impact Learning Phase

**Parameters:**
```json
{
  "campaign_id": "camp_1",
  "current_budget": 50,
  "proposed_budget": 75,
  "learning_phase_status": "ACTIVE",
  "platform": "meta"
}
```

**Returns:**
- Risk level (LOW, MEDIUM, HIGH)
- Will reset Learning Phase (boolean)
- Safe to proceed (boolean)
- Warnings & recommendations

---

#### 6. `multi_platform_balancing`

**Description:** Balance budgets across Meta, Google Ads, TikTok, LinkedIn

**Parameters:**
```json
{
  "platforms": [
    {
      "name": "meta",
      "current_budget": 100,
      "roas": 4.5,
      "min_budget": 50,
      "max_budget": 300
    },
    {
      "name": "google_ads",
      "current_budget": 150,
      "roas": 3.8
    }
  ],
  "total_budget": 500,
  "target_roas": 4.0
}
```

**Returns:**
- Optimal budget per platform
- Budget changes
- Budget shares
- Actions

---

#### 7. `confidence_interval_check`

**Description:** Check if data is statistically significant

**Parameters:**
```json
{
  "campaign_id": "camp_1",
  "conversions": 45,
  "spend": 800,
  "days_active": 5,
  "confidence_level": 0.95
}
```

**Returns:**
- Confidence (HIGH, MEDIUM, LOW)
- Statistical significance (boolean)
- Recommendation (OPTIMIZE, MONITOR, WAIT)
- Required sample size

---

## 💡 Usage Examples

### Example 1: Launch Meta Campaign End-to-End

```javascript
// Step 1: Create campaign
const campaign = await marcus.create_campaign({
  ad_account_id: "act_123456789",
  name: "Summer Sale 2026",
  objective: "OUTCOME_SALES",
  daily_budget: 10000000, // 100€
  status: "PAUSED"
});

// Step 2: Create ad set
const adSet = await marcus.create_ad_set({
  campaign_id: campaign.campaign_id,
  name: "France - 25-45 - Shopping",
  optimization_goal: "OFFSITE_CONVERSIONS",
  billing_event: "IMPRESSIONS",
  daily_budget: 5000000, // 50€
  targeting: {
    geo_locations: { countries: ["FR"] },
    age_min: 25,
    age_max: 45
  },
  status: "PAUSED"
});

// Step 3: Create ad
const ad = await marcus.create_ad({
  ad_set_id: adSet.ad_set_id,
  name: "Summer Sale - Image 1",
  creative: {
    // ... creative config
  },
  status: "PAUSED"
});

// Step 4: Activate campaign
await marcus.update_campaign_status({
  campaign_id: campaign.campaign_id,
  status: "ACTIVE"
});
```

---

### Example 2: Optimize Budgets with Budget Optimizer

```javascript
// Step 1: Analyze performance
const analysis = await marcus.analyze_campaign_performance({
  campaigns: [
    { id: "camp_1", spend: 1000, revenue: 5000, conversions: 50 },
    { id: "camp_2", spend: 800, revenue: 2400, conversions: 30 }
  ],
  optimization_goal: "ROAS",
  target_roas: 4.0
});

// Step 2: Identify winners/losers
const classification = await marcus.identify_winners_losers({
  items: analysis.campaigns,
  target_roas: 4.0,
  min_spend_threshold: 100,
  min_days_active: 3
});

// Step 3: Recommend budget reallocation
const recommendations = await marcus.recommend_budget_reallocation({
  campaigns: analysis.campaigns.map(c => ({
    id: c.id,
    current_budget: 50,
    roas: c.roas,
    learning_phase: "GRADUATED"
  })),
  total_budget: 200,
  protect_learning_phase: true
});

// Step 4: Apply budget changes
for (const rec of recommendations.recommendations) {
  if (rec.action === "INCREASE") {
    await marcus.update_ad_set_budget({
      ad_set_id: rec.campaign_id,
      daily_budget: rec.recommended_budget * 10000 // Convert to cents
    });
  }
}
```

---

### Example 3: Scale Winner with Learning Phase Protection

```javascript
// Step 1: Check Learning Phase protection
const protection = await marcus.learning_phase_protection({
  campaign_id: "adset_123",
  current_budget: 50,
  proposed_budget: 75, // +50%
  learning_phase_status: "ACTIVE",
  platform: "meta"
});

if (!protection.safe_to_proceed) {
  console.log("⚠️ Budget change will reset Learning Phase");
  console.log("Safe increase:", protection.recommendations);

  // Scale safely (+15%)
  await marcus.scale_ad_set({
    ad_set_id: "adset_123",
    scale_percentage: 15,
    max_budget: 20000000
  });
} else {
  // Safe to scale
  await marcus.scale_ad_set({
    ad_set_id: "adset_123",
    scale_percentage: 50,
    max_budget: 20000000
  });
}
```

---

## 🔑 Credentials Required

### Required (Minimum Setup)

| Credential | Where to Get | Used By |
|-----------|-------------|---------|
| `META_ACCESS_TOKEN` | [Meta Business Manager](https://business.facebook.com/) | Meta Campaign Launcher |
| `GOOGLE_DEVELOPER_TOKEN` | [Google Ads API Center](https://ads.google.com/) | Google Ads Launcher |

### OAuth2 Credentials (n8n)

Configure these in n8n Credentials:

1. **Meta OAuth2** - For Meta Ads API
   - Scopes: `ads_read`, `ads_management`, `business_management`

2. **Google Ads OAuth2** - For Google Ads API
   - Scopes: `https://www.googleapis.com/auth/adwords`

### How to Configure

See the comprehensive credentials guide:

- **All Agents Setup:** `/CREDENTIALS_SETUP_ALL_AGENTS.md` (to be created)
- **Quick Setup (5 min):** `/QUICKSTART_5MIN.md`
- **Complete Guide:** `/GUIDE_COMPLET_CONFIGURATION_CREDENTIALS.md`

---

## 🐛 Troubleshooting

### Issue: "META_ACCESS_TOKEN invalid"

**Solution:**
1. Verify token in Meta Business Manager
2. Check token expiration (tokens expire after 60 days)
3. Regenerate token if needed
4. Update token in n8n

---

### Issue: "Campaign creation failed - Learning Limited"

**Solution:**
1. Increase daily budget (minimum 50€/day recommended)
2. Ensure pixel is tracking conversions
3. Wait for 50 conversions to exit Learning Phase
4. Use Budget Optimizer's `learning_phase_protection` tool

---

### Issue: "Google Ads API quota exceeded"

**Solution:**
1. Google Ads API has rate limits
2. Implement request throttling
3. Use batch operations when possible
4. Monitor quota: https://ads.google.com/aw/apicenter

---

## 📊 Function Summary

| MCP Server | Total Functions | Category |
|-----------|----------------|----------|
| Meta Campaign Launcher | 7 | Campaign Launch & Management |
| Google Ads Launcher | 7 | Campaign Launch & Management |
| Budget Optimizer | 7 | Budget Optimization & Analysis |
| **TOTAL (MARCUS)** | **21** | **Campaign Trading** |

**+ SORA's 4 MCP Servers (READ-ONLY):** 28 additional functions for analysis

**Grand Total:** 49 functions accessible by MARCUS

---

## 🚀 Next Steps

1. **Configure Credentials** - Follow `/CREDENTIALS_SETUP_ALL_AGENTS.md`
2. **Import Workflow** - Load `trader-core.workflow.json` in n8n
3. **Test Launch** - Create a test campaign (PAUSED status)
4. **Integrate with PM** - Let PM Agent generate trading tasks automatically

---

## 📚 Related Documentation

- **SORA (Analyst):** `/agents/CURRENT_analyst-mcp/mcp_servers/README.md` (READ data)
- **MILO (Creative):** `/agents/CURRENT_milo-creative/milo-creative-v4-with-toolcode.workflow.json`
- **LUNA (Strategist):** `/agents/CURRENT_strategist-mcp/mcp_servers/README.md`
- **Main Manifesto:** `/THE_HIVE_OS_V4_MANIFESTO.md`

---

**Created by:** Azzeddine Zazai
**Date:** 2026-02-10
**Version:** 1.0.0
**Agent:** MARCUS (Trader)
**Status:** ✅ Ready for Production
