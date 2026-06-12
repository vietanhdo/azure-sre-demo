# =============================================================================
# GitHub Actions OIDC Identity Module
# =============================================================================
# This module provisions the Entra ID (Azure AD) resources required for
# GitHub Actions to authenticate to Azure via OIDC (Workload Identity Federation).
#
# HOW IT WORKS:
#   1. GitHub Actions requests a short-lived JWT from GitHub's OIDC provider
#   2. The workflow presents this JWT to Azure AD
#   3. Azure AD validates the JWT against the Federated Identity Credentials below
#   4. If the subject claim matches (repo + branch/PR), Azure AD issues an access token
#   5. The workflow uses this Azure token to manage resources (deploy, push images, etc.)
#
# WHY OIDC:
#   - Zero long-lived secrets (no client_secret stored anywhere)
#   - Tokens expire in ~10 minutes (minimal blast radius if leaked)
#   - Trust is scoped to specific repo + branch (fork attacks are blocked)
#   - Fully aligned with Zero Trust / CIS / SOC2 requirements
# =============================================================================

# ---------------------------------------------------------------------------
# Data Sources — retrieve current context from az login session
# ---------------------------------------------------------------------------
data "azurerm_subscription" "current" {}
data "azuread_client_config" "current" {}

# ---------------------------------------------------------------------------
# 1. App Registration
# ---------------------------------------------------------------------------
# Creates an application object in Entra ID. This is the "identity" that
# represents GitHub Actions. No client_secret is created — authentication
# is exclusively via federated identity (OIDC).
resource "azuread_application" "github_oidc" {
  display_name = "gh-oidc-${var.name_prefix}"
  owners       = [data.azuread_client_config.current.object_id]

  tags = ["GitHubActions", "OIDC", "ManagedByTerraform"]
}

# ---------------------------------------------------------------------------
# 2. Service Principal
# ---------------------------------------------------------------------------
# The Service Principal is the local representation of the App Registration
# within the tenant. RBAC role assignments are granted to this object.
resource "azuread_service_principal" "github_oidc" {
  client_id = azuread_application.github_oidc.client_id
  owners    = [data.azuread_client_config.current.object_id]

  tags = ["GitHubActions", "OIDC", "ManagedByTerraform"]
}

# ---------------------------------------------------------------------------
# 3. Federated Identity Credentials
# ---------------------------------------------------------------------------
# Each credential defines a trust relationship between Azure AD and GitHub's
# OIDC provider. Azure AD will ONLY issue tokens when the JWT subject claim
# matches one of these rules exactly.
#
# Subject format: repo:{org}/{repo}:{ref_type}:{ref_value}
# Issuer:         https://token.actions.githubusercontent.com
# Audience:       api://AzureADTokenExchange (Azure AD default)

# 3a. Trust: pushes to main branch (= production deployments)
# This allows CI/CD workflows triggered by push to main to authenticate.
resource "azuread_application_federated_identity_credential" "main_branch" {
  application_id = azuread_application.github_oidc.id
  display_name   = "github-main-branch"
  audiences      = ["api://AzureADTokenExchange"]
  issuer         = "https://token.actions.githubusercontent.com"
  subject        = "repo:${var.github_org}/${var.github_repo}:ref:refs/heads/main"
  description    = "Deploy access for GitHub Actions on main branch (production)"
}

# 3b. Trust: pull requests
# This allows PR validation workflows to authenticate (e.g., terraform plan).
# Typically paired with read-only RBAC if you want to restrict PR permissions.
resource "azuread_application_federated_identity_credential" "pull_request" {
  application_id = azuread_application.github_oidc.id
  display_name   = "github-pull-request"
  audiences      = ["api://AzureADTokenExchange"]
  issuer         = "https://token.actions.githubusercontent.com"
  subject        = "repo:${var.github_org}/${var.github_repo}:pull_request"
  description    = "Validation access for GitHub Actions on pull requests"
}

# ---------------------------------------------------------------------------
# 4. RBAC Role Assignments
# ---------------------------------------------------------------------------
# Grants the Service Principal "Contributor" role on the Resource Group.
# Scope: Resource Group only (NOT subscription-wide).
#
# Contributor allows:
#   ✅ Push images to ACR
#   ✅ Deploy/update Container Apps
#   ✅ Read monitoring data
#   ✅ Manage networking within RG
#   ❌ Cannot manage RBAC (no Owner/UAA)
#   ❌ Cannot access resources outside this RG
resource "azurerm_role_assignment" "rg_contributor" {
  scope                = var.resource_group_id
  role_definition_name = "Contributor"
  principal_id         = azuread_service_principal.github_oidc.object_id
  description          = "GitHub Actions OIDC — deploy access to resource group"

  # Avoid race condition: SP must exist before role assignment
  depends_on = [azuread_service_principal.github_oidc]
}
