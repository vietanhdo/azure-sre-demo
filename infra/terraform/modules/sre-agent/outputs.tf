output "agent_principal_id" {
  description = "The Principal ID of the SRE Agent's System Assigned Identity"
  value       = jsondecode(azurerm_resource_group_template_deployment.sre_agent.output_content).principalId.value
}
