import { ViewStyle } from 'react-native';

export type LocationPickerMapProps = {
  testID?: string;
  style?: ViewStyle;
  initialRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  onRegionChangeComplete?: (region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  }) => void;
  onPanDrag?: () => void;
};
