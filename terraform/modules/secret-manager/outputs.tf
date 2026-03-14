output "secret_id" {
  description = "The ID of the secret"
  value       = google_secret_manager_secret.this.id
}

output "secret_name" {
  description = "The resource name of the secret"
  value       = google_secret_manager_secret.this.name
}
