resource "azurerm_container_app_environment" "env" {
  name                           = "cae-${var.name_prefix}"
  location                       = var.location
  resource_group_name            = var.resource_group_name
  log_analytics_workspace_id     = var.log_analytics_workspace_id
  infrastructure_subnet_id       = var.subnet_id
  internal_load_balancer_enabled = false
  tags                           = var.tags
}

resource "azurerm_user_assigned_identity" "aca_identity" {
  name                = "id-${var.name_prefix}-aca"
  location            = var.location
  resource_group_name = var.resource_group_name
}

resource "azurerm_role_assignment" "acr_pull" {
  scope                = var.acr_id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_user_assigned_identity.aca_identity.principal_id
}

resource "azurerm_container_app" "backend" {
  name                         = "ca-${var.name_prefix}-backend"
  container_app_environment_id = azurerm_container_app_environment.env.id
  resource_group_name          = var.resource_group_name
  revision_mode                = "Multiple"
  tags                         = var.tags

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.aca_identity.id]
  }

  registry {
    server   = var.acr_login_server
    identity = azurerm_user_assigned_identity.aca_identity.id
  }

  ingress {
    allow_insecure_connections = false
    external_enabled           = true
    target_port                = 8080
    transport                  = "auto"

    traffic_weight {
      latest_revision = true
      percentage      = 100
      label           = "stable"
    }
  }

  template {
    min_replicas = 1
    max_replicas = 10

    container {
      name   = "backend"
      image  = "mcr.microsoft.com/k8se/quickstart:latest" # Placeholder until first deployment
      cpu    = 0.5
      memory = "1Gi"

      env {
        name  = "ENVIRONMENT"
        value = "demo"
      }
      env {
        name  = "APPLICATIONINSIGHTS_CONNECTION_STRING"
        value = var.app_insights_connection
      }
      env {
        name = "OTEL_EXPORTER_OTLP_ENDPOINT"
        # Normally this would point to a collector or AppInsights OTLP endpoint
        # For demo, if empty, our code disables telemetry or falls back.
        value = ""
      }

      liveness_probe {
        port      = 8080
        transport = "HTTP"
        path      = "/healthz"
      }
      readiness_probe {
        port      = 8080
        transport = "HTTP"
        path      = "/ready"
      }
    }
  }

  lifecycle {
    ignore_changes = [
      template[0].container[0].image,
      ingress[0].traffic_weight
    ]
  }
}

resource "azurerm_container_app" "frontend" {
  name                         = "ca-${var.name_prefix}-frontend"
  container_app_environment_id = azurerm_container_app_environment.env.id
  resource_group_name          = var.resource_group_name
  revision_mode                = "Multiple"
  tags                         = var.tags

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.aca_identity.id]
  }

  registry {
    server   = var.acr_login_server
    identity = azurerm_user_assigned_identity.aca_identity.id
  }

  ingress {
    allow_insecure_connections = false
    external_enabled           = true
    target_port                = 80
    transport                  = "auto"

    traffic_weight {
      latest_revision = true
      percentage      = 100
      label           = "stable"
    }
  }

  template {
    min_replicas = 1
    max_replicas = 10

    container {
      name   = "frontend"
      image  = "mcr.microsoft.com/k8se/quickstart:latest" # Placeholder until first deployment
      cpu    = 0.5
      memory = "1Gi"

      env {
        name  = "ENVIRONMENT"
        value = "demo"
      }
      env {
        name  = "APPLICATIONINSIGHTS_CONNECTION_STRING"
        value = var.app_insights_connection
      }
      env {
        name = "OTEL_EXPORTER_OTLP_ENDPOINT"
        # Normally this would point to a collector or AppInsights OTLP endpoint
        # For demo, if empty, our code disables telemetry or falls back.
        value = ""
      }
      
      env {
        name  = "BACKEND_API_URL"
        value = "https://${azurerm_container_app.backend.ingress[0].fqdn}"
      }

      liveness_probe {
        port      = 80
        transport = "HTTP"
        path      = "/"
      }
      readiness_probe {
        port      = 80
        transport = "HTTP"
        path      = "/"
      }
    }
  }

  lifecycle {
    ignore_changes = [
      template[0].container[0].image,
      ingress[0].traffic_weight
    ]
  }
}
