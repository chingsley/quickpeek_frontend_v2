import { Platform, TextStyle, ViewStyle } from 'react-native';
import { colors } from './colors';
import { fonts } from './fonts';

/** Android adds extra font padding that clips custom fonts inside small pills. */
const chipTextFix: TextStyle =
  Platform.select({
    android: {
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
    default: {},
  }) ?? {};

export const chipStyles = {
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 38,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.CARD_BORDER,
    backgroundColor: colors.BG_WHITE,
  } satisfies ViewStyle,

  pillContainerActive: {
    backgroundColor: colors.PRIMARY,
    borderColor: colors.PRIMARY,
  } satisfies ViewStyle,

  pillText: {
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.DARK_GRAY,
    ...chipTextFix,
  } satisfies TextStyle,

  pillTextActive: {
    color: colors.BG_WHITE,
  } satisfies TextStyle,

  presetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
    borderWidth: 1,
    borderColor: colors.CARD_BORDER,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  } satisfies ViewStyle,

  presetContainerActive: {
    backgroundColor: colors.PRIMARY,
    borderColor: colors.PRIMARY,
  } satisfies ViewStyle,

  presetText: {
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.DARK_GRAY,
    ...chipTextFix,
  } satisfies TextStyle,

  presetTextActive: {
    color: colors.BG_WHITE,
  } satisfies TextStyle,
};
