#!/bin/bash

# ============================================================================
# TEST SCRIPT: MARCUS MCP SERVERS WITH BRIDGE
# ============================================================================
# Tests MARCUS's 3 MCP servers (21 tools) via HTTP Bridge
#
# ⚠️ WARNING: MARCUS TOOLS CAN SPEND REAL MONEY
# Only use test accounts or PAUSED status
#
# Usage:
#   chmod +x test-marcus-servers.sh
#   ./test-marcus-servers.sh
#
# Prerequisites:
#   - MCP Bridge running on http://localhost:3456
#   - Test Google Ads account configured
#   - Test Meta Ads account configured
# ============================================================================

# set -e temporarily disabled for testing

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Bridge URL
BRIDGE_URL="http://localhost:3456"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Log file
LOG_FILE="/Users/azzedinezazai/Documents/Agency-Killer-V4/mcp-servers/test-marcus-results-$(date +%Y%m%d-%H%M%S).log"

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

log() {
    echo -e "${BLUE}[$(date +%H:%M:%S)]${NC} $1"
    echo "[$(date +%H:%M:%S)] $1" >> "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
    echo "✅ $1" >> "$LOG_FILE"
    ((PASSED_TESTS++))
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    echo "❌ $1" >> "$LOG_FILE"
    ((FAILED_TESTS++))
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    echo "⚠️  $1" >> "$LOG_FILE"
}

log_danger() {
    echo -e "${RED}🚨 DANGER: $1${NC}"
    echo "🚨 DANGER: $1" >> "$LOG_FILE"
}

test_endpoint() {
    local TEST_NAME="$1"
    local URL="$2"
    local METHOD="${3:-GET}"
    local DATA="$4"

    ((TOTAL_TESTS++))
    log "Testing: $TEST_NAME"

    if [ "$METHOD" = "POST" ] && [ -n "$DATA" ]; then
        RESPONSE=$(curl -s -X POST "$URL" \
            -H "Content-Type: application/json" \
            -d "$DATA" 2>&1)
    else
        RESPONSE=$(curl -s "$URL" 2>&1)
    fi

    # Check if response contains error
    if echo "$RESPONSE" | grep -qi "error\|failed\|exception"; then
        log_error "$TEST_NAME - Error in response"
        echo "$RESPONSE" >> "$LOG_FILE"
        return 1
    fi

    # Check if response contains success indicators
    if echo "$RESPONSE" | grep -qi "success.*true\|\"tools\":\|\"servers\":\|\"performance_scores\":\|\"risk_level\":"; then
        log_success "$TEST_NAME"
        echo "$RESPONSE" | jq '.' >> "$LOG_FILE" 2>/dev/null || echo "$RESPONSE" >> "$LOG_FILE"
        return 0
    else
        log_warning "$TEST_NAME - Unexpected response format"
        echo "$RESPONSE" >> "$LOG_FILE"
        return 1
    fi
}

# ============================================================================
# MAIN TEST SUITE
# ============================================================================

echo ""
echo "════════════════════════════════════════════════════════════════════"
echo "  MARCUS MCP SERVERS - COMPREHENSIVE TEST SUITE"
echo "  ⚠️  WARNING: THESE TOOLS CAN SPEND REAL MONEY"
echo "════════════════════════════════════════════════════════════════════"
echo ""
log_danger "MARCUS tools can spend real ad budgets - use test accounts only"
log "Starting MARCUS MCP servers tests"
log "Bridge URL: $BRIDGE_URL"
log "Log file: $LOG_FILE"
echo ""

# ----------------------------------------------------------------------------
# PRE-FLIGHT CHECKS
# ----------------------------------------------------------------------------

log "Running pre-flight checks..."

# Check if bridge is running
if ! curl -s "$BRIDGE_URL/health" > /dev/null 2>&1; then
    log_error "Bridge is not running at $BRIDGE_URL"
    log_error "Please start the bridge with: cd /Users/azzedinezazai/Documents/Agency-Killer-V4/mcp-bridge && npm run dev"
    exit 1
fi
log_success "Bridge is running"

# Check if jq is installed (for JSON parsing)
if ! command -v jq &> /dev/null; then
    log_warning "jq not installed - JSON output will not be formatted"
    log_warning "Install with: brew install jq"
fi

echo ""
log "Pre-flight checks complete. Starting tests..."
echo ""

# ============================================================================
# TEST 1: BUDGET OPTIMIZER (7 TOOLS - SAFE READ-ONLY)
# ============================================================================

echo "════════════════════════════════════════════════════════════════════"
echo "  TEST 1: BUDGET OPTIMIZER (SAFE - READ-ONLY ANALYSIS)"
echo "════════════════════════════════════════════════════════════════════"
echo ""

# Test 1.1: List tools
test_endpoint \
    "Budget Optimizer - List Tools" \
    "$BRIDGE_URL/api/budget-optimizer/tools"

# Test 1.2: Analyze Campaign Performance (READ-ONLY - SAFE)
test_endpoint \
    "Budget Optimizer - Analyze Performance" \
    "$BRIDGE_URL/api/budget-optimizer/call" \
    "POST" \
    '{"tool":"analyze_campaign_performance","arguments":{"campaigns":[{"id":"c1","spend":1000,"revenue":5000,"conversions":50,"clicks":1200,"impressions":50000,"daily_budget":50}],"optimization_goal":"ROAS","target_roas":4.0}}'

