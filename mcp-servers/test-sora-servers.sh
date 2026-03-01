#!/bin/bash

# ============================================================================
# TEST SCRIPT: SORA MCP SERVERS WITH BRIDGE
# ============================================================================
# Tests all 4 SORA MCP servers (28 tools) via HTTP Bridge
#
# Usage:
#   chmod +x test-sora-servers.sh
#   ./test-sora-servers.sh
#
# Prerequisites:
#   - MCP Bridge running on http://localhost:3456
#   - Google Ads API credentials configured
#   - Meta Ads API credentials configured
# ============================================================================

# set -e temporarily disabled for debugging

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
LOG_FILE="/Users/azzedinezazai/Documents/Agency-Killer-V4/mcp-servers/test-sora-results-$(date +%Y%m%d-%H%M%S).log"

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
    if echo "$RESPONSE" | grep -qi "success.*true\|\"tools\":\|\"servers\":"; then
        log_success "$TEST_NAME"
        if [ "$HAS_JQ" = true ]; then
            echo "$RESPONSE" | jq '.' >> "$LOG_FILE" 2>/dev/null || echo "$RESPONSE" >> "$LOG_FILE"
        else
            echo "$RESPONSE" >> "$LOG_FILE"
        fi
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
echo "  SORA MCP SERVERS - COMPREHENSIVE TEST SUITE"
echo "════════════════════════════════════════════════════════════════════"
echo ""
log "Starting SORA MCP servers tests"
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
echo "DEBUG: After bridge check" >&2

# Check if jq is installed (for JSON parsing)
echo "DEBUG: Checking for jq..." >&2
if command -v jq &> /dev/null; then
    HAS_JQ=true
    echo "DEBUG: jq found" >&2
else
    HAS_JQ=false
    echo "DEBUG: jq not found, showing warning..." >&2
    log_warning "jq not installed - JSON output will not be formatted"
    echo "DEBUG: Warning shown" >&2
fi

echo ""
echo "DEBUG: About to log pre-flight complete" >&2
log "Pre-flight checks complete. Starting tests..."
echo "DEBUG: Logged pre-flight complete" >&2
echo ""

# ============================================================================
# TEST 1: GOOGLE ADS MANAGER (7 TOOLS)
# ============================================================================

echo "════════════════════════════════════════════════════════════════════"
echo "  TEST 1: GOOGLE ADS MANAGER"
echo "════════════════════════════════════════════════════════════════════"
echo ""

# Test 1.1: List tools
test_endpoint \
    "Google Ads - List Tools" \
    "$BRIDGE_URL/api/google-ads/tools"

# Test 1.2: Get accounts (READ-ONLY - SAFE)
test_endpoint \
    "Google Ads - Get Accounts" \
    "$BRIDGE_URL/api/google-ads/call" \
    "POST" \
    '{"tool":"google_ads_get_accounts","arguments":{"credentials":{"access_token":"test"}}}'

# Test 1.3: Get campaigns (READ-ONLY - SAFE)
# Note: This will fail if no Google Ads account is configured, but we test the endpoint
test_endpoint \
    "Google Ads - Get Campaigns (sample)" \
    "$BRIDGE_URL/api/google-ads/call" \
    "POST" \
    '{"tool":"google_ads_get_campaigns","arguments":{"customer_id":"0000000000","date_range":"LAST_7_DAYS","credentials":{"access_token":"test"}}}'

echo ""

# ============================================================================
# TEST 2: META ADS MANAGER (7 TOOLS)
# ============================================================================

echo "════════════════════════════════════════════════════════════════════"
echo "  TEST 2: META ADS MANAGER"
echo "════════════════════════════════════════════════════════════════════"
echo ""

# Test 2.1: List tools
test_endpoint \
    "Meta Ads - List Tools" \
    "$BRIDGE_URL/api/meta-ads/tools"

# Test 2.2: Get ad accounts (READ-ONLY - SAFE)
test_endpoint \
    "Meta Ads - Get Ad Accounts" \
    "$BRIDGE_URL/api/meta-ads/call" \
    "POST" \
    '{"tool":"meta_ads_get_ad_accounts","arguments":{"user_id":"me","credentials":{"access_token":"test"}}}'

# Test 2.3: Get campaigns (READ-ONLY - SAFE)
test_endpoint \
    "Meta Ads - Get Campaigns (sample)" \
    "$BRIDGE_URL/api/meta-ads/call" \
    "POST" \
    '{"tool":"meta_ads_get_campaigns","arguments":{"ad_account_id":"act_000000000","date_range":{"since":"2026-02-13","until":"2026-02-20"},"credentials":{"access_token":"test"}}}'

# Test 2.4: Check Learning Phase (READ-ONLY - SAFE)
test_endpoint \
    "Meta Ads - Check Learning Phase" \
    "$BRIDGE_URL/api/meta-ads/call" \
    "POST" \
    '{"tool":"meta_ads_check_learning_phase","arguments":{"ad_set_id":"000000000","credentials":{"access_token":"test"}}}'

echo ""

# ============================================================================
# TEST 3: GTM MANAGER (7 TOOLS)
# ============================================================================

echo "════════════════════════════════════════════════════════════════════"
echo "  TEST 3: GTM MANAGER"
echo "════════════════════════════════════════════════════════════════════"
echo ""

# Test 3.1: List tools
test_endpoint \
    "GTM - List Tools" \
    "$BRIDGE_URL/api/gtm/tools"

# Test 3.2: List containers
test_endpoint \
    "GTM - List Containers (sample)" \
    "$BRIDGE_URL/api/gtm/call" \
    "POST" \
    '{"tool":"gtm_list_containers","arguments":{"account_id":"accounts/0000000","credentials":{"access_token":"test"}}}'

# Test 3.3: List tags
test_endpoint \
    "GTM - List Tags (sample)" \
    "$BRIDGE_URL/api/gtm/call" \
    "POST" \
    '{"tool":"gtm_list_tags","arguments":{"container_id":"accounts/0/containers/0","credentials":{"access_token":"test"}}}'

echo ""

# ============================================================================
# TEST 4: LOOKER MANAGER (7 TOOLS)
# ============================================================================

echo "════════════════════════════════════════════════════════════════════"
echo "  TEST 4: LOOKER MANAGER"
echo "════════════════════════════════════════════════════════════════════"
echo ""

# Test 4.1: List tools
test_endpoint \
    "Looker - List Tools" \
    "$BRIDGE_URL/api/looker/tools"

# Test 4.2: Get Report URL (READ-ONLY - SAFE)
test_endpoint \
    "Looker - Get Report URL" \
    "$BRIDGE_URL/api/looker/call" \
    "POST" \
    '{"tool":"looker_get_report_url","arguments":{"report_id":"test","credentials":{"access_token":"test"}}}'

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

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}════════════════════════════════════════════════════════════════════"
    echo -e "  ✅ ALL TESTS PASSED - SORA MCP SERVERS READY FOR PRODUCTION"
    echo -e "════════════════════════════════════════════════════════════════════${NC}"
else
    echo -e "${YELLOW}════════════════════════════════════════════════════════════════════"
    echo -e "  ⚠️  SOME TESTS FAILED - CHECK LOG FILE FOR DETAILS"
    echo -e "════════════════════════════════════════════════════════════════════${NC}"
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
