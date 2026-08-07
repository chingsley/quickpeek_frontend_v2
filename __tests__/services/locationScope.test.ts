import { calculateHaversineDistance } from '@/utils/geo';
import {
  detectLocationScope,
  getLocationSuggestions,
} from '@/services/location.services';

const mockFetch = jest.fn();

beforeAll(() => {
  global.fetch = mockFetch as unknown as typeof fetch;
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('calculateHaversineDistance', () => {
  it('computes a known distance within tolerance', () => {
    // 0.018° of latitude ≈ 2.0 km.
    const km = calculateHaversineDistance(44.6126, -63.6192, 44.6306, -63.6192);
    expect(km).toBeGreaterThan(1.8);
    expect(km).toBeLessThan(2.2);
  });

  it('returns zero for identical points', () => {
    expect(calculateHaversineDistance(44.6, -63.6, 44.6, -63.6)).toBe(0);
  });
});

describe('detectLocationScope', () => {
  it('buckets a building-sized box as AT_EXACT_ADDRESS', () => {
    // ~100 m diagonal.
    expect(
      detectLocationScope({ south: 44.6120, north: 44.6130, west: -63.6200, east: -63.6180 }),
    ).toBe('AT_EXACT_ADDRESS');
  });

  it('buckets a campus-sized box as WALKING', () => {
    // ~1.2 km diagonal.
    expect(
      detectLocationScope({ south: 44.6100, north: 44.6200, west: -63.6300, east: -63.6150 }),
    ).toBe('WALKING');
  });

  it('buckets a neighbourhood-sized box as NEIGHBOURHOOD', () => {
    // ~4 km diagonal.
    expect(
      detectLocationScope({ south: 44.60, north: 44.635, west: -63.66, east: -63.60 }),
    ).toBe('NEIGHBOURHOOD');
  });

  it('buckets a city-sized box as CITY', () => {
    // ~25 km diagonal.
    expect(
      detectLocationScope({ south: 44.5, north: 44.75, west: -63.85, east: -63.45 }),
    ).toBe('CITY');
  });
});

describe('getLocationSuggestions bounding box', () => {
  it('maps the Nominatim boundingbox when present', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([
          {
            display_name: 'Halifax, Nova Scotia, Canada',
            lat: '44.65',
            lon: '-63.57',
            boundingbox: ['44.38', '44.93', '-63.79', '-63.32'],
          },
        ]),
    });
    const [row] = await getLocationSuggestions('halifa');
    expect(row.boundingBox).toEqual({ south: 44.38, north: 44.93, west: -63.79, east: -63.32 });
  });

  it('is null when the row has no boundingbox', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ display_name: 'X', lat: '1', lon: '2' }]),
    });
    const [row] = await getLocationSuggestions('x');
    expect(row.boundingBox).toBeNull();
  });
});
