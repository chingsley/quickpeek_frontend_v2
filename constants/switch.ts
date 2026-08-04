import { colors } from '@/constants/colors';
import { Switch } from 'react-native';
import { ComponentProps } from 'react';

/** Off-track / iOS background for every Switch in the app. */
export const SWITCH_OFF_TRACK_COLOR = colors.BORDER_GRAY;

/** On-track color for every Switch in the app. */
export const SWITCH_ON_TRACK_COLOR = colors.PRIMARY;

export const SWITCH_THUMB_COLOR = colors.BG_WHITE;

export const SWITCH_TRACK_COLOR = {
  false: SWITCH_OFF_TRACK_COLOR,
  true: SWITCH_ON_TRACK_COLOR,
} as const;

/** Shared Switch chrome — spread onto every `<Switch>` (Ask, Settings, signup, …). */
export const SWITCH_APPEARANCE_PROPS = {
  trackColor: SWITCH_TRACK_COLOR,
  ios_backgroundColor: SWITCH_OFF_TRACK_COLOR,
  thumbColor: SWITCH_THUMB_COLOR,
} satisfies Pick<
  ComponentProps<typeof Switch>,
  'trackColor' | 'ios_backgroundColor' | 'thumbColor'
>;
