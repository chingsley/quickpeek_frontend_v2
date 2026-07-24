#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
# shellcheck source=dev-env.sh
source "${SCRIPT_DIR}/dev-env.sh"

METRO_PORT=8081
METRO_STATUS_URL="http://127.0.0.1:${METRO_PORT}/status"

kill_stale_ngrok() {
  pkill -f "@expo/ngrok" 2>/dev/null || true
  pkill -f "ngrok start --none" 2>/dev/null || true
}

stop_metro_on_port() {
  local pid
  pid="$(lsof -ti:"${METRO_PORT}" 2>/dev/null || true)"
  if [[ -n "${pid}" ]]; then
    echo "Stopping existing Metro on port ${METRO_PORT} (pid ${pid})..."
    kill "${pid}" 2>/dev/null || true
    sleep 1
    pid="$(lsof -ti:"${METRO_PORT}" 2>/dev/null || true)"
    if [[ -n "${pid}" ]]; then
      kill -9 "${pid}" 2>/dev/null || true
      sleep 1
    fi
  fi
}

start_tunnel() {
  cd "${PROJECT_ROOT}"
  # Tunnel mode proxies API traffic through Metro; don't pin a LAN API URL.
  unset EXPO_PUBLIC_API_URL
  npx expo start --tunnel "$@"
}

echo "Preparing Expo tunnel..."
kill_stale_ngrok
stop_metro_on_port

if curl -sf "${METRO_STATUS_URL}" >/dev/null 2>&1; then
  echo "ERROR: Port ${METRO_PORT} is still in use. Stop other Metro/ngrok processes and retry."
  exit 1
fi

attempt=1
max_attempts=3
while [[ "${attempt}" -le "${max_attempts}" ]]; do
  echo "Starting Expo tunnel (attempt ${attempt}/${max_attempts})..."
  if start_tunnel "$@"; then
    exit 0
  fi

  tunnel_exit=$?
  echo "Tunnel attempt ${attempt} failed."
  kill_stale_ngrok
  stop_metro_on_port

  if [[ "${attempt}" -lt "${max_attempts}" ]]; then
    echo "Retrying in 3s..."
    sleep 3
  else
    echo ""
    echo "Expo tunnel failed after ${max_attempts} attempts."
    echo "Common causes:"
    echo "  - Another Metro or ngrok process is still running"
    echo "  - VPN or firewall blocking ngrok"
    echo ""
    echo "Try LAN mode instead: npm start"
    exit "${tunnel_exit}"
  fi

  attempt=$((attempt + 1))
done
