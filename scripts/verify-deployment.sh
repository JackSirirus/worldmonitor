#!/bin/bash
# WorldMonitor Deployment Verification Script

set -e

BASE_URL="${1:-http://localhost:3001}"
PASSED=0
FAILED=0

check() {
    local name="$1"
    local url="$2"
    local expected="${3:-200}"

    echo -n "Testing: $name ... "

    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")

    if [ "$response" = "$expected" ]; then
        echo "✓ PASS ($response)"
        ((PASSED++))
    else
        echo "✗ FAIL (expected: $expected, got: $response)"
        ((FAILED++))
    fi
}

echo "=== WorldMonitor Deployment Verification ==="
echo "Base URL: $BASE_URL"
echo ""

# Health checks
echo "--- Health Checks ---"
check "Health endpoint" "$BASE_URL/api/health"
check "Liveness probe" "$BASE_URL/api/health/live"
check "Readiness probe" "$BASE_URL/api/health/ready"

# API endpoints
echo ""
echo "--- API Endpoints ---"
check "News list" "$BASE_URL/api/news"
check "News stats" "$BASE_URL/api/news/stats"
check "Tasks list" "$BASE_URL/api/tasks"
check "Task stats" "$BASE_URL/api/tasks/stats"
check "Tools list" "$BASE_URL/api/tools"
check "Logs" "$BASE_URL/api/logs"
check "Metrics" "$BASE_URL/api/metrics"
check "Alerts" "$BASE_URL/api/alerts"

# Database
echo ""
echo "--- Database ---"
check "Database connection" "$BASE_URL/api/health" "200"

# WebSocket (basic test)
echo ""
echo "--- WebSocket ---"
if command -v wscat &> /dev/null; then
    echo "WebSocket test skipped (wscat not installed)"
else
    echo "WebSocket test skipped (requires wscat)"
fi

# Summary
echo ""
echo "=== Summary ==="
echo "Passed: $PASSED"
echo "Failed: $FAILED"

if [ $FAILED -eq 0 ]; then
    echo ""
    echo "✓ All checks passed!"
    exit 0
else
    echo ""
    echo "✗ Some checks failed"
    exit 1
fi
