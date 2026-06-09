output "env_id" {
  value = azurerm_container_app_environment.env.id
}

output "app_id" {
  value = azurerm_container_app.backend.id
}

output "fqdn" {
  value = azurerm_container_app.backend.ingress[0].fqdn
}
