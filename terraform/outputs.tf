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

output "ecr_repo_urls" {
  value = {
    frontend = aws_ecr_repository.frontend.repository_url
    backend  = aws_ecr_repository.backend.repository_url
  }
}

output "deploy_sg_id" {
  value = aws_security_group.github_actions_deploy_sg.id
}
