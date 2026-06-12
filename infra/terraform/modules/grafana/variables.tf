variable "resource_group_name" { type = string }
variable "location" { type = string }
variable "name_prefix" { type = string }
variable "law_id" { type = string }
variable "tags" {
  type = map(string)
}

variable "admin_user_id" {
  type        = string
  description = "The Object ID of the admin user to be assigned Grafana Admin role"
}
