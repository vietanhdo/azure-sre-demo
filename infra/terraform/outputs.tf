output "resource_group_name" {
  value = azurerm_resource_group.main.name
}

output "acr_login_server" {
  value = module.acr.login_server
}

output "backend_fqdn" {
  value = module.aca.backend_fqdn
}

output "frontend_fqdn" {
  value = module.aca.frontend_fqdn
}

output "grafana_url" {
  value = module.grafana.endpoint
}

output "law_id" {
  value = module.monitoring.law_workspace_id
}

# =============================================================================
# GitHub Actions OIDC — Configure these as GitHub Secrets
# =============================================================================
output "github_oidc_client_id" {
  value       = module.github_oidc.client_id
  description = "Set as AZURE_CLIENT_ID in GitHub Secrets"
}

output "github_oidc_tenant_id" {
  value       = module.github_oidc.tenant_id
  description = "Set as AZURE_TENANT_ID in GitHub Secrets"
}

output "github_oidc_subscription_id" {
  value       = module.github_oidc.subscription_id
  description = "Set as AZURE_SUBSCRIPTION_ID in GitHub Secrets"
}

output "github_secrets_setup" {
  value       = module.github_oidc.github_secrets_commands
  description = "Run these gh CLI commands to configure GitHub Secrets"
}
