resource "google_sql_database_instance" "instance" {
    project      = var.project_id
  name             = var.sql_name
  region           = var.location
  database_version = var.database_version
  settings {
    tier = var.settings.tier
          backup_configuration {
      enabled = true
      binary_log_enabled = true
      
    }
      ip_configuration {
        ssl_mode = "ENCRYPTED_ONLY"
    }

}

  deletion_protection  = var.deletion_protection
}
resource "google_sql_user" "myuser" {
        project      = var.project_id
  name     = var.sql_user_name
  password = var.sql_user_pass
  instance = google_sql_database_instance.instance.name
}