import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import {
  STATUS_ICON_LABELS,
  StatusIcon,
  StatusIconKey,
} from '@/utils/questionStatus';
import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type IconVisual = {
  name: React.ComponentProps<typeof Ionicons>['name'];
  /** Foreground glyph/text color — semantic to the status meaning. */
  color: string;
  /** Soft tint used behind the glyph so each status reads as a distinct badge. */
  bg: string;
};

/**
 * Visual language for each status icon. Exported so other surfaces (e.g. the
 * Home filter-tag bar) can reuse the exact same glyph + color pairing and stay
 * visually consistent with the cards/detail view.
 *
 * - `outgoing` / `incoming` share one neutral, non-highlighting look (a simple
 *   up/down pairing reads clearly as "sent" vs "received").
 * - Every other status gets its own distinct hue so it can be scanned at a glance.
 */
export const STATUS_ICON_VISUALS: Record<StatusIconKey, IconVisual> = {
  outgoing: { name: 'arrow-up', color: colors.DARK_GRAY, bg: colors.DARK_WHITE },
  incoming: { name: 'arrow-down', color: colors.DARK_GRAY, bg: colors.DARK_WHITE },
  request_pending: { name: 'hourglass-outline', color: colors.STAR_GOLD, bg: colors.LIGHT_GOLD },
  request_approved: { name: 'checkmark-circle', color: colors.SUCCESS_GREEN, bg: colors.LIGHT_GREEN },
  request_denied: { name: 'close-circle', color: colors.RED, bg: colors.LIGHT_RED },
  near_me: { name: 'navigate', color: colors.PRIMARY, bg: colors.LIGHT_BLUE },
};

type QuestionStatusIconsProps = {
  icons: StatusIcon[];
  size?: number;
  withLabels?: boolean;
};

/**
 * Renders a horizontal group of question-status icons as small tinted badges,
 * so each status reads as a distinct, deliberate chip rather than a bare glyph.
 * Honors the gestalt grouping principle: the whole cluster shares one row with
 * consistent spacing so the eye reads it as a single status summary.
 *
 * - `withLabels={false}` (default): icon-only circular badges. Used on
 *   cards/list rows where space is tight.
 * - `withLabels={true}`: icon + label pill chips. Used in the question detail
 *   view, per spec (e.g. a checkmark badge next to the text "Request approved").
 *
 * If `icons` is empty this renders nothing.
 */
const QuestionStatusIcons = ({
  icons,
  size = 14,
  withLabels = false,
}: QuestionStatusIconsProps) => {
  if (icons.length === 0) return null;

  const badgeSize = size + 10;

  if (withLabels) {
    return (
      <View style={styles.labeledWrap} accessibilityRole="text">
        {icons.map((icon) => {
          const visual = STATUS_ICON_VISUALS[icon.key];
          return (
            <View key={icon.key} style={[styles.pill, { backgroundColor: visual.bg }]}>
              <Ionicons name={visual.name} size={size} color={visual.color} />
              <Text style={[styles.pillLabel, { color: visual.color }]}>{icon.label}</Text>
            </View>
          );
        })}
      </View>
    );
  }

  return (
    <View style={styles.iconGroup} accessibilityRole="text">
      {icons.map((icon) => {
        const visual = STATUS_ICON_VISUALS[icon.key];
        return (
          <View
            key={icon.key}
            style={[
              styles.badge,
              { width: badgeSize, height: badgeSize, backgroundColor: visual.bg },
            ]}
          >
            <Ionicons
              name={visual.name}
              size={size}
              color={visual.color}
              accessibilityLabel={icon.label}
            />
          </View>
        );
      })}
    </View>
  );
};

export default QuestionStatusIcons;

/**
 * Standalone single-icon badge. Useful when one icon needs to be placed in a
 * different location than the main group (e.g. `near_me` next to the km value).
 */
export const SingleStatusIcon = ({
  iconKey,
  size = 13,
  badged = true,
}: {
  iconKey: StatusIconKey;
  size?: number;
  /** When true (default), renders inside a small tinted circular badge. */
  badged?: boolean;
}) => {
  const visual = STATUS_ICON_VISUALS[iconKey];
  if (!badged) {
    return (
      <Ionicons
        name={visual.name}
        size={size}
        color={visual.color}
        accessibilityLabel={STATUS_ICON_LABELS[iconKey]}
      />
    );
  }
  const badgeSize = size + 10;
  return (
    <View
      style={[
        styles.badge,
        { width: badgeSize, height: badgeSize, backgroundColor: visual.bg },
      ]}
    >
      <Ionicons
        name={visual.name}
        size={size}
        color={visual.color}
        accessibilityLabel={STATUS_ICON_LABELS[iconKey]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  iconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labeledWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  pillLabel: {
    fontFamily: 'roboto-medium',
    fontSize: fonts.FONT_SIZE_XS,
  },
});
