import UserAvatar from '@/components/UserAvatar';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

/** Star glyph size inside the rating card. */
const RATING_CARD_STAR_SIZE = 30;

type Props = {
  name: string;
  profileImageUrl: string | null;
  /** Called with the tapped star count (1–5). */
  onRate: (stars: number) => void;
};

/**
 * In-timeline prompt shown when the counterparty becomes reviewable: reads
 * as a native conversation event rather than chrome, and a single star tap
 * both picks the rating and opens the review sheet (preselected).
 */
const RatingCard = ({ name, profileImageUrl, onRate }: Props) => (
  <View style={styles.card}>
    <UserAvatar imageUrl={profileImageUrl} size={44} />
    <Text style={styles.title}>How was your experience with {name}?</Text>
    <Text style={styles.subtitle}>Tap a star to rate</Text>
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((value) => (
        <Pressable
          key={value}
          onPress={() => onRate(value)}
          hitSlop={8}
          accessibilityLabel={`Rate ${value} star${value === 1 ? '' : 's'}`}
          accessibilityRole="button"
        >
          <Ionicons name="star-outline" size={RATING_CARD_STAR_SIZE} color={colors.STAR_GOLD} />
        </Pressable>
      ))}
    </View>
  </View>
);

export default RatingCard;

const styles = StyleSheet.create({
  card: {
    alignSelf: 'center',
    alignItems: 'center',
    width: '90%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.CARD_BG,
    paddingHorizontal: 14,
    paddingVertical: 16,
    marginVertical: 8,
  },
  title: {
    fontFamily: 'roboto-medium',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_DARK,
    textAlign: 'center',
    marginTop: 10,
  },
  subtitle: {
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.MEDIUM_GRAY,
    marginTop: 4,
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 12,
  },
});
