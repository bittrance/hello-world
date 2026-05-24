output "issuer" {
  description = "Value for the HELLO_WORLD_ISSUER env var"
  value       = "https://cognito-idp.${var.aws_region}.amazonaws.com/${aws_cognito_user_pool.main.id}"
}

output "client_id" {
  description = "OAuth2 client ID"
  value       = aws_cognito_user_pool_client.mcp.id
}

output "client_secret" {
  description = "OAuth2 client secret"
  value       = aws_cognito_user_pool_client.mcp.client_secret
  sensitive   = true
}

output "authorize_url" {
  description = "Authorization endpoint for the hosted UI"
  value       = "https://${var.domain_prefix}.auth.${var.aws_region}.amazoncognito.com/oauth2/authorize"
}

output "token_url" {
  description = "Token endpoint"
  value       = "https://${var.domain_prefix}.auth.${var.aws_region}.amazoncognito.com/oauth2/token"
}
