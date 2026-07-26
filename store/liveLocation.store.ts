import * as Location from 'expo-location';
import { create } from 'zustand';

type LiveCoords = { lat: number; lng: number; };

interface LiveLocationState {
  coords: LiveCoords | null;
  permissionGranted: boolean;
  /**
   * Ensure we have live GPS coordinates. Returns the cached coords if we
   * already have a recent reading; otherwise requests foreground permission
   * (if needed) and reads the current position once.
   *
   * Returns null when the user denied permission or the read failed — callers
   * are expected to handle this by disabling location-dependent UI.
   */
  ensureCoords: () => Promise<LiveCoords | null>;
  /** Force a fresh GPS reading (e.g. user pulled to refresh). */
  refreshCoords: () => Promise<LiveCoords | null>;
  clear: () => void;
}

let inFlight: Promise<LiveCoords | null> | null = null;

async function readOnce(requirePermission: boolean): Promise<LiveCoords | null> {
  try {
    if (requirePermission) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return null;
    } else {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') return null;
    }
    const loc = await Location.getCurrentPositionAsync({});
    return { lat: loc.coords.latitude, lng: loc.coords.longitude };
  } catch (error) {
    console.warn('Live location read failed', error);
    return null;
  }
}

export const useLiveLocationStore = create<LiveLocationState>((set, get) => ({
  coords: null,
  permissionGranted: false,

  ensureCoords: async () => {
    const cached = get().coords;
    if (cached) return cached;
    if (inFlight) return inFlight;

    inFlight = readOnce(true).then((next) => {
      if (next) {
        set({ coords: next, permissionGranted: true });
      }
      inFlight = null;
      return next;
    });
    return inFlight;
  },

  refreshCoords: async () => {
    const next = await readOnce(false);
    if (next) set({ coords: next, permissionGranted: true });
    return next;
  },

  clear: () => set({ coords: null, permissionGranted: false }),
}));
