output "resource_group_name" {
  value = azurerm_resource_group.main.name
}

output "acr_login_server" {
  value = module.acr.login_server
}

output "aca_fqdn" {
  value = module.aca.fqdn
}

output "grafana_url" {
  value = module.grafana.endpoint
}

output "law_id" {
  value = module.monitoring.law_workspace_id
}
