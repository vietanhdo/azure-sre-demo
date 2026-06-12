output "env_id" {
  value = azurerm_container_app_environment.env.id
}

output "backend_app_id" {
  value = azurerm_container_app.backend.id
}

output "backend_fqdn" {
  value = azurerm_container_app.backend.ingress[0].fqdn
}

output "frontend_app_id" {
  value = azurerm_container_app.frontend.id
}

output "frontend_fqdn" {
  value = azurerm_container_app.frontend.ingress[0].fqdn
}
