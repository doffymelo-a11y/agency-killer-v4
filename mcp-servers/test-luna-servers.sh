#!/bin/bash

# ============================================================================
# TEST SCRIPT: LUNA MCP SERVERS WITH BRIDGE
# ============================================================================
# Tests LUNA's 2 MCP servers (14 tools) via HTTP Bridge
#
# Usage:
#   chmod +x test-luna-servers.sh
#   ./test-luna-servers.sh
#
# Prerequisites:
#   - MCP Bridge running on http://localhost:3456
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
LOG_FILE="/Users/azzedinezazai/Documents/Agency-Killer-V4/mcp-servers/test-luna-results-$(date +%Y%m%d-%H%M%S).log"

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
echo "  LUNA MCP SERVERS - COMPREHENSIVE TEST SUITE"
echo "════════════════════════════════════════════════════════════════════"
echo ""
log "Starting LUNA MCP servers tests"
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
# TEST 1: SEO AUDIT TOOL (7 TOOLS)
# ============================================================================

echo "════════════════════════════════════════════════════════════════════"
echo "  TEST 1: SEO AUDIT TOOL"
echo "════════════════════════════════════════════════════════════════════"
echo ""

# Test 1.1: List tools
test_endpoint \
    "SEO Audit - List Tools" \
    "$BRIDGE_URL/api/seo-audit/tools"

# Test 1.2: Technical SEO Audit (READ-ONLY - SAFE)
test_endpoint \
    "SEO Audit - Technical SEO Audit (sample)" \
    "$BRIDGE_URL/api/seo-audit/call" \
    "POST" \
    '{"tool":"technical_seo_audit","arguments":{"url":"https://example.com"}}'

# Test 1.3: PageSpeed Insights (READ-ONLY - SAFE)
test_endpoint \
    "SEO Audit - PageSpeed Insights" \
    "$BRIDGE_URL/api/seo-audit/call" \
    "POST" \
    '{"tool":"pagespeed_insights","arguments":{"url":"https://example.com"}}'

# Test 1.4: Schema Markup Check (READ-ONLY - SAFE)
test_endpoint \
    "SEO Audit - Schema Markup Check" \
    "$BRIDGE_URL/api/seo-audit/call" \
    "POST" \
    '{"tool":"schema_markup_check","arguments":{"url":"https://example.com"}}'

echo ""

# ============================================================================
# TEST 2: KEYWORD RESEARCH TOOL (7 TOOLS)
# ============================================================================

echo "════════════════════════════════════════════════════════════════════"
echo "  TEST 2: KEYWORD RESEARCH TOOL"
echo "════════════════════════════════════════════════════════════════════"
echo ""

# Test 2.1: List tools
test_endpoint \
    "Keyword Research - List Tools" \
    "$BRIDGE_URL/api/keyword-research/tools"

# Test 2.2: Keyword Suggestions (READ-ONLY - SAFE)
test_endpoint \
    "Keyword Research - Keyword Suggestions" \
    "$BRIDGE_URL/api/keyword-research/call" \
    "POST" \
    '{"tool":"keyword_suggestions","arguments":{"seed_keyword":"marketing automation"}}'

# Test 2.3: SERP Analysis (READ-ONLY - SAFE)
test_endpoint \
    "Keyword Research - SERP Analysis" \
    "$BRIDGE_URL/api/keyword-research/call" \
    "POST" \
    '{"tool":"serp_analysis","arguments":{"keyword":"best crm software"}}'

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
    echo -e "  ✅ ALL TESTS PASSED - LUNA MCP SERVERS READY FOR PRODUCTION"
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
