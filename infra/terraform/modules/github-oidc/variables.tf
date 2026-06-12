# =============================================================================
# Variables for GitHub OIDC Module
# =============================================================================

variable "name_prefix" {
  description = "Name prefix for the App Registration (e.g., 'sre-demo-demo')"
  type        = string
}

variable "github_org" {
  description = "GitHub organization or username (e.g., 'vietanhdo')"
  type        = string

  validation {
    condition     = length(var.github_org) > 0
    error_message = "GitHub org/username must not be empty."
  }
}

variable "github_repo" {
  description = "GitHub repository name (e.g., 'azure-sre-demo')"
  type        = string

  validation {
    condition     = length(var.github_repo) > 0
    error_message = "GitHub repo name must not be empty."
  }
}

variable "resource_group_id" {
  description = "Full Resource Group ID to scope RBAC Contributor role"
  type        = string
}
