#!/bin/bash

# Verification script to run before pushing to public GitHub
# This ensures no secrets or internal docs are being committed

set -e

echo "🔍 Verifying repository before public push..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# Check 1: Verify no real Discord tokens
echo "1️⃣  Checking for Discord tokens..."
# Look for Discord bot token patterns: MTQ/MTA/Nj followed by long base64 string
if git grep -E "(MTQ|MTA|Nj)[a-zA-Z0-9_-]{20,}\." -- ':!node_modules' ':!*.md' ':!verify-before-push.sh' > /dev/null 2>&1; then
    echo -e "${RED}❌ FAIL: Found potential Discord token in tracked files${NC}"
    git grep -E "(MTQ|MTA|Nj)[a-zA-Z0-9_-]{20,}\." -- ':!node_modules' ':!*.md' ':!verify-before-push.sh'
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ PASS: No Discord tokens found${NC}"
fi
echo ""

# Check 2: Verify .env is not tracked
echo "2️⃣  Checking .env files..."
if git ls-files | grep -E "^\.env$|^\.env\.local$|^\.env\.production$" > /dev/null; then
    echo -e "${RED}❌ FAIL: Real .env file is tracked${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ PASS: No real .env files tracked${NC}"
fi
echo ""

# Check 3: Verify k8s/secret.yaml is not tracked
echo "3️⃣  Checking Kubernetes secrets..."
if git ls-files | grep "k8s/secret.yaml$" > /dev/null; then
    echo -e "${RED}❌ FAIL: Real k8s/secret.yaml is tracked${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ PASS: Real secret.yaml not tracked${NC}"
fi
echo ""

# Check 4: Verify internal docs are not tracked
echo "4️⃣  Checking internal documentation..."
INTERNAL_DOCS=(
    "SERVER-CONFIGURATION.md"
    "TOOL-AUDIT.md"
    "PUBLIC-REPO-CONTENTS.md"
    "SECURITY-CLEANUP.md"
    "DEPLOYMENT-STATUS.md"
    "MCP-ENHANCEMENT-ROADMAP.md"
    "product-plan.md"
)

for doc in "${INTERNAL_DOCS[@]}"; do
    if git ls-files | grep "$doc" > /dev/null; then
        echo -e "${RED}❌ FAIL: Internal doc tracked: $doc${NC}"
        ERRORS=$((ERRORS + 1))
    fi
done

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ PASS: No internal docs tracked${NC}"
fi
echo ""

# Check 5: Verify server-specific content is not tracked
echo "5️⃣  Checking server-specific content..."
if git ls-files | grep -E "^content/|^updates/|^content-maintenance/" > /dev/null; then
    echo -e "${RED}❌ FAIL: Server-specific content is tracked${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ PASS: No server-specific content tracked${NC}"
fi
echo ""

# Check 6: Verify required public files are present
echo "6️⃣  Checking required public files..."
REQUIRED_FILES=(
    "README.md"
    "specifications.md"
    ".env.example"
    ".mcp.json.example"
    "k8s/secret.yaml.example"
    "Dockerfile"
    "package.json"
)

for file in "${REQUIRED_FILES[@]}"; do
    if ! git ls-files | grep "$file" > /dev/null; then
        echo -e "${RED}❌ FAIL: Required file missing: $file${NC}"
        ERRORS=$((ERRORS + 1))
    fi
done

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ PASS: All required files present${NC}"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ ALL CHECKS PASSED${NC}"
    echo ""
    echo "📊 Repository statistics:"
    echo "   Total files: $(git ls-files | wc -l)"
    echo "   TypeScript files: $(git ls-files | grep "\.ts$" | wc -l)"
    echo "   Configuration files: $(git ls-files | grep -E "\.(json|yaml|yml)$" | wc -l)"
    echo "   Documentation: $(git ls-files | grep "\.md$" | wc -l)"
    echo ""
    echo "🚀 Ready to push to public repository!"
    echo ""
    echo "Next steps:"
    echo "  git remote add origin <your-github-repo-url>"
    echo "  git branch -M main"
    echo "  git push -u origin main"
else
    echo -e "${RED}❌ $ERRORS CHECK(S) FAILED${NC}"
    echo ""
    echo "Please fix the issues above before pushing to public repository."
    exit 1
fi
