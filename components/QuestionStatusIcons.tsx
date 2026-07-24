import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import {
  STATUS_ICON_LABELS,
  StatusIcon,
  StatusIconKey,
} from '@/utils/questionStatus';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type IconFamily = 'Ionicons' | 'MaterialCommunityIcons';

type IconVisual = {
  family: IconFamily;
  name: string;
  /** Foreground glyph/text color. */
  color: string;
  /** Badge/pill background. Use `'transparent'` for icon-only (no tinted badge). */
  bg: string;
};

const isBadgedVisual = (visual: IconVisual) => visual.bg !== 'transparent';

/**
 * Visual language for each status icon. Exported so other surfaces (e.g. the
 * Home filter-tag bar) can reuse the exact same glyph + color pairing.
 *
 * Direction and request-status icons are black circle-outline glyphs (or
 * circle-contained icons where the source glyph is already circular).
 * `near_me` keeps a distinct tinted badge so location stands out in the UI.
 *
 * Where the requested glyph is not circular, the circle-outline equivalent from
 * @expo/vector-icons is used — see comments on each entry.
 */
export const STATUS_ICON_VISUALS: Record<StatusIconKey, IconVisual> = {
  // Octicons `arrow-up-right` → circle-outline diagonal equivalent
  outgoing: {
    family: 'MaterialCommunityIcons',
    name: 'arrow-top-right-thin-circle-outline',
    color: colors.BG_BLACK,
    bg: 'transparent',
  },
  // Octicons `arrow-down-left` → circle-outline diagonal equivalent
  incoming: {
    family: 'MaterialCommunityIcons',
    name: 'arrow-bottom-left-thin-circle-outline',
    color: colors.BG_BLACK,
    bg: 'transparent',
  },
  // FontAwesome6 `clock` → circle-outline clock equivalent
  request_pending: {
    family: 'Ionicons',
    name: 'time-outline',
    color: colors.BG_BLACK,
    bg: 'transparent',
  },
  request_approved: {
    family: 'Ionicons',
    name: 'checkmark-circle-sharp',
    color: colors.BG_BLACK,
    bg: 'transparent',
  },
  request_denied: {
    family: 'Ionicons',
    name: 'close-circle-outline',
    color: colors.BG_BLACK,
    bg: 'transparent',
  },
  near_me: {
    family: 'Ionicons',
    name: 'navigate',
    color: colors.PRIMARY,
    bg: colors.LIGHT_BLUE,
  },
};

type StatusIconGlyphProps = {
  visual: IconVisual;
  size: number;
  color?: string;
  accessibilityLabel?: string;
};

/** Renders a status glyph from the configured icon family. */
export const StatusIconGlyph = ({
  visual,
  size,
  color = visual.color,
  accessibilityLabel,
}: StatusIconGlyphProps) => {
  let glyph: React.ReactNode;

  switch (visual.family) {
    case 'MaterialCommunityIcons':
      glyph = (
        <MaterialCommunityIcons
          name={visual.name as React.ComponentProps<typeof MaterialCommunityIcons>['name']}
          size={size}
          color={color}
        />
      );
      break;
    case 'Ionicons':
    default:
      glyph = (
        <Ionicons
          name={visual.name as React.ComponentProps<typeof Ionicons>['name']}
          size={size}
          color={color}
        />
      );
      break;
  }

  return (
    <View
      style={[styles.glyphBox, { width: size, height: size }]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="image"
    >
      {glyph}
    </View>
  );
};

type QuestionStatusIconsProps = {
  icons: StatusIcon[];
  size?: number;
  withLabels?: boolean;
};

/**
 * Renders a horizontal group of question-status icons. Icons with a transparent
 * background render as plain glyphs; others (e.g. `near_me`) use a tinted badge.
 */
const QuestionStatusIcons = ({
  icons,
  size = 14,
  withLabels = false,
}: QuestionStatusIconsProps) => {
  if (icons.length === 0) return null;

  if (withLabels) {
    return (
      <View style={styles.labeledWrap} accessibilityRole="text">
        {icons.map((icon) => {
          const visual = STATUS_ICON_VISUALS[icon.key];
          const badged = isBadgedVisual(visual);
          return (
            <View
              key={icon.key}
              style={badged ? [styles.pill, { backgroundColor: visual.bg }] : styles.labeledItem}
            >
              <StatusIconGlyph visual={visual} size={size} />
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
        const badged = isBadgedVisual(visual);
        if (!badged) {
          return (
            <StatusIconGlyph
              key={icon.key}
              visual={visual}
              size={size}
              accessibilityLabel={icon.label}
            />
          );
        }
        const badgeSize = size + 10;
        return (
          <View
            key={icon.key}
            style={[
              styles.badge,
              { width: badgeSize, height: badgeSize, backgroundColor: visual.bg },
            ]}
          >
            <StatusIconGlyph
              visual={visual}
              size={size}
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
 * Standalone single-icon badge. Useful when one icon needs to be placed outside
 * the main status group.
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
  if (!badged || !isBadgedVisual(visual)) {
    return (
      <StatusIconGlyph
        visual={visual}
        size={size}
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
      <StatusIconGlyph
        visual={visual}
        size={size}
        accessibilityLabel={STATUS_ICON_LABELS[iconKey]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  glyphBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  labeledItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
