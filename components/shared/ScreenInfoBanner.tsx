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

type ScreenInfoBannerRow = {
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  iconColor?: string;
  labelStyle?: StyleProp<TextStyle>;
} & (
  | { label: string; labelContent?: never }
  | { labelContent: React.ReactNode; label?: never }
);

type ScreenInfoBannerProps = {
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  iconColor?: string;
  labelStyle?: StyleProp<TextStyle>;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  /** Optional second row inside the same card, separated by a divider. */
  secondaryRow?: ScreenInfoBannerRow;
};

const BannerRow = ({
  iconName,
  label,
  labelContent,
  iconColor = colors.PRIMARY,
  labelStyle,
}: ScreenInfoBannerRow) => (
  <View style={styles.row}>
    <Ionicons name={iconName} size={STATUS_ICON_SIZE} color={iconColor} />
    {labelContent ?? <Text style={[styles.label, labelStyle]}>{label}</Text>}
  </View>
);

/** Icon + label row on INPUT_BG — matches question-detail location and wallet payout banners. */
export function ScreenInfoBanner({
  iconName,
  label,
  onPress,
  iconColor = colors.PRIMARY,
  labelStyle,
  style,
  secondaryRow,
}: ScreenInfoBannerProps) {
  const content = (
    <>
      <BannerRow
        iconName={iconName}
        label={label}
        iconColor={iconColor}
        labelStyle={labelStyle}
      />
      {secondaryRow ? (
        <>
          <View style={styles.divider} />
          <BannerRow {...secondaryRow} />
        </>
      ) : null}
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
    backgroundColor: colors.INPUT_BG,
    borderRadius: BORDER_RADIUS_INPUT,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.PRIMARY,
    marginHorizontal: 12,
  },
  label: {
    flex: 1,
    fontFamily: fonts.FONT_FAMILY_REGULAR,
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_DARK,
  },
});
