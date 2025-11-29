data "aws_ami" "linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

resource "aws_instance" "app" {
  ami                         = "ami-0fa3fe0fa7920f68e"
  instance_type               = var.ec2_instance_type
  associate_public_ip_address = var.enable_public_ip_ec2
  subnet_id                   = data.aws_subnets.vpc_subnets.ids[0]
  vpc_security_group_ids      = [aws_security_group.ec2_sg.id]
  key_name                    = var.ec2_key_name != "" ? var.ec2_key_name : null
  iam_instance_profile        = aws_iam_instance_profile.ec2_profile.name
  user_data = file("user_data.sh")

  tags = {
    Name        = "${var.project_name}-app"
    Env         = var.environment
    Provisioned = "Terraform"
  }
}
