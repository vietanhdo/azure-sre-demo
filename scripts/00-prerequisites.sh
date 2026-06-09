#!/usr/bin/env bash
source "$(dirname \"$0\")/common.sh"
set -euo pipefail

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

if [[ "${1:-}" == "--help" ]]; then
    echo "Usage: ./00-prerequisites.sh"
    echo "Checks if all required tools are installed."
    exit 0
fi

echo -e "${GREEN}Checking prerequisites...${NC}"

TOOLS=("az" "terraform" "docker" "k6" "jq" "curl")
MISSING=0

for tool in "${TOOLS[@]}"; do
    if ! command -v "$tool" &> /dev/null; then
        echo -e "${RED}Error: $tool is not installed.${NC}"
        MISSING=1
    else
        VERSION=$("$tool" --version 2>&1 | head -n 1)
        echo -e "${GREEN}✓ $tool installed${NC} ($VERSION)"
    fi
done

if [ $MISSING -eq 1 ]; then
    echo -e "${RED}Please install missing prerequisites and try again.${NC}"
    exit 1
fi

echo -e "${GREEN}All prerequisites are met!${NC}"
