#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
REPO_ROOT="$(cd "${INFRA_DIR}/.." && pwd)"
FRONTEND_DIR="${REPO_ROOT}/frontend"

APP_ENV="${APP_ENV:-dev}"
AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-${AWS_REGION}}"
PROJECT_NAME="${PROJECT_NAME:-auto-data-analysis}"
ENVIRONMENT_NAME="${ENVIRONMENT_NAME:-${APP_ENV}}"
STACK_NAME="${CDK_STACK_NAME:-AutoDataAnalysisStack}"
AMPLIFY_BRANCH="${AMPLIFY_BRANCH:-}"
FRONTEND_URL="${FRONTEND_URL:-}"
EXISTING_AMPLIFY_APP_ID="${AMPLIFY_APP_ID:-}"
EXISTING_AMPLIFY_DEFAULT_DOMAIN="${AMPLIFY_DEFAULT_DOMAIN:-}"
SECRET_NAME="${APP_SECRET_NAME:-${PROJECT_NAME}/${APP_ENV}/app}"
SECRETS_FILE="${APP_SECRETS_FILE:-${INFRA_DIR}/secrets/${APP_ENV}.env}"
FRONTEND_ONLY="${FRONTEND_ONLY:-false}"
FRONTEND_BUILD_RUNTIME="${FRONTEND_BUILD_RUNTIME:-docker}"

export APP_ENV AWS_REGION AWS_DEFAULT_REGION
export JSII_SILENCE_WARNING_UNTESTED_NODE_VERSION="${JSII_SILENCE_WARNING_UNTESTED_NODE_VERSION:-1}"
export XDG_CACHE_HOME="${XDG_CACHE_HOME:-/tmp/cdk-cache}"
export JSII_RUNTIME_PACKAGE_CACHE="${JSII_RUNTIME_PACKAGE_CACHE:-/tmp/cdk-jsii-cache}"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Required command not found: $1" >&2
    exit 1
  fi
}

setup_python_env() {
  cd "${INFRA_DIR}"
  python3 -m venv .venv
  # shellcheck disable=SC1091
  source .venv/bin/activate
  pip install -r requirements.txt
}

build_secret_json() {
  python3 - "$SECRETS_FILE" <<'PY'
import json
import sys
from pathlib import Path

path = Path(sys.argv[1])
if not path.exists():
    print(f"Secrets file not found: {path}", file=sys.stderr)
    sys.exit(1)

fields = [
    "DJANGO_SECRET_KEY",
    "GOOGLE_API_KEY",
    "OPENAI_API_KEY",
    "OPENROUTER_API_KEY",
    "EMAIL_HOST_USER",
    "EMAIL_HOST_PASSWORD",
    "DEFAULT_FROM_EMAIL",
]
required = ["DJANGO_SECRET_KEY", "GOOGLE_API_KEY"]
values: dict[str, str] = {}

for raw_line in path.read_text(encoding="utf-8").splitlines():
    line = raw_line.strip()
    if not line or line.startswith("#"):
        continue
    if line.startswith("export "):
        line = line[len("export "):].strip()
    if "=" not in line:
        continue
    key, value = line.split("=", 1)
    key = key.strip()
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
        value = value[1:-1]
    if key in fields:
        values[key] = value

missing = [key for key in required if not values.get(key)]
if missing:
    print(f"Missing required secret values: {', '.join(missing)}", file=sys.stderr)
    sys.exit(1)

print(json.dumps({key: values.get(key, "") for key in fields}, separators=(",", ":")))
PY
}

upsert_app_secret() {
  local secret_json_file="$1"

  if aws secretsmanager describe-secret \
    --secret-id "${SECRET_NAME}" \
    --region "${AWS_REGION}" >/dev/null 2>&1; then
    echo "Updating Secrets Manager secret: ${SECRET_NAME}" >&2
    aws secretsmanager update-secret \
      --secret-id "${SECRET_NAME}" \
      --secret-string "file://${secret_json_file}" \
      --region "${AWS_REGION}" >/dev/null
  else
    echo "Creating Secrets Manager secret: ${SECRET_NAME}" >&2
    aws secretsmanager create-secret \
      --name "${SECRET_NAME}" \
      --secret-string "file://${secret_json_file}" \
      --region "${AWS_REGION}" >/dev/null
  fi

  aws secretsmanager describe-secret \
    --secret-id "${SECRET_NAME}" \
    --query ARN \
    --output text \
    --region "${AWS_REGION}"
}

