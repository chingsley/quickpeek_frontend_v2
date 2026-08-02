import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { BORDER_RADIUS_INPUT } from '@/constants/layout';
import { STATUS_ICON_SIZE } from '@/constants/statusIcons';
import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

type ScreenInfoBannerProps = {
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress?: () => void;
  iconColor?: string;
  labelStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
};

/** Icon + label row on INPUT_BG — matches question-detail location and wallet payout banners. */
export function ScreenInfoBanner({
  iconName,
  label,
  onPress,
  iconColor = colors.PRIMARY,
  labelStyle,
  style,
}: ScreenInfoBannerProps) {
  const content = (
    <>
      <Ionicons name={iconName} size={STATUS_ICON_SIZE} color={iconColor} />
      <Text style={[styles.label, labelStyle]}>{label}</Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        style={[styles.banner, style]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.banner, style]}>{content}</View>;
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: colors.INPUT_BG,
    borderRadius: BORDER_RADIUS_INPUT,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  label: {
    flex: 1,
    fontFamily: fonts.FONT_FAMILY_REGULAR,
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_DARK,
  },
});
