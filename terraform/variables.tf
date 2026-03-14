variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region for Cloud Run deployment"
  type        = string
  default     = "us-central1"
}

variable "openai_model" {
  description = "OpenAI model to use for analysis"
  type        = string
  default     = "gpt-4o-mini"
}

variable "max_instances" {
  description = "Maximum number of Cloud Run instances for the backend"
  type        = number
  default     = 5
}

variable "cors_origins" {
  description = "Allowed CORS origins"
  type        = list(string)
  default     = ["*"]
}
