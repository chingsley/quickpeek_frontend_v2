#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=dev-env.sh
source "${SCRIPT_DIR}/dev-env.sh"

INFO_PLIST="${SCRIPT_DIR}/../ios/quickpeek/Info.plist"

if [[ ! -f "${INFO_PLIST}" ]]; then
  echo "[device] Info.plist not found at ${INFO_PLIST}"
  exit 1
fi

if /usr/libexec/PlistBuddy -c "Print :MetroPackagerHost" "${INFO_PLIST}" >/dev/null 2>&1; then
  /usr/libexec/PlistBuddy -c "Set :MetroPackagerHost ${LOCAL_IP}" "${INFO_PLIST}"
else
  /usr/libexec/PlistBuddy -c "Add :MetroPackagerHost string ${LOCAL_IP}" "${INFO_PLIST}"
fi

echo "[device] Embedded Metro packager host: ${LOCAL_IP}"
