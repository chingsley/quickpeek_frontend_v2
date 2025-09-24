
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

const LOCATION_TASK_NAME = 'background-location-task';

export const requestLocationPermissions = async () => {
  const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
  if (foregroundStatus === 'granted') {
    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus === 'granted') {
      return true;
    }
  }
  return false;
};

export const startLocationUpdates = async () => {
  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 1000 * 60 * 5, // 5 minutes
    deferredUpdatesInterval: 1000 * 60 * 1, // 1 minute
    showsBackgroundLocationIndicator: true,
  });
};

export const stopLocationUpdates = async () => {
  await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
};

TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }) => {
  if (error) {
    console.error(error);
    return;
  }
  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    console.log('Received new locations', locations);
    // Here you would send the location to your backend API
  }
});
