import * as Location from 'expo-location';
import { LocationScope } from '@/types/question.types';
import { calculateHaversineDistance } from '@/utils/geo';

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
  /** South/north/west/east bounds from the geocoder, when it provides them. */
  boundingBox: LocationBoundingBox | null;
};

export type LocationBoundingBox = {
  south: number;
  west: number;
  north: number;
  east: number;
};

const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';
const SUGGESTION_LIMIT = 5;

type NominatimRow = {
  display_name?: string;
  lat?: string;
  lon?: string;
  /** [south, north, west, east] as strings. */
  boundingbox?: [string, string, string, string];
};

const parseBoundingBox = (row: NominatimRow): LocationBoundingBox | null => {
  if (!row.boundingbox) return null;
  const [south, north, west, east] = row.boundingbox.map(parseFloat);
  return { south, west, north, east };
};

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
    boundingBox: parseBoundingBox(row),
  }));
};

/**
 * Buckets a geocoder bounding box into a location scope. Deliberately
 * geometry-based (not OSM addresstype) so it stays provider-agnostic —
 * Google Places' viewport maps the same way.
 */
export const detectLocationScope = (bbox: LocationBoundingBox): LocationScope => {
  const diagonalKm = calculateHaversineDistance(bbox.south, bbox.west, bbox.north, bbox.east);
  if (diagonalKm < 0.5) return 'AT_EXACT_ADDRESS';
  if (diagonalKm < 2) return 'WALKING';
  if (diagonalKm < 8) return 'NEIGHBOURHOOD';
  return 'CITY';
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
