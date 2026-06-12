variable "name_prefix" {
  description = "Prefix for all resources"
  type        = string
}

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}

variable "admin_user_id" {
  description = "The Object ID of the user who will administer the SRE Agent"
  type        = string
}
