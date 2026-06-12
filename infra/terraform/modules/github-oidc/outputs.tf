# =============================================================================
# Outputs — Values needed for GitHub Secrets configuration
# =============================================================================
# After terraform apply, use these values to configure GitHub Secrets:
#   AZURE_CLIENT_ID       → github_oidc_client_id
#   AZURE_TENANT_ID       → github_oidc_tenant_id
#   AZURE_SUBSCRIPTION_ID → github_oidc_subscription_id

output "client_id" {
  value       = azuread_application.github_oidc.client_id
  description = "Application (client) ID — set as AZURE_CLIENT_ID in GitHub Secrets"
}

output "tenant_id" {
  value       = data.azuread_client_config.current.tenant_id
  description = "Directory (tenant) ID — set as AZURE_TENANT_ID in GitHub Secrets"
}

output "subscription_id" {
  value       = data.azurerm_subscription.current.subscription_id
  description = "Subscription ID — set as AZURE_SUBSCRIPTION_ID in GitHub Secrets"
}

output "service_principal_object_id" {
  value       = azuread_service_principal.github_oidc.object_id
  description = "Service Principal object ID (for troubleshooting RBAC)"
}

output "github_secrets_commands" {
  value       = <<-EOT
    # ============================================================
    # Run these commands to configure GitHub Secrets automatically:
    # (requires: gh auth login)
    # ============================================================
    gh secret set AZURE_CLIENT_ID --body "${azuread_application.github_oidc.client_id}"
    gh secret set AZURE_TENANT_ID --body "${data.azuread_client_config.current.tenant_id}"
    gh secret set AZURE_SUBSCRIPTION_ID --body "${data.azurerm_subscription.current.subscription_id}"
  EOT
  description = "Convenience: gh CLI commands to set GitHub Secrets"
}
