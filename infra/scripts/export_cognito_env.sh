#!/usr/bin/env bash
set -euo pipefail

AWS_REGION="${AWS_REGION:-us-east-1}"
STACK_NAME="${CDK_STACK_NAME:-AutoDataAnalysisStack}"
OUTPUT_FILE=""
FRONTEND_URL_OVERRIDE=""
FORMAT="dotenv"

usage() {
  cat <<'EOF'
Usage:
  export_cognito_env.sh [options]

Options:
  --stack-name NAME       CloudFormation stack name. Default: AutoDataAnalysisStack
  --region REGION         AWS region. Default: us-east-1
  --frontend-url URL      Override frontend URL from stack output.
  --output FILE           Write output to FILE instead of stdout.
  --format dotenv|json    Output format. Default: dotenv
  -h, --help              Show this help.

Examples:
  AWS_REGION=us-east-1 ./scripts/export_cognito_env.sh

  AWS_REGION=us-east-1 ./scripts/export_cognito_env.sh \
    --frontend-url https://main.d1wxfdqkne5owr.amplifyapp.com \
    --output ../frontend/.env.production.local
EOF
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --stack-name)
      STACK_NAME="$2"
      shift 2
      ;;
    --region)
      AWS_REGION="$2"
      shift 2
      ;;
    --frontend-url)
      FRONTEND_URL_OVERRIDE="$2"
      shift 2
      ;;
    --output)
      OUTPUT_FILE="$2"
      shift 2
      ;;
    --format)
      FORMAT="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if ! command -v aws >/dev/null 2>&1; then
  echo "Required command not found: aws" >&2
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "Required command not found: python3" >&2
  exit 1
fi

if [ "$FORMAT" != "dotenv" ] && [ "$FORMAT" != "json" ]; then
  echo "Invalid --format. Use dotenv or json." >&2
  exit 1
fi

outputs_file="$(mktemp)"
pool_file="$(mktemp)"
client_file="$(mktemp)"
env_file="$(mktemp)"
trap 'rm -f "$outputs_file" "$pool_file" "$client_file" "$env_file"' EXIT

aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs" \
  --output json \
  --region "$AWS_REGION" > "$outputs_file"

user_pool_id="$(python3 - "$outputs_file" <<'PY'
import json
import sys
from pathlib import Path

outputs = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
data = {item["OutputKey"]: item["OutputValue"] for item in outputs}
value = data.get("CognitoUserPoolId", "")
if not value:
    print("Missing stack output CognitoUserPoolId", file=sys.stderr)
    sys.exit(1)
print(value)
PY
)"

client_id="$(python3 - "$outputs_file" <<'PY'
import json
import sys
from pathlib import Path

outputs = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
data = {item["OutputKey"]: item["OutputValue"] for item in outputs}
value = data.get("CognitoUserPoolClientId", "")
if not value:
    print("Missing stack output CognitoUserPoolClientId", file=sys.stderr)
    sys.exit(1)
print(value)
PY
)"

aws cognito-idp describe-user-pool \
  --user-pool-id "$user_pool_id" \
  --region "$AWS_REGION" > "$pool_file"

aws cognito-idp describe-user-pool-client \
  --user-pool-id "$user_pool_id" \
  --client-id "$client_id" \
  --region "$AWS_REGION" > "$client_file"

python3 - \
  "$outputs_file" \
  "$pool_file" \
  "$client_file" \
  "$AWS_REGION" \
  "$FRONTEND_URL_OVERRIDE" \
  "$FORMAT" > "$env_file" <<'PY'
import json
import sys
from pathlib import Path

outputs = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
pool = json.loads(Path(sys.argv[2]).read_text(encoding="utf-8"))["UserPool"]
client = json.loads(Path(sys.argv[3]).read_text(encoding="utf-8"))["UserPoolClient"]
region = sys.argv[4]
frontend_url_override = sys.argv[5].rstrip("/")
output_format = sys.argv[6]

stack = {item["OutputKey"]: item["OutputValue"] for item in outputs}


def required(key: str) -> str:
    value = stack.get(key, "")
    if not value:
        raise SystemExit(f"Missing stack output {key}")
    return value


