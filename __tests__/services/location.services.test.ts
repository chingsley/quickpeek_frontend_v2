jest.mock('expo-location', () => ({
  reverseGeocodeAsync: jest.fn(),
}));

import * as Location from 'expo-location';
import { getAddressLabel, getLocationSuggestions } from '@/services/location.services';

const mockReverseGeocode = Location.reverseGeocodeAsync as jest.Mock;
const mockFetch = jest.fn();

beforeAll(() => {
  global.fetch = mockFetch as unknown as typeof fetch;
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getLocationSuggestions', () => {
  const nominatimRow = (name: string, lat: string, lon: string) => ({
    display_name: name,
    lat,
    lon,
  });

  it('maps Nominatim results to labeled suggestions', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([
          nominatimRow('Halifax, Nova Scotia, Canada', '44.65', '-63.57'),
          nominatimRow('Downtown Halifax, Canada', '44.64', '-63.58'),
        ]),
    });

    const results = await getLocationSuggestions('halifa');

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('https://nominatim.openstreetmap.org/search?');
    expect(url).toContain('q=halifa');
    expect(url).toContain('format=json');
    expect((init.headers as Record<string, string>).Accept).toBe('application/json');
    expect(results).toEqual([
      { label: 'Halifax, Nova Scotia, Canada', latitude: 44.65, longitude: -63.57 },
      { label: 'Downtown Halifax, Canada', latitude: 44.64, longitude: -63.58 },
    ]);
  });

  it('tolerates rows with a missing display name', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ lat: '44.65', lon: '-63.57' }]),
    });
    const results = await getLocationSuggestions('halifa');
    expect(results).toEqual([{ label: '', latitude: 44.65, longitude: -63.57 }]);
  });

  it('encodes the query string', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });
    await getLocationSuggestions('North End, Halifax');
    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toContain('q=North%20End%2C%20Halifax');
  });

  it('returns an empty list when the response is not an array', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ error: 'bad' }) });
    expect(await getLocationSuggestions('zzz')).toEqual([]);
  });

  it('throws on HTTP errors so the caller can show a friendly state', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 503 });
    await expect(getLocationSuggestions('halifa')).rejects.toThrow('503');
  });
});

describe('getAddressLabel', () => {
  it('joins the place parts into one label', async () => {
    mockReverseGeocode.mockResolvedValue([
      { name: '123', street: 'Main St', city: 'Halifax', region: 'NS' },
    ]);
    expect(await getAddressLabel(44.6, -63.6)).toBe('123, Main St, Halifax, NS');
    expect(mockReverseGeocode).toHaveBeenCalledWith({ latitude: 44.6, longitude: -63.6 });
  });

  it('falls back to coordinates when there is no place', async () => {
    mockReverseGeocode.mockResolvedValue([]);
    expect(await getAddressLabel(44.6123456, -63.6123456)).toBe('44.61235, -63.61235');
  });

  it('falls back to coordinates when geocoding fails', async () => {
    mockReverseGeocode.mockRejectedValue(new Error('unavailable'));
    expect(await getAddressLabel(44.6123456, -63.6123456)).toBe('44.61235, -63.61235');
  });
});

describe('getAddressLabel edge cases', () => {
  it('falls back to coordinates when every place field is empty', async () => {
    mockReverseGeocode.mockResolvedValue([{ name: null, street: null, city: null, region: null }]);
    expect(await getAddressLabel(44.6123456, -63.6123456)).toBe('44.61235, -63.61235');
  });
});
