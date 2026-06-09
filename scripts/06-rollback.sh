#!/usr/bin/env bash
source "$(dirname \"$0\")/common.sh"
set -euo pipefail

GREEN='\033[0;32m'
NC='\033[0m'

if [[ "${1:-}" == "--help" ]]; then
    echo "Usage: ./06-rollback.sh"
    echo "Rolls back traffic to the stable revision and deactivates canary."
    exit 0
fi

RG="rg-sre-demo"
APP="ca-sre-backend"

echo -e "${GREEN}Rolling back traffic to 100% stable...${NC}"

# Find stable revision
STABLE_REV=$(az containerapp revision list -n $APP -g $RG --query "[?contains(name, 'stable')].name | [0]" -o tsv)

az containerapp ingress traffic set \
    --name $APP \
    --resource-group $RG \
    --revision-weight ${STABLE_REV}=100 \
    --label-weight stable=100

echo -e "${GREEN}Deactivating canary revisions...${NC}"
CANARY_REVS=$(az containerapp revision list -n $APP -g $RG --query "[?contains(name, 'canary')].name" -o tsv)

for rev in $CANARY_REVS; do
    echo "Deactivating $rev..."
    az containerapp revision deactivate --name $APP --resource-group $RG --revision $rev
done

echo -e "${GREEN}Rollback Complete!${NC}"
