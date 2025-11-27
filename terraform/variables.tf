variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "xclarity"
  type        = string
  default     = "xclarity"
}

variable "vpc_id" {
  description = "If you want to provide an existing VPC id; leave empty to use default VPC"
  type        = string
  default     = ""
}

variable "allowed_ssh_cidr" {
  description = "CIDR allowed to ssh (your IP/32)"
  type        = string
  default     = "201.43.99.51/32" # **troque** para seu IP/32 em produção
}

variable "ec2_instance_type" {
  description = "EC2 instance type (free-tier eligible: t3.micro / t2.micro)"
  type        = string
  default     = "t3.micro"
}

variable "ec2_key_name" {
  description = "Name of an existing EC2 Key Pair for SSH access"
  type        = string
  default     = ""
}

variable "ssh_public_port" {
  type    = number
  default = 22
}

variable "postgres_username" {
  type    = string
  default = "xclarity_user"
}

variable "postgres_password" {
  type      = string
  default   = "change_me_postgres_password" # substitua em terraform.tfvars
  sensitive = true
}

variable "postgres_db_name" {
  type    = string
  default = "xclarity_db"
}

variable "rds_instance_class" {
  type    = string
  default = "db.t4g.micro"
}

variable "rds_allocated_storage" {
  type    = number
  default = 20
}

variable "s3_bucket_name" {
  type    = string
  default = "" # se vazio, geraremos um nome com prefix + random
}

variable "enable_public_ip_ec2" {
  type    = bool
  default = true
}

variable "environment" {
  type    = string
  default = "dev"
}
