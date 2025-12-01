#############################################
# ECR LIFECYCLE POLICY – BACKEND
#############################################

resource "aws_ecr_lifecycle_policy" "backend_cleanup" {
  repository = "xclarity-backend"

  policy = <<EOF
{
  "rules": [
    {
      "rulePriority": 1,
      "description": "Keep only 1 latest backend image",
      "selection": {
        "tagStatus": "tagged",
        "tagPrefixList": ["latest"],
        "countType": "imageCountMoreThan",
        "countNumber": 1
      },
      "action": {
        "type": "expire"
      }
    }
  ]
}
EOF
}

#############################################
# ECR LIFECYCLE POLICY – FRONTEND
#############################################

resource "aws_ecr_lifecycle_policy" "frontend_cleanup" {
  repository = "xclarity-frontend"

  policy = <<EOF
{
  "rules": [
    {
      "rulePriority": 1,
      "description": "Keep only 1 latest frontend image",
      "selection": {
        "tagStatus": "tagged",
        "tagPrefixList": ["latest"],
        "countType": "imageCountMoreThan",
        "countNumber": 1
      },
      "action": {
        "type": "expire"
      }
    }
  ]
}
EOF
}
