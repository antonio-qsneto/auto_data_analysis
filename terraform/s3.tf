locals {
  bucket_name = "xclarity-bucket-server"
}

resource "aws_s3_bucket" "bucket" {
  bucket = local.bucket_name

  tags = {
    Name = var.project_name
    Env  = var.environment
  }
}

# Versioning desativado (novo resource)
resource "aws_s3_bucket_versioning" "bucket_versioning" {
  bucket = aws_s3_bucket.bucket.id
  versioning_configuration {
    status = "Disabled"
  }
}
