import UserAvatar from '@/components/UserAvatar';
import StarRating from '@/components/StarRating';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { TResponder } from '@/types/user.types';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  responder: TResponder;
  onPress: () => void;
};

const formatDistance = (distanceKm: number) => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m away`;
  }
  return `${distanceKm.toFixed(1)}km away`;
};

const ResponderRow = ({ responder, onPress }: Props) => {
  const { name, username, distance, averageRating, answersCount, isOnline, profileImageUrl } =
    responder;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <UserAvatar imageUrl={profileImageUrl} size={52} />
      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {name || username}
          </Text>
          {isOnline && <View style={styles.onlineDot} />}
        </View>
        <Text style={styles.username}>@{username}</Text>
        <View style={styles.statsRow}>
          <StarRating rating={averageRating} size={14} />
          <Text style={styles.statText}>
            {averageRating > 0 ? averageRating.toFixed(1) : 'New'}
          </Text>
          <Text style={styles.statDivider}>·</Text>
          <Text style={styles.statText}>{answersCount} answered</Text>
          <Text style={styles.statDivider}>·</Text>
          <Text style={styles.statText}>{formatDistance(distance)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default ResponderRow;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.CARD_BORDER,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontFamily: 'roboto-bold',
    fontSize: fonts.FONT_SIZE_MEDIUM,
    color: colors.TEXT_DARK,
    flexShrink: 1,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.PRIMARY,
  },
  username: {
    fontFamily: 'roboto-light',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.MEDIUM_GRAY,
    marginTop: 2,
    marginBottom: 6,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  statText: {
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.DARK_GRAY,
  },
  statDivider: {
    color: colors.LIGHT_GRAY,
    fontSize: fonts.FONT_SIZE_XS,
  },
});
