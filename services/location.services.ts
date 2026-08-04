import * as Location from 'expo-location';

/**
 * Address autocomplete via OpenStreetMap Nominatim — free and keyless, which
 * is all the marketplace-style picker needs today. To upgrade result quality
 * later (e.g. Google Places), replace `getLocationSuggestions` only; the
 * picker consumes this shape.
 */
export type LocationSuggestion = {
  label: string;
  latitude: number;
  longitude: number;
};

const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';
const SUGGESTION_LIMIT = 5;

type NominatimRow = { display_name?: string; lat?: string; lon?: string };

export const getLocationSuggestions = async (
  query: string,
): Promise<LocationSuggestion[]> => {
  const url =
    `${NOMINATIM_SEARCH_URL}?q=${encodeURIComponent(query)}` +
    `&format=json&limit=${SUGGESTION_LIMIT}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    throw new Error(`Location search failed (${res.status})`);
  }
  const data: unknown = await res.json();
  if (!Array.isArray(data)) return [];

  return data.slice(0, SUGGESTION_LIMIT).map((row: NominatimRow) => ({
    label: String(row.display_name ?? ''),
    latitude: parseFloat(String(row.lat)),
    longitude: parseFloat(String(row.lon)),
  }));
};

const coordsLabel = (latitude: number, longitude: number): string =>
  `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

/**
 * Reverse-geocodes a coordinate pair into a single-line address, falling back
 * to the coordinates themselves when no place name is available.
 */
export const getAddressLabel = async (
  latitude: number,
  longitude: number,
): Promise<string> => {
  try {
    const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (!place) return coordsLabel(latitude, longitude);
    const parts = [place.name, place.street, place.city, place.region].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : coordsLabel(latitude, longitude);
  } catch {
    return coordsLabel(latitude, longitude);
  }
};
