#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${INFRA_DIR}"

export JSII_SILENCE_WARNING_UNTESTED_NODE_VERSION="${JSII_SILENCE_WARNING_UNTESTED_NODE_VERSION:-1}"
export XDG_CACHE_HOME="${XDG_CACHE_HOME:-/tmp/cdk-cache}"
export JSII_RUNTIME_PACKAGE_CACHE="${JSII_RUNTIME_PACKAGE_CACHE:-/tmp/cdk-jsii-cache}"

if [ ! -x ".venv/bin/python" ]; then
  python3 -m venv .venv
fi

if ! .venv/bin/python -c "import aws_cdk" >/dev/null 2>&1; then
  .venv/bin/pip install -r requirements.txt
fi

exec .venv/bin/python app.py
