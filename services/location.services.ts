import Axios from '@/config/axios.config';
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
// Fix: Properly type the task executor
TaskManager.defineTask<{ locations: Location.LocationObject[]; }>(
  LOCATION_TASK_NAME,
  async ({ data, error }) => {
    if (error) {
      console.error(error);
      return;
    }
    if (data) {
      const { locations } = data;
      console.log('Received new locations', locations);

      // Convert to the format expected by your backend
      if (locations.length > 0) {
        const latestLocation = locations[0];
        await updateUserLocation({
          latitude: latestLocation.coords.latitude,
          longitude: latestLocation.coords.longitude,
          timestamp: latestLocation.timestamp
        });
      }
    }
  }
);

async function updateUserLocation(locationData: any) {
  try {
    const response = await Axios.post('/users/location', locationData);
    return response.data;
  } catch (error) {
    console.error('Error updating user location:', error);
    throw error;
  }
}