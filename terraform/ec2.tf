data "aws_ami" "linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

resource "aws_instance" "app" {
  ami                         = "ami-0ecb62995f68bb549"
  instance_type               = var.ec2_instance_type
  associate_public_ip_address = var.enable_public_ip_ec2
  subnet_id                   = data.aws_subnets.vpc_subnets.ids[0]
  vpc_security_group_ids      = [aws_security_group.ec2_sg.id, aws_security_group.github_actions_deploy_sg.id]
  key_name                    = var.ec2_key_name != "" ? var.ec2_key_name : null
  iam_instance_profile        = aws_iam_instance_profile.ec2_profile.name
  user_data                   = file("user_data.sh")

  root_block_device {
    volume_size = 20        
    volume_type = "gp3"     
    delete_on_termination = true
  }


  tags = {
    Name        = "${var.project_name}-app"
    Env         = var.environment
    Provisioned = "Terraform"
  }
}

