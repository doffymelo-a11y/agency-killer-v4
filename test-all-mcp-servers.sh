#!/bin/bash

# Test all MCP servers via Bridge
# Bridge must be running on http://localhost:3456

API_BASE="http://localhost:3456/api"

echo "================================================================"
echo "MCP SERVER COMPREHENSIVE TEST SUITE"
echo "================================================================"
echo ""

total_tests=0
passed_tests=0
failed_tests=0

# Helper function to test an endpoint
test_endpoint() {
  local server=$1
  local tool=$2
  local payload=$3
  local description=$4

  total_tests=$((total_tests + 1))
  echo -n "Testing ${server}/${tool}: ${description}... "

  response=$(curl -s -X POST "${API_BASE}/${server}/call" \
    -H "Content-Type: application/json" \
    -d "$payload" 2>&1)

  if echo "$response" | grep -q '"success":true\|"type":"text"'; then
    echo "✅ PASS"
    passed_tests=$((passed_tests + 1))
  else
    echo "❌ FAIL"
    echo "Response: $response"
    failed_tests=$((failed_tests + 1))
  fi
}

echo "================================================================"
echo "SORA AGENT - DATA RETRIEVAL SERVERS"
echo "================================================================"
echo ""

# Google Ads Server
echo "--- Google Ads Server ---"
test_endpoint "google-ads" "google_ads_get_accounts" \
  '{"tool":"google_ads_get_accounts","arguments":{}}' \
  "Get accessible accounts"

test_endpoint "google-ads" "google_ads_get_campaigns" \
  '{"tool":"google_ads_get_campaigns","arguments":{"customer_id":"'${GOOGLE_ADS_CUSTOMER_ID}'","date_range":"LAST_30_DAYS"}}' \
  "Get campaigns with metrics"

test_endpoint "google-ads" "google_ads_get_search_terms" \
  '{"tool":"google_ads_get_search_terms","arguments":{"customer_id":"'${GOOGLE_ADS_CUSTOMER_ID}'","campaign_id":"12345","date_range":"LAST_7_DAYS"}}' \
  "Get search terms report"

test_endpoint "google-ads" "google_ads_get_performance_report" \
  '{"tool":"google_ads_get_performance_report","arguments":{"customer_id":"'${GOOGLE_ADS_CUSTOMER_ID}'","date_range":"LAST_30_DAYS","level":"CAMPAIGN"}}' \
  "Get performance report"

echo ""

# Meta Ads Server (SKIPPED - user requested to leave aside)
echo "--- Meta Ads Server (SKIPPED - no credentials) ---"
echo ""

# GTM Server
echo "--- Google Tag Manager Server ---"
test_endpoint "gtm" "gtm_list_containers" \
  '{"tool":"gtm_list_containers","arguments":{}}' \
  "List GTM containers"

test_endpoint "gtm" "gtm_list_tags" \
  '{"tool":"gtm_list_tags","arguments":{"container_id":"'${GTM_CONTAINER_ID}'"}}' \
  "List tags in container"

echo ""

# Looker Server
echo "--- Looker Analytics Server ---"
test_endpoint "looker" "looker_create_report" \
  '{"tool":"looker_create_report","arguments":{"title":"Test Report","description":"Testing MCP server"}}' \
  "Create Looker report"

test_endpoint "looker" "looker_get_report_url" \
  '{"tool":"looker_get_report_url","arguments":{"report_id":"test123"}}' \
  "Get report URL"

echo ""

echo "================================================================"
echo "LUNA AGENT - SEO SERVERS"
echo "================================================================"
echo ""

# SEO Audit Server
echo "--- SEO Audit Server ---"
test_endpoint "seo-audit" "technical_seo_audit" \
  '{"tool":"technical_seo_audit","arguments":{"url":"https://example.com"}}' \
  "Technical SEO audit"

test_endpoint "seo-audit" "pagespeed_insights" \
  '{"tool":"pagespeed_insights","arguments":{"url":"https://example.com"}}' \
  "PageSpeed Insights analysis"

