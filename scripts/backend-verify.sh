#!/usr/bin/env bash

set -euo pipefail

cd "$(dirname "$0")/../backend"

if [[ ! -d "venv" ]]; then
  echo "Backend verification failed: backend/venv is missing."
  echo "Run: pnpm backend:install"
  exit 1
fi

source venv/bin/activate

python3 - <<'PY'
import importlib.util
import sys

required = ("fastapi", "uvicorn")
missing = [name for name in required if importlib.util.find_spec(name) is None]

if missing:
    print("Backend verification failed: missing Python packages: " + ", ".join(missing))
    print("Run: pnpm backend:install")
    sys.exit(1)

print("Backend OK")
PY
