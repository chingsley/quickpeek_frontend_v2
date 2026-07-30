import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '@/constants/colors';
import { CIRCULAR_CLICK_HEIGHT, CIRCULAR_CLICK_WIDTH } from '@/constants/layout';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';

const BACK_ICON_SIZE = 24;

type BackButtonProps = {
  color?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

const BackButton = ({ color = colors.PRIMARY, onPress, style }: BackButtonProps) => {
  const router = useRouter();

  return (
    <Pressable
      style={[styles.button, { borderColor: color }, style]}
      onPress={onPress ?? (() => router.back())}
      accessibilityRole="button"
      accessibilityLabel="Go back"
    >
      <Ionicons name="chevron-back" size={BACK_ICON_SIZE} color={color} />
    </Pressable>
  );
};

export default BackButton;

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
