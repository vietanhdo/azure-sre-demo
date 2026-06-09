variable "project" {
  description = "Project name prefix"
  type        = string
  default     = "sre-demo"

  validation {
    condition     = length(var.project) > 2 && length(var.project) < 20
    error_message = "Project name must be between 3 and 19 characters."
  }
}

variable "environment" {
  description = "Environment name (e.g., demo, prod)"
  type        = string
  default     = "demo"

  validation {
    condition     = contains(["demo", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: demo, staging, prod."
  }
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "southeastasia"

  validation {
    condition     = can(regex("^[a-z]+[a-z0-9]+$", var.location))
    error_message = "Location must be a valid Azure region name (lowercase letters and numbers)."
  }
}

variable "tags" {
  description = "Tags for all resources"
  type        = map(string)
  default = {
    Owner       = "SRE-Team"
    Environment = "Demo"
    Project     = "Azure-SRE-Agent-Demo"
  }
}
