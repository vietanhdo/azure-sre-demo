resource "azurerm_log_analytics_workspace" "law" {
  name                = "law-${var.name_prefix}"
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                 = "PerGB2018"
  retention_in_days   = 30
  tags                = var.tags
}

resource "azurerm_application_insights" "app_insights" {
  name                = "appi-${var.name_prefix}"
  location            = var.location
  resource_group_name = var.resource_group_name
  workspace_id        = azurerm_log_analytics_workspace.law.id
  application_type    = "web"
  tags                = var.tags
}

resource "azurerm_monitor_action_group" "sre" {
  name                = "ag-${var.name_prefix}-sre"
  resource_group_name = var.resource_group_name
  short_name          = "sre-alerts"

  email_receiver {
    name                    = "sre-team"
    email_address           = "sre@example.com"
    use_common_alert_schema = true
  }
}

# Example Alert Rule (SLO Breach)
resource "azurerm_monitor_metric_alert" "http_5xx" {
  name                = "alert-${var.name_prefix}-http5xx"
  resource_group_name = var.resource_group_name
  scopes              = [azurerm_application_insights.app_insights.id]
  description         = "Triggers when HTTP 5xx errors exceed threshold"

  criteria {
    metric_namespace = "microsoft.insights/components"
    metric_name      = "requests/failed"
    aggregation      = "Total"
    operator         = "GreaterThan"
    threshold        = 10 # Adjust for demo
  }

  action {
    action_group_id = azurerm_monitor_action_group.sre.id
  }
}
