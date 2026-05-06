#!/usr/bin/env bash
set -euo pipefail

if ! command -v aws >/dev/null 2>&1; then
  echo "aws CLI not found."
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "docker not found."
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

AWS_REGION="${AWS_REGION:-us-east-1}"
ECR_REPOSITORY_NAME="${1:-auto-data-analysis-dev-backend}"
IMAGE_TAG="${2:-$(git -C "${REPO_ROOT}" rev-parse --short HEAD)}"

ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
ECR_URI="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY_NAME}"

echo "Ensuring repository exists: ${ECR_REPOSITORY_NAME}"
aws ecr describe-repositories \
  --repository-names "${ECR_REPOSITORY_NAME}" \
  --region "${AWS_REGION}" >/dev/null 2>&1 || \
aws ecr create-repository \
  --repository-name "${ECR_REPOSITORY_NAME}" \
  --region "${AWS_REGION}" >/dev/null

echo "Logging into ECR..."
aws ecr get-login-password --region "${AWS_REGION}" | \
  docker login --username AWS --password-stdin "${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

echo "Building backend image..."
docker build -f "${REPO_ROOT}/backend/Dockerfile" -t "${ECR_URI}:${IMAGE_TAG}" "${REPO_ROOT}/backend"

echo "Pushing image ${ECR_URI}:${IMAGE_TAG}"
docker push "${ECR_URI}:${IMAGE_TAG}"

echo "Done."
echo "Image URI: ${ECR_URI}:${IMAGE_TAG}"
