import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors } from '@/constants/colors';

interface MapViewProps {
  style?: ViewStyle;
  region?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  children?: React.ReactNode;
}

const MapView: React.FC<MapViewProps> = ({ style, region, children }) => (
  <View style={[styles.placeholder, style]}>
    <Text style={styles.text}>🗺️ Map is not available on web</Text>
    {region && (
      <Text style={styles.coords}>
        📍 {region.latitude.toFixed(4)}, {region.longitude.toFixed(4)}
      </Text>
    )}
  </View>
);

interface MarkerProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
}

export const Marker: React.FC<MarkerProps> = () => null;

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: '#E8EDF2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    color: colors.MEDIUM_GRAY,
    fontFamily: 'roboto',
  },
  coords: {
    fontSize: 12,
    color: colors.MEDIUM_GRAY,
    marginTop: 8,
    fontFamily: 'roboto',
  },
});

export default MapView;
