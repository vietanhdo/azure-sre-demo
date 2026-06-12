data "azurerm_resource_group" "rg" {
  name = var.resource_group_name
}

resource "azurerm_resource_group_template_deployment" "sre_agent" {
  name                = "${var.name_prefix}-sreagent-deploy"
  resource_group_name = var.resource_group_name
  deployment_mode     = "Incremental"

  template_content = jsonencode({
    "$schema"      = "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#"
    contentVersion = "1.0.0.0"
    parameters = {
      agentName = { type = "string" }
      location  = { type = "string" }
      tags      = { type = "object" }
    }
    resources = [
      {
        type       = "Microsoft.App/agents"
        apiVersion = "2025-05-01-preview"
        name       = "[parameters('agentName')]"
        location   = "[parameters('location')]"
        tags       = "[parameters('tags')]"
        identity = {
          type = "SystemAssigned"
        }
        properties = {}
      }
    ]
    outputs = {
      principalId = {
        type  = "string"
        value = "[reference(resourceId('Microsoft.App/agents', parameters('agentName')), '2025-05-01-preview', 'Full').identity.principalId]"
      }
    }
  })

  parameters_content = jsonencode({
    agentName = { value = "${var.name_prefix}-sreagent" }
    location  = { value = var.location }
    tags      = { value = var.tags }
  })
}

# Assign Contributor role to the Resource Group for Auto-Remediation
resource "azurerm_role_assignment" "sre_agent_contributor" {
  scope                = data.azurerm_resource_group.rg.id
  role_definition_name = "Contributor"
  principal_id         = jsondecode(azurerm_resource_group_template_deployment.sre_agent.output_content).principalId.value
}

# Assign SRE Agent Administrator role to the Admin User (to view/manage the agent in Portal)
resource "azurerm_role_assignment" "sre_agent_admin" {
  scope                = data.azurerm_resource_group.rg.id
  role_definition_name = "SRE Agent Administrator"
  principal_id         = var.admin_user_id
}
