#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFO_PLIST="${SCRIPT_DIR}/../ios/quickpeek/Info.plist"

if [[ ! -f "${INFO_PLIST}" ]]; then
  echo "[tunnel] Info.plist not found at ${INFO_PLIST}"
  exit 1
fi

set_plist_bool() {
  local key="$1"
  local value="$2"
  if /usr/libexec/PlistBuddy -c "Print :${key}" "${INFO_PLIST}" >/dev/null 2>&1; then
    /usr/libexec/PlistBuddy -c "Set :${key} ${value}" "${INFO_PLIST}"
  else
    /usr/libexec/PlistBuddy -c "Add :${key} bool ${value}" "${INFO_PLIST}"
  fi
}

set_plist_string() {
  local key="$1"
  local value="$2"
  if /usr/libexec/PlistBuddy -c "Print :${key}" "${INFO_PLIST}" >/dev/null 2>&1; then
    /usr/libexec/PlistBuddy -c "Set :${key} ${value}" "${INFO_PLIST}"
  else
    /usr/libexec/PlistBuddy -c "Add :${key} string ${value}" "${INFO_PLIST}"
  fi
}

set_plist_bool "MetroUseLanPackager" "false"
set_plist_string "MetroPackagerHost" "localhost"

echo "[tunnel] Metro packager: tunnel/discovery mode (Fast Refresh over Expo tunnel)."
echo "[tunnel] Rebuild the native app once if you previously built with LAN Metro pinned."
