import { Platform, TextStyle, ViewStyle } from 'react-native';
import { colors } from './colors';
import { fonts } from './fonts';
import { BORDER_RADIUS_PILL } from './layout';

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
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS_PILL,
    borderWidth: 1,
    borderColor: colors.CARD_BORDER,
    backgroundColor: colors.BG_WHITE,
  } satisfies ViewStyle,

  pillContainerActive: {
    backgroundColor: colors.SECONDARY,
    borderColor: colors.PRIMARY,
  } satisfies ViewStyle,

  pillText: {
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.TEXT_DARK,
    ...chipTextFix,
  } satisfies TextStyle,

  pillTextActive: {
    color: colors.PRIMARY,
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
