import { StatusTagKey } from '@/utils/questionStatus';
import { Platform, TextStyle, ViewStyle } from 'react-native';
import { colors } from './colors';
import { fonts } from './fonts';
import { BORDER_RADIUS_PILL } from './layout';
import {
  STATUS_ICON_COLORS,
  STATUS_ICON_IONICON_NAMES,
  STATUS_ICON_NEUTRAL_COLOR,
  STATUS_ICON_SIZE,
} from './statusIcons';

/** Android adds extra font padding that clips custom fonts inside small pills. */
const tabletTextFix: TextStyle =
  Platform.select({
    android: {
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
    default: {},
  }) ?? {};

/** Filter-tablet icon size — same as every other status icon surface. */
export const FILTER_TABLET_ICON_SIZE = STATUS_ICON_SIZE;

/** Status-tag filter glyphs (subset of {@link STATUS_ICON_IONICON_NAMES}). */
export const FILTER_TABLET_IONICON_NAMES = {
  outgoing: STATUS_ICON_IONICON_NAMES.outgoing,
  request_pending: STATUS_ICON_IONICON_NAMES.request_pending,
  request_approved: STATUS_ICON_IONICON_NAMES.request_approved,
  request_denied: STATUS_ICON_IONICON_NAMES.request_denied,
  near_me: STATUS_ICON_IONICON_NAMES.near_me,
} satisfies Record<StatusTagKey, (typeof STATUS_ICON_IONICON_NAMES)[StatusTagKey]>;

export const getFilterTabletIconColor = (key: StatusTagKey, active: boolean): string => {
  const base = STATUS_ICON_COLORS[key];
  if (base !== STATUS_ICON_NEUTRAL_COLOR) return base;
  return active ? filterTabletColors.iconActive : filterTabletColors.icon;
};

/** Chats filter chips that reuse status glyphs (Requests → pending, Approved). */
export type ChatFilterIconKey = 'unread' | 'requests' | 'approved';

export const getChatFilterIconColor = (key: ChatFilterIconKey): string => {
  if (key === 'requests') return STATUS_ICON_COLORS.request_pending;
  if (key === 'approved') return STATUS_ICON_COLORS.request_approved;
  return filterTabletColors.icon;
};

export const filterTabletColors = {
  icon: colors.PRIMARY,
  iconActive: colors.PRIMARY,
} as const;

export const filterTabletStyles = {
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: BORDER_RADIUS_PILL,
    borderWidth: 1,
    borderColor: colors.CARD_BORDER,
    backgroundColor: colors.BG_WHITE,
  } satisfies ViewStyle,

  containerActive: {
    backgroundColor: colors.SECONDARY,
  } satisfies ViewStyle,

  text: {
    fontFamily: fonts.FONT_FAMILY_MEDIUM,
    fontSize: fonts.FONT_SIZE_TABLET,
    color: colors.PRIMARY,
    ...tabletTextFix,
  } satisfies TextStyle,

  textActive: {
    fontFamily: fonts.FONT_FAMILY_MEDIUM,
    fontSize: fonts.FONT_SIZE_TABLET,
    color: colors.PRIMARY,
    ...tabletTextFix,
  } satisfies TextStyle,
};

/** Horizontal filter row wrapper — canonical layout from Chats screen. */
export const filterTabletBarStyles = {
  wrap: {
    marginBottom: 10,
  } satisfies ViewStyle,

  content: {
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 2,
  } satisfies ViewStyle,
};
