import {
  FILTER_TABLET_ICON_SIZE,
  FilterTabletItem,
  filterTabletBarStyles,
  filterTabletStyles,
  resolveFilterTabletIconColor,
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
 * Single filter pill (icon + label).
 *
 * All visual styling lives in `constants/filterTablets.ts` — do not pass custom
 * styles here; update `filterTabletStyles` in `constants/filterTablets.ts` instead.
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
    {/* <Ionicons name={icon} size={FILTER_TABLET_ICON_SIZE} color={iconColor} /> */}
    <Text style={[filterTabletStyles.text, active && filterTabletStyles.textActive]}>{label}</Text>
  </Pressable>
);

type FilterTabletBarProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Horizontal scroll row for filter pills. Layout tokens: `filterTabletBarStyles`. */
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

export type FilterTabletGroupProps<Key extends string> = {
  items: readonly FilterTabletItem<Key>[];
  activeKeys: ReadonlySet<Key>;
  onToggle: (key: Key) => void;
  getIconColor?: (key: Key, active: boolean) => string;
  barStyle?: StyleProp<ViewStyle>;
};

/**
 * Renders a full filter bar from item definitions.
 * Styling is centralized in `constants/filterTablets.ts`.
 */
export function FilterTabletGroup<Key extends string>({
  items,
  activeKeys,
  onToggle,
  getIconColor = resolveFilterTabletIconColor as (key: Key, active: boolean) => string,
  barStyle,
}: FilterTabletGroupProps<Key>) {
  return (
    <FilterTabletBar style={barStyle}>
      {items.map((item) => {
        const active = activeKeys.has(item.key);
        return (
          <FilterTablet
            key={item.key}
            label={item.label}
            icon={item.icon}
            iconColor={getIconColor(item.key, active)}
            active={active}
            onPress={() => onToggle(item.key)}
          />
        );
      })}
    </FilterTabletBar>
  );
}
