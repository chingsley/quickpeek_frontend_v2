import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_PORT = 3000;

function isTunnelHost(host: string): boolean {
  const normalized = host.toLowerCase();
  return (
    normalized.includes('ngrok') ||
    normalized.includes('.exp.direct') ||
    normalized.includes('.exp.dev') ||
    normalized.includes('tunnel')
  );
}

function getTunnelApiOrigin(): string | null {
  const debuggerHost =
    Constants.expoGoConfig?.debuggerHost ??
    Constants.expoConfig?.hostUri;

  if (!debuggerHost) {
    return null;
  }

  const host = debuggerHost.split(':')[0];
  if (!isTunnelHost(host)) {
    return null;
  }

  // Metro proxies /api/v1 and /socket.io to the local backend through the Expo tunnel.
  return `https://${host}`;
}

function getLanApiOrigin(): string | null {
  const debuggerHost =
    Constants.expoGoConfig?.debuggerHost ??
    Constants.expoConfig?.hostUri;

  if (!debuggerHost) {
    return null;
  }

  const host = debuggerHost.split(':')[0];
  if (isTunnelHost(host)) {
    return null;
  }

  return `http://${host}:${API_PORT}`;
}

function resolveApiOrigin(): string {
  const tunnelOrigin = getTunnelApiOrigin();
  if (tunnelOrigin) {
    return tunnelOrigin;
  }

  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }

  const lanOrigin = getLanApiOrigin();
  if (lanOrigin) {
    return lanOrigin;
  }

  if (Platform.OS === 'android' && !Constants.isDevice) {
    return `http://10.0.2.2:${API_PORT}`;
  }

  return `http://localhost:${API_PORT}`;
}

export const API_URL = resolveApiOrigin();
export const API_BASE_URL = `${API_URL}/api/v1`;
export const USE_TUNNEL_PROXY = API_URL.startsWith('https://');

if (__DEV__) {
  console.log('[config] API_URL:', API_URL);
}
