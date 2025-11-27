terraform {
  backend "s3" {
    bucket         = "xclarity-bucket-server"             
    key            = "terraform-state/terraform.tfstate" 
    region         = "us-east-1"
    encrypt        = true
    use_lockfile   = true
  }
}
