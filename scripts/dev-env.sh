#!/usr/bin/env bash
# Shared dev helpers. LAN Metro env is applied only when explicitly requested
# (see start-metro.sh / ensure-metro.sh). Tunnel mode must NOT set packager hostname.

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

export_lan_metro_env() {
  export REACT_NATIVE_PACKAGER_HOSTNAME="${LOCAL_IP}"
  export EXPO_PUBLIC_API_URL="http://${LOCAL_IP}:8081"
}

unset_lan_metro_env() {
  unset REACT_NATIVE_PACKAGER_HOSTNAME
  unset EXPO_PUBLIC_API_URL
}
