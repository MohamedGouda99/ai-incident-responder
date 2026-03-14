variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "secret_id" {
  description = "The ID of the secret"
  type        = string
}

variable "accessor_members" {
  description = "List of IAM members that can access the secret"
  type        = list(string)
  default     = []
}
