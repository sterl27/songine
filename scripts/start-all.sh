#!/usr/bin/env bash
set -euo pipefail

find_listening_pids() {
  local port="$1"
  ss -ltnp "( sport = :${port} )" 2>/dev/null \
    | sed -n 's/.*pid=\([0-9]\+\).*/\1/p' \
    | sort -u
}

free_port_if_needed() {
  local port="$1"
  local pids
  pids="$(find_listening_pids "${port}")"

  if [[ -n "${pids}" ]]; then
    echo "[start:all] Releasing port ${port} from PID(s): ${pids//$'\n'/, }"
    # shellcheck disable=SC2086
    kill ${pids} 2>/dev/null || true
  fi
}

free_port_if_needed 8000
free_port_if_needed 3000
free_port_if_needed 3001

echo "[start:all] Starting backend..."
pnpm backend:dev &
BACKEND_PID=$!

echo "[start:all] Starting frontend..."
pnpm dev:frontend &
FRONTEND_PID=$!

cleanup() {
  echo "[start:all] Shutting down..."
  kill "${BACKEND_PID}" "${FRONTEND_PID}" 2>/dev/null || true
}

trap cleanup INT TERM EXIT

wait -n "${BACKEND_PID}" "${FRONTEND_PID}"
