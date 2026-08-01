/**
 * Filter tablet styling — single source of truth.
 *
 * Change pill appearance here (`filterTabletStyles`, `FILTER_TABLET_ICON_SIZE`) or bar
 * layout (`filterTabletBarStyles`) and it applies everywhere `FilterTablet` /
 * `FilterTabletGroup` is used (Home, Chats, …).
 *
 * Screens only own filter *definitions* (which pills exist) and filter *logic*
 * (what each pill matches). Do not add per-screen pill styles.
 */
import { STATUS_TAG_DEFS, StatusTagKey } from '@/utils/questionStatus';
import { ComponentProps } from 'react';
import { Platform, TextStyle, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from './colors';
import { fonts } from './fonts';
import { BORDER_RADIUS_PILL } from './layout';
import {
  STATUS_ICON_COLORS,
  STATUS_ICON_IONICON_NAMES,
  STATUS_ICON_NEUTRAL_COLOR,
  STATUS_ICON_SIZE,
} from './statusIcons';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

/** Vertical gap between search and filter tablets (Home + Chats). */
export const SEARCH_FILTER_HEADER_GAP = 20;

/** Vertical gap between filter tablets and content below — kept in sync with search gap. */
export const FILTER_LIST_GAP = SEARCH_FILTER_HEADER_GAP;

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
} satisfies Record<StatusTagKey, IoniconName>;

export type FilterTabletItem<Key extends string = string> = {
  key: Key;
  label: string;
  icon: IoniconName;
};

/** Home question-feed filter pills. */
export const HOME_FILTER_TABLET_ITEMS: FilterTabletItem<StatusTagKey>[] = STATUS_TAG_DEFS.map(
  (def) => ({
    key: def.key,
    label: def.label,
    icon: FILTER_TABLET_IONICON_NAMES[def.key],
  }),
);

/** Chats inbox filter pills. */
export const CHAT_FILTER_TABLET_ITEMS = [
  { key: 'unread', label: 'Unread', icon: 'mail-unread-outline' as const },
  { key: 'requests', label: 'Requests', icon: STATUS_ICON_IONICON_NAMES.request_pending },
  { key: 'approved', label: 'Approved', icon: STATUS_ICON_IONICON_NAMES.request_approved },
  { key: 'declined', label: 'Declined', icon: STATUS_ICON_IONICON_NAMES.request_denied },
] as const satisfies readonly FilterTabletItem[];

export type ChatFilterKey = (typeof CHAT_FILTER_TABLET_ITEMS)[number]['key'];

export type FilterTabletIconKey = StatusTagKey | ChatFilterKey;

export const filterTabletStyles = {
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS_PILL,
    borderWidth: 1,
    borderColor: colors.DARK_GRAY,
    backgroundColor: colors.INPUT_BG,
  } satisfies ViewStyle,

  containerActive: {
    backgroundColor: colors.PRIMARY,
    borderColor: colors.PRIMARY,
  } satisfies ViewStyle,

  text: {
    // fontFamily: fonts.FONT_FAMILY_REGULAR,
    // fontSize: fonts.FONT_SIZE_TABLET,  
    fontFamily: fonts.FONT_FAMILY_MEDIUM,
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.DARK_GRAY,
    ...tabletTextFix,
  } satisfies TextStyle,

  textActive: {
    color: colors.BG_WHITE,
    ...tabletTextFix,
  } satisfies TextStyle,
};

/** Horizontal filter row wrapper — shared by Home, Chats, and future screens. */
export const filterTabletBarStyles = {
  wrap: {
    marginBottom: FILTER_LIST_GAP,
  } satisfies ViewStyle,

  content: {
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 2,
  } satisfies ViewStyle,

  /**
   * Chats page: align the scroll row with the 20px page gutter
   * (`filterTabletBarStyles.content` already pads 16px horizontally).
   */
  chatsPlacement: {
    paddingHorizontal: 4,
    marginBottom: 45,
  } satisfies ViewStyle,

  /** Profile sheet: parent already has 20px horizontal padding — no extra inset. */
  profileSheetContent: {
    gap: 8,
    paddingHorizontal: 0,
    paddingVertical: 2,
  } satisfies ViewStyle,
};

const CHAT_FILTER_STATUS_ICON_KEYS: Partial<
  Record<ChatFilterKey, keyof typeof STATUS_ICON_COLORS>
> = {
  requests: 'request_pending',
  approved: 'request_approved',
  declined: 'request_denied',
};

/** Resolve icon color for any filter pill (Home tags or Chats filters). */
export const resolveFilterTabletIconColor = (
  key: FilterTabletIconKey,
  active: boolean,
): string => {
  const chatStatusKey = CHAT_FILTER_STATUS_ICON_KEYS[key as ChatFilterKey];
  if (chatStatusKey) {
    return STATUS_ICON_COLORS[chatStatusKey];
  }

  if (key === 'unread') {
    return colors.PRIMARY;
  }

  const statusKey = key as StatusTagKey;
  const base = STATUS_ICON_COLORS[statusKey];
  if (base !== STATUS_ICON_NEUTRAL_COLOR) {
    return base;
  }

  return colors.PRIMARY;
};

