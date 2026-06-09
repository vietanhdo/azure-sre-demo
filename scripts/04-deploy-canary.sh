#!/usr/bin/env bash
set -euo pipefail

GREEN='\033[0;32m'
NC='\033[0m'

WEIGHT=20

if [[ "${1:-}" == "--help" ]]; then
    echo "Usage: ./04-deploy-canary.sh [--weight <percentage>]"
    echo "Deploys a canary revision and splits traffic."
    exit 0
fi

if [[ "${1:-}" == "--weight" && -n "${2:-}" ]]; then
    WEIGHT=$2
fi

STABLE_WEIGHT=$((100 - WEIGHT))

RG="rg-sre-demo"
ACR="acrsredemo"
APP="ca-sre-backend"
VERSION=$(git rev-parse --short HEAD)
# Simulate a new version for canary
CANARY_VERSION="${VERSION}-canary"
REVISION_SUFFIX="canary-${VERSION}"

echo -e "${GREEN}Deploying Canary Revision to ACA...${NC}"

# Get the current stable revision name
STABLE_REV=$(az containerapp revision list -n $APP -g $RG --query "[?properties.trafficWeight > \`0\`].name | [0]" -o tsv)

az containerapp update \
    --name $APP \
    --resource-group $RG \
    --image ${ACR}.azurecr.io/backend:${VERSION} \
    --revision-suffix $REVISION_SUFFIX \
    --set-env-vars APP_VERSION=$CANARY_VERSION

echo -e "${GREEN}Setting traffic split: Stable=${STABLE_WEIGHT}%, Canary=${WEIGHT}%...${NC}"

# Note: In ACA, you specify weights for each revision.
az containerapp ingress traffic set \
    --name $APP \
    --resource-group $RG \
    --revision-weight ${STABLE_REV}=${STABLE_WEIGHT} ${APP}--${REVISION_SUFFIX}=${WEIGHT} \
    --label-weight stable=${STABLE_WEIGHT} canary=${WEIGHT}

echo -e "${GREEN}Canary Deployment Complete!${NC}"
