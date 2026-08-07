import {
  getLocationScopeSummaryValue,
  LOCATION_SCOPE_SUMMARY_PREFIX,
} from '@/constants/locationScope';
import { fonts } from '@/constants/fonts';
import { LocationScope } from '@/types/question.types';
import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native';
import { colors } from '@/constants/colors';

type LocationScopeSummaryTextProps = {
  scope: LocationScope;
  radiusKm?: number | null;
  radii?: Record<string, number> | null;
  style?: StyleProp<TextStyle>;
};

/** "Allowed response zone: " with the zone descriptor in bold. */
export function LocationScopeSummaryText({
  scope,
  radiusKm,
  radii,
  style,
}: LocationScopeSummaryTextProps) {
  const value = getLocationScopeSummaryValue(scope, radiusKm, radii);
  if (!value) return null;

  return (
    <Text style={style}>
      {LOCATION_SCOPE_SUMMARY_PREFIX}
      <Text style={styles.value}>{value}</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  value: {
    fontFamily: 'roboto-medium',
    // textDecorationLine: 'underline',
    textTransform: 'capitalize',
  },
});
