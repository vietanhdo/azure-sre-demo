locals {
  name_prefix = "${var.project}-${var.environment}"
}

resource "azurerm_resource_group" "main" {
  name     = "rg-${local.name_prefix}"
  location = var.location
  tags     = var.tags
}

module "networking" {
  source              = "./modules/networking"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  name_prefix         = local.name_prefix
  tags                = var.tags
}

module "acr" {
  source              = "./modules/acr"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  name_prefix         = replace(local.name_prefix, "-", "")
  tags                = var.tags
}

module "monitoring" {
  source              = "./modules/monitoring"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  name_prefix         = local.name_prefix
  tags                = var.tags
}

module "aca" {
  source                     = "./modules/aca"
  resource_group_name        = azurerm_resource_group.main.name
  location                   = azurerm_resource_group.main.location
  name_prefix                = local.name_prefix
  subnet_id                  = module.networking.aca_subnet_id
  log_analytics_workspace_id = module.monitoring.law_id
  acr_id                     = module.acr.acr_id
  acr_login_server           = module.acr.login_server
  app_insights_connection    = module.monitoring.app_insights_connection_string
  tags                       = var.tags

  depends_on = [
    module.networking,
    module.acr,
    module.monitoring
  ]
}

module "grafana" {
  source              = "./modules/grafana"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  name_prefix         = local.name_prefix
  law_id              = module.monitoring.law_id
  tags                = var.tags
}
