variable "sql_name" {
  type = string
}
variable "database_version" {
  type = string
}
variable "settings" {
  type = object({
    tier = string
  })
}
variable "deletion_protection" {
  type = bool
}
variable "location" {
  type = string
}
variable "project_id" {
  
}
variable "sql_user_name" {
  type        = string
  description = "Username of SQL database"
}

variable "sql_user_pass" {
  type        = string
  description = "Login password of SQL database"
}