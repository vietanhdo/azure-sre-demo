resource "azurerm_dashboard_grafana" "grafana" {
  name                              = "amg-${var.name_prefix}"
  resource_group_name               = var.resource_group_name
  location                          = var.location
  grafana_major_version             = "12"
  api_key_enabled                   = true
  deterministic_outbound_ip_enabled = false
  public_network_access_enabled     = true

  identity {
    type = "SystemAssigned"
  }

  azure_monitor_workspace_integrations {
    resource_id = azurerm_monitor_workspace.amw.id
  }

  tags = var.tags
}

resource "azurerm_monitor_workspace" "amw" {
  name                = "amw-${var.name_prefix}"
  resource_group_name = var.resource_group_name
  location            = var.location
  tags                = var.tags
}

resource "azurerm_role_assignment" "grafana_law_reader" {
  scope                = var.law_id
  role_definition_name = "Monitoring Reader"
  principal_id         = azurerm_dashboard_grafana.grafana.identity[0].principal_id
}

# Grant the user running Terraform Grafana Admin access
resource "azurerm_role_assignment" "grafana_admin" {
  scope                = azurerm_dashboard_grafana.grafana.id
  role_definition_name = "Grafana Admin"
  principal_id         = var.admin_user_id
}
