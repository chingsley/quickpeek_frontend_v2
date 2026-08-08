import Axios from '@/config/axios.config';
import { useAuthStore } from '@/store/auth.store';

type Coords = { lat: number; lng: number };

/**
 * Last-known-location reporting.
 *
 * The server targets question:new pushes by each user's saved location row,
 * but that row only exists if the app reports it. We report foreground GPS
 * reads (the feed already takes them), throttled so a user idling on the
 * feed doesn't hammer the API:
 *
 *  - at most one in-flight request,
 *  - skipped if the last report was < MIN_INTERVAL_MS ago AND the device has
 *    moved < MIN_DISTANCE_M since.
 *
 * The backend no-ops when the user has location sharing off, so this stays
 * fire-and-forget with no preference check on the client.
 */

const MIN_INTERVAL_MS = 15 * 60_000;
const MIN_DISTANCE_M = 150;

let lastReport: { coords: Coords; at: number } | null = null;
let inFlight = false;

/** Rough metres between two coords — good enough at this granularity. */
function distanceMeters(a: Coords, b: Coords): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(h));
}

export function reportLocationToBackend(coords: Coords | null): void {
  if (!coords || inFlight) return;

  // Never fire unauthenticated: the axios 401 interceptor force-logs-out the
  // user, so a background report racing a signed-out state must not run.
  const { token, user } = useAuthStore.getState();
  if (!token || !user?.id) return;

  if (lastReport) {
    const elapsed = Date.now() - lastReport.at;
    const moved = distanceMeters(lastReport.coords, coords);
    if (elapsed < MIN_INTERVAL_MS && moved < MIN_DISTANCE_M) return;
  }

  inFlight = true;
  Axios.put('/users/location', { latitude: coords.lat, longitude: coords.lng })
    .then(() => {
      lastReport = { coords, at: Date.now() };
    })
    .catch((err) => {
      // Best-effort: a failed report just means targeting is a bit staler.
      console.warn('Location report failed', err?.response?.status ?? err?.message);
    })
    .finally(() => {
      inFlight = false;
    });
}

/** Test hook: reset module-level throttle state between tests. */
export function __resetLocationReportThrottle(): void {
  lastReport = null;
  inFlight = false;
}
