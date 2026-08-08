jest.mock('@/config/axios.config', () => ({
  __esModule: true,
  default: { put: jest.fn() },
}));

jest.mock('@/store/auth.store', () => ({
  useAuthStore: { getState: jest.fn() },
}));

import Axios from '@/config/axios.config';
import {
  reportLocationToBackend,
  __resetLocationReportThrottle,
} from '@/services/locationReport.services';
import { useAuthStore } from '@/store/auth.store';

const mockPut = Axios.put as jest.Mock;
const mockGetState = useAuthStore.getState as jest.Mock;

const HALIFAX = { lat: 44.6126, lng: -63.6192 };
// ~1.1 km away — beyond the 150 m movement threshold.
const HALIFAX_FAR = { lat: 44.6226, lng: -63.6192 };
// ~10 m away — within the movement threshold.
const HALIFAX_NEAR = { lat: 44.6127, lng: -63.6193 };

describe('reportLocationToBackend', () => {
  beforeEach(() => {
    jest.useRealTimers();
    __resetLocationReportThrottle();
    mockPut.mockReset();
    mockPut.mockResolvedValue({ data: {} });
    mockGetState.mockReturnValue({ token: 'jwt-token', user: { id: 'user-1' } });
  });

  it('does not report when the user is not authenticated', () => {
    // A 401 would trip the axios interceptor and force a logout, so an
    // unauthenticated background report must never fire.
    mockGetState.mockReturnValue({ token: null, user: null });

    reportLocationToBackend(HALIFAX);

    expect(mockPut).not.toHaveBeenCalled();
  });

  it('reports the first successful read', async () => {
    reportLocationToBackend(HALIFAX);
    await Promise.resolve();

    expect(mockPut).toHaveBeenCalledTimes(1);
    expect(mockPut).toHaveBeenCalledWith('/users/location', {
      latitude: HALIFAX.lat,
      longitude: HALIFAX.lng,
    });
  });

  it('ignores null coords (failed GPS read)', () => {
    reportLocationToBackend(null);
    expect(mockPut).not.toHaveBeenCalled();
  });

  it('throttles a repeat report that is too soon and too close', async () => {
    reportLocationToBackend(HALIFAX);
    await Promise.resolve();
    expect(mockPut).toHaveBeenCalledTimes(1);

    reportLocationToBackend(HALIFAX_NEAR);
    await Promise.resolve();
    expect(mockPut).toHaveBeenCalledTimes(1);
  });

  it('reports again when the device moved past the distance threshold', async () => {
    reportLocationToBackend(HALIFAX);
    await new Promise((r) => setTimeout(r, 0));

    reportLocationToBackend(HALIFAX_FAR);
    await new Promise((r) => setTimeout(r, 0));
    expect(mockPut).toHaveBeenCalledTimes(2);
  });

  it('reports again after the interval even without movement', async () => {
    const realNow = Date.now();
    const spy = jest.spyOn(Date, 'now');

    spy.mockReturnValue(realNow);
    reportLocationToBackend(HALIFAX);
    await new Promise((r) => setTimeout(r, 0));
    expect(mockPut).toHaveBeenCalledTimes(1);

    // 16 minutes later, same spot.
    spy.mockReturnValue(realNow + 16 * 60_000);
    reportLocationToBackend(HALIFAX);
    await new Promise((r) => setTimeout(r, 0));
    expect(mockPut).toHaveBeenCalledTimes(2);

    spy.mockRestore();
  });

  it('does not advance the throttle marker when the request fails', async () => {
    mockPut.mockRejectedValueOnce(new Error('offline'));
    reportLocationToBackend(HALIFAX);
    // Flush the rejection handler.
    await new Promise((r) => setTimeout(r, 0));
    expect(mockPut).toHaveBeenCalledTimes(1);

    // A nearby retry is allowed because the failure never set lastReport.
    mockPut.mockResolvedValue({ data: {} });
    reportLocationToBackend(HALIFAX_NEAR);
    await new Promise((r) => setTimeout(r, 0));
    expect(mockPut).toHaveBeenCalledTimes(2);
  });
});
