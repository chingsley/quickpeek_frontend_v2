import CustomButton from '@/components/shared/CustomButton';
import StarRating from '@/components/StarRating';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { TResponder } from '@/types/user.types';
import Ionicons from '@expo/vector-icons/Ionicons';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import React, { forwardRef, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ResponderProfileSheetProps {
  responder: TResponder | null;
  onSelect: () => void;
}

const ResponderProfileSheet = forwardRef<BottomSheet, ResponderProfileSheetProps>(
  ({ responder, onSelect }, ref) => {
    const snapPoints = useMemo(() => ['45%'], []);

    if (!responder) return null;

    const distanceLabel =
      responder.distance < 1
        ? `${Math.round(responder.distance * 1000)}m away`
        : `${responder.distance.toFixed(1)}km away`;

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
      >
        <BottomSheetView style={styles.content}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconCircle}>
              <Ionicons name="person" size={20} color={colors.PRIMARY} />
            </View>
            <Text style={styles.sectionLabel}>Responder Profile</Text>
          </View>

          <Text style={styles.name}>{responder.name || responder.username}</Text>
          <Text style={styles.username}>@{responder.username}</Text>

          <View style={styles.ratingRow}>
            <StarRating rating={responder.averageRating} size={22} />
            <Text style={styles.ratingText}>
              {responder.averageRating > 0
                ? `${responder.averageRating.toFixed(1)} average`
                : 'No ratings yet'}
            </Text>
          </View>

          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{responder.answersCount}</Text>
              <Text style={styles.statLabel}>Questions answered</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{distanceLabel}</Text>
              <Text style={styles.statLabel}>From your location</Text>
            </View>
          </View>

          {responder.isOnline && (
            <View style={styles.onlineChip}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Active now</Text>
            </View>
          )}

          <CustomButton text="Select this responder" onPress={onSelect} />
        </BottomSheetView>
      </BottomSheet>
    );
  },
);

ResponderProfileSheet.displayName = 'ResponderProfileSheet';

export default ResponderProfileSheet;

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: colors.BG_WHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleIndicator: {
    backgroundColor: colors.LIGHT_GRAY,
    width: 40,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.LIGHT_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionLabel: {
    fontFamily: 'roboto-medium',
    fontSize: fonts.FONT_SIZE_MEDIUM,
    color: colors.TEXT_DARK,
  },
  name: {
    fontFamily: 'roboto-bold',
    fontSize: fonts.FONT_SIZE_XL,
    color: colors.TEXT_DARK,
    marginBottom: 4,
  },
  username: {
    fontFamily: 'roboto-light',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.MEDIUM_GRAY,
    marginBottom: 16,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  ratingText: {
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.DARK_GRAY,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.CARD_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.CARD_BORDER,
    paddingVertical: 16,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'roboto-bold',
    fontSize: fonts.FONT_SIZE_MEDIUM,
    color: colors.TEXT_DARK,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'roboto-light',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.MEDIUM_GRAY,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.CARD_BORDER,
  },
  onlineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.PRIMARY,
  },
  onlineText: {
    fontFamily: 'roboto-medium',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.PRIMARY,
  },
});
