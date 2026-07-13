#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
# shellcheck source=dev-env.sh
source "${SCRIPT_DIR}/dev-env.sh"

METRO_STATUS_URL="http://127.0.0.1:8081/status"
METRO_LOG="${PROJECT_ROOT}/.metro-device.log"

metro_is_running() {
  curl -sf "${METRO_STATUS_URL}" >/dev/null 2>&1
}

wait_for_metro() {
  local attempt
  for attempt in $(seq 1 45); do
    if metro_is_running; then
      return 0
    fi
    sleep 1
  done
  return 1
}

if metro_is_running; then
  echo "[device] Metro is already running on port 8081"
  exit 0
fi

echo "[device] Metro is not running. Starting LAN dev server at ${LOCAL_IP}:8081 ..."
cd "${PROJECT_ROOT}"

nohup env REACT_NATIVE_PACKAGER_HOSTNAME="${LOCAL_IP}" \
  EXPO_PUBLIC_API_URL="http://${LOCAL_IP}:8081" \
  npx expo start --lan >"${METRO_LOG}" 2>&1 &

if ! wait_for_metro; then
  echo "[device] Metro failed to start. Recent logs:"
  tail -n 40 "${METRO_LOG}" || true
  exit 1
fi

echo "[device] Metro is ready at http://${LOCAL_IP}:8081"
