import notifConfig from '@/config/notif.config';
import { useAuthStore } from '@/store/auth.store';
import { updateUserProfile } from './users.services';

/**
 * Cold-start push token sync.
 *
 * Expo push tokens can rotate (reinstall, OS restore, credential refresh).
 * The token is otherwise only captured at sign-in, so without this an
 * already-logged-in user would keep a stale token and silently stop
 * receiving push. We re-register on every app open and only hit the backend
 * when the token actually changed.
 *
 * Fire-and-forget: never blocks startup, never throws.
 */
export async function syncPushTokenOnStartup(): Promise<void> {
  try {
    const { user } = useAuthStore.getState();
    if (!user?.id) return;

    const token = await notifConfig.registerForPushNotificationsAsync();
    if (!token || token === user.deviceToken) return;

    // Only the token is synced — never notificationsEnabled. That flag is the
    // user's choice via the Settings toggle, and silently flipping it back on
    // here would override someone who deliberately muted notifications.
    await updateUserProfile({ deviceToken: token });
    // Keep the persisted auth user in step so the next cold start no-ops.
    useAuthStore.getState().updateUser({ deviceToken: token });
  } catch (err) {
    console.error('syncPushTokenOnStartup failed', err);
  }
}
