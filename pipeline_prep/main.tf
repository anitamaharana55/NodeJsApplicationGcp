terraform {
  backend "gcs" {
    bucket = "terraformbackendmysqlapplication"
    prefix = "terraform/gcsstate"
  }
  required_providers {
   azuredevops = {
      source = "microsoft/azuredevops"
      version = ">=0.1.0"
    }
    google = {
      source  = "hashicorp/google"
      version = "4.46.0"
    }
  }
}

resource "google_service_account" "service_account" {
  project = "gcp-cloudrun-nodejs-mysql-app"
  account_id   = "serviceconnectionsrv"
  display_name = "serviceconnectionsrv"
}

resource "google_project_iam_member" "service_account_role" {
  project = "gcp-cloudrun-nodejs-mysql-app"
  role    = "roles/editor"
  member  = "serviceAccount:${google_service_account.service_account.email}"
}

resource "google_project_iam_member" "service_account_storage_admin" {
  project = "gcp-cloudrun-nodejs-mysql-app"
  role    = "roles/storage.admin"
  member  = "serviceAccount:${google_service_account.service_account.email}"
}

resource "google_project_iam_member" "service_account_artifact_registry_migration_admin" {
  project = "gcp-cloudrun-nodejs-mysql-app"
  role    = "roles/artifactregistry.reader"
  member  = "serviceAccount:${google_service_account.service_account.email}"
}

# Generate service account key

resource "google_service_account_key" "keys" {
  service_account_id = google_service_account.service_account.id
}

output "keyoutput" {
  value = google_service_account_key.keys
  sensitive = true
}

output "privatekey" {
  value = base64decode(google_service_account_key.keys.private_key)
  sensitive = true
}


# Azure DevOps Docker Registry Service Connection
resource "azuredevops_serviceendpoint_dockerregistry" "example-other" {
  project_id            = "e69347fe-866a-4751-9eba-a2e02df90481"
  service_endpoint_name = "docker_registery_connection"
  docker_registry       = "https://gcr.io/gcp-cloudrun-nodejs-mysql-app"
  docker_username       = "_json_key"
  docker_password       =  base64decode(google_service_account_key.keys.private_key) #""#file("./service_account_key.json")  #google_service_account_key.keys.private_key  # Pass the content of the JSON key as password
  registry_type         = "Others"
}

module "container_registry" {
  source   = "./modules/Container_Registry"
  for_each = { for i in var.registry_config : i.repository_id => i }
  project  = each.value["project"]
  # location = each.value["location"]
  location      = each.value["location"]
  repository_id = each.value["repository_id"]
  description   = each.value["description"]
  format        = each.value["format"]
}



/* # Azure DevOps GCP Terraform Service Endpoint
resource "azuredevops_serviceendpoint_gcp_terraform" "example" {
  project_id            = "e69347fe-866a-4751-9eba-a2e02df90481"
  token_uri             = "https://oauth2.googleapis.com/token"
  client_email          = google_service_account.service_account.email
  private_key           = google_service_account_key.keys.private_key  # Pass the content of the JSON key as private key
  service_endpoint_name = "gcp_service_connection"
  gcp_project_id        = "gcp-cloudrun-nodejs-mysql-app"
  description           = "Managed by Terraform"
} */
