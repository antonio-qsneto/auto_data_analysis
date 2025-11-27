output "ec2_public_ip" {
  value       = aws_instance.app.public_ip
  description = "Public IP of EC2 instance (if enabled)"
}

output "ec2_private_ip" {
  value       = aws_instance.app.private_ip
  description = "Private IP of EC2 instance"
}

output "rds_endpoint" {
  value       = aws_db_instance.postgres.endpoint
  description = "RDS Postgres endpoint"
}

output "s3_bucket_name" {
  value = aws_s3_bucket.bucket
}

output "ecr_repo_url" {
  value = aws_ecr_repository.app.repository_url
}
