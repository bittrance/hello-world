terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

resource "aws_cognito_user_pool" "main" {
  name = "hello-mcp"

  # Allow self-signup
  admin_create_user_config {
    allow_admin_create_user_only = false
  }

  # Require email verification before the account becomes active
  auto_verified_attributes = ["email"]

  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
  }

  schema {
    attribute_data_type = "String"
    name                = "email"
    required            = true
    mutable             = true
  }

  password_policy {
    minimum_length                   = 8
    require_uppercase                = true
    require_lowercase                = true
    require_numbers                  = true
    require_symbols                  = false
    temporary_password_validity_days = 7
  }
}

# Managed login domain — required for OAuth2 authorize/token endpoints
resource "aws_cognito_user_pool_domain" "main" {
  domain                = var.domain_prefix
  user_pool_id          = aws_cognito_user_pool.main.id
  managed_login_version = 2
}

# Resource server that owns the "greet" scope
resource "aws_cognito_resource_server" "mcp" {
  identifier   = var.mcp_resource_url
  name         = "Hello MCP Server"
  user_pool_id = aws_cognito_user_pool.main.id

  scope {
    scope_name        = "greet"
    scope_description = "Permission to invoke the greet tool"
  }
}

# App client — authorization code flow with PKCE
resource "aws_cognito_user_pool_client" "mcp" {
  name         = "hello-mcp-client"
  user_pool_id = aws_cognito_user_pool.main.id

  generate_secret = true

  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes = [
    "openid",
    "email",
    "${aws_cognito_resource_server.mcp.identifier}/greet",
  ]

  supported_identity_providers = ["COGNITO"]
  callback_urls                = var.callback_urls

  # PKCE is enforced by not allowing implicit grant; clients must send a code_challenge
  explicit_auth_flows = [
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH",
  ]

  depends_on = [aws_cognito_resource_server.mcp]
}

# Managed login branding — logo shown on the login form
resource "aws_cognito_managed_login_branding" "main" {
  user_pool_id = aws_cognito_user_pool.main.id
  client_id    = aws_cognito_user_pool_client.mcp.id

  asset {
    bytes      = filebase64("${path.module}/assets/logo.svg")
    category   = "FORM_LOGO"
    color_mode = "DYNAMIC"
    extension  = "SVG"
  }

  settings = jsonencode({
    components = {
      form = {
        logo = {
          enabled      = true
          position     = "TOP"
          location     = "CENTER"
          formInclusion = "IN"
        }
      }
    }
  })
}
