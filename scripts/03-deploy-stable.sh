#!/usr/bin/env bash
source "$(dirname \"$0\")/common.sh"
set -euo pipefail

GREEN='\033[0;32m'
NC='\033[0m'

if [[ "${1:-}" == "--help" ]]; then
    echo "Usage: ./03-deploy-stable.sh"
    echo "Deploys the stable revision to ACA."
    exit 0
fi

RG="rg-sre-demo"
ACR="acrsredemo"
APP="ca-sre-backend"
VERSION=$(git rev-parse --short HEAD)
REVISION_SUFFIX="stable-${VERSION}"

echo -e "${GREEN}Deploying Stable Revision to ACA...${NC}"

az containerapp update \
    --name $APP \
    --resource-group $RG \
    --image ${ACR}.azurecr.io/backend:${VERSION} \
    --revision-suffix $REVISION_SUFFIX \
    --set-env-vars APP_VERSION=$VERSION

echo -e "${GREEN}Setting traffic weight to 100% on stable revision...${NC}"
az containerapp ingress traffic set \
    --name $APP \
    --resource-group $RG \
    --revision-weight ${APP}--${REVISION_SUFFIX}=100 \
    --label-weight stable=100

echo -e "${GREEN}Stable Deployment Complete!${NC}"
