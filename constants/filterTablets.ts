import { Platform, TextStyle, ViewStyle } from 'react-native';
import { colors } from './colors';
import { fonts } from './fonts';
import { BORDER_RADIUS_PILL } from './layout';
import { STATUS_ICON_QUESTION_ITEM_SIZE } from './statusIcons';

/** Android adds extra font padding that clips custom fonts inside small pills. */
const tabletTextFix: TextStyle =
  Platform.select({
    android: {
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
    default: {},
  }) ?? {};

/**
 * Home feed filter tablet styles.
 * Tune inactive/active appearance, typography, and icon sizing here.
 */
export const FILTER_TABLET_ICON_SIZE = STATUS_ICON_QUESTION_ITEM_SIZE;

export const filterTabletColors = {
  icon: colors.TEXT_DARK,
  iconActive: colors.BG_BLACK,
} as const;

export const filterTabletStyles = {
  container: {
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

  containerActive: {
    backgroundColor: colors.SECONDARY,
  } satisfies ViewStyle,

  text: {
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_DARK,
    ...tabletTextFix,
  } satisfies TextStyle,

  /** Matches card body text size (`cardDetail` on Home). */
  textActive: {
    // fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.BG_BLACK,
    ...tabletTextFix,
  } satisfies TextStyle,
};
