variable "project" {
  type        = string
  description = "Project name prefix"
  default     = "sre-demo"
}

variable "environment" {
  type        = string
  description = "Environment name (e.g., demo, prod)"
  default     = "demo"
}

variable "location" {
  type        = string
  description = "Azure region"
  default     = "southeastasia"
}

variable "tags" {
  type        = map(string)
  description = "Tags for all resources"
  default = {
    Owner       = "SRE-Team"
    Environment = "Demo"
    Project     = "Azure-SRE-Agent-Demo"
  }
}