read_stack_output() {
  local outputs_file="$1"
  local output_key="$2"

  python3 - "$outputs_file" "$STACK_NAME" "$output_key" <<'PY'
import json
import sys
from pathlib import Path

outputs_file = Path(sys.argv[1])
stack_name = sys.argv[2]
output_key = sys.argv[3]
data = json.loads(outputs_file.read_text(encoding="utf-8"))
value = data.get(stack_name, {}).get(output_key)
if not value:
    print(f"Missing CDK output {output_key}", file=sys.stderr)
    sys.exit(1)
print(value)
PY
}

read_stack_output_optional() {
  local outputs_file="$1"
  local output_key="$2"

  python3 - "$outputs_file" "$STACK_NAME" "$output_key" <<'PY'
import json
import sys
from pathlib import Path

outputs_file = Path(sys.argv[1])
stack_name = sys.argv[2]
output_key = sys.argv[3]
data = json.loads(outputs_file.read_text(encoding="utf-8"))
print(data.get(stack_name, {}).get(output_key, ""))
PY
}

read_stack_output_first() {
  local outputs_file="$1"
  shift

  local value
  for output_key in "$@"; do
    value="$(read_stack_output_optional "$outputs_file" "$output_key")"
    if [ -n "$value" ]; then
      echo "$value"
      return 0
    fi
  done

  echo "Missing CDK output. Tried: $*" >&2
  exit 1
}

fetch_stack_outputs() {
  local outputs_file="$1"
  local raw_outputs_file
  raw_outputs_file="$(mktemp)"
  aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}" \
    --query "Stacks[0].Outputs" \
    --output json \
    --region "${AWS_REGION}" > "$raw_outputs_file"
  python3 - "$STACK_NAME" "$raw_outputs_file" > "$outputs_file" <<'PY'
import json
import sys
from pathlib import Path

stack_name = sys.argv[1]
outputs = json.loads(Path(sys.argv[2]).read_text(encoding="utf-8"))
print(json.dumps({stack_name: {item["OutputKey"]: item["OutputValue"] for item in outputs}}))
PY
  rm -f "$raw_outputs_file"
}

zip_frontend_dist() {
  local output_zip="$1"
  local build_dir="${2:-$FRONTEND_DIR}"
  python3 - "$build_dir/dist" "$output_zip" <<'PY'
import sys
import zipfile
from pathlib import Path

dist_dir = Path(sys.argv[1])
zip_path = Path(sys.argv[2])
if not dist_dir.exists():
    print(f"Frontend dist not found: {dist_dir}", file=sys.stderr)
    sys.exit(1)

with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as archive:
    for path in dist_dir.rglob("*"):
        if path.is_file():
            archive.write(path, path.relative_to(dist_dir))
PY
}

build_amplify_env_json() {
  local dotenv_file="$1"
  local output_json="$2"
  python3 - "$dotenv_file" "$output_json" <<'PY'
import json
import sys
from pathlib import Path

dotenv_path = Path(sys.argv[1])
output_path = Path(sys.argv[2])
values: dict[str, str] = {}

for raw_line in dotenv_path.read_text(encoding="utf-8").splitlines():
    line = raw_line.strip()
    if not line or line.startswith("#") or "=" not in line:
        continue
    key, value = line.split("=", 1)
    key = key.strip()
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
        value = value[1:-1].replace('\\"', '"').replace("\\\\", "\\")
    if key.startswith("VITE_") or key in {"APP_ENV", "FRONTEND_URL"}:
        values[key] = value

output_path.write_text(json.dumps(values, separators=(",", ":")), encoding="utf-8")
PY
}

amplify_repository_url() {
  local app_id="$1"
  aws amplify get-app \
    --app-id "$app_id" \
    --query "app.repository" \
    --output text \
    --region "$AWS_REGION" 2>/dev/null || true
}

prepare_frontend_build_dir() {
  local build_dir="$1"
  python3 - "$FRONTEND_DIR" "$build_dir" <<'PY'
import shutil
import sys
from pathlib import Path

source_dir = Path(sys.argv[1])
target_dir = Path(sys.argv[2])
ignored_names = {"node_modules", ".vite", "dist", ".git"}


def ignore(_directory, names):
    return {name for name in names if name in ignored_names}


for item in source_dir.iterdir():
    if item.name in ignored_names:
        continue
    target = target_dir / item.name
    if item.is_dir():
        shutil.copytree(item, target, ignore=ignore)
    else:
        shutil.copy2(item, target)
PY
}

