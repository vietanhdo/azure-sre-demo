output "law_id" {
  value = azurerm_log_analytics_workspace.law.id
}

output "law_workspace_id" {
  value = azurerm_log_analytics_workspace.law.workspace_id
}

output "app_insights_connection_string" {
  value     = azurerm_application_insights.app_insights.connection_string
  sensitive = true
}
