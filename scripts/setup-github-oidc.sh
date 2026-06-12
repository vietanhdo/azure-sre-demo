#!/usr/bin/env bash
# =============================================================================
# Setup GitHub Actions OIDC Authentication (Azure CLI alternative to Terraform)
# =============================================================================
# This script creates the same resources as the Terraform github-oidc module,
# but using pure Azure CLI. Useful for:
#   - Quick demo setup without Terraform
#   - Live demo: show audience OIDC setup from scratch
#   - Troubleshooting / manual verification
#
# Prerequisites:
#   - az cli >= 2.50
#   - Logged in with Application Administrator + Owner/UAA permissions
#   - gh cli (optional, for setting GitHub secrets)
#
# Usage:
#   ./scripts/setup-github-oidc.sh
# =============================================================================

set -euo pipefail

# Source common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "${SCRIPT_DIR}/common.sh" ]]; then
    source "${SCRIPT_DIR}/common.sh"
fi

# ---- Configuration ----
GITHUB_ORG="vietanhdo"
GITHUB_REPO="azure-sre-demo"
APP_NAME="gh-oidc-sre-demo-demo"
RG_NAME="rg-sre-demo-demo"

# ---- Colors (fallback if common.sh not loaded) ----
CYAN="${CYAN:-\033[0;36m}"
GREEN="${GREEN:-\033[0;32m}"
YELLOW="${YELLOW:-\033[1;33m}"
RED="${RED:-\033[0;31m}"
NC="${NC:-\033[0m}"

# ---- Help ----
if [[ "${1:-}" == "--help" ]]; then
    echo "Usage: ./setup-github-oidc.sh"
    echo ""
    echo "Creates Azure AD App Registration + Federated Identity Credentials"
    echo "for GitHub Actions OIDC authentication. No secrets are created."
    echo ""
    echo "Configuration (edit script or set env vars):"
    echo "  GITHUB_ORG   = ${GITHUB_ORG}"
    echo "  GITHUB_REPO  = ${GITHUB_REPO}"
    echo "  APP_NAME     = ${APP_NAME}"
    echo "  RG_NAME      = ${RG_NAME}"
    exit 0
fi

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN} GitHub Actions OIDC Setup${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# ---- Step 0: Verify login ----
echo -e "${CYAN}[Step 0]${NC} Verifying Azure CLI login..."
ACCOUNT=$(az account show --query '{subscription:name, user:user.name}' -o tsv 2>/dev/null || true)
if [[ -z "${ACCOUNT}" ]]; then
    echo -e "${RED}Not logged in. Run: az login${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Logged in:${NC} ${ACCOUNT}"
echo ""

SUBSCRIPTION_ID=$(az account show --query id -o tsv)
TENANT_ID=$(az account show --query tenantId -o tsv)

# ---- Step 1: Create App Registration ----
echo -e "${CYAN}[Step 1]${NC} Creating App Registration: ${APP_NAME}..."

# Check if already exists
EXISTING_APP_ID=$(az ad app list --display-name "${APP_NAME}" --query "[0].appId" -o tsv 2>/dev/null || true)
if [[ -n "${EXISTING_APP_ID}" && "${EXISTING_APP_ID}" != "None" ]]; then
    echo -e "${YELLOW}⚠ App Registration already exists: ${EXISTING_APP_ID}${NC}"
    CLIENT_ID="${EXISTING_APP_ID}"
else
    CLIENT_ID=$(az ad app create --display-name "${APP_NAME}" --query appId -o tsv)
    echo -e "${GREEN}✓ Created App Registration: ${CLIENT_ID}${NC}"
fi
echo ""

# ---- Step 2: Create Service Principal ----
echo -e "${CYAN}[Step 2]${NC} Creating Service Principal..."

EXISTING_SP=$(az ad sp list --filter "appId eq '${CLIENT_ID}'" --query "[0].id" -o tsv 2>/dev/null || true)
if [[ -n "${EXISTING_SP}" && "${EXISTING_SP}" != "None" ]]; then
    echo -e "${YELLOW}⚠ Service Principal already exists${NC}"
    SP_OBJECT_ID="${EXISTING_SP}"
else
    SP_OBJECT_ID=$(az ad sp create --id "${CLIENT_ID}" --query id -o tsv)
    echo -e "${GREEN}✓ Created Service Principal: ${SP_OBJECT_ID}${NC}"
fi
echo ""

# ---- Step 3: Create Federated Identity Credentials ----
echo -e "${CYAN}[Step 3]${NC} Creating Federated Identity Credentials..."

# Get App object ID (different from Client ID)
APP_OBJECT_ID=$(az ad app show --id "${CLIENT_ID}" --query id -o tsv)

# 3a. Main branch (production)
echo -e "  Creating credential: main branch..."
az ad app federated-credential create \
    --id "${APP_OBJECT_ID}" \
    --parameters "{
        \"name\": \"github-main-branch\",
        \"issuer\": \"https://token.actions.githubusercontent.com\",
        \"subject\": \"repo:${GITHUB_ORG}/${GITHUB_REPO}:ref:refs/heads/main\",
        \"audiences\": [\"api://AzureADTokenExchange\"],
        \"description\": \"Deploy access for GitHub Actions on main branch (production)\"
    }" 2>/dev/null && echo -e "  ${GREEN}✓ main branch credential created${NC}" \
    || echo -e "  ${YELLOW}⚠ main branch credential already exists (skipped)${NC}"

