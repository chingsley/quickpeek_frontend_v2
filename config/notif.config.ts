import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useActiveViewStore } from '@/store/activeView.store';

// Show a banner + sound only when the activity ISN'T already on screen.
// The push payload's `data` carries the resource the notification is about;
// if the user is viewing that exact chat/question, we suppress the banner so
// they aren't pinged twice for the socket event they just saw arrive live.
Notifications.setNotificationHandler({
  handleNotification: async ({ request }) => {
    const data = (request.content.data ?? {}) as Record<string, unknown>;
    const { activeRequestId, activeQuestionId } = useActiveViewStore.getState();

    const suppress =
      (typeof data.answerRequestId === 'string' && data.answerRequestId === activeRequestId) ||
      (typeof data.questionId === 'string' && data.questionId === activeQuestionId);

    if (suppress) {
      return { shouldShowBanner: false, shouldShowList: false, shouldPlaySound: false, shouldSetBadge: false };
    }

    return {
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    };
  },
});

/**
 * Get the device's Expo push token, requesting permission if needed.
 *
 * Called at sign-in/sign-up AND on every cold start (token sync), so this must
 * stay silent: no alerts and no noisy logging on the denied path, or a user who
 * declined push would be interrupted every time they open the app.
 * Returns '' when push is unavailable or permission was refused.
 */
async function registerForPushNotificationsAsync() {
  let token = '';

  try {
    // Push is only supported on native iOS/Android. Constants.isDevice was removed
    // from expo-constants and is always falsy in dev builds — do not use it here.
    if (Platform.OS === 'web') {
      return '';
    }

    // Check permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return '';
    }

    // Get the token - try multiple ways to get projectId
    let projectId;

    // Method 1: From app.json configuration (most reliable)
    projectId = Constants.expoConfig?.extra?.eas?.projectId;

    // Method 2: From slug (fallback)
    if (!projectId) {
      projectId = Constants.expoConfig?.slug;
    }

    // Method 3: Hardcoded as last resort (replace with your actual project ID)
    if (!projectId) {
      projectId = 'quickpeek_frontend_v2'; // This might need to be your actual EAS project ID
    }

    if (projectId) {
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: projectId as string
      })).data;
    } else {
      // Final fallback - try without projectId (may work in development)
      token = (await Notifications.getExpoPushTokenAsync()).data;
    }
    return token;
  } catch (error) {
    console.error('Error getting push token:', error);
    // Return empty string but don't block login
    return '';
  }
}

export default {
  registerForPushNotificationsAsync
};