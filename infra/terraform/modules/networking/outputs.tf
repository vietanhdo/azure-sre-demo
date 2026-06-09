output "vnet_id" {
  value = azurerm_virtual_network.vnet.id
}

output "aca_subnet_id" {
  value = azurerm_subnet.aca.id
}