# Test 1.3: Learning Phase Protection (READ-ONLY - SAFE)
test_endpoint \
    "Budget Optimizer - Learning Phase Protection" \
    "$BRIDGE_URL/api/budget-optimizer/call" \
    "POST" \
    '{"tool":"learning_phase_protection","arguments":{"campaign_id":"camp_1","current_budget":50,"proposed_budget":75,"learning_phase_status":"ACTIVE","platform":"meta"}}'

# Test 1.4: Calculate Optimal Budget (READ-ONLY - SAFE)
test_endpoint \
    "Budget Optimizer - Calculate Optimal Budget" \
    "$BRIDGE_URL/api/budget-optimizer/call" \
    "POST" \
    '{"tool":"calculate_optimal_budget","arguments":{"total_budget":10000,"campaigns":[{"id":"c1","spend":1000,"revenue":5000,"conversions":50}],"optimization_goal":"ROAS"}}'

echo ""

# ============================================================================
# TEST 2: META CAMPAIGN LAUNCHER (7 TOOLS - DANGER ⚠️)
# ============================================================================

echo "════════════════════════════════════════════════════════════════════"
echo "  TEST 2: META CAMPAIGN LAUNCHER"
echo "  🚨 WARNING: WRITE OPERATIONS - USING PAUSED STATUS ONLY"
echo "════════════════════════════════════════════════════════════════════"
echo ""

log_danger "Meta Campaign Launcher - WRITE operations disabled in test"
log_warning "To test campaign creation, use a test ad account and status: PAUSED"

# Test 2.1: List tools
test_endpoint \
    "Meta Campaign Launcher - List Tools" \
    "$BRIDGE_URL/api/meta-campaign-launcher/tools"

# Test 2.2: Validate Campaign Config (READ-ONLY - SAFE)
test_endpoint \
    "Meta Campaign Launcher - Validate Config" \
    "$BRIDGE_URL/api/meta-campaign-launcher/call" \
    "POST" \
    '{"tool":"validate_campaign_config","arguments":{"ad_account_id":"act_TEST","objective":"OUTCOME_TRAFFIC","daily_budget":500000,"targeting":{"age_min":25,"age_max":45,"genders":[1,2],"geo_locations":{"countries":["US"]}}}}'

echo ""
log_warning "⚠️  Campaign creation tests SKIPPED - use test account manually if needed"
echo ""

# ============================================================================
# TEST 3: GOOGLE ADS LAUNCHER (7 TOOLS - DANGER ⚠️)
# ============================================================================

echo "════════════════════════════════════════════════════════════════════"
echo "  TEST 3: GOOGLE ADS LAUNCHER"
echo "  🚨 WARNING: WRITE OPERATIONS - USING PAUSED STATUS ONLY"
echo "════════════════════════════════════════════════════════════════════"
echo ""

log_danger "Google Ads Launcher - WRITE operations disabled in test"
log_warning "To test campaign creation, use a test customer ID and status: PAUSED"

# Test 3.1: List tools
test_endpoint \
    "Google Ads Launcher - List Tools" \
    "$BRIDGE_URL/api/google-ads-launcher/tools"

# Test 3.2: Validate Search Campaign Config (READ-ONLY - SAFE)
test_endpoint \
    "Google Ads Launcher - Validate Config" \
    "$BRIDGE_URL/api/google-ads-launcher/call" \
    "POST" \
    '{"tool":"validate_search_campaign_config","arguments":{"customer_id":"0000000000","daily_budget_micros":5000000,"bidding_strategy":"TARGET_CPA","target_cpa":25000000,"geo_target_constants":["1006"],"language_constants":["1002"]}}'

echo ""
log_warning "⚠️  Campaign creation tests SKIPPED - use test account manually if needed"
echo ""

# ============================================================================
# FINAL REPORT
# ============================================================================

echo "════════════════════════════════════════════════════════════════════"
echo "  TEST RESULTS SUMMARY"
echo "════════════════════════════════════════════════════════════════════"
echo ""
echo "Total Tests:  $TOTAL_TESTS"
echo -e "${GREEN}Passed:       $PASSED_TESTS${NC}"
echo -e "${RED}Failed:       $FAILED_TESTS${NC}"
echo ""

PASS_RATE=$(awk "BEGIN {printf \"%.1f\", ($PASSED_TESTS/$TOTAL_TESTS)*100}")
echo "Pass Rate:    $PASS_RATE%"
echo ""

echo -e "${YELLOW}════════════════════════════════════════════════════════════════════"
echo -e "  ⚠️  MARCUS TESTS COMPLETED - WRITE OPERATIONS SKIPPED FOR SAFETY"
echo -e "════════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}To test WRITE operations (campaign creation):${NC}"
echo "  1. Use a TEST ad account only"
echo "  2. Set status: 'PAUSED' in all campaigns"
echo "  3. Set daily_budget < 10€"
echo "  4. Enable approval workflow (migration 009)"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✅ All safe tests passed - MARCUS MCP servers ready${NC}"
else
    echo -e "${RED}❌ Some tests failed - check log file${NC}"
fi

echo ""
log "Test suite completed"
log "Full log saved to: $LOG_FILE"
echo ""
echo "View detailed results:"
echo "  cat $LOG_FILE"
echo ""
echo "View JSON responses:"
echo "  cat $LOG_FILE | grep '{' | jq '.'"
echo ""

# Exit with error if any test failed
if [ $FAILED_TESTS -gt 0 ]; then
    exit 1
fi

exit 0
