variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "eu-north-1"
}

variable "domain_prefix" {
  description = "Cognito hosted UI domain prefix (must be globally unique across all AWS accounts)"
  type        = string
  default     = "express-hello-mcp"
}

variable "mcp_resource_url" {
  description = "Canonical URL of the MCP server, used as the OAuth2 resource identifier and audience"
  type        = string
  default     = "http://localhost:8080/mcp"
}

variable "callback_urls" {
  description = "Allowed redirect URIs for the authorization code flow"
  type        = list(string)
  default     = ["http://localhost:9004/callback"]
}
