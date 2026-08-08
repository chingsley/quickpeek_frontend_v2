jest.mock('@/config/notif.config', () => ({
  __esModule: true,
  default: { registerForPushNotificationsAsync: jest.fn() },
}));

jest.mock('@/services/users.services', () => ({
  updateUserProfile: jest.fn(),
}));

jest.mock('@/store/auth.store', () => ({
  useAuthStore: {
    getState: jest.fn(),
  },
}));

import notifConfig from '@/config/notif.config';
import { syncPushTokenOnStartup } from '@/services/notifications.services';
import { updateUserProfile } from '@/services/users.services';
import { useAuthStore } from '@/store/auth.store';

const mockRegister = notifConfig.registerForPushNotificationsAsync as jest.Mock;
const mockUpdate = updateUserProfile as jest.Mock;
const mockGetState = useAuthStore.getState as jest.Mock;

const baseUser = {
  id: 'user-1',
  deviceToken: 'ExponentPushToken[old]',
};

describe('syncPushTokenOnStartup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetState.mockReturnValue({ user: { ...baseUser }, updateUser: jest.fn() });
  });

  it('no-ops when there is no logged-in user', async () => {
    mockGetState.mockReturnValue({ user: null, updateUser: jest.fn() });

    await syncPushTokenOnStartup();

    expect(mockRegister).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('no-ops when the device cannot produce a token', async () => {
    mockRegister.mockResolvedValue('');

    await syncPushTokenOnStartup();

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('no-ops when the token is unchanged from the stored one', async () => {
    mockRegister.mockResolvedValue('ExponentPushToken[old]');

    await syncPushTokenOnStartup();

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('persists a rotated token to the backend and the auth store', async () => {
    const updateUser = jest.fn();
    mockGetState.mockReturnValue({ user: { ...baseUser }, updateUser });
    mockRegister.mockResolvedValue('ExponentPushToken[new]');
    mockUpdate.mockResolvedValue({});

    await syncPushTokenOnStartup();

    expect(mockUpdate).toHaveBeenCalledWith({ deviceToken: 'ExponentPushToken[new]' });
    expect(updateUser).toHaveBeenCalledWith({ deviceToken: 'ExponentPushToken[new]' });
  });

  it('never re-enables notifications the user muted in Settings', async () => {
    const updateUser = jest.fn();
    mockGetState.mockReturnValue({
      user: { ...baseUser, notificationsEnabled: false },
      updateUser,
    });
    mockRegister.mockResolvedValue('ExponentPushToken[new]');
    mockUpdate.mockResolvedValue({});

    await syncPushTokenOnStartup();

    // Token syncs, but the muted preference must be left untouched.
    expect(mockUpdate).toHaveBeenCalledWith({ deviceToken: 'ExponentPushToken[new]' });
    expect(mockUpdate.mock.calls[0][0]).not.toHaveProperty('notificationsEnabled');
    expect(updateUser.mock.calls[0][0]).not.toHaveProperty('notificationsEnabled');
  });

  it('swallows backend failures so startup is never blocked', async () => {
    mockRegister.mockResolvedValue('ExponentPushToken[new]');
    mockUpdate.mockRejectedValue(new Error('network down'));

    await expect(syncPushTokenOnStartup()).resolves.toBeUndefined();
  });
});
