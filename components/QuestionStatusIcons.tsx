import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import {
  STATUS_ICON_LABELS,
  StatusIcon,
  StatusIconKey,
} from '@/utils/questionStatus';
import {
  STATUS_ICON_SIZE,
  STATUS_ICON_VISUALS,
  StatusIconVisual,
} from '@/constants/statusIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export { STATUS_ICON_VISUALS } from '@/constants/statusIcons';
export type { StatusIconVisual } from '@/constants/statusIcons';

const isBadgedVisual = (visual: StatusIconVisual) => visual.bg !== colors.TRANSPARENT;

type StatusIconGlyphProps = {
  visual: StatusIconVisual;
  size?: number;
  color?: string;
  accessibilityLabel?: string;
};

/** Renders a status glyph from the shared Ionicons outline set. */
export const StatusIconGlyph = ({
  visual,
  size = STATUS_ICON_SIZE,
  color = visual.color,
  accessibilityLabel,
}: StatusIconGlyphProps) => (
  <View
    style={[styles.glyphBox, { width: size, height: size }]}
    accessibilityLabel={accessibilityLabel}
    accessibilityRole="image"
  >
    <Ionicons name={visual.name} size={size} color={color} />
  </View>
);

type QuestionStatusIconsProps = {
  icons: StatusIcon[];
  size?: number;
  withLabels?: boolean;
};

/**
 * Renders a horizontal group of question-status icons as plain glyphs.
 */
const QuestionStatusIcons = ({
  icons,
  size = STATUS_ICON_SIZE,
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
  size = STATUS_ICON_SIZE,
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
    fontSize: fonts.FONT_SIZE_SMALL,
  },
});
