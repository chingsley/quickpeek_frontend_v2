import {
  formatScopeOptionLabel,
  LOCATION_SCOPE_TIERS,
} from '@/constants/locationScope';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { BORDER_RADIUS_INPUT } from '@/constants/layout';
import { LocationScope } from '@/types/question.types';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type LocationScopeOptionListProps = {
  value: LocationScope;
  radii: Record<string, number>;
  onChange: (scope: LocationScope) => void;
};

/** Radio-style list for choosing who may answer a location-pinned question. */
export function LocationScopeOptionList({
  value,
  radii,
  onChange,
}: LocationScopeOptionListProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Who can answer this?</Text>
      <View accessibilityRole="radiogroup">
        {LOCATION_SCOPE_TIERS.map((tier, index) => {
          const selected = value === tier.scope;
          const label = formatScopeOptionLabel(tier.scope, radii);

          return (
            <React.Fragment key={tier.scope}>
              {index > 0 ? <View style={styles.divider} /> : null}
              <Pressable
                style={styles.row}
                onPress={() => onChange(tier.scope)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={label}
              >
                <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                  {selected ? <View style={styles.radioInner} /> : null}
                </View>
                <Text style={[styles.rowLabel, selected && styles.rowLabelSelected]}>
                  {label}
                </Text>
              </Pressable>
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const RADIO_SIZE = 20;
const RADIO_INNER = 10;
const ROW_PADDING_HORIZONTAL = 14;

const styles = StyleSheet.create({
  card: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.CARD_BORDER,
    borderRadius: BORDER_RADIUS_INPUT,
    overflow: 'hidden',
  },
  title: {
    fontFamily: fonts.FONT_FAMILY_MEDIUM,
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_DARK,
    paddingHorizontal: ROW_PADDING_HORIZONTAL,
    paddingTop: 12,
    paddingBottom: 8,
    textAlign: 'left',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: ROW_PADDING_HORIZONTAL,
    paddingVertical: 12,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.CARD_BORDER,
    marginLeft: ROW_PADDING_HORIZONTAL + RADIO_SIZE + 12,
  },
  radioOuter: {
    width: RADIO_SIZE,
    height: RADIO_SIZE,
    borderRadius: RADIO_SIZE / 2,
    borderWidth: 1.5,
    borderColor: colors.LIGHT_GRAY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.PRIMARY,
  },
  radioInner: {
    width: RADIO_INNER,
    height: RADIO_INNER,
    borderRadius: RADIO_INNER / 2,
    backgroundColor: colors.PRIMARY,
  },
  rowLabel: {
    flex: 1,
    fontFamily: fonts.FONT_FAMILY_REGULAR,
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_DARK,
    lineHeight: 22,
  },
  rowLabelSelected: {
    fontFamily: fonts.FONT_FAMILY_MEDIUM,
    color: colors.TEXT_DARK,
  },
});
