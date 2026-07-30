import { colors } from '@/constants/colors';
import { CIRCULAR_CLICK_HEIGHT, CIRCULAR_CLICK_WIDTH } from '@/constants/layout';
import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';

const MENU_ICON_SIZE = 22;

type OverflowMenuButtonProps = {
  color?: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

const OverflowMenuButton = ({
  color = colors.PRIMARY,
  onPress,
  style,
  accessibilityLabel = 'Open menu',
}: OverflowMenuButtonProps) => (
  <Pressable
    style={[styles.button, { borderColor: color }, style]}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
  >
    <Ionicons name="ellipsis-horizontal" size={MENU_ICON_SIZE} color={color} />
  </Pressable>
);

export default OverflowMenuButton;

const styles = StyleSheet.create({
  button: {
    height: CIRCULAR_CLICK_HEIGHT,
    width: CIRCULAR_CLICK_WIDTH,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: CIRCULAR_CLICK_WIDTH / 2,
  },
});
