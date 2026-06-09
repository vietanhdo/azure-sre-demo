resource "azurerm_dashboard_grafana" "grafana" {
  name                              = "grafana-${var.name_prefix}"
  resource_group_name               = var.resource_group_name
  location                          = var.location
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

# Grant Grafana Managed Identity access to Log Analytics Workspace
resource "azurerm_role_assignment" "grafana_law_reader" {
  scope                = var.law_id
  role_definition_name = "Monitoring Reader"
  principal_id         = azurerm_dashboard_grafana.grafana.identity[0].principal_id
}
