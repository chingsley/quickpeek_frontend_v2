import * as Location from 'expo-location';
import { create } from 'zustand';

type LiveCoords = { lat: number; lng: number; };

interface LiveLocationState {
  coords: LiveCoords | null;
  permissionGranted: boolean;
  /**
   * Ensure we have live GPS coordinates. Returns the cached coords if we
   * already have a recent reading; otherwise reads the current position when
   * permission is already granted.
   *
   * On web this never opens the browser permission prompt — use `promptForCoords`
   * for user-initiated flows (e.g. near-me filter).
   *
   * Returns null when permission is missing or the read failed.
   */
  ensureCoords: () => Promise<LiveCoords | null>;
  /** Request permission (native / user gesture on web) and read GPS once. */
  promptForCoords: () => Promise<LiveCoords | null>;
  /** Force a fresh GPS reading when permission is already granted. */
  refreshCoords: () => Promise<LiveCoords | null>;
  clear: () => void;
}

const POSITION_TIMEOUT_MS = 8_000;

let inFlight: Promise<LiveCoords | null> | null = null;

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error('Location read timed out')), ms);
    }),
  ]);

async function readOnce(requestPermission: boolean): Promise<LiveCoords | null> {
  try {
    const { status: currentStatus } = await Location.getForegroundPermissionsAsync();
    let finalStatus = currentStatus;

    if (currentStatus !== 'granted' && requestPermission) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return null;

    const loc = await withTimeout(
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      }),
      POSITION_TIMEOUT_MS,
    );
    return { lat: loc.coords.latitude, lng: loc.coords.longitude };
  } catch (error) {
    console.warn('Live location read failed', error);
    return null;
  }
}

const runInFlight = (requestPermission: boolean): Promise<LiveCoords | null> => {
  if (inFlight) return inFlight;

  inFlight = readOnce(requestPermission).then((next) => {
    inFlight = null;
    return next;
  });
  return inFlight;
};

export const useLiveLocationStore = create<LiveLocationState>((set, get) => ({
  coords: null,
  permissionGranted: false,

  ensureCoords: async () => {
    const cached = get().coords;
    if (cached) return cached;

    const next = await runInFlight(false);
    if (next) set({ coords: next, permissionGranted: true });
    return next;
  },

  promptForCoords: async () => {
    const next = await runInFlight(true);
    if (next) set({ coords: next, permissionGranted: true });
    return next;
  },

  refreshCoords: async () => {
    const next = await readOnce(false);
    if (next) set({ coords: next, permissionGranted: true });
    return next;
  },

  clear: () => set({ coords: null, permissionGranted: false }),
}));
