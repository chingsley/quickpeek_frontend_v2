#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=dev-env.sh
source "${SCRIPT_DIR}/dev-env.sh"

DEVICE_BUILD=false
for arg in "$@"; do
  if [[ "${arg}" == "--device" ]]; then
    DEVICE_BUILD=true
    break
  fi
done

if [[ "${DEVICE_BUILD}" == true ]]; then
  echo "[device] Preparing physical device build"
  echo "[device] Your Mac LAN IP: ${LOCAL_IP}"
  echo "[device] Phone and Mac must be on the same Wi-Fi network."
  bash "${SCRIPT_DIR}/ensure-metro.sh"
  bash "${SCRIPT_DIR}/set-metro-packager-host.sh"
fi

exec expo run:ios "$@"
