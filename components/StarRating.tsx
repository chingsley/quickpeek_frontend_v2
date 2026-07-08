import { colors } from '@/constants/colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface StarRatingProps {
  rating: number;
  size?: number;
}

const StarRating = ({ rating, size = 18 }: StarRatingProps) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  return (
    <View style={styles.starRow}>
      {Array.from({ length: fullStars }).map((_, i) => (
        <Ionicons key={`full-${i}`} name="star" size={size} color={colors.STAR_GOLD} />
      ))}
      {halfStar && <Ionicons name="star-half" size={size} color={colors.STAR_GOLD} />}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Ionicons key={`empty-${i}`} name="star-outline" size={size} color={colors.LIGHT_GRAY} />
      ))}
    </View>
  );
};

export default StarRating;

const styles = StyleSheet.create({
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
});