test_endpoint "seo-audit" "site_health_check" \
  '{"tool":"site_health_check","arguments":{"url":"https://example.com"}}' \
  "Site health check"

echo ""

# Keyword Research Server
echo "--- Keyword Research Server ---"
test_endpoint "keyword-research" "keyword_suggestions" \
  '{"tool":"keyword_suggestions","arguments":{"seed_keywords":["marketing","automation"]}}' \
  "Get keyword suggestions"

test_endpoint "keyword-research" "keyword_difficulty" \
  '{"tool":"keyword_difficulty","arguments":{"keywords":["digital marketing","seo tools"]}}' \
  "Analyze keyword difficulty"

test_endpoint "keyword-research" "serp_analysis" \
  '{"tool":"serp_analysis","arguments":{"keyword":"digital marketing"}}' \
  "SERP analysis"

echo ""

echo "================================================================"
echo "MARCUS AGENT - BUDGET & CAMPAIGN SERVERS"
echo "================================================================"
echo ""

# Budget Optimizer Server
echo "--- Budget Optimizer Server ---"
test_endpoint "budget-optimizer" "analyze_campaign_performance" \
  '{"tool":"analyze_campaign_performance","arguments":{"customer_id":"'${GOOGLE_ADS_CUSTOMER_ID}'","campaign_ids":["12345"],"date_range":"LAST_30_DAYS"}}' \
  "Analyze campaign performance"

test_endpoint "budget-optimizer" "learning_phase_protection" \
  '{"tool":"learning_phase_protection","arguments":{"customer_id":"'${GOOGLE_ADS_CUSTOMER_ID}'","campaign_id":"12345"}}' \
  "Check learning phase protection"

test_endpoint "budget-optimizer" "calculate_optimal_budget" \
  '{"tool":"calculate_optimal_budget","arguments":{"customer_id":"'${GOOGLE_ADS_CUSTOMER_ID}'","campaign_id":"12345","target_metric":"CONVERSIONS","target_value":50}}' \
  "Calculate optimal budget"

test_endpoint "budget-optimizer" "get_budget_recommendations" \
  '{"tool":"get_budget_recommendations","arguments":{"customer_id":"'${GOOGLE_ADS_CUSTOMER_ID}'","date_range":"LAST_30_DAYS"}}' \
  "Get budget recommendations"

echo ""

# Google Ads Launcher Server
echo "--- Google Ads Launcher Server ---"
test_endpoint "google-ads-launcher" "validate_campaign_config" \
  '{"tool":"validate_campaign_config","arguments":{"customer_id":"'${GOOGLE_ADS_CUSTOMER_ID}'","name":"Test Campaign","daily_budget_micros":50000000,"bidding_strategy":"TARGET_CPA"}}' \
  "Validate campaign configuration"

echo ""

echo "================================================================"
echo "MILO AGENT - CREATIVE GENERATION SERVERS"
echo "================================================================"
echo ""

echo "--- Nano Banana Pro Server (Image Generation) ---"
echo "⏭️  SKIPPED - Requires visual output validation"
echo ""

echo "--- VEO3 Server (Video Generation) ---"
echo "⏭️  SKIPPED - Requires visual output validation"
echo ""

echo "--- ElevenLabs Server (Audio Generation) ---"
echo "⏭️  SKIPPED - Requires audio output validation"
echo ""

echo "================================================================"
echo "TEST SUMMARY"
echo "================================================================"
pass_rate=$(awk "BEGIN {printf \"%.1f\", ($passed_tests/$total_tests)*100}")
echo "Total tests: $total_tests"
echo "Passed: $passed_tests (${pass_rate}%)"
echo "Failed: $failed_tests"
echo ""

if [ $failed_tests -eq 0 ]; then
  echo "✅ ALL TESTS PASSED"
else
  echo "⚠️  SOME TESTS FAILED - Review output above"
fi
echo "================================================================"