# 3b. Pull requests
echo -e "  Creating credential: pull requests..."
az ad app federated-credential create \
    --id "${APP_OBJECT_ID}" \
    --parameters "{
        \"name\": \"github-pull-request\",
        \"issuer\": \"https://token.actions.githubusercontent.com\",
        \"subject\": \"repo:${GITHUB_ORG}/${GITHUB_REPO}:pull_request\",
        \"audiences\": [\"api://AzureADTokenExchange\"],
        \"description\": \"Validation access for GitHub Actions on pull requests\"
    }" 2>/dev/null && echo -e "  ${GREEN}✓ pull request credential created${NC}" \
    || echo -e "  ${YELLOW}⚠ pull request credential already exists (skipped)${NC}"

echo ""

# ---- Step 4: RBAC Role Assignment ----
echo -e "${CYAN}[Step 4]${NC} Assigning Contributor role on Resource Group: ${RG_NAME}..."

RG_ID=$(az group show --name "${RG_NAME}" --query id -o tsv 2>/dev/null || true)
if [[ -z "${RG_ID}" ]]; then
    echo -e "${YELLOW}⚠ Resource Group ${RG_NAME} not found. Skipping RBAC assignment.${NC}"
    echo -e "${YELLOW}  (Run terraform apply first to create the RG, then re-run this script)${NC}"
else
    az role assignment create \
        --assignee "${SP_OBJECT_ID}" \
        --role "Contributor" \
        --scope "${RG_ID}" \
        --description "GitHub Actions OIDC — deploy access" 2>/dev/null \
    && echo -e "${GREEN}✓ Contributor role assigned on ${RG_NAME}${NC}" \
    || echo -e "${YELLOW}⚠ Role assignment already exists (skipped)${NC}"
fi
echo ""

# ---- Step 5: Output ----
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN} Setup Complete! Configure GitHub Secrets:${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""
echo -e "  ${GREEN}AZURE_CLIENT_ID${NC}       = ${CLIENT_ID}"
echo -e "  ${GREEN}AZURE_TENANT_ID${NC}       = ${TENANT_ID}"
echo -e "  ${GREEN}AZURE_SUBSCRIPTION_ID${NC} = ${SUBSCRIPTION_ID}"
echo ""
echo -e "${CYAN}Option A: Set via gh CLI:${NC}"
echo "  gh secret set AZURE_CLIENT_ID --body \"${CLIENT_ID}\""
echo "  gh secret set AZURE_TENANT_ID --body \"${TENANT_ID}\""
echo "  gh secret set AZURE_SUBSCRIPTION_ID --body \"${SUBSCRIPTION_ID}\""
echo ""
echo -e "${CYAN}Option B: Manual:${NC}"
echo "  GitHub Repo → Settings → Secrets and variables → Actions → New repository secret"
echo ""
echo -e "${GREEN}Done! Push to main to trigger CI and verify OIDC authentication.${NC}"