parse_amplify_url() {
  python3 - "$FRONTEND_URL" <<'PY'
import sys
from urllib.parse import urlparse

url = sys.argv[1]
if not url:
    sys.exit(0)

host = urlparse(url).netloc
parts = host.split(".")
if len(parts) >= 3 and parts[-2:] == ["amplifyapp", "com"]:
    branch = parts[0]
    app_id = parts[1]
    default_domain = ".".join(parts[1:])
    print(f"{branch} {app_id} {default_domain}")
PY
}

run_frontend_build() {
  local build_dir="$1"

  if [ "$FRONTEND_BUILD_RUNTIME" = "docker" ]; then
    mkdir -p "$build_dir/.home"
    docker run --rm \
      --user "$(id -u):$(id -g)" \
      -e HOME=/app/.home \
      -v "$build_dir:/app" \
      -w /app \
      node:22-alpine \
      sh -lc "npm ci --cache /app/.npm-cache --no-audit --fund=false --update-notifier=false && npm run build -- --emptyOutDir --logLevel info"
    return
  fi

  if [ "$FRONTEND_BUILD_RUNTIME" != "local" ]; then
    echo "Invalid FRONTEND_BUILD_RUNTIME. Use docker or local." >&2
    exit 1
  fi

  npm ci \
    --cache "${build_dir}/.npm-cache" \
    --no-audit \
    --fund=false \
    --update-notifier=false
  npm run build -- --emptyOutDir --logLevel info
}

require_command aws
require_command docker
require_command npx
require_command python3

setup_python_env

if [ "${APP_ENV}" != "prod" ]; then
  cd "${INFRA_DIR}"
  npx cdk synth \
    -c app_env="${APP_ENV}" \
    -c environment_name="${ENVIRONMENT_NAME}"
  npx cdk deploy "${STACK_NAME}" \
    --require-approval never \
    -c app_env="${APP_ENV}" \
    -c environment_name="${ENVIRONMENT_NAME}"
  exit 0
fi

require_command curl

if [ -n "${FRONTEND_URL}" ]; then
  parsed_amplify="$(parse_amplify_url || true)"
  if [ -n "${parsed_amplify}" ]; then
    read -r parsed_branch parsed_app_id parsed_default_domain <<< "${parsed_amplify}"
    AMPLIFY_BRANCH="${AMPLIFY_BRANCH:-${parsed_branch}}"
    EXISTING_AMPLIFY_APP_ID="${EXISTING_AMPLIFY_APP_ID:-${parsed_app_id}}"
    EXISTING_AMPLIFY_DEFAULT_DOMAIN="${EXISTING_AMPLIFY_DEFAULT_DOMAIN:-${parsed_default_domain}}"
  fi
fi
AMPLIFY_BRANCH="${AMPLIFY_BRANCH:-${APP_ENV}}"

if [ -n "${FRONTEND_URL}" ] && [ -z "${EXISTING_AMPLIFY_APP_ID}" ]; then
  echo "FRONTEND_URL was provided, but Amplify app id could not be inferred." >&2
  echo "Set AMPLIFY_APP_ID and AMPLIFY_BRANCH, or use an amplifyapp.com URL." >&2
  exit 1
fi

echo "Validating AWS identity and CDK bootstrap in ${AWS_REGION}"
aws sts get-caller-identity --region "${AWS_REGION}" >/dev/null
aws cloudformation describe-stacks \
  --stack-name CDKToolkit \
  --region "${AWS_REGION}" >/dev/null

secret_json="$(mktemp)"
outputs_file="$(mktemp)"
dist_zip="$(mktemp --suffix=.zip)"
deployment_file="$(mktemp)"
amplify_env_json="$(mktemp --suffix=.json)"
frontend_build_dir="$(mktemp -d)"
trap 'rm -f "$secret_json" "$outputs_file" "$dist_zip" "$deployment_file" "$amplify_env_json"; rm -rf "$frontend_build_dir"' EXIT

if [ "${FRONTEND_ONLY}" = "true" ]; then
  echo "Skipping CDK deploy and reading outputs from existing stack ${STACK_NAME}"
  fetch_stack_outputs "$outputs_file"
