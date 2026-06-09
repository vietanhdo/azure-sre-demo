terraform {
  backend "local" {
    path = "terraform.tfstate"
  }

  # For production, use azurerm backend:
  # backend "azurerm" {
  #   resource_group_name  = "rg-terraform-state"
  #   storage_account_name = "sttfstatesredemo"
  #   container_name       = "tfstate"
  #   key                  = "demo.terraform.tfstate"
  # }
}
