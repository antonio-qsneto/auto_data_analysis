resource "aws_ecr_repository" "frontend" {
  name = "${var.project_name}-frontend"

  image_scanning_configuration {
    scan_on_push = false
  }

  tags = {
    env = var.environment
  }
}

resource "aws_ecr_repository" "backend" {
  name = "${var.project_name}-backend"

  image_scanning_configuration {
    scan_on_push = false
  }

  tags = {
    env = var.environment
  }
}

# Opcional mas útil: output das URLs para o pipeline
output "ecr_frontend_url" {
  value = aws_ecr_repository.frontend.repository_url
}

output "ecr_backend_url" {
  value = aws_ecr_repository.backend.repository_url
}



# IAM policy for EC2 instance to access entire S3 bucket except terraform-state/
data "aws_iam_policy_document" "ec2_policy" {

  # ============================================================
  # 1) NEGAR acesso ao prefixo do Terraform (proteção do estado)
  # ============================================================
  statement {
    sid     = "DenyTerraformStateAccess"
    effect  = "Deny"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:ListBucket"
    ]
    resources = [
      "arn:aws:s3:::xclarity-bucket-server/terraform-state/*",
      "arn:aws:s3:::xclarity-bucket-server"
    ]

    # Condição: restringe o DENY apenas ao prefixo terraform-state/*
    condition {
      test     = "StringLike"
      variable = "s3:prefix"
      values   = ["terraform-state/*"]
    }
  }

  # ============================================================
  # 2) PERMITIR acesso completo a todos os outros objetos
  # ============================================================
  statement {
    sid = "AllowS3FullBucketAccess"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:ListBucket"
    ]
    resources = [
      "arn:aws:s3:::xclarity-bucket-server",
      "arn:aws:s3:::xclarity-bucket-server/*"
    ]
  }

  # ============================================================
  # 3) ECR pull
  # ============================================================
  statement {
    sid = "AllowECRPull"
    actions = [
      "ecr:GetAuthorizationToken",
      "ecr:BatchCheckLayerAvailability",
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchGetImage"
    ]
    resources = ["*"]
  }

  # ============================================================
  # 4) CloudWatch Logs
  # ============================================================
  statement {
    sid = "AllowLogs"
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:CreateLogGroup"
    ]
    resources = ["arn:aws:logs:*:*:*"]
  }
}

resource "aws_iam_policy" "ec2_policy" {
  name   = "${var.project_name}-ec2-policy"
  policy = data.aws_iam_policy_document.ec2_policy.json
}

data "aws_iam_policy_document" "ec2_assume_role" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "ec2_role" {
  name               = "${var.project_name}-ec2-role"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume_role.json
}

resource "aws_iam_role_policy_attachment" "ec2_policy_attach" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.ec2_policy.arn
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.project_name}-instance-profile"
  role = aws_iam_role.ec2_role.name
}
