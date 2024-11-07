provider "google" {
  region = "us-central1"
}
terraform {
  required_providers {
    google = {
      version = "~> 5.34.0"
    }
    google-beta = {
      version = "~> 5.34.0"
    }
  }
}
