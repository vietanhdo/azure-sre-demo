#!/usr/bin/env bash
source "$(dirname \"$0\")/common.sh"
set -euo pipefail

GREEN='\033[0;32m'
NC='\033[0m'

if [[ "${1:-}" == "--help" ]]; then
    echo "Usage: ./02-app-build-push.sh"
    echo "Builds and pushes Docker images to ACR."
    exit 0
fi

ACR="acrsredemo"
VERSION=$(git rev-parse --short HEAD)

echo -e "${GREEN}Logging into Azure Container Registry...${NC}"
az acr login --name $ACR

echo -e "${GREEN}Building Backend Image...${NC}"
cd ../apps/backend
docker build -t ${ACR}.azurecr.io/backend:${VERSION} \
    --build-arg VERSION=${VERSION} \
    --build-arg COMMIT=${VERSION} \
    --build-arg BUILD_TIME=$(date -u +'%Y-%m-%dT%H:%M:%SZ') .
docker push ${ACR}.azurecr.io/backend:${VERSION}

echo -e "${GREEN}Building Frontend Image...${NC}"
cd ../frontend
docker build -t ${ACR}.azurecr.io/frontend:${VERSION} .
docker push ${ACR}.azurecr.io/frontend:${VERSION}

echo -e "${GREEN}Build & Push Complete!${NC}"
