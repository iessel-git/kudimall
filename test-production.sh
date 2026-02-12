#!/bin/bash

# Production API Test Script
# Tests the KudiMall API endpoints on production

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Production URL (update this if needed)
PROD_URL="${KUDIMALL_URL:-https://kudimall.onrender.com}"

echo "======================================"
echo " KudiMall Production API Tests"
echo " URL: $PROD_URL"
echo "======================================"
echo ""

# Test counter
PASSED=0
FAILED=0

# Test function
test_endpoint() {
    local name="$1"
    local endpoint="$2"
    local expected="$3"
    
    echo -n "Testing $name... "
    
    response=$(curl -s -w "\n%{http_code}" "$PROD_URL$endpoint" 2>&1)
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        if echo "$body" | grep -q "$expected"; then
            echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
            ((PASSED++))
        else
            echo -e "${RED}✗ FAILED${NC} - Expected content not found"
            echo "  Expected: $expected"
            echo "  Got: $(echo $body | head -c 100)..."
            ((FAILED++))
        fi
    else
        echo -e "${RED}✗ FAILED${NC} (HTTP $http_code)"
        echo "  Response: $(echo $body | head -c 200)..."
        ((FAILED++))
    fi
}

echo "1. Core Endpoints"
echo "==================="
test_endpoint "Health Check" "/api/health" "ok"
test_endpoint "Root Endpoint" "/" "running"
echo ""

echo "2. Data Endpoints"
echo "==================="
test_endpoint "Categories" "/api/categories" '"name"'
test_endpoint "Products" "/api/products" '"price"'
test_endpoint "Sellers" "/api/sellers" '"shop_name"'
echo ""

echo "3. Search Endpoint (Main Test)"
echo "================================"
test_endpoint "Search All" "/api/search?q=test" '"products"'
test_endpoint "Search Products" "/api/search?q=test&type=products" '"products"'
test_endpoint "Search Sellers" "/api/search?q=test&type=sellers" '"sellers"'
test_endpoint "Search Categories" "/api/search?q=test&type=categories" '"categories"'
test_endpoint "Search with Query" "/api/search?q=rice" '"products"'
echo ""

echo "4. Error Handling"
echo "==================="
echo -n "Testing missing query parameter... "
response=$(curl -s -w "\n%{http_code}" "$PROD_URL/api/search" 2>&1)
http_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" = "400" ]; then
    echo -e "${GREEN}✓ PASSED${NC} (correctly returns 400)"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC} (expected 400, got $http_code)"
    ((FAILED++))
fi
echo ""

echo "======================================"
echo " Test Results"
echo "======================================"
echo -e "${GREEN}✓ Passed: $PASSED${NC}"
if [ $FAILED -gt 0 ]; then
    echo -e "${RED}✗ Failed: $FAILED${NC}"
else
    echo -e "✗ Failed: $FAILED"
fi
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! API is working correctly.${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed. Check the output above for details.${NC}"
    echo ""
    echo "Common issues:"
    echo "  - Database not seeded: Run 'node scripts/seedDb.js' in Render Shell"
    echo "  - Migrations not run: Execute SQL migration files"
    echo "  - DATABASE_URL not set: Check environment variables in Render dashboard"
    echo ""
    echo "For detailed troubleshooting, see SEARCH_ENDPOINT_FIX.md"
    exit 1
fi
