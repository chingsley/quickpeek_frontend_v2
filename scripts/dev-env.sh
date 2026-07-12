#!/usr/bin/env bash
# Sets LAN IP env vars so physical devices can reach Metro + API.

get_local_ip() {
  local iface ip
  for iface in en0 en1 en2 bridge0; do
    ip="$(ipconfig getifaddr "$iface" 2>/dev/null || true)"
    if [[ -n "$ip" ]]; then
      echo "$ip"
      return
    fi
  done
  echo "localhost"
}

LOCAL_IP="$(get_local_ip)"
export REACT_NATIVE_PACKAGER_HOSTNAME="${LOCAL_IP}"
export EXPO_PUBLIC_API_URL="http://${LOCAL_IP}:8081"
