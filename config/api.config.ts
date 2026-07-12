import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { NativeModules, Platform } from 'react-native';
import NativeSourceCode from 'react-native/Libraries/NativeModules/specs/NativeSourceCode';

const BACKEND_PORT = 3000;
const METRO_PORT = 8081;

let linkingBundlerHost: string | null = null;

function isTunnelHost(host: string): boolean {
  const normalized = host.toLowerCase();
  return (
    normalized.includes('ngrok') ||
    normalized.includes('.exp.direct') ||
    normalized.includes('.exp.dev') ||
    normalized.includes('tunnel')
  );
}

function isLocalHost(host: string): boolean {
  const normalized = host.toLowerCase();
  return normalized === 'localhost' || normalized === '127.0.0.1';
}

function hostFromUrl(url: string | null | undefined): string | null {
  if (!url) {
    return null;
  }

  const direct = url.match(/^https?:\/\/([^/:]+)/);
  if (direct?.[1]) {
    return direct[1];
  }

  try {
    const nested = new URL(url).searchParams.get('url');
    if (nested) {
      return hostFromUrl(decodeURIComponent(nested));
    }
  } catch {
    // ignore malformed deep links
  }

  return null;
}

/** Called once on app start to capture the Expo dev-client launch URL. */
export async function initApiConfigFromLinking(): Promise<void> {
  try {
    const initialUrl = await Linking.getInitialURL();
    linkingBundlerHost = hostFromUrl(initialUrl);
    if (__DEV__ && linkingBundlerHost) {
      console.log('[config] bundler host from deep link:', linkingBundlerHost);
    }
  } catch {
    // non-fatal
  }
}

function getScriptURL(): string | undefined {
  try {
    return NativeSourceCode.getConstants()?.scriptURL;
  } catch {
    return NativeModules?.SourceCode?.scriptURL as string | undefined;
  }
}

/** Host the JS bundle was loaded from (Metro / Expo dev server). */
function getBundlerHost(): string | null {
  const fromConstants =
    Constants.expoGoConfig?.debuggerHost ??
    Constants.expoConfig?.hostUri;

  const fromConstantsHost = hostFromUrl(
    fromConstants ? `http://${fromConstants}` : null,
  );
  if (fromConstantsHost) {
    return fromConstantsHost;
  }

  const fromScript = hostFromUrl(getScriptURL());
  if (fromScript) {
    return fromScript;
  }

  if (linkingBundlerHost) {
    return linkingBundlerHost;
  }

  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    return hostFromUrl(envUrl);
  }

  return null;
}

function getTunnelApiOrigin(): string | null {
  const host = getBundlerHost();
  if (!host || !isTunnelHost(host)) {
    return null;
  }

  // Metro proxies /api/v1 and /socket.io to the local backend through the Expo tunnel.
  return `https://${host}`;
}

function getLanApiOrigin(): string | null {
  const host = getBundlerHost();
  if (!host || isTunnelHost(host)) {
    return null;
  }

  if (isLocalHost(host)) {
    return `http://${host}:${BACKEND_PORT}`;
  }

  // Physical device — route API through Metro (same host as the JS bundle).
  return `http://${host}:${METRO_PORT}`;
}

export function resolveApiOrigin(): string {
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
    return `http://10.0.2.2:${METRO_PORT}`;
  }

  return `http://localhost:${BACKEND_PORT}`;
}

export function getApiOrigin(): string {
  const origin = resolveApiOrigin();

  if (__DEV__) {
    console.log('[config] API_URL:', origin);
    console.log('[config] bundler host:', getBundlerHost());
  }

  return origin;
}

export function getApiBaseUrl(): string {
  return `${getApiOrigin()}/api/v1`;
}

export function getSocketOrigin(): string {
  if (useTunnelProxy()) {
    return getApiOrigin();
  }

  const host = getBundlerHost();
  if (host && !isLocalHost(host)) {
    // WebSockets don't work through Metro's HTTP proxy — connect to backend directly.
    return `http://${host}:${BACKEND_PORT}`;
  }

  return getApiOrigin();
}

export function getSocketTransports(): ('polling' | 'websocket')[] {
  if (useTunnelProxy()) {
    return ['polling', 'websocket'];
  }

  const host = getBundlerHost();
  if (host && !isLocalHost(host)) {
    return ['websocket', 'polling'];
  }

  // Simulator / Metro proxy — prefer polling through the dev server.
  return ['polling', 'websocket'];
}

export function useTunnelProxy(): boolean {
  return getApiOrigin().startsWith('https://');
}

// Legacy exports — prefer getApiOrigin() / getApiBaseUrl() (resolved at call time).
export const API_URL = resolveApiOrigin();
export const API_BASE_URL = `${API_URL}/api/v1`;
export const USE_TUNNEL_PROXY = API_URL.startsWith('https://');