else
  build_secret_json > "$secret_json"
  app_secret_arn="$(upsert_app_secret "$secret_json")"

  cd "${INFRA_DIR}"
  echo "Deploying CDK stack ${STACK_NAME} for APP_ENV=prod"
  cdk_frontend_context=()
  if [ -n "${FRONTEND_URL}" ]; then
    cdk_frontend_context+=(
      -c "frontend_url=${FRONTEND_URL%/}"
      -c "cors_allowed_origins=${FRONTEND_URL%/}"
      -c "cognito_callback_urls=${FRONTEND_URL%/}/auth/callback"
      -c "cognito_logout_urls=${FRONTEND_URL%/}/login"
    )
  fi
  if [ -n "${EXISTING_AMPLIFY_APP_ID}" ]; then
    cdk_frontend_context+=(
      -c "existing_amplify_app_id=${EXISTING_AMPLIFY_APP_ID}"
      -c "existing_amplify_default_domain=${EXISTING_AMPLIFY_DEFAULT_DOMAIN}"
    )
  fi

  npx cdk deploy "${STACK_NAME}" \
    --require-approval never \
    --outputs-file "${outputs_file}" \
    -c app_env=prod \
    -c environment_name=prod \
    -c project_name="${PROJECT_NAME}" \
    -c app_secret_arn="${app_secret_arn}" \
    -c create_s3_bucket=true \
    -c db_deletion_protection=true \
    -c db_multi_az=false \
    -c django_debug=false \
    -c auth_mode=cognito \
    -c secure_ssl_redirect=false \
    -c web_desired_count=1 \
    -c worker_desired_count=1 \
    -c amplify_branch_name="${AMPLIFY_BRANCH}" \
    "${cdk_frontend_context[@]}"
fi

amplify_app_id="$(read_stack_output "$outputs_file" AmplifyAppId)"
frontend_url="$(read_stack_output "$outputs_file" AmplifyBranchUrl)"
api_base_url="$(read_stack_output "$outputs_file" ApiBaseUrl)"
cognito_domain="$(read_stack_output_first "$outputs_file" CognitoManagedLoginDomain CognitoHostedUiDomain)"
cognito_client_id="$(read_stack_output "$outputs_file" CognitoUserPoolClientId)"

echo "Building frontend for ${frontend_url}"
prepare_frontend_build_dir "$frontend_build_dir"
"${SCRIPT_DIR}/export_cognito_env.sh" \
  --stack-name "${STACK_NAME}" \
  --region "${AWS_REGION}" \
  --frontend-url "${frontend_url}" \
  --output "${frontend_build_dir}/.env.production.local"

repository_url="$(amplify_repository_url "$amplify_app_id")"
if [ -n "$repository_url" ] && [ "$repository_url" != "None" ]; then
  echo "Amplify app ${amplify_app_id} is connected to a repository."
  echo "Updating branch environment variables and starting a RELEASE job instead of uploading dist."
  build_amplify_env_json "${frontend_build_dir}/.env.production.local" "$amplify_env_json"
  aws amplify update-branch \
    --app-id "$amplify_app_id" \
    --branch-name "$AMPLIFY_BRANCH" \
    --environment-variables "file://${amplify_env_json}" \
    --region "$AWS_REGION" >/dev/null
  aws amplify start-job \
    --app-id "$amplify_app_id" \
    --branch-name "$AMPLIFY_BRANCH" \
    --job-type RELEASE \
    --region "$AWS_REGION" >/dev/null
  cat <<EOF
Deploy started from connected Amplify repository.
Frontend: ${frontend_url}
API: ${api_base_url}
Cognito: ${cognito_domain}
EOF
  exit 0
fi

cd "${frontend_build_dir}"
if [ "$FRONTEND_BUILD_RUNTIME" = "local" ]; then
  require_command npm
fi
run_frontend_build "$frontend_build_dir"

zip_frontend_dist "$dist_zip" "$frontend_build_dir"

echo "Uploading frontend dist to Amplify app ${amplify_app_id}, branch ${AMPLIFY_BRANCH}"
aws amplify create-deployment \
  --app-id "${amplify_app_id}" \
  --branch-name "${AMPLIFY_BRANCH}" \
  --region "${AWS_REGION}" > "$deployment_file"

job_id="$(python3 - "$deployment_file" <<'PY'
import json
import sys
print(json.load(open(sys.argv[1], encoding="utf-8"))["jobId"])
PY
)"
zip_upload_url="$(python3 - "$deployment_file" <<'PY'
import json
import sys
print(json.load(open(sys.argv[1], encoding="utf-8"))["zipUploadUrl"])
PY
)"

curl --fail --silent --show-error \
  -X PUT \
  -H "Content-Type: application/zip" \
  --upload-file "$dist_zip" \
  "$zip_upload_url" >/dev/null

aws amplify start-deployment \
  --app-id "${amplify_app_id}" \
  --branch-name "${AMPLIFY_BRANCH}" \
  --job-id "${job_id}" \
  --region "${AWS_REGION}" >/dev/null

cat <<EOF
Deploy started.
Frontend: ${frontend_url}
API: ${api_base_url}
Cognito: ${cognito_domain}
EOF
