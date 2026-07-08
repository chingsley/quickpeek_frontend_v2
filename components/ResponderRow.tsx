import StarRating from '@/components/StarRating';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { TResponder } from '@/types/user.types';
import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ResponderRowProps {
  responder: TResponder;
  onPress: () => void;
  onSelect: () => void;
}

const ResponderRow = ({ responder, onPress, onSelect }: ResponderRowProps) => {
  const distanceLabel =
    responder.distance < 1
      ? `${Math.round(responder.distance * 1000)}m away`
      : `${responder.distance.toFixed(1)}km away`;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.headerRow}>
        <View style={styles.avatarCircle}>
          <Ionicons name="person" size={20} color={colors.PRIMARY} />
        </View>
        <View style={styles.infoBlock}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{responder.name || responder.username}</Text>
            {responder.isOnline && <View style={styles.onlineDot} />}
          </View>
          <Text style={styles.username}>@{responder.username}</Text>
        </View>
        <TouchableOpacity style={styles.selectBtn} onPress={onSelect}>
          <Text style={styles.selectBtnText}>Select</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.statsRow}>
        <StarRating rating={responder.averageRating} size={14} />
        <Text style={styles.statText}>
          {responder.averageRating > 0 ? responder.averageRating.toFixed(1) : 'New'}
        </Text>
        <Text style={styles.statDivider}>·</Text>
        <Text style={styles.statText}>{responder.answersCount} answered</Text>
        <Text style={styles.statDivider}>·</Text>
        <Text style={styles.statText}>{distanceLabel}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default ResponderRow;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.BG_WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.CARD_BORDER,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.LIGHT_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoBlock: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontFamily: 'roboto-bold',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_DARK,
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
  },
  selectBtn: {
    backgroundColor: colors.PRIMARY,
    borderRadius: 100,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  selectBtnText: {
    fontFamily: 'roboto-bold',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.BG_WHITE,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  statText: {
    fontFamily: 'roboto-light',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.DARK_GRAY,
  },
  statDivider: {
    color: colors.MEDIUM_GRAY,
    fontSize: fonts.FONT_SIZE_XS,
  },
});
