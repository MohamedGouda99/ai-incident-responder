output "backend_url" {
  description = "Backend Cloud Run service URL"
  value       = module.backend.service_url
}

output "frontend_url" {
  description = "Frontend Cloud Run service URL"
  value       = module.frontend.service_url
}

output "backend_service_account" {
  description = "Backend service account email"
  value       = module.backend_sa.service_account_email
}

output "openai_secret_id" {
  description = "Secret Manager secret ID for OpenAI API key"
  value       = module.openai_secret.secret_id
}
