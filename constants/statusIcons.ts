import { StatusIconKey } from '@/utils/questionStatus';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ComponentProps } from 'react';
import { colors } from './colors';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

/**
 * Ionicons outline glyph size for every status icon surface (cards, drawer,
 * filter tablets, question detail, chats filters).
 */
export const STATUS_ICON_SIZE = 22;

/** Gray-black glyph color shared by neutral status icons. */
export const STATUS_ICON_NEUTRAL_COLOR = colors.MEDIUM_GRAY;

/**
 * Ionicons-only outline glyphs — single source for cards, drawer, filters, and
 * detail views. Do not mix icon families or filled/sharp variants here.
 */
export const STATUS_ICON_IONICON_NAMES: Record<StatusIconKey, IoniconName> = {
  outgoing: 'arrow-up-outline',
  incoming: 'arrow-down-outline',
  request_pending: 'time-outline',
  request_approved: 'checkmark-circle-outline',
  request_denied: 'close-circle-outline',
  near_me: 'navigate-circle-outline',
};

export const STATUS_ICON_COLORS: Record<StatusIconKey, string> = {
  outgoing: STATUS_ICON_NEUTRAL_COLOR,
  incoming: STATUS_ICON_NEUTRAL_COLOR,
  request_pending: colors.AMBER,
  request_approved: colors.PRIMARY,
  request_denied: STATUS_ICON_NEUTRAL_COLOR,
  near_me: STATUS_ICON_NEUTRAL_COLOR,
};

export type StatusIconVisual = {
  name: IoniconName;
  color: string;
  /** Badge/pill background. Use `colors.TRANSPARENT` for icon-only glyphs. */
  bg: string;
};

export const STATUS_ICON_VISUALS: Record<StatusIconKey, StatusIconVisual> = {
  outgoing: {
    name: STATUS_ICON_IONICON_NAMES.outgoing,
    color: STATUS_ICON_COLORS.outgoing,
    bg: colors.TRANSPARENT,
  },
  incoming: {
    name: STATUS_ICON_IONICON_NAMES.incoming,
    color: STATUS_ICON_COLORS.incoming,
    bg: colors.TRANSPARENT,
  },
  request_pending: {
    name: STATUS_ICON_IONICON_NAMES.request_pending,
    color: STATUS_ICON_COLORS.request_pending,
    bg: colors.TRANSPARENT,
  },
  request_approved: {
    name: STATUS_ICON_IONICON_NAMES.request_approved,
    color: STATUS_ICON_COLORS.request_approved,
    bg: colors.TRANSPARENT,
  },
  request_denied: {
    name: STATUS_ICON_IONICON_NAMES.request_denied,
    color: STATUS_ICON_COLORS.request_denied,
    bg: colors.TRANSPARENT,
  },
  near_me: {
    name: STATUS_ICON_IONICON_NAMES.near_me,
    color: STATUS_ICON_COLORS.near_me,
    bg: colors.TRANSPARENT,
  },
};
