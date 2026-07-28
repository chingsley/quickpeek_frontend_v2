import {
  FILTER_TABLET_ICON_SIZE,
  filterTabletBarStyles,
  filterTabletStyles,
} from '@/constants/filterTablets';
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { ComponentProps } from 'react';
import { Pressable, ScrollView, StyleProp, Text, View, ViewStyle } from 'react-native';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type FilterTabletProps = {
  label: string;
  icon: IoniconName;
  iconColor: string;
  active?: boolean;
  onPress: () => void;
};

/**
 * Single filter pill (icon + label). Used on Home and Chats.
 *
 * Tune appearance in `constants/filterTablets.ts`:
 * - `filterTabletStyles` — pill container, active state, label text
 * - `FILTER_TABLET_ICON_SIZE` — icon size (from `statusIcons.ts`)
 */
export const FilterTablet = ({
  label,
  icon,
  iconColor,
  active = false,
  onPress,
}: FilterTabletProps) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityState={{ selected: active }}
    style={[filterTabletStyles.container, active && filterTabletStyles.containerActive]}
  >
    <Ionicons name={icon} size={FILTER_TABLET_ICON_SIZE} color={iconColor} />
    <Text style={[filterTabletStyles.text, active && filterTabletStyles.textActive]}>{label}</Text>
  </Pressable>
);

type FilterTabletBarProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Horizontal scroll row for filter pills. Canonical layout from Chats screen.
 *
 * Tune row spacing in `constants/filterTablets.ts` → `filterTabletBarStyles`.
 */
export const FilterTabletBar = ({ children, style }: FilterTabletBarProps) => (
  <View style={[filterTabletBarStyles.wrap, style]}>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={filterTabletBarStyles.content}
    >
      {children}
    </ScrollView>
  </View>
);

export { filterTabletBarStyles, filterTabletStyles, FILTER_TABLET_ICON_SIZE } from '@/constants/filterTablets';
