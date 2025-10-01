import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';


// Get device token for notifications
async function registerForPushNotificationsAsync() {
  let token = '';

  try {
    // Check if we're on a physical device
    if (!Constants.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return '';
    }

    console.log({
      'Constants.expoConfig?.extra?.eas?.projectId': Constants.expoConfig?.extra?.eas?.projectId,
      'Constants.expoConfig?.slug': Constants.expoConfig?.slug,
    });

    // Check permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
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

    console.log('Using projectId:', projectId);

    if (projectId) {
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: projectId as string
      })).data;
    } else {
      // Final fallback - try without projectId (may work in development)
      token = (await Notifications.getExpoPushTokenAsync()).data;
    }

    console.log('Expo push token:', token);
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