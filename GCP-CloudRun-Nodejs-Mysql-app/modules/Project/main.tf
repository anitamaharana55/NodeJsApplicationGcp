resource "google_project" "my_project" {
  name       = var.name
  project_id = var.project_id
  org_id     = var.org_id
  auto_create_network = false
count = var.enable_network ? 1 : 0

}