def first_output(*keys: str) -> str:
    for key in keys:
        value = stack.get(key, "")
        if value:
            return value
    raise SystemExit(f"Missing stack output {' or '.join(keys)}")


def dotenv_value(value: str) -> str:
    text = str(value)
    if not text:
        return '""'
    if any(char.isspace() for char in text) or any(char in text for char in ['"', "'", "#", "="]):
        return '"' + text.replace("\\", "\\\\").replace('"', '\\"') + '"'
    return text


frontend_url = frontend_url_override or required("AmplifyBranchUrl").rstrip("/")
api_base_url = required("ApiBaseUrl")
managed_login_domain = first_output("CognitoManagedLoginDomain", "CognitoHostedUiDomain").rstrip("/")
managed_login_version = stack.get("CognitoManagedLoginVersion", "NEWER_MANAGED_LOGIN")
user_pool_id = required("CognitoUserPoolId")
client_id = required("CognitoUserPoolClientId")
issuer = stack.get("CognitoIssuer") or f"https://cognito-idp.{region}.amazonaws.com/{user_pool_id}"
callback_urls = client.get("CallbackURLs") or [f"{frontend_url}/auth/callback"]
logout_urls = client.get("LogoutURLs") or [f"{frontend_url}/login"]
scopes = client.get("AllowedOAuthScopes") or ["openid", "email", "profile", "aws.cognito.signin.user.admin"]
providers = client.get("SupportedIdentityProviders") or []

data = {
    "APP_ENV": "prod",
    "AWS_REGION": region,
    "AUTH_MODE": "cognito",
    "FRONTEND_URL": frontend_url,
    "AMPLIFY_APP_ID": stack.get("AmplifyAppId", ""),
    "AMPLIFY_BRANCH": stack.get("AmplifyBranchName", ""),
    "AMPLIFY_DEFAULT_DOMAIN": stack.get("AmplifyDefaultDomain", ""),
    "API_BASE_URL": api_base_url,
    "COGNITO_REGION": region,
    "COGNITO_USER_POOL_ID": user_pool_id,
    "COGNITO_USER_POOL_NAME": pool.get("Name", ""),
    "COGNITO_USER_POOL_ARN": pool.get("Arn", ""),
    "COGNITO_APP_CLIENT_ID": client_id,
    "COGNITO_APP_CLIENT_NAME": client.get("ClientName", ""),
    "COGNITO_ISSUER": issuer,
    "COGNITO_JWKS_URL": f"{issuer}/.well-known/jwks.json",
    "COGNITO_MANAGED_LOGIN_DOMAIN": managed_login_domain,
    "COGNITO_MANAGED_LOGIN_VERSION": managed_login_version,
    "COGNITO_CALLBACK_URLS": ",".join(callback_urls),
    "COGNITO_LOGOUT_URLS": ",".join(logout_urls),
    "COGNITO_SCOPES": " ".join(scopes),
    "COGNITO_IDENTITY_PROVIDERS": ",".join(providers),
    "VITE_AUTH_MODE": "cognito",
    "VITE_API_BASE_URL": api_base_url,
    "VITE_COGNITO_DOMAIN": managed_login_domain,
    "VITE_COGNITO_MANAGED_LOGIN_VERSION": managed_login_version,
    "VITE_COGNITO_USER_POOL_ID": user_pool_id,
    "VITE_COGNITO_USER_POOL_CLIENT_ID": client_id,
    "VITE_COGNITO_REDIRECT_URI": f"{frontend_url}/auth/callback",
    "VITE_COGNITO_LOGOUT_URI": f"{frontend_url}/login",
    "VITE_COGNITO_SCOPES": " ".join(scopes),
}

if output_format == "json":
    print(json.dumps(data, indent=2, sort_keys=True))
else:
    for key, value in data.items():
        print(f"{key}={dotenv_value(value)}")
PY

if [ -n "$OUTPUT_FILE" ]; then
  mkdir -p "$(dirname "$OUTPUT_FILE")"
  cp "$env_file" "$OUTPUT_FILE"
  echo "Wrote Cognito/frontend env to $OUTPUT_FILE"
else
  cat "$env_file"
fi
