terraform {
  required_version = ">= 1.5.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }

  backend "gcs" {
    bucket = "incident-responder-tfstate"
    prefix = "terraform/state"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# ─── Enable Required GCP APIs ────────────────────────────────────────────────

module "apis" {
  source = "./modules/apis"

  project_id = var.project_id
  apis = [
    "run.googleapis.com",
    "containerregistry.googleapis.com",
    "artifactregistry.googleapis.com",
    "cloudbuild.googleapis.com",
    "secretmanager.googleapis.com",
  ]
}

# ─── IAM: Backend Service Account ────────────────────────────────────────────

module "backend_sa" {
  source = "./modules/iam"

  project_id   = var.project_id
  account_id   = "incident-responder-backend"
  display_name = "AI Incident Responder Backend"
  roles = [
    "roles/logging.logWriter",
    "roles/cloudtrace.agent",
  ]

  depends_on = [module.apis]
}

# ─── Secret Manager: OpenAI API Key ──────────────────────────────────────────

module "openai_secret" {
  source = "./modules/secret-manager"

  project_id = var.project_id
  secret_id  = "openai-api-key"
  accessor_members = [
    "serviceAccount:${module.backend_sa.service_account_email}",
  ]

  depends_on = [module.apis, module.backend_sa]
}

# ─── Cloud Run: Backend Service ───────────────────────────────────────────────

module "backend" {
  source = "./modules/cloud-run"

  project_id   = var.project_id
  region       = var.region
  service_name = "incident-responder-backend"
  image        = "${var.region}-docker.pkg.dev/${var.project_id}/incident-responder/backend:latest"

  container_port        = 8000
  service_account_email = module.backend_sa.service_account_email
  min_instances         = 0
  max_instances         = var.max_instances
  cpu                   = "1"
  memory                = "1Gi"
  allow_unauthenticated = true

  env_vars = {
    OPENAI_MODEL = var.openai_model
    CORS_ORIGINS = jsonencode(var.cors_origins)
  }

  secret_env_vars = {
    OPENAI_API_KEY = {
      secret_id = module.openai_secret.secret_id
      version   = "latest"
    }
  }

  depends_on = [module.apis, module.openai_secret]
}

# ─── Cloud Run: Frontend Service ──────────────────────────────────────────────

module "frontend" {
  source = "./modules/cloud-run"

  project_id   = var.project_id
  region       = var.region
  service_name = "incident-responder-frontend"
  image        = "${var.region}-docker.pkg.dev/${var.project_id}/incident-responder/frontend:latest"

  container_port        = 80
  min_instances         = 0
  max_instances         = 3
  cpu                   = "1"
  memory                = "256Mi"
  allow_unauthenticated = true

  depends_on = [module.apis]
}